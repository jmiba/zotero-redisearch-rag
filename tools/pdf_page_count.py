#!/usr/bin/env python3

import argparse
import json
import sys


def main() -> int:
    parser = argparse.ArgumentParser(description="Return PDF page count as JSON.")
    parser.add_argument("--pdf", required=True, help="Absolute path to the PDF file.")
    args = parser.parse_args()

    try:
      from pypdf import PdfReader  # type: ignore
    except Exception as exc:
      sys.stderr.write(f"Failed to import pypdf: {exc}\n")
      return 2

    try:
      reader = PdfReader(args.pdf)
      page_count = int(len(reader.pages))
    except Exception as exc:
      sys.stderr.write(f"Failed to read PDF page count: {exc}\n")
      return 2

    print(json.dumps({"pages": page_count}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
