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

Use the CLI tools when you need:

- Batch processing
- Troubleshooting outside Obsidian
- Custom pipelines or automation

## Multi‑vault behavior and Redis namespacing
If multiple vaults share a Redis instance, the plugin namespaces the index and key prefix with a vault‑specific hash. This prevents chunks from different vaults from mixing.

The derived namespace is stored in the plugin settings the first time this version loads. Moving the vault later keeps the stored namespace, so the existing Redis index and chunk keys remain selected. Maintenance → Redis indexing → Redis namespace can intentionally select an older namespace after a move that happened before this migration. Changing the field does not rename or delete Redis data.

If you enable **Auto‑assign Redis port**, each vault can start its own Redis instance on a unique local port.

## Shared compose project overrides across vaults
If two vaults use the same values for:

- **Redis data directory override**
- **Redis project name override**

and **Auto-assign Redis port** is off, both vaults will attach to the same Docker/Podman Compose project and containers.

This can be useful for intentional sharing, but it has an important constraint in worker mode:

- The `python-worker` container mounts one vault path at `/workspace/vault`.
- If a second vault reuses the same project, worker file lookups can point to the wrong mounted vault and fail with missing-path errors under `/workspace/vault/...`.

Recommendations:

- For two vaults open at the same time, use different project names and different data directory overrides (or enable **Auto-assign Redis port** and keep defaults).
- Only share one project override intentionally if you treat it as a single active vault for import/reindex operations.
