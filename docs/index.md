# Zotero Redis RAG for Obsidian

## Overview
Zotero Redis RAG connects [Zotero](https://www.zotero.org) and [Obsidian](https://obsidian.md) so you can ask questions across your PDF library without leaving your vault. The plugin imports selected Zotero items, extracts text with Docling (using OCR when needed), splits content into chunks, and indexes those chunks in Redis Stack. When you ask a question, it retrieves the most relevant chunks and returns an answer with citations that jump to the exact spot in your note or PDF.

The notes it creates are normal Obsidian notes that you can edit. Sync markers and chunk badges keep the index aligned with your edits, and changes reindex only the affected chunks instead of reprocessing the entire document. This keeps the workflow fast, local-first, and transparent.

## Documentation
- [Quick Start](quick-start.md)
- [How It Works](how-it-works.md)
- [Core Concepts](core-concepts.md)
- [Daily Workflow](daily-workflow.md)
- [Chat Panel](chat-panel.md)
- [PDF Handling](pdf-handling.md)
- [Annotations](annotations.md)
- [Retrieval and Ranking](retrieval-ranking.md)
- [Settings Reference](settings-reference.md)
- [LM Studio Provider Setup](lm-studio-provider-setup.md)
- [PaddleOCR-VL 1.5 Setup](paddleocr-vl-1.5-setup.md)
- [Command Palette Reference](command-palette-reference.md)
- [Files and Data Locations](files-and-data-locations.md)
- [Troubleshooting](troubleshooting.md)
- [Advanced Usage](advanced-usage.md)
- [Privacy and Security](privacy-and-security.md)
- [FAQ](faq.md)
