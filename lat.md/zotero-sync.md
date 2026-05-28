# Zotero Sync

Zotero sync keeps bibliographic metadata and annotations aligned between Zotero items and editable Obsidian notes.

The sync layer supports local and Web API reads, selective writes back to Zotero, conflict prompts, snapshots, annotation images, and citekey handling. It depends on the identity rules in [[architecture#Zotero Data Boundary]].

## Identity Model

`doc_id`, Zotero item keys, and attachment keys identify the same imported document across storage systems.

`doc_id` is derived from Zotero item data and stored in note frontmatter, item cache, chunk cache, doc index entries, sync markers, annotation blocks, and Redis records. Attachment keys are kept for PDF deep links and annotation lookups.

## Metadata Sync

Metadata sync compares note frontmatter, Zotero fields, and the last stored snapshot before choosing an update direction.

Tracked fields include titles, citekey, date, abstract, DOI, publication data, pages, item type, language, tags, authors, and editors. If a field is missing in the note and present in Zotero, the note is filled. If a writable core field is new in the note and empty in Zotero, it can be pushed back.

Tag sync is intentionally conservative. Note metadata sync reads only frontmatter `tags`, sanitizes both note and Zotero tag lists into Obsidian-safe forms before comparison, and does not auto-merge two changed tag sets. If both sides changed after the snapshot, the user must choose which side wins.

When both sides changed since the snapshot, the plugin prompts for a field-level decision instead of silently choosing a winner.

Generated and recreated notes schedule metadata sync after the note write, so snapshots include generated frontmatter values such as language before later one-sided edits are compared.

## Frontmatter Template

The frontmatter template defines what metadata appears in the generated note and how values are escaped.

Templates use placeholders such as `{{doc_id}}`, `{{citekey}}`, `{{title_yaml}}`, `{{authors_yaml_list}}`, and `{{collections_links_list}}`. YAML-specific suffixes should be used in frontmatter so Zotero strings, lists, and Obsidian links remain parseable.

The renderer removes empty generated fields, preserves `abstract`, normalizes key spacing, and always ensures `doc_id` exists.

## Citekey Rules

Citekeys are treated as first-class metadata because users often rely on Better BibTeX keys in Obsidian.

The plugin resolves citekeys from item data, Zotero metadata, CSL JSON, and Extra-field conventions. Zotero to note citekey sync always applies when a Zotero key is available. Note to Zotero writes Zotero's native `citationKey` and updates `Citation Key: ...` in Extra for compatibility.

## Annotation Sync

Annotation sync keeps Zotero annotation state and the note annotation block aligned while preserving user edits when possible.

The note block is delimited by `zrr:annotations-start` and `zrr:annotations-end`. The plugin fetches annotation items for the resolved attachment, groups them by configured color headings, renders callouts, compares against snapshots, and writes note edits back to Zotero when the note changed alone.

Annotation tag sync is separate from metadata tag sync. Annotation blocks parse explicit `Tags:` lines inside the annotation block rather than arbitrary inline hashtags elsewhere in the note body.

Conflicts between note and Zotero annotation edits are surfaced in a batch decision modal.

## Annotation Images

Image and ink annotations can be embedded in Obsidian when image payloads are available.

The plugin first uses image payloads returned by Zotero APIs. If Zotero does not expose a payload and companion support is enabled, it asks [[companion-addon#Image Endpoint]] for the cached image. Images are written under a `zrr-annotations` folder near the note and stale image files are removed.

## Snapshots And Suppression

Snapshots make sync directional and suppression avoids loops after programmatic note writes.

Metadata snapshots live under `.zotero-redisearch-rag/metadata_snapshots.json` and annotation snapshots under `.zotero-redisearch-rag/annotation_snapshots.json`. In-flight and suppressed file sets prevent repeated sync while the plugin is applying its own note changes.
