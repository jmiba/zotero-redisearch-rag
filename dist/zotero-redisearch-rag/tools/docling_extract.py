#!/usr/bin/env python3
import argparse
import json
import logging
import os
import re
import statistics
import shutil
import sys
from dataclasses import dataclass
from typing import Any, Callable, Dict, Iterable, List, Optional, Sequence, Tuple


LOGGER = logging.getLogger("docling_extract")


def eprint(message: str) -> None:
    sys.stderr.write(message + "\n")


@dataclass
class DoclingProcessingConfig:
    ocr_mode: str = "auto"
    prefer_ocr_engine: str = "paddle"
    fallback_ocr_engine: str = "tesseract"
    language_hint: Optional[str] = None
    default_lang_german: str = "deu+eng"
    default_lang_english: str = "eng"
    min_text_chars_per_page: int = 40
    min_text_pages_ratio: float = 0.3
    quality_alpha_ratio_threshold: float = 0.6
    quality_suspicious_token_threshold: float = 0.25
    quality_min_avg_chars_per_page: int = 80
    quality_confidence_threshold: float = 0.5
    quality_use_wordfreq: bool = True
    quality_wordfreq_min_zipf: float = 3.0
    column_detect_enable: bool = True
    column_detect_dpi: int = 150
    column_detect_max_pages: int = 3
    column_detect_crop_top_ratio: float = 0.08
    column_detect_crop_bottom_ratio: float = 0.08
    column_detect_threshold_std_mult: float = 1.0
    column_detect_threshold_min: int = 120
    column_detect_threshold_max: int = 210
    column_detect_text_percentile: float = 0.7
    column_detect_min_text_density: float = 0.02
    column_detect_gap_threshold_ratio: float = 0.2
    column_detect_min_gap_density: float = 0.01
    column_detect_min_gap_ratio: float = 0.03
    column_detect_min_pages_ratio: float = 0.4
    column_detect_smooth_window: int = 5
    page_range_sample_tokens: int = 200
    page_range_min_overlap: float = 0.02
    page_range_min_hits: int = 5
    page_range_top_k: int = 5
    page_range_peak_ratio: float = 0.5
    page_range_cluster_gap: int = 1
    page_range_max_span_ratio: float = 0.7
    per_page_ocr_on_low_quality: bool = True
    force_ocr_on_low_quality_text: bool = False
    enable_post_correction: bool = True
    enable_dictionary_correction: bool = False
    dictionary_path: Optional[str] = None
    dictionary_words: Optional[Sequence[str]] = None
    default_dictionary_name: str = "ocr_wordlist.txt"
    enable_llm_correction: bool = False
    llm_correct: Optional[Callable[[str], str]] = None
    llm_cleanup_base_url: Optional[str] = None
    llm_cleanup_api_key: Optional[str] = None
    llm_cleanup_model: Optional[str] = None
    llm_cleanup_temperature: float = 0.0
    llm_cleanup_timeout_sec: int = 60
    llm_correction_min_quality: float = 0.35
    llm_correction_max_chars: int = 2000
    postprocess_markdown: bool = False
    analysis_max_pages: int = 5
    analysis_sample_strategy: str = "middle"
    ocr_dpi: int = 300


@dataclass
class OcrRouteDecision:
    ocr_used: bool
    ocr_engine: str
    languages: str
    route_reason: str
    use_external_ocr: bool
    per_page_ocr: bool
    per_page_reason: str


@dataclass
class TextQuality:
    avg_chars_per_page: float
    alpha_ratio: float
    suspicious_token_ratio: float
    confidence_proxy: float
    dictionary_hit_ratio: Optional[float] = None

@dataclass
class ColumnLayoutDetection:
    detected: bool
    page_ratio: float
    reason: str

