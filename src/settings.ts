import { App, PluginSettingTab, Setting } from "obsidian";

export type OcrMode = "auto" | "force_low_quality" | "force";
export type ChunkingMode = "page" | "section";

export const CACHE_ROOT = ".zotero-redisearch-rag";
export const ITEM_CACHE_DIR = `${CACHE_ROOT}/items`;
export const CHUNK_CACHE_DIR = `${CACHE_ROOT}/chunks`;

export interface ZoteroRagSettings {
  zoteroBaseUrl: string;
  zoteroUserId: string;
  pythonPath: string;
  dockerPath: string;
  autoStartRedis: boolean;
  copyPdfToVault: boolean;
  frontmatterTemplate: string;
  outputPdfDir: string;
  outputNoteDir: string;
  chatPaneLocation: "right" | "main";
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
  ocrQualityThreshold: number;
  enableLlmCleanup: boolean;
  llmCleanupBaseUrl: string;
  llmCleanupApiKey: string;
  llmCleanupModel: string;
  llmCleanupTemperature: number;
  llmCleanupMinQuality: number;
  llmCleanupMaxChars: number;
}

export const DEFAULT_SETTINGS: ZoteroRagSettings = {
  zoteroBaseUrl: "http://127.0.0.1:23119/api",
  zoteroUserId: "0",
  pythonPath: "python3",
  dockerPath: "docker",
  autoStartRedis: false,
  copyPdfToVault: true,
  frontmatterTemplate:
    "doc_id: {{doc_id}}\n" +
    "zotero_key: {{zotero_key}}\n" +
    "title: {{title_yaml}}\n" +
    "year: {{year}}\n" +
    "authors:\n{{authors_yaml}}\n" +
    "item_type: {{item_type}}\n" +
    "pdf_link: {{pdf_link}}\n" +
    "item_json: {{item_json}}",
  outputPdfDir: "zotero/pdfs",
  outputNoteDir: "zotero/notes",
  chatPaneLocation: "right",
  redisUrl: "redis://127.0.0.1:6379",
  redisIndex: "idx:zotero",
  redisPrefix: "zotero:chunk:",
  embedBaseUrl: "http://localhost:1234/v1",
  embedApiKey: "lm-studio",
  embedModel: "google/embedding-gemma-300m",
  chatBaseUrl: "http://127.0.0.1:1234/v1",
  chatApiKey: "",
  chatModel: "openai/gpt-oss-20b",
  chatTemperature: 0.2,
  ocrMode: "auto",
  chunkingMode: "page",
  ocrQualityThreshold: 0.5,
  enableLlmCleanup: false,
  llmCleanupBaseUrl: "http://127.0.0.1:1234/v1",
  llmCleanupApiKey: "",
  llmCleanupModel: "openai/gpt-oss-20b",
  llmCleanupTemperature: 0.0,
  llmCleanupMinQuality: 0.35,
  llmCleanupMaxChars: 2000,
};

export class ZoteroRagSettingTab extends PluginSettingTab {
  private plugin: {
    settings: ZoteroRagSettings;
    saveSettings: () => Promise<void>;
    startRedisStack: (silent?: boolean) => Promise<void>;
  };

