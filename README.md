# Zotero -> Docling -> Redis Stack -> RAG (Obsidian)

> [!CAUTION]
> This plugin is early and may change. Keep backups of important notes.

This plugin lets you:
- Pick Zotero items from Obsidian.
- Convert PDFs to text with Docling (OCR when needed).
- Store vectors in Redis Stack (RediSearch).
- Ask questions and get answers with citations.

## What you need

- Obsidian (desktop)
- Zotero 7 (desktop)
- Docker Desktop (for Redis Stack)
- LM Studio (for embeddings + chat)
- Python 3.11+ (for Docling tools)

## Step 1: Enable Zotero local API

In Zotero:
1) Open Settings -> Advanced.
2) Enable "Allow other applications on this computer to communicate with Zotero".
3) No API key is needed for the local API.

## Step 2: Install the plugin

Option A (recommended for nontechnical users):
1) Download the latest release zip.
2) Unzip to your vault:
   `<vault>/.obsidian/plugins/zotero-redisearch-rag/`
3) The folder must contain `main.js`, `manifest.json`, `versions.json`, and `tools/`.

Option B (build from source):
```bash
npm install
npm run build
```
Then copy the plugin folder to your vault as above.

## Step 3: Start Redis Stack (vector database)

Recommended: use the plugin command
- Command palette -> "Start Redis Stack (Docker Compose)"

Notes:
- Docker Desktop must be running.
- Your vault folder must be shared in Docker settings.
- Redis data is stored under `<vault>/.zotero-redisearch-rag/redis-data`.

## Step 4: Start LM Studio (embeddings + chat)

1) Open LM Studio and start the local server.
2) Copy the model ID shown in LM Studio (not the repo name).
   Example model IDs:
   - `text-embedding-embeddinggemma-300m`
   - `text-embedding-nomic-embed-text-v1.5`
3) Keep the server running while you use the plugin.

## Step 5: Python setup (Docling)

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Optional (for stronger OCR fallback):
- Install Poppler and Tesseract on your system.

## Step 6: Configure the plugin

Obsidian -> Settings -> Community plugins -> Zotero Redis RAG

Key settings to check:
- Python path: `/path/to/your/.venv/bin/python`
- Redis URL: `redis://127.0.0.1:6379`
- Embeddings base URL: `http://localhost:1234/v1`
- Embeddings model: use the LM Studio model ID
- Chat base URL/model: your LM Studio chat model ID

## Use it

1) Command palette -> "Import Zotero item and index (Docling -> RedisSearch)"
2) Command palette -> "Ask my Zotero library (RAG via RedisSearch)"

Answers are generated from retrieved text only and include citations.

## Reindex old items

If Redis was reset or your embedding model changed:
- Command palette -> "Reindex Redis from cached chunks"

This rebuilds the vector index from cached JSON chunks without re-running Docling.

## Files created in your vault

- `zotero/pdfs/<title>.pdf` (optional if PDF copy is enabled)
- `zotero/notes/<title>.md`
- `.zotero-redisearch-rag/items/<doc_id>.json`
- `.zotero-redisearch-rag/chunks/<doc_id>.json`
- `.zotero-redisearch-rag/doc_index.json`
- `.zotero-redisearch-rag/chat.json`

## OCR options (simple summary)

- Auto: use text layer if it looks good.
- Force if bad: OCR when text quality is low.
- Force: always OCR.

You can adjust the quality threshold in settings.

## Troubleshooting

- "No such index idx:zotero":
  Start Redis Stack and reindex cached chunks.
- "Invalid model identifier":
  Use the exact LM Studio model ID in settings.
- Redis data not persisting:
  Start Redis Stack from the plugin so it uses the correct data folder.

## Advanced: batch indexing

```bash
python3 tools/batch_index_pyzotero.py \
  --library-id <id> \
  --library-type user \
  --api-key <key> \
  --redis-url redis://127.0.0.1:6379 \
  --index idx:zotero \
  --prefix zotero:chunk: \
  --embed-base-url http://localhost:1234/v1 \
  --embed-api-key lm-studio \
  --embed-model text-embedding-embeddinggemma-300m \
  --out-dir ./data \
  --ocr auto \
  --chunking page
```

## Guardrails

- Answers must be grounded in retrieved context.
- If context is insufficient, the response says it does not know.
- Citations include doc_id and page ranges.
