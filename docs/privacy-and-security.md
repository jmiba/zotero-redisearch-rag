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

## Local filesystem access
The plugin uses Node.js filesystem APIs for workflows that cannot be handled through Obsidian's vault API alone:

- reading Zotero PDF attachment files from Zotero's local file paths,
- writing bundled helper scripts into the plugin data folder,
- maintaining Redis/Python worker cache folders,
- writing optional diagnostic logs when file logging is enabled,
- downloading the optional Zotero companion add-on when requested.

The plugin does not scan arbitrary directories. File access is tied to Zotero attachments, configured output/cache locations, and explicit user actions.

## Shell/process execution
The plugin starts local processes for user-triggered workflows:

- Docker or Podman for Redis Stack and the Python worker container,
- Python helper scripts for Docling/OCR/indexing in legacy local runtime mode,
- platform open commands for opening PDFs or Zotero targets.

Commands are launched with explicit executable and argument lists, not through shell string evaluation.

## Clipboard access
Clipboard access is write-only and user-triggered. The plugin writes to the clipboard only when you click a copy action, such as copying chat/output text or generating a Zotero companion token. It does not read clipboard contents.
