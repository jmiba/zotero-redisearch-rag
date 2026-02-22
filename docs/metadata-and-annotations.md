# Metadata and Annotations

Bibliographic metadata and annotations are synced between Zotero and Obsidian.

## Sync triggers

Metadata and annotation sync is scheduled when:

- A Zotero note is opened in Obsidian.
- A Zotero note is modified and saved in Obsidian.
- An item is imported or re-synced.

The plugin uses internal suppression windows to avoid write loops after it updates the note itself.

## Metadata fields tracked

Bidirectional metadata fields:

- `title`
- `short_title`
- `citekey`
- `date`
- `abstract`
- `doi`
- `publisher`
- `place`
- `issue`
- `volume`
- `pages`
- `item_type`
- `tags`
- `authors`
- `editors`

`citekey` note -> Zotero writes to Zotero `Extra` as `Citation Key: ...`.

## Metadata key matching in YAML

The plugin recognizes canonical keys and common variants, for example:

- `short title`, `short_title`, `short-title`, `shortTitle`
- `item type`, `item_type`, `item-type`, `itemType`

When writing updates to the note, the plugin normalizes to canonical frontmatter keys.

## Metadata conflict model

The plugin compares note value, Zotero value, and a stored snapshot value per field:

- If only the note changed since snapshot, note wins and Zotero is updated.
- If only Zotero changed since snapshot, Zotero wins and note is updated.
- If both changed, the plugin asks for a conflict decision.

After applying decisions, the snapshot is updated.

## Auto-create behavior for newly populated fields

When a field has no snapshot entry yet (first-time or newly introduced):

- Zotero -> Obsidian auto-create:
  - If note is empty/missing and Zotero has a value, the field is created in YAML.
- Obsidian -> Zotero auto-create (core bibliographic fields only):
  - If note has a value and Zotero is empty, note is pushed to Zotero for:
  - `title`, `short_title`, `citekey`, `date`, `abstract`, `doi`, `publisher`, `place`, `issue`, `volume`, `pages`, `item_type`, `authors`, `editors`

`tags` are tracked bidirectionally but are not in the one-sided note -> Zotero auto-create subset.

## Annotation sync behavior

When annotation sync runs:

- Zotero annotations are rendered as callouts inside the annotation block.
- Callout grouping uses the configured color map.
- Annotation text/comment/tags are snapshot-tracked for two-way sync.
- User edits in callouts are preserved unless markers/anchors are removed.

If the note and Zotero diverge for the same annotation, batch conflict prompts are shown.

## Annotation images (rect/image/ink)

For image-like annotations:

- The plugin attempts to fetch image payloads from Zotero APIs.
- If enabled, it falls back to the local Zotero companion service.
- Images are written into `zrr-annotations` next to note output.
- Re-sync keeps current files and removes stale image files.

Companion setup:

1. Install `zrr-companion.xpi` in Zotero.
2. Enable companion support in Obsidian Settings -> Annotations.
3. Verify with command palette: `Check Zotero companion status`.

## Known limits

- If an annotation marker block is deleted, that sync target is treated as removed.
- Companion image fetch depends on Zotero cache availability for image/ink annotations.
- Web API write-back depends on valid Web API credentials and library scope.

## Related docs

- [Custom Callouts](custom-callouts.md)
- [Settings Reference](settings-reference.md)
- [Templating Reference](templating-reference.md)
