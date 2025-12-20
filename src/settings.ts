import { App, PluginSettingTab, Setting } from "obsidian";

export type OcrMode = "auto" | "force" | "off";
export type ChunkingMode = "page" | "section";

export interface ZoteroRagSettings {
  zoteroBaseUrl: string;
  zoteroUserId: string;
  zoteroApiKey: string;
  pythonPath: string;
  outputPdfDir: string;
  outputItemDir: string;
  outputNoteDir: string;
  outputChunkDir: string;
  redisUrl: string;
  redisIndex: string;
  redisPrefix: string;
  embedBaseUrl: string;
  embedApiKey: string;
  embedModel: string;
  chatBaseUrl: string;
  chatApiKey: string;
  chatModel: string;
  chatTemperature: number;
  ocrMode: OcrMode;
  chunkingMode: ChunkingMode;
}

export const DEFAULT_SETTINGS: ZoteroRagSettings = {
  zoteroBaseUrl: "http://127.0.0.1:23119/api",
  zoteroUserId: "",
  zoteroApiKey: "",
  pythonPath: "python3",
  outputPdfDir: "zotero/pdfs",
  outputItemDir: "zotero/items",
  outputNoteDir: "zotero/notes",
  outputChunkDir: "zotero/chunks",
  redisUrl: "redis://127.0.0.1:6379",
  redisIndex: "idx:zotero",
  redisPrefix: "zotero:chunk:",
  embedBaseUrl: "http://localhost:1234/v1",
  embedApiKey: "lm-studio",
  embedModel: "google/embedding-gemma-300m",
  chatBaseUrl: "",
  chatApiKey: "",
  chatModel: "meta-llama/llama-3.1-405b-instruct",
  chatTemperature: 0.2,
  ocrMode: "auto",
  chunkingMode: "page",
};

export class ZoteroRagSettingTab extends PluginSettingTab {
  private plugin: { settings: ZoteroRagSettings; saveSettings: () => Promise<void> };

