This directory defines the high-level concepts, business logic, and architecture of this project using markdown. It is managed by [lat.md](https://www.npmjs.com/package/lat.md) — a tool that anchors source code to these definitions. Install the `lat` command with `npm i -g lat.md` and run `lat --help`.

- [[architecture]] — System boundaries for the Obsidian plugin, Zotero, worker tools, RedisSearch, and LLM providers.
- [[chunk-sync]] — Marker-based note editing, chunk exclusion, citation navigation, and cache recovery.
- [[companion-addon]] — Zotero companion add-on endpoints, token authorization, and annotation image retrieval.
- [[rag-pipeline]] — PDF import, Docling/OCR processing, chunk indexing, RedisSearch retrieval, and chat answers.
- [[tests]] — Behavioral specs and current test coverage for extraction and integration-critical flows.
- [[zotero-sync]] — Metadata, frontmatter, citekey, annotation, snapshot, and image synchronization rules.
