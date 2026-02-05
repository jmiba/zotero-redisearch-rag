# Annotations

Annotations let you bring Zotero highlights and notes into Obsidian as readable callouts.

## Annotation callouts in notes
When you import or re‑sync an item, Zotero annotations are added to the note as callouts. This keeps your highlights and comments visible alongside the extracted text.

Edits you make inside synced annotation blocks are preserved unless you remove the annotation markers.

## Annotation images via Zotero companion
Area and drawing annotations are stored by Zotero as images. The Zotero companion makes those images available so the plugin can embed them in your notes.

When enabled:
- The plugin fetches annotation images during sync.
- Images are stored in a `zrr-annotations` folder next to your notes.
- Re‑sync updates images and removes stale ones.

## Companion install, health check, and settings
1. Download the companion XPI from **Settings → Maintenance → Zotero companion**.
2. Install it in Zotero: **Tools → Plugins → Install from File**.
3. Enable the companion in the plugin settings: **Annotations → Zotero companion**.

You can verify the setup with:
- **Command palette → Check Zotero companion status**
- **Command palette → Open Zotero Add‑ons**
