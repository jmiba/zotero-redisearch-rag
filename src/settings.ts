import { App, PluginSettingTab, Setting } from "obsidian";

export type OcrMode = "auto" | "force_low_quality" | "force";
export type ChunkingMode = "page" | "section";

export const CACHE_ROOT = ".zotero-redisearch-rag";
export const ITEM_CACHE_DIR = `${CACHE_ROOT}/items`;
export const CHUNK_CACHE_DIR = `${CACHE_ROOT}/chunks`;

export interface ZoteroRagSettings {
  zoteroBaseUrl: string;
  zoteroUserId: string;
  webApiBaseUrl: string;
  webApiLibraryType: "user" | "group";
  webApiLibraryId: string;
  webApiKey: string;
  pythonPath: string;
  dockerPath: string;
  autoStartRedis: boolean;
  copyPdfToVault: boolean;
  frontmatterTemplate: string;
  outputPdfDir: string;
  outputNoteDir: string;
  chatOutputDir: string;
  chatPaneLocation: "right" | "main";
  redisUrl: string;
  autoAssignRedisPort: boolean;
  redisIndex: string;
  redisPrefix: string;
  embedBaseUrl: string;
  embedApiKey: string;
  embedModel: string;
  chatBaseUrl: string;
  chatApiKey: string;
  chatModel: string;
  chatTemperature: number;
  chatHistoryMessages: number;
  ocrMode: OcrMode;
  chunkingMode: ChunkingMode;
  maxChunkChars: number;
  chunkOverlapChars: number;
  removeImagePlaceholders: boolean;
  ocrQualityThreshold: number;
  enableLlmCleanup: boolean;
  llmCleanupBaseUrl: string;
  llmCleanupApiKey: string;
  llmCleanupModel: string;
  llmCleanupTemperature: number;
  llmCleanupMinQuality: number;
  llmCleanupMaxChars: number;
  enableFileLogging: boolean;
  logFilePath: string;
  createOcrLayeredPdf: boolean;
  preferVaultPdfForCitations: boolean;
}

export const DEFAULT_SETTINGS: ZoteroRagSettings = {
  zoteroBaseUrl: "http://127.0.0.1:23119/api",
  zoteroUserId: "0",
  webApiBaseUrl: "https://api.zotero.org",
  webApiLibraryType: "user",
  webApiLibraryId: "",
  webApiKey: "",
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
  chatOutputDir: "zotero/chats",
  chatPaneLocation: "right",
  redisUrl: "redis://127.0.0.1:6379",
  autoAssignRedisPort: true,
  redisIndex: "idx:zotero",
  redisPrefix: "zotero:chunk:",
  embedBaseUrl: "http://localhost:1234/v1",
  embedApiKey: "lm-studio",
  embedModel: "google/embedding-gemma-300m",
  chatBaseUrl: "http://127.0.0.1:1234/v1",
  chatApiKey: "",
  chatModel: "openai/gpt-oss-20b",
  chatTemperature: 0.2,
  chatHistoryMessages: 6,
  ocrMode: "auto",
  chunkingMode: "page",
  maxChunkChars: 4000,
  chunkOverlapChars: 250,
  removeImagePlaceholders: true,
  ocrQualityThreshold: 0.5,
  enableLlmCleanup: false,
  llmCleanupBaseUrl: "http://127.0.0.1:1234/v1",
  llmCleanupApiKey: "",
  llmCleanupModel: "openai/gpt-oss-20b",
  llmCleanupTemperature: 0.0,
  llmCleanupMinQuality: 0.35,
  llmCleanupMaxChars: 2000,
  enableFileLogging: false,
  logFilePath: `${CACHE_ROOT}/logs/docling_extract.log`,
  createOcrLayeredPdf: false,
  preferVaultPdfForCitations: false,
};

export class ZoteroRagSettingTab extends PluginSettingTab {
  private plugin: {
    settings: ZoteroRagSettings;
    saveSettings: () => Promise<void>;
    startRedisStack: (silent?: boolean) => Promise<void>;
    setupPythonEnv: () => Promise<void>;
    reindexRedisFromCache: () => Promise<void>;
    recreateMissingNotesFromCache: () => Promise<void>;
    deleteChatSession?: (sessionId: string) => Promise<void>;
    openLogFile?: () => Promise<void>;
    clearLogFile?: () => Promise<void>;
  };

