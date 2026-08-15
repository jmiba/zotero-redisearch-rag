# RAG Pipeline

The RAG pipeline turns Zotero PDFs into editable Obsidian notes, RedisSearch vectors, and cited chat answers.

It spans import, Docling/OCR, chunk construction, indexing, chat retrieval, reranking, answer generation, and cache-based rebuilds. Its note-edit contract is documented in [[chunk-sync#Chunk Sync]].

## Import Pipeline

Import is a staged transaction that avoids leaving partial final files when extraction or indexing fails.

The plugin resolves the selected Zotero item and PDF, writes staged item JSON, computes a page-aware worker timeout budget with `tools/pdf_page_count.py`, runs `tools/docling_extract.py`, indexes staged chunk JSON with `tools/index_redisearch.py`, builds the final note, then atomically replaces final cache and note files. Failed runs clean up staged files, partial outputs, and any Redis chunks already written for the doc.

Before indexing, staged chunk metadata is rewritten from temporary vault PDF paths to the final PDF path so Redis, chunk cache, and `doc_index` do not retain `.zrr-pdf-*` paths after the transaction commits.

Import failures are always surfaced through an Obsidian notice and a console error. Diagnostics prioritize explicit worker timeout/cancel/error records and stdout errors over ordinary INFO/DEBUG stderr, including ANSI-colored OCR and Paddle connectivity logs.

When file logging is enabled, failures are also appended to the configured import log as `ERROR pdf_import` entries, including unexpected top-level command failures that escape a specific import stage.

## Docling And OCR

Docling extraction decides whether to trust a text layer, OCR, or postprocess text based on document quality.

`tools/docling_extract.py` detects text layers, selects language hints, chooses OCR engines, detects low-quality OCR, handles per-page OCR, applies dictionary and cleanup corrections, extracts page ranges, and emits both Markdown and chunk JSON.

The plugin can run this tool through the Python worker API or legacy local Python. In worker mode, child tools inherit the worker cache environment, so Docling, Hugging Face, and Hunspell artifacts resolve under the mounted worker cache where possible.

The worker dependency baseline pins Docling `2.89.0` while keeping `onnxruntime` explicit, so RapidOCR ONNX routing remains available without relying on optional extras resolution. The worker stays on a Docling release that still provides the `docling.document_converter` API used by `tools/docling_extract.py` on Linux Python 3.12.

The default Auto OCR engine follows the stable release behavior: basic local Paddle is preferred when available, with Tesseract as fallback. Paddle VL and structure APIs remain opt-in.

When an external OCR route is selected, Docling conversion is configured with explicit OCR options so layout conversion does not fall back to an unintended RapidOCR backend. Paddle routes use RapidOCR's packaged ONNX models through `onnxruntime` during Docling conversion, and the external OCR pass can still replace page text after conversion.

Text-layer PDFs are not forced through external Paddle layout OCR unless OCR is forced or low-quality text re-OCR is explicitly enabled. This keeps usable embedded text from hitting native Paddle paths unnecessarily.

Local Paddle OCR keeps document-orientation and text-line orientation classification disabled by default because the native Paddle classifiers can crash the worker on some PDFs and platforms.

If a configured external OCR engine is unavailable, extraction fails with an explicit worker/OCR diagnostic instead of falling back to Docling RapidOCR. This keeps missing Tesseract or Paddle installs from surfacing as obscure RapidOCR model path errors.

The worker API serializes Docling, indexing, and RAG executions through one resource slot. This avoids stacking memory-heavy imports, reranking, and indexing in the same worker container. Docling layout/OCR/table stages run with small batches to reduce worker memory spikes on large OCR-heavy PDFs. Worker startup refreshes Docling model prefetch when the persistent model cache is missing known RapidOCR artifacts, writes downloads to the mounted `DOCLING_ARTIFACTS_PATH`, and only stamps the cache after required artifacts exist.

Hunspell dictionary downloads are logged instead of written to stdout, because stdout is reserved for worker JSON/progress records during streaming imports.

## Chunk Construction

Chunks are the shared unit for notes, Redis records, citations, and incremental reindexing.

Page chunking creates page-based chunk IDs such as `p1`. Section chunking groups Markdown sections and can split long sections with overlap. Annotation sync can add annotation chunks marked as annotations so highlight text and comments are searchable alongside extracted PDF text.

Chunk marker rendering is documented in [[chunk-sync#Synchronized Markers]].

## Indexing And Retrieval

RedisSearch stores vectorized chunks with document metadata, page fields, tags, section names, and annotation flags.

`tools/index_redisearch.py` normalizes Markdown to index text, optionally prepends metadata, optionally splits chunks into embedding subchunks, builds embedding context from neighbors, generates chunk tags when configured, and upserts or deletes specific chunk IDs for incremental updates.

Bundled Python tools use RESP3 and normalize Redis Search map replies at a shared parser boundary. The normalizer also accepts legacy RESP2 positional arrays, so the wire format never changes stored hashes or retrieval records.

Embedding dimension mismatches trigger a drop/rebuild prompt because Redis vector schema dimensions must match the active embedding model.

## Chat Query Flow

Chat queries stream answers from the worker while keeping citations tied to retrieved chunks.

`src/chatView.ts` owns the chat UI and session state. `src/main.ts` invokes `tools/rag_query_redisearch.py` with embedding and chat provider settings, recent history, optional follow-up rewriting, optional query expansion, optional cross-encoder reranking, and optional agentic retrieval.

The final chat context chunk count is configurable in settings. Query expansion and reranking can retrieve larger candidate pools before trimming back to that final chunk count.

Chat session listing uses an Obsidian-style sort menu beside the session selector. The persisted sort order defaults to newest updated sessions first, and no-op saves do not refresh `updatedAt`, so switching chats alone does not reorder the selector.

The sort menu button uses Obsidian's `clickable-icon nav-action-button` structure, resolves the built-in sort icon through the runtime icon registry, then falls back to rendering the same `svg-icon lucide-sort-asc` SVG shape when the registry does not expose that icon to plugins.

Returned citations are resolved through the doc index and can link to the Obsidian note chunk, source PDF, or Zotero deep link.

## Cache Rebuilds

Cache files are the recovery source when Redis or generated notes drift.

The plugin can reindex all cached chunks, reindex the current note, rebuild the doc index, recreate missing notes from cache, drop and rebuild RedisSearch, and restore missing chunk JSON from note markers when a note still has a valid sync section.

These rebuild paths depend on the marker grammar in [[chunk-sync#Recovery From Markers]].
