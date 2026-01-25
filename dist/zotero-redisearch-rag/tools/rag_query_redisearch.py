#!/usr/bin/env python3

import argparse
import json
import math
from utils_embedding import normalize_vector, vector_to_bytes, request_embedding
import re
import struct
import sys
from typing import Any, Dict, List, Optional, Sequence, Set, Tuple

import redis
import requests


def eprint(message: str) -> None:
    sys.stderr.write(message + "\n")

def is_temperature_unsupported(message: str) -> bool:
    lowered = message.lower()
    return "temperature" in lowered and (
        "not supported" in lowered or "unsupported" in lowered or "unknown parameter" in lowered
    )


def is_stream_unsupported(message: str) -> bool:
    lowered = message.lower()
    return "stream" in lowered and ("not supported" in lowered or "unsupported" in lowered or "unknown parameter" in lowered)


def request_chat(
    base_url: str,
    api_key: str,
    model: str,
    temperature: float,
    system_prompt: str,
    user_prompt: str,
) -> str:
    url = base_url.rstrip("/") + "/chat/completions"
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    base_payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }
    payload = dict(base_payload)
    payload["temperature"] = temperature

    response = requests.post(url, json=payload, headers=headers, timeout=120)
    response.encoding = "utf-8"
    if response.status_code >= 400:
        error_text = response.text
        if is_temperature_unsupported(error_text):
            response = requests.post(url, json=base_payload, headers=headers, timeout=120)
            response.encoding = "utf-8"
            if response.status_code >= 400:
                raise RuntimeError(f"Chat request failed: {response.status_code} {response.text}")
        else:
            raise RuntimeError(f"Chat request failed: {response.status_code} {error_text}")

    data = response.json()
    choices = data.get("choices")
    if not choices:
        raise RuntimeError("Chat response missing choices")
    message = choices[0].get("message") or {}
    content = message.get("content")
    if not content:
        raise RuntimeError("Chat response missing content")
    return content


def request_chat_stream(
    base_url: str,
    api_key: str,
    model: str,
    temperature: float,
    system_prompt: str,
    user_prompt: str,
    on_delta,
) -> str:
    url = base_url.rstrip("/") + "/chat/completions"
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    base_payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "stream": True,
    }
    payload = dict(base_payload)
    payload["temperature"] = temperature

    response = requests.post(url, json=payload, headers=headers, timeout=120, stream=True)
    response.encoding = "utf-8"
    if response.status_code >= 400:
        error_text = response.text
        if is_temperature_unsupported(error_text):
            response = requests.post(url, json=base_payload, headers=headers, timeout=120, stream=True)
            response.encoding = "utf-8"
            if response.status_code >= 400:
                raise RuntimeError(f"Chat request failed: {response.status_code} {response.text}")
        else:
            raise RuntimeError(f"Chat request failed: {response.status_code} {error_text}")

    content_parts: List[str] = []
    for raw_line in response.iter_lines(decode_unicode=True):
        if not raw_line:
            continue
        line = raw_line.strip()
        if not line.startswith("data:"):
            continue
        data = line[5:].strip()
        if data == "[DONE]":
            break
        try:
            payload = json.loads(data)
        except Exception:
            continue
        choices = payload.get("choices") or []
        if not choices:
            continue
        delta = choices[0].get("delta") or {}
        piece = delta.get("content")
        if not piece:
            continue
        content_parts.append(piece)
        on_delta(piece)

    return "".join(content_parts)


def parse_json_list(raw: str) -> List[str]:
    if not raw:
        return []
    text = raw.strip()
    try:
        data = json.loads(text)
    except Exception:
        data = None
    if isinstance(data, dict):
        for key in ("queries", "expanded", "expansions", "items"):
            if isinstance(data.get(key), list):
                data = data.get(key)
                break
    if isinstance(data, list):
        cleaned: List[str] = []
        for item in data:
            if isinstance(item, str):
                value = item.strip()
                if value:
                    cleaned.append(value)
        return cleaned
    # Fallback: split lines or bullets
    lines = [line.strip(" -\t") for line in text.splitlines()]
    return [line for line in lines if line]


def expand_query(
    base_url: str,
    api_key: str,
    model: str,
    query: str,
    count: int,
) -> List[str]:
    if not base_url or not model or not query or count <= 0:
        return []
    system_prompt = (
        "You expand search queries for retrieval. "
        "Return only a JSON array of strings with concise alternative queries. "
        "Do not include the original query."
    )
    user_prompt = (
        f"Original query: {query}\n"
        f"Return {count} expanded queries as a JSON array of strings."
    )
    try:
        response = request_chat(base_url, api_key, model, 0.0, system_prompt, user_prompt)
        expanded = parse_json_list(response)
    except Exception as exc:
        eprint(f"Query expansion failed: {exc}")
        return []
    cleaned: List[str] = []
    seen: Set[str] = set()
    for item in expanded:
        value = item.strip()
        if not value:
            continue
        key = value.lower()
        if key in seen or key == query.lower():
            continue
        seen.add(key)
        cleaned.append(value)
        if len(cleaned) >= count:
            break
    return cleaned


