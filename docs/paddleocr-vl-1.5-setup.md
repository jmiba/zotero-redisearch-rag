# PaddleOCR-VL 1.5 Setup

This guide shows how to configure PaddleOCR-VL 1.5 API mode in Zotero Research Assistant.
Be aware that if you configure the plugin to use OCR via API, PDF document data will be sent to Baidu's servers for processing and is not processed locally.

## 1) Create/get your API token

1. Create or sign in to your PaddleOCR account at [AI Studio PaddleOCR](https://aistudio.baidu.com/paddleocr).
2. Select the desired model (PaddleOCR-VL 1.5) and copy your API token and your API URL.
3. Keep that token and URL ready for plugin settings.

## 2) Configure OCR settings in the plugin

In Obsidian plugin settings:

1. Open **OCR**.
2. Set **Paddle OCR API key** to your token.
3. Set **PaddleOCR-VL API URL** to your URL.
4. Set **OCR engine** to **PaddleOCR-VL API**.

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
3. Confirm OCR runs with PaddleOCR-VL API and no token/HTTP errors.

## Common pitfalls

- **Engine option missing**: API key is empty or not saved.
- **401/403 auth error**: invalid or expired API token.
- **429 responses**: API quota/rate limit reached.
- **Wrong endpoint**: use the `.../ocr/layout-parsing` URL for this plugin flow.
- **Network/proxy issues**: Obsidian cannot reach `aip.baidubce.com`.
