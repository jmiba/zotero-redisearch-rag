#!/usr/bin/env python3
import argparse
import os
import re
from collections import Counter, defaultdict
from typing import Iterable, Tuple, Dict, Set

import redis

try:
    from wordfreq import zipf_frequency as _zipf
except Exception:
    _zipf = None

TOKEN_RE = re.compile(r"[A-Za-zÄÖÜäöüß]{2,}")

VOWELS = set("aeiouäöü")


def iter_texts(client: redis.Redis, prefix: str, doc_id: str | None) -> Iterable[Tuple[str, str]]:
    pattern = f"{prefix}*" if not doc_id else f"{prefix}{doc_id}:*"
    for key in client.scan_iter(pattern):
        try:
            k = key.decode("utf-8") if isinstance(key, (bytes, bytearray)) else str(key)
        except Exception:
            continue
        # Extract doc_id from key: prefix + DOCID + ':' + chunk-id
        if not k.startswith(prefix):
            continue
        rest = k[len(prefix):]
        di = rest.split(":", 1)[0] if ":" in rest else rest
        # Try hash 'text' field first
        text = client.hget(key, "text")
        if not text:
            # Fallback: try as string value
            text = client.get(key)
        if not text:
            continue
        try:
            t = text.decode("utf-8") if isinstance(text, (bytes, bytearray)) else str(text)
        except Exception:
            continue
        yield t, di


def looks_garbled(token: str, require_vowel: bool, max_repeat: int, max_consonant_run: int) -> bool:
    lower = token.lower()
    # Reject if contains 3+ repeated chars like "aaaa" or "lllll"
    if max_repeat > 1 and re.search(rf"(.)\1{{{max_repeat-1},}}", lower):
        return True
    # Require at least one vowel (heuristic for German)
    if require_vowel and not any(ch in VOWELS for ch in lower):
        return True
    # Consonant run heuristic (ignore ß as consonant counts)
    consonant_run = 0
    for ch in lower:
        if ch.isalpha() and ch not in VOWELS and ch != "ß":
            consonant_run += 1
            if consonant_run > max_consonant_run:
                return True
        else:
            consonant_run = 0
    return False


