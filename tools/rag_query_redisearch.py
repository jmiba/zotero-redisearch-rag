#!/usr/bin/env python3

import argparse
import json
import math
from utils_embedding import normalize_vector, vector_to_bytes, request_embedding
from utils_redis import (
    create_redis_client,
    iter_info_attributes,
    parse_info_map,
    parse_search_results as parse_results,
    parse_search_total,
)
import re
import struct
import sys
import threading
import time
from typing import Any, Callable, Dict, List, Optional, Sequence, Set, Tuple
from urllib.parse import urlparse, urlunparse

import redis
import requests

_LM_STUDIO_APPROX_CHARS_PER_TOKEN = 3
_LM_STUDIO_CONTEXT_OVERHEAD_TOKENS = 128
_LM_STUDIO_MIN_OUTPUT_TOKENS = 256
_LM_STUDIO_MAX_OUTPUT_TOKENS = 2048


def eprint(message: str) -> None:
    sys.stderr.write(message + "\n")


class AbortRequested(RuntimeError):
    pass


def is_temperature_unsupported(message: str) -> bool:
    lowered = message.lower()
    return "temperature" in lowered and (
        "not supported" in lowered or "unsupported" in lowered or "unknown parameter" in lowered
    )


def is_stream_unsupported(message: str) -> bool:
    lowered = message.lower()
    return "stream" in lowered and ("not supported" in lowered or "unsupported" in lowered or "unknown parameter" in lowered)


def is_responses_endpoint_unsupported(message: str) -> bool:
    lowered = message.lower()
    return (
        "404" in lowered
        or "not found" in lowered
        or "unknown endpoint" in lowered
        or "responses response missing content" in lowered
    )


def is_lm_studio_provider(base_url: str) -> bool:
    try:
        parsed = urlparse((base_url or "").strip())
    except Exception:
        return False
    host = (parsed.hostname or "").lower()
    port = parsed.port or (443 if parsed.scheme == "https" else 80)
    return host in {"127.0.0.1", "localhost"} and port == 1234


def build_lm_studio_models_url(base_url: str) -> Optional[str]:
    try:
        parsed = urlparse((base_url or "").strip())
    except Exception:
        return None
    path = re.sub(r"/+$", "", parsed.path or "")
    base_path = path[:-3] if path.endswith("/v1") else path
    model_path = re.sub(r"/{2,}", "/", f"{base_path}/api/v1/models")
    return urlunparse((parsed.scheme, parsed.netloc, model_path, "", "", ""))


def estimate_text_tokens(text: str) -> int:
    if not text:
        return 0
    return max(1, math.ceil(len(text) / _LM_STUDIO_APPROX_CHARS_PER_TOKEN))


def trim_text_to_token_budget(text: str, max_tokens: int) -> str:
    safe_tokens = max(0, int(max_tokens))
    if safe_tokens <= 0 or not text:
        return ""
    max_chars = safe_tokens * _LM_STUDIO_APPROX_CHARS_PER_TOKEN
    if len(text) <= max_chars:
        return text
    trimmed = text[:max_chars]
    paragraph_break = trimmed.rfind("\n\n")
    line_break = trimmed.rfind("\n")
    sentence_break = max(trimmed.rfind(". "), trimmed.rfind("? "), trimmed.rfind("! "))
    breakpoint = max(paragraph_break, line_break, sentence_break)
    if breakpoint >= int(max_chars * 0.7):
        trimmed = trimmed[:breakpoint].rstrip()
    else:
        trimmed = trimmed.rstrip()
    return trimmed


def get_lm_studio_context_budget(base_url: str, api_key: str, model: str, prompt_hint: str = "") -> Optional[Dict[str, int]]:
    if not is_lm_studio_provider(base_url):
        return None
    url = build_lm_studio_models_url(base_url)
    if not url:
        return None
    headers: Dict[str, str] = {}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    try:
        response = requests.get(url, headers=headers, timeout=5)
        response.encoding = "utf-8"
        if response.status_code >= 400:
            return None
        data = response.json()
    except Exception:
        return None
    if not isinstance(data, dict):
        return None
    models = data.get("models")
    if not isinstance(models, list):
        return None
    for candidate in models:
        if not isinstance(candidate, dict):
            continue
        if str(candidate.get("key", "") or "").strip() != model:
            continue
        loaded_instances = candidate.get("loaded_instances")
        context_length = 0
        if isinstance(loaded_instances, list):
            for instance in loaded_instances:
                if not isinstance(instance, dict):
                    continue
                loaded_id = str(instance.get("id", "") or "").strip()
                if loaded_id and loaded_id != model:
                    continue
                config = instance.get("config")
                if isinstance(config, dict):
                    value = config.get("context_length")
                    if isinstance(value, (int, float)) and value > 0:
                        context_length = int(value)
                        break
        max_context_value = candidate.get("max_context_length")
        max_context_length = int(max_context_value) if isinstance(max_context_value, (int, float)) and max_context_value > 0 else 0
        if context_length <= 0:
            context_length = max_context_length
        if context_length <= 0:
            return None
        prompt_hint_tokens = estimate_text_tokens(prompt_hint)
        desired_output_tokens = max(
            _LM_STUDIO_MIN_OUTPUT_TOKENS,
            min(
                _LM_STUDIO_MAX_OUTPUT_TOKENS,
                max(math.ceil(prompt_hint_tokens * 0.5), math.floor(context_length * 0.2)),
            ),
        )
        max_output_tokens = max(64, min(desired_output_tokens, max(64, context_length - 256)))
        return {
            "context_length": context_length,
            "max_context_length": max_context_length,
            "max_output_tokens": int(max_output_tokens),
        }
    return None


def extract_text_segments(value: Any) -> List[str]:
    segments: List[str] = []
    if isinstance(value, str):
        if value:
            segments.append(value)
        return segments
    if isinstance(value, list):
        for item in value:
            segments.extend(extract_text_segments(item))
        return segments
    if not isinstance(value, dict):
        return segments

    item_type = str(value.get("type", "") or "").strip().lower()
    if item_type in {"reasoning", "reasoning_content", "thinking"}:
        return segments

    for key in ("text", "output_text", "content", "value"):
        nested = value.get(key)
        if isinstance(nested, str) and nested:
            segments.append(nested)
        elif isinstance(nested, (list, dict)):
            segments.extend(extract_text_segments(nested))
    return segments


def extract_text_from_chat_payload(data: Dict[str, Any], preserve_whitespace: bool = False) -> str:
    parts: List[str] = []
    choices = data.get("choices")
    if isinstance(choices, list) and choices:
        first = choices[0] if isinstance(choices[0], dict) else {}
        message = first.get("message") if isinstance(first.get("message"), dict) else {}
        parts.extend(extract_text_segments(message.get("content")))
        parts.extend(extract_text_segments(first.get("text")))
    parts.extend(extract_text_segments(data.get("output_text")))
    content = "".join(parts)
    return content if preserve_whitespace else content.strip()


def extract_text_from_responses_payload(data: Dict[str, Any], preserve_whitespace: bool = False) -> str:
    parts: List[str] = []
    parts.extend(extract_text_segments(data.get("output_text")))
    output = data.get("output")
    if isinstance(output, list):
        for item in output:
            if not isinstance(item, dict):
                continue
            item_type = str(item.get("type", "") or "").strip().lower()
            if item_type == "message":
                parts.extend(extract_text_segments(item.get("content")))
                continue
            parts.extend(extract_text_segments(item))
    response = data.get("response")
    if isinstance(response, dict):
        parts.extend(extract_text_segments(response.get("output_text")))
        nested_output = response.get("output")
        if isinstance(nested_output, list):
            for item in nested_output:
                if isinstance(item, dict):
                    parts.extend(extract_text_segments(item))
    content = "".join(parts)
    return content if preserve_whitespace else content.strip()