def load_reranker(model_name: str):
    try:
        from sentence_transformers import CrossEncoder  # type: ignore
    except Exception as exc:
        eprint(f"Reranker unavailable (sentence-transformers not installed): {exc}")
        return None
    try:
        return CrossEncoder(model_name)
    except Exception as exc:
        eprint(f"Failed to load reranker model '{model_name}': {exc}")
        return None


def truncate_rerank_text(text: str, max_chars: int) -> str:
    if max_chars <= 0:
        return text
    cleaned = text.strip()
    if len(cleaned) <= max_chars:
        return cleaned
    trimmed = cleaned[:max_chars]
    last_space = trimmed.rfind(" ")
    if last_space > 0:
        trimmed = trimmed[:last_space]
    return trimmed.rstrip() + "..."


def rerank_candidates(
    reranker,
    query: str,
    candidates: List[Dict[str, Any]],
    max_chars: int,
) -> List[Dict[str, Any]]:
    if reranker is None:
        return candidates
    pairs: List[List[str]] = []
    items: List[Dict[str, Any]] = []
    for item in candidates:
        text = str(item.get("text", "") or "").strip()
        if not text:
            continue
        trimmed = truncate_rerank_text(text, max_chars)
        pairs.append([query, trimmed])
        items.append(item)
    if not pairs:
        return candidates
    try:
        scores = reranker.predict(pairs)
    except Exception as exc:
        eprint(f"Reranking failed: {exc}")
        return candidates
    scored: List[Tuple[float, int, Dict[str, Any]]] = []
    for idx, item in enumerate(items):
        try:
            score = float(scores[idx])
        except Exception:
            score = 0.0
        item["rerank_score"] = score
        scored.append((score, idx, item))
    scored.sort(key=lambda row: (-row[0], row[1]))
    return [row[2] for row in scored]


def decode_value(value: Any) -> Any:
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="ignore")
    return value


def parse_results(raw: List[Any]) -> List[Dict[str, Any]]:
    results: List[Dict[str, Any]] = []
    if not raw or len(raw) < 2:
        return results

    for idx in range(1, len(raw), 2):
        if idx + 1 >= len(raw):
            break
        fields_raw = raw[idx + 1]
        if not isinstance(fields_raw, list):
            continue
        field_map: Dict[str, Any] = {}
        for i in range(0, len(fields_raw), 2):
            key = decode_value(fields_raw[i])
            value = decode_value(fields_raw[i + 1]) if i + 1 < len(fields_raw) else ""
            field_map[str(key)] = value
        results.append(field_map)
    return results


FIELD_TYPE_CACHE: Dict[str, Dict[str, str]] = {}


def parse_info_map(info: Any) -> Dict[str, Any]:
    if not isinstance(info, (list, tuple)):
        return {}
    it = iter(info)
    result: Dict[str, Any] = {}
    for key in it:
        value = next(it, None)
        result[str(decode_value(key))] = value
    return result


def get_field_types(client: redis.Redis, index: str) -> Dict[str, str]:
    if index in FIELD_TYPE_CACHE:
        return FIELD_TYPE_CACHE[index]
    try:
        info = client.execute_command("FT.INFO", index)
    except Exception:
        return {}
    info_map = parse_info_map(info)
    attributes = info_map.get("attributes") or info_map.get("fields") or []
    field_types: Dict[str, str] = {}
    if isinstance(attributes, (list, tuple)):
        for attr in attributes:
            if not isinstance(attr, (list, tuple)):
                continue
            attr_map: Dict[str, Any] = {}
            for i in range(0, len(attr) - 1, 2):
                attr_map[str(decode_value(attr[i]))] = decode_value(attr[i + 1])
            name = attr_map.get("identifier") or attr_map.get("attribute") or attr_map.get("name")
            ftype = attr_map.get("type")
            if name and ftype:
                field_types[str(name)] = str(ftype).upper()
    FIELD_TYPE_CACHE[index] = field_types
    return field_types


