#!/usr/bin/env python3
import argparse
import html
import json
import os
import re
import sys
from typing import Any, Dict, Iterable, List, Optional, Sequence, Set, Tuple

from utils_embedding import normalize_vector, vector_to_bytes, request_embedding
import redis
import requests


def eprint(message: str) -> None:
    sys.stderr.write(message + "\n")


EMBED_MAX_CHARS = 12000
EMBED_MAX_CHARS_NON_ASCII = 8000
EMBED_SUBCHUNK_CHARS_DEFAULT = 3500
EMBED_SUBCHUNK_OVERLAP_DEFAULT = 200
EMBED_CONTEXT_WINDOW_DEFAULT = 0
EMBED_CONTEXT_CHARS_DEFAULT = 220


def truncate_for_embedding(text: str) -> Tuple[str, bool]:
    if not text:
        return text, False
    max_chars = EMBED_MAX_CHARS
    non_ascii = sum(1 for ch in text if ord(ch) > 127)
    if non_ascii / max(1, len(text)) > 0.2:
        max_chars = EMBED_MAX_CHARS_NON_ASCII
    if len(text) <= max_chars:
        return text, False
    sep = "\n...\n"
    head_len = max(0, (max_chars - len(sep)) // 2)
    tail_len = max_chars - len(sep) - head_len
    trimmed = f"{text[:head_len]}{sep}{text[-tail_len:]}" if tail_len > 0 else text[:max_chars]
    return trimmed, True


def _list_to_dict(items: Sequence[Any]) -> Dict[str, Any]:
    data: Dict[str, Any] = {}
    for i in range(0, len(items) - 1, 2):
        key = items[i]
        value = items[i + 1]
        if isinstance(key, bytes):
            key = key.decode("utf-8", "ignore")
        if isinstance(value, bytes):
            value = value.decode("utf-8", "ignore")
        data[str(key)] = value
    return data


def _iter_attributes(info_value: Any) -> Iterable[Dict[str, Any]]:
    if not isinstance(info_value, list):
        return []
    for entry in info_value:
        if isinstance(entry, list):
            yield _list_to_dict(entry)


def get_index_vector_dim(
    client: redis.Redis, index_name: str, field_name: str = "embedding"
) -> Optional[int]:
    try:
        info = client.execute_command("FT.INFO", index_name)
    except Exception:
        return None
    info_dict = _list_to_dict(info if isinstance(info, list) else [])
    attrs = info_dict.get("attributes")
    for attr in _iter_attributes(attrs):
        attr_name = attr.get("attribute") or attr.get("identifier")
        if attr_name != field_name:
            continue
        if str(attr.get("type", "")).upper() != "VECTOR":
            continue
        dim_value = attr.get("dimension") or attr.get("dim")
        try:
            return int(dim_value)
        except Exception:
            return None
    return None


def ensure_index(client: redis.Redis, index_name: str, prefix: str, embedding_dim: int) -> None:
    try:
        client.execute_command("FT.INFO", index_name)
        existing_dim = get_index_vector_dim(client, index_name)
        if existing_dim and existing_dim != embedding_dim:
            raise RuntimeError(
                f"Embedding dim mismatch: index={existing_dim} model={embedding_dim}"
            )
        ensure_schema_fields(client, index_name)
        return
    except redis.exceptions.ResponseError as exc:
        message = str(exc).lower()
        if "unknown index name" not in message:
            raise

    client.execute_command(
        "FT.CREATE",
        index_name,
        "ON",
        "HASH",
        "PREFIX",
        "1",
        prefix,
        "SCHEMA",
        "doc_id",
        "TAG",
        "chunk_id",
        "TAG",
        "attachment_key",
        "TAG",
        "title",
        "TEXT",
        "authors",
        "TAG",
        "SEPARATOR",
        "|",
        "tags",
        "TAG",
        "SEPARATOR",
        "|",
        "chunk_tags",
        "TAG",
        "SEPARATOR",
        "|",
        "year",
        "NUMERIC",
        "item_type",
        "TAG",
        "SEPARATOR",
        "|",
        "source_pdf",
        "TEXT",
        "page_start",
        "NUMERIC",
        "page_end",
        "NUMERIC",
        "section",
        "TEXT",
        "text",
        "TEXT",
        "embedding",
        "VECTOR",
        "HNSW",
        "6",
        "TYPE",
        "FLOAT32",
        "DIM",
        str(embedding_dim),
        "DISTANCE_METRIC",
        "COSINE",
    )


def ensure_schema_fields(client: redis.Redis, index_name: str) -> None:
    fields: List[Tuple[str, List[str]]] = [
        ("attachment_key", ["TAG"]),
        ("title", ["TEXT"]),
        ("authors", ["TAG", "SEPARATOR", "|"]),
        ("tags", ["TAG", "SEPARATOR", "|"]),
        ("chunk_tags", ["TAG", "SEPARATOR", "|"]),
        ("year", ["NUMERIC"]),
        ("item_type", ["TAG", "SEPARATOR", "|"]),
    ]
    for name, spec in fields:
        try:
            client.execute_command("FT.ALTER", index_name, "SCHEMA", "ADD", name, *spec)
        except redis.exceptions.ResponseError as exc:
            message = str(exc).lower()
            if "duplicate" in message or "already exists" in message:
                continue
            raise


def infer_item_json_path(chunks_json: str, doc_id: str) -> Optional[str]:
    base_name = f"{doc_id}.json"
    chunks_dir = os.path.dirname(chunks_json)
    candidates: List[str] = []
    if os.path.basename(chunks_dir) == "chunks":
        candidates.append(os.path.join(os.path.dirname(chunks_dir), "items", base_name))
    marker = f"{os.sep}chunks{os.sep}"
    if marker in chunks_json:
        candidates.append(chunks_json.replace(marker, f"{os.sep}items{os.sep}"))
    candidates.append(os.path.join(chunks_dir, base_name))
    for candidate in candidates:
        if os.path.isfile(candidate):
            return candidate
    return None


def parse_item_metadata(item_payload: Dict[str, Any]) -> Dict[str, Any]:
    data = item_payload.get("data") if isinstance(item_payload.get("data"), dict) else item_payload
    title = str(data.get("title", "")).strip()
    item_type = str(data.get("itemType", "")).strip()
    tags: List[str] = []
    for tag in data.get("tags", []) or []:
        if isinstance(tag, dict):
            value = str(tag.get("tag", "")).strip()
        else:
            value = str(tag).strip()
        if value:
            tags.append(value)

    creators = data.get("creators", []) or []
    authors: List[str] = []
    for creator in creators:
        if not isinstance(creator, dict):
            continue
        name = ""
        if creator.get("name"):
            name = str(creator.get("name", "")).strip()
        else:
            first = str(creator.get("firstName", "")).strip()
            last = str(creator.get("lastName", "")).strip()
            name = " ".join(part for part in (first, last) if part)
        if name:
            authors.append(name)

    year = 0
    date_field = str(data.get("date", "")).strip()
    match = None
    if date_field:
        match = next(iter(__import__("re").findall(r"(1[5-9]\d{2}|20\d{2})", date_field)), None)
    if match:
        try:
            year = int(match)
        except ValueError:
            year = 0
    elif isinstance(data.get("year"), (int, float)):
        year = int(data.get("year"))

    return {
        "title": title,
        "authors": "|".join(authors),
        "tags": "|".join(tags),
        "year": year,
        "item_type": item_type,
    }


def parse_chunk_id_list(raw: Optional[str], doc_id: str) -> List[str]:
    if not raw:
        return []
    items: List[str] = []
    for part in raw.split(","):
        cleaned = part.strip()
        if not cleaned:
            continue
        if doc_id and cleaned.startswith(f"{doc_id}:"):
            cleaned = cleaned.split(":", 1)[1]
        items.append(cleaned)
    return items


def delete_existing_chunk_keys(
    client: redis.Redis,
    prefix: str,
    doc_id: str,
    chunk_id: str,
) -> int:
    deleted = 0
    base = f"{prefix}{doc_id}:{chunk_id}"
    try:
        if client.exists(base):
            client.delete(base)
            deleted += 1
    except Exception:
        pass
    pattern = f"{base}#*"
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


def markdown_to_text(text: str) -> str:
    if not text:
        return ""
    text = strip_image_references(text)
    try:
        import markdown as md
    except Exception:
        return text
    try:
        html_text = md.markdown(text, extensions=["extra", "sane_lists"])
    except Exception:
        return text
    html_text = re.sub(r"<br\s*/?>", "\n", html_text, flags=re.IGNORECASE)
    stripped = re.sub(r"<[^>]+>", " ", html_text)
    stripped = html.unescape(stripped)
    stripped = re.sub(r"[ \t]+", " ", stripped)
    stripped = re.sub(r"\s*\n\s*", "\n", stripped)
    return stripped.strip()


_OBSIDIAN_IMAGE_RE = re.compile(r"!\[\[(?P<target>[^\]|]+)(?:\|(?P<label>[^\]]+))?\]\]")
_MARKDOWN_IMAGE_RE = re.compile(r"!\[(?P<label>[^\]]*)]\([^)]+\)")
_HTML_IMAGE_RE = re.compile(r"<img[^>]*>", re.IGNORECASE)


def strip_image_references(text: str) -> str:
    if not text:
        return ""
    def _image_marker(label: str) -> str:
        label = label.strip()
        if label:
            return f" Image caption: {label} "
        return " Image "

    def obsidian_repl(match: re.Match[str]) -> str:
        label = (match.group("label") or "").strip()
        return _image_marker(label)

    def markdown_repl(match: re.Match[str]) -> str:
        label = (match.group("label") or "").strip()
        return _image_marker(label)

    def html_repl(match: re.Match[str]) -> str:
        tag = match.group(0)
        alt_match = re.search(r"\balt=(['\"])(?P<alt>[^'\"]*)\1", tag, re.IGNORECASE)
        if alt_match:
            alt = (alt_match.group("alt") or "").strip()
            return _image_marker(alt)
        return _image_marker("")

    text = _OBSIDIAN_IMAGE_RE.sub(obsidian_repl, text)
    text = _MARKDOWN_IMAGE_RE.sub(markdown_repl, text)
    text = _HTML_IMAGE_RE.sub(html_repl, text)
    return text


def split_paragraphs(text: str) -> List[str]:
    paragraphs = re.split(r"\n\s*\n", text)
    return [para.strip() for para in paragraphs if para.strip()]


def split_long_text(text: str, max_chars: int) -> List[str]:
    if max_chars <= 0 or len(text) <= max_chars:
        return [text]
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    if len(sentences) <= 1:
        return [text[i:i + max_chars] for i in range(0, len(text), max_chars)]
    chunks: List[str] = []
    current: List[str] = []
    current_len = 0
    for sentence in sentences:
        sent = sentence.strip()
        if not sent:
            continue
        if current_len + len(sent) + 1 > max_chars and current:
            chunks.append(" ".join(current).strip())
            current = [sent]
            current_len = len(sent)
        else:
            current.append(sent)
            current_len += len(sent) + 1
    if current:
        chunks.append(" ".join(current).strip())
    return chunks


def split_text_by_size(text: str, max_chars: int, overlap_chars: int) -> List[str]:
    if max_chars <= 0 or len(text) <= max_chars:
        return [text]
    paragraphs = split_paragraphs(text) or [text]
    chunks: List[str] = []
    current: List[str] = []
    current_len = 0

    def flush() -> None:
        nonlocal current, current_len
        if not current:
            return
        chunk = "\n\n".join(current).strip()
        if chunk:
            chunks.append(chunk)
        current = []
        current_len = 0

    for para in paragraphs:
        for piece in split_long_text(para, max_chars):
            piece_len = len(piece)
            if current_len + piece_len + 2 > max_chars and current:
                flush()
            current.append(piece)
            current_len += piece_len + 2

    flush()

    if overlap_chars <= 0 or len(chunks) <= 1:
        return chunks

    overlapped: List[str] = []
    previous = ""
    for chunk in chunks:
        if previous:
            overlap = previous[-overlap_chars:]
            combined = f"{overlap}\n{chunk}".strip()
        else:
            combined = chunk
        overlapped.append(combined)
        previous = chunk
    return overlapped


def split_for_embedding(text: str, max_chars: int, overlap_chars: int) -> List[str]:
    if not text:
        return []
    max_chars = int(max_chars or 0)
    overlap_chars = max(0, int(overlap_chars or 0))
    if max_chars <= 0:
        return [text]
    chunks = split_text_by_size(text, max_chars, overlap_chars)
    return chunks or [text]


def markdown_to_index_text(text: str) -> str:
    if not text:
        return ""
    text = strip_image_references(text)
    try:
        from markdown_it import MarkdownIt
    except Exception:
        return markdown_to_text(text)

    def inline_text(token: Any) -> str:
        if not getattr(token, "children", None):
            return str(getattr(token, "content", "") or "")
        parts: List[str] = []
        for child in token.children:
            t = getattr(child, "type", "")
            if t in ("text", "code_inline"):
                parts.append(str(child.content or ""))
            elif t == "softbreak":
                parts.append(" ")
            elif t == "hardbreak":
                parts.append("\n")
        return "".join(parts)

    def extract_table(tokens: Sequence[Any], start: int) -> Tuple[List[str], int]:
        headers: List[str] = []
        rows: List[List[str]] = []
        current: List[str] = []
        in_header = False
        i = start + 1
        while i < len(tokens):
            token = tokens[i]
            ttype = token.type
            if ttype == "thead_open":
                in_header = True
            elif ttype == "tbody_open":
                in_header = False
            elif ttype == "tr_open":
                current = []
            elif ttype in ("th_open", "td_open"):
                cell = ""
                if i + 1 < len(tokens) and tokens[i + 1].type == "inline":
                    cell = inline_text(tokens[i + 1]).strip()
                current.append(cell)
            elif ttype == "tr_close":
                if in_header and not headers:
                    headers = current
                else:
                    rows.append(current)
            elif ttype == "table_close":
                break
            i += 1

        lines: List[str] = []
        for row in rows:
            if headers:
                pairs: List[str] = []
                for idx, cell in enumerate(row):
                    if not cell:
                        continue
                    header = headers[idx] if idx < len(headers) and headers[idx] else f"Column {idx + 1}"
                    pairs.append(f"{header}: {cell}")
                if pairs:
                    lines.append("; ".join(pairs))
            else:
                row_line = " | ".join([cell for cell in row if cell])
                if row_line:
                    lines.append(row_line)
        return lines, i

    md = MarkdownIt("commonmark", {"html": False})
    try:
        md.enable("table")
    except Exception:
        pass
    tokens = md.parse(text)

    lines: List[str] = []
    list_depth = 0
    in_list_item = False
    list_item_parts: List[str] = []
    i = 0
    while i < len(tokens):
        token = tokens[i]
        ttype = token.type

        if ttype == "table_open":
            table_lines, i = extract_table(tokens, i)
            lines.extend(table_lines)
            i += 1
            continue

        if ttype in ("bullet_list_open", "ordered_list_open"):
            list_depth += 1
        elif ttype in ("bullet_list_close", "ordered_list_close"):
            list_depth = max(0, list_depth - 1)
        elif ttype == "list_item_open":
            in_list_item = True
            list_item_parts = []
        elif ttype == "list_item_close":
            content = " ".join(list_item_parts).strip()
            if content:
                indent = "  " * max(0, list_depth - 1)
                lines.append(f"{indent}- {content}")
            in_list_item = False
        elif ttype == "heading_open":
            if i + 1 < len(tokens) and tokens[i + 1].type == "inline":
                heading = inline_text(tokens[i + 1]).strip()
                if heading:
                    lines.append(heading)
            while i < len(tokens) and tokens[i].type != "heading_close":
                i += 1
        elif ttype == "inline":
            text_val = inline_text(token).strip()
            if text_val:
                if in_list_item:
                    list_item_parts.append(text_val)
                else:
                    lines.append(text_val)
        elif ttype in ("fence", "code_block"):
            content = str(token.content or "").strip()
            if content:
                lines.append(content)

        i += 1

    return "\n".join(lines).strip()


def normalize_index_text(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]*\n[ \t]*", "\n", text)
    return text.strip()


def normalize_meta_value(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, (list, tuple)):
        cleaned = [str(item).strip() for item in value if str(item).strip()]
        return ", ".join(cleaned)
    text = str(value).strip()
    if not text:
        return ""
    return text.replace("|", ", ")


def is_chunk_excluded(chunk: Dict[str, Any]) -> bool:
    value = chunk.get("excluded")
    if value is None:
        value = chunk.get("exclude")
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "exclude", "excluded"}
    return False