def extract_error_message(payload: Any) -> str:
    if isinstance(payload, dict):
        error = payload.get("error")
        if isinstance(error, dict):
            message = error.get("message")
            if isinstance(message, str) and message.strip():
                return message.strip()
            return json.dumps(error, ensure_ascii=False)
        if payload.get("type") == "error":
            message = payload.get("message")
            if isinstance(message, str) and message.strip():
                return message.strip()
    return ""


def request_responses(
    base_url: str,
    api_key: str,
    model: str,
    temperature: float,
    system_prompt: str,
    user_prompt: str,
    max_output_tokens: Optional[int] = None,
    timing: Optional[Dict[str, Any]] = None,
    should_abort: Optional[Callable[[], bool]] = None,
) -> str:
    started_at = time.perf_counter()
    if should_abort is not None and should_abort():
        raise AbortRequested("Request aborted before non-stream responses request.")
    url = base_url.rstrip("/") + "/responses"
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    base_payload = {
        "model": model,
        "instructions": system_prompt,
        "input": user_prompt,
    }
    if max_output_tokens is not None and max_output_tokens > 0:
        base_payload["max_output_tokens"] = int(max_output_tokens)
    payload = dict(base_payload)
    payload["temperature"] = temperature

    response = requests.post(url, json=payload, headers=headers, timeout=120)
    response_open_ms = int((time.perf_counter() - started_at) * 1000)
    response.encoding = "utf-8"
    if response.status_code >= 400:
        error_text = response.text
        if is_temperature_unsupported(error_text):
            if should_abort is not None and should_abort():
                raise AbortRequested("Request aborted before non-stream responses retry.")
            response = requests.post(url, json=base_payload, headers=headers, timeout=120)
            response_open_ms = int((time.perf_counter() - started_at) * 1000)
            response.encoding = "utf-8"
            if response.status_code >= 400:
                raise RuntimeError(f"Responses request failed: {response.status_code} {response.text}")
        else:
            raise RuntimeError(f"Responses request failed: {response.status_code} {error_text}")

    data = response.json()
    error_message = extract_error_message(data)
    if error_message:
        raise RuntimeError(f"Responses request failed: {error_message}")
    content = extract_text_from_responses_payload(data if isinstance(data, dict) else {})
    if not content:
        raise RuntimeError("Responses response missing content")
    if timing is not None:
        timing["chat_mode"] = "responses_non_stream"
        timing["chat_response_open_ms"] = response_open_ms
        timing["chat_first_token_ms"] = response_open_ms
        timing["chat_total_ms"] = int((time.perf_counter() - started_at) * 1000)
        timing["chat_fallback_to_non_stream"] = bool(timing.get("chat_fallback_to_non_stream", False))
    return content


def request_responses_stream(
    base_url: str,
    api_key: str,
    model: str,
    temperature: float,
    system_prompt: str,
    user_prompt: str,
    on_delta,
    max_output_tokens: Optional[int] = None,
    timing: Optional[Dict[str, Any]] = None,
    should_abort: Optional[Callable[[], bool]] = None,
) -> str:
    started_at = time.perf_counter()
    if should_abort is not None and should_abort():
        raise AbortRequested("Request aborted before stream responses request.")
    url = base_url.rstrip("/") + "/responses"
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    base_payload = {
        "model": model,
        "instructions": system_prompt,
        "input": user_prompt,
        "stream": True,
    }
    if max_output_tokens is not None and max_output_tokens > 0:
        base_payload["max_output_tokens"] = int(max_output_tokens)
    payload = dict(base_payload)
    payload["temperature"] = temperature

    response = requests.post(url, json=payload, headers=headers, timeout=120, stream=True)
    response_open_ms = int((time.perf_counter() - started_at) * 1000)
    response.encoding = "utf-8"
    if response.status_code >= 400:
        error_text = response.text
        if is_temperature_unsupported(error_text):
            if should_abort is not None and should_abort():
                raise AbortRequested("Request aborted before stream responses retry.")
            response = requests.post(url, json=base_payload, headers=headers, timeout=120, stream=True)
            response_open_ms = int((time.perf_counter() - started_at) * 1000)
            response.encoding = "utf-8"
            if response.status_code >= 400:
                raise RuntimeError(f"Responses request failed: {response.status_code} {response.text}")
        else:
            raise RuntimeError(f"Responses request failed: {response.status_code} {error_text}")

    content_parts: List[str] = []
    first_token_ms: Optional[int] = None
    current_event: Optional[str] = None
    current_data: List[str] = []
    completed_payload: Optional[Dict[str, Any]] = None
    stream_error_message: Optional[str] = None

    def flush_event() -> bool:
        nonlocal current_event, current_data, first_token_ms, completed_payload, stream_error_message
        if not current_event and not current_data:
            return False
        data_text = "\n".join(current_data).strip()
        event_name = current_event or ""
        current_event = None
        current_data = []
        if not data_text:
          return False
        if data_text == "[DONE]":
            return True
        try:
            payload_data = json.loads(data_text)
        except Exception:
            return False
        if not isinstance(payload_data, dict):
            return False
        error_message = extract_error_message(payload_data)
        if error_message:
            stream_error_message = error_message
            return True
        if event_name == "response.output_text.delta":
            piece = payload_data.get("delta")
            if isinstance(piece, str) and piece:
                if first_token_ms is None:
                    first_token_ms = int((time.perf_counter() - started_at) * 1000)
                content_parts.append(piece)
                on_delta(piece)
            return False
        if event_name == "response.completed":
            completed_payload = payload_data
            return False
        if not content_parts:
            piece = extract_text_from_responses_payload(payload_data, preserve_whitespace=True)
            if piece:
                if first_token_ms is None:
                    first_token_ms = int((time.perf_counter() - started_at) * 1000)
                content_parts.append(piece)
                on_delta(piece)
        return False

    for raw_line in response.iter_lines(decode_unicode=True):
        if should_abort is not None and should_abort():
            raise AbortRequested("Request aborted while waiting for responses stream tokens.")
        if raw_line is None:
            continue
        line = raw_line.rstrip("\r")
        if not line:
            if flush_event():
                break
            continue
        if line.startswith("event:"):
            current_event = line[6:].strip()
            continue
        if line.startswith("data:"):
            current_data.append(line[5:].strip())
            continue

    flush_event()
    if stream_error_message:
        raise RuntimeError(f"Responses request failed: {stream_error_message}")
    if not content_parts and completed_payload:
        completed_error = extract_error_message(completed_payload)
        if completed_error:
            raise RuntimeError(f"Responses request failed: {completed_error}")
        fallback = extract_text_from_responses_payload(completed_payload, preserve_whitespace=True)
        if fallback:
            content_parts.append(fallback)

    if timing is not None:
        timing["chat_mode"] = "responses_stream"
        timing["chat_response_open_ms"] = response_open_ms
        timing["chat_first_token_ms"] = first_token_ms
        timing["chat_total_ms"] = int((time.perf_counter() - started_at) * 1000)
        timing["chat_fallback_to_non_stream"] = False
    return "".join(content_parts)