def get_index_vector_dim(
    client: redis.Redis, index_name: str, field_name: str = "embedding"
) -> Optional[int]:
    try:
        info = client.execute_command("FT.INFO", index_name)
    except Exception:
        return None
    info_map = parse_info_map(info)
    attributes = info_map.get("attributes") or info_map.get("fields") or []
    if not isinstance(attributes, (list, tuple)):
        return None
    for attr in attributes:
        if not isinstance(attr, (list, tuple)):
            continue
        attr_map: Dict[str, Any] = {}
        for i in range(0, len(attr) - 1, 2):
            attr_map[str(decode_value(attr[i]))] = decode_value(attr[i + 1])
        name = attr_map.get("attribute") or attr_map.get("identifier") or attr_map.get("name")
        if name != field_name:
            continue
        if str(attr_map.get("type", "")).upper() != "VECTOR":
            continue
        dim_value = attr_map.get("dimension") or attr_map.get("dim")
        try:
            return int(dim_value)
        except Exception:
            return None
    return None


_QUERY_STOPWORDS = {
    "the", "and", "for", "with", "that", "this", "from", "into", "over",
    "under", "after", "before", "were", "was", "are", "is", "its", "their",
    "then", "than", "which", "when", "where", "have", "has", "had", "onto",
    "upon", "your", "yours", "they", "them", "these", "those", "will", "would",
    "could", "should", "about", "there", "here", "while", "what", "why", "how",
    "not", "but", "you", "your", "our", "ours", "his", "her", "she", "him",
    "also", "such", "been", "being", "out", "one", "two", "three", "four",
    "five", "six", "seven", "eight", "nine", "ten", "more", "most", "some",
    "many", "few", "each", "per", "was", "were", "did", "does", "do",
}


def extract_keywords(query: str) -> List[str]:
    raw_tokens = re.findall(r"[\\w'\\-\u2011]{2,}", query, flags=re.UNICODE)
    keywords: List[str] = []
    def add_keyword(token: str, raw: str) -> None:
        if not token:
            return
        lower = token.lower()
        if lower in _QUERY_STOPWORDS:
            return
        keywords.append(lower)
        raw_lower = raw.lower()
        if raw_lower.endswith(("'s", "\u2019s")) and len(lower) > 3:
            stem = lower[:-1]
            if stem and stem not in _QUERY_STOPWORDS:
                keywords.append(stem)

    for token in raw_tokens:
        cleaned = "".join(ch for ch in token if ch.isalnum())
        if not cleaned:
            continue
        if token[:1].isupper() or len(cleaned) >= 5:
            add_keyword(cleaned, token)
        if "-" in token or "\u2011" in token:
            for part in re.split(r"[-\u2011]+", token):
                part_clean = "".join(ch for ch in part if ch.isalnum())
                if not part_clean:
                    continue
                if part[:1].isupper() or len(part_clean) >= 4:
                    add_keyword(part_clean, part)
    seen = set()
    ordered: List[str] = []
    for token in keywords:
        if token in seen:
            continue
        seen.add(token)
        ordered.append(token)
    return ordered


def normalize_tag_token(tag: str) -> str:
    cleaned = tag.strip().lower()
    cleaned = cleaned.strip("-_,;:•")
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip()


def parse_tag_field(value: Any) -> List[str]:
    if value is None:
        return []
    if isinstance(value, (list, tuple, set)):
        parts = [str(item) for item in value]
    else:
        parts = re.split(r"[|,;]", str(value))
    cleaned: List[str] = []
    for part in parts:
        token = normalize_tag_token(str(part))
        if token:
            cleaned.append(token)
    return cleaned


def tag_tokens_from_tags(tags: Sequence[str]) -> Set[str]:
    tokens: Set[str] = set()
    for tag in tags:
        cleaned = normalize_tag_token(tag)
        if not cleaned:
            continue
        tokens.add(cleaned)
        tokens.update(re.findall(r"[A-Za-z0-9]+", cleaned))
    return tokens


def apply_tag_boosting(
    results: List[Dict[str, Any]],
    keywords: Sequence[str],
) -> List[Dict[str, Any]]:
    if not results or not keywords:
        return results
    keyword_set = {token.lower() for token in keywords if token}
    if not keyword_set:
        return results

    scored: List[Tuple[int, int, Dict[str, Any]]] = []
    max_score = 0
    for idx, chunk in enumerate(results):
        chunk_tags = parse_tag_field(chunk.get("chunk_tags", ""))
        item_tags = parse_tag_field(chunk.get("tags", ""))
        chunk_tokens = tag_tokens_from_tags(chunk_tags)
        item_tokens = tag_tokens_from_tags(item_tags)
        chunk_hits = len(keyword_set & chunk_tokens)
        item_hits = len(keyword_set & item_tokens)
        score = (chunk_hits * 2) + item_hits
        max_score = max(max_score, score)
        scored.append((score, idx, chunk))

    if max_score <= 0:
        return results
    scored.sort(key=lambda item: (-item[0], item[1]))
    return [item[2] for item in scored]


