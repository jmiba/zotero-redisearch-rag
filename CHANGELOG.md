# Changelog
## 0.10.2
- Address Obsidian community review findings:
  - raise the minimum Obsidian version to `1.7.2` for APIs used by the plugin,
  - remove an unsafe PDF sidebar icon HTML fallback,
  - update DOM helper usage for Obsidian lint compatibility.
- Reduce fingerprinting concerns by removing environment-variable and system-identity reads from the plugin bundle and bundled Python helpers.
- Keep community release packaging limited to the supported assets: `main.js`, `manifest.json`, and `styles.css`.

## 0.10.1
- Update the Zotero Research Assistant Companion add-on to `0.1.5`.
- Extend companion compatibility to Zotero `9.*` by raising the add-on `strict_max_version` from `8.*` to `9.*`.
- Refresh the companion update manifest/hash for the rebuilt `zrr-companion.xpi`.

## 0.10.0 (Minor Release)
- Add optional follow-up query rewriting for retrieval:
  - new `Rewrite follow-up queries` setting rewrites the current chat turn into a standalone retrieval query using recent chat history,
  - the rewritten query is used for retrieval, query expansion, reranking, and annotation lookup,
  - the original user wording is still preserved for answer generation.
- Improve chat-session safety while a response is streaming:
  - disable switching, renaming, deleting, and creating chat sessions while the current response is still in flight,
  - show clearer notices when a session action is blocked until the response is finished or canceled.
- Improve chat request parsing and docs:
  - preserve streamed whitespace more reliably when parsing chat/responses payloads,
  - document follow-up query rewriting in the README, chat-panel docs, retrieval-ranking docs, and settings reference.

## 0.9.28 (Bugfix Release)
- Surface import timeout budgeting more clearly during Docling imports:
  - compute a page-aware timeout budget up front,
  - show a notice with the chosen timeout budget before running the import worker,
  - log the same budget details to the console for troubleshooting.
- Bundle the new `pdf_page_count.py` helper into generated tool assets so packaged/plugin builds include the page-count utility used for timeout scaling.

## 0.9.27 (Bugfix Release)
- Scale Docling/import worker timeouts with PDF length:
  - add a small PDF page-count helper to estimate document size before import,
  - increase the worker timeout automatically for longer PDFs while keeping sensible minimum and maximum caps.
- Improve LM Studio tagging/cleanup error handling:
  - detect unloaded LM Studio tagging models more explicitly,
  - show targeted notices for imports, reindexing, and tag generation instead of generic embedding-provider failures.
- Improve Hunspell dictionary discovery and caching for Docling cleanup:
  - search both bundled and temp-cache Hunspell directories,
  - download fallback dictionaries into a shared cache directory instead of the bundled tools folder.

## 0.9.26 (Bugfix Release)
- Improve LM Studio compatibility for chat requests and title generation:
  - use the `/responses` API automatically for LM Studio chat/title requests when appropriate,
  - fall back to classic chat completions when the responses endpoint is unavailable,
  - parse streamed and non-streamed response payloads more robustly.
- Add LM Studio-aware context budgeting for chat:
  - inspect local model metadata to estimate context length,
  - trim oversized prompts/context blocks automatically,
  - pass explicit output-token budgets to reduce context-overflow failures.
- Add cleanup reasoning-mode controls for LLM cleanup:
  - new `Cleanup reasoning mode` setting with `Automatic`, `Reasoning on`, and `Reasoning off`,
  - in automatic mode, learn the preferred LM Studio native cleanup reasoning mode per provider/model and reprobe it every 30 days.

## 0.9.25 (Bugfix Release)
- Improve provider rate-limit handling across chat and indexing workflows:
  - detect common 429 / quota-exceeded failures more reliably,
  - show explicit retry messages for chat provider limits and embedding provider limits,
  - stop treating embedding rate limits as generic provider failures during imports, reindexing, and chat-triggered rebuilds.
- Tighten RAG query typing by introducing a dedicated final-payload type for streamed chat responses.
- Harden Zotero item and PDF attachment helpers:
  - normalize object access through safe record coercion instead of loose unknown-property reads,
  - validate PDF attachment keys more strictly before use,
  - keep citekey, short-title, creator-name, and attachment-path extraction logic working against more heterogeneous payload shapes.

## 0.9.24 (Bugfix Release)
- Add chat export post-processing controls:
  - new `Chat export template` setting to wrap copied chat notes in an optional vault template,
  - support `{{chat_title}}`, `{{chat_created_at}}`, and `{{chat_body}}` placeholders,
  - new `Chat export post-create command` setting to run a user-selected command after the copied chat note is created and opened.