def request_chat(
    base_url: str,
    api_key: str,
    model: str,
    temperature: float,
    system_prompt: str,
    user_prompt: str,
    max_output_tokens: Optional[int] = None,
    timing: Optional[Dict[str, Any]] = None,
    should_abort: Optional[Callable[[], bool]] = None,
    endpoint_mode: str = "chat",
) -> str:
    if endpoint_mode == "responses":
        try:
            return request_responses(
                base_url,
                api_key,
                model,
                temperature,
                system_prompt,
                user_prompt,
                max_output_tokens=max_output_tokens,
                timing=timing,
                should_abort=should_abort,
            )
        except Exception as exc:
            if not is_responses_endpoint_unsupported(str(exc)):
                raise
    started_at = time.perf_counter()
    if should_abort is not None and should_abort():
        raise AbortRequested("Request aborted before non-stream chat request.")
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
    if max_output_tokens is not None and max_output_tokens > 0:
        base_payload["max_tokens"] = int(max_output_tokens)
    payload = dict(base_payload)
    payload["temperature"] = temperature

    response = requests.post(url, json=payload, headers=headers, timeout=120)
    response_open_ms = int((time.perf_counter() - started_at) * 1000)
    response.encoding = "utf-8"
    if response.status_code >= 400:
        error_text = response.text
        if is_temperature_unsupported(error_text):
            if should_abort is not None and should_abort():
                raise AbortRequested("Request aborted before non-stream retry.")
            response = requests.post(url, json=base_payload, headers=headers, timeout=120)
            response_open_ms = int((time.perf_counter() - started_at) * 1000)
            response.encoding = "utf-8"
            if response.status_code >= 400:
                raise RuntimeError(f"Chat request failed: {response.status_code} {response.text}")
        else:
            raise RuntimeError(f"Chat request failed: {response.status_code} {error_text}")

    data = response.json()
    error_message = extract_error_message(data)
    if error_message:
        raise RuntimeError(f"Chat request failed: {error_message}")
    choices = data.get("choices")
    if not choices:
        raise RuntimeError("Chat response missing choices")
    content = extract_text_from_chat_payload(data if isinstance(data, dict) else {})
    if not content:
        raise RuntimeError("Chat response missing content")
    if timing is not None:
        timing["chat_mode"] = "non_stream"
        timing["chat_response_open_ms"] = response_open_ms
        timing["chat_first_token_ms"] = response_open_ms
        timing["chat_total_ms"] = int((time.perf_counter() - started_at) * 1000)
        timing["chat_fallback_to_non_stream"] = bool(timing.get("chat_fallback_to_non_stream", False))
    return content


def request_chat_stream(
    base_url: str,
    api_key: str,
    model: str,
    temperature: float,
    system_prompt: str,
    user_prompt: str,
    on_delta,
    max_output_tokens: Optional[int] = None,
    timing: Optional[Dict[str, Any]] = None,
    should_abort: Optional[Callable[[], bool]] = None,
    endpoint_mode: str = "chat",
) -> str:
    if endpoint_mode == "responses":
        try:
            return request_responses_stream(
                base_url,
                api_key,
                model,
                temperature,
                system_prompt,
                user_prompt,
                on_delta,
                max_output_tokens=max_output_tokens,
                timing=timing,
                should_abort=should_abort,
            )
        except Exception as exc:
            if not is_responses_endpoint_unsupported(str(exc)):
                raise
    started_at = time.perf_counter()
    if should_abort is not None and should_abort():
        raise AbortRequested("Request aborted before stream chat request.")
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
    if max_output_tokens is not None and max_output_tokens > 0:
        base_payload["max_tokens"] = int(max_output_tokens)
    payload = dict(base_payload)
    payload["temperature"] = temperature

    response = requests.post(url, json=payload, headers=headers, timeout=120, stream=True)
    response_open_ms = int((time.perf_counter() - started_at) * 1000)
    response.encoding = "utf-8"
    if response.status_code >= 400:
        error_text = response.text
        if is_temperature_unsupported(error_text):
            if should_abort is not None and should_abort():
                raise AbortRequested("Request aborted before stream retry.")
            response = requests.post(url, json=base_payload, headers=headers, timeout=120, stream=True)
            response_open_ms = int((time.perf_counter() - started_at) * 1000)
            response.encoding = "utf-8"
            if response.status_code >= 400:
                raise RuntimeError(f"Chat request failed: {response.status_code} {response.text}")
        else:
            raise RuntimeError(f"Chat request failed: {response.status_code} {error_text}")

    content_parts: List[str] = []
    first_token_ms: Optional[int] = None
    last_payload: Optional[Dict[str, Any]] = None
    for raw_line in response.iter_lines(decode_unicode=True):
        if should_abort is not None and should_abort():
            raise AbortRequested("Request aborted while waiting for stream tokens.")
        if not raw_line:
            continue
        line = raw_line.rstrip("\r")
        if not line.startswith("data:"):
            continue
        data = line[5:]
        if data.startswith(" "):
            data = data[1:]
        if data == "[DONE]":
            break
        try:
            payload = json.loads(data)
        except Exception:
            continue
        if isinstance(payload, dict):
            last_payload = payload
            error_message = extract_error_message(payload)
            if error_message:
                raise RuntimeError(f"Chat request failed: {error_message}")
        choices = payload.get("choices") or []
        if not choices:
            continue
        delta = choices[0].get("delta") or {}
        piece = extract_text_from_chat_payload(
            {"choices": [{"message": {"content": delta.get("content")}}]},
            preserve_whitespace=True,
        )
        if not piece:
            piece = extract_text_segments(delta.get("content"))
            piece = "".join(piece)
        if not piece:
            piece = "".join(extract_text_segments(delta))
        if not piece:
            piece = "".join(extract_text_segments(choices[0].get("text")))
        if not piece:
            continue
        if first_token_ms is None:
            first_token_ms = int((time.perf_counter() - started_at) * 1000)
        content_parts.append(piece)
        on_delta(piece)

    if not content_parts and last_payload:
        last_error = extract_error_message(last_payload)
        if last_error:
            raise RuntimeError(f"Chat request failed: {last_error}")
        fallback = extract_text_from_chat_payload(last_payload)
        if fallback:
            content_parts.append(fallback)

    if timing is not None:
        timing["chat_mode"] = "stream"
        timing["chat_response_open_ms"] = response_open_ms
        timing["chat_first_token_ms"] = first_token_ms
        timing["chat_total_ms"] = int((time.perf_counter() - started_at) * 1000)
        timing["chat_fallback_to_non_stream"] = False
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


def parse_single_text_value(raw: str) -> str:
    if not raw:
        return ""
    text = raw.strip()
    try:
        data = json.loads(text)
    except Exception:
        data = None
    if isinstance(data, dict):
        for key in ("query", "rewritten_query", "rewrite", "text", "output"):
            value = data.get(key)
            if isinstance(value, str) and value.strip():
                text = value.strip()
                break
    elif isinstance(data, list):
        for item in data:
            if isinstance(item, str) and item.strip():
                text = item.strip()
                break
    lines = [line.strip(" `\"'\t") for line in text.splitlines() if line.strip()]
    if not lines:
        return ""
    return lines[0].strip(" `\"'")


