import { RangeSetBuilder } from "@codemirror/state";
import {
  Decoration,
  EditorView,
  ViewPlugin,
  WidgetType,
  type DecorationSet,
  type ViewUpdate,
} from "@codemirror/view";
import { setIcon } from "obsidian";
import {
  ZRR_CHUNK_START_RE,
  extractDocIdFromDoc,
  findChunkAtCursorInDoc,
  hasExcludeMarkerInRange,
  parseZrrBadgeInfo,
  type ZrrBadgeInfo,
} from "./chunkMarkers";

export type ChunkToolsActions = {
  cleanChunkFromToolbar: (startLine: number) => Promise<void> | void;
  openChunkTagEditor: (docId: string, chunkId: string) => Promise<void> | void;
  openChunkIndexedTextPreview: (docId: string, chunkId: string) => Promise<void> | void;
  openChunkInZotero: (docId: string, chunkId: string) => Promise<void> | void;
  toggleChunkExcludeFromToolbar: (startLine: number) => void;
};

const createZrrBadgeElement = (info: ZrrBadgeInfo, totalPages: number): HTMLElement | null => {
  const badge = document.createElement("div");
  badge.classList.add("zrr-sync-badge");
  if (info.type === "sync-start" || info.type === "sync-end") {
    badge.classList.add("zrr-sync-badge--sync");
    badge.classList.add(
      info.type === "sync-start" ? "zrr-sync-badge--sync-start" : "zrr-sync-badge--sync-end"
    );
    if (info.type === "sync-start") {
      badge.textContent = info.docId ? `Redis Index Sync start - ${info.docId}` : "Redis Index Sync start";
    } else {
      badge.textContent = "Redis Index Sync end";
    }
    return badge;
  }
  if (info.type === "chunk-end") {
    badge.classList.add("zrr-sync-badge--chunk-end");
    badge.textContent = info.chunkKind === "page" ? "Page end" : "Section end";
    if (info.chunkKind) {
      badge.classList.add(`zrr-sync-badge--${info.chunkKind}`);
    }
    return badge;
  }
  if (info.type !== "chunk-start") {
    return null;
  }
  badge.classList.add("zrr-sync-badge--chunk");
  if (info.chunkKind) {
    badge.classList.add(`zrr-sync-badge--${info.chunkKind}`);
  }
  if (info.excluded) {
    badge.classList.add("is-excluded");
  }
  if (info.pageNumber && totalPages > 0) {
    badge.textContent = `Page ${info.pageNumber}/${totalPages}`;
  } else if (info.pageNumber) {
    badge.textContent = `Page ${info.pageNumber}`;
  } else if (info.chunkId) {
    badge.textContent = `Section ${info.chunkId}`;
  } else {
    badge.textContent = "Section";
  }
  if (info.excluded) {
    badge.textContent = `${badge.textContent} - excluded`;
  }
  return badge;
};

class ChunkToolsWidget extends WidgetType {
  private plugin: ChunkToolsActions;
  private docId: string;
  private chunkId: string;
  private startLine: number;
  private excluded: boolean;

  constructor(
    plugin: ChunkToolsActions,
    docId: string,
    chunkId: string,
    startLine: number,
    excluded: boolean
  ) {
    super();
    this.plugin = plugin;
    this.docId = docId;
    this.chunkId = chunkId;
    this.startLine = startLine;
    this.excluded = excluded;
  }

  eq(other: ChunkToolsWidget): boolean {
    return (
      this.docId === other.docId
      && this.chunkId === other.chunkId
      && this.startLine === other.startLine
      && this.excluded === other.excluded
    );
  }

  toDOM(): HTMLElement {
    const wrap = document.createElement("span");
    wrap.className = "zrr-chunk-toolbar";
    wrap.setAttribute("data-chunk-id", this.chunkId);

    const applyTooltip = (el: HTMLElement, text: string): void => {
      el.setAttribute("title", text);
      el.setAttribute("aria-label", text);
      el.setAttribute("data-tooltip-position", "top");
    };

    const applyButtonIcon = (button: HTMLButtonElement, iconName: string, label: string): void => {
      const iconEl = document.createElement("span");
      iconEl.className = "zrr-chunk-button-icon";
      setIcon(iconEl, iconName);
      const textEl = document.createElement("span");
      textEl.className = "zrr-chunk-button-label";
      textEl.textContent = label;
      button.appendChild(iconEl);
      button.appendChild(textEl);
    };

    const clean = document.createElement("button");
    clean.type = "button";
    clean.className = "zrr-chunk-button";
    applyButtonIcon(clean, "sparkles", "Clean");
    applyTooltip(clean, "Clean this chunk with the OCR cleanup model");
    clean.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      void this.plugin.cleanChunkFromToolbar(this.startLine);
    });
    wrap.appendChild(clean);

    const tags = document.createElement("button");
    tags.type = "button";
    tags.className = "zrr-chunk-button";
    applyButtonIcon(tags, "tag", "Tags");
    applyTooltip(tags, "Edit chunk tags");
    tags.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      void this.plugin.openChunkTagEditor(this.docId, this.chunkId);
    });
    wrap.appendChild(tags);

    const preview = document.createElement("button");
    preview.type = "button";
    preview.className = "zrr-chunk-button";
    applyButtonIcon(preview, "search", "Indexed");
    applyTooltip(preview, "Preview indexed chunk text");
    preview.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      void this.plugin.openChunkIndexedTextPreview(this.docId, this.chunkId);
    });
    wrap.appendChild(preview);

    const zotero = document.createElement("button");
    zotero.type = "button";
    zotero.className = "zrr-chunk-button";
    applyButtonIcon(zotero, "external-link", "Zotero");
    applyTooltip(zotero, "Open this page in Zotero");
    zotero.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      void this.plugin.openChunkInZotero(this.docId, this.chunkId);
    });
    wrap.appendChild(zotero);

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "zrr-chunk-button";
    const toggleLabel = this.excluded ? "Include" : "Exclude";
    const toggleIcon = this.excluded ? "check" : "ban";
    applyButtonIcon(toggle, toggleIcon, toggleLabel);
    applyTooltip(
      toggle,
      this.excluded ? "Include this chunk in the index" : "Exclude this chunk from the index"
    );
    toggle.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.plugin.toggleChunkExcludeFromToolbar(this.startLine);
    });
    wrap.appendChild(toggle);

    return wrap;
  }

  ignoreEvent(): boolean {
    return true;
  }
}

