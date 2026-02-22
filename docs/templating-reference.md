# Templating Reference

This page is the complete reference for note templating in Zotero Research Assistant.

## Where templating is configured

In plugin settings:

- **Output → Frontmatter template**
- **Output → Note body template**

## Placeholder syntax

- Use placeholders like `{{name}}`.
- Optional spaces are allowed: `{{ name }}` also works.
- Use lowercase keys with underscores (for example, `{{short_title}}`).
- Unknown placeholders are replaced with an empty string.

## Frontmatter template behavior

- If the frontmatter template is blank, the plugin still writes frontmatter with `doc id`.
- Empty frontmatter fields are removed automatically (except `abstract`, which is preserved).
- For YAML-safe values, use `_yaml` placeholders (for example, `{{title_yaml}}`).
- `citekey` is part of metadata sync. Zotero -> note updates always apply (including Better BibTeX-generated keys). Note -> Zotero updates write native Zotero `citationKey` and also update `Citation Key: ...` in `Extra` for compatibility.

## Note body template behavior

- The default body template is `{{annotation_block}}{{docling_markdown}}`.
- `{{annotation_block}}` is generated only if the placeholder is present and an attachment key exists.
- If your body template does not include `{{docling_markdown}}`, the plugin appends Docling markdown automatically.
- If the rendered body is empty, the plugin falls back to default content (`PDF block + Docling markdown`).

## Core placeholders

These are the base placeholders available in templates:

| Placeholder | Description |
|---|---|
| `{{doc_id}}` | Internal document ID used by the plugin. |
| `{{zotero_key}}` | Zotero item key. |
| `{{item_link}}` | Zotero deep link to the item. |
| `{{citekey}}` | Citation key (when available). |
| `{{title}}` | Item title. |
| `{{short_title}}` | Short title. |
| `{{date}}` | Original date string. |
| `{{year}}` | 4-digit year when detected. |
| `{{year_number}}` | Strict numeric year (empty if unavailable). |
| `{{authors}}` | Authors joined with `; `. |
| `{{editors}}` | Editors joined with `; `. |
| `{{aliases}}` | Combined aliases (citekey/short title/DOI). |
| `{{tags}}` | Sanitized tags joined with `; `. |
| `{{collection_title}}` | Collection titles joined with `; `. |
| `{{collection_titles}}` | Alias of `collection_title`. |
| `{{collections_links}}` | Obsidian wiki links for collection titles, joined with `; `. |
| `{{item_type}}` | Zotero item type. |
| `{{creator_summary}}` | Creator summary from metadata. |
| `{{publication_title}}` | Publication title. |
| `{{book_title}}` | Book title. |
| `{{journal_abbrev}}` | Journal abbreviation. |
| `{{volume}}` | Volume. |
| `{{issue}}` | Issue. |
| `{{pages}}` | Pages field. |
| `{{date_added}}` | Zotero date added. |
| `{{date_modified}}` | Zotero date modified. |
| `{{doi}}` | DOI. |
| `{{isbn}}` | ISBN. |
| `{{issn}}` | ISSN. |
| `{{publisher}}` | Publisher. |
| `{{place}}` | Place. |
| `{{url}}` | URL. |
| `{{language}}` | Language. |
| `{{abstract}}` | Abstract note. |
| `{{pdf_link}}` | Link used for frontmatter PDF reference. |
| `{{item_json}}` | Wiki link to cached item JSON. |

## Auto-generated scalar variants

For every core placeholder above, these variants are also available:

- `{{<name>_yaml}}`
- `{{<name>_quoted}}`
- `{{<name>_text}}`

All three resolve to the same YAML-safe quoted value.

Examples:

- `{{title_yaml}}`
- `{{doi_yaml}}`
- `{{item_link_yaml}}`

## List placeholders

Use these when you want YAML list output:

| Placeholder | Description |
|---|---|
| `{{authors_yaml_list}}` | YAML list of authors. |
| `{{editors_yaml_list}}` | YAML list of editors. |
| `{{tags_yaml_list}}` | YAML list of sanitized tags. |
| `{{aliases_yaml_list}}` | YAML list of aliases. |
| `{{collections_yaml_list}}` | YAML list of collection titles. |
| `{{collections_links_yaml_list}}` | YAML list of collection wiki links. |
| `{{tags_raw}}` | Raw Zotero tags joined with `; ` (no sanitization). |
| `{{tags_raw_yaml}}` | YAML-safe quoted `tags_raw`. |
| `{{tags_raw_yaml_list}}` | YAML list of raw Zotero tags. |

Alias list placeholders:

- `{{authors_list}}` = `{{authors_yaml_list}}`
- `{{editors_list}}` = `{{editors_yaml_list}}`
- `{{tags_list}}` = `{{tags_yaml_list}}`
- `{{aliases_list}}` = `{{aliases_yaml_list}}`
- `{{collections_list}}` = `{{collections_yaml_list}}`
- `{{collections_links_list}}` = `{{collections_links_yaml_list}}`

## Note-body-specific placeholders

These are added for body rendering:

| Placeholder | Description |
|---|---|
| `{{pdf_block}}` | Prebuilt PDF line plus trailing blank line when available. |
| `{{pdf_line}}` | Single PDF line (no trailing blank line). |
| `{{annotation_block}}` | Full annotation block with start/end markers. |
| `{{docling_markdown}}` | Extracted Docling markdown content. |

All core placeholders are also available in the note body template.

## Minimal examples

Frontmatter template example:

```yaml
doc_id: {{doc_id}}
zotero_key: {{zotero_key}}
title: {{title_yaml}}
authors:
{{authors_yaml_list}}
tags:
{{tags_yaml_list}}
pdf_link: {{pdf_link_yaml}}
```

Note body template example:

```md
{{pdf_block}}
{{annotation_block}}
{{docling_markdown}}
```
