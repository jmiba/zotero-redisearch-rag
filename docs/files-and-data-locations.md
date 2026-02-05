# Files and Data Locations

This page shows where the plugin stores files in your vault and on disk.

## Notes, PDFs, and chats
By default, the plugin writes:
- **Notes**: `Zotero/Notes/`
- **PDFs**: `Zotero/PDFs/` (if Copy PDFs to vault is enabled)
- **Chat exports**: `Zotero/Chats/`

All of these paths are configurable in Settings → Output.

## Cache directories
The plugin keeps local cache files under:
- `.zotero-redisearch-rag/items/` — Zotero item metadata
- `.zotero-redisearch-rag/chunks/` — extracted chunks
- `.zotero-redisearch-rag/doc_index.json` — index metadata
- `.zotero-redisearch-rag/chats/` — chat session history

These caches let you reindex without re‑running Docling or OCR.

## Redis data directory
Redis Stack stores its own data separately:
- When started from the plugin, it uses a per‑vault data folder under your vault’s `.obsidian/zotero-redisearch-rag/redis-data` (unless overridden).
- If you run Redis yourself, data location depends on your Redis configuration.

If multiple vaults share one Redis instance, the plugin namespaces the index and key prefix to avoid conflicts.