  constructor(app: App, plugin: { settings: ZoteroRagSettings; saveSettings: () => Promise<void> }) {
    super(app, plugin as any);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Zotero RAG Settings" });

    new Setting(containerEl)
      .setName("Zotero base URL")
      .setDesc("Local Zotero API base URL, e.g. http://127.0.0.1:23119/api")
      .addText((text) =>
        text
          .setPlaceholder("http://127.0.0.1:23119/api")
          .setValue(this.plugin.settings.zoteroBaseUrl)
          .onChange(async (value) => {
            this.plugin.settings.zoteroBaseUrl = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Zotero user ID")
      .setDesc("Required for Zotero local API downloads")
      .addText((text) =>
        text
          .setPlaceholder("123456")
          .setValue(this.plugin.settings.zoteroUserId)
          .onChange(async (value) => {
            this.plugin.settings.zoteroUserId = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Zotero API key")
      .setDesc("Optional for local API")
      .addText((text) =>
        text
          .setPlaceholder("optional")
          .setValue(this.plugin.settings.zoteroApiKey)
          .onChange(async (value) => {
            this.plugin.settings.zoteroApiKey = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Python path")
      .setDesc("Path to python3")
      .addText((text) =>
        text
          .setPlaceholder("python3")
          .setValue(this.plugin.settings.pythonPath)
          .onChange(async (value) => {
            this.plugin.settings.pythonPath = value.trim() || "python3";
            await this.plugin.saveSettings();
          })
      );

    containerEl.createEl("h3", { text: "Output folders (vault-relative)" });

    new Setting(containerEl)
      .setName("PDF folder")
      .addText((text) =>
        text
          .setPlaceholder("zotero/pdfs")
          .setValue(this.plugin.settings.outputPdfDir)
          .onChange(async (value) => {
            this.plugin.settings.outputPdfDir = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Item JSON folder")
      .addText((text) =>
        text
          .setPlaceholder("zotero/items")
          .setValue(this.plugin.settings.outputItemDir)
          .onChange(async (value) => {
            this.plugin.settings.outputItemDir = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Notes folder")
      .addText((text) =>
        text
          .setPlaceholder("zotero/notes")
          .setValue(this.plugin.settings.outputNoteDir)
          .onChange(async (value) => {
            this.plugin.settings.outputNoteDir = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Chunks JSON folder")
      .addText((text) =>
        text
          .setPlaceholder("zotero/chunks")
          .setValue(this.plugin.settings.outputChunkDir)
          .onChange(async (value) => {
            this.plugin.settings.outputChunkDir = value.trim();
            await this.plugin.saveSettings();
          })
      );

    containerEl.createEl("h3", { text: "Redis Stack" });

    new Setting(containerEl)
      .setName("Redis URL")
      .addText((text) =>
        text
          .setPlaceholder("redis://127.0.0.1:6379")
          .setValue(this.plugin.settings.redisUrl)
          .onChange(async (value) => {
            this.plugin.settings.redisUrl = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Index name")
      .addText((text) =>
        text
          .setPlaceholder("idx:zotero")
          .setValue(this.plugin.settings.redisIndex)
          .onChange(async (value) => {
            this.plugin.settings.redisIndex = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Key prefix")
      .addText((text) =>
        text
          .setPlaceholder("zotero:chunk:")
          .setValue(this.plugin.settings.redisPrefix)
          .onChange(async (value) => {
            this.plugin.settings.redisPrefix = value.trim();
            await this.plugin.saveSettings();
          })
      );

    containerEl.createEl("h3", { text: "Embeddings (LM Studio)" });

    new Setting(containerEl)
      .setName("Embeddings base URL")
      .addText((text) =>
        text
          .setPlaceholder("http://localhost:1234/v1")
          .setValue(this.plugin.settings.embedBaseUrl)
          .onChange(async (value) => {
            this.plugin.settings.embedBaseUrl = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Embeddings API key")
      .addText((text) =>
        text
          .setPlaceholder("lm-studio")
          .setValue(this.plugin.settings.embedApiKey)
          .onChange(async (value) => {
            this.plugin.settings.embedApiKey = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Embeddings model")
      .addText((text) =>
        text
          .setPlaceholder("google/embedding-gemma-300m")
          .setValue(this.plugin.settings.embedModel)
          .onChange(async (value) => {
            this.plugin.settings.embedModel = value.trim();
            await this.plugin.saveSettings();
          })
      );

    containerEl.createEl("h3", { text: "Chat LLM" });

    new Setting(containerEl)
      .setName("Chat base URL")
      .setDesc("OpenAI-compatible chat endpoint base URL")
      .addText((text) =>
        text
          .setPlaceholder("http://localhost:1234/v1")
          .setValue(this.plugin.settings.chatBaseUrl)
          .onChange(async (value) => {
            this.plugin.settings.chatBaseUrl = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Chat API key")
      .addText((text) =>
        text
          .setPlaceholder("lm-studio")
          .setValue(this.plugin.settings.chatApiKey)
          .onChange(async (value) => {
            this.plugin.settings.chatApiKey = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Chat model")
      .addText((text) =>
        text
          .setPlaceholder("meta-llama/llama-3.1-405b-instruct")
          .setValue(this.plugin.settings.chatModel)
          .onChange(async (value) => {
            this.plugin.settings.chatModel = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Temperature")
      .addText((text) =>
        text
          .setPlaceholder("0.2")
          .setValue(String(this.plugin.settings.chatTemperature))
          .onChange(async (value) => {
            const parsed = Number.parseFloat(value);
            this.plugin.settings.chatTemperature = Number.isFinite(parsed) ? parsed : 0.2;
            await this.plugin.saveSettings();
          })
      );

    containerEl.createEl("h3", { text: "Docling" });

    new Setting(containerEl)
      .setName("OCR mode")
      .setDesc("auto, force, or off")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("auto", "auto")
          .addOption("force", "force")
          .addOption("off", "off")
          .setValue(this.plugin.settings.ocrMode)
          .onChange(async (value: string) => {
            this.plugin.settings.ocrMode = value as OcrMode;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Chunking")
      .setDesc("page or section")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("page", "page")
          .addOption("section", "section")
          .setValue(this.plugin.settings.chunkingMode)
          .onChange(async (value: string) => {
            this.plugin.settings.chunkingMode = value as ChunkingMode;
            await this.plugin.saveSettings();
          })
      );
  }
}
