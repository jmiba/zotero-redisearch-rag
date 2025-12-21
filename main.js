"use strict";var V=Object.create;var L=Object.defineProperty;var H=Object.getOwnPropertyDescriptor;var J=Object.getOwnPropertyNames;var W=Object.getPrototypeOf,K=Object.prototype.hasOwnProperty;var Y=(x,c)=>{for(var e in c)L(x,e,{get:c[e],enumerable:!0})},j=(x,c,e,t)=>{if(c&&typeof c=="object"||typeof c=="function")for(let r of J(c))!K.call(x,r)&&r!==e&&L(x,r,{get:()=>c[r],enumerable:!(t=H(c,r))||t.enumerable});return x};var F=(x,c,e)=>(e=x!=null?V(W(x)):{},j(c||!x||!x.__esModule?L(e,"default",{value:x,enumerable:!0}):e,x)),G=x=>j(L({},"__esModule",{value:!0}),x);var Q={};Y(Q,{default:()=>z});module.exports=G(Q);var o=require("obsidian"),$=require("child_process"),T=require("fs"),q=F(require("http")),U=F(require("https")),g=F(require("path")),D=require("url");var _=require("obsidian"),v=".zotero-redisearch-rag",C=`${v}/items`,A=`${v}/chunks`,Z={zoteroBaseUrl:"http://127.0.0.1:23119/api",zoteroUserId:"0",pythonPath:"python3",copyPdfToVault:!0,frontmatterTemplate:`doc_id: {{doc_id}}
zotero_key: {{zotero_key}}
title: {{title_yaml}}
year: {{year}}
authors:
{{authors_yaml}}
item_type: {{item_type}}
pdf_link: {{pdf_link}}
item_json: {{item_json}}`,outputPdfDir:"zotero/pdfs",outputNoteDir:"zotero/notes",chatPaneLocation:"right",redisUrl:"redis://127.0.0.1:6379",redisIndex:"idx:zotero",redisPrefix:"zotero:chunk:",embedBaseUrl:"http://localhost:1234/v1",embedApiKey:"lm-studio",embedModel:"google/embedding-gemma-300m",chatBaseUrl:"http://127.0.0.1:1234/v1",chatApiKey:"",chatModel:"openai/gpt-oss-20b",chatTemperature:.2,ocrMode:"auto",chunkingMode:"page"},N=class extends _.PluginSettingTab{constructor(c,e){super(c,e),this.plugin=e}display(){let{containerEl:c}=this;c.empty(),c.createEl("h2",{text:"Zotero RAG Settings"}),new _.Setting(c).setName("Zotero base URL").setDesc("Local Zotero API base URL, e.g. http://127.0.0.1:23119/api").addText(e=>e.setPlaceholder("http://127.0.0.1:23119/api").setValue(this.plugin.settings.zoteroBaseUrl).onChange(async t=>{this.plugin.settings.zoteroBaseUrl=t.trim(),await this.plugin.saveSettings()})),new _.Setting(c).setName("Zotero user ID").setDesc("Use 0 for local library. You can also enter users/<id> or groups/<id>.").addText(e=>e.setPlaceholder("123456").setValue(this.plugin.settings.zoteroUserId).onChange(async t=>{this.plugin.settings.zoteroUserId=t.trim(),await this.plugin.saveSettings()})),new _.Setting(c).setName("Python path").setDesc("Path to python3").addText(e=>e.setPlaceholder("python3").setValue(this.plugin.settings.pythonPath).onChange(async t=>{this.plugin.settings.pythonPath=t.trim()||"python3",await this.plugin.saveSettings()})),new _.Setting(c).setName("Copy PDFs into vault").setDesc("Disable to use Zotero storage paths directly.").addToggle(e=>e.setValue(this.plugin.settings.copyPdfToVault).onChange(async t=>{this.plugin.settings.copyPdfToVault=t,await this.plugin.saveSettings()})),new _.Setting(c).setName("Frontmatter template").setDesc("Use {{doc_id}}, {{zotero_key}}, {{title}}, {{title_yaml}}, {{year}}, {{date}}, {{authors}}, {{authors_yaml}}, {{tags}}, {{item_type}}, {{pdf_link}}, {{item_json}}").addTextArea(e=>{e.inputEl.rows=8,e.setValue(this.plugin.settings.frontmatterTemplate).onChange(async t=>{this.plugin.settings.frontmatterTemplate=t,await this.plugin.saveSettings()})}),c.createEl("h3",{text:"Output folders (vault-relative)"}),new _.Setting(c).setName("PDF folder").addText(e=>e.setPlaceholder("zotero/pdfs").setValue(this.plugin.settings.outputPdfDir).onChange(async t=>{this.plugin.settings.outputPdfDir=t.trim(),await this.plugin.saveSettings()})),new _.Setting(c).setName("Notes folder").addText(e=>e.setPlaceholder("zotero/notes").setValue(this.plugin.settings.outputNoteDir).onChange(async t=>{this.plugin.settings.outputNoteDir=t.trim(),await this.plugin.saveSettings()})),c.createEl("h3",{text:"Redis Stack"}),new _.Setting(c).setName("Redis URL").addText(e=>e.setPlaceholder("redis://127.0.0.1:6379").setValue(this.plugin.settings.redisUrl).onChange(async t=>{this.plugin.settings.redisUrl=t.trim(),await this.plugin.saveSettings()})),new _.Setting(c).setName("Index name").addText(e=>e.setPlaceholder("idx:zotero").setValue(this.plugin.settings.redisIndex).onChange(async t=>{this.plugin.settings.redisIndex=t.trim(),await this.plugin.saveSettings()})),new _.Setting(c).setName("Key prefix").addText(e=>e.setPlaceholder("zotero:chunk:").setValue(this.plugin.settings.redisPrefix).onChange(async t=>{this.plugin.settings.redisPrefix=t.trim(),await this.plugin.saveSettings()})),c.createEl("h3",{text:"Embeddings (LM Studio)"}),new _.Setting(c).setName("Embeddings base URL").addText(e=>e.setPlaceholder("http://localhost:1234/v1").setValue(this.plugin.settings.embedBaseUrl).onChange(async t=>{this.plugin.settings.embedBaseUrl=t.trim(),await this.plugin.saveSettings()})),new _.Setting(c).setName("Embeddings API key").addText(e=>e.setPlaceholder("lm-studio").setValue(this.plugin.settings.embedApiKey).onChange(async t=>{this.plugin.settings.embedApiKey=t.trim(),await this.plugin.saveSettings()})),new _.Setting(c).setName("Embeddings model").addText(e=>e.setPlaceholder("google/embedding-gemma-300m").setValue(this.plugin.settings.embedModel).onChange(async t=>{this.plugin.settings.embedModel=t.trim(),await this.plugin.saveSettings()})),c.createEl("h3",{text:"Chat LLM"}),new _.Setting(c).setName("Chat base URL").setDesc("OpenAI-compatible chat endpoint base URL").addText(e=>e.setPlaceholder("http://localhost:1234/v1").setValue(this.plugin.settings.chatBaseUrl).onChange(async t=>{this.plugin.settings.chatBaseUrl=t.trim(),await this.plugin.saveSettings()})),new _.Setting(c).setName("Chat API key").addText(e=>e.setPlaceholder("lm-studio").setValue(this.plugin.settings.chatApiKey).onChange(async t=>{this.plugin.settings.chatApiKey=t.trim(),await this.plugin.saveSettings()})),new _.Setting(c).setName("Chat model").addText(e=>e.setPlaceholder("meta-llama/llama-3.1-405b-instruct").setValue(this.plugin.settings.chatModel).onChange(async t=>{this.plugin.settings.chatModel=t.trim(),await this.plugin.saveSettings()})),new _.Setting(c).setName("Temperature").addText(e=>e.setPlaceholder("0.2").setValue(String(this.plugin.settings.chatTemperature)).onChange(async t=>{let r=Number.parseFloat(t);this.plugin.settings.chatTemperature=Number.isFinite(r)?r:.2,await this.plugin.saveSettings()})),new _.Setting(c).setName("Chat panel location").setDesc("Where to open the chat view by default.").addDropdown(e=>e.addOption("right","Right sidebar").addOption("main","Main window").setValue(this.plugin.settings.chatPaneLocation).onChange(async t=>{this.plugin.settings.chatPaneLocation=t,await this.plugin.saveSettings()})),c.createEl("h3",{text:"Docling"}),new _.Setting(c).setName("OCR mode").setDesc("auto, force, or off").addDropdown(e=>e.addOption("auto","auto").addOption("force","force").addOption("off","off").setValue(this.plugin.settings.ocrMode).onChange(async t=>{this.plugin.settings.ocrMode=t,await this.plugin.saveSettings()})),new _.Setting(c).setName("Chunking").setDesc("page or section").addDropdown(e=>e.addOption("page","page").addOption("section","section").setValue(this.plugin.settings.chunkingMode).onChange(async t=>{this.plugin.settings.chunkingMode=t,await this.plugin.saveSettings()}))}};var O={"docling_extract.py":String.raw`#!/usr/bin/env python3
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
    pages_attr = getattr(doc, "pages", None)
    if pages_attr is not None and not isinstance(pages_attr, (str, bytes, dict)):
        try:
            pages_list = list(pages_attr)
        except TypeError:
            pages_list = []
        if pages_list:
            for idx, page in enumerate(pages_list, start=1):
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


def extract_pages_from_pdf(pdf_path: str) -> List[Dict[str, Any]]:
    try:
        from pypdf import PdfReader
    except Exception as exc:
        eprint(f"pypdf is not available for fallback page extraction: {exc}")
        return []

    pages: List[Dict[str, Any]] = []
    try:
        reader = PdfReader(pdf_path)
        for idx, page in enumerate(reader.pages, start=1):
            try:
                text = page.extract_text() or ""
            except Exception:
                text = ""
            pages.append({"page_num": idx, "text": text})
    except Exception as exc:
        eprint(f"Failed to extract pages with pypdf: {exc}")
        return []

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
        if len(pages) <= 1:
            fallback_pages = extract_pages_from_pdf(args.pdf)
            if len(fallback_pages) > len(pages):
                pages = fallback_pages
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
    parser.add_argument("--progress", action="store_true")
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

    valid_chunks = []
    for chunk in chunks:
        text = str(chunk.get("text", ""))
        if not text.strip():
            continue
        chunk_id = chunk.get("chunk_id")
        if not chunk_id:
            continue
        valid_chunks.append(chunk)

    total = len(valid_chunks)
    current = 0

    for chunk in valid_chunks:
        current += 1
        text = str(chunk.get("text", ""))
        chunk_id = chunk.get("chunk_id")

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

        if args.progress:
            print(json.dumps({"type": "progress", "current": current, "total": total}), flush=True)

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
    response.encoding = "utf-8"
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


def is_stream_unsupported(message: str) -> bool:
    lowered = message.lower()
    return "stream" in lowered and ("not supported" in lowered or "unsupported" in lowered or "unknown parameter" in lowered)


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
    response.encoding = "utf-8"
    if response.status_code >= 400:
        error_text = response.text
        if is_temperature_unsupported(error_text):
            response = requests.post(url, json=base_payload, headers=headers, timeout=120)
            response.encoding = "utf-8"
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


def request_chat_stream(
    base_url: str,
    api_key: str,
    model: str,
    temperature: float,
    system_prompt: str,
    user_prompt: str,
    on_delta,
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
        "stream": True,
    }
    payload = dict(base_payload)
    payload["temperature"] = temperature

    response = requests.post(url, json=payload, headers=headers, timeout=120, stream=True)
    response.encoding = "utf-8"
    if response.status_code >= 400:
        error_text = response.text
        if is_temperature_unsupported(error_text):
            response = requests.post(url, json=base_payload, headers=headers, timeout=120, stream=True)
            response.encoding = "utf-8"
            if response.status_code >= 400:
                raise RuntimeError(f"Chat request failed: {response.status_code} {response.text}")
        else:
            raise RuntimeError(f"Chat request failed: {response.status_code} {error_text}")

    content_parts: List[str] = []
    for raw_line in response.iter_lines(decode_unicode=True):
        if not raw_line:
            continue
        line = raw_line.strip()
        if not line.startswith("data:"):
            continue
        data = line[5:].strip()
        if data == "[DONE]":
            break
        try:
            payload = json.loads(data)
        except Exception:
            continue
        choices = payload.get("choices") or []
        if not choices:
            continue
        delta = choices[0].get("delta") or {}
        piece = delta.get("content")
        if not piece:
            continue
        content_parts.append(piece)
        on_delta(piece)

    return "".join(content_parts)


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
        source_pdf = chunk.get("source_pdf", "")
        key = (doc_id, page_start, page_end, source_pdf)
        if key in seen:
            continue
        seen.add(key)
        citations.append({
            "doc_id": doc_id,
            "page_start": page_start,
            "page_end": page_end,
            "pages": f"{page_start}-{page_end}",
            "source_pdf": source_pdf,
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
    parser.add_argument("--stream", action="store_true")
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

    citations = build_citations(retrieved)

    answer = ""
    streamed = False
    if args.stream:
        def emit(obj: Dict[str, Any]) -> None:
            print(json.dumps(obj, ensure_ascii=False), flush=True)

        try:
            answer = request_chat_stream(
                args.chat_base_url,
                args.chat_api_key,
                args.chat_model,
                args.temperature,
                system_prompt,
                user_prompt,
                lambda chunk: emit({"type": "delta", "content": chunk}),
            )
            streamed = True
        except Exception as exc:
            if is_stream_unsupported(str(exc)):
                streamed = False
            else:
                eprint(f"Chat request failed: {exc}")
                return 2

    if not streamed:
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
        "citations": citations,
        "retrieved": retrieved,
    }

    if args.stream and streamed:
        print(json.dumps({"type": "final", **output}, ensure_ascii=False), flush=True)
    else:
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
`};var S=require("obsidian"),R="zotero-redisearch-rag-chat",I=class extends S.ItemView{constructor(e,t){super(e);this.messages=[];this.messageEls=new Map;this.pendingRender=new Map;this.busy=!1;this.plugin=t}getViewType(){return R}getDisplayText(){return"Zotero RAG Chat"}async onOpen(){let{containerEl:e}=this;e.empty(),e.addClass("zrr-chat-view");let t=e.createEl("div",{cls:"zrr-chat-header"});t.createEl("div",{cls:"zrr-chat-title",text:"Zotero RAG Chat"}),this.clearButton=t.createEl("button",{cls:"zrr-chat-clear",text:"Clear"}),this.clearButton.addEventListener("click",()=>this.clearChat()),this.messagesEl=e.createEl("div",{cls:"zrr-chat-messages"});let r=e.createEl("div",{cls:"zrr-chat-input"});this.inputEl=r.createEl("textarea",{cls:"zrr-chat-textarea",attr:{placeholder:"Ask your Zotero library..."}}),this.sendButton=r.createEl("button",{cls:"zrr-chat-send",text:"Send"}),this.sendButton.addEventListener("click",()=>this.handleSend()),this.inputEl.addEventListener("keydown",s=>{s.key==="Enter"&&!s.shiftKey&&(s.preventDefault(),this.handleSend())}),await this.loadHistory(),await this.renderAll()}focusInput(){var e;(e=this.inputEl)==null||e.focus()}async loadHistory(){try{this.messages=await this.plugin.loadChatHistory()}catch(e){console.error(e),this.messages=[]}}async saveHistory(){try{await this.plugin.saveChatHistory(this.messages)}catch(e){console.error(e)}}async renderAll(){this.messagesEl.empty(),this.messageEls.clear();for(let e of this.messages)await this.renderMessage(e);this.scrollToBottom()}async renderMessage(e){let t=this.messagesEl.createEl("div",{cls:`zrr-chat-message zrr-chat-${e.role}`});t.createEl("div",{cls:"zrr-chat-meta"}).setText(e.role==="user"?"You":"Assistant");let s=t.createEl("div",{cls:"zrr-chat-content"}),i=t.createEl("div",{cls:"zrr-chat-citations"});this.messageEls.set(e.id,{wrapper:t,content:s,citations:i}),await this.renderMessageContent(e)}scheduleRender(e){if(this.pendingRender.has(e.id))return;let t=window.setTimeout(async()=>{this.pendingRender.delete(e.id),await this.renderMessageContent(e),this.scrollToBottom()},80);this.pendingRender.set(e.id,t)}async renderMessageContent(e){var r;let t=this.messageEls.get(e.id);t&&(t.content.empty(),t.citations.empty(),await S.MarkdownRenderer.renderMarkdown(e.content||"",t.content,"",this.plugin),await this.renderCitations(t.citations,(r=e.citations)!=null?r:[]))}async renderCitations(e,t){if(e.empty(),!t.length)return;e.createEl("div",{cls:"zrr-chat-citations-label",text:"Citations"});let r=e.createEl("ul",{cls:"zrr-chat-citation-list"});for(let s of t){let i=await this.plugin.resolveCitationDisplay(s),n=r.createEl("li");n.createEl("a",{text:i.label,href:"#"}).addEventListener("click",d=>{d.preventDefault(),this.plugin.openCitationTarget(s,i)}),i.zoteroUrl&&(n.createEl("span",{text:" \xB7 "}),n.createEl("a",{text:"Zotero",href:"#"}).addEventListener("click",u=>{u.preventDefault(),this.plugin.openExternalUrl(i.zoteroUrl)}))}}scrollToBottom(){this.messagesEl.scrollTop=this.messagesEl.scrollHeight}async handleSend(){if(this.busy)return;let e=this.inputEl.value.trim();if(!e){new S.Notice("Query cannot be empty.");return}if(!this.plugin.settings.chatBaseUrl){new S.Notice("Chat base URL must be set in settings.");return}this.inputEl.value="",this.busy=!0,this.sendButton.disabled=!0;let t={id:this.generateId(),role:"user",content:e,createdAt:new Date().toISOString()};this.messages.push(t),await this.renderMessage(t),this.scrollToBottom(),await this.saveHistory();let r={id:this.generateId(),role:"assistant",content:"",citations:[],createdAt:new Date().toISOString()};this.messages.push(r),await this.renderMessage(r),this.scrollToBottom();let s=!1;try{await this.plugin.runRagQueryStreaming(e,i=>{s=!0,r.content+=i,this.scheduleRender(r)},i=>{(!s&&(i!=null&&i.answer)||i!=null&&i.answer)&&(r.content=i.answer),Array.isArray(i==null?void 0:i.citations)&&(r.citations=i.citations),this.scheduleRender(r)})}catch(i){console.error(i),r.content="Failed to fetch answer. See console for details.",this.scheduleRender(r)}finally{this.busy=!1,this.sendButton.disabled=!1,await this.saveHistory()}}async clearChat(){this.messages=[],await this.saveHistory(),await this.renderAll()}generateId(){return typeof crypto!="undefined"&&"randomUUID"in crypto?crypto.randomUUID():`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}};var M=class extends o.Modal{constructor(c,e,t,r,s="Value cannot be empty."){super(c),this.titleText=e,this.placeholder=t,this.onSubmit=r,this.emptyMessage=s}onOpen(){let{contentEl:c}=this;c.empty(),c.createEl("h3",{text:this.titleText});let e=c.createEl("input",{type:"text",placeholder:this.placeholder});e.style.width="100%",e.focus();let t=c.createEl("button",{text:"Submit"});t.style.marginTop="0.75rem";let r=()=>{let s=e.value.trim();if(!s){new o.Notice(this.emptyMessage);return}this.close(),this.onSubmit(s)};t.addEventListener("click",r),e.addEventListener("keydown",s=>{s.key==="Enter"&&r()})}};var z=class extends o.Plugin{constructor(){super(...arguments);this.docIndex=null}async onload(){await this.loadSettings(),await this.migrateCachePaths(),this.addSettingTab(new N(this.app,this)),this.registerView(R,e=>new I(e,this)),this.setupStatusBar();try{await this.ensureBundledTools()}catch(e){console.error("Failed to sync bundled tools",e)}this.addCommand({id:"import-zotero-item-index",name:"Import Zotero item and index (Docling -> RedisSearch)",callback:()=>this.importZoteroItem()}),this.addCommand({id:"ask-zotero-library",name:"Ask my Zotero library (RAG via RedisSearch)",callback:()=>this.askZoteroLibrary()}),this.addCommand({id:"open-zotero-chat",name:"Open Zotero RAG chat panel",callback:()=>this.openChatView(!0)}),this.addCommand({id:"rebuild-zotero-note-cache",name:"Rebuild Zotero note from cache (Docling + RedisSearch)",callback:()=>this.rebuildNoteFromCache()})}async loadSettings(){this.settings=Object.assign({},Z,await this.loadData())}async saveSettings(){await this.saveData(this.settings)}async importZoteroItem(){var P,h;try{await this.ensureBundledTools()}catch(l){new o.Notice("Failed to sync bundled tools. See console for details."),console.error(l);return}let e;try{e=await this.promptZoteroItem()}catch(l){new o.Notice("Zotero search failed. See console for details."),console.error(l);return}if(!e){new o.Notice("No Zotero item selected.");return}let t=(P=e.data)!=null?P:e;!t.key&&e.key&&(t.key=e.key);let r=this.getDocId(t);if(!r){new o.Notice("Could not resolve a stable doc_id from Zotero item.");return}let s=await this.resolvePdfAttachment(t,r);if(!s){new o.Notice("No PDF attachment found for item.");return}this.showStatusProgress("Preparing...",5);let i=typeof t.title=="string"?t.title:"",n=this.sanitizeFileName(i)||r,a=await this.resolveUniqueBaseName(n,r),d=(0,o.normalizePath)(`${this.settings.outputPdfDir}/${a}.pdf`),u=(0,o.normalizePath)(`${C}/${r}.json`),p=(0,o.normalizePath)(`${A}/${r}.json`),m=(0,o.normalizePath)(`${this.settings.outputNoteDir}/${a}.md`);try{await this.ensureFolder(C),await this.ensureFolder(A),await this.ensureFolder(this.settings.outputNoteDir),this.settings.copyPdfToVault&&await this.ensureFolder(this.settings.outputPdfDir)}catch(l){new o.Notice("Failed to create output folders."),console.error(l),this.clearStatusProgress();return}let w="",y="";try{if(this.settings.copyPdfToVault){let l=s.filePath?await T.promises.readFile(s.filePath):await this.downloadZoteroPdf(s.key);await this.app.vault.adapter.writeBinary(d,this.bufferToArrayBuffer(l)),w=this.getAbsoluteVaultPath(d),y=`[[${d}]]`}else{if(!s.filePath){new o.Notice("PDF file path missing. Enable PDF copying or check Zotero storage."),this.clearStatusProgress();return}w=s.filePath,y=`[PDF](${(0,D.pathToFileURL)(s.filePath).toString()})`}}catch(l){new o.Notice("Failed to download PDF attachment."),console.error(l),this.clearStatusProgress();return}try{await this.app.vault.adapter.write(u,JSON.stringify(e,null,2))}catch(l){new o.Notice("Failed to write Zotero item JSON."),console.error(l),this.clearStatusProgress();return}let f=this.getPluginDir(),k=g.default.join(f,"tools","docling_extract.py"),b=g.default.join(f,"tools","index_redisearch.py");try{this.showStatusProgress("Docling extraction...",null),await this.runPython(k,["--pdf",w,"--doc-id",r,"--out-json",this.getAbsoluteVaultPath(p),"--out-md",this.getAbsoluteVaultPath(m),"--chunking",this.settings.chunkingMode,"--ocr",this.settings.ocrMode])}catch(l){new o.Notice("Docling extraction failed. See console for details."),console.error(l),this.clearStatusProgress();return}try{this.showStatusProgress("Indexing chunks...",0),await this.runPythonStreaming(b,["--chunks-json",this.getAbsoluteVaultPath(p),"--redis-url",this.settings.redisUrl,"--index",this.settings.redisIndex,"--prefix",this.settings.redisPrefix,"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--progress"],l=>{if((l==null?void 0:l.type)==="progress"&&l.total){let E=Math.round(l.current/l.total*100);this.showStatusProgress(`Indexing chunks ${l.current}/${l.total}`,E)}},()=>{})}catch(l){new o.Notice("RedisSearch indexing failed. See console for details."),console.error(l),this.clearStatusProgress();return}try{let l=await this.app.vault.adapter.read(m),E=this.buildNoteMarkdown(t,(h=e.meta)!=null?h:{},r,y,u,l);await this.app.vault.adapter.write(m,E)}catch(l){new o.Notice("Failed to finalize note markdown."),console.error(l),this.clearStatusProgress();return}try{await this.updateDocIndex({doc_id:r,note_path:m,note_title:a,zotero_title:i,pdf_path:w,attachment_key:s.key})}catch(l){console.error("Failed to update doc index",l)}this.showStatusProgress("Done",100),window.setTimeout(()=>this.clearStatusProgress(),1200),new o.Notice(`Indexed Zotero item ${r}.`)}async askZoteroLibrary(){await this.openChatView(!0)}getChatLeaf(){var e;return this.settings.chatPaneLocation==="right"?(e=this.app.workspace.getRightLeaf(!1))!=null?e:this.app.workspace.getLeaf("split"):this.app.workspace.getLeaf("tab")}async openChatView(e=!1){let t=this.getChatLeaf();await t.setViewState({type:R,active:!0}),this.app.workspace.revealLeaf(t);let r=t.view;return r instanceof I&&e&&r.focusInput(),r}async loadChatHistory(){let e=this.app.vault.adapter,t=(0,o.normalizePath)(`${v}/chat.json`);if(!await e.exists(t))return[];let r=await e.read(t),s;try{s=JSON.parse(r)}catch(n){return[]}let i=Array.isArray(s)?s:s==null?void 0:s.messages;return Array.isArray(i)?i.filter(n=>n&&typeof n.content=="string").map(n=>({id:n.id||this.generateChatId(),role:n.role==="assistant"?"assistant":"user",content:n.content,citations:Array.isArray(n.citations)?n.citations:[],createdAt:n.createdAt||new Date().toISOString()})):[]}async saveChatHistory(e){await this.ensureFolder(v);let t=this.app.vault.adapter,r=(0,o.normalizePath)(`${v}/chat.json`),s={version:1,messages:e};await t.write(r,JSON.stringify(s,null,2))}async runRagQueryStreaming(e,t,r){await this.ensureBundledTools();let s=this.getPluginDir(),i=g.default.join(s,"tools","rag_query_redisearch.py"),n=["--query",e,"--k","5","--redis-url",this.settings.redisUrl,"--index",this.settings.redisIndex,"--prefix",this.settings.redisPrefix,"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--chat-base-url",this.settings.chatBaseUrl,"--chat-api-key",this.settings.chatApiKey,"--chat-model",this.settings.chatModel,"--temperature",String(this.settings.chatTemperature),"--stream"];return this.runPythonStreaming(i,n,a=>{if((a==null?void 0:a.type)==="delta"&&typeof a.content=="string"){t(a.content);return}if((a==null?void 0:a.type)==="final"){r(a);return}a!=null&&a.answer&&r(a)},r)}async resolveCitationDisplay(e){var u,p;let t=await this.getDocIndexEntry(e.doc_id);(!t||!t.note_title||!t.zotero_title||!t.note_path||!t.pdf_path)&&(t=await this.hydrateDocIndexFromCache(e.doc_id));let r=(t==null?void 0:t.zotero_title)||(t==null?void 0:t.note_title)||e.doc_id||"?",s=e.pages||`${(u=e.page_start)!=null?u:"?"}-${(p=e.page_end)!=null?p:"?"}`,i=`${r} pages ${s}`,n=e.page_start?String(e.page_start):"",a=(t==null?void 0:t.pdf_path)||e.source_pdf||"",d=e.doc_id?this.buildZoteroDeepLink(e.doc_id,t==null?void 0:t.attachment_key,n):void 0;return{label:i,notePath:t==null?void 0:t.note_path,pdfPath:a||void 0,zoteroUrl:d,pageStart:n||void 0}}async openCitationTarget(e,t){let r=t!=null?t:await this.resolveCitationDisplay(e);if(r.notePath){await this.openNoteInMain(r.notePath);return}if(!(r.pdfPath&&await this.openPdfInMain(r.pdfPath,r.pageStart))){if(r.zoteroUrl){this.openExternalUrl(r.zoteroUrl);return}new o.Notice("Unable to open citation target.")}}async rebuildNoteFromCache(){var b,P;let e=await this.promptDocId();if(!e){new o.Notice("No doc_id provided.");return}try{await this.ensureBundledTools()}catch(h){new o.Notice("Failed to sync bundled tools. See console for details."),console.error(h);return}let t=this.app.vault.adapter,r=(0,o.normalizePath)(`${C}/${e}.json`),s=(0,o.normalizePath)(`${A}/${e}.json`);if(!await t.exists(r)){new o.Notice("Cached item JSON not found.");return}if(!await t.exists(s)){new o.Notice("Cached chunks JSON not found.");return}this.showStatusProgress("Preparing...",5);let i;try{let h=await t.read(r);i=JSON.parse(h)}catch(h){new o.Notice("Failed to read cached item JSON."),console.error(h),this.clearStatusProgress();return}let n;try{let h=await t.read(s);n=JSON.parse(h)}catch(h){new o.Notice("Failed to read cached chunks JSON."),console.error(h),this.clearStatusProgress();return}let a=typeof n.source_pdf=="string"?n.source_pdf:"";if(!a){new o.Notice("Cached chunk JSON is missing source_pdf."),this.clearStatusProgress();return}try{await T.promises.access(a)}catch(h){new o.Notice("Cached source PDF path is not accessible."),console.error(h),this.clearStatusProgress();return}let d=(b=i.data)!=null?b:i,u=typeof d.title=="string"?d.title:"",p="",m=await this.getDocIndexEntry(e);if(m!=null&&m.note_path&&await t.exists(m.note_path)&&(p=(0,o.normalizePath)(m.note_path)),!p){let h=this.sanitizeFileName(u)||e,l=(0,o.normalizePath)(`${this.settings.outputNoteDir}/${h}.md`),E=await t.exists(l)?h:await this.resolveUniqueBaseName(h,e);p=(0,o.normalizePath)(`${this.settings.outputNoteDir}/${E}.md`)}try{await this.ensureFolder(this.settings.outputNoteDir)}catch(h){new o.Notice("Failed to create notes folder."),console.error(h),this.clearStatusProgress();return}let w=this.getPluginDir(),y=g.default.join(w,"tools","docling_extract.py"),f=g.default.join(w,"tools","index_redisearch.py");try{this.showStatusProgress("Docling extraction...",null),await this.runPython(y,["--pdf",a,"--doc-id",e,"--out-json",this.getAbsoluteVaultPath(s),"--out-md",this.getAbsoluteVaultPath(p),"--chunking",this.settings.chunkingMode,"--ocr",this.settings.ocrMode])}catch(h){new o.Notice("Docling extraction failed. See console for details."),console.error(h),this.clearStatusProgress();return}try{this.showStatusProgress("Indexing chunks...",0),await this.runPythonStreaming(f,["--chunks-json",this.getAbsoluteVaultPath(s),"--redis-url",this.settings.redisUrl,"--index",this.settings.redisIndex,"--prefix",this.settings.redisPrefix,"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--upsert","--progress"],h=>{if((h==null?void 0:h.type)==="progress"&&h.total){let l=Math.round(h.current/h.total*100);this.showStatusProgress(`Indexing chunks ${h.current}/${h.total}`,l)}},()=>{})}catch(h){new o.Notice("RedisSearch indexing failed. See console for details."),console.error(h),this.clearStatusProgress();return}let k=this.buildPdfLinkFromSourcePath(a);try{let h=await this.app.vault.adapter.read(p),l=this.buildNoteMarkdown(d,(P=i.meta)!=null?P:{},e,k,r,h);await this.app.vault.adapter.write(p,l)}catch(h){new o.Notice("Failed to finalize note markdown."),console.error(h),this.clearStatusProgress();return}try{await this.updateDocIndex({doc_id:e,note_path:p,note_title:g.default.basename(p,".md"),zotero_title:u,pdf_path:a})}catch(h){console.error("Failed to update doc index",h)}this.showStatusProgress("Done",100),window.setTimeout(()=>this.clearStatusProgress(),1200),new o.Notice(`Rebuilt Zotero note for ${e}.`)}async promptZoteroItem(){return new Promise(e=>{new B(this.app,this,e).open()})}setupStatusBar(){let e=this.addStatusBarItem();e.addClass("zrr-status-progress"),e.style.display="none";let t=e.createEl("span",{text:"Idle"});t.addClass("zrr-status-label");let s=e.createEl("div",{cls:"zrr-status-bar"}).createEl("div",{cls:"zrr-status-bar-inner"});this.statusBarEl=e,this.statusLabelEl=t,this.statusBarInnerEl=s}showStatusProgress(e,t){if(!(!this.statusBarEl||!this.statusLabelEl||!this.statusBarInnerEl))if(this.statusBarEl.style.display="flex",this.statusLabelEl.setText(e),t===null)this.statusBarInnerEl.addClass("indeterminate"),this.statusBarInnerEl.style.width="40%";else{this.statusBarInnerEl.removeClass("indeterminate");let r=Math.max(0,Math.min(100,t));this.statusBarInnerEl.style.width=`${r}%`}}clearStatusProgress(){!this.statusBarEl||!this.statusBarInnerEl||(this.statusBarEl.style.display="none",this.statusBarInnerEl.removeClass("indeterminate"),this.statusBarInnerEl.style.width="0%")}async promptDocId(){return new Promise(e=>{new M(this.app,"Rebuild Zotero note from cache","Enter Zotero doc_id (e.g., ABC123)",t=>e(t),"Doc ID cannot be empty.").open()})}getDocId(e){let t=[e.key,e.itemKey,e.id,e.citationKey];for(let r of t)if(typeof r=="string"&&r.trim())return r.trim();return null}sanitizeFileName(e){let t=e.replace(/[\\/:*?"<>|]/g,"").replace(/\s+/g," ").trim();return t?t.replace(/[.]+$/g,"").trim().replace(/ /g,"-").slice(0,120):""}async resolveUniqueBaseName(e,t){let r=this.app.vault.adapter,s=(0,o.normalizePath)(`${this.settings.outputNoteDir}/${e}.md`),i=(0,o.normalizePath)(`${this.settings.outputPdfDir}/${e}.pdf`),n=await r.exists(s),a=this.settings.copyPdfToVault?await r.exists(i):!1;return n||a?`${e}-${t}`:e}async searchZoteroItems(e){let t=new URLSearchParams;t.set("itemType","-attachment"),t.set("limit","25"),t.set("include","data,meta"),e.trim()&&t.set("q",e.trim());let r=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items?${t.toString()}`),s=await this.requestLocalApi(r,`Zotero search failed for ${r}`),i=JSON.parse(s.toString("utf8"));return Array.isArray(i)?i.map(n=>{var a,d,u,p;return{key:(d=n.key)!=null?d:(a=n.data)==null?void 0:a.key,data:(u=n.data)!=null?u:{},meta:(p=n.meta)!=null?p:{}}}).filter(n=>typeof n.key=="string"&&n.key.trim().length>0):[]}async resolvePdfAttachment(e,t){let r=this.pickPdfAttachment(e);if(r)return r;try{let s=await this.fetchZoteroChildren(t);for(let i of s){let n=this.toPdfAttachment(i);if(n)return n}}catch(s){console.error("Failed to fetch Zotero children",s)}return null}pickPdfAttachment(e){var r,s,i;let t=(i=(s=(r=e.attachments)!=null?r:e.children)!=null?s:e.items)!=null?i:[];if(!Array.isArray(t))return null;for(let n of t){let a=this.toPdfAttachment(n);if(a)return a}return null}toPdfAttachment(e){var i,n,a,d,u,p;if(((a=(i=e==null?void 0:e.contentType)!=null?i:e==null?void 0:e.mimeType)!=null?a:(n=e==null?void 0:e.data)==null?void 0:n.contentType)!=="application/pdf")return null;let r=(p=(d=e==null?void 0:e.key)!=null?d:e==null?void 0:e.attachmentKey)!=null?p:(u=e==null?void 0:e.data)==null?void 0:u.key;if(!r)return null;let s=this.extractAttachmentPath(e);return s?{key:r,filePath:s}:{key:r}}extractAttachmentPath(e){var r,s,i,n,a,d,u,p;let t=(p=(n=(s=(r=e==null?void 0:e.links)==null?void 0:r.enclosure)==null?void 0:s.href)!=null?n:(i=e==null?void 0:e.enclosure)==null?void 0:i.href)!=null?p:(u=(d=(a=e==null?void 0:e.data)==null?void 0:a.links)==null?void 0:d.enclosure)==null?void 0:u.href;if(typeof t=="string"&&t.startsWith("file://"))try{return(0,D.fileURLToPath)(t)}catch(m){return null}return null}async fetchZoteroChildren(e){let t=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}/children`),r=await this.requestLocalApi(t,`Zotero children request failed for ${t}`);return JSON.parse(r.toString("utf8"))}async downloadZoteroPdf(e){let t=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}/file`),r=await this.requestLocalApiRaw(t),s=await this.followFileRedirect(r);if(s)return s;if(r.statusCode>=300)throw new Error(`Request failed, status ${r.statusCode}`);return r.body}buildZoteroUrl(e){return`${this.settings.zoteroBaseUrl.replace(/\/$/,"")}${e}`}requestLocalApiRaw(e){return new Promise((t,r)=>{let s=new URL(e),n=(s.protocol==="https:"?U.default:q.default).request({method:"GET",hostname:s.hostname,port:s.port||void 0,path:`${s.pathname}${s.search}`,headers:{Accept:"*/*"}},a=>{let d=[];a.on("data",u=>d.push(Buffer.from(u))),a.on("end",()=>{var p;let u=Buffer.concat(d);t({statusCode:(p=a.statusCode)!=null?p:0,headers:a.headers,body:u})})});n.on("error",r),n.end()})}async requestLocalApi(e,t){let r=await this.requestLocalApiRaw(e);if(r.statusCode>=400){let s=r.body.toString("utf8");throw new Error(`${t!=null?t:"Request failed"}, status ${r.statusCode}: ${s||"no response body"}`)}if(r.statusCode>=300)throw new Error(`${t!=null?t:"Request failed"}, status ${r.statusCode}`);return r.body}async followFileRedirect(e){if(e.statusCode<300||e.statusCode>=400)return null;let t=e.headers.location,r=Array.isArray(t)?t[0]:t;if(!r||typeof r!="string")return null;if(r.startsWith("file://")){let s=(0,D.fileURLToPath)(r);return T.promises.readFile(s)}return r.startsWith("http://")||r.startsWith("https://")?this.requestLocalApi(r):null}bufferToArrayBuffer(e){return e.buffer.slice(e.byteOffset,e.byteOffset+e.byteLength)}buildPdfLinkFromSourcePath(e){if(!e)return"";let t=g.default.normalize(this.getVaultBasePath()),r=g.default.normalize(e),s=t.endsWith(g.default.sep)?t:`${t}${g.default.sep}`;return r.startsWith(s)?`[[${(0,o.normalizePath)(g.default.relative(t,r))}]]`:`[PDF](${(0,D.pathToFileURL)(e).toString()})`}async openNoteInMain(e){let t=(0,o.normalizePath)(e);await this.app.workspace.openLinkText(t,"","tab")}async openPdfInMain(e,t){if(!e)return!1;let r=g.default.normalize(this.getVaultBasePath()),s=g.default.normalize(e),i=r.endsWith(g.default.sep)?r:`${r}${g.default.sep}`;if(s.startsWith(i)){let n=(0,o.normalizePath)(g.default.relative(r,s)),a=t?`#page=${t}`:"";return await this.app.workspace.openLinkText(`${n}${a}`,"","tab"),!0}try{return window.open((0,D.pathToFileURL)(e).toString()),!0}catch(n){return!1}}openExternalUrl(e){e&&window.open(e)}buildZoteroDeepLink(e,t,r){if(t){let s=r?`?page=${encodeURIComponent(r)}`:"";return`zotero://open-pdf/library/items/${t}${s}`}return`zotero://select/library/items/${e}`}formatCitationsMarkdown(e){return e.length?e.map(r=>this.formatCitationMarkdown(r)).filter(Boolean).join(`
`):""}formatCitationMarkdown(e){var n,a;let t=e.doc_id||"?",r=e.pages||`${(n=e.page_start)!=null?n:"?"}-${(a=e.page_end)!=null?a:"?"}`,s=`${t} pages ${r}`,i=e.source_pdf||"";if(i){let d=this.buildPdfLinkFromSourcePath(i);if(d.startsWith("[["))return`- [[${d.slice(2,-2)}|${s}]]`;let u=d.match(/^\[PDF\]\((.+)\)$/);if(u)return`- [${s}](${u[1]})`}return`- ${s}`}generateChatId(){return typeof crypto!="undefined"&&"randomUUID"in crypto?crypto.randomUUID():`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}getDocIndexPath(){return(0,o.normalizePath)(`${v}/doc_index.json`)}async getDocIndex(){return this.docIndex?this.docIndex:(this.docIndex=await this.loadDocIndexFromDisk(),this.docIndex)}async loadDocIndexFromDisk(){var r;let e=this.app.vault.adapter,t=this.getDocIndexPath();if(!await e.exists(t))return{};try{let s=await e.read(t),i=JSON.parse(s);if(i&&typeof i=="object"){let n=(r=i.entries)!=null?r:i;if(Array.isArray(n)){let a={};for(let d of n)d!=null&&d.doc_id&&(a[String(d.doc_id)]=d);return a}if(n&&typeof n=="object")return n}}catch(s){console.error("Failed to read doc index",s)}return{}}async saveDocIndex(e){await this.ensureFolder(v);let t=this.app.vault.adapter,r=this.getDocIndexPath(),s={version:1,entries:e};await t.write(r,JSON.stringify(s,null,2)),this.docIndex=e}async updateDocIndex(e){var i;let t=await this.getDocIndex(),r=(i=t[e.doc_id])!=null?i:{doc_id:e.doc_id},s={...r,...e,doc_id:e.doc_id,updated_at:new Date().toISOString()};e.note_path===void 0&&r.note_path&&(s.note_path=r.note_path),e.note_title===void 0&&r.note_title&&(s.note_title=r.note_title),e.zotero_title===void 0&&r.zotero_title&&(s.zotero_title=r.zotero_title),e.pdf_path===void 0&&r.pdf_path&&(s.pdf_path=r.pdf_path),e.attachment_key===void 0&&r.attachment_key&&(s.attachment_key=r.attachment_key),t[e.doc_id]=s,await this.saveDocIndex(t)}async hydrateDocIndexFromCache(e){var a,d;if(!e)return null;let t=this.app.vault.adapter,r=await this.getDocIndexEntry(e),s={},i=(0,o.normalizePath)(`${C}/${e}.json`);if(await t.exists(i))try{let u=await t.read(i),p=JSON.parse(u),m=(d=(a=p==null?void 0:p.data)!=null?a:p)!=null?d:{},w=typeof m.title=="string"?m.title:"";if(w&&(s.zotero_title=w),!s.note_title||!s.note_path){let y=this.sanitizeFileName(w)||e,f=(0,o.normalizePath)(`${this.settings.outputNoteDir}/${y}.md`),k=(0,o.normalizePath)(`${this.settings.outputNoteDir}/${y}-${e}.md`),b="";await t.exists(f)?b=f:await t.exists(k)&&(b=k),b&&(s.note_path=b,s.note_title=g.default.basename(b,".md"))}}catch(u){console.error("Failed to read cached item JSON",u)}!s.note_title&&(r!=null&&r.note_path)&&(s.note_title=g.default.basename(r.note_path,".md"));let n=(0,o.normalizePath)(`${A}/${e}.json`);if(await t.exists(n))try{let u=await t.read(n),p=JSON.parse(u);typeof(p==null?void 0:p.source_pdf)=="string"&&(s.pdf_path=p.source_pdf)}catch(u){console.error("Failed to read cached chunks JSON",u)}return Object.keys(s).length>0&&await this.updateDocIndex({doc_id:e,...s}),this.getDocIndexEntry(e)}async getDocIndexEntry(e){var r;return e&&(r=(await this.getDocIndex())[e])!=null?r:null}getZoteroLibraryPath(){let e=(this.settings.zoteroUserId||"0").trim();return!e||e==="0"?"users/0":e.startsWith("users/")||e.startsWith("groups/")?e:`users/${e}`}async ensureFolder(e){let t=this.app.vault.adapter,r=(0,o.normalizePath)(e).split("/").filter(Boolean),s="";for(let i of r)s=s?`${s}/${i}`:i,await t.exists(s)||await t.mkdir(s)}buildNoteMarkdown(e,t,r,s,i,n){let a=`[[${i}]]`,d=this.renderFrontmatter(e,t,r,s,a);return`${d?`---
${d}
---

`:""}PDF: ${s}

Item JSON: ${a}

${n}`}renderFrontmatter(e,t,r,s,i){var d;let n=(d=this.settings.frontmatterTemplate)!=null?d:"";if(!n.trim())return"";let a=this.buildTemplateVars(e,t,r,s,i);return n.replace(/{{\s*([a-z0-9_]+)\s*}}/gi,(u,p)=>{var m;return(m=a[p])!=null?m:""}).trim()}buildTemplateVars(e,t,r,s,i){let n=typeof e.title=="string"?e.title:"",a=typeof e.shortTitle=="string"?e.shortTitle:"",d=typeof e.date=="string"?e.date:"",u=typeof(t==null?void 0:t.parsedDate)=="string"?t.parsedDate:"",p=this.extractYear(u||d),w=(Array.isArray(e.creators)?e.creators:[]).filter(l=>l.creatorType==="author").map(l=>this.formatCreatorName(l)),y=w.join("; "),f=Array.isArray(e.tags)?e.tags.map(l=>typeof l=="string"?l:l==null?void 0:l.tag).filter(Boolean):[],k=f.join("; "),b=typeof e.itemType=="string"?e.itemType:"",P=typeof(t==null?void 0:t.creatorSummary)=="string"?t.creatorSummary:"",h={doc_id:r,zotero_key:typeof e.key=="string"?e.key:r,title:n,short_title:a,date:d,year:p,authors:y,tags:k,item_type:b,creator_summary:P,pdf_link:this.escapeYamlString(s),item_json:this.escapeYamlString(i)};for(let[l,E]of Object.entries(h))h[`${l}_yaml`]=this.escapeYamlString(E);return h.authors_yaml=this.toYamlList(w),h.tags_yaml=this.toYamlList(f),h}extractYear(e){if(!e)return"";let t=e.match(/\b(\d{4})\b/);return t?t[1]:""}formatCreatorName(e){if(!e||typeof e!="object")return"";if(e.name)return String(e.name);let t=e.firstName?String(e.firstName):"",r=e.lastName?String(e.lastName):"";return[r,t].filter(Boolean).join(", ")||`${t} ${r}`.trim()}escapeYamlString(e){return`"${String(e).replace(/\\/g,"\\\\").replace(/"/g,'\\"')}"`}toYamlList(e){return e.length?e.map(t=>`  - ${this.escapeYamlString(t)}`).join(`
`):'  - ""'}getVaultBasePath(){var r;let e=this.app.vault.adapter;if(e instanceof o.FileSystemAdapter)return e.getBasePath();let t=(r=e.getBasePath)==null?void 0:r.call(e);if(t)return t;throw new Error("Vault base path is unavailable.")}getPluginDir(){var s;let e=this.getVaultBasePath(),t=(s=this.manifest.dir)!=null?s:this.manifest.id;if(!t)throw new Error("Plugin directory is unavailable.");let r=g.default.isAbsolute(t)?t:g.default.join(e,t);return g.default.normalize(r)}async ensureBundledTools(){let e=this.getPluginDir(),t=g.default.join(e,"tools");await T.promises.mkdir(t,{recursive:!0});for(let[r,s]of Object.entries(O)){let i=g.default.join(t,r),n=!0;try{await T.promises.readFile(i,"utf8")===s&&(n=!1)}catch(a){}n&&await T.promises.writeFile(i,s,"utf8")}}async migrateCachePaths(){let e="zotero/items",t="zotero/chunks",r=C,s=A,i=this.app.vault.adapter,n=(0,o.normalizePath)(e),a=(0,o.normalizePath)(t),d=(0,o.normalizePath)(r),u=(0,o.normalizePath)(s),p=d.split("/").slice(0,-1).join("/"),m=u.split("/").slice(0,-1).join("/");p&&await this.ensureFolder(p),m&&await this.ensureFolder(m);let w=await i.exists(n),y=await i.exists(a),f=await i.exists(d),k=await i.exists(u);w&&!f&&await i.rename(n,d),y&&!k&&await i.rename(a,u)}getAbsoluteVaultPath(e){let t=this.getVaultBasePath(),r=g.default.isAbsolute(e)?e:g.default.join(t,e);return g.default.normalize(r)}runPython(e,t){return new Promise((r,s)=>{let i=(0,$.spawn)(this.settings.pythonPath,[e,...t],{cwd:g.default.dirname(e)}),n="";i.stderr.on("data",a=>{n+=a.toString()}),i.on("close",a=>{a===0?r():s(new Error(n||`Process exited with code ${a}`))})})}runPythonStreaming(e,t,r,s){return new Promise((i,n)=>{let a=(0,$.spawn)(this.settings.pythonPath,[e,...t],{cwd:g.default.dirname(e)}),d="",u="",p=null,m=!1,w=y=>{if(y.trim())try{let f=JSON.parse(y);p=f,((f==null?void 0:f.type)==="final"||f!=null&&f.answer)&&(m=!0),r(f)}catch(f){}};a.stdout.on("data",y=>{var k;d+=y.toString();let f=d.split(/\r?\n/);d=(k=f.pop())!=null?k:"";for(let b of f)w(b)}),a.stderr.on("data",y=>{u+=y.toString()}),a.on("close",y=>{d.trim()&&w(d),!m&&p&&s(p),y===0?i():n(new Error(u||`Process exited with code ${y}`))})})}runPythonWithOutput(e,t){return new Promise((r,s)=>{let i=(0,$.spawn)(this.settings.pythonPath,[e,...t],{cwd:g.default.dirname(e)}),n="",a="";i.stdout.on("data",d=>{n+=d.toString()}),i.stderr.on("data",d=>{a+=d.toString()}),i.on("close",d=>{d===0?r(n.trim()):s(new Error(a||`Process exited with code ${d}`))})})}},B=class extends o.SuggestModal{constructor(e,t,r){super(e);this.lastError=null;this.plugin=t,this.resolveSelection=r,this.setPlaceholder("Search Zotero items...")}async getSuggestions(e){try{return await this.plugin.searchZoteroItems(e)}catch(t){let r=t instanceof Error?t.message:String(t);return this.lastError!==r&&(this.lastError=r,new o.Notice(r)),console.error("Zotero search failed",t),[]}}renderSuggestion(e,t){var i,n;let r=(n=(i=e.data)==null?void 0:i.title)!=null?n:"[No title]",s=this.extractYear(e);t.createEl("div",{text:r}),t.createEl("small",{text:s?`${s}`:""}),t.addEventListener("click",()=>{this.resolveSelection&&(this.resolveSelection(e),this.resolveSelection=null),this.close()})}onChooseSuggestion(e,t){this.resolveSelection&&(this.resolveSelection(e),this.resolveSelection=null),this.close()}onClose(){this.resolveSelection&&(this.resolveSelection(null),this.resolveSelection=null)}extractYear(e){var s,i,n,a;let t=(a=(n=(s=e.meta)==null?void 0:s.parsedDate)!=null?n:(i=e.data)==null?void 0:i.date)!=null?a:"";if(typeof t!="string")return"";let r=t.match(/\b(\d{4})\b/);return r?r[1]:""}};
