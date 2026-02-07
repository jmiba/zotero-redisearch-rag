# Custom Callouts

This guide explains how to build your own annotation callout style in Obsidian.

## How this plugin generates callouts

Annotation callouts are written in standard Obsidian callout syntax:

```md
> [!your-callout-id] Page [12](zotero://...)
> Highlight text...
```

The callout ID comes from **Settings → Annotations → Color map**.

## 1) Map Zotero highlight colors to callout IDs

In plugin settings:

1. Open **Annotations**.
2. In **Color map**, set a `callout` value for each Zotero color (for example, `theory`, `method`, `quote`, `counterpoint`).
3. Re-sync or re-import a note so annotations are regenerated with your callout IDs.

You can also customize the section `heading` per color in the same table.

## 2) Style those callouts in Obsidian

Create a CSS snippet in your vault:

- Path: `.obsidian/snippets/custom-callouts.css`

Example:

```css
.callout[data-callout="theory"] {
  --callout-color: 59, 130, 246;
  --callout-icon: lucide-lightbulb;
}

.callout[data-callout="method"] {
  --callout-color: 16, 185, 129;
  --callout-icon: lucide-flask-conical;
}

.callout[data-callout="quote"] {
  --callout-color: 245, 158, 11;
  --callout-icon: lucide-quote;
}
```

Then enable it in **Settings → Appearance → CSS snippets**.

## 3) Optional: use a callout customization plugin

If you prefer UI-driven editing instead of CSS, use an Obsidian community plugin that manages callout styles/icons.  
The Zotero Redis RAG plugin only emits standard callout syntax, so it works with any callout-styling approach.

## Tips

- Keep callout IDs lowercase and simple (for example, `theory-note`).
- Use the same callout IDs across vaults/themes for consistency.
- After changing color map values, re-sync annotations so existing notes update.
