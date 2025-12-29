import {
  App,
  FileSystemAdapter,
  Editor,
  MarkdownRenderer,
  MarkdownView,
  Modal,
  Notice,
  Plugin,
  SuggestModal,
  TFile,
  WorkspaceLeaf,
  addIcon,
  setIcon,
  normalizePath,
} from "obsidian";
import { EditorState, RangeSetBuilder, Text } from "@codemirror/state";
import {
  Decoration,
  EditorView,
  ViewPlugin,
  WidgetType,
  type DecorationSet,
  type ViewUpdate,
} from "@codemirror/view";
import { spawn, type ChildProcess } from "child_process";
import { promises as fs, existsSync } from "fs";
import http from "http";
import https from "https";
import net from "net";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { createHash } from "crypto";
import {
  CHUNK_CACHE_DIR,
  CACHE_ROOT,
  DEFAULT_SETTINGS,
  ITEM_CACHE_DIR,
  ZoteroRagSettingTab,
  ZoteroRagSettings,
} from "./settings";
import { ICON_ASSETS } from "./iconAssets";
import { TOOL_ASSETS } from "./toolAssets";
import { VIEW_TYPE_ZOTERO_CHAT, ZoteroChatView } from "./chatView";
import type { ChatCitation, ChatMessage, ChatRetrievedChunk } from "./chatView";

type ZoteroItemValues = Record<string, any> & { version?: number };

type ZoteroLocalItem = {
  key: string;
  data: Record<string, any>;
  meta?: Record<string, any>;
};

type PdfAttachment = {
  key: string;
  filePath?: string;
};

type DocIndexEntry = {
  doc_id: string;
  note_path: string;
  note_title: string;
  zotero_title?: string;
  pdf_path?: string;
  attachment_key?: string;
  updated_at: string;
};

type LanguageOption = {
  label: string;
  value: string;
};

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { label: "Auto (no hint)", value: "" },
  { label: "English (en)", value: "en" },
  { label: "German (de)", value: "de" },
  { label: "German + English (de,en)", value: "de,en" },
  { label: "French (fr)", value: "fr" },
  { label: "Spanish (es)", value: "es" },
  { label: "Italian (it)", value: "it" },
  { label: "Dutch (nl)", value: "nl" },
  { label: "Portuguese (pt)", value: "pt" },
  { label: "Polish (pl)", value: "pl" },
  { label: "Swedish (sv)", value: "sv" },
  { label: "Other (custom ISO code)", value: "__custom__" },
];

const ISO_639_1_TO_3: Record<string, string> = {
  en: "eng",
  de: "deu",
  fr: "fra",
  es: "spa",
  it: "ita",
  nl: "nld",
  pt: "por",
  pl: "pol",
  sv: "swe",
};

const ZRR_PICKER_ICON = ICON_ASSETS["zrr-picker"];
const ZRR_CHAT_ICON = ICON_ASSETS["zrr-chat"];

type ParsedChunkBlock = {
  chunkId: string;
  text: string;
  excludeFlag: boolean;
};

const ZRR_SYNC_START_RE = /<!--\s*zrr:sync-start[^>]*-->/i;
const ZRR_SYNC_END_RE = /<!--\s*zrr:sync-end\s*-->/i;
const ZRR_CHUNK_START_RE = /<!--\s*zrr:chunk\b([^>]*)-->/i;
const ZRR_CHUNK_END_RE = /<!--\s*zrr:chunk\s+end\s*-->/i;
const ZRR_CHUNK_EXCLUDE_ANY_RE = /<!--\s*zrr:(?:exclude|delete)\s*-->/i;

class TextPromptModal extends Modal {
  private titleText: string;
  private placeholder: string;
  private onSubmit: (value: string) => void;
  private emptyMessage: string;

  constructor(
    app: App,
    titleText: string,
    placeholder: string,
    onSubmit: (value: string) => void,
    emptyMessage = "Value cannot be empty."
  ) {
    super(app);
    this.titleText = titleText;
    this.placeholder = placeholder;
    this.onSubmit = onSubmit;
    this.emptyMessage = emptyMessage;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: this.titleText });

    const input = contentEl.createEl("input", {
      type: "text",
      placeholder: this.placeholder,
    });
    input.style.width = "100%";
    input.focus();

    const submit = contentEl.createEl("button", { text: "Submit" });
    submit.style.marginTop = "0.75rem";

    const submitValue = (): void => {
      const value = input.value.trim();
      if (!value) {
        new Notice(this.emptyMessage);
        return;
      }
      this.close();
      this.onSubmit(value);
    };

    submit.addEventListener("click", submitValue);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        submitValue();
      }
    });
  }
}

class ChunkTagModal extends Modal {
  private chunkId: string;
  private initialTags: string[];
  private onSubmit: (tags: string[]) => void;

  constructor(app: App, chunkId: string, initialTags: string[], onSubmit: (tags: string[]) => void) {
    super(app);
    this.chunkId = chunkId;
    this.initialTags = initialTags;
    this.onSubmit = onSubmit;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: `Edit tags for ${this.chunkId}` });

    const input = contentEl.createEl("textarea", {
      attr: { rows: "3" },
    });
    input.style.width = "100%";
    input.placeholder = "tag1, tag2, tag3";
    input.value = this.initialTags.join(", ");
    input.focus();

    const submit = contentEl.createEl("button", { text: "Save tags" });
    submit.style.marginTop = "0.75rem";

    const handleSubmit = (): void => {
      const raw = input.value || "";
      const tags = raw
        .split(/[,;\n]+/)
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
      const unique = Array.from(new Set(tags));
      this.close();
      this.onSubmit(unique);
    };

    submit.addEventListener("click", handleSubmit);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        handleSubmit();
      }
    });
  }
}

class ChunkTextPreviewModal extends Modal {
  private titleText: string;
  private content: string;

  constructor(app: App, titleText: string, content: string) {
    super(app);
    this.titleText = titleText;
    this.content = content;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: this.titleText });
    const area = contentEl.createEl("textarea", {
      attr: { rows: "12", readonly: "true" },
    });
    area.style.width = "100%";
    area.value = this.content;
  }
}

const getLogLineClass = (text: string): string | null => {
  if (text.includes("STDERR")) {
    return "zrr-log-stderr";
  }
  if (text.includes("ERROR")) {
    return "zrr-log-error";
  }
  if (text.includes("WARNING") || text.includes("WARN")) {
    return "zrr-log-warning";
  }
  if (text.includes("INFO")) {
    return "zrr-log-info";
  }
  return null;
};

const buildLogDecorations = (view: EditorView): DecorationSet => {
  const builder = new RangeSetBuilder<Decoration>();
  for (const { from, to } of view.visibleRanges) {
    let pos = from;
    while (pos <= to) {
      const line = view.state.doc.lineAt(pos);
      const className = getLogLineClass(line.text);
      if (className) {
        builder.add(line.from, line.from, Decoration.line({ class: className }));
      }
      pos = line.to + 1;
    }
  }
  return builder.finish();
};

const LOG_THEME = EditorView.theme({
  ".cm-editor": {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    minHeight: "0",
  },
  ".cm-scroller": {
    fontFamily: "var(--font-monospace)",
    fontSize: "0.85rem",
    flex: "1",
    height: "100%",
    maxHeight: "100%",
    overflow: "auto",
  },
  ".zrr-log-error": { color: "var(--text-error)" },
  ".zrr-log-warning": { color: "var(--text-accent)" },
  ".zrr-log-info": { color: "var(--text-muted)" },
  ".zrr-log-stderr": { color: "var(--text-accent)" },
});

const extractDocIdFromDoc = (doc: Text): string | null => {
  for (let line = 1; line <= doc.lines; line += 1) {
    const text = doc.line(line).text;
    if (ZRR_SYNC_START_RE.test(text)) {
      const docMatch = text.match(/doc_id=([\"']?)([^\"'\s]+)\1/i);
      return docMatch ? docMatch[2].trim() : null;
    }
  }
  return null;
};

const findChunkStartLineInDoc = (
  doc: Text,
  fromLine: number
): { line: number; text: string } | null => {
  let line = fromLine;
  for (; line >= 1; line -= 1) {
    const text = doc.line(line).text;
    if (ZRR_CHUNK_START_RE.test(text)) {
      return { line, text };
    }
    if (ZRR_SYNC_START_RE.test(text) || ZRR_SYNC_END_RE.test(text)) {
      break;
    }
  }
  return null;
};

const findChunkEndLineInDoc = (doc: Text, fromLine: number): number | null => {
  for (let line = fromLine; line <= doc.lines; line += 1) {
    const text = doc.line(line).text;
    if (ZRR_CHUNK_END_RE.test(text)) {
      return line;
    }
    if (ZRR_SYNC_END_RE.test(text)) {
      break;
    }
  }
  return null;
};

const findChunkAtCursorInDoc = (
  doc: Text,
  cursorLine: number
): { startLine: number; endLine: number; text: string } | null => {
  const start = findChunkStartLineInDoc(doc, cursorLine);
  if (!start) {
    return null;
  }
  const endLine = findChunkEndLineInDoc(doc, start.line + 1);
  if (endLine === null || cursorLine < start.line || cursorLine > endLine) {
    return null;
  }
  return { startLine: start.line, endLine, text: start.text };
};

const hasExcludeMarkerInRange = (doc: Text, startLine: number, endLine: number): boolean => {
  if (startLine > endLine) {
    return false;
  }
  for (let line = startLine; line <= endLine; line += 1) {
    const text = doc.line(line).text;
    if (ZRR_CHUNK_EXCLUDE_ANY_RE.test(text)) {
      return true;
    }
  }
  return false;
};

class ChunkToolsWidget extends WidgetType {
  private plugin: ZoteroRagPlugin;
  private docId: string;
  private chunkId: string;
  private startLine: number;
  private excluded: boolean;

  constructor(
    plugin: ZoteroRagPlugin,
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
  plugin: ZoteroRagPlugin
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
  const idMatch = attrs.match(/id=([\"']?)([^\"'\s]+)\1/i);
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

const createChunkToolsExtension = (plugin: ZoteroRagPlugin): ViewPlugin<{
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

const LOG_HIGHLIGHT_PLUGIN = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = buildLogDecorations(view);
    }
    update(update: ViewUpdate): void {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildLogDecorations(update.view);
      }
    }
  },
  {
    decorations: (value) => value.decorations,
  }
);

type OutputModalOptions = {
  autoRefresh?: boolean;
  refreshIntervalMs?: number;
  onRefresh?: () => Promise<string>;
  onClear?: () => Promise<void>;
  clearLabel?: string;
};

class OutputModal extends Modal {
  private titleText: string;
  private bodyText: string;
  private editorView?: EditorView;
  private refreshTimer?: number;
  private options?: OutputModalOptions;

  constructor(app: App, titleText: string, bodyText: string, options?: OutputModalOptions) {
    super(app);
    this.titleText = titleText;
    this.bodyText = bodyText;
    this.options = options;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    if (this.modalEl) {
      this.modalEl.style.width = "80vw";
      this.modalEl.style.maxWidth = "1200px";
      this.modalEl.style.height = "80vh";
      this.modalEl.style.maxHeight = "90vh";
      this.modalEl.style.resize = "both";
      this.modalEl.style.overflow = "hidden";
    }
    contentEl.style.display = "flex";
    contentEl.style.flexDirection = "column";
    contentEl.style.height = "100%";
    contentEl.style.overflow = "hidden";
    contentEl.style.minHeight = "0";

    const header = contentEl.createDiv();
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.justifyContent = "space-between";
    header.style.gap = "0.5rem";
    header.createEl("h3", { text: this.titleText });
    const actions = header.createDiv();
    actions.style.display = "flex";
    actions.style.gap = "0.5rem";
    if (this.options?.onClear) {
      const clearLabel = this.options.clearLabel ?? "Clear log";
      const clearButton = actions.createEl("button", { text: clearLabel });
      clearButton.addEventListener("click", async () => {
        try {
          await this.options?.onClear?.();
        } finally {
          await this.refreshFromSource();
        }
      });
    }
    const editorWrap = contentEl.createDiv();
    editorWrap.style.flex = "1 1 0";
    editorWrap.style.minHeight = "0";
    editorWrap.style.border = "1px solid var(--background-modifier-border)";
    editorWrap.style.borderRadius = "6px";
    editorWrap.style.display = "flex";
    editorWrap.style.flexDirection = "column";
    editorWrap.style.overflow = "auto";

    const state = EditorState.create({
      doc: this.bodyText,
      extensions: [
        LOG_THEME,
        LOG_HIGHLIGHT_PLUGIN,
        EditorView.editable.of(true),
        EditorState.readOnly.of(false),
        EditorView.lineWrapping,
      ],
    });

    this.editorView = new EditorView({
      state,
      parent: editorWrap,
    });

    void this.refreshFromSource();
    if (this.options?.autoRefresh && this.options.onRefresh) {
      const intervalMs = this.options.refreshIntervalMs ?? 2000;
      this.refreshTimer = window.setInterval(() => {
        void this.refreshFromSource();
      }, intervalMs);
    }
  }

  onClose(): void {
    if (this.refreshTimer !== undefined) {
      window.clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
    this.editorView?.destroy();
    this.editorView = undefined;
  }

  private async refreshFromSource(): Promise<void> {
    if (!this.options?.onRefresh || !this.editorView) {
      return;
    }
    let nextText = "";
    try {
      nextText = (await this.options.onRefresh()) || "";
    } catch {
      return;
    }
    if (nextText === this.bodyText) {
      return;
    }
    const view = this.editorView;
    const scrollTop = view.scrollDOM.scrollTop;
    const selection = view.state.selection.main;
    const maxPos = nextText.length;
    const anchor = Math.min(selection.anchor, maxPos);
    const head = Math.min(selection.head, maxPos);
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: nextText },
      selection: { anchor, head },
    });
    view.scrollDOM.scrollTop = scrollTop;
    this.bodyText = nextText;
  }
}

class ConfirmOverwriteModal extends Modal {
  private filePath: string;
  private onResolve: (confirmed: boolean) => void;
  private resolved = false;

  constructor(app: App, filePath: string, onResolve: (confirmed: boolean) => void) {
    super(app);
    this.filePath = filePath;
    this.onResolve = onResolve;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: "Overwrite existing note?" });
    contentEl.createEl("p", {
      text: `This will overwrite: ${this.filePath}`,
    });
    const actions = contentEl.createEl("div");
    actions.style.display = "flex";
    actions.style.gap = "0.5rem";
    actions.style.marginTop = "0.75rem";
    const cancel = actions.createEl("button", { text: "Cancel" });
    const confirm = actions.createEl("button", { text: "Overwrite" });
    cancel.addEventListener("click", () => {
      this.resolved = true;
      this.close();
      this.onResolve(false);
    });
    confirm.addEventListener("click", () => {
      this.resolved = true;
      this.close();
      this.onResolve(true);
    });
  }

  onClose(): void {
    if (!this.resolved) {
      this.onResolve(false);
    }
  }
}

class LanguageSuggestModal extends SuggestModal<LanguageOption> {
  private resolveSelection: (value: string | null) => void;
  private resolved = false;

  constructor(app: App, onSelect: (value: string | null) => void) {
    super(app);
    this.resolveSelection = onSelect;
    this.setPlaceholder("Select a language for OCR/quality...");
  }

  getSuggestions(query: string): LanguageOption[] {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return LANGUAGE_OPTIONS;
    }
    return LANGUAGE_OPTIONS.filter(
      (option) =>
        option.label.toLowerCase().includes(trimmed) ||
        option.value.toLowerCase().includes(trimmed)
    );
  }

  renderSuggestion(option: LanguageOption, el: HTMLElement): void {
    el.setText(option.label);
    el.addEventListener("click", () => this.handleSelection(option));
  }

  onChooseSuggestion(option: LanguageOption): void {
    this.handleSelection(option);
  }

  onClose(): void {
    if (!this.resolved) {
      this.resolveSelection(null);
    }
  }

  private handleSelection(option: LanguageOption): void {
    if (this.resolved) {
      return;
    }
    this.resolved = true;
    if (option.value === "__custom__") {
      this.close();
      new TextPromptModal(
        this.app,
        "Custom language hint",
        "e.g., en, de, fr, de,en",
        (value) => this.resolveSelection(value.trim()),
        "Language hint cannot be empty."
      ).open();
      return;
    }
    this.resolveSelection(option.value);
    this.close();
  }
}

export default class ZoteroRagPlugin extends Plugin {
  settings!: ZoteroRagSettings;
  private docIndex: Record<string, DocIndexEntry> | null = null;
  private statusBarEl?: HTMLElement;
  private statusLabelEl?: HTMLElement;
  private statusBarInnerEl?: HTMLElement;
  private lastPythonEnvNotice: string | null = null;
  private lastContainerNotice: string | null = null;
  private noteSyncTimers = new Map<string, number>();
  private noteSyncInFlight = new Set<string>();
  private noteSyncSuppressed = new Set<string>();
  private collectionTitleCache = new Map<string, string>();
  private recreateMissingNotesActive = false;
  private recreateMissingNotesAbort = false;
  private recreateMissingNotesProcess: ChildProcess | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();
    await this.migrateCachePaths();
    this.addSettingTab(new ZoteroRagSettingTab(this.app, this));

    this.registerRibbonIcons();
    this.registerView(VIEW_TYPE_ZOTERO_CHAT, (leaf) => new ZoteroChatView(leaf, this));
    this.setupStatusBar();
    this.registerNoteRenameHandler();
    this.registerNoteSyncHandler();
    this.registerChunkExcludeMenu();
    this.registerEditorExtension(createChunkToolsExtension(this));

    try {
      await this.ensureBundledTools();
    } catch (error) {
      console.error("Failed to sync bundled tools", error);
    }

    this.addCommand({
      id: "import-zotero-item-index",
      name: "Import Zotero item and index (Docling -> RedisSearch)",
      callback: () => this.importZoteroItem(),
    });

    this.addCommand({
      id: "ask-zotero-library",
      name: "Ask my Zotero library (RAG via RedisSearch)",
      callback: () => this.askZoteroLibrary(),
    });

    this.addCommand({
      id: "open-zotero-chat",
      name: "Open Zotero RAG chat panel",
      callback: () => this.openChatView(true),
    });

    this.addCommand({
      id: "rebuild-zotero-note-cache",
      name: "Rebuild Zotero note from cache (Docling + RedisSearch)",
      callback: () => this.rebuildNoteFromCache(),
    });

    this.addCommand({
      id: "rebuild-doc-index-cache",
      name: "Rebuild doc index from cache",
      callback: () => this.rebuildDocIndexFromCache(),
    });

    this.addCommand({
      id: "recreate-missing-notes-cache",
      name: "Recreate missing notes from cache (Docling + RedisSearch)",
      callback: () => this.recreateMissingNotesFromCache(),
    });

    this.addCommand({
      id: "reindex-redis-from-cache",
      name: "Reindex Redis from cached chunks",
      callback: () => this.reindexRedisFromCache(),
    });

    this.addCommand({
      id: "start-redis-stack",
      name: "Start Redis Stack (Docker/Podman Compose)",
      callback: () => this.startRedisStack(),
    });

    this.addCommand({
      id: "open-docling-log",
      name: "Open Docling log file",
      callback: () => this.openLogFile(),
    });

    this.addCommand({
      id: "clear-docling-log",
      name: "Clear Docling log file",
      callback: () => this.clearLogFile(),
    });

    this.addCommand({
      id: "toggle-zrr-chunk-delete",
      name: "Toggle ZRR chunk exclude at cursor",
      editorCallback: (editor) => this.toggleChunkExclude(editor),
    });

    void this.autoDetectContainerCliOnLoad();

