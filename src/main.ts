import { App, FileSystemAdapter, Modal, Notice, Plugin, SuggestModal, normalizePath } from "obsidian";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import http from "http";
import https from "https";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { DEFAULT_SETTINGS, ZoteroRagSettingTab, ZoteroRagSettings } from "./settings";

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

  constructor(app: App, titleText: string, placeholder: string, onSubmit: (value: string) => void) {
    super(app);
    this.titleText = titleText;
    this.placeholder = placeholder;
    this.onSubmit = onSubmit;
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
        new Notice("Query cannot be empty.");
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
    this.addSettingTab(new ZoteroRagSettingTab(this.app, this));

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
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private async importZoteroItem(): Promise<void> {
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

    const pdfPath = normalizePath(`${this.settings.outputPdfDir}/${docId}.pdf`);
    const itemPath = normalizePath(`${this.settings.outputItemDir}/${docId}.json`);
    const chunkPath = normalizePath(`${this.settings.outputChunkDir}/${docId}.json`);
    const notePath = normalizePath(`${this.settings.outputNoteDir}/${docId}.md`);

    try {
      await this.ensureFolder(this.settings.outputItemDir);
      await this.ensureFolder(this.settings.outputChunkDir);
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
      const noteContent = this.buildNoteMarkdown(values, docId, pdfLink, itemPath, doclingMd);
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
    }).open();
  }

  private async promptZoteroItem(): Promise<ZoteroLocalItem | null> {
    return new Promise((resolve) => {
      new ZoteroItemSuggestModal(this.app, this, resolve).open();
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

  async searchZoteroItems(query: string): Promise<ZoteroLocalItem[]> {
    const params = new URLSearchParams();
    params.set("itemType", "-attachment");
    params.set("limit", "25");
    params.set("include", "data,meta");
    if (query.trim()) {
      params.set("q", query.trim());
    }
    const url = this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items?${params.toString()}`);
    const payload = await this.requestLocalApi(url);
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
    const payload = await this.requestLocalApi(url);
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

  private async requestLocalApi(url: string): Promise<Buffer> {
    const response = await this.requestLocalApiRaw(url);
    if (response.statusCode >= 400) {
      throw new Error(`Request failed, status ${response.statusCode}: ${response.body.toString("utf8")}`);
    }
    if (response.statusCode >= 300) {
      throw new Error(`Request failed, status ${response.statusCode}`);
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
    docId: string,
    pdfLink: string,
    itemPath: string,
    doclingMarkdown: string
  ): string {
    const title = typeof values.title === "string" ? values.title : "";
    const safeTitle = title.replace(/"/g, "'");
    const jsonLink = `[[${itemPath}]]`;

    return `---\ndoc_id: "${docId}"\ntitle: "${safeTitle}"\n---\n\nPDF: ${pdfLink}\n\nItem JSON: ${jsonLink}\n\n${doclingMarkdown}`;
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
  private onSelect: (item: ZoteroLocalItem | null) => void;
  private didSelect = false;

  constructor(app: App, plugin: ZoteroRagPlugin, onSelect: (item: ZoteroLocalItem | null) => void) {
    super(app);
    this.plugin = plugin;
    this.onSelect = onSelect;
    this.setPlaceholder("Search Zotero items...");
  }

  async getSuggestions(query: string): Promise<ZoteroLocalItem[]> {
    try {
      return await this.plugin.searchZoteroItems(query);
    } catch (error) {
      console.error("Zotero search failed", error);
      return [];
    }
  }

  renderSuggestion(item: ZoteroLocalItem, el: HTMLElement): void {
    const title = item.data?.title ?? "[No title]";
    const year = this.extractYear(item);
    el.createEl("div", { text: title });
    el.createEl("small", { text: year ? `${year}` : "" });
  }

  onChooseSuggestion(item: ZoteroLocalItem, evt: MouseEvent | KeyboardEvent): void {
    this.didSelect = true;
    this.onSelect(item);
  }

  onClose(): void {
    if (!this.didSelect) {
      this.onSelect(null);
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
