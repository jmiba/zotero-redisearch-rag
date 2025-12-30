#!/usr/bin/env python3

import argparse
import json
import sys
from typing import Any, Dict, Tuple

import redis


def eprint(message: str) -> None:
    sys.stderr.write(message + "\n")


def decode_value(value: Any) -> Any:
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="ignore")
    return value


def parse_info_map(info: Any) -> Dict[str, Any]:
    if not isinstance(info, (list, tuple)):
        return {}
    it = iter(info)
    result: Dict[str, Any] = {}
    for key in it:
        value = next(it, None)
        result[str(decode_value(key))] = value
    return result


def extract_summary(info_map: Dict[str, Any]) -> Dict[str, Any]:
    summary: Dict[str, Any] = {}
    for key in (
        "index_name",
        "num_docs",
        "num_terms",
        "max_doc_id",
        "hash_indexing_failures",
        "percent_indexed",
        "gc_stats",
    ):
        if key in info_map:
            summary[key] = decode_value(info_map[key])
    return summary


def make_json_safe(value: Any) -> Any:
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="ignore")
    if isinstance(value, dict):
        return {str(k): make_json_safe(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [make_json_safe(item) for item in value]
    return value


def main() -> int:
    parser = argparse.ArgumentParser(description="Collect Redis/RediSearch diagnostics.")
    parser.add_argument("--redis-url", required=True)
    parser.add_argument("--index", required=True)
    args = parser.parse_args()

    payload: Dict[str, Any] = {
        "redis_url": args.redis_url,
        "index": args.index,
    }

    try:
        client = redis.Redis.from_url(args.redis_url, decode_responses=False)
        pong = client.ping()
        payload["ping"] = bool(pong)
        try:
            info = client.execute_command("FT.INFO", args.index)
            info_map = parse_info_map(info)
            payload["ft_info"] = extract_summary(info_map)
            payload["ft_info_raw"] = {
                key: decode_value(value) for key, value in info_map.items()
            }
        except Exception as exc:
            payload["ft_info_error"] = str(exc)
    except Exception as exc:
        payload["error"] = str(exc)

    print(json.dumps(make_json_safe(payload), ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
