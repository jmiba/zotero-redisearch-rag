# Core Concepts

This page explains the key pieces of the plugin in plain language.

## Zotero items vs. attachments
- **Item**: The bibliographic record (title, authors, year, tags, etc.).
- **Attachment**: The actual file linked to the item, usually a PDF.

The plugin imports the item metadata and uses the PDF attachment to extract text and build the search index.

## Notes, chunk markers, and sync boundaries
When you import an item, the plugin creates a normal Obsidian note. Inside that note it adds hidden markers that define the synced content.

Key markers:
- `<!-- zrr:sync-start doc_id=... -->`
- `<!-- zrr:chunk id=... -->`
- `<!-- zrr:chunk end -->`
- `<!-- zrr:sync-end -->`

These markers create **sync boundaries** so the plugin knows which parts are managed and how to reindex changes. You can edit chunk text safely. If you delete chunk markers, the plugin can no longer track that chunk.

## Annotations and annotation images
Zotero annotations (highlights, notes) can be synced into the note as callouts. If you enable the Zotero companion, the plugin can also pull **annotation images** (e.g., area or drawing annotations) and place them next to those callouts.

## Redis index and cache files
The plugin stores two kinds of data:
- **Redis index**: The searchable vector index used to retrieve relevant chunks.
- **Local cache**: JSON files in `.zotero-redisearch-rag/` that store item metadata and chunk text.

The cache lets the plugin rebuild the Redis index without re‑running Docling and OCR. If Redis is reset, you can reindex from the cache.
