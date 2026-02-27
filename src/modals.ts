import { EditorState, RangeSetBuilder } from "@codemirror/state";
import {
  Decoration,
  EditorView,
  ViewPlugin,
  type DecorationSet,
  type ViewUpdate,
} from "@codemirror/view";
import { App, Component, MarkdownRenderer, Modal, Notice, SuggestModal, setIcon } from "obsidian";
import type { MetadataDecision, ZoteroLocalItem } from "./types";
import {
  extractYearFromItem,
  getDocIdFromItem,
  getPdfStatusFromItem,
} from "./zoteroItemHelpers";

type RedisSearchProvider = {
  runRedisSearch: (term: string) => Promise<string>;
};

type ZoteroItemSuggestProvider = {
  getDocIndex: () => Promise<Record<string, unknown>>;
  searchZoteroItems: (query: string) => Promise<ZoteroLocalItem[]>;
};

export type OutputModalOptions = {
  autoRefresh?: boolean;
  refreshIntervalMs?: number;
  onRefresh?: () => Promise<string>;
  onClear?: () => Promise<void>;
  clearLabel?: string;
};

type LanguageOption = {
  label: string;
  value: string;
};

const ZOTERO_ITEM_TYPE_ICON_MAP: Record<string, string> = {
  artwork: "image",
  audioRecording: "music",
  bill: "file-text",
  blogPost: "globe",
  book: "book",
  bookSection: "book-open",
  case: "scale",
  computerProgram: "code",
  conferencePaper: "file-text",
  dataset: "database",
  dictionaryEntry: "book",
  document: "file-text",
  email: "mail",
  encyclopediaArticle: "book",
  film: "film",
  forumPost: "message-circle",
  hearing: "file-text",
  interview: "mic",
  journalArticle: "file-text",
  letter: "mail",
  magazineArticle: "file-text",
  manuscript: "file-text",
  map: "map",
  newspaperArticle: "file-text",
  patent: "award",
  podcast: "mic",
  preprint: "file-text",
  presentation: "file-text",
  radioBroadcast: "music",
  report: "file-text",
  statute: "scale",
  thesis: "graduation-cap",
  tvBroadcast: "film",
  videoRecording: "film",
  webpage: "globe",
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
const FULL_CHANGELOG_URL =
  "https://github.com/jmiba/zotero-redisearch-rag/blob/main/CHANGELOG.md";

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

export class TextPromptModal extends Modal {
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
    input.addClass("zrr-u-width-100");
    input.focus();

    const submit = contentEl.createEl("button", { text: "Submit" });
    submit.addClass("zrr-u-margin-top-0-75rem");
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

export class ReleaseNotesModal extends Modal {
  private version: string;
  private markdown: string;
  private markdownComponent: Component | null = null;

  constructor(app: App, version: string, markdown: string) {
    super(app);
    this.version = version;
    this.markdown = markdown;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("zrr-release-notes-modal");
    contentEl.createEl("h3", { text: "What's new" });
    this.markdownComponent?.unload();
    this.markdownComponent = new Component();
    this.markdownComponent.load();

    const markdown = String(this.markdown || "").trim();
    if (markdown) {
      const body = contentEl.createDiv({ cls: "zrr-release-notes-body" });
      void MarkdownRenderer.render(this.app, markdown, body, "", this.markdownComponent);
    } else {
      contentEl.createEl("p", {
        text: "This version includes improvements and fixes.",
      });
    }
    const changelog = contentEl.createDiv({ cls: "zrr-release-notes-body" });
    void MarkdownRenderer.render(
      this.app,
      `[Full changelog](${FULL_CHANGELOG_URL})`,
      changelog,
      "",
      this.markdownComponent
    );

    const actions = contentEl.createEl("div", { cls: "zrr-release-notes-actions" });
    const closeButton = actions.createEl("button", { text: "Close" });
    closeButton.addEventListener("click", () => this.close());
  }

  onClose(): void {
    this.markdownComponent?.unload();
    this.markdownComponent = null;
    this.contentEl.empty();
  }
}

export class ChunkTagModal extends Modal {
  private chunkId: string;
  private initialTags: string[];
  private onSubmit: (tags: string[]) => Promise<void> | void;
  private onRegenerate?: () => Promise<string[] | null>;

  constructor(
    app: App,
    chunkId: string,
    initialTags: string[],
    onSubmit: (tags: string[]) => Promise<void> | void,
    onRegenerate?: () => Promise<string[] | null>
  ) {
    super(app);
    this.chunkId = chunkId;
    this.initialTags = initialTags;
    this.onSubmit = onSubmit;
    this.onRegenerate = onRegenerate;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: `Edit tags for ${this.chunkId}` });

    const input = contentEl.createEl("textarea", {
      attr: { rows: "3" },
    });
    input.addClass("zrr-u-width-100");
    input.placeholder = "Tag1, tag2, tag3";
    input.value = this.initialTags.join(", ");
    input.focus();

    const actions = contentEl.createEl("div");
    actions.addClass("zrr-u-display-flex");
    actions.addClass("zrr-u-gap-0-5rem");
    actions.addClass("zrr-u-margin-top-0-75rem");
    const submit = actions.createEl("button", { text: "Save tags" });

    const handleSubmit = async (): Promise<void> => {
      const raw = input.value || "";
      const tags = raw
        .split(/[,;\n]+/)
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
      const unique = Array.from(new Set(tags));
      this.close();
      await Promise.resolve(this.onSubmit(unique));
    };

    if (this.onRegenerate) {
      const regenerate = actions.createEl("button", { text: "Regenerate" });
      regenerate.addEventListener("click", async () => {
        regenerate.setAttribute("disabled", "true");
        submit.setAttribute("disabled", "true");
        try {
          const tags = await this.onRegenerate?.();
          if (tags && tags.length > 0) {
            input.value = tags.join(", ");
            await Promise.resolve(this.onSubmit(tags));
          } else if (tags) {
            new Notice("No tags were generated.");
          }
        } finally {
          regenerate.removeAttribute("disabled");
          submit.removeAttribute("disabled");
        }
      });
    }

    submit.addEventListener("click", handleSubmit);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        void handleSubmit();
      }
    });
  }
}

