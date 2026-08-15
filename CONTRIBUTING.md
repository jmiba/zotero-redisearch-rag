# Contributing to Zotero Research Assistant

Thanks for contributing. This project spans an Obsidian plugin, Zotero integration, Redis-backed retrieval, and Python-based PDF processing, so small, well-scoped changes are easier to review and safer to ship.

## Ways to contribute

- Report bugs with clear reproduction steps and logs.
- Suggest features with the concrete workflow problem you want to solve.
- Improve documentation, setup instructions, and troubleshooting notes.
- Submit focused code changes with tests or manual verification notes.

## Before you start

Please open or find an issue before starting larger work. That keeps effort aligned with the current roadmap and avoids duplicate implementation.

Bug reports are most useful when they include:

- Obsidian version
- plugin version
- Zotero version
- Docker or Podman version, if relevant
- model provider and model used, if relevant
- operating system
- exact command or workflow that failed
- relevant logs or screenshots

## Development setup

### Plugin build

```bash
npm install
npm run build
```

This builds `main.js` and refreshes bundled tool assets used by the plugin.

### Optional local Python setup

The recommended runtime for users is the worker container, but local Python remains useful for developing Docling and OCR tooling.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Project layout

- `src/`: Obsidian plugin source
- `tools/`: bundled Python helpers and worker entrypoints
- `tests/`: Python tests for Docling and OCR processing behavior
- `docs/`: user-facing documentation
- `lat.md/`: architecture, behavior, and test knowledge graph
- `zotero-companion/`: Zotero companion add-on assets

Start with these files when orienting yourself:

- `README.md`
- `docs/quick-start.md`
- `docs/python-setup.md`
- `lat.md/architecture.md`
- `lat.md/rag-pipeline.md`
- `AGENTS.md`

## Common commands

```bash
npm run lint
npm run build
npm run package-release
python3 -m unittest discover -s tests -p 'test_*.py'
lat check
```

Use them selectively:

- Run `npm run lint` for TypeScript changes.
- Run `npm run build` whenever plugin code or bundled tool assets change.
- Run `python3 -m unittest discover -s tests -p 'test_*.py'` when touching `tools/docling_extract.py` or related OCR and cleanup logic.
- Run `npm run package-release` only when preparing a release build.
- Run `lat check` before finishing any task.

## Working with `lat.md`

This repo uses `lat.md/` as an architecture and behavior map. If you change functionality, architecture, tests, or behavior, update the relevant `lat.md` page in the same change.

Useful commands:

```bash
lat search "your topic"
lat locate "Section Name"
lat refs "file#Section"
lat check
```

Keep these rules in mind:

- Every `lat.md` section needs a short leading paragraph.
- Add `@lat:` references in code or tests where behavior is intentionally covered.
- Do not leave broken wiki links or code references behind.

## Pull request guidance

Please keep pull requests narrow in scope. A good PR usually does one thing:

- one bug fix
- one feature
- one refactor with no behavior change
- one documentation improvement

Include:

- what changed
- why it changed
- how you verified it
- screenshots or short recordings for UI changes when helpful

Avoid mixing unrelated cleanup into the same PR.

## Testing expectations

The right test depth depends on the change:

- TypeScript/UI changes: run `npm run lint`, `npm run build`, and describe manual Obsidian verification.
- Import pipeline or Docling changes: run the Python unit tests and describe at least one manual import scenario if behavior changed.
- Documentation-only changes: no build is required, but links and commands should be checked.

Important integration gaps are documented in `lat.md/tests.md`. If you close one of those gaps, update the page and add the corresponding test coverage.

## Documentation changes

Documentation improvements are welcome and do not need to wait for a code change. If you fix setup steps, update both the closest detailed page in `docs/` and any higher-level entry points that point to it.

## Release changes

Version bumps, `CHANGELOG.md`, and `src/releaseNotes.ts` updates are usually maintainer tasks. Do not bundle release prep into a normal contribution unless the work was explicitly requested.

Release assets must be reproducible from the tagged commit. Prepare and commit `src/releaseNotes.ts` before creating the version tag; the release workflow intentionally does not rewrite source from the GitHub release body. Run `npm run package-release` before tagging and confirm that the generated `main.js`, `manifest.json`, `styles.css`, and `src/toolAssets.ts` are committed. Release tags use the bare version number, for example `1.0.8`, without a leading `v`.
