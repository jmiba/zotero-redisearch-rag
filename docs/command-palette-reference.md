# Command Palette Reference

This page lists the main commands and what they do.

## Import and ask
- **Import Zotero item and index (Docling → RedisSearch)**
  - Create a Zotero note, extract text, and index chunks.
- **Ask my Zotero library (RAG via RedisSearch)**
  - Ask a question and get an answer with citations.

## Chat panel
- **Open Zotero RAG chat panel**
  - Opens the chat view and session controls.

## Rebuild and reindex
- **Rebuild Zotero note from cache (Docling + RedisSearch)**
  - Recreate the note and reindex from cached files.
- **Rebuild doc index from cache**
  - Refresh the index metadata cache.
- **Recreate missing notes from cache (Docling + RedisSearch)**
  - Restore notes that were deleted from your vault.
- **Reindex Redis from cached chunks**
  - Rebuild the Redis index without re‑running Docling.
- **Reindex current note from cache**
  - Reindex only the note you are currently viewing.
- **Drop & rebuild Redis index**
  - Reset the Redis index and rebuild from cached chunks.

## Redis diagnostics and search
- **Search Redis index for term**
  - Run a keyword search against the index.
- **Show Redis diagnostics**
  - Display index info and connection status.

## Cache deletion and orphan purge
- **Delete Zotero note and cached data**
  - Remove the note and its cached item/chunk files.
- **Purge Redis orphaned chunks (missing cache files)**
  - Remove Redis entries that no longer have cache files.

## Zotero companion utilities
- **Check Zotero companion status**
  - Verify the companion is reachable.
- **Open Zotero Add‑ons**
  - Open the Zotero add‑ons UI for installation and checks.

## Logs
- **Open log file**
  - Open the Docling/processing log.
- **Clear log file**
  - Reset the log file.

## Chunk actions
- **Toggle ZRR chunk exclude at cursor**
  - Exclude or include the current chunk from indexing.
