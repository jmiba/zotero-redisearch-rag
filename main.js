"use strict";var O=Object.create;var E=Object.defineProperty;var U=Object.getOwnPropertyDescriptor;var V=Object.getOwnPropertyNames;var M=Object.getPrototypeOf,K=Object.prototype.hasOwnProperty;var J=(f,e)=>{for(var t in e)E(f,t,{get:e[t],enumerable:!0})},q=(f,e,t,r)=>{if(e&&typeof e=="object"||typeof e=="function")for(let s of V(e))!K.call(f,s)&&s!==t&&E(f,s,{get:()=>e[s],enumerable:!(r=U(e,s))||r.enumerable});return f};var L=(f,e,t)=>(t=f!=null?O(M(f)):{},q(e||!f||!f.__esModule?E(t,"default",{value:f,enumerable:!0}):t,f)),H=f=>q(E({},"__esModule",{value:!0}),f);var Y={};J(Y,{default:()=>N});module.exports=H(Y);var n=require("obsidian"),R=require("child_process"),P=require("fs"),j=L(require("http")),z=L(require("https")),m=L(require("path")),S=require("url");var g=require("obsidian"),T=".zotero-redisearch-rag/items",A=".zotero-redisearch-rag/chunks",Z={zoteroBaseUrl:"http://127.0.0.1:23119/api",zoteroUserId:"0",pythonPath:"python3",copyPdfToVault:!0,frontmatterTemplate:`doc_id: {{doc_id}}
zotero_key: {{zotero_key}}
title: {{title_yaml}}
year: {{year}}
authors:
{{authors_yaml}}
item_type: {{item_type}}
pdf_link: {{pdf_link}}
item_json: {{item_json}}`,outputPdfDir:"zotero/pdfs",outputNoteDir:"zotero/notes",redisUrl:"redis://127.0.0.1:6379",redisIndex:"idx:zotero",redisPrefix:"zotero:chunk:",embedBaseUrl:"http://localhost:1234/v1",embedApiKey:"lm-studio",embedModel:"google/embedding-gemma-300m",chatBaseUrl:"http://127.0.0.1:1234/v1",chatApiKey:"",chatModel:"openai/gpt-oss-20b",chatTemperature:.2,ocrMode:"auto",chunkingMode:"page"},D=class extends g.PluginSettingTab{constructor(e,t){super(e,t),this.plugin=t}display(){let{containerEl:e}=this;e.empty(),e.createEl("h2",{text:"Zotero RAG Settings"}),new g.Setting(e).setName("Zotero base URL").setDesc("Local Zotero API base URL, e.g. http://127.0.0.1:23119/api").addText(t=>t.setPlaceholder("http://127.0.0.1:23119/api").setValue(this.plugin.settings.zoteroBaseUrl).onChange(async r=>{this.plugin.settings.zoteroBaseUrl=r.trim(),await this.plugin.saveSettings()})),new g.Setting(e).setName("Zotero user ID").setDesc("Use 0 for local library. You can also enter users/<id> or groups/<id>.").addText(t=>t.setPlaceholder("123456").setValue(this.plugin.settings.zoteroUserId).onChange(async r=>{this.plugin.settings.zoteroUserId=r.trim(),await this.plugin.saveSettings()})),new g.Setting(e).setName("Python path").setDesc("Path to python3").addText(t=>t.setPlaceholder("python3").setValue(this.plugin.settings.pythonPath).onChange(async r=>{this.plugin.settings.pythonPath=r.trim()||"python3",await this.plugin.saveSettings()})),new g.Setting(e).setName("Copy PDFs into vault").setDesc("Disable to use Zotero storage paths directly.").addToggle(t=>t.setValue(this.plugin.settings.copyPdfToVault).onChange(async r=>{this.plugin.settings.copyPdfToVault=r,await this.plugin.saveSettings()})),new g.Setting(e).setName("Frontmatter template").setDesc("Use {{doc_id}}, {{zotero_key}}, {{title}}, {{title_yaml}}, {{year}}, {{date}}, {{authors}}, {{authors_yaml}}, {{tags}}, {{item_type}}, {{pdf_link}}, {{item_json}}").addTextArea(t=>{t.inputEl.rows=8,t.setValue(this.plugin.settings.frontmatterTemplate).onChange(async r=>{this.plugin.settings.frontmatterTemplate=r,await this.plugin.saveSettings()})}),e.createEl("h3",{text:"Output folders (vault-relative)"}),new g.Setting(e).setName("PDF folder").addText(t=>t.setPlaceholder("zotero/pdfs").setValue(this.plugin.settings.outputPdfDir).onChange(async r=>{this.plugin.settings.outputPdfDir=r.trim(),await this.plugin.saveSettings()})),new g.Setting(e).setName("Notes folder").addText(t=>t.setPlaceholder("zotero/notes").setValue(this.plugin.settings.outputNoteDir).onChange(async r=>{this.plugin.settings.outputNoteDir=r.trim(),await this.plugin.saveSettings()})),e.createEl("h3",{text:"Redis Stack"}),new g.Setting(e).setName("Redis URL").addText(t=>t.setPlaceholder("redis://127.0.0.1:6379").setValue(this.plugin.settings.redisUrl).onChange(async r=>{this.plugin.settings.redisUrl=r.trim(),await this.plugin.saveSettings()})),new g.Setting(e).setName("Index name").addText(t=>t.setPlaceholder("idx:zotero").setValue(this.plugin.settings.redisIndex).onChange(async r=>{this.plugin.settings.redisIndex=r.trim(),await this.plugin.saveSettings()})),new g.Setting(e).setName("Key prefix").addText(t=>t.setPlaceholder("zotero:chunk:").setValue(this.plugin.settings.redisPrefix).onChange(async r=>{this.plugin.settings.redisPrefix=r.trim(),await this.plugin.saveSettings()})),e.createEl("h3",{text:"Embeddings (LM Studio)"}),new g.Setting(e).setName("Embeddings base URL").addText(t=>t.setPlaceholder("http://localhost:1234/v1").setValue(this.plugin.settings.embedBaseUrl).onChange(async r=>{this.plugin.settings.embedBaseUrl=r.trim(),await this.plugin.saveSettings()})),new g.Setting(e).setName("Embeddings API key").addText(t=>t.setPlaceholder("lm-studio").setValue(this.plugin.settings.embedApiKey).onChange(async r=>{this.plugin.settings.embedApiKey=r.trim(),await this.plugin.saveSettings()})),new g.Setting(e).setName("Embeddings model").addText(t=>t.setPlaceholder("google/embedding-gemma-300m").setValue(this.plugin.settings.embedModel).onChange(async r=>{this.plugin.settings.embedModel=r.trim(),await this.plugin.saveSettings()})),e.createEl("h3",{text:"Chat LLM"}),new g.Setting(e).setName("Chat base URL").setDesc("OpenAI-compatible chat endpoint base URL").addText(t=>t.setPlaceholder("http://localhost:1234/v1").setValue(this.plugin.settings.chatBaseUrl).onChange(async r=>{this.plugin.settings.chatBaseUrl=r.trim(),await this.plugin.saveSettings()})),new g.Setting(e).setName("Chat API key").addText(t=>t.setPlaceholder("lm-studio").setValue(this.plugin.settings.chatApiKey).onChange(async r=>{this.plugin.settings.chatApiKey=r.trim(),await this.plugin.saveSettings()})),new g.Setting(e).setName("Chat model").addText(t=>t.setPlaceholder("meta-llama/llama-3.1-405b-instruct").setValue(this.plugin.settings.chatModel).onChange(async r=>{this.plugin.settings.chatModel=r.trim(),await this.plugin.saveSettings()})),new g.Setting(e).setName("Temperature").addText(t=>t.setPlaceholder("0.2").setValue(String(this.plugin.settings.chatTemperature)).onChange(async r=>{let s=Number.parseFloat(r);this.plugin.settings.chatTemperature=Number.isFinite(s)?s:.2,await this.plugin.saveSettings()})),e.createEl("h3",{text:"Docling"}),new g.Setting(e).setName("OCR mode").setDesc("auto, force, or off").addDropdown(t=>t.addOption("auto","auto").addOption("force","force").addOption("off","off").setValue(this.plugin.settings.ocrMode).onChange(async r=>{this.plugin.settings.ocrMode=r,await this.plugin.saveSettings()})),new g.Setting(e).setName("Chunking").setDesc("page or section").addDropdown(t=>t.addOption("page","page").addOption("section","section").setValue(this.plugin.settings.chunkingMode).onChange(async r=>{this.plugin.settings.chunkingMode=r,await this.plugin.saveSettings()}))}};var $={"docling_extract.py":String.raw`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.1.2
import argparse
import json
import os
import re
import sys
from typing import Any, Dict, List, Optional, Tuple


def eprint(message: str) -> None:
    sys.stderr.write(message + "\n")


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def export_markdown(doc: Any) -> str:
    for method_name in ("export_to_markdown", "to_markdown", "export_to_md"):
        method = getattr(doc, method_name, None)
        if callable(method):
            return method()
    for method_name in ("export_to_text", "to_text"):
        method = getattr(doc, method_name, None)
        if callable(method):
            return method()
    return str(doc)


def export_text(doc: Any) -> str:
    for method_name in ("export_to_text", "to_text"):
        method = getattr(doc, method_name, None)
        if callable(method):
            return method()
    return str(doc)


def extract_pages(doc: Any) -> List[Dict[str, Any]]:
    pages: List[Dict[str, Any]] = []
    if hasattr(doc, "pages") and isinstance(doc.pages, list):
        for idx, page in enumerate(doc.pages, start=1):
            page_num = getattr(page, "page_number", None) or getattr(page, "number", None) or idx
            text = None
            for attr in ("text", "content", "markdown", "md"):
                if hasattr(page, attr):
                    value = getattr(page, attr)
                    text = value() if callable(value) else value
                    break
            if text is None and hasattr(page, "export_to_text"):
                text = page.export_to_text()
            if text is None:
                text = str(page)
            pages.append({"page_num": int(page_num), "text": str(text)})
        return pages

    full_text = export_text(doc)
    if full_text:
        pages.append({"page_num": 1, "text": full_text})
    return pages


def split_markdown_sections(markdown: str) -> List[Dict[str, Any]]:
    sections: List[Dict[str, Any]] = []
    current_title = ""
    current_lines: List[str] = []

    def flush() -> None:
        nonlocal current_title, current_lines
        if current_title or current_lines:
            sections.append({
                "title": current_title.strip(),
                "text": "\n".join(current_lines).strip(),
            })
        current_title = ""
        current_lines = []

    for line in markdown.splitlines():
        if line.startswith("#"):
            flush()
            current_title = line.lstrip("#").strip()
        else:
            current_lines.append(line)

    flush()
    return sections


def find_page_range(section_text: str, pages: List[Dict[str, Any]]) -> Tuple[int, int]:
    if not pages:
        return 0, 0

    cleaned = normalize_text(section_text)
    if not cleaned:
        return 0, 0

    snippet_start = cleaned[:200]
    snippet_end = cleaned[-200:]

    page_start = 0
    page_end = 0

    for page in pages:
        page_clean = normalize_text(page.get("text", ""))
        if snippet_start and snippet_start in page_clean:
            page_start = page.get("page_num", 0)
            break

    for page in reversed(pages):
        page_clean = normalize_text(page.get("text", ""))
        if snippet_end and snippet_end in page_clean:
            page_end = page.get("page_num", 0)
            break

    if page_start == 0:
        page_start = pages[0].get("page_num", 0)
    if page_end == 0:
        page_end = pages[-1].get("page_num", 0)

    return int(page_start), int(page_end)


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug


def build_converter(ocr_mode: str):
    from docling.document_converter import DocumentConverter

    try:
        from docling.datamodel.base_models import InputFormat
        from docling.datamodel.pipeline_options import PdfPipelineOptions, OCRMode
        from docling.document_converter import PdfFormatOption
    except Exception:
        return DocumentConverter()

    pipeline_options = PdfPipelineOptions()
    if ocr_mode == "force":
        if hasattr(pipeline_options, "do_ocr"):
            pipeline_options.do_ocr = True
        if hasattr(pipeline_options, "ocr_mode"):
            pipeline_options.ocr_mode = OCRMode.FORCE
    elif ocr_mode == "off":
        if hasattr(pipeline_options, "do_ocr"):
            pipeline_options.do_ocr = False
        if hasattr(pipeline_options, "ocr_mode"):
            pipeline_options.ocr_mode = OCRMode.DISABLED
    else:
        if hasattr(pipeline_options, "ocr_mode"):
            pipeline_options.ocr_mode = OCRMode.AUTO

    format_options = {InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)}
    return DocumentConverter(format_options=format_options)


def build_chunks_page(doc_id: str, pages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    chunks: List[Dict[str, Any]] = []
    for page in pages:
        raw_text = str(page.get("text", ""))
        cleaned = normalize_text(raw_text)
        if not cleaned:
            continue
        page_num = int(page.get("page_num", 0))
        chunk_id = f"p{page_num}"
        chunks.append({
            "chunk_id": chunk_id,
            "text": cleaned,
            "page_start": page_num,
            "page_end": page_num,
            "section": "",
            "char_count": len(cleaned),
        })
    return chunks


def build_chunks_section(doc_id: str, markdown: str, pages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    sections = split_markdown_sections(markdown)
    chunks: List[Dict[str, Any]] = []
    seen_ids: Dict[str, int] = {}

    if not sections:
        return build_chunks_page(doc_id, pages)

    for idx, section in enumerate(sections, start=1):
        title = section.get("title", "")
        text = section.get("text", "")
        cleaned = normalize_text(text)
        if not cleaned:
            continue
        page_start, page_end = find_page_range(cleaned, pages)
        base_id = slugify(title) or f"section-{idx}"
        if base_id in seen_ids:
            seen_ids[base_id] += 1
            chunk_id = f"{base_id}-{seen_ids[base_id]}"
        else:
            seen_ids[base_id] = 1
            chunk_id = base_id
        chunks.append({
            "chunk_id": chunk_id,
            "text": cleaned,
            "page_start": page_start,
            "page_end": page_end,
            "section": title,
            "char_count": len(cleaned),
        })
    return chunks


def main() -> int:
    parser = argparse.ArgumentParser(description="Extract PDF content with Docling and produce chunks.")
    parser.add_argument("--pdf", required=True, help="Path to PDF")
    parser.add_argument("--doc-id", required=True, help="Document identifier")
    parser.add_argument("--out-json", required=True, help="Output JSON path")
    parser.add_argument("--out-md", required=True, help="Output markdown path")
    parser.add_argument("--chunking", choices=["page", "section"], default="page")
    parser.add_argument("--ocr", choices=["auto", "force", "off"], default="auto")
    args = parser.parse_args()

    if not os.path.isfile(args.pdf):
        eprint(f"PDF not found: {args.pdf}")
        return 2

    try:
        out_json_dir = os.path.dirname(args.out_json)
        out_md_dir = os.path.dirname(args.out_md)
        if out_json_dir:
            os.makedirs(out_json_dir, exist_ok=True)
        if out_md_dir:
            os.makedirs(out_md_dir, exist_ok=True)
    except Exception as exc:
        eprint(f"Failed to create output directories: {exc}")
        return 2

    try:
        converter = build_converter(args.ocr)
    except Exception as exc:
        eprint(f"Failed to initialize Docling converter: {exc}")
        return 2

    try:
        result = converter.convert(args.pdf)
        doc = result.document if hasattr(result, "document") else result
    except Exception as exc:
        eprint(f"Docling conversion failed: {exc}")
        return 2

    try:
        markdown = export_markdown(doc)
    except Exception as exc:
        eprint(f"Failed to export markdown: {exc}")
        return 2

    try:
        with open(args.out_md, "w", encoding="utf-8") as handle:
            handle.write(markdown)
    except Exception as exc:
        eprint(f"Failed to write markdown: {exc}")
        return 2

    try:
        pages = extract_pages(doc)
        if args.chunking == "section":
            chunks = build_chunks_section(args.doc_id, markdown, pages)
        else:
            chunks = build_chunks_page(args.doc_id, pages)
    except Exception as exc:
        eprint(f"Failed to build chunks: {exc}")
        return 2

    chunks = [chunk for chunk in chunks if chunk.get("text")]

    payload = {
        "doc_id": args.doc_id,
        "source_pdf": args.pdf,
        "chunks": chunks,
    }

    try:
        with open(args.out_json, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, indent=2)
    except Exception as exc:
        eprint(f"Failed to write JSON: {exc}")
        return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())
`,"index_redisearch.py":String.raw`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.1.2
import argparse
import json
import math
import os
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


def ensure_index(client: redis.Redis, index_name: str, prefix: str) -> None:
    try:
        client.execute_command("FT.INFO", index_name)
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
        "768",
        "DISTANCE_METRIC",
        "COSINE",
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Index Docling chunks into RedisSearch.")
    parser.add_argument("--chunks-json", required=True)
    parser.add_argument("--redis-url", required=True)
    parser.add_argument("--index", required=True)
    parser.add_argument("--prefix", required=True)
    parser.add_argument("--embed-base-url", required=True)
    parser.add_argument("--embed-api-key", default="")
    parser.add_argument("--embed-model", required=True)
    parser.add_argument("--upsert", action="store_true")
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

    client = redis.Redis.from_url(args.redis_url, decode_responses=False)

    try:
        ensure_index(client, args.index, args.prefix)
    except Exception as exc:
        eprint(f"Failed to ensure index: {exc}")
        return 2

    for chunk in chunks:
        text = str(chunk.get("text", ""))
        if not text.strip():
            continue

        chunk_id = chunk.get("chunk_id")
        if not chunk_id:
            continue

        stable_chunk_id = f"{doc_id}:{chunk_id}"
        key = f"{args.prefix}{stable_chunk_id}"

        if not args.upsert and client.exists(key):
            continue

        try:
            embedding = request_embedding(args.embed_base_url, args.embed_api_key, args.embed_model, text)
            if len(embedding) != 768:
                raise RuntimeError(f"Embedding dim mismatch: {len(embedding)}")
            embedding = normalize_vector(embedding)
        except Exception as exc:
            eprint(f"Embedding failed for chunk {stable_chunk_id}: {exc}")
            return 2

        fields: Dict[str, Any] = {
            "doc_id": str(doc_id),
            "chunk_id": stable_chunk_id,
            "source_pdf": str(payload.get("source_pdf", "")),
            "page_start": int(chunk.get("page_start", 0)),
            "page_end": int(chunk.get("page_end", 0)),
            "section": str(chunk.get("section", "")),
            "text": text,
            "embedding": vector_to_bytes(embedding),
        }

        try:
            client.hset(key, mapping=fields)
        except Exception as exc:
            eprint(f"Failed to index chunk {stable_chunk_id}: {exc}")
            return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())
`,"rag_query_redisearch.py":String.raw`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.1.2
import argparse
import json
import math
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
    if response.status_code >= 400:
        error_text = response.text
        if is_temperature_unsupported(error_text):
            response = requests.post(url, json=base_payload, headers=headers, timeout=120)
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
        key = (doc_id, page_start, page_end)
        if key in seen:
            continue
        seen.add(key)
        citations.append({
            "doc_id": doc_id,
            "page_start": page_start,
            "page_end": page_end,
            "pages": f"{page_start}-{page_end}",
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
    context = build_context(retrieved)

    system_prompt = (
        "Use ONLY the provided context. If insufficient, say you do not know. "
        "Provide citations by doc_id and pages."
    )
    user_prompt = f"Question: {args.query}\n\nContext:\n{context}"

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
        "citations": build_citations(retrieved),
        "retrieved": retrieved,
    }

    print(json.dumps(output, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
`,"batch_index_pyzotero.py":String.raw`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.1.2
import argparse
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List, Set

from pyzotero import zotero
from tqdm import tqdm


def eprint(message: str) -> None:
    sys.stderr.write(message + "\n")


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def load_checkpoint(path: Path) -> Set[str]:
    if not path.exists():
        return set()
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        items = data.get("processed", [])
        return set(str(x) for x in items)
    except Exception:
        return set()


def save_checkpoint(path: Path, processed: Set[str]) -> None:
    payload = {"processed": sorted(processed)}
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def run_script(script: Path, args: List[str]) -> None:
    command = [sys.executable, str(script)] + args
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or f"Command failed: {' '.join(command)}")


def fetch_parent_item(client: zotero.Zotero, parent_key: str) -> Dict[str, Any]:
    try:
        item = client.item(parent_key)
        if isinstance(item, list):
            return item[0] if item else {}
        return item
    except Exception:
        return {}


def main() -> int:
    parser = argparse.ArgumentParser(description="Batch index a Zotero library with Docling and RedisSearch.")
    parser.add_argument("--library-id", required=True)
    parser.add_argument("--library-type", choices=["user", "group"], required=True)
    parser.add_argument("--api-key", required=True)
    parser.add_argument("--redis-url", required=True)
    parser.add_argument("--index", required=True)
    parser.add_argument("--prefix", required=True)
    parser.add_argument("--embed-base-url", required=True)
    parser.add_argument("--embed-api-key", default="")
    parser.add_argument("--embed-model", required=True)
    parser.add_argument("--out-dir", default="./data")
    parser.add_argument("--ocr", choices=["auto", "force", "off"], default="auto")
    parser.add_argument("--chunking", choices=["page", "section"], default="page")
    parser.add_argument("--limit", type=int)
    parser.add_argument("--since", type=int)
    parser.add_argument("--reindex", action="store_true")
    args = parser.parse_args()

    out_dir = Path(args.out_dir).resolve()
    pdf_dir = out_dir / "pdfs"
    item_dir = out_dir / "items"
    doc_dir = out_dir / "docs"
    chunk_dir = out_dir / "chunks"
    checkpoint_path = out_dir / "checkpoint.json"

    for folder in (pdf_dir, item_dir, doc_dir, chunk_dir):
        ensure_dir(folder)

    processed = set() if args.reindex else load_checkpoint(checkpoint_path)

    client = zotero.Zotero(args.library_id, args.library_type, args.api_key)

    params: Dict[str, Any] = {"itemType": "attachment"}
    if args.limit:
        params["limit"] = args.limit
    if args.since:
        params["since"] = args.since

    try:
        attachments = client.everything(client.items(**params))
    except Exception as exc:
        eprint(f"Failed to fetch Zotero items: {exc}")
        return 2

    pdf_items = []
    for item in attachments:
        data = item.get("data", {})
        content_type = data.get("contentType", "") or ""
        if content_type.startswith("application/pdf"):
            pdf_items.append(item)

    script_dir = Path(__file__).resolve().parent
    docling_script = script_dir / "docling_extract.py"
    index_script = script_dir / "index_redisearch.py"

    errors: List[str] = []

    for item in tqdm(pdf_items, desc="Indexing PDFs"):
        attachment_key = item.get("key")
        if not attachment_key:
            continue
        parent_key = item.get("data", {}).get("parentItem")
        doc_id = parent_key or attachment_key

        if doc_id in processed:
            continue

        pdf_path = pdf_dir / f"{attachment_key}.pdf"
        item_path = item_dir / f"{doc_id}.json"
        doc_path = doc_dir / f"{doc_id}.md"
        chunk_path = chunk_dir / f"{doc_id}.json"

        try:
            content = client.file(attachment_key)
            if not content:
                raise RuntimeError("Empty PDF content")
            pdf_path.write_bytes(content)
        except Exception as exc:
            errors.append(f"{doc_id}: download failed ({exc})")
            continue

        try:
            metadata = fetch_parent_item(client, parent_key) if parent_key else item
            item_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
        except Exception as exc:
            errors.append(f"{doc_id}: metadata write failed ({exc})")
            continue

        try:
            run_script(
                docling_script,
                [
                    "--pdf",
                    str(pdf_path),
                    "--doc-id",
                    doc_id,
                    "--out-json",
                    str(chunk_path),
                    "--out-md",
                    str(doc_path),
                    "--chunking",
                    args.chunking,
                    "--ocr",
                    args.ocr,
                ],
            )
        except Exception as exc:
            errors.append(f"{doc_id}: docling failed ({exc})")
            continue

        try:
            run_script(
                index_script,
                [
                    "--chunks-json",
                    str(chunk_path),
                    "--redis-url",
                    args.redis_url,
                    "--index",
                    args.index,
                    "--prefix",
                    args.prefix,
                    "--embed-base-url",
                    args.embed_base_url,
                    "--embed-api-key",
                    args.embed_api_key,
                    "--embed-model",
                    args.embed_model,
                ],
            )
        except Exception as exc:
            errors.append(f"{doc_id}: redis index failed ({exc})")
            continue

        processed.add(doc_id)
        save_checkpoint(checkpoint_path, processed)

    if errors:
        eprint("Failures:")
        for entry in errors:
            eprint(f"- {entry}")

    eprint(f"Processed {len(processed)} items. Errors: {len(errors)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
`};var C=class extends n.Modal{constructor(e,t,r,s,i="Value cannot be empty."){super(e),this.titleText=t,this.placeholder=r,this.onSubmit=s,this.emptyMessage=i}onOpen(){let{contentEl:e}=this;e.empty(),e.createEl("h3",{text:this.titleText});let t=e.createEl("input",{type:"text",placeholder:this.placeholder});t.style.width="100%",t.focus();let r=e.createEl("button",{text:"Submit"});r.style.marginTop="0.75rem";let s=()=>{let i=t.value.trim();if(!i){new n.Notice(this.emptyMessage);return}this.close(),this.onSubmit(i)};r.addEventListener("click",s),t.addEventListener("keydown",i=>{i.key==="Enter"&&s()})}},F=class extends n.Modal{constructor(e,t,r){super(e),this.titleText=t,this.bodyText=r}onOpen(){let{contentEl:e}=this;e.empty(),e.createEl("h3",{text:this.titleText}),e.createEl("pre").setText(this.bodyText)}},N=class extends n.Plugin{async onload(){await this.loadSettings(),await this.migrateCachePaths(),this.addSettingTab(new D(this.app,this));try{await this.ensureBundledTools()}catch(e){console.error("Failed to sync bundled tools",e)}this.addCommand({id:"import-zotero-item-index",name:"Import Zotero item and index (Docling -> RedisSearch)",callback:()=>this.importZoteroItem()}),this.addCommand({id:"ask-zotero-library",name:"Ask my Zotero library (RAG via RedisSearch)",callback:()=>this.askZoteroLibrary()}),this.addCommand({id:"rebuild-zotero-note-cache",name:"Rebuild Zotero note from cache (Docling + RedisSearch)",callback:()=>this.rebuildNoteFromCache()})}async loadSettings(){this.settings=Object.assign({},Z,await this.loadData())}async saveSettings(){await this.saveData(this.settings)}async importZoteroItem(){var w,b;try{await this.ensureBundledTools()}catch(c){new n.Notice("Failed to sync bundled tools. See console for details."),console.error(c);return}let e;try{e=await this.promptZoteroItem()}catch(c){new n.Notice("Zotero search failed. See console for details."),console.error(c);return}if(!e){new n.Notice("No Zotero item selected.");return}let t=(w=e.data)!=null?w:e;!t.key&&e.key&&(t.key=e.key);let r=this.getDocId(t);if(!r){new n.Notice("Could not resolve a stable doc_id from Zotero item.");return}let s=await this.resolvePdfAttachment(t,r);if(!s){new n.Notice("No PDF attachment found for item.");return}let i=typeof t.title=="string"?t.title:"",a=this.sanitizeFileName(i)||r,o=await this.resolveUniqueBaseName(a,r),d=(0,n.normalizePath)(`${this.settings.outputPdfDir}/${o}.pdf`),l=(0,n.normalizePath)(`${T}/${r}.json`),p=(0,n.normalizePath)(`${A}/${r}.json`),_=(0,n.normalizePath)(`${this.settings.outputNoteDir}/${o}.md`);try{await this.ensureFolder(T),await this.ensureFolder(A),await this.ensureFolder(this.settings.outputNoteDir),this.settings.copyPdfToVault&&await this.ensureFolder(this.settings.outputPdfDir)}catch(c){new n.Notice("Failed to create output folders."),console.error(c);return}let h="",y="";try{if(this.settings.copyPdfToVault){let c=s.filePath?await P.promises.readFile(s.filePath):await this.downloadZoteroPdf(s.key);await this.app.vault.adapter.writeBinary(d,this.bufferToArrayBuffer(c)),h=this.getAbsoluteVaultPath(d),y=`[[${d}]]`}else{if(!s.filePath){new n.Notice("PDF file path missing. Enable PDF copying or check Zotero storage.");return}h=s.filePath,y=`[PDF](${(0,S.pathToFileURL)(s.filePath).toString()})`}}catch(c){new n.Notice("Failed to download PDF attachment."),console.error(c);return}try{await this.app.vault.adapter.write(l,JSON.stringify(e,null,2))}catch(c){new n.Notice("Failed to write Zotero item JSON."),console.error(c);return}let x=this.getPluginDir(),k=m.default.join(x,"tools","docling_extract.py"),v=m.default.join(x,"tools","index_redisearch.py");try{await this.runPython(k,["--pdf",h,"--doc-id",r,"--out-json",this.getAbsoluteVaultPath(p),"--out-md",this.getAbsoluteVaultPath(_),"--chunking",this.settings.chunkingMode,"--ocr",this.settings.ocrMode])}catch(c){new n.Notice("Docling extraction failed. See console for details."),console.error(c);return}try{await this.runPython(v,["--chunks-json",this.getAbsoluteVaultPath(p),"--redis-url",this.settings.redisUrl,"--index",this.settings.redisIndex,"--prefix",this.settings.redisPrefix,"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel])}catch(c){new n.Notice("RedisSearch indexing failed. See console for details."),console.error(c);return}try{let c=await this.app.vault.adapter.read(_),u=this.buildNoteMarkdown(t,(b=e.meta)!=null?b:{},r,y,l,c);await this.app.vault.adapter.write(_,u)}catch(c){new n.Notice("Failed to finalize note markdown."),console.error(c);return}new n.Notice(`Indexed Zotero item ${r}.`)}async askZoteroLibrary(){if(!this.settings.chatBaseUrl){new n.Notice("Chat base URL must be set in settings.");return}try{await this.ensureBundledTools()}catch(e){new n.Notice("Failed to sync bundled tools. See console for details."),console.error(e);return}new C(this.app,"Ask Zotero Library","Enter your query",async e=>{var p,_;let t=this.getPluginDir(),r=m.default.join(t,"tools","rag_query_redisearch.py"),s="";try{s=await this.runPythonWithOutput(r,["--query",e,"--k","5","--redis-url",this.settings.redisUrl,"--index",this.settings.redisIndex,"--prefix",this.settings.redisPrefix,"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--chat-base-url",this.settings.chatBaseUrl,"--chat-api-key",this.settings.chatApiKey,"--chat-model",this.settings.chatModel,"--temperature",String(this.settings.chatTemperature)])}catch(h){new n.Notice("RAG query failed. See console for details."),console.error(h);return}let i;try{i=JSON.parse(s)}catch(h){new n.Notice("Failed to parse RAG response."),console.error(h);return}let a=(p=i==null?void 0:i.answer)!=null?p:"",d=((_=i==null?void 0:i.citations)!=null?_:[]).map(h=>{var x,k,v,w;let y=(v=h.pages)!=null?v:`${(x=h.page_start)!=null?x:"?"}-${(k=h.page_end)!=null?k:"?"}`;return`${(w=h.doc_id)!=null?w:"?"} pages ${y}`}).join(`
`),l=`${a}

Citations:
${d||"(none)"}`;new F(this.app,"Zotero RAG Answer",l).open()},"Query cannot be empty.").open()}async rebuildNoteFromCache(){var b,c;let e=await this.promptDocId();if(!e){new n.Notice("No doc_id provided.");return}try{await this.ensureBundledTools()}catch(u){new n.Notice("Failed to sync bundled tools. See console for details."),console.error(u);return}let t=this.app.vault.adapter,r=(0,n.normalizePath)(`${T}/${e}.json`),s=(0,n.normalizePath)(`${A}/${e}.json`);if(!await t.exists(r)){new n.Notice("Cached item JSON not found.");return}if(!await t.exists(s)){new n.Notice("Cached chunks JSON not found.");return}let i;try{let u=await t.read(r);i=JSON.parse(u)}catch(u){new n.Notice("Failed to read cached item JSON."),console.error(u);return}let a;try{let u=await t.read(s);a=JSON.parse(u)}catch(u){new n.Notice("Failed to read cached chunks JSON."),console.error(u);return}let o=typeof a.source_pdf=="string"?a.source_pdf:"";if(!o){new n.Notice("Cached chunk JSON is missing source_pdf.");return}try{await P.promises.access(o)}catch(u){new n.Notice("Cached source PDF path is not accessible."),console.error(u);return}let d=(b=i.data)!=null?b:i,l=typeof d.title=="string"?d.title:"",p=this.sanitizeFileName(l)||e,_=(0,n.normalizePath)(`${this.settings.outputNoteDir}/${p}.md`),h=await t.exists(_)?p:await this.resolveUniqueBaseName(p,e),y=(0,n.normalizePath)(`${this.settings.outputNoteDir}/${h}.md`);try{await this.ensureFolder(this.settings.outputNoteDir)}catch(u){new n.Notice("Failed to create notes folder."),console.error(u);return}let x=this.getPluginDir(),k=m.default.join(x,"tools","docling_extract.py"),v=m.default.join(x,"tools","index_redisearch.py");try{await this.runPython(k,["--pdf",o,"--doc-id",e,"--out-json",this.getAbsoluteVaultPath(s),"--out-md",this.getAbsoluteVaultPath(y),"--chunking",this.settings.chunkingMode,"--ocr",this.settings.ocrMode])}catch(u){new n.Notice("Docling extraction failed. See console for details."),console.error(u);return}try{await this.runPython(v,["--chunks-json",this.getAbsoluteVaultPath(s),"--redis-url",this.settings.redisUrl,"--index",this.settings.redisIndex,"--prefix",this.settings.redisPrefix,"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--upsert"])}catch(u){new n.Notice("RedisSearch indexing failed. See console for details."),console.error(u);return}let w=this.buildPdfLinkFromSourcePath(o);try{let u=await this.app.vault.adapter.read(y),B=this.buildNoteMarkdown(d,(c=i.meta)!=null?c:{},e,w,r,u);await this.app.vault.adapter.write(y,B)}catch(u){new n.Notice("Failed to finalize note markdown."),console.error(u);return}new n.Notice(`Rebuilt Zotero note for ${e}.`)}async promptZoteroItem(){return new Promise(e=>{new I(this.app,this,e).open()})}async promptDocId(){return new Promise(e=>{new C(this.app,"Rebuild Zotero note from cache","Enter Zotero doc_id (e.g., ABC123)",t=>e(t),"Doc ID cannot be empty.").open()})}getDocId(e){let t=[e.key,e.itemKey,e.id,e.citationKey];for(let r of t)if(typeof r=="string"&&r.trim())return r.trim();return null}sanitizeFileName(e){let t=e.replace(/[\\/:*?"<>|]/g,"").replace(/\s+/g," ").trim();return t?t.replace(/[.]+$/g,"").trim().replace(/ /g,"-").slice(0,120):""}async resolveUniqueBaseName(e,t){let r=this.app.vault.adapter,s=(0,n.normalizePath)(`${this.settings.outputNoteDir}/${e}.md`),i=(0,n.normalizePath)(`${this.settings.outputPdfDir}/${e}.pdf`),a=await r.exists(s),o=this.settings.copyPdfToVault?await r.exists(i):!1;return a||o?`${e}-${t}`:e}async searchZoteroItems(e){let t=new URLSearchParams;t.set("itemType","-attachment"),t.set("limit","25"),t.set("include","data,meta"),e.trim()&&t.set("q",e.trim());let r=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items?${t.toString()}`),s=await this.requestLocalApi(r,`Zotero search failed for ${r}`),i=JSON.parse(s.toString("utf8"));return Array.isArray(i)?i.map(a=>{var o,d,l,p;return{key:(d=a.key)!=null?d:(o=a.data)==null?void 0:o.key,data:(l=a.data)!=null?l:{},meta:(p=a.meta)!=null?p:{}}}).filter(a=>typeof a.key=="string"&&a.key.trim().length>0):[]}async resolvePdfAttachment(e,t){let r=this.pickPdfAttachment(e);if(r)return r;try{let s=await this.fetchZoteroChildren(t);for(let i of s){let a=this.toPdfAttachment(i);if(a)return a}}catch(s){console.error("Failed to fetch Zotero children",s)}return null}pickPdfAttachment(e){var r,s,i;let t=(i=(s=(r=e.attachments)!=null?r:e.children)!=null?s:e.items)!=null?i:[];if(!Array.isArray(t))return null;for(let a of t){let o=this.toPdfAttachment(a);if(o)return o}return null}toPdfAttachment(e){var i,a,o,d,l,p;if(((o=(i=e==null?void 0:e.contentType)!=null?i:e==null?void 0:e.mimeType)!=null?o:(a=e==null?void 0:e.data)==null?void 0:a.contentType)!=="application/pdf")return null;let r=(p=(d=e==null?void 0:e.key)!=null?d:e==null?void 0:e.attachmentKey)!=null?p:(l=e==null?void 0:e.data)==null?void 0:l.key;if(!r)return null;let s=this.extractAttachmentPath(e);return s?{key:r,filePath:s}:{key:r}}extractAttachmentPath(e){var r,s,i,a,o,d,l,p;let t=(p=(a=(s=(r=e==null?void 0:e.links)==null?void 0:r.enclosure)==null?void 0:s.href)!=null?a:(i=e==null?void 0:e.enclosure)==null?void 0:i.href)!=null?p:(l=(d=(o=e==null?void 0:e.data)==null?void 0:o.links)==null?void 0:d.enclosure)==null?void 0:l.href;if(typeof t=="string"&&t.startsWith("file://"))try{return(0,S.fileURLToPath)(t)}catch(_){return null}return null}async fetchZoteroChildren(e){let t=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}/children`),r=await this.requestLocalApi(t,`Zotero children request failed for ${t}`);return JSON.parse(r.toString("utf8"))}async downloadZoteroPdf(e){let t=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}/file`),r=await this.requestLocalApiRaw(t),s=await this.followFileRedirect(r);if(s)return s;if(r.statusCode>=300)throw new Error(`Request failed, status ${r.statusCode}`);return r.body}buildZoteroUrl(e){return`${this.settings.zoteroBaseUrl.replace(/\/$/,"")}${e}`}requestLocalApiRaw(e){return new Promise((t,r)=>{let s=new URL(e),a=(s.protocol==="https:"?z.default:j.default).request({method:"GET",hostname:s.hostname,port:s.port||void 0,path:`${s.pathname}${s.search}`,headers:{Accept:"*/*"}},o=>{let d=[];o.on("data",l=>d.push(Buffer.from(l))),o.on("end",()=>{var p;let l=Buffer.concat(d);t({statusCode:(p=o.statusCode)!=null?p:0,headers:o.headers,body:l})})});a.on("error",r),a.end()})}async requestLocalApi(e,t){let r=await this.requestLocalApiRaw(e);if(r.statusCode>=400){let s=r.body.toString("utf8");throw new Error(`${t!=null?t:"Request failed"}, status ${r.statusCode}: ${s||"no response body"}`)}if(r.statusCode>=300)throw new Error(`${t!=null?t:"Request failed"}, status ${r.statusCode}`);return r.body}async followFileRedirect(e){if(e.statusCode<300||e.statusCode>=400)return null;let t=e.headers.location,r=Array.isArray(t)?t[0]:t;if(!r||typeof r!="string")return null;if(r.startsWith("file://")){let s=(0,S.fileURLToPath)(r);return P.promises.readFile(s)}return r.startsWith("http://")||r.startsWith("https://")?this.requestLocalApi(r):null}bufferToArrayBuffer(e){return e.buffer.slice(e.byteOffset,e.byteOffset+e.byteLength)}buildPdfLinkFromSourcePath(e){if(!e)return"";let t=m.default.normalize(this.getVaultBasePath()),r=m.default.normalize(e),s=t.endsWith(m.default.sep)?t:`${t}${m.default.sep}`;return r.startsWith(s)?`[[${(0,n.normalizePath)(m.default.relative(t,r))}]]`:`[PDF](${(0,S.pathToFileURL)(e).toString()})`}getZoteroLibraryPath(){let e=(this.settings.zoteroUserId||"0").trim();return!e||e==="0"?"users/0":e.startsWith("users/")||e.startsWith("groups/")?e:`users/${e}`}async ensureFolder(e){let t=this.app.vault.adapter,r=(0,n.normalizePath)(e).split("/").filter(Boolean),s="";for(let i of r)s=s?`${s}/${i}`:i,await t.exists(s)||await t.mkdir(s)}buildNoteMarkdown(e,t,r,s,i,a){let o=`[[${i}]]`,d=this.renderFrontmatter(e,t,r,s,o);return`${d?`---
${d}
---

`:""}PDF: ${s}

Item JSON: ${o}

${a}`}renderFrontmatter(e,t,r,s,i){var d;let a=(d=this.settings.frontmatterTemplate)!=null?d:"";if(!a.trim())return"";let o=this.buildTemplateVars(e,t,r,s,i);return a.replace(/{{\s*([a-z0-9_]+)\s*}}/gi,(l,p)=>{var _;return(_=o[p])!=null?_:""}).trim()}buildTemplateVars(e,t,r,s,i){let a=typeof e.title=="string"?e.title:"",o=typeof e.shortTitle=="string"?e.shortTitle:"",d=typeof e.date=="string"?e.date:"",l=typeof(t==null?void 0:t.parsedDate)=="string"?t.parsedDate:"",p=this.extractYear(l||d),h=(Array.isArray(e.creators)?e.creators:[]).filter(c=>c.creatorType==="author").map(c=>this.formatCreatorName(c)),y=h.join("; "),x=Array.isArray(e.tags)?e.tags.map(c=>typeof c=="string"?c:c==null?void 0:c.tag).filter(Boolean):[],k=x.join("; "),v=typeof e.itemType=="string"?e.itemType:"",w=typeof(t==null?void 0:t.creatorSummary)=="string"?t.creatorSummary:"",b={doc_id:r,zotero_key:typeof e.key=="string"?e.key:r,title:a,short_title:o,date:d,year:p,authors:y,tags:k,item_type:v,creator_summary:w,pdf_link:this.escapeYamlString(s),item_json:this.escapeYamlString(i)};for(let[c,u]of Object.entries(b))b[`${c}_yaml`]=this.escapeYamlString(u);return b.authors_yaml=this.toYamlList(h),b.tags_yaml=this.toYamlList(x),b}extractYear(e){if(!e)return"";let t=e.match(/\b(\d{4})\b/);return t?t[1]:""}formatCreatorName(e){if(!e||typeof e!="object")return"";if(e.name)return String(e.name);let t=e.firstName?String(e.firstName):"",r=e.lastName?String(e.lastName):"";return[r,t].filter(Boolean).join(", ")||`${t} ${r}`.trim()}escapeYamlString(e){return`"${String(e).replace(/\\/g,"\\\\").replace(/"/g,'\\"')}"`}toYamlList(e){return e.length?e.map(t=>`  - ${this.escapeYamlString(t)}`).join(`
`):'  - ""'}getVaultBasePath(){var r;let e=this.app.vault.adapter;if(e instanceof n.FileSystemAdapter)return e.getBasePath();let t=(r=e.getBasePath)==null?void 0:r.call(e);if(t)return t;throw new Error("Vault base path is unavailable.")}getPluginDir(){var s;let e=this.getVaultBasePath(),t=(s=this.manifest.dir)!=null?s:this.manifest.id;if(!t)throw new Error("Plugin directory is unavailable.");let r=m.default.isAbsolute(t)?t:m.default.join(e,t);return m.default.normalize(r)}async ensureBundledTools(){let e=this.getPluginDir(),t=m.default.join(e,"tools");await P.promises.mkdir(t,{recursive:!0});for(let[r,s]of Object.entries($)){let i=m.default.join(t,r),a=!0;try{await P.promises.readFile(i,"utf8")===s&&(a=!1)}catch(o){}a&&await P.promises.writeFile(i,s,"utf8")}}async migrateCachePaths(){let e="zotero/items",t="zotero/chunks",r=T,s=A,i=this.app.vault.adapter,a=(0,n.normalizePath)(e),o=(0,n.normalizePath)(t),d=(0,n.normalizePath)(r),l=(0,n.normalizePath)(s),p=d.split("/").slice(0,-1).join("/"),_=l.split("/").slice(0,-1).join("/");p&&await this.ensureFolder(p),_&&await this.ensureFolder(_);let h=await i.exists(a),y=await i.exists(o),x=await i.exists(d),k=await i.exists(l);h&&!x&&await i.rename(a,d),y&&!k&&await i.rename(o,l)}getAbsoluteVaultPath(e){let t=this.getVaultBasePath(),r=m.default.isAbsolute(e)?e:m.default.join(t,e);return m.default.normalize(r)}runPython(e,t){return new Promise((r,s)=>{let i=(0,R.spawn)(this.settings.pythonPath,[e,...t],{cwd:m.default.dirname(e)}),a="";i.stderr.on("data",o=>{a+=o.toString()}),i.on("close",o=>{o===0?r():s(new Error(a||`Process exited with code ${o}`))})})}runPythonWithOutput(e,t){return new Promise((r,s)=>{let i=(0,R.spawn)(this.settings.pythonPath,[e,...t],{cwd:m.default.dirname(e)}),a="",o="";i.stdout.on("data",d=>{a+=d.toString()}),i.stderr.on("data",d=>{o+=d.toString()}),i.on("close",d=>{d===0?r(a.trim()):s(new Error(o||`Process exited with code ${d}`))})})}},I=class extends n.SuggestModal{constructor(t,r,s){super(t);this.lastError=null;this.plugin=r,this.resolveSelection=s,this.setPlaceholder("Search Zotero items...")}async getSuggestions(t){try{return await this.plugin.searchZoteroItems(t)}catch(r){let s=r instanceof Error?r.message:String(r);return this.lastError!==s&&(this.lastError=s,new n.Notice(s)),console.error("Zotero search failed",r),[]}}renderSuggestion(t,r){var a,o;let s=(o=(a=t.data)==null?void 0:a.title)!=null?o:"[No title]",i=this.extractYear(t);r.createEl("div",{text:s}),r.createEl("small",{text:i?`${i}`:""}),r.addEventListener("click",()=>{this.resolveSelection&&(this.resolveSelection(t),this.resolveSelection=null),this.close()})}onChooseSuggestion(t,r){this.resolveSelection&&(this.resolveSelection(t),this.resolveSelection=null),this.close()}onClose(){this.resolveSelection&&(this.resolveSelection(null),this.resolveSelection=null)}extractYear(t){var i,a,o,d;let r=(d=(o=(i=t.meta)==null?void 0:i.parsedDate)!=null?o:(a=t.data)==null?void 0:a.date)!=null?d:"";if(typeof r!="string")return"";let s=r.match(/\b(\d{4})\b/);return s?s[1]:""}};