- Improve copied-chat export behavior:
  - if the template omits `{{chat_body}}`, keep the transcript first so downstream templater workflows can operate on the full note body,
  - activate the freshly created note before running any configured post-create command.
- Clean up the chunk-citation implementation by removing the unused native `^zrr-chunk-...` export path and keeping plugin-driven `#zrr-chunk:` jumps as the only page/section citation mechanism.
- Minor chat UI and code-quality follow-up:
  - reduce mention picker text sizing slightly for better readability,
  - enforce `@typescript-eslint/require-await` and remove the unnecessary async `onClose()` implementation in the chat view.

## 0.9.23 (Bugfix Release)
- Fix chat `@` suggestion icons to reflect Zotero item types instead of always showing a book icon.
- Improve indexed `@` mention search reliability for metadata queries (especially `citekey`) by:
  - searching indexed metadata snapshots in addition to cached Zotero item payloads,
  - normalizing mention queries (leading `@` and surrounding punctuation) before scoring,
  - improving ranking so citekey and metadata hits surface more consistently.

## 0.9.22 (Bugfix Release)
- Improve chat citation insertion with an inline `@` picker overlay inside the chat textarea (no separate modal required).
- Add indexed-only citation suggestions for `@` mentions so results are limited to already indexed Zotero items.
- Expand mention triggering behavior:
  - trigger suggestions for `@` followed by any token,
  - open the picker immediately when only `@` is typed,
  - show recent indexed suggestions even before a first search character is entered.
- Add keyboard interaction for the overlay picker (Arrow Up/Down, Enter/Tab to insert, Escape to close).
- Add follow-up lint hardening for suggest modal prefill callbacks to satisfy no-floating-promises checks.

## 0.9.21 (Bugfix Release)
- Make Zotero PDF imports transactional and self-cleaning:
  - stage item cache, chunk cache, synced note, and vault-copied PDFs under temporary paths during import,
  - replace final files only after note finalization succeeds,
  - clean up staged/incomplete files plus Redis chunk keys when Docling extraction, indexing, or final note assembly fails or times out.
- Extend cleanup for note deletion and failed imports:
  - remove vault-local copied PDFs associated with a doc when deleting a note/cache bundle,
  - add timeout-aware import failure notices and failed-import Redis cleanup.
- Improve Docling PDF handling:
  - detect born-digital text layers more reliably and skip unnecessary OCR post-processing for them,
  - sanitize `docling_config.json` by removing GUI/runtime-managed keys on read/write so persisted config stays portable,
  - add explicit `--no-llm-cleanup` CLI support when LLM cleanup is disabled.
- Add regression tests for Docling config filtering and born-digital post-processing decisions.

## 0.9.20 (Bugfix Release)
- Harden Docling LLM cleanup against repeated slow/failing requests:
  - add a total cleanup time budget so LLM cleanup disables itself after spending too much wall-clock time across chunks,
  - cap each cleanup request timeout to the remaining cleanup budget,
  - disable further cleanup calls after timeout failures instead of retrying the same failure mode on later chunks.
- Improve Python error surfacing by collapsing noisy process stderr into shorter diagnostics that preserve the most relevant traceback/error lines.
- Reduce noisy warning logs for optional network lookups (model discovery, Zotero Web API group/user resolution, annotation item fetches) by downgrading expected offline/network-unavailable failures to debug logging.
- Add regression tests covering LLM cleanup timeout handling and cleanup-budget exhaustion.

## 0.9.19 (Bugfix Release)
- Restore copied-chat chunk citation jumps without relying on native Obsidian block refs:
  - exported chat notes now keep legacy `#zrr-chunk:` wiki-links for page/section chunk citations,
  - regular rendered markdown notes intercept those legacy links and route them through the plugin's existing chunk-marker jump logic.
- Add live preview support for legacy chunk citation jumps by intercepting `#zrr-chunk:` wiki-links from the CodeMirror editor surface and opening the target chunk directly.
- Improve internal-link resolution for copied chat-note citations by resolving relative wiki-links against the current note source path during custom navigation.

## 0.9.18 (Bugfix Release)
- Replace the bundled Redis image with `redis/redis-stack:7.4.0-v8` so new and recreated local stacks include Redis Insight.
- Add multi-vault-safe Redis Insight host-port handling by deriving the Insight port alongside the Redis and Python worker ports during auto-assign.
- Add a conservative recovery path for image refreshes:
  - new command palette action **Recreate redis stack (pull configured image)**,
  - new **Maintenance -> Redis indexing -> Recreate redis stack** button,
  - implementation pulls the configured Redis image and force-recreates only the `redis-stack` service.