  constructor(
    app: App,
    plugin: {
      settings: ZoteroRagSettings;
      saveSettings: () => Promise<void>;
      startRedisStack: (silent?: boolean) => Promise<void>;
      setupPythonEnv: () => Promise<void>;
      reindexRedisFromCache: () => Promise<void>;
      recreateMissingNotesFromCache: () => Promise<void>;
      openLogFile: () => Promise<void>;
      clearLogFile: () => Promise<void>;
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

    containerEl.createEl("h3", { text: "Zotero Web API (optional fallback)" });

    new Setting(containerEl)
      .setName("Web API base URL")
      .setDesc("Zotero Web API base URL for write fallback, e.g. https://api.zotero.org")
      .addText((text) =>
        text
          .setPlaceholder("https://api.zotero.org")
          .setValue(this.plugin.settings.webApiBaseUrl)
          .onChange(async (value) => {
            this.plugin.settings.webApiBaseUrl = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Web API library type")
      .setDesc("Library type for Web API writes.")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("user", "user")
          .addOption("group", "group")
          .setValue(this.plugin.settings.webApiLibraryType)
          .onChange(async (value) => {
            this.plugin.settings.webApiLibraryType = value as "user" | "group";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Web API library ID")
      .setDesc("Numeric Zotero user/group ID for Web API writes.")
      .addText((text) =>
        text
          .setPlaceholder("15218")
          .setValue(this.plugin.settings.webApiLibraryId)
          .onChange(async (value) => {
            this.plugin.settings.webApiLibraryId = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Web API key")
      .setDesc("Zotero API key for write fallback (from zotero.org).")
      .addText((text) =>
        text
          .setPlaceholder("your-api-key")
          .setValue(this.plugin.settings.webApiKey)
          .onChange(async (value) => {
            this.plugin.settings.webApiKey = value.trim();
            await this.plugin.saveSettings();
          })
      );

    containerEl.createEl("h3", { text: "Prerequisites" });

    new Setting(containerEl)
      .setName("Python environment")
      .setDesc("Create or update the plugin's Python env (.venv in the plugin folder).")
      .addButton((button) => {
        button.setButtonText("Create/Update").setCta();
        button.onClick(async () => {
          button.setDisabled(true);
          try {
            await this.plugin.setupPythonEnv();
          } finally {
            button.setDisabled(false);
          }
        });
      });

    new Setting(containerEl)
      .setName("Docker/Podman path")
      .setDesc("CLI path for Docker or Podman (used to start Redis Stack).")
      .addText((text) =>
        text
          .setPlaceholder("docker")
          .setValue(this.plugin.settings.dockerPath)
          .onChange(async (value) => {
            this.plugin.settings.dockerPath = value.trim() || "docker";
            await this.plugin.saveSettings();
          })
      );

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
      .setName("Auto-assign Redis port")
      .setDesc("When starting Redis Stack, pick a free local port and update the Redis URL.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.autoAssignRedisPort).onChange(async (value) => {
          this.plugin.settings.autoAssignRedisPort = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Auto-start Redis Stack (Docker/Podman Compose)")
      .setDesc("Requires Docker Desktop running and your vault path shared with Docker.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.autoStartRedis).onChange(async (value) => {
          this.plugin.settings.autoStartRedis = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Start Redis Stack now")
      .setDesc("Restarts Docker/Podman Compose with the vault data directory.")
      .addButton((button) =>
        button.setButtonText("Start").onClick(async () => {
          await this.plugin.startRedisStack();
        })
      );

    new Setting(containerEl)
      .setName("Copy PDFs into vault")
      .setDesc(
        "Disable to use Zotero storage paths directly. If a local file path is unavailable, the plugin temporarily copies the PDF into the vault for processing."
      )
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.copyPdfToVault).onChange(async (value) => {
          this.plugin.settings.copyPdfToVault = value;
          if (!value && this.plugin.settings.createOcrLayeredPdf) {
            this.plugin.settings.createOcrLayeredPdf = false;
          }
          await this.plugin.saveSettings();
          this.display();
        })
      );

    new Setting(containerEl)
      .setName("Create OCR-layered PDF copy")
      .setDesc(
        "When OCR is used, replace the vault PDF with a Tesseract text layer (requires Copy PDFs into vault)."
      )
      .addToggle((toggle) => {
        const enabled = this.plugin.settings.copyPdfToVault;
        toggle
          .setValue(enabled ? this.plugin.settings.createOcrLayeredPdf : false)
          .setDisabled(!enabled)
          .onChange(async (value) => {
            if (!this.plugin.settings.copyPdfToVault) {
              this.plugin.settings.createOcrLayeredPdf = false;
              await this.plugin.saveSettings();
              return;
            }
            this.plugin.settings.createOcrLayeredPdf = value;
            await this.plugin.saveSettings();
          });
      });

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

    new Setting(containerEl)
      .setName("Saved chats folder")
      .setDesc("Where exported chat notes are stored (vault-relative).")
      .addText((text) =>
        text
          .setPlaceholder("zotero/chats")
          .setValue(this.plugin.settings.chatOutputDir)
          .onChange(async (value) => {
            this.plugin.settings.chatOutputDir = value.trim() || "zotero/chats";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Prefer vault PDF for citations")
      .setDesc("Use vault PDFs for citation links when available instead of Zotero deep links.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.preferVaultPdfForCitations).onChange(async (value) => {
          this.plugin.settings.preferVaultPdfForCitations = value;
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

    new Setting(containerEl)
      .setName("Chat history messages")
      .setDesc("Number of recent messages to include for conversational continuity (0 disables).")
      .addText((text) =>
        text
          .setPlaceholder("6")
          .setValue(String(this.plugin.settings.chatHistoryMessages))
          .onChange(async (value) => {
            const parsed = Number.parseInt(value, 10);
            this.plugin.settings.chatHistoryMessages = Number.isFinite(parsed) ? Math.max(0, parsed) : 6;
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

    new Setting(containerEl)
      .setName("Section chunk max chars")
      .setDesc("Split large section chunks into smaller pieces (section mode only).")
      .addText((text) =>
        text
          .setPlaceholder("3000")
          .setValue(String(this.plugin.settings.maxChunkChars))
          .onChange(async (value) => {
            const parsed = Number.parseInt(value, 10);
            this.plugin.settings.maxChunkChars = Number.isFinite(parsed) ? parsed : 3000;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Section chunk overlap chars")
      .setDesc("Number of characters to overlap when splitting section chunks.")
      .addText((text) =>
        text
          .setPlaceholder("250")
          .setValue(String(this.plugin.settings.chunkOverlapChars))
          .onChange(async (value) => {
            const parsed = Number.parseInt(value, 10);
            this.plugin.settings.chunkOverlapChars = Number.isFinite(parsed) ? parsed : 250;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Remove image placeholders")
      .setDesc("Strip '<!-- image -->' tags before chunking.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.removeImagePlaceholders).onChange(async (value) => {
          this.plugin.settings.removeImagePlaceholders = value;
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
      .addSlider((slider) =>
        slider
          .setLimits(0, 1, 0.05)
          .setValue(this.plugin.settings.llmCleanupMinQuality)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.llmCleanupMinQuality = value;
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

    containerEl.createEl("h3", { text: "Logging" });

    new Setting(containerEl)
      .setName("Enable logging to file")
      .setDesc("Write Docling/Python logs to a file during extraction.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enableFileLogging).onChange(async (value) => {
          this.plugin.settings.enableFileLogging = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Log file path (vault-relative)")
      .setDesc("Where to write logs. Keep inside the vault.")
      .addText((text) =>
        text
          .setPlaceholder(`${CACHE_ROOT}/logs/docling_extract.log`)
          .setValue(this.plugin.settings.logFilePath)
          .onChange(async (value) => {
            this.plugin.settings.logFilePath = value.trim() || `${CACHE_ROOT}/logs/docling_extract.log`;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("View or clear log")
      .setDesc("Open the log contents or clear the file.")
      .addButton((button) =>
        button.setButtonText("Open log").onClick(async () => {
          await this.plugin.openLogFile?.();
        })
      )
      .addButton((button) =>
        button.setButtonText("Clear log").onClick(async () => {
          await this.plugin.clearLogFile?.();
        })
      );

    containerEl.createEl("h3", { text: "Maintenance" });

    new Setting(containerEl)
      .setName("Reindex Redis from cached chunks")
      .setDesc("Rebuild the Redis index from cached chunk JSON files.")
      .addButton((button) =>
        button.setButtonText("Reindex").onClick(async () => {
          await this.plugin.reindexRedisFromCache();
        })
      );

    new Setting(containerEl)
      .setName("Recreate missing notes from cache")
      .setDesc("Rebuild missing notes using cached Zotero items and chunks.")
      .addButton((button) =>
        button.setButtonText("Recreate").onClick(async () => {
          await this.plugin.recreateMissingNotesFromCache();
        })
      );
  }
}
