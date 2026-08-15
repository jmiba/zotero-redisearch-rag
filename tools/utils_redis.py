from collections.abc import Mapping
from typing import Any, Dict, Iterable, List

import redis


def create_redis_client(redis_url: str, decode_responses: bool = False) -> redis.Redis:
    """Create a Redis client that uses the native RESP3 wire protocol."""
    return redis.Redis.from_url(
        redis_url,
        decode_responses=decode_responses,
        protocol=3,
    )


def decode_nested(value: Any) -> Any:
    """Decode byte strings recursively without changing scalar value types."""
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="ignore")
    if isinstance(value, Mapping):
        return {
            str(decode_nested(key)): decode_nested(item)
            for key, item in value.items()
        }
    if isinstance(value, (list, tuple)):
        return [decode_nested(item) for item in value]
    return value


def parse_info_map(info: Any) -> Dict[str, Any]:
    """Normalize FT.INFO replies from RESP3 maps or RESP2 key/value arrays."""
    if isinstance(info, Mapping):
        decoded = decode_nested(info)
        return decoded if isinstance(decoded, dict) else {}
    if not isinstance(info, (list, tuple)):
        return {}
    result: Dict[str, Any] = {}
    for index in range(0, len(info) - 1, 2):
        key = str(decode_nested(info[index]))
        result[key] = decode_nested(info[index + 1])
    return result


def iter_info_attributes(info_map: Dict[str, Any]) -> Iterable[Dict[str, Any]]:
    """Yield normalized FT.INFO attribute maps for either response protocol."""
    attributes = info_map.get("attributes") or info_map.get("fields") or []
    if not isinstance(attributes, (list, tuple)):
        return
    for attribute in attributes:
        if isinstance(attribute, Mapping):
            decoded = decode_nested(attribute)
            if isinstance(decoded, dict):
                yield decoded
        elif isinstance(attribute, (list, tuple)):
            yield parse_info_map(attribute)


def parse_search_results(raw: Any) -> List[Dict[str, Any]]:
    """Normalize FT.SEARCH replies from RESP3 maps or RESP2 arrays."""
    results: List[Dict[str, Any]] = []
    if isinstance(raw, Mapping):
        reply = decode_nested(raw)
        entries = reply.get("results", []) if isinstance(reply, dict) else []
        if not isinstance(entries, (list, tuple)):
            return results
        for entry in entries:
            if not isinstance(entry, dict):
                continue
            attributes = entry.get("extra_attributes")
            if isinstance(attributes, dict):
                results.append(attributes)
        return results

    if not isinstance(raw, (list, tuple)) or len(raw) < 2:
        return results
    for index in range(1, len(raw), 2):
        if index + 1 >= len(raw):
            break
        fields = raw[index + 1]
        if not isinstance(fields, (list, tuple)):
            continue
        results.append(parse_info_map(fields))
    return results


def parse_search_total(raw: Any) -> int:
    """Return the total result count from an RESP3 or RESP2 FT.SEARCH reply."""
    value: Any = 0
    if isinstance(raw, Mapping):
        reply = decode_nested(raw)
        if isinstance(reply, dict):
            value = reply.get("total_results", reply.get("total", 0))
    elif isinstance(raw, (list, tuple)) and raw:
        value = decode_nested(raw[0])
    try:
        return int(value)
    except (TypeError, ValueError):
        return 0
