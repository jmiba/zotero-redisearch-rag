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

**Option A:** Docker (ephemeral)

```bash
docker run --rm -p 6379:6379 redis/redis-stack-server:latest
```
> [!WARNING]
>Your index data will be lost when the container stops!

**Option B:** Docker Compose with persistent data (recommended)

Store Redis data in a folder inside your vault, e.g.
`<vault>/.zotero-redisearch-rag/redis-data`, by setting `ZRR_DATA_DIR`:

```bash
export ZRR_DATA_DIR="/path/to/your/vault/.zotero-redisearch-rag/redis-data"
docker compose up -d
```

If you prefer not to keep Redis data inside your vault, point `ZRR_DATA_DIR`
elsewhere.

The compose config mounts `redis-stack.conf` and enables AOF (`appendonly yes`)
so the index is persisted immediately under the mounted `/data` directory.

You can also start Redis Stack from Obsidian using the command
`Start Redis Stack (Docker Compose)`. Docker Desktop must be installed,
running, and your vault path must be shared in Docker settings.
Stopping and removing a stale container can also be done from the settings UI.

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

## Docling OCR tuning

`tools/docling_extract.py` uses a single `DoclingProcessingConfig` with conservative defaults:
- Auto-detect text layer and skip OCR when possible
- Prefer PaddleOCR, fall back to Tesseract
- Default language: German+English when detected, otherwise English
- Optional post-OCR cleanup and dictionary correction (off by default)
- Optional low-quality text handling: force OCR and rasterize pages before Docling OCR
- Quality scoring uses `wordfreq` (German/English frequency lists) to penalize gibberish text layers
- Rasterized column detection heuristic to keep Docling layout when multi-column pages are detected

OCR modes in Obsidian:
- auto: skip OCR if text looks good
- force if quality is bad: OCR only when the text layer scores below the quality threshold
- force: always OCR (ignores text layer)

To enable dictionary correction, set `enable_dictionary_correction = True`
and optionally point `dictionary_path` to a custom wordlist. A small default
wordlist is provided in `tools/ocr_wordlist.txt`.

Optional OCR dependencies for per-page OCR:
- `pdf2image` (requires a local PDF renderer such as Poppler)
- `pytesseract` + system `tesseract` binary (fallback engine)

These Python packages are included in `requirements.txt`, but you must still
install Poppler + Tesseract on your system for per-page OCR to work.

Optional cleanup enhancements:
- LLM cleanup for low-quality chunks (OpenAI-compatible endpoint; can be slow/costly).

## Obsidian plugin build/install

```bash
npm install
npm run build
```

Copy the plugin folder to your vault:
`<vault>/.obsidian/plugins/zotero-redisearch-rag/`

Ensure the `tools/` folder is included alongside `main.js` and `manifest.json`.

Settings are in Obsidian: `Settings -> Community plugins -> Zotero Redis RAG`.
If you enable auto-start, the plugin will run `docker compose` using the
bundled compose file and your vault path for `ZRR_DATA_DIR`.

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
