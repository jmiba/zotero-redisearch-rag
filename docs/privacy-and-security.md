# Privacy and Security

This plugin is designed to be local‑first, but it can talk to external services depending on your settings.

## Local‑first data flow
- PDFs are processed on your machine.
- Chunks and embeddings are stored locally (Redis + cache files in your vault).
- Notes remain normal Obsidian Markdown files.

## API key storage
- Provider API keys are stored in the plugin settings.
- Keys are masked in the UI but not encrypted on disk.

## When network calls occur
Network calls happen only when you enable features that require them:
- **Zotero Web API**: Optional fallback or write‑back.
- **Cloud LLM providers**: If you choose OpenAI/OpenRouter or another remote provider.
- **PaddleOCR API**: If you enable PaddleOCR API modes.

If you run everything locally (Zotero local API, local LLM server, local OCR), the plugin stays fully offline.
