# Architecture

The plugin connects Zotero, Obsidian, local worker tools, RedisSearch, and LLM providers into a desktop RAG workflow.

This page is the top-level map. Details live in [[zotero-sync#Zotero Sync]], [[rag-pipeline#RAG Pipeline]], [[chunk-sync#Chunk Sync]], [[companion-addon#Companion Addon]], and [[tests#Tests]].

## Obsidian Plugin Shell

The Obsidian plugin owns user commands, settings, editor integrations, cache paths, and chat view lifecycle.

`src/main.ts` defines `ZoteroRagPlugin`, registers command palette entries, installs editor extensions, creates the chat view, starts Redis when configured, and syncs note events back into cache and indexes.

Key commands include import, chat, Redis startup, cache rebuilds, note reindexing, chunk exclusion, Redis diagnostics, companion health checks, and note/cache deletion.

## Zotero Data Boundary

Zotero is the source of bibliographic truth while Obsidian is the editable working surface.

The plugin prefers the Zotero Local API at `http://127.0.0.1:23119/api` and can fall back to the Web API when configured. Zotero item keys, attachment keys, and derived `doc_id` values are the stable bridge between notes, cache files, Redis records, citations, and annotation sync.

Metadata and annotation rules are documented in [[zotero-sync#Zotero Sync]].

## Import And Processing Boundary

Imports stage all item JSON, chunk JSON, note Markdown, and optional copied PDFs before replacing final files.

The import path resolves a processable PDF attachment, runs Docling/OCR through the configured Python runtime, writes chunk JSON under `.zotero-redisearch-rag/chunks`, indexes chunks into RedisSearch, then finalizes the note with frontmatter and synchronized chunk markers.

The import picker resolves child attachments when Zotero search metadata cannot prove PDF availability, so items with only snapshots or other non-PDF files are still flagged as missing a PDF.

The extraction and indexing flow is documented in [[rag-pipeline#Import Pipeline]].

## Worker Runtime Boundary

The recommended Python runtime is the worker container, with local Python kept as a legacy path.

Worker mode runs Redis Stack and a `python-worker` service through Docker or Podman compose. The plugin maps vault and plugin paths into container paths, rewrites local Redis URLs for the compose network, and restricts worker calls to bundled tools in the plugin `tools` directory.

The worker service runs heavyweight Python tools through a single execution slot, so Docling extraction, chunk indexing, and RAG/reranking do not compete for container memory. Child tool processes inherit the worker cache environment.

The bundled worker requirements pin the Paddle OCR stack to known-good versions so local installs and cached worker rebuilds do not silently drift to newer `paddleocr` or `paddlex` releases. Those pins also need to stay compatible with the Linux Python version used by the worker image, not just a developer's local environment.

The HTTP stack keeps major-version bounds while allowing `requests` patch and minor updates under `<3`, avoiding unnecessary freezes on stable client APIs.

The persistent worker cache keeps the virtual environment and model artifacts separately; startup can refresh missing model artifacts without deleting the cached virtual environment. By default the cache lives under the user's home cache path in a vault-specific subdirectory and can be overridden in settings, including with a vault-relative `./` path when desired. Docling model prefetch targets the mounted cache path explicitly so version stamps do not mask an empty artifact directory.

Worker readiness accepts a healthy worker API even when compose service inspection misses the running service, avoiding false "worker not running" failures for an already reachable worker.

## Redis Boundary

RedisSearch is the local vector index, while Obsidian files remain the durable user-visible record.

Index names and key prefixes are namespaced per vault unless a user configures shared Redis behavior. Cached chunk JSON is the source for reindexing, drop/rebuild recovery, orphan cleanup, and incremental updates after note edits.

Redis and query behavior are documented in [[rag-pipeline#Indexing And Retrieval]].

## LLM Provider Boundary

LLM providers are OpenAI-compatible endpoints selected separately for embeddings, chat, and cleanup/tagging.

Provider profiles reduce repeated base URL and API key setup. Embedding settings affect Redis schema compatibility, chat settings drive answer generation, and cleanup/tagging settings are optional preprocessing aids for noisy OCR text and chunk tags.

Model-list authentication failures are surfaced as Obsidian notices so invalid provider keys are visible without opening the developer console.

## User-Facing Surfaces

Users interact through commands, settings, generated notes, chunk controls, the PDF sidebar, and the chat panel.

Generated notes contain YAML frontmatter, optional PDF links, optional annotation callouts, and a synchronized Docling body. Live Preview exposes chunk badges and tools so users can inspect, clean, tag, exclude, open, or reindex chunk content without leaving the note.

Chunk marker behavior is documented in [[chunk-sync#Chunk Sync]].
