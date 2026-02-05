# Settings Reference

This page summarizes the main settings tabs and what they control.

## Prerequisites
- **Python path**: Interpreter used for Docling tools. Leave blank to auto‑detect.
- **Python env location**: Store the venv in a shared cache or inside the plugin folder.
- **Docker/Podman path**: CLI path used to start Redis Stack.
- **Redis URL**: Connection string for Redis Stack.
- **Auto‑assign Redis port**: Pick a free local port when starting Redis.
- **Auto‑start Redis stack**: Start Redis automatically when needed.
- **Start Redis stack now**: Manual start/restart button.

## Zotero Local API / Web API
- **Local API base URL**: Usually `http://127.0.0.1:23119/api`.
- **Web API settings**: Optional fallback or write‑back. Set library type, library ID, and API key.

## Output
- **PDF and notes folders**: Where PDFs and Zotero notes are stored in your vault.
- **Frontmatter template**: Editable template with `{{placeholders}}`.
- **Note body template**: Controls where annotations and Docling text appear.
- **Tag sanitization**: Normalize Zotero tags for Obsidian.

## Annotations
- **Color map**: Map Zotero highlight colors to callout types and headings.
- **Include annotation images**: Pull image‑based annotations when available.
- **Zotero companion**: Enable and configure the companion service.

## OCR
- **OCR engine**: Auto, Tesseract, or Paddle options.
- **OCR decision**: When to OCR (auto, only if bad, always).
- **Per‑page override**: Force per‑page OCR for complex layouts.
- **OCR quality threshold**: Minimum text quality before OCR runs.
- **OCR cleanup**: Optional LLM cleanup for low‑quality OCR.

## LLMs
- **Provider profiles**: Store base URL + API key once.
- **Embeddings**: Model selection, subchunking, context window, metadata inclusion.
- **Chat**: Model selection, temperature, history size, panel location.
- **Cleanup**: Model and thresholds for OCR cleanup.
- **Tagging**: Optional LLM‑generated chunk tags.
- **Retrieval tuning**: Query expansion, reranking, RRF, max‑per‑doc caps.

## Maintenance
- **Reindex Redis from cache**: Rebuild index without re‑OCR.
- **Recreate missing notes**: Restore notes from cached data.
- **Rebuild doc index**: Refresh the index metadata cache.
- **Logs**: Enable file logging, open or clear the log file.
- **Zotero companion tools**: Install/health check shortcuts.
