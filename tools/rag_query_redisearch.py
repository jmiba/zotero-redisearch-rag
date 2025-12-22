#!/usr/bin/env python3
import argparse
import json
import math
import re
import struct
import sys
from typing import Any, Dict, List

import redis
import requests


def eprint(message: str) -> None:
    sys.stderr.write(message + "\n")


def normalize_vector(values: List[float]) -> List[float]:
    norm = math.sqrt(sum(v * v for v in values))
    if norm == 0:
        return values
    return [v / norm for v in values]


def vector_to_bytes(values: List[float]) -> bytes:
    return struct.pack("<" + "f" * len(values), *values)


def request_embedding(base_url: str, api_key: str, model: str, text: str) -> List[float]:
    url = base_url.rstrip("/") + "/embeddings"
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    response = requests.post(url, json={"input": text, "model": model}, headers=headers, timeout=120)
    response.encoding = "utf-8"
    if response.status_code >= 400:
        raise RuntimeError(f"Embedding request failed: {response.status_code} {response.text}")
    payload = response.json()
    data = payload.get("data")
    if not data:
        raise RuntimeError("Embedding response missing data field")
    embedding = data[0].get("embedding")
    if not embedding:
        raise RuntimeError("Embedding response missing embedding")
    return [float(x) for x in embedding]


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
    raw_tokens = re.findall(r"[A-Za-z0-9][A-Za-z0-9'\\-]{2,}", query)
    keywords: List[str] = []
    for token in raw_tokens:
        cleaned = re.sub(r"[^A-Za-z0-9]", "", token)
        if not cleaned:
            continue
        lower = cleaned.lower()
        if lower in _QUERY_STOPWORDS:
            continue
        if token[:1].isupper() or len(cleaned) >= 5:
            keywords.append(lower)
    seen = set()
    ordered: List[str] = []
    for token in keywords:
        if token in seen:
            continue
        seen.add(token)
        ordered.append(token)
    return ordered


def run_lexical_search(
    client: redis.Redis,
    index: str,
    keywords: List[str],
    limit: int,
) -> List[Dict[str, Any]]:
    if not keywords or limit <= 0:
        return []
    tokens = [re.sub(r"[^A-Za-z0-9]", "", token) for token in keywords]
    tokens = [token for token in tokens if token]
    if not tokens:
        return []
    query = "@text:(" + "|".join(tokens) + ")"
    try:
        raw = client.execute_command(
            "FT.SEARCH",
            index,
            query,
            "LIMIT",
            "0",
            str(limit),
            "RETURN",
            "8",
            "doc_id",
            "chunk_id",
            "source_pdf",
            "page_start",
            "page_end",
            "section",
            "text",
            "score",
            "DIALECT",
            "2",
        )
    except Exception:
        return []
    return parse_results(raw)


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


def build_citations(retrieved: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    seen = set()
    citations: List[Dict[str, Any]] = []
    for chunk in retrieved:
        doc_id = chunk.get("doc_id", "")
        page_start = chunk.get("page_start", "")
        page_end = chunk.get("page_end", "")
        source_pdf = chunk.get("source_pdf", "")
        key = (doc_id, page_start, page_end, source_pdf)
        if key in seen:
            continue
        seen.add(key)
        citations.append({
            "doc_id": doc_id,
            "page_start": page_start,
            "page_end": page_end,
            "pages": f"{page_start}-{page_end}",
            "source_pdf": source_pdf,
        })
    return citations


def main() -> int:
    parser = argparse.ArgumentParser(description="Query RedisSearch and answer with RAG.")
    parser.add_argument("--query", required=True)
    parser.add_argument("--k", type=int, default=5)
    parser.add_argument("--redis-url", required=True)
    parser.add_argument("--index", required=True)
    parser.add_argument("--prefix", required=True)
    parser.add_argument("--embed-base-url", required=True)
    parser.add_argument("--embed-api-key", default="")
    parser.add_argument("--embed-model", required=True)
    parser.add_argument("--chat-base-url", required=True)
    parser.add_argument("--chat-api-key", default="")
    parser.add_argument("--chat-model", required=True)
    parser.add_argument("--temperature", type=float, default=0.2)
    parser.add_argument("--stream", action="store_true")
    args = parser.parse_args()

    try:
        embedding = request_embedding(args.embed_base_url, args.embed_api_key, args.embed_model, args.query)
        if len(embedding) != 768:
            raise RuntimeError(f"Embedding dim mismatch: {len(embedding)}")
        embedding = normalize_vector(embedding)
        vec = vector_to_bytes(embedding)
    except Exception as exc:
        eprint(f"Failed to embed query: {exc}")
        return 2

    client = redis.Redis.from_url(args.redis_url, decode_responses=False)

    try:
        raw = client.execute_command(
            "FT.SEARCH",
            args.index,
            f"*=>[KNN {args.k} @embedding $vec AS score]",
            "PARAMS",
            "2",
            "vec",
            vec,
            "SORTBY",
            "score",
            "RETURN",
            "8",
            "doc_id",
            "chunk_id",
            "source_pdf",
            "page_start",
            "page_end",
            "section",
            "text",
            "score",
            "DIALECT",
            "2",
        )
    except Exception as exc:
        eprint(f"RedisSearch query failed: {exc}")
        return 2

    retrieved = parse_results(raw)
    keywords = extract_keywords(args.query)
    lexical_limit = max(args.k, 3)
    lexical_results = run_lexical_search(client, args.index, keywords, lexical_limit)
    if lexical_results:
        seen = {item.get("chunk_id") for item in retrieved if item.get("chunk_id")}
        for item in lexical_results:
            chunk_id = item.get("chunk_id")
            if not chunk_id or chunk_id in seen:
                continue
            retrieved.append(item)
            seen.add(chunk_id)
        max_total = args.k + lexical_limit
        if len(retrieved) > max_total:
            retrieved = retrieved[:max_total]
    context = build_context(retrieved)

    system_prompt = (
        "Use ONLY the provided context. If insufficient, say you do not know. "
        "Provide citations by doc_id and pages."
    )
    user_prompt = f"Question: {args.query}\n\nContext:\n{context}"

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
        "query": args.query,
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
