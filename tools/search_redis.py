#!/usr/bin/env python3

import argparse
import json
import re
import sys
from typing import Any, Dict, List, Tuple

import redis


def eprint(message: str) -> None:
    sys.stderr.write(message + "\n")


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


def format_field_types(field_types: Dict[str, str]) -> str:
    if not field_types:
        return "{}"
    ordered = ", ".join(f"{key}:{field_types[key]}" for key in sorted(field_types.keys()))
    return "{" + ordered + "}"


def build_query_parts(tokens: List[str], field_types: Dict[str, str]) -> List[Tuple[str, str]]:
    text_terms = "|".join(tokens)
    tag_terms = "|".join(tokens)

    def field_is_tag(name: str) -> bool:
        return field_types.get(name, "").upper() == "TAG"

    def should_include(name: str, required: bool = False) -> bool:
        if field_types:
            return required or name in field_types
        return required

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
    return parts


def build_query(term: str, raw: bool, field_types: Dict[str, str]) -> Tuple[str, List[Tuple[str, str]]]:
    term = term.strip()
    if not term:
        return "", []
    if raw:
        return term, []
    raw_tokens = re.findall(r"[\w'\-]{2,}", term, flags=re.UNICODE)
    tokens: List[str] = []
    for token in raw_tokens:
        cleaned = "".join(ch for ch in token if ch.isalnum())
        if not cleaned:
            continue
        tokens.append(cleaned)
        if token.lower().endswith(("'s", "\u2019s")) and len(cleaned) > 3:
            stem = cleaned[:-1]
            if stem:
                tokens.append(stem)
    tokens = [token for token in tokens if token]
    if not tokens:
        return "", []
    parts = build_query_parts(tokens, field_types)
    if not parts:
        return "", []
    return "(" + " OR ".join(term for _name, term in parts) + ")", parts


def run_search(
    client: redis.Redis,
    index: str,
    query: str,
    offset: int,
    limit: int,
) -> List[Any]:
    return client.execute_command(
        "FT.SEARCH",
        index,
        query,
        "LIMIT",
        str(max(0, offset)),
        str(max(1, limit)),
        "RETURN",
        "15",
        "doc_id",
        "chunk_id",
        "attachment_key",
        "title",
        "authors",
        "tags",
        "chunk_tags",
        "item_type",
        "year",
        "page_start",
        "page_end",
        "section",
        "source_pdf",
        "text",
        "score",
        "DIALECT",
        "2",
    )


def dedupe_results(results: List[Dict[str, Any]], limit: int) -> List[Dict[str, Any]]:
    seen: set = set()
    merged: List[Dict[str, Any]] = []
    for item in results:
        key = item.get("chunk_id") or item.get("doc_id")
        if key is None:
            continue
        key = str(key)
        if key in seen:
            continue
        seen.add(key)
        merged.append(item)
        if limit > 0 and len(merged) >= limit:
            break
    return merged


def main() -> int:
    parser = argparse.ArgumentParser(description="Search Redis index for a term.")
    parser.add_argument("--query", required=True, help="Search term or raw RedisSearch query")
    parser.add_argument("--redis-url", required=True)
    parser.add_argument("--index", required=True)
    parser.add_argument("--limit", type=int, default=10)
    parser.add_argument("--offset", type=int, default=0)
    parser.add_argument("--raw", action="store_true")
    args = parser.parse_args()

    client = redis.Redis.from_url(args.redis_url, decode_responses=False)
    field_types = get_field_types(client, args.index)
    query, parts = build_query(args.query, args.raw, field_types)
    if not query:
        eprint("Query produced no tokens.")
        return 2
    raw = None
    try:
        raw = run_search(client, args.index, query, args.offset, args.limit)
        results = parse_results(raw)
        total = 0
        if isinstance(raw, list) and raw:
            try:
                total = int(raw[0])
            except Exception:
                total = 0
        if total == 0 and parts:
            fallback_results: List[Dict[str, Any]] = []
            for _name, clause in parts:
                try:
                    fallback_raw = run_search(client, args.index, clause, args.offset, args.limit)
                    fallback_results.extend(parse_results(fallback_raw))
                except Exception:
                    continue
            merged = dedupe_results(fallback_results, args.limit)
            if merged:
                payload = {
                    "query": query,
                    "raw_query": args.query,
                    "total": len(merged),
                    "results": merged,
                    "fallback_used": True,
                    "fallback_reason": "empty_combined_query",
                    "fallback_queries": [clause for _name, clause in parts],
                }
            else:
                payload = {
                    "query": query,
                    "raw_query": args.query,
                    "total": total,
                    "results": results,
                }
        else:
            payload = {
                "query": query,
                "raw_query": args.query,
                "total": total,
                "results": results,
            }
    except Exception as exc:
        eprint(f"RedisSearch query failed: {exc}")
        eprint(f"Search diagnostics: index={args.index} raw={args.raw} raw_query={args.query!r}")
        eprint(f"Search diagnostics: parsed_query={query!r}")
        eprint(f"Search diagnostics: field_types={format_field_types(field_types)}")
        fallback_results: List[Dict[str, Any]] = []
        failed_fields: List[str] = []
        for name, clause in parts:
            try:
                fallback_raw = run_search(client, args.index, clause, args.offset, args.limit)
                fallback_results.extend(parse_results(fallback_raw))
            except Exception as field_exc:
                failed_fields.append(name)
                eprint(f"Search diagnostics: field_query_failed field={name} query={clause!r} error={field_exc}")
        merged = dedupe_results(fallback_results, args.limit)
        payload = {
            "query": query,
            "raw_query": args.query,
            "total": len(merged),
            "results": merged,
            "fallback_queries": [clause for _name, clause in parts],
            "fallback_failed_fields": failed_fields,
        }
    payload.setdefault("field_types", field_types)
    payload.setdefault("fallback_used", False)
    payload.setdefault("fallback_reason", "")
    payload.setdefault("fallback_queries", [])
    payload.setdefault("fallback_failed_fields", [])
    print(json.dumps(payload, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
