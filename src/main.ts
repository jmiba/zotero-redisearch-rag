import {
  App,
  FileSystemAdapter,
  Modal,
  Notice,
  Plugin,
  SuggestModal,
  TFile,
  WorkspaceLeaf,
  addIcon,
  normalizePath,
} from "obsidian";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import http from "http";
import https from "https";
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

class OutputModal extends Modal {
  private titleText: string;
  private bodyText: string;

  constructor(app: App, titleText: string, bodyText: string) {
    super(app);
    this.titleText = titleText;
    this.bodyText = bodyText;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: this.titleText });
    const pre = contentEl.createEl("pre");
    pre.setText(this.bodyText);
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

  async onload(): Promise<void> {
    await this.loadSettings();
    await this.migrateCachePaths();
    this.addSettingTab(new ZoteroRagSettingTab(this.app, this));

    this.registerRibbonIcons();
    this.registerView(VIEW_TYPE_ZOTERO_CHAT, (leaf) => new ZoteroChatView(leaf, this));
    this.setupStatusBar();
    this.registerNoteRenameHandler();

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
      name: "Start Redis Stack (Docker Compose)",
      callback: () => this.startRedisStack(),
    });

    if (this.settings.autoStartRedis) {
      void this.startRedisStack(true);
    }
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
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
        () => {}
      );
      qualityLabel = await this.readDoclingQualityLabel(chunkPath);
      await this.annotateChunkJsonWithAttachmentKey(chunkPath, attachment.key);
    } catch (error) {
      new Notice("Docling extraction failed. See console for details.");
      console.error(error);
      this.clearStatusProgress();
      return;
    }

    try {
      this.showStatusProgress(this.formatStatusLabel("Indexing chunks...", qualityLabel), 0);
      await this.runPythonStreaming(
        indexScript,
        [
          "--chunks-json",
          this.getAbsoluteVaultPath(chunkPath),
          "--redis-url",
          this.settings.redisUrl,
          "--index",
          this.settings.redisIndex,
          "--prefix",
          this.settings.redisPrefix,
          "--embed-base-url",
          this.settings.embedBaseUrl,
          "--embed-api-key",
          this.settings.embedApiKey,
          "--embed-model",
          this.settings.embedModel,
          "--progress",
        ],
        (payload) => {
          if (payload?.type === "progress" && payload.total) {
            const percent = Math.round((payload.current / payload.total) * 100);
            const label = this.formatStatusLabel(
              `Indexing chunks ${payload.current}/${payload.total}`,
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
      const noteContent = this.buildNoteMarkdown(values, item.meta ?? {}, docId, pdfLink, itemPath, doclingMd);
      await this.app.vault.adapter.write(notePath, noteContent);
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
      this.settings.redisIndex,
      "--prefix",
      this.settings.redisPrefix,
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
    const pages = citation.pages || `${citation.page_start ?? "?"}-${citation.page_end ?? "?"}`;
    const pageLabel = pages.includes("-") ? pages.replace("-", " - ") : pages;
    const pageStart = citation.page_start ? String(citation.page_start) : "";
    const pdfPath = entry?.pdf_path || citation.source_pdf || "";
    const attachmentKey = citation.attachment_key || entry?.attachment_key;
    const annotationKey = citation.annotation_key || this.extractAnnotationKey(citation.chunk_id);
    const zoteroUrl = citation.doc_id
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
      if (display.zoteroUrl) {
        const label = `${display.noteTitle} p. ${display.pageLabel}`;
        replacements.set(token, `[${label}](${display.zoteroUrl})`);
      } else {
        const fallbackLabel = display.pageLabel
          ? `${docId} p. ${display.pageLabel}`
          : `${docId}`;
        replacements.set(token, `(${fallbackLabel})`);
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
    if (resolved.notePath) {
      await this.openNoteInMain(resolved.notePath);
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
      const docId = missing[i];
      const percent = Math.round(((i + 1) / missing.length) * 100);
      this.showStatusProgress(`Recreating ${i + 1}/${missing.length}`, percent);
      const ok = await this.rebuildNoteFromCacheForDocId(docId, false);
      if (ok) {
        rebuilt += 1;
      }
    }

    this.showStatusProgress("Done", 100);
    window.setTimeout(() => this.clearStatusProgress(), 1200);
    new Notice(`Recreated ${rebuilt}/${missing.length} missing notes.`);
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
        await this.runPython(indexScript, [
          "--chunks-json",
          this.getAbsoluteVaultPath(chunkPath),
          "--redis-url",
          this.settings.redisUrl,
          "--index",
          this.settings.redisIndex,
          "--prefix",
          this.settings.redisPrefix,
          "--embed-base-url",
          this.settings.embedBaseUrl,
          "--embed-api-key",
          this.settings.embedApiKey,
          "--embed-model",
          this.settings.embedModel,
          "--upsert",
        ]);
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
      if (this.settings.ocrMode === "force_low_quality") {
        args.push("--force-ocr-low-quality");
      }
      args.push("--quality-threshold", String(this.settings.ocrQualityThreshold));
      if (languageHint) {
        args.push("--language-hint", languageHint);
      }
      const output = await this.runPythonWithOutput(doclingScript, args);
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

  public async openInternalLinkInMain(linkText: string): Promise<void> {
    const leaf = this.getMainLeaf();
    const linkPath = linkText.split("#")[0].trim();
    const file = linkPath
      ? this.app.metadataCache.getFirstLinkpathDest(linkPath, "")
      : null;
    if (file instanceof TFile) {
      await leaf.openFile(file, { active: true });
      if (linkText.includes("#")) {
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
    const pages = citation.pages || `${citation.page_start ?? "?"}-${citation.page_end ?? "?"}`;
    const label = `${docId}`;
    const pageLabel = pages.includes("-") ? pages.replace("-", " - ") : pages;
    const annotationKey = citation.annotation_key || this.extractAnnotationKey(citation.chunk_id);
    const attachmentKey = citation.attachment_key || this.docIndex?.[citation.doc_id || ""]?.attachment_key;
    const pageStart = citation.page_start ? String(citation.page_start) : "";
    const entry = this.docIndex?.[citation.doc_id || ""] ?? null;
    const noteTitle = entry?.zotero_title || entry?.note_title || label;
    const noteTarget = entry?.note_path
      ? normalizePath(entry.note_path).replace(/\.md$/i, "")
      : this.sanitizeFileName(noteTitle) || noteTitle;
    const noteLink =
      noteTarget && noteTarget !== noteTitle ? `[[${noteTarget}|${noteTitle}]]` : `[[${noteTitle}]]`;
    if (attachmentKey) {
      const zoteroUrl = this.buildZoteroDeepLink(docId, attachmentKey, pageStart, annotationKey);
      return `- ${noteLink}, p. [${pageLabel}](${zoteroUrl})`;
    }
    return `- ${noteLink}, p. ${pageLabel}`;
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

    const sourcePdf = typeof chunkPayload.source_pdf === "string" ? chunkPayload.source_pdf : "";
    if (!sourcePdf) {
      if (showNotices) {
        new Notice("Cached chunk JSON is missing source_pdf.");
      }
      this.clearStatusProgress();
      return false;
    }

    try {
      await fs.access(sourcePdf);
    } catch (error) {
      if (showNotices) {
        new Notice("Cached source PDF path is not accessible.");
      }
      console.error(error);
      this.clearStatusProgress();
      return false;
    }

    const values: ZoteroItemValues = item.data ?? item;
    const title = typeof values.title === "string" ? values.title : "";
    const languageHint = await this.resolveLanguageHint(values, item.key ?? values.key);
    const doclingLanguageHint = this.buildDoclingLanguageHint(languageHint ?? undefined);
    let notePath = "";
    const existingEntry = await this.getDocIndexEntry(docId);
    const attachmentKey =
      typeof chunkPayload?.metadata?.attachment_key === "string"
        ? chunkPayload.metadata.attachment_key
        : existingEntry?.attachment_key;
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

    try {
      qualityLabel = await this.readDoclingQualityLabelFromPdf(sourcePdf, doclingLanguageHint);
      this.showStatusProgress(this.formatStatusLabel("Docling extraction...", qualityLabel), 0);
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
        () => {}
      );
      qualityLabel = await this.readDoclingQualityLabel(chunkPath);
      if (attachmentKey) {
        await this.annotateChunkJsonWithAttachmentKey(chunkPath, attachmentKey);
      }
    } catch (error) {
      if (showNotices) {
        new Notice("Docling extraction failed. See console for details.");
      }
      console.error(error);
      this.clearStatusProgress();
      return false;
    }

    try {
      this.showStatusProgress(this.formatStatusLabel("Indexing chunks...", qualityLabel), 0);
      await this.runPythonStreaming(
        indexScript,
        [
          "--chunks-json",
          this.getAbsoluteVaultPath(chunkPath),
          "--redis-url",
          this.settings.redisUrl,
          "--index",
          this.settings.redisIndex,
          "--prefix",
          this.settings.redisPrefix,
          "--embed-base-url",
          this.settings.embedBaseUrl,
          "--embed-api-key",
          this.settings.embedApiKey,
          "--embed-model",
          this.settings.embedModel,
          "--upsert",
          "--progress",
        ],
        (payload) => {
          if (payload?.type === "progress" && payload.total) {
            const percent = Math.round((payload.current / payload.total) * 100);
            const label = this.formatStatusLabel(
              `Indexing chunks ${payload.current}/${payload.total}`,
              qualityLabel
            );
            this.showStatusProgress(label, percent);
          }
        },
        () => undefined
      );
    } catch (error) {
      if (showNotices) {
        new Notice("RedisSearch indexing failed. See console for details.");
      }
      console.error(error);
      this.clearStatusProgress();
      return false;
    }

    const pdfLink = this.buildPdfLinkForNote(sourcePdf, existingEntry?.attachment_key, docId);

    try {
      const doclingMd = await this.app.vault.adapter.read(notePath);
      const noteContent = this.buildNoteMarkdown(values, item.meta ?? {}, docId, pdfLink, itemPath, doclingMd);
      await this.app.vault.adapter.write(notePath, noteContent);
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

  private buildNoteMarkdown(
    values: ZoteroItemValues,
    meta: Record<string, any>,
    docId: string,
    pdfLink: string,
    itemPath: string,
    doclingMarkdown: string
  ): string {
    const jsonLink = `[[${itemPath}]]`;
    const frontmatter = this.renderFrontmatter(values, meta, docId, pdfLink, jsonLink);
    const frontmatterBlock = frontmatter ? `---\n${frontmatter}\n---\n\n` : "";

    return `${frontmatterBlock}PDF: ${pdfLink}\n\nItem JSON: ${jsonLink}\n\n${doclingMarkdown}`;
  }

  private renderFrontmatter(
    values: ZoteroItemValues,
    meta: Record<string, any>,
    docId: string,
    pdfLink: string,
    itemJsonLink: string
  ): string {
    const template = this.settings.frontmatterTemplate ?? "";
    if (!template.trim()) {
      return "";
    }
    const vars = this.buildTemplateVars(values, meta, docId, pdfLink, itemJsonLink);
    return template.replace(/{{\s*([a-z0-9_]+)\s*}}/gi, (_, key) => vars[key] ?? "").trim();
  }

  private buildTemplateVars(
    values: ZoteroItemValues,
    meta: Record<string, any>,
    docId: string,
    pdfLink: string,
    itemJsonLink: string
  ): Record<string, string> {
    const title = typeof values.title === "string" ? values.title : "";
    const shortTitle = typeof values.shortTitle === "string" ? values.shortTitle : "";
    const date = typeof values.date === "string" ? values.date : "";
    const parsedDate = typeof meta?.parsedDate === "string" ? meta.parsedDate : "";
    const year = this.extractYear(parsedDate || date);
    const creators = Array.isArray(values.creators) ? values.creators : [];
    const authorsList = creators.filter((c) => c.creatorType === "author").map((c) => this.formatCreatorName(c));
    const authors = authorsList.join("; ");
    const tagsList = Array.isArray(values.tags)
      ? values.tags.map((tag: any) => (typeof tag === "string" ? tag : tag?.tag)).filter(Boolean)
      : [];
    const tags = tagsList.join("; ");
    const itemType = typeof values.itemType === "string" ? values.itemType : "";
    const creatorSummary = typeof meta?.creatorSummary === "string" ? meta.creatorSummary : "";

    const vars: Record<string, string> = {
      doc_id: docId,
      zotero_key: typeof values.key === "string" ? values.key : docId,
      title,
      short_title: shortTitle,
      date,
      year,
      authors,
      tags,
      item_type: itemType,
      creator_summary: creatorSummary,
      pdf_link: this.escapeYamlString(pdfLink),
      item_json: this.escapeYamlString(itemJsonLink),
    };

    for (const [key, value] of Object.entries(vars)) {
      vars[`${key}_yaml`] = this.escapeYamlString(value);
    }

    vars["authors_yaml"] = this.toYamlList(authorsList);
    vars["tags_yaml"] = this.toYamlList(tagsList);

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
    const safe = String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
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
    if (!this.settings.removeImagePlaceholders) {
      args.push("--keep-image-tags");
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

    return args;
  }

  private getRedisDataDir(): string {
    return path.join(this.getVaultBasePath(), CACHE_ROOT, "redis-data");
  }

  private getDockerComposePath(): string {
    const pluginDir = this.getPluginDir();
    return path.join(pluginDir, "tools", "docker-compose.yml");
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

  async startRedisStack(silent?: boolean): Promise<void> {
    try {
      await this.ensureBundledTools();
      const composePath = this.getDockerComposePath();
      const dataDir = this.getRedisDataDir();
      await fs.mkdir(dataDir, { recursive: true });
      const dockerPath = this.settings.dockerPath?.trim() || "docker";
      const project = this.getDockerProjectName();
      const redisPort = String(this.getRedisPortFromUrl());
      try {
        await this.runCommand(
          dockerPath,
          ["compose", "-p", project, "-f", composePath, "down"],
          { cwd: path.dirname(composePath) }
        );
      } catch (error) {
        console.warn("Redis Stack stop before restart failed", error);
      }
      await this.runCommand(
        dockerPath,
        ["compose", "-p", project, "-f", composePath, "up", "-d"],
        {
          cwd: path.dirname(composePath),
          env: { ...process.env, ZRR_DATA_DIR: dataDir, ZRR_PORT: redisPort },
        }
      );
      if (!silent) {
        new Notice("Redis Stack started.");
      }
    } catch (error) {
      if (!silent) {
        new Notice("Failed to start Redis Stack. Check Docker Desktop and File Sharing.");
      }
      console.error("Failed to start Redis Stack", error);
    }
  }

  private runPython(scriptPath: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(this.settings.pythonPath, [scriptPath, ...args], {
        cwd: path.dirname(scriptPath),
      });

      let stderr = "";
      child.stderr.on("data", (data) => {
        stderr += data.toString();
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

  private runCommand(
    command: string,
    args: string[],
    options?: { cwd?: string; env?: NodeJS.ProcessEnv }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: options?.cwd,
        env: options?.env,
      });

      let stderr = "";
      child.stderr.on("data", (data) => {
        stderr += data.toString();
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
    onFallbackFinal: (payload: any) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(this.settings.pythonPath, [scriptPath, ...args], {
        cwd: path.dirname(scriptPath),
      });

      let stdoutBuffer = "";
      let stderr = "";
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
          // Ignore non-JSON output.
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

      child.on("close", (code) => {
        if (stdoutBuffer.trim()) {
          handleLine(stdoutBuffer);
        }
        if (!sawFinal && lastPayload) {
          onFallbackFinal(lastPayload);
        }
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(stderr || `Process exited with code ${code}`));
        }
      });
    });
  }

  private runPythonWithOutput(scriptPath: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn(this.settings.pythonPath, [scriptPath, ...args], {
        cwd: path.dirname(scriptPath),
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("close", (code) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
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
      metaEl.createSpan({ text: "No PDF", cls: "zrr-no-pdf-flag" });
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