export class ChunkTextPreviewModal extends Modal {
  private titleText: string;
  private content: string;
  private noteText: string;

  constructor(app: App, titleText: string, content: string, noteText = "") {
    super(app);
    this.titleText = titleText;
    this.content = content;
    this.noteText = noteText;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: this.titleText });
    if (this.noteText) {
      const note = contentEl.createEl("div", { text: this.noteText });
      note.className = "zrr-indexed-note";
    }
    const area = contentEl.createEl("textarea", {
      attr: { rows: "12", readonly: "true" },
    });
    area.addClass("zrr-u-width-100");
    area.value = this.content;
  }
}

export class RedisSearchModal extends Modal {
  private plugin: RedisSearchProvider;
  private initialTerm: string;
  private editorView?: EditorView;
  private bodyText = "";
  private inputEl?: HTMLInputElement;
  private statusEl?: HTMLElement;

  constructor(app: App, plugin: RedisSearchProvider, initialTerm = "") {
    super(app);
    this.plugin = plugin;
    this.initialTerm = initialTerm;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    if (this.modalEl) {
      this.modalEl.addClass("zrr-u-width-80vw");
      this.modalEl.addClass("zrr-u-max-width-1200px");
      this.modalEl.addClass("zrr-u-height-80vh");
      this.modalEl.addClass("zrr-u-max-height-90vh");
      this.modalEl.addClass("zrr-u-resize-both");
      this.modalEl.addClass("zrr-u-overflow-hidden");
    }

    contentEl.addClass("zrr-u-display-flex");
    contentEl.addClass("zrr-u-flex-direction-column");
    contentEl.addClass("zrr-u-height-100");
    contentEl.addClass("zrr-u-overflow-hidden");
    contentEl.addClass("zrr-u-min-height-0");
    const header = contentEl.createDiv();
    header.addClass("zrr-u-display-flex");
    header.addClass("zrr-u-align-items-center");
    header.addClass("zrr-u-justify-content-space-between");
    header.addClass("zrr-u-gap-0-5rem");
    header.createEl("h3", { text: "Redis index search" });

    const copyBtn = header.createEl("button", { text: "Copy all" });
    copyBtn.addClass("zrr-u-margin-left-auto");
    copyBtn.addEventListener("click", () => {
      this.copyResultsToClipboard();
    });

    const searchRow = contentEl.createDiv();
    searchRow.addClass("zrr-u-display-flex");
    searchRow.addClass("zrr-u-align-items-center");
    searchRow.addClass("zrr-u-gap-0-5rem");
    searchRow.addClass("zrr-u-margin-0-5rem-0");
    const input = searchRow.createEl("input");
    input.type = "text";
    input.placeholder = "Search term";
    input.value = this.initialTerm;
    input.addClass("zrr-u-flex-1");
    input.addClass("zrr-u-min-width-0");
    this.inputEl = input;

    const button = searchRow.createEl("button", { text: "Search" });
    button.addEventListener("click", () => {
      void this.runSearch();
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        void this.runSearch();
      }
    });

