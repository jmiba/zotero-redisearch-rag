#!/usr/bin/env python3

import argparse
import json
import os
import sys
from typing import Dict, Optional, Set

import redis


def eprint(message: str) -> None:
    sys.stderr.write(message + "\n")


def extract_doc_id(key: str, prefix: str) -> Optional[str]:
    if not key.startswith(prefix):
        return None
    remainder = key[len(prefix) :]
    if not remainder:
        return None
    return remainder.split(":", 1)[0] or None


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Delete Redis chunk keys that have no matching cached item/chunk JSON."
    )
    parser.add_argument("--redis-url", required=True)
    parser.add_argument("--key-prefix", required=True)
    parser.add_argument("--chunk-dir", required=True)
    parser.add_argument("--item-dir", required=True)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--sample", type=int, default=10)
    args = parser.parse_args()

    payload = {
        "redis_url": args.redis_url,
        "key_prefix": args.key_prefix,
        "chunk_dir": args.chunk_dir,
        "item_dir": args.item_dir,
        "dry_run": bool(args.dry_run),
    }

    try:
        client = redis.Redis.from_url(args.redis_url, decode_responses=True)
    except Exception as exc:
        eprint(f"Failed to connect to Redis: {exc}")
        return 2

    pattern = f"{args.key_prefix}*"
    doc_cache: Dict[str, bool] = {}
    orphan_doc_ids: Set[str] = set()
    keys_scanned = 0
    keys_deleted = 0
    docs_checked = 0

    pipeline = None
    if not args.dry_run:
        pipeline = client.pipeline(transaction=False)

    def doc_missing_cache(doc_id: str) -> bool:
        nonlocal docs_checked
        if doc_id in doc_cache:
            return doc_cache[doc_id]
        docs_checked += 1
        chunk_path = os.path.join(args.chunk_dir, f"{doc_id}.json")
        item_path = os.path.join(args.item_dir, f"{doc_id}.json")
        missing = not os.path.isfile(chunk_path) and not os.path.isfile(item_path)
        doc_cache[doc_id] = missing
        return missing

    try:
        for key in client.scan_iter(match=pattern, count=500):
            keys_scanned += 1
            doc_id = client.hget(key, "doc_id")
            if not doc_id:
                doc_id = extract_doc_id(key, args.key_prefix)
            if not doc_id:
                continue
            if doc_missing_cache(doc_id):
                orphan_doc_ids.add(doc_id)
                if pipeline is not None:
                    pipeline.delete(key)
                    keys_deleted += 1
                    if keys_deleted % 500 == 0:
                        pipeline.execute()
        if pipeline is not None:
            pipeline.execute()
    except Exception as exc:
        eprint(f"Failed to purge orphaned keys: {exc}")
        return 2

    payload.update(
        {
            "keys_scanned": keys_scanned,
            "keys_deleted": keys_deleted,
            "docs_checked": docs_checked,
            "orphan_doc_count": len(orphan_doc_ids),
            "sample_orphan_doc_ids": sorted(orphan_doc_ids)[: max(0, args.sample)],
        }
    )
    print(json.dumps(payload, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
