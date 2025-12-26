# Ask Your Zotero Library in Obsidian

Obsidian plugin for Zotero RAG and chat using Redis Stack and LM Studio/OpenAI-compatible endpoints.

> [!CAUTION]
> This plugin is early and may change. Keep backups of important notes.

## Why this plugin exists

Zotero is your source of truth for references, and Obsidian is where you think. This plugin connects them so you can ask questions over your Zotero PDFs inside Obsidian and get answers with clear, clickable citations. It imports selected items, extracts text (OCR when needed), builds a local vector index in Redis, and keeps the results linked back to your notes and PDFs.

## What you get

- Ask questions over your Zotero PDFs inside Obsidian.
- Answers include citations that link back to your notes and Zotero PDFs (page links).
- A chat panel with saved sessions and one-click export to notes.
- Everything runs locally (Redis, embeddings, chat). Web API is optional.

## How it works

1) Pick a Zotero item in Obsidian.  
2) Docling extracts text (OCR when needed).  
3) Chunks are embedded and indexed in Redis Stack.  
4) Queries retrieve chunks and generate answers with citations.

## Requirements

- Obsidian (desktop)
- Zotero 7 (desktop)
- Docker Desktop (for Redis Stack)
- LM Studio (for embeddings + chat)
- Python 3.11+ (for Docling tools)

## Setup

### 1) Enable Zotero local API (read-only)
In Zotero:
1) Open Settings -> Advanced.
2) Enable "Allow other applications on this computer to communicate with Zotero".
3) No API key is needed for the local API.

### 2) Install the plugin
Option A (recommended):
1) Download the latest release zip.
2) Unzip to your vault:
   `<vault>/.obsidian/plugins/zotero-redisearch-rag/`
3) The folder must contain `main.js`, `manifest.json`, `versions.json`, and `tools/`.

Option B (BRAT, beta testing):
1) Install the BRAT plugin in Obsidian.
2) BRAT -> Add Beta plugin.
3) Enter the repo slug: `jmiba/zotero-redisearch-rag`
4) Enable the plugin in Community plugins.

Option C (build from source, power users):
```bash
npm install
npm run build
```
Then copy the plugin folder to your vault as above.

### 3) Start Redis Stack
Recommended: use the plugin command
- Command palette -> "Start Redis Stack (Docker Compose)"

Notes:
- Docker Desktop must be running.
- Your vault folder must be shared in Docker settings.
- Redis data is stored under `<vault>/.zotero-redisearch-rag/redis-data`.
- Multiple vaults: each vault uses its own Docker Compose project + data folder. If you want to run multiple Redis Stacks at the same time, set a different Redis port per vault by changing `Redis URL` (e.g. `redis://127.0.0.1:6380`).

### 4) Start LM Studio
1) Open LM Studio and start the local server.
2) Copy the model ID shown in LM Studio (not the repo name).
   Example model IDs:
   - `text-embedding-embeddinggemma-300m`
   - `text-embedding-nomic-embed-text-v1.5`
3) Keep the server running while you use the plugin.

### 5) Python setup (Docling)
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```
Optional (for stronger OCR fallback):
- Install Poppler and Tesseract on your system.
Optional (for faster native rebuilds):
- If you see a Paddle warning about missing `ccache`, install it (macOS: `brew install ccache`).

### 6) Configure the plugin
Obsidian -> Settings -> Community plugins -> Zotero Redis RAG

Key settings:
- Python path: `/path/to/your/.venv/bin/python`
- Redis URL: `redis://127.0.0.1:6379`
- Embeddings base URL: `http://localhost:1234/v1`
- Embeddings model: LM Studio model ID
- Chat base URL/model: LM Studio chat model ID
- Saved chats folder: where exported chat notes are stored

## Using the plugin

1) Command palette -> "Import Zotero item and index (Docling -> RedisSearch)"
2) Command palette -> "Ask my Zotero library (RAG via RedisSearch)"
3) Command palette -> "Open Zotero RAG chat panel"

Answers are generated from retrieved text only and include citations.

## PDF handling

- If "Copy PDFs into vault" is ON, the note links to the vault PDF.
- If it is OFF, the note links to the Zotero attachment (so you can see your Zotero annotations).
- If the local PDF path is unavailable, the plugin will temporarily copy the PDF into the vault for processing and tell you.

## Web API fallback (optional)

The local API is read-only. For write-back (language field) and for fallback reads when the local API is unavailable, you can enable the Web API:
1) Create an API key at https://www.zotero.org/settings/keys
2) In settings, fill:
   - Web API base URL (default `https://api.zotero.org`)
   - Web API library type (`user` or `group`)
   - Web API library ID (numeric)
   - Web API key

If you want Web API file downloads, your Zotero library must be synced and the API key must allow file access.

## Reindexing and cache

- Command palette -> "Reindex Redis from cached chunks"
- This rebuilds the vector index without re-running Docling.

## Files created in your vault

- `zotero/pdfs/<title>.pdf` (optional if PDF copy is enabled)
- `zotero/notes/<title>.md`
- `zotero/chats/<chat-title>.md` (exported chats; folder configurable)
- `.zotero-redisearch-rag/items/<doc_id>.json`
- `.zotero-redisearch-rag/chunks/<doc_id>.json`
- `.zotero-redisearch-rag/doc_index.json`
- `.zotero-redisearch-rag/chats/index.json`
- `.zotero-redisearch-rag/chats/<session-id>.json`

## OCR options (simple summary)

- Auto: use text layer if it looks good.
- Force if bad: OCR when text quality is low.
- Force: always OCR.

You can adjust the quality threshold in settings.

## Troubleshooting

- "No such index idx:zotero": start Redis Stack and reindex cached chunks.
- "Invalid model identifier": use the exact LM Studio model ID.
- Redis data not persisting: start Redis Stack from the plugin so it uses the correct data folder.

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