    const status = contentEl.createDiv();
    status.addClass("zrr-u-color-var-text-muted");
    status.addClass("zrr-u-margin-bottom-0-5rem");
    this.statusEl = status;

    const editorWrap = contentEl.createDiv();
    editorWrap.addClass("zrr-u-flex-1-1-0");
    editorWrap.addClass("zrr-u-min-height-0");
    editorWrap.addClass("zrr-u-border-1px-solid-var-background-modifier-border");
    editorWrap.addClass("zrr-u-border-radius-6px");
    editorWrap.addClass("zrr-u-display-flex");
    editorWrap.addClass("zrr-u-flex-direction-column");
    editorWrap.addClass("zrr-u-overflow-auto");
    const state = EditorState.create({
      doc: this.bodyText,
      extensions: [
        LOG_THEME,
        LOG_HIGHLIGHT_PLUGIN,
        EditorView.editable.of(false),
        EditorState.readOnly.of(true),
        EditorView.lineWrapping,
      ],
    });

    this.editorView = new EditorView({
      state,
      parent: editorWrap,
    });

    if (this.initialTerm) {
      void this.runSearch();
    }
  }

  onClose(): void {
    this.editorView?.destroy();
    this.editorView = undefined;
  }

  private async runSearch(): Promise<void> {
    const term = (this.inputEl?.value || "").trim();
    if (!term) {
      if (this.statusEl) {
        this.statusEl.textContent = "Enter a search term.";
      }
      return;
    }
    if (this.statusEl) {
      this.statusEl.textContent = "Searching...";
    }
    const nextText = await this.plugin.runRedisSearch(term);
    this.updateEditor(nextText);
    if (this.statusEl) {
      this.statusEl.textContent = `Results for "${term}"`;
    }
  }

  private updateEditor(nextText: string): void {
    if (!this.editorView) {
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

  private copyResultsToClipboard(): void {
    const text = this.bodyText || "";
    if (!text) {
      new Notice("Nothing to copy.");
      return;
    }
    navigator.clipboard.writeText(text)
      .then(() => new Notice("Results copied to clipboard."))
      .catch(() => new Notice("Failed to copy results."));
  }
}

export class OutputModal extends Modal {
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
      this.modalEl.addClass("zrr-u-width-80vw");
      this.modalEl.addClass("zrr-u-max-width-1200px");
      this.modalEl.addClass("zrr-u-height-80vh");
      this.modalEl.addClass("zrr-u-max-height-90vh");
      this.modalEl.addClass("zrr-u-resize-both");
      this.modalEl.addClass("zrr-u-overflow-hidden");
    }
    contentEl.addClass("zrr-u-display-flex");
    contentEl.addClass("zrr-u-flex-direction-column");
    contentEl.addClass("zrr-u-height-100");
    contentEl.addClass("zrr-u-overflow-hidden");
    contentEl.addClass("zrr-u-min-height-0");
    const header = contentEl.createDiv();
    header.addClass("zrr-u-display-flex");
    header.addClass("zrr-u-align-items-center");
    header.addClass("zrr-u-justify-content-space-between");
    header.addClass("zrr-u-gap-0-5rem");
    header.createEl("h3", { text: this.titleText });
    const actions = header.createDiv();
    actions.addClass("zrr-u-display-flex");
    actions.addClass("zrr-u-gap-0-5rem");
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
    editorWrap.addClass("zrr-u-flex-1-1-0");
    editorWrap.addClass("zrr-u-min-height-0");
    editorWrap.addClass("zrr-u-border-1px-solid-var-background-modifier-border");
    editorWrap.addClass("zrr-u-border-radius-6px");
    editorWrap.addClass("zrr-u-display-flex");
    editorWrap.addClass("zrr-u-flex-direction-column");
    editorWrap.addClass("zrr-u-overflow-auto");
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

export class ConfirmOverwriteModal extends Modal {
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
    actions.addClass("zrr-u-display-flex");
    actions.addClass("zrr-u-gap-0-5rem");
    actions.addClass("zrr-u-margin-top-0-75rem");
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

export class ConfirmDeleteNoteModal extends Modal {
  private notePath: string;
  private docId: string;
  private onResolve: (confirmed: boolean) => void;
  private resolved = false;

  constructor(app: App, notePath: string, docId: string, onResolve: (confirmed: boolean) => void) {
    super(app);
    this.notePath = notePath;
    this.docId = docId;
    this.onResolve = onResolve;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: "Delete note and cached data?" });
    contentEl.createEl("p", {
      text: `This will delete the note and cached chunks/items for doc_id ${this.docId}.`,
    });
    contentEl.createEl("p", {
      text: `Note: ${this.notePath}`,
    });
    const actions = contentEl.createEl("div");
    actions.addClass("zrr-u-display-flex");
    actions.addClass("zrr-u-gap-0-5rem");
    actions.addClass("zrr-u-margin-top-0-75rem");
    const cancel = actions.createEl("button", { text: "Cancel" });
    const confirm = actions.createEl("button", { text: "Delete" });
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

export class ConfirmRebuildIndexModal extends Modal {
  private reason: string;
  private onResolve: (confirmed: boolean) => void;
  private resolved = false;

  constructor(app: App, reason: string, onResolve: (confirmed: boolean) => void) {
    super(app);
    this.reason = reason;
    this.onResolve = onResolve;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: "Rebuild redis index?" });
    contentEl.createEl("p", { text: this.reason });
    contentEl.createEl("p", {
      text: "This will drop the redissearch index (and embeddings) and rebuild it from cached chunks.",
    });
    const actions = contentEl.createEl("div");
    actions.addClass("zrr-u-display-flex");
    actions.addClass("zrr-u-gap-0-5rem");
    actions.addClass("zrr-u-margin-top-0-75rem");
    const cancel = actions.createEl("button", { text: "Cancel" });
    const confirm = actions.createEl("button", { text: "Drop & rebuild" });
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

export class ConfirmPurgeRedisOrphansModal extends Modal {
  private onResolve: (confirmed: boolean) => void;
  private resolved = false;

  constructor(app: App, onResolve: (confirmed: boolean) => void) {
    super(app);
    this.onResolve = onResolve;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: "Purge redis orphaned chunks?" });
    contentEl.createEl("p", {
      text: "This removes Redis chunk keys that have no cached item.json or chunk.json on disk.",
    });
    contentEl.createEl("p", {
      text: "Cache files are not deleted. Use this to clean up stale redis data.",
    });
    const actions = contentEl.createEl("div");
    actions.addClass("zrr-u-display-flex");
    actions.addClass("zrr-u-gap-0-5rem");
    actions.addClass("zrr-u-margin-top-0-75rem");
    const cancel = actions.createEl("button", { text: "Cancel" });
    const confirm = actions.createEl("button", { text: "Purge orphans" });
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

type MetadataConflictItem = {
  field: string;
  fieldLabel: string;
  noteLabel: string;
  zoteroLabel: string;
  noteValue: string;
  zoteroValue: string;
};

export class MetadataConflictBatchModal extends Modal {
  private conflicts: MetadataConflictItem[];
  private onResolve: (decisions: Record<string, MetadataDecision>) => void;
  private resolved = false;
  private selects = new Map<string, HTMLSelectElement>();

  constructor(
    app: App,
    conflicts: MetadataConflictItem[],
    onResolve: (decisions: Record<string, MetadataDecision>) => void
  ) {
    super(app);
    this.conflicts = conflicts;
    this.onResolve = onResolve;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: "Resolve metadata conflicts" });
    contentEl.createEl("p", {
      text: "Choose which values to keep for each field.",
    });

    const table = contentEl.createEl("div");
    table.addClass("zrr-u-display-grid");
    table.addClass("zrr-u-gap-0-75rem");
    for (const conflict of this.conflicts) {
      const row = table.createEl("div");
      row.addClass("zrr-u-display-grid");
      row.addClass("zrr-u-gap-0-4rem");
      row.addClass("zrr-u-border-1px-solid-var-background-modifier-border");
      row.addClass("zrr-u-border-radius-6px");
      row.addClass("zrr-u-padding-0-6rem");
      row.createEl("div", { text: conflict.fieldLabel, cls: "zrr-font-semibold" });

      const values = row.createEl("div");
      values.addClass("zrr-u-display-grid");
      values.addClass("zrr-u-grid-template-columns-1fr-1fr");
      values.addClass("zrr-u-gap-0-5rem");
      const noteBox = values.createEl("textarea", { attr: { readonly: "true", rows: "3" } });
      noteBox.addClass("zrr-u-width-100");
      noteBox.value = conflict.noteValue || "(empty)";

      const zoteroBox = values.createEl("textarea", { attr: { readonly: "true", rows: "3" } });
      zoteroBox.addClass("zrr-u-width-100");
      zoteroBox.value = conflict.zoteroValue || "(empty)";

      const selectWrap = row.createEl("div");
      selectWrap.addClass("zrr-u-display-flex");
      selectWrap.addClass("zrr-u-gap-0-5rem");
      selectWrap.addClass("zrr-u-align-items-center");
      selectWrap.createEl("span", { text: "Decision:" });
      const select = selectWrap.createEl("select");
      select.add(new Option(conflict.noteLabel, "note"));
      select.add(new Option(conflict.zoteroLabel, "zotero"));
      select.add(new Option("Skip", "skip"));
      select.value = "skip";
      this.selects.set(conflict.field, select);
    }

    const actions = contentEl.createEl("div");
    actions.addClass("zrr-u-display-flex");
    actions.addClass("zrr-u-flex-wrap-wrap");
    actions.addClass("zrr-u-gap-0-5rem");
    actions.addClass("zrr-u-margin-top-0-75rem");
    const applyAll = (value: MetadataDecision) => {
      for (const select of this.selects.values()) {
        select.value = value;
      }
    };

    const keepNoteAll = actions.createEl("button", { text: "Use note for all" });
    const keepZoteroAll = actions.createEl("button", { text: "Use Zotero for all" });
    const skipAll = actions.createEl("button", { text: "Skip all" });
    const apply = actions.createEl("button", { text: "Apply" });

    keepNoteAll.addEventListener("click", () => applyAll("note"));
    keepZoteroAll.addEventListener("click", () => applyAll("zotero"));
    skipAll.addEventListener("click", () => applyAll("skip"));

    apply.addEventListener("click", () => {
      const decisions: Record<string, MetadataDecision> = {};
      for (const [field, select] of this.selects.entries()) {
        decisions[field] = (select.value as MetadataDecision) || "skip";
      }
      this.resolved = true;
      this.close();
      this.onResolve(decisions);
    });
  }

  onClose(): void {
    if (!this.resolved) {
      const decisions: Record<string, MetadataDecision> = {};
      for (const [field, select] of this.selects.entries()) {
        decisions[field] = (select.value as MetadataDecision) || "skip";
      }
      this.onResolve(decisions);
    }
  }
}