- Update Docker/quick-start/troubleshooting docs to explain Redis Insight availability and the new recreate workflow.

## 0.9.17 (Bugfix Release)
- Fix right-sidebar PDF sync recovery after the sidebar tab is closed:
  - manual PDF sync now reuses only real PDF leaves instead of hijacking unrelated sidebar tabs or spawning empty leaves/splits,
  - sidebar recovery now coerces fallback leaves into a PDF view before opening the target file/page.
- Improve manual PDF sync UX:
  - make **Sync PDF view in right sidebar for current note** resolve the current Markdown note reliably even when focus is in another pane or the command palette,
  - make both the command and the ribbon button reveal the right-sidebar PDF view after syncing.
- Add a dedicated PDF ribbon button for one-click sidebar recovery and update docs for the new recovery path.

## 0.9.16 (Bugfix Release)
- Fix metadata sync coverage for publication container fields by adding full bidirectional sync support for:
  - `publication_title` (`publicationTitle` in Zotero),
  - `book_title` (`bookTitle` in Zotero),
  - `journal_abbrev` (`journalAbbreviation` in Zotero).
- Include these fields in metadata conflict/snapshot tracking and one-sided auto-create note -> Zotero behavior.
- Update docs to reflect the expanded synced metadata set and recognized YAML key variants.

## 0.9.15 (Bugfix Release)
- Add chunk-cache self-healing for note-based reindexing:
  - when `.zotero-redisearch-rag/chunks/<doc_id>.json` is missing but the note still contains `zrr:sync` / `zrr:chunk` markers, the plugin rebuilds chunk cache JSON directly from the note and continues reindexing.
- Apply the same fallback during note-save sync, so incremental chunk updates keep working after accidental cache file deletion.
- Preserve chunk marker metadata while restoring cache (chunk ID, page number, exclude flag, section marker), and refresh `doc_index` note path/title plus available PDF/attachment metadata.

## 0.9.14 (Bugfix Release)
- Fix repeated empty right-sidebar tab creation when opening Zotero notes:
  - prevent automatic PDF sidebar sync from creating new sidebar leaves,
  - reuse existing right-sidebar/PDF leaves only during background sync,
  - reserve leaf creation for the manual command **Sync PDF view in right sidebar for current note**.
- Harden right-sidebar leaf detection to use passive leaf iteration instead of `getRightLeaf(...)` during auto-sync paths.

## 0.9.13 (Bugfix Release)
- Add release quality gates for plugin publishing:
  - add ESLint flat config for TypeScript source checks,
  - add `npm run lint:changed` helper for fast changed-file linting,
  - enforce `npm run lint` as part of `npm run package-release`.
- Add a dedicated manifest validator (`npm run validate:manifest`) and enforce it in `package-release` before build/package steps.
- Fix minor citation label sanitization escaping to satisfy lint while preserving wiki-link safety.

## 0.9.12 (Bugfix Release)
- Fix broken chunk citation wiki-links by writing proper Obsidian link label delimiters (`|`) instead of escaped `\|` in generated inline citations and exported chat notes.
- Improve legacy citation compatibility by normalizing malformed chunk anchors (`#zrr-chunk:...\\|...`) before rendering and by extracting chunk IDs robustly when opening links.
- Fix citation/link resolution edge cases for note titles ending in whitespace:
  - harden filename sanitization to strip trailing spaces/dots after truncation,
  - sanitize reused basename sources from existing `note_path` / `pdf_path`,
  - keep exact internal-link path resolution with trimmed fallbacks for legacy files.

## 0.9.11 (Bugfix Release)
- Fix annotation-sync safety when Zotero annotation fetch is incomplete:
  - preserve existing annotation chunks instead of deleting them,
  - skip annotation chunk delete reindex operations during fetch-error states.
- Fix PDF sidebar sync regression for newly imported notes by re-triggering sidebar sync after `doc_index` is updated.
- Improve PDF sidebar reliability:
  - trigger pending sidebar sync when opening a note,
  - add command **Sync PDF view in right sidebar for current note** for manual recovery.
- Add compatibility mapping for legacy worker paths (`/workspace/vault/...`) to vault-relative paths so existing `doc_index.json` entries resolve in desktop Obsidian.

## 0.9.10 (Bugfix Release)
- Fix remaining Obsidian review lint issues:
  - remove async Promise-returning DOM callbacks where `void` is required,
  - remove deprecated-node rule suppressions and refactor request error handling,
  - tighten unknown/object-to-string coercion guards to avoid `[object Object]` fallbacks.
- Normalize flagged UI labels in settings/modals to sentence case.