@dataclass
class DoclingConversionResult:
    markdown: str
    pages: List[Dict[str, Any]]
    metadata: Dict[str, Any]


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def normalize_whitespace(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def dehyphenate_text(text: str) -> str:
    return re.sub(r"(?<=\w)-\s*\n\s*(?=\w)", "", text)


def replace_ligatures(text: str) -> str:
    return (
        text.replace("\ufb01", "fi")
        .replace("\ufb02", "fl")
        .replace("\ufb03", "ffi")
        .replace("\ufb04", "ffl")
    )


def select_wordfreq_languages(languages: str) -> List[str]:
    lang = (languages or "").lower()
    selected: List[str] = []
    if any(token in lang for token in ("deu", "ger", "de", "german", "deutsch")):
        selected.append("de")
    if any(token in lang for token in ("eng", "en", "english")):
        selected.append("en")
    if not selected:
        selected.append("en")
    return selected


def compute_dictionary_hit_ratio(
    tokens: Sequence[str],
    languages: str,
    min_zipf: float,
) -> Optional[float]:
    try:
        from wordfreq import zipf_frequency
    except Exception:
        return None

    if not tokens:
        return None
    lang_codes = select_wordfreq_languages(languages)
    hits = 0
    total = 0
    for token in tokens:
        lower = token.lower()
        if len(lower) < 2:
            continue
        total += 1
        if any(zipf_frequency(lower, lang) >= min_zipf for lang in lang_codes):
            hits += 1
    if not total:
        return None
    return hits / total


def estimate_text_quality(
    pages: Sequence[Dict[str, Any]],
    config: Optional[DoclingProcessingConfig] = None,
    languages: Optional[str] = None,
) -> TextQuality:
    if not pages:
        return TextQuality(0.0, 0.0, 1.0, 0.0, None)

    texts = [str(page.get("text", "")) for page in pages]
    total_chars = sum(len(text) for text in texts)
    alpha_chars = sum(sum(char.isalpha() for char in text) for text in texts)
    alpha_ratio = alpha_chars / max(1, total_chars)

    tokens = re.findall(r"[A-Za-z0-9]+", " ".join(texts))
    suspicious_tokens = [
        token for token in tokens
        if (sum(char.isdigit() for char in token) / max(1, len(token))) > 0.5
        or re.search(r"(.)\1\1", token)
    ]
    suspicious_ratio = len(suspicious_tokens) / max(1, len(tokens))

    avg_chars = total_chars / max(1, len(pages))
    dictionary_hit_ratio = None
    if config and config.quality_use_wordfreq and languages:
        dictionary_hit_ratio = compute_dictionary_hit_ratio(
            tokens,
            languages,
            config.quality_wordfreq_min_zipf,
        )
    confidence = alpha_ratio * (1.0 - suspicious_ratio)
    if dictionary_hit_ratio is not None:
        confidence *= 0.4 + (0.6 * dictionary_hit_ratio)
    confidence = max(0.0, min(1.0, confidence))
    return TextQuality(avg_chars, alpha_ratio, suspicious_ratio, confidence, dictionary_hit_ratio)


def detect_text_layer_from_pages(pages: Sequence[Dict[str, Any]], config: DoclingProcessingConfig) -> bool:
    if not pages:
        return False
    pages_with_text = 0
    for page in pages:
        cleaned = normalize_text(str(page.get("text", "")))
        if len(cleaned) >= config.min_text_chars_per_page:
            pages_with_text += 1
    ratio = pages_with_text / max(1, len(pages))
    return ratio >= config.min_text_pages_ratio


def is_low_quality(quality: TextQuality, config: DoclingProcessingConfig) -> bool:
    if quality.confidence_proxy < config.quality_confidence_threshold:
        return True
    return (
        quality.avg_chars_per_page < config.quality_min_avg_chars_per_page
        or quality.alpha_ratio < config.quality_alpha_ratio_threshold
        or quality.suspicious_token_ratio > config.quality_suspicious_token_threshold
    )


def should_rasterize_text_layer(has_text_layer: bool, low_quality: bool, config: DoclingProcessingConfig) -> bool:
    if config.ocr_mode == "force":
        return True
    return bool(has_text_layer and low_quality and config.force_ocr_on_low_quality_text)


def decide_per_page_ocr(
    has_text_layer: bool,
    quality: TextQuality,
    config: DoclingProcessingConfig,
) -> Tuple[bool, str]:
    if not config.per_page_ocr_on_low_quality:
        return False, "Per-page OCR disabled by config"
    if not has_text_layer and is_low_quality(quality, config):
        return True, "Low-quality scan detected"
    if quality.suspicious_token_ratio > config.quality_suspicious_token_threshold:
        return True, "High suspicious token ratio"
    if quality.avg_chars_per_page < config.quality_min_avg_chars_per_page:
        return True, "Low text density"
    return False, "Quality metrics acceptable"


def select_language_set(
    language_hint: Optional[str],
    filename: str,
    config: DoclingProcessingConfig,
) -> str:
    hint = (language_hint or "").lower().strip()
    name = os.path.basename(filename).lower()

    if hint:
        if any(token in hint for token in ("de", "deu", "ger", "german", "deutsch")):
            return config.default_lang_german
        if any(token in hint for token in ("en", "eng", "english")):
            return config.default_lang_english
        return hint

    if re.search(r"(\bde\b|_de\b|-de\b|deu|german|deutsch)", name):
        return config.default_lang_german
    return config.default_lang_english


def normalize_languages_for_engine(languages: str, engine: str) -> str:
    lang = languages.lower()
    if engine == "paddle":
        if any(token in lang for token in ("deu", "ger", "de", "german", "deutsch")):
            return "german"
        return "en"
    return languages


def decide_ocr_route(
    has_text_layer: bool,
    quality: TextQuality,
    available_engines: Sequence[str],
    config: DoclingProcessingConfig,
    languages: str,
) -> OcrRouteDecision:
    low_quality = is_low_quality(quality, config)
    if config.ocr_mode == "off":
        return OcrRouteDecision(
            False,
            "none",
            languages,
            "OCR disabled by config",
            False,
            False,
            "Per-page OCR disabled by config",
        )

    if config.ocr_mode == "force":
        ocr_used = True
        route_reason = "OCR forced by config"
    elif has_text_layer and not (config.force_ocr_on_low_quality_text and low_quality):
        return OcrRouteDecision(
            False,
            "none",
            languages,
            "Text layer detected",
            False,
            False,
            "Per-page OCR not applicable (text layer)",
        )
    else:
        ocr_used = True
        if has_text_layer:
            route_reason = "Text layer detected but low quality"
        else:
            route_reason = "No usable text layer detected"

    engine = "docling"
    use_external = False
    if ocr_used:
        if config.prefer_ocr_engine in available_engines:
            engine = config.prefer_ocr_engine
            use_external = True
        elif config.fallback_ocr_engine in available_engines:
            engine = config.fallback_ocr_engine
            use_external = True

    per_page = False
    per_page_reason = "Per-page OCR not applicable"
    if use_external:
        per_page, per_page_reason = decide_per_page_ocr(has_text_layer, quality, config)
    if low_quality and not has_text_layer:
        route_reason = f"{route_reason}; low-quality scan suspected"

    return OcrRouteDecision(ocr_used, engine, languages, route_reason, use_external, per_page, per_page_reason)


def detect_available_ocr_engines() -> List[str]:
    available: List[str] = []
    try:
        import paddleocr  # noqa: F401
        from pdf2image import convert_from_path  # noqa: F401
        available.append("paddle")
    except Exception:
        pass
    try:
        import pytesseract  # noqa: F401
        from pdf2image import convert_from_path  # noqa: F401
        available.append("tesseract")
    except Exception:
        pass
    return available


def load_default_wordlist(config: DoclingProcessingConfig) -> Sequence[str]:
    path = config.dictionary_path
    if not path:
        path = os.path.join(os.path.dirname(__file__), config.default_dictionary_name)
    if not path or not os.path.isfile(path):
        return []
    try:
        with open(path, "r", encoding="utf-8") as handle:
            return [line.strip() for line in handle if line.strip() and not line.startswith("#")]
    except Exception as exc:
        LOGGER.warning("Failed to load dictionary word list: %s", exc)
        return []


def prepare_dictionary_words(config: DoclingProcessingConfig) -> Sequence[str]:
    if not config.enable_dictionary_correction:
        return []
    if config.dictionary_words:
        return [word.strip() for word in config.dictionary_words if word and word.strip()]
    words = load_default_wordlist(config)
    if not words:
        LOGGER.warning("Dictionary correction enabled but no wordlist was loaded.")
    return words


def apply_dictionary_correction(text: str, wordlist: Sequence[str]) -> str:
    if not wordlist:
        return text
    dictionary = {word.lower() for word in wordlist}
    token_re = re.compile(r"[A-Za-z0-9]+")

    def match_case(candidate: str, original: str) -> str:
        if original.isupper():
            return candidate.upper()
        if original[:1].isupper():
            return candidate.capitalize()
        return candidate

    def generate_candidates(token: str) -> Iterable[str]:
        candidates: List[str] = []
        if any(char.isdigit() for char in token) and any(char.isalpha() for char in token):
            candidates.append(token.replace("0", "o"))
            candidates.append(token.replace("1", "l"))
            candidates.append(token.replace("5", "s"))
        if "rn" in token:
            candidates.append(token.replace("rn", "m"))
        return candidates

    def replace_token(match: re.Match) -> str:
        token = match.group(0)
        lower = token.lower()
        if lower in dictionary:
            return token
        for candidate in generate_candidates(token):
            if candidate.lower() in dictionary:
                return match_case(candidate, token)
        return token

    return token_re.sub(replace_token, text)


def apply_umlaut_corrections(text: str, languages: str, wordlist: Sequence[str]) -> str:
    lang = languages.lower()
    if not any(token in lang for token in ("de", "deu", "german", "deutsch")):
        return text

    dictionary = {word.lower() for word in wordlist}
    replacements = {
        "ueber": "\u00fcber",
        "fuer": "f\u00fcr",
        "koennen": "k\u00f6nnen",
        "muessen": "m\u00fcssen",
        "haeufig": "h\u00e4ufig",
    }

    def replace_match(match: re.Match) -> str:
        token = match.group(0)
        lower = token.lower()
        if lower in replacements:
            replacement = replacements[lower]
            if token.isupper():
                return replacement.upper()
            if token[:1].isupper():
                return replacement.capitalize()
            return replacement
        if dictionary:
            for ascii_seq, umlaut in (("ae", "\u00e4"), ("oe", "\u00f6"), ("ue", "\u00fc")):
                if ascii_seq in lower:
                    candidate = lower.replace(ascii_seq, umlaut)
                    if candidate in dictionary:
                        return candidate
        return token

    return re.sub(r"[A-Za-z]{4,}", replace_match, text)


def should_apply_llm_correction(text: str, config: DoclingProcessingConfig) -> bool:
    if not config.enable_llm_correction:
        return False
    if not config.llm_correct:
        return False
    if config.llm_correction_max_chars and len(text) > config.llm_correction_max_chars:
        return False
    languages = select_language_set(config.language_hint, "", config)
    quality = estimate_text_quality([{"text": text}], config, languages)
    return quality.confidence_proxy < config.llm_correction_min_quality


def build_llm_cleanup_callback(config: DoclingProcessingConfig) -> Optional[Callable[[str], str]]:
    if not config.enable_llm_correction:
        return None
    if not config.llm_cleanup_base_url or not config.llm_cleanup_model:
        LOGGER.warning("LLM cleanup enabled but base URL or model is missing.")
        return None

    base_url = config.llm_cleanup_base_url.rstrip("/")
    endpoint = f"{base_url}/chat/completions"
    api_key = (config.llm_cleanup_api_key or "").strip()

    def _call(text: str) -> str:
        try:
            import requests
        except Exception as exc:
            LOGGER.warning("requests not available for LLM cleanup: %s", exc)
            return text

        headers = {"Content-Type": "application/json"}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        payload = {
            "model": config.llm_cleanup_model,
            "temperature": config.llm_cleanup_temperature,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are an OCR cleanup assistant. Fix OCR errors without changing meaning. "
                        "Do not add content. Return corrected text only."
                    ),
                },
                {"role": "user", "content": text},
            ],
        }
        try:
            response = requests.post(endpoint, headers=headers, json=payload, timeout=config.llm_cleanup_timeout_sec)
            response.raise_for_status()
            data = response.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content")
            if content:
                return str(content).strip()
        except Exception as exc:
            LOGGER.warning("LLM cleanup failed: %s", exc)
        return text

    return _call