def main() -> int:
    parser = argparse.ArgumentParser(description="Build a wordlist from Redis chunk texts with noise filters.")
    parser.add_argument("--redis-url", required=True)
    parser.add_argument("--prefix", required=True)
    parser.add_argument("--out", required=True, help="Output wordlist file path")
    parser.add_argument("--doc-id", help="Optional doc_id to restrict corpus")
    parser.add_argument("--min-len", type=int, default=4)
    parser.add_argument("--min-count", type=int, default=3)
    parser.add_argument("--lang", default="de", help="Language for wordfreq scoring (default: de)")
    parser.add_argument(
        "--zipf-langs",
        nargs='+',
        help="Optional list of languages for wordfreq scoring; if provided, the maximum zipf score across these languages is used",
    )
    parser.add_argument("--zipf-min", type=float, default=0.0, help="Minimum zipf frequency if wordfreq available")
    parser.add_argument("--min-docs", type=int, default=2, help="Minimum number of distinct documents a word must appear in")
    parser.add_argument("--max-repeat", type=int, default=3, help="Reject tokens with >= this many repeated chars (e.g., 'aaaa')")
    parser.add_argument("--max-consonant-run", type=int, default=4, help="Reject tokens with long consonant runs")
    parser.add_argument("--no-require-vowel", action="store_true", help="Do not require tokens to contain a vowel")
    parser.add_argument("--lexicon", help="Optional lexicon file; keep words in lexicon regardless of thresholds")
    parser.add_argument("--hunspell-aff", nargs='+', help="Paths to Hunspell .aff files for filtering (space-separated)")
    parser.add_argument("--hunspell-dic", nargs='+', help="Paths to Hunspell .dic files for filtering (space-separated)")
    args = parser.parse_args()
    # Optional: load Hunspell or spylls for filtering
    hunspell_filters = []
    if args.hunspell_aff and args.hunspell_dic:
        if len(args.hunspell_aff) != len(args.hunspell_dic):
            print("Error: --hunspell-aff and --hunspell-dic must have the same number of entries.")
            return 1
        for aff_path, dic_path in zip(args.hunspell_aff, args.hunspell_dic):
            try:
                print(f"Trying dictionary pair: {os.path.basename(aff_path)} | {os.path.basename(dic_path)}")
                loaded = False
                last_error = None
                # First try native hunspell binding
                try:
                    import hunspell  # type: ignore

                    class HunspellWrapper:
                        def __init__(self, hs):
                            self.hs = hs
                        def spell(self, word: str) -> bool:
                            variants = [word, word.lower(), word.capitalize(), word.title(), word.upper()]
                            seen = set()
                            for v in variants:
                                if v in seen:
                                    continue
                                seen.add(v)
                                try:
                                    if self.hs.spell(v):
                                        return True
                                except Exception:
                                    continue
                            return False

                    hs_obj = hunspell.HunSpell(dic_path, aff_path)
                    hunspell_filters.append(HunspellWrapper(hs_obj))
                    print(f"Loaded via hunspell: {os.path.basename(dic_path)}")
                    loaded = True
                except Exception as _exc_hs:
                    last_error = _exc_hs

                # Then try spylls wrapper
                if not loaded:
                    try:
                        from spylls.hunspell import Dictionary

                        class SpyllsWrapper:
                            def __init__(self, d):
                                self.d = d
                            def spell(self, word: str) -> bool:
                                variants = [word, word.lower(), word.capitalize(), word.title(), word.upper()]
                                seen = set()
                                for v in variants:
                                    if v in seen:
                                        continue
                                    seen.add(v)
                                    try:
                                        if hasattr(self.d, "lookup") and self.d.lookup(v):
                                            return True
                                    except Exception:
                                        pass
                                    try:
                                        sugg = self.d.suggest(v)
                                        if isinstance(sugg, (list, tuple)) and v in sugg:
                                            return True
                                    except Exception:
                                        pass
                                return False

                        d = None
                        errors: list[str] = []
                        # Variant A: (aff, dic)
                        try:
                            d = Dictionary.from_files(aff_path, dic_path)
                        except Exception as eA:
                            errors.append(f"A(aff,dic): {eA}")
                        # Variant B: directory containing both
                        if d is None:
                            try:
                                d = Dictionary.from_files(os.path.dirname(dic_path))
                            except Exception as eB:
                                errors.append(f"B(dir): {eB}")
                        # Variant C: stem without extension
                        if d is None:
                            try:
                                stem = os.path.splitext(dic_path)[0]
                                d = Dictionary.from_files(stem)
                            except Exception as eC:
                                errors.append(f"C(stem): {eC}")
                        # Variant D: single-path dic
                        if d is None:
                            try:
                                d = Dictionary.from_files(dic_path)
                            except Exception as eD:
                                errors.append(f"D(dic): {eD}")
                        # Variant E: single-path aff
                        if d is None:
                            try:
                                d = Dictionary.from_files(aff_path)
                            except Exception as eE:
                                errors.append(f"E(aff): {eE}")
                        if d is None:
                            raise RuntimeError("spylls load failed: " + "; ".join(errors))
                        hunspell_filters.append(SpyllsWrapper(d))
                        print(f"Loaded via spylls: {os.path.basename(dic_path)}")
                        loaded = True
                    except Exception as _exc_sp:
                        last_error = _exc_sp
                        loaded = False

                # Finally, naive .dic parser fallback (exact matches only)
                if not loaded:
                    try:
                        words_set = set()
                        with open(dic_path, "r", encoding="utf-8", errors="ignore") as fh:
                            first = True
                            for raw in fh:
                                # Strip BOM and whitespace
                                line = raw.lstrip("\ufeff").strip()
                                if not line:
                                    continue
                                if first and line.isdigit():
                                    # Some .dic files start with word count
                                    first = False
                                    continue
                                first = False
                                # Skip lines that clearly aren't word entries
                                if line.startswith(('#', ';', '//')):
                                    continue
                                # Extract base token before morph flags (separated by '/')
                                try:
                                    base_part = line.split('/', 1)[0].strip()
                                except Exception:
                                    continue
                                if not base_part:
                                    continue
                                # Some dictionaries may still have stray control chars
                                base_part = re.sub(r"\s+", " ", base_part)
                                base_part = base_part.strip()
                                if not base_part:
                                    continue
                                words_set.add(base_part.lower())

                        class NaiveDicWrapper:
                            def __init__(self, words):
                                self.words = words
                            def spell(self, word: str) -> bool:
                                variants = [word, word.lower(), word.capitalize(), word.title(), word.upper()]
                                for v in variants:
                                    if v.lower() in self.words:
                                        return True
                                return False

                        hunspell_filters.append(NaiveDicWrapper(words_set))
                        print(f"Loaded naive dictionary from {os.path.basename(dic_path)} with {len(words_set)} entries")
                        loaded = True
                    except Exception as _exc_nv:
                        last_error = _exc_nv
                        loaded = False
                if not loaded:
                    print(f"Failed to load dictionary pair: {aff_path} | {dic_path}. Last error: {last_error}")
            except Exception as exc:
                print(f"Warning: Could not load Hunspell or spylls for filtering: {exc}")
    if hunspell_filters:
        print(f"Loaded {len(hunspell_filters)} Hunspell/spylls dictionaries for filtering.")

    client = redis.Redis.from_url(args.redis_url, decode_responses=False)

    counter: Counter[str] = Counter()
    doc_coverage: Dict[str, Set[str]] = defaultdict(set)

    for text, di in iter_texts(client, args.prefix, args.doc_id):
        for tok in TOKEN_RE.findall(text):
            lower = tok.lower()
            if len(lower) < args.min_len:
                continue
            if looks_garbled(lower, not args.no_require_vowel, args.max_repeat, args.max_consonant_run):
                continue
            counter[lower] += 1
            doc_coverage[lower].add(di)

    lexicon: Set[str] = set()
    if args.lexicon:
        try:
            with open(args.lexicon, "r", encoding="utf-8") as fh:
                lexicon = {line.strip().lower() for line in fh if line.strip() and not line.startswith("#")}
        except Exception:
            lexicon = set()

    words = []
    for word, cnt in counter.items():
        if cnt < args.min_count:
            continue
        if len(doc_coverage.get(word, set())) < args.min_docs and word not in lexicon:
            continue
        if _zipf and args.zipf_min > 0.0:
            try:
                langs = args.zipf_langs if args.zipf_langs else [args.lang]
                best = float("-inf")
                for lg in langs:
                    try:
                        val = _zipf(word, lg)
                    except Exception:
                        val = float("-inf")
                    if val > best:
                        best = val
                if word not in lexicon and best < args.zipf_min:
                    continue
            except Exception:
                pass
        # Hunspell filtering: only add if NOT recognized by ANY Hunspell dictionary
        if hunspell_filters:
            try:
                if any(f.spell(word) for f in hunspell_filters):
                    continue
            except Exception:
                pass
        words.append(word)

    words.sort()

    with open(args.out, "w", encoding="utf-8") as fh:
        for w in words:
            fh.write(w + "\n")

    print(f"Wrote {len(words)} words to {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