type AnnotationConflictItem = {
  key: string;
  title: string;
  noteValue: string;
  zoteroValue: string;
};

export class AnnotationConflictBatchModal extends Modal {
  private conflicts: AnnotationConflictItem[];
  private onResolve: (decisions: Record<string, MetadataDecision>) => void;
  private resolved = false;
  private selects = new Map<string, HTMLSelectElement>();

  constructor(
    app: App,
    conflicts: AnnotationConflictItem[],
    onResolve: (decisions: Record<string, MetadataDecision>) => void
  ) {
    super(app);
    this.conflicts = conflicts;
    this.onResolve = onResolve;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: "Resolve annotation conflicts" });
    contentEl.createEl("p", { text: "Choose which version to keep for each annotation." });

    const table = contentEl.createEl("div");
    table.addClass("zrr-u-display-grid");
    table.addClass("zrr-u-gap-0-75rem");
    for (const conflict of this.conflicts) {
      const row = table.createEl("div");
      row.addClass("zrr-u-display-grid");
      row.addClass("zrr-u-gap-0-4rem");
      row.addClass("zrr-u-border-1px-solid-var-background-modifier-border");
      row.addClass("zrr-u-border-radius-6px");
      row.addClass("zrr-u-padding-0-6rem");
      row.createEl("div", { text: conflict.title, cls: "zrr-font-semibold" });

      const values = row.createEl("div");
      values.addClass("zrr-u-display-grid");
      values.addClass("zrr-u-grid-template-columns-1fr-1fr");
      values.addClass("zrr-u-gap-0-5rem");
      const noteBox = values.createEl("textarea", { attr: { readonly: "true", rows: "4" } });
      noteBox.addClass("zrr-u-width-100");
      noteBox.value = conflict.noteValue || "(empty)";

      const zoteroBox = values.createEl("textarea", { attr: { readonly: "true", rows: "4" } });
      zoteroBox.addClass("zrr-u-width-100");
      zoteroBox.value = conflict.zoteroValue || "(empty)";

      const selectWrap = row.createEl("div");
      selectWrap.addClass("zrr-u-display-flex");
      selectWrap.addClass("zrr-u-gap-0-5rem");
      selectWrap.addClass("zrr-u-align-items-center");
      selectWrap.createEl("span", { text: "Decision:" });
      const select = selectWrap.createEl("select");
      select.add(new Option("Use note", "note"));
      select.add(new Option("Use Zotero", "zotero"));
      select.add(new Option("Skip", "skip"));
      select.value = "skip";
      this.selects.set(conflict.key, select);
    }

    const actions = contentEl.createEl("div");
    actions.addClass("zrr-u-display-flex");
    actions.addClass("zrr-u-flex-wrap-wrap");
    actions.addClass("zrr-u-gap-0-5rem");
    actions.addClass("zrr-u-margin-top-0-75rem");
    const applyAll = (value: MetadataDecision) => {
      for (const select of this.selects.values()) {
        select.value = value;
      }
    };

    const keepNoteAll = actions.createEl("button", { text: "Use note for all" });
    const keepZoteroAll = actions.createEl("button", { text: "Use Zotero for all" });
    const skipAll = actions.createEl("button", { text: "Skip all" });
    const apply = actions.createEl("button", { text: "Apply" });

    keepNoteAll.addEventListener("click", () => applyAll("note"));
    keepZoteroAll.addEventListener("click", () => applyAll("zotero"));
    skipAll.addEventListener("click", () => applyAll("skip"));

    apply.addEventListener("click", () => {
      const decisions: Record<string, MetadataDecision> = {};
      for (const [key, select] of this.selects.entries()) {
        decisions[key] = (select.value as MetadataDecision) || "skip";
      }
      this.resolved = true;
      this.close();
      this.onResolve(decisions);
    });
  }

  onClose(): void {
    if (!this.resolved) {
      const decisions: Record<string, MetadataDecision> = {};
      for (const [key, select] of this.selects.entries()) {
        decisions[key] = (select.value as MetadataDecision) || "skip";
      }
      this.onResolve(decisions);
    }
  }
}

