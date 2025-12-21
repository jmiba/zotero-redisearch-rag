import {
  App,
  FileSystemAdapter,
  Modal,
  Notice,
  Plugin,
  SuggestModal,
  TFile,
  WorkspaceLeaf,
  normalizePath,
} from "obsidian";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import http from "http";
import https from "https";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import {
  CHUNK_CACHE_DIR,
  CACHE_ROOT,
  DEFAULT_SETTINGS,
  ITEM_CACHE_DIR,
  ZoteroRagSettingTab,
  ZoteroRagSettings,
} from "./settings";
import { TOOL_ASSETS } from "./toolAssets";
import { VIEW_TYPE_ZOTERO_CHAT, ZoteroChatView } from "./chatView";
import type { ChatCitation, ChatMessage } from "./chatView";

type ZoteroItemValues = Record<string, any>;

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

    const attachment = await this.resolvePdfAttachment(values, docId);
    if (!attachment) {
      new Notice("No PDF attachment found for item.");
      return;
    }

    this.showStatusProgress("Preparing...", 5);

    const title = typeof values.title === "string" ? values.title : "";
    const baseName = this.sanitizeFileName(title) || docId;
    const finalBaseName = await this.resolveUniqueBaseName(baseName, docId);

    const pdfPath = normalizePath(`${this.settings.outputPdfDir}/${finalBaseName}.pdf`);
    const itemPath = normalizePath(`${ITEM_CACHE_DIR}/${docId}.json`);
    const chunkPath = normalizePath(`${CHUNK_CACHE_DIR}/${docId}.json`);
    const notePath = normalizePath(`${this.settings.outputNoteDir}/${finalBaseName}.md`);

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
        pdfLink = `[[${pdfPath}]]`;
      } else {
        if (!attachment.filePath) {
          new Notice("PDF file path missing. Enable PDF copying or check Zotero storage.");
          this.clearStatusProgress();
          return;
        }
        pdfSourcePath = attachment.filePath;
        pdfLink = `[PDF](${pathToFileURL(attachment.filePath).toString()})`;
      }
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
      qualityLabel = await this.readDoclingQualityLabelFromPdf(pdfSourcePath);
      this.showStatusProgress(this.formatStatusLabel("Docling extraction...", qualityLabel), null);
      await this.runPython(
        doclingScript,
        this.buildDoclingArgs(pdfSourcePath, docId, chunkPath, notePath)
      );
      qualityLabel = await this.readDoclingQualityLabel(chunkPath);
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
    const adapter = this.app.vault.adapter;
    const historyPath = normalizePath(`${CACHE_ROOT}/chat.json`);
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
        createdAt: msg.createdAt || new Date().toISOString(),
      }));
  }

  async saveChatHistory(messages: ChatMessage[]): Promise<void> {
    await this.ensureFolder(CACHE_ROOT);
    const adapter = this.app.vault.adapter;
    const historyPath = normalizePath(`${CACHE_ROOT}/chat.json`);
    const payload = {
      version: 1,
      messages,
    };
    await adapter.write(historyPath, JSON.stringify(payload, null, 2));
  }

  async runRagQueryStreaming(
    query: string,
    onDelta: (delta: string) => void,
    onFinal: (payload: any) => void
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

    return this.runPythonStreaming(
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
  }

  public async resolveCitationDisplay(citation: ChatCitation): Promise<{
    label: string;
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
    const label = `${noteTitle} pages ${pages}`;
    const pageStart = citation.page_start ? String(citation.page_start) : "";
    const pdfPath = entry?.pdf_path || citation.source_pdf || "";
    const zoteroUrl = citation.doc_id
      ? this.buildZoteroDeepLink(citation.doc_id, entry?.attachment_key, pageStart)
      : undefined;
    return {
      label,
      notePath: notePath || undefined,
      pdfPath: pdfPath || undefined,
      zoteroUrl,
      pageStart: pageStart || undefined,
    };
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

  private async recreateMissingNotesFromCache(): Promise<void> {
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

  private async reindexRedisFromCache(): Promise<void> {
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

  private async readDoclingQualityLabelFromPdf(pdfPath: string): Promise<string | null> {
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
    const payload = await this.requestLocalApi(url, `Zotero children request failed for ${url}`);
    return JSON.parse(payload.toString("utf8"));
  }

  private async downloadZoteroPdf(attachmentKey: string): Promise<Buffer> {
    const url = this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${attachmentKey}/file`);
    const response = await this.requestLocalApiRaw(url);
    const redirected = await this.followFileRedirect(response);
    if (redirected) {
      return redirected;
    }
    if (response.statusCode >= 300) {
      throw new Error(`Request failed, status ${response.statusCode}`);
    }
    return response.body;
  }

  private buildZoteroUrl(pathname: string): string {
    const base = this.settings.zoteroBaseUrl.replace(/\/$/, "");
    return `${base}${pathname}`;
  }

  private requestLocalApiRaw(
    url: string
  ): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: Buffer }> {
    return new Promise((resolve, reject) => {
      const parsed = new URL(url);
      const lib = parsed.protocol === "https:" ? https : http;
      const request = lib.request(
        {
          method: "GET",
          hostname: parsed.hostname,
          port: parsed.port || undefined,
          path: `${parsed.pathname}${parsed.search}`,
          headers: {
            Accept: "*/*",
          },
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

  public async openNoteInMain(notePath: string): Promise<void> {
    const normalized = normalizePath(notePath);
    await this.app.workspace.openLinkText(normalized, "", "tab");
  }

  private async openPdfInMain(sourcePdf: string, pageStart?: string): Promise<boolean> {
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

  private buildZoteroDeepLink(docId: string, attachmentKey?: string, pageStart?: string): string {
    if (attachmentKey) {
      const page = pageStart ? `?page=${encodeURIComponent(pageStart)}` : "";
      return `zotero://open-pdf/library/items/${attachmentKey}${page}`;
    }
    return `zotero://select/library/items/${docId}`;
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
    const label = `${docId} pages ${pages}`;
    const sourcePdf = citation.source_pdf || "";
    if (sourcePdf) {
      const link = this.buildPdfLinkFromSourcePath(sourcePdf);
      if (link.startsWith("[[")) {
        const target = link.slice(2, -2);
        return `- [[${target}|${label}]]`;
      }
      const match = link.match(/^\[PDF\]\((.+)\)$/);
      if (match) {
        return `- [${label}](${match[1]})`;
      }
    }
    return `- ${label}`;
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

  private async getDocIndex(): Promise<Record<string, DocIndexEntry>> {
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
    let notePath = "";

    const existingEntry = await this.getDocIndexEntry(docId);
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
      qualityLabel = await this.readDoclingQualityLabelFromPdf(sourcePdf);
      this.showStatusProgress(this.formatStatusLabel("Docling extraction...", qualityLabel), null);
      await this.runPython(
        doclingScript,
        this.buildDoclingArgs(sourcePdf, docId, chunkPath, notePath)
      );
      qualityLabel = await this.readDoclingQualityLabel(chunkPath);
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

    const pdfLink = this.buildPdfLinkFromSourcePath(sourcePdf);

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
    notePath: string
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

    if (this.settings.ocrMode === "force_low_quality") {
      args.push("--force-ocr-low-quality");
    }
    args.push("--quality-threshold", String(this.settings.ocrQualityThreshold));
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

  async startRedisStack(silent?: boolean): Promise<void> {
    try {
      await this.ensureBundledTools();
      const composePath = this.getDockerComposePath();
      const dataDir = this.getRedisDataDir();
      await fs.mkdir(dataDir, { recursive: true });
      const dockerPath = this.settings.dockerPath?.trim() || "docker";
      try {
        await this.runCommand(dockerPath, ["compose", "-f", composePath, "down"], {
          cwd: path.dirname(composePath),
        });
      } catch (error) {
        console.warn("Redis Stack stop before restart failed", error);
      }
      await this.runCommand(
        dockerPath,
        ["compose", "-f", composePath, "up", "-d"],
        {
          cwd: path.dirname(composePath),
          env: { ...process.env, ZRR_DATA_DIR: dataDir },
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

  constructor(app: App, plugin: ZoteroRagPlugin, onSelect: (item: ZoteroLocalItem | null) => void) {
    super(app);
    this.plugin = plugin;
    this.resolveSelection = onSelect;
    this.setPlaceholder("Search Zotero items...");
  }

  async getSuggestions(query: string): Promise<ZoteroLocalItem[]> {
    try {
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
    el.createEl("div", { text: title });
    el.createEl("small", { text: year ? `${year}` : "" });
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

  private extractYear(item: ZoteroLocalItem): string {
    const parsed = item.meta?.parsedDate ?? item.data?.date ?? "";
    if (typeof parsed !== "string") {
      return "";
    }
    const match = parsed.match(/\b(\d{4})\b/);
    return match ? match[1] : "";
  }
}