def search_redis_knn(
    client: redis.Redis,
    index: str,
    vec: bytes,
    k: int,
) -> List[Dict[str, Any]]:
    raw = client.execute_command(
        "FT.SEARCH",
        index,
        f"*=>[KNN {k} @embedding $vec AS score]",
        "PARAMS",
        "2",
        "vec",
        vec,
        "SORTBY",
        "score",
        "RETURN",
        "11",
        "doc_id",
        "chunk_id",
        "attachment_key",
        "source_pdf",
        "page_start",
        "page_end",
        "section",
        "text",
        "tags",
        "chunk_tags",
        "score",
        "DIALECT",
        "2",
    )
    return parse_results(raw)


def chunk_key(item: Dict[str, Any]) -> str:
    value = item.get("chunk_id")
    if value is None:
        return ""
    return str(value)


def dedupe_by_chunk_id(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    seen: Set[str] = set()
    deduped: List[Dict[str, Any]] = []
    for item in items:
        key = chunk_key(item)
        if not key or key in seen:
            continue
        seen.add(key)
        deduped.append(item)
    return deduped


_MIN_CONTEXT_CHUNKS = 3
_MIN_CONTEXT_CHARS = 1500
_MAX_ACCEPTABLE_SCORE = 0.4
_MIN_NARRATIVE_RATIO = 0.5
_MIN_CONTENT_FOR_RATIO = 4
_RERANK_MAX_CHARS_DEFAULT = 2000
_RRF_K = 60


def retrieve_chunks(
    client: redis.Redis,
    index: str,
    vec: bytes,
    k: int,
    keywords: List[str],
    strict: bool = True,
    rrf_k: int = _RRF_K,
    rrf_log_top: int = 0,
    max_per_doc: int = 0,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    vector_results = search_redis_knn(client, index, vec, k)
    retrieved = vector_results

    lexical_limit = max(k, 5)
    lexical_results = run_lexical_search(client, index, keywords, lexical_limit)
    lexical_ids: Set[str] = set()
    if lexical_results:
        for item in lexical_results:
            key = chunk_key(item)
            if key:
                lexical_ids.add(key)

        max_total = k + lexical_limit
        combined = lexical_results + retrieved
        if len(combined) > max_total:
            combined = combined[:max_total]
        retrieved = dedupe_by_chunk_id(combined)
    else:
        retrieved = dedupe_by_chunk_id(retrieved)

    if strict:
        filtered = [
            c for c in retrieved
            if is_content_chunk(c) and looks_narrative(c.get("text", ""))
        ]
        if not filtered:
            filtered = [c for c in retrieved if is_content_chunk(c)]
    else:
        filtered = [c for c in retrieved if is_content_chunk(c)]
        if not filtered:
            filtered = retrieved

    if lexical_ids:
        seen_ids = {chunk_key(item) for item in filtered if chunk_key(item)}
        for item in lexical_results:
            key = chunk_key(item)
            if not key:
                continue
            if key in seen_ids:
                continue
            text = str(item.get("text", "") or "").strip()
            if not text:
                continue
            filtered.append(item)
            seen_ids.add(key)

    metrics = compute_retrieval_metrics(retrieved, filtered)
    rrf_scores = build_rrf_scores(vector_results, lexical_results, rrf_k=rrf_k)
    ordered = order_by_rrf(filtered, rrf_scores)
    if rrf_log_top > 0:
        log_rrf_top(ordered, rrf_scores, rrf_log_top)
    ordered = apply_tag_boosting(ordered, keywords)
    ordered = apply_doc_cap(ordered, max_per_doc)
    return ordered, metrics


def run_lexical_search(
    client: redis.Redis,
    index: str,
    keywords: List[str],
    limit: int,
) -> List[Dict[str, Any]]:
    if not keywords or limit <= 0:
        return []
    tokens = ["".join(ch for ch in token if ch.isalnum()) for token in keywords]
    tokens = [token for token in tokens if token]
    if not tokens:
        return []
    text_terms = "|".join(tokens)
    tag_terms = "|".join(tokens)
    field_types = get_field_types(client, index)

    def should_include(name: str, required: bool = False) -> bool:
        if field_types:
            return required or name in field_types
        return required

    def field_is_tag(name: str) -> bool:
        return field_types.get(name, "").upper() == "TAG"

    def format_term(name: str) -> str:
        field = f"@{name}"
        if field_is_tag(name):
            return f"{field}:{{{tag_terms}}}"
        return f"{field}:({text_terms})"

    parts: List[Tuple[str, str]] = []
    if should_include("text", required=True):
        parts.append(("text", format_term("text")))
    if should_include("title"):
        parts.append(("title", format_term("title")))
    if should_include("authors"):
        parts.append(("authors", format_term("authors")))
    if should_include("tags"):
        parts.append(("tags", format_term("tags")))
    if should_include("chunk_tags"):
        parts.append(("chunk_tags", format_term("chunk_tags")))
    if should_include("doc_id"):
        parts.append(("doc_id", format_term("doc_id")))
    if not parts:
        return []
    query = "(" + " OR ".join(clause for _name, clause in parts) + ")"

    def run_search(query_text: str) -> Tuple[List[Dict[str, Any]], int]:
        raw = client.execute_command(
            "FT.SEARCH",
            index,
            query_text,
            "LIMIT",
            "0",
            str(limit),
            "RETURN",
            "11",
            "doc_id",
            "chunk_id",
            "attachment_key",
            "source_pdf",
            "page_start",
            "page_end",
            "section",
            "text",
            "tags",
            "chunk_tags",
            "score",
            "DIALECT",
            "2",
        )
        total = 0
        if isinstance(raw, list) and raw:
            try:
                total = int(raw[0])
            except Exception:
                total = 0
        return parse_results(raw), total

    def dedupe_results(results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        seen: Set[str] = set()
        merged: List[Dict[str, Any]] = []
        for item in results:
            chunk_id = item.get("chunk_id")
            if not chunk_id:
                continue
            cid = str(chunk_id)
            if cid in seen:
                continue
            seen.add(cid)
            merged.append(item)
            if limit > 0 and len(merged) >= limit:
                break
        return merged

    try:
        results, total = run_search(query)
        if total == 0:
            fallback_results: List[Dict[str, Any]] = []
            for _name, clause in parts:
                try:
                    field_results, _ = run_search(clause)
                    fallback_results.extend(field_results)
                except Exception:
                    continue
            merged = dedupe_results(fallback_results)
            if merged:
                return merged
        return results
    except Exception:
        fallback_results = []
        for _name, clause in parts:
            try:
                field_results, _ = run_search(clause)
                fallback_results.extend(field_results)
            except Exception:
                continue
        return dedupe_results(fallback_results)

def is_content_chunk(chunk: Dict[str, Any]) -> bool:
    text = chunk.get("text", "")
    if not text:
        return False

    # 1. Minimum length (filters title pages, citations)
    if len(text) < 500:
        return False

    # 2. Must contain narrative sentences
    # (bibliographies rarely have multiple full sentences)
    if text.count(". ") < 3:
        return False

    return True

def looks_narrative(text: str) -> bool:
    if not text:
        return False

    # Must contain several complete sentences
    if text.count(". ") < 4:
        return False

    # Optional: avoid list-like text
    if text.count("\n") > len(text) / 80:
        return False

    return True

def parse_score(value: Any) -> Optional[float]:
    if value is None:
        return None
    try:
        return float(value)
    except Exception:
        return None


def compute_retrieval_metrics(
    raw: List[Dict[str, Any]],
    filtered: List[Dict[str, Any]],
) -> Dict[str, Any]:
    content_chunks = [chunk for chunk in raw if is_content_chunk(chunk)]
    narrative_chunks = [
        chunk for chunk in content_chunks if looks_narrative(chunk.get("text", ""))
    ]
    scores = [parse_score(chunk.get("score")) for chunk in raw]
    scores = [score for score in scores if score is not None]
    return {
        "raw_total": len(raw),
        "content_total": len(content_chunks),
        "narrative_total": len(narrative_chunks),
        "filtered_total": len(filtered),
        "filtered_chars": sum(len(str(chunk.get("text", ""))) for chunk in filtered),
        "best_score": min(scores) if scores else None,
    }

def is_short_query(query: str) -> bool:
    tokens = re.findall(r"[\\w]+", query, flags=re.UNICODE)
    tokens = [token for token in tokens if token]
    return len(tokens) <= 3


def should_broaden_retrieval(metrics: Dict[str, Any], k: int) -> Tuple[bool, List[str]]:
    reasons: List[str] = []
    min_chunks = min(_MIN_CONTEXT_CHUNKS, max(1, k))
    if metrics.get("filtered_total", 0) < min_chunks:
        reasons.append("few_chunks")
    if metrics.get("filtered_chars", 0) < _MIN_CONTEXT_CHARS:
        reasons.append("short_context")
    best_score = metrics.get("best_score")
    if best_score is not None and best_score > _MAX_ACCEPTABLE_SCORE:
        reasons.append("weak_scores")
    content_total = metrics.get("content_total", 0)
    filtered_total = metrics.get("filtered_total", 0)
    if content_total >= _MIN_CONTENT_FOR_RATIO:
        ratio = filtered_total / max(1, content_total)
        if ratio < _MIN_NARRATIVE_RATIO:
            reasons.append("narrative_filtered")
    return bool(reasons), reasons


def build_rrf_scores(
    vector_results: Sequence[Dict[str, Any]],
    lexical_results: Sequence[Dict[str, Any]],
    rrf_k: int = _RRF_K,
) -> Dict[str, float]:
    rrf_k = max(1, int(rrf_k))
    scores: Dict[str, float] = {}
    for rank, item in enumerate(vector_results, start=1):
        key = chunk_key(item)
        if not key:
            continue
        scores[key] = scores.get(key, 0.0) + 1.0 / (rrf_k + rank)
    for rank, item in enumerate(lexical_results, start=1):
        key = chunk_key(item)
        if not key:
            continue
        scores[key] = scores.get(key, 0.0) + 1.0 / (rrf_k + rank)
    return scores


def order_by_rrf(
    candidates: List[Dict[str, Any]],
    rrf_scores: Dict[str, float],
) -> List[Dict[str, Any]]:
    if not candidates or not rrf_scores:
        return candidates
    scored: List[Tuple[float, int, Dict[str, Any]]] = []
    for idx, item in enumerate(candidates):
        key = chunk_key(item)
        score = rrf_scores.get(key, 0.0) if key else 0.0
        scored.append((score, idx, item))
    scored.sort(key=lambda row: (-row[0], row[1]))
    return [row[2] for row in scored]


def apply_doc_cap(
    results: List[Dict[str, Any]],
    max_per_doc: int,
) -> List[Dict[str, Any]]:
    if max_per_doc <= 0 or not results:
        return results
    capped: List[Dict[str, Any]] = []
    counts: Dict[str, int] = {}
    for item in results:
        doc_id = str(item.get("doc_id", "") or "")
        if not doc_id:
            capped.append(item)
            continue
        count = counts.get(doc_id, 0)
        if count >= max_per_doc:
            continue
        counts[doc_id] = count + 1
        capped.append(item)
    return capped


def log_rrf_top(
    ordered: Sequence[Dict[str, Any]],
    rrf_scores: Dict[str, float],
    top_n: int,
) -> None:
    if top_n <= 0 or not ordered:
        return
    limit = min(top_n, len(ordered))
    eprint(f"RRF top {limit}:")
    for idx, item in enumerate(ordered[:limit], start=1):
        key = chunk_key(item)
        score = rrf_scores.get(key, 0.0) if key else 0.0
        doc_id = item.get("doc_id", "")
        chunk_id = item.get("chunk_id", "")
        vector_score = item.get("score", "")
        eprint(
            f"  {idx}. rrf={score:.6f} doc_id={doc_id} chunk_id={chunk_id} score={vector_score}"
        )


def retrieve_with_broadening(
    client: redis.Redis,
    index: str,
    vec: bytes,
    k: int,
    keywords: List[str],
    rrf_k: int = _RRF_K,
    rrf_log_top: int = 0,
    max_per_doc: int = 0,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    retrieved, metrics = retrieve_chunks(
        client,
        index,
        vec,
        k,
        keywords,
        strict=True,
        rrf_k=rrf_k,
        rrf_log_top=rrf_log_top,
        max_per_doc=max_per_doc,
    )
    broaden, _ = should_broaden_retrieval(metrics, k)
    if broaden:
        fallback_k = max(k * 2, 12)
        try:
            retrieved, _ = retrieve_chunks(
                client,
                index,
                vec,
                fallback_k,
                keywords,
                strict=False,
                rrf_k=rrf_k,
                rrf_log_top=rrf_log_top,
                max_per_doc=max_per_doc,
            )
        except Exception as exc:
            eprint(f"Fallback retrieval failed: {exc}")
    return retrieved, metrics

def build_context(retrieved: List[Dict[str, Any]]) -> str:
    blocks = []
    for chunk in retrieved:
        doc_id = chunk.get("doc_id", "")
        chunk_id = chunk.get("chunk_id", "")
        source_pdf = chunk.get("source_pdf", "")
        page_start = chunk.get("page_start", "")
        page_end = chunk.get("page_end", "")
        score = chunk.get("score", "")
        text = chunk.get("text", "")
        pages = f"{page_start}-{page_end}"
        block = (
            f"<Document source='{source_pdf}' pages='{pages}' doc_id='{doc_id}' "
            f"chunk_id='{chunk_id}' score='{score}'>\n{text}\n</Document>"
        )
        blocks.append(block)
    return "\n\n".join(blocks)


def load_history_messages(path: str) -> List[Dict[str, Any]]:
    if not path:
        return []
    try:
        with open(path, "r", encoding="utf-8") as handle:
            payload = json.load(handle)
    except Exception:
        return []
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    messages = payload.get("messages") if isinstance(payload, dict) else None
    if isinstance(messages, list):
        return [item for item in messages if isinstance(item, dict)]
    return []


def format_history_block(messages: List[Dict[str, Any]]) -> str:
    lines: List[str] = []
    for message in messages:
        role = str(message.get("role", "")).strip().lower()
        content = str(message.get("content", "")).strip()
        if not content:
            continue
        if role not in ("user", "assistant"):
            role = "user"
        label = "User" if role == "user" else "Assistant"
        lines.append(f"{label}: {content}")
    return "\n".join(lines)


def extract_annotation_key(chunk_id: str) -> str:
    if not chunk_id:
        return ""
    if ":" in chunk_id:
        chunk_id = chunk_id.split(":", 1)[1]
    candidate = chunk_id.strip().upper()
    if re.fullmatch(r"[A-Z0-9]{8}", candidate):
        return candidate
    return ""


def build_citations(retrieved: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    seen = set()
    citations: List[Dict[str, Any]] = []
    for chunk in retrieved:
        doc_id = chunk.get("doc_id", "")
        chunk_id = chunk.get("chunk_id", "")
        attachment_key = chunk.get("attachment_key", "")
        page_start = chunk.get("page_start", "")
        page_end = chunk.get("page_end", "")
        source_pdf = chunk.get("source_pdf", "")
        key = (doc_id, attachment_key, page_start, page_end, source_pdf)
        if key in seen:
            continue
        seen.add(key)
        annotation_key = extract_annotation_key(str(chunk_id))
        citations.append({
            "doc_id": doc_id,
            "chunk_id": chunk_id,
            "attachment_key": attachment_key,
            "annotation_key": annotation_key or None,
            "page_start": page_start,
            "page_end": page_end,
            "pages": f"{page_start}-{page_end}",
            "source_pdf": source_pdf,
        })
    return citations


def main() -> int:
    parser = argparse.ArgumentParser(description="Query RedisSearch and answer with RAG.")
    parser.add_argument("--query", required=True)
    parser.add_argument("--k", type=int, default=10)
    parser.add_argument("--redis-url", required=True)
    parser.add_argument("--index", required=True)
    parser.add_argument("--embed-base-url", required=True)
    parser.add_argument("--embed-api-key", default="")
    parser.add_argument("--embed-model", required=True)
    parser.add_argument("--chat-base-url", required=True)
    parser.add_argument("--chat-api-key", default="")
    parser.add_argument("--chat-model", required=True)
    parser.add_argument("--temperature", type=float, default=0.2)
    parser.add_argument("--stream", action="store_true")
    parser.add_argument("--history-file", help="Optional JSON file with recent chat history")
    parser.add_argument("--expand-query", action="store_true")
    parser.add_argument("--expand-count", type=int, default=3)
    parser.add_argument("--rerank", action="store_true")
    parser.add_argument("--rerank-model", default="BAAI/bge-reranker-v2-m3")
    parser.add_argument("--rerank-candidates", type=int, default=4)
    parser.add_argument("--rerank-max-chars", type=int, default=_RERANK_MAX_CHARS_DEFAULT)
    parser.add_argument("--rrf-k", type=int, default=_RRF_K)
    parser.add_argument("--rrf-log-top", type=int, default=0)
    parser.add_argument("--max-per-doc", type=int, default=0)
    args = parser.parse_args()

    client = redis.Redis.from_url(args.redis_url, decode_responses=False)
    use_combo = bool(args.expand_query or args.rerank)
    expanded_queries: List[str] = []
    raw_query = args.query
    query_for_display = raw_query
    index_dim_cache: Optional[int] = None
    rrf_k = max(1, int(args.rrf_k or _RRF_K))
    rrf_log_top = max(0, int(args.rrf_log_top or 0))
    max_per_doc = max(0, int(args.max_per_doc or 0))

    def embed_query(query_text: str) -> bytes:
        nonlocal client, index_dim_cache
        embedding = request_embedding(args.embed_base_url, args.embed_api_key, args.embed_model, query_text)
        embedding_dim = len(embedding)
        if index_dim_cache is None:
            index_dim_cache = get_index_vector_dim(client, args.index)
        if index_dim_cache and index_dim_cache != embedding_dim:
            raise RuntimeError(f"Embedding dim mismatch: index={index_dim_cache} model={embedding_dim}")
        embedding = normalize_vector(embedding)
        return vector_to_bytes(embedding)

    if use_combo:
        if args.expand_query:
            expanded_queries = expand_query(
                args.chat_base_url,
                args.chat_api_key,
                args.chat_model,
                raw_query,
                max(1, int(args.expand_count or 0)),
            )
        if expanded_queries:
            query_for_display = expanded_queries[0]
        candidate_multiplier = max(1, int(args.rerank_candidates or 1))
        base_k = max(1, int(args.k))
        if is_short_query(raw_query):
            base_k = max(base_k, 12)
        candidate_k = max(base_k * candidate_multiplier, base_k)
        query_variants = [raw_query] + expanded_queries
        candidates_map: Dict[str, Dict[str, Any]] = {}
        try:
            for variant in query_variants:
                vec = embed_query(variant)
                keywords = extract_keywords(variant)
                retrieved_variant, _ = retrieve_with_broadening(
                    client,
                    args.index,
                    vec,
                    candidate_k,
                    keywords,
                    rrf_k=rrf_k,
                    rrf_log_top=rrf_log_top,
                    max_per_doc=0,
                )
                for item in retrieved_variant:
                    key = chunk_key(item)
                    if not key:
                        continue
                    existing = candidates_map.get(key)
                    if not existing:
                        candidates_map[key] = item
                        continue
                    score_new = parse_score(item.get("score"))
                    score_old = parse_score(existing.get("score"))
                    if score_new is not None and (score_old is None or score_new < score_old):
                        candidates_map[key] = item
        except Exception as exc:
            eprint(f"RedisSearch query failed: {exc}")
            return 2

        candidates = list(candidates_map.values())
        if args.rerank:
            rerank_query = query_for_display or raw_query
            reranker = load_reranker(args.rerank_model)
            reranked = rerank_candidates(
                reranker,
                rerank_query,
                candidates,
                max(200, int(args.rerank_max_chars or _RERANK_MAX_CHARS_DEFAULT)),
            )
            retrieved = apply_doc_cap(reranked, max_per_doc)[:base_k]
        else:
            ordered = apply_tag_boosting(candidates, extract_keywords(raw_query))
            retrieved = apply_doc_cap(ordered, max_per_doc)[:base_k]
    else:
        try:
            vec = embed_query(raw_query)
        except Exception as exc:
            eprint(f"Failed to embed query: {exc}")
            return 2
        keywords = extract_keywords(raw_query)
        base_k = args.k
        if is_short_query(raw_query):
            base_k = max(base_k, 12)
        try:
            retrieved, _ = retrieve_with_broadening(
                client,
                args.index,
                vec,
                base_k,
                keywords,
                rrf_k=rrf_k,
                rrf_log_top=rrf_log_top,
                max_per_doc=max_per_doc,
            )
        except Exception as exc:
            eprint(f"RedisSearch query failed: {exc}")
            return 2

    context = build_context(retrieved)

    system_prompt = (
        "Use ONLY the provided context for factual claims. If insufficient, say you do not know. "
        "Chat history is only for conversational continuity or for providing concepts to be retrieved. "
        "Add inline citations using this exact format: [[cite:DOC_ID:PAGE_START-PAGE_END]]. "
        "Example: ... [[cite:ABC123:12-13]]."
    )
    history_messages = load_history_messages(args.history_file) if args.history_file else []
    history_block = format_history_block(history_messages)
    if history_block:
        history_block = f"Chat history (for reference only):\n{history_block}\n\n"
    def build_user_prompt(context_block: str) -> str:
        return f"{history_block}Question: {args.query}\n\nContext:\n{context_block}"

    user_prompt = build_user_prompt(context)

    citations = build_citations(retrieved)

    answer = ""
    streamed = False
    if args.stream:
        def emit(obj: Dict[str, Any]) -> None:
            print(json.dumps(obj, ensure_ascii=False), flush=True)

        try:
            answer = request_chat_stream(
                args.chat_base_url,
                args.chat_api_key,
                args.chat_model,
                args.temperature,
                system_prompt,
                user_prompt,
                lambda chunk: emit({"type": "delta", "content": chunk}),
            )
            streamed = True
        except Exception as exc:
            if is_stream_unsupported(str(exc)):
                streamed = False
            else:
                eprint(f"Chat request failed: {exc}")
                return 2

    if not streamed:
        try:
            answer = request_chat(
                args.chat_base_url,
                args.chat_api_key,
                args.chat_model,
                args.temperature,
                system_prompt,
                user_prompt,
            )
        except Exception as exc:
            eprint(f"Chat request failed: {exc}")
            return 2

    output = {
        "query": query_for_display,
        "raw_query": raw_query if expanded_queries else "",
        "expanded_queries": expanded_queries,
        "rerank_used": bool(args.rerank),
        "rerank_model": args.rerank_model if args.rerank else "",
        "answer": answer,
        "citations": citations,
        "retrieved": retrieved,
    }

    if args.stream and streamed:
        print(json.dumps({"type": "final", **output}, ensure_ascii=False), flush=True)
    else:
        print(json.dumps(output, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