  constructor(
    app: App,
    plugin: {
      settings: ZoteroRagSettings;
      saveSettings: () => Promise<void>;
      startRedisStack: (silent?: boolean) => Promise<void>;
    }
  ) {
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
      .setDesc("Use 0 for local library. You can also enter users/<id> or groups/<id>.")
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

    new Setting(containerEl)
      .setName("Copy PDFs into vault")
      .setDesc("Disable to use Zotero storage paths directly.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.copyPdfToVault).onChange(async (value) => {
          this.plugin.settings.copyPdfToVault = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Frontmatter template")
      .setDesc(
        "Use {{doc_id}}, {{zotero_key}}, {{title}}, {{title_yaml}}, {{year}}, {{date}}, {{authors}}, {{authors_yaml}}, {{tags}}, {{item_type}}, {{pdf_link}}, {{item_json}}"
      )
      .addTextArea((text) => {
        text.inputEl.rows = 8;
        text
          .setValue(this.plugin.settings.frontmatterTemplate)
          .onChange(async (value) => {
            this.plugin.settings.frontmatterTemplate = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Docker path")
      .setDesc("CLI path for Docker (used to start Redis Stack).")
      .addText((text) =>
        text
          .setPlaceholder("docker")
          .setValue(this.plugin.settings.dockerPath)
          .onChange(async (value) => {
            this.plugin.settings.dockerPath = value.trim() || "docker";
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

    new Setting(containerEl)
      .setName("Auto-start Redis Stack (Docker Compose)")
      .setDesc("Requires Docker Desktop running and your vault path shared with Docker.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.autoStartRedis).onChange(async (value) => {
          this.plugin.settings.autoStartRedis = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Start Redis Stack now")
      .setDesc("Restarts Docker Compose with the vault data directory.")
      .addButton((button) =>
        button.setButtonText("Start").onClick(async () => {
          await this.plugin.startRedisStack();
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

    new Setting(containerEl)
      .setName("Chat panel location")
      .setDesc("Where to open the chat view by default.")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("right", "Right sidebar")
          .addOption("main", "Main window")
          .setValue(this.plugin.settings.chatPaneLocation)
          .onChange(async (value: string) => {
            this.plugin.settings.chatPaneLocation = value as "right" | "main";
            await this.plugin.saveSettings();
          })
      );

    containerEl.createEl("h3", { text: "Docling" });

    new Setting(containerEl)
      .setName("OCR mode")
      .setDesc("auto: skip OCR when text is readable; force if bad: OCR only when text looks poor; force: always OCR.")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("auto", "auto")
          .addOption("force_low_quality", "force if quality is bad")
          .addOption("force", "force")
          .setValue(this.plugin.settings.ocrMode)
          .onChange(async (value: string) => {
            this.plugin.settings.ocrMode = value as OcrMode;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Text quality threshold")
      .setDesc("Lower values are stricter; below this threshold the text is treated as low quality.")
      .addSlider((slider) => {
        slider
          .setLimits(0, 1, 0.05)
          .setValue(this.plugin.settings.ocrQualityThreshold)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.ocrQualityThreshold = value;
            await this.plugin.saveSettings();
          });
      });

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

    containerEl.createEl("h4", { text: "OCR cleanup (optional)" });

    new Setting(containerEl)
      .setName("LLM cleanup for low-quality chunks")
      .setDesc("Optional OpenAI-compatible cleanup for poor OCR. Can be slow/costly.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enableLlmCleanup).onChange(async (value) => {
          this.plugin.settings.enableLlmCleanup = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("LLM cleanup base URL")
      .setDesc("OpenAI-compatible endpoint, e.g. http://127.0.0.1:1234/v1")
      .addText((text) =>
        text
          .setPlaceholder("http://127.0.0.1:1234/v1")
          .setValue(this.plugin.settings.llmCleanupBaseUrl)
          .onChange(async (value) => {
            this.plugin.settings.llmCleanupBaseUrl = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("LLM cleanup API key")
      .setDesc("Optional API key for the cleanup endpoint.")
      .addText((text) =>
        text
          .setPlaceholder("sk-...")
          .setValue(this.plugin.settings.llmCleanupApiKey)
          .onChange(async (value) => {
            this.plugin.settings.llmCleanupApiKey = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("LLM cleanup model")
      .setDesc("Model to use for cleanup.")
      .addText((text) =>
        text
          .setPlaceholder("openai/gpt-oss-20b")
          .setValue(this.plugin.settings.llmCleanupModel)
          .onChange(async (value) => {
            this.plugin.settings.llmCleanupModel = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("LLM cleanup temperature")
      .setDesc("Lower is more conservative.")
      .addText((text) =>
        text
          .setPlaceholder("0.0")
          .setValue(String(this.plugin.settings.llmCleanupTemperature))
          .onChange(async (value) => {
            const parsed = Number.parseFloat(value);
            this.plugin.settings.llmCleanupTemperature = Number.isFinite(parsed) ? parsed : 0.0;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("LLM cleanup min quality")
      .setDesc("Only run cleanup when chunk quality is below this threshold (0-1).")
      .addText((text) =>
        text
          .setPlaceholder("0.35")
          .setValue(String(this.plugin.settings.llmCleanupMinQuality))
          .onChange(async (value) => {
            const parsed = Number.parseFloat(value);
            this.plugin.settings.llmCleanupMinQuality = Number.isFinite(parsed) ? parsed : 0.35;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("LLM cleanup max chars")
      .setDesc("Skip cleanup for chunks longer than this limit.")
      .addText((text) =>
        text
          .setPlaceholder("2000")
          .setValue(String(this.plugin.settings.llmCleanupMaxChars))
          .onChange(async (value) => {
            const parsed = Number.parseInt(value, 10);
            this.plugin.settings.llmCleanupMaxChars = Number.isFinite(parsed) ? parsed : 2000;
            await this.plugin.saveSettings();
          })
      );
  }
}