def rewrite_follow_up_query(
    base_url: str,
    api_key: str,
    model: str,
    query: str,
    history_messages: List[Dict[str, Any]],
    should_abort: Optional[Callable[[], bool]] = None,
    endpoint_mode: str = "chat",
) -> str:
    if not base_url or not model or not query or not history_messages:
        return query
    history_block = format_history_block(history_messages)
    if not history_block:
        return query
    system_prompt = (
        "Rewrite the user's latest message into a standalone retrieval query. "
        "Resolve pronouns and omitted subjects using the chat history. "
        "Do not answer the question. Output only the rewritten query as a single line. "
        "If the latest message is already standalone, repeat it."
    )
    user_prompt = (
        f"Chat history:\n{history_block}\n\n"
        f"Latest user message: {query}\n\n"
        "Standalone retrieval query:"
    )
    try:
        response = request_chat(
            base_url,
            api_key,
            model,
            0.0,
            system_prompt,
            user_prompt,
            should_abort=should_abort,
            endpoint_mode=endpoint_mode,
        )
    except Exception as exc:
        eprint(f"Follow-up rewrite failed: {exc}")
        return query
    rewritten = parse_single_text_value(response)
    if not rewritten:
        return query
    return rewritten


def expand_query(
    base_url: str,
    api_key: str,
    model: str,
    query: str,
    count: int,
    should_abort: Optional[Callable[[], bool]] = None,
    endpoint_mode: str = "chat",
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
        response = request_chat(
            base_url,
            api_key,
            model,
            0.0,
            system_prompt,
            user_prompt,
            should_abort=should_abort,
            endpoint_mode=endpoint_mode,
        )
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
    key = str(model_name or "").strip()
    if not key:
        return None
    cached = _RERANKER_CACHE.get(key, _RERANKER_NOT_SET)
    if cached is not _RERANKER_NOT_SET:
        return cached
    with _RERANKER_CACHE_LOCK:
        cached_locked = _RERANKER_CACHE.get(key, _RERANKER_NOT_SET)
        if cached_locked is not _RERANKER_NOT_SET:
            return cached_locked
        reranker = _load_reranker_uncached(key)
        _RERANKER_CACHE[key] = reranker
        return reranker


_RERANKER_NOT_SET = object()
_RERANKER_CACHE: Dict[str, Any] = {}
_RERANKER_CACHE_LOCK = threading.Lock()


def _load_reranker_uncached(model_name: str):
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


FIELD_TYPE_CACHE: Dict[str, Dict[str, str]] = {}


def get_field_types(client: redis.Redis, index: str) -> Dict[str, str]:
    if index in FIELD_TYPE_CACHE:
        return FIELD_TYPE_CACHE[index]
    try:
        info = client.execute_command("FT.INFO", index)
    except Exception:
        return {}
    info_map = parse_info_map(info)
    field_types: Dict[str, str] = {}
    for attr_map in iter_info_attributes(info_map):
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
    for attr_map in iter_info_attributes(info_map):
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
    filter_query: str = "*",
) -> List[Dict[str, Any]]:
    if filter_query and filter_query != "*":
        query = f"({filter_query})=>[KNN {k} @embedding $vec AS score]"
    else:
        query = f"*=>[KNN {k} @embedding $vec AS score]"
    raw = client.execute_command(
        "FT.SEARCH",
        index,
        query,
        "PARAMS",
        "2",
        "vec",
        vec,
        "SORTBY",
        "score",
        "RETURN",
        "13",
        "doc_id",
        "chunk_id",
        "is_annotation",
        "attachment_key",
        "source_pdf",
        "page_start",
        "page_end",
        "annotation_page_label",
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
_ANNOTATION_K_DEFAULT = 3
_AGENTIC_FULL_DOC_MAX_CHUNKS_DEFAULT = 48
_AGENTIC_FULL_DOC_MAX_CHARS_DEFAULT = 32000
_AGENTIC_DOC_SUMMARY_TOP_N = 6


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
    annotation_k: int = 0,
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
    if annotation_k > 0:
        annotations = retrieve_annotation_chunks(client, index, vec, annotation_k, keywords)
        ordered = merge_annotation_chunks(ordered, annotations, annotation_k)
    return ordered, metrics


def run_lexical_search(
    client: redis.Redis,
    index: str,
    keywords: List[str],
    limit: int,
    filter_query: str = "",
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
    if filter_query:
        query = f"({filter_query}) {query}"

    def run_search(query_text: str) -> Tuple[List[Dict[str, Any]], int]:
        raw = client.execute_command(
            "FT.SEARCH",
            index,
            query_text,
            "LIMIT",
            "0",
            str(limit),
            "RETURN",
            "13",
            "doc_id",
            "chunk_id",
            "is_annotation",
            "attachment_key",
            "source_pdf",
            "page_start",
            "page_end",
            "annotation_page_label",
            "section",
            "text",
            "tags",
            "chunk_tags",
            "score",
            "DIALECT",
            "2",
        )
        return parse_results(raw), parse_search_total(raw)

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

def is_annotation_chunk(chunk: Dict[str, Any]) -> bool:
    value = chunk.get("is_annotation")
    if value is None:
        return False
    if isinstance(value, (int, float)):
        return value != 0
    value = str(value).strip().lower()
    return value in ("1", "true", "yes", "y")

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


def retrieve_annotation_chunks(
    client: redis.Redis,
    index: str,
    vec: bytes,
    k: int,
    keywords: List[str],
) -> List[Dict[str, Any]]:
    if k <= 0:
        return []
    try:
        vector_results = search_redis_knn(
            client,
            index,
            vec,
            max(1, k),
            filter_query="@is_annotation:{1}",
        )
    except Exception:
        vector_results = []
    lexical_results = run_lexical_search(
        client,
        index,
        keywords,
        max(k, 5),
        filter_query="@is_annotation:{1}",
    )
    combined = vector_results + lexical_results
    combined = dedupe_by_chunk_id(combined)
    return combined[:k]


def merge_annotation_chunks(
    results: List[Dict[str, Any]],
    annotations: List[Dict[str, Any]],
    k: int,
) -> List[Dict[str, Any]]:
    if not annotations or k <= 0:
        return results
    seen = {chunk_key(item) for item in results if chunk_key(item)}
    picked: List[Dict[str, Any]] = []
    for item in annotations:
        key = chunk_key(item)
        if not key or key in seen:
            continue
        picked.append(item)
        seen.add(key)
        if len(picked) >= k:
            break
    if not picked:
        return results
    return picked + results

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
    annotation_k: int = 0,
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
        annotation_k=annotation_k,
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
                annotation_k=annotation_k,
            )
        except Exception as exc:
            eprint(f"Fallback retrieval failed: {exc}")
    return retrieved, metrics


def sum_retrieved_chars(retrieved: Sequence[Dict[str, Any]]) -> int:
    return sum(len(str(chunk.get("text", "") or "")) for chunk in retrieved)


def escape_tag_value(value: str) -> str:
    text = str(value or "")
    return re.sub(r'([,\.<>{}\[\]"\'\:;!@#$%^&*()\-+=~\\/| ])', r'\\\1', text)


def parse_json_object(raw: str) -> Dict[str, Any]:
    if not raw:
        return {}
    text = raw.strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z0-9_-]*\n", "", text)
        text = re.sub(r"\n```$", "", text)
        text = text.strip()
    try:
        payload = json.loads(text)
    except Exception:
        payload = None
    if isinstance(payload, dict):
        return payload
    match = re.search(r"\{.*\}", text, flags=re.DOTALL)
    if not match:
        return {}
    try:
        parsed = json.loads(match.group(0))
    except Exception:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def summarize_retrieved_docs(
    retrieved: Sequence[Dict[str, Any]],
    top_n: int = _AGENTIC_DOC_SUMMARY_TOP_N,
) -> List[Dict[str, Any]]:
    grouped: Dict[str, Dict[str, Any]] = {}
    for chunk in retrieved:
        doc_id = str(chunk.get("doc_id", "") or "").strip()
        if not doc_id:
            continue
        entry = grouped.get(doc_id)
        if not entry:
            entry = {
                "doc_id": doc_id,
                "source_pdf": str(chunk.get("source_pdf", "") or ""),
                "chunk_count": 0,
                "page_min": None,
                "page_max": None,
            }
            grouped[doc_id] = entry
        entry["chunk_count"] = int(entry["chunk_count"]) + 1
        page_start = chunk.get("page_start")
        page_end = chunk.get("page_end")
        try:
            p_start = int(page_start)
            entry["page_min"] = p_start if entry["page_min"] is None else min(int(entry["page_min"]), p_start)
        except Exception:
            pass
        try:
            p_end = int(page_end)
            entry["page_max"] = p_end if entry["page_max"] is None else max(int(entry["page_max"]), p_end)
        except Exception:
            pass

    docs = list(grouped.values())
    docs.sort(key=lambda item: (-int(item.get("chunk_count", 0)), str(item.get("doc_id", ""))))
    if top_n > 0:
        docs = docs[:top_n]
    return docs


