import { App, DropdownComponent, PluginSettingTab, Setting, TextComponent } from "obsidian";

export type OcrMode = "auto" | "force_low_quality" | "force";
export type OcrEngine =
  | "auto"
  | "tesseract"
  | "paddle_structure_local"
  | "paddle_vl_local"
  | "paddle_structure_api"
  | "paddle_vl_api";
export type ChunkingMode = "page" | "section";

export type OcrEngineAvailability = {
  tesseract: boolean;
  paddleStructureLocal: boolean;
  paddleVlLocal: boolean;
};

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
  pythonEnvLocation: "shared" | "plugin";
  dockerPath: string;
  autoStartRedis: boolean;
  copyPdfToVault: boolean;
  frontmatterTemplate: string;
  noteBodyTemplate: string;
  llmProviderProfiles: LlmProviderProfile[];
  embedProviderProfileId: string;
  chatProviderProfileId: string;
  llmCleanupProviderProfileId: string;
  tagSanitizeMode: "none" | "camel" | "pascal" | "snake" | "kebab" | "replace";
  outputPdfDir: string;
  outputNoteDir: string;
  chatOutputDir: string;
  chatPaneLocation: "right" | "main";
  redisUrl: string;
  autoAssignRedisPort: boolean;
  redisDataDirOverride: string;
  redisProjectName: string;
  redisIndex: string;
  redisPrefix: string;
  embedBaseUrl: string;
  embedApiKey: string;
  embedModel: string;
  embedIncludeMetadata: boolean;
  embedSubchunkChars: number;
  embedSubchunkOverlap: number;
  embedContextWindow: number;
  embedContextChars: number;
  enableChunkTagging: boolean;
  chatBaseUrl: string;
  chatApiKey: string;
  chatModel: string;
  chatTemperature: number;
  chatHistoryMessages: number;
  enableQueryExpansion: boolean;
  queryExpansionCount: number;
  enableCrossEncoderRerank: boolean;
  rerankModel: string;
  rerankCandidateMultiplier: number;
  rrfK: number;
  rrfLogTop: number;
  maxChunksPerDoc: number;
  ocrMode: OcrMode;
  ocrEngine: OcrEngine;
  chunkingMode: ChunkingMode;
  ocrQualityThreshold: number;
  paddleApiKey: string;
  paddleVlApiUrl: string;
  paddleStructureApiUrl: string;
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
  preferObsidianNoteForCitations: boolean;
}

export type LlmProviderProfile = {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
};

type SettingsTabId = "prerequisites" | "zotero-import" | "ocr" | "llms" | "maintenance";

export const DEFAULT_SETTINGS: ZoteroRagSettings = {
  // Prerequisites
  pythonPath: "",
  pythonEnvLocation: "shared",
  dockerPath: "docker",
  redisUrl: "redis://127.0.0.1:6379",
  autoAssignRedisPort: false,
  redisDataDirOverride: "",
  redisProjectName: "",
  autoStartRedis: true,

  // Zotero Local API
  zoteroBaseUrl: "http://127.0.0.1:23119/api",
  zoteroUserId: "0",

  // Zotero Web API
  webApiBaseUrl: "https://api.zotero.org",
  webApiLibraryType: "user",
  webApiLibraryId: "",
  webApiKey: "",

  // Output
  outputPdfDir: "Zotero/PDFs",
  outputNoteDir: "Zotero/Notes",
  frontmatterTemplate:
    "doc_id: {{doc_id}}\n" +
    "zotero_key: {{zotero_key}}\n" +
    "zotero_link: {{item_link_yaml}}\n" +
    "citekey: {{citekey}}\n" +
    "title: {{title_yaml}}\n" +
    "year: {{year_number}}\n" +
    "authors:\n{{authors_yaml_list}}\n" +
    "editors:\n{{editors_yaml_list}}\n" +
    "aliases:\n{{aliases_yaml_list}}\n" +
    "tags:\n{{tags_yaml_list}}\n" +
    "collection_titles: {{collection_titles_yaml}}\n" +
    "collections:\n{{collections_yaml_list}}\n" +
    "item_type: {{item_type_yaml}}\n" +
    "short_title: {{short_title_yaml}}\n" +
    "creator_summary: {{creator_summary_yaml}}\n" +
    "publication_title: {{publication_title_yaml}}\n" +
    "book_title: {{book_title_yaml}}\n" +
    "journal_abbrev: {{journal_abbrev_yaml}}\n" +
    "publisher: {{publisher_yaml}}\n" +
    "volume: {{volume_yaml}}\n" +
    "issue: {{issue_yaml}}\n" +
    "pages: {{pages_yaml}}\n" +
    "doi: {{doi_yaml}}\n" +
    "isbn: {{isbn_yaml}}\n" +
    "issn: {{issn_yaml}}\n" +
    "place: {{place_yaml}}\n" +
    "url: {{url_yaml}}\n" +
    "language: {{language_yaml}}\n" +
    "abstract: {{abstract_yaml}}\n" +
    "pdf_link: {{pdf_link_yaml}}\n" +
    "item_json: {{item_json_yaml}}",
  tagSanitizeMode: "kebab",
  noteBodyTemplate: "{{pdf_block}}{{docling_markdown}}",

  // LLM Provider Profiles
  llmProviderProfiles: [
    {
      id: "lm-studio",
      name: "LM Studio",
      baseUrl: "http://localhost:1234/v1",
      apiKey: "lm-studio",
    },
    {
      id: "ollama",
      name: "Ollama",
      baseUrl: "http://localhost:11434/v1",
      apiKey: "",
    },
    {
      id: "openrouter",
      name: "OpenRouter",
      baseUrl: "https://openrouter.ai/api/v1",
      apiKey: "",
    },
    {
      id: "openai",
      name: "OpenAI",
      baseUrl: "https://api.openai.com/v1",
      apiKey: "",
    },
  ],

  // Saved chats
  chatOutputDir: "Zotero/Chats",

  // PDF handling
  copyPdfToVault: true,
  createOcrLayeredPdf: false,
  preferObsidianNoteForCitations: true,

  // Docling
  ocrMode: "auto",
  ocrQualityThreshold: 0.5,
  chunkingMode: "page",
  ocrEngine: "auto",
  paddleApiKey: "",
  paddleVlApiUrl: "",
  paddleStructureApiUrl: "",

  // OCR cleanup
  enableLlmCleanup: false,
  llmCleanupProviderProfileId: "lm-studio",
  llmCleanupBaseUrl: "http://127.0.0.1:1234/v1",
  llmCleanupApiKey: "",
  llmCleanupModel: "openai/gpt-oss-20b",
  llmCleanupTemperature: 0.0,
  llmCleanupMinQuality: 0.35,
  llmCleanupMaxChars: 2000,

  // Text Embedding
  embedProviderProfileId: "lm-studio",
  embedBaseUrl: "http://localhost:1234/v1",
  embedApiKey: "lm-studio",
  embedModel: "google/embedding-gemma-300m",
  embedIncludeMetadata: true,
  embedSubchunkChars: 3500,
  embedSubchunkOverlap: 200,
  embedContextWindow: 1,
  embedContextChars: 220,
  enableChunkTagging: false,

  // Chat LLM
  chatProviderProfileId: "lm-studio",
  chatBaseUrl: "http://127.0.0.1:1234/v1",
  chatApiKey: "",
  chatModel: "openai/gpt-oss-20b",
  chatTemperature: 0.2,
  chatHistoryMessages: 6,
  chatPaneLocation: "right",
  enableQueryExpansion: false,
  queryExpansionCount: 3,
  enableCrossEncoderRerank: false,
  rerankModel: "cross-encoder/ms-marco-MiniLM-L-6-v2",
  rerankCandidateMultiplier: 4,
  rrfK: 60,
  rrfLogTop: 0,
  maxChunksPerDoc: 0,

  // Logging
  enableFileLogging: false,
  logFilePath: `${CACHE_ROOT}/logs/docling_extract.log`,

  // Redis index (internal)
  redisIndex: "idx:zotero",
  redisPrefix: "zotero:chunk:",
};