const buildChunkToolsDecorations = (
  view: EditorView,
  plugin: ChunkToolsActions
): DecorationSet => {
  const doc = view.state.doc;
  const docId = extractDocIdFromDoc(doc);
  if (!docId) {
    return Decoration.none;
  }
  const cursorPos = view.state.selection.main.head;
  const cursorLine = doc.lineAt(cursorPos).number;
  const chunk = findChunkAtCursorInDoc(doc, cursorLine);
  if (!chunk) {
    return Decoration.none;
  }
  const startMatch = chunk.text.match(ZRR_CHUNK_START_RE);
  if (!startMatch) {
    return Decoration.none;
  }
  const attrs = (startMatch[1] ?? "").trim();
  const idMatch = attrs.match(/id=(["']?)([^"'\s]+)\1/i);
  if (!idMatch) {
    return Decoration.none;
  }
  const chunkId = idMatch[2].trim();
  if (!chunkId) {
    return Decoration.none;
  }
  const hasExcludeAttr = /\bexclude\b/i.test(attrs) || /\bdelete\b/i.test(attrs);
  const hasExcludeMarker = hasExcludeMarkerInRange(doc, chunk.startLine + 1, chunk.endLine - 1);
  const excluded = hasExcludeAttr || hasExcludeMarker;
  const line = doc.line(chunk.startLine);
  const widget = Decoration.widget({
    widget: new ChunkToolsWidget(plugin, docId, chunkId, chunk.startLine, excluded),
    side: 1,
  });
  return Decoration.set([widget.range(line.to)]);
};

class ZrrBadgeWidget extends WidgetType {
  private info: ZrrBadgeInfo;
  private totalPages: number;

  constructor(info: ZrrBadgeInfo, totalPages: number) {
    super();
    this.info = info;
    this.totalPages = totalPages;
  }

  toDOM(): HTMLElement {
    return createZrrBadgeElement(this.info, this.totalPages) ?? document.createElement("span");
  }
}

const buildSyncBadgeDecorations = (view: EditorView): DecorationSet => {
  const sourceView = view.dom.closest(".markdown-source-view");
  if (!sourceView || !sourceView.classList.contains("is-live-preview")) {
    return Decoration.none;
  }
  const doc = view.state.doc;
  const builder = new RangeSetBuilder<Decoration>();
  const entries: Array<{ line: number; from: number; to: number; info: ZrrBadgeInfo }> = [];
  const pageNumbers: number[] = [];
  let hasPageChunks = false;
  for (let lineNo = 1; lineNo <= doc.lines; lineNo += 1) {
    const line = doc.line(lineNo);
    const match = line.text.match(/<!--\s*([^>]*)\s*-->/);
    if (!match) {
      continue;
    }
    const info = parseZrrBadgeInfo(match[1]);
    if (!info) {
      continue;
    }
    if (info.type === "chunk-start") {
      info.chunkKind = info.chunkKind ?? (info.pageNumber ? "page" : "section");
      if (info.pageNumber) {
        hasPageChunks = true;
      }
    } else if (info.type === "chunk-end") {
      info.chunkKind = info.chunkKind ?? "section";
    }
    entries.push({ line: lineNo, from: line.from, to: line.to, info });
    if (info.pageNumber) {
      pageNumbers.push(info.pageNumber);
    }
  }
  if (!entries.length) {
    return Decoration.none;
  }
  if (hasPageChunks) {
    for (const entry of entries) {
      if (entry.info.type === "chunk-end") {
        entry.info.chunkKind = "page";
      }
    }
  }
  const totalPages = pageNumbers.length ? Math.max(...pageNumbers) : 0;

  for (const entry of entries) {
    const widget = Decoration.replace({
      widget: new ZrrBadgeWidget(entry.info, totalPages),
    });
    builder.add(entry.from, entry.to, widget);
  }
  return builder.finish();
};

export const createSyncBadgeExtension = (): ViewPlugin<{
  decorations: DecorationSet;
}> =>
  ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = buildSyncBadgeDecorations(view);
      }

      update(update: ViewUpdate): void {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = buildSyncBadgeDecorations(update.view);
        }
      }
    },
    {
      decorations: (value) => value.decorations,
    }
  );

export const createChunkToolsExtension = (plugin: ChunkToolsActions): ViewPlugin<{
  decorations: DecorationSet;
}> =>
  ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = buildChunkToolsDecorations(view, plugin);
      }

      update(update: ViewUpdate): void {
        if (update.docChanged || update.selectionSet || update.viewportChanged) {
          this.decorations = buildChunkToolsDecorations(update.view, plugin);
        }
      }
    },
    {
      decorations: (value) => value.decorations,
    }
  );
