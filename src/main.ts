import { App, FileSystemAdapter, Modal, Notice, Plugin, normalizePath, requestUrl } from "obsidian";
import { spawn } from "child_process";
import path from "path";
import { DEFAULT_SETTINGS, ZoteroRagSettingTab, ZoteroRagSettings } from "./settings";

type ZoteroItemValues = Record<string, any>;

type ZoteroBridgeApi = {
  search: () => Promise<any>;
};

type RequestUrlOptions = Parameters<typeof requestUrl>[0] & {
  responseType?: "arraybuffer";
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
    const zoteroApi = this.getZoteroBridgeApi();
    if (!zoteroApi) {
      new Notice("Zotero Bridge API not found. Ensure the Zotero Bridge plugin is installed.");
      return;
    }

    if (!this.settings.zoteroUserId) {
      new Notice("Zotero user ID is required in settings.");
      return;
    }

    let item: any;
    try {
      const searchResult = await zoteroApi.search();
      item = this.pickZoteroItem(searchResult);
    } catch (error) {
      new Notice("Zotero search failed. See console for details.");
      console.error(error);
      return;
    }

    if (!item) {
      new Notice("No Zotero item selected.");
      return;
    }

    let values: ZoteroItemValues;
    try {
      values = (await item.getValues?.()) ?? item;
    } catch (error) {
      new Notice("Failed to read Zotero item values.");
      console.error(error);
      return;
    }

    const docId = this.getDocId(values);
    if (!docId) {
      new Notice("Could not resolve a stable doc_id from Zotero item.");
      return;
    }

    const attachmentKey = await this.resolvePdfAttachmentKey(values, docId);
    if (!attachmentKey) {
      new Notice("No PDF attachment found for item.");
      return;
    }

    const pdfPath = normalizePath(`${this.settings.outputPdfDir}/${docId}.pdf`);
    const itemPath = normalizePath(`${this.settings.outputItemDir}/${docId}.json`);
    const chunkPath = normalizePath(`${this.settings.outputChunkDir}/${docId}.json`);
    const notePath = normalizePath(`${this.settings.outputNoteDir}/${docId}.md`);

    try {
      await this.ensureFolder(this.settings.outputPdfDir);
      await this.ensureFolder(this.settings.outputItemDir);
      await this.ensureFolder(this.settings.outputChunkDir);
      await this.ensureFolder(this.settings.outputNoteDir);
    } catch (error) {
      new Notice("Failed to create output folders.");
      console.error(error);
      return;
    }

    try {
      const pdfBytes = await this.downloadZoteroPdf(attachmentKey);
      await this.app.vault.adapter.writeBinary(pdfPath, pdfBytes);
    } catch (error) {
      new Notice("Failed to download PDF attachment.");
      console.error(error);
      return;
    }

    try {
      await this.app.vault.adapter.write(itemPath, JSON.stringify(values, null, 2));
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
        this.getAbsoluteVaultPath(pdfPath),
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
      const noteContent = this.buildNoteMarkdown(values, docId, pdfPath, itemPath, doclingMd);
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

  private getZoteroBridgeApi(): ZoteroBridgeApi | null {
    const api = (window as any)?.PluginApi?.ZoteroBridge?.v1?.();
    if (!api || typeof api.search !== "function") {
      return null;
    }
    return api;
  }

  private pickZoteroItem(searchResult: any): any {
    if (!searchResult) {
      return null;
    }
    if (Array.isArray(searchResult)) {
      return searchResult[0] ?? null;
    }
    if (searchResult.item) {
      return searchResult.item;
    }
    return searchResult;
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

  private async resolvePdfAttachmentKey(values: ZoteroItemValues, itemKey: string): Promise<string | null> {
    const fromValues = this.pickPdfAttachmentKey(values);
    if (fromValues) {
      return fromValues;
    }

    try {
      const children = await this.fetchZoteroChildren(itemKey);
      const child = children.find((entry) =>
        this.isPdfAttachment(entry?.data?.contentType ?? entry?.data?.mimeType)
      );
      if (child) {
        return child.key ?? child.data?.key ?? null;
      }
    } catch (error) {
      console.error("Failed to fetch Zotero children", error);
    }

    return null;
  }

  private pickPdfAttachmentKey(values: ZoteroItemValues): string | null {
    const attachments = values.attachments ?? values.children ?? values.items ?? [];
    if (!Array.isArray(attachments)) {
      return null;
    }
    for (const attachment of attachments) {
      const contentType = attachment.contentType ?? attachment.mimeType ?? attachment.data?.contentType;
      if (this.isPdfAttachment(contentType)) {
        return attachment.key ?? attachment.attachmentKey ?? attachment.data?.key ?? null;
      }
    }
    return null;
  }

  private isPdfAttachment(contentType?: string): boolean {
    return contentType === "application/pdf";
  }

  private async fetchZoteroChildren(itemKey: string): Promise<any[]> {
    const url = this.buildZoteroUrl(`/users/${this.settings.zoteroUserId}/items/${itemKey}/children`);
    const response = await requestUrl({
      url,
      method: "GET",
      headers: this.zoteroHeaders(),
    });
    return response.json ?? [];
  }

  private async downloadZoteroPdf(attachmentKey: string): Promise<ArrayBuffer> {
    const url = this.buildZoteroUrl(`/users/${this.settings.zoteroUserId}/items/${attachmentKey}/file`);
    const options: RequestUrlOptions = {
      url,
      method: "GET",
      headers: this.zoteroHeaders(),
      responseType: "arraybuffer",
    };
    const response = await requestUrl(options);
    return response.arrayBuffer;
  }

  private buildZoteroUrl(pathname: string): string {
    const base = this.settings.zoteroBaseUrl.replace(/\/$/, "");
    return `${base}${pathname}`;
  }

  private zoteroHeaders(): Record<string, string> {
    if (!this.settings.zoteroApiKey) {
      return {};
    }
    return { "Zotero-API-Key": this.settings.zoteroApiKey };
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
    pdfPath: string,
    itemPath: string,
    doclingMarkdown: string
  ): string {
    const title = typeof values.title === "string" ? values.title : "";
    const safeTitle = title.replace(/"/g, "'");
    const pdfLink = `[[${pdfPath}]]`;
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