export class LanguageSuggestModal extends SuggestModal<LanguageOption> {
  private resolveSelection: (value: string | null) => void;
  private resolved = false;

  constructor(app: App, onSelect: (value: string | null) => void) {
    super(app);
    this.resolveSelection = onSelect;
    this.setPlaceholder("Select a language for ocr/quality...");
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

export class ZoteroItemSuggestModal extends SuggestModal<ZoteroLocalItem> {
  private plugin: ZoteroItemSuggestProvider;
  private resolveSelection: ((item: ZoteroLocalItem | null) => void) | null;
  private lastError: string | null = null;
  private indexedDocIds: Set<string> | null = null;
  private querySequence = 0;
  private readonly queryDebounceMs = 200;
  private readonly minQueryLength = 2;
  private readonly maxQueryCacheEntries = 100;
  private queryCache = new Map<string, ZoteroLocalItem[]>();

  constructor(app: App, plugin: ZoteroItemSuggestProvider, onSelect: (item: ZoteroLocalItem | null) => void) {
    super(app);
    this.plugin = plugin;
    this.resolveSelection = onSelect;
    this.setPlaceholder("Search Zotero items...");
  }

  async getSuggestions(query: string): Promise<ZoteroLocalItem[]> {
    const trimmed = query.trim();
    if (trimmed.length > 0 && trimmed.length < this.minQueryLength) {
      return [];
    }

    const cacheKey = trimmed.toLowerCase();
    const cached = this.queryCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const sequence = ++this.querySequence;
    try {
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, this.queryDebounceMs);
      });
      if (sequence !== this.querySequence) {
        return [];
      }
      if (!this.indexedDocIds) {
        const index = await this.plugin.getDocIndex();
        this.indexedDocIds = new Set(Object.keys(index));
      }
      const results = await this.plugin.searchZoteroItems(trimmed);
      if (sequence !== this.querySequence) {
        return [];
      }
      this.queryCache.set(cacheKey, results);
      if (this.queryCache.size > this.maxQueryCacheEntries) {
        const oldestKey = this.queryCache.keys().next().value;
        if (oldestKey !== undefined) {
          this.queryCache.delete(oldestKey);
        }
      }
      return results;
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
    const year = extractYearFromItem(item);
    const docId = getDocIdFromItem(item);
    const isIndexed = docId ? this.indexedDocIds?.has(docId) : false;
    const pdfStatus = getPdfStatusFromItem(item);
    const itemType = String(item.data?.itemType ?? "").trim();
    if (isIndexed) {
      el.addClass("zrr-indexed-item");
    }
    if (pdfStatus === "no") {
      el.addClass("zrr-no-pdf-item");
    }

    const row = el.createDiv({ cls: "zrr-zotero-suggest-row" });
    const iconEl = row.createSpan({ cls: "zrr-zotero-item-icon" });
    const iconName = ZOTERO_ITEM_TYPE_ICON_MAP[itemType] ?? "file-text";
    setIcon(iconEl, iconName);
    const textWrap = row.createDiv({ cls: "zrr-zotero-suggest-text" });
    textWrap.createEl("div", { text: title, cls: "zrr-zotero-suggest-title" });
    const metaEl = textWrap.createEl("small", { cls: "zrr-zotero-suggest-meta" });
    let hasMeta = false;
    const addSeparator = (): void => {
      if (hasMeta) {
        metaEl.createSpan({ text: " - " });
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
      metaEl.createSpan({ text: "No PDF attachment", cls: "zrr-no-pdf-flag" });
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

  onChooseSuggestion(item: ZoteroLocalItem, _evt: MouseEvent | KeyboardEvent): void {
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
}
