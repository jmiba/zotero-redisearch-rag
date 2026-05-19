# Chunk Sync

Chunk sync lets users edit imported note text while keeping cached chunks and RedisSearch aligned.

The contract is marker based: generated notes contain hidden HTML comments that delimit the synced body and each chunk. Editor extensions render these markers as controls, but the comments remain the durable synchronization anchors.

## Synchronized Markers

The synced Docling body is bounded by a document marker and individual chunk markers.

The body starts with `<!-- zrr:sync-start doc_id=... -->` and ends with `<!-- zrr:sync-end -->`. Each chunk starts with `<!-- zrr:chunk id=... -->` and ends with `<!-- zrr:chunk end -->`. Section chunks may add a `section` flag and page chunks may carry `page=...`.

The parser lives in `src/chunkMarkers.ts`, and note reconstruction logic lives in `src/main.ts`.

## Editable Chunk Text

Users may edit text inside chunk markers, and those edits become the indexed source for that chunk.

On note save, the plugin parses the sync section, detects changed, deleted, or excluded chunk blocks, updates `.zotero-redisearch-rag/chunks/<doc_id>.json`, and calls incremental Redis indexing for only affected chunk IDs when possible.

Deleting marker comments is destructive because the plugin can no longer map the edited text to a stable chunk.

## Exclusion Semantics

Chunk exclusion removes a chunk from indexing without deleting the visible note text.

The command `Toggle zrr chunk exclude at cursor` and Live Preview tools add or remove exclusion markers or attributes. Excluded chunks remain in the note and cache but are skipped by `tools/index_redisearch.py` during indexing.

## Editor Controls

Live Preview controls expose chunk actions without making users edit marker comments directly.

`src/editorExtensions.ts` builds chunk badges, hover tools, internal chunk navigation, and sync badge rendering. Actions include clean text, tag generation, indexed preview, open in Zotero, and include or exclude toggles.

## Citation Navigation

Chunk IDs connect chat citations back to the exact note region or Zotero location.

The chat result resolver uses the doc index, chunk ID, page metadata, attachment key, and annotation key to produce display titles and links. User settings decide whether citations prefer Obsidian note chunks or Zotero/PDF targets.

This behavior depends on [[rag-pipeline#Chat Query Flow]] and [[zotero-sync#Identity Model]].

## Recovery From Markers

If cached chunk JSON is missing, the plugin can rebuild a usable cache from note markers.

The recovery path scans the sync section, extracts chunk IDs, page numbers, section flags, exclusion state, and edited text, then writes a new chunk JSON payload. It also hydrates the doc index with note path, title, PDF path, and attachment key when those can be resolved.

