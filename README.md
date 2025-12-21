# Zotero -> Docling -> Redis Stack -> LLaMA 3.1 RAG

> [!CAUTION]
> This Obsidian plugin is in early development. Use at your own risk.

Science-grade Zotero RAG pipeline:
- Interactive mode via Obsidian local Zotero API search for item selection
- Batch mode via pyzotero
- Docling extraction to Markdown + structured chunks with OCR options
- Redis Stack (RediSearch) vector search with HNSW + COSINE
- Local embeddings via LM Studio (OpenAI-compatible)
- Chat generation via OpenAI-compatible endpoint
- Guardrails: answer only from retrieved context with citations

## Redis Stack setup

Option A: Docker

```bash
docker run --rm -p 6379:6379 redis/redis-stack-server:latest
```

Verify RediSearch works:

```bash
redis-cli FT.CREATE idx:probe ON HASH PREFIX 1 "probe:" SCHEMA text TEXT
redis-cli FT.INFO idx:probe
```

## LM Studio setup (embeddings + chat)

1) Start LM Studio local server (OpenAI-compatible).
2) Confirm embeddings endpoint:

```bash
curl http://localhost:1234/v1/embeddings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer lm-studio" \
  -d '{"model":"google/embedding-gemma-300m","input":"ping"}'
```

3) Configure embeddings model: `google/embedding-gemma-300m` (DIM=768).
4) For chat, set `chat_base_url` to your OpenAI-compatible endpoint and model
   (default: `meta-llama/llama-3.1-405b-instruct`).

## Python setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Obsidian plugin build/install

```bash
npm install
npm run build
```

Copy the plugin folder to your vault:
`<vault>/.obsidian/plugins/zotero-redisearch-rag/`

Ensure the `tools/` folder is included alongside `main.js` and `manifest.json`.

Settings are in Obsidian: `Settings -> Community plugins -> Zotero Redis RAG`.

## GitHub releases + BRAT

To install via BRAT from GitHub releases, publish a release that includes the built plugin.

1) Build and package:

```bash
npm run package-release
```

This creates `dist/zotero-redisearch-rag.zip` containing `main.js`, `manifest.json`, and `tools/`.

2) Create a GitHub release and upload the zip asset.

3) In BRAT: `Add beta plugin` -> enter the repo -> enable `Use releases`.

## End-to-end demos

### 1) Batch index an entire Zotero library

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
  --embed-model google/embedding-gemma-300m \
  --out-dir ./data \
  --ocr auto \
  --chunking page
```

### 2) Obsidian: import one item + ask queries

1) Run the command: `Import Zotero item and index (Docling -> RedisSearch)`
2) Then run: `Ask my Zotero library (RAG via RedisSearch)`

The answer will only use retrieved context and include citations.

## Guardrails

- Answers must be grounded in retrieved context.
- If context is insufficient, the response says it does not know.
- Citations include `doc_id` and page ranges.

## File outputs

Interactive mode writes to your vault:
- `zotero/pdfs/<title>.pdf` (optional, if copy is enabled)
- `.zotero-redisearch-rag/items/<doc_id>.json`
- `zotero/notes/<title>.md`
- `.zotero-redisearch-rag/chunks/<doc_id>.json`
- `.zotero-redisearch-rag/chat.json` (chat history)

Batch mode writes to `--out-dir`:
- `pdfs/`, `items/`, `docs/`, `chunks/`, `checkpoint.json`