def postprocess_text(
    text: str,
    config: DoclingProcessingConfig,
    languages: str,
    wordlist: Sequence[str],
) -> str:
    if not text:
        return text
    cleaned = dehyphenate_text(text)
    cleaned = replace_ligatures(cleaned)
    cleaned = normalize_whitespace(cleaned)
    if config.enable_dictionary_correction:
        cleaned = apply_dictionary_correction(cleaned, wordlist)
    cleaned = apply_umlaut_corrections(cleaned, languages, wordlist)
    if should_apply_llm_correction(cleaned, config) and config.llm_correct:
        cleaned = config.llm_correct(cleaned)
    return cleaned

def export_markdown(doc: Any) -> str:
    for method_name in ("export_to_markdown", "to_markdown", "export_to_md"):
        method = getattr(doc, method_name, None)
        if callable(method):
            return method()
    for method_name in ("export_to_text", "to_text"):
        method = getattr(doc, method_name, None)
        if callable(method):
            return method()
    return str(doc)


def export_text(doc: Any) -> str:
    for method_name in ("export_to_text", "to_text"):
        method = getattr(doc, method_name, None)
        if callable(method):
            return method()
    return str(doc)


def extract_pages(doc: Any) -> List[Dict[str, Any]]:
    pages: List[Dict[str, Any]] = []
    pages_attr = getattr(doc, "pages", None)
    if pages_attr is not None and not isinstance(pages_attr, (str, bytes, dict)):
        try:
            pages_list = list(pages_attr)
        except TypeError:
            pages_list = []
        if pages_list:
            for idx, page in enumerate(pages_list, start=1):
                page_num = getattr(page, "page_number", None) or getattr(page, "number", None) or idx
                text = None
                for attr in ("text", "content", "markdown", "md"):
                    if hasattr(page, attr):
                        value = getattr(page, attr)
                        text = value() if callable(value) else value
                        break
                if text is None and hasattr(page, "export_to_text"):
                    text = page.export_to_text()
                if text is None:
                    text = str(page)
                pages.append({"page_num": int(page_num), "text": str(text)})
            return pages

    full_text = export_text(doc)
    if full_text:
        pages.append({"page_num": 1, "text": full_text})
    return pages