export class ZoteroRagSettingTab extends PluginSettingTab {
  private plugin: {
    settings: ZoteroRagSettings;
    saveSettings: () => Promise<void>;
    fetchZoteroLibraryOptions: () => Promise<Array<{ value: string; label: string }>>;
    fetchEmbeddingModelOptions: () => Promise<Array<{ value: string; label: string }>>;
    fetchChatModelOptions: () => Promise<Array<{ value: string; label: string }>>;
    fetchCleanupModelOptions: () => Promise<Array<{ value: string; label: string }>>;
    detectOcrEngines?: () => Promise<OcrEngineAvailability>;
    startRedisStack: (silent?: boolean) => Promise<void>;
    setupPythonEnv: () => Promise<void>;
    reindexRedisFromCache: () => Promise<boolean>;
    recreateMissingNotesFromCache: () => Promise<void>;
    cancelRecreateMissingNotesFromCache: () => void;
    deleteChatSession?: (sessionId: string) => Promise<void>;
    openLogFile?: () => Promise<void>;
    clearLogFile?: () => Promise<void>;
  };
  private activeTab: SettingsTabId = "prerequisites";

  constructor(
    app: App,
    plugin: {
      settings: ZoteroRagSettings;
      saveSettings: () => Promise<void>;
      fetchZoteroLibraryOptions: () => Promise<Array<{ value: string; label: string }>>;
      fetchEmbeddingModelOptions: () => Promise<Array<{ value: string; label: string }>>;
      fetchChatModelOptions: () => Promise<Array<{ value: string; label: string }>>;
      fetchCleanupModelOptions: () => Promise<Array<{ value: string; label: string }>>;
      detectOcrEngines?: () => Promise<OcrEngineAvailability>;
      startRedisStack: (silent?: boolean) => Promise<void>;
      setupPythonEnv: () => Promise<void>;
      reindexRedisFromCache: () => Promise<boolean>;
      recreateMissingNotesFromCache: () => Promise<void>;
      cancelRecreateMissingNotesFromCache: () => void;
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

    const getProfiles = (): LlmProviderProfile[] =>
      Array.isArray(this.plugin.settings.llmProviderProfiles)
        ? this.plugin.settings.llmProviderProfiles
        : [];

    const saveProfiles = async (profiles: LlmProviderProfile[]) => {
      this.plugin.settings.llmProviderProfiles = profiles;
      await this.plugin.saveSettings();
    };

    const maskApiKeyInput = (text: TextComponent) => {
      text.inputEl.type = "password";
      text.inputEl.autocomplete = "off";
      text.inputEl.spellcheck = false;
    };

    const renderPrerequisites = (tabEl: HTMLElement) => {
      tabEl.createEl("h2", { text: "Prerequisites" });

      new Setting(tabEl)
        .setName("Python path")
        .setDesc(
          "Optional path to the Python interpreter used to create or run the plugin env. " +
            "Leave blank to auto-detect (python3.13/3.12/3.11/3.10/python3/python, or py on Windows)."
        )
        .addText((text) =>
          text
            .setPlaceholder("auto-detect")
            .setValue(this.plugin.settings.pythonPath)
            .onChange(async (value) => {
              this.plugin.settings.pythonPath = value.trim();
              await this.plugin.saveSettings();
            })
        );

      new Setting(tabEl)
        .setName("Python environment")
        .setDesc(
          "Create or update the plugin's Python env (location configured below)."
        )
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

      new Setting(tabEl)
        .setName("Python env location")
        .setDesc(
          "Shared user cache can be reused across vaults; plugin folder keeps a per-vault env."
        )
        .addDropdown((dropdown: DropdownComponent) => {
          dropdown.addOption("shared", "Shared user cache");
          dropdown.addOption("plugin", "Plugin folder (.venv)");
          dropdown
            .setValue(this.plugin.settings.pythonEnvLocation)
            .onChange(async (value) => {
              if (value !== "shared" && value !== "plugin") {
                return;
              }
              this.plugin.settings.pythonEnvLocation = value;
              await this.plugin.saveSettings();
            });
        });

      new Setting(tabEl)
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

      new Setting(tabEl)
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

      new Setting(tabEl)
        .setName("Redis data directory override")
        .setDesc(
          "Optional absolute path to store Redis persistence when auto-assign is off. " +
            "Env var ZRR_DATA_DIR overrides this setting."
        )
        .addText((text) =>
          text
            .setPlaceholder("/Users/you/Redis/zrr-data")
            .setValue(this.plugin.settings.redisDataDirOverride)
            .onChange(async (value) => {
              this.plugin.settings.redisDataDirOverride = value.trim();
              await this.plugin.saveSettings();
            })
        );

      new Setting(tabEl)
        .setName("Redis project name override")
        .setDesc(
          "Optional Docker/Podman Compose project name when auto-assign is off. " +
            "Env var ZRR_PROJECT_NAME overrides this setting."
        )
        .addText((text) =>
          text
            .setPlaceholder("zrr-shared")
            .setValue(this.plugin.settings.redisProjectName)
            .onChange(async (value) => {
              this.plugin.settings.redisProjectName = value.trim();
              await this.plugin.saveSettings();
            })
        );

      new Setting(tabEl)
        .setName("Auto-assign Redis port")
        .setDesc("When starting Redis stack, pick a free local port and update the Redis URL.")
        .addToggle((toggle) =>
          toggle.setValue(this.plugin.settings.autoAssignRedisPort).onChange(async (value) => {
            this.plugin.settings.autoAssignRedisPort = value;
            await this.plugin.saveSettings();
          })
        );

      new Setting(tabEl)
        .setName("Auto-start Redis stack (Docker/Podman Compose)")
        .setDesc(
          "Requires Docker Desktop running and your vault path shared with Docker. " +
            "Uses a vault-specific data dir at .obsidian/zotero-redisearch-rag/redis-data unless overridden."
        )
        .addToggle((toggle) =>
          toggle.setValue(this.plugin.settings.autoStartRedis).onChange(async (value) => {
            this.plugin.settings.autoStartRedis = value;
            await this.plugin.saveSettings();
          })
        );

      new Setting(tabEl)
        .setName("Start Redis stack now")
        .setDesc("Restarts Docker/Podman Compose with the vault data directory.")
        .addButton((button) =>
          button.setButtonText("Start").onClick(async () => {
            await this.plugin.startRedisStack();
          })
        );
    };

    const renderZoteroImport = (tabEl: HTMLElement) => {
      tabEl.createEl("h2", { text: "Zotero Local API" });

      new Setting(tabEl)
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

      const librarySetting = new Setting(tabEl)
        .setName("Zotero library")
        .setDesc("Select your local library or a Zotero group library.");

      let libraryDropdown: DropdownComponent | null = null;

      const applyLibraryOptions = (options: Array<{ value: string; label: string }>) => {
        if (!libraryDropdown) {
          return;
        }
        const current = (this.plugin.settings.zoteroUserId || "0").trim() || "0";
        const values = new Set(options.map((option) => option.value));
        if (!values.has(current)) {
          options = options.concat([{ value: current, label: `Custom (${current})` }]);
        }
        libraryDropdown.selectEl.options.length = 0;
        for (const option of options) {
          libraryDropdown.addOption(option.value, option.label);
        }
        libraryDropdown.setValue(current);
      };

      const refreshLibraries = async () => {
        if (!libraryDropdown) {
          return;
        }
        libraryDropdown.setDisabled(true);
        try {
          const options = await this.plugin.fetchZoteroLibraryOptions();
          applyLibraryOptions(options);
        } finally {
          libraryDropdown.setDisabled(false);
        }
      };

      librarySetting.addDropdown((dropdown) => {
        libraryDropdown = dropdown;
        const current = (this.plugin.settings.zoteroUserId || "0").trim() || "0";
        dropdown.addOption(current, "Loading...");
        dropdown.setValue(current);
        dropdown.onChange(async (value) => {
          this.plugin.settings.zoteroUserId = value.trim();
          await this.plugin.saveSettings();
        });
      });

      librarySetting.addButton((button) => {
        button.setButtonText("Refresh").onClick(async () => {
          await refreshLibraries();
        });
      });

      void refreshLibraries();

      tabEl.createEl("h2", { text: "Zotero Web API" });

      new Setting(tabEl)
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

      new Setting(tabEl)
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

      new Setting(tabEl)
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

      new Setting(tabEl)
        .setName("Web API key")
        .setDesc("Zotero API key for write fallback (from zotero.org).")
        .addText((text) => {
          maskApiKeyInput(text);
          text
            .setPlaceholder("your-api-key")
            .setValue(this.plugin.settings.webApiKey)
            .onChange(async (value) => {
              this.plugin.settings.webApiKey = value.trim();
              await this.plugin.saveSettings();
            });
        });

      tabEl.createEl("h2", { text: "Output" });

      new Setting(tabEl)
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

      new Setting(tabEl)
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

      new Setting(tabEl)
        .setName("Frontmatter template")
        .setDesc("Template for note YAML frontmatter. Use {{var}} placeholders; leave blank to omit.")
        .addTextArea((text) => {
          text
            .setValue(this.plugin.settings.frontmatterTemplate)
            .onChange(async (value) => {
              this.plugin.settings.frontmatterTemplate = value;
              await this.plugin.saveSettings();
            });
          text.inputEl.rows = 10;
          text.inputEl.style.width = "100%";
        });

      new Setting(tabEl)
        .setName("Tag sanitization")
        .setDesc("Normalize Zotero tags for Obsidian (no spaces, punctuation trimmed).")
        .addDropdown((dropdown) =>
          dropdown
            .addOption("none", "No change")
            .addOption("camel", "camelCase")
            .addOption("pascal", "PascalCase")
            .addOption("snake", "snake_case")
            .addOption("kebab", "kebab-case")
            .setValue(this.plugin.settings.tagSanitizeMode === "replace" ? "kebab" : this.plugin.settings.tagSanitizeMode)
            .onChange(async (value) => {
              this.plugin.settings.tagSanitizeMode = value as "none" | "camel" | "pascal" | "snake" | "kebab";
              await this.plugin.saveSettings();
            })
        );

      new Setting(tabEl)
        .setName("Note body template")
        .setDesc(
          "Template for the note body after frontmatter. Use {{pdf_block}} and {{docling_markdown}} placeholders."
        )
        .addTextArea((text) => {
          text
            .setValue(this.plugin.settings.noteBodyTemplate)
            .onChange(async (value) => {
              this.plugin.settings.noteBodyTemplate = value;
              await this.plugin.saveSettings();
            });
          text.inputEl.rows = 8;
          text.inputEl.style.width = "100%";
        });

      new Setting(tabEl)
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

      new Setting(tabEl)
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

      new Setting(tabEl)
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

      new Setting(tabEl)
        .setName("Prefer Obsidian note for citations")
        .setDesc("Link citations to the Obsidian note when available; otherwise use Zotero deep links.")
        .addToggle((toggle) =>
          toggle.setValue(this.plugin.settings.preferObsidianNoteForCitations).onChange(async (value) => {
            this.plugin.settings.preferObsidianNoteForCitations = value;
            await this.plugin.saveSettings();
          })
        );
    };

    const renderOcr = (tabEl: HTMLElement) => {
      tabEl.createEl("h2", { text: "Docling" });

      let ocrEngineDropdown: DropdownComponent | null = null;

      const applyOcrEngineOptions = (
        options: Array<{ value: OcrEngine; label: string }>
      ) => {
        if (!ocrEngineDropdown) {
          return;
        }
        const current = this.plugin.settings.ocrEngine;
        const values = new Set(options.map((option) => option.value));
        if (!values.has(current)) {
          options = options.concat([
            { value: current, label: `Current (unavailable): ${current}` },
          ]);
        }
        ocrEngineDropdown.selectEl.options.length = 0;
        for (const option of options) {
          ocrEngineDropdown.addOption(option.value, option.label);
        }
        ocrEngineDropdown.setValue(current);
      };

      const refreshOcrEngineOptions = async () => {
        if (!ocrEngineDropdown) {
          return;
        }
        ocrEngineDropdown.setDisabled(true);
        let availability: OcrEngineAvailability = {
          tesseract: false,
          paddleStructureLocal: false,
          paddleVlLocal: false,
        };
        if (this.plugin.detectOcrEngines) {
          try {
            availability = await this.plugin.detectOcrEngines();
          } catch {
            availability = {
              tesseract: false,
              paddleStructureLocal: false,
              paddleVlLocal: false,
            };
          }
        }
        const options: Array<{ value: OcrEngine; label: string }> = [
          { value: "auto", label: "Auto (default)" },
        ];
        if (availability.tesseract) {
          options.push({ value: "tesseract", label: "Tesseract (local)" });
        }
        if (availability.paddleStructureLocal) {
          options.push({ value: "paddle_structure_local", label: "Paddle PP-StructureV3 (local)" });
        }
        if (availability.paddleVlLocal) {
          options.push({ value: "paddle_vl_local", label: "PaddleOCR-VL (local)" });
        }
        const apiKey = (this.plugin.settings.paddleApiKey || "").trim();
        if (apiKey) {
          options.push({ value: "paddle_structure_api", label: "PP-StructureV3 API" });
          options.push({ value: "paddle_vl_api", label: "PaddleOCR-VL API" });
        }
        applyOcrEngineOptions(options);
        ocrEngineDropdown.setDisabled(false);
      };

      const paddleApiKeySetting = new Setting(tabEl)
        .setName("Paddle OCR API key")
        .setDesc("API token for PaddleOCR-VL / PP-StructureV3 endpoints. Get a free API key at ");
      const paddleApiLink = document.createElement("a");
      paddleApiLink.href = "https://aistudio.baidu.com/paddleocr";
      paddleApiLink.textContent = "https://aistudio.baidu.com/paddleocr";
      paddleApiLink.target = "_blank";
      paddleApiLink.rel = "noopener noreferrer";
      paddleApiKeySetting.descEl.appendChild(paddleApiLink);
      paddleApiKeySetting.descEl.append(".");
      paddleApiKeySetting
        .addText((text) => {
          maskApiKeyInput(text);
          text
            .setPlaceholder("your-api-token")
            .setValue(this.plugin.settings.paddleApiKey)
            .onChange(async (value) => {
              this.plugin.settings.paddleApiKey = value.trim();
              await this.plugin.saveSettings();
              await refreshOcrEngineOptions();
            });
        });

      new Setting(tabEl)
        .setName("PaddleOCR-VL API URL")
        .setDesc("Optional override for the PaddleOCR-VL API endpoint.")
        .addText((text) =>
          text
            .setPlaceholder("https://.../layout-parsing")
            .setValue(this.plugin.settings.paddleVlApiUrl)
            .onChange(async (value) => {
              this.plugin.settings.paddleVlApiUrl = value.trim();
              await this.plugin.saveSettings();
            })
        );

      new Setting(tabEl)
        .setName("PP-StructureV3 API URL")
        .setDesc("API endpoint for PP-StructureV3 (see Baidu AI Studio docs).")
        .addText((text) =>
          text
            .setPlaceholder("https://.../pp-structure")
            .setValue(this.plugin.settings.paddleStructureApiUrl)
            .onChange(async (value) => {
              this.plugin.settings.paddleStructureApiUrl = value.trim();
              await this.plugin.saveSettings();
              await refreshOcrEngineOptions();
            })
        );

      new Setting(tabEl)
        .setName("OCR engine")
        .setDesc("Select the OCR engine to use when OCR is required.")
        .addDropdown((dropdown) => {
          ocrEngineDropdown = dropdown;
          dropdown.addOption("auto", "Auto (default)");
          dropdown.setValue(this.plugin.settings.ocrEngine);
          dropdown.onChange(async (value: string) => {
            this.plugin.settings.ocrEngine = value as OcrEngine;
            await this.plugin.saveSettings();
          });
        });

      new Setting(tabEl)
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

      new Setting(tabEl)
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

      new Setting(tabEl)
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

      void refreshOcrEngineOptions();
    };

    const renderLlms = (tabEl: HTMLElement) => {
      tabEl.createEl("h2", { text: "LLM Provider Profiles" });

      const profilesContainer = tabEl.createDiv({ cls: "zrr-llm-profiles" });

      const renderProfiles = () => {
        profilesContainer.empty();
        const profiles = getProfiles();
        if (!profiles.length) {
          profilesContainer.createEl("p", { text: "No profiles yet. Add one below." });
        }
        for (const profile of profiles) {
          const details = profilesContainer.createEl("details", { cls: "zrr-profile" });
          if (profiles.length === 1) {
            details.open = true;
          }
          const summary = details.createEl("summary", {
            text: profile.name || profile.id || "Profile",
          });
          summary.addClass("zrr-profile-title");
          const body = details.createDiv({ cls: "zrr-profile-body" });

          new Setting(body)
            .setName("Profile name")
            .addText((text) =>
              text
                .setPlaceholder("My provider")
                .setValue(profile.name || "")
                .onChange(async (value) => {
                  profile.name = value.trim();
                  summary.textContent = profile.name || profile.id || "Profile";
                  await saveProfiles(getProfiles());
                })
            );

          new Setting(body)
            .setName("Base URL")
            .addText((text) =>
              text
                .setPlaceholder("http://localhost:1234/v1")
                .setValue(profile.baseUrl || "")
                .onChange(async (value) => {
                  profile.baseUrl = value.trim();
                  await saveProfiles(getProfiles());
                })
            );

          new Setting(body)
            .setName("API key")
            .setDesc("Stored in settings (not encrypted).")
            .addText((text) => {
              maskApiKeyInput(text);
              text
                .setPlaceholder("sk-...")
                .setValue(profile.apiKey || "")
                .onChange(async (value) => {
                  profile.apiKey = value.trim();
                  await saveProfiles(getProfiles());
                });
            });

          new Setting(body)
            .setName("Remove profile")
            .setDesc("Deletes this saved profile.")
            .addButton((button) =>
              button.setButtonText("Delete profile").onClick(async () => {
                const remaining = getProfiles().filter((p) => p.id !== profile.id);
                this.plugin.settings.embedProviderProfileId =
                  this.plugin.settings.embedProviderProfileId === profile.id ? "" : this.plugin.settings.embedProviderProfileId;
                this.plugin.settings.chatProviderProfileId =
                  this.plugin.settings.chatProviderProfileId === profile.id ? "" : this.plugin.settings.chatProviderProfileId;
                this.plugin.settings.llmCleanupProviderProfileId =
                  this.plugin.settings.llmCleanupProviderProfileId === profile.id ? "" : this.plugin.settings.llmCleanupProviderProfileId;
                await saveProfiles(remaining);
                renderProfiles();
              })
            );
        }

        new Setting(profilesContainer)
          .addButton((button) =>
            button.setButtonText("Add profile").onClick(async () => {
              const id = `profile-${Date.now().toString(36)}`;
              const profiles = getProfiles().concat([
                {
                  id,
                  name: "Custom",
                  baseUrl: "",
                  apiKey: "",
                },
              ]);
              await saveProfiles(profiles);
              renderProfiles();
            })
          );
      };

      renderProfiles();

      tabEl.createEl("h2", { text: "OCR cleanup" });

      new Setting(tabEl)
        .setName("LLM cleanup for low-quality chunks")
        .setDesc("Automatic AI cleanup for poor OCR at import. Can be slow/costly.")
        .addToggle((toggle) =>
          toggle.setValue(this.plugin.settings.enableLlmCleanup).onChange(async (value) => {
            this.plugin.settings.enableLlmCleanup = value;
            await this.plugin.saveSettings();
          })
        );

      let cleanupProfileDropdown: DropdownComponent | null = null;
      let cleanupBaseUrlInput: TextComponent | null = null;
      let cleanupApiKeyInput: TextComponent | null = null;
      let refreshCleanupModels: () => Promise<void> = async () => undefined;

      const applyCleanupBaseUrl = async (value: string, markCustom = true) => {
        const trimmed = value.trim();
        this.plugin.settings.llmCleanupBaseUrl = trimmed;
        if (markCustom) {
          this.plugin.settings.llmCleanupProviderProfileId = "";
          if (cleanupProfileDropdown) {
            cleanupProfileDropdown.setValue("custom");
          }
        }
        if (cleanupBaseUrlInput) {
          cleanupBaseUrlInput.setValue(trimmed);
        }
        await this.plugin.saveSettings();
      };

      const applyCleanupProfile = async (profileId: string) => {
        const profile = getProfiles().find((item) => item.id === profileId);
        this.plugin.settings.llmCleanupProviderProfileId = profileId;
        if (profile) {
          this.plugin.settings.llmCleanupBaseUrl = profile.baseUrl;
          this.plugin.settings.llmCleanupApiKey = profile.apiKey;
          cleanupBaseUrlInput?.setValue(profile.baseUrl);
          cleanupApiKeyInput?.setValue(profile.apiKey);
        }
        await this.plugin.saveSettings();
        await refreshCleanupModels();
      };

      new Setting(tabEl)
        .setName("LLM cleanup provider profile")
        .setDesc("Select a profile to populate base URL and API key.")
        .addDropdown((dropdown) => {
          cleanupProfileDropdown = dropdown;
          dropdown.addOption("custom", "Custom (manual)");
          for (const profile of getProfiles()) {
            dropdown.addOption(profile.id, profile.name || profile.id);
          }
          const current = this.plugin.settings.llmCleanupProviderProfileId;
          dropdown.setValue(current && getProfiles().some((p) => p.id === current) ? current : "custom");
          dropdown.onChange(async (value) => {
            if (value === "custom") {
              this.plugin.settings.llmCleanupProviderProfileId = "";
              await this.plugin.saveSettings();
              return;
            }
            await applyCleanupProfile(value);
          });
        });

      new Setting(tabEl)
        .setName("LLM cleanup base URL")
        .setDesc("OpenAI-compatible endpoint, e.g. http://127.0.0.1:1234/v1")
        .addText((text) => {
          cleanupBaseUrlInput = text;
          text
            .setPlaceholder("http://127.0.0.1:1234/v1")
            .setValue(this.plugin.settings.llmCleanupBaseUrl)
            .onChange(async (value) => {
              await applyCleanupBaseUrl(value);
            });
        });

      new Setting(tabEl)
        .setName("LLM cleanup API key")
        .setDesc("Optional API key for the cleanup endpoint.")
        .addText((text) => {
          cleanupApiKeyInput = text;
          maskApiKeyInput(text);
          text
            .setPlaceholder("sk-...")
            .setValue(this.plugin.settings.llmCleanupApiKey)
            .onChange(async (value) => {
              this.plugin.settings.llmCleanupApiKey = value.trim();
              this.plugin.settings.llmCleanupProviderProfileId = "";
              if (cleanupProfileDropdown) {
                cleanupProfileDropdown.setValue("custom");
              }
              await this.plugin.saveSettings();
            });
        });

      const cleanupModelSetting = new Setting(tabEl)
        .setName("LLM cleanup model")
        .setDesc("Select a cleanup-capable model from the provider.");

      let cleanupModelDropdown: DropdownComponent | null = null;

      const applyCleanupModelOptions = (options: Array<{ value: string; label: string }>) => {
        if (!cleanupModelDropdown) {
          return;
        }
        const current = (this.plugin.settings.llmCleanupModel || "").trim();
        const values = new Set(options.map((option) => option.value));
        if (current && !values.has(current)) {
          options = options.concat([{ value: current, label: `Custom (${current})` }]);
        }
        cleanupModelDropdown.selectEl.options.length = 0;
        for (const option of options) {
          cleanupModelDropdown.addOption(option.value, option.label);
        }
        if (current) {
          cleanupModelDropdown.setValue(current);
        }
      };

      refreshCleanupModels = async () => {
        if (!cleanupModelDropdown) {
          return;
        }
        cleanupModelDropdown.setDisabled(true);
        try {
          const options = await this.plugin.fetchCleanupModelOptions();
          applyCleanupModelOptions(options);
        } finally {
          cleanupModelDropdown.setDisabled(false);
        }
      };

      cleanupModelSetting.addDropdown((dropdown) => {
        cleanupModelDropdown = dropdown;
        const current = (this.plugin.settings.llmCleanupModel || "").trim();
        dropdown.addOption(current || "loading", "Loading...");
        dropdown.setValue(current || "loading");
        dropdown.onChange(async (value) => {
          this.plugin.settings.llmCleanupModel = value.trim();
          await this.plugin.saveSettings();
        });
      });

      cleanupModelSetting.addButton((button) => {
        button.setButtonText("Refresh").onClick(async () => {
          await refreshCleanupModels();
        });
      });

      void refreshCleanupModels();

      new Setting(tabEl)
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

      new Setting(tabEl)
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

      new Setting(tabEl)
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

      tabEl.createEl("h2", { text: "Text Embedding" });

      let embedProfileDropdown: DropdownComponent | null = null;
      let embedBaseUrlInput: TextComponent | null = null;
      let embedApiKeyInput: TextComponent | null = null;
      let refreshEmbeddingModels: () => Promise<void> = async () => undefined;

      const applyEmbedBaseUrl = async (value: string, markCustom = true) => {
        const trimmed = value.trim();
        this.plugin.settings.embedBaseUrl = trimmed;
        if (markCustom) {
          this.plugin.settings.embedProviderProfileId = "";
          if (embedProfileDropdown) {
            embedProfileDropdown.setValue("custom");
          }
        }
        if (embedBaseUrlInput) {
          embedBaseUrlInput.setValue(trimmed);
        }
        await this.plugin.saveSettings();
      };

      const applyEmbedProfile = async (profileId: string) => {
        const profile = getProfiles().find((item) => item.id === profileId);
        this.plugin.settings.embedProviderProfileId = profileId;
        if (profile) {
          this.plugin.settings.embedBaseUrl = profile.baseUrl;
          this.plugin.settings.embedApiKey = profile.apiKey;
          embedBaseUrlInput?.setValue(profile.baseUrl);
          embedApiKeyInput?.setValue(profile.apiKey);
        }
        await this.plugin.saveSettings();
        await refreshEmbeddingModels();
      };

      new Setting(tabEl)
        .setName("Embeddings provider profile")
        .setDesc("Select a profile to populate base URL and API key.")
        .addDropdown((dropdown) => {
          embedProfileDropdown = dropdown;
          dropdown.addOption("custom", "Custom (manual)");
          for (const profile of getProfiles()) {
            dropdown.addOption(profile.id, profile.name || profile.id);
          }
          const current = this.plugin.settings.embedProviderProfileId;
          dropdown.setValue(current && getProfiles().some((p) => p.id === current) ? current : "custom");
          dropdown.onChange(async (value) => {
            if (value === "custom") {
              this.plugin.settings.embedProviderProfileId = "";
              await this.plugin.saveSettings();
              return;
            }
            await applyEmbedProfile(value);
          });
        });

      new Setting(tabEl)
        .setName("Embeddings base URL")
        .addText((text) => {
          embedBaseUrlInput = text;
          text
            .setPlaceholder("http://localhost:1234/v1")
            .setValue(this.plugin.settings.embedBaseUrl)
            .onChange(async (value) => {
              await applyEmbedBaseUrl(value);
            });
        });

      new Setting(tabEl)
        .setName("Embeddings API key")
        .addText((text) => {
          embedApiKeyInput = text;
          maskApiKeyInput(text);
          text
            .setPlaceholder("lm-studio")
            .setValue(this.plugin.settings.embedApiKey)
            .onChange(async (value) => {
              this.plugin.settings.embedApiKey = value.trim();
              this.plugin.settings.embedProviderProfileId = "";
              if (embedProfileDropdown) {
                embedProfileDropdown.setValue("custom");
              }
              await this.plugin.saveSettings();
            });
        });

      const embeddingModelSetting = new Setting(tabEl)
        .setName("Embeddings model")
        .setDesc("Select an embeddings model from the provider.");

      let embeddingDropdown: DropdownComponent | null = null;

      const applyEmbeddingOptions = (options: Array<{ value: string; label: string }>) => {
        if (!embeddingDropdown) {
          return;
        }
        const current = (this.plugin.settings.embedModel || "").trim();
        const values = new Set(options.map((option) => option.value));
        if (current && !values.has(current)) {
          options = options.concat([{ value: current, label: `Custom (${current})` }]);
        }
        embeddingDropdown.selectEl.options.length = 0;
        for (const option of options) {
          embeddingDropdown.addOption(option.value, option.label);
        }
        if (current) {
          embeddingDropdown.setValue(current);
        }
      };

      refreshEmbeddingModels = async () => {
        if (!embeddingDropdown) {
          return;
        }
        embeddingDropdown.setDisabled(true);
        try {
          const options = await this.plugin.fetchEmbeddingModelOptions();
          applyEmbeddingOptions(options);
        } finally {
          embeddingDropdown.setDisabled(false);
        }
      };

      embeddingModelSetting.addDropdown((dropdown) => {
        embeddingDropdown = dropdown;
        const current = (this.plugin.settings.embedModel || "").trim();
        dropdown.addOption(current || "loading", "Loading...");
        dropdown.setValue(current || "loading");
        dropdown.onChange(async (value) => {
          this.plugin.settings.embedModel = value.trim();
          await this.plugin.saveSettings();
        });
      });

      embeddingModelSetting.addButton((button) => {
        button.setButtonText("Refresh").onClick(async () => {
          await refreshEmbeddingModels();
        });
      });

      void refreshEmbeddingModels();

      new Setting(tabEl)
        .setName("Include metadata in embeddings")
        .setDesc("Prepend title/authors/tags/section info before embedding chunks.")
        .addToggle((toggle) =>
          toggle.setValue(this.plugin.settings.embedIncludeMetadata).onChange(async (value) => {
            this.plugin.settings.embedIncludeMetadata = value;
            await this.plugin.saveSettings();
          })
        );

      new Setting(tabEl)
        .setName("Embedding context window (chunks)")
        .setDesc("Include neighboring chunk text around each chunk when embedding (0 disables).")
        .addText((text) =>
          text
            .setPlaceholder("1")
            .setValue(String(this.plugin.settings.embedContextWindow))
            .onChange(async (value) => {
              const parsed = Number.parseInt(value, 10);
              this.plugin.settings.embedContextWindow = Number.isFinite(parsed) ? Math.max(0, parsed) : 1;
              await this.plugin.saveSettings();
            })
        );

      new Setting(tabEl)
        .setName("Embedding context snippet size (chars)")
        .setDesc("Max chars per neighboring chunk included in embeddings.")
        .addText((text) =>
          text
            .setPlaceholder("220")
            .setValue(String(this.plugin.settings.embedContextChars))
            .onChange(async (value) => {
              const parsed = Number.parseInt(value, 10);
              this.plugin.settings.embedContextChars = Number.isFinite(parsed) ? Math.max(0, parsed) : 220;
              await this.plugin.saveSettings();
            })
        );

      new Setting(tabEl)
        .setName("Embedding subchunk size (chars)")
        .setDesc("Split long chunks into smaller subchunks for embedding only (0 disables).")
        .addText((text) =>
          text
            .setPlaceholder("1800")
            .setValue(String(this.plugin.settings.embedSubchunkChars))
            .onChange(async (value) => {
              const parsed = Number.parseInt(value, 10);
              this.plugin.settings.embedSubchunkChars = Number.isFinite(parsed) ? Math.max(0, parsed) : 3500;
              await this.plugin.saveSettings();
            })
        );

      new Setting(tabEl)
        .setName("Embedding subchunk overlap (chars)")
        .setDesc("Overlap between embedding subchunks to keep context intact.")
        .addText((text) =>
          text
            .setPlaceholder("200")
            .setValue(String(this.plugin.settings.embedSubchunkOverlap))
            .onChange(async (value) => {
              const parsed = Number.parseInt(value, 10);
              this.plugin.settings.embedSubchunkOverlap = Number.isFinite(parsed) ? Math.max(0, parsed) : 200;
              await this.plugin.saveSettings();
            })
        );

      new Setting(tabEl)
        .setName("Generate LLM tags for chunks")
        .setDesc("Use the OCR cleanup model to tag chunks before indexing.")
        .addToggle((toggle) =>
          toggle.setValue(this.plugin.settings.enableChunkTagging).onChange(async (value) => {
            this.plugin.settings.enableChunkTagging = value;
            await this.plugin.saveSettings();
          })
        );

      tabEl.createEl("h2", { text: "Chat LLM" });

      let chatProfileDropdown: DropdownComponent | null = null;
      let chatBaseUrlInput: TextComponent | null = null;
      let chatApiKeyInput: TextComponent | null = null;
      let refreshChatModels: () => Promise<void> = async () => undefined;

      const applyChatBaseUrl = async (value: string, markCustom = true) => {
        const trimmed = value.trim();
        this.plugin.settings.chatBaseUrl = trimmed;
        if (markCustom) {
          this.plugin.settings.chatProviderProfileId = "";
          if (chatProfileDropdown) {
            chatProfileDropdown.setValue("custom");
          }
        }
        if (chatBaseUrlInput) {
          chatBaseUrlInput.setValue(trimmed);
        }
        await this.plugin.saveSettings();
      };

      const applyChatProfile = async (profileId: string) => {
        const profile = getProfiles().find((item) => item.id === profileId);
        this.plugin.settings.chatProviderProfileId = profileId;
        if (profile) {
          this.plugin.settings.chatBaseUrl = profile.baseUrl;
          this.plugin.settings.chatApiKey = profile.apiKey;
          chatBaseUrlInput?.setValue(profile.baseUrl);
          chatApiKeyInput?.setValue(profile.apiKey);
        }
        await this.plugin.saveSettings();
        await refreshChatModels();
      };

      new Setting(tabEl)
        .setName("Chat provider profile")
        .setDesc("Select a profile to populate base URL and API key.")
        .addDropdown((dropdown) => {
          chatProfileDropdown = dropdown;
          dropdown.addOption("custom", "Custom (manual)");
          for (const profile of getProfiles()) {
            dropdown.addOption(profile.id, profile.name || profile.id);
          }
          const current = this.plugin.settings.chatProviderProfileId;
          dropdown.setValue(current && getProfiles().some((p) => p.id === current) ? current : "custom");
          dropdown.onChange(async (value) => {
            if (value === "custom") {
              this.plugin.settings.chatProviderProfileId = "";
              await this.plugin.saveSettings();
              return;
            }
            await applyChatProfile(value);
          });
        });

      new Setting(tabEl)
        .setName("Chat base URL")
        .setDesc("OpenAI-compatible base URL for chat requests.")
        .addText((text) => {
          chatBaseUrlInput = text;
          text
            .setPlaceholder("http://localhost:1234/v1")
            .setValue(this.plugin.settings.chatBaseUrl)
            .onChange(async (value) => {
              await applyChatBaseUrl(value);
            });
        });

      new Setting(tabEl)
        .setName("Chat API key")
        .addText((text) => {
          chatApiKeyInput = text;
          maskApiKeyInput(text);
          text
            .setPlaceholder("lm-studio")
            .setValue(this.plugin.settings.chatApiKey)
            .onChange(async (value) => {
              this.plugin.settings.chatApiKey = value.trim();
              this.plugin.settings.chatProviderProfileId = "";
              if (chatProfileDropdown) {
                chatProfileDropdown.setValue("custom");
              }
              await this.plugin.saveSettings();
            });
        });

      const chatModelSetting = new Setting(tabEl)
        .setName("Chat model")
        .setDesc("Select a chat-capable model from the provider.");

      let chatModelDropdown: DropdownComponent | null = null;

      const applyChatModelOptions = (options: Array<{ value: string; label: string }>) => {
        if (!chatModelDropdown) {
          return;
        }
        const current = (this.plugin.settings.chatModel || "").trim();
        const values = new Set(options.map((option) => option.value));
        if (current && !values.has(current)) {
          options = options.concat([{ value: current, label: `Custom (${current})` }]);
        }
        chatModelDropdown.selectEl.options.length = 0;
        for (const option of options) {
          chatModelDropdown.addOption(option.value, option.label);
        }
        if (current) {
          chatModelDropdown.setValue(current);
        }
      };

      refreshChatModels = async () => {
        if (!chatModelDropdown) {
          return;
        }
        chatModelDropdown.setDisabled(true);
        try {
          const options = await this.plugin.fetchChatModelOptions();
          applyChatModelOptions(options);
        } finally {
          chatModelDropdown.setDisabled(false);
        }
      };

      chatModelSetting.addDropdown((dropdown) => {
        chatModelDropdown = dropdown;
        const current = (this.plugin.settings.chatModel || "").trim();
        dropdown.addOption(current || "loading", "Loading...");
        dropdown.setValue(current || "loading");
        dropdown.onChange(async (value) => {
          this.plugin.settings.chatModel = value.trim();
          await this.plugin.saveSettings();
        });
      });

      chatModelSetting.addButton((button) => {
        button.setButtonText("Refresh").onClick(async () => {
          await refreshChatModels();
        });
      });

      void refreshChatModels();

      new Setting(tabEl)
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

      new Setting(tabEl)
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

      new Setting(tabEl)
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

      tabEl.createEl("h2", { text: "Retrieval" });

      new Setting(tabEl)
        .setName("Enable query expansion")
        .setDesc("Use the chat model to expand queries before retrieval.")
        .addToggle((toggle) =>
          toggle.setValue(this.plugin.settings.enableQueryExpansion).onChange(async (value) => {
            this.plugin.settings.enableQueryExpansion = value;
            await this.plugin.saveSettings();
          })
        );

      new Setting(tabEl)
        .setName("Query expansion count")
        .setDesc("Number of expansion variants to request.")
        .addText((text) =>
          text
            .setPlaceholder("3")
            .setValue(String(this.plugin.settings.queryExpansionCount))
            .onChange(async (value) => {
              const parsed = Number.parseInt(value, 10);
              this.plugin.settings.queryExpansionCount = Number.isFinite(parsed)
                ? Math.max(1, parsed)
                : 3;
              await this.plugin.saveSettings();
            })
        );

      new Setting(tabEl)
        .setName("Enable cross-encoder reranking")
        .setDesc(
          "Rerank candidates locally with sentence-transformers (downloads model on first use)."
        )
        .addToggle((toggle) =>
          toggle.setValue(this.plugin.settings.enableCrossEncoderRerank).onChange(async (value) => {
            this.plugin.settings.enableCrossEncoderRerank = value;
            await this.plugin.saveSettings();
          })
        );

      new Setting(tabEl)
        .setName("Cross-encoder model")
        .setDesc("Local reranker model name or path.")
        .addText((text) =>
          text
            .setPlaceholder("cross-encoder/ms-marco-MiniLM-L-6-v2")
            .setValue(this.plugin.settings.rerankModel)
            .onChange(async (value) => {
              this.plugin.settings.rerankModel = value.trim() || "cross-encoder/ms-marco-MiniLM-L-6-v2";
              await this.plugin.saveSettings();
            })
        );

      new Setting(tabEl)
        .setName("Rerank candidate multiplier")
        .setDesc("Retrieve k × N candidates before reranking.")
        .addText((text) =>
          text
            .setPlaceholder("4")
            .setValue(String(this.plugin.settings.rerankCandidateMultiplier))
            .onChange(async (value) => {
              const parsed = Number.parseInt(value, 10);
              this.plugin.settings.rerankCandidateMultiplier = Number.isFinite(parsed)
                ? Math.max(1, parsed)
                : 4;
              await this.plugin.saveSettings();
            })
        );

      new Setting(tabEl)
        .setName("RRF k")
        .setDesc("Rank fusion constant for blending lexical and vector results.")
        .addText((text) =>
          text
            .setPlaceholder("60")
            .setValue(String(this.plugin.settings.rrfK))
            .onChange(async (value) => {
              const parsed = Number.parseInt(value, 10);
              this.plugin.settings.rrfK = Number.isFinite(parsed) ? Math.max(1, parsed) : 60;
              await this.plugin.saveSettings();
            })
        );

      new Setting(tabEl)
        .setName("RRF log top N")
        .setDesc("Log the top N RRF-ranked chunks to stderr (0 disables).")
        .addText((text) =>
          text
            .setPlaceholder("0")
            .setValue(String(this.plugin.settings.rrfLogTop))
            .onChange(async (value) => {
              const parsed = Number.parseInt(value, 10);
              this.plugin.settings.rrfLogTop = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
              await this.plugin.saveSettings();
            })
        );

      new Setting(tabEl)
        .setName("Max chunks per document")
        .setDesc("Limit how many chunks from a single document can appear in retrieval (0 disables).")
        .addText((text) =>
          text
            .setPlaceholder("0")
            .setValue(String(this.plugin.settings.maxChunksPerDoc))
            .onChange(async (value) => {
              const parsed = Number.parseInt(value, 10);
              this.plugin.settings.maxChunksPerDoc = Number.isFinite(parsed)
                ? Math.max(0, parsed)
                : 0;
              await this.plugin.saveSettings();
            })
        );
    };

    const renderMaintenance = (tabEl: HTMLElement) => {
      tabEl.createEl("h2", { text: "Logging" });

      new Setting(tabEl)
        .setName("Enable logging to file")
        .setDesc("Write plugin logs to a file.")
        .addToggle((toggle) =>
          toggle.setValue(this.plugin.settings.enableFileLogging).onChange(async (value) => {
            this.plugin.settings.enableFileLogging = value;
            await this.plugin.saveSettings();
          })
        );

      new Setting(tabEl)
        .setName("Log file path (vault-relative)")
        .setDesc("Where to write the log file. Keep inside the vault.")
        .addText((text) =>
          text
            .setPlaceholder(`${CACHE_ROOT}/logs/docling_extract.log`)
            .setValue(this.plugin.settings.logFilePath)
            .onChange(async (value) => {
              this.plugin.settings.logFilePath = value.trim() || `${CACHE_ROOT}/logs/docling_extract.log`;
              await this.plugin.saveSettings();
            })
        );

      new Setting(tabEl)
        .setName("View or clear log")
        .setDesc("Open the log file or clear it.")
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

      tabEl.createEl("h2", { text: "Maintenance" });

      new Setting(tabEl)
        .setName("Reindex Redis from cached chunks")
        .setDesc("Rebuild the Redis index from cached chunk JSON files.")
        .addButton((button) =>
          button.setButtonText("Reindex").onClick(async () => {
            await this.plugin.reindexRedisFromCache();
          })
        );

      new Setting(tabEl)
        .setName("Recreate missing notes from cache")
        .setDesc("Rebuild missing notes using cached Zotero items and chunks.")
        .addButton((button) =>
          button.setButtonText("Recreate").onClick(async () => {
            await this.plugin.recreateMissingNotesFromCache();
          })
        )
        .addButton((button) =>
          button.setButtonText("Cancel").onClick(() => {
            this.plugin.cancelRecreateMissingNotesFromCache();
          })
        );
    };

    const tabs: Array<{
      id: SettingsTabId;
      label: string;
      render: (tabEl: HTMLElement) => void;
    }> = [
      { id: "prerequisites", label: "Prerequisites", render: renderPrerequisites },
      { id: "zotero-import", label: "Zotero import", render: renderZoteroImport },
      { id: "ocr", label: "OCR", render: renderOcr },
      { id: "llms", label: "LLMs", render: renderLlms },
      { id: "maintenance", label: "Maintenance", render: renderMaintenance },
    ];

    const tabButtons = new Map<SettingsTabId, HTMLButtonElement>();
    const tabPanels = new Map<SettingsTabId, HTMLDivElement>();

    const setActiveTab = (tabId: SettingsTabId) => {
      this.activeTab = tabId;
      for (const [id, button] of tabButtons) {
        const isActive = id === tabId;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-selected", isActive ? "true" : "false");
        button.setAttribute("tabindex", isActive ? "0" : "-1");
      }
      for (const [id, panel] of tabPanels) {
        const isActive = id === tabId;
        panel.classList.toggle("is-active", isActive);
        panel.hidden = !isActive;
      }
    };

    const tabList = containerEl.createDiv({ cls: "zrr-settings-tabs" });
    tabList.setAttribute("role", "tablist");

    const panelsWrap = containerEl.createDiv({ cls: "zrr-settings-tabs-panels" });

    for (const tab of tabs) {
      const tabButton = tabList.createEl("button", {
        text: tab.label,
        cls: "zrr-settings-tab-button",
      });
      const buttonId = `zrr-settings-tab-${tab.id}`;
      const panelId = `zrr-settings-panel-${tab.id}`;
      tabButton.type = "button";
      tabButton.id = buttonId;
      tabButton.setAttribute("role", "tab");
      tabButton.setAttribute("aria-controls", panelId);
      tabButton.setAttribute("aria-selected", "false");
      tabButton.addEventListener("click", () => setActiveTab(tab.id));

      const panel = panelsWrap.createDiv({ cls: "zrr-settings-tab-panel" });
      panel.id = panelId;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", buttonId);
      panel.hidden = true;

      tab.render(panel);

      tabButtons.set(tab.id, tabButton);
      tabPanels.set(tab.id, panel);
    }

    const initialTab = tabs.some((tab) => tab.id === this.activeTab)
      ? this.activeTab
      : tabs[0].id;
    setActiveTab(initialTab);
  }
}
