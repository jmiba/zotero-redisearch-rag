#!/usr/bin/env python3
import argparse
import sys
from typing import List

import redis


def eprint(message: str) -> None:
    sys.stderr.write(message + "\n")


def delete_doc_chunks(client: redis.Redis, prefix: str, doc_id: str) -> int:
    pattern = f"{prefix}{doc_id}:*"
    deleted = 0
    batch: List[bytes] = []
    for key in client.scan_iter(match=pattern, count=500):
        batch.append(key)
        if len(batch) >= 500:
            client.delete(*batch)
            deleted += len(batch)
            batch = []
    if batch:
        client.delete(*batch)
        deleted += len(batch)
    return deleted


def main() -> int:
    parser = argparse.ArgumentParser(description="Delete Redis chunk keys for one doc_id")
    parser.add_argument("--redis-url", required=True)
    parser.add_argument("--prefix", required=True)
    parser.add_argument("--doc-id", required=True)
    args = parser.parse_args()

    doc_id = str(args.doc_id or "").strip()
    prefix = str(args.prefix or "").strip()
    if not doc_id:
        eprint("Missing doc_id")
        return 2
    if not prefix:
        eprint("Missing prefix")
        return 2

    try:
        client = redis.Redis.from_url(args.redis_url, decode_responses=False)
        deleted = delete_doc_chunks(client, prefix, doc_id)
    except Exception as exc:
        eprint(f"Failed to delete Redis chunk keys for doc_id {doc_id}: {exc}")
        return 1

    print(deleted)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
