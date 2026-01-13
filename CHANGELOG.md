# Changelog

## 0.4.3

- Implemented chunking of large pdfs to enable full pocessing via the PaddleOCR API.
- Updated text layer classification and quality assessment for PDFs.


## 0.4.2

- Images in PDFs are now extracted to the vault's attachment folder.

## 0.4.1

- Page-synchronous view of PDF in sidebar.
- Improved footnote conversion.
- Footer, header and page number removal from OCR/text-layer extraction.
- PaddleOCR API timeout handling.

## 0.4.0

- Import now resumes after a drop/rebuild when an embedding-dimension mismatch is detected, with clearer provider-error notices.
- Chat queries now handle embedding dimension mismatches by offering a drop/rebuild and retrying after a successful rebuild.
- Import/chat now surface embedding-provider failures encountered during rebuilds with clearer guidance.
- Import and Zotero group lookups now show a toast when the local Zotero API is unreachable.
- Docling OCR now supports PaddleOCR API endpoints (PaddleOCR-VL / PP-StructureV3) with engine selection and API key settings.
- Indexed text now labels image captions explicitly for retrieval.
- Python env now defaults to a shared user cache folder so multiple vaults can reuse it.
- Added a setting to choose between shared and per-vault Python env locations.
- Python path now defaults to blank and auto-detects interpreters when setting up the env.
- Plugin now detects an already-running Redis instance on startup (when auto-start is off) and notifies the user.

## 0.3.4

- Sync markers now render as styled badges in reading view (page/section + sync start/end).
- Added command to drop and rebuild the Redis index from cached chunks.
- Drop & rebuild now proceeds if the Redis index does not exist yet.
- Added a command to purge Redis chunk keys that have no cached item/chunk JSON.
- Doc index pruning now runs after reindexing/purge to remove stale entries.
- Embedding now splits long chunks into subchunks (multi-vector) while keeping display chunks intact.
- Embedding subchunk size/overlap is now configurable; section chunk size/overlap settings removed.
- Chunk end markers now render as badges in reading/live preview.
- Retrieval now auto-broadens before the LLM when context is weak (chunk count, context length, vector score, narrative filter).
- Indexing now derives text from a Markdown AST (table/list-aware) instead of flattening display Markdown.
- Page chunks now reflow wrapped OCR/text-layer lines while preserving headings/lists/tables.
- New command: delete the active Zotero note plus cached chunks/items to prevent recreation.
- Lexical retrieval now searches title/authors/tags/chunk tags and preserves Unicode tokens.
- New command: search the Redis index for a term (shows matching chunks/metadata).
- Exact lexical hits are kept even if strict content filters would drop them.
- Short queries now increase vector k and hyphenated terms are split for lexical matching.
- Index reindexing now detects embedding model/provider errors and prompts to drop & rebuild the Redis index.
- Indexing now auto-detects embedding dimensions to avoid mismatch loops after model changes.
- GPT-5 family models now omit non-default temperatures for OCR cleanup/tagging to avoid API errors.
- Reindexing now writes progress/error output to the log file when file logging is enabled.
- Import/reindex/chat now warn early when Redis is unreachable to avoid half-finished notes.
- Reindexing now uses existing chunk tags only (no tag regeneration).
- Embedding inputs are now truncated to avoid model context overflows during reindex.
- Reindex logs now include the current doc_id:chunk_id for embedding/index steps.
- Recreate-missing-notes now logs doc_id progress and indexer chunk progress.
- Tag sanitization now offers Obsidian-style cases (camel/pascal/snake/kebab) instead of a custom separator.
- Frontmatter now supports `aliases` built from citekey/short title/DOI (when present).
- Zotero picker now flags items without processable PDFs even when only non-PDF attachments exist.
- Notes now auto-repair missing frontmatter `doc_id` values using sync markers or cached index entries.
- Redis indexing now extracts years correctly from Zotero item dates.

## 0.3.3
- Tag-aware retrieval boosting and tag regeneration in the chunk editor.
- Tag sanitization options for Obsidian (replace spaces or camelCase).
- Note body template is now editable (with PDF/docling placeholders).
- Frontmatter template: clarified YAML-safe suffixes and added item link/citekey defaults.
- Fix: Chat title generation avoids incompatible OpenAI calls.
- LLM provider profiles: model lists refresh on profile switch; delete control moved into its own row.

## 0.3.2
- Hoverbar now shows Lucide icons and tooltips on all buttons.
- Hoverbar: clean-chunk and open-in-Zotero actions added.
- Chunk cleanup progress is now surfaced in the status bar.
- Frontmatter no longer emits empty tag entries when Zotero has no tags.

## 0.3.1
- Improved Python error handling and auto-opened Settings for environment fixes.
- Frontmatter `pdf_link` now stores raw Zotero deeplinks (no markdown wrapper).
- Release package now includes `CHANGELOG.md`.

## 0.3.0
- Cursor-anchored chunk toolbar with Tags, Indexed preview, and Exclude/Include.
- Excluded chunks are removed from Redis but preserved in chunk JSON for easy re-include.
- Indexed preview now matches Redis text (markdown-to-text normalization).
- Expanded Zotero frontmatter support: editors, tags, collections, book/journal fields, identifiers, and abstract.
- Frontmatter template editor restored in Settings.
- PDF handling: embed only when copied to the vault; frontmatter `pdf_link` always uses Zotero deep link.
- Metadata-aware embeddings and optional LLM chunk tagging for richer retrieval.
