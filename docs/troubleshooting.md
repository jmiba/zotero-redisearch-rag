# Troubleshooting

This page lists common issues and how to resolve them.

## Common errors and fixes
- **“No such index idx:zotero”**
  - Start Redis Stack and run **Reindex Redis from cached chunks**.

- **“Failed to sync bundled tools”**
  - Restart Obsidian and try again. If it persists, reinstall the plugin.

- **“No PDF attachment found for item”**
  - The selected Zotero item doesn’t have a PDF attachment. Add one in Zotero and re‑import.

## Redis index mismatch and reindex
If you change embedding models or the index schema gets out of sync, you may see errors about embedding dimensions or missing fields.

Fix:
1. Run **Drop & rebuild Redis index**.
2. Then run **Reindex Redis from cached chunks**.

This rebuilds the Redis index using your current settings.

## Model identifier issues
- **LM Studio**: Use the exact **model ID** shown in LM Studio, not the repository name.
- **Ollama**: Use the OpenAI‑compatible endpoint and a model name that exists in Ollama.

If model refresh fails, double‑check the base URL and API key in the provider profile.

## OCR quality problems and cleanup
If OCR output is noisy or incomplete:
- Switch **OCR mode** to “OCR only if text is poor” or “Always OCR.”
- Try a different **OCR engine** (Tesseract vs. Paddle options).
- Enable **OCR cleanup** with an LLM to improve low‑quality text.

For scanned PDFs, installing Tesseract + Poppler improves OCR accuracy.
