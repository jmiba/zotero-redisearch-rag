"use strict";var V=Object.create;var L=Object.defineProperty;var H=Object.getOwnPropertyDescriptor;var K=Object.getOwnPropertyNames;var J=Object.getPrototypeOf,W=Object.prototype.hasOwnProperty;var Y=(_,e)=>{for(var t in e)L(_,t,{get:e[t],enumerable:!0})},Z=(_,e,t,r)=>{if(e&&typeof e=="object"||typeof e=="function")for(let s of K(e))!W.call(_,s)&&s!==t&&L(_,s,{get:()=>e[s],enumerable:!(r=H(e,s))||r.enumerable});return _};var F=(_,e,t)=>(t=_!=null?V(J(_)):{},Z(e||!_||!_.__esModule?L(t,"default",{value:_,enumerable:!0}):t,_)),G=_=>Z(L({},"__esModule",{value:!0}),_);var Q={};Y(Q,{default:()=>M});module.exports=G(Q);var o=require("obsidian"),I=require("child_process"),P=require("fs"),B=F(require("http")),O=F(require("https")),m=F(require("path")),S=require("url");var g=require("obsidian"),T=".zotero-redisearch-rag",C=`${T}/items`,A=`${T}/chunks`,j={zoteroBaseUrl:"http://127.0.0.1:23119/api",zoteroUserId:"0",pythonPath:"python3",copyPdfToVault:!0,frontmatterTemplate:`doc_id: {{doc_id}}
zotero_key: {{zotero_key}}
title: {{title_yaml}}
year: {{year}}
authors:
{{authors_yaml}}
item_type: {{item_type}}
pdf_link: {{pdf_link}}
item_json: {{item_json}}`,outputPdfDir:"zotero/pdfs",outputNoteDir:"zotero/notes",chatPaneLocation:"right",redisUrl:"redis://127.0.0.1:6379",redisIndex:"idx:zotero",redisPrefix:"zotero:chunk:",embedBaseUrl:"http://localhost:1234/v1",embedApiKey:"lm-studio",embedModel:"google/embedding-gemma-300m",chatBaseUrl:"http://127.0.0.1:1234/v1",chatApiKey:"",chatModel:"openai/gpt-oss-20b",chatTemperature:.2,ocrMode:"auto",chunkingMode:"page"},R=class extends g.PluginSettingTab{constructor(e,t){super(e,t),this.plugin=t}display(){let{containerEl:e}=this;e.empty(),e.createEl("h2",{text:"Zotero RAG Settings"}),new g.Setting(e).setName("Zotero base URL").setDesc("Local Zotero API base URL, e.g. http://127.0.0.1:23119/api").addText(t=>t.setPlaceholder("http://127.0.0.1:23119/api").setValue(this.plugin.settings.zoteroBaseUrl).onChange(async r=>{this.plugin.settings.zoteroBaseUrl=r.trim(),await this.plugin.saveSettings()})),new g.Setting(e).setName("Zotero user ID").setDesc("Use 0 for local library. You can also enter users/<id> or groups/<id>.").addText(t=>t.setPlaceholder("123456").setValue(this.plugin.settings.zoteroUserId).onChange(async r=>{this.plugin.settings.zoteroUserId=r.trim(),await this.plugin.saveSettings()})),new g.Setting(e).setName("Python path").setDesc("Path to python3").addText(t=>t.setPlaceholder("python3").setValue(this.plugin.settings.pythonPath).onChange(async r=>{this.plugin.settings.pythonPath=r.trim()||"python3",await this.plugin.saveSettings()})),new g.Setting(e).setName("Copy PDFs into vault").setDesc("Disable to use Zotero storage paths directly.").addToggle(t=>t.setValue(this.plugin.settings.copyPdfToVault).onChange(async r=>{this.plugin.settings.copyPdfToVault=r,await this.plugin.saveSettings()})),new g.Setting(e).setName("Frontmatter template").setDesc("Use {{doc_id}}, {{zotero_key}}, {{title}}, {{title_yaml}}, {{year}}, {{date}}, {{authors}}, {{authors_yaml}}, {{tags}}, {{item_type}}, {{pdf_link}}, {{item_json}}").addTextArea(t=>{t.inputEl.rows=8,t.setValue(this.plugin.settings.frontmatterTemplate).onChange(async r=>{this.plugin.settings.frontmatterTemplate=r,await this.plugin.saveSettings()})}),e.createEl("h3",{text:"Output folders (vault-relative)"}),new g.Setting(e).setName("PDF folder").addText(t=>t.setPlaceholder("zotero/pdfs").setValue(this.plugin.settings.outputPdfDir).onChange(async r=>{this.plugin.settings.outputPdfDir=r.trim(),await this.plugin.saveSettings()})),new g.Setting(e).setName("Notes folder").addText(t=>t.setPlaceholder("zotero/notes").setValue(this.plugin.settings.outputNoteDir).onChange(async r=>{this.plugin.settings.outputNoteDir=r.trim(),await this.plugin.saveSettings()})),e.createEl("h3",{text:"Redis Stack"}),new g.Setting(e).setName("Redis URL").addText(t=>t.setPlaceholder("redis://127.0.0.1:6379").setValue(this.plugin.settings.redisUrl).onChange(async r=>{this.plugin.settings.redisUrl=r.trim(),await this.plugin.saveSettings()})),new g.Setting(e).setName("Index name").addText(t=>t.setPlaceholder("idx:zotero").setValue(this.plugin.settings.redisIndex).onChange(async r=>{this.plugin.settings.redisIndex=r.trim(),await this.plugin.saveSettings()})),new g.Setting(e).setName("Key prefix").addText(t=>t.setPlaceholder("zotero:chunk:").setValue(this.plugin.settings.redisPrefix).onChange(async r=>{this.plugin.settings.redisPrefix=r.trim(),await this.plugin.saveSettings()})),e.createEl("h3",{text:"Embeddings (LM Studio)"}),new g.Setting(e).setName("Embeddings base URL").addText(t=>t.setPlaceholder("http://localhost:1234/v1").setValue(this.plugin.settings.embedBaseUrl).onChange(async r=>{this.plugin.settings.embedBaseUrl=r.trim(),await this.plugin.saveSettings()})),new g.Setting(e).setName("Embeddings API key").addText(t=>t.setPlaceholder("lm-studio").setValue(this.plugin.settings.embedApiKey).onChange(async r=>{this.plugin.settings.embedApiKey=r.trim(),await this.plugin.saveSettings()})),new g.Setting(e).setName("Embeddings model").addText(t=>t.setPlaceholder("google/embedding-gemma-300m").setValue(this.plugin.settings.embedModel).onChange(async r=>{this.plugin.settings.embedModel=r.trim(),await this.plugin.saveSettings()})),e.createEl("h3",{text:"Chat LLM"}),new g.Setting(e).setName("Chat base URL").setDesc("OpenAI-compatible chat endpoint base URL").addText(t=>t.setPlaceholder("http://localhost:1234/v1").setValue(this.plugin.settings.chatBaseUrl).onChange(async r=>{this.plugin.settings.chatBaseUrl=r.trim(),await this.plugin.saveSettings()})),new g.Setting(e).setName("Chat API key").addText(t=>t.setPlaceholder("lm-studio").setValue(this.plugin.settings.chatApiKey).onChange(async r=>{this.plugin.settings.chatApiKey=r.trim(),await this.plugin.saveSettings()})),new g.Setting(e).setName("Chat model").addText(t=>t.setPlaceholder("meta-llama/llama-3.1-405b-instruct").setValue(this.plugin.settings.chatModel).onChange(async r=>{this.plugin.settings.chatModel=r.trim(),await this.plugin.saveSettings()})),new g.Setting(e).setName("Temperature").addText(t=>t.setPlaceholder("0.2").setValue(String(this.plugin.settings.chatTemperature)).onChange(async r=>{let s=Number.parseFloat(r);this.plugin.settings.chatTemperature=Number.isFinite(s)?s:.2,await this.plugin.saveSettings()})),new g.Setting(e).setName("Chat panel location").setDesc("Where to open the chat view by default.").addDropdown(t=>t.addOption("right","Right sidebar").addOption("main","Main window").setValue(this.plugin.settings.chatPaneLocation).onChange(async r=>{this.plugin.settings.chatPaneLocation=r,await this.plugin.saveSettings()})),e.createEl("h3",{text:"Docling"}),new g.Setting(e).setName("OCR mode").setDesc("auto, force, or off").addDropdown(t=>t.addOption("auto","auto").addOption("force","force").addOption("off","off").setValue(this.plugin.settings.ocrMode).onChange(async r=>{this.plugin.settings.ocrMode=r,await this.plugin.saveSettings()})),new g.Setting(e).setName("Chunking").setDesc("page or section").addDropdown(t=>t.addOption("page","page").addOption("section","section").setValue(this.plugin.settings.chunkingMode).onChange(async r=>{this.plugin.settings.chunkingMode=r,await this.plugin.saveSettings()}))}};var q={"docling_extract.py":String.raw`#!/usr/bin/env python3
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
    if response.status_code >= 400:
        error_text = response.text
        if is_temperature_unsupported(error_text):
            response = requests.post(url, json=base_payload, headers=headers, timeout=120, stream=True)
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
`};var k=require("obsidian"),N="zotero-redisearch-rag-chat",D=class extends k.ItemView{constructor(t,r){super(t);this.messages=[];this.messageEls=new Map;this.pendingRender=new Map;this.busy=!1;this.plugin=r}getViewType(){return N}getDisplayText(){return"Zotero RAG Chat"}async onOpen(){let{containerEl:t}=this;t.empty(),t.addClass("zrr-chat-view");let r=t.createEl("div",{cls:"zrr-chat-header"});r.createEl("div",{cls:"zrr-chat-title",text:"Zotero RAG Chat"}),this.clearButton=r.createEl("button",{cls:"zrr-chat-clear",text:"Clear"}),this.clearButton.addEventListener("click",()=>this.clearChat()),this.messagesEl=t.createEl("div",{cls:"zrr-chat-messages"});let s=t.createEl("div",{cls:"zrr-chat-input"});this.inputEl=s.createEl("textarea",{cls:"zrr-chat-textarea",attr:{placeholder:"Ask your Zotero library..."}}),this.sendButton=s.createEl("button",{cls:"zrr-chat-send",text:"Send"}),this.sendButton.addEventListener("click",()=>this.handleSend()),this.inputEl.addEventListener("keydown",n=>{n.key==="Enter"&&!n.shiftKey&&(n.preventDefault(),this.handleSend())}),await this.loadHistory(),await this.renderAll()}focusInput(){var t;(t=this.inputEl)==null||t.focus()}async loadHistory(){try{this.messages=await this.plugin.loadChatHistory()}catch(t){console.error(t),this.messages=[]}}async saveHistory(){try{await this.plugin.saveChatHistory(this.messages)}catch(t){console.error(t)}}async renderAll(){this.messagesEl.empty(),this.messageEls.clear();for(let t of this.messages)await this.renderMessage(t);this.scrollToBottom()}async renderMessage(t){let r=this.messagesEl.createEl("div",{cls:`zrr-chat-message zrr-chat-${t.role}`});r.createEl("div",{cls:"zrr-chat-meta"}).setText(t.role==="user"?"You":"Assistant");let n=r.createEl("div",{cls:"zrr-chat-content"}),i=r.createEl("div",{cls:"zrr-chat-citations"});this.messageEls.set(t.id,{wrapper:r,content:n,citations:i}),await this.renderMessageContent(t)}scheduleRender(t){if(this.pendingRender.has(t.id))return;let r=window.setTimeout(async()=>{this.pendingRender.delete(t.id),await this.renderMessageContent(t),this.scrollToBottom()},80);this.pendingRender.set(t.id,r)}async renderMessageContent(t){let r=this.messageEls.get(t.id);if(r&&(r.content.empty(),r.citations.empty(),await k.MarkdownRenderer.renderMarkdown(t.content||"",r.content,"",this.plugin),t.citations&&t.citations.length>0)){let s=this.plugin.formatCitationsMarkdown(t.citations);s&&(r.citations.createEl("div",{cls:"zrr-chat-citations-label",text:"Citations"}).addClass("zrr-chat-citations-label"),await k.MarkdownRenderer.renderMarkdown(s,r.citations,"",this.plugin))}}scrollToBottom(){this.messagesEl.scrollTop=this.messagesEl.scrollHeight}async handleSend(){if(this.busy)return;let t=this.inputEl.value.trim();if(!t){new k.Notice("Query cannot be empty.");return}if(!this.plugin.settings.chatBaseUrl){new k.Notice("Chat base URL must be set in settings.");return}this.inputEl.value="",this.busy=!0,this.sendButton.disabled=!0;let r={id:this.generateId(),role:"user",content:t,createdAt:new Date().toISOString()};this.messages.push(r),await this.renderMessage(r),this.scrollToBottom(),await this.saveHistory();let s={id:this.generateId(),role:"assistant",content:"",citations:[],createdAt:new Date().toISOString()};this.messages.push(s),await this.renderMessage(s),this.scrollToBottom();let n=!1;try{await this.plugin.runRagQueryStreaming(t,i=>{n=!0,s.content+=i,this.scheduleRender(s)},i=>{(!n&&(i!=null&&i.answer)||i!=null&&i.answer)&&(s.content=i.answer),Array.isArray(i==null?void 0:i.citations)&&(s.citations=i.citations),this.scheduleRender(s)})}catch(i){console.error(i),s.content="Failed to fetch answer. See console for details.",this.scheduleRender(s)}finally{this.busy=!1,this.sendButton.disabled=!1,await this.saveHistory()}}async clearChat(){this.messages=[],await this.saveHistory(),await this.renderAll()}generateId(){return typeof crypto!="undefined"&&"randomUUID"in crypto?crypto.randomUUID():`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}};var $=class extends o.Modal{constructor(e,t,r,s,n="Value cannot be empty."){super(e),this.titleText=t,this.placeholder=r,this.onSubmit=s,this.emptyMessage=n}onOpen(){let{contentEl:e}=this;e.empty(),e.createEl("h3",{text:this.titleText});let t=e.createEl("input",{type:"text",placeholder:this.placeholder});t.style.width="100%",t.focus();let r=e.createEl("button",{text:"Submit"});r.style.marginTop="0.75rem";let s=()=>{let n=t.value.trim();if(!n){new o.Notice(this.emptyMessage);return}this.close(),this.onSubmit(n)};r.addEventListener("click",s),t.addEventListener("keydown",n=>{n.key==="Enter"&&s()})}};var M=class extends o.Plugin{async onload(){await this.loadSettings(),await this.migrateCachePaths(),this.addSettingTab(new R(this.app,this)),this.registerView(N,e=>new D(e,this));try{await this.ensureBundledTools()}catch(e){console.error("Failed to sync bundled tools",e)}this.addCommand({id:"import-zotero-item-index",name:"Import Zotero item and index (Docling -> RedisSearch)",callback:()=>this.importZoteroItem()}),this.addCommand({id:"ask-zotero-library",name:"Ask my Zotero library (RAG via RedisSearch)",callback:()=>this.askZoteroLibrary()}),this.addCommand({id:"open-zotero-chat",name:"Open Zotero RAG chat panel",callback:()=>this.openChatView(!0)}),this.addCommand({id:"rebuild-zotero-note-cache",name:"Rebuild Zotero note from cache (Docling + RedisSearch)",callback:()=>this.rebuildNoteFromCache()})}async loadSettings(){this.settings=Object.assign({},j,await this.loadData())}async saveSettings(){await this.saveData(this.settings)}async importZoteroItem(){var E,w;try{await this.ensureBundledTools()}catch(c){new o.Notice("Failed to sync bundled tools. See console for details."),console.error(c);return}let e;try{e=await this.promptZoteroItem()}catch(c){new o.Notice("Zotero search failed. See console for details."),console.error(c);return}if(!e){new o.Notice("No Zotero item selected.");return}let t=(E=e.data)!=null?E:e;!t.key&&e.key&&(t.key=e.key);let r=this.getDocId(t);if(!r){new o.Notice("Could not resolve a stable doc_id from Zotero item.");return}let s=await this.resolvePdfAttachment(t,r);if(!s){new o.Notice("No PDF attachment found for item.");return}let n=typeof t.title=="string"?t.title:"",i=this.sanitizeFileName(n)||r,a=await this.resolveUniqueBaseName(i,r),d=(0,o.normalizePath)(`${this.settings.outputPdfDir}/${a}.pdf`),p=(0,o.normalizePath)(`${C}/${r}.json`),l=(0,o.normalizePath)(`${A}/${r}.json`),y=(0,o.normalizePath)(`${this.settings.outputNoteDir}/${a}.md`);try{await this.ensureFolder(C),await this.ensureFolder(A),await this.ensureFolder(this.settings.outputNoteDir),this.settings.copyPdfToVault&&await this.ensureFolder(this.settings.outputPdfDir)}catch(c){new o.Notice("Failed to create output folders."),console.error(c);return}let x="",f="";try{if(this.settings.copyPdfToVault){let c=s.filePath?await P.promises.readFile(s.filePath):await this.downloadZoteroPdf(s.key);await this.app.vault.adapter.writeBinary(d,this.bufferToArrayBuffer(c)),x=this.getAbsoluteVaultPath(d),f=`[[${d}]]`}else{if(!s.filePath){new o.Notice("PDF file path missing. Enable PDF copying or check Zotero storage.");return}x=s.filePath,f=`[PDF](${(0,S.pathToFileURL)(s.filePath).toString()})`}}catch(c){new o.Notice("Failed to download PDF attachment."),console.error(c);return}try{await this.app.vault.adapter.write(p,JSON.stringify(e,null,2))}catch(c){new o.Notice("Failed to write Zotero item JSON."),console.error(c);return}let h=this.getPluginDir(),b=m.default.join(h,"tools","docling_extract.py"),v=m.default.join(h,"tools","index_redisearch.py");try{await this.runPython(b,["--pdf",x,"--doc-id",r,"--out-json",this.getAbsoluteVaultPath(l),"--out-md",this.getAbsoluteVaultPath(y),"--chunking",this.settings.chunkingMode,"--ocr",this.settings.ocrMode])}catch(c){new o.Notice("Docling extraction failed. See console for details."),console.error(c);return}try{await this.runPython(v,["--chunks-json",this.getAbsoluteVaultPath(l),"--redis-url",this.settings.redisUrl,"--index",this.settings.redisIndex,"--prefix",this.settings.redisPrefix,"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel])}catch(c){new o.Notice("RedisSearch indexing failed. See console for details."),console.error(c);return}try{let c=await this.app.vault.adapter.read(y),u=this.buildNoteMarkdown(t,(w=e.meta)!=null?w:{},r,f,p,c);await this.app.vault.adapter.write(y,u)}catch(c){new o.Notice("Failed to finalize note markdown."),console.error(c);return}new o.Notice(`Indexed Zotero item ${r}.`)}async askZoteroLibrary(){await this.openChatView(!0)}getChatLeaf(){var e;return this.settings.chatPaneLocation==="right"?(e=this.app.workspace.getRightLeaf(!1))!=null?e:this.app.workspace.getLeaf("split"):this.app.workspace.getLeaf("tab")}async openChatView(e=!1){let t=this.getChatLeaf();await t.setViewState({type:N,active:!0}),this.app.workspace.revealLeaf(t);let r=t.view;return r instanceof D&&e&&r.focusInput(),r}async loadChatHistory(){let e=this.app.vault.adapter,t=(0,o.normalizePath)(`${T}/chat.json`);if(!await e.exists(t))return[];let r=await e.read(t),s;try{s=JSON.parse(r)}catch(i){return[]}let n=Array.isArray(s)?s:s==null?void 0:s.messages;return Array.isArray(n)?n.filter(i=>i&&typeof i.content=="string").map(i=>({id:i.id||this.generateChatId(),role:i.role==="assistant"?"assistant":"user",content:i.content,citations:Array.isArray(i.citations)?i.citations:[],createdAt:i.createdAt||new Date().toISOString()})):[]}async saveChatHistory(e){await this.ensureFolder(T);let t=this.app.vault.adapter,r=(0,o.normalizePath)(`${T}/chat.json`),s={version:1,messages:e};await t.write(r,JSON.stringify(s,null,2))}async runRagQueryStreaming(e,t,r){await this.ensureBundledTools();let s=this.getPluginDir(),n=m.default.join(s,"tools","rag_query_redisearch.py"),i=["--query",e,"--k","5","--redis-url",this.settings.redisUrl,"--index",this.settings.redisIndex,"--prefix",this.settings.redisPrefix,"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--chat-base-url",this.settings.chatBaseUrl,"--chat-api-key",this.settings.chatApiKey,"--chat-model",this.settings.chatModel,"--temperature",String(this.settings.chatTemperature),"--stream"];return this.runPythonStreaming(n,i,a=>{if((a==null?void 0:a.type)==="delta"&&typeof a.content=="string"){t(a.content);return}if((a==null?void 0:a.type)==="final"){r(a);return}a!=null&&a.answer&&r(a)},r)}async rebuildNoteFromCache(){var w,c;let e=await this.promptDocId();if(!e){new o.Notice("No doc_id provided.");return}try{await this.ensureBundledTools()}catch(u){new o.Notice("Failed to sync bundled tools. See console for details."),console.error(u);return}let t=this.app.vault.adapter,r=(0,o.normalizePath)(`${C}/${e}.json`),s=(0,o.normalizePath)(`${A}/${e}.json`);if(!await t.exists(r)){new o.Notice("Cached item JSON not found.");return}if(!await t.exists(s)){new o.Notice("Cached chunks JSON not found.");return}let n;try{let u=await t.read(r);n=JSON.parse(u)}catch(u){new o.Notice("Failed to read cached item JSON."),console.error(u);return}let i;try{let u=await t.read(s);i=JSON.parse(u)}catch(u){new o.Notice("Failed to read cached chunks JSON."),console.error(u);return}let a=typeof i.source_pdf=="string"?i.source_pdf:"";if(!a){new o.Notice("Cached chunk JSON is missing source_pdf.");return}try{await P.promises.access(a)}catch(u){new o.Notice("Cached source PDF path is not accessible."),console.error(u);return}let d=(w=n.data)!=null?w:n,p=typeof d.title=="string"?d.title:"",l=this.sanitizeFileName(p)||e,y=(0,o.normalizePath)(`${this.settings.outputNoteDir}/${l}.md`),x=await t.exists(y)?l:await this.resolveUniqueBaseName(l,e),f=(0,o.normalizePath)(`${this.settings.outputNoteDir}/${x}.md`);try{await this.ensureFolder(this.settings.outputNoteDir)}catch(u){new o.Notice("Failed to create notes folder."),console.error(u);return}let h=this.getPluginDir(),b=m.default.join(h,"tools","docling_extract.py"),v=m.default.join(h,"tools","index_redisearch.py");try{await this.runPython(b,["--pdf",a,"--doc-id",e,"--out-json",this.getAbsoluteVaultPath(s),"--out-md",this.getAbsoluteVaultPath(f),"--chunking",this.settings.chunkingMode,"--ocr",this.settings.ocrMode])}catch(u){new o.Notice("Docling extraction failed. See console for details."),console.error(u);return}try{await this.runPython(v,["--chunks-json",this.getAbsoluteVaultPath(s),"--redis-url",this.settings.redisUrl,"--index",this.settings.redisIndex,"--prefix",this.settings.redisPrefix,"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--upsert"])}catch(u){new o.Notice("RedisSearch indexing failed. See console for details."),console.error(u);return}let E=this.buildPdfLinkFromSourcePath(a);try{let u=await this.app.vault.adapter.read(f),U=this.buildNoteMarkdown(d,(c=n.meta)!=null?c:{},e,E,r,u);await this.app.vault.adapter.write(f,U)}catch(u){new o.Notice("Failed to finalize note markdown."),console.error(u);return}new o.Notice(`Rebuilt Zotero note for ${e}.`)}async promptZoteroItem(){return new Promise(e=>{new z(this.app,this,e).open()})}async promptDocId(){return new Promise(e=>{new $(this.app,"Rebuild Zotero note from cache","Enter Zotero doc_id (e.g., ABC123)",t=>e(t),"Doc ID cannot be empty.").open()})}getDocId(e){let t=[e.key,e.itemKey,e.id,e.citationKey];for(let r of t)if(typeof r=="string"&&r.trim())return r.trim();return null}sanitizeFileName(e){let t=e.replace(/[\\/:*?"<>|]/g,"").replace(/\s+/g," ").trim();return t?t.replace(/[.]+$/g,"").trim().replace(/ /g,"-").slice(0,120):""}async resolveUniqueBaseName(e,t){let r=this.app.vault.adapter,s=(0,o.normalizePath)(`${this.settings.outputNoteDir}/${e}.md`),n=(0,o.normalizePath)(`${this.settings.outputPdfDir}/${e}.pdf`),i=await r.exists(s),a=this.settings.copyPdfToVault?await r.exists(n):!1;return i||a?`${e}-${t}`:e}async searchZoteroItems(e){let t=new URLSearchParams;t.set("itemType","-attachment"),t.set("limit","25"),t.set("include","data,meta"),e.trim()&&t.set("q",e.trim());let r=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items?${t.toString()}`),s=await this.requestLocalApi(r,`Zotero search failed for ${r}`),n=JSON.parse(s.toString("utf8"));return Array.isArray(n)?n.map(i=>{var a,d,p,l;return{key:(d=i.key)!=null?d:(a=i.data)==null?void 0:a.key,data:(p=i.data)!=null?p:{},meta:(l=i.meta)!=null?l:{}}}).filter(i=>typeof i.key=="string"&&i.key.trim().length>0):[]}async resolvePdfAttachment(e,t){let r=this.pickPdfAttachment(e);if(r)return r;try{let s=await this.fetchZoteroChildren(t);for(let n of s){let i=this.toPdfAttachment(n);if(i)return i}}catch(s){console.error("Failed to fetch Zotero children",s)}return null}pickPdfAttachment(e){var r,s,n;let t=(n=(s=(r=e.attachments)!=null?r:e.children)!=null?s:e.items)!=null?n:[];if(!Array.isArray(t))return null;for(let i of t){let a=this.toPdfAttachment(i);if(a)return a}return null}toPdfAttachment(e){var n,i,a,d,p,l;if(((a=(n=e==null?void 0:e.contentType)!=null?n:e==null?void 0:e.mimeType)!=null?a:(i=e==null?void 0:e.data)==null?void 0:i.contentType)!=="application/pdf")return null;let r=(l=(d=e==null?void 0:e.key)!=null?d:e==null?void 0:e.attachmentKey)!=null?l:(p=e==null?void 0:e.data)==null?void 0:p.key;if(!r)return null;let s=this.extractAttachmentPath(e);return s?{key:r,filePath:s}:{key:r}}extractAttachmentPath(e){var r,s,n,i,a,d,p,l;let t=(l=(i=(s=(r=e==null?void 0:e.links)==null?void 0:r.enclosure)==null?void 0:s.href)!=null?i:(n=e==null?void 0:e.enclosure)==null?void 0:n.href)!=null?l:(p=(d=(a=e==null?void 0:e.data)==null?void 0:a.links)==null?void 0:d.enclosure)==null?void 0:p.href;if(typeof t=="string"&&t.startsWith("file://"))try{return(0,S.fileURLToPath)(t)}catch(y){return null}return null}async fetchZoteroChildren(e){let t=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}/children`),r=await this.requestLocalApi(t,`Zotero children request failed for ${t}`);return JSON.parse(r.toString("utf8"))}async downloadZoteroPdf(e){let t=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}/file`),r=await this.requestLocalApiRaw(t),s=await this.followFileRedirect(r);if(s)return s;if(r.statusCode>=300)throw new Error(`Request failed, status ${r.statusCode}`);return r.body}buildZoteroUrl(e){return`${this.settings.zoteroBaseUrl.replace(/\/$/,"")}${e}`}requestLocalApiRaw(e){return new Promise((t,r)=>{let s=new URL(e),i=(s.protocol==="https:"?O.default:B.default).request({method:"GET",hostname:s.hostname,port:s.port||void 0,path:`${s.pathname}${s.search}`,headers:{Accept:"*/*"}},a=>{let d=[];a.on("data",p=>d.push(Buffer.from(p))),a.on("end",()=>{var l;let p=Buffer.concat(d);t({statusCode:(l=a.statusCode)!=null?l:0,headers:a.headers,body:p})})});i.on("error",r),i.end()})}async requestLocalApi(e,t){let r=await this.requestLocalApiRaw(e);if(r.statusCode>=400){let s=r.body.toString("utf8");throw new Error(`${t!=null?t:"Request failed"}, status ${r.statusCode}: ${s||"no response body"}`)}if(r.statusCode>=300)throw new Error(`${t!=null?t:"Request failed"}, status ${r.statusCode}`);return r.body}async followFileRedirect(e){if(e.statusCode<300||e.statusCode>=400)return null;let t=e.headers.location,r=Array.isArray(t)?t[0]:t;if(!r||typeof r!="string")return null;if(r.startsWith("file://")){let s=(0,S.fileURLToPath)(r);return P.promises.readFile(s)}return r.startsWith("http://")||r.startsWith("https://")?this.requestLocalApi(r):null}bufferToArrayBuffer(e){return e.buffer.slice(e.byteOffset,e.byteOffset+e.byteLength)}buildPdfLinkFromSourcePath(e){if(!e)return"";let t=m.default.normalize(this.getVaultBasePath()),r=m.default.normalize(e),s=t.endsWith(m.default.sep)?t:`${t}${m.default.sep}`;return r.startsWith(s)?`[[${(0,o.normalizePath)(m.default.relative(t,r))}]]`:`[PDF](${(0,S.pathToFileURL)(e).toString()})`}formatCitationsMarkdown(e){return e.length?e.map(r=>this.formatCitationMarkdown(r)).filter(Boolean).join(`
`):""}formatCitationMarkdown(e){var i,a;let t=e.doc_id||"?",r=e.pages||`${(i=e.page_start)!=null?i:"?"}-${(a=e.page_end)!=null?a:"?"}`,s=`${t} pages ${r}`,n=e.source_pdf||"";if(n){let d=this.buildPdfLinkFromSourcePath(n);if(d.startsWith("[["))return`- [[${d.slice(2,-2)}|${s}]]`;let p=d.match(/^\[PDF\]\((.+)\)$/);if(p)return`- [${s}](${p[1]})`}return`- ${s}`}generateChatId(){return typeof crypto!="undefined"&&"randomUUID"in crypto?crypto.randomUUID():`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}getZoteroLibraryPath(){let e=(this.settings.zoteroUserId||"0").trim();return!e||e==="0"?"users/0":e.startsWith("users/")||e.startsWith("groups/")?e:`users/${e}`}async ensureFolder(e){let t=this.app.vault.adapter,r=(0,o.normalizePath)(e).split("/").filter(Boolean),s="";for(let n of r)s=s?`${s}/${n}`:n,await t.exists(s)||await t.mkdir(s)}buildNoteMarkdown(e,t,r,s,n,i){let a=`[[${n}]]`,d=this.renderFrontmatter(e,t,r,s,a);return`${d?`---
${d}
---

`:""}PDF: ${s}

Item JSON: ${a}

${i}`}renderFrontmatter(e,t,r,s,n){var d;let i=(d=this.settings.frontmatterTemplate)!=null?d:"";if(!i.trim())return"";let a=this.buildTemplateVars(e,t,r,s,n);return i.replace(/{{\s*([a-z0-9_]+)\s*}}/gi,(p,l)=>{var y;return(y=a[l])!=null?y:""}).trim()}buildTemplateVars(e,t,r,s,n){let i=typeof e.title=="string"?e.title:"",a=typeof e.shortTitle=="string"?e.shortTitle:"",d=typeof e.date=="string"?e.date:"",p=typeof(t==null?void 0:t.parsedDate)=="string"?t.parsedDate:"",l=this.extractYear(p||d),x=(Array.isArray(e.creators)?e.creators:[]).filter(c=>c.creatorType==="author").map(c=>this.formatCreatorName(c)),f=x.join("; "),h=Array.isArray(e.tags)?e.tags.map(c=>typeof c=="string"?c:c==null?void 0:c.tag).filter(Boolean):[],b=h.join("; "),v=typeof e.itemType=="string"?e.itemType:"",E=typeof(t==null?void 0:t.creatorSummary)=="string"?t.creatorSummary:"",w={doc_id:r,zotero_key:typeof e.key=="string"?e.key:r,title:i,short_title:a,date:d,year:l,authors:f,tags:b,item_type:v,creator_summary:E,pdf_link:this.escapeYamlString(s),item_json:this.escapeYamlString(n)};for(let[c,u]of Object.entries(w))w[`${c}_yaml`]=this.escapeYamlString(u);return w.authors_yaml=this.toYamlList(x),w.tags_yaml=this.toYamlList(h),w}extractYear(e){if(!e)return"";let t=e.match(/\b(\d{4})\b/);return t?t[1]:""}formatCreatorName(e){if(!e||typeof e!="object")return"";if(e.name)return String(e.name);let t=e.firstName?String(e.firstName):"",r=e.lastName?String(e.lastName):"";return[r,t].filter(Boolean).join(", ")||`${t} ${r}`.trim()}escapeYamlString(e){return`"${String(e).replace(/\\/g,"\\\\").replace(/"/g,'\\"')}"`}toYamlList(e){return e.length?e.map(t=>`  - ${this.escapeYamlString(t)}`).join(`
`):'  - ""'}getVaultBasePath(){var r;let e=this.app.vault.adapter;if(e instanceof o.FileSystemAdapter)return e.getBasePath();let t=(r=e.getBasePath)==null?void 0:r.call(e);if(t)return t;throw new Error("Vault base path is unavailable.")}getPluginDir(){var s;let e=this.getVaultBasePath(),t=(s=this.manifest.dir)!=null?s:this.manifest.id;if(!t)throw new Error("Plugin directory is unavailable.");let r=m.default.isAbsolute(t)?t:m.default.join(e,t);return m.default.normalize(r)}async ensureBundledTools(){let e=this.getPluginDir(),t=m.default.join(e,"tools");await P.promises.mkdir(t,{recursive:!0});for(let[r,s]of Object.entries(q)){let n=m.default.join(t,r),i=!0;try{await P.promises.readFile(n,"utf8")===s&&(i=!1)}catch(a){}i&&await P.promises.writeFile(n,s,"utf8")}}async migrateCachePaths(){let e="zotero/items",t="zotero/chunks",r=C,s=A,n=this.app.vault.adapter,i=(0,o.normalizePath)(e),a=(0,o.normalizePath)(t),d=(0,o.normalizePath)(r),p=(0,o.normalizePath)(s),l=d.split("/").slice(0,-1).join("/"),y=p.split("/").slice(0,-1).join("/");l&&await this.ensureFolder(l),y&&await this.ensureFolder(y);let x=await n.exists(i),f=await n.exists(a),h=await n.exists(d),b=await n.exists(p);x&&!h&&await n.rename(i,d),f&&!b&&await n.rename(a,p)}getAbsoluteVaultPath(e){let t=this.getVaultBasePath(),r=m.default.isAbsolute(e)?e:m.default.join(t,e);return m.default.normalize(r)}runPython(e,t){return new Promise((r,s)=>{let n=(0,I.spawn)(this.settings.pythonPath,[e,...t],{cwd:m.default.dirname(e)}),i="";n.stderr.on("data",a=>{i+=a.toString()}),n.on("close",a=>{a===0?r():s(new Error(i||`Process exited with code ${a}`))})})}runPythonStreaming(e,t,r,s){return new Promise((n,i)=>{let a=(0,I.spawn)(this.settings.pythonPath,[e,...t],{cwd:m.default.dirname(e)}),d="",p="",l=null,y=!1,x=f=>{if(f.trim())try{let h=JSON.parse(f);l=h,((h==null?void 0:h.type)==="final"||h!=null&&h.answer)&&(y=!0),r(h)}catch(h){}};a.stdout.on("data",f=>{var b;d+=f.toString();let h=d.split(/\r?\n/);d=(b=h.pop())!=null?b:"";for(let v of h)x(v)}),a.stderr.on("data",f=>{p+=f.toString()}),a.on("close",f=>{d.trim()&&x(d),!y&&l&&s(l),f===0?n():i(new Error(p||`Process exited with code ${f}`))})})}runPythonWithOutput(e,t){return new Promise((r,s)=>{let n=(0,I.spawn)(this.settings.pythonPath,[e,...t],{cwd:m.default.dirname(e)}),i="",a="";n.stdout.on("data",d=>{i+=d.toString()}),n.stderr.on("data",d=>{a+=d.toString()}),n.on("close",d=>{d===0?r(i.trim()):s(new Error(a||`Process exited with code ${d}`))})})}},z=class extends o.SuggestModal{constructor(t,r,s){super(t);this.lastError=null;this.plugin=r,this.resolveSelection=s,this.setPlaceholder("Search Zotero items...")}async getSuggestions(t){try{return await this.plugin.searchZoteroItems(t)}catch(r){let s=r instanceof Error?r.message:String(r);return this.lastError!==s&&(this.lastError=s,new o.Notice(s)),console.error("Zotero search failed",r),[]}}renderSuggestion(t,r){var i,a;let s=(a=(i=t.data)==null?void 0:i.title)!=null?a:"[No title]",n=this.extractYear(t);r.createEl("div",{text:s}),r.createEl("small",{text:n?`${n}`:""}),r.addEventListener("click",()=>{this.resolveSelection&&(this.resolveSelection(t),this.resolveSelection=null),this.close()})}onChooseSuggestion(t,r){this.resolveSelection&&(this.resolveSelection(t),this.resolveSelection=null),this.close()}onClose(){this.resolveSelection&&(this.resolveSelection(null),this.resolveSelection=null)}extractYear(t){var n,i,a,d;let r=(d=(a=(n=t.meta)==null?void 0:n.parsedDate)!=null?a:(i=t.data)==null?void 0:i.date)!=null?d:"";if(typeof r!="string")return"";let s=r.match(/\b(\d{4})\b/);return s?s[1]:""}};