## 0.9.9 (Bugfix Release)
- Fix release workflow install failures by syncing npm dependency metadata and lockfile for CI.
- Pin Obsidian peer `@codemirror/state` and `@codemirror/view` dev dependencies so `npm ci` resolves deterministically in GitHub Actions.
- Restore reliable GitHub release asset publication (`main.js`, `manifest.json`, `versions.json`, `styles.css`, and release zip) after CI recovery.

## 0.9.8 (Bugfix Release)
- Fix Obsidian review-blocking code issues for release validation:
  - replace deprecated markdown rendering calls with `MarkdownRenderer.render`,
  - replace `fetch` usage with Obsidian `requestUrl`,
  - remove `window.confirm` usage in favor of modal confirmations,
  - remove direct `innerHTML` writes in PDF sidebar/icon handling,
  - align command labels and static UI styling with plugin guidelines.
- Fix TypeScript regressions introduced during lint refactors by restoring robust `unknown`/JSON payload narrowing across chat history parsing, worker stream events, Redis stats payloads, and Zotero API response handling.
- Refine runtime-safe metadata/tag/creator parsing and cache payload handling in `main.ts` to prevent `{}`/`unknown` property access errors in editor diagnostics.

## 0.9.7 (Bugfix Release)
- Fix Redis/Python worker startup failures caused by stale container-name conflicts by auto-removing conflicting project containers and retrying startup once.
- Improve Zotero annotation deletion propagation to notes by detecting missing Zotero annotations and refreshing note annotation blocks accordingly.
- Guard annotation-prune sync against incomplete Zotero fetches to avoid accidental removals when annotation APIs fail.
- Add a focus-triggered annotation sync so note updates are pulled shortly after returning to Obsidian.
- Preserve Zotero annotation order within each heading by prioritizing Zotero sort tokens (`annotationSortIndex` / `annotationSort`) during block rendering.

## 0.9.6 (Bugfix Release)
- Fix worker-mode Redis `Connection refused` failures on Windows by hardening Redis URL rewriting in worker requests, including `redis://`, `rediss://`, and `redis+tls://` loopback URLs.
- Add support for both `--redis-url <url>` and `--redis-url=<url>` argument styles when mapping worker Redis endpoints.
- Add a defensive Redis URL rewrite inside `python-worker-api.py` so local loopback Redis URLs are remapped to `redis-stack:6379` before tool execution.

## 0.9.5 (Bugfix Release)
- Fix worker-mode Docling failure on read-only plugin mounts (e.g., Windows containers) by skipping on-demand Hunspell dictionary downloads when `tools/hunspell` is not writable.
- Fix worker-mode Redis indexing on Windows by mapping local `redis://127.0.0.1/...` URLs to the internal compose service (`redis-stack:6379`) when auto-started stack is used.
- Reduce noisy worker dependency warnings by pinning a compatible `requests` HTTP stack and installing `ccache` in the Python worker image.

## 0.9.4 (Bugfix Release)
- Follow-up bugfix release to publish the previous patch set under a new tag.
- Fix a Windows import stall where the status bar could stay on `Preparing...` while running an extra preflight Docling quality probe before extraction.
- Add first-start guidance in README/docs and a one-time startup toast warning that initial Docker/Podman image pulls/build steps may take 10+ minutes.
- Add a deduplicated Zotero connection-error toast when the configured Zotero Local API is unreachable.
- Change the default cross-encoder reranker preset to `cross-encoder/mmarco-mMiniLMv2-L12-H384-v1` (fast multilingual) for new setups.
- Fix Zotero Web API item search fallback by using `include=data` (the Web API rejects `include=meta` with HTTP 400).
- Update `citekey` sync for Zotero 8 native citation keys: prefer native `citationKey` on reads, write native `citationKey` plus `Extra`, and auto-retry writes without native `citationKey` when an API rejects that field.

## 0.9.3 (Bugfix Release)
- Add first-start guidance in README/docs and a one-time startup toast warning that initial Docker/Podman image pulls/build steps may take 10+ minutes.
- Add a deduplicated Zotero connection-error toast when the configured Zotero Local API is unreachable.
- Change the default cross-encoder reranker preset to `cross-encoder/mmarco-mMiniLMv2-L12-H384-v1` (fast multilingual) for new setups.
- Fix Zotero Web API item search fallback by using `include=data` (the Web API rejects `include=meta` with HTTP 400).
- Update `citekey` sync for Zotero 8 native citation keys: prefer native `citationKey` on reads, write native `citationKey` plus `Extra`, and auto-retry writes without native `citationKey` when an API rejects that field.

## 0.9.2 (Patch Release)

