import { App, FileSystemAdapter, Modal, Notice, Plugin, SuggestModal, normalizePath } from "obsidian";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import http from "http";
import https from "https";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import {
  CHUNK_CACHE_DIR,
  DEFAULT_SETTINGS,
  ITEM_CACHE_DIR,
  ZoteroRagSettingTab,
  ZoteroRagSettings,
} from "./settings";
import { TOOL_ASSETS } from "./toolAssets";

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

  async onload(): Promise<void> {
    await this.loadSettings();
    await this.migrateCachePaths();
    this.addSettingTab(new ZoteroRagSettingTab(this.app, this));

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
      id: "rebuild-zotero-note-cache",
      name: "Rebuild Zotero note from cache (Docling + RedisSearch)",
      callback: () => this.rebuildNoteFromCache(),
    });
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
          return;
        }
        pdfSourcePath = attachment.filePath;
        pdfLink = `[PDF](${pathToFileURL(attachment.filePath).toString()})`;
      }
    } catch (error) {
      new Notice("Failed to download PDF attachment.");
      console.error(error);
      return;
    }

    try {
      await this.app.vault.adapter.write(itemPath, JSON.stringify(item, null, 2));
    } catch (error) {
      new Notice("Failed to write Zotero item JSON.");
      console.error(error);
      return;
    }

    const pluginDir = this.getPluginDir();
    const doclingScript = path.join(pluginDir, "tools", "docling_extract.py");
    const indexScript = path.join(pluginDir, "tools", "index_redisearch.py");

    try {
      await this.runPython(doclingScript, [
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
        this.settings.ocrMode,
      ]);
    } catch (error) {
      new Notice("Docling extraction failed. See console for details.");
      console.error(error);
      return;
    }

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
      ]);
    } catch (error) {
      new Notice("RedisSearch indexing failed. See console for details.");
      console.error(error);
      return;
    }

    try {
      const doclingMd = await this.app.vault.adapter.read(notePath);
      const noteContent = this.buildNoteMarkdown(values, item.meta ?? {}, docId, pdfLink, itemPath, doclingMd);
      await this.app.vault.adapter.write(notePath, noteContent);
    } catch (error) {
      new Notice("Failed to finalize note markdown.");
      console.error(error);
      return;
    }

    new Notice(`Indexed Zotero item ${docId}.`);
  }

  private async askZoteroLibrary(): Promise<void> {
    if (!this.settings.chatBaseUrl) {
      new Notice("Chat base URL must be set in settings.");
      return;
    }

    try {
      await this.ensureBundledTools();
    } catch (error) {
      new Notice("Failed to sync bundled tools. See console for details.");
      console.error(error);
      return;
    }

    new TextPromptModal(this.app, "Ask Zotero Library", "Enter your query", async (query) => {
      const pluginDir = this.getPluginDir();
      const ragScript = path.join(pluginDir, "tools", "rag_query_redisearch.py");

      let stdout = "";
      try {
        const result = await this.runPythonWithOutput(ragScript, [
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
        ]);
        stdout = result;
      } catch (error) {
        new Notice("RAG query failed. See console for details.");
        console.error(error);
        return;
      }

      let response: any;
      try {
        response = JSON.parse(stdout);
      } catch (error) {
        new Notice("Failed to parse RAG response.");
        console.error(error);
        return;
      }

      const answer = response?.answer ?? "";
      const citations = response?.citations ?? [];
      const citationText = citations
        .map((c: any) => {
          const pages = c.pages ?? `${c.page_start ?? "?"}-${c.page_end ?? "?"}`;
          return `${c.doc_id ?? "?"} pages ${pages}`;
        })
        .join("\n");

      const body = `${answer}\n\nCitations:\n${citationText || "(none)"}`;
      new OutputModal(this.app, "Zotero RAG Answer", body).open();
    }, "Query cannot be empty.").open();
  }

  private async rebuildNoteFromCache(): Promise<void> {
    const docId = await this.promptDocId();
    if (!docId) {
      new Notice("No doc_id provided.");
      return;
    }

    try {
      await this.ensureBundledTools();
    } catch (error) {
      new Notice("Failed to sync bundled tools. See console for details.");
      console.error(error);
      return;
    }

    const adapter = this.app.vault.adapter;
    const itemPath = normalizePath(`${ITEM_CACHE_DIR}/${docId}.json`);
    const chunkPath = normalizePath(`${CHUNK_CACHE_DIR}/${docId}.json`);

    if (!(await adapter.exists(itemPath))) {
      new Notice("Cached item JSON not found.");
      return;
    }
    if (!(await adapter.exists(chunkPath))) {
      new Notice("Cached chunks JSON not found.");
      return;
    }

    let item: ZoteroLocalItem;
    try {
      const itemRaw = await adapter.read(itemPath);
      item = JSON.parse(itemRaw);
    } catch (error) {
      new Notice("Failed to read cached item JSON.");
      console.error(error);
      return;
    }

    let chunkPayload: Record<string, any>;
    try {
      const chunkRaw = await adapter.read(chunkPath);
      chunkPayload = JSON.parse(chunkRaw);
    } catch (error) {
      new Notice("Failed to read cached chunks JSON.");
      console.error(error);
      return;
    }

    const sourcePdf = typeof chunkPayload.source_pdf === "string" ? chunkPayload.source_pdf : "";
    if (!sourcePdf) {
      new Notice("Cached chunk JSON is missing source_pdf.");
      return;
    }

    try {
      await fs.access(sourcePdf);
    } catch (error) {
      new Notice("Cached source PDF path is not accessible.");
      console.error(error);
      return;
    }

    const values: ZoteroItemValues = item.data ?? item;
    const title = typeof values.title === "string" ? values.title : "";
    const baseName = this.sanitizeFileName(title) || docId;
    const baseNotePath = normalizePath(`${this.settings.outputNoteDir}/${baseName}.md`);
    const finalBaseName = (await adapter.exists(baseNotePath))
      ? baseName
      : await this.resolveUniqueBaseName(baseName, docId);
    const notePath = normalizePath(`${this.settings.outputNoteDir}/${finalBaseName}.md`);

    try {
      await this.ensureFolder(this.settings.outputNoteDir);
    } catch (error) {
      new Notice("Failed to create notes folder.");
      console.error(error);
      return;
    }

    const pluginDir = this.getPluginDir();
    const doclingScript = path.join(pluginDir, "tools", "docling_extract.py");
    const indexScript = path.join(pluginDir, "tools", "index_redisearch.py");

    try {
      await this.runPython(doclingScript, [
        "--pdf",
        sourcePdf,
        "--doc-id",
        docId,
        "--out-json",
        this.getAbsoluteVaultPath(chunkPath),
        "--out-md",
        this.getAbsoluteVaultPath(notePath),
        "--chunking",
        this.settings.chunkingMode,
        "--ocr",
        this.settings.ocrMode,
      ]);
    } catch (error) {
      new Notice("Docling extraction failed. See console for details.");
      console.error(error);
      return;
    }

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
      new Notice("RedisSearch indexing failed. See console for details.");
      console.error(error);
      return;
    }

    const pdfLink = this.buildPdfLinkFromSourcePath(sourcePdf);

    try {
      const doclingMd = await this.app.vault.adapter.read(notePath);
      const noteContent = this.buildNoteMarkdown(values, item.meta ?? {}, docId, pdfLink, itemPath, doclingMd);
      await this.app.vault.adapter.write(notePath, noteContent);
    } catch (error) {
      new Notice("Failed to finalize note markdown.");
      console.error(error);
      return;
    }

    new Notice(`Rebuilt Zotero note for ${docId}.`);
  }

  private async promptZoteroItem(): Promise<ZoteroLocalItem | null> {
    return new Promise((resolve) => {
      new ZoteroItemSuggestModal(this.app, this, resolve).open();
    });
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
    const dashed = normalized.replace(/ /g, "-");
    return dashed.slice(0, 120);
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

  private buildPdfLinkFromSourcePath(sourcePdf: string): string {
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