def select_analysis_page_indices(
    total_pages: int,
    max_pages: Optional[int],
    sample_strategy: str,
) -> List[int]:
    if total_pages <= 0:
        return []
    if not max_pages or max_pages <= 0 or total_pages <= max_pages:
        return list(range(1, total_pages + 1))

    strategy = (sample_strategy or "first").lower()
    if strategy == "middle":
        start = max(1, (total_pages - max_pages) // 2 + 1)
        end = min(total_pages, start + max_pages - 1)
        return list(range(start, end + 1))
    return list(range(1, max_pages + 1))


def extract_pages_from_pdf(
    pdf_path: str,
    max_pages: Optional[int] = None,
    sample_strategy: str = "first",
) -> List[Dict[str, Any]]:
    try:
        from pypdf import PdfReader
    except Exception as exc:
        eprint(f"pypdf is not available for fallback page extraction: {exc}")
        return []

    pages: List[Dict[str, Any]] = []
    try:
        reader = PdfReader(pdf_path)
        page_indices = select_analysis_page_indices(len(reader.pages), max_pages, sample_strategy)
        for idx in page_indices:
            page = reader.pages[idx - 1]
            try:
                text = page.extract_text() or ""
            except Exception:
                text = ""
            pages.append({"page_num": idx, "text": text})
    except Exception as exc:
        eprint(f"Failed to extract pages with pypdf: {exc}")
        return []

    return pages


def split_markdown_sections(markdown: str) -> List[Dict[str, Any]]:
    sections: List[Dict[str, Any]] = []
    current_title = ""
    current_lines: List[str] = []

    def flush() -> None:
        nonlocal current_title, current_lines
        if current_title or current_lines:
            sections.append({
                "title": current_title.strip(),
                "text": "\n".join(current_lines).strip(),
            })
        current_title = ""
        current_lines = []

    for line in markdown.splitlines():
        if line.startswith("#"):
            flush()
            current_title = line.lstrip("#").strip()
        else:
            current_lines.append(line)

    flush()
    return sections


_PAGE_RANGE_STOPWORDS = {
    "the", "and", "for", "with", "that", "this", "from", "into", "over",
    "under", "after", "before", "were", "was", "are", "is", "its", "their",
    "then", "than", "than", "which", "when", "where", "have", "has", "had",
    "into", "onto", "upon", "your", "yours", "they", "them", "these", "those",
    "will", "would", "could", "should", "about", "there", "here", "while",
    "what", "why", "how", "not", "but", "you", "your", "our", "ours", "his",
    "her", "she", "him", "she", "him", "its", "also", "such", "been", "being",
    "out", "one", "two", "three", "four", "five", "six", "seven", "eight",
    "nine", "ten", "more", "most", "some", "many", "few", "each", "per",
}


def tokenize_for_page_range(text: str) -> List[str]:
    tokens = re.findall(r"[A-Za-z0-9]{3,}", text.lower())
    return [token for token in tokens if token not in _PAGE_RANGE_STOPWORDS]


def sample_tokens(tokens: Sequence[str], max_tokens: int) -> List[str]:
    if max_tokens <= 0 or len(tokens) <= max_tokens:
        return list(tokens)
    step = max(1, len(tokens) // max_tokens)
    return list(tokens[::step])


def compute_page_overlap(
    section_text: str,
    pages: List[Dict[str, Any]],
    config: DoclingProcessingConfig,
) -> List[Tuple[float, int, int]]:
    section_tokens = tokenize_for_page_range(section_text)
    if not section_tokens:
        return []
    sample = sample_tokens(section_tokens, config.page_range_sample_tokens)
    sample_set = set(sample)
    total = len(sample_set)
    results: List[Tuple[float, int, int]] = []
    for page in pages:
        page_text = str(page.get("text", ""))
        page_tokens = set(tokenize_for_page_range(page_text))
        hits = len(sample_set & page_tokens)
        ratio = hits / max(1, total)
        results.append((ratio, hits, int(page.get("page_num", 0))))
    return results


def select_overlap_cluster(
    overlap_scores: Sequence[Tuple[float, int, int]],
    config: DoclingProcessingConfig,
) -> List[int]:
    if not overlap_scores:
        return []
    max_ratio = max(score[0] for score in overlap_scores)
    max_hits = max(score[1] for score in overlap_scores)
    ratio_cutoff = max(config.page_range_min_overlap, max_ratio * config.page_range_peak_ratio)
    hits_cutoff = max(config.page_range_min_hits, int(max_hits * config.page_range_peak_ratio))
    candidates = [
        (ratio, hits, page_num)
        for ratio, hits, page_num in overlap_scores
        if ratio >= ratio_cutoff or hits >= hits_cutoff
    ]
    if not candidates:
        candidates = sorted(overlap_scores, reverse=True)[: config.page_range_top_k]

    candidates.sort(key=lambda item: item[2])
    clusters: List[List[Tuple[float, int, int]]] = []
    current: List[Tuple[float, int, int]] = []
    for entry in candidates:
        if not current:
            current.append(entry)
            continue
        if entry[2] - current[-1][2] <= config.page_range_cluster_gap:
            current.append(entry)
        else:
            clusters.append(current)
            current = [entry]
    if current:
        clusters.append(current)

    def cluster_score(cluster: Sequence[Tuple[float, int, int]]) -> Tuple[float, float]:
        ratios = [item[0] for item in cluster]
        return (sum(ratios), max(ratios))

    best_cluster = max(clusters, key=cluster_score)
    page_nums = [item[2] for item in best_cluster]
    if len(page_nums) > 1:
        span_ratio = (max(page_nums) - min(page_nums) + 1) / max(1, len(overlap_scores))
        if span_ratio > config.page_range_max_span_ratio:
            trimmed = sorted(best_cluster, reverse=True)[: config.page_range_top_k]
            page_nums = [item[2] for item in trimmed]
    return page_nums


def find_page_range(
    section_text: str,
    pages: List[Dict[str, Any]],
    config: Optional[DoclingProcessingConfig] = None,
) -> Tuple[int, int]:
    if not pages:
        return 0, 0

    cleaned = normalize_text(section_text)
    if not cleaned:
        return 0, 0

    snippet_start = cleaned[:200]
    snippet_end = cleaned[-200:]

    page_start = 0
    page_end = 0

    for page in pages:
        page_clean = normalize_text(page.get("text", ""))
        if snippet_start and snippet_start in page_clean:
            page_start = page.get("page_num", 0)
            break

    for page in reversed(pages):
        page_clean = normalize_text(page.get("text", ""))
        if snippet_end and snippet_end in page_clean:
            page_end = page.get("page_num", 0)
            break

    if page_start == 0 or page_end == 0:
        config = config or DoclingProcessingConfig()
        overlap_scores = compute_page_overlap(cleaned, pages, config)
        page_nums = select_overlap_cluster(overlap_scores, config)
        if page_nums:
            if page_start == 0:
                page_start = min(page_nums)
            if page_end == 0:
                page_end = max(page_nums)

    if page_start == 0:
        page_start = pages[0].get("page_num", 0)
    if page_end == 0:
        page_end = pages[-1].get("page_num", 0)

    return int(page_start), int(page_end)


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug


def configure_layout_options(pipeline_options: Any) -> None:
    if hasattr(pipeline_options, "layout_mode"):
        pipeline_options.layout_mode = "accurate"
    if hasattr(pipeline_options, "detect_layout"):
        pipeline_options.detect_layout = True
    if hasattr(pipeline_options, "extract_tables"):
        pipeline_options.extract_tables = True
    if hasattr(pipeline_options, "table_structure"):
        pipeline_options.table_structure = True
    layout_options = getattr(pipeline_options, "layout_options", None)
    if layout_options is not None:
        for name, value in (
            ("detect_columns", True),
            ("detect_tables", True),
            ("enable_table_structure", True),
            ("max_columns", 3),
        ):
            if hasattr(layout_options, name):
                setattr(layout_options, name, value)


def build_converter(config: DoclingProcessingConfig, decision: OcrRouteDecision):
    from docling.document_converter import DocumentConverter

    try:
        from docling.datamodel.base_models import InputFormat
        from docling.datamodel.pipeline_options import PdfPipelineOptions, OCRMode
        from docling.document_converter import PdfFormatOption
    except Exception:
        return DocumentConverter()

    pipeline_options = PdfPipelineOptions()
    if not decision.ocr_used:
        if hasattr(pipeline_options, "do_ocr"):
            pipeline_options.do_ocr = False
        if hasattr(pipeline_options, "ocr_mode"):
            pipeline_options.ocr_mode = OCRMode.DISABLED
    elif config.ocr_mode == "force":
        if hasattr(pipeline_options, "do_ocr"):
            pipeline_options.do_ocr = True
        if hasattr(pipeline_options, "ocr_mode"):
            pipeline_options.ocr_mode = OCRMode.FORCE
    else:
        if hasattr(pipeline_options, "ocr_mode"):
            pipeline_options.ocr_mode = OCRMode.AUTO

    if decision.ocr_used:
        if hasattr(pipeline_options, "ocr_engine"):
            pipeline_options.ocr_engine = decision.ocr_engine
        if hasattr(pipeline_options, "ocr_languages"):
            pipeline_options.ocr_languages = decision.languages
        if hasattr(pipeline_options, "ocr_lang"):
            pipeline_options.ocr_lang = decision.languages

    configure_layout_options(pipeline_options)

    format_options = {InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)}
    return DocumentConverter(format_options=format_options)


def find_poppler_path() -> Optional[str]:
    env_path = os.environ.get("POPPLER_PATH")
    if env_path and os.path.isfile(os.path.join(env_path, "pdftoppm")):
        return env_path
    pdftoppm = shutil.which("pdftoppm")
    if pdftoppm:
        return os.path.dirname(pdftoppm)
    for candidate in ("/opt/homebrew/bin", "/usr/local/bin", "/usr/bin"):
        if os.path.isfile(os.path.join(candidate, "pdftoppm")):
            return candidate
    return None


def render_pdf_pages(pdf_path: str, dpi: int) -> List[Any]:
    from pdf2image import convert_from_path

    poppler_path = find_poppler_path()
    if poppler_path:
        if shutil.which("pdftoppm") is None:
            LOGGER.info("Poppler not on PATH; using %s", poppler_path)
        return convert_from_path(pdf_path, dpi=dpi, poppler_path=poppler_path)
    return convert_from_path(pdf_path, dpi=dpi)


def render_pdf_pages_sample(pdf_path: str, dpi: int, max_pages: int) -> List[Any]:
    from pdf2image import convert_from_path

    if max_pages <= 0:
        return []
    poppler_path = find_poppler_path()
    kwargs = {"dpi": dpi, "first_page": 1, "last_page": max_pages}
    if poppler_path:
        if shutil.which("pdftoppm") is None:
            LOGGER.info("Poppler not on PATH; using %s", poppler_path)
        kwargs["poppler_path"] = poppler_path
    return convert_from_path(pdf_path, **kwargs)


def compute_column_density(
    image: Any,
    config: DoclingProcessingConfig,
    target_width: int = 300,
) -> List[float]:
    gray = image.convert("L")
    width, height = gray.size
    if width > target_width:
        scale = target_width / max(1, width)
        gray = gray.resize((target_width, max(1, int(height * scale))))
    width, height = gray.size
    crop_top = int(height * config.column_detect_crop_top_ratio)
    crop_bottom = int(height * config.column_detect_crop_bottom_ratio)
    if crop_top + crop_bottom < height - 1:
        gray = gray.crop((0, crop_top, width, height - crop_bottom))

    try:
        import numpy as np
    except Exception:
        pixels = list(gray.getdata())
        w, h = gray.size
        if w == 0 or h == 0:
            return []
        sorted_pixels = sorted(pixels)
        median = sorted_pixels[len(sorted_pixels) // 2]
        mean = sum(pixels) / max(1, len(pixels))
        variance = sum((value - mean) ** 2 for value in pixels) / max(1, len(pixels))
        std = variance ** 0.5
        threshold = median - (std * config.column_detect_threshold_std_mult)
        threshold = min(threshold, config.column_detect_threshold_max)
        threshold = max(threshold, config.column_detect_threshold_min)
        densities = [0] * w
        for y in range(h):
            row = pixels[y * w:(y + 1) * w]
            for x, value in enumerate(row):
                if value < threshold:
                    densities[x] += 1
        return [count / h for count in densities]

    arr = np.asarray(gray)
    if arr.size == 0:
        return []
    median = float(np.median(arr))
    std = float(arr.std())
    threshold = median - (std * config.column_detect_threshold_std_mult)
    threshold = min(threshold, config.column_detect_threshold_max)
    threshold = max(threshold, config.column_detect_threshold_min)
    mask = arr < threshold
    return mask.mean(axis=0).tolist()


def smooth_density(density: Sequence[float], window: int) -> List[float]:
    if window <= 1 or not density:
        return list(density)
    size = max(1, int(window))
    half = size // 2
    smoothed: List[float] = []
    for idx in range(len(density)):
        start = max(0, idx - half)
        end = min(len(density), idx + half + 1)
        smoothed.append(sum(density[start:end]) / max(1, end - start))
    return smoothed


def density_percentile(density: Sequence[float], percentile: float) -> float:
    if not density:
        return 0.0
    clamped = max(0.0, min(1.0, percentile))
    sorted_vals = sorted(density)
    idx = int(round(clamped * (len(sorted_vals) - 1)))
    return sorted_vals[idx]


def count_column_gaps(
    density: Sequence[float],
    config: DoclingProcessingConfig,
) -> int:
    if not density:
        return 0
    total = len(density)
    margin = max(1, int(total * 0.05))
    start = margin
    end = max(start + 1, total - margin)
    core = density[start:end]
    if not core:
        return 0
    text_level = density_percentile(core, config.column_detect_text_percentile)
    if text_level < config.column_detect_min_text_density:
        return 0
    threshold = max(config.column_detect_min_gap_density, text_level * config.column_detect_gap_threshold_ratio)
    min_gap = max(1, int(len(core) * config.column_detect_min_gap_ratio))

    gaps = 0
    idx = 0
    while idx < len(core):
        if core[idx] < threshold:
            gap_start = idx
            while idx < len(core) and core[idx] < threshold:
                idx += 1
            if idx - gap_start >= min_gap:
                gaps += 1
        else:
            idx += 1
    return gaps


def detect_multicolumn_layout(
    images: Sequence[Any],
    config: DoclingProcessingConfig,
) -> ColumnLayoutDetection:
    if not images:
        return ColumnLayoutDetection(False, 0.0, "No pages available")
    sample = list(images[: config.column_detect_max_pages])
    if not sample:
        return ColumnLayoutDetection(False, 0.0, "No sample pages")

    hits = 0
    for image in sample:
        density = compute_column_density(image, config)
        density = smooth_density(density, config.column_detect_smooth_window)
        gaps = count_column_gaps(density, config)
        if gaps >= 1:
            hits += 1
    ratio = hits / max(1, len(sample))
    detected = ratio >= config.column_detect_min_pages_ratio
    reason = f"{hits}/{len(sample)} pages show column gutters"
    return ColumnLayoutDetection(detected, ratio, reason)


def rasterize_pdf_to_temp(pdf_path: str, dpi: int) -> str:
    from tempfile import NamedTemporaryFile

    images = render_pdf_pages(pdf_path, dpi)
    if not images:
        raise RuntimeError("Failed to render PDF pages for rasterization.")

    temp_file = NamedTemporaryFile(delete=False, suffix=".pdf")
    temp_file.close()
    first = images[0]
    rest = images[1:]
    first.save(temp_file.name, format="PDF", save_all=True, append_images=rest)
    return temp_file.name


def ocr_pages_with_paddle(images: Sequence[Any], languages: str) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    from paddleocr import PaddleOCR

    try:
        import numpy as np
    except Exception as exc:
        raise RuntimeError(f"numpy is required for PaddleOCR: {exc}") from exc

    ocr = PaddleOCR(use_angle_cls=True, lang=languages)
    pages: List[Dict[str, Any]] = []
    confidences: List[float] = []

    for idx, image in enumerate(images, start=1):
        result = ocr.ocr(np.array(image), cls=True)
        lines: List[str] = []
        if result:
            for entry in result[0] if isinstance(result, list) else result:
                if not entry:
                    continue
                if isinstance(entry, (list, tuple)) and len(entry) >= 2:
                    text_part = entry[1]
                    if isinstance(text_part, (list, tuple)) and text_part:
                        lines.append(str(text_part[0]))
                        if len(text_part) > 1 and isinstance(text_part[1], (float, int)):
                            confidences.append(float(text_part[1]))
                    else:
                        lines.append(str(text_part))
        pages.append({"page_num": idx, "text": "\n".join(lines)})

    avg_conf = sum(confidences) / len(confidences) if confidences else None
    return pages, {"ocr_confidence_avg": avg_conf}


def ocr_pages_with_tesseract(images: Sequence[Any], languages: str) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    import pytesseract

    pages: List[Dict[str, Any]] = []
    for idx, image in enumerate(images, start=1):
        text = pytesseract.image_to_string(image, lang=languages)
        pages.append({"page_num": idx, "text": text})
    return pages, {}


def run_external_ocr_pages(
    pdf_path: str,
    engine: str,
    languages: str,
    config: DoclingProcessingConfig,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    images = render_pdf_pages(pdf_path, config.ocr_dpi)
    if engine == "paddle":
        return ocr_pages_with_paddle(images, normalize_languages_for_engine(languages, engine))
    if engine == "tesseract":
        return ocr_pages_with_tesseract(images, normalize_languages_for_engine(languages, engine))
    return [], {}


def build_quality_report(pdf_path: str, config: DoclingProcessingConfig) -> Dict[str, Any]:
    analysis_pages = extract_pages_from_pdf(
        pdf_path,
        max_pages=config.analysis_max_pages,
        sample_strategy=config.analysis_sample_strategy,
    )
    has_text_layer = detect_text_layer_from_pages(analysis_pages, config)
    languages = select_language_set(config.language_hint, pdf_path, config)
    quality = estimate_text_quality(analysis_pages, config, languages)
    low_quality = is_low_quality(quality, config)
    return {
        "text_layer_detected": has_text_layer,
        "text_layer_low_quality": has_text_layer and low_quality,
        "avg_chars_per_page": quality.avg_chars_per_page,
        "alpha_ratio": quality.alpha_ratio,
        "suspicious_token_ratio": quality.suspicious_token_ratio,
        "confidence_proxy": quality.confidence_proxy,
        "dictionary_hit_ratio": quality.dictionary_hit_ratio,
    }


def convert_pdf_with_docling(pdf_path: str, config: DoclingProcessingConfig) -> DoclingConversionResult:
    analysis_pages = extract_pages_from_pdf(
        pdf_path,
        max_pages=config.analysis_max_pages,
        sample_strategy=config.analysis_sample_strategy,
    )
    has_text_layer = detect_text_layer_from_pages(analysis_pages, config)
    languages = select_language_set(config.language_hint, pdf_path, config)
    quality = estimate_text_quality(analysis_pages, config, languages)
    low_quality = is_low_quality(quality, config)
    available_engines = detect_available_ocr_engines()
    decision = decide_ocr_route(has_text_layer, quality, available_engines, config, languages)
    rasterized_source = False
    rasterized_pdf_path = ""
    rasterize_error: Optional[str] = None
    column_layout: Optional[ColumnLayoutDetection] = None
    if should_rasterize_text_layer(has_text_layer, low_quality, config):
        try:
            rasterized_pdf_path = rasterize_pdf_to_temp(pdf_path, config.ocr_dpi)
            rasterized_source = True
            LOGGER.info("Rasterized low-quality text layer for Docling OCR.")
        except Exception as exc:
            rasterize_error = str(exc)
            LOGGER.warning("Failed to rasterize PDF for OCR: %s", exc)
    if rasterized_source:
        decision.per_page_ocr = False
        decision.per_page_reason = "Rasterized PDF for Docling OCR"

    if config.column_detect_enable and decision.ocr_used and (rasterized_source or not has_text_layer):
        try:
            sample_images = render_pdf_pages_sample(
                pdf_path,
                config.column_detect_dpi,
                config.column_detect_max_pages,
            )
            column_layout = detect_multicolumn_layout(sample_images, config)
            LOGGER.info(
                "Column layout detection: %s (%s)",
                column_layout.detected,
                column_layout.reason,
            )
            if column_layout.detected and decision.use_external_ocr and decision.per_page_ocr:
                decision.per_page_ocr = False
                decision.per_page_reason = "Columns detected; keep Docling layout"
        except Exception as exc:
            LOGGER.warning("Column layout detection failed: %s", exc)

    dict_ratio = "n/a" if quality.dictionary_hit_ratio is None else f"{quality.dictionary_hit_ratio:.2f}"
    LOGGER.info(
        "Text-layer check: %s (avg_chars=%.1f, alpha_ratio=%.2f, suspicious=%.2f, dict=%s)",
        has_text_layer,
        quality.avg_chars_per_page,
        quality.alpha_ratio,
        quality.suspicious_token_ratio,
        dict_ratio,
    )
    if available_engines:
        LOGGER.info("Available OCR engines: %s", ", ".join(available_engines))
    else:
        LOGGER.info("Available OCR engines: none (external OCR disabled)")

    LOGGER.info(
        "Docling OCR route: %s (engine=%s, languages=%s)",
        decision.route_reason,
        decision.ocr_engine,
        decision.languages,
    )
    LOGGER.info("Per-page OCR: %s (%s)", decision.per_page_ocr, decision.per_page_reason)
    if decision.ocr_used and not decision.use_external_ocr:
        LOGGER.info("External OCR unavailable; relying on Docling OCR.")

    converter = build_converter(config, decision)
    docling_input = rasterized_pdf_path or pdf_path
    result = converter.convert(docling_input)
    doc = result.document if hasattr(result, "document") else result
    markdown = export_markdown(doc)
    pages = extract_pages(doc)
    if len(pages) <= 1:
        fallback_pages = extract_pages_from_pdf(pdf_path)
        if len(fallback_pages) > len(pages):
            pages = fallback_pages

    ocr_stats: Dict[str, Any] = {}
    if decision.ocr_used and decision.use_external_ocr and decision.per_page_ocr and not rasterized_source:
        try:
            ocr_pages, ocr_stats = run_external_ocr_pages(pdf_path, decision.ocr_engine, languages, config)
            if ocr_pages:
                pages = ocr_pages
                if config.postprocess_markdown and not markdown.strip():
                    markdown = "\n\n".join(page.get("text", "") for page in ocr_pages)
        except Exception as exc:
            LOGGER.warning("External OCR failed (%s): %s", decision.ocr_engine, exc)
    if rasterized_source and rasterized_pdf_path:
        try:
            os.unlink(rasterized_pdf_path)
        except Exception:
            pass

    metadata = {
        "ocr_used": decision.ocr_used,
        "ocr_engine": decision.ocr_engine,
        "languages": decision.languages,
        "route_reason": decision.route_reason,
        "per_page_reason": decision.per_page_reason,
        "text_layer_detected": has_text_layer,
        "text_layer_low_quality": has_text_layer and low_quality,
        "rasterized_source_pdf": rasterized_source,
        "rasterize_failed": bool(rasterize_error),
        "rasterize_error": rasterize_error,
        "column_layout_detected": column_layout.detected if column_layout else None,
        "column_layout_ratio": column_layout.page_ratio if column_layout else None,
        "column_layout_reason": column_layout.reason if column_layout else None,
        "avg_chars_per_page": quality.avg_chars_per_page,
        "alpha_ratio": quality.alpha_ratio,
        "suspicious_token_ratio": quality.suspicious_token_ratio,
        "confidence_proxy": quality.confidence_proxy,
        "dictionary_hit_ratio": quality.dictionary_hit_ratio,
        "per_page_ocr": decision.per_page_ocr,
    }
    metadata.update(ocr_stats)
    return DoclingConversionResult(markdown=markdown, pages=pages, metadata=metadata)


def build_chunks_page(
    doc_id: str,
    pages: List[Dict[str, Any]],
    postprocess: Optional[Callable[[str], str]] = None,
) -> List[Dict[str, Any]]:
    chunks: List[Dict[str, Any]] = []
    for page in pages:
        raw_text = str(page.get("text", ""))
        if postprocess:
            raw_text = postprocess(raw_text)
        cleaned = normalize_text(raw_text)
        if not cleaned:
            continue
        page_num = int(page.get("page_num", 0))
        chunk_id = f"p{page_num}"
        chunks.append({
            "chunk_id": chunk_id,
            "text": cleaned,
            "page_start": page_num,
            "page_end": page_num,
            "section": "",
            "char_count": len(cleaned),
        })
    return chunks


def build_chunks_section(
    doc_id: str,
    markdown: str,
    pages: List[Dict[str, Any]],
    config: Optional[DoclingProcessingConfig] = None,
    postprocess: Optional[Callable[[str], str]] = None,
) -> List[Dict[str, Any]]:
    sections = split_markdown_sections(markdown)
    chunks: List[Dict[str, Any]] = []
    seen_ids: Dict[str, int] = {}

    if not sections:
        return build_chunks_page(doc_id, pages)

    for idx, section in enumerate(sections, start=1):
        title = section.get("title", "")
        text = section.get("text", "")
        if postprocess:
            text = postprocess(text)
        cleaned = normalize_text(text)
        if not cleaned:
            continue
        page_start, page_end = find_page_range(cleaned, pages, config)
        base_id = slugify(title) or f"section-{idx}"
        if base_id in seen_ids:
            seen_ids[base_id] += 1
            chunk_id = f"{base_id}-{seen_ids[base_id]}"
        else:
            seen_ids[base_id] = 1
            chunk_id = base_id
        chunks.append({
            "chunk_id": chunk_id,
            "text": cleaned,
            "page_start": page_start,
            "page_end": page_end,
            "section": title,
            "char_count": len(cleaned),
        })
    return chunks


def main() -> int:
    parser = argparse.ArgumentParser(description="Extract PDF content with Docling and produce chunks.")
    parser.add_argument("--pdf", required=True, help="Path to PDF")
    parser.add_argument("--doc-id", help="Document identifier")
    parser.add_argument("--out-json", help="Output JSON path")
    parser.add_argument("--out-md", help="Output markdown path")
    parser.add_argument("--chunking", choices=["page", "section"], default="page")
    parser.add_argument("--ocr", choices=["auto", "force", "off"], default="auto")
    parser.add_argument("--language-hint", help="Language hint for OCR/quality (e.g., eng, deu, deu+eng)")
    parser.add_argument(
        "--force-ocr-low-quality",
        action="store_true",
        help="Force OCR when text layer appears low quality",
    )
    parser.add_argument(
        "--quality-threshold",
        type=float,
        help="Confidence threshold for treating text as low quality (0-1)",
    )
    parser.add_argument("--quality-only", action="store_true", help="Output text-layer quality JSON and exit")
    parser.add_argument("--enable-llm-cleanup", action="store_true", help="Enable LLM cleanup for low-quality chunks")
    parser.add_argument("--llm-cleanup-base-url", help="OpenAI-compatible base URL for LLM cleanup")
    parser.add_argument("--llm-cleanup-api-key", help="API key for LLM cleanup")
    parser.add_argument("--llm-cleanup-model", help="Model name for LLM cleanup")
    parser.add_argument("--llm-cleanup-temperature", type=float, help="Temperature for LLM cleanup")
    parser.add_argument("--llm-cleanup-max-chars", type=int, help="Max chars per chunk for LLM cleanup")
    parser.add_argument("--llm-cleanup-min-quality", type=float, help="Min quality threshold for LLM cleanup")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO)

    if not os.path.isfile(args.pdf):
        eprint(f"PDF not found: {args.pdf}")
        return 2

    if args.quality_only:
        config = DoclingProcessingConfig(ocr_mode=args.ocr)
        if args.force_ocr_low_quality:
            config.force_ocr_on_low_quality_text = True
        if args.quality_threshold is not None:
            config.quality_confidence_threshold = args.quality_threshold
        report = build_quality_report(args.pdf, config)
        print(json.dumps(report))
        return 0

    if not args.doc_id or not args.out_json or not args.out_md:
        eprint("Missing required arguments: --doc-id, --out-json, --out-md")
        return 2

    try:
        out_json_dir = os.path.dirname(args.out_json)
        out_md_dir = os.path.dirname(args.out_md)
        if out_json_dir:
            os.makedirs(out_json_dir, exist_ok=True)
        if out_md_dir:
            os.makedirs(out_md_dir, exist_ok=True)
    except Exception as exc:
        eprint(f"Failed to create output directories: {exc}")
        return 2

    config = DoclingProcessingConfig(ocr_mode=args.ocr)
    if args.force_ocr_low_quality:
        config.force_ocr_on_low_quality_text = True
    if args.quality_threshold is not None:
        config.quality_confidence_threshold = args.quality_threshold
    if args.language_hint:
        config.language_hint = args.language_hint
    if args.enable_llm_cleanup:
        config.enable_llm_correction = True
    if args.llm_cleanup_base_url:
        config.llm_cleanup_base_url = args.llm_cleanup_base_url
    if args.llm_cleanup_api_key:
        config.llm_cleanup_api_key = args.llm_cleanup_api_key
    if args.llm_cleanup_model:
        config.llm_cleanup_model = args.llm_cleanup_model
    if args.llm_cleanup_temperature is not None:
        config.llm_cleanup_temperature = args.llm_cleanup_temperature
    if args.llm_cleanup_max_chars is not None:
        config.llm_correction_max_chars = args.llm_cleanup_max_chars
    if args.llm_cleanup_min_quality is not None:
        config.llm_correction_min_quality = args.llm_cleanup_min_quality

    config.llm_correct = build_llm_cleanup_callback(config)

    try:
        conversion = convert_pdf_with_docling(args.pdf, config)
    except Exception as exc:
        eprint(f"Docling conversion failed: {exc}")
        return 2

    markdown = conversion.markdown
    if config.enable_post_correction and config.postprocess_markdown and conversion.metadata.get("ocr_used"):
        wordlist = prepare_dictionary_words(config)
        languages = conversion.metadata.get("languages", config.default_lang_english)
        markdown = postprocess_text(markdown, config, languages, wordlist)

    try:
        with open(args.out_md, "w", encoding="utf-8") as handle:
            handle.write(markdown)
    except Exception as exc:
        eprint(f"Failed to write markdown: {exc}")
        return 2

    try:
        pages = conversion.pages
        languages = conversion.metadata.get("languages", config.default_lang_english)
        postprocess_fn: Optional[Callable[[str], str]] = None
        if config.enable_post_correction and conversion.metadata.get("ocr_used"):
            wordlist = prepare_dictionary_words(config)
            postprocess_fn = lambda text: postprocess_text(text, config, languages, wordlist)

        if postprocess_fn:
            pages = [
                {"page_num": page.get("page_num", idx + 1), "text": postprocess_fn(str(page.get("text", "")))}
                for idx, page in enumerate(pages)
            ]

        if args.chunking == "section":
            chunks = build_chunks_section(
                args.doc_id,
                markdown,
                pages,
                config=config,
                postprocess=postprocess_fn,
            )
        else:
            chunks = build_chunks_page(args.doc_id, pages)
    except Exception as exc:
        eprint(f"Failed to build chunks: {exc}")
        return 2

    chunks = [chunk for chunk in chunks if chunk.get("text")]

    payload = {
        "doc_id": args.doc_id,
        "source_pdf": args.pdf,
        "chunks": chunks,
        "metadata": conversion.metadata,
    }

    try:
        with open(args.out_json, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, indent=2)
    except Exception as exc:
        eprint(f"Failed to write JSON: {exc}")
        return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())
