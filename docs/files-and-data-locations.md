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
Redis stores its own data separately:

- When started from the plugin, it uses a per‑vault data folder under your vault’s `.obsidian/zotero-redisearch-rag/redis-data` (unless overridden).
- If you run Redis yourself, data location depends on your Redis configuration.

## Python worker data (worker runtime mode)

When using **Python worker container** runtime, the worker keeps a persistent virtual environment/cache at:

- `~/.cache/zotero-redisearch-rag/<vault-namespace>/` by default

You can override this in **Settings → Prerequisites → Python worker cache path**.
Relative paths with separators resolve from your home directory; use `./` to keep it vault-relative.

If multiple vaults share one Redis instance, the plugin namespaces the index and key prefix to avoid conflicts.

## Other local filesystem access

Some plugin workflows use local filesystem access outside Obsidian's vault API:

- Zotero PDF attachments may be read from Zotero's local storage path before they are copied into the vault.
- Optional companion add-on downloads are stored under the plugin data folder.
- Optional file logs are written only when file logging is enabled and use the configured log path.
- Docker/Podman and Python worker cache folders are created only for the configured runtime mode.