def choose_top_doc_id(retrieved: Sequence[Dict[str, Any]]) -> str:
    docs = summarize_retrieved_docs(retrieved, top_n=1)
    if not docs:
        return ""
    return str(docs[0].get("doc_id", "") or "")


def dedupe_by_doc_and_chunk(items: Sequence[Dict[str, Any]]) -> List[Dict[str, Any]]:
    seen: Set[Tuple[str, str]] = set()
    deduped: List[Dict[str, Any]] = []
    for item in items:
        key = (str(item.get("doc_id", "") or ""), str(item.get("chunk_id", "") or ""))
        if key in seen:
            continue
        seen.add(key)
        deduped.append(item)
    return deduped


def retrieval_signature(
    chunks: Sequence[Dict[str, Any]],
    limit: int = 24,
) -> Tuple[Tuple[str, str], ...]:
    rows: List[Tuple[str, str]] = []
    for chunk in chunks[:max(1, limit)]:
        rows.append((
            str(chunk.get("doc_id", "") or ""),
            str(chunk.get("chunk_id", "") or ""),
        ))
    return tuple(rows)


def trim_chunks_to_char_budget(
    chunks: Sequence[Dict[str, Any]],
    max_chars: int,
) -> List[Dict[str, Any]]:
    if max_chars <= 0:
        return list(chunks)
    kept: List[Dict[str, Any]] = []
    used = 0
    for chunk in chunks:
        text = str(chunk.get("text", "") or "")
        text_len = len(text)
        if kept and used + text_len > max_chars:
            break
        kept.append(chunk)
        used += text_len
    return kept


def retrieve_full_document_chunks(
    client: redis.Redis,
    index: str,
    doc_id: str,
    max_chunks: int,
) -> List[Dict[str, Any]]:
    clean_doc_id = str(doc_id or "").strip()
    if not clean_doc_id:
        return []
    query = f"@doc_id:{{{escape_tag_value(clean_doc_id)}}}"
    raw = client.execute_command(
        "FT.SEARCH",
        index,
        query,
        "SORTBY",
        "page_start",
        "ASC",
        "LIMIT",
        "0",
        str(max(1, max_chunks)),
        "RETURN",
        "12",
        "doc_id",
        "chunk_id",
        "is_annotation",
        "attachment_key",
        "source_pdf",
        "page_start",
        "page_end",
        "annotation_page_label",
        "section",
        "text",
        "tags",
        "chunk_tags",
        "DIALECT",
        "2",
    )
    chunks = parse_results(raw)
    return [chunk for chunk in chunks if str(chunk.get("text", "") or "").strip()]


def plan_agentic_action(
    base_url: str,
    api_key: str,
    model: str,
    query: str,
    retrieved: Sequence[Dict[str, Any]],
    step: int,
    max_steps: int,
) -> Dict[str, Any]:
    if not base_url or not model:
        return {"action": "answer_with_current_context", "reason": "planner_unavailable"}
    chars = sum_retrieved_chars(retrieved)
    docs = summarize_retrieved_docs(retrieved, top_n=_AGENTIC_DOC_SUMMARY_TOP_N)
    planner_input = {
        "query": query,
        "step": step,
        "max_steps": max_steps,
        "retrieved_chunk_count": len(retrieved),
        "retrieved_chars": chars,
        "candidate_docs": docs,
    }
    system_prompt = (
        "You are a retrieval planner for RAG. "
        "Choose exactly one action: answer_with_current_context, expand_retry, or full_document. "
        "Use full_document only when the user likely asks for whole-document synthesis/comparison "
        "or when retrieved context is clearly too sparse. "
        "Return only JSON object: "
        "{\"action\":\"...\",\"doc_id\":\"optional\",\"reason\":\"short reason\"}."
    )
    user_prompt = "Planner input JSON:\n" + json.dumps(planner_input, ensure_ascii=False)
    try:
        raw = request_chat(base_url, api_key, model, 0.0, system_prompt, user_prompt)
    except Exception as exc:
        eprint(f"Agentic planner failed: {exc}")
        return {"action": "answer_with_current_context", "reason": "planner_error"}
    plan = parse_json_object(raw)
    action = str(plan.get("action", "")).strip().lower()
    if action not in {"answer_with_current_context", "expand_retry", "full_document"}:
        return {"action": "answer_with_current_context", "reason": "planner_invalid_action"}
    output = {"action": action, "reason": str(plan.get("reason", "") or "").strip()}
    doc_id = str(plan.get("doc_id", "") or "").strip()
    if doc_id:
        output["doc_id"] = doc_id
    return output