- Add metadata auto-create sync so newly populated Zotero metadata fields are written into Obsidian YAML even when the key was previously missing.
- Add one-sided note -> Zotero auto-sync for newly created core bibliographic fields when Zotero is empty (`title`, `short_title`, `citekey`, `date`, `abstract`, `doi`, `publisher`, `place`, `issue`, `volume`, `pages`, `item_type`, `authors`, `editors`).
- Make annotation color changes deterministic in sync by tracking annotation `color_key` in annotation snapshots and forcing note refresh when color changes.
- Rename docs page `docs/annotations.md` to `docs/metadata-and-annotations.md` and expand documentation with detailed metadata/annotation sync behavior and conflict model.

## 0.9.1 (Patch Release)

- Rebrand the plugin display name to **Zotero Research Assistant** across Obsidian UI labels and user-facing docs.
- Rename chat UI labels and command text to match the new product name.
- Rebrand the Zotero add-on package to **Zotero Research Assistant Companion** in the add-on manifest and preferences pane.
- Publish companion add-on update `0.1.4` and refresh `zotero-companion/updates.json` hash for update distribution.

## 0.9.0 (Minor Release)

- Make Python worker runtime the graceful default path for legacy installs:
  - migrate missing/invalid runtime configs to `worker`,
  - run a one-time migration for likely legacy implicit-local defaults,
  - persist migration state with `pythonRuntimeMigrationV1Done`,
  - keep existing local settings intact and show a migration notice.
- Fix runtime-specific stack startup so `Start Redis stack` brings up only required services for the selected runtime.
- Refactor RAG reranking execution for worker mode performance:
  - run `rag_query_redisearch.py` in-process inside `python-worker` for streaming requests,
  - keep cross-encoder reranker models warm across requests via in-worker cache (instead of per-request subprocess reload),
  - add phase/timing events for reranker load/score and end-to-end stream timings.
- Improve RAG streaming control path in worker mode:
  - add worker API cancel endpoint and request-id based cancellation,
  - wire chat cancel to worker request cancel for long-running retrieval/rerank operations.
- Improve reranker model configuration UX:
  - add multilingual cross-encoder presets (`BAAI/bge-reranker-v2-m3`, `cross-encoder/mmarco-mMiniLMv2-L12-H384-v1`, `jinaai/jina-reranker-v2-base-multilingual`),
  - support explicit `Custom` model selection in settings.
- Add advanced gating for local runtime controls:
  - new `Advanced Python runtime options` toggle in Prerequisites,
  - hide/disable local-only fields by default,
  - auto-switch to worker if advanced options are turned off while local runtime is active.
- Add explicit legacy-local opt-in paths:
  - new Maintenance action `Use local runtime (legacy)`,
  - new command palette command `Switch Python runtime to local (legacy)`.
- Update docs and README for worker-first runtime UX:
  - document advanced/legacy local runtime flow,
  - document migration behavior,
  - update settings, quick start, Python setup, Docker setup, troubleshooting, and command reference pages.

## 0.8.4 (Bugfix Release)

- Fix the **What's New** splash title and layout:
  - use a generic `What's new` header,
  - keep a single visible version heading (`vX.Y.Z`) without duplicate internal release-title lines.
- Fix release-notes sanitization so `Full Changelog` lines are removed even when formatted as markdown links or styled text.
- Fix `ReleaseNotesModal` markdown rendering type-safety by using an Obsidian `Component` lifecycle owner instead of passing the modal instance.
- Move **Maintenance -> Release Notes** to the end of the Maintenance settings section.

## 0.8.3 (Patch Release)

- Add a versioned bundled release-notes log and show all changes between the previously seen plugin version and the current version.
- Add a manual **Maintenance -> Release Notes -> Show** button to reopen the **What's New** splash on demand.
- Strip per-release `Full Changelog:` lines from bundled notes and show one canonical link to the full changelog in the splash footer.
- Improve release-note bundling by merging GitHub Release notes history (with local fallback) into the generated `releaseNotes.ts` log.

## 0.8.2 (Patch Release)

- Generate bundled **What's New** content automatically from the GitHub Release body during the release workflow.
- Render **What's New** content as Markdown so release notes formatting is preserved.
- Store only the current release's bundled notes instead of maintaining a full in-repo version history map.
- Package cleanup:
  - exclude `.DS_Store` from release archives,
  - remove tracked Python `__pycache__` artifacts,
  - remove obsolete root `ocr_wordlist.txt`.

## 0.8.1 (Patch Release)

- Add an automatic **What's New** splash modal shown once after plugin version updates, backed by bundled versioned release notes.