    if (this.settings.autoStartRedis) {
      void this.startRedisStack(true);
    }
  }

  async loadSettings(): Promise<void> {
    const data = (await this.loadData()) ?? {};
    const settings = Object.assign({}, DEFAULT_SETTINGS, data);
    if (
      settings.preferObsidianNoteForCitations === undefined &&
      typeof (data as any).preferVaultPdfForCitations === "boolean"
    ) {
      settings.preferObsidianNoteForCitations = (data as any).preferVaultPdfForCitations;
    }
    this.settings = settings;
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private async importZoteroItem(): Promise<void> {
    try {
      await this.ensureBundledTools();
    } catch (error) {
      new Notice("Failed to sync bundled tools. See console for details.");
      console.error(error);
      return;
    }

    let item: ZoteroLocalItem | null;
    try {
      item = await this.promptZoteroItem();
    } catch (error) {
      new Notice("Zotero search failed. See console for details.");
      console.error(error);
      return;
    }

    if (!item) {
      new Notice("No Zotero item selected.");
      return;
    }

    const values: ZoteroItemValues = item.data ?? item;
    if (!values.key && item.key) {
      values.key = item.key;
    }

    const docId = this.getDocId(values);
    if (!docId) {
      new Notice("Could not resolve a stable doc_id from Zotero item.");
      return;
    }

    const languageHint = await this.resolveLanguageHint(values, item.key ?? values.key);
    const doclingLanguageHint = this.buildDoclingLanguageHint(languageHint ?? undefined);

    const attachment = await this.resolvePdfAttachment(values, docId);
    if (!attachment) {
      new Notice("No PDF attachment found for item.");
      return;
    }

    this.showStatusProgress("Preparing...", 5);

    const title = typeof values.title === "string" ? values.title : "";
    const existingEntry = await this.getDocIndexEntry(docId);
    if (existingEntry) {
      new Notice("Item already indexed. Updating cached files and index.");
    }

    let baseName = this.sanitizeFileName(title) || docId;
    if (existingEntry?.note_path) {
      baseName = path.basename(existingEntry.note_path, ".md") || baseName;
    } else if (existingEntry?.pdf_path) {
      const relativePdf = this.toVaultRelativePath(existingEntry.pdf_path);
      if (relativePdf && relativePdf.startsWith(normalizePath(this.settings.outputPdfDir))) {
        baseName = path.basename(relativePdf, ".pdf") || baseName;
      }
    }

    const finalBaseName = existingEntry ? baseName : await this.resolveUniqueBaseName(baseName, docId);

    const pdfPath = normalizePath(`${this.settings.outputPdfDir}/${finalBaseName}.pdf`);
    const itemPath = normalizePath(`${ITEM_CACHE_DIR}/${docId}.json`);
    const chunkPath = normalizePath(`${CHUNK_CACHE_DIR}/${docId}.json`);
    const adapter = this.app.vault.adapter;
    let notePath = normalizePath(`${this.settings.outputNoteDir}/${finalBaseName}.md`);
    if (existingEntry?.note_path && (await adapter.exists(existingEntry.note_path))) {
      notePath = normalizePath(existingEntry.note_path);
    }

    if (await adapter.exists(notePath)) {
      const confirmed = await this.confirmOverwrite(notePath);
      if (!confirmed) {
        new Notice("Import canceled.");
        return;
      }
    }

    try {
      await this.ensureFolder(ITEM_CACHE_DIR);
      await this.ensureFolder(CHUNK_CACHE_DIR);
      await this.ensureFolder(this.settings.outputNoteDir);
      if (this.settings.copyPdfToVault) {
        await this.ensureFolder(this.settings.outputPdfDir);
      }
      if (this.settings.enableFileLogging) {
        const logRel = this.getLogFileRelativePath();
        const logDir = normalizePath(path.dirname(logRel));
        if (logDir) {
          await this.ensureFolder(logDir);
        }
        // Also ensure spellchecker info dir (same as logs)
        const spellInfoRel = this.getSpellcheckerInfoRelativePath();
        const spellDir = normalizePath(path.dirname(spellInfoRel));
        if (spellDir) {
          await this.ensureFolder(spellDir);
        }
      }
    } catch (error) {
      new Notice("Failed to create output folders.");
      console.error(error);
      this.clearStatusProgress();
      return;
    }

    let pdfSourcePath = "";
    let pdfLink = "";

    try {
      if (this.settings.copyPdfToVault) {
        const buffer = attachment.filePath
          ? await fs.readFile(attachment.filePath)
          : await this.downloadZoteroPdf(attachment.key);
        await this.app.vault.adapter.writeBinary(pdfPath, this.bufferToArrayBuffer(buffer));
        pdfSourcePath = this.getAbsoluteVaultPath(pdfPath);
      } else if (attachment.filePath) {
        pdfSourcePath = attachment.filePath;
      } else {
        await this.ensureFolder(this.settings.outputPdfDir);
        const buffer = await this.downloadZoteroPdf(attachment.key);
        await this.app.vault.adapter.writeBinary(pdfPath, this.bufferToArrayBuffer(buffer));
        pdfSourcePath = this.getAbsoluteVaultPath(pdfPath);
        new Notice("Local PDF path unavailable; copied PDF into vault for processing.");
      }
      pdfLink = this.buildPdfLinkForNote(pdfSourcePath, attachment.key, docId);
    } catch (error) {
      new Notice("Failed to download PDF attachment.");
      console.error(error);
      this.clearStatusProgress();
      return;
    }

    try {
      await this.app.vault.adapter.write(itemPath, JSON.stringify(item, null, 2));
    } catch (error) {
      new Notice("Failed to write Zotero item JSON.");
      console.error(error);
      this.clearStatusProgress();
      return;
    }

    const pluginDir = this.getPluginDir();
    const doclingScript = path.join(pluginDir, "tools", "docling_extract.py");
    const indexScript = path.join(pluginDir, "tools", "index_redisearch.py");
    let qualityLabel: string | null = null;

    try {
      qualityLabel = await this.readDoclingQualityLabelFromPdf(pdfSourcePath, doclingLanguageHint);
      this.showStatusProgress(this.formatStatusLabel("Docling extraction...", qualityLabel), 0);
      const doclingLogPath = this.settings.enableFileLogging ? this.getLogFileAbsolutePath() : null;
      await this.runPythonStreaming(
        doclingScript,
        this.buildDoclingArgs(
          pdfSourcePath,
          docId,
          chunkPath,
          notePath,
          doclingLanguageHint,
          true
        ),
        (payload) => this.handleDoclingProgress(payload, qualityLabel),
        () => {},
        doclingLogPath
      );
      qualityLabel = await this.readDoclingQualityLabel(chunkPath);
      await this.annotateChunkJsonWithAttachmentKey(chunkPath, attachment.key);

      const metadata = await this.readDoclingMetadata(chunkPath);
      const layeredPath = await this.maybeCreateOcrLayeredPdf(
        pdfSourcePath,
        metadata,
        doclingLanguageHint
      );
      if (layeredPath) {
        pdfSourcePath = layeredPath;
        pdfLink = this.buildPdfLinkFromSourcePath(layeredPath);
        await this.updateChunkJsonSourcePdf(chunkPath, layeredPath);
      }
    } catch (error) {
      new Notice("Docling extraction failed. See console for details.");
      console.error(error);
      this.clearStatusProgress();
      return;
    }

    try {
      this.showStatusProgress(this.formatStatusLabel("Indexing chunks...", qualityLabel), 0);
      const indexArgs = [
        "--chunks-json",
        this.getAbsoluteVaultPath(chunkPath),
        "--redis-url",
        this.settings.redisUrl,
        "--index",
        this.getRedisIndexName(),
        "--prefix",
        this.getRedisKeyPrefix(),
        "--embed-base-url",
        this.settings.embedBaseUrl,
        "--embed-api-key",
        this.settings.embedApiKey,
        "--embed-model",
        this.settings.embedModel,
        "--progress",
      ];
      if (this.settings.embedIncludeMetadata) {
        indexArgs.push("--embed-include-metadata");
      }
      this.appendChunkTaggingArgs(indexArgs);
      await this.runPythonStreaming(
        indexScript,
        indexArgs,
        (payload) => {
          if (payload?.type === "progress" && payload.total) {
            const percent = Math.round((payload.current / payload.total) * 100);
            const message =
              typeof payload.message === "string" && payload.message.trim()
                ? payload.message
                : `Indexing chunks ${payload.current}/${payload.total}`;
            const label = this.formatStatusLabel(
              message,
              qualityLabel
            );
            this.showStatusProgress(label, percent);
          }
        },
        () => undefined
      );
    } catch (error) {
      new Notice("RedisSearch indexing failed. See console for details.");
      console.error(error);
      this.clearStatusProgress();
      return;
    }

    try {
      const doclingMd = await this.app.vault.adapter.read(notePath);
      const chunkPayload = await this.readChunkPayload(chunkPath);
      const doclingContent = this.buildSyncedDoclingContent(docId, chunkPayload, doclingMd);
      const noteContent = await this.buildNoteMarkdown(
        values,
        item.meta ?? {},
        docId,
        pdfLink,
        attachment.key,
        itemPath,
        doclingContent
      );
      await this.writeNoteWithSyncSuppressed(notePath, noteContent);
    } catch (error) {
      new Notice("Failed to finalize note markdown.");
      console.error(error);
      this.clearStatusProgress();
      return;
    }

    try {
      await this.updateDocIndex({
        doc_id: docId,
        note_path: notePath,
        note_title: finalBaseName,
        zotero_title: title,
        pdf_path: pdfSourcePath,
        attachment_key: attachment.key,
      });
    } catch (error) {
      console.error("Failed to update doc index", error);
    }

    this.showStatusProgress("Done", 100);
    window.setTimeout(() => this.clearStatusProgress(), 1200);
    new Notice(`Indexed Zotero item ${docId}.`);
  }

  private async askZoteroLibrary(): Promise<void> {
    await this.openChatView(true);
  }

  private getChatLeaf(): WorkspaceLeaf {
    const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_ZOTERO_CHAT);
    if (existing.length > 0) {
      return existing[0];
    }
    if (this.settings.chatPaneLocation === "right") {
      return this.app.workspace.getRightLeaf(false) ?? this.app.workspace.getLeaf("split");
    }
    return this.app.workspace.getLeaf("tab");
  }

  async openChatView(focus = false): Promise<ZoteroChatView> {
    const leaf = this.getChatLeaf();
    await leaf.setViewState({ type: VIEW_TYPE_ZOTERO_CHAT, active: true });
    this.app.workspace.revealLeaf(leaf);
    const view = leaf.view;
    if (view instanceof ZoteroChatView && focus) {
      view.focusInput();
    }
    return view as ZoteroChatView;
  }

  async loadChatHistory(): Promise<ChatMessage[]> {
    const sessionId = await this.getActiveChatSessionId();
    return this.loadChatHistoryForSession(sessionId);
  }

  async saveChatHistory(messages: ChatMessage[]): Promise<void> {
    const sessionId = await this.getActiveChatSessionId();
    await this.saveChatHistoryForSession(sessionId, messages);
  }

  private getChatSessionsDir(): string {
    return normalizePath(`${CACHE_ROOT}/chats`);
  }

  private getChatExportDir(): string {
    const configured = (this.settings.chatOutputDir || "").trim();
    if (configured) {
      return normalizePath(configured);
    }
    return normalizePath("zotero/chats");
  }

  private getChatSessionsIndexPath(): string {
    return normalizePath(`${this.getChatSessionsDir()}/index.json`);
  }

  private getChatSessionPath(sessionId: string): string {
    return normalizePath(`${this.getChatSessionsDir()}/${sessionId}.json`);
  }

  public async listChatSessions(): Promise<{ id: string; name: string; createdAt: string; updatedAt: string }[]> {
    await this.migrateLegacyChatHistory();
    const adapter = this.app.vault.adapter;
    const indexPath = this.getChatSessionsIndexPath();
    if (!(await adapter.exists(indexPath))) {
      const now = new Date().toISOString();
      const sessions = [{ id: "default", name: "New chat", createdAt: now, updatedAt: now }];
      await this.writeChatSessionsIndex({ version: 1, active: "default", sessions });
      return sessions;
    }
    try {
      const raw = await adapter.read(indexPath);
      const payload = JSON.parse(raw);
      const sessions = Array.isArray(payload?.sessions) ? payload.sessions : [];
      return sessions
        .filter((s: any) => s && typeof s.id === "string")
        .map((s: any) => ({
          id: String(s.id),
          name: typeof s.name === "string" && s.name.trim() ? s.name.trim() : String(s.id),
          createdAt: typeof s.createdAt === "string" ? s.createdAt : new Date().toISOString(),
          updatedAt: typeof s.updatedAt === "string" ? s.updatedAt : new Date().toISOString(),
        }));
    } catch (error) {
      console.warn("Failed to read chat sessions index", error);
      return [];
    }
  }

  public async getActiveChatSessionId(): Promise<string> {
    await this.migrateLegacyChatHistory();
    const adapter = this.app.vault.adapter;
    const indexPath = this.getChatSessionsIndexPath();
    if (!(await adapter.exists(indexPath))) {
      return "default";
    }
    try {
      const raw = await adapter.read(indexPath);
      const payload = JSON.parse(raw);
      const active = typeof payload?.active === "string" ? payload.active : "default";
      return active || "default";
    } catch {
      return "default";
    }
  }

  public async setActiveChatSessionId(sessionId: string): Promise<void> {
    await this.migrateLegacyChatHistory();
    const index = await this.readChatSessionsIndex();
    const exists = (index.sessions ?? []).some((s) => s.id === sessionId);
    const now = new Date().toISOString();
    const sessions = exists
      ? index.sessions
      : [...(index.sessions ?? []), { id: sessionId, name: sessionId, createdAt: now, updatedAt: now }];
    await this.writeChatSessionsIndex({ version: 1, active: sessionId, sessions });
  }

  public async createChatSession(name?: string): Promise<string> {
    await this.migrateLegacyChatHistory();
    const id = this.generateChatId();
    const now = new Date().toISOString();
    const safeName = (name || "").trim() || "New chat";
    const index = await this.readChatSessionsIndex();
    const sessions = [...(index.sessions ?? []), { id, name: safeName, createdAt: now, updatedAt: now }];
    await this.ensureFolder(this.getChatSessionsDir());
    await this.app.vault.adapter.write(this.getChatSessionPath(id), JSON.stringify({ version: 1, messages: [] }, null, 2));
    await this.writeChatSessionsIndex({ version: 1, active: id, sessions });
    return id;
  }

  public async renameChatSession(sessionId: string, name: string): Promise<void> {
    await this.migrateLegacyChatHistory();
    const trimmed = (name || "").trim();
    if (!trimmed) {
      return;
    }
    const index = await this.readChatSessionsIndex();
    const sessions = (index.sessions ?? []).map((s) => (s.id === sessionId ? { ...s, name: trimmed } : s));
    await this.writeChatSessionsIndex({ version: 1, active: index.active ?? "default", sessions });
  }

  public async deleteChatSession(sessionId: string): Promise<void> {
    await this.migrateLegacyChatHistory();
    if (!sessionId) {
      return;
    }
    const adapter = this.app.vault.adapter;
    const index = await this.readChatSessionsIndex();
    const sessions = index.sessions ?? [];
    if (sessions.length <= 1) {
      return;
    }
    const remaining = sessions.filter((s) => s.id !== sessionId);
    if (!remaining.length) {
      return;
    }
    const nextActive = index.active === sessionId ? remaining[0].id : index.active;
    try {
      await adapter.remove(this.getChatSessionPath(sessionId));
    } catch (error) {
      console.warn("Failed to delete chat session file", error);
    }
    await this.writeChatSessionsIndex({ version: 1, active: nextActive, sessions: remaining });
  }

  public async loadChatHistoryForSession(sessionId: string): Promise<ChatMessage[]> {
    await this.migrateLegacyChatHistory();
    const adapter = this.app.vault.adapter;
    const historyPath = this.getChatSessionPath(sessionId || "default");
    if (!(await adapter.exists(historyPath))) {
      return [];
    }
    const raw = await adapter.read(historyPath);
    let payload: any;
    try {
      payload = JSON.parse(raw);
    } catch {
      return [];
    }
    const messages = Array.isArray(payload) ? payload : payload?.messages;
    if (!Array.isArray(messages)) {
      return [];
    }
    return messages
      .filter((msg) => msg && typeof msg.content === "string")
      .map((msg) => ({
        id: msg.id || this.generateChatId(),
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
        citations: Array.isArray(msg.citations) ? msg.citations : [],
        retrieved: Array.isArray(msg.retrieved) ? msg.retrieved : [],
        createdAt: msg.createdAt || new Date().toISOString(),
      }));
  }

  public async saveChatHistoryForSession(sessionId: string, messages: ChatMessage[]): Promise<void> {
    await this.migrateLegacyChatHistory();
    await this.ensureFolder(this.getChatSessionsDir());
    const adapter = this.app.vault.adapter;
    const historyPath = this.getChatSessionPath(sessionId || "default");
    const payload = {
      version: 1,
      messages,
    };
    await adapter.write(historyPath, JSON.stringify(payload, null, 2));

    const index = await this.readChatSessionsIndex();
    const now = new Date().toISOString();
    const sessions = (index.sessions ?? []).map((s) => (s.id === sessionId ? { ...s, updatedAt: now } : s));
    await this.writeChatSessionsIndex({ version: 1, active: index.active ?? sessionId, sessions });
  }

  public getRecentChatHistory(messages: ChatMessage[]): ChatMessage[] {
    const limit = Math.max(0, this.settings.chatHistoryMessages || 0);
    if (!limit) {
      return [];
    }
    const filtered = messages.filter((message) => message && message.content?.trim());
    return filtered.slice(-limit);
  }

  private async readChatSessionsIndex(): Promise<{
    version: number;
    active: string;
    sessions: { id: string; name: string; createdAt: string; updatedAt: string }[];
  }> {
    const adapter = this.app.vault.adapter;
    const indexPath = this.getChatSessionsIndexPath();
    const now = new Date().toISOString();
    if (!(await adapter.exists(indexPath))) {
      return { version: 1, active: "default", sessions: [{ id: "default", name: "New chat", createdAt: now, updatedAt: now }] };
    }
    try {
      const raw = await adapter.read(indexPath);
      const payload = JSON.parse(raw);
      const sessions = Array.isArray(payload?.sessions) ? payload.sessions : [];
      return {
        version: 1,
        active: typeof payload?.active === "string" ? payload.active : "default",
        sessions: sessions.map((s: any) => ({
          id: String(s.id),
          name: typeof s.name === "string" && s.name.trim() ? s.name.trim() : String(s.id),
          createdAt: typeof s.createdAt === "string" ? s.createdAt : now,
          updatedAt: typeof s.updatedAt === "string" ? s.updatedAt : now,
        })),
      };
    } catch (error) {
      console.warn("Failed to parse chat sessions index", error);
      return { version: 1, active: "default", sessions: [{ id: "default", name: "New chat", createdAt: now, updatedAt: now }] };
    }
  }

  private async writeChatSessionsIndex(payload: {
    version: number;
    active: string;
    sessions: { id: string; name: string; createdAt: string; updatedAt: string }[];
  }): Promise<void> {
    await this.ensureFolder(this.getChatSessionsDir());
    await this.app.vault.adapter.write(this.getChatSessionsIndexPath(), JSON.stringify(payload, null, 2));
  }

  private async migrateLegacyChatHistory(): Promise<void> {
    const adapter = this.app.vault.adapter;
    const legacyPath = normalizePath(`${CACHE_ROOT}/chat.json`);
    const sessionsDir = this.getChatSessionsDir();
    const indexPath = this.getChatSessionsIndexPath();
    const defaultPath = this.getChatSessionPath("default");

    const legacyExists = await adapter.exists(legacyPath);
    const defaultExists = await adapter.exists(defaultPath);
    const indexExists = await adapter.exists(indexPath);

    if (!legacyExists && indexExists) {
      return;
    }

    const now = new Date().toISOString();
    await this.ensureFolder(sessionsDir);

    if (legacyExists && !defaultExists) {
      try {
        await adapter.rename(legacyPath, defaultPath);
      } catch {
        try {
          const raw = await adapter.read(legacyPath);
          await adapter.write(defaultPath, raw);
          await adapter.remove(legacyPath);
        } catch (error) {
          console.warn("Failed to migrate legacy chat history", error);
        }
      }
    }

    if (!indexExists) {
      const sessions = [{ id: "default", name: "New chat", createdAt: now, updatedAt: now }];
      await this.writeChatSessionsIndex({ version: 1, active: "default", sessions });
    }

    if (indexExists) {
      try {
        const raw = await adapter.read(indexPath);
        const payload = JSON.parse(raw);
        const sessions = Array.isArray(payload?.sessions) ? payload.sessions : [];
        const hasDefault = sessions.some((s: any) => s?.id === "default");
        const updatedSessions = sessions.map((s: any) => {
          if (s?.id === "default" && typeof s?.name === "string" && s.name.trim().toLowerCase() === "default") {
            return { ...s, name: "New chat" };
          }
          return s;
        });
        if (hasDefault && JSON.stringify(updatedSessions) !== JSON.stringify(sessions)) {
          await this.writeChatSessionsIndex({
            version: 1,
            active: typeof payload?.active === "string" ? payload.active : "default",
            sessions: updatedSessions.map((s: any) => ({
              id: String(s.id),
              name: typeof s.name === "string" ? s.name : "New chat",
              createdAt: typeof s.createdAt === "string" ? s.createdAt : now,
              updatedAt: typeof s.updatedAt === "string" ? s.updatedAt : now,
            })),
          });
        }
      } catch {
        // ignore
      }
    }
  }

  private isPlaceholderChatName(name: string): boolean {
    const normalized = (name || "").trim().toLowerCase();
    return normalized === "new chat" || normalized === "default";
  }

  private normalizeChatTitle(title: string): string {
    const cleaned = (title || "").replace(/\s+/g, " ").trim();
    return cleaned.length > 60 ? `${cleaned.slice(0, 57)}...` : cleaned;
  }

  private guessTitleFromMessages(messages: ChatMessage[]): string {
    const firstUser = messages.find((m) => m.role === "user" && m.content.trim());
    if (!firstUser) {
      return "New chat";
    }
    const words = firstUser.content
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .slice(0, 8)
      .join(" ");
    return this.normalizeChatTitle(words || "New chat");
  }

  private async suggestChatTitleWithLlm(messages: ChatMessage[]): Promise<string | null> {
    const baseUrl = (this.settings.chatBaseUrl || "").trim();
    const model = (this.settings.chatModel || "").trim();
    if (!baseUrl || !model) {
      return null;
    }
    try {
      const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (this.settings.chatApiKey) {
        headers["Authorization"] = `Bearer ${this.settings.chatApiKey}`;
      }
      const sample = messages
        .slice(-8)
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n")
        .slice(0, 4000);
      const payload = {
        model,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "Generate a short, specific title (3-7 words) for the chat. No quotes, no punctuation at the end.",
          },
          { role: "user", content: sample },
        ],
      };
      const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
      if (!res.ok) {
        return null;
      }
      const data: any = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (typeof text !== "string") {
        return null;
      }
      return this.normalizeChatTitle(text.replace(/^\"|\"$/g, "").trim());
    } catch (error) {
      console.warn("Chat title suggestion failed", error);
      return null;
    }
  }

  public async finalizeChatSessionNameIfNeeded(
    sessionId: string,
    messages: ChatMessage[],
    options: { force?: boolean } = {}
  ): Promise<void> {
    if (!sessionId) {
      return;
    }
    const safeMessages = messages || [];
    const hasUserMessage = safeMessages.some((m) => m.role === "user" && m.content.trim());
    if (!hasUserMessage) {
      return;
    }
    if (!options.force && safeMessages.length < 4) {
      return;
    }
    const index = await this.readChatSessionsIndex();
    const session = (index.sessions ?? []).find((s) => s.id === sessionId);
    if (!session || !this.isPlaceholderChatName(session.name)) {
      return;
    }
    const llmTitle = await this.suggestChatTitleWithLlm(safeMessages);
    const name = llmTitle || this.guessTitleFromMessages(safeMessages);
    if (!name || this.isPlaceholderChatName(name)) {
      return;
    }
    await this.renameChatSession(sessionId, name);
  }

  async runRagQueryStreaming(
    query: string,
    onDelta: (delta: string) => void,
    onFinal: (payload: any) => void,
    historyMessages: ChatMessage[] = []
  ): Promise<void> {
    await this.ensureBundledTools();
    const pluginDir = this.getPluginDir();
    const ragScript = path.join(pluginDir, "tools", "rag_query_redisearch.py");
    const args = [
      "--query",
      query,
      "--k",
      "5",
      "--redis-url",
      this.settings.redisUrl,
      "--index",
      this.getRedisIndexName(),
      "--prefix",
      this.getRedisKeyPrefix(),
      "--embed-base-url",
      this.settings.embedBaseUrl,
      "--embed-api-key",
      this.settings.embedApiKey,
      "--embed-model",
      this.settings.embedModel,
      "--chat-base-url",
      this.settings.chatBaseUrl,
      "--chat-api-key",
      this.settings.chatApiKey,
      "--chat-model",
      this.settings.chatModel,
      "--temperature",
      String(this.settings.chatTemperature),
      "--stream",
    ];

    const historyPayload = this.buildChatHistoryPayload(historyMessages);
    const historyFile = await this.writeChatHistoryTemp(historyPayload);
    if (historyFile?.absolutePath) {
      args.push("--history-file", historyFile.absolutePath);
    }

    try {
      await this.runPythonStreaming(
        ragScript,
        args,
        (payload) => {
          if (payload?.type === "delta" && typeof payload.content === "string") {
            onDelta(payload.content);
            return;
          }
          if (payload?.type === "final") {
            onFinal(payload);
            return;
          }
          if (payload?.answer) {
            onFinal(payload);
          }
        },
        onFinal
      );
    } finally {
      if (historyFile?.relativePath) {
        try {
          await this.app.vault.adapter.remove(historyFile.relativePath);
        } catch (error) {
          console.warn("Failed to remove chat history temp file", error);
        }
      }
    }
  }

  private buildChatHistoryPayload(messages: ChatMessage[]): Array<{ role: string; content: string }> {
    const history = this.getRecentChatHistory(messages);
    return history.map((message) => ({
      role: message.role,
      content: message.content,
    }));
  }

  private async writeChatHistoryTemp(
    messages: Array<{ role: string; content: string }>
  ): Promise<{ relativePath: string; absolutePath: string } | null> {
    if (!messages.length) {
      return null;
    }
    const tmpDir = normalizePath(`${CACHE_ROOT}/tmp`);
    await this.ensureFolder(tmpDir);
    const filename = `chat_history_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.json`;
    const relativePath = normalizePath(`${tmpDir}/${filename}`);
    const payload = { version: 1, messages };
    await this.app.vault.adapter.write(relativePath, JSON.stringify(payload, null, 2));
    return {
      relativePath,
      absolutePath: this.getAbsoluteVaultPath(relativePath),
    };
  }

  public async resolveCitationDisplay(citation: ChatCitation): Promise<{
    noteTitle: string;
    pageLabel: string;
    notePath?: string;
    pdfPath?: string;
    zoteroUrl?: string;
    pageStart?: string;
  }> {
    let entry = await this.getDocIndexEntry(citation.doc_id);
    if (!entry || !entry.note_title || !entry.zotero_title || !entry.note_path || !entry.pdf_path) {
      entry = await this.hydrateDocIndexFromCache(citation.doc_id);
    }
    const notePath = citation.doc_id ? await this.resolveNotePathForDocId(citation.doc_id) : entry?.note_path;
    const noteTitle =
      entry?.zotero_title ||
      entry?.note_title ||
      (notePath ? path.basename(notePath, ".md") : citation.doc_id || "?");
    const pageLabel = this.formatCitationPageLabel(citation);
    const pageStart = citation.page_start ? String(citation.page_start) : "";
    const pdfPath = entry?.pdf_path || citation.source_pdf || "";
    const attachmentKey = citation.attachment_key || entry?.attachment_key;
    const annotationKey = citation.annotation_key || this.extractAnnotationKey(citation.chunk_id);
    let zoteroUrl = citation.doc_id
      ? this.buildZoteroDeepLink(citation.doc_id, attachmentKey, pageStart, annotationKey)
      : undefined;
    return {
      noteTitle,
      pageLabel,
      notePath: notePath || undefined,
      pdfPath: pdfPath || undefined,
      zoteroUrl,
      pageStart: pageStart || undefined,
    };
  }

  public async formatInlineCitations(
    content: string,
    citations: ChatCitation[],
    retrieved: ChatRetrievedChunk[] = []
  ): Promise<string> {
    if (!content) {
      return content;
    }
    const pattern = /\[\[?cite:([A-Za-z0-9]+):([^\]\n]+?)\]?\]/g;
    const matches = Array.from(content.matchAll(pattern));
    if (matches.length === 0) {
      return content;
    }

    const replacements = new Map<string, string>();
    for (const match of matches) {
      const token = match[0];
      if (replacements.has(token)) {
        continue;
      }
      const docId = match[1];
      const rawRef = match[2].trim();
      const pageMatch = rawRef.match(/^(\d+)-(\d+)(?::([A-Za-z0-9]+))?$/);
      let pageStart = "";
      let pageEnd = "";
      let annotationKey: string | undefined;
      let chunkRef: string | undefined;

      if (pageMatch) {
        pageStart = pageMatch[1];
        pageEnd = pageMatch[2];
        annotationKey = pageMatch[3];
      } else {
        chunkRef = rawRef;
      }

      const chunkMatch = chunkRef
        ? retrieved.find((item) => {
            const itemDocId = typeof item.doc_id === "string" ? item.doc_id : "";
            if (itemDocId && itemDocId !== docId) {
              return false;
            }
            const chunkId = typeof item.chunk_id === "string" ? item.chunk_id : "";
            if (!chunkId) {
              return false;
            }
            return (
              chunkId === chunkRef ||
              chunkId === `${docId}:${chunkRef}` ||
              chunkId.endsWith(`:${chunkRef}`)
            );
          })
        : undefined;

      if (chunkMatch) {
        if (!pageStart && chunkMatch.page_start !== undefined) {
          pageStart = String(chunkMatch.page_start);
        }
        if (!pageEnd && chunkMatch.page_end !== undefined) {
          pageEnd = String(chunkMatch.page_end);
        }
        if (!annotationKey && typeof chunkMatch.chunk_id === "string") {
          annotationKey = this.extractAnnotationKey(chunkMatch.chunk_id);
        }
      }

      const inferredCitation: ChatCitation = {
        doc_id: docId,
        chunk_id: chunkMatch?.chunk_id,
        annotation_key: annotationKey,
      };
      if (pageStart || pageEnd) {
        inferredCitation.page_start = pageStart || pageEnd;
        inferredCitation.page_end = pageEnd || pageStart;
        inferredCitation.pages = `${inferredCitation.page_start}-${inferredCitation.page_end}`;
      }
      if (chunkMatch?.source_pdf) {
        inferredCitation.source_pdf = String(chunkMatch.source_pdf);
      }

      let citation =
        (pageStart || pageEnd
          ? citations.find(
              (item) =>
                item.doc_id === docId &&
                String(item.page_start ?? "") === pageStart &&
                String(item.page_end ?? "") === pageEnd
            )
          : undefined) ||
        citations.find((item) => item.doc_id === docId) ||
        inferredCitation;

      if (!citation.annotation_key && annotationKey) {
        citation = { ...citation, annotation_key: annotationKey };
      }

      const display = await this.resolveCitationDisplay(citation);
      const label = `${display.noteTitle} p. ${display.pageLabel}`;
      const chunkId = this.normalizeChunkIdForNote(citation.chunk_id, docId);
      if (this.settings.preferObsidianNoteForCitations && display.notePath && chunkId) {
        replacements.set(token, this.buildNoteChunkLink(display.notePath, chunkId, label));
      } else {
        if (display.zoteroUrl) {
          replacements.set(token, `[${label}](${display.zoteroUrl})`);
        } else {
          const fallbackLabel = display.pageLabel
            ? `${docId} p. ${display.pageLabel}`
            : `${docId}`;
          replacements.set(token, `(${fallbackLabel})`);
        }
      }
    }

    let result = content;
    for (const [token, replacement] of replacements) {
      result = result.split(token).join(replacement);
    }
    return result;
  }

  private handleDoclingProgress(payload: any, qualityLabel: string | null): void {
    if (!payload || payload.type !== "progress") {
      return;
    }
    const percent = Number(payload.percent);
    if (!Number.isFinite(percent)) {
      return;
    }
    const message =
      typeof payload.message === "string" && payload.message.trim()
        ? payload.message
        : "Docling extraction...";
    this.showStatusProgress(this.formatStatusLabel(message, qualityLabel), Math.round(percent));
  }

  public async createChatNoteFromSession(
    sessionId: string,
    sessionName: string,
    messages: ChatMessage[]
  ): Promise<void> {
    const noteDir = this.getChatExportDir();
    await this.ensureFolder(noteDir);
    await this.getDocIndex();

    const baseName = this.sanitizeFileName(sessionName) || "Zotero Chat";
    const timestamp = this.formatTimestamp(new Date());
    const draftPath = normalizePath(`${noteDir}/${baseName}.md`);
    const notePath = await this.resolveUniqueNotePath(draftPath, `${baseName}-${timestamp}.md`);
    const content = await this.buildChatTranscript(sessionName, messages);

    await this.app.vault.adapter.write(notePath, content);
    await this.openNoteInNewTab(notePath);
    new Notice(`Chat copied to ${notePath}`);
  }

  private async buildChatTranscript(sessionName: string, messages: ChatMessage[]): Promise<string> {
    const lines: string[] = [];
    lines.push(`# ${sessionName || "Zotero Chat"}`);
    lines.push("");
    lines.push(`Created: ${new Date().toISOString()}`);
    lines.push("");

    for (const message of messages) {
      const header = message.role === "user" ? "## You" : "## Assistant";
      lines.push(header);
      lines.push("");
      const content =
        message.role === "assistant"
          ? await this.formatInlineCitations(
              message.content || "",
              message.citations ?? [],
              message.retrieved ?? []
            )
          : message.content || "";
      lines.push(content.trim());
      lines.push("");
      if (message.role === "assistant" && message.citations?.length) {
        lines.push("### Relevant context sources");
        const citations = this.formatCitationsMarkdown(message.citations);
        if (citations) {
          lines.push(citations);
          lines.push("");
        }
      }
    }

    return lines.join("\n").trim() + "\n";
  }

  private async resolveUniqueNotePath(basePath: string, fallbackFile: string): Promise<string> {
    const adapter = this.app.vault.adapter;
    if (!await adapter.exists(basePath)) {
      return basePath;
    }
    const folder = path.dirname(basePath);
    const fallbackPath = normalizePath(path.join(folder, fallbackFile));
    if (!await adapter.exists(fallbackPath)) {
      return fallbackPath;
    }
    let counter = 2;
    while (counter < 1000) {
      const candidate = normalizePath(path.join(folder, `${path.basename(fallbackFile, ".md")}-${counter}.md`));
      if (!await adapter.exists(candidate)) {
        return candidate;
      }
      counter += 1;
    }
    return fallbackPath;
  }

  private formatTimestamp(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, "0");
    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate()),
      "-",
      pad(date.getHours()),
      pad(date.getMinutes()),
    ].join("");
  }

  public async openCitationTarget(
    citation: ChatCitation,
    display?: { notePath?: string; pdfPath?: string; zoteroUrl?: string; pageStart?: string }
  ): Promise<void> {
    const resolved = display ?? (await this.resolveCitationDisplay(citation));
    const chunkId = this.normalizeChunkIdForNote(citation.chunk_id, citation.doc_id);
    const preferNote = this.settings.preferObsidianNoteForCitations;
    if (preferNote && resolved.notePath && chunkId) {
      const opened = await this.openNoteAtChunk(resolved.notePath, chunkId);
      if (opened) {
        return;
      }
    }
    if (preferNote && resolved.notePath) {
      await this.openNoteInMain(resolved.notePath);
      return;
    }
    if (!preferNote && resolved.zoteroUrl) {
      this.openExternalUrl(resolved.zoteroUrl);
      return;
    }
    if (resolved.pdfPath) {
      const opened = await this.openPdfInMain(resolved.pdfPath, resolved.pageStart);
      if (opened) {
        return;
      }
    }
    if (resolved.zoteroUrl) {
      this.openExternalUrl(resolved.zoteroUrl);
      return;
    }
    new Notice("Unable to open citation target.");
  }

  private async rebuildNoteFromCache(): Promise<void> {
    const docId = await this.promptDocId();
    if (!docId) {
      new Notice("No doc_id provided.");
      return;
    }

    const rebuilt = await this.rebuildNoteFromCacheForDocId(docId, true);
    if (rebuilt) {
      new Notice(`Rebuilt Zotero note for ${docId}.`);
    }
  }

  private async rebuildDocIndexFromCache(): Promise<void> {
    const adapter = this.app.vault.adapter;
    const itemDocIds = await this.listDocIds(ITEM_CACHE_DIR);
    const chunkDocIds = await this.listDocIds(CHUNK_CACHE_DIR);
    const noteEntries = await this.scanNotesForDocIds(this.settings.outputNoteDir);
    const noteDocIds = Object.keys(noteEntries);
    const docIds = Array.from(new Set([...itemDocIds, ...chunkDocIds, ...noteDocIds]));

    if (docIds.length === 0) {
      new Notice("No cached items found.");
      return;
    }

    this.showStatusProgress("Rebuilding doc index...", 0);
    const index = await this.getDocIndex();

    let processed = 0;
    for (const docId of docIds) {
      processed += 1;
      const updates: Partial<DocIndexEntry> = {};

      const noteEntry = noteEntries[docId];
      if (noteEntry) {
        updates.note_path = noteEntry.note_path;
        updates.note_title = noteEntry.note_title;
      }

      const itemPath = normalizePath(`${ITEM_CACHE_DIR}/${docId}.json`);
      if (await adapter.exists(itemPath)) {
        try {
          const raw = await adapter.read(itemPath);
          const item = JSON.parse(raw);
          const values: ZoteroItemValues = item?.data ?? item ?? {};
          const title = typeof values.title === "string" ? values.title : "";
          if (title) {
            updates.zotero_title = title;
          }
          const baseName = this.sanitizeFileName(title) || docId;
          const primaryNote = normalizePath(`${this.settings.outputNoteDir}/${baseName}.md`);
          const fallbackNote = normalizePath(`${this.settings.outputNoteDir}/${baseName}-${docId}.md`);
          if (await adapter.exists(primaryNote)) {
            updates.note_path = primaryNote;
            updates.note_title = path.basename(primaryNote, ".md");
          } else if (await adapter.exists(fallbackNote)) {
            updates.note_path = fallbackNote;
            updates.note_title = path.basename(fallbackNote, ".md");
          }
        } catch (error) {
          console.error("Failed to read cached item JSON", error);
        }
      }

      const chunkPath = normalizePath(`${CHUNK_CACHE_DIR}/${docId}.json`);
      if (await adapter.exists(chunkPath)) {
        try {
          const raw = await adapter.read(chunkPath);
          const payload = JSON.parse(raw);
          if (typeof payload?.source_pdf === "string") {
            updates.pdf_path = payload.source_pdf;
          }
        } catch (error) {
          console.error("Failed to read cached chunks JSON", error);
        }
      }

      if (Object.keys(updates).length > 0) {
        const existing = index[docId] ?? ({ doc_id: docId } as DocIndexEntry);
        const next: DocIndexEntry = {
          ...existing,
          ...updates,
          doc_id: docId,
          updated_at: new Date().toISOString(),
        };
        if (!next.note_title && next.note_path) {
          next.note_title = path.basename(next.note_path, ".md");
        }
        index[docId] = next;
      }

      const percent = Math.round((processed / docIds.length) * 100);
      this.showStatusProgress(`Rebuilding doc index ${processed}/${docIds.length}`, percent);
    }

    await this.saveDocIndex(index);
    this.showStatusProgress("Done", 100);
    window.setTimeout(() => this.clearStatusProgress(), 1200);
    new Notice(`Rebuilt doc index for ${docIds.length} items.`);
  }

  public async recreateMissingNotesFromCache(): Promise<void> {
    if (this.recreateMissingNotesActive) {
      new Notice("Recreate missing notes is already running.");
      return;
    }
    this.recreateMissingNotesActive = true;
    this.recreateMissingNotesAbort = false;
    this.recreateMissingNotesProcess = null;
    try {
      const adapter = this.app.vault.adapter;
      const itemDocIds = await this.listDocIds(ITEM_CACHE_DIR);
      const chunkDocIds = await this.listDocIds(CHUNK_CACHE_DIR);
      const noteEntries = await this.scanNotesForDocIds(this.settings.outputNoteDir);
      const noteDocIds = Object.keys(noteEntries);
      const docIds = Array.from(new Set([...itemDocIds, ...chunkDocIds, ...noteDocIds]));

      if (docIds.length === 0) {
        new Notice("No cached items found.");
        return;
      }

      const missing: string[] = [];
      for (const docId of docIds) {
        if (noteEntries[docId]) {
          continue;
        }
        const existing = await this.getDocIndexEntry(docId);
        if (existing?.note_path && (await adapter.exists(existing.note_path))) {
          continue;
        }
        const inferred = await this.inferNotePathFromCache(docId);
        if (inferred && (await adapter.exists(inferred))) {
          continue;
        }
        missing.push(docId);
      }

      if (missing.length === 0) {
        new Notice("No missing notes detected.");
        return;
      }

      this.showStatusProgress("Recreating missing notes...", 0);
      let rebuilt = 0;

      for (let i = 0; i < missing.length; i += 1) {
        if (this.recreateMissingNotesAbort) {
          break;
        }
        const docId = missing[i];
        const percent = Math.round(((i + 1) / missing.length) * 100);
        this.showStatusProgress(`Recreating ${i + 1}/${missing.length}`, percent);
        const ok = await this.rebuildNoteFromCacheForDocId(docId, false);
        if (ok) {
          rebuilt += 1;
        }
      }

      if (this.recreateMissingNotesAbort) {
        this.showStatusProgress("Canceled", 100);
        window.setTimeout(() => this.clearStatusProgress(), 1200);
        new Notice(`Canceled after ${rebuilt}/${missing.length} notes.`);
      } else {
        this.showStatusProgress("Done", 100);
        window.setTimeout(() => this.clearStatusProgress(), 1200);
        new Notice(`Recreated ${rebuilt}/${missing.length} missing notes.`);
      }
    } finally {
      this.recreateMissingNotesActive = false;
      this.recreateMissingNotesProcess = null;
    }
  }

  public cancelRecreateMissingNotesFromCache(): void {
    if (!this.recreateMissingNotesActive) {
      new Notice("No recreate job is running.");
      return;
    }
    this.recreateMissingNotesAbort = true;
    const child = this.recreateMissingNotesProcess;
    if (child && !child.killed) {
      try {
        child.kill("SIGTERM");
      } catch (error) {
        console.warn("Failed to terminate recreate process", error);
      }
      window.setTimeout(() => {
        if (child && !child.killed) {
          try {
            child.kill("SIGKILL");
          } catch (err) {
            console.warn("Failed to force-kill recreate process", err);
          }
        }
      }, 2000);
    }
    new Notice("Canceling recreate missing notes...");
  }

  public async reindexRedisFromCache(): Promise<void> {
    try {
      await this.ensureBundledTools();
    } catch (error) {
      new Notice("Failed to sync bundled tools. See console for details.");
      console.error(error);
      return;
    }

    const chunkDocIds = await this.listDocIds(CHUNK_CACHE_DIR);
    if (chunkDocIds.length === 0) {
      new Notice("No cached chunks found.");
      return;
    }

    const pluginDir = this.getPluginDir();
    const indexScript = path.join(pluginDir, "tools", "index_redisearch.py");
    let processed = 0;
    let failures = 0;

    this.showStatusProgress("Reindexing cached chunks...", 0);

    for (const docId of chunkDocIds) {
      processed += 1;
      const percent = Math.round((processed / chunkDocIds.length) * 100);
      this.showStatusProgress(`Reindexing ${processed}/${chunkDocIds.length}`, percent);

      const chunkPath = normalizePath(`${CHUNK_CACHE_DIR}/${docId}.json`);
      try {
        const indexArgs = [
          "--chunks-json",
          this.getAbsoluteVaultPath(chunkPath),
          "--redis-url",
          this.settings.redisUrl,
          "--index",
          this.getRedisIndexName(),
          "--prefix",
          this.getRedisKeyPrefix(),
          "--embed-base-url",
          this.settings.embedBaseUrl,
          "--embed-api-key",
          this.settings.embedApiKey,
          "--embed-model",
          this.settings.embedModel,
          "--upsert",
        ];
        if (this.settings.embedIncludeMetadata) {
          indexArgs.push("--embed-include-metadata");
        }
        this.appendChunkTaggingArgs(indexArgs);
        await this.runPython(indexScript, indexArgs);
      } catch (error) {
        failures += 1;
        console.error(`Failed to reindex ${docId}`, error);
      }
    }

    this.showStatusProgress("Done", 100);
    window.setTimeout(() => this.clearStatusProgress(), 1200);
    if (failures === 0) {
      new Notice(`Reindexed ${chunkDocIds.length} cached items.`);
    } else {
      new Notice(`Reindexed ${chunkDocIds.length - failures}/${chunkDocIds.length} items (see console).`);
    }
  }

  private async reindexChunkUpdates(
    docId: string,
    chunkPath: string,
    chunkIds: string[],
    deleteIds: string[]
  ): Promise<void> {
    if (!chunkIds.length && !deleteIds.length) {
      return;
    }
    const pluginDir = this.getPluginDir();
    const indexScript = path.join(pluginDir, "tools", "index_redisearch.py");
    const args = [
      "--chunks-json",
      this.getAbsoluteVaultPath(chunkPath),
      "--redis-url",
      this.settings.redisUrl,
      "--index",
      this.getRedisIndexName(),
      "--prefix",
      this.getRedisKeyPrefix(),
      "--embed-base-url",
      this.settings.embedBaseUrl,
      "--embed-api-key",
      this.settings.embedApiKey,
      "--embed-model",
      this.settings.embedModel,
      "--upsert",
    ];
    if (this.settings.embedIncludeMetadata) {
      args.push("--embed-include-metadata");
    }
    this.appendChunkTaggingArgs(args);
    if (chunkIds.length) {
      args.push("--chunk-ids", chunkIds.join(","));
    }
    if (deleteIds.length) {
      args.push("--delete-chunk-ids", deleteIds.join(","));
    }

    try {
      await this.runPython(indexScript, args);
    } catch (error) {
      console.error(`Failed to reindex updated chunks for ${docId}`, error);
    }
  }

  private async promptZoteroItem(): Promise<ZoteroLocalItem | null> {
    return new Promise((resolve) => {
      new ZoteroItemSuggestModal(this.app, this, resolve).open();
    });
  }

  private async listDocIds(folderPath: string): Promise<string[]> {
    const adapter = this.app.vault.adapter;
    const normalized = normalizePath(folderPath);
    if (!(await adapter.exists(normalized))) {
      return [];
    }
    const listing = await adapter.list(normalized);
    return listing.files
      .filter((file) => file.endsWith(".json"))
      .map((file) => path.basename(file, ".json"));
  }

  private async listMarkdownFiles(folderPath: string): Promise<string[]> {
    const adapter = this.app.vault.adapter;
    const normalized = normalizePath(folderPath);
    if (!(await adapter.exists(normalized))) {
      return [];
    }
    const queue = [normalized];
    const results: string[] = [];
    while (queue.length > 0) {
      const current = queue.pop();
      if (!current) {
        continue;
      }
      const listing = await adapter.list(current);
      for (const file of listing.files) {
        if (file.endsWith(".md")) {
          results.push(file);
        }
      }
      for (const folder of listing.folders) {
        queue.push(folder);
      }
    }
    return results;
  }

  private extractDocIdFromFrontmatter(content: string): string | null {
    const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!match) {
      return null;
    }
    const body = match[1];
    const lines = body.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      const parts = trimmed.split(":");
      if (parts.length < 2) {
        continue;
      }
      const key = parts[0].trim().toLowerCase();
      if (key !== "doc_id" && key !== "zotero_key") {
        continue;
      }
      const value = trimmed.slice(trimmed.indexOf(":") + 1).trim();
      const cleaned = value.replace(/^["']|["']$/g, "").trim();
      if (cleaned) {
        return cleaned;
      }
    }
    return null;
  }

  private async scanNotesForDocIds(folderPath: string): Promise<Record<string, DocIndexEntry>> {
    const adapter = this.app.vault.adapter;
    const files = await this.listMarkdownFiles(folderPath);
    const result: Record<string, DocIndexEntry> = {};

    for (const file of files) {
      try {
        const content = await adapter.read(file);
        const docId = this.extractDocIdFromFrontmatter(content);
        if (!docId) {
          continue;
        }
        result[docId] = {
          doc_id: docId,
          note_path: file,
          note_title: path.basename(file, ".md"),
          updated_at: new Date().toISOString(),
        };
      } catch (error) {
        console.error("Failed to read note for doc_id scan", error);
      }
    }
    return result;
  }

  private setupStatusBar(): void {
    const statusBar = this.addStatusBarItem();
    statusBar.addClass("zrr-status-progress");
    statusBar.addClass("status-bar-item-segment");
    statusBar.style.display = "none";

    const label = statusBar.createEl("span", { text: "Idle" });
    label.addClass("zrr-status-label");

    const bar = statusBar.createEl("div", { cls: "zrr-status-bar" });
    const inner = bar.createEl("div", { cls: "zrr-status-bar-inner" });

    this.statusBarEl = statusBar;
    this.statusLabelEl = label;
    this.statusBarInnerEl = inner;
  }

  private showStatusProgress(label: string, percent: number | null): void {
    if (!this.statusBarEl || !this.statusLabelEl || !this.statusBarInnerEl) {
      return;
    }
    this.statusBarEl.style.display = "flex";
    this.statusLabelEl.setText(label);
    if (percent === null) {
      this.statusBarInnerEl.addClass("indeterminate");
      this.statusBarInnerEl.style.width = "40%";
    } else {
      this.statusBarInnerEl.removeClass("indeterminate");
      const clamped = Math.max(0, Math.min(100, percent));
      this.statusBarInnerEl.style.width = `${clamped}%`;
    }
  }

  private clearStatusProgress(): void {
    if (!this.statusBarEl || !this.statusBarInnerEl) {
      return;
    }
    this.statusBarEl.style.display = "none";
    this.statusBarInnerEl.removeClass("indeterminate");
    this.statusBarInnerEl.style.width = "0%";
  }

  private formatStatusLabel(base: string, qualityLabel?: string | null): string {
    if (!qualityLabel) {
      return base;
    }
    return `${base} (Text layer quality ${qualityLabel})`;
  }

  private async readDoclingQualityLabel(chunkPath: string): Promise<string | null> {
    try {
      const content = await this.app.vault.adapter.read(chunkPath);
      const payload = JSON.parse(content);
      const quality = payload?.metadata?.confidence_proxy;
      if (typeof quality === "number") {
        return quality.toFixed(2);
      }
    } catch (error) {
      console.warn("Failed to read Docling quality metadata", error);
    }
    return null;
  }

  private async readDoclingMetadata(chunkPath: string): Promise<Record<string, any> | null> {
    try {
      const content = await this.app.vault.adapter.read(chunkPath);
      const payload = JSON.parse(content);
      const metadata = payload?.metadata;
      if (metadata && typeof metadata === "object") {
        return metadata;
      }
    } catch (error) {
      console.warn("Failed to read Docling metadata", error);
    }
    return null;
  }

  private async readDoclingQualityLabelFromPdf(
    pdfPath: string,
    languageHint?: string | null
  ): Promise<string | null> {
    try {
      const pluginDir = this.getPluginDir();
      const doclingScript = path.join(pluginDir, "tools", "docling_extract.py");
      const ocrMode =
        this.settings.ocrMode === "force_low_quality" ? "auto" : this.settings.ocrMode;
      const args = ["--quality-only", "--pdf", pdfPath, "--ocr", ocrMode];
      const logPath = this.settings.enableFileLogging ? this.getLogFileAbsolutePath() : null;
      if (logPath) {
        args.push("--log-file", logPath);
      }
      if (this.settings.ocrMode === "force_low_quality") {
        args.push("--force-ocr-low-quality");
      }
      args.push("--quality-threshold", String(this.settings.ocrQualityThreshold));
      if (languageHint) {
        args.push("--language-hint", languageHint);
      }
      const output = await this.runPythonWithOutput(doclingScript, args, logPath);
      const payload = JSON.parse(output);
      const quality = payload?.confidence_proxy;
      if (typeof quality === "number") {
        return quality.toFixed(2);
      }
    } catch (error) {
      console.warn("Failed to read Docling quality from PDF", error);
    }
    return null;
  }

  private async promptDocId(): Promise<string | null> {
    return new Promise((resolve) => {
      new TextPromptModal(
        this.app,
        "Rebuild Zotero note from cache",
        "Enter Zotero doc_id (e.g., ABC123)",
        (value) => resolve(value),
        "Doc ID cannot be empty."
      ).open();
    });
  }

  private async promptLanguageHint(): Promise<string | null> {
    return new Promise((resolve) => {
      new LanguageSuggestModal(this.app, resolve).open();
    });
  }

  private registerRibbonIcons(): void {
    addIcon("zrr-picker", ZRR_PICKER_ICON);
    addIcon("zrr-chat", ZRR_CHAT_ICON);

    const pickerButton = this.addRibbonIcon(
      "zrr-picker",
      "Import Zotero item and index",
      () => this.importZoteroItem()
    );
    pickerButton.addClass("zrr-ribbon-picker");

    const chatButton = this.addRibbonIcon(
      "zrr-chat",
      "Open Zotero RAG chat",
      () => this.openChatView(true)
    );
    chatButton.addClass("zrr-ribbon-chat");
  }

  private async confirmOverwrite(notePath: string): Promise<boolean> {
    return new Promise((resolve) => {
      new ConfirmOverwriteModal(this.app, notePath, resolve).open();
    });
  }

  private async resolveLanguageHint(
    values: ZoteroItemValues,
    itemKey?: string
  ): Promise<string | null> {
    const existingRaw = typeof values.language === "string" ? values.language : "";
    const existing = this.normalizeZoteroLanguage(existingRaw);
    if (existing) {
      return existing;
    }
    const selected = await this.promptLanguageHint();
    if (selected === null) {
      console.info("Language selection canceled.");
      return null;
    }
    const trimmed = this.normalizeZoteroLanguage(selected);
    if (!trimmed) {
      console.info("Language selection empty; skipping Zotero update.");
      return "";
    }
    values.language = trimmed;
    console.info("Language selected", { language: trimmed, itemKey });
    if (itemKey) {
      try {
        await this.updateZoteroItemLanguage(itemKey, values, trimmed);
        new Notice("Saved language to Zotero.");
      } catch (error) {
        new Notice("Failed to write language back to Zotero.");
        console.error(error);
      }
    } else {
      console.warn("Language selected but itemKey is missing; skipping Zotero update.");
    }
    return trimmed;
  }

  private normalizeZoteroLanguage(value: string): string {
    return (value || "").trim().toLowerCase();
  }

  private buildDoclingLanguageHint(languageHint?: string | null): string | null {
    const normalized = this.normalizeZoteroLanguage(languageHint ?? "");
    if (!normalized) {
      return null;
    }
    const tokens = normalized.split(/[^a-z]+/).filter(Boolean);
    const hasGerman = tokens.some((token) => ["de", "deu", "ger", "german"].includes(token));
    const hasEnglish = tokens.some((token) => ["en", "eng", "english"].includes(token));
    if (hasGerman && hasEnglish) {
      return "deu+eng";
    }
    if (hasGerman) {
      return "deu";
    }
    if (hasEnglish) {
      return "eng";
    }
    if (tokens.length === 1 && ISO_639_1_TO_3[tokens[0]]) {
      return ISO_639_1_TO_3[tokens[0]];
    }
    return normalized;
  }

  private async fetchZoteroItem(itemKey: string): Promise<any | null> {
    try {
      const url = this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${itemKey}`);
      const payload = await this.requestLocalApi(url, `Zotero item fetch failed for ${url}`);
      return JSON.parse(payload.toString("utf8"));
    } catch (error) {
      console.warn("Failed to fetch Zotero item from local API", error);
      if (this.canUseWebApi()) {
        return this.fetchZoteroItemWeb(itemKey);
      }
      return null;
    }
  }

  private async fetchZoteroCollectionTitle(collectionKey: string): Promise<string> {
    const key = (collectionKey || "").trim();
    if (!key) {
      return "";
    }
    const cached = this.collectionTitleCache.get(key);
    if (cached !== undefined) {
      return cached;
    }
    const url = this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/collections/${key}`);
    try {
      const payload = await this.requestLocalApi(url, `Zotero collection fetch failed for ${url}`);
      const parsed = JSON.parse(payload.toString("utf8"));
      const title = String(parsed?.data?.name ?? parsed?.name ?? "").trim();
      this.collectionTitleCache.set(key, title);
      return title;
    } catch (error) {
      if (!this.canUseWebApi()) {
        this.collectionTitleCache.set(key, "");
        return "";
      }
      try {
        const webUrl = this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/collections/${key}`);
        const payload = await this.requestWebApi(webUrl, `Zotero Web API collection fetch failed for ${webUrl}`);
        const parsed = JSON.parse(payload.toString("utf8"));
        const title = String(parsed?.data?.name ?? parsed?.name ?? "").trim();
        this.collectionTitleCache.set(key, title);
        return title;
      } catch (webError) {
        console.warn("Failed to fetch Zotero collection title", webError);
        this.collectionTitleCache.set(key, "");
        return "";
      }
    }
  }

  private async resolveCollectionTitles(values: ZoteroItemValues): Promise<string[]> {
    const raw = Array.isArray(values.collections) ? values.collections : [];
    const keys = raw.map((entry) => String(entry || "").trim()).filter(Boolean);
    if (!keys.length) {
      return [];
    }
    const titles: string[] = [];
    for (const key of keys) {
      const title = await this.fetchZoteroCollectionTitle(key);
      if (title) {
        titles.push(title);
      }
    }
    return titles;
  }

  private async fetchZoteroItemWeb(itemKey: string): Promise<any | null> {
    try {
      const url = this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/items/${itemKey}`);
      const payload = await this.requestWebApi(url, `Zotero Web API fetch failed for ${url}`);
      return JSON.parse(payload.toString("utf8"));
    } catch (error) {
      console.warn("Failed to fetch Zotero item from Web API", error);
      return null;
    }
  }

  private async searchZoteroItemsWeb(query: string): Promise<ZoteroLocalItem[]> {
    const params = new URLSearchParams();
    params.set("itemType", "-attachment");
    params.set("limit", "25");
    params.set("include", "data,meta");
    if (query.trim()) {
      params.set("q", query.trim());
    }
    const url = this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/items?${params.toString()}`);
    const payload = await this.requestWebApi(url, `Zotero Web API search failed for ${url}`);
    const parsed = JSON.parse(payload.toString("utf8"));
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((entry: any) => ({
        key: entry.key ?? entry.data?.key,
        data: entry.data ?? {},
        meta: entry.meta ?? {},
      }))
      .filter((entry: ZoteroLocalItem) => typeof entry.key === "string" && entry.key.trim().length > 0);
  }

  private async updateZoteroItemLanguage(
    itemKey: string,
    values: ZoteroItemValues,
    language: string
  ): Promise<void> {
    try {
      await this.updateZoteroItemLanguageLocal(itemKey, values, language);
      return;
    } catch (error) {
      if (!this.canUseWebApi()) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      console.info("Local Zotero write failed; trying Web API", { itemKey, reason: message });
      await this.updateZoteroItemLanguageWeb(itemKey, values, language);
    }
  }

  private async updateZoteroItemLanguageLocal(
    itemKey: string,
    values: ZoteroItemValues,
    language: string
  ): Promise<void> {
    const url = this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${itemKey}`);
    const payload = { ...values, language };
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Zotero-API-Version": "3",
    };
    const version = typeof payload.version === "number" ? payload.version : Number(payload.version);
    if (!Number.isNaN(version)) {
      headers["If-Unmodified-Since-Version"] = String(version);
    }

    console.info("Zotero language PUT", { url, itemKey, language });
    try {
      const response = await this.requestLocalApiWithBody(
        url,
        "PUT",
        payload,
        headers,
        `Zotero update failed for ${url}`
      );
      console.info("Zotero language PUT response", { status: response.statusCode });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("status 501")) {
        throw error;
      }
      const postUrl = this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items`);
      console.info("Zotero language PUT unsupported; trying POST", { postUrl });
      const response = await this.requestLocalApiWithBody(
        postUrl,
        "POST",
        [payload],
        headers,
        `Zotero update failed for ${postUrl}`
      );
      console.info("Zotero language POST response", { status: response.statusCode });
    }

    const refreshed = await this.fetchZoteroItem(itemKey);
    const persisted = this.normalizeZoteroLanguage(
      typeof refreshed?.data?.language === "string" ? refreshed.data.language : ""
    );
    if (persisted === this.normalizeZoteroLanguage(language)) {
      return;
    }

    const updatedValues = { ...(refreshed?.data ?? values), language };
    const wrapper = {
      key: itemKey,
      version: refreshed?.data?.version ?? refreshed?.version ?? version,
      data: updatedValues,
    };
    const retryHeaders = { ...headers };
    const retryVersion = typeof wrapper.version === "number" ? wrapper.version : Number(wrapper.version);
    if (!Number.isNaN(retryVersion)) {
      retryHeaders["If-Unmodified-Since-Version"] = String(retryVersion);
    } else {
      delete retryHeaders["If-Unmodified-Since-Version"];
    }

    const retryResponse = await this.requestLocalApiWithBody(
      url,
      "PUT",
      wrapper,
      retryHeaders,
      `Zotero update failed for ${url}`
    );
    console.info("Zotero language PUT retry response", { status: retryResponse.statusCode });

    const finalItem = await this.fetchZoteroItem(itemKey);
    const finalLanguage = this.normalizeZoteroLanguage(
      typeof finalItem?.data?.language === "string" ? finalItem.data.language : ""
    );
    if (finalLanguage !== this.normalizeZoteroLanguage(language)) {
      throw new Error("Language update did not persist in Zotero.");
    }
  }

  private async updateZoteroItemLanguageWeb(
    itemKey: string,
    values: ZoteroItemValues,
    language: string
  ): Promise<void> {
    const libraryPath = this.getWebApiLibraryPath();
    if (!libraryPath) {
      throw new Error("Web API library path is not configured.");
    }
    const url = this.buildWebApiUrl(`/${libraryPath}/items/${itemKey}`);
    const current = await this.fetchZoteroItemWeb(itemKey);
    const payload = { ...(current?.data ?? values), language };
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Zotero-API-Version": "3",
      "Zotero-API-Key": this.settings.webApiKey,
    };
    const version = current?.data?.version ?? current?.version ?? values?.version;
    const numericVersion = typeof version === "number" ? version : Number(version);
    if (!Number.isNaN(numericVersion)) {
      headers["If-Unmodified-Since-Version"] = String(numericVersion);
    }

    console.info("Zotero Web API language PUT", { url, itemKey, language });
    const response = await this.requestWebApiWithBody(
      url,
      "PUT",
      payload,
      headers,
      `Zotero Web API update failed for ${url}`
    );
    console.info("Zotero Web API language PUT response", { status: response.statusCode });

    const refreshed = await this.fetchZoteroItemWeb(itemKey);
    const persisted = this.normalizeZoteroLanguage(
      typeof refreshed?.data?.language === "string" ? refreshed.data.language : ""
    );
    if (persisted !== this.normalizeZoteroLanguage(language)) {
      throw new Error("Language update did not persist in Zotero Web API.");
    }
  }

  private getDocId(values: ZoteroItemValues): string | null {
    const candidates = [values.key, values.itemKey, values.id, values.citationKey];
    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate.trim();
      }
    }
    return null;
  }

  private sanitizeFileName(value: string): string {
    const cleaned = value.replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, " ").trim();
    if (!cleaned) {
      return "";
    }
    const normalized = cleaned.replace(/[.]+$/g, "").trim();
    return normalized.slice(0, 120);
  }

  private registerNoteRenameHandler(): void {
    this.registerEvent(
      this.app.vault.on("rename", async (file) => {
        if (!(file instanceof TFile) || file.extension !== "md") {
          return;
        }
        try {
          const content = await this.app.vault.read(file);
          const docId = this.extractDocIdFromFrontmatter(content);
          if (!docId) {
            return;
          }
          await this.updateDocIndex({
            doc_id: docId,
            note_path: file.path,
            note_title: path.basename(file.path, ".md"),
          });
        } catch (error) {
          console.warn("Failed to update doc index for renamed note", error);
        }
      })
    );
  }

  private registerNoteSyncHandler(): void {
    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        if (!(file instanceof TFile) || file.extension !== "md") {
          return;
        }
        if (this.noteSyncSuppressed.has(file.path)) {
          return;
        }
        this.scheduleNoteSync(file);
      })
    );
  }

  private registerChunkExcludeMenu(): void {
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor) => {
        const found = this.findChunkAtCursor(editor);
        if (!found) {
          return;
        }
        menu.addItem((item) => {
          item
            .setTitle("Toggle ZRR chunk exclude")
            .onClick(() => this.toggleChunkExclude(editor, found.startLine));
        });
      })
    );
  }

  private findChunkStartLine(
    editor: Editor,
    fromLine?: number
  ): { line: number; text: string } | null {
    let line = fromLine ?? editor.getCursor().line;
    for (; line >= 0; line -= 1) {
      const text = editor.getLine(line);
      if (ZRR_CHUNK_START_RE.test(text)) {
        return { line, text };
      }
      if (ZRR_SYNC_START_RE.test(text) || ZRR_SYNC_END_RE.test(text)) {
        break;
      }
    }
    return null;
  }

  private findChunkEndLine(editor: Editor, fromLine: number): number | null {
    for (let line = fromLine; line < editor.lineCount(); line += 1) {
      const text = editor.getLine(line);
      if (ZRR_CHUNK_END_RE.test(text)) {
        return line;
      }
      if (ZRR_SYNC_END_RE.test(text)) {
        break;
      }
    }
    return null;
  }

  private findChunkAtCursor(
    editor: Editor,
    fromLine?: number
  ): { startLine: number; endLine: number; text: string } | null {
    const cursorLine = fromLine ?? editor.getCursor().line;
    const start = this.findChunkStartLine(editor, cursorLine);
    if (!start) {
      return null;
    }
    const endLine = this.findChunkEndLine(editor, start.line + 1);
    if (endLine === null || cursorLine < start.line || cursorLine > endLine) {
      return null;
    }
    return { startLine: start.line, endLine, text: start.text };
  }

  public toggleChunkExclude(editor: Editor, fromLine?: number): void {
    const found = this.findChunkAtCursor(editor, fromLine);
    if (!found) {
      new Notice("No synced chunk found at cursor.");
      return;
    }
    const startMatch = found.text.match(ZRR_CHUNK_START_RE);
    if (!startMatch) {
      new Notice("Invalid chunk marker.");
      return;
    }
    let attrs = (startMatch[1] ?? "").trim();
    const endLine = found.endLine;
    let hasExcludeMarker = false;
    if (endLine !== null) {
      for (let line = found.startLine + 1; line < endLine; line += 1) {
        if (ZRR_CHUNK_EXCLUDE_ANY_RE.test(editor.getLine(line))) {
          hasExcludeMarker = true;
          break;
        }
      }
    }
    const hasExcludeAttr = /\bexclude\b/i.test(attrs) || /\bdelete\b/i.test(attrs);
    const hasExclude = hasExcludeAttr || hasExcludeMarker;
    if (hasExclude) {
      attrs = attrs.replace(/\b(delete|exclude)\b/gi, "").replace(/\s{2,}/g, " ").trim();
    } else {
      attrs = attrs ? `${attrs} exclude` : "exclude";
    }
    const newLine = `<!-- zrr:chunk${attrs ? " " + attrs : ""} -->`;
    if (newLine !== found.text) {
      editor.replaceRange(
        newLine,
        { line: found.startLine, ch: 0 },
        { line: found.startLine, ch: found.text.length }
      );
    }
    if (hasExclude && endLine !== null) {
      const deleteLines: number[] = [];
      for (let line = found.startLine + 1; line < endLine; line += 1) {
        if (ZRR_CHUNK_EXCLUDE_ANY_RE.test(editor.getLine(line))) {
          deleteLines.push(line);
        }
      }
      for (let idx = deleteLines.length - 1; idx >= 0; idx -= 1) {
        const line = deleteLines[idx];
        const lineCount = editor.lineCount();
        if (line < lineCount - 1) {
          editor.replaceRange("", { line, ch: 0 }, { line: line + 1, ch: 0 });
        } else {
          editor.replaceRange("", { line, ch: 0 }, { line, ch: editor.getLine(line).length });
        }
      }
    }
    new Notice(hasExclude ? "Chunk included." : "Chunk excluded from index.");
  }

  public toggleChunkExcludeFromToolbar(startLine: number): void {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) {
      new Notice("No active editor found.");
      return;
    }
    const line = Math.max(0, startLine - 1);
    this.toggleChunkExclude(view.editor, line);
  }

  public async openChunkTagEditor(docId: string, chunkId: string): Promise<void> {
    const chunkPath = normalizePath(`${CHUNK_CACHE_DIR}/${docId}.json`);
    const adapter = this.app.vault.adapter;
    if (!(await adapter.exists(chunkPath))) {
      new Notice("Chunk cache not found for this document.");
      return;
    }
    const payload = await this.readChunkPayload(chunkPath);
    if (!payload) {
      new Notice("Failed to read chunk cache.");
      return;
    }
    const chunks = Array.isArray(payload.chunks) ? payload.chunks : [];
    const target = this.resolveChunkFromPayload(chunks, chunkId, docId);
    if (!target) {
      new Notice(`Chunk ${chunkId} not found in cache.`);
      return;
    }
    const rawTags = target.chunk_tags ?? [];
    const initialTags = Array.isArray(rawTags)
      ? rawTags.map((tag) => String(tag).trim()).filter((tag) => tag)
      : String(rawTags)
          .split(/[|,;\n]+/)
          .map((tag) => tag.trim())
          .filter((tag) => tag);
    new ChunkTagModal(this.app, chunkId, initialTags, async (tags) => {
      if (tags.length > 0) {
        target.chunk_tags = tags;
      } else {
        delete target.chunk_tags;
      }
      await adapter.write(chunkPath, JSON.stringify(payload, null, 2));
      await this.reindexChunkUpdates(docId, chunkPath, [String(target.chunk_id || chunkId)], []);
      new Notice("Chunk tags updated.");
    }).open();
  }

  public async openChunkIndexedTextPreview(docId: string, chunkId: string): Promise<void> {
    const chunkPath = normalizePath(`${CHUNK_CACHE_DIR}/${docId}.json`);
    const adapter = this.app.vault.adapter;
    if (!(await adapter.exists(chunkPath))) {
      new Notice("Chunk cache not found for this document.");
      return;
    }
    const payload = await this.readChunkPayload(chunkPath);
    if (!payload) {
      new Notice("Failed to read chunk cache.");
      return;
    }
    const chunks = Array.isArray(payload.chunks) ? payload.chunks : [];
    const target = this.resolveChunkFromPayload(chunks, chunkId, docId);
    if (!target) {
      new Notice(`Chunk ${chunkId} not found in cache.`);
      return;
    }
    const text = typeof target.text === "string" ? target.text : String(target.text ?? "");
    const indexedText = await this.renderMarkdownToIndexText(text);
    const note = this.settings.embedIncludeMetadata
      ? "Note: metadata is prepended during embedding when enabled.\n\n"
      : "";
    new ChunkTextPreviewModal(
      this.app,
      `Indexed text for ${chunkId}`,
      `${note}${indexedText}`
    ).open();
  }

  public async openChunkInZotero(docId: string, chunkId: string): Promise<void> {
    const chunkPath = normalizePath(`${CHUNK_CACHE_DIR}/${docId}.json`);
    const adapter = this.app.vault.adapter;
    let payload: Record<string, any> | null = null;
    if (await adapter.exists(chunkPath)) {
      payload = await this.readChunkPayload(chunkPath);
    }
    const chunks = Array.isArray(payload?.chunks) ? payload?.chunks : [];
    const target = this.resolveChunkFromPayload(chunks, chunkId, docId);
    const pageStart = target?.page_start ?? target?.pageStart;
    let attachmentKey =
      payload?.metadata?.attachment_key ?? payload?.metadata?.attachmentKey ?? "";
    if (!attachmentKey) {
      const entry = await this.getDocIndexEntry(docId);
      attachmentKey = entry?.attachment_key ?? "";
    }
    if (!attachmentKey) {
      new Notice("Attachment key not found for Zotero deeplink.");
      return;
    }
    const page = typeof pageStart === "number" ? String(pageStart) : "";
    const url = this.buildZoteroDeepLink(docId, attachmentKey, page);
    this.openExternalUrl(url);
  }

  public async cleanChunkFromToolbar(startLine: number): Promise<void> {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) {
      new Notice("No active editor found.");
      return;
    }
    const editor = view.editor;
    const line = Math.max(0, startLine - 1);
    const chunk = this.findChunkAtCursor(editor, line);
    if (!chunk) {
      new Notice("No synced chunk found at cursor.");
      return;
    }
    const textLines: string[] = [];
    for (let idx = chunk.startLine + 1; idx < chunk.endLine; idx += 1) {
      textLines.push(editor.getLine(idx));
    }
    const rawText = textLines.join("\n").trim();
    if (!rawText) {
      new Notice("Chunk has no text to clean.");
      return;
    }
    this.showStatusProgress("Cleaning chunk...", null);
    let cleaned: string | null = null;
    try {
      cleaned = await this.requestOcrCleanup(rawText);
    } finally {
      if (!cleaned) {
        this.clearStatusProgress();
      }
    }
    if (!cleaned) {
      return;
    }
    if (cleaned.trim() === rawText.trim()) {
      new Notice("Cleanup produced no changes.");
      this.clearStatusProgress();
      return;
    }
    const insert = `${cleaned.trim()}\n`;
    editor.replaceRange(
      insert,
      { line: chunk.startLine + 1, ch: 0 },
      { line: chunk.endLine, ch: 0 }
    );
    this.showStatusProgress("Chunk cleaned.", 100);
    window.setTimeout(() => this.clearStatusProgress(), 1200);
    new Notice("Chunk cleaned.");
  }

  private async requestOcrCleanup(text: string): Promise<string | null> {
    const baseUrl = (this.settings.llmCleanupBaseUrl || "").trim().replace(/\/$/, "");
    const model = (this.settings.llmCleanupModel || "").trim();
    if (!baseUrl || !model) {
      new Notice("OCR cleanup model is not configured.");
      this.openPluginSettings();
      return null;
    }
    const maxChars = Number(this.settings.llmCleanupMaxChars || 0);
    if (maxChars > 0 && text.length > maxChars) {
      new Notice("Chunk exceeds OCR cleanup max length. Adjust settings to clean it.");
      this.openPluginSettings();
      return null;
    }
    const endpoint = `${baseUrl}/chat/completions`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const apiKey = (this.settings.llmCleanupApiKey || "").trim();
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }
    const payload = {
      model,
      temperature: Number(this.settings.llmCleanupTemperature ?? 0),
      messages: [
        {
          role: "system",
          content:
            "You are an OCR cleanup assistant. Fix OCR errors without changing meaning. Do not add content. Return corrected text only.",
        },
        { role: "user", content: text },
      ],
    };
    try {
      const response = await this.requestLocalApiRaw(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (response.statusCode >= 400) {
        const details = response.body.toString("utf8");
        throw new Error(`Cleanup request failed (${response.statusCode}): ${details || "no response body"}`);
      }
      const data = JSON.parse(response.body.toString("utf8"));
      const content =
        data?.choices?.[0]?.message?.content ??
        data?.choices?.[0]?.text ??
        data?.output_text ??
        "";
      const cleaned = String(content || "").trim();
      if (!cleaned) {
        new Notice("Cleanup returned empty text.");
        return null;
      }
      return cleaned;
    } catch (error) {
      console.error("OCR cleanup failed", error);
      new Notice("OCR cleanup failed. Check the cleanup model settings.");
      return null;
    }
  }

  private async renderMarkdownToIndexText(markdown: string): Promise<string> {
    if (!markdown) {
      return "";
    }
    const container = document.createElement("div");
    try {
      await MarkdownRenderer.renderMarkdown(markdown, container, "", this);
    } catch (error) {
      console.warn("Failed to render markdown for index preview", error);
      return this.normalizeIndexPreviewText(markdown);
    }
    const html = container.innerHTML || "";
    const withBreaks = html.replace(/<br\s*\/?>/gi, "\n");
    const stripped = withBreaks.replace(/<[^>]+>/g, " ");
    const decoder = document.createElement("textarea");
    decoder.innerHTML = stripped;
    const decoded = decoder.value || stripped;
    return this.normalizeIndexPreviewText(decoded);
  }

  private normalizeIndexPreviewText(text: string): string {
    return text
      .replace(/[ \t]+/g, " ")
      .replace(/\s*\n\s*/g, "\n")
      .replace(/\s+/g, " ")
      .trim();
  }

  private scheduleNoteSync(file: TFile): void {
    const existing = this.noteSyncTimers.get(file.path);
    if (existing !== undefined) {
      window.clearTimeout(existing);
    }
    const handle = window.setTimeout(() => {
      this.noteSyncTimers.delete(file.path);
      void this.syncNoteToRedis(file);
    }, 1200);
    this.noteSyncTimers.set(file.path, handle);
  }

  private escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private formatCitationPageLabel(citation: ChatCitation): string {
    const start = citation.page_start ? String(citation.page_start) : "";
    const end = citation.page_end ? String(citation.page_end) : "";
    if (start && (!end || start === end)) {
      return start;
    }
    if (start && end) {
      return `${start} - ${end}`;
    }
    const raw = (citation.pages || "").trim();
    if (!raw) {
      return "?";
    }
    const match = raw.match(/^(\d+)\s*-\s*(\d+)$/);
    if (match) {
      return match[1] === match[2] ? match[1] : `${match[1]} - ${match[2]}`;
    }
    return raw.replace("-", " - ");
  }

  private normalizeChunkIdForNote(chunkId?: string, docId?: string): string | null {
    if (!chunkId) {
      return null;
    }
    const raw = String(chunkId);
    if (docId && raw.startsWith(`${docId}:`)) {
      return raw.slice(docId.length + 1);
    }
    if (raw.includes(":")) {
      const parts = raw.split(":");
      if (parts.length > 1 && docId && parts[0] === docId) {
        return parts.slice(1).join(":");
      }
    }
    return raw;
  }

  private async syncNoteToRedis(file: TFile): Promise<void> {
    if (this.noteSyncInFlight.has(file.path)) {
      return;
    }
    if (this.noteSyncSuppressed.has(file.path)) {
      return;
    }
    this.noteSyncInFlight.add(file.path);
    try {
      const content = await this.app.vault.read(file);
      const syncSection = this.extractSyncSection(content);
      if (!syncSection) {
        return;
      }
      const docId =
        this.extractDocIdFromFrontmatter(content) ?? this.extractDocIdFromSyncMarker(content);
      if (!docId) {
        return;
      }

      const parsedBlocks = this.parseSyncedChunkBlocks(syncSection);
      if (!parsedBlocks.length) {
        return;
      }

      const chunkPath = normalizePath(`${CHUNK_CACHE_DIR}/${docId}.json`);
      const adapter = this.app.vault.adapter;
      if (!(await adapter.exists(chunkPath))) {
        return;
      }
      const chunkPayload = await this.readChunkPayload(chunkPath);
      if (!chunkPayload) {
        return;
      }
      const chunks = Array.isArray(chunkPayload.chunks) ? chunkPayload.chunks : [];
      const chunkMap = new Map<string, Record<string, any>>();
      for (const chunk of chunks) {
        const id = typeof chunk?.chunk_id === "string" ? chunk.chunk_id : String(chunk?.chunk_id ?? "");
        if (id) {
          chunkMap.set(id, chunk);
        }
      }

      const seen = new Set<string>();
      const updates = new Set<string>();
      const deletions = new Set<string>();
      const removals = new Set<string>();
      let payloadUpdated = false;

      for (const block of parsedBlocks) {
        const chunkId = block.chunkId;
        if (!chunkId) {
          continue;
        }
        seen.add(chunkId);
        const existing = chunkMap.get(chunkId);
        if (!existing) {
          console.warn(`Sync note: chunk id not found in cache (${chunkId})`);
          continue;
        }
        if (block.excludeFlag) {
          if (existing.excluded !== true) {
            existing.excluded = true;
            payloadUpdated = true;
          }
          const normalized = this.normalizeChunkText(block.text);
          if (normalized && normalized !== String(existing.text ?? "")) {
            existing.text = normalized;
            existing.char_count = normalized.length;
            payloadUpdated = true;
          }
          deletions.add(chunkId);
          continue;
        }
        if (existing.excluded) {
          existing.excluded = false;
          payloadUpdated = true;
          updates.add(chunkId);
        }
        if (!block.text.trim()) {
          deletions.add(chunkId);
          removals.add(chunkId);
          continue;
        }
        const normalized = this.normalizeChunkText(block.text);
        if (!normalized) {
          deletions.add(chunkId);
          removals.add(chunkId);
          continue;
        }
        const currentText = typeof existing.text === "string" ? existing.text : String(existing.text ?? "");
        if (normalized !== currentText) {
          existing.text = normalized;
          existing.char_count = normalized.length;
          updates.add(chunkId);
          payloadUpdated = true;
        }
      }

      for (const chunkId of chunkMap.keys()) {
        if (!seen.has(chunkId)) {
          deletions.add(chunkId);
          removals.add(chunkId);
        }
      }

      if (!updates.size && !deletions.size && !removals.size && !payloadUpdated) {
        return;
      }

      if (removals.size) {
        chunkPayload.chunks = chunks.filter((chunk) => {
          const id = typeof chunk?.chunk_id === "string" ? chunk.chunk_id : String(chunk?.chunk_id ?? "");
          return id && !removals.has(id);
        });
        payloadUpdated = true;
      }

      if (payloadUpdated || removals.size) {
        await adapter.write(chunkPath, JSON.stringify(chunkPayload, null, 2));
      }

      await this.reindexChunkUpdates(
        docId,
        chunkPath,
        Array.from(updates),
        Array.from(deletions)
      );
    } catch (error) {
      console.warn("Failed to sync note edits to Redis", error);
    } finally {
      this.noteSyncInFlight.delete(file.path);
    }
  }

  private extractSyncSection(content: string): string | null {
    const startMatch = ZRR_SYNC_START_RE.exec(content);
    if (!startMatch) {
      return null;
    }
    const afterStart = content.slice(startMatch.index + startMatch[0].length);
    const endMatch = ZRR_SYNC_END_RE.exec(afterStart);
    if (!endMatch) {
      return null;
    }
    return afterStart.slice(0, endMatch.index);
  }

  private extractDocIdFromSyncMarker(content: string): string | null {
    const startMatch = ZRR_SYNC_START_RE.exec(content);
    if (!startMatch) {
      return null;
    }
    const marker = startMatch[0] ?? "";
    const docMatch = marker.match(/doc_id=([\"']?)([^\"'\s]+)\1/i);
    return docMatch ? docMatch[2].trim() : null;
  }

  private parseSyncedChunkBlocks(section: string): ParsedChunkBlock[] {
    const lines = section.split(/\r?\n/);
    const blocks: ParsedChunkBlock[] = [];
    let currentId = "";
    let currentExclude = false;
    let currentLines: string[] = [];

    const flush = (): void => {
      if (!currentId) {
        return;
      }
      blocks.push({
        chunkId: currentId,
        text: currentLines.join("\n").trim(),
        excludeFlag: currentExclude,
      });
      currentId = "";
      currentExclude = false;
      currentLines = [];
    };

    for (const line of lines) {
      const startMatch = line.match(ZRR_CHUNK_START_RE);
      if (startMatch) {
        flush();
        const attrs = startMatch[1] ?? "";
        const idMatch = attrs.match(/id=([\"']?)([^\"'\s]+)\1/i);
        const chunkId = idMatch ? idMatch[2].trim() : "";
        if (!chunkId) {
          continue;
        }
        currentId = chunkId;
        currentExclude = /\bexclude\b/i.test(attrs) || /\bdelete\b/i.test(attrs);
        currentLines = [];
        continue;
      }
      if (ZRR_CHUNK_END_RE.test(line)) {
        flush();
        continue;
      }
      if (!currentId) {
        continue;
      }
      if (ZRR_CHUNK_EXCLUDE_ANY_RE.test(line)) {
        currentExclude = true;
        continue;
      }
      currentLines.push(line);
    }

    flush();
    return blocks;
  }

  private normalizeChunkText(text: string): string {
    return text
      .split(/\r?\n/)
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter((line, idx, arr) => !(line === "" && arr[idx - 1] === ""))
      .join("\n")
      .trim();
  }


  private buildSyncedDoclingContent(
    docId: string,
    chunkPayload: Record<string, any> | null,
    fallbackMarkdown: string
  ): string {
    const chunks = Array.isArray(chunkPayload?.chunks) ? chunkPayload?.chunks : [];
    if (!chunks.length) {
      return `<!-- zrr:sync-start doc_id=${docId} -->\n${fallbackMarkdown}\n<!-- zrr:sync-end -->`;
    }
    const parts: string[] = [`<!-- zrr:sync-start doc_id=${docId} -->`];
    for (const chunk of chunks) {
      const chunkId = typeof chunk?.chunk_id === "string" ? chunk.chunk_id.trim() : "";
      if (!chunkId) {
        continue;
      }
      const excluded = Boolean(chunk?.excluded || chunk?.exclude);
      const text = typeof chunk?.text === "string" ? chunk.text.trim() : "";
      const attrs = excluded ? ` id=${chunkId} exclude` : ` id=${chunkId}`;
      parts.push(`<!-- zrr:chunk${attrs} -->`);
      if (text) {
        parts.push(text);
      }
      parts.push("<!-- zrr:chunk end -->");
      parts.push("");
    }
    if (parts[parts.length - 1] === "") {
      parts.pop();
    }
    parts.push("<!-- zrr:sync-end -->");
    return parts.join("\n");
  }

  private async readChunkPayload(chunkPath: string): Promise<Record<string, any> | null> {
    try {
      const raw = await this.app.vault.adapter.read(chunkPath);
      return JSON.parse(raw);
    } catch (error) {
      console.warn("Failed to read cached chunks JSON", error);
      return null;
    }
  }

  private resolveChunkFromPayload(
    chunks: Record<string, any>[],
    chunkId: string,
    docId: string
  ): Record<string, any> | null {
    const normalized = this.normalizeChunkIdForNote(chunkId, docId) || chunkId;
    const candidates = new Set([chunkId, normalized, `${docId}:${chunkId}`]);
    for (const chunk of chunks) {
      const id = typeof chunk?.chunk_id === "string" ? chunk.chunk_id : String(chunk?.chunk_id ?? "");
      if (id && candidates.has(id)) {
        return chunk;
      }
    }
    return null;
  }

  private async writeNoteWithSyncSuppressed(notePath: string, content: string): Promise<void> {
    this.noteSyncSuppressed.add(notePath);
    try {
      await this.app.vault.adapter.write(notePath, content);
    } finally {
      window.setTimeout(() => {
        this.noteSyncSuppressed.delete(notePath);
      }, 1500);
    }
  }

  private async resolveNotePathForDocId(docId: string | undefined): Promise<string | null> {
    if (!docId) {
      return null;
    }
    const adapter = this.app.vault.adapter;
    const entry = await this.getDocIndexEntry(docId);
    if (entry?.note_path && (await adapter.exists(entry.note_path))) {
      return entry.note_path;
    }
    const noteEntries = await this.scanNotesForDocIds(this.settings.outputNoteDir);
    const fromScan = noteEntries[docId];
    if (fromScan?.note_path) {
      await this.updateDocIndex({
        doc_id: docId,
        note_path: fromScan.note_path,
        note_title: fromScan.note_title,
      });
      return fromScan.note_path;
    }
    return null;
  }

  private async resolveUniqueBaseName(baseName: string, docId: string): Promise<string> {
    const adapter = this.app.vault.adapter;
    const notePath = normalizePath(`${this.settings.outputNoteDir}/${baseName}.md`);
    const pdfPath = normalizePath(`${this.settings.outputPdfDir}/${baseName}.pdf`);
    const noteExists = await adapter.exists(notePath);
    const pdfExists = this.settings.copyPdfToVault ? await adapter.exists(pdfPath) : false;
    if (noteExists || pdfExists) {
      return `${baseName}-${docId}`;
    }
    return baseName;
  }

  async searchZoteroItems(query: string): Promise<ZoteroLocalItem[]> {
    const params = new URLSearchParams();
    params.set("itemType", "-attachment");
    params.set("limit", "25");
    params.set("include", "data,meta");
    if (query.trim()) {
      params.set("q", query.trim());
    }
    const url = this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items?${params.toString()}`);
    try {
      const payload = await this.requestLocalApi(url, `Zotero search failed for ${url}`);
      const items = JSON.parse(payload.toString("utf8"));
      if (!Array.isArray(items)) {
        return [];
      }
      return items
        .map((item) => ({
          key: item.key ?? item.data?.key,
          data: item.data ?? {},
          meta: item.meta ?? {},
        }))
        .filter((item) => typeof item.key === "string" && item.key.trim().length > 0);
    } catch (error) {
      console.warn("Failed to search Zotero via local API", error);
      if (!this.canUseWebApi()) {
        throw error;
      }
      return this.searchZoteroItemsWeb(query);
    }
  }

  private async resolvePdfAttachment(values: ZoteroItemValues, itemKey: string): Promise<PdfAttachment | null> {
    const fromValues = this.pickPdfAttachment(values);
    if (fromValues) {
      return fromValues;
    }

    try {
      const children = await this.fetchZoteroChildren(itemKey);
      for (const child of children) {
        const attachment = this.toPdfAttachment(child);
        if (attachment) {
          return attachment;
        }
      }
    } catch (error) {
      console.error("Failed to fetch Zotero children", error);
    }

    return null;
  }

  private pickPdfAttachment(values: ZoteroItemValues): PdfAttachment | null {
    const attachments = values.attachments ?? values.children ?? values.items ?? [];
    if (!Array.isArray(attachments)) {
      return null;
    }
    for (const attachment of attachments) {
      const pdfAttachment = this.toPdfAttachment(attachment);
      if (pdfAttachment) {
        return pdfAttachment;
      }
    }
    return null;
  }

  private toPdfAttachment(attachment: any): PdfAttachment | null {
    const contentType = attachment?.contentType ?? attachment?.mimeType ?? attachment?.data?.contentType;
    if (contentType !== "application/pdf") {
      return null;
    }
    const key = attachment?.key ?? attachment?.attachmentKey ?? attachment?.data?.key;
    if (!key) {
      return null;
    }
    const filePath = this.extractAttachmentPath(attachment);
    return filePath ? { key, filePath } : { key };
  }

  private extractAttachmentPath(attachment: any): string | null {
    const href =
      attachment?.links?.enclosure?.href ??
      attachment?.enclosure?.href ??
      attachment?.data?.links?.enclosure?.href;
    if (typeof href === "string" && href.startsWith("file://")) {
      try {
        return fileURLToPath(href);
      } catch {
        return null;
      }
    }
    return null;
  }

  private async fetchZoteroChildren(itemKey: string): Promise<any[]> {
    const url = this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${itemKey}/children`);
    try {
      const payload = await this.requestLocalApi(url, `Zotero children request failed for ${url}`);
      return JSON.parse(payload.toString("utf8"));
    } catch (error) {
      console.warn("Failed to fetch Zotero children from local API", error);
      if (!this.canUseWebApi()) {
        throw error;
      }
      const webUrl = this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/items/${itemKey}/children`);
      const payload = await this.requestWebApi(webUrl, `Zotero Web API children request failed for ${webUrl}`);
      return JSON.parse(payload.toString("utf8"));
    }
  }

  private async downloadZoteroPdf(attachmentKey: string): Promise<Buffer> {
    const url = this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${attachmentKey}/file`);
    try {
      const response = await this.requestLocalApiRaw(url);
      const redirected = await this.followFileRedirect(response);
      if (redirected) {
        return redirected;
      }
      if (response.statusCode >= 300) {
        throw new Error(`Request failed, status ${response.statusCode}`);
      }
      return response.body;
    } catch (error) {
      console.warn("Failed to download PDF from local API", error);
      if (!this.canUseWebApi()) {
        throw error;
      }
      const webUrl = this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/items/${attachmentKey}/file`);
      const response = await this.requestWebApiRaw(webUrl);
      const redirected = await this.followFileRedirect(response);
      if (redirected) {
        return redirected;
      }
      if (response.statusCode >= 300) {
        throw new Error(`Web API request failed, status ${response.statusCode}`);
      }
      return response.body;
    }
  }

  private buildZoteroUrl(pathname: string): string {
    const base = this.settings.zoteroBaseUrl.replace(/\/$/, "");
    return `${base}${pathname}`;
  }

  private canUseWebApi(): boolean {
    const base = (this.settings.webApiBaseUrl || "").trim();
    return Boolean(base && this.settings.webApiKey && this.settings.webApiLibraryId);
  }

  private getWebApiLibraryPath(): string {
    const libraryId = (this.settings.webApiLibraryId || "").trim();
    if (!libraryId) {
      return "";
    }
    const type = this.settings.webApiLibraryType === "group" ? "groups" : "users";
    return `${type}/${libraryId}`;
  }

  private buildWebApiUrl(pathname: string): string {
    const base = this.settings.webApiBaseUrl.replace(/\/$/, "");
    return `${base}${pathname}`;
  }

  private requestLocalApiRaw(
    url: string,
    options: { method?: string; headers?: Record<string, string>; body?: Buffer | string } = {}
  ): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: Buffer }> {
    return new Promise((resolve, reject) => {
      const parsed = new URL(url);
      const lib = parsed.protocol === "https:" ? https : http;
      const method = options.method ?? "GET";
      const headers: Record<string, string> = {
        Accept: "*/*",
        ...(options.headers ?? {}),
      };
      const body = options.body;
      if (body !== undefined && headers["Content-Length"] === undefined) {
        const length = Buffer.isBuffer(body) ? body.length : Buffer.byteLength(body);
        headers["Content-Length"] = String(length);
      }
      const request = lib.request(
        {
          method,
          hostname: parsed.hostname,
          port: parsed.port || undefined,
          path: `${parsed.pathname}${parsed.search}`,
          headers,
        },
        (response) => {
          const chunks: Buffer[] = [];
          response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
          response.on("end", () => {
            const body = Buffer.concat(chunks);
            resolve({
              statusCode: response.statusCode ?? 0,
              headers: response.headers,
              body,
            });
          });
        }
      );

      request.on("error", reject);
      if (body !== undefined) {
        request.write(body);
      }
      request.end();
    });
  }

  private async requestLocalApi(url: string, context?: string): Promise<Buffer> {
    const response = await this.requestLocalApiRaw(url);
    if (response.statusCode >= 400) {
      const details = response.body.toString("utf8");
      throw new Error(
        `${context ?? "Request failed"}, status ${response.statusCode}: ${details || "no response body"}`
      );
    }
    if (response.statusCode >= 300) {
      throw new Error(`${context ?? "Request failed"}, status ${response.statusCode}`);
    }
    return response.body;
  }

  private async requestLocalApiWithBody(
    url: string,
    method: string,
    payload: unknown,
    headers: Record<string, string>,
    context?: string
  ): Promise<{ statusCode: number; body: Buffer }> {
    const body = JSON.stringify(payload);
    const response = await this.requestLocalApiRaw(url, { method, headers, body });
    if (response.statusCode >= 400) {
      const details = response.body.toString("utf8");
      throw new Error(
        `${context ?? "Request failed"}, status ${response.statusCode}: ${details || "no response body"}`
      );
    }
    if (response.statusCode >= 300) {
      throw new Error(`${context ?? "Request failed"}, status ${response.statusCode}`);
    }
    return { statusCode: response.statusCode, body: response.body };
  }

  private async requestWebApi(url: string, context?: string): Promise<Buffer> {
    const headers: Record<string, string> = {
      "Zotero-API-Version": "3",
      "Zotero-API-Key": this.settings.webApiKey,
    };
    const response = await this.requestLocalApiRaw(url, { headers });
    if (response.statusCode >= 400) {
      const details = response.body.toString("utf8");
      throw new Error(
        `${context ?? "Request failed"}, status ${response.statusCode}: ${details || "no response body"}`
      );
    }
    if (response.statusCode >= 300) {
      throw new Error(`${context ?? "Request failed"}, status ${response.statusCode}`);
    }
    return response.body;
  }

  private requestWebApiRaw(
    url: string,
    options: { method?: string; headers?: Record<string, string>; body?: Buffer | string } = {}
  ): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: Buffer }> {
    const headers: Record<string, string> = {
      "Zotero-API-Version": "3",
      "Zotero-API-Key": this.settings.webApiKey,
      ...(options.headers ?? {}),
    };
    return this.requestLocalApiRaw(url, { ...options, headers });
  }

  private async requestWebApiWithBody(
    url: string,
    method: string,
    payload: unknown,
    headers: Record<string, string>,
    context?: string
  ): Promise<{ statusCode: number; body: Buffer }> {
    const body = JSON.stringify(payload);
    const response = await this.requestLocalApiRaw(url, { method, headers, body });
    if (response.statusCode >= 400) {
      const details = response.body.toString("utf8");
      throw new Error(
        `${context ?? "Request failed"}, status ${response.statusCode}: ${details || "no response body"}`
      );
    }
    if (response.statusCode >= 300) {
      throw new Error(`${context ?? "Request failed"}, status ${response.statusCode}`);
    }
    return { statusCode: response.statusCode, body: response.body };
  }

  private async followFileRedirect(
    response: { statusCode: number; headers: http.IncomingHttpHeaders; body: Buffer }
  ): Promise<Buffer | null> {
    if (response.statusCode < 300 || response.statusCode >= 400) {
      return null;
    }
    const location = response.headers.location;
    const href = Array.isArray(location) ? location[0] : location;
    if (!href || typeof href !== "string") {
      return null;
    }
    if (href.startsWith("file://")) {
      const filePath = fileURLToPath(href);
      return fs.readFile(filePath);
    }
    if (href.startsWith("http://") || href.startsWith("https://")) {
      return this.requestLocalApi(href);
    }
    return null;
  }

  private bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  }

  private async annotateChunkJsonWithAttachmentKey(chunkPath: string, attachmentKey: string): Promise<void> {
    if (!attachmentKey) {
      return;
    }
    try {
      const raw = await this.app.vault.adapter.read(chunkPath);
      const payload = JSON.parse(raw);
      if (!payload || typeof payload !== "object") {
        return;
      }
      const metadata = payload.metadata && typeof payload.metadata === "object" ? payload.metadata : {};
      metadata.attachment_key = attachmentKey;
      payload.metadata = metadata;
      await this.app.vault.adapter.write(chunkPath, JSON.stringify(payload, null, 2));
    } catch (error) {
      console.warn("Failed to annotate chunks JSON with attachment key", error);
    }
  }

  private async updateChunkJsonSourcePdf(chunkPath: string, sourcePdf: string): Promise<void> {
    if (!sourcePdf) {
      return;
    }
    try {
      const raw = await this.app.vault.adapter.read(chunkPath);
      const payload = JSON.parse(raw);
      if (!payload || typeof payload !== "object") {
        return;
      }
      payload.source_pdf = sourcePdf;
      await this.app.vault.adapter.write(chunkPath, JSON.stringify(payload, null, 2));
    } catch (error) {
      console.warn("Failed to update chunks JSON source_pdf", error);
    }
  }

  public buildPdfLinkFromSourcePath(sourcePdf: string): string {
    if (!sourcePdf) {
      return "";
    }
    const vaultBase = path.normalize(this.getVaultBasePath());
    const normalizedSource = path.normalize(sourcePdf);
    const vaultPrefix = vaultBase.endsWith(path.sep) ? vaultBase : `${vaultBase}${path.sep}`;
    if (normalizedSource.startsWith(vaultPrefix)) {
      const relative = normalizePath(path.relative(vaultBase, normalizedSource));
      return `[[${relative}]]`;
    }
    return `[PDF](${pathToFileURL(sourcePdf).toString()})`;
  }

  private toVaultRelativePath(sourcePath: string): string {
    if (!sourcePath) {
      return "";
    }
    const vaultBase = path.normalize(this.getVaultBasePath());
    const normalizedSource = path.normalize(sourcePath);
    const vaultPrefix = vaultBase.endsWith(path.sep) ? vaultBase : `${vaultBase}${path.sep}`;
    if (!normalizedSource.startsWith(vaultPrefix)) {
      return "";
    }
    return normalizePath(path.relative(vaultBase, normalizedSource));
  }

  private async isFileAccessible(filePath: string): Promise<boolean> {
    if (!filePath) {
      return false;
    }
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private deriveVaultPdfRelativePath(sourcePdf: string, title: string, docId: string): string {
    const rel = this.toVaultRelativePath(sourcePdf);
    if (rel && rel.startsWith(normalizePath(this.settings.outputPdfDir))) {
      return rel;
    }
    const baseName = this.sanitizeFileName(title) || docId;
    return normalizePath(`${this.settings.outputPdfDir}/${baseName}.pdf`);
  }

  private async recoverMissingPdfFromAttachment(
    sourcePdf: string,
    values: ZoteroItemValues,
    itemKey: string,
    docId: string,
    attachmentKey: string | undefined,
    title: string,
    showNotices: boolean
  ): Promise<{ sourcePdf: string; attachmentKey?: string } | null> {
    let attachment = await this.resolvePdfAttachment(values, itemKey);
    if (!attachment && attachmentKey) {
      attachment = { key: attachmentKey };
    }
    if (!attachment) {
      return null;
    }

    const resolvedAttachmentKey = attachment.key || attachmentKey;
    const filePath = attachment.filePath;

    if (!this.settings.copyPdfToVault && filePath && (await this.isFileAccessible(filePath))) {
      return { sourcePdf: filePath, attachmentKey: resolvedAttachmentKey };
    }

    try {
      await this.ensureFolder(this.settings.outputPdfDir);
    } catch (error) {
      console.error("Failed to create PDF output folder", error);
      return null;
    }

    const targetRel = this.deriveVaultPdfRelativePath(sourcePdf, title, docId);
    let buffer: Buffer;
    try {
      if (filePath && (await this.isFileAccessible(filePath))) {
        buffer = await fs.readFile(filePath);
      } else if (resolvedAttachmentKey) {
        buffer = await this.downloadZoteroPdf(resolvedAttachmentKey);
        if (!this.settings.copyPdfToVault && showNotices) {
          new Notice("Local PDF path unavailable; copied PDF into vault for processing.");
        }
      } else {
        return null;
      }
    } catch (error) {
      console.error("Failed to read or download PDF attachment", error);
      return null;
    }

    try {
      await this.app.vault.adapter.writeBinary(targetRel, this.bufferToArrayBuffer(buffer));
    } catch (error) {
      console.error("Failed to write recovered PDF into vault", error);
      return null;
    }

    const targetAbs = this.getAbsoluteVaultPath(targetRel);
    return { sourcePdf: targetAbs, attachmentKey: resolvedAttachmentKey };
  }

  private buildPdfLinkForNote(sourcePdf: string, attachmentKey?: string, docId?: string): string {
    if (!sourcePdf && !attachmentKey) {
      return "";
    }
    if (!this.settings.copyPdfToVault && attachmentKey) {
      const zoteroLink = this.buildZoteroDeepLink(docId ?? "", attachmentKey);
      return `[PDF](${zoteroLink})`;
    }
    return this.buildPdfLinkFromSourcePath(sourcePdf);
  }

  private buildVaultPdfCitationLink(
    sourcePdf: string,
    pageStart?: string,
    label?: string
  ): string {
    if (!sourcePdf) {
      return "";
    }
    const relative = this.toVaultRelativePath(sourcePdf);
    if (!relative) {
      return "";
    }
    const pageSuffix = pageStart ? `#page=${pageStart}` : "";
    const safeLabel = label || relative;
    return `[[${relative}${pageSuffix}|${safeLabel}]]`;
  }

  private async maybeCreateOcrLayeredPdf(
    sourcePdfPath: string,
    metadata: Record<string, any> | null,
    languageHint?: string | null
  ): Promise<string | null> {
    if (!this.settings.createOcrLayeredPdf) {
      return null;
    }
    if (!this.settings.copyPdfToVault) {
      return null;
    }
    if (!sourcePdfPath) {
      return null;
    }
    const ocrUsed = metadata?.ocr_used === true;
    if (!ocrUsed) {
      return null;
    }
    if (!this.toVaultRelativePath(sourcePdfPath)) {
      console.warn("OCR layered PDF requires a vault-local PDF");
      return null;
    }
    try {
      await this.ensureFolder(this.settings.outputPdfDir);
    } catch (error) {
      console.warn("Failed to create OCR PDF output folder", error);
      return null;
    }

    const outputAbs = `${sourcePdfPath}.ocr.tmp`;
    const language = (languageHint || metadata?.languages || "eng").toString();
    const pluginDir = this.getPluginDir();
    const script = path.join(pluginDir, "tools", "ocr_layered_pdf.py");

    try {
      this.showStatusProgress("Creating OCR PDF...", 0);
      await this.runPythonStreaming(
        script,
        [
          "--pdf",
          sourcePdfPath,
          "--out-pdf",
          outputAbs,
          "--language",
          language,
          "--progress",
        ],
        (payload) => {
          if (payload?.type === "progress" && payload.total) {
            const percent = Math.round((payload.current / payload.total) * 100);
            this.showStatusProgress(`Creating OCR PDF ${payload.current}/${payload.total}`, percent);
          }
        },
        () => undefined
      );
      await fs.rename(outputAbs, sourcePdfPath);
      return sourcePdfPath;
    } catch (error) {
      console.warn("OCR layered PDF creation failed", error);
      return null;
    }
  }

  private getMainLeaf(): WorkspaceLeaf {
    const chatLeaves = new Set(this.app.workspace.getLeavesOfType(VIEW_TYPE_ZOTERO_CHAT));
    const markdownLeaf = this.app.workspace.getLeavesOfType("markdown").find((leaf) => !chatLeaves.has(leaf));
    if (markdownLeaf) {
      return markdownLeaf;
    }
    const fallback = this.app.workspace.getLeaf(false);
    if (fallback && !chatLeaves.has(fallback)) {
      return fallback;
    }
    return this.app.workspace.getLeaf("tab");
  }

  public async openNoteInMain(notePath: string): Promise<void> {
    const normalized = normalizePath(notePath);
    const file = this.app.vault.getAbstractFileByPath(normalized);
    const leaf = this.getMainLeaf();
    if (file instanceof TFile) {
      await leaf.openFile(file, { active: true });
      return;
    }
    await this.app.workspace.openLinkText(normalized, "", false);
  }

  private findChunkLineInText(text: string, chunkId: string): number | null {
    if (!text || !chunkId) {
      return null;
    }
    const escapedId = this.escapeRegExp(chunkId);
    const markerRe = new RegExp(
      `<!--\\s*zrr:chunk\\b[^>]*\\bid=(["']?)${escapedId}\\1[^>]*-->`,
      "i"
    );
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i += 1) {
      if (markerRe.test(lines[i])) {
        return i;
      }
    }
    return null;
  }

  private async openNoteAtChunk(notePath: string, chunkId: string): Promise<boolean> {
    if (!notePath || !chunkId) {
      return false;
    }
    await this.openNoteInMain(notePath);
    const leaf = this.getMainLeaf();
    const view = leaf.view;
    if (!(view instanceof MarkdownView)) {
      return false;
    }
    const editor = view.editor;
    const normalizedChunkId = this.normalizeChunkIdForNote(chunkId) || chunkId;
    const line = this.findChunkLineInText(editor.getValue(), normalizedChunkId);
    if (line === null) {
      new Notice(`Chunk ${normalizedChunkId} not found in note.`);
      return false;
    }
    editor.setCursor({ line, ch: 0 });
    editor.scrollIntoView(
      { from: { line, ch: 0 }, to: { line, ch: 0 } },
      true
    );
    return true;
  }

  public async openInternalLinkInMain(linkText: string): Promise<void> {
    const leaf = this.getMainLeaf();
    const [linkPathRaw, anchorRaw] = linkText.split("#");
    const linkPath = (linkPathRaw || "").trim();
    const anchor = (anchorRaw || "").trim();
    const chunkAnchorPrefix = "zrr-chunk:";
    const file = linkPath
      ? this.app.metadataCache.getFirstLinkpathDest(linkPath, "")
      : null;
    if (file instanceof TFile) {
      const chunkId = anchor.startsWith(chunkAnchorPrefix)
        ? anchor.slice(chunkAnchorPrefix.length).trim()
        : "";
      if (chunkId) {
        const opened = await this.openNoteAtChunk(file.path, chunkId);
        if (opened) {
          return;
        }
      }
      await leaf.openFile(file, { active: true });
      if (linkText.includes("#") && !chunkId) {
        this.app.workspace.setActiveLeaf(leaf, { focus: true });
        await this.app.workspace.openLinkText(linkText, "", false);
      }
      return;
    }
    this.app.workspace.setActiveLeaf(leaf, { focus: true });
    await this.app.workspace.openLinkText(linkText, "", false);
  }

  private async openNoteInNewTab(notePath: string): Promise<void> {
    const normalized = normalizePath(notePath);
    await this.app.workspace.openLinkText(normalized, "", "tab");
  }

  public async openPdfInMain(sourcePdf: string, pageStart?: string): Promise<boolean> {
    if (!sourcePdf) {
      return false;
    }
    const vaultBase = path.normalize(this.getVaultBasePath());
    const normalizedSource = path.normalize(sourcePdf);
    const vaultPrefix = vaultBase.endsWith(path.sep) ? vaultBase : `${vaultBase}${path.sep}`;
    if (normalizedSource.startsWith(vaultPrefix)) {
      const relative = normalizePath(path.relative(vaultBase, normalizedSource));
      const pageSuffix = pageStart ? `#page=${pageStart}` : "";
      await this.app.workspace.openLinkText(`${relative}${pageSuffix}`, "", "tab");
      return true;
    }
    try {
      window.open(pathToFileURL(sourcePdf).toString());
      return true;
    } catch {
      return false;
    }
  }

  public openExternalUrl(url: string): void {
    if (!url) {
      return;
    }
    window.open(url);
  }

  private buildZoteroDeepLink(
    docId: string,
    attachmentKey?: string,
    pageStart?: string,
    annotationKey?: string
  ): string {
    if (attachmentKey) {
      const params = new URLSearchParams();
      if (pageStart) {
        params.set("page", pageStart);
      }
      if (annotationKey) {
        params.set("annotation", annotationKey);
      }
      const suffix = params.toString() ? `?${params.toString()}` : "";
      return `zotero://open-pdf/library/items/${attachmentKey}${suffix}`;
    }
    return `zotero://select/library/items/${docId}`;
  }

  private extractAnnotationKey(chunkId?: string): string | undefined {
    if (!chunkId) {
      return undefined;
    }
    const raw = chunkId.includes(":") ? chunkId.split(":").slice(1).join(":") : chunkId;
    const candidate = raw.trim().toUpperCase();
    if (/^[A-Z0-9]{8}$/.test(candidate)) {
      return candidate;
    }
    return undefined;
  }

  public formatCitationsMarkdown(citations: ChatCitation[]): string {
    if (!citations.length) {
      return "";
    }
    const lines = citations.map((citation) => this.formatCitationMarkdown(citation));
    return lines.filter(Boolean).join("\n");
  }

  private formatCitationMarkdown(citation: ChatCitation): string {
    const docId = citation.doc_id || "?";
    const label = `${docId}`;
    const pageLabel = this.formatCitationPageLabel(citation);
    const annotationKey = citation.annotation_key || this.extractAnnotationKey(citation.chunk_id);
    const attachmentKey = citation.attachment_key || this.docIndex?.[citation.doc_id || ""]?.attachment_key;
    const pageStart = citation.page_start ? String(citation.page_start) : "";
    const entry = this.docIndex?.[citation.doc_id || ""] ?? null;
    const noteTitle = entry?.zotero_title || entry?.note_title || label;
    const fullLabel = `${noteTitle} p. ${pageLabel}`;
    const chunkId = this.normalizeChunkIdForNote(citation.chunk_id, citation.doc_id);
    if (this.settings.preferObsidianNoteForCitations && chunkId && entry?.note_path) {
      return `- ${this.buildNoteChunkLink(entry.note_path, chunkId, fullLabel)}`;
    }
    if (attachmentKey) {
      const zoteroUrl = this.buildZoteroDeepLink(docId, attachmentKey, pageStart, annotationKey);
      return `- [${fullLabel}](${zoteroUrl})`;
    }
    return `- ${fullLabel}`;
  }

  private buildNoteChunkLink(notePath: string, chunkId: string, label: string): string {
    const target = normalizePath(notePath).replace(/\.md$/i, "");
    const anchor = `zrr-chunk:${chunkId}`;
    return `[[${target}#${anchor}|${label}]]`;
  }

  private generateChatId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private getDocIndexPath(): string {
    return normalizePath(`${CACHE_ROOT}/doc_index.json`);
  }

  public async getDocIndex(): Promise<Record<string, DocIndexEntry>> {
    if (this.docIndex) {
      return this.docIndex;
    }
    this.docIndex = await this.loadDocIndexFromDisk();
    return this.docIndex;
  }

  private async loadDocIndexFromDisk(): Promise<Record<string, DocIndexEntry>> {
    const adapter = this.app.vault.adapter;
    const indexPath = this.getDocIndexPath();
    if (!(await adapter.exists(indexPath))) {
      return {};
    }
    try {
      const raw = await adapter.read(indexPath);
      const payload = JSON.parse(raw);
      if (payload && typeof payload === "object") {
        const entries = payload.entries ?? payload;
        if (Array.isArray(entries)) {
          const map: Record<string, DocIndexEntry> = {};
          for (const entry of entries) {
            if (entry?.doc_id) {
              map[String(entry.doc_id)] = entry;
            }
          }
          return map;
        }
        if (entries && typeof entries === "object") {
          return entries as Record<string, DocIndexEntry>;
        }
      }
    } catch (error) {
      console.error("Failed to read doc index", error);
    }
    return {};
  }

  private async saveDocIndex(index: Record<string, DocIndexEntry>): Promise<void> {
    await this.ensureFolder(CACHE_ROOT);
    const adapter = this.app.vault.adapter;
    const indexPath = this.getDocIndexPath();
    const payload = { version: 1, entries: index };
    await adapter.write(indexPath, JSON.stringify(payload, null, 2));
    this.docIndex = index;
  }

  private async updateDocIndex(entry: Partial<DocIndexEntry> & { doc_id: string }): Promise<void> {
    const index = await this.getDocIndex();
    const existing = index[entry.doc_id] ?? { doc_id: entry.doc_id } as DocIndexEntry;
    const next: DocIndexEntry = {
      ...existing,
      ...entry,
      doc_id: entry.doc_id,
      updated_at: new Date().toISOString(),
    };

    if (entry.note_path === undefined && existing.note_path) {
      next.note_path = existing.note_path;
    }
    if (entry.note_title === undefined && existing.note_title) {
      next.note_title = existing.note_title;
    }
    if (entry.zotero_title === undefined && existing.zotero_title) {
      next.zotero_title = existing.zotero_title;
    }
    if (entry.pdf_path === undefined && existing.pdf_path) {
      next.pdf_path = existing.pdf_path;
    }
    if (entry.attachment_key === undefined && existing.attachment_key) {
      next.attachment_key = existing.attachment_key;
    }

    index[entry.doc_id] = next;
    await this.saveDocIndex(index);
  }

  private async hydrateDocIndexFromCache(docId: string): Promise<DocIndexEntry | null> {
    if (!docId) {
      return null;
    }
    const adapter = this.app.vault.adapter;
    const existingEntry = await this.getDocIndexEntry(docId);
    const updates: Partial<DocIndexEntry> = {};

    const itemPath = normalizePath(`${ITEM_CACHE_DIR}/${docId}.json`);
    if (await adapter.exists(itemPath)) {
      try {
        const raw = await adapter.read(itemPath);
        const item = JSON.parse(raw);
        const values: ZoteroItemValues = item?.data ?? item ?? {};
        const title = typeof values.title === "string" ? values.title : "";
        if (title) {
          updates.zotero_title = title;
        }
        if (!updates.note_title || !updates.note_path) {
          const baseName = this.sanitizeFileName(title) || docId;
          const primaryNote = normalizePath(`${this.settings.outputNoteDir}/${baseName}.md`);
          const fallbackNote = normalizePath(`${this.settings.outputNoteDir}/${baseName}-${docId}.md`);
          let notePath = "";
          if (await adapter.exists(primaryNote)) {
            notePath = primaryNote;
          } else if (await adapter.exists(fallbackNote)) {
            notePath = fallbackNote;
          }
          if (notePath) {
            updates.note_path = notePath;
            updates.note_title = path.basename(notePath, ".md");
          }
        }
      } catch (error) {
        console.error("Failed to read cached item JSON", error);
      }
    }

    if (!updates.note_title && existingEntry?.note_path) {
      updates.note_title = path.basename(existingEntry.note_path, ".md");
    }

    const chunkPath = normalizePath(`${CHUNK_CACHE_DIR}/${docId}.json`);
    if (await adapter.exists(chunkPath)) {
      try {
        const raw = await adapter.read(chunkPath);
        const payload = JSON.parse(raw);
        if (typeof payload?.source_pdf === "string") {
          updates.pdf_path = payload.source_pdf;
        }
      } catch (error) {
        console.error("Failed to read cached chunks JSON", error);
      }
    }

    if (Object.keys(updates).length > 0) {
      await this.updateDocIndex({ doc_id: docId, ...updates });
    }

    return this.getDocIndexEntry(docId);
  }

  private async getDocIndexEntry(docId: string): Promise<DocIndexEntry | null> {
    if (!docId) {
      return null;
    }
    const index = await this.getDocIndex();
    return index[docId] ?? null;
  }

  private async inferNotePathFromCache(docId: string): Promise<string> {
    const adapter = this.app.vault.adapter;
    const itemPath = normalizePath(`${ITEM_CACHE_DIR}/${docId}.json`);
    if (!(await adapter.exists(itemPath))) {
      return "";
    }
    try {
      const raw = await adapter.read(itemPath);
      const item = JSON.parse(raw);
      const values: ZoteroItemValues = item?.data ?? item ?? {};
      const title = typeof values.title === "string" ? values.title : "";
      const baseName = this.sanitizeFileName(title) || docId;
      const primaryNote = normalizePath(`${this.settings.outputNoteDir}/${baseName}.md`);
      const fallbackNote = normalizePath(`${this.settings.outputNoteDir}/${baseName}-${docId}.md`);
      if (await adapter.exists(primaryNote)) {
        return primaryNote;
      }
      if (await adapter.exists(fallbackNote)) {
        return fallbackNote;
      }
    } catch (error) {
      console.error("Failed to infer note path from cache", error);
    }
    return "";
  }

  private async rebuildNoteFromCacheForDocId(docId: string, showNotices: boolean): Promise<boolean> {
    try {
      await this.ensureBundledTools();
    } catch (error) {
      if (showNotices) {
        new Notice("Failed to sync bundled tools. See console for details.");
      }
      console.error(error);
      return false;
    }

    const adapter = this.app.vault.adapter;
    const itemPath = normalizePath(`${ITEM_CACHE_DIR}/${docId}.json`);
    const chunkPath = normalizePath(`${CHUNK_CACHE_DIR}/${docId}.json`);

    if (!(await adapter.exists(itemPath)) || !(await adapter.exists(chunkPath))) {
      if (showNotices) {
        new Notice("Cached item or chunks JSON not found.");
      }
      return false;
    }

    this.showStatusProgress("Preparing...", 5);

    let item: ZoteroLocalItem;
    try {
      const itemRaw = await adapter.read(itemPath);
      item = JSON.parse(itemRaw);
    } catch (error) {
      if (showNotices) {
        new Notice("Failed to read cached item JSON.");
      }
      console.error(error);
      this.clearStatusProgress();
      return false;
    }

    let chunkPayload: Record<string, any>;
    try {
      const chunkRaw = await adapter.read(chunkPath);
      chunkPayload = JSON.parse(chunkRaw);
    } catch (error) {
      if (showNotices) {
        new Notice("Failed to read cached chunks JSON.");
      }
      console.error(error);
      this.clearStatusProgress();
      return false;
    }

    const values: ZoteroItemValues = item.data ?? item;
    const title = typeof values.title === "string" ? values.title : "";
    const itemKey = (item.key ?? values.key ?? docId).toString();
    const existingEntry = await this.getDocIndexEntry(docId);
    let attachmentKey =
      typeof chunkPayload?.metadata?.attachment_key === "string"
        ? chunkPayload.metadata.attachment_key
        : existingEntry?.attachment_key;

    let sourcePdf = typeof chunkPayload.source_pdf === "string" ? chunkPayload.source_pdf : "";
    if (!sourcePdf || !(await this.isFileAccessible(sourcePdf))) {
      const recovered = await this.recoverMissingPdfFromAttachment(
        sourcePdf,
        values,
        itemKey,
        docId,
        attachmentKey,
        title,
        showNotices
      );
      if (!recovered) {
        if (showNotices) {
          new Notice("Cached source PDF is missing and could not be recovered.");
        }
        this.clearStatusProgress();
        return false;
      }
      sourcePdf = recovered.sourcePdf;
      if (recovered.attachmentKey) {
        attachmentKey = recovered.attachmentKey;
      }
      await this.updateChunkJsonSourcePdf(chunkPath, sourcePdf);
    }

    const languageHint = await this.resolveLanguageHint(values, itemKey);
    const doclingLanguageHint = this.buildDoclingLanguageHint(languageHint ?? undefined);
    let notePath = "";
    if (existingEntry?.note_path && (await adapter.exists(existingEntry.note_path))) {
      notePath = normalizePath(existingEntry.note_path);
    }

    if (!notePath) {
      const baseName = this.sanitizeFileName(title) || docId;
      const baseNotePath = normalizePath(`${this.settings.outputNoteDir}/${baseName}.md`);
      const finalBaseName = (await adapter.exists(baseNotePath))
        ? baseName
        : await this.resolveUniqueBaseName(baseName, docId);
      notePath = normalizePath(`${this.settings.outputNoteDir}/${finalBaseName}.md`);
    }

    try {
      await this.ensureFolder(this.settings.outputNoteDir);
      if (this.settings.copyPdfToVault) {
        await this.ensureFolder(this.settings.outputPdfDir);
      }
      if (this.settings.enableFileLogging) {
        const logRel = this.getLogFileRelativePath();
        const logDir = normalizePath(path.dirname(logRel));
        if (logDir) {
          await this.ensureFolder(logDir);
        }
        const spellInfoRel = this.getSpellcheckerInfoRelativePath();
        const spellDir = normalizePath(path.dirname(spellInfoRel));
        if (spellDir) {
          await this.ensureFolder(spellDir);
        }
      }
    } catch (error) {
      if (showNotices) {
        new Notice("Failed to create notes folder.");
      }
      console.error(error);
      this.clearStatusProgress();
      return false;
    }

    const pluginDir = this.getPluginDir();
    const doclingScript = path.join(pluginDir, "tools", "docling_extract.py");
    const indexScript = path.join(pluginDir, "tools", "index_redisearch.py");
    let qualityLabel: string | null = null;
    let layeredPdfPath: string | null = null;
    const registerRecreateProcess = (child: ChildProcess) => {
      if (this.recreateMissingNotesActive) {
        this.recreateMissingNotesProcess = child;
      }
    };

    try {
      qualityLabel = await this.readDoclingQualityLabelFromPdf(sourcePdf, doclingLanguageHint);
      this.showStatusProgress(this.formatStatusLabel("Docling extraction...", qualityLabel), 0);
      const doclingLogPath = this.settings.enableFileLogging ? this.getLogFileAbsolutePath() : null;
      await this.runPythonStreaming(
        doclingScript,
        this.buildDoclingArgs(
          sourcePdf,
          docId,
          chunkPath,
          notePath,
          doclingLanguageHint,
          true
        ),
        (payload) => this.handleDoclingProgress(payload, qualityLabel),
        () => {},
        doclingLogPath,
        registerRecreateProcess
      );
      this.recreateMissingNotesProcess = null;
      qualityLabel = await this.readDoclingQualityLabel(chunkPath);
      if (attachmentKey) {
        await this.annotateChunkJsonWithAttachmentKey(chunkPath, attachmentKey);
      }

      const metadata = await this.readDoclingMetadata(chunkPath);
      const layeredPath = await this.maybeCreateOcrLayeredPdf(
        sourcePdf,
        metadata,
        doclingLanguageHint
      );
      if (layeredPath) {
        sourcePdf = layeredPath;
        layeredPdfPath = layeredPath;
        await this.updateChunkJsonSourcePdf(chunkPath, layeredPath);
      }
    } catch (error) {
      if (this.recreateMissingNotesAbort) {
        this.recreateMissingNotesProcess = null;
        this.clearStatusProgress();
        return false;
      }
      if (showNotices) {
        new Notice("Docling extraction failed. See console for details.");
      }
      console.error(error);
      this.clearStatusProgress();
      return false;
    }

    try {
      this.showStatusProgress(this.formatStatusLabel("Indexing chunks...", qualityLabel), 0);
      const indexArgs = [
        "--chunks-json",
        this.getAbsoluteVaultPath(chunkPath),
        "--redis-url",
        this.settings.redisUrl,
        "--index",
        this.getRedisIndexName(),
        "--prefix",
        this.getRedisKeyPrefix(),
        "--embed-base-url",
        this.settings.embedBaseUrl,
        "--embed-api-key",
        this.settings.embedApiKey,
        "--embed-model",
        this.settings.embedModel,
        "--upsert",
        "--progress",
      ];
      if (this.settings.embedIncludeMetadata) {
        indexArgs.push("--embed-include-metadata");
      }
      this.appendChunkTaggingArgs(indexArgs);
      await this.runPythonStreaming(
        indexScript,
        indexArgs,
        (payload) => {
          if (payload?.type === "progress" && payload.total) {
            const percent = Math.round((payload.current / payload.total) * 100);
            const message =
              typeof payload.message === "string" && payload.message.trim()
                ? payload.message
                : `Indexing chunks ${payload.current}/${payload.total}`;
            const label = this.formatStatusLabel(
              message,
              qualityLabel
            );
            this.showStatusProgress(label, percent);
          }
        },
        () => undefined,
        undefined,
        registerRecreateProcess
      );
      this.recreateMissingNotesProcess = null;
    } catch (error) {
      if (this.recreateMissingNotesAbort) {
        this.recreateMissingNotesProcess = null;
        this.clearStatusProgress();
        return false;
      }
      if (showNotices) {
        new Notice("RedisSearch indexing failed. See console for details.");
      }
      console.error(error);
      this.clearStatusProgress();
      return false;
    }

    const pdfLink = layeredPdfPath
      ? this.buildPdfLinkFromSourcePath(layeredPdfPath)
      : this.buildPdfLinkForNote(sourcePdf, existingEntry?.attachment_key, docId);

    try {
      const doclingMd = await this.app.vault.adapter.read(notePath);
      const updatedChunkPayload = await this.readChunkPayload(chunkPath);
      const doclingContent = this.buildSyncedDoclingContent(docId, updatedChunkPayload, doclingMd);
      const noteContent = await this.buildNoteMarkdown(
        values,
        item.meta ?? {},
        docId,
        pdfLink,
        attachmentKey,
        itemPath,
        doclingContent
      );
      await this.writeNoteWithSyncSuppressed(notePath, noteContent);
    } catch (error) {
      if (showNotices) {
        new Notice("Failed to finalize note markdown.");
      }
      console.error(error);
      this.clearStatusProgress();
      return false;
    }

    try {
      await this.updateDocIndex({
        doc_id: docId,
        note_path: notePath,
        note_title: path.basename(notePath, ".md"),
        zotero_title: title,
        pdf_path: sourcePdf,
      });
    } catch (error) {
      console.error("Failed to update doc index", error);
    }

    return true;
  }

  private getZoteroLibraryPath(): string {
    const raw = (this.settings.zoteroUserId || "0").trim();
    if (!raw || raw === "0") {
      return "users/0";
    }
    if (raw.startsWith("users/") || raw.startsWith("groups/")) {
      return raw;
    }
    return `users/${raw}`;
  }

  async fetchZoteroLibraryOptions(): Promise<Array<{ value: string; label: string }>> {
    const options: Array<{ value: string; label: string }> = [
      { value: "0", label: "My Library (local)" },
    ];
    const groupOptions = await this.fetchZoteroGroupOptions();
    if (groupOptions.length) {
      options.push(...groupOptions);
    }
    return options;
  }

  async fetchEmbeddingModelOptions(): Promise<Array<{ value: string; label: string }>> {
    const current = (this.settings.embedModel || "").trim();
    const options: Array<{ value: string; label: string }> = [];
    const baseUrl = (this.settings.embedBaseUrl || "").trim().replace(/\/$/, "");
    if (!baseUrl) {
      if (current) {
        options.push({ value: current, label: current });
      }
      return options;
    }
    const apiKey = (this.settings.embedApiKey || "").trim();
    const modelIds = await this.fetchModelIds(baseUrl, apiKey);
    if (modelIds.length) {
      const embeddingModels = modelIds.filter((id) => /embed/i.test(id));
      const selected = embeddingModels.length ? embeddingModels : modelIds;
      options.push(...selected.map((id) => ({ value: id, label: id })));
    }
    if (!options.length && current) {
      options.push({ value: current, label: current });
    }
    return options.sort((a, b) => a.label.localeCompare(b.label));
  }

  async fetchChatModelOptions(): Promise<Array<{ value: string; label: string }>> {
    return this.fetchLlmModelOptions(this.settings.chatBaseUrl, this.settings.chatApiKey, "chat");
  }

  async fetchCleanupModelOptions(): Promise<Array<{ value: string; label: string }>> {
    return this.fetchLlmModelOptions(this.settings.llmCleanupBaseUrl, this.settings.llmCleanupApiKey, "cleanup");
  }

  private async fetchLlmModelOptions(
    baseUrlRaw: string,
    apiKeyRaw: string,
    label: string
  ): Promise<Array<{ value: string; label: string }>> {
    const current = label === "cleanup"
      ? (this.settings.llmCleanupModel || "").trim()
      : (this.settings.chatModel || "").trim();
    const options: Array<{ value: string; label: string }> = [];
    const baseUrl = (baseUrlRaw || "").trim().replace(/\/$/, "");
    if (!baseUrl) {
      if (current) {
        options.push({ value: current, label: current });
      }
      return options;
    }
    const apiKey = (apiKeyRaw || "").trim();
    const modelIds = await this.fetchModelIds(baseUrl, apiKey);
    if (modelIds.length) {
      const nonEmbedding = modelIds.filter((id) => !/embed/i.test(id));
      const selected = nonEmbedding.length ? nonEmbedding : modelIds;
      options.push(...selected.map((id) => ({ value: id, label: id })));
    }
    if (!options.length && current) {
      options.push({ value: current, label: current });
    }
    return options.sort((a, b) => a.label.localeCompare(b.label));
  }

  private detectEmbeddingProvider(baseUrl: string): "openai" | "openrouter" | "ollama" | "anthropic" | "generic" {
    const lowered = baseUrl.toLowerCase();
    if (lowered.includes("anthropic")) {
      return "anthropic";
    }
    if (lowered.includes("openrouter")) {
      return "openrouter";
    }
    if (lowered.includes("ollama") || lowered.includes(":11434")) {
      return "ollama";
    }
    if (lowered.includes("openai")) {
      return "openai";
    }
    return "generic";
  }

  private async fetchModelIds(baseUrl: string, apiKey: string): Promise<string[]> {
    const provider = this.detectEmbeddingProvider(baseUrl);
    try {
      if (provider === "anthropic") {
        return await this.fetchAnthropicModels(baseUrl, apiKey);
      }
      const modelIds = await this.fetchOpenAiCompatibleModels(baseUrl, apiKey);
      if (!modelIds.length && provider === "ollama") {
        return await this.fetchOllamaModels(baseUrl);
      }
      return modelIds;
    } catch (error) {
      console.warn("Failed to fetch models", error);
      return [];
    }
  }

  private async fetchOpenAiCompatibleModels(baseUrl: string, apiKey: string): Promise<string[]> {
    const url = `${baseUrl}/models`;
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }
    const response = await this.requestLocalApiRaw(url, { headers });
    if (response.statusCode >= 400) {
      throw new Error(`Model list request failed (${response.statusCode})`);
    }
    const parsed = JSON.parse(response.body.toString("utf8"));
    return this.extractModelIds(parsed);
  }

  private async fetchOllamaModels(baseUrl: string): Promise<string[]> {
    const root = baseUrl.replace(/\/v1\/?$/, "");
    const url = `${root}/api/tags`;
    const response = await this.requestLocalApiRaw(url);
    if (response.statusCode >= 400) {
      throw new Error(`Ollama tags request failed (${response.statusCode})`);
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(response.body.toString("utf8"));
    } catch (error) {
      console.warn("Failed to parse Ollama tags response", error);
      return [];
    }
    if (!parsed || typeof parsed !== "object") {
      return [];
    }
    const list = (parsed as Record<string, unknown>).models;
    if (!Array.isArray(list)) {
      return [];
    }
    return list
      .map((item) => this.extractModelId(item))
      .filter((id): id is string => Boolean(id));
  }

  private async fetchAnthropicModels(baseUrl: string, apiKey: string): Promise<string[]> {
    if (!apiKey) {
      return [];
    }
    const url = `${baseUrl}/models`;
    const headers: Record<string, string> = {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    };
    const response = await this.requestLocalApiRaw(url, { headers });
    if (response.statusCode >= 400) {
      throw new Error(`Anthropic model list request failed (${response.statusCode})`);
    }
    const parsed = JSON.parse(response.body.toString("utf8"));
    return this.extractModelIds(parsed);
  }

  private extractModelIds(payload: unknown): string[] {
    if (Array.isArray(payload)) {
      return payload.map((item) => this.extractModelId(item)).filter((id): id is string => Boolean(id));
    }
    if (!payload || typeof payload !== "object") {
      return [];
    }
    const record = payload as Record<string, unknown>;
    const list = (record.data ?? record.models ?? record.model ?? record.items) as unknown;
    if (Array.isArray(list)) {
      return list
        .map((item) => this.extractModelId(item))
        .filter((id): id is string => Boolean(id));
    }
    return [];
  }

  private extractModelId(entry: unknown): string | null {
    if (!entry || typeof entry !== "object") {
      return null;
    }
    const record = entry as Record<string, unknown>;
    const idValue = record.id ?? record.name ?? record.model ?? record.identifier;
    if (typeof idValue !== "string") {
      return null;
    }
    const id = idValue.trim();
    return id || null;
  }

  private async fetchZoteroGroupOptions(): Promise<Array<{ value: string; label: string }>> {
    const options = new Map<string, string>();
    const addOptions = (items: Array<{ value: string; label: string }>) => {
      for (const option of items) {
        if (!options.has(option.value)) {
          options.set(option.value, option.label);
        }
      }
    };

    try {
      const url = this.buildZoteroUrl("/users/0/groups");
      const payload = await this.requestLocalApi(url, `Zotero groups fetch failed for ${url}`);
      addOptions(this.parseZoteroGroupOptions(payload));
    } catch (error) {
      console.warn("Failed to fetch Zotero groups from local API", error);
    }

    if (this.canUseWebApi() && this.settings.webApiLibraryType === "user") {
      const userId = (this.settings.webApiLibraryId || "").trim();
      if (userId) {
        try {
          const url = this.buildWebApiUrl(`/users/${userId}/groups`);
          const payload = await this.requestWebApi(url, `Zotero Web API groups fetch failed for ${url}`);
          addOptions(this.parseZoteroGroupOptions(payload));
        } catch (error) {
          console.warn("Failed to fetch Zotero groups from Web API", error);
        }
      }
    }

    return Array.from(options.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  private parseZoteroGroupOptions(
    payload: Buffer
  ): Array<{ value: string; label: string }> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(payload.toString("utf8"));
    } catch (error) {
      console.warn("Failed to parse Zotero group payload", error);
      return [];
    }
    if (!Array.isArray(parsed)) {
      return [];
    }
    const options: Array<{ value: string; label: string }> = [];
    for (const entry of parsed) {
      if (!entry || typeof entry !== "object") {
        continue;
      }
      const record = (entry as { data?: Record<string, unknown> }).data ?? (entry as Record<string, unknown>);
      const idValue = record.id ?? (entry as Record<string, unknown>).id ?? record.key;
      if (!idValue) {
        continue;
      }
      const id = String(idValue).trim();
      if (!id) {
        continue;
      }
      const nameValue = record.name ?? (entry as Record<string, unknown>).name ?? id;
      const name = String(nameValue || id).trim() || id;
      options.push({
        value: `groups/${id}`,
        label: `Group: ${name}`,
      });
    }
    return options;
  }

  private async ensureFolder(folderPath: string): Promise<void> {
    const adapter = this.app.vault.adapter;
    const parts = normalizePath(folderPath).split("/").filter(Boolean);
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (!(await adapter.exists(current))) {
        await adapter.mkdir(current);
      }
    }
  }

  private async buildNoteMarkdown(
    values: ZoteroItemValues,
    meta: Record<string, any>,
    docId: string,
    pdfLink: string,
    attachmentKey: string | undefined,
    itemPath: string,
    doclingMarkdown: string
  ): Promise<string> {
    const jsonLink = `[[${itemPath}]]`;
    const canEmbed = this.settings.copyPdfToVault && pdfLink.startsWith("[[");
    const zoteroLink = attachmentKey ? this.buildZoteroDeepLink(docId, attachmentKey) : "";
    const frontmatterPdfLink = zoteroLink || pdfLink;
    const displayLink = canEmbed ? pdfLink : (zoteroLink || pdfLink);
    const pdfLine = displayLink ? (canEmbed ? `PDF: !${displayLink}` : `PDF: ${displayLink}`) : "";
    const pdfBlock = pdfLine ? `${pdfLine}\n\n` : "";
    const frontmatter = await this.renderFrontmatter(
      values,
      meta,
      docId,
      frontmatterPdfLink,
      jsonLink
    );
    const frontmatterBlock = frontmatter ? `---\n${frontmatter}\n---\n\n` : "";

    //return `${frontmatterBlock}PDF: ${pdfLink}\n\nItem JSON: ${jsonLink}\n\n${doclingMarkdown}`;
    return `${frontmatterBlock}${pdfBlock}${doclingMarkdown}`;
  }

  private async renderFrontmatter(
    values: ZoteroItemValues,
    meta: Record<string, any>,
    docId: string,
    pdfLink: string,
    itemJsonLink: string
  ): Promise<string> {
    const template = this.settings.frontmatterTemplate ?? "";
    if (!template.trim()) {
      return "";
    }
    const vars = await this.buildTemplateVars(values, meta, docId, pdfLink, itemJsonLink);
    return template.replace(/{{\s*([a-z0-9_]+)\s*}}/gi, (_, key) => vars[key] ?? "").trim();
  }

  private async buildTemplateVars(
    values: ZoteroItemValues,
    meta: Record<string, any>,
    docId: string,
    pdfLink: string,
    itemJsonLink: string
  ): Promise<Record<string, string>> {
    const title = typeof values.title === "string" ? values.title : "";
    const shortTitle = typeof values.shortTitle === "string" ? values.shortTitle : "";
    const date = typeof values.date === "string" ? values.date : "";
    const parsedDate = typeof meta?.parsedDate === "string" ? meta.parsedDate : "";
    const year = this.extractYear(parsedDate || date);
    const creators = Array.isArray(values.creators) ? values.creators : [];
    const authorsList = creators.filter((c) => c.creatorType === "author").map((c) => this.formatCreatorName(c));
    const authors = authorsList.join("; ");
    const editorsList = creators
      .filter((c) => c.creatorType === "editor" || c.creatorType === "seriesEditor")
      .map((c) => this.formatCreatorName(c));
    const editors = editorsList.join("; ");
    const tagsList = Array.isArray(values.tags)
      ? values.tags.map((tag: any) => (typeof tag === "string" ? tag : tag?.tag)).filter(Boolean)
      : [];
    const tags = tagsList.join("; ");
    const collectionTitles = await this.resolveCollectionTitles(values);
    const collectionTitle = collectionTitles.join("; ");
    const itemType = typeof values.itemType === "string" ? values.itemType : "";
    const creatorSummary = typeof meta?.creatorSummary === "string" ? meta.creatorSummary : "";
    const publicationTitle = typeof values.publicationTitle === "string" ? values.publicationTitle : "";
    const bookTitle = typeof values.bookTitle === "string" ? values.bookTitle : "";
    const journalAbbrev = typeof values.journalAbbreviation === "string" ? values.journalAbbreviation : "";
    const volume = typeof values.volume === "string" ? values.volume : "";
    const issue = typeof values.issue === "string" ? values.issue : "";
    const pages = typeof values.pages === "string" ? values.pages : "";
    const doi = typeof values.DOI === "string" ? values.DOI : "";
    const isbn = typeof values.ISBN === "string" ? values.ISBN : "";
    const issn = typeof values.ISSN === "string" ? values.ISSN : "";
    const publisher = typeof values.publisher === "string" ? values.publisher : "";
    const place = typeof values.place === "string" ? values.place : "";
    const url = typeof values.url === "string" ? values.url : "";
    const language = typeof values.language === "string" ? values.language : "";
    const abstractNote = typeof values.abstractNote === "string" ? values.abstractNote : "";

    const vars: Record<string, string> = {
      doc_id: docId,
      zotero_key: typeof values.key === "string" ? values.key : docId,
      title,
      short_title: shortTitle,
      date,
      year,
      authors,
      editors,
      tags,
      collection_title: collectionTitle,
      item_type: itemType,
      creator_summary: creatorSummary,
      publication_title: publicationTitle,
      book_title: bookTitle,
      journal_abbrev: journalAbbrev,
      volume,
      issue,
      pages,
      doi,
      isbn,
      issn,
      publisher,
      place,
      url,
      language,
      abstract: abstractNote,
      pdf_link: this.escapeYamlString(pdfLink),
      item_json: this.escapeYamlString(itemJsonLink),
    };

    for (const [key, value] of Object.entries(vars)) {
      vars[`${key}_yaml`] = this.escapeYamlString(value);
    }

    vars["authors_yaml"] = this.toYamlList(authorsList);
    vars["editors_yaml"] = this.toYamlList(editorsList);
    vars["tags_yaml"] = tagsList.length > 0 ? this.toYamlList(tagsList) : "";
    vars["collections_yaml"] = this.toYamlList(collectionTitles);

    return vars;
  }

  private extractYear(value: string): string {
    if (!value) {
      return "";
    }
    const match = value.match(/\b(\d{4})\b/);
    return match ? match[1] : "";
  }

  private formatCreatorName(creator: any): string {
    if (!creator || typeof creator !== "object") {
      return "";
    }
    if (creator.name) {
      return String(creator.name);
    }
    const first = creator.firstName ? String(creator.firstName) : "";
    const last = creator.lastName ? String(creator.lastName) : "";
    const combined = [last, first].filter(Boolean).join(", ");
    return combined || `${first} ${last}`.trim();
  }

  private escapeYamlString(value: string): string {
    const normalized = String(value).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const safe = normalized
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n");
    return `"${safe}"`;
  }

  private toYamlList(items: string[]): string {
    if (!items.length) {
      return "  - \"\"";
    }
    return items.map((item) => `  - ${this.escapeYamlString(item)}`).join("\n");
  }

  private getVaultBasePath(): string {
    const adapter = this.app.vault.adapter;
    if (adapter instanceof FileSystemAdapter) {
      return adapter.getBasePath();
    }
    const fallback = (adapter as any).getBasePath?.();
    if (fallback) {
      return fallback;
    }
    throw new Error("Vault base path is unavailable.");
  }

  private getPluginDir(): string {
    const basePath = this.getVaultBasePath();
    const dir = this.manifest.dir ?? this.manifest.id;
    if (!dir) {
      throw new Error("Plugin directory is unavailable.");
    }
    const pluginPath = path.isAbsolute(dir) ? dir : path.join(basePath, dir);
    return path.normalize(pluginPath);
  }

  private async ensureBundledTools(): Promise<void> {
    const pluginDir = this.getPluginDir();
    const toolsDir = path.join(pluginDir, "tools");
    await fs.mkdir(toolsDir, { recursive: true });

    for (const [filename, content] of Object.entries(TOOL_ASSETS)) {
      const target = path.join(toolsDir, filename);
      let shouldWrite = true;
      try {
        const existing = await fs.readFile(target, "utf8");
        if (existing === content) {
          shouldWrite = false;
        }
      } catch {
        // File missing or unreadable; overwrite below.
      }
      if (shouldWrite) {
        await fs.writeFile(target, content, "utf8");
      }
    }
  }

  private async migrateCachePaths(): Promise<void> {
    const oldItemDir = "zotero/items";
    const oldChunkDir = "zotero/chunks";
    const newItemDir = ITEM_CACHE_DIR;
    const newChunkDir = CHUNK_CACHE_DIR;

    const adapter = this.app.vault.adapter;
    const oldItemPath = normalizePath(oldItemDir);
    const oldChunkPath = normalizePath(oldChunkDir);
    const newItemPath = normalizePath(newItemDir);
    const newChunkPath = normalizePath(newChunkDir);

    const newItemParent = newItemPath.split("/").slice(0, -1).join("/");
    const newChunkParent = newChunkPath.split("/").slice(0, -1).join("/");

    if (newItemParent) {
      await this.ensureFolder(newItemParent);
    }
    if (newChunkParent) {
      await this.ensureFolder(newChunkParent);
    }

    const oldItemExists = await adapter.exists(oldItemPath);
    const oldChunkExists = await adapter.exists(oldChunkPath);
    const newItemExists = await adapter.exists(newItemPath);
    const newChunkExists = await adapter.exists(newChunkPath);

    if (oldItemExists && !newItemExists) {
      await adapter.rename(oldItemPath, newItemPath);
    }
    if (oldChunkExists && !newChunkExists) {
      await adapter.rename(oldChunkPath, newChunkPath);
    }
  }

  private getAbsoluteVaultPath(vaultRelativePath: string): string {
    const basePath = this.getVaultBasePath();
    const resolvedPath = path.isAbsolute(vaultRelativePath)
      ? vaultRelativePath
      : path.join(basePath, vaultRelativePath);
    return path.normalize(resolvedPath);
  }

  private buildDoclingArgs(
    pdfSourcePath: string,
    docId: string,
    chunkPath: string,
    notePath: string,
    languageHint?: string | null,
    includeProgress = false
  ): string[] {
    const ocrMode =
      this.settings.ocrMode === "force_low_quality" ? "auto" : this.settings.ocrMode;
    const args = [
      "--pdf",
      pdfSourcePath,
      "--doc-id",
      docId,
      "--out-json",
      this.getAbsoluteVaultPath(chunkPath),
      "--out-md",
      this.getAbsoluteVaultPath(notePath),
      "--chunking",
      this.settings.chunkingMode,
      "--ocr",
      ocrMode,
    ];

    if (includeProgress) {
      args.push("--progress");
    }
    if (this.settings.ocrMode === "force_low_quality") {
      args.push("--force-ocr-low-quality");
    }
    args.push("--quality-threshold", String(this.settings.ocrQualityThreshold));
    if (languageHint) {
      args.push("--language-hint", languageHint);
    }
    if (this.settings.maxChunkChars > 0) {
      args.push("--max-chunk-chars", String(this.settings.maxChunkChars));
    }
    if (this.settings.chunkOverlapChars > 0) {
      args.push("--chunk-overlap-chars", String(this.settings.chunkOverlapChars));
    }
    if (this.settings.enableLlmCleanup) {
      args.push("--enable-llm-cleanup");
      if (this.settings.llmCleanupBaseUrl) {
        args.push("--llm-cleanup-base-url", this.settings.llmCleanupBaseUrl);
      }
      if (this.settings.llmCleanupApiKey) {
        args.push("--llm-cleanup-api-key", this.settings.llmCleanupApiKey);
      }
      if (this.settings.llmCleanupModel) {
        args.push("--llm-cleanup-model", this.settings.llmCleanupModel);
      }
      args.push("--llm-cleanup-temperature", String(this.settings.llmCleanupTemperature));
      args.push("--llm-cleanup-min-quality", String(this.settings.llmCleanupMinQuality));
      args.push("--llm-cleanup-max-chars", String(this.settings.llmCleanupMaxChars));
    }
    // Auto-enable dictionary-based correction if a bundled wordlist exists
    const pluginDir = this.getPluginDir();
    const wordlistPath = path.join(pluginDir, "tools", "ocr_wordlist.txt");
    if (existsSync(wordlistPath)) {
      args.push("--enable-dictionary-correction", "--dictionary-path", wordlistPath);
    }

    if (this.settings.enableFileLogging) {
      const logAbs = this.getLogFileAbsolutePath();
      if (logAbs) {
        args.push("--log-file", logAbs);
      }
      const spellInfoAbs = this.getAbsoluteVaultPath(this.getSpellcheckerInfoRelativePath());
      if (spellInfoAbs) {
        args.push("--spellchecker-info-out", spellInfoAbs);
      }
    }

    return args;
  }

  private appendChunkTaggingArgs(args: string[]): void {
    if (!this.settings.enableChunkTagging) {
      return;
    }
    const baseUrl = (this.settings.llmCleanupBaseUrl || "").trim();
    const model = (this.settings.llmCleanupModel || "").trim();
    if (!baseUrl || !model) {
      return;
    }
    args.push("--generate-chunk-tags", "--tag-base-url", baseUrl, "--tag-model", model);
    const apiKey = (this.settings.llmCleanupApiKey || "").trim();
    if (apiKey) {
      args.push("--tag-api-key", apiKey);
    }
    args.push("--tag-temperature", String(this.settings.llmCleanupTemperature));
  }

  private getRedisDataDir(): string {
    return path.join(this.getVaultBasePath(), CACHE_ROOT, "redis-data");
  }

  private getDockerComposePath(): string {
    const pluginDir = this.getPluginDir();
    return path.join(pluginDir, "tools", "docker-compose.yml");
  }

  private async resolveDockerPath(): Promise<string> {
    const configured = this.settings.dockerPath?.trim();
    const dockerCandidates = [
      "/opt/homebrew/bin/docker",
      "/usr/local/bin/docker",
      "/usr/bin/docker",
      "/Applications/Docker.app/Contents/Resources/bin/docker",
    ];
    const podmanCandidates = ["/opt/homebrew/bin/podman", "/usr/local/bin/podman", "/usr/bin/podman"];
    const podmanComposeCandidates = [
      "/opt/homebrew/bin/podman-compose",
      "/usr/local/bin/podman-compose",
      "/usr/bin/podman-compose",
    ];
    const candidates: string[] = [];
    if (configured) {
      candidates.push(configured);
    }

    const preferredKind = configured ? this.getContainerCliKind(configured) : "docker";
    const orderedGroups =
      preferredKind === "podman-compose"
        ? [podmanComposeCandidates, podmanCandidates, dockerCandidates]
        : preferredKind === "podman"
          ? [podmanCandidates, podmanComposeCandidates, dockerCandidates]
          : [dockerCandidates, podmanCandidates, podmanComposeCandidates];

    if (
      !configured ||
      configured === "docker" ||
      configured === "podman" ||
      configured === "podman-compose"
    ) {
      for (const group of orderedGroups) {
        candidates.push(...group);
      }
    }

    for (const candidate of candidates) {
      if (!path.isAbsolute(candidate)) {
        continue;
      }
      try {
        if (await this.isContainerCliAvailable(candidate)) {
          return candidate;
        }
      } catch {
        // Keep trying candidates.
      }
    }

    const pathCandidates = [
      configured,
      preferredKind === "podman" ? "podman" : "docker",
      preferredKind === "podman" ? "docker" : "podman",
      "podman-compose",
    ].filter((value): value is string => Boolean(value && value.trim()));
    for (const candidate of pathCandidates) {
      if (await this.isContainerCliAvailable(candidate)) {
        return candidate;
      }
    }

    return configured || "docker";
  }

  private async isContainerCliAvailable(cliPath: string): Promise<boolean> {
    return new Promise((resolve) => {
      const child = spawn(cliPath, ["--version"]);
      child.on("error", () => resolve(false));
      child.on("close", (code) => resolve(code === 0));
    });
  }

  private getContainerCliKind(cliPath: string): "docker" | "podman" | "podman-compose" {
    const base = path.basename(cliPath);
    if (base === "podman-compose") {
      return "podman-compose";
    }
    if (base.includes("podman")) {
      return "podman";
    }
    return "docker";
  }

  private async isContainerDaemonRunning(cliPath: string): Promise<boolean> {
    const kind = this.getContainerCliKind(cliPath);
    let command = cliPath;
    let args = ["info"];
    if (kind === "podman-compose") {
      const podmanBin = await this.resolvePodmanBin();
      if (!podmanBin) {
        return false;
      }
      command = podmanBin;
    }

    return new Promise((resolve) => {
      const child = spawn(command, args);
      let resolved = false;
      const finish = (ok: boolean): void => {
        if (resolved) {
          return;
        }
        resolved = true;
        resolve(ok);
      };
      const timeout = setTimeout(() => {
        child.kill();
        finish(false);
      }, 2000);
      child.on("error", () => {
        clearTimeout(timeout);
        finish(false);
      });
      child.on("close", (code) => {
        clearTimeout(timeout);
        finish(code === 0);
      });
    });
  }

  private getContainerDaemonHint(cliPath: string): string {
    const kind = this.getContainerCliKind(cliPath);
    if (kind === "podman" || kind === "podman-compose") {
      return "Podman machine not running. Run `podman machine start`.";
    }
    return "Docker Desktop is not running. Start Docker Desktop.";
  }

  private async supportsComposeSubcommand(cliPath: string): Promise<boolean> {
    return new Promise((resolve) => {
      const child = spawn(cliPath, ["compose", "version"]);
      child.on("error", () => resolve(false));
      child.on("close", (code) => resolve(code === 0));
    });
  }

  private async findPodmanComposePath(): Promise<string | null> {
    const candidates = [
      "/opt/homebrew/bin/podman-compose",
      "/usr/local/bin/podman-compose",
      "/usr/bin/podman-compose",
    ];
    for (const candidate of candidates) {
      try {
        await fs.access(candidate);
        return candidate;
      } catch {
        // Keep trying candidates.
      }
    }
    if (await this.isContainerCliAvailable("podman-compose")) {
      return "podman-compose";
    }
    return null;
  }

  private async resolvePodmanBin(): Promise<string | null> {
    const candidates = ["/opt/homebrew/bin/podman", "/usr/local/bin/podman", "/usr/bin/podman"];
    for (const candidate of candidates) {
      if (await this.isContainerCliAvailable(candidate)) {
        return candidate;
      }
    }
    if (await this.isContainerCliAvailable("podman")) {
      return "podman";
    }
    return null;
  }

  private async resolveComposeCommand(
    cliPath: string
  ): Promise<{ command: string; argsPrefix: string[] } | null> {
    const base = path.basename(cliPath);
    if (base === "podman-compose") {
      return { command: cliPath, argsPrefix: [] };
    }
    if (base === "podman") {
      const podmanCompose = await this.findPodmanComposePath();
      if (podmanCompose) {
        return { command: podmanCompose, argsPrefix: [] };
      }
      if (await this.supportsComposeSubcommand(cliPath)) {
        return { command: cliPath, argsPrefix: ["compose"] };
      }
      return null;
    }
    if (await this.supportsComposeSubcommand(cliPath)) {
      return { command: cliPath, argsPrefix: ["compose"] };
    }
    return null;
  }

  private async autoDetectContainerCliOnLoad(): Promise<void> {
    const resolved = await this.resolveDockerPath();
    if (!(await this.isContainerCliAvailable(resolved))) {
      this.notifyContainerOnce(
        "Docker or Podman not found. Install Docker Desktop or Podman and set Docker/Podman path in settings."
      );
      return;
    }
    const configured = this.settings.dockerPath?.trim() || "docker";
    const configuredAvailable = await this.isContainerCliAvailable(configured);
    const shouldAutoSet =
      !configuredAvailable ||
      configured === "docker" ||
      configured === "podman" ||
      configured === "podman-compose";
    if (shouldAutoSet && resolved && resolved !== configured) {
      this.settings.dockerPath = resolved;
      await this.saveSettings();
    }
    if (!(await this.isContainerDaemonRunning(resolved))) {
      this.notifyContainerOnce(this.getContainerDaemonHint(resolved));
    }
  }

  private getDockerProjectName(): string {
    const vaultPath = this.getVaultBasePath();
    const vaultName = path
      .basename(vaultPath)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 18);
    const hash = createHash("sha1").update(vaultPath).digest("hex").slice(0, 8);
    return `zrr-${vaultName || "vault"}-${hash}`;
  }

  private getRedisPortFromUrl(): number {
    try {
      const parsed = new URL(this.settings.redisUrl);
      const port = parsed.port ? Number(parsed.port) : 6379;
      return Number.isFinite(port) && port > 0 ? port : 6379;
    } catch {
      return 6379;
    }
  }

  private getVaultPreferredRedisPort(): number {
    const hash = createHash("sha1").update(this.getVaultBasePath()).digest("hex");
    const offset = Number.parseInt(hash.slice(0, 4), 16) % 2000;
    return 6400 + offset;
  }

  private getRedisHostFromUrl(): string {
    try {
      const parsed = new URL(this.settings.redisUrl);
      return parsed.hostname || "127.0.0.1";
    } catch {
      return "127.0.0.1";
    }
  }

  private isLocalRedisHost(host: string): boolean {
    const normalized = host.trim().toLowerCase();
    if (!normalized) {
      return false;
    }
    if (normalized === "localhost" || normalized === "0.0.0.0" || normalized === "::1") {
      return true;
    }
    return normalized.startsWith("127.");
  }

  private getPortCheckHost(host: string): string {
    if (!this.isLocalRedisHost(host)) {
      return host;
    }
    return "127.0.0.1";
  }

  private async isPortFree(host: string, port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.once("error", () => resolve(false));
      server.once("listening", () => {
        server.close(() => resolve(true));
      });
      server.listen(port, host);
    });
  }

  private async findAvailablePort(host: string, startPort: number): Promise<number | null> {
    const maxAttempts = 25;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const port = startPort + attempt;
      if (await this.isPortFree(host, port)) {
        return port;
      }
    }
    return null;
  }

  private updateRedisUrlPort(redisUrl: string, port: number): string {
    try {
      const parsed = new URL(redisUrl);
      parsed.port = String(port);
      return parsed.toString();
    } catch {
      return `redis://127.0.0.1:${port}`;
    }
  }

  private async isRedisReachable(redisUrl: string): Promise<boolean> {
    let host = "127.0.0.1";
    let port = 6379;
    try {
      const parsed = new URL(redisUrl);
      host = parsed.hostname || host;
      port = parsed.port ? Number(parsed.port) : port;
    } catch {
      return false;
    }

    return new Promise((resolve) => {
      const socket = new net.Socket();
      let done = false;
      const finish = (ok: boolean): void => {
        if (done) {
          return;
        }
        done = true;
        socket.destroy();
        resolve(ok);
      };
      socket.setTimeout(500);
      socket.once("connect", () => finish(true));
      socket.once("timeout", () => finish(false));
      socket.once("error", () => finish(false));
      socket.connect(port, host);
    });
  }

  private getRedisNamespace(): string {
    const vaultPath = this.getVaultBasePath();
    const vaultName = path
      .basename(vaultPath)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24);
    const hash = createHash("sha1").update(vaultPath).digest("hex").slice(0, 8);
    return `${vaultName || "vault"}-${hash}`;
  }

  private getRedisIndexName(): string {
    const base = (this.settings.redisIndex || "idx:zotero").trim() || "idx:zotero";
    return `${base}:${this.getRedisNamespace()}`;
  }

  private getRedisKeyPrefix(): string {
    const base = (this.settings.redisPrefix || "zotero:chunk:").trim() || "zotero:chunk:";
    const prefix = base.endsWith(":") ? base : `${base}:`;
    return `${prefix}${this.getRedisNamespace()}:`;
  }

  private async isComposeProjectRunning(
    composeCommand: string,
    composeArgsPrefix: string[],
    composePath: string,
    project: string,
    env?: NodeJS.ProcessEnv
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const child = spawn(
        composeCommand,
        [...composeArgsPrefix, "-p", project, "-f", composePath, "ps", "-q"],
        {
          cwd: path.dirname(composePath),
          env,
        }
      );
      let stdout = "";
      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });
      child.on("error", (error) => {
        console.warn("Redis Stack status check failed", error);
        resolve(false);
      });
      child.on("close", (code) => {
        if (code !== 0) {
          resolve(false);
          return;
        }
        resolve(stdout.trim().length > 0);
      });
    });
  }

  async startRedisStack(silent?: boolean): Promise<void> {
    try {
      await this.ensureBundledTools();
      const composePath = this.getDockerComposePath();
      const dataDir = this.getRedisDataDir();
      await fs.mkdir(dataDir, { recursive: true });
      const dockerPath = await this.resolveDockerPath();
      const configuredDockerPath = this.settings.dockerPath?.trim() || "docker";
      const shouldAutoSet =
        !(await this.isContainerCliAvailable(configuredDockerPath)) ||
        !configuredDockerPath ||
        configuredDockerPath === "docker" ||
        configuredDockerPath === "podman" ||
        configuredDockerPath === "podman-compose";
      if (shouldAutoSet && dockerPath && dockerPath !== configuredDockerPath) {
        this.settings.dockerPath = dockerPath;
        await this.saveSettings();
        if (!silent) {
          new Notice(`Docker/Podman path set to ${dockerPath}.`);
        }
      }
      if (!(await this.isContainerCliAvailable(dockerPath))) {
        if (!silent) {
          new Notice(
            'Docker or Podman not found. Install Docker Desktop or Podman and set "Docker/Podman path" in settings.'
          );
        }
        return;
      }
      if (!(await this.isContainerDaemonRunning(dockerPath))) {
        if (!silent) {
          new Notice(this.getContainerDaemonHint(dockerPath));
        }
        return;
      }
      const composeCommand = await this.resolveComposeCommand(dockerPath);
      if (!composeCommand) {
        if (!silent) {
          new Notice(
            "Compose support not found. Install Docker Desktop or Podman with podman-compose."
          );
        }
        return;
      }
      const composeEnv: NodeJS.ProcessEnv = { ...process.env };
      if (path.basename(composeCommand.command) === "podman-compose") {
        const podmanBin = await this.resolvePodmanBin();
        if (podmanBin) {
          composeEnv.PODMAN_BIN = podmanBin;
          if (path.isAbsolute(podmanBin)) {
            const podmanDir = path.dirname(podmanBin);
            const existingPath = composeEnv.PATH || "";
            if (!existingPath.split(path.delimiter).includes(podmanDir)) {
              composeEnv.PATH = `${podmanDir}${path.delimiter}${existingPath}`;
            }
          }
        }
      }
      const project = this.getDockerProjectName();
      if (
        await this.isComposeProjectRunning(
          composeCommand.command,
          composeCommand.argsPrefix,
          composePath,
          project,
          composeEnv
        )
      ) {
        if (!silent) {
          new Notice("Redis Stack already running for this vault.");
        }
        return;
      }

      const requestedPort = this.getRedisPortFromUrl();
      const redisHost = this.getRedisHostFromUrl();
      const portCheckHost = this.getPortCheckHost(redisHost);
      const autoAssign = this.settings.autoAssignRedisPort && this.isLocalRedisHost(redisHost);
      let redisUrl = this.settings.redisUrl;
      let redisPort = requestedPort;

      if (autoAssign) {
        const preferredPort =
          requestedPort === 6379 ? this.getVaultPreferredRedisPort() : requestedPort;
        const availablePort = await this.findAvailablePort(portCheckHost, preferredPort);
        if (!availablePort) {
          throw new Error(`No available Redis port found starting at ${preferredPort}.`);
        }
        if (availablePort !== requestedPort) {
          redisPort = availablePort;
          redisUrl = this.updateRedisUrlPort(redisUrl, redisPort);
          this.settings.redisUrl = redisUrl;
          await this.saveSettings();
          if (!silent) {
            new Notice(`Using Redis port ${redisPort} for this vault.`);
          }
        }
      } else if (await this.isRedisReachable(redisUrl)) {
        if (!silent) {
          new Notice(`Redis already running at ${redisUrl}.`);
        }
        return;
      }
      composeEnv.ZRR_DATA_DIR = dataDir;
      composeEnv.ZRR_PORT = String(redisPort);
      try {
        await this.runCommand(
          composeCommand.command,
          [...composeCommand.argsPrefix, "-p", project, "-f", composePath, "down"],
          { cwd: path.dirname(composePath), env: composeEnv }
        );
      } catch (error) {
        console.warn("Redis Stack stop before restart failed", error);
      }
      await this.runCommand(
        composeCommand.command,
        [...composeCommand.argsPrefix, "-p", project, "-f", composePath, "up", "-d"],
        {
          cwd: path.dirname(composePath),
          env: composeEnv,
        }
      );
      if (!silent) {
        new Notice("Redis Stack started.");
      }
    } catch (error) {
      if (!silent) {
        new Notice("Failed to start Redis Stack. Check Docker/Podman and file sharing.");
      }
      console.error("Failed to start Redis Stack", error);
    }
  }

  async setupPythonEnv(): Promise<void> {
    const pluginDir = this.getPluginDir();
    const venvDir = this.getPythonVenvDir();
    const venvPython = this.getVenvPythonPath(venvDir);
    await this.ensureBundledTools();
    const requirementsPath = this.resolveRequirementsPath(pluginDir);
    if (!requirementsPath) {
      throw new Error(`requirements.txt not found in ${pluginDir}`);
    }

    try {
      new Notice("Setting up Python environment...");
      this.showStatusProgress("Setting up Python environment...", null);
      console.log(`Python env: using plugin dir ${pluginDir}`);
      console.log(`Python env: venv path ${venvDir}`);

      let bootstrap: { command: string; args: string[] } | null = null;
      const ensureBootstrap = async (): Promise<{ command: string; args: string[] }> => {
        if (!bootstrap) {
          bootstrap = await this.resolveBootstrapPython();
        }
        return bootstrap;
      };

      if (existsSync(venvPython)) {
        const venvVersion = await this.getPythonVersion(venvPython, []);
        if (venvVersion && this.isUnsupportedPythonVersion(venvVersion)) {
          const resolved = await ensureBootstrap();
          console.log(
            `Python env: existing venv uses Python ${venvVersion.major}.${venvVersion.minor}; rebuilding with ${resolved.command} ${resolved.args.join(
              " "
            )}`
          );
          this.showStatusProgress("Rebuilding Python environment...", null);
          await fs.rm(venvDir, { recursive: true, force: true });
        }
      }

      if (!existsSync(venvPython)) {
        const resolved = await ensureBootstrap();
        console.log(`Python env: creating venv with ${resolved.command} ${resolved.args.join(" ")}`);
        await this.runCommand(resolved.command, [...resolved.args, "-m", "venv", venvDir], {
          cwd: pluginDir,
        });
      }

      await this.runCommandStreaming(
        venvPython,
        ["-m", "pip", "install", "-r", requirementsPath],
        { cwd: pluginDir },
        (line) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return;
          }
          const collecting = trimmed.match(/^Collecting\s+([^\s]+)/);
          if (collecting) {
            this.showStatusProgress(`Installing ${collecting[1]}...`, null);
            return;
          }
          if (trimmed.startsWith("Installing collected packages")) {
            this.showStatusProgress("Installing packages...", null);
            return;
          }
          if (trimmed.startsWith("Successfully installed")) {
            this.showStatusProgress("Python environment ready.", 100);
          }
        }
      );

      this.settings.pythonPath = venvPython;
      await this.saveSettings();
      this.clearStatusProgress();
      new Notice("Python environment ready.");
    } catch (error) {
      this.clearStatusProgress();
      new Notice("Failed to set up Python environment. See console for details.");
      console.error("Python env setup failed", error);
    }
  }

  private getPythonVenvDir(): string {
    return path.join(this.getPluginDir(), ".venv");
  }

  private getVenvPythonPath(venvDir: string): string {
    if (process.platform === "win32") {
      return path.join(venvDir, "Scripts", "python.exe");
    }
    return path.join(venvDir, "bin", "python");
  }

  private resolveRequirementsPath(pluginDir: string): string | null {
    const candidates = [
      path.join(pluginDir, "requirements.txt"),
      path.join(pluginDir, "tools", "requirements.txt"),
    ];
    return candidates.find((candidate) => existsSync(candidate)) ?? null;
  }

  private async resolveBootstrapPython(): Promise<{ command: string; args: string[] }> {
    const configured = (this.settings.pythonPath || "").trim();
    if (configured && (await this.canRunCommand(configured, []))) {
      const version = await this.getPythonVersion(configured, []);
      if (version && this.isUnsupportedPythonVersion(version)) {
        throw new Error(
          `Configured Python ${version.major}.${version.minor} is not supported. Install Python 3.11 or 3.12 and update the Python path.`
        );
      }
      return { command: configured, args: [] };
    }

    const candidates =
      process.platform === "win32"
        ? [
            { command: "py", args: ["-3.12"] },
            { command: "py", args: ["-3.11"] },
            { command: "py", args: ["-3.10"] },
            { command: "py", args: ["-3"] },
            { command: "python", args: [] },
          ]
        : [
            { command: "python3.12", args: [] },
            { command: "python3.11", args: [] },
            { command: "python3.10", args: [] },
            { command: "python3", args: [] },
            { command: "python", args: [] },
          ];

    for (const candidate of candidates) {
      if (await this.canRunCommand(candidate.command, candidate.args)) {
        const version = await this.getPythonVersion(candidate.command, candidate.args);
        if (version && this.isUnsupportedPythonVersion(version)) {
          console.log(
            `Python env: skipping ${candidate.command} ${candidate.args.join(" ")} (Python ${version.major}.${version.minor} unsupported)`
          );
          continue;
        }
        return candidate;
      }
    }

    throw new Error("No usable Python 3.11/3.12 interpreter found on PATH.");
  }

  private isUnsupportedPythonVersion(version: { major: number; minor: number }): boolean {
    return version.major > 3 || (version.major === 3 && version.minor >= 13);
  }

  private async getPythonVersion(
    command: string,
    args: string[]
  ): Promise<{ major: number; minor: number } | null> {
    return new Promise((resolve) => {
      const child = spawn(command, [
        ...args,
        "-c",
        "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')",
      ]);
      let stdout = "";
      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });
      child.on("error", () => resolve(null));
      child.on("close", (code) => {
        if (code !== 0) {
          resolve(null);
          return;
        }
        const match = stdout.trim().match(/(\d+)\.(\d+)/);
        if (!match) {
          resolve(null);
          return;
        }
        resolve({ major: Number(match[1]), minor: Number(match[2]) });
      });
    });
  }

  private async canRunCommand(command: string, args: string[]): Promise<boolean> {
    return new Promise((resolve) => {
      const child = spawn(command, [...args, "--version"], {
        env: this.buildPythonEnv(),
      });
      child.on("error", () => resolve(false));
      child.on("close", (code) => resolve(code === 0));
    });
  }

  private buildPythonEnv(): NodeJS.ProcessEnv {
    const env = { ...process.env };
    const sep = path.delimiter;
    const current = env.PATH || "";
    const extras = process.platform === "win32" ? [] : ["/opt/homebrew/bin", "/usr/local/bin"];
    const merged = [...extras, current].filter(Boolean).join(sep);
    env.PATH = merged;
    if (!env.PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK) {
      env.PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK = "True";
    }
    if (!env.DISABLE_MODEL_SOURCE_CHECK) {
      env.DISABLE_MODEL_SOURCE_CHECK = "True";
    }
    return env;
  }

  private runPython(scriptPath: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(this.settings.pythonPath, [scriptPath, ...args], {
        cwd: path.dirname(scriptPath),
        env: this.buildPythonEnv(),
      });

      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });
      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("error", (error) => {
        this.handlePythonProcessError(String(error));
        reject(error);
      });

      child.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          const diagnostic = stderr.trim() ? stderr : stdout;
          this.handlePythonProcessError(diagnostic);
          reject(new Error(stderr || `Process exited with code ${code}`));
        }
      });
    });
  }

  private runCommand(
    command: string,
    args: string[],
    options?: { cwd?: string; env?: NodeJS.ProcessEnv }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: options?.cwd,
        env: options?.env ?? this.buildPythonEnv(),
      });

      let stderr = "";
      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("error", (error) => {
        reject(error);
      });

      child.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(stderr || `Process exited with code ${code}`));
        }
      });
    });
  }

  private runPythonStreaming(
    scriptPath: string,
    args: string[],
    onPayload: (payload: any) => void,
    onFallbackFinal: (payload: any) => void,
    stderrLogPath?: string | null,
    onSpawn?: (child: ChildProcess) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(this.settings.pythonPath, [scriptPath, ...args], {
        cwd: path.dirname(scriptPath),
        env: this.buildPythonEnv(),
      });
      if (onSpawn) {
        onSpawn(child);
      }

      let stdoutBuffer = "";
      let stderr = "";
      let diagnostic = "";
      let lastPayload: any = null;
      let sawFinal = false;

      const handleLine = (line: string): void => {
        if (!line.trim()) {
          return;
        }
        try {
          const payload = JSON.parse(line);
          lastPayload = payload;
          if (payload?.type === "final") {
            sawFinal = true;
          } else if (payload?.answer) {
            sawFinal = true;
          }
          onPayload(payload);
        } catch {
          diagnostic += `${line}\n`;
        }
      };

      child.stdout.on("data", (data) => {
        stdoutBuffer += data.toString();
        const lines = stdoutBuffer.split(/\r?\n/);
        stdoutBuffer = lines.pop() ?? "";
        for (const line of lines) {
          handleLine(line);
        }
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("error", (error) => {
        this.handlePythonProcessError(String(error));
        reject(error);
      });

      child.on("close", (code) => {
        if (stdoutBuffer.trim()) {
          handleLine(stdoutBuffer);
        }
        if (!sawFinal && lastPayload) {
          onFallbackFinal(lastPayload);
        }
        if (stderrLogPath) {
          void this.appendToLogFile(stderrLogPath, stderr);
        }
        if (code === 0) {
          resolve();
        } else {
          const diagnosticText = stderr.trim() ? stderr : diagnostic;
          this.handlePythonProcessError(diagnosticText);
          reject(new Error(stderr || `Process exited with code ${code}`));
        }
      });
    });
  }

  private runCommandStreaming(
    command: string,
    args: string[],
    options: { cwd?: string; env?: NodeJS.ProcessEnv },
    onLine: (line: string) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: options?.cwd,
        env: options?.env ?? this.buildPythonEnv(),
      });

      const handleChunk = (chunk: Buffer): void => {
        const text = chunk.toString();
        text.split(/\r?\n/).forEach((line) => {
          if (line.trim()) {
            onLine(line);
          }
        });
      };

      let stderr = "";
      child.stdout.on("data", handleChunk);
      child.stderr.on("data", (data) => {
        stderr += data.toString();
        handleChunk(data);
      });

      child.on("error", (error) => {
        reject(error);
      });

      child.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(stderr || `Process exited with code ${code}`));
        }
      });
    });
  }

  private handlePythonProcessError(raw: string): void {
    if (!raw) {
      return;
    }
    const missingModule = raw.match(/ModuleNotFoundError:\s+No module named ['"]([^'"]+)['"]/);
    if (missingModule) {
      const notice = `Python env missing module '${missingModule[1]}'. Open Settings > Python environment > Create/Update.`;
      this.notifyPythonEnvOnce(notice, true);
      return;
    }
    if (/No module named ['"]|ImportError: No module named/i.test(raw)) {
      const notice = "Python env missing required modules. Open Settings > Python environment > Create/Update.";
      this.notifyPythonEnvOnce(notice, true);
      return;
    }
    if (/ENOENT|No such file or directory|not found|command not found|spawn .* ENOENT/i.test(raw)) {
      const notice = "Python not found. Configure the Python path or use Settings > Python environment > Create/Update.";
      this.notifyPythonEnvOnce(notice, true);
    }
  }

  private notifyPythonEnvOnce(message: string, openSettings = false): void {
    if (this.lastPythonEnvNotice === message) {
      return;
    }
    this.lastPythonEnvNotice = message;
    new Notice(message);
    if (openSettings) {
      this.openPluginSettings();
    }
  }

  private notifyContainerOnce(message: string): void {
    if (this.lastContainerNotice === message) {
      return;
    }
    this.lastContainerNotice = message;
    new Notice(message);
  }

  private openPluginSettings(): void {
    const settings = (this.app as any).setting;
    if (settings?.open) {
      settings.open();
    }
    if (settings?.openTabById) {
      settings.openTabById(this.manifest.id);
    }
  }

  // Logging helpers
  private getLogsDirRelative(): string {
    return normalizePath(`${CACHE_ROOT}/logs`);
  }

  private getLogFileRelativePath(): string {
    const configured = (this.settings.logFilePath || "").trim();
    return normalizePath(configured || `${this.getLogsDirRelative()}/docling_extract.log`);
  }

  private getLogFileAbsolutePath(): string {
    return this.getAbsoluteVaultPath(this.getLogFileRelativePath());
  }

  private getSpellcheckerInfoRelativePath(): string {
    return normalizePath(`${this.getLogsDirRelative()}/spellchecker_info.json`);
  }

  public async openLogFile(): Promise<void> {
    const rel = this.getLogFileRelativePath();
    const adapter = this.app.vault.adapter;
    if (!(await adapter.exists(rel))) {
      new Notice("Log file not found.");
      return;
    }
    try {
      const readLog = async (): Promise<string> => {
        try {
          const content = await adapter.read(rel);
          return content || "(empty)";
        } catch {
          return "(empty)";
        }
      };
      const content = await readLog();
      new OutputModal(this.app, "Docling log", content || "(empty)", {
        autoRefresh: true,
        refreshIntervalMs: 2000,
        onRefresh: readLog,
        onClear: async () => {
          await this.clearLogFile();
        },
      }).open();
    } catch (error) {
      new Notice("Failed to open log file.");
      console.error(error);
    }
  }

  public async clearLogFile(): Promise<void> {
    const rel = this.getLogFileRelativePath();
    const adapter = this.app.vault.adapter;
    try {
      const dir = normalizePath(path.dirname(rel));
      if (dir) {
        await this.ensureFolder(dir);
      }
      await adapter.write(rel, "");
      new Notice("Log file cleared.");
    } catch (error) {
      new Notice("Failed to clear log file.");
      console.error(error);
    }
  }

  private formatStderrForLog(raw: string): string {
    const lines = raw
      .split(/\r?\n/)
      .map((line) => line.trimEnd())
      .filter((line) => Boolean(line.trim()));
    if (!lines.length) {
      return "";
    }
    const timestamp = new Date().toISOString().replace("T", " ").replace("Z", "").replace(".", ",");
    return lines.map((line) => `${timestamp} STDERR docling_extract: ${line}`).join("\n") + "\n";
  }

  private async appendToLogFile(logFilePath: string, raw: string): Promise<void> {
    if (!raw || !raw.trim()) {
      return;
    }
    const formatted = this.formatStderrForLog(raw);
    if (!formatted) {
      return;
    }
    try {
      await fs.mkdir(path.dirname(logFilePath), { recursive: true });
      await fs.appendFile(logFilePath, formatted);
    } catch (error) {
      console.warn("Failed to append stderr to log file", error);
    }
  }

  private runPythonWithOutput(
    scriptPath: string,
    args: string[],
    stderrLogPath?: string | null
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn(this.settings.pythonPath, [scriptPath, ...args], {
        cwd: path.dirname(scriptPath),
        env: this.buildPythonEnv(),
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("error", (error) => {
        this.handlePythonProcessError(String(error));
        reject(error);
      });

      child.on("close", (code) => {
        if (stderrLogPath) {
          void this.appendToLogFile(stderrLogPath, stderr);
        }
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          const diagnostic = stderr.trim() ? stderr : stdout;
          this.handlePythonProcessError(diagnostic);
          reject(new Error(stderr || `Process exited with code ${code}`));
        }
      });
    });
  }
}