def build_embedding_text(
    text: str,
    chunk: Dict[str, Any],
    item_metadata: Dict[str, Any],
) -> str:
    parts: List[str] = []
    title = normalize_meta_value(item_metadata.get("title", ""))
    if title:
        parts.append(f"Title: {title}")
    authors = normalize_meta_value(item_metadata.get("authors", ""))
    if authors:
        parts.append(f"Authors: {authors}")
    tags = normalize_meta_value(item_metadata.get("tags", ""))
    if tags:
        parts.append(f"Tags: {tags}")
    year = item_metadata.get("year")
    if isinstance(year, (int, float)) and int(year) > 0:
        parts.append(f"Year: {int(year)}")
    item_type = normalize_meta_value(item_metadata.get("item_type", ""))
    if item_type:
        parts.append(f"Item type: {item_type}")
    section = normalize_meta_value(chunk.get("section", ""))
    if section:
        parts.append(f"Section: {section}")
    chunk_tags = normalize_meta_value(chunk.get("chunk_tags", ""))
    if chunk_tags:
        parts.append(f"Chunk tags: {chunk_tags}")
    page_start = chunk.get("page_start")
    page_end = chunk.get("page_end")
    if isinstance(page_start, (int, float)) and isinstance(page_end, (int, float)):
        parts.append(f"Pages: {int(page_start)}-{int(page_end)}")
    if not parts:
        return text
    return "\n".join(parts) + "\n\n" + text