## 0.8.0 (Minor Release)

- Add optional **agentic retrieval** mode with a lightweight planner step before answer generation.
- Add agentic retrieval actions:
  - keep current context,
  - run an expansion retry retrieval pass,
  - pull full-document chunks for whole-document synthesis queries.
- Add agentic controls in settings (`Enable agentic retrieval`, `Agentic max iterations`).
- Extend RAG tool output with `agentic_mode` and `agentic_trace` for debugging and tuning.
- Add an animated **Thinking** indicator in the assistant bubble before streaming starts.
- Update docs for retrieval tuning and chat panel behavior.

## 0.7.0 (Minor Release)

- Add Python worker runtime architecture as the recommended path, with Redis and Python running as separate compose services.
- Route Python execution through the worker container in worker mode, including path mapping, worker readiness checks, and worker startup helpers.
- Improve worker reliability:
  - fix requirements path resolution and add fallback handling in worker entrypoint,
  - rebuild worker image automatically on worker startup,
  - remove home-directory mount to avoid Docker home-sharing prompts.
- Improve worker networking compatibility by mapping local loopback provider URLs for container execution.
- Add configurable Tesseract language pack installation in the worker image (default: `eng deu fra spa ita nld por pol swe`).
- Keep local Python fallback mode while disabling/greying local-only Python settings when worker runtime is selected.
- Update docs for worker-first setup, OCR dependencies, Docker setup, and troubleshooting.
- PDF sidebar sync stability fixes:
  - serialize/queue sidebar PDF page jumps and retry once on PDF.js `injectLinkAnnotations` render-order race,
  - stop forcing active-leaf switching during sidebar sync to avoid triggering incompatible active-leaf handlers in other plugins.

## 0.6.9 (Bugfix Release)

- Fix `citekey` sync regression where unpinned Better BibTeX keys could be cleared from notes on open.
- Resolve Zotero citekeys with a CSL fallback so BBT-generated keys sync into notes even when not pinned in `Extra`.
- Restore note -> Zotero `citekey` sync by writing `Citation Key: ...` into Zotero `Extra` when `citekey` is edited in Obsidian.

## 0.6.8

- Adjust `citekey` sync policy: only sync note `citekey` back to Zotero `Extra` when a pinned citation-key line already exists.
- Always sync Zotero/Better BibTeX citekey changes into the Obsidian note, even when back-sync is disabled.
- Clarify docs for directional `citekey` sync behavior.

## 0.6.7

- Add `citekey` to two-way metadata sync between note frontmatter and Zotero items.
- Sync `citekey` to Zotero via `Extra` (`Citation Key: ...`) so Better BibTeX-pinned keys can be updated from Obsidian.
- Update docs to list synced metadata fields and clarify `citekey`/Better BibTeX behavior.

## 0.6.6

- Speed up Zotero import picker search for large libraries by reducing search payloads, adding query debouncing, and caching repeated queries.
- Restrict import picker search to top-level Zotero items and filter out non-importable/untitled results (`note`, `annotation`, `attachment`, and blank titles).

## 0.6.5

- Redis startup now prepends resolved Docker/compose binary directories to subprocess `PATH` so GUI-launched Obsidian can find Docker credential helpers.
- In settings, `Auto-assign Redis port` now appears above Redis override fields, and the override fields are disabled and greyed out when auto-assign is enabled.

## 0.6.4

- Publish a clean follow-up patch release so the Redis image pin and troubleshooting updates are included in release artifacts.

## 0.6.3

- Pin Redis Stack image to `docker.io/redis/redis-stack-server@sha256:798ab84d9f266936b034ab11c4d04a2b8e4b441884c5aa7d17ac951eefdf742a` to avoid `latest` drift.
- Clarify Redis startup troubleshooting with explicit file-sharing guidance and additional container startup diagnostics.

## 0.6.2

- Replace XPI verification with a download button that saves to your system Downloads folder.

## 0.6.1

- Include the Zotero companion XPI in release assets to ensure the plugin can install it.

## 0.6.0

- Image/rect annotations now embed as images in annotation callouts when available.
- Annotation fetch now requests `annotationImage` from Zotero and falls back if the API rejects the include.
- Annotation sync no longer sends `annotationText` for non-highlight/underline types to avoid Web API 400s.
- Added Zotero companion integration (settings + cached-only fetch) for image/ink annotations.
- Zotero companion settings now include install helpers and a status check button.
- Zotero companion add-on now ships with an update URL and `updates.json` manifest.
- Zotero companion settings can generate a token, verify the bundled XPI, and open Zotero Add-ons.
- Inline annotation citations now resolve to annotation blocks instead of missing `zrr-chunk` anchors.
- Docker autodetect no longer overwrites generic `docker`/`podman` values when starting Redis, keeping settings portable across OSes.

