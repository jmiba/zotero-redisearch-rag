# PaddleOCR-VL 1.6 Setup

This guide shows how to run PaddleOCR-VL 1.6 locally or through the Baidu API in Zotero Research Assistant.

Local mode keeps PDF data on your machine. API mode sends PDF document data to Baidu's servers for processing.

## 1) Choose local or API mode

### Local worker mode

1. Keep the default Python worker enabled under **Prerequisites**.
2. Start or recreate the Redis stack so the worker installs the updated dependencies.
3. Under **OCR**, select **PaddleOCR-VL 1.6 (local)**.

The worker pins `paddleocr[doc-parser]` 3.6.0, PaddleX 3.6.1, and PaddlePaddle 3.2.2. The 1.6 model files download on first use and are stored in the configured worker cache.

For the advanced legacy local runtime, update the environment first:

```bash
source .venv/bin/activate
pip install -r requirements.txt
```

### API mode

1. Create or sign in to your PaddleOCR account at [AI Studio PaddleOCR](https://aistudio.baidu.com/paddleocr).
2. Select PaddleOCR-VL 1.6 and copy its API token and API URL.
3. Keep that token and URL ready for plugin settings.

## 2) Configure API settings in the plugin

In Obsidian plugin settings:

1. Open **OCR**.
2. Set **Paddle OCR API key** to your token.
3. Set **PaddleOCR-VL API URL** to your URL.
4. Set **OCR engine** to **PaddleOCR-VL 1.6 (API)**.

Notes:

- The engine option appears after a non-empty API key is saved.
- Keep **PP-StructureV3 API URL** empty unless you also plan to use PP-Structure API mode.

## 3) Recommended OCR strategy

For mixed PDF quality:

- **OCR decision (when to OCR)**: `OCR only if text is poor`
- **OCR layout override (per-page)**: keep off unless needed for difficult layouts

For mostly scanned PDFs:

- **OCR decision (when to OCR)**: `Prefer OCR for full document`

## 4) Quick verification

1. Import one short PDF.
2. Open logs if needed (**Maintenance → Logs**).
3. Confirm OCR runs with PaddleOCR-VL 1.6 and no model, token, or HTTP errors.

## Common pitfalls

- **Engine option missing**: API key is empty or not saved.
- **Local model option missing**: update the local Python environment from `requirements.txt`, or use the default worker mode.
- **Long first local run**: the worker must download the PaddleOCR-VL 1.6 model files before inference.
- **401/403 auth error**: invalid or expired API token.
- **429 responses**: API quota/rate limit reached.
- **Wrong endpoint**: use the `.../ocr/layout-parsing` URL for this plugin flow.
- **Network/proxy issues**: Obsidian cannot reach `aip.baidubce.com`.