def truncate_context_text(text: str, limit: int) -> str:
    if limit <= 0:
        return ""
    cleaned = text.strip()
    if not cleaned:
        return ""
    if len(cleaned) <= limit:
        return cleaned
    trimmed = cleaned[:limit]
    last_space = trimmed.rfind(" ")
    if last_space > 0:
        trimmed = trimmed[:last_space]
    return trimmed.rstrip() + "..."


def build_context_text(
    focus_text: str,
    prev_snippets: Sequence[str],
    next_snippets: Sequence[str],
) -> str:
    parts: List[str] = []
    if prev_snippets:
        parts.append("Previous context:\n" + "\n".join(prev_snippets))
    parts.append(focus_text)
    if next_snippets:
        parts.append("Next context:\n" + "\n".join(next_snippets))
    return "\n\n".join(parts)


def normalize_tag(tag: str) -> str:
    cleaned = tag.strip()
    cleaned = cleaned.strip("-,;:•")
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip()


def parse_tag_payload(content: str) -> List[str]:
    if not content:
        return []
    raw = content.strip()
    if raw.startswith("[") and raw.endswith("]"):
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                return [normalize_tag(str(item)) for item in parsed if normalize_tag(str(item))]
        except Exception:
            pass
    parts = re.split(r"[,;\n]+", raw)
    tags: List[str] = []
    for part in parts:
        cleaned = normalize_tag(part)
        if cleaned:
            tags.append(cleaned)
    return tags