class ZoteroItemSuggestModal extends SuggestModal<ZoteroLocalItem> {
  private plugin: ZoteroRagPlugin;
  private resolveSelection: ((item: ZoteroLocalItem | null) => void) | null;
  private lastError: string | null = null;
  private indexedDocIds: Set<string> | null = null;

  constructor(app: App, plugin: ZoteroRagPlugin, onSelect: (item: ZoteroLocalItem | null) => void) {
    super(app);
    this.plugin = plugin;
    this.resolveSelection = onSelect;
    this.setPlaceholder("Search Zotero items...");
  }

  async getSuggestions(query: string): Promise<ZoteroLocalItem[]> {
    try {
      if (!this.indexedDocIds) {
        const index = await this.plugin.getDocIndex();
        this.indexedDocIds = new Set(Object.keys(index));
      }
      return await this.plugin.searchZoteroItems(query);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (this.lastError !== message) {
        this.lastError = message;
        new Notice(message);
      }
      console.error("Zotero search failed", error);
      return [];
    }
  }

  renderSuggestion(item: ZoteroLocalItem, el: HTMLElement): void {
    const title = item.data?.title ?? "[No title]";
    const year = this.extractYear(item);
    const docId = this.getDocId(item);
    const isIndexed = docId ? this.indexedDocIds?.has(docId) : false;
    const pdfStatus = this.getPdfStatus(item);
    if (isIndexed) {
      el.addClass("zrr-indexed-item");
    }
    if (pdfStatus === "no") {
      el.addClass("zrr-no-pdf-item");
    }
    el.createEl("div", { text: title });
    const metaEl = el.createEl("small");
    let hasMeta = false;
    const addSeparator = (): void => {
      if (hasMeta) {
        metaEl.createSpan({ text: " • " });
      }
    };
    if (year) {
      metaEl.createSpan({ text: year });
      hasMeta = true;
    }
    if (isIndexed) {
      addSeparator();
      metaEl.createSpan({ text: "Indexed", cls: "zrr-indexed-flag" });
      hasMeta = true;
    }
    if (pdfStatus === "no") {
      addSeparator();
      metaEl.createSpan({ text: "No attachment", cls: "zrr-no-pdf-flag" });
      hasMeta = true;
    }
    el.addEventListener("click", () => {
      if (this.resolveSelection) {
        this.resolveSelection(item);
        this.resolveSelection = null;
      }
      this.close();
    });
  }