## 0.5.2

- Docker path autodetect no longer overwrites generic `docker`/`podman` settings with OS-specific absolute paths.

## 0.5.1

- Additionally to `~`, `$HOME`, and `%USERPROFILE%` in Python/Docker/Redis path fields, relative paths with separators now resolve from the user home (use `./` for vault-relative Redis paths).

## 0.5.0 Bugfix Release

- Annotation import now retries Web API lookups and warns when Web API access is missing.
- Tag syncing now re-converts normalized Obsidian tags back to space-separated Zotero tags to avoid duplicates.
- Retrieval now force-includes top annotation hits and marks annotation citations in chat.
- Settings now accept `~`, `$HOME`, and `%USERPROFILE%` in Python/Docker/Redis path fields for cross-OS portability.

## 0.4.9

- Doc index PDF paths now persist as vault-relative when possible.
- Zotero item picker now shows item type icons.
- Added a template placeholder and sync pipeline for Zotero annotations (two-way sync + Redis indexing).

## 0.4.8

- Section chunk markers now label sections explicitly and show the estimated page in parentheses.
- Section chunk badges display the section label with the estimated page number.
- Section chunk notes now include the section heading for readability.
- Metadata sync now includes DOI, publisher, place, issue, volume, pages, and item type.
- Zotero frontmatter keys now normalize to space-separated names (legacy underscore/hyphen/camel variants remain readable).
- Metadata sync now uses a single conflict modal and tracks a last-sync snapshot to reduce repeated prompts.
- Metadata sync snapshot is now stored in the cache instead of frontmatter.

## 0.4.7

- Better BibTeX citekeys: recognize pinned keys in Extra (bibtex/biblatex) and fall back to CSL `citation-key` when needed.
- Added `date_added` and `date_modified` template vars.

## 0.4.6

- Default reranker model updated to `BAAI/bge-reranker-v2-m3` for better multilingual retrieval.
- Internal refactor: extracted PDF sidebar, chunk marker, and attachment helpers into dedicated modules.

## 0.4.5

- Improved system prompt for footnote recognition in clean-up passes.
- Added a per-page OCR override setting and clarified OCR mode labels in settings.

## 0.4.4

- Added bidirectional YAML ↔ Zotero metadata sync (title, short title, date, abstract, tags, authors, editors) with per-field conflict prompts.
- Chat messages can now be copied or deleted individually (icon buttons).
- Docling logs now use UTC timestamps and include PID/doc context; noisy pypdf CMap warnings are summarized at end-of-run.
- Docling log file is cleared before each import.
- PaddleOCR-VL API retries now auto-split on 500 errors while honoring payload limits.
- Added support for context snippets in `index_redisearch.py`, allowing neighboring chunks to be included in embeddings.
- Introduced new command-line arguments for configuring context window size and character limits.
- Implemented functions to truncate context text and build context strings for better embedding context.
- Enhanced the main embedding logic to utilize the new context features.
- In `rag_query_redisearch.py`, added query expansion functionality to generate alternative queries.
- Implemented reranking of candidates based on a specified model, with options for maximum character limits.
- Improved retrieval logic to support broadening of search results based on metrics.
- Retrieval now supports configurable RRF blending and optional logging of top ranked chunks for tuning.
- Retrieval can now cap the number of chunks returned per document to improve diversity.
- Updated output structure to include expanded queries and reranking information.


## 0.4.3

