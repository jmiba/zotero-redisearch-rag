# Changelog

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
