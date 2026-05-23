# RAG Pipeline

The RAG pipeline turns Zotero PDFs into editable Obsidian notes, RedisSearch vectors, and cited chat answers.

It spans import, Docling/OCR, chunk construction, indexing, chat retrieval, reranking, answer generation, and cache-based rebuilds. Its note-edit contract is documented in [[chunk-sync#Chunk Sync]].

## Import Pipeline

Import is a staged transaction that avoids leaving partial final files when extraction or indexing fails.

The plugin resolves the selected Zotero item and PDF, writes staged item JSON, computes a page-aware worker timeout budget with `tools/pdf_page_count.py`, runs `tools/docling_extract.py`, indexes staged chunk JSON with `tools/index_redisearch.py`, builds the final note, then atomically replaces final cache and note files. Failed runs clean up staged files, partial outputs, and any Redis chunks already written for the doc.

Import failures are always surfaced through an Obsidian notice and a console error. When file logging is enabled, failures are also appended to the configured import log as `ERROR pdf_import` entries, including unexpected top-level command failures that escape a specific import stage.

## Docling And OCR

Docling extraction decides whether to trust a text layer, OCR, or postprocess text based on document quality.

`tools/docling_extract.py` detects text layers, selects language hints, chooses OCR engines, detects low-quality OCR, handles per-page OCR, applies dictionary and cleanup corrections, extracts page ranges, and emits both Markdown and chunk JSON.

The plugin can run this tool through the Python worker API or legacy local Python. In worker mode, Docling and Hugging Face model artifacts are cached under the mounted worker cache and prefetched on worker startup so imports do not depend on first-use model downloads.

## Chunk Construction

Chunks are the shared unit for notes, Redis records, citations, and incremental reindexing.

Page chunking creates page-based chunk IDs such as `p1`. Section chunking groups Markdown sections and can split long sections with overlap. Annotation sync can add annotation chunks marked as annotations so highlight text and comments are searchable alongside extracted PDF text.

Chunk marker rendering is documented in [[chunk-sync#Synchronized Markers]].

## Indexing And Retrieval

RedisSearch stores vectorized chunks with document metadata, page fields, tags, section names, and annotation flags.

`tools/index_redisearch.py` normalizes Markdown to index text, optionally prepends metadata, optionally splits chunks into embedding subchunks, builds embedding context from neighbors, generates chunk tags when configured, and upserts or deletes specific chunk IDs for incremental updates.

Embedding dimension mismatches trigger a drop/rebuild prompt because Redis vector schema dimensions must match the active embedding model.

## Chat Query Flow

Chat queries stream answers from the worker while keeping citations tied to retrieved chunks.

`src/chatView.ts` owns the chat UI and session state. `src/main.ts` invokes `tools/rag_query_redisearch.py` with embedding and chat provider settings, recent history, optional follow-up rewriting, optional query expansion, optional cross-encoder reranking, and optional agentic retrieval.

Chat session listing uses an Obsidian-style sort menu beside the session selector. The persisted sort order defaults to newest updated sessions first, and no-op saves do not refresh `updatedAt`, so switching chats alone does not reorder the selector.

The sort menu button uses Obsidian's `clickable-icon nav-action-button` structure, resolves the built-in sort icon through the runtime icon registry, then falls back to rendering the same `svg-icon lucide-sort-asc` SVG shape when the registry does not expose that icon to plugins.

Returned citations are resolved through the doc index and can link to the Obsidian note chunk, source PDF, or Zotero deep link.

## Cache Rebuilds

Cache files are the recovery source when Redis or generated notes drift.

The plugin can reindex all cached chunks, reindex the current note, rebuild the doc index, recreate missing notes from cache, drop and rebuild RedisSearch, and restore missing chunk JSON from note markers when a note still has a valid sync section.

These rebuild paths depend on the marker grammar in [[chunk-sync#Recovery From Markers]].