- Implemented chunking of large pdfs to enable full pocessing via the PaddleOCR API.
- Updated text layer classification and quality assessment for PDFs.9
- Compatibility with [pdf++ plugin](https://github.com/RyotaUshio/obsidian-pdf-plus) for improved PDF handling.
- Compatibility with [Local IMages Plus plugin](https://github.com/Sergei-Korneev/obsidian-local-images-plus).
- Improved citation link generation in the chat assisstant responses.


## 0.4.2

- Images in PDFs are now extracted to the vault's attachment folder.

## 0.4.1

- Page-synchronous view of PDF in sidebar.
- Improved footnote conversion.
- Footer, header and page number removal from OCR/text-layer extraction.
- PaddleOCR API timeout handling.

## 0.4.0

- Import now resumes after a drop/rebuild when an embedding-dimension mismatch is detected, with clearer provider-error notices.
- Chat queries now handle embedding dimension mismatches by offering a drop/rebuild and retrying after a successful rebuild.
- Import/chat now surface embedding-provider failures encountered during rebuilds with clearer guidance.
- Import and Zotero group lookups now show a toast when the local Zotero API is unreachable.
- Docling OCR now supports PaddleOCR API endpoints (PaddleOCR-VL / PP-StructureV3) with engine selection and API key settings.
- Indexed text now labels image captions explicitly for retrieval.
- Python env now defaults to a shared user cache folder so multiple vaults can reuse it.
- Added a setting to choose between shared and per-vault Python env locations.
- Python path now defaults to blank and auto-detects interpreters when setting up the env.
- Plugin now detects an already-running Redis instance on startup (when auto-start is off) and notifies the user.

## 0.3.4

- Sync markers now render as styled badges in reading view (page/section + sync start/end).
- Added command to drop and rebuild the Redis index from cached chunks.
- Drop & rebuild now proceeds if the Redis index does not exist yet.
- Added a command to purge Redis chunk keys that have no cached item/chunk JSON.
- Doc index pruning now runs after reindexing/purge to remove stale entries.
- Embedding now splits long chunks into subchunks (multi-vector) while keeping display chunks intact.
- Embedding subchunk size/overlap is now configurable; section chunk size/overlap settings removed.
- Chunk end markers now render as badges in reading/live preview.
- Retrieval now auto-broadens before the LLM when context is weak (chunk count, context length, vector score, narrative filter).
- Indexing now derives text from a Markdown AST (table/list-aware) instead of flattening display Markdown.
- Page chunks now reflow wrapped OCR/text-layer lines while preserving headings/lists/tables.
- New command: delete the active Zotero note plus cached chunks/items to prevent recreation.
- Lexical retrieval now searches title/authors/tags/chunk tags and preserves Unicode tokens.
- New command: search the Redis index for a term (shows matching chunks/metadata).
- Exact lexical hits are kept even if strict content filters would drop them.
- Short queries now increase vector k and hyphenated terms are split for lexical matching.
- Index reindexing now detects embedding model/provider errors and prompts to drop & rebuild the Redis index.
- Indexing now auto-detects embedding dimensions to avoid mismatch loops after model changes.
- GPT-5 family models now omit non-default temperatures for OCR cleanup/tagging to avoid API errors.
- Reindexing now writes progress/error output to the log file when file logging is enabled.
- Import/reindex/chat now warn early when Redis is unreachable to avoid half-finished notes.
- Reindexing now uses existing chunk tags only (no tag regeneration).
- Embedding inputs are now truncated to avoid model context overflows during reindex.
- Reindex logs now include the current doc_id:chunk_id for embedding/index steps.
- Recreate-missing-notes now logs doc_id progress and indexer chunk progress.
- Tag sanitization now offers Obsidian-style cases (camel/pascal/snake/kebab) instead of a custom separator.
- Frontmatter now supports `aliases` built from citekey/short title/DOI (when present).
- Zotero picker now flags items without processable PDFs even when only non-PDF attachments exist.
- Notes now auto-repair missing frontmatter `doc_id` values using sync markers or cached index entries.
- Redis indexing now extracts years correctly from Zotero item dates.

## 0.3.3
- Tag-aware retrieval boosting and tag regeneration in the chunk editor.
- Tag sanitization options for Obsidian (replace spaces or camelCase).
- Note body template is now editable (with PDF/docling placeholders).
- Frontmatter template: clarified YAML-safe suffixes and added item link/citekey defaults.
- Fix: Chat title generation avoids incompatible OpenAI calls.
- LLM provider profiles: model lists refresh on profile switch; delete control moved into its own row.

## 0.3.2
- Hoverbar now shows Lucide icons and tooltips on all buttons.
- Hoverbar: clean-chunk and open-in-Zotero actions added.
- Chunk cleanup progress is now surfaced in the status bar.
- Frontmatter no longer emits empty tag entries when Zotero has no tags.

## 0.3.1
- Improved Python error handling and auto-opened Settings for environment fixes.
- Frontmatter `pdf_link` now stores raw Zotero deeplinks (no markdown wrapper).
- Release package now includes `CHANGELOG.md`.

## 0.3.0
- Cursor-anchored chunk toolbar with Tags, Indexed preview, and Exclude/Include.
- Excluded chunks are removed from Redis but preserved in chunk JSON for easy re-include.
- Indexed preview now matches Redis text (markdown-to-text normalization).
- Expanded Zotero frontmatter support: editors, tags, collections, book/journal fields, identifiers, and abstract.
- Frontmatter template editor restored in Settings.
- PDF handling: embed only when copied to the vault; frontmatter `pdf_link` always uses Zotero deep link.
- Metadata-aware embeddings and optional LLM chunk tagging for richer retrieval.
