#!/usr/bin/env python3
import sys
import redis
import argparse

def compute_average_chunk_size(redis_url: str, prefix: str, doc_id: str = None) -> None:
    client = redis.Redis.from_url(redis_url, decode_responses=True)
    pattern = f"{prefix}*" if not doc_id else f"{prefix}{doc_id}:*"
    keys = client.keys(pattern)
    total_chars = 0
    count = 0
    for key in keys:
        text = client.hget(key, "text")
        if text:
            total_chars += len(text)
            count += 1
    avg = total_chars / count if count else 0
    if doc_id:
        print(f"Average chunk size for doc_id {doc_id}: {avg:.2f} characters ({count} chunks)")
    else:
        print(f"Average chunk size: {avg:.2f} characters ({count} chunks)")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Compute average chunk size in Redis index.")
    parser.add_argument("--redis-url", type=str, required=True, help="Redis URL")
    parser.add_argument("--prefix", type=str, required=True, help="Chunk key prefix")
    parser.add_argument("--doc-id", type=str, help="Optional doc_id to filter chunks")
    args = parser.parse_args()
    compute_average_chunk_size(args.redis_url, args.prefix, args.doc_id)