  onChooseSuggestion(item: ZoteroLocalItem, evt: MouseEvent | KeyboardEvent): void {
    if (this.resolveSelection) {
      this.resolveSelection(item);
      this.resolveSelection = null;
    }
    this.close();
  }

  onClose(): void {
    if (this.resolveSelection) {
      this.resolveSelection(null);
      this.resolveSelection = null;
    }
  }

  private getDocId(item: ZoteroLocalItem): string {
    const key = item.key ?? item.data?.key ?? "";
    return typeof key === "string" ? key : "";
  }

  private getPdfStatus(item: ZoteroLocalItem): "yes" | "no" | "unknown" {
    const attachments = item.data?.attachments ?? item.data?.children ?? item.data?.items ?? [];
    if (Array.isArray(attachments) && attachments.length > 0) {
      const hasPdf = attachments.some((entry) => this.isPdfAttachment(entry));
      return hasPdf ? "yes" : "no";
    }
    const numChildren = item.meta?.numChildren;
    if (typeof numChildren === "number" && numChildren === 0) {
      return "no";
    }
    return "unknown";
  }

  private isPdfAttachment(entry: any): boolean {
    const contentType =
      entry?.contentType ?? entry?.mimeType ?? entry?.data?.contentType ?? entry?.data?.mimeType ?? "";
    return contentType === "application/pdf";
  }

  private extractYear(item: ZoteroLocalItem): string {
    const parsed = item.meta?.parsedDate ?? item.data?.date ?? "";
    if (typeof parsed !== "string") {
      return "";
    }
    const match = parsed.match(/\b(\d{4})\b/);
    return match ? match[1] : "";
  }
}