def request_chunk_tags(
    base_url: str,
    api_key: str,
    model: str,
    text: str,
    max_tags: int,
    temperature: float,
) -> List[str]:
    if not base_url or not model:
        return []
    snippet = text.strip()
    if len(snippet) > 2000:
        snippet = snippet[:2000]
    if not snippet:
        return []
    url = base_url.rstrip("/") + "/chat/completions"
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    system_prompt = (
        "Return 3 to {max_tags} high-signal, concrete noun-phrase tags. "
        "Avoid generic terms (study, paper, method), verbs, and filler. "
        "Prefer specific entities, methods, datasets, and named concepts. "
        "Output comma-separated tags only. No extra text."
    ).format(max_tags=max_tags)
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": snippet},
        ],
    }
    model_name = (model or "").lower()
    requires_default_temp = "gpt-5" in model_name or model_name.startswith("gpt5")
    if not requires_default_temp or temperature == 1.0:
        payload["temperature"] = temperature
    response = requests.post(url, json=payload, headers=headers, timeout=60)
    if response.status_code >= 400:
        raise RuntimeError(f"Tag request failed: {response.status_code} {response.text}")
    data = response.json()
    content = (
        data.get("choices", [{}])[0]
        .get("message", {})
        .get("content", "")
    )
    tags = parse_tag_payload(str(content))
    deduped: List[str] = []
    seen = set()
    for tag in tags:
        key = tag.lower()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(tag)
        if len(deduped) >= max_tags:
            break
    return deduped


