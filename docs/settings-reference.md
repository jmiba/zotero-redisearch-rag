# Settings Reference

This page summarizes the main settings tabs and what they control.

## Prerequisites
- **Advanced Python runtime options**: OFF by default. Enables legacy local runtime controls.
- **Python runtime**: Defaults to `Python worker container` (recommended). Editable when advanced options are enabled.
- **Python path**: Local mode only (shown in advanced mode). Interpreter used for Docling tools.
- **Python env location**: Local mode only (shown in advanced mode). Store the venv in a shared cache or inside the plugin folder.
- **Docker/Podman path**: CLI path used to start Redis, Redis Insight, and the Python worker.
- **Redis URL**: Connection string for Redis.
- **Auto‑assign Redis port**: Pick a free local port when starting Redis.
- **Auto‑start Redis stack**: Start Redis automatically when needed.
- **Start Redis stack now**: Manual start/restart button (starts only services required by the selected runtime).

Step-by-step setup guides:
- [Python Setup](python-setup.md)
- [Docker Setup](docker-setup.md)

## Zotero local API / web API
- **Local API base URL**: Usually `http://127.0.0.1:23119/api`.
- **Web API settings**: Optional fallback or write‑back. Set library type, library ID, and API key.

## Output
- **PDF and notes folders**: Where PDFs and Zotero notes are stored in your vault.
- **Frontmatter template**: Editable template with `{{placeholders}}`.
- **Note body template**: Controls where annotations and Docling text appear.
- **Tag sanitization**: Normalize Zotero tags for Obsidian.
- **Templating details**: See [Templating reference](templating-reference.md) for the full placeholder catalog and template behavior.

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

### Paddle OCR (API)
If you select a Paddle OCR API engine, you’ll need an API key. See [PaddleOCR-VL 1.6 guide](paddleocr-vl-1.6-setup.md).

## LLMs
- **Provider profiles**: Store base URL + API key once.
- **Embeddings**: Model selection, subchunking, context window, metadata inclusion.
- **Chat**: Model selection, temperature, history size, panel location.
- **Cleanup**: Model and thresholds for OCR cleanup.
- **Tagging**: Optional LLM‑generated chunk tags.
- **Retrieval tuning**: Chat-history query rewriting, agentic planner mode, query expansion, reranking, RRF, max‑per‑doc caps.

### Retrieval tuning details
- **Rewrite follow-up queries**: Rewrites the current chat message into a standalone retrieval query using recent chat history before search. This is useful for follow-up questions and multilingual chat threads.
- **Enable agentic retrieval**: Lets a lightweight planner decide whether to keep current context, retry with broader retrieval, or pull more chunks from one document.
- **Enable query expansion**: Generates additional retrieval variants from the current retrieval query.
- **Enable cross-encoder reranking**: Re-scores retrieved candidates with a more precise reranker model.
- **RRF / max-per-doc**: Controls rank fusion and how strongly one document can dominate the final context set.

## Maintenance
- **Use local runtime (legacy)**: One-click switch to local interpreter/venv mode and enables advanced runtime settings.
- **Reindex Redis from cache**: Rebuild index without re‑OCR.
- **Recreate missing notes**: Restore notes from cached data.
- **Rebuild doc index**: Refresh the index metadata cache.
- **Logs**: Enable file logging, open or clear the log file.
- **Zotero companion tools**: Install/health check shortcuts.
