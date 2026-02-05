# Zotero Redis RAG

## Overview
Zotero Redis RAG connects Zotero and Obsidian so you can ask questions across your PDF library without leaving your vault. The plugin imports selected Zotero items, extracts text with Docling (using OCR when needed), splits content into chunks, and indexes those chunks in Redis Stack. When you ask a question, it retrieves the most relevant chunks and returns an answer with citations that jump to the exact spot in your note or PDF.

The notes it creates are normal Obsidian notes that you can edit. Sync markers and chunk badges keep the index aligned with your edits, and changes reindex only the affected chunks instead of reprocessing the entire document. This keeps the workflow fast, local-first, and transparent.
