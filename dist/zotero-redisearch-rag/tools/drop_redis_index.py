#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.0.0
import argparse
import sys

import redis


def main() -> int:
    parser = argparse.ArgumentParser(description="Drop a RedisSearch index.")
    parser.add_argument("--redis-url", required=True)
    parser.add_argument("--index", required=True)
    parser.add_argument("--drop-docs", action="store_true", help="Drop indexed documents too (DD).")
    args = parser.parse_args()

    try:
        client = redis.Redis.from_url(args.redis_url, decode_responses=True)
    except Exception as exc:
        print(f"Failed to connect to Redis: {exc}", file=sys.stderr)
        return 2

    try:
        if args.drop_docs:
            client.execute_command("FT.DROPINDEX", args.index, "DD")
        else:
            client.execute_command("FT.DROPINDEX", args.index)
    except Exception as exc:
        message = str(exc)
        if "Unknown Index name" in message or "Unknown index name" in message:
            print(f"Index {args.index} did not exist; continuing.", file=sys.stderr)
            return 0
        print(f"Failed to drop index {args.index}: {exc}", file=sys.stderr)
        return 2

    print(f"Dropped index {args.index}{' (DD)' if args.drop_docs else ''}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