def build_context(retrieved: List[Dict[str, Any]]) -> str:
    blocks = []
    for chunk in retrieved:
        doc_id = chunk.get("doc_id", "")
        chunk_id = chunk.get("chunk_id", "")
        source_pdf = chunk.get("source_pdf", "")
        page_start = chunk.get("page_start", "")
        page_end = chunk.get("page_end", "")
        score = chunk.get("score", "")
        annotation_flag = "true" if is_annotation_chunk(chunk) else "false"
        text = chunk.get("text", "")
        pages = f"{page_start}-{page_end}"
        block = (
            f"<Document source='{source_pdf}' pages='{pages}' doc_id='{doc_id}' "
            f"chunk_id='{chunk_id}' score='{score}' annotation='{annotation_flag}'>\n{text}\n</Document>"
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
        annotation_page_label = chunk.get("annotation_page_label", "")
        source_pdf = chunk.get("source_pdf", "")
        key = (doc_id, attachment_key, page_start, page_end, source_pdf)
        if key in seen:
            continue
        seen.add(key)
        annotation_key = extract_annotation_key(str(chunk_id))
        pages = f"{page_start}-{page_end}"
        if annotation_page_label:
            pages = str(annotation_page_label)
        citations.append({
            "doc_id": doc_id,
            "chunk_id": chunk_id,
            "attachment_key": attachment_key,
            "annotation_key": annotation_key or None,
            "annotation_page_label": annotation_page_label or None,
            "page_start": page_start,
            "page_end": page_end,
            "pages": pages,
            "source_pdf": source_pdf,
        })
    return citations


def build_arg_parser() -> argparse.ArgumentParser:
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
    parser.add_argument("--chat-endpoint-mode", choices=["chat", "responses"], default="chat")
    parser.add_argument("--temperature", type=float, default=0.2)
    parser.add_argument("--stream", action="store_true")
    parser.add_argument("--history-file", help="Optional JSON file with recent chat history")
    parser.add_argument("--rewrite-followups", action="store_true")
    parser.add_argument("--expand-query", action="store_true")
    parser.add_argument("--expand-count", type=int, default=3)
    parser.add_argument("--rerank", action="store_true")
    parser.add_argument("--rerank-model", default="BAAI/bge-reranker-v2-m3")
    parser.add_argument("--rerank-candidates", type=int, default=4)
    parser.add_argument("--rerank-max-chars", type=int, default=_RERANK_MAX_CHARS_DEFAULT)
    parser.add_argument("--rrf-k", type=int, default=_RRF_K)
    parser.add_argument("--rrf-log-top", type=int, default=0)
    parser.add_argument("--max-per-doc", type=int, default=0)
    parser.add_argument("--annotation-k", type=int, default=_ANNOTATION_K_DEFAULT)
    parser.add_argument("--agentic", choices=["off", "basic"], default="off")
    parser.add_argument("--agentic-max-iters", type=int, default=2)
    parser.add_argument("--agentic-full-doc-chunks", type=int, default=_AGENTIC_FULL_DOC_MAX_CHUNKS_DEFAULT)
    parser.add_argument("--agentic-full-doc-max-chars", type=int, default=_AGENTIC_FULL_DOC_MAX_CHARS_DEFAULT)
    return parser


def run_with_args(
    args: argparse.Namespace,
    emit_json: Optional[Callable[[Dict[str, Any]], None]] = None,
    should_abort: Optional[Callable[[], bool]] = None,
) -> int:
    run_started_at = time.perf_counter()
    phase_ms: Dict[str, int] = {}
    phase_counts: Dict[str, int] = {}
    chat_timing: Dict[str, Any] = {}

    def record_phase(name: str, started_at: float) -> None:
        elapsed_ms = int((time.perf_counter() - started_at) * 1000)
        phase_ms[name] = phase_ms.get(name, 0) + elapsed_ms
        phase_counts[name] = phase_counts.get(name, 0) + 1

    def check_abort(stage: str) -> None:
        if should_abort is not None and should_abort():
            raise AbortRequested(f"Request aborted at stage '{stage}'.")

    def emit_phase(name: str, status: str, **extra: Any) -> None:
        payload: Dict[str, Any] = {
            "type": "phase",
            "name": name,
            "status": status,
            "t_ms": int((time.perf_counter() - run_started_at) * 1000),
        }
        if extra:
            payload.update(extra)
        if emit_json is not None:
            emit_json(payload)

    client = create_redis_client(args.redis_url)
    use_combo = bool(args.expand_query or args.rerank)
    expanded_queries: List[str] = []
    raw_query = args.query
    query_for_display = raw_query
    retrieval_query = raw_query
    query_rewritten = False
    index_dim_cache: Optional[int] = None
    rrf_k = max(1, int(args.rrf_k or _RRF_K))
    rrf_log_top = max(0, int(args.rrf_log_top or 0))
    max_per_doc = max(0, int(args.max_per_doc or 0))
    annotation_k = max(0, int(args.annotation_k or 0))
    base_k = max(1, int(args.k))
    if is_short_query(raw_query):
        base_k = max(base_k, 12)
    agentic_mode = str(args.agentic or "off").strip().lower()
    agentic_max_iters = max(1, int(args.agentic_max_iters or 1))
    agentic_full_doc_chunks = max(1, int(args.agentic_full_doc_chunks or _AGENTIC_FULL_DOC_MAX_CHUNKS_DEFAULT))
    agentic_full_doc_max_chars = max(0, int(args.agentic_full_doc_max_chars or _AGENTIC_FULL_DOC_MAX_CHARS_DEFAULT))
    strategy_trace: List[Dict[str, Any]] = []

    if args.history_file:
        check_abort("load_history")
        emit_phase("load_history", "start")
        phase_started_at = time.perf_counter()
        history_messages = load_history_messages(args.history_file)
        record_phase("load_history", phase_started_at)
        emit_phase("load_history", "done", messages=len(history_messages))
    else:
        history_messages = []

    if args.rewrite_followups and history_messages:
        check_abort("rewrite_followup")
        emit_phase("rewrite_followup", "start", query=raw_query)
        phase_started_at = time.perf_counter()
        rewritten_query = rewrite_follow_up_query(
            args.chat_base_url,
            args.chat_api_key,
            args.chat_model,
            raw_query,
            history_messages,
            should_abort=should_abort,
            endpoint_mode=args.chat_endpoint_mode,
        )
        record_phase("rewrite_followup", phase_started_at)
        if rewritten_query and rewritten_query.strip() and rewritten_query.strip().lower() != raw_query.strip().lower():
            retrieval_query = rewritten_query.strip()
            query_for_display = retrieval_query
            query_rewritten = True
        emit_phase("rewrite_followup", "done", rewritten=query_rewritten, retrieval_query=retrieval_query)

    def embed_query(query_text: str) -> bytes:
        nonlocal client, index_dim_cache
        phase_started_at = time.perf_counter()
        try:
            check_abort("embed_query")
            embedding = request_embedding(args.embed_base_url, args.embed_api_key, args.embed_model, query_text)
            embedding_dim = len(embedding)
            if index_dim_cache is None:
                index_dim_cache = get_index_vector_dim(client, args.index)
            if index_dim_cache and index_dim_cache != embedding_dim:
                raise RuntimeError(f"Embedding dim mismatch: index={index_dim_cache} model={embedding_dim}")
            embedding = normalize_vector(embedding)
            return vector_to_bytes(embedding)
        finally:
            record_phase("embed_query", phase_started_at)

    if use_combo:
        if args.expand_query:
            check_abort("expand_query")
            emit_phase("expand_query", "start", query=retrieval_query)
            phase_started_at = time.perf_counter()
            expanded_queries = expand_query(
                args.chat_base_url,
                args.chat_api_key,
                args.chat_model,
                retrieval_query,
                max(1, int(args.expand_count or 0)),
                should_abort=should_abort,
                endpoint_mode=args.chat_endpoint_mode,
            )
            record_phase("expand_query", phase_started_at)
            emit_phase("expand_query", "done", count=len(expanded_queries))
        if expanded_queries:
            query_for_display = expanded_queries[0]
        candidate_multiplier = max(1, int(args.rerank_candidates or 1))
        candidate_k = max(base_k * candidate_multiplier, base_k)
        query_variants = [retrieval_query] + expanded_queries
        candidates_map: Dict[str, Dict[str, Any]] = {}
        try:
            emit_phase("retrieve_candidates", "start", variants=len(query_variants), k=candidate_k)
            for variant in query_variants:
                check_abort("retrieve_candidates")
                vec = embed_query(variant)
                keywords = extract_keywords(variant)
                phase_started_at = time.perf_counter()
                retrieved_variant, _ = retrieve_with_broadening(
                    client,
                    args.index,
                    vec,
                    candidate_k,
                    keywords,
                    rrf_k=rrf_k,
                    rrf_log_top=rrf_log_top,
                    max_per_doc=0,
                    annotation_k=0,
                )
                record_phase("retrieve_with_broadening", phase_started_at)
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
            emit_phase("retrieve_candidates", "done", unique_candidates=len(candidates_map))
        except Exception as exc:
            eprint(f"RedisSearch query failed: {exc}")
            return 2

        candidates = list(candidates_map.values())
        if args.rerank:
            rerank_query = query_for_display or retrieval_query
            check_abort("reranker_load")
            emit_phase("reranker_load", "start", model=args.rerank_model)
            phase_started_at = time.perf_counter()
            reranker = load_reranker(args.rerank_model)
            record_phase("reranker_load", phase_started_at)
            emit_phase("reranker_load", "done", loaded=reranker is not None)
            check_abort("rerank_score")
            emit_phase("rerank_score", "start", candidates=len(candidates))
            phase_started_at = time.perf_counter()
            reranked = rerank_candidates(
                reranker,
                rerank_query,
                candidates,
                max(200, int(args.rerank_max_chars or _RERANK_MAX_CHARS_DEFAULT)),
            )
            record_phase("rerank_score", phase_started_at)
            emit_phase("rerank_score", "done", reranked=len(reranked))
            retrieved = apply_doc_cap(reranked, max_per_doc)[:base_k]
        else:
            ordered = apply_tag_boosting(candidates, extract_keywords(retrieval_query))
            retrieved = apply_doc_cap(ordered, max_per_doc)[:base_k]
        if annotation_k > 0:
            try:
                check_abort("retrieve_annotations")
                emit_phase("retrieve_annotations", "start", k=annotation_k)
                vec = embed_query(retrieval_query)
                keywords = extract_keywords(retrieval_query)
                phase_started_at = time.perf_counter()
                annotations = retrieve_annotation_chunks(
                    client,
                    args.index,
                    vec,
                    annotation_k,
                    keywords,
                )
                record_phase("retrieve_annotations", phase_started_at)
                emit_phase("retrieve_annotations", "done", count=len(annotations))
                retrieved = merge_annotation_chunks(retrieved, annotations, annotation_k)
            except Exception as exc:
                eprint(f"Annotation retrieval failed: {exc}")
    else:
        check_abort("retrieve_primary")
        emit_phase("retrieve_primary", "start", k=base_k)
        try:
            vec = embed_query(retrieval_query)
        except Exception as exc:
            eprint(f"Failed to embed query: {exc}")
            return 2
        keywords = extract_keywords(retrieval_query)
        try:
            phase_started_at = time.perf_counter()
            retrieved, _ = retrieve_with_broadening(
                client,
                args.index,
                vec,
                base_k,
                keywords,
                rrf_k=rrf_k,
                rrf_log_top=rrf_log_top,
                max_per_doc=max_per_doc,
                annotation_k=0,
            )
            record_phase("retrieve_with_broadening", phase_started_at)
            emit_phase("retrieve_primary", "done", count=len(retrieved))
        except Exception as exc:
            eprint(f"RedisSearch query failed: {exc}")
            return 2
        if annotation_k > 0:
            try:
                check_abort("retrieve_annotations")
                emit_phase("retrieve_annotations", "start", k=annotation_k)
                phase_started_at = time.perf_counter()
                annotations = retrieve_annotation_chunks(
                    client,
                    args.index,
                    vec,
                    annotation_k,
                    keywords,
                )
                record_phase("retrieve_annotations", phase_started_at)
                emit_phase("retrieve_annotations", "done", count=len(annotations))
                retrieved = merge_annotation_chunks(retrieved, annotations, annotation_k)
            except Exception as exc:
                eprint(f"Annotation retrieval failed: {exc}")

    if agentic_mode == "basic":
        emit_phase("agentic", "start", max_iters=agentic_max_iters)
        for step in range(1, agentic_max_iters + 1):
            check_abort("agentic_plan")
            emit_phase("agentic_plan", "start", step=step)
            phase_started_at = time.perf_counter()
            plan = plan_agentic_action(
                args.chat_base_url,
                args.chat_api_key,
                args.chat_model,
                raw_query,
                retrieved,
                step,
                agentic_max_iters,
            )
            record_phase("agentic_plan", phase_started_at)
            action = str(plan.get("action", "answer_with_current_context") or "answer_with_current_context")
            reason = str(plan.get("reason", "") or "")
            emit_phase("agentic_plan", "done", step=step, action=action, reason=reason)
            step_trace: Dict[str, Any] = {
                "step": step,
                "action": action,
                "reason": reason,
                "before_chunks": len(retrieved),
                "before_chars": sum_retrieved_chars(retrieved),
            }
            strategy_trace.append(step_trace)
            if action == "answer_with_current_context":
                break

            before_sig = retrieval_signature(retrieved)
            if action == "expand_retry":
                check_abort("agentic_expand_retry")
                emit_phase("agentic_expand_retry", "start", step=step)
                phase_started_at = time.perf_counter()
                retry_expanded = expand_query(
                    args.chat_base_url,
                    args.chat_api_key,
                    args.chat_model,
                    retrieval_query,
                    max(1, int(args.expand_count or 0)),
                    should_abort=should_abort,
                    endpoint_mode=args.chat_endpoint_mode,
                )
                record_phase("expand_query", phase_started_at)
                emit_phase("agentic_expand_retry", "done", step=step, expanded=len(retry_expanded))
                step_trace["expanded_queries"] = retry_expanded
                query_variants = [retrieval_query] + retry_expanded
                candidate_multiplier = max(2, int(args.rerank_candidates or 1))
                candidate_k = max(base_k * candidate_multiplier, base_k)
                candidates_map: Dict[str, Dict[str, Any]] = {}
                try:
                    emit_phase("agentic_retrieve", "start", step=step, variants=len(query_variants), k=candidate_k)
                    for variant in query_variants:
                        check_abort("agentic_retrieve")
                        vec = embed_query(variant)
                        keywords = extract_keywords(variant)
                        phase_started_at = time.perf_counter()
                        retrieved_variant, _ = retrieve_with_broadening(
                            client,
                            args.index,
                            vec,
                            candidate_k,
                            keywords,
                            rrf_k=rrf_k,
                            rrf_log_top=rrf_log_top,
                            max_per_doc=0,
                            annotation_k=0,
                        )
                        record_phase("retrieve_with_broadening", phase_started_at)
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
                    emit_phase("agentic_retrieve", "done", step=step, unique_candidates=len(candidates_map))
                except Exception as exc:
                    step_trace["status"] = "error"
                    step_trace["error"] = str(exc)
                    break

                candidates = list(candidates_map.values())
                if args.rerank:
                    check_abort("agentic_reranker_load")
                    emit_phase("agentic_reranker_load", "start", step=step, model=args.rerank_model)
                    phase_started_at = time.perf_counter()
                    reranker = load_reranker(args.rerank_model)
                    record_phase("reranker_load", phase_started_at)
                    emit_phase("agentic_reranker_load", "done", step=step, loaded=reranker is not None)
                    check_abort("agentic_rerank_score")
                    emit_phase("agentic_rerank_score", "start", step=step, candidates=len(candidates))
                    phase_started_at = time.perf_counter()
                    reranked = rerank_candidates(
                        reranker,
                        query_for_display or retrieval_query,
                        candidates,
                        max(200, int(args.rerank_max_chars or _RERANK_MAX_CHARS_DEFAULT)),
                    )
                    record_phase("rerank_score", phase_started_at)
                    emit_phase("agentic_rerank_score", "done", step=step, reranked=len(reranked))
                    updated = apply_doc_cap(reranked, max_per_doc)[:base_k]
                else:
                    ordered = apply_tag_boosting(candidates, extract_keywords(retrieval_query))
                    updated = apply_doc_cap(ordered, max_per_doc)[:base_k]
                if annotation_k > 0 and updated:
                    try:
                        check_abort("agentic_annotations")
                        emit_phase("agentic_annotations", "start", step=step, k=annotation_k)
                        vec = embed_query(retrieval_query)
                        keywords = extract_keywords(retrieval_query)
                        phase_started_at = time.perf_counter()
                        annotations = retrieve_annotation_chunks(
                            client,
                            args.index,
                            vec,
                            annotation_k,
                            keywords,
                        )
                        record_phase("retrieve_annotations", phase_started_at)
                        emit_phase("agentic_annotations", "done", step=step, count=len(annotations))
                        updated = merge_annotation_chunks(updated, annotations, annotation_k)
                    except Exception as exc:
                        step_trace["annotation_error"] = str(exc)
                if updated:
                    retrieved = updated
                    seen_expansions = {str(item).lower() for item in expanded_queries}
                    for item in retry_expanded:
                        key = str(item).lower()
                        if key in seen_expansions:
                            continue
                        seen_expansions.add(key)
                        expanded_queries.append(item)
                    if expanded_queries:
                        query_for_display = expanded_queries[0]
                else:
                    step_trace["status"] = "no_results"
                    break

            elif action == "full_document":
                check_abort("agentic_full_document")
                target_doc_id = str(plan.get("doc_id", "") or "").strip() or choose_top_doc_id(retrieved)
                step_trace["doc_id"] = target_doc_id
                if not target_doc_id:
                    step_trace["status"] = "skipped_no_doc_id"
                    break
                try:
                    emit_phase("agentic_full_document", "start", step=step, doc_id=target_doc_id)
                    phase_started_at = time.perf_counter()
                    full_chunks = retrieve_full_document_chunks(
                        client,
                        args.index,
                        target_doc_id,
                        agentic_full_doc_chunks,
                    )
                    record_phase("retrieve_full_document", phase_started_at)
                    emit_phase("agentic_full_document", "done", step=step, chunks=len(full_chunks))
                except Exception as exc:
                    step_trace["status"] = "error"
                    step_trace["error"] = str(exc)
                    break
                if not full_chunks:
                    step_trace["status"] = "no_results"
                    break
                full_chunks = trim_chunks_to_char_budget(full_chunks, agentic_full_doc_max_chars)
                merged = dedupe_by_doc_and_chunk(full_chunks + list(retrieved))
                retrieved = trim_chunks_to_char_budget(merged, agentic_full_doc_max_chars)
                step_trace["full_doc_chunks"] = len(full_chunks)

            after_sig = retrieval_signature(retrieved)
            step_trace["after_chunks"] = len(retrieved)
            step_trace["after_chars"] = sum_retrieved_chars(retrieved)
            if after_sig == before_sig:
                step_trace["status"] = "no_change"
                break
        emit_phase("agentic", "done", steps=len(strategy_trace))

    check_abort("build_context")
    emit_phase("build_context", "start", chunks=len(retrieved))
    phase_started_at = time.perf_counter()
    context = build_context(retrieved)
    record_phase("build_context", phase_started_at)
    emit_phase("build_context", "done", context_chars=len(context))

    system_prompt = (
        "Use ONLY the provided context for factual claims. If insufficient, say you do not know. "
        "Chat history is only for conversational continuity or for providing concepts to be retrieved. "
        "Add inline citations using this exact format: [[cite:DOC_ID:PAGE_START-PAGE_END]]. "
        "Example: ... [[cite:ABC123:12-13]]."
    )
    history_block = format_history_block(history_messages)
    if history_block:
        history_block = f"Chat history (for reference only):\n{history_block}\n\n"
    def build_user_prompt(context_block: str) -> str:
        return f"{history_block}Question: {args.query}\n\nContext:\n{context_block}"
    lm_studio_budget = get_lm_studio_context_budget(
        args.chat_base_url,
        args.chat_api_key,
        args.chat_model,
        f"{system_prompt}\n\n{history_block}\n{args.query}\n{context}",
    )
    max_output_tokens: Optional[int] = None
    if lm_studio_budget:
        max_output_tokens = int(lm_studio_budget.get("max_output_tokens") or 0) or None
        prompt_budget = max(
            64,
            int(lm_studio_budget.get("context_length") or 0) - int(max_output_tokens or 0) - _LM_STUDIO_CONTEXT_OVERHEAD_TOKENS,
        )
        static_prompt_tokens = estimate_text_tokens(system_prompt) + estimate_text_tokens(build_user_prompt(""))
        available_context_tokens = max(64, prompt_budget - static_prompt_tokens)
        trimmed_context = trim_text_to_token_budget(context, available_context_tokens)
        if trimmed_context:
            context = trimmed_context

    user_prompt = build_user_prompt(context)

    citations = build_citations(retrieved)

    answer = ""
    streamed = False
    if args.stream:
        def emit(obj: Dict[str, Any]) -> None:
            if emit_json is not None:
                emit_json(obj)
            else:
                print(json.dumps(obj, ensure_ascii=False), flush=True)

        try:
            check_abort("chat_stream")
            emit_phase("chat_stream", "start", model=args.chat_model)
            phase_started_at = time.perf_counter()
            answer = request_chat_stream(
                args.chat_base_url,
                args.chat_api_key,
                args.chat_model,
                args.temperature,
                system_prompt,
                user_prompt,
                lambda chunk: emit({"type": "delta", "content": chunk}),
                max_output_tokens=max_output_tokens,
                timing=chat_timing,
                should_abort=should_abort,
                endpoint_mode=args.chat_endpoint_mode,
            )
            record_phase("chat_request", phase_started_at)
            emit_phase("chat_stream", "done", chars=len(answer))
            streamed = True
        except Exception as exc:
            if is_stream_unsupported(str(exc)):
                chat_timing["chat_fallback_to_non_stream"] = True
                emit_phase("chat_stream", "fallback", reason="stream_unsupported")
                streamed = False
            else:
                eprint(f"Chat request failed: {exc}")
                return 2

    if not streamed:
        try:
            check_abort("chat_non_stream")
            emit_phase("chat_non_stream", "start", model=args.chat_model)
            phase_started_at = time.perf_counter()
            answer = request_chat(
                args.chat_base_url,
                args.chat_api_key,
                args.chat_model,
                args.temperature,
                system_prompt,
                user_prompt,
                max_output_tokens=max_output_tokens,
                timing=chat_timing,
                should_abort=should_abort,
                endpoint_mode=args.chat_endpoint_mode,
            )
            record_phase("chat_request", phase_started_at)
            emit_phase("chat_non_stream", "done", chars=len(answer))
        except Exception as exc:
            eprint(f"Chat request failed: {exc}")
            return 2

    total_ms = int((time.perf_counter() - run_started_at) * 1000)
    timing_summary: Dict[str, Any] = {
        "total_ms": total_ms,
        "phase_ms": phase_ms,
        "phase_counts": phase_counts,
        "chat": chat_timing,
    }

    output = {
        "query": query_for_display,
        "raw_query": raw_query if (query_rewritten or bool(expanded_queries)) else "",
        "retrieval_query": retrieval_query if query_rewritten else "",
        "query_rewritten": query_rewritten,
        "expanded_queries": expanded_queries,
        "rerank_used": bool(args.rerank),
        "rerank_model": args.rerank_model if args.rerank else "",
        "agentic_mode": agentic_mode,
        "agentic_trace": strategy_trace,
        "answer": answer,
        "citations": citations,
        "retrieved": retrieved,
        "timing": timing_summary,
    }

    if args.stream and streamed:
        final_payload = {"type": "final", **output}
        if emit_json is not None:
            emit_json(final_payload)
        else:
            print(json.dumps(final_payload, ensure_ascii=False), flush=True)
    else:
        if emit_json is not None:
            emit_json(output)
        else:
            print(json.dumps(output, ensure_ascii=False))
    return 0


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = build_arg_parser()
    args = parser.parse_args(list(argv) if argv is not None else None)
    return run_with_args(args)


if __name__ == "__main__":
    sys.exit(main())
