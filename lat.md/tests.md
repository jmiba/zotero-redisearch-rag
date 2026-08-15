# Tests

This page tracks important behavioral specs that should remain covered as the plugin evolves.

The current executable tests focus on `tools/docling_extract.py` through `tests/test_docling_processing.py`. Future tests should add `@lat:` backlinks when this file is converted to enforced specs.

## Docling Processing Tests

Docling tests protect PDF extraction decisions that determine whether imported notes and chunks are trustworthy.

These tests use fake optional OCR modules so the processing logic can run without requiring every OCR dependency in the test environment.

### Text Layer Detection

Text layer detection must recognize useful born-digital text while still allowing OCR for empty or low-quality pages.

The test suite covers text layer presence, born-digital classifiers, mixed classifier overrides, and the decision to skip heavy postprocessing for trusted born-digital text.

### OCR Routing

OCR routing must choose OCR only when the configured mode and quality signals justify it.

Tests cover low-quality forced OCR, text-layer preservation including low-quality text layers that are not explicitly re-OCRed, per-page OCR decisions, rasterization triggers, engine language selection, the default Paddle-first route, explicit Paddle routing, missing external OCR diagnostics, Docling converter ONNX OCR options and low-memory runtime limits for external routes, filtering unstable Paddle orientation overrides, and zero-character OCR page detection.

### Text Cleanup

Text cleanup must repair common OCR artifacts without damaging valid Markdown or domain text.

Covered behaviors include dehyphenation, dictionary correction, German umlaut correction without optional word-frequency dependencies, Hunspell cache location, narrow escaping of gender stars, missing-space repair inputs, and page range overlap detection.

### Layout Signals

Layout signals must preserve multi-column and page structure where they affect chunk boundaries.

Tests cover column gap counting and page range selection, which help Docling attach chunks and extracted text to useful page metadata.

### Cleanup Safety

Optional LLM cleanup must fail closed so import does not depend on a flaky cleanup model.

Tests ensure GUI-only config keys are filtered, cleanup disables itself after timeout, and total cleanup budget exhaustion prevents future cleanup calls while preserving original text.

## Redis Client Compatibility

Redis client tests preserve retrieval behavior as Redis and redis-py response protocols evolve.

### RAG Parses RESP3

The RAG client uses RESP3 and normalizes map replies into records while retaining RESP2 positional-array parsing for backward compatibility.

## Integration Test Gaps

Important end-to-end flows are documented but not yet covered by automated tests in this repo.

The highest-value gaps are Zotero API metadata conflict handling, annotation block round trips, chunk marker edit reindexing, Redis dimension mismatch recovery, chat citation navigation, and companion image fetch authorization.

These gaps correspond to [[zotero-sync#Metadata Sync]], [[zotero-sync#Annotation Sync]], [[chunk-sync#Editable Chunk Text]], [[rag-pipeline#Indexing And Retrieval]], [[rag-pipeline#Chat Query Flow]], and [[companion-addon#Token Authorization]].
