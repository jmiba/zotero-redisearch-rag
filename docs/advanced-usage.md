# Advanced Usage

This section covers power‑user workflows and automation options.

## Batch indexing script overview
The repository includes a batch indexing script for large libraries. It pulls items from Zotero (Web API), runs extraction, and indexes in Redis.

Typical use cases:

- Indexing a large library overnight
- Pre‑building an index before using Obsidian

See the script in `tools/batch_index_pyzotero.py` and the example command in the README.

## CLI tools and when to use them
The plugin bundles Python tools under `tools/` for:

- **Extraction and chunking** (Docling)
- **Indexing** (Redis Search)
- **Querying** (RAG chat and diagnostics)

Use the CLI tools when you Sneed:

- Batch processing
- Troubleshooting outside Obsidian
- Custom pipelines or automation

## Multi‑vault behavior and Redis namespacing
If multiple vaults share a Redis instance, the plugin namespaces the index and key prefix with a vault‑specific hash. This prevents chunks from different vaults from mixing.

If you enable **Auto‑assign Redis port**, each vault can start its own Redis instance on a unique local port.