def tags_to_pipe(tags: Sequence[str]) -> str:
    cleaned = [normalize_tag(tag) for tag in tags if normalize_tag(tag)]
    return "|".join(cleaned)


def main() -> int:
    parser = argparse.ArgumentParser(description="Index Docling chunks into RedisSearch.")
    parser.add_argument("--chunks-json", required=True)
    parser.add_argument("--redis-url", required=True)
    parser.add_argument("--index", required=True)
    parser.add_argument("--prefix", required=True)
    parser.add_argument("--item-json")
    parser.add_argument("--embed-base-url", required=True)
    parser.add_argument("--embed-api-key", default="")
    parser.add_argument("--embed-model", required=True)
    parser.add_argument(
        "--embed-subchunk-chars",
        type=int,
        default=EMBED_SUBCHUNK_CHARS_DEFAULT,
        help="Max chars per embedding subchunk (0 disables splitting).",
    )
    parser.add_argument(
        "--embed-subchunk-overlap",
        type=int,
        default=EMBED_SUBCHUNK_OVERLAP_DEFAULT,
        help="Overlap chars between embedding subchunks.",
    )
    parser.add_argument(
        "--embed-context-window",
        type=int,
        default=EMBED_CONTEXT_WINDOW_DEFAULT,
        help="Neighboring chunk count to include around each chunk in embeddings (0 disables).",
    )
    parser.add_argument(
        "--embed-context-chars",
        type=int,
        default=EMBED_CONTEXT_CHARS_DEFAULT,
        help="Max chars per neighboring chunk included in embeddings.",
    )
    parser.add_argument(
        "--embed-include-metadata",
        action="store_true",
        help="Include title/authors/tags/section metadata in the embedding text",
    )
    parser.add_argument(
        "--generate-chunk-tags",
        action="store_true",
        help="Generate short tags per chunk using the LLM cleanup model",
    )
    parser.add_argument("--tag-base-url", default="")
    parser.add_argument("--tag-api-key", default="")
    parser.add_argument("--tag-model", default="")
    parser.add_argument("--tag-temperature", type=float, default=0.2)
    parser.add_argument("--tag-max", type=int, default=5)
    parser.add_argument("--upsert", action="store_true")
    parser.add_argument("--progress", action="store_true")
    parser.add_argument("--chunk-ids", help="Comma-separated chunk IDs to index")
    parser.add_argument("--delete-chunk-ids", help="Comma-separated chunk IDs to delete")
    args = parser.parse_args()

    if not os.path.isfile(args.chunks_json):
        eprint(f"Chunks JSON not found: {args.chunks_json}")
        return 2

    try:
        with open(args.chunks_json, "r", encoding="utf-8") as handle:
            payload = json.load(handle)
    except Exception as exc:
        eprint(f"Failed to read chunks JSON: {exc}")
        return 2


    doc_id = payload.get("doc_id")
    chunks = payload.get("chunks")
    if not doc_id or not isinstance(chunks, list):
        eprint("Invalid chunks JSON schema")
        return 2
    doc_id = str(doc_id)

    chunk_id_filter = set(parse_chunk_id_list(args.chunk_ids, doc_id))
    delete_ids = set(parse_chunk_id_list(args.delete_chunk_ids, doc_id))
    excluded_ids: Set[str] = set()
    for chunk in chunks:
        chunk_id = chunk.get("chunk_id")
        if not chunk_id:
            continue
        chunk_id = str(chunk_id)
        if doc_id and chunk_id.startswith(f"{doc_id}:"):
            chunk_id = chunk_id.split(":", 1)[1]
        if is_chunk_excluded(chunk):
            excluded_ids.add(chunk_id)
    if excluded_ids:
        delete_ids |= excluded_ids
    incremental = bool(chunk_id_filter or delete_ids)

    attachment_key = None
    try:
        meta = payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {}
        key_val = meta.get("attachment_key") if isinstance(meta, dict) else None
        if isinstance(key_val, str) and key_val.strip():
            attachment_key = key_val.strip()
    except Exception:
        attachment_key = None

    client = redis.Redis.from_url(args.redis_url, decode_responses=False)

    if not incremental:
        # Delete all existing chunk keys for this doc_id before indexing
        pattern = f"{args.prefix}{doc_id}:*"
        deleted = 0
        try:
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
            if deleted:
                eprint(f"Deleted {deleted} existing chunk keys for doc_id {doc_id}")
        except Exception as exc:
            eprint(f"Failed to delete old chunk keys for doc_id {doc_id}: {exc}")

    item_metadata: Dict[str, Any] = {}
    item_json_path = args.item_json or infer_item_json_path(args.chunks_json, str(doc_id))
    if item_json_path and os.path.isfile(item_json_path):
        try:
            with open(item_json_path, "r", encoding="utf-8") as handle:
                item_payload = json.load(handle)
            item_metadata = parse_item_metadata(item_payload)
        except Exception as exc:
            eprint(f"Failed to read item JSON metadata: {exc}")

    if delete_ids or chunk_id_filter:
        try:
            to_clear = set(delete_ids) | set(chunk_id_filter)
            deleted = 0
            for chunk_id in to_clear:
                deleted += delete_existing_chunk_keys(client, args.prefix, doc_id, chunk_id)
            if deleted:
                eprint(f"Deleted {deleted} existing chunk keys for doc_id {doc_id}")
        except Exception as exc:
            eprint(f"Failed to delete chunk keys for doc_id {doc_id}: {exc}")

    embed_subchunk_chars = int(args.embed_subchunk_chars or 0)
    embed_subchunk_overlap = max(0, int(args.embed_subchunk_overlap or 0))
    context_window = max(0, int(args.embed_context_window or 0))
    context_chars = max(0, int(args.embed_context_chars or 0))

    prepared_chunks: List[Dict[str, Any]] = []
    for chunk in chunks:
        if is_chunk_excluded(chunk):
            continue
        raw_text = str(chunk.get("text", ""))
        text = normalize_index_text(markdown_to_index_text(raw_text))
        if not text.strip():
            continue
        chunk_id = chunk.get("chunk_id")
        if not chunk_id:
            continue
        chunk_id = str(chunk_id)
        if chunk_id_filter and chunk_id not in chunk_id_filter:
            continue
        if chunk_id in delete_ids:
            continue
        sub_texts = split_for_embedding(text, embed_subchunk_chars, embed_subchunk_overlap)
        if not sub_texts:
            sub_texts = [text]
        prepared_chunks.append({
            "chunk": chunk,
            "chunk_id": chunk_id,
            "text": text,
            "sub_texts": sub_texts,
        })

    if not prepared_chunks:
        return 0

    if context_window > 0 and context_chars > 0:
        for idx, entry in enumerate(prepared_chunks):
            prev_snippets: List[str] = []
            next_snippets: List[str] = []
            for offset in range(1, context_window + 1):
                prev_idx = idx - offset
                if prev_idx < 0:
                    break
                snippet = truncate_context_text(prepared_chunks[prev_idx]["text"], context_chars)
                if snippet:
                    prev_snippets.append(snippet)
            for offset in range(1, context_window + 1):
                next_idx = idx + offset
                if next_idx >= len(prepared_chunks):
                    break
                snippet = truncate_context_text(prepared_chunks[next_idx]["text"], context_chars)
                if snippet:
                    next_snippets.append(snippet)
            entry["context_prev"] = prev_snippets
            entry["context_next"] = next_snippets

    first_chunk = prepared_chunks[0]["chunk"]
    first_entry = prepared_chunks[0]
    first_text = first_entry["sub_texts"][0]
    first_context_text = first_text
    if context_window > 0 and context_chars > 0:
        first_context_text = build_context_text(
            first_text,
            first_entry.get("context_prev", []),
            first_entry.get("context_next", []),
        )
    first_embedding_text = (
        build_embedding_text(first_context_text, first_chunk, item_metadata)
        if args.embed_include_metadata
        else first_context_text
    )
    first_len = len(first_embedding_text)
    first_embedding_text, truncated = truncate_for_embedding(first_embedding_text)
    if truncated:
        eprint(
            "Embedding input truncated for chunk %s:%s (chars=%d->%d)"
            % (doc_id, first_chunk.get("chunk_id"), first_len, len(first_embedding_text))
        )
    try:
        sample_embedding = request_embedding(
            args.embed_base_url,
            args.embed_api_key,
            args.embed_model,
            first_embedding_text,
        )
    except Exception as exc:
        eprint(f"Embedding failed for chunk {doc_id}:{first_chunk.get('chunk_id')}: {exc}")
        return 2

    embedding_dim = len(sample_embedding)
    if embedding_dim <= 0:
        eprint("Embedding dim mismatch: empty embedding returned")
        return 2

    try:
        ensure_index(client, args.index, args.prefix, embedding_dim)
    except Exception as exc:
        eprint(f"Failed to ensure index: {exc}")
        return 2

    sample_embedding = normalize_vector(sample_embedding)

    total = sum(len(entry["sub_texts"]) for entry in prepared_chunks)
    current = 0
    updated_chunks = False

    for entry in prepared_chunks:
        chunk = entry["chunk"]
        text = entry["text"]
        chunk_id = entry["chunk_id"]
        sub_texts = entry["sub_texts"]
        chunk_tags_value = ""
        existing_tags = chunk.get("chunk_tags")
        has_existing_tags = False
        if isinstance(existing_tags, (list, tuple)):
            cleaned = [normalize_tag(str(tag)) for tag in existing_tags if normalize_tag(str(tag))]
            if cleaned:
                chunk_tags_value = tags_to_pipe(cleaned)
                has_existing_tags = True
        elif isinstance(existing_tags, str) and existing_tags.strip():
            chunk_tags_value = existing_tags.strip()
            has_existing_tags = True
        if args.generate_chunk_tags and args.tag_base_url and args.tag_model and not has_existing_tags:
            try:
                tags = request_chunk_tags(
                    args.tag_base_url,
                    args.tag_api_key,
                    args.tag_model,
                    text,
                    args.tag_max,
                    args.tag_temperature,
                )
                if tags:
                    chunk_tags_value = tags_to_pipe(tags)
                    if chunk.get("chunk_tags") != tags:
                        chunk["chunk_tags"] = tags
                        updated_chunks = True
            except Exception as exc:
                eprint(f"Tagging failed for chunk {chunk_id}: {exc}")

        stable_parent_id = f"{doc_id}:{chunk_id}"
        sub_total = len(sub_texts)
        for sub_idx, sub_text in enumerate(sub_texts, start=1):
            current += 1
            stable_chunk_id = (
                stable_parent_id if sub_total <= 1 else f"{stable_parent_id}#s{sub_idx}"
            )
            key = f"{args.prefix}{stable_chunk_id}"

            if not args.upsert and client.exists(key):
                continue

            try:
                if args.progress:
                    print(
                        json.dumps(
                            {
                                "type": "progress",
                                "stage": "embedding",
                                "current": current,
                                "total": total,
                                "message": f"Embedding {stable_chunk_id} ({current}/{total})",
                            }
                        ),
                        flush=True,
                    )
                if chunk is first_chunk and sub_idx == 1:
                    embedding = sample_embedding
                else:
                    context_text = sub_text
                    if context_window > 0 and context_chars > 0:
                        context_text = build_context_text(
                            sub_text,
                            entry.get("context_prev", []),
                            entry.get("context_next", []),
                        )
                    embedding_text = (
                        build_embedding_text(context_text, chunk, item_metadata)
                        if args.embed_include_metadata
                        else context_text
                    )
                    embed_len = len(embedding_text)
                    embedding_text, truncated = truncate_for_embedding(embedding_text)
                    if truncated:
                        eprint(
                            "Embedding input truncated for chunk %s (chars=%d->%d)"
                            % (stable_chunk_id, embed_len, len(embedding_text))
                        )
                    embedding = request_embedding(
                        args.embed_base_url,
                        args.embed_api_key,
                        args.embed_model,
                        embedding_text,
                    )
                    if len(embedding) != embedding_dim:
                        raise RuntimeError(
                            f"Embedding dim mismatch: expected {embedding_dim} got {len(embedding)}"
                        )
                    embedding = normalize_vector(embedding)
            except Exception as exc:
                eprint(f"Embedding failed for chunk {stable_chunk_id}: {exc}")
                return 2

            fields: Dict[str, Any] = {
                "doc_id": str(doc_id),
                "chunk_id": stable_parent_id,
                "attachment_key": str(attachment_key or ""),
                "title": str(item_metadata.get("title", "")),
                "authors": str(item_metadata.get("authors", "")),
                "tags": str(item_metadata.get("tags", "")),
                "chunk_tags": str(chunk_tags_value),
                "year": int(item_metadata.get("year", 0)),
                "item_type": str(item_metadata.get("item_type", "")),
                "source_pdf": str(payload.get("source_pdf", "")),
                "page_start": int(chunk.get("page_start", 0)),
                "page_end": int(chunk.get("page_end", 0)),
                "section": str(chunk.get("section", "")),
                "text": sub_text,
                "embedding": vector_to_bytes(embedding),
            }

            if sub_total > 1:
                fields["chunk_sub_id"] = stable_chunk_id

            try:
                client.hset(key, mapping=fields)
            except Exception as exc:
                eprint(f"Failed to index chunk {stable_chunk_id}: {exc}")
                return 2

            if args.progress:
                print(
                    json.dumps(
                        {
                            "type": "progress",
                            "stage": "index",
                            "current": current,
                            "total": total,
                            "message": f"Indexing {stable_chunk_id} ({current}/{total})",
                        }
                    ),
                    flush=True,
                )

    if updated_chunks:
        try:
            with open(args.chunks_json, "w", encoding="utf-8") as handle:
                json.dump(payload, handle, indent=2)
        except Exception as exc:
            eprint(f"Failed to write updated chunks JSON: {exc}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
