import {
  FileSystemAdapter,
  Editor,
  Component,
  MarkdownRenderer,
  MarkdownView,
  Notice,
  Plugin,
  TFile,
  WorkspaceLeaf,
  addIcon,
  normalizePath,
  requestUrl,
} from "obsidian";
import {
  createChunkToolsExtension,
  createSyncBadgeExtension,
} from "./editorExtensions";
import { spawn, type ChildProcess } from "child_process";
import { promises as fs, existsSync } from "fs";
import http from "http";
import https from "https";
import net from "net";
import os from "os";
import tls from "tls";
import path from "path";
import { pathToFileURL } from "url";
import { createHash } from "crypto";
import {
  CHUNK_CACHE_DIR,
  CACHE_ROOT,
  DEFAULT_SETTINGS,
  ITEM_CACHE_DIR,
  METADATA_SNAPSHOT_PATH,
  ANNOTATION_SNAPSHOT_PATH,
  AnnotationColorMap,
  OcrEngineAvailability,
  ZoteroRagSettingTab,
  ZoteroRagSettings,
} from "./settings";
import { PdfSidebarController } from "./pdfSidebar";
import { ICON_ASSETS } from "./iconAssets";
import {
  AnnotationConflictBatchModal,
  ChunkTagModal,
  ChunkTextPreviewModal,
  ConfirmDeleteNoteModal,
  ConfirmOverwriteModal,
  ConfirmPurgeRedisOrphansModal,
  ConfirmRebuildIndexModal,
  LanguageSuggestModal,
  MetadataConflictBatchModal,
  OutputModal,
  ReleaseNotesModal,
  RedisSearchModal,
  TextPromptModal,
  ZoteroItemSuggestModal,
} from "./modals";
import { TOOL_ASSETS } from "./toolAssets";
import type {
  DocIndexEntry,
  MetadataDecision,
  NoteMetadataFields,
  ZoteroItemValues,
  ZoteroLocalItem,
} from "./types";
import {
  ZRR_CHUNK_END_RE,
  ZRR_CHUNK_EXCLUDE_ANY_RE,
  ZRR_CHUNK_START_RE,
  ZRR_SYNC_END_RE,
  ZRR_SYNC_START_RE,
  extractDocIdFromDoc,
  extractFirstChunkMarkerFromContent,
  findChunkStartLineInDoc,
  parseChunkMarkerLine,
} from "./chunkMarkers";
import {
  downloadZoteroPdf,
  resolvePdfAttachment,
} from "./pdfAttachments";
import {
  coerceString,
  extractCitekey,
  extractCitekeyFromCsl,
  extractDoiFromCsl,
  extractDoiFromExtra,
  extractShortTitleFromCsl,
  extractShortTitleFromValues,
  extractYear,
  formatCreatorName,
  getDocIdFromValues,
  isPdfAttachment,
} from "./zoteroItemHelpers";
import { VIEW_TYPE_ZOTERO_CHAT, ZoteroChatView } from "./chatView";
import type { ChatCitation, ChatMessage, ChatRetrievedChunk } from "./chatView";
import { RELEASE_NOTES_LOG, type ReleaseNotesEntry } from "./releaseNotes";

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
const ZRR_PDF_ICON = ICON_ASSETS["zrr-pdf"];
const REDIS_STACK_SERVICE = "redis-stack";
const PYTHON_WORKER_SERVICE = "python-worker";
const PYTHON_WORKER_PLUGIN_ROOT = "/workspace/plugin";
const PYTHON_WORKER_VAULT_ROOT = "/workspace/vault";
const PYTHON_WORKER_API_HOST = "127.0.0.1";
const PYTHON_WORKER_DEFAULT_API_PORT = 7379;
const PYTHON_WORKER_API_PORT_OFFSET = 1000;
const RAG_AGENTIC_FULL_DOC_CHUNKS_BUDGET = 48;
const RAG_AGENTIC_FULL_DOC_MAX_CHARS_BUDGET = 32000;
const RAG_WORKER_BASE_TIMEOUT_SEC = 180;
const RAG_WORKER_RERANK_TIMEOUT_SEC = 120;
const RAG_WORKER_AGENTIC_STEP_TIMEOUT_SEC = 90;
const MAX_CITATION_TITLE_LENGTH = 80;
const ANNOTATION_SYNC_GRACE_MS = 120000;
const ZRR_ANNOTATIONS_START_RE = /<!--\s*zrr:annotations-start\b[^>]*-->/i;
const ZRR_ANNOTATIONS_END_RE = /<!--\s*zrr:annotations-end\s*-->/i;

const ZOTERO_FRONTMATTER_BASE_KEYS = [
  "doc_id",
  "zotero_key",
  "zotero_link",
  "item_link",
  "item_key",
  "citekey",
  "title",
  "short_title",
  "date",
  "year",
  "year_number",
  "authors",
  "editors",
  "aliases",
  "tags",
  "collection_title",
  "collection_titles",
  "collections",
  "collections_links",
  "item_type",
  "creator_summary",
  "publication_title",
  "book_title",
  "journal_abbrev",
  "volume",
  "issue",
  "pages",
  "date_added",
  "date_modified",
  "doi",
  "isbn",
  "issn",
  "publisher",
  "place",
  "url",
  "language",
  "abstract",
  "pdf_link",
  "item_json",
];

type ParsedChunkBlock = {
  chunkId: string;
  text: string;
  excludeFlag: boolean;
};

type AnnotationEntry = {
  key: string;
  attachmentKey: string;
  pageLabel: string;
  pageIndex: number | null;
  colorKey: string;
  callout: string;
  heading: string;
  annotationType: string;
  text: string;
  comment: string;
  tags: string[];
  sortToken: string;
  sortIndex: number;
  rawValues: ZoteroItemValues;
  imagePath?: string;
  imageHash?: string;
};

type ParsedAnnotationNote = {
  key: string;
  attachmentKey: string;
  pageLabel: string;
  pageIndex: number | null;
  callout: string;
  text: string;
  comment: string;
  tags: string[];
  imagePath?: string;
  imageHash?: string;
};

type AnnotationSnapshotEntry = {
  text: string;
  comment: string;
  tags: string[];
  image_hash?: string;
  color_key?: string;
};

type AnnotationSnapshotCacheEntry = {
  attachment_key?: string;
  annotations: Record<string, AnnotationSnapshotEntry>;
};

type AttachmentAnnotationFetchResult = {
  annotations: AnnotationEntry[];
  hadFetchError: boolean;
};

type DocumentAnnotationFetchResult = {
  attachmentKey: string;
  annotations: AnnotationEntry[];
  hadFetchError: boolean;
};

type ComposeCommandSpec = {
  command: string;
  argsPrefix: string[];
};

type ComposeProjectContext = {
  composePath: string;
  composeCommand: ComposeCommandSpec;
  composeEnv: NodeJS.ProcessEnv;
  project: string;
};

export default class ZoteroRagPlugin extends Plugin {
  settings!: ZoteroRagSettings;
  private docIndex: Record<string, DocIndexEntry> | null = null;
  private metadataSnapshotCache: Record<string, Partial<NoteMetadataFields>> | null = null;
  private annotationSnapshotCache: Record<string, AnnotationSnapshotCacheEntry> | null = null;
  private statusBarEl?: HTMLElement;
  private statusLabelEl?: HTMLElement;
  private statusBarInnerEl?: HTMLElement;
  private lastPythonEnvNotice: string | null = null;
  private lastContainerNotice: string | null = null;
  private lastZoteroApiNotice: string | null = null;
  private lastRedisNotice: string | null = null;
  private pythonWorkerRequestSeq = 0;
  private noteSyncTimers = new Map<string, number>();
  private noteSyncInFlight = new Set<string>();
  private noteSyncPending = new Set<string>();
  private noteSyncPendingDeletes = new Map<string, string>();
  private noteSyncSuppressed = new Set<string>();
  private noteMetadataSyncTimers = new Map<string, number>();
  private noteMetadataSyncInFlight = new Set<string>();
  private noteMetadataSyncPending = new Set<string>();
  private noteMetadataSyncSuppressed = new Set<string>();
  private noteAnnotationSyncTimers = new Map<string, number>();
  private noteAnnotationSyncInFlight = new Set<string>();
  private noteAnnotationSyncPending = new Set<string>();
  private noteAnnotationSyncSuppressed = new Set<string>();
  private annotationNoteEditTimes = new Map<string, number>();
  private missingDocIdWarned = new Set<string>();
  private annotationWebApiWarned = new Set<string>();
  private collectionTitleCache = new Map<string, string>();
  private recreateMissingNotesActive = false;
  private recreateMissingNotesAbort = false;
  private recreateMissingNotesProcess: ChildProcess | null = null;
  private reindexCacheActive = false;
  private activeChatQueryProcess: ChildProcess | null = null;
  private activeChatQueryCancelRequested = false;
  private lastReindexFailure:
    | "busy"
    | "tools_error"
    | "redis_unavailable"
    | "no_cache"
    | "embed_dim_mismatch"
    | "embed_failure"
    | "unknown"
    | null = null;
  private lastRedisSearchTerm = "";
  private hadSavedSettingsData = false;
  private pendingPythonRuntimeMigrationNotice: string | null = null;
  private pdfSidebar!: PdfSidebarController;

  async onload(): Promise<void> {
    await this.loadSettings();
    await this.migrateCachePaths();
    this.addSettingTab(new ZoteroRagSettingTab(this.app, this));
    this.pdfSidebar = new PdfSidebarController(
      {
        app: this.app,
        iconSvg: ZRR_PDF_ICON,
        resolveDocIdForNote: this.resolveDocIdForNote.bind(this),
        getDocIndexEntry: this.getDocIndexEntry.bind(this),
        hydrateDocIndexFromCache: this.hydrateDocIndexFromCache.bind(this),
        toVaultRelativePath: this.toVaultRelativePath.bind(this),
        normalizeChunkIdForNote: this.normalizeChunkIdForNote.bind(this),
        readChunkPayload: this.readChunkPayload.bind(this),
      },
      {
        extractDocIdFromDoc,
        findChunkStartLineInDoc,
        parseChunkMarkerLine,
        extractFirstChunkMarkerFromContent,
      }
    );

    this.registerRibbonIcons();
    this.registerView(VIEW_TYPE_ZOTERO_CHAT, (leaf) => new ZoteroChatView(leaf, this));
    this.setupStatusBar();
    this.registerNoteRenameHandler();
    this.registerNoteSyncHandler();
    this.registerNoteOpenHandler();
    this.registerAnnotationFocusSyncHandler();
    this.registerPreviewScrollSyncHandlers();
    this.registerNoteDeleteMenu();
    this.registerEditorExtension(createChunkToolsExtension(this));
    this.registerEditorExtension(createSyncBadgeExtension());
    this.registerEditorExtension(this.pdfSidebar.createSyncExtension());

    try {
      await this.ensureBundledTools();
    } catch (error) {
      console.error("Failed to sync bundled tools", error);
    }

    void this.autoDetectRedisOnLoad();

    this.addCommand({
      id: "import-zotero-item-index",
      name: "Import Zotero item and index (docling -> redissearch)",
      callback: () => this.importZoteroItem(),
    });

    this.addCommand({
      id: "ask-zotero-library",
      name: "Ask my Zotero library (rag via redissearch)",
      callback: () => this.askZoteroLibrary(),
    });

    this.addCommand({
      id: "open-zotero-chat",
      name: "Open research assistant chat panel",
      callback: () => this.openChatView(true),
    });
    this.addCommand({
      id: "sync-pdf-sidebar-current-note",
      name: "Sync PDF view in right sidebar for current note",
      callback: () => this.syncPdfSidebarForActiveNote(),
    });

    this.addCommand({
      id: "rebuild-zotero-note-cache",
      name: "Rebuild Zotero note from cache (docling + redissearch)",
      callback: () => this.rebuildNoteFromCache(),
    });

    this.addCommand({
      id: "rebuild-doc-index-cache",
      name: "Rebuild doc index from cache",
      callback: () => this.rebuildDocIndexFromCache(),
    });

    this.addCommand({
      id: "recreate-missing-notes-cache",
      name: "Recreate missing notes from cache (docling + redissearch)",
      callback: () => this.recreateMissingNotesFromCache(),
    });

    this.addCommand({
      id: "reindex-redis-from-cache",
      name: "Reindex redis from cached chunks",
      callback: () => this.reindexRedisFromCache(),
    });

    this.addCommand({
      id: "reindex-current-note",
      name: "Reindex current note from cache",
      callback: () => this.reindexCurrentNoteFromCache(),
    });

    this.addCommand({
      id: "drop-rebuild-redis-index",
      name: "Drop & rebuild redis index",
      callback: () => this.dropAndRebuildRedisIndex(),
    });

    this.addCommand({
      id: "start-redis-stack",
      name: "Start redis stack (docker/podman compose)",
      callback: () => this.startRedisStack(),
    });

    this.addCommand({
      id: "switch-python-runtime-local-legacy",
      name: "Switch python runtime to local (legacy)",
      callback: () => this.switchPythonRuntimeToLocalLegacy(),
    });

    this.addCommand({
      id: "open-docling-log",
      name: "Open log file",
      callback: () => this.openLogFile(),
    });

    this.addCommand({
      id: "clear-docling-log",
      name: "Clear log file",
      callback: () => this.clearLogFile(),
    });

    this.addCommand({
      id: "toggle-zrr-chunk-delete",
      name: "Toggle zrr chunk exclude at cursor",
      editorCallback: (editor) => this.toggleChunkExclude(editor),
    });

    this.addCommand({
      id: "delete-zotero-note-cache",
      name: "Delete Zotero note and cached data",
      callback: () => this.deleteZoteroNoteAndCache(),
    });

    this.addCommand({
      id: "search-redis-index",
      name: "Search redis index for term",
      callback: () => this.searchRedisIndex(),
    });
    this.addCommand({
      id: "redis-diagnostics",
      name: "Show redis diagnostics",
      callback: () => this.showRedisDiagnostics(),
    });

    this.addCommand({
      id: "zotero-companion-health",
      name: "Check Zotero companion status",
      callback: () => this.checkZoteroCompanionHealth(),
    });

    this.addCommand({
      id: "zotero-open-addons",
      name: "Open Zotero add-ons",
      callback: () => this.openZoteroAddons(),
    });

    this.addCommand({
      id: "purge-redis-orphans",
      name: "Purge redis orphaned chunks (missing cache files)",
      callback: () => this.purgeRedisOrphanedKeys(),
    });

    void this.maybeShowReleaseNotesModal();
    void this.autoDetectContainerCliOnLoad();
    if (this.pendingPythonRuntimeMigrationNotice) {
      new Notice(this.pendingPythonRuntimeMigrationNotice, 9000);
      this.pendingPythonRuntimeMigrationNotice = null;
    }

    if (this.settings.autoStartRedis) {
      void this.startRedisStack(true);
    }
  }

  async loadSettings(): Promise<void> {
    const data = (await this.loadData()) ?? {};
    this.hadSavedSettingsData = Object.keys(data).length > 0;
    const settings = Object.assign({}, DEFAULT_SETTINGS, data);
    const runtimeRaw = (data).pythonRuntime;
    const runtimeMissing = runtimeRaw === undefined || runtimeRaw === null || runtimeRaw === "";
    const runtimeInvalid = !runtimeMissing && runtimeRaw !== "worker" && runtimeRaw !== "local";
    const runtimeMigrationDone = Boolean((data).pythonRuntimeMigrationV1Done);
    let migratedToWorker = false;

    if (runtimeMissing || runtimeInvalid) {
      settings.pythonRuntime = "worker";
      migratedToWorker = true;
    } else if (!runtimeMigrationDone && runtimeRaw === "local") {
      const pythonPathRaw = String((data).pythonPath ?? "").trim();
      const envLocationRaw = String((data).pythonEnvLocation ?? "").trim();
      const likelyLegacyLocalDefault = !pythonPathRaw && (!envLocationRaw || envLocationRaw === "shared");
      if (likelyLegacyLocalDefault) {
        settings.pythonRuntime = "worker";
        migratedToWorker = true;
      }
    }
    settings.pythonRuntimeMigrationV1Done = true;

    if (migratedToWorker) {
      this.pendingPythonRuntimeMigrationNotice =
        "Python runtime was migrated to worker mode. Legacy local runtime settings were kept and can still be re-enabled in Settings.";
    } else {
      this.pendingPythonRuntimeMigrationNotice = null;
    }
    const advancedRuntimeFlagMissing = (data).showAdvancedPythonRuntimeOptions === undefined;
    if (advancedRuntimeFlagMissing && settings.pythonRuntime === "local") {
      settings.showAdvancedPythonRuntimeOptions = true;
    }
    if (
      settings.preferObsidianNoteForCitations === undefined &&
      typeof (data).preferVaultPdfForCitations === "boolean"
    ) {
      settings.preferObsidianNoteForCitations = (data).preferVaultPdfForCitations;
    }
    this.settings = settings;
    if (!runtimeMigrationDone || runtimeMissing || runtimeInvalid || advancedRuntimeFlagMissing) {
      await this.saveData(this.settings);
    }
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  public async switchPythonRuntimeToLocalLegacy(): Promise<void> {
    const alreadyLocal = this.settings.pythonRuntime === "local";
    this.settings.pythonRuntime = "local";
    this.settings.showAdvancedPythonRuntimeOptions = true;
    await this.saveSettings();
    if (alreadyLocal) {
      new Notice("Local python runtime is already active.");
      return;
    }
    new Notice(
      "Switched to local python runtime (legacy). Open settings > prerequisites and run python environment > create/update."
    );
  }

  private async maybeShowReleaseNotesModal(): Promise<void> {
    const currentVersion = String(this.manifest.version || "").trim();
    if (!currentVersion) {
      return;
    }
    const seenVersion = String(this.settings.lastSeenReleaseNotesVersion || "").trim();
    if (!seenVersion && !this.hadSavedSettingsData) {
      this.settings.lastSeenReleaseNotesVersion = currentVersion;
      await this.saveSettings();
      return;
    }
    if (seenVersion === currentVersion) {
      return;
    }

    const markdown = this.getReleaseNotesMarkdown(currentVersion, seenVersion || null);
    this.settings.lastSeenReleaseNotesVersion = currentVersion;
    await this.saveSettings();
    new ReleaseNotesModal(this.app, currentVersion, markdown).open();
  }

  public openReleaseNotesModal(): void {
    const currentVersion = String(this.manifest.version || "").trim();
    if (!currentVersion) {
      return;
    }
    const markdown = this.getReleaseNotesMarkdown(currentVersion, null);
    new ReleaseNotesModal(this.app, currentVersion, markdown).open();
  }

  private normalizeReleaseVersion(value: string): string {
    return String(value || "")
      .trim()
      .replace(/^refs\/tags\//, "")
      .replace(/^v/, "");
  }

  private parseNumericReleaseVersion(version: string): number[] | null {
    const normalized = this.normalizeReleaseVersion(version);
    if (!normalized) {
      return null;
    }
    const parts = normalized.split(".");
    if (!parts.length) {
      return null;
    }
    const parsed = parts.map((part) => Number.parseInt(part, 10));
    if (parsed.some((part) => !Number.isFinite(part))) {
      return null;
    }
    return parsed;
  }

  private compareReleaseVersions(a: string, b: string): number {
    const normalizedA = this.normalizeReleaseVersion(a);
    const normalizedB = this.normalizeReleaseVersion(b);
    const numericA = this.parseNumericReleaseVersion(normalizedA);
    const numericB = this.parseNumericReleaseVersion(normalizedB);
    if (numericA && numericB) {
      const maxLen = Math.max(numericA.length, numericB.length);
      for (let index = 0; index < maxLen; index += 1) {
        const left = numericA[index] ?? 0;
        const right = numericB[index] ?? 0;
        if (left !== right) {
          return left - right;
        }
      }
      return 0;
    }
    return normalizedA.localeCompare(normalizedB, undefined, { numeric: true, sensitivity: "base" });
  }

  private isFullChangelogLine(line: string): boolean {
    const normalized = String(line || "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[*_`]/g, "")
      .trim()
      .toLowerCase();
    return normalized.includes("full changelog");
  }

  private sanitizeReleaseNotesMarkdown(markdown: string): string {
    const lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");
    const filtered = lines.filter((line) => !this.isFullChangelogLine(line));
    return filtered.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  private stripLeadingVersionHeading(markdown: string, version: string): string {
    const lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");
    const firstNonEmpty = lines.findIndex((line) => line.trim().length > 0);
    if (firstNonEmpty < 0) {
      return "";
    }
    const normalizedVersion = this.normalizeReleaseVersion(version);
    if (!normalizedVersion) {
      return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
    }
    const escapedVersion = normalizedVersion.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const normalizedFirstLine = lines[firstNonEmpty]
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[*_`]/g, "")
      .trim();
    const versionHeadingRe = new RegExp(`^#{0,6}\\s*v?${escapedVersion}(?:\\b|\\s|\\(|-)`, "i");
    if (!versionHeadingRe.test(normalizedFirstLine)) {
      return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
    }
    lines.splice(firstNonEmpty, 1);
    while (firstNonEmpty < lines.length && lines[firstNonEmpty].trim().length === 0) {
      lines.splice(firstNonEmpty, 1);
    }
    if (firstNonEmpty < lines.length && /^[-=]{3,}\s*$/.test(lines[firstNonEmpty].trim())) {
      lines.splice(firstNonEmpty, 1);
    }
    return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  private getBundledReleaseNotesEntries(): ReleaseNotesEntry[] {
    const seen = new Set<string>();
    const entries = Array.isArray(RELEASE_NOTES_LOG) ? RELEASE_NOTES_LOG : [];
    const normalizedEntries: ReleaseNotesEntry[] = [];
    for (const entry of entries) {
      const version = this.normalizeReleaseVersion(String(entry?.version ?? ""));
      const markdown = this.sanitizeReleaseNotesMarkdown(String(entry?.markdown ?? ""));
      if (!version || seen.has(version)) {
        continue;
      }
      seen.add(version);
      normalizedEntries.push({ version, markdown });
    }
    return normalizedEntries.sort((left, right) =>
      this.compareReleaseVersions(right.version, left.version)
    );
  }

  private getReleaseNotesMarkdown(currentVersion: string, fromVersion: string | null): string {
    const normalizedCurrent = this.normalizeReleaseVersion(currentVersion);
    if (!normalizedCurrent) {
      return "";
    }

    const normalizedFrom = this.normalizeReleaseVersion(fromVersion || "");
    const bundledEntries = this.getBundledReleaseNotesEntries();
    const inRange = bundledEntries.filter((entry) => {
      const toCurrent = this.compareReleaseVersions(entry.version, normalizedCurrent);
      if (toCurrent > 0) {
        return false;
      }
      if (!normalizedFrom) {
        return entry.version === normalizedCurrent;
      }
      const fromSeen = this.compareReleaseVersions(entry.version, normalizedFrom);
      return fromSeen > 0;
    });

    const entriesToRender = inRange.length
      ? inRange
      : bundledEntries.filter((entry) => entry.version === normalizedCurrent);
    if (!entriesToRender.length) {
      return "This version includes improvements and fixes.";
    }

    if (entriesToRender.length === 1) {
      const entry = entriesToRender[0];
      const body = this.stripLeadingVersionHeading(
        this.sanitizeReleaseNotesMarkdown(String(entry.markdown || "")),
        entry.version
      );
      return `### v${entry.version}\n\n${body || "This release includes improvements and fixes."}`;
    }

    return entriesToRender
      .map((entry) => {
        const body =
          this.stripLeadingVersionHeading(
            this.sanitizeReleaseNotesMarkdown(String(entry.markdown || "")),
            entry.version
          ) || "This release includes improvements and fixes.";
        return `### v${entry.version}\n\n${body}`;
      })
      .join("\n\n");
  }

  private async importZoteroItem(): Promise<void> {
    try {
      await this.ensureBundledTools();
    } catch (error) {
      new Notice("Failed to sync bundled tools. See console for details.");
      console.error(error);
      return;
    }

    const localApiOk = await this.warnIfZoteroLocalApiUnavailable("import");
    if (!localApiOk && !this.canUseWebApi()) {
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

    const docId = getDocIdFromValues(values);
    if (!docId) {
      new Notice("Could not resolve a stable doc_ID from Zotero item.");
      return;
    }

    const languageHint = await this.resolveLanguageHint(values, item.key ?? values.key);
    const doclingLanguageHint = this.buildDoclingLanguageHint(languageHint ?? undefined);

    const attachment = await resolvePdfAttachment(values, docId, {
      fetchZoteroChildren: this.fetchZoteroChildren.bind(this),
    });
    if (!attachment) {
      new Notice("No PDF attachment found for item.");
      return;
    }

    this.showStatusProgress("Preparing...", 5);
    if (!(await this.ensureRedisAvailable("import"))) {
      this.clearStatusProgress();
      return;
    }

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
      if (this.settings.enableFileLogging) {
        const logRel = this.getLogFileRelativePath();
        const logDir = normalizePath(path.dirname(logRel));
        if (logDir) {
          await this.ensureFolder(logDir);
        }
        await this.deleteLogFileIfExists();
        // Also ensure spellchecker info dir (same as logs)
        const spellInfoRel = this.getSpellcheckerInfoRelativePath();
        const spellDir = normalizePath(path.dirname(spellInfoRel));
        if (spellDir) {
          await this.ensureFolder(spellDir);
        }
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
          : await downloadZoteroPdf(attachment.key, {
            buildZoteroUrl: this.buildZoteroUrl.bind(this),
            getZoteroLibraryPath: this.getZoteroLibraryPath.bind(this),
            canUseWebApi: this.canUseWebApi.bind(this),
            buildWebApiUrl: this.buildWebApiUrl.bind(this),
            getWebApiLibraryPath: this.getWebApiLibraryPath.bind(this),
            requestLocalApiRaw: this.requestLocalApiRaw.bind(this),
            requestWebApiRaw: this.requestWebApiRaw.bind(this),
            requestLocalApi: this.requestLocalApi.bind(this),
            readFile: fs.readFile,
          });
        await this.app.vault.adapter.writeBinary(pdfPath, this.bufferToArrayBuffer(buffer));
        pdfSourcePath = this.getAbsoluteVaultPath(pdfPath);
      } else if (attachment.filePath) {
        pdfSourcePath = attachment.filePath;
      } else {
        await this.ensureFolder(this.settings.outputPdfDir);
        const buffer = await downloadZoteroPdf(attachment.key, {
          buildZoteroUrl: this.buildZoteroUrl.bind(this),
          getZoteroLibraryPath: this.getZoteroLibraryPath.bind(this),
          canUseWebApi: this.canUseWebApi.bind(this),
          buildWebApiUrl: this.buildWebApiUrl.bind(this),
          getWebApiLibraryPath: this.getWebApiLibraryPath.bind(this),
          requestLocalApiRaw: this.requestLocalApiRaw.bind(this),
          requestWebApiRaw: this.requestWebApiRaw.bind(this),
          requestLocalApi: this.requestLocalApi.bind(this),
          readFile: fs.readFile,
        });
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
      this.showStatusProgress(this.formatStatusLabel("Docling extraction...", qualityLabel), 0);
      const doclingLogPath = this.settings.enableFileLogging ? this.getLogFileAbsolutePath() : null;
      await this.runPythonStreaming(
        doclingScript,
        await this.buildDoclingArgs(
          pdfSourcePath,
          docId,
          chunkPath,
          notePath,
          doclingLanguageHint,
          true
        ),
        (payload) => this.handleDoclingProgress(payload, qualityLabel),
        () => {},
        doclingLogPath
      );
      qualityLabel = await this.readDoclingQualityLabel(chunkPath);
      await this.annotateChunkJsonWithAttachmentKey(chunkPath, attachment.key);

      const metadata = await this.readDoclingMetadata(chunkPath);
      const layeredPath = await this.maybeCreateOcrLayeredPdf(
        pdfSourcePath,
        metadata,
        doclingLanguageHint
      );
      if (layeredPath) {
        pdfSourcePath = layeredPath;
        pdfLink = this.buildPdfLinkFromSourcePath(layeredPath);
        await this.updateChunkJsonSourcePdf(chunkPath, layeredPath);
      }
    } catch (error) {
      new Notice("Docling extraction failed. See console for details.");
      console.error(error);
      this.clearStatusProgress();
      return;
    }

    let indexingRecovered = false;
    try {
      this.showStatusProgress(this.formatStatusLabel("Indexing chunks...", qualityLabel), 0);
      const indexArgs = [
        "--chunks-json",
        this.getAbsoluteVaultPath(chunkPath),
        "--redis-url",
        this.settings.redisUrl,
        "--index",
        this.getRedisIndexName(),
        "--prefix",
        this.getRedisKeyPrefix(),
        "--embed-base-url",
        this.settings.embedBaseUrl,
        "--embed-api-key",
        this.settings.embedApiKey,
        "--embed-model",
        this.settings.embedModel,
        "--progress",
      ];
      this.appendEmbedSubchunkArgs(indexArgs);
      this.appendEmbedContextArgs(indexArgs);
      if (this.settings.embedIncludeMetadata) {
        indexArgs.push("--embed-include-metadata");
      }
      this.appendChunkTaggingArgs(indexArgs);
      await this.runPythonStreaming(
        indexScript,
        indexArgs,
        (payload) => {
          const event = this.asRecord(payload);
          const total = typeof event?.total === "number" ? event.total : 0;
          const current = typeof event?.current === "number" ? event.current : 0;
          if (event?.type === "progress" && total > 0) {
            const percent = Math.round((current / total) * 100);
            const message =
              typeof event.message === "string" && event.message.trim()
                ? event.message
                : `Indexing chunks ${current}/${total}`;
            const label = this.formatStatusLabel(
              message,
              qualityLabel
            );
            this.showStatusProgress(label, percent);
          }
        },
        () => undefined
      );
    } catch (error) {
      const message = this.getPythonErrorMessage(error);
      const classification = this.classifyIndexingError(message);
      console.error(error);
      if (classification === "embed_dim_mismatch") {
        const confirmed = await this.confirmRebuildIndex(
          "Embedding model output dimension does not match the Redis index schema. " +
            "Switch to a model with matching dimensions, or drop/rebuild the index."
        );
        if (confirmed) {
          try {
            await this.dropRedisIndex(true);
            const rebuilt = await this.reindexRedisFromCache();
            if (!rebuilt) {
              this.clearStatusProgress();
              if (this.lastReindexFailure === "embed_failure") {
                new Notice(
                  "Embedding provider error detected while rebuilding the Redis index. " +
                    "Fix the provider/model settings and retry import."
                );
              } else {
                new Notice("Redis index rebuild did not complete. Import stopped.");
              }
              return;
            }
            new Notice("Redis index rebuilt; resuming import.");
            indexingRecovered = true;
          } catch (dropError) {
            this.clearStatusProgress();
            new Notice("Failed to drop/rebuild the redis index. See console for details.");
            console.error(dropError);
            return;
          }
        } else {
          this.clearStatusProgress();
          new Notice(
            "Indexing aborted due to embedding dimension mismatch. " +
              "Switch models or drop/rebuild the index."
          );
          return;
        }
      }
      if (!indexingRecovered) {
        if (classification === "embed_failure") {
          this.clearStatusProgress();
          new Notice("Embedding provider error detected. Fix the provider/model settings and rerun.");
          return;
        }
        this.clearStatusProgress();
        new Notice("Redissearch indexing failed. See console for details.");
        return;
      }
    }

    try {
      const doclingMd = await this.app.vault.adapter.read(notePath);
      const chunkPayload = await this.readChunkPayload(chunkPath);
    const doclingContent = this.buildSyncedDoclingContent(docId, chunkPayload, doclingMd);
      const noteContent = await this.buildNoteMarkdown(
        values,
        item.meta ?? {},
        docId,
        pdfLink,
        attachment.key,
        notePath,
        itemPath,
        doclingContent
      );
      await this.writeNoteWithSyncSuppressed(notePath, noteContent);
      const noteFile = this.app.vault.getAbstractFileByPath(notePath);
      if (noteFile instanceof TFile) {
        this.scheduleNoteAnnotationSync(noteFile, 2000, "save");
      }
    } catch (error) {
      new Notice("Failed to finalize note Markdown.");
      console.error(error);
      this.clearStatusProgress();
      return;
    }

    try {
      const shortTitle = extractShortTitleFromValues(values);
      await this.updateDocIndex({
        doc_id: docId,
        note_path: notePath,
        note_title: finalBaseName,
        zotero_title: title,
        short_title: shortTitle || undefined,
        pdf_path: pdfSourcePath,
        attachment_key: attachment.key,
      });
      const noteFile = this.app.vault.getAbstractFileByPath(notePath);
      if (noteFile instanceof TFile) {
        void this.pdfSidebar.syncPdfSidebarForFile(noteFile);
        void this.pdfSidebar.maybeSyncPendingPdf();
      }
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

  private async syncPdfSidebarForActiveNote(): Promise<void> {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    const file = view?.file;
    if (!(file instanceof TFile) || file.extension !== "md") {
      new Notice("Open a Markdown note first.");
      return;
    }
    await this.pdfSidebar.syncPdfSidebarForFile(file);
    await this.pdfSidebar.maybeSyncPendingPdf();
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
    await this.app.workspace.revealLeaf(leaf);
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
      const payload = this.asRecord(JSON.parse(raw));
      const sessions = Array.isArray(payload?.sessions) ? payload.sessions : [];
      return sessions
        .filter((s): s is Record<string, unknown> => {
          return Boolean(this.asRecord(s) && typeof (s as Record<string, unknown>).id === "string");
        })
        .map((s) => {
          const id = typeof s.id === "string" ? s.id : "";
          return {
            id,
            name: typeof s.name === "string" && s.name.trim() ? s.name.trim() : id,
          createdAt: typeof s.createdAt === "string" ? s.createdAt : new Date().toISOString(),
          updatedAt: typeof s.updatedAt === "string" ? s.updatedAt : new Date().toISOString(),
          };
        });
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
      let parsedPayload: unknown;
      try {
        parsedPayload = JSON.parse(raw);
      } catch {
        return [];
      }
      const payload = this.asRecord(parsedPayload);
      const messages = Array.isArray(parsedPayload)
        ? parsedPayload
        : (Array.isArray(payload?.messages) ? payload.messages : []);
      if (!Array.isArray(messages)) {
        return [];
      }
      return messages
      .filter((msg): msg is Record<string, unknown> => {
        return Boolean(this.asRecord(msg) && typeof (msg as Record<string, unknown>).content === "string");
      })
      .map((msg) => ({
        id: typeof msg.id === "string" ? msg.id : this.generateChatId(),
        role: msg.role === "assistant" ? "assistant" : "user",
        content: typeof msg.content === "string" ? msg.content : "",
        citations: Array.isArray(msg.citations) ? msg.citations : [],
        retrieved: Array.isArray(msg.retrieved) ? msg.retrieved : [],
        createdAt: typeof msg.createdAt === "string" ? msg.createdAt : new Date().toISOString(),
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
      const payload = this.asRecord(JSON.parse(raw));
      const sessions = Array.isArray(payload?.sessions) ? payload.sessions : [];
      return {
        version: 1,
        active: typeof payload?.active === "string" ? payload.active : "default",
        sessions: sessions
          .map((s) => this.asRecord(s))
          .filter((s): s is Record<string, unknown> => Boolean(s))
          .map((s) => {
            const id = typeof s.id === "string" ? s.id : "";
            return {
              id,
              name: typeof s.name === "string" && s.name.trim() ? s.name.trim() : id,
            createdAt: typeof s.createdAt === "string" ? s.createdAt : now,
            updatedAt: typeof s.updatedAt === "string" ? s.updatedAt : now,
            };
          }),
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
        const payload = this.asRecord(JSON.parse(raw));
        const sessions = Array.isArray(payload?.sessions) ? payload.sessions : [];
        const hasDefault = sessions.some((entry) => {
          const session = this.asRecord(entry);
          return session?.id === "default";
        });
        const updatedSessions = sessions
          .map((entry) => this.asRecord(entry))
          .filter((s): s is Record<string, unknown> => Boolean(s))
          .map((s) => {
          if (s.id === "default" && typeof s.name === "string" && s.name.trim().toLowerCase() === "default") {
            return { ...s, name: "New chat" as const };
          }
          return s;
        });
        if (hasDefault && JSON.stringify(updatedSessions) !== JSON.stringify(sessions)) {
          await this.writeChatSessionsIndex({
            version: 1,
            active: typeof payload?.active === "string" ? payload.active : "default",
            sessions: updatedSessions.map((s) => ({
              id: typeof s.id === "string" ? s.id : "",
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
    const normalizedBase = baseUrl.replace(/\/$/, "");
    const isOpenAi = normalizedBase.toLowerCase().includes("api.openai.com");
    if (isOpenAi) {
      if (!this.settings.chatApiKey) {
        return null;
      }
      if (model.includes("/")) {
        return null;
      }
    }
    try {
      const url = `${normalizedBase}/chat/completions`;
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
      const res = await requestUrl({
        url,
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        throw: false,
      });
      if (res.status >= 400) {
        return null;
      }
      const data = res.json;
      const text = data?.choices?.[0]?.message?.content;
      if (typeof text !== "string") {
        return null;
      }
      return this.normalizeChatTitle(text.replace(/^"|"$/g, "").trim());
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

  private getRagWorkerTimeoutSec(): number {
    let timeoutSec = RAG_WORKER_BASE_TIMEOUT_SEC;
    if (this.settings.enableCrossEncoderRerank) {
      timeoutSec += RAG_WORKER_RERANK_TIMEOUT_SEC;
    }
    if (this.settings.enableAgenticRag) {
      const iters = Number.isFinite(this.settings.agenticMaxIters)
        ? Math.max(1, Math.trunc(this.settings.agenticMaxIters))
        : 2;
      timeoutSec += Math.max(RAG_WORKER_AGENTIC_STEP_TIMEOUT_SEC, iters * RAG_WORKER_AGENTIC_STEP_TIMEOUT_SEC);
    }
    return Math.min(3600, Math.max(60, timeoutSec));
  }

  private isRagQueryCancellationMessage(message: string): boolean {
    const text = (message || "").toLowerCase();
    return (
      text.includes("python worker request aborted") ||
      text.includes("request aborted") ||
      text.includes("request canceled") ||
      text.includes("request cancelled") ||
      text.includes("canceled_while_waiting_rag_slot") ||
      text.includes("cancelled_while_waiting_rag_slot") ||
      text.includes("client_disconnected") ||
      text.includes("error: canceled") ||
      text.includes("error: cancelled")
    );
  }

  public cancelActiveRagQuery(): boolean {
    this.activeChatQueryCancelRequested = true;
    const child = this.activeChatQueryProcess;
    if (!child) {
      return false;
    }
    if (child.killed) {
      return true;
    }
    try {
      child.kill("SIGTERM");
      return true;
    } catch (error) {
      console.warn("Failed to cancel active RAG query with SIGTERM", error);
      try {
        child.kill();
        return true;
      } catch (fallbackError) {
        console.warn("Failed to cancel active RAG query", fallbackError);
        return false;
      }
    }
  }

  async runRagQueryStreaming(
    query: string,
    onDelta: (delta: string) => void,
    onFinal: (payload: unknown) => void,
    historyMessages: ChatMessage[] = []
  ): Promise<void> {
    this.activeChatQueryProcess = null;
    this.activeChatQueryCancelRequested = false;
    await this.ensureBundledTools();
    if (!(await this.ensureRedisAvailable("chat query"))) {
      onFinal({ answer: "Redis is not reachable. Please start Redis Stack and try again." });
      return;
    }
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
      this.getRedisIndexName(),
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
    if (this.settings.enableQueryExpansion) {
      args.push("--expand-query");
      args.push(
        "--expand-count",
        String(Math.max(1, Math.trunc(this.settings.queryExpansionCount)))
      );
    }
    if (this.settings.enableCrossEncoderRerank) {
      args.push("--rerank");
      const model = (this.settings.rerankModel || "").trim();
      if (model) {
        args.push("--rerank-model", model);
      }
    }
    if (Number.isFinite(this.settings.rerankCandidateMultiplier)) {
      args.push(
        "--rerank-candidates",
        String(Math.max(1, Math.trunc(this.settings.rerankCandidateMultiplier)))
      );
    }
    if (Number.isFinite(this.settings.rrfK)) {
      args.push("--rrf-k", String(Math.max(1, Math.trunc(this.settings.rrfK))));
    }
    if (Number.isFinite(this.settings.rrfLogTop) && this.settings.rrfLogTop > 0) {
      args.push("--rrf-log-top", String(Math.max(1, Math.trunc(this.settings.rrfLogTop))));
    }
    if (Number.isFinite(this.settings.maxChunksPerDoc) && this.settings.maxChunksPerDoc > 0) {
      args.push(
        "--max-per-doc",
        String(Math.max(1, Math.trunc(this.settings.maxChunksPerDoc)))
      );
    }
    if (this.settings.enableAgenticRag) {
      args.push("--agentic", "basic");
      if (Number.isFinite(this.settings.agenticMaxIters) && this.settings.agenticMaxIters > 0) {
        args.push(
          "--agentic-max-iters",
          String(Math.max(1, Math.trunc(this.settings.agenticMaxIters)))
        );
      }
      args.push(
        "--agentic-full-doc-chunks",
        String(RAG_AGENTIC_FULL_DOC_CHUNKS_BUDGET),
        "--agentic-full-doc-max-chars",
        String(RAG_AGENTIC_FULL_DOC_MAX_CHARS_BUDGET)
      );
    }

    const historyPayload = this.buildChatHistoryPayload(historyMessages);
    const historyFile = await this.writeChatHistoryTemp(historyPayload);
    if (historyFile?.absolutePath) {
      args.push("--history-file", historyFile.absolutePath);
    }

    try {
      const ragTimeoutSec = this.getRagWorkerTimeoutSec();
      const runQuery = async (): Promise<void> => {
        await this.runPythonStreaming(
          ragScript,
          args,
          (payload) => {
            const event = this.asRecord(payload);
            if (event?.type === "delta" && typeof event.content === "string") {
              onDelta(event.content);
              return;
            }
            if (event?.type === "phase") {
              this.logPythonWorkerTiming("rag-phase", event);
              return;
            }
            if (event?.type === "final") {
              onFinal(event);
              return;
            }
            if (event?.answer) {
              onFinal(event);
            }
          },
          onFinal,
          undefined,
          "rag_query_redisearch",
          (child) => {
            this.activeChatQueryProcess = child;
            if (this.activeChatQueryCancelRequested && !child.killed) {
              try {
                child.kill("SIGTERM");
              } catch (error) {
                console.warn("Failed to cancel queued chat request", error);
              }
            }
          },
          ragTimeoutSec
        );
      };
      let attemptedRebuild = false;
      while (true) {
        if (this.activeChatQueryCancelRequested) {
          onFinal({ canceled: true, answer: "Request canceled." });
          return;
        }
        try {
          await runQuery();
          break;
        } catch (error) {
          const message = this.getPythonErrorMessage(error);
          if (this.activeChatQueryCancelRequested || this.isRagQueryCancellationMessage(message)) {
            onFinal({ canceled: true, answer: "Request canceled." });
            return;
          }
          const classification = this.classifyIndexingError(message);
          if (classification === "embed_dim_mismatch") {
            if (attemptedRebuild) {
              onFinal({
                answer:
                  "Embedding dimension mismatch persists after rebuild. Check the embedding model settings.",
              });
              return;
            }
            const confirmed = await this.confirmRebuildIndex(
              "Embedding model output dimension does not match the Redis index schema."
            );
            if (!confirmed) {
              onFinal({
                answer:
                  "Embedding dimension mismatch. Switch models or drop/rebuild the Redis index.",
              });
              return;
            }
            try {
              await this.dropRedisIndex(true);
              const rebuilt = await this.reindexRedisFromCache();
              if (!rebuilt) {
                const answer =
                  this.lastReindexFailure === "embed_failure"
                    ? "Embedding provider error detected while rebuilding the index. Fix settings and retry."
                    : "Redis index rebuild did not complete. Chat query stopped.";
                onFinal({ answer });
                return;
              }
            } catch (dropError) {
              console.error(dropError);
              onFinal({
                answer: "Failed to drop/rebuild the Redis index. See console for details.",
              });
              return;
            }
            attemptedRebuild = true;
            continue;
          }
          if (classification === "embed_failure") {
            onFinal({
              answer: "Embedding provider error detected. Fix the provider/model settings and retry.",
            });
            return;
          }
          throw error;
        }
      }
    } finally {
      if (historyFile?.relativePath) {
        try {
          await this.app.vault.adapter.remove(historyFile.relativePath);
        } catch (error) {
          console.warn("Failed to remove chat history temp file", error);
        }
      }
      this.activeChatQueryProcess = null;
      this.activeChatQueryCancelRequested = false;
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
    if (
      !entry ||
      !entry.note_title ||
      !entry.zotero_title ||
      !entry.note_path ||
      !entry.pdf_path ||
      entry.short_title === undefined
    ) {
      entry = await this.hydrateDocIndexFromCache(citation.doc_id);
    }
    const notePath = citation.doc_id ? await this.resolveNotePathForDocId(citation.doc_id) : entry?.note_path;
    const noteTitle = this.resolveCitationTitle(entry, notePath, citation.doc_id);
    const pageLabel = this.formatCitationPageLabel(citation);
    const pageStart = citation.page_start ? String(citation.page_start) : "";
    const pdfPath = entry?.pdf_path || citation.source_pdf || "";
    const attachmentKey = citation.attachment_key || entry?.attachment_key;
    const annotationKey = citation.annotation_key || this.extractAnnotationKey(citation.chunk_id);
    let zoteroUrl = citation.doc_id
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

  private resolveCitationTitle(
    entry: DocIndexEntry | null,
    notePath?: string | null,
    docId?: string | null
  ): string {
    const fallback = docId || "?";
    const candidate =
      entry?.short_title ||
      entry?.zotero_title ||
      entry?.note_title ||
      (notePath ? path.basename(notePath, ".md") : "") ||
      fallback;
    return this.shortenCitationTitle(candidate);
  }

  private shortenCitationTitle(title: string): string {
    const normalized = String(title || "").trim();
    if (!normalized) {
      return "?";
    }
    if (normalized.length <= MAX_CITATION_TITLE_LENGTH) {
      return normalized;
    }
    const sliceLength = Math.max(0, MAX_CITATION_TITLE_LENGTH - 3);
    return `${normalized.slice(0, sliceLength).trim()}...`;
  }

  private formatCitationLabel(title: string, pageLabel: string): string {
    const base = title.trim() || "?";
    const page = (pageLabel || "").trim();
    if (!page) {
      return base;
    }
    return `${base}, p. ${page}`;
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
      let annotationPageLabel: string | undefined;
      let attachmentKey: string | undefined;
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
        if (!attachmentKey && typeof chunkMatch.attachment_key === "string") {
          attachmentKey = chunkMatch.attachment_key;
        }
        if (!annotationPageLabel && typeof chunkMatch.annotation_page_label === "string") {
          annotationPageLabel = chunkMatch.annotation_page_label;
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
      if (attachmentKey) {
        inferredCitation.attachment_key = attachmentKey;
      }
      if (annotationPageLabel) {
        inferredCitation.annotation_page_label = annotationPageLabel;
      }
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

      const effectiveAnnotationKey = citation.annotation_key || annotationKey;
      if (!citation.annotation_key && effectiveAnnotationKey) {
        citation = { ...citation, annotation_key: effectiveAnnotationKey };
      }
      if (!citation.attachment_key && attachmentKey) {
        citation = { ...citation, attachment_key: attachmentKey };
      }
      if (!citation.annotation_page_label && annotationPageLabel) {
        citation = { ...citation, annotation_page_label: annotationPageLabel };
      }

      const display = await this.resolveCitationDisplay(citation);
      const label = this.formatCitationLabel(display.noteTitle, display.pageLabel);
      const chunkId = this.normalizeChunkIdForNote(citation.chunk_id, docId);
      if (this.settings.preferObsidianNoteForCitations && display.notePath) {
        if (effectiveAnnotationKey) {
          const annotationAttachment =
            citation.attachment_key || attachmentKey || this.docIndex?.[docId]?.attachment_key || "";
          const pageToken = citation.page_start ? String(citation.page_start) : (pageStart || pageEnd || "0");
          const annotationLink = this.buildNoteAnnotationLink(
            display.notePath,
            effectiveAnnotationKey,
            annotationAttachment,
            pageToken,
            label
          );
          if (annotationLink) {
            replacements.set(token, annotationLink);
            continue;
          }
          replacements.set(token, this.buildNoteLink(display.notePath, label));
          continue;
        }
        if (chunkId && !effectiveAnnotationKey) {
          replacements.set(token, this.buildNoteChunkLink(display.notePath, chunkId, label));
          continue;
        }
      }
      if (display.zoteroUrl) {
        replacements.set(token, `[${label}](${display.zoteroUrl})`);
      } else {
        const fallbackLabel = this.formatCitationLabel(docId, display.pageLabel);
        replacements.set(token, `(${fallbackLabel})`);
      }
    }

    const parts: string[] = [];
    let lastIndex = 0;
    for (const match of matches) {
      const token = match[0];
      const index = match.index ?? 0;
      if (index < lastIndex) {
        continue;
      }
      parts.push(content.slice(lastIndex, index));
      const replacement = replacements.get(token) ?? token;
      const prevChar = index > 0 ? content[index - 1] : "";
      if (prevChar && !/\s/.test(prevChar) && !/[([{!]/.test(prevChar)) {
        parts.push(" ");
      }
      parts.push(replacement);
      lastIndex = index + token.length;
    }
    parts.push(content.slice(lastIndex));
    const result = parts.join("");
    // As a safety net, repair any truncated or unlabeled wiki links to zrr-chunk anchors
    // that could occur when some local providers truncate responses.
    return this.repairTruncatedWikilinks(result);
  }

  // Repairs common cases of truncated Obsidian wiki links produced after inline citation expansion.
  // Examples fixed:
  //   "[[zotero/notes/Foo#zrr-chunk:p1"           -> "[[zotero/notes/Foo#zrr-chunk:p1]]"
  //   "[[zotero/notes/Foo#zrr-chunk:p1]]"        -> "[[zotero/notes/Foo#zrr-chunk:p1\\|p1]]" (adds default label)
  private repairTruncatedWikilinks(text: string): string {
    if (!text || typeof text !== "string") {
      return text;
    }
    let next = text;
    // 1) Close any line-ending link that starts a zrr-chunk anchor but lacks closing ]] on that line
    //    We only touch links that clearly target a zrr-chunk to avoid false positives.
    next = next.replace(/\[\[([^\]\n#]+#zrr-chunk:[^\]\n|]+)(?=\n|$)/g, "[[$1]]");

    // 2) Ensure label is present for zrr-chunk links that have no explicit label
    //    i.e., convert [[path#zrr-chunk:ID]] -> [[path#zrr-chunk:ID\|LABEL]] where LABEL defaults to ID or page-like form
    next = next.replace(/\[\[([^\]\n#]+#zrr-chunk:([^\]\n|]+))\]\]/g, (_m, full, chunkId) => {
      const label = this.escapeWikiLabel(this.buildDefaultChunkLabel(String(chunkId || "").trim()));
      return `[[${full}\\|${label}]]`;
    });
    return next;
  }

  private buildDefaultChunkLabel(chunkId: string): string {
    const id = (chunkId || "").trim();
    const m = id.match(/^p(\d+)$/i);
    if (m) {
      return `p. ${m[1]}`;
    }
    return id || "source";
  }

  private handleDoclingProgress(payload: unknown, qualityLabel: string | null): void {
    const event = this.asRecord(payload);
    if (!event || event.type !== "progress") {
      return;
    }
    const percent = Number(event.percent);
    if (!Number.isFinite(percent)) {
      return;
    }
    const message =
      typeof event.message === "string" && event.message.trim()
        ? event.message
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
    const chunkId = this.normalizeChunkIdForNote(citation.chunk_id, citation.doc_id);
    const annotationKey = citation.annotation_key || this.extractAnnotationKey(citation.chunk_id);
    const preferNote = this.settings.preferObsidianNoteForCitations;
    if (preferNote && resolved.notePath) {
      if (annotationKey) {
        const attachmentKey =
          citation.attachment_key || this.docIndex?.[citation.doc_id || ""]?.attachment_key || "";
        const pageToken = citation.page_start
          ? String(citation.page_start)
          : (citation.page_end ? String(citation.page_end) : "0");
        const opened = await this.openNoteAtAnnotation(
          resolved.notePath,
          annotationKey,
          attachmentKey,
          pageToken
        );
        if (opened) {
          return;
        }
      }
      if (chunkId && !annotationKey) {
        const opened = await this.openNoteAtChunk(resolved.notePath, chunkId);
        if (opened) {
          return;
        }
      }
      await this.openNoteInMain(resolved.notePath);
      return;
    }
    if (resolved.zoteroUrl) {
      this.openExternalUrl(resolved.zoteroUrl);
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
      new Notice("No doc_ID provided.");
      return;
    }

    const rebuilt = await this.rebuildNoteFromCacheForDocId(docId, true);
    if (rebuilt) {
      new Notice(`Rebuilt Zotero note for ${docId}.`);
    }
  }

  private async reindexCurrentNoteFromCache(): Promise<void> {
    const file = this.app.workspace.getActiveFile();
    if (!file) {
      new Notice("No active note to reindex.");
      return;
    }
    await this.reindexNoteFromCacheForFile(file, true);
  }

  private async reindexNoteFromCacheForFile(file: TFile, showNotices: boolean): Promise<void> {
    try {
      const content = await this.app.vault.read(file);
      const docId = await this.resolveDocIdForNote(file, content);
      if (!docId) {
        if (showNotices) {
          new Notice("No doc_ID found for this note.");
        }
        return;
      }
      const ok = await this.reindexDocIdFromCache(docId, showNotices);
      if (ok && showNotices) {
        new Notice(`Reindexed ${docId}.`);
      }
    } catch (error) {
      if (showNotices) {
        new Notice("Failed to reindex note.");
      }
      console.error("Failed to reindex note", error);
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
          const shortTitle = extractShortTitleFromValues(values);
          if (shortTitle) {
            updates.short_title = shortTitle;
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
        if (typeof next.pdf_path === "string") {
          next.pdf_path = this.normalizeDocIndexPdfPath(next.pdf_path);
        }
        index[docId] = next;
      }

      const percent = Math.round((processed / docIds.length) * 100);
      this.showStatusProgress(`Rebuilding doc index ${processed}/${docIds.length}`, percent);
    }

    await this.saveDocIndex(index);
    const pruneResult = await this.pruneDocIndexOrphans();
    this.showStatusProgress("Done", 100);
    window.setTimeout(() => this.clearStatusProgress(), 1200);
    if (pruneResult.removed > 0) {
      new Notice(
        `Rebuilt doc index for ${docIds.length} items; pruned ${pruneResult.removed} stale entries.`
      );
    } else {
      new Notice(`Rebuilt doc index for ${docIds.length} items.`);
    }
  }

  public async recreateMissingNotesFromCache(): Promise<void> {
    if (this.recreateMissingNotesActive) {
      new Notice("Recreate missing notes is already running.");
      return;
    }
    this.recreateMissingNotesActive = true;
    this.recreateMissingNotesAbort = false;
    this.recreateMissingNotesProcess = null;
    try {
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
      const logPath = this.settings.enableFileLogging ? this.getLogFileAbsolutePath() : null;

      for (let i = 0; i < missing.length; i += 1) {
        if (this.recreateMissingNotesAbort) {
          break;
        }
        const docId = missing[i];
        const percent = Math.round(((i + 1) / missing.length) * 100);
        this.showStatusProgress(`Recreating ${i + 1}/${missing.length}`, percent);
        if (logPath) {
          void this.appendToLogFile(
            logPath,
            `Recreate missing note doc_id ${docId} (${i + 1}/${missing.length})`,
            "recreate_missing_notes",
            "INFO"
          );
        }
        const ok = await this.rebuildNoteFromCacheForDocId(docId, false);
        if (ok) {
          rebuilt += 1;
        }
      }

      if (this.recreateMissingNotesAbort) {
        this.showStatusProgress("Canceled", 100);
        window.setTimeout(() => this.clearStatusProgress(), 1200);
        new Notice(`Canceled after ${rebuilt}/${missing.length} notes.`);
      } else {
        this.showStatusProgress("Done", 100);
        window.setTimeout(() => this.clearStatusProgress(), 1200);
        new Notice(`Recreated ${rebuilt}/${missing.length} missing notes.`);
      }
    } finally {
      this.recreateMissingNotesActive = false;
      this.recreateMissingNotesProcess = null;
    }
  }

  public cancelRecreateMissingNotesFromCache(): void {
    if (!this.recreateMissingNotesActive) {
      new Notice("No recreate job is running.");
      return;
    }
    this.recreateMissingNotesAbort = true;
    const child = this.recreateMissingNotesProcess;
    if (child && !child.killed) {
      try {
        child.kill("SIGTERM");
      } catch (error) {
        console.warn("Failed to terminate recreate process", error);
      }
      window.setTimeout(() => {
        if (child && !child.killed) {
          try {
            child.kill("SIGKILL");
          } catch (err) {
            console.warn("Failed to force-kill recreate process", err);
          }
        }
      }, 2000);
    }
    new Notice("Canceling recreate missing notes...");
  }

  private buildRedisCommand(args: string[]): string {
    const parts = [`*${args.length}\r\n`];
    for (const arg of args) {
      const value = String(arg);
      parts.push(`$${Buffer.byteLength(value)}\r\n${value}\r\n`);
    }
    return parts.join("");
  }

  private async checkRedisConnectionWithUrl(
    redisUrl: string,
    timeoutMs = 2000
  ): Promise<{ ok: boolean; message?: string }> {
    const urlRaw = (redisUrl || "").trim();
    if (!urlRaw) {
      return { ok: false, message: "Redis URL is not configured." };
    }
    let url: URL;
    try {
      url = new URL(urlRaw);
    } catch {
      return { ok: false, message: "Redis URL is invalid." };
    }
    const host = url.hostname || "127.0.0.1";
    const port =
      Number(url.port) || (url.protocol === "rediss:" || url.protocol === "redis+tls:" ? 6380 : 6379);
    const username = decodeURIComponent(url.username || "");
    const password = decodeURIComponent(url.password || "");
    const useTls = url.protocol === "rediss:" || url.protocol === "redis+tls:";

    return new Promise((resolve) => {
      const socket = useTls
        ? tls.connect({ host, port, timeout: timeoutMs, rejectUnauthorized: false })
        : net.createConnection({ host, port, timeout: timeoutMs });
      let buffer = "";
      let stage: "auth" | "ping" = password || username ? "auth" : "ping";
      let resolved = false;

      const finish = (ok: boolean, message?: string): void => {
        if (resolved) {
          return;
        }
        resolved = true;
        try {
          socket.end();
          socket.destroy();
        } catch {
          // ignore
        }
        resolve({ ok, message });
      };

      const handleLine = (line: string): void => {
        const trimmed = line.trim();
        if (!trimmed) {
          return;
        }
        if (trimmed.startsWith("-NOAUTH")) {
          finish(false, "Redis requires authentication. Check your Redis URL credentials.");
          return;
        }
        if (trimmed.startsWith("-WRONGPASS") || trimmed.toLowerCase().includes("invalid password")) {
          finish(false, "Redis authentication failed. Check your Redis URL credentials.");
          return;
        }
        if (trimmed.startsWith("-ERR")) {
          finish(false, `Redis error: ${trimmed}`);
          return;
        }
        if (stage === "auth") {
          if (trimmed.startsWith("+OK")) {
            stage = "ping";
            buffer = "";
            socket.write(this.buildRedisCommand(["PING"]));
            return;
          }
          finish(false, `Redis auth failed: ${trimmed}`);
          return;
        }
        if (trimmed.startsWith("+PONG")) {
          finish(true);
        }
      };

      socket.on("connect", () => {
        if (stage === "auth") {
          const authArgs = username ? ["AUTH", username, password] : ["AUTH", password];
          socket.write(this.buildRedisCommand(authArgs));
        } else {
          socket.write(this.buildRedisCommand(["PING"]));
        }
      });

      socket.on("data", (data) => {
        buffer += data.toString();
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          handleLine(line);
        }
      });

      socket.on("timeout", () => {
        finish(false, "Timed out connecting to Redis.");
      });

      socket.on("error", (err) => {
        finish(false, `Redis connection failed: ${err.message}`);
      });

      socket.on("close", () => {
        if (!resolved) {
          finish(false, "Redis connection closed unexpectedly.");
        }
      });
    });
  }

  private async checkRedisConnection(timeoutMs = 2000): Promise<{ ok: boolean; message?: string }> {
    return this.checkRedisConnectionWithUrl(this.settings.redisUrl, timeoutMs);
  }

  private async ensureRedisAvailable(context: string): Promise<boolean> {
    const result = await this.checkRedisConnection();
    if (result.ok) {
      return true;
    }
    const message = result.message ? `Redis unavailable for ${context}: ${result.message}` : `Redis unavailable for ${context}.`;
    this.notifyContainerOnce(message);
    return false;
  }

  private getPythonErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message || String(error);
    }
    if (typeof error === "string") {
      return error;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  private classifyIndexingError(message: string): "chunks_missing" | "embed_dim_mismatch" | "embed_failure" | "unknown" {
    const text = message.toLowerCase();
    if (text.includes("embedding dim mismatch") || text.includes("dim mismatch")) {
      return "embed_dim_mismatch";
    }
    if (text.includes("chunks json not found")) {
      return "chunks_missing";
    }
    if (
      text.includes("embedding failed") ||
      text.includes("embedding request failed") ||
      text.includes("unloaded") ||
      text.includes("crashed") ||
      text.includes("model does not exist") ||
      text.includes("failed to load model") ||
      text.includes("connection refused") ||
      text.includes("econnrefused") ||
      text.includes("max retries exceeded") ||
      text.includes("failed to establish a new connection") ||
      text.includes("failed to fetch models")
    ) {
      return "embed_failure";
    }
    return "unknown";
  }

  private async confirmRebuildIndex(reason: string): Promise<boolean> {
    return new Promise((resolve) => {
      new ConfirmRebuildIndexModal(this.app, reason, resolve).open();
    });
  }

  private async confirmPurgeRedisOrphans(): Promise<boolean> {
    return new Promise((resolve) => {
      new ConfirmPurgeRedisOrphansModal(this.app, resolve).open();
    });
  }

  private async dropRedisIndex(dropDocs = false): Promise<void> {
    await this.ensureBundledTools();
    const pluginDir = this.getPluginDir();
    const script = path.join(pluginDir, "tools", "drop_redis_index.py");
    const args = ["--redis-url", this.settings.redisUrl, "--index", this.getRedisIndexName()];
    if (dropDocs) {
      args.push("--drop-docs");
    }
    await this.runPython(script, args);
  }

  private async dropAndRebuildRedisIndex(): Promise<void> {
    if (this.reindexCacheActive) {
      new Notice("Reindex already running.");
      return;
    }
    if (!(await this.ensureRedisAvailable("drop/rebuild"))) {
      return;
    }
    const confirmed = await this.confirmRebuildIndex(
      "This will remove the current RedisSearch index and rebuild it from cached chunks."
    );
    if (!confirmed) {
      return;
    }
    try {
      await this.dropRedisIndex(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("Unknown Index name") || message.includes("Unknown index name")) {
        console.warn("Redis index missing; skipping drop step.");
      } else {
        console.error("Failed to drop Redis index", error);
        new Notice("Failed to drop redis index. See console for details.");
        return;
      }
    }
    await this.reindexRedisFromCache();
  }

  private async purgeRedisOrphanedKeys(): Promise<void> {
    if (!(await this.ensureRedisAvailable("purge orphans"))) {
      return;
    }
    const confirmed = await this.confirmPurgeRedisOrphans();
    if (!confirmed) {
      return;
    }
    try {
      await this.ensureBundledTools();
    } catch (error) {
      new Notice("Failed to sync bundled tools. See console for details.");
      console.error(error);
      return;
    }
    const pluginDir = this.getPluginDir();
    const script = path.join(pluginDir, "tools", "purge_redis_orphans.py");
    const args = [
      "--redis-url",
      this.settings.redisUrl,
      "--key-prefix",
      this.getRedisKeyPrefix(),
      "--chunk-dir",
      this.getAbsoluteVaultPath(CHUNK_CACHE_DIR),
      "--item-dir",
      this.getAbsoluteVaultPath(ITEM_CACHE_DIR),
    ];
    try {
      const output = await this.runPythonWithOutput(script, args);
      let payload: unknown = null;
      try {
        payload = output ? JSON.parse(output) : null;
      } catch (error) {
        console.warn("Failed to parse purge output", error);
      }
      if (!payload) {
        new Notice("Purge completed. See console for details.");
        return;
      }
      const stats = this.asRecord(payload) ?? {};
      const keysScanned = Number(stats.keys_scanned ?? 0);
      const keysDeleted = Number(stats.keys_deleted ?? 0);
      const docsChecked = Number(stats.docs_checked ?? 0);
      const orphanDocCount = Number(stats.orphan_doc_count ?? 0);
      const lines = [
        `Keys scanned: ${keysScanned}`,
        `Keys deleted: ${keysDeleted}`,
        `Docs checked: ${docsChecked}`,
        `Orphan docs: ${orphanDocCount}`,
      ];
      const pruneResult = await this.pruneDocIndexOrphans();
      lines.push(`Doc index entries removed: ${pruneResult.removed}`);
      if (pruneResult.updated > 0) {
        lines.push(`Doc index entries updated: ${pruneResult.updated}`);
      }
      const sample = Array.isArray(stats.sample_orphan_doc_ids)
        ? stats.sample_orphan_doc_ids.filter(Boolean)
        : [];
      if (sample.length) {
        lines.push("", "Sample doc_ids:", ...sample.map((docId: string) => `- ${docId}`));
      }
      new OutputModal(this.app, "Redis orphan purge", lines.join("\n")).open();
      if (keysDeleted === 0) {
        new Notice("No orphaned redis keys found.");
      } else {
        new Notice(`Deleted ${keysDeleted} Redis keys.`);
      }
    } catch (error) {
      console.error("Failed to purge Redis orphans", error);
      new Notice("Failed to purge redis orphans. See console for details.");
    }
  }

  public async reindexRedisFromCache(): Promise<boolean> {
    this.lastReindexFailure = null;
    if (this.reindexCacheActive) {
      new Notice("Reindex already running.");
      this.lastReindexFailure = "busy";
      return false;
    }
    this.reindexCacheActive = true;
    let abortReason: { kind: "embed_dim_mismatch" | "embed_failure"; message: string } | null = null;
    let failures = 0;
    try {
      await this.ensureBundledTools();
    } catch (error) {
      new Notice("Failed to sync bundled tools. See console for details.");
      console.error(error);
      this.reindexCacheActive = false;
      this.lastReindexFailure = "tools_error";
      return false;
    }
    if (!(await this.ensureRedisAvailable("reindex"))) {
      this.reindexCacheActive = false;
      this.lastReindexFailure = "redis_unavailable";
      return false;
    }

    const chunkDocIds = await this.listDocIds(CHUNK_CACHE_DIR);
    if (chunkDocIds.length === 0) {
      new Notice("No cached chunks found.");
      this.reindexCacheActive = false;
      this.lastReindexFailure = "no_cache";
      return false;
    }

    const pluginDir = this.getPluginDir();
    const indexScript = path.join(pluginDir, "tools", "index_redisearch.py");
    const logPath = this.settings.enableFileLogging ? this.getLogFileAbsolutePath() : null;
    let processed = 0;

    this.showStatusProgress("Reindexing cached chunks...", 0);
    if (logPath) {
      void this.appendToLogFile(
        logPath,
        `Reindex started: ${chunkDocIds.length} cached items`,
        "index_redisearch",
        "INFO"
      );
    }

    for (const docId of chunkDocIds) {
      processed += 1;
      const percent = Math.round((processed / chunkDocIds.length) * 100);
      this.showStatusProgress(`Reindexing ${processed}/${chunkDocIds.length}`, percent);

      const chunkPath = normalizePath(`${CHUNK_CACHE_DIR}/${docId}.json`);
      try {
        const indexArgs = [
          "--chunks-json",
          this.getAbsoluteVaultPath(chunkPath),
          "--redis-url",
          this.settings.redisUrl,
          "--index",
          this.getRedisIndexName(),
          "--prefix",
          this.getRedisKeyPrefix(),
          "--embed-base-url",
          this.settings.embedBaseUrl,
          "--embed-api-key",
          this.settings.embedApiKey,
          "--embed-model",
          this.settings.embedModel,
          "--upsert",
          "--progress",
        ];
        this.appendEmbedSubchunkArgs(indexArgs);
        this.appendEmbedContextArgs(indexArgs);
        if (this.settings.embedIncludeMetadata) {
          indexArgs.push("--embed-include-metadata");
        }
        this.appendChunkTaggingArgs(indexArgs, { allowRegenerate: false });
        if (logPath) {
          void this.appendToLogFile(
            logPath,
            `Reindexing doc_id ${docId}`,
            "index_redisearch",
            "INFO"
          );
        }
        await this.runPythonStreaming(
          indexScript,
          indexArgs,
          (payload) => {
            const event = this.asRecord(payload);
            if (!logPath || !event) {
              return;
            }
            if (event.type === "progress" && event.message) {
              const progressMessage = typeof event.message === "string" ? event.message : "";
              if (!progressMessage) {
                return;
              }
              void this.appendToLogFile(
                logPath,
                progressMessage,
                "index_redisearch",
                "INFO"
              );
            }
          },
          () => undefined,
          logPath,
          "index_redisearch"
        );
      } catch (error) {
        failures += 1;
        const message = this.getPythonErrorMessage(error);
        const classification = this.classifyIndexingError(message);
        console.error(`Failed to reindex ${docId}`, error);
        if (classification === "chunks_missing") {
          new Notice(`Chunks cache missing for ${docId}. Reimport or rebuild this note.`);
          continue;
        }
        if (classification === "embed_dim_mismatch") {
          abortReason = {
            kind: "embed_dim_mismatch",
            message,
          };
          break;
        }
        if (classification === "embed_failure") {
          abortReason = {
            kind: "embed_failure",
            message,
          };
          break;
        }
      }
    }

    if (abortReason) {
      this.showStatusProgress("Aborted", 100);
      window.setTimeout(() => this.clearStatusProgress(), 1200);
      this.reindexCacheActive = false;
      if (abortReason.kind === "embed_dim_mismatch") {
        const confirmed = await this.confirmRebuildIndex(
          "Embedding model output dimension does not match the Redis index schema."
        );
        if (confirmed) {
          try {
            await this.dropRedisIndex(true);
            return await this.reindexRedisFromCache();
          } catch (dropError) {
            new Notice("Failed to drop/rebuild the redis index. See console for details.");
            console.error(dropError);
            this.lastReindexFailure = "unknown";
            return false;
          }
        }
        this.lastReindexFailure = "embed_dim_mismatch";
      } else {
        new Notice(
          "Embedding provider error detected. Fix the provider/model settings and rerun reindexing."
        );
        this.lastReindexFailure = "embed_failure";
      }
      return false;
    }

    this.showStatusProgress("Done", 100);
    window.setTimeout(() => this.clearStatusProgress(), 1200);
    if (failures === 0) {
      new Notice(`Reindexed ${chunkDocIds.length} cached items.`);
    } else {
      new Notice(`Reindexed ${chunkDocIds.length - failures}/${chunkDocIds.length} items (see console).`);
    }
    try {
      await this.pruneDocIndexOrphans();
    } catch (error) {
      console.warn("Failed to prune doc index orphans", error);
    }
    this.reindexCacheActive = false;
    this.lastReindexFailure = null;
    return true;
  }

  private async reindexDocIdFromCache(docId: string, showNotices: boolean): Promise<boolean> {
    this.lastReindexFailure = null;
    if (this.reindexCacheActive) {
      if (showNotices) {
        new Notice("Reindex already running.");
      }
      this.lastReindexFailure = "busy";
      return false;
    }
    this.reindexCacheActive = true;
    try {
      await this.ensureBundledTools();
    } catch (error) {
      if (showNotices) {
        new Notice("Failed to sync bundled tools. See console for details.");
      }
      console.error(error);
      this.reindexCacheActive = false;
      this.lastReindexFailure = "tools_error";
      return false;
    }
    if (!(await this.ensureRedisAvailable("reindex"))) {
      this.reindexCacheActive = false;
      this.lastReindexFailure = "redis_unavailable";
      return false;
    }

    const chunkPath = normalizePath(`${CHUNK_CACHE_DIR}/${docId}.json`);
    const adapter = this.app.vault.adapter;
    if (!(await adapter.exists(chunkPath))) {
      if (showNotices) {
        new Notice(`Chunks cache missing for ${docId}.`);
      }
      this.reindexCacheActive = false;
      this.lastReindexFailure = "no_cache";
      return false;
    }

    const pluginDir = this.getPluginDir();
    const indexScript = path.join(pluginDir, "tools", "index_redisearch.py");
    const logPath = this.settings.enableFileLogging ? this.getLogFileAbsolutePath() : null;

    this.showStatusProgress(`Reindexing ${docId}...`, 0);
    if (logPath) {
      void this.appendToLogFile(logPath, `Reindexing doc_id ${docId}`, "index_redisearch", "INFO");
    }

    try {
      const indexArgs = [
        "--chunks-json",
        this.getAbsoluteVaultPath(chunkPath),
        "--redis-url",
        this.settings.redisUrl,
        "--index",
        this.getRedisIndexName(),
        "--prefix",
        this.getRedisKeyPrefix(),
        "--embed-base-url",
        this.settings.embedBaseUrl,
        "--embed-api-key",
        this.settings.embedApiKey,
        "--embed-model",
        this.settings.embedModel,
        "--upsert",
        "--progress",
      ];
      this.appendEmbedSubchunkArgs(indexArgs);
      this.appendEmbedContextArgs(indexArgs);
      if (this.settings.embedIncludeMetadata) {
        indexArgs.push("--embed-include-metadata");
      }
      this.appendChunkTaggingArgs(indexArgs, { allowRegenerate: false });
      await this.runPythonStreaming(
        indexScript,
        indexArgs,
        (payload) => {
          const event = this.asRecord(payload);
          const total = typeof event?.total === "number" ? event.total : 0;
          const current = typeof event?.current === "number" ? event.current : 0;
          if (event?.type === "progress" && total > 0) {
            const percent = Math.round((current / total) * 100);
            const message =
              typeof event.message === "string" && event.message.trim()
                ? event.message
                : `Indexing chunks ${current}/${total}`;
            this.showStatusProgress(this.formatStatusLabel(message), percent);
          }
        },
        () => undefined,
        logPath,
        "index_redisearch"
      );
    } catch (error) {
      const message = this.getPythonErrorMessage(error);
      const classification = this.classifyIndexingError(message);
      console.error(`Failed to reindex ${docId}`, error);
      if (classification === "embed_dim_mismatch") {
        this.lastReindexFailure = "embed_dim_mismatch";
        if (showNotices) {
          const confirmed = await this.confirmRebuildIndex(
            "Embedding model output dimension does not match the Redis index schema."
          );
          if (confirmed) {
            try {
              await this.dropRedisIndex(true);
              this.reindexCacheActive = false;
              return await this.reindexRedisFromCache();
            } catch (dropError) {
              new Notice("Failed to drop/rebuild the redis index. See console for details.");
              console.error(dropError);
              this.lastReindexFailure = "unknown";
            }
          }
        }
      } else if (classification === "embed_failure") {
        this.lastReindexFailure = "embed_failure";
        if (showNotices) {
          new Notice(
            "Embedding provider error detected. Fix the provider/model settings and rerun reindexing."
          );
        }
      } else if (showNotices) {
        new Notice(`Failed to reindex ${docId}. See console for details.`);
      }
      this.showStatusProgress("Failed", 100);
      window.setTimeout(() => this.clearStatusProgress(), 1200);
      this.reindexCacheActive = false;
      return false;
    }

    this.showStatusProgress("Done", 100);
    window.setTimeout(() => this.clearStatusProgress(), 1200);
    this.reindexCacheActive = false;
    return true;
  }

  private async reindexChunkUpdates(
    docId: string,
    chunkPath: string,
    chunkIds: string[],
    deleteIds: string[]
  ): Promise<void> {
    if (!chunkIds.length && !deleteIds.length) {
      return;
    }
    if (!(await this.ensureRedisAvailable("reindex updates"))) {
      return;
    }
    const pluginDir = this.getPluginDir();
    const indexScript = path.join(pluginDir, "tools", "index_redisearch.py");
    const args = [
      "--chunks-json",
      this.getAbsoluteVaultPath(chunkPath),
      "--redis-url",
      this.settings.redisUrl,
      "--index",
      this.getRedisIndexName(),
      "--prefix",
      this.getRedisKeyPrefix(),
      "--embed-base-url",
      this.settings.embedBaseUrl,
      "--embed-api-key",
      this.settings.embedApiKey,
      "--embed-model",
      this.settings.embedModel,
      "--upsert",
    ];
    this.appendEmbedSubchunkArgs(args);
    this.appendEmbedContextArgs(args);
    if (this.settings.embedIncludeMetadata) {
      args.push("--embed-include-metadata");
    }
    this.appendChunkTaggingArgs(args, { allowRegenerate: false });
    if (chunkIds.length) {
      args.push("--chunk-ids", chunkIds.join(","));
    }
    if (deleteIds.length) {
      args.push("--delete-chunk-ids", deleteIds.join(","));
    }

    try {
      await this.runPython(indexScript, args);
    } catch (error) {
      const message = this.getPythonErrorMessage(error);
      const classification = this.classifyIndexingError(message);
      console.error(`Failed to reindex updated chunks for ${docId}`, error);
      if (classification === "embed_dim_mismatch") {
        const confirmed = await this.confirmRebuildIndex(
          "Embedding model output dimension does not match the Redis index schema."
        );
        if (confirmed) {
          try {
            await this.dropRedisIndex(true);
            await this.reindexRedisFromCache();
          } catch (dropError) {
            new Notice("Failed to drop/rebuild the redis index. See console for details.");
            console.error(dropError);
          }
        }
        return;
      }
      if (classification === "embed_failure") {
        new Notice("Embedding provider error detected. Fix the provider/model settings and rerun.");
      }
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

  private getZoteroFrontmatterKeyVariants(baseKey: string): string[] {
    const preferred = baseKey.replace(/_/g, " ");
    const variants = new Set<string>([preferred, baseKey, baseKey.replace(/_/g, "-")]);
    if (baseKey.includes("_")) {
      const parts = baseKey.split("_");
      const camel = parts[0] + parts.slice(1).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("");
      variants.add(camel);
    }
    return Array.from(variants);
  }

  private getFrontmatterValue(frontmatter: Record<string, unknown> | null | undefined, baseKey: string): unknown {
    if (!frontmatter) {
      return undefined;
    }
    const variants = this.getZoteroFrontmatterKeyVariants(baseKey);
    for (const key of variants) {
      if (Object.prototype.hasOwnProperty.call(frontmatter, key)) {
        return (frontmatter)[key];
      }
    }
    return undefined;
  }

  private hasFrontmatterKey(frontmatter: Record<string, unknown> | null | undefined, baseKey: string): boolean {
    if (!frontmatter) {
      return false;
    }
    const variants = this.getZoteroFrontmatterKeyVariants(baseKey);
    for (const key of variants) {
      if (Object.prototype.hasOwnProperty.call(frontmatter, key)) {
        return true;
      }
    }
    return false;
  }

  private normalizeZoteroFrontmatterKeys(frontmatter: Record<string, unknown>): boolean {
    let changed = false;
    for (const baseKey of ZOTERO_FRONTMATTER_BASE_KEYS) {
      const preferred = baseKey.replace(/_/g, " ");
      const variants = this.getZoteroFrontmatterKeyVariants(baseKey);
      const hasPreferred = Object.prototype.hasOwnProperty.call(frontmatter, preferred);
      let value = hasPreferred ? frontmatter[preferred] : undefined;
      if (!hasPreferred) {
        for (const key of variants) {
          if (key === preferred) {
            continue;
          }
          if (Object.prototype.hasOwnProperty.call(frontmatter, key)) {
            value = frontmatter[key];
            break;
          }
        }
      }
      if (value === undefined) {
        continue;
      }
      if (!hasPreferred) {
        frontmatter[preferred] = value;
        changed = true;
      }
      for (const key of variants) {
        if (key === preferred) {
          continue;
        }
        if (Object.prototype.hasOwnProperty.call(frontmatter, key)) {
          delete frontmatter[key];
          changed = true;
        }
      }
    }
    return changed;
  }

  private async normalizeZoteroFrontmatterKeysInFile(file: TFile): Promise<void> {
    const cache = this.app.metadataCache.getFileCache(file);
    const frontmatter = cache?.frontmatter;
    if (!frontmatter) {
      return;
    }
    const hasDocId = this.getFrontmatterValue(frontmatter, "doc_id");
    const hasZoteroKey = this.getFrontmatterValue(frontmatter, "zotero_key");
    if (!hasDocId && !hasZoteroKey) {
      return;
    }
    const probe = { ...frontmatter };
    if (!this.normalizeZoteroFrontmatterKeys(probe)) {
      return;
    }
    const notePath = file.path;
    this.noteSyncSuppressed.add(notePath);
    this.noteMetadataSyncSuppressed.add(notePath);
    try {
      await this.app.fileManager.processFrontMatter(file, (fm) => {
        this.normalizeZoteroFrontmatterKeys(fm);
      });
    } catch (error) {
      console.warn("Failed to normalize Zotero frontmatter keys", error);
    } finally {
      window.setTimeout(() => {
        this.noteSyncSuppressed.delete(notePath);
        this.noteMetadataSyncSuppressed.delete(notePath);
      }, 1500);
    }
  }

  private normalizeFrontmatterKeySpacing(frontmatter: string): string {
    if (!frontmatter.trim()) {
      return frontmatter;
    }
    const lines = frontmatter.split(/\r?\n/);
    const cleaned = lines.map((line) => {
      if (/^\s+-\s+/.test(line) || !line.includes(":")) {
        return line;
      }
      const leading = line.match(/^\s*/)?.[0] ?? "";
      if (leading) {
        return line;
      }
      const colonIndex = line.indexOf(":");
      if (colonIndex <= 0) {
        return line;
      }
      const key = line.slice(0, colonIndex).trim();
      const rest = line.slice(colonIndex);
      for (const baseKey of ZOTERO_FRONTMATTER_BASE_KEYS) {
        const preferred = baseKey.replace(/_/g, " ");
        const variants = this.getZoteroFrontmatterKeyVariants(baseKey);
        if (variants.includes(key)) {
          return `${preferred}${rest}`;
        }
      }
      return line;
    });
    return cleaned.join("\n");
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
      if (
        key !== "doc_id"
        && key !== "doc id"
        && key !== "doc-id"
        && key !== "zotero_key"
        && key !== "zotero key"
        && key !== "zotero-key"
      ) {
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

  private hasDocIdFieldInFrontmatter(content: string): boolean {
    const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!match) {
      return false;
    }
    return /^\s*doc(?:[_\s-]?id)\s*:/im.test(match[1]);
  }

  private ensureDocIdInFrontmatter(frontmatter: string, docId: string): string {
    const trimmed = frontmatter.trim();
    const docLine = `doc id: ${this.escapeYamlString(docId)}`;
    if (!trimmed) {
      return docLine;
    }
    if (/^\s*doc(?:[_\s-]?id)\s*:/im.test(trimmed)) {
      return trimmed;
    }
    return `${docLine}\n${trimmed}`;
  }

  private ensureDocIdInNoteContent(content: string, docId: string): string {
    const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
    const docLine = `doc id: ${this.escapeYamlString(docId)}`;
    if (!match) {
      return `---\n${docLine}\n---\n\n${content.trimStart()}`;
    }
    const body = match[1] ?? "";
    const lines = body.split(/\r?\n/);
    let replaced = false;
    const nextLines = lines.map((line) => {
      if (/^\s*doc(?:[_\s-]?id)\s*:/i.test(line)) {
        replaced = true;
        return docLine;
      }
      return line;
    });
    if (!replaced) {
      nextLines.unshift(docLine);
    }
    const nextBody = nextLines.join("\n").trim();
    const startIndex = match.index ?? 0;
    const prefix = content.slice(0, startIndex);
    const suffix = content.slice(startIndex + match[0].length).replace(/^\n+/, "");
    return `${prefix}---\n${nextBody}\n---\n${suffix}`;
  }

  private async findDocIdByNotePath(notePath: string): Promise<string | null> {
    const normalized = normalizePath(notePath);
    const index = await this.getDocIndex();
    for (const [docId, entry] of Object.entries(index)) {
      if (!entry?.note_path) {
        continue;
      }
      if (normalizePath(entry.note_path) === normalized) {
        return docId;
      }
    }
    return null;
  }

  private async resolveDocIdForNote(file: TFile, content: string): Promise<string | null> {
    const frontmatterDocId = this.extractDocIdFromFrontmatter(content);
    const hasDocIdField = this.hasDocIdFieldInFrontmatter(content);
    if (frontmatterDocId && hasDocIdField) {
      return frontmatterDocId;
    }

    const syncDocId = this.extractDocIdFromSyncMarker(content);
    const cacheDocId = await this.findDocIdByNotePath(file.path);
    const resolved = frontmatterDocId || syncDocId || cacheDocId;
    if (!resolved) {
      const hasSyncMarker = ZRR_SYNC_START_RE.test(content);
      if (hasSyncMarker && !this.missingDocIdWarned.has(file.path)) {
        new Notice("This Zotero note is missing a doc_ID in frontmatter. Reimport or add doc_ID manually.");
        this.missingDocIdWarned.add(file.path);
      }
      return null;
    }

    if (!hasDocIdField || !frontmatterDocId) {
      const updated = this.ensureDocIdInNoteContent(content, resolved);
      if (updated !== content) {
        await this.writeNoteWithSyncSuppressed(file.path, updated);
      }
    }
    return resolved;
  }

  private async scanNotesForDocIds(folderPath: string): Promise<Record<string, DocIndexEntry>> {
    const adapter = this.app.vault.adapter;
    const files = await this.listMarkdownFiles(folderPath);
    const result: Record<string, DocIndexEntry> = {};

    for (const file of files) {
      try {
        const content = await adapter.read(file);
        const docId =
          this.extractDocIdFromFrontmatter(content) ?? this.extractDocIdFromSyncMarker(content);
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
    statusBar.hide();
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
    this.statusBarEl.show();
    this.statusLabelEl.setText(label);
    if (percent === null) {
      this.statusBarInnerEl.addClass("indeterminate");
      this.statusBarInnerEl.addClass("zrr-status-bar-inner--indeterminate-width");
      this.statusBarInnerEl.removeClass("zrr-status-bar-inner--zero-width");
    } else {
      this.statusBarInnerEl.removeClass("indeterminate");
      this.statusBarInnerEl.removeClass("zrr-status-bar-inner--indeterminate-width");
      this.statusBarInnerEl.removeClass("zrr-status-bar-inner--zero-width");
      const clamped = Math.max(0, Math.min(100, percent));
      this.statusBarInnerEl.style.setProperty("width", `${clamped}%`);
    }
  }

  private clearStatusProgress(): void {
    if (!this.statusBarEl || !this.statusBarInnerEl) {
      return;
    }
    this.statusBarEl.hide();
    this.statusBarInnerEl.removeClass("indeterminate");
    this.statusBarInnerEl.removeClass("zrr-status-bar-inner--indeterminate-width");
    this.statusBarInnerEl.addClass("zrr-status-bar-inner--zero-width");
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
      const quality =
        payload?.metadata?.effective_confidence_proxy ?? payload?.metadata?.confidence_proxy;
      if (typeof quality === "number") {
        return quality.toFixed(2);
      }
    } catch (error) {
      console.warn("Failed to read Docling quality metadata", error);
    }
    return null;
  }

  private async readDoclingMetadata(chunkPath: string): Promise<Record<string, unknown> | null> {
    try {
      const content = await this.app.vault.adapter.read(chunkPath);
      const payload = JSON.parse(content);
      const metadata = payload?.metadata;
      if (metadata && typeof metadata === "object") {
        return metadata;
      }
    } catch (error) {
      console.warn("Failed to read Docling metadata", error);
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
      const logPath = this.settings.enableFileLogging ? this.getLogFileAbsolutePath() : null;
      if (logPath) {
        args.push("--log-file", logPath);
      }
      if (this.settings.ocrMode === "force_low_quality") {
        args.push("--force-ocr-low-quality");
      }
      args.push("--quality-threshold", String(this.settings.ocrQualityThreshold));
      if (languageHint) {
        args.push("--language-hint", languageHint);
      }
      const output = await this.runPythonWithOutput(doclingScript, args, logPath);
      const payload = JSON.parse(output);
      const quality = payload?.effective_confidence_proxy ?? payload?.confidence_proxy;
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
    addIcon("zrr-pdf", ZRR_PDF_ICON);

    const pickerButton = this.addRibbonIcon(
      "zrr-picker",
      "Import Zotero item and index",
      () => this.importZoteroItem()
    );
    pickerButton.addClass("zrr-ribbon-picker");

    const chatButton = this.addRibbonIcon(
      "zrr-chat",
      "Open Zotero research assistant chat",
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
      console.debug("Language selection canceled.");
      return null;
    }
    const trimmed = this.normalizeZoteroLanguage(selected);
    if (!trimmed) {
      console.debug("Language selection empty; skipping Zotero update.");
      return "";
    }
    values.language = trimmed;
    console.debug("Language selected", { language: trimmed, itemKey });
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

  private async fetchZoteroItem(itemKey: string): Promise<unknown> {
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

  private async fetchZoteroItemCsl(itemKey: string): Promise<Record<string, unknown> | null> {
    try {
      const url = this.buildZoteroUrl(
        `/${this.getZoteroLibraryPath()}/items/${itemKey}?format=csljson`
      );
      const payload = await this.requestLocalApi(url, `Zotero CSL fetch failed for ${url}`);
      return this.parseCslPayload(payload);
    } catch (error) {
      console.warn("Failed to fetch Zotero CSL from local API", error);
      if (this.canUseWebApi()) {
        return this.fetchZoteroItemCslWeb(itemKey);
      }
      return null;
    }
  }

  private async fetchZoteroCollectionTitle(collectionKey: string): Promise<string> {
    const key = (collectionKey || "").trim();
    if (!key) {
      return "";
    }
    const cached = this.collectionTitleCache.get(key);
    if (cached !== undefined) {
      return cached;
    }
    const url = this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/collections/${key}`);
    try {
      const payload = await this.requestLocalApi(url, `Zotero collection fetch failed for ${url}`);
      const parsed = JSON.parse(payload.toString("utf8"));
      const title = String(parsed?.data?.name ?? parsed?.name ?? "").trim();
      this.collectionTitleCache.set(key, title);
      return title;
    } catch {
      if (!this.canUseWebApi()) {
        this.collectionTitleCache.set(key, "");
        return "";
      }
      try {
        const webUrl = this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/collections/${key}`);
        const payload = await this.requestWebApi(webUrl, `Zotero Web API collection fetch failed for ${webUrl}`);
        const parsed = JSON.parse(payload.toString("utf8"));
        const title = String(parsed?.data?.name ?? parsed?.name ?? "").trim();
        this.collectionTitleCache.set(key, title);
        return title;
      } catch (webError) {
        console.warn("Failed to fetch Zotero collection title", webError);
        this.collectionTitleCache.set(key, "");
        return "";
      }
    }
  }

  private async resolveCollectionTitles(values: ZoteroItemValues): Promise<string[]> {
    const raw = Array.isArray(values.collections) ? values.collections : [];
    const keys = raw.map((entry) => String(entry || "").trim()).filter(Boolean);
    if (!keys.length) {
      return [];
    }
    const titles: string[] = [];
    for (const key of keys) {
      const title = await this.fetchZoteroCollectionTitle(key);
      if (title) {
        titles.push(title);
      }
    }
    return titles;
  }

  private async fetchZoteroItemWeb(itemKey: string): Promise<unknown> {
    try {
      const url = this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/items/${itemKey}`);
      const payload = await this.requestWebApi(url, `Zotero Web API fetch failed for ${url}`);
      return JSON.parse(payload.toString("utf8"));
    } catch (error) {
      console.warn("Failed to fetch Zotero item from Web API", error);
      return null;
    }
  }

  private async fetchZoteroItemCslWeb(itemKey: string): Promise<Record<string, unknown> | null> {
    try {
      const url = this.buildWebApiUrl(
        `/${this.getWebApiLibraryPath()}/items/${itemKey}?format=csljson`
      );
      const payload = await this.requestWebApi(url, `Zotero Web API CSL fetch failed for ${url}`);
      return this.parseCslPayload(payload);
    } catch (error) {
      console.warn("Failed to fetch Zotero CSL from Web API", error);
      return null;
    }
  }

  private parseCslPayload(payload: Buffer): Record<string, unknown> | null {
    try {
      const parsed = JSON.parse(payload.toString("utf8"));
      if (Array.isArray(parsed)) {
        return typeof parsed[0] === "object" && parsed[0] ? parsed[0] : null;
      }
      if (typeof parsed === "object" && parsed) {
        return parsed as Record<string, unknown>;
      }
      return null;
    } catch (error) {
      console.warn("Failed to parse CSL payload", error);
      return null;
    }
  }

  private async searchZoteroItemsWeb(query: string): Promise<ZoteroLocalItem[]> {
    const trimmedQuery = query.trim();
    // Web API does not accept `meta` in `include` for item listings.
    const includeOptions = ["data"];
    for (const include of includeOptions) {
      const params = new URLSearchParams();
      params.set("itemType", "-attachment");
      params.set("limit", "25");
      params.set("include", include);
      if (trimmedQuery) {
        params.set("q", trimmedQuery);
      } else {
        params.set("sort", "dateAdded");
        params.set("direction", "desc");
      }
      const url = this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/items/top?${params.toString()}`);
      try {
        const payload = await this.requestWebApi(url, `Zotero Web API search failed for ${url}`);
        const parsed = JSON.parse(payload.toString("utf8"));
        if (!Array.isArray(parsed)) {
          return [];
        }
        return this.normalizeZoteroSearchResults(parsed);
      } catch (error) {
        console.warn("Failed to search Zotero via web API", error);
      }
    }
    return [];
  }

  private normalizeZoteroSearchResults(rawItems: unknown[]): ZoteroLocalItem[] {
    return rawItems
      .map((entry) => {
        const item = this.asRecord(entry) ?? {};
        const data = this.asRecord(item.data) ?? {};
        const meta = this.asRecord(item.meta) ?? {};
        const keyValue = item.key ?? data.key;
        return {
          key: typeof keyValue === "string" ? keyValue : "",
          data,
          meta,
        };
      })
      .filter((item) => this.isImportableZoteroResult(item));
  }

  private isImportableZoteroResult(item: ZoteroLocalItem): boolean {
    const key = typeof item.key === "string" ? item.key.trim() : "";
    if (!key) {
      return false;
    }
    const itemType = typeof item.data?.itemType === "string" ? item.data.itemType.trim().toLowerCase() : "";
    if (itemType === "attachment" || itemType === "note" || itemType === "annotation") {
      return false;
    }
    const title = typeof item.data?.title === "string" ? item.data.title.trim() : "";
    if (!title) {
      return false;
    }
    return true;
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
      console.debug("Local Zotero write failed; trying Web API", { itemKey, reason: message });
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

    console.debug("Zotero language PUT", { url, itemKey, language });
    try {
      const response = await this.requestLocalApiWithBody(
        url,
        "PUT",
        payload,
        headers,
        `Zotero update failed for ${url}`
      );
      console.debug("Zotero language PUT response", { status: response.statusCode });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("status 501")) {
        throw error;
      }
      const postUrl = this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items`);
      console.debug("Zotero language PUT unsupported; trying POST", { postUrl });
      const response = await this.requestLocalApiWithBody(
        postUrl,
        "POST",
        [payload],
        headers,
        `Zotero update failed for ${postUrl}`
      );
      console.debug("Zotero language POST response", { status: response.statusCode });
    }

    const refreshed = this.asRecord(await this.fetchZoteroItem(itemKey));
    const refreshedData = this.asRecord(refreshed?.data);
    const persisted = this.normalizeZoteroLanguage(
      typeof refreshedData?.language === "string" ? refreshedData.language : ""
    );
    if (persisted === this.normalizeZoteroLanguage(language)) {
      return;
    }

    const updatedValues = { ...(refreshedData ?? values), language };
    const wrapper = {
      key: itemKey,
      version: refreshedData?.version ?? refreshed?.version ?? version,
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
    console.debug("Zotero language PUT retry response", { status: retryResponse.statusCode });

    const finalItem = this.asRecord(await this.fetchZoteroItem(itemKey));
    const finalData = this.asRecord(finalItem?.data);
    const finalLanguage = this.normalizeZoteroLanguage(
      typeof finalData?.language === "string" ? finalData.language : ""
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
    const current = this.asRecord(await this.fetchZoteroItemWeb(itemKey));
    const currentData = this.asRecord(current?.data);
    const payload = { ...(currentData ?? values), language };
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Zotero-API-Version": "3",
      "Zotero-API-Key": this.settings.webApiKey,
    };
    const version = currentData?.version ?? current?.version ?? values?.version;
    const numericVersion = typeof version === "number" ? version : Number(version);
    if (!Number.isNaN(numericVersion)) {
      headers["If-Unmodified-Since-Version"] = String(numericVersion);
    }

    console.debug("Zotero Web API language PUT", { url, itemKey, language });
    const response = await this.requestWebApiWithBody(
      url,
      "PUT",
      payload,
      headers,
      `Zotero Web API update failed for ${url}`
    );
    console.debug("Zotero Web API language PUT response", { status: response.statusCode });

    const refreshed = this.asRecord(await this.fetchZoteroItemWeb(itemKey));
    const refreshedData = this.asRecord(refreshed?.data);
    const persisted = this.normalizeZoteroLanguage(
      typeof refreshedData?.language === "string" ? refreshedData.language : ""
    );
    if (persisted !== this.normalizeZoteroLanguage(language)) {
      throw new Error("Language update did not persist in Zotero Web API.");
    }
  }

  private async updateZoteroItemFields(
    itemKey: string,
    values: ZoteroItemValues,
    updates: Partial<ZoteroItemValues>
  ): Promise<void> {
    const retryWithoutNativeCitationKey = async (
      updater: (nextUpdates: Partial<ZoteroItemValues>) => Promise<void>,
      error: unknown
    ): Promise<boolean> => {
      const fallbackUpdates = this.buildCitationKeyFallbackUpdates(updates);
      if (!fallbackUpdates || !this.isCitationKeyFieldUnsupportedError(error)) {
        return false;
      }
      console.debug("Retrying Zotero metadata update without native citationKey field", { itemKey });
      await updater(fallbackUpdates);
      return true;
    };

    try {
      await this.updateZoteroItemFieldsLocal(itemKey, values, updates);
      return;
    } catch (error) {
      if (
        await retryWithoutNativeCitationKey(
          (nextUpdates) => this.updateZoteroItemFieldsLocal(itemKey, values, nextUpdates),
          error
        )
      ) {
        return;
      }
      if (!this.canUseWebApi()) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      console.debug("Local Zotero write failed; trying Web API", { itemKey, reason: message });
      try {
        await this.updateZoteroItemFieldsWeb(itemKey, values, updates);
      } catch (webError) {
        if (
          await retryWithoutNativeCitationKey(
            (nextUpdates) => this.updateZoteroItemFieldsWeb(itemKey, values, nextUpdates),
            webError
          )
        ) {
          return;
        }
        throw webError;
      }
    }
  }

  private buildCitationKeyFallbackUpdates(
    updates: Partial<ZoteroItemValues>
  ): Partial<ZoteroItemValues> | null {
    if (!Object.prototype.hasOwnProperty.call(updates, "citationKey")) {
      return null;
    }
    const fallback = { ...updates };
    delete (fallback as Record<string, unknown>).citationKey;
    return fallback;
  }

  private isCitationKeyFieldUnsupportedError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    if (!message) {
      return false;
    }
    const lower = message.toLowerCase();
    if (!lower.includes("citationkey") && !lower.includes("citation-key") && !lower.includes("citation key")) {
      return false;
    }
    return (
      lower.includes("unknown field")
      || lower.includes("unknown property")
      || lower.includes("invalid field")
      || lower.includes("invalid property")
      || lower.includes("unsupported")
      || lower.includes("cannot be set")
      || lower.includes("not allowed")
      || lower.includes("status 400")
    );
  }

  private async updateZoteroItemFieldsLocal(
    itemKey: string,
    values: ZoteroItemValues,
    updates: Partial<ZoteroItemValues>
  ): Promise<void> {
    const url = this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${itemKey}`);
    const payload = { ...values, ...updates };
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Zotero-API-Version": "3",
    };
    const version = typeof payload.version === "number" ? payload.version : Number(payload.version);
    if (!Number.isNaN(version)) {
      headers["If-Unmodified-Since-Version"] = String(version);
    }

    console.debug("Zotero metadata PUT", { url, itemKey });
    try {
      const response = await this.requestLocalApiWithBody(
        url,
        "PUT",
        payload,
        headers,
        `Zotero update failed for ${url}`
      );
      console.debug("Zotero metadata PUT response", { status: response.statusCode });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("status 501")) {
        throw error;
      }
      const postUrl = this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items`);
      console.debug("Zotero metadata PUT unsupported; trying POST", { postUrl });
      const response = await this.requestLocalApiWithBody(
        postUrl,
        "POST",
        [payload],
        headers,
        `Zotero update failed for ${postUrl}`
      );
      console.debug("Zotero metadata POST response", { status: response.statusCode });
    }
  }

  private async updateZoteroItemFieldsWeb(
    itemKey: string,
    values: ZoteroItemValues,
    updates: Partial<ZoteroItemValues>
  ): Promise<void> {
    const libraryPath = this.getWebApiLibraryPath();
    if (!libraryPath) {
      throw new Error("Web API library path is not configured.");
    }
    const url = this.buildWebApiUrl(`/${libraryPath}/items/${itemKey}`);
    const current = this.asRecord(await this.fetchZoteroItemWeb(itemKey));
    const currentData = this.asRecord(current?.data);
    const payload = { ...(currentData ?? values), ...updates };
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Zotero-API-Version": "3",
      "Zotero-API-Key": this.settings.webApiKey,
    };
    const version = currentData?.version ?? current?.version ?? values?.version;
    const numericVersion = typeof version === "number" ? version : Number(version);
    if (!Number.isNaN(numericVersion)) {
      headers["If-Unmodified-Since-Version"] = String(numericVersion);
    }

    console.debug("Zotero Web API metadata PUT", { url, itemKey });
    const response = await this.requestWebApiWithBody(
      url,
      "PUT",
      payload,
      headers,
      `Zotero Web API update failed for ${url}`
    );
    console.debug("Zotero Web API metadata PUT response", { status: response.statusCode });
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
          const docId =
            this.extractDocIdFromFrontmatter(content) ?? this.extractDocIdFromSyncMarker(content);
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

  private registerNoteSyncHandler(): void {
    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        if (!(file instanceof TFile) || file.extension !== "md") {
          return;
        }
        if (this.noteMetadataSyncSuppressed.has(file.path)) {
          if (this.noteSyncSuppressed.has(file.path)) {
            this.scheduleNoteSync(file, 2500);
          }
          return;
        }
        if (this.noteSyncSuppressed.has(file.path)) {
          this.scheduleNoteSync(file, 2500);
          this.scheduleNoteMetadataSync(file, 2500, "save");
          this.scheduleNoteAnnotationSync(file, 2500, "save");
          return;
        }
        this.scheduleNoteSync(file);
        this.scheduleNoteMetadataSync(file, 1200, "save");
        this.scheduleNoteAnnotationSync(file, 1200, "save");
      })
    );
  }

  private registerNoteOpenHandler(): void {
    this.registerEvent(
      this.app.workspace.on("file-open", (file) => {
        if (!(file instanceof TFile) || file.extension !== "md") {
          return;
        }
        void this.pdfSidebar.syncPdfSidebarForFile(file);
        void this.pdfSidebar.maybeSyncPendingPdf();
        this.pdfSidebar.updatePreviewScrollHandler();
        this.scheduleNoteMetadataSync(file, 600, "open");
        this.scheduleNoteAnnotationSync(file, 800, "open");
        void this.normalizeZoteroFrontmatterKeysInFile(file);
      })
    );
  }

  private registerAnnotationFocusSyncHandler(): void {
    this.registerDomEvent(window, "focus", () => {
      const view = this.app.workspace.getActiveViewOfType(MarkdownView);
      const file = view?.file;
      if (!(file instanceof TFile) || file.extension !== "md") {
        return;
      }
      if (!this.isZoteroNoteFile(file)) {
        return;
      }
      this.scheduleNoteAnnotationSync(file, 600, "open");
    });
  }

  private registerPreviewScrollSyncHandlers(): void {
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => {
        this.pdfSidebar.updatePreviewScrollHandler();
        void this.pdfSidebar.maybeSyncPendingPdf();
      })
    );
    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
        this.pdfSidebar.updatePreviewScrollHandler();
        void this.pdfSidebar.maybeSyncPendingPdf();
      })
    );
    this.pdfSidebar.updatePreviewScrollHandler();
  }

  private registerNoteDeleteMenu(): void {
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (!(file instanceof TFile) || file.extension !== "md") {
          return;
        }
        const normalizedDir = normalizePath(this.settings.outputNoteDir);
        const normalizedPath = normalizePath(file.path);
        const inNotesDir =
          normalizedDir && (normalizedPath === normalizedDir || normalizedPath.startsWith(`${normalizedDir}/`));
        if (!inNotesDir && !this.isZoteroNoteFile(file)) {
          return;
        }
        menu.addItem((item) => {
          item
            .setTitle("Reindex note from cache")
            .onClick(() => this.reindexNoteFromCacheForFile(file, true));
        });
        menu.addItem((item) => {
          item
            .setTitle("Delete Zotero note and cached data")
            .onClick(() => this.deleteZoteroNoteAndCacheForFile(file));
        });
      })
    );
  }

  private findChunkStartLine(
    editor: Editor,
    fromLine?: number
  ): { line: number; text: string } | null {
    let line = fromLine ?? editor.getCursor().line;
    for (; line >= 0; line -= 1) {
      const text = editor.getLine(line);
      if (ZRR_CHUNK_START_RE.test(text)) {
        return { line, text };
      }
      if (ZRR_SYNC_START_RE.test(text) || ZRR_SYNC_END_RE.test(text)) {
        break;
      }
    }
    return null;
  }

  private findChunkEndLine(editor: Editor, fromLine: number): number | null {
    for (let line = fromLine; line < editor.lineCount(); line += 1) {
      const text = editor.getLine(line);
      if (ZRR_CHUNK_END_RE.test(text)) {
        return line;
      }
      if (ZRR_SYNC_END_RE.test(text)) {
        break;
      }
    }
    return null;
  }

  private findChunkAtCursor(
    editor: Editor,
    fromLine?: number
  ): { startLine: number; endLine: number; text: string } | null {
    const cursorLine = fromLine ?? editor.getCursor().line;
    const start = this.findChunkStartLine(editor, cursorLine);
    if (!start) {
      return null;
    }
    const endLine = this.findChunkEndLine(editor, start.line + 1);
    if (endLine === null || cursorLine < start.line || cursorLine > endLine) {
      return null;
    }
    return { startLine: start.line, endLine, text: start.text };
  }

  public toggleChunkExclude(editor: Editor, fromLine?: number): void {
    const found = this.findChunkAtCursor(editor, fromLine);
    if (!found) {
      new Notice("No synced chunk found at cursor.");
      return;
    }
    const startMatch = found.text.match(ZRR_CHUNK_START_RE);
    if (!startMatch) {
      new Notice("Invalid chunk marker.");
      return;
    }
    let attrs = (startMatch[1] ?? "").trim();
    const endLine = found.endLine;
    let hasExcludeMarker = false;
    if (endLine !== null) {
      for (let line = found.startLine + 1; line < endLine; line += 1) {
        if (ZRR_CHUNK_EXCLUDE_ANY_RE.test(editor.getLine(line))) {
          hasExcludeMarker = true;
          break;
        }
      }
    }
    const hasExcludeAttr = /\bexclude\b/i.test(attrs) || /\bdelete\b/i.test(attrs);
    const hasExclude = hasExcludeAttr || hasExcludeMarker;
    if (hasExclude) {
      attrs = attrs.replace(/\b(delete|exclude)\b/gi, "").replace(/\s{2,}/g, " ").trim();
    } else {
      attrs = attrs ? `${attrs} exclude` : "exclude";
    }
    const newLine = `<!-- zrr:chunk${attrs ? " " + attrs : ""} -->`;
    if (newLine !== found.text) {
      editor.replaceRange(
        newLine,
        { line: found.startLine, ch: 0 },
        { line: found.startLine, ch: found.text.length }
      );
    }
    if (hasExclude && endLine !== null) {
      const deleteLines: number[] = [];
      for (let line = found.startLine + 1; line < endLine; line += 1) {
        if (ZRR_CHUNK_EXCLUDE_ANY_RE.test(editor.getLine(line))) {
          deleteLines.push(line);
        }
      }
      for (let idx = deleteLines.length - 1; idx >= 0; idx -= 1) {
        const line = deleteLines[idx];
        const lineCount = editor.lineCount();
        if (line < lineCount - 1) {
          editor.replaceRange("", { line, ch: 0 }, { line: line + 1, ch: 0 });
        } else {
          editor.replaceRange("", { line, ch: 0 }, { line, ch: editor.getLine(line).length });
        }
      }
    }
    new Notice(hasExclude ? "Chunk included." : "Chunk excluded from index.");
  }

  public toggleChunkExcludeFromToolbar(startLine: number): void {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) {
      new Notice("No active editor found.");
      return;
    }
    const line = Math.max(0, startLine - 1);
    this.toggleChunkExclude(view.editor, line);
  }

  public async openChunkTagEditor(docId: string, chunkId: string): Promise<void> {
    const chunkPath = normalizePath(`${CHUNK_CACHE_DIR}/${docId}.json`);
    const adapter = this.app.vault.adapter;
    if (!(await adapter.exists(chunkPath))) {
      new Notice("Chunk cache not found for this document.");
      return;
    }
    const payload = await this.readChunkPayload(chunkPath);
    if (!payload) {
      new Notice("Failed to read chunk cache.");
      return;
    }
    const chunks = Array.isArray(payload.chunks) ? payload.chunks : [];
    const target = this.resolveChunkFromPayload(chunks, chunkId, docId);
    if (!target) {
      new Notice(`Chunk ${chunkId} not found in cache.`);
      return;
    }
    const rawTags = target.chunk_tags ?? [];
    const initialTags = Array.isArray(rawTags)
      ? rawTags.map((tag) => String(tag).trim()).filter((tag) => tag)
      : (typeof rawTags === "string" ? rawTags : "")
          .split(/[|,;\n]+/)
          .map((tag) => tag.trim())
          .filter((tag) => tag);
    const chunkText = typeof target.text === "string" ? target.text : "";
    new ChunkTagModal(
      this.app,
      chunkId,
      initialTags,
      async (tags) => {
        if (tags.length > 0) {
          target.chunk_tags = tags;
        } else {
          delete target.chunk_tags;
        }
        await adapter.write(chunkPath, JSON.stringify(payload, null, 2));
        const targetChunkId = typeof target.chunk_id === "string" ? target.chunk_id : chunkId;
        await this.reindexChunkUpdates(docId, chunkPath, [targetChunkId], []);
        new Notice("Chunk tags updated.");
      },
      async () => {
        if (!chunkText.trim()) {
          new Notice("Chunk has no text to tag.");
          return null;
        }
        const indexText = await this.renderMarkdownToIndexText(chunkText);
        return this.requestChunkTags(indexText);
      }
    ).open();
  }

  public async openChunkIndexedTextPreview(docId: string, chunkId: string): Promise<void> {
    const chunkPath = normalizePath(`${CHUNK_CACHE_DIR}/${docId}.json`);
    const adapter = this.app.vault.adapter;
    if (!(await adapter.exists(chunkPath))) {
      new Notice("Chunk cache not found for this document.");
      return;
    }
    const payload = await this.readChunkPayload(chunkPath);
    if (!payload) {
      new Notice("Failed to read chunk cache.");
      return;
    }
    const chunks = Array.isArray(payload.chunks) ? payload.chunks : [];
    const target = this.resolveChunkFromPayload(chunks, chunkId, docId);
    if (!target) {
      new Notice(`Chunk ${chunkId} not found in cache.`);
      return;
    }
    const text = typeof target.text === "string" ? target.text : "";
    const indexedText = await this.renderMarkdownToIndexText(text);
    const note = this.settings.embedIncludeMetadata
      ? "Note: when “Include metadata in embeddings” is enabled, the indexer prepends title/authors/tags/section info before embedding. The preview below shows only the chunk text."
      : "";
    new ChunkTextPreviewModal(
      this.app,
      `Indexed text for ${chunkId}`,
      indexedText,
      note
    ).open();
  }

  public async openChunkInZotero(docId: string, chunkId: string): Promise<void> {
    const chunkPath = normalizePath(`${CHUNK_CACHE_DIR}/${docId}.json`);
    const adapter = this.app.vault.adapter;
    let payload: Record<string, unknown> | null = null;
    if (await adapter.exists(chunkPath)) {
      payload = await this.readChunkPayload(chunkPath);
    }
    const chunks = Array.isArray(payload?.chunks) ? payload?.chunks : [];
    const target = this.resolveChunkFromPayload(chunks, chunkId, docId);
    const pageStart = target?.page_start ?? target?.pageStart;
    const metadata = this.asRecord(payload?.metadata);
    let attachmentKey = coerceString(metadata?.attachment_key ?? metadata?.attachmentKey);
    if (!attachmentKey) {
      const entry = await this.getDocIndexEntry(docId);
      attachmentKey = entry?.attachment_key ?? "";
    }
    if (!attachmentKey) {
      new Notice("Attachment key not found for Zotero deeplink.");
      return;
    }
    const page = typeof pageStart === "number" ? String(pageStart) : "";
    const url = this.buildZoteroDeepLink(docId, attachmentKey, page);
    this.openExternalUrl(url);
  }

  public async cleanChunkFromToolbar(startLine: number): Promise<void> {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) {
      new Notice("No active editor found.");
      return;
    }
    const editor = view.editor;
    const line = Math.max(0, startLine - 1);
    const chunk = this.findChunkAtCursor(editor, line);
    if (!chunk) {
      new Notice("No synced chunk found at cursor.");
      return;
    }
    const textLines: string[] = [];
    for (let idx = chunk.startLine + 1; idx < chunk.endLine; idx += 1) {
      textLines.push(editor.getLine(idx));
    }
    const rawText = textLines.join("\n").trim();
    if (!rawText) {
      new Notice("Chunk has no text to clean.");
      return;
    }
    this.showStatusProgress("Cleaning chunk...", null);
    let cleaned: string | null = null;
    try {
      cleaned = await this.requestOcrCleanup(rawText);
    } finally {
      if (!cleaned) {
        this.clearStatusProgress();
      }
    }
    if (!cleaned) {
      return;
    }
    if (cleaned.trim() === rawText.trim()) {
      new Notice("Cleanup produced no changes.");
      this.clearStatusProgress();
      return;
    }
    const insert = `${cleaned.trim()}\n`;
    editor.replaceRange(
      insert,
      { line: chunk.startLine + 1, ch: 0 },
      { line: chunk.endLine, ch: 0 }
    );
    this.showStatusProgress("Chunk cleaned.", 100);
    window.setTimeout(() => this.clearStatusProgress(), 1200);
    new Notice("Chunk cleaned.");
  }

  private async requestOcrCleanup(text: string): Promise<string | null> {
    const baseUrl = (this.settings.llmCleanupBaseUrl || "").trim().replace(/\/$/, "");
    const model = (this.settings.llmCleanupModel || "").trim();
    if (!baseUrl || !model) {
      new Notice("Ocr cleanup model is not configured.");
      this.openPluginSettings();
      return null;
    }
    const maxChars = Number(this.settings.llmCleanupMaxChars || 0);
    if (maxChars > 0 && text.length > maxChars) {
      new Notice("Chunk exceeds ocr cleanup max length. Adjust settings to clean it.");
      this.openPluginSettings();
      return null;
    }
    const endpoint = `${baseUrl}/chat/completions`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const apiKey = (this.settings.llmCleanupApiKey || "").trim();
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }
    const payload = {
      model,
      temperature: Number(this.settings.llmCleanupTemperature ?? 0),
      messages: [
        {
          role: "system",
          content:
            "You are an OCR cleanup assistant. Fix OCR errors without changing meaning. Do not add content. Return corrected text only. Detect footnote references and definitions and format them in Markdown as [^n] and [^n]: (for the note text). Preserve special characters and formatting. Do not create new footnotes or content; only reformat existing footnote markers/lines.",
        },
        { role: "user", content: text },
      ],
    };
    try {
      const response = await this.requestLocalApiRaw(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (response.statusCode >= 400) {
        const details = response.body.toString("utf8");
        throw new Error(`Cleanup request failed (${response.statusCode}): ${details || "no response body"}`);
      }
      const data = JSON.parse(response.body.toString("utf8"));
      const content =
        data?.choices?.[0]?.message?.content ??
        data?.choices?.[0]?.text ??
        data?.output_text ??
        "";
      const cleaned = String(content || "").trim();
      if (!cleaned) {
        new Notice("Cleanup returned empty text.");
        return null;
      }
      return cleaned;
    } catch (error) {
      console.error("OCR cleanup failed", error);
      new Notice("Ocr cleanup failed. Check the cleanup model settings.");
      return null;
    }
  }

  private parseChunkTags(content: string, maxTags: number): string[] {
    if (!content) {
      return [];
    }
    const raw = content.trim();
    let parts: string[] = [];
    if (raw.startsWith("[") && raw.endsWith("]")) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parts = parsed.map((item) => String(item));
        }
      } catch {
        parts = [];
      }
    }
    if (parts.length === 0) {
      parts = raw.split(/[,;\n]+/);
    }
    const seen = new Set<string>();
    const tags: string[] = [];
    for (const part of parts) {
      let tag = part.trim();
      tag = tag.replace(/^[-•\d.)\s]+/, "");
      tag = tag.replace(/\s+/g, " ").trim();
      if (!tag || tag.length < 2) {
        continue;
      }
      const key = tag.toLowerCase();
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      tags.push(tag);
      if (tags.length >= maxTags) {
        break;
      }
    }
    return tags;
  }

  private async requestChunkTags(text: string): Promise<string[] | null> {
    const baseUrl = (this.settings.llmCleanupBaseUrl || "").trim().replace(/\/$/, "");
    const model = (this.settings.llmCleanupModel || "").trim();
    if (!baseUrl || !model) {
      new Notice("Ocr cleanup model is not configured.");
      this.openPluginSettings();
      return null;
    }
    const snippet = text.trim().slice(0, 2000);
    if (!snippet) {
      return [];
    }
    const endpoint = `${baseUrl}/chat/completions`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const apiKey = (this.settings.llmCleanupApiKey || "").trim();
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }
    const maxTags = 5;
    const systemPrompt = (
      "Return 3 to 5 high-signal, concrete noun-phrase tags. "
      + "Avoid generic terms (study, paper, method), verbs, and filler. "
      + "Prefer specific entities, methods, datasets, and named concepts. "
      + "Output comma-separated tags only. No extra text."
    );
    const temperatureRaw = Number(this.settings.llmCleanupTemperature ?? 0);
    const basePayload: Record<string, unknown> = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: snippet },
      ],
    };
    if (Number.isFinite(temperatureRaw)) {
      basePayload.temperature = temperatureRaw;
    }
    this.showStatusProgress("Generating tags...", null);
    try {
      const send = async (payload: Record<string, unknown>): Promise<Buffer> => {
        const response = await this.requestLocalApiRaw(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
        if (response.statusCode >= 400) {
          const details = response.body.toString("utf8");
          throw new Error(`Tag request failed (${response.statusCode}): ${details || "no response body"}`);
        }
        return response.body;
      };

      let body: Buffer;
      try {
        body = await send(basePayload);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (
          "temperature" in basePayload
          && /temperature/i.test(message)
          && /unsupported|default/i.test(message)
        ) {
          const retryPayload = { ...basePayload };
          delete retryPayload.temperature;
          body = await send(retryPayload);
        } else {
          throw error;
        }
      }

      const data = JSON.parse(body.toString("utf8"));
      const content =
        data?.choices?.[0]?.message?.content ??
        data?.choices?.[0]?.text ??
        data?.output_text ??
        "";
      const tags = this.parseChunkTags(String(content || ""), maxTags);
      if (!tags.length) {
        new Notice("Tag generation returned no tags.");
      }
      return tags;
    } catch (error) {
      console.error("Tag generation failed", error);
      new Notice("Tag generation failed. Check the cleanup model settings.");
      return null;
    } finally {
      this.clearStatusProgress();
    }
  }

  private async renderMarkdownToIndexText(markdown: string): Promise<string> {
    if (!markdown) {
      return "";
    }
    const normalizedMarkdown = this.replaceImageMarkersForIndexPreview(markdown);
    const container = document.createElement("div");
    const component = new Component();
    component.load();
    try {
      await MarkdownRenderer.render(this.app, normalizedMarkdown, container, "", component);
    } catch (error) {
      console.warn("Failed to render markdown for index preview", error);
      return this.normalizeIndexPreviewText(normalizedMarkdown);
    } finally {
      component.unload();
    }
    const text = container.textContent || normalizedMarkdown;
    return this.normalizeIndexPreviewText(text);
  }

  private replaceImageMarkersForIndexPreview(markdown: string): string {
    if (!markdown) {
      return "";
    }
    const marker = (label: string): string => {
      const cleaned = label.trim();
      return cleaned ? `Image caption: ${cleaned}` : "Image";
    };
    let updated = markdown.replace(
      /!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
      (_match, _target, label) => marker(label || "")
    );
    updated = updated.replace(
      /!\[([^\]]*)]\([^)]+\)/g,
      (_match, label) => marker(label || "")
    );
    updated = updated.replace(/<img[^>]*>/gi, (tag) => {
      const altMatch = tag.match(/\balt=(['"])([^'"]*)\1/i);
      return marker(altMatch ? altMatch[2] : "");
    });
    return updated;
  }

  private normalizeIndexPreviewText(text: string): string {
    return text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]*\n[ \t]*/g, "\n")
      .trim();
  }

  private scheduleNoteSync(file: TFile, delayMs = 1200): void {
    const existing = this.noteSyncTimers.get(file.path);
    if (existing !== undefined) {
      window.clearTimeout(existing);
    }
    const handle = window.setTimeout(() => {
      this.noteSyncTimers.delete(file.path);
      void this.syncNoteToRedis(file);
    }, delayMs);
    this.noteSyncTimers.set(file.path, handle);
  }

  private scheduleNoteMetadataSync(
    file: TFile,
    delayMs = 1200,
    reason: "open" | "save" = "save"
  ): void {
    const existing = this.noteMetadataSyncTimers.get(file.path);
    if (existing !== undefined) {
      window.clearTimeout(existing);
    }
    const handle = window.setTimeout(() => {
      this.noteMetadataSyncTimers.delete(file.path);
      void this.syncNoteMetadataWithZotero(file, reason);
    }, delayMs);
    this.noteMetadataSyncTimers.set(file.path, handle);
  }

  private scheduleNoteAnnotationSync(
    file: TFile,
    delayMs = 1200,
    reason: "open" | "save" = "save"
  ): void {
    const existing = this.noteAnnotationSyncTimers.get(file.path);
    if (existing !== undefined) {
      window.clearTimeout(existing);
    }
    const handle = window.setTimeout(() => {
      this.noteAnnotationSyncTimers.delete(file.path);
      void this.syncNoteAnnotationsWithZotero(file, reason);
    }, delayMs);
    this.noteAnnotationSyncTimers.set(file.path, handle);
  }

  private getAnnotationGraceRemaining(notePath: string): number {
    const lastEdit = this.annotationNoteEditTimes.get(notePath);
    if (!lastEdit) {
      return 0;
    }
    const elapsed = Date.now() - lastEdit;
    if (elapsed >= ANNOTATION_SYNC_GRACE_MS) {
      return 0;
    }
    return ANNOTATION_SYNC_GRACE_MS - elapsed;
  }

  private escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private formatCitationPageLabel(citation: ChatCitation): string {
    const annotationLabel = (citation.annotation_page_label || "").trim();
    if (annotationLabel) {
      return annotationLabel;
    }
    const start = citation.page_start ? String(citation.page_start) : "";
    const end = citation.page_end ? String(citation.page_end) : "";
    if (start && (!end || start === end)) {
      return start;
    }
    if (start && end) {
      return `${start} - ${end}`;
    }
    const raw = (citation.pages || "").trim();
    if (!raw) {
      return "?";
    }
    const match = raw.match(/^(\d+)\s*-\s*(\d+)$/);
    if (match) {
      return match[1] === match[2] ? match[1] : `${match[1]} - ${match[2]}`;
    }
    return raw.replace("-", " - ");
  }

  private normalizeChunkIdForNote(chunkId?: string, docId?: string): string | null {
    if (!chunkId) {
      return null;
    }
    const raw = String(chunkId);
    if (docId && raw.startsWith(`${docId}:`)) {
      return raw.slice(docId.length + 1);
    }
    if (raw.includes(":")) {
      const parts = raw.split(":");
      if (parts.length > 1 && docId && parts[0] === docId) {
        return parts.slice(1).join(":");
      }
    }
    return raw;
  }

  private async syncNoteToRedis(file: TFile): Promise<void> {
    if (this.noteSyncInFlight.has(file.path)) {
      this.noteSyncPending.add(file.path);
      return;
    }
    if (this.noteSyncSuppressed.has(file.path)) {
      this.scheduleNoteSync(file, 2000);
      return;
    }
    this.noteSyncInFlight.add(file.path);
    try {
      const content = await this.app.vault.read(file);
      const syncSection = this.extractSyncSection(content);
      if (!syncSection) {
        return;
      }
      const docId = await this.resolveDocIdForNote(file, content);
      if (!docId) {
        return;
      }

      const parsedBlocks = this.parseSyncedChunkBlocks(syncSection);
      if (!parsedBlocks.length) {
        return;
      }

      const chunkPath = normalizePath(`${CHUNK_CACHE_DIR}/${docId}.json`);
      const adapter = this.app.vault.adapter;
      if (!(await adapter.exists(chunkPath))) {
        return;
      }
      const chunkPayload = await this.readChunkPayload(chunkPath);
      if (!chunkPayload) {
        return;
      }
      const chunks = Array.isArray(chunkPayload.chunks) ? chunkPayload.chunks : [];
      const chunkMap = new Map<string, Record<string, unknown>>();
      for (const chunk of chunks) {
        if (this.isAnnotationChunk(chunk)) {
          continue;
        }
        const id = typeof chunk?.chunk_id === "string" ? chunk.chunk_id : "";
        if (id) {
          chunkMap.set(id, chunk);
        }
      }

      const seen = new Set<string>();
      const updates = new Set<string>();
      const deletions = new Set<string>();
      const removals = new Set<string>();
      let payloadUpdated = false;

      for (const block of parsedBlocks) {
        const chunkId = block.chunkId;
        if (!chunkId) {
          continue;
        }
        seen.add(chunkId);
        const existing = chunkMap.get(chunkId);
        if (!existing) {
          console.warn(`Sync note: chunk id not found in cache (${chunkId})`);
          continue;
        }
        if (block.excludeFlag) {
          if (existing.excluded !== true) {
            existing.excluded = true;
            payloadUpdated = true;
          }
          const normalized = this.normalizeChunkText(block.text);
          const existingText = typeof existing.text === "string" ? existing.text : "";
          if (normalized && normalized !== existingText) {
            existing.text = normalized;
            existing.char_count = normalized.length;
            payloadUpdated = true;
          }
          deletions.add(chunkId);
          continue;
        }
        if (existing.excluded) {
          existing.excluded = false;
          payloadUpdated = true;
          updates.add(chunkId);
        }
        if (!block.text.trim()) {
          deletions.add(chunkId);
          removals.add(chunkId);
          continue;
        }
        const normalized = this.normalizeChunkText(block.text);
        if (!normalized) {
          deletions.add(chunkId);
          removals.add(chunkId);
          continue;
        }
        const currentText = typeof existing.text === "string" ? existing.text : "";
        if (normalized !== currentText) {
          existing.text = normalized;
          existing.char_count = normalized.length;
          updates.add(chunkId);
          payloadUpdated = true;
        }
      }

      for (const chunkId of chunkMap.keys()) {
        if (!seen.has(chunkId)) {
          deletions.add(chunkId);
          removals.add(chunkId);
        }
      }

      const deletionCandidates = new Set<string>([...deletions, ...removals]);
      if (deletionCandidates.size) {
        const signature = Array.from(deletionCandidates).sort().join("|");
        const pending = this.noteSyncPendingDeletes.get(file.path);
        if (pending !== signature) {
          this.noteSyncPendingDeletes.set(file.path, signature);
          this.scheduleNoteSync(file, 1500);
          return;
        }
      } else if (this.noteSyncPendingDeletes.has(file.path)) {
        this.noteSyncPendingDeletes.delete(file.path);
      }

      if (!updates.size && !deletions.size && !removals.size && !payloadUpdated) {
        return;
      }

      if (removals.size) {
        chunkPayload.chunks = chunks.filter((chunk) => {
          const id = typeof chunk?.chunk_id === "string" ? chunk.chunk_id : "";
          return id && !removals.has(id);
        });
        payloadUpdated = true;
      }

      if (payloadUpdated || removals.size) {
        await adapter.write(chunkPath, JSON.stringify(chunkPayload, null, 2));
      }

      await this.reindexChunkUpdates(
        docId,
        chunkPath,
        Array.from(updates),
        Array.from(deletions)
      );
      if (deletions.size || removals.size) {
        this.noteSyncPendingDeletes.delete(file.path);
      }
    } catch (error) {
      console.warn("Failed to sync note edits to Redis", error);
    } finally {
      this.noteSyncInFlight.delete(file.path);
      if (this.noteSyncPending.delete(file.path)) {
        this.scheduleNoteSync(file, 400);
      }
    }
  }

  private async syncNoteMetadataWithZotero(
    file: TFile,
    reason: "open" | "save"
  ): Promise<void> {
    if (this.noteMetadataSyncInFlight.has(file.path)) {
      this.noteMetadataSyncPending.add(file.path);
      return;
    }
    if (this.noteMetadataSyncSuppressed.has(file.path)) {
      this.scheduleNoteMetadataSync(file, 2000, reason);
      return;
    }
    this.noteMetadataSyncInFlight.add(file.path);
    try {
      const content = await this.app.vault.read(file);
      const docId = await this.resolveDocIdForNote(file, content);
      if (!docId) {
        return;
      }
      const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
      if (!frontmatter) {
        return;
      }
      const itemKey = this.resolveZoteroItemKey(frontmatter, docId);
      if (!itemKey) {
        return;
      }

      const zoteroItem = this.asRecord(await this.fetchZoteroItem(itemKey));
      const zoteroValues = this.asRecord(zoteroItem?.data) ?? zoteroItem;
      if (!zoteroValues || typeof zoteroValues !== "object") {
        return;
      }

      const noteFields = this.extractNoteMetadata(frontmatter);
      const zoteroFields = this.extractZoteroMetadata(zoteroValues);
      if (!zoteroFields.citekey) {
        zoteroFields.citekey = await this.resolveZoteroCitekey(
          zoteroValues,
          itemKey,
          this.asRecord(zoteroItem?.meta) ?? {}
        );
      }
      const snapshot = await this.getMetadataSnapshot(docId, frontmatter, file);
      const noteUpdates: Partial<NoteMetadataFields> = {};
      const zoteroUpdates: Partial<NoteMetadataFields> = {};
      const decisions: Partial<Record<keyof NoteMetadataFields, MetadataDecision>> = {};
      const conflicts: Array<{
        field: keyof NoteMetadataFields;
        fieldLabel: string;
        noteLabel: string;
        zoteroLabel: string;
        noteValue: string;
        zoteroValue: string;
      }> = [];

      const fieldOrder: Array<keyof NoteMetadataFields> = [
        "title",
        "short_title",
        "citekey",
        "date",
        "abstract",
        "doi",
        "publisher",
        "place",
        "issue",
        "volume",
        "pages",
        "item_type",
        "tags",
        "authors",
        "editors",
      ];
      const frontmatterKeys: Record<keyof NoteMetadataFields, string> = {
        title: "title",
        short_title: "short_title",
        citekey: "citekey",
        date: "date",
        abstract: "abstract",
        doi: "doi",
        publisher: "publisher",
        place: "place",
        issue: "issue",
        volume: "volume",
        pages: "pages",
        item_type: "item_type",
        tags: "tags",
        authors: "authors",
        editors: "editors",
      };
      const frontmatterPresence = Object.fromEntries(
        fieldOrder.map((field) => [field, this.hasFrontmatterKey(frontmatter, frontmatterKeys[field])])
      ) as Record<keyof NoteMetadataFields, boolean>;
      const autoPushToZoteroFields = new Set<keyof NoteMetadataFields>([
        "title",
        "short_title",
        "citekey",
        "date",
        "abstract",
        "doi",
        "publisher",
        "place",
        "issue",
        "volume",
        "pages",
        "item_type",
        "authors",
        "editors",
      ]);
      const activeFields = fieldOrder.filter((field) =>
        frontmatterPresence[field]
        || !this.isMetadataValueEmpty(noteFields[field])
        || !this.isMetadataValueEmpty(zoteroFields[field])
      );
      if (!activeFields.length) {
        return;
      }

      const fieldLabels: Record<keyof NoteMetadataFields, string> = {
        title: "Title",
        short_title: "Short title",
        citekey: "Citekey",
        date: "Date",
        abstract: "Abstract",
        doi: "DOI",
        publisher: "Publisher",
        place: "Place",
        issue: "Issue",
        volume: "Volume",
        pages: "Pages",
        item_type: "Item type",
        tags: "Tags",
        authors: "Authors",
        editors: "Editors",
      };

      for (const field of activeFields) {
        const noteValue = noteFields[field];
        const zoteroValue = zoteroFields[field];
        if (this.metadataValuesEqual(field, noteValue, zoteroValue)) {
          continue;
        }
        const noteEmpty = this.isMetadataValueEmpty(noteValue);
        const zoteroEmpty = this.isMetadataValueEmpty(zoteroValue);
        const snapshotValue = snapshot?.[field];
        if (snapshotValue === undefined) {
          if (noteEmpty && !zoteroEmpty) {
            decisions[field] = "zotero";
            this.assignMetadataUpdate(noteUpdates, field, zoteroValue);
            continue;
          }
          if (!noteEmpty && zoteroEmpty && autoPushToZoteroFields.has(field)) {
            decisions[field] = "note";
            this.assignMetadataUpdate(zoteroUpdates, field, noteValue);
            continue;
          }
        }
        if (snapshotValue !== undefined) {
          const noteChanged = !this.metadataValuesEqual(field, noteValue, snapshotValue);
          const zoteroChanged = !this.metadataValuesEqual(field, zoteroValue, snapshotValue);
          if (noteChanged && !zoteroChanged) {
            decisions[field] = "note";
            this.assignMetadataUpdate(zoteroUpdates, field, noteValue);
            continue;
          }
          if (!noteChanged && zoteroChanged) {
            decisions[field] = "zotero";
            this.assignMetadataUpdate(noteUpdates, field, zoteroValue);
            continue;
          }
        }
        const decisionLabels = this.getMetadataDecisionLabels(field, noteValue, zoteroValue, fieldLabels);
        conflicts.push({
          field,
          fieldLabel: fieldLabels[field],
          noteLabel: decisionLabels.noteLabel,
          zoteroLabel: decisionLabels.zoteroLabel,
          noteValue: this.formatMetadataValue(noteValue),
          zoteroValue: this.formatMetadataValue(zoteroValue),
        });
      }

      if (conflicts.length > 0) {
        const conflictDecisions = await this.promptMetadataBatchDecision(conflicts);
        for (const conflict of conflicts) {
          const decision = conflictDecisions[conflict.field] ?? "skip";
          decisions[conflict.field] = decision;
          if (decision === "note") {
            this.assignMetadataUpdate(zoteroUpdates, conflict.field, noteFields[conflict.field]);
          } else if (decision === "zotero") {
            this.assignMetadataUpdate(noteUpdates, conflict.field, zoteroFields[conflict.field]);
          }
        }
      }

      if (Object.keys(noteUpdates).length > 0) {
        await this.applyNoteMetadataUpdates(file, noteUpdates);
      }
      if (Object.keys(zoteroUpdates).length > 0) {
        await this.applyZoteroMetadataUpdates(
          itemKey,
          zoteroValues,
          noteFields,
          zoteroFields,
          zoteroUpdates
        );
      }
      await this.updateMetadataSnapshot(file, docId, noteFields, zoteroFields, snapshot, decisions, activeFields);
    } catch (error) {
      console.warn("Failed to sync note metadata with Zotero", error);
    } finally {
      this.noteMetadataSyncInFlight.delete(file.path);
      if (this.noteMetadataSyncPending.delete(file.path)) {
        this.scheduleNoteMetadataSync(file, 500, reason);
      }
    }
  }

  private async syncNoteAnnotationsWithZotero(
    file: TFile,
    reason: "open" | "save"
  ): Promise<void> {
    if (this.noteAnnotationSyncInFlight.has(file.path)) {
      this.noteAnnotationSyncPending.add(file.path);
      return;
    }
    if (this.noteAnnotationSyncSuppressed.has(file.path)) {
      this.scheduleNoteAnnotationSync(file, 2000, reason);
      return;
    }
    this.noteAnnotationSyncInFlight.add(file.path);
    try {
      const content = await this.app.vault.read(file);
      const blockRange = this.findAnnotationBlockRange(content);
      if (!blockRange) {
        return;
      }
      const markerInfo = this.parseAnnotationBlockMarker(blockRange.startMarker);
      let docId = await this.resolveDocIdForNote(file, content);
      if (!docId && markerInfo.docId) {
        docId = markerInfo.docId;
        const updated = this.ensureDocIdInNoteContent(content, docId);
        if (updated !== content) {
          await this.writeNoteWithSyncSuppressed(file.path, updated);
        }
      }
      if (!docId) {
        return;
      }
      const frontmatter =
        this.app.metadataCache.getFileCache(file)?.frontmatter ?? {};
      let attachmentKey = markerInfo.attachmentKey ?? "";
      if (!attachmentKey) {
        attachmentKey = await this.resolveAttachmentKeyForDocId(docId, frontmatter);
      }
      if (!attachmentKey) {
        return;
      }
      if (
        markerInfo.attachmentKey
        && (!markerInfo.docId || markerInfo.docId === docId)
        && markerInfo.attachmentKey === attachmentKey
      ) {
        await this.updateDocIndex({ doc_id: docId, attachment_key: attachmentKey });
      }

      const originalAttachmentKey = attachmentKey;
      const resolved = await this.fetchZoteroAnnotationsForDoc(docId, attachmentKey);
      let zoteroAnnotations = resolved.annotations;
      attachmentKey = resolved.attachmentKey;
      if (attachmentKey && attachmentKey !== originalAttachmentKey) {
        await this.updateDocIndex({ doc_id: docId, attachment_key: attachmentKey });
      }
      const noteAnnotations = this.parseAnnotationBlock(blockRange.block, attachmentKey);
      const existingImages = new Map<string, { path: string; hash: string }>();
      for (const noteEntry of noteAnnotations) {
        if (noteEntry.key && noteEntry.imagePath) {
          existingImages.set(noteEntry.key, {
            path: noteEntry.imagePath,
            hash: noteEntry.imageHash || this.extractAnnotationImageHashFromPath(noteEntry.imagePath),
          });
        }
      }
      await this.attachAnnotationImages(docId, attachmentKey, zoteroAnnotations, file.path, existingImages);
      const noteMap = new Map<string, ParsedAnnotationNote>();
      for (const noteEntry of noteAnnotations) {
        if (noteEntry.key) {
          noteMap.set(noteEntry.key, noteEntry);
        }
      }
      const zoteroMap = new Map<string, AnnotationEntry>();
      for (const annotation of zoteroAnnotations) {
        zoteroMap.set(annotation.key, annotation);
      }
      let noteEditsDetected = false;
      let needsNoteRefresh = false;
      let forceNoteRefresh = false;
      if (!resolved.hadFetchError) {
        for (const key of noteMap.keys()) {
          if (!zoteroMap.has(key)) {
            needsNoteRefresh = true;
          }
        }
      } else if (noteMap.size > 0 && zoteroAnnotations.length === 0) {
        console.debug("Skipping annotation-prune sync due incomplete Zotero annotation fetch.", {
          docId,
          attachmentKey,
          reason,
        });
      }

      const snapshot = await this.getAnnotationSnapshot(docId);
      const snapshotMap = snapshot?.annotations ?? {};
      const decisions: Record<string, MetadataDecision> = {};
      const conflicts: Array<{
        key: string;
        title: string;
        noteValue: string;
        zoteroValue: string;
      }> = [];
      if (attachmentKey && attachmentKey !== originalAttachmentKey && zoteroAnnotations.length > 0) {
        needsNoteRefresh = true;
        forceNoteRefresh = true;
      }

      for (const [key, zoteroEntry] of zoteroMap.entries()) {
        const noteEntry = noteMap.get(key);
        if (!noteEntry) {
          needsNoteRefresh = true;
          continue;
        }
        const snapshotEntry = snapshotMap[key];
        const noteSnapshot = this.annotationSnapshotFromEntry(
          noteEntry,
          zoteroEntry.annotationType
        );
        const zotSnapshot = this.annotationSnapshotFromEntry(
          zoteroEntry,
          zoteroEntry.annotationType
        );
        const imageChanged = (noteSnapshot.image_hash || "") !== (zotSnapshot.image_hash || "");

        if (!snapshotEntry) {
          if (!this.annotationSnapshotsEqualIgnoringImage(noteSnapshot, zotSnapshot)) {
            decisions[key] = "note";
            noteEditsDetected = true;
          } else if (imageChanged) {
            needsNoteRefresh = true;
            forceNoteRefresh = true;
          }
          continue;
        }

        const noteChanged = !this.annotationSnapshotsEqual(noteSnapshot, snapshotEntry);
        const zoteroChanged = !this.annotationSnapshotsEqual(zotSnapshot, snapshotEntry);
        const colorChanged = (zotSnapshot.color_key || "") !== (snapshotEntry.color_key || "");
        const noteChangedNoImage = !this.annotationSnapshotsEqualIgnoringImage(noteSnapshot, snapshotEntry);
        const zoteroChangedNoImage = !this.annotationSnapshotsEqualIgnoringImage(zotSnapshot, snapshotEntry);
        if (noteChangedNoImage && !zoteroChangedNoImage) {
          decisions[key] = "note";
          noteEditsDetected = true;
        } else if (!noteChangedNoImage && zoteroChangedNoImage) {
          decisions[key] = "zotero";
          needsNoteRefresh = true;
        } else if (noteChangedNoImage && zoteroChangedNoImage) {
          conflicts.push({
            key,
            title: this.formatAnnotationConflictTitle(zoteroEntry),
            noteValue: this.formatAnnotationConflictValue(noteSnapshot, noteEntry.tags),
            zoteroValue: this.formatAnnotationConflictValue(zotSnapshot, zoteroEntry.tags),
          });
        }
        if (imageChanged && (noteChanged || zoteroChanged)) {
          needsNoteRefresh = true;
          forceNoteRefresh = true;
        }
        if (colorChanged) {
          needsNoteRefresh = true;
          forceNoteRefresh = true;
        }
      }

      if (conflicts.length > 0) {
        const conflictDecisions = await this.promptAnnotationBatchDecision(conflicts);
        for (const conflict of conflicts) {
          const decision = conflictDecisions[conflict.key] ?? "skip";
          decisions[conflict.key] = decision;
          if (decision === "note") {
            noteEditsDetected = true;
          } else if (decision === "zotero") {
            needsNoteRefresh = true;
            forceNoteRefresh = true;
          }
        }
      }

      const updatesToZotero: Array<{
        entry: AnnotationEntry;
        note: ParsedAnnotationNote;
      }> = [];
      for (const [key, decision] of Object.entries(decisions)) {
        if (decision !== "note") {
          continue;
        }
        const noteEntry = noteMap.get(key);
        const zoteroEntry = zoteroMap.get(key);
        if (!noteEntry || !zoteroEntry) {
          continue;
        }
        updatesToZotero.push({ entry: zoteroEntry, note: noteEntry });
      }

      if (updatesToZotero.length > 0) {
        await this.applyZoteroAnnotationUpdates(updatesToZotero);
      }

      if (noteEditsDetected) {
        this.annotationNoteEditTimes.set(file.path, Date.now());
      }

      const graceRemaining = this.getAnnotationGraceRemaining(file.path);
      if (needsNoteRefresh && graceRemaining > 0 && noteEditsDetected && !forceNoteRefresh) {
        this.scheduleNoteAnnotationSync(file, graceRemaining + 250, reason);
        needsNoteRefresh = false;
      }

      if (needsNoteRefresh) {
        const updatedBlock = this.buildAnnotationBlock(docId, attachmentKey, zoteroAnnotations);
        const nextContent = this.replaceAnnotationBlock(content, updatedBlock);
        if (nextContent && nextContent !== content) {
          this.noteSyncSuppressed.add(file.path);
          this.noteAnnotationSyncSuppressed.add(file.path);
          this.noteMetadataSyncSuppressed.add(file.path);
          try {
            await this.app.vault.adapter.write(file.path, nextContent);
          } finally {
            window.setTimeout(() => {
              this.noteSyncSuppressed.delete(file.path);
              this.noteAnnotationSyncSuppressed.delete(file.path);
              this.noteMetadataSyncSuppressed.delete(file.path);
            }, 1500);
          }
        }
      }

      await this.updateAnnotationSnapshot(docId, attachmentKey, zoteroAnnotations);
      await this.updateAnnotationChunks(
        docId,
        attachmentKey,
        zoteroAnnotations,
        { allowDeletes: !resolved.hadFetchError }
      );
    } catch (error) {
      console.warn("Failed to sync note annotations with Zotero", error);
    } finally {
      this.noteAnnotationSyncInFlight.delete(file.path);
      if (this.noteAnnotationSyncPending.delete(file.path)) {
        this.scheduleNoteAnnotationSync(file, 500, reason);
      }
    }
  }

  private resolveZoteroItemKey(frontmatter: Record<string, unknown>, docId: string): string {
    const candidates = [
      this.getFrontmatterValue(frontmatter, "zotero_key"),
      this.getFrontmatterValue(frontmatter, "item_key"),
      this.getFrontmatterValue(frontmatter, "doc_id"),
      docId,
    ];
    for (const candidate of candidates) {
      const resolved = coerceString(candidate);
      if (resolved) {
        return resolved;
      }
    }
    return "";
  }

  private async resolveAttachmentKeyForDocId(
    docId: string,
    frontmatter: Record<string, unknown>
  ): Promise<string> {
    if (!docId) {
      return "";
    }
    let entry = await this.getDocIndexEntry(docId);
    if (!entry) {
      entry = await this.hydrateDocIndexFromCache(docId);
    }
    if (entry?.attachment_key) {
      return entry.attachment_key;
    }
    const chunkPath = normalizePath(`${CHUNK_CACHE_DIR}/${docId}.json`);
    try {
      const adapter = this.app.vault.adapter;
      if (await adapter.exists(chunkPath)) {
        const payload = await this.readChunkPayload(chunkPath);
        const meta = this.asRecord(payload?.metadata);
        const cachedKey = meta?.attachment_key;
        if (typeof cachedKey === "string" && cachedKey.trim()) {
          await this.updateDocIndex({ doc_id: docId, attachment_key: cachedKey.trim() });
          return cachedKey.trim();
        }
      }
    } catch {
      // ignore
    }
    const itemKey = this.resolveZoteroItemKey(frontmatter, docId);
    if (!itemKey) {
      return "";
    }
    const zoteroItem = this.asRecord(await this.fetchZoteroItem(itemKey));
    const values = this.asRecord(zoteroItem?.data) ?? zoteroItem;
    if (!values || typeof values !== "object") {
      return "";
    }
    const attachment = await resolvePdfAttachment(values, docId, {
      fetchZoteroChildren: this.fetchZoteroChildren.bind(this),
    });
    if (attachment?.key) {
      await this.updateDocIndex({ doc_id: docId, attachment_key: attachment.key });
      return attachment.key;
    }
    return "";
  }

  private extractNoteMetadata(frontmatter: Record<string, unknown>): NoteMetadataFields {
    const title = this.normalizeMetadataString(frontmatter?.title);
    const shortTitle = this.normalizeMetadataString(
      frontmatter?.["short title"]
        ?? frontmatter?.short_title
        ?? frontmatter?.shortTitle
        ?? frontmatter?.["short-title"]
        ?? frontmatter?.["title-short"]
    );
    const citekey = this.normalizeMetadataString(
      frontmatter?.citekey
        ?? frontmatter?.["citation key"]
        ?? frontmatter?.citation_key
        ?? frontmatter?.citationKey
        ?? frontmatter?.["citation-key"]
    );
    const date = this.normalizeMetadataString(frontmatter?.date);
    const abstractNote = this.normalizeMetadataString(
      frontmatter?.abstract ?? frontmatter?.abstractNote
    );
    const doi = this.normalizeMetadataString(frontmatter?.doi ?? frontmatter?.DOI);
    const publisher = this.normalizeMetadataString(frontmatter?.publisher);
    const place = this.normalizeMetadataString(frontmatter?.place);
    const issue = this.normalizeMetadataString(frontmatter?.issue);
    const volume = this.normalizeMetadataString(frontmatter?.volume);
    const pages = this.normalizeMetadataString(frontmatter?.pages);
    const itemType = this.normalizeMetadataString(
      frontmatter?.["item type"]
        ?? frontmatter?.item_type
        ?? frontmatter?.itemType
        ?? frontmatter?.["item-type"]
    );
    const tagsRaw = this.normalizeMetadataList(frontmatter?.tags);
    const authors = this.normalizeMetadataList(frontmatter?.authors);
    const editors = this.normalizeMetadataList(frontmatter?.editors);

    return {
      title,
      short_title: shortTitle,
      citekey,
      date,
      abstract: abstractNote,
      doi,
      publisher,
      place,
      issue,
      volume,
      pages,
      item_type: itemType,
      tags: this.sanitizeObsidianTags(tagsRaw),
      authors,
      editors,
    };
  }

  private extractZoteroMetadata(values: ZoteroItemValues): NoteMetadataFields {
    const title = this.normalizeMetadataString(values?.title);
    const shortTitle = this.normalizeMetadataString(extractShortTitleFromValues(values));
    const citekey = this.normalizeMetadataString(extractCitekey(values));
    const date = this.normalizeMetadataString(values?.date);
    const abstractNote = this.normalizeMetadataString(values?.abstractNote);
    const doi = this.normalizeMetadataString(values?.DOI ?? values?.doi);
    const publisher = this.normalizeMetadataString(values?.publisher);
    const place = this.normalizeMetadataString(values?.place);
    const issue = this.normalizeMetadataString(values?.issue);
    const volume = this.normalizeMetadataString(values?.volume);
    const pages = this.normalizeMetadataString(values?.pages);
    const itemType = this.normalizeMetadataString(
      values?.itemType ?? values?.item_type ?? values?.["item-type"]
    );
    const creators = Array.isArray(values?.creators) ? values.creators : [];
    const authors = creators
      .filter((creator) => creator?.creatorType === "author")
      .map((creator) => formatCreatorName(creator))
      .filter(Boolean);
    const editors = creators
      .filter(
        (creator) =>
          creator?.creatorType === "editor" || creator?.creatorType === "seriesEditor"
      )
      .map((creator) => formatCreatorName(creator))
      .filter(Boolean);
    const tagsRaw = Array.isArray(values?.tags)
      ? values.tags
          .map((tag: unknown) => (typeof tag === "string" ? tag : this.asRecord(tag)?.tag))
          .filter((tag: unknown) => typeof tag === "string")
      : [];

    return {
      title,
      short_title: shortTitle,
      citekey,
      date,
      abstract: abstractNote,
      doi,
      publisher,
      place,
      issue,
      volume,
      pages,
      item_type: itemType,
      tags: this.sanitizeObsidianTags(tagsRaw),
      authors: this.normalizeMetadataList(authors),
      editors: this.normalizeMetadataList(editors),
    };
  }

  private async resolveZoteroCitekey(
    values: ZoteroItemValues,
    itemKey: string,
    meta?: Record<string, unknown> | null
  ): Promise<string> {
    const direct = this.normalizeMetadataString(extractCitekey(values, meta ?? undefined));
    if (direct) {
      return direct;
    }
    if (!itemKey) {
      return "";
    }
    const csl = await this.fetchZoteroItemCsl(itemKey);
    return this.normalizeMetadataString(extractCitekeyFromCsl(csl));
  }

  private extractAnnotationPageInfo(values: ZoteroItemValues): { pageLabel: string; pageIndex: number | null } {
    const labelRaw = coerceString(values.annotationPageLabel ?? values.annotationPage);
    const pageLabel = labelRaw.trim();
    let pageIndex: number | null = null;
    const pageRaw = values.annotationPage;
    if (typeof pageRaw === "number" && Number.isFinite(pageRaw)) {
      pageIndex = pageRaw;
    } else if (typeof pageRaw === "string" && pageRaw.trim()) {
      const parsed = Number(pageRaw);
      if (Number.isFinite(parsed)) {
        pageIndex = parsed;
      }
    }
    if (pageIndex === null && typeof values.annotationPosition === "string") {
      try {
        const parsed = JSON.parse(values.annotationPosition);
        const idx = parsed?.pageIndex;
        if (typeof idx === "number" && Number.isFinite(idx)) {
          pageIndex = idx + 1;
        }
      } catch {
        // ignore
      }
    }
    return { pageLabel, pageIndex };
  }

  private extractAnnotationImagePayload(
    values: ZoteroItemValues
  ): { buffer: Buffer; mime: string; ext: string } | null {
    const raw =
      values.annotationImage
      ?? values.annotationImageData
      ?? values.annotationImageBase64;
    if (!raw) {
      return null;
    }
    let buffer: Buffer | null = null;
    let mime = "";

    if (Buffer.isBuffer(raw)) {
      buffer = raw;
    } else if (ArrayBuffer.isView(raw)) {
      buffer = Buffer.from(raw.buffer, raw.byteOffset, raw.byteLength);
    } else if (raw instanceof ArrayBuffer) {
      buffer = Buffer.from(raw);
    } else if (typeof raw === "string") {
      let text = raw.trim();
      if (!text) {
        return null;
      }
      const dataUrlMatch = text.match(/^data:([^;]+);base64,(.*)$/i);
      if (dataUrlMatch) {
        mime = this.normalizeAnnotationImageMime(dataUrlMatch[1]);
        text = dataUrlMatch[2];
      }
      if (/^(https?|file|zotero):/i.test(text)) {
        return null;
      }
      text = text.replace(/^base64,/, "").replace(/\s+/g, "");
      if (!text) {
        return null;
      }
      buffer = Buffer.from(text, "base64");
    }

    if (!buffer || !buffer.length) {
      return null;
    }

    if (!mime) {
      const hint = this.normalizeAnnotationImageMime(
        values.annotationImageMimeType ?? values.annotationImageType ?? values.annotationImageFormat
      );
      mime = hint || this.guessAnnotationImageMime(buffer) || "image/png";
    }
    const ext =
      this.annotationImageExtensionFromMime(mime)
      || this.annotationImageExtensionFromMime(this.guessAnnotationImageMime(buffer))
      || "png";
    return { buffer, mime, ext };
  }

  private parseZoteroAnnotationItem(
    item: ZoteroLocalItem,
    attachmentKey: string
  ): AnnotationEntry | null {
    const data: ZoteroItemValues = item?.data ?? item ?? {};
    const key = coerceString(item?.key ?? data?.key);
    if (!key) {
      return null;
    }
    const annotationType = coerceString(data.annotationType);
    const text = this.normalizeAnnotationText(data.annotationText);
    const comment = this.normalizeAnnotationText(data.annotationComment);
    const colorRaw = coerceString(data.annotationColor);
    const colorKey = this.normalizeAnnotationColorKey(colorRaw);
    const { heading, callout } = this.resolveAnnotationColorMeta(colorKey);
    const { pageLabel, pageIndex } = this.extractAnnotationPageInfo(data);
    const sortRaw = data.annotationSortIndex ?? data.annotationSort;
    const sortToken = coerceString(sortRaw).trim();
    const sortIndex = Number.isFinite(Number(sortToken)) ? Number(sortToken) : Number.NaN;
    const tags = Array.isArray(data.tags)
      ? data.tags
          .map((tag: unknown) => (typeof tag === "string" ? tag : this.asRecord(tag)?.tag))
          .filter((tag: unknown) => typeof tag === "string")
      : [];
    return {
      key: key.trim(),
      attachmentKey,
      pageLabel,
      pageIndex,
      colorKey,
      callout,
      heading,
      annotationType,
      text,
      comment,
      tags: this.normalizeAnnotationTags(tags),
      sortToken,
      sortIndex,
      rawValues: data,
    };
  }

  private async fetchZoteroAnnotations(
    attachmentKey: string
  ): Promise<AttachmentAnnotationFetchResult> {
    if (!attachmentKey) {
      return { annotations: [], hadFetchError: false };
    }
    const canUseWebApi = this.canUseWebApi() || (await this.ensureWebApiLibraryId());
    let hadFetchError = false;
    let webRequestSucceeded = false;
    const parseAnnotations = (children: unknown[]): AnnotationEntry[] => {
      const annotations: AnnotationEntry[] = [];
      for (const child of children) {
        const childRecord = this.asRecord(child);
        const data = this.asRecord(childRecord?.data) ?? childRecord ?? {};
        if (coerceString(data.itemType) !== "annotation") {
          continue;
        }
        const parsed = this.parseZoteroAnnotationItem(child as ZoteroLocalItem, attachmentKey);
        if (parsed) {
          annotations.push(parsed);
        }
      }
      return annotations;
    };
    let children: unknown[] = [];
    try {
      children = await this.fetchZoteroChildrenLocal(attachmentKey, { includeAnnotationImage: true });
    } catch {
      try {
        children = await this.fetchZoteroChildrenLocal(attachmentKey);
      } catch (fallbackError) {
        hadFetchError = true;
        console.warn("Failed to fetch Zotero annotation items from local API", fallbackError);
      }
    }
    let annotations = parseAnnotations(children);
    if (!annotations.length && canUseWebApi) {
      try {
        let webChildren: unknown[] = [];
        try {
          webChildren = await this.fetchZoteroChildrenWeb(attachmentKey, { includeAnnotationImage: true });
        } catch {
          webChildren = await this.fetchZoteroChildrenWeb(attachmentKey);
        }
        webRequestSucceeded = true;
        const webAnnotations = parseAnnotations(webChildren);
        if (webAnnotations.length) {
          annotations = webAnnotations;
        }
      } catch (error) {
        hadFetchError = true;
        console.warn("Failed to fetch Zotero annotation items from Web API", error);
      }
    }
    if (!annotations.length && canUseWebApi && !webRequestSucceeded) {
      hadFetchError = true;
    }
    if (!annotations.length && !canUseWebApi) {
      hadFetchError = true;
    }
    return { annotations, hadFetchError };
  }

  private async fetchZoteroAnnotationsForDoc(
    docId: string,
    attachmentKey: string
  ): Promise<DocumentAnnotationFetchResult> {
    const primaryKey = attachmentKey;
    const primary = await this.fetchZoteroAnnotations(primaryKey);
    if (primary.annotations.length || !docId) {
      if (!primary.annotations.length) {
        this.maybeWarnMissingAnnotationApi(docId, attachmentKey);
      }
      return {
        attachmentKey: primaryKey,
        annotations: primary.annotations,
        hadFetchError: primary.hadFetchError,
      };
    }
    let children: unknown[] = [];
    try {
      children = await this.fetchZoteroChildren(docId);
    } catch (error) {
      console.warn("Failed to fetch Zotero attachments for annotations", error);
      this.maybeWarnMissingAnnotationApi(docId, attachmentKey);
      return {
        attachmentKey: primaryKey,
        annotations: primary.annotations,
        hadFetchError: true,
      };
    }
    let hadFetchError = primary.hadFetchError;
    const candidates: string[] = [];
    const seen = new Set<string>(primaryKey ? [primaryKey] : []);
    for (const child of children) {
      if (!isPdfAttachment(child)) {
        continue;
      }
      const childRecord = this.asRecord(child);
      const childData = this.asRecord(childRecord?.data);
      const key = coerceString(childRecord?.key ?? childData?.key ?? childRecord?.attachmentKey);
      if (!key || seen.has(key)) {
        continue;
      }
      seen.add(key);
      candidates.push(key);
    }
    for (const candidate of candidates) {
      const result = await this.fetchZoteroAnnotations(candidate);
      hadFetchError = hadFetchError || result.hadFetchError;
      if (result.annotations.length) {
        return {
          attachmentKey: candidate,
          annotations: result.annotations,
          hadFetchError,
        };
      }
    }
    this.maybeWarnMissingAnnotationApi(docId, attachmentKey);
    return {
      attachmentKey: primaryKey,
      annotations: primary.annotations,
      hadFetchError,
    };
  }

  private async attachAnnotationImages(
    docId: string,
    attachmentKey: string,
    annotations: AnnotationEntry[],
    notePath?: string,
    existingImages?: Map<string, { path: string; hash: string }>
  ): Promise<void> {
    if (!this.settings.includeAnnotationImages || !annotations.length) {
      return;
    }
    const outputDir = await this.resolveAnnotationImageOutputDir(notePath);
    if (!outputDir) {
      return;
    }
    const docFolder = this.sanitizeFileName(docId || attachmentKey) || "annotations";
    const relDir = normalizePath(path.join(outputDir.relative || "", docFolder));
    const absDir = path.normalize(path.join(outputDir.absolute, docFolder));
    if (relDir) {
      await this.ensureFolder(relDir);
    } else {
      await fs.mkdir(absDir, { recursive: true });
    }
    const adapter = this.app.vault.adapter;
    const desiredPaths = new Map<string, string>();
    for (const annotation of annotations) {
      const annotationType = String(annotation.annotationType || "").trim().toLowerCase();
      const wantsImage = annotationType === "image" || annotationType === "ink";
      let payload = this.extractAnnotationImagePayload(annotation.rawValues ?? {});
      if (!payload && wantsImage && this.settings.zoteroCompanionEnabled) {
        payload = await this.fetchCompanionAnnotationImage(annotation.key);
      }
      if (!payload) {
        const existing = existingImages?.get(annotation.key);
        if (existing?.path && await adapter.exists(existing.path)) {
          annotation.imagePath = existing.path;
          annotation.imageHash = existing.hash;
          desiredPaths.set(annotation.key, existing.path);
        }
        continue;
      }
      const hash = createHash("sha1").update(payload.buffer).digest("hex").slice(0, 12);
      const filename = `zrr-annotation-${annotation.key}-${hash}.${payload.ext}`;
      const relativePath = normalizePath(path.join(relDir, filename));
      try {
        if (!(await adapter.exists(relativePath))) {
          await adapter.writeBinary(relativePath, this.bufferToArrayBuffer(payload.buffer));
        }
        annotation.imagePath = relativePath;
        annotation.imageHash = hash;
        desiredPaths.set(annotation.key, relativePath);
      } catch (error) {
        console.warn("Failed to write annotation image", { annotationKey: annotation.key, error });
      }
    }

    if (relDir && (await adapter.exists(relDir))) {
      try {
        const listing = await adapter.list(relDir);
        for (const file of listing.files) {
          const base = path.basename(file);
          const match = base.match(/^zrr-annotation-([A-Z0-9]{8})-[a-f0-9]{12}\./i);
          if (!match) {
            continue;
          }
          const key = match[1].toUpperCase();
          const keepPath = desiredPaths.get(key);
          if (!keepPath || normalizePath(keepPath) !== normalizePath(file)) {
            await adapter.remove(file);
          }
        }
      } catch (error) {
        console.warn("Failed to clean up annotation images", error);
      }
    }
  }

  private async fetchCompanionAnnotationImage(
    annotationKey: string
  ): Promise<{ buffer: Buffer; mime: string; ext: string } | null> {
    const baseUrl = (this.settings.zoteroCompanionBaseUrl || "").trim();
    if (!baseUrl) {
      return null;
    }
    const url = `${baseUrl.replace(/\/$/, "")}/annotations/${encodeURIComponent(annotationKey)}/image`;
    const headers: Record<string, string> = {};
    const token = (this.settings.zoteroCompanionToken || "").trim();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    try {
      const response = await this.requestLocalApiRaw(url, { headers, timeoutMs: 5000 });
      if (response.statusCode === 200) {
        const contentType = response.headers["content-type"];
        const mime = Array.isArray(contentType) ? contentType[0] : contentType ?? "";
        return this.buildAnnotationImagePayloadFromBuffer(response.body, mime);
      }
      if (response.statusCode === 204 || response.statusCode === 404) {
        return null;
      }
      console.warn("Unexpected Zotero companion response", {
        annotationKey,
        status: response.statusCode,
      });
    } catch (error) {
      console.warn("Failed to fetch annotation image from Zotero companion", error);
    }
    return null;
  }

  public async checkZoteroCompanionHealth(): Promise<void> {
    const baseUrl = (this.settings.zoteroCompanionBaseUrl || "").trim();
    if (!baseUrl) {
      new Notice("Zotero companion base URL is not set.");
      return;
    }
    const url = `${baseUrl.replace(/\/$/, "")}/health`;
    const headers: Record<string, string> = {};
    const token = (this.settings.zoteroCompanionToken || "").trim();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    try {
      const response = await this.requestLocalApiRaw(url, { headers, timeoutMs: 3000 });
      if (response.statusCode === 200) {
        try {
          const payload = JSON.parse(response.body.toString("utf8"));
          if (payload?.ok) {
            new Notice("Zotero companion: OK.");
            return;
          }
        } catch {
          // fall through
        }
        new Notice("Zotero companion responded but did not return OK.");
        return;
      }
      if (response.statusCode === 401) {
        new Notice("Zotero companion: unauthorized (check token).");
        return;
      }
      new Notice(`Zotero companion: HTTP ${response.statusCode}.`);
    } catch (error) {
      console.warn("Zotero companion health check failed", error);
      new Notice("Zotero companion: unreachable.");
    }
  }

  public async openZoteroAddons(): Promise<void> {
    try {
      const platform = process.platform;
      if (platform === "darwin") {
        await this.spawnDetached(["open", "-a", "Zotero"]);
      } else if (platform === "win32") {
        await this.spawnDetached(["cmd", "/c", "start", "", "zotero"]);
      } else {
        await this.spawnDetached(["zotero"]);
      }
      new Notice("Opened Zotero. Go to tools → add-ons.");
    } catch (error) {
      console.warn("Failed to open Zotero add-ons", error);
      new Notice("Unable to open Zotero automatically. Open Zotero and go to tools → add-ons.");
    }
  }

  private async spawnDetached(commandArgs: string[]): Promise<void> {
    const [command, ...args] = commandArgs;
    if (!command) {
      throw new Error("Missing command");
    }
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const child = spawn(command, args, { detached: true, stdio: "ignore" });
      child.on("error", (error) => {
        if (settled) return;
        settled = true;
        reject(error);
      });
      child.unref();
      if (!settled) {
        settled = true;
        resolve();
      }
    });
  }

  private maybeWarnMissingAnnotationApi(docId: string, attachmentKey: string): void {
    if (this.canUseWebApi()) {
      console.debug("No Zotero annotations returned for attachment", { docId, attachmentKey });
      return;
    }
    const key = docId || attachmentKey;
    if (!key || this.annotationWebApiWarned.has(key)) {
      return;
    }
    this.annotationWebApiWarned.add(key);
    new Notice("Zotero annotations require web API access. Configure the web API library ID and key to import annotations.");
  }

  private normalizeMetadataString(value: unknown): string {
    if (typeof value === "string") {
      return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
    return "";
  }

  private normalizeMetadataList(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value
        .map((entry) => this.normalizeMetadataString(entry))
        .filter((entry) => entry.length > 0);
    }
    if (typeof value === "string") {
      return value
        .split(/[,;\n]+/)
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
    }
    return [];
  }

  private coerceMetadataStringValue(value: string | string[]): string {
    if (Array.isArray(value)) {
      return value.join("; ").trim();
    }
    return this.normalizeMetadataString(value);
  }

  private assignMetadataUpdate(
    target: Partial<NoteMetadataFields>,
    field: keyof NoteMetadataFields,
    value: string | string[]
  ): void {
    if (field === "tags" || field === "authors" || field === "editors") {
      target[field] = Array.isArray(value) ? value : this.normalizeMetadataList(value);
      return;
    }
    target[field] = this.coerceMetadataStringValue(value);
  }

  private metadataValuesEqual(
    field: keyof NoteMetadataFields,
    noteValue: string | string[],
    zoteroValue: string | string[]
  ): boolean {
    if (Array.isArray(noteValue) || Array.isArray(zoteroValue)) {
      const left = Array.isArray(noteValue) ? noteValue : this.normalizeMetadataList(noteValue);
      const right = Array.isArray(zoteroValue) ? zoteroValue : this.normalizeMetadataList(zoteroValue);
      const unordered = field === "tags";
      return this.compareMetadataLists(left, right, unordered);
    }
    return this.normalizeMetadataString(noteValue) === this.normalizeMetadataString(zoteroValue);
  }

  private compareMetadataLists(left: string[], right: string[], unordered: boolean): boolean {
    const normalize = (value: string): string =>
      value.replace(/\s+/g, " ").trim();
    const leftNorm = left.map(normalize).filter(Boolean);
    const rightNorm = right.map(normalize).filter(Boolean);
    if (unordered) {
      leftNorm.sort();
      rightNorm.sort();
    }
    if (leftNorm.length !== rightNorm.length) {
      return false;
    }
    for (let i = 0; i < leftNorm.length; i += 1) {
      if (leftNorm[i] !== rightNorm[i]) {
        return false;
      }
    }
    return true;
  }

  private isMetadataValueEmpty(value: string | string[]): boolean {
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    return this.normalizeMetadataString(value).length === 0;
  }

  private formatMetadataValue(value: string | string[]): string {
    if (Array.isArray(value)) {
      return value.join("\n");
    }
    return this.normalizeMetadataString(value);
  }

  private normalizeAnnotationText(value: unknown): string {
    if (typeof value === "string") {
      return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
    return "";
  }

  private normalizeAnnotationImageMime(value: unknown): string {
    const raw = coerceString(value).toLowerCase();
    if (!raw) {
      return "";
    }
    if (raw.includes("/")) {
      return raw;
    }
    if (raw === "png") {
      return "image/png";
    }
    if (raw === "jpg" || raw === "jpeg") {
      return "image/jpeg";
    }
    if (raw === "gif") {
      return "image/gif";
    }
    if (raw === "webp") {
      return "image/webp";
    }
    return "";
  }

  private buildAnnotationImagePayloadFromBuffer(
    buffer: Buffer,
    mimeRaw?: string
  ): { buffer: Buffer; mime: string; ext: string } | null {
    if (!buffer || !buffer.length) {
      return null;
    }
    let mime = this.normalizeAnnotationImageMime(mimeRaw);
    if (!mime) {
      mime = this.guessAnnotationImageMime(buffer) || "image/png";
    }
    const ext =
      this.annotationImageExtensionFromMime(mime)
      || this.annotationImageExtensionFromMime(this.guessAnnotationImageMime(buffer))
      || "png";
    return { buffer, mime, ext };
  }

  private guessAnnotationImageMime(buffer: Buffer): string {
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return "image/jpeg";
    }
    if (
      buffer.length >= 4
      && buffer[0] === 0x89
      && buffer[1] === 0x50
      && buffer[2] === 0x4e
      && buffer[3] === 0x47
    ) {
      return "image/png";
    }
    if (buffer.length >= 6 && buffer.subarray(0, 3).toString("ascii") === "GIF") {
      return "image/gif";
    }
    if (
      buffer.length >= 12
      && buffer.subarray(0, 4).toString("ascii") === "RIFF"
      && buffer.subarray(8, 12).toString("ascii") === "WEBP"
    ) {
      return "image/webp";
    }
    return "";
  }

  private annotationImageExtensionFromMime(mime: string): string {
    switch (mime.toLowerCase()) {
      case "image/png":
        return "png";
      case "image/jpeg":
      case "image/jpg":
        return "jpg";
      case "image/gif":
        return "gif";
      case "image/webp":
        return "webp";
      default:
        return "";
    }
  }

  private extractAnnotationImageHashFromPath(imagePath: string): string {
    if (!imagePath) {
      return "";
    }
    const base = path.basename(imagePath);
    const match = base.match(/^zrr-annotation-[A-Z0-9]{8}-([a-f0-9]{12})\./i);
    return match ? match[1].toLowerCase() : "";
  }

  private normalizeAnnotationTags(tags: string[]): string[] {
    const sanitized = this.sanitizeObsidianTags(tags);
    const unique = Array.from(new Set(sanitized));
    unique.sort();
    return unique;
  }

  private getAnnotationColorMap(): AnnotationColorMap {
    const map = this.settings.annotationColorMap;
    if (map && typeof map === "object") {
      return map;
    }
    return DEFAULT_SETTINGS.annotationColorMap;
  }

  private normalizeAnnotationColorKey(raw: string): string {
    const map = this.getAnnotationColorMap();
    let normalized = String(raw || "").trim().toLowerCase();
    if (!normalized) {
      return Object.keys(map)[0] ?? "gray";
    }
    if (normalized === "grey") {
      normalized = "gray";
    }
    if (map[normalized]) {
      return normalized;
    }
    if (normalized.startsWith("#")) {
      const inferred = this.inferAnnotationColorFromHex(normalized);
      if (inferred && map[inferred]) {
        return inferred;
      }
    }
    return map["gray"] ? "gray" : (Object.keys(map)[0] ?? "gray");
  }

  private inferAnnotationColorFromHex(hex: string): string | null {
    const normalized = hex.replace("#", "").trim();
    if (![3, 6].includes(normalized.length)) {
      return null;
    }
    const expand = (value: string): string =>
      value.length === 1 ? `${value}${value}` : value;
    const rHex = normalized.length === 3 ? expand(normalized[0]) : normalized.slice(0, 2);
    const gHex = normalized.length === 3 ? expand(normalized[1]) : normalized.slice(2, 4);
    const bHex = normalized.length === 3 ? expand(normalized[2]) : normalized.slice(4, 6);
    const r = parseInt(rHex, 16) / 255;
    const g = parseInt(gHex, 16) / 255;
    const b = parseInt(bHex, 16) / 255;
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
      return null;
    }
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    const lightness = (max + min) / 2;
    if (delta < 0.08 || lightness < 0.12) {
      return "gray";
    }
    let hue = 0;
    if (delta === 0) {
      hue = 0;
    } else if (max === r) {
      hue = ((g - b) / delta) % 6;
    } else if (max === g) {
      hue = (b - r) / delta + 2;
    } else {
      hue = (r - g) / delta + 4;
    }
    hue = Math.round(hue * 60);
    if (hue < 0) {
      hue += 360;
    }
    if (hue < 20 || hue >= 340) {
      return "red";
    }
    if (hue < 45) {
      return "orange";
    }
    if (hue < 70) {
      return "yellow";
    }
    if (hue < 160) {
      return "green";
    }
    if (hue < 250) {
      return "blue";
    }
    if (hue < 290) {
      return "purple";
    }
    if (hue < 330) {
      return "magenta";
    }
    return "red";
  }

  private resolveAnnotationColorMeta(colorKey: string): { heading: string; callout: string } {
    const map = this.getAnnotationColorMap();
    const entry = map[colorKey];
    if (entry && entry.heading && entry.callout) {
      return entry;
    }
    const fallback = map.gray || map.yellow || { heading: "Annotations", callout: "note" };
    return fallback;
  }

  private getMetadataDecisionLabels(
    field: keyof NoteMetadataFields,
    noteValue: string | string[],
    zoteroValue: string | string[],
    fieldLabels: Record<keyof NoteMetadataFields, string>
  ): { fieldLabel: string; noteLabel: string; zoteroLabel: string } {
    const noteEmpty = this.isMetadataValueEmpty(noteValue);
    const zoteroEmpty = this.isMetadataValueEmpty(zoteroValue);
    let noteLabel = "Keep note";
    let zoteroLabel = "Keep Zotero";
    if (noteEmpty && !zoteroEmpty) {
      noteLabel = "Delete in Zotero";
      zoteroLabel = "Use Zotero value";
    } else if (!noteEmpty && zoteroEmpty) {
      noteLabel = "Update Zotero from note";
      zoteroLabel = "Clear note";
    }
    return {
      fieldLabel: fieldLabels[field],
      noteLabel,
      zoteroLabel,
    };
  }

  private async promptMetadataBatchDecision(
    conflicts: Array<{
      field: keyof NoteMetadataFields;
      fieldLabel: string;
      noteLabel: string;
      zoteroLabel: string;
      noteValue: string;
      zoteroValue: string;
    }>
  ): Promise<Record<keyof NoteMetadataFields, MetadataDecision>> {
    return new Promise((resolve) => {
      new MetadataConflictBatchModal(
        this.app,
        conflicts.map((conflict) => ({
          field: conflict.field,
          fieldLabel: conflict.fieldLabel,
          noteLabel: conflict.noteLabel,
          zoteroLabel: conflict.zoteroLabel,
          noteValue: conflict.noteValue,
          zoteroValue: conflict.zoteroValue,
        })),
        (decisions) => resolve(decisions as Record<keyof NoteMetadataFields, MetadataDecision>)
      ).open();
    });
  }

  private formatAnnotationConflictTitle(entry: AnnotationEntry): string {
    const label = this.settings.annotationPageLabel || "Page";
    const pageLabel = entry.pageLabel || (entry.pageIndex ? String(entry.pageIndex) : "?");
    return `${label} ${pageLabel} (${entry.key})`;
  }

  private formatAnnotationConflictValue(
    snapshot: AnnotationSnapshotEntry,
    tags: string[]
  ): string {
    const lines: string[] = [];
    if (snapshot.text) {
      lines.push("Highlight:", snapshot.text);
    }
    if (snapshot.comment) {
      if (lines.length) {
        lines.push("");
      }
      lines.push("Comment:", snapshot.comment);
    }
    const normalizedTags = this.normalizeAnnotationTags(tags);
    if (normalizedTags.length) {
      if (lines.length) {
        lines.push("");
      }
      lines.push(`Tags: ${normalizedTags.map((tag) => `#${tag}`).join(" ")}`);
    }
    return lines.join("\n").trim();
  }

  private async promptAnnotationBatchDecision(
    conflicts: Array<{ key: string; title: string; noteValue: string; zoteroValue: string }>
  ): Promise<Record<string, MetadataDecision>> {
    return new Promise((resolve) => {
      new AnnotationConflictBatchModal(
        this.app,
        conflicts,
        (decisions) => resolve(decisions)
      ).open();
    });
  }

  private normalizeSnapshotValue<K extends keyof NoteMetadataFields>(
    field: K,
    value: unknown
  ): NoteMetadataFields[K] {
    if (field === "tags") {
      const list = this.normalizeMetadataList(value);
      return [...list].sort() as NoteMetadataFields[K];
    }
    if (field === "authors" || field === "editors") {
      return this.normalizeMetadataList(value) as NoteMetadataFields[K];
    }
    return this.normalizeMetadataString(value) as NoteMetadataFields[K];
  }

  private setMetadataSnapshotValue<K extends keyof NoteMetadataFields>(
    snapshot: Partial<NoteMetadataFields>,
    field: K,
    value: NoteMetadataFields[K]
  ): void {
    snapshot[field] = value;
  }

  private getMetadataSnapshotCachePath(): string {
    return normalizePath(METADATA_SNAPSHOT_PATH);
  }

  private normalizeMetadataSnapshotRecord(raw: unknown): Partial<NoteMetadataFields> | null {
    if (!raw) {
      return null;
    }
    let parsed: unknown = raw;
    if (typeof raw === "string") {
      try {
        parsed = JSON.parse(raw);
      } catch {
        return null;
      }
    }
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    const snapshot: Partial<NoteMetadataFields> = {};
    const fieldOrder: Array<keyof NoteMetadataFields> = [
      "title",
      "short_title",
      "citekey",
      "date",
      "abstract",
      "doi",
      "publisher",
      "place",
      "issue",
      "volume",
      "pages",
      "item_type",
      "tags",
      "authors",
      "editors",
    ];
    for (const field of fieldOrder) {
      if (Object.prototype.hasOwnProperty.call(parsed, field)) {
        this.setMetadataSnapshotValue(
          snapshot,
          field,
          this.normalizeSnapshotValue(field, (parsed as Record<string, unknown>)[field])
        );
      }
    }
    return Object.keys(snapshot).length > 0 ? snapshot : null;
  }

  private parseLegacyMetadataSnapshot(frontmatter: Record<string, unknown>): Partial<NoteMetadataFields> | null {
    if (!frontmatter) {
      return null;
    }
    const raw =
      (frontmatter).zrr_metadata_snapshot
      ?? (frontmatter)["zrr metadata snapshot"];
    if (!raw) {
      return null;
    }
    return this.normalizeMetadataSnapshotRecord(raw);
  }

  private async loadMetadataSnapshotCache(): Promise<Record<string, Partial<NoteMetadataFields>>> {
    const adapter = this.app.vault.adapter;
    const cachePath = this.getMetadataSnapshotCachePath();
    if (!(await adapter.exists(cachePath))) {
      return {};
    }
    try {
      const raw = await adapter.read(cachePath);
      const payload = JSON.parse(raw);
      const entries = payload?.entries ?? payload;
      if (!entries || typeof entries !== "object" || Array.isArray(entries)) {
        return {};
      }
      const snapshots: Record<string, Partial<NoteMetadataFields>> = {};
      for (const [docId, snapshotRaw] of Object.entries(entries)) {
        const normalized = this.normalizeMetadataSnapshotRecord(snapshotRaw);
        if (normalized) {
          snapshots[String(docId)] = normalized;
        }
      }
      return snapshots;
    } catch (error) {
      console.error("Failed to read metadata snapshot cache", error);
      return {};
    }
  }

  private async getMetadataSnapshotCache(): Promise<Record<string, Partial<NoteMetadataFields>>> {
    if (this.metadataSnapshotCache) {
      return this.metadataSnapshotCache;
    }
    this.metadataSnapshotCache = await this.loadMetadataSnapshotCache();
    return this.metadataSnapshotCache;
  }

  private async saveMetadataSnapshotCache(
    cache: Record<string, Partial<NoteMetadataFields>>
  ): Promise<void> {
    await this.ensureFolder(CACHE_ROOT);
    const adapter = this.app.vault.adapter;
    const cachePath = this.getMetadataSnapshotCachePath();
    const payload = { version: 1, entries: cache };
    await adapter.write(cachePath, JSON.stringify(payload, null, 2));
    this.metadataSnapshotCache = cache;
  }

  private async removeLegacyMetadataSnapshotFrontmatter(
    file: TFile,
    frontmatter?: Record<string, unknown> | null
  ): Promise<void> {
    const hasLegacy = Boolean(
      frontmatter
        && (Object.prototype.hasOwnProperty.call(frontmatter, "zrr_metadata_snapshot")
          || Object.prototype.hasOwnProperty.call(frontmatter, "zrr metadata snapshot"))
    );
    if (!hasLegacy) {
      return;
    }
    const notePath = file.path;
    this.noteSyncSuppressed.add(notePath);
    this.noteMetadataSyncSuppressed.add(notePath);
    try {
      await this.app.fileManager.processFrontMatter(file, (fm) => {
        delete (fm as Record<string, unknown>).zrr_metadata_snapshot;
        delete (fm as Record<string, unknown>)["zrr metadata snapshot"];
      });
    } catch (error) {
      console.warn("Failed to remove legacy metadata snapshot", error);
    } finally {
      window.setTimeout(() => {
        this.noteSyncSuppressed.delete(notePath);
        this.noteMetadataSyncSuppressed.delete(notePath);
      }, 1500);
    }
  }

  private async getMetadataSnapshot(
    docId: string,
    frontmatter: Record<string, unknown> | null,
    file: TFile
  ): Promise<Partial<NoteMetadataFields> | null> {
    if (!docId) {
      return null;
    }
    const cache = await this.getMetadataSnapshotCache();
    const cached = cache[docId];
    if (cached) {
      return cached;
    }
    const legacy = frontmatter ? this.parseLegacyMetadataSnapshot(frontmatter) : null;
    if (!legacy) {
      return null;
    }
    cache[docId] = legacy;
    await this.saveMetadataSnapshotCache(cache);
    await this.removeLegacyMetadataSnapshotFrontmatter(file, frontmatter);
    return legacy;
  }

  private serializeMetadataSnapshot(
    snapshot: Partial<NoteMetadataFields>,
    fieldOrder: Array<keyof NoteMetadataFields>
  ): string {
    const ordered: Record<string, unknown> = {};
    for (const field of fieldOrder) {
      if (snapshot[field] !== undefined) {
        ordered[field] = snapshot[field];
      }
    }
    return JSON.stringify(ordered);
  }

  private async updateMetadataSnapshot(
    file: TFile,
    docId: string,
    noteFields: NoteMetadataFields,
    zoteroFields: NoteMetadataFields,
    snapshot: Partial<NoteMetadataFields> | null,
    decisions: Partial<Record<keyof NoteMetadataFields, MetadataDecision>>,
    fieldOrder: Array<keyof NoteMetadataFields>
  ): Promise<void> {
    if (!docId) {
      return;
    }
    const nextSnapshot: Partial<NoteMetadataFields> = snapshot ? { ...snapshot } : {};
    for (const field of fieldOrder) {
      const noteValue = noteFields[field];
      const zoteroValue = zoteroFields[field];
      if (this.metadataValuesEqual(field, noteValue, zoteroValue)) {
        this.setMetadataSnapshotValue(
          nextSnapshot,
          field,
          this.normalizeSnapshotValue(field, noteValue)
        );
        continue;
      }
      const decision = decisions[field];
      if (decision === "note") {
        this.setMetadataSnapshotValue(
          nextSnapshot,
          field,
          this.normalizeSnapshotValue(field, noteValue)
        );
      } else if (decision === "zotero") {
        this.setMetadataSnapshotValue(
          nextSnapshot,
          field,
          this.normalizeSnapshotValue(field, zoteroValue)
        );
      }
    }
    const serialized = this.serializeMetadataSnapshot(nextSnapshot, fieldOrder);
    const cache = await this.getMetadataSnapshotCache();
    const existingSnapshot = cache[docId];
    const existingSerialized = existingSnapshot
      ? this.serializeMetadataSnapshot(existingSnapshot, fieldOrder)
      : "";
    if (serialized === existingSerialized) {
      return;
    }
    cache[docId] = nextSnapshot;
    try {
      await this.saveMetadataSnapshotCache(cache);
    } catch (error) {
      console.warn("Failed to update metadata snapshot cache", error);
    }
    await this.removeLegacyMetadataSnapshotFrontmatter(
      file,
      this.app.metadataCache.getFileCache(file)?.frontmatter ?? null
    );
  }

  private async removeMetadataSnapshot(docId: string): Promise<void> {
    if (!docId) {
      return;
    }
    const cache = await this.getMetadataSnapshotCache();
    if (!cache[docId]) {
      return;
    }
    delete cache[docId];
    try {
      await this.saveMetadataSnapshotCache(cache);
    } catch (error) {
      console.warn("Failed to remove metadata snapshot", error);
    }
  }

  private getAnnotationSnapshotCachePath(): string {
    return normalizePath(ANNOTATION_SNAPSHOT_PATH);
  }

  private async loadAnnotationSnapshotCache(): Promise<Record<string, AnnotationSnapshotCacheEntry>> {
    const adapter = this.app.vault.adapter;
    const cachePath = this.getAnnotationSnapshotCachePath();
    if (!(await adapter.exists(cachePath))) {
      return {};
    }
    try {
      const raw = await adapter.read(cachePath);
      const payload = JSON.parse(raw);
      const entries = payload?.entries ?? payload;
      if (!entries || typeof entries !== "object" || Array.isArray(entries)) {
        return {};
      }
      return entries as Record<string, AnnotationSnapshotCacheEntry>;
    } catch (error) {
      console.error("Failed to read annotation snapshot cache", error);
      return {};
    }
  }

  private async getAnnotationSnapshotCache(): Promise<Record<string, AnnotationSnapshotCacheEntry>> {
    if (this.annotationSnapshotCache) {
      return this.annotationSnapshotCache;
    }
    this.annotationSnapshotCache = await this.loadAnnotationSnapshotCache();
    return this.annotationSnapshotCache;
  }

  private async saveAnnotationSnapshotCache(
    cache: Record<string, AnnotationSnapshotCacheEntry>
  ): Promise<void> {
    await this.ensureFolder(CACHE_ROOT);
    const adapter = this.app.vault.adapter;
    const cachePath = this.getAnnotationSnapshotCachePath();
    const payload = { version: 1, entries: cache };
    await adapter.write(cachePath, JSON.stringify(payload, null, 2));
    this.annotationSnapshotCache = cache;
  }

  private annotationSnapshotFromEntry(
    entry: { text: string; comment: string; tags: string[]; imageHash?: string; colorKey?: string },
    annotationType?: string
  ): AnnotationSnapshotEntry {
    const normalizedText = this.normalizeAnnotationText(entry.text);
    const normalizedComment = this.normalizeAnnotationText(entry.comment);
    const normalizedTags = this.normalizeAnnotationTags(entry.tags ?? []);
    const imageHash = entry.imageHash ? entry.imageHash.toLowerCase() : "";
    const colorKey = entry.colorKey ? this.normalizeAnnotationColorKey(entry.colorKey) : "";
    if (annotationType === "note" && !normalizedComment && normalizedText) {
      return { text: "", comment: normalizedText, tags: normalizedTags, image_hash: imageHash, color_key: colorKey };
    }
    return { text: normalizedText, comment: normalizedComment, tags: normalizedTags, image_hash: imageHash, color_key: colorKey };
  }

  private annotationSnapshotsEqual(
    left: AnnotationSnapshotEntry,
    right: AnnotationSnapshotEntry
  ): boolean {
    if (left.text !== right.text || left.comment !== right.comment) {
      return false;
    }
    if ((left.image_hash || "") !== (right.image_hash || "")) {
      return false;
    }
    if (left.tags.length !== right.tags.length) {
      return false;
    }
    for (let i = 0; i < left.tags.length; i += 1) {
      if (left.tags[i] !== right.tags[i]) {
        return false;
      }
    }
    return true;
  }

  private annotationSnapshotsEqualIgnoringImage(
    left: AnnotationSnapshotEntry,
    right: AnnotationSnapshotEntry
  ): boolean {
    if (left.text !== right.text || left.comment !== right.comment) {
      return false;
    }
    if (left.tags.length !== right.tags.length) {
      return false;
    }
    for (let i = 0; i < left.tags.length; i += 1) {
      if (left.tags[i] !== right.tags[i]) {
        return false;
      }
    }
    return true;
  }

  private async getAnnotationSnapshot(
    docId: string
  ): Promise<AnnotationSnapshotCacheEntry | null> {
    if (!docId) {
      return null;
    }
    const cache = await this.getAnnotationSnapshotCache();
    return cache[docId] ?? null;
  }

  private async updateAnnotationSnapshot(
    docId: string,
    attachmentKey: string,
    annotations: AnnotationEntry[]
  ): Promise<void> {
    if (!docId) {
      return;
    }
    const cache = await this.getAnnotationSnapshotCache();
    const snapshot: AnnotationSnapshotCacheEntry = {
      attachment_key: attachmentKey,
      annotations: {},
    };
    for (const annotation of annotations) {
      snapshot.annotations[annotation.key] = this.annotationSnapshotFromEntry(
        annotation,
        annotation.annotationType
      );
    }
    cache[docId] = snapshot;
    try {
      await this.saveAnnotationSnapshotCache(cache);
    } catch (error) {
      console.warn("Failed to update annotation snapshot cache", error);
    }
  }

  private async applyNoteMetadataUpdates(
    file: TFile,
    updates: Partial<NoteMetadataFields>
  ): Promise<void> {
    if (!Object.keys(updates).length) {
      return;
    }
    const notePath = file.path;
    this.noteSyncSuppressed.add(notePath);
    this.noteMetadataSyncSuppressed.add(notePath);
    try {
      await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
        if ("title" in updates) {
          frontmatter.title = updates.title ?? "";
        }
        if ("short_title" in updates) {
          frontmatter["short title"] = updates.short_title ?? "";
          delete (frontmatter as Record<string, unknown>).short_title;
          delete (frontmatter as Record<string, unknown>).shortTitle;
          delete (frontmatter as Record<string, unknown>)["title-short"];
        }
        if ("citekey" in updates) {
          frontmatter.citekey = updates.citekey ?? "";
          delete (frontmatter as Record<string, unknown>).citation_key;
          delete (frontmatter as Record<string, unknown>).citationKey;
          delete (frontmatter as Record<string, unknown>)["citation key"];
          delete (frontmatter as Record<string, unknown>)["citation-key"];
        }
        if ("date" in updates) {
          frontmatter.date = updates.date ?? "";
        }
        if ("abstract" in updates) {
          frontmatter.abstract = updates.abstract ?? "";
        }
        if ("doi" in updates) {
          frontmatter.doi = updates.doi ?? "";
        }
        if ("publisher" in updates) {
          frontmatter.publisher = updates.publisher ?? "";
        }
        if ("place" in updates) {
          frontmatter.place = updates.place ?? "";
        }
        if ("issue" in updates) {
          frontmatter.issue = updates.issue ?? "";
        }
        if ("volume" in updates) {
          frontmatter.volume = updates.volume ?? "";
        }
        if ("pages" in updates) {
          frontmatter.pages = updates.pages ?? "";
        }
        if ("item_type" in updates) {
          frontmatter["item type"] = updates.item_type ?? "";
          delete (frontmatter as Record<string, unknown>).item_type;
          delete (frontmatter as Record<string, unknown>).itemType;
          delete (frontmatter as Record<string, unknown>)["item-type"];
        }
        if ("tags" in updates) {
          frontmatter.tags = Array.isArray(updates.tags) ? updates.tags : [];
        }
        if ("authors" in updates) {
          frontmatter.authors = Array.isArray(updates.authors) ? updates.authors : [];
        }
        if ("editors" in updates) {
          frontmatter.editors = Array.isArray(updates.editors) ? updates.editors : [];
        }
      });
    } catch (error) {
      console.warn("Failed to update note frontmatter from Zotero", error);
    } finally {
      window.setTimeout(() => {
        this.noteSyncSuppressed.delete(notePath);
        this.noteMetadataSyncSuppressed.delete(notePath);
      }, 1500);
    }
  }

  private async applyZoteroMetadataUpdates(
    itemKey: string,
    values: ZoteroItemValues,
    noteFields: NoteMetadataFields,
    zoteroFields: NoteMetadataFields,
    updates: Partial<NoteMetadataFields>
  ): Promise<void> {
    if (!Object.keys(updates).length) {
      return;
    }
    const payload: Partial<ZoteroItemValues> = {};
    if ("title" in updates) {
      payload.title = updates.title ?? "";
    }
    if ("short_title" in updates) {
      payload.shortTitle = updates.short_title ?? "";
    }
    if ("citekey" in updates) {
      const citekey = updates.citekey ?? "";
      payload.citationKey = citekey;
      payload.extra = this.updateExtraWithCitekey(values?.extra, citekey);
    }
    if ("date" in updates) {
      payload.date = updates.date ?? "";
    }
    if ("abstract" in updates) {
      payload.abstractNote = updates.abstract ?? "";
    }
    if ("doi" in updates) {
      payload.DOI = updates.doi ?? "";
    }
    if ("publisher" in updates) {
      payload.publisher = updates.publisher ?? "";
    }
    if ("place" in updates) {
      payload.place = updates.place ?? "";
    }
    if ("issue" in updates) {
      payload.issue = updates.issue ?? "";
    }
    if ("volume" in updates) {
      payload.volume = updates.volume ?? "";
    }
    if ("pages" in updates) {
      payload.pages = updates.pages ?? "";
    }
    if ("item_type" in updates) {
      const nextItemType = this.normalizeMetadataString(updates.item_type);
      if (nextItemType) {
        const isValid = /^[A-Za-z][A-Za-z0-9]*$/.test(nextItemType);
        if (isValid) {
          payload.itemType = nextItemType;
        } else {
          console.warn("Skipping invalid item_type update", { itemKey, itemType: nextItemType });
        }
      }
    }
    if ("tags" in updates) {
      payload.tags = this.buildZoteroTags(noteFields.tags, values?.tags);
    }
    if ("authors" in updates || "editors" in updates) {
      const targetAuthors = "authors" in updates ? noteFields.authors : zoteroFields.authors;
      const targetEditors = "editors" in updates ? noteFields.editors : zoteroFields.editors;
      payload.creators = this.buildZoteroCreators(
        targetAuthors,
        targetEditors,
        Array.isArray(values?.creators) ? values.creators : []
      );
    }
    await this.updateZoteroItemFields(itemKey, values, payload);
  }

  private updateExtraWithCitekey(extraRaw: unknown, citekeyRaw: string): string {
    const citekey = this.normalizeMetadataString(citekeyRaw);
    const extra = this.normalizeMetadataString(extraRaw);
    const lines = extra ? extra.split(/\r?\n/) : [];
    const filtered = lines.filter((line) => !this.isCitekeyExtraLine(line));
    if (citekey) {
      filtered.push(`Citation Key: ${citekey}`);
    }
    return filtered.join("\n").trim();
  }

  private isCitekeyExtraLine(line: string): boolean {
    const trimmed = line.trim();
    if (!trimmed) {
      return false;
    }
    if (/^biblatexcitekey\s*\[[^\]]*\]\s*$/i.test(trimmed)) {
      return true;
    }
    return /^\s*(citation key|citationkey|citekey|citation-key|bibtex key|bibtexkey|bibtex)\s*:/i.test(trimmed);
  }

  private async applyZoteroAnnotationUpdates(
    updates: Array<{ entry: AnnotationEntry; note: ParsedAnnotationNote }>
  ): Promise<void> {
    for (const update of updates) {
      const { entry, note } = update;
      const values = entry.rawValues ?? {};
      let noteText = this.normalizeAnnotationText(note.text);
      let noteComment = this.normalizeAnnotationText(note.comment);
      const annotationType = String(entry.annotationType || "").trim().toLowerCase();
      const allowText = annotationType === "highlight" || annotationType === "underline";
      if (!allowText && !noteComment && noteText) {
        noteComment = noteText;
        noteText = "";
      }
      if (annotationType === "note" && !noteComment && noteText) {
        noteComment = noteText;
        noteText = "";
      }
      const payload: Partial<ZoteroItemValues> = {
        annotationComment: noteComment,
        tags: this.buildZoteroTags(note.tags, values?.tags),
      };
      if (allowText) {
        payload.annotationText = noteText;
      }
      try {
        await this.updateZoteroItemFields(entry.key, values, payload);
        entry.text = allowText ? noteText : "";
        entry.comment = noteComment;
        entry.tags = this.normalizeAnnotationTags(note.tags);
      } catch (error) {
        console.warn(`Failed to update Zotero annotation ${entry.key}`, error);
      }
    }
  }

  private buildZoteroTags(noteTags: string[], existingTags: unknown): Array<Record<string, unknown>> {
    const normalized = this.normalizeZoteroTags(noteTags);
    const manual = normalized.map((tag) => ({ tag, type: 0 }));
    const manualSet = new Set(normalized.map((tag) => tag.toLowerCase()));
    const preserved = Array.isArray(existingTags)
      ? existingTags
          .map((tag) => this.asRecord(tag))
          .filter((tag): tag is Record<string, unknown> => tag !== null)
          .filter((tag) => Number(tag.type) === 1)
          .filter((tag) => typeof tag.tag === "string")
      : [];
    const preservedUnique = preserved.filter(
      (tag) => !manualSet.has(String(tag.tag).toLowerCase())
    );
    return [...manual, ...preservedUnique];
  }

  private buildZoteroCreators(
    authors: string[],
    editors: string[],
    existingCreators: unknown[]
  ): Array<Record<string, unknown>> {
    const normalizedEditors = new Map<string, string>();
    for (const creator of existingCreators) {
      const creatorRecord = this.asRecord(creator);
      if (!creatorRecord) {
        continue;
      }
      if (
        creatorRecord.creatorType !== "editor" &&
        creatorRecord.creatorType !== "seriesEditor"
      ) {
        continue;
      }
      const name = formatCreatorName(creatorRecord);
      if (name) {
        normalizedEditors.set(name.trim().toLowerCase(), String(creatorRecord.creatorType));
      }
    }
    const otherCreators = existingCreators
      .map((creator) => this.asRecord(creator))
      .filter((creator): creator is Record<string, unknown> => {
        if (!creator) {
          return false;
        }
        return (
          creator.creatorType !== "author"
          && creator.creatorType !== "editor"
          && creator.creatorType !== "seriesEditor"
        );
      });
    const authorCreators = authors
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => ({
        creatorType: "author",
        ...this.parseCreatorName(name),
      }));
    const editorCreators = editors
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => ({
        creatorType: normalizedEditors.get(name.trim().toLowerCase()) ?? "editor",
        ...this.parseCreatorName(name),
      }));
    return [...authorCreators, ...editorCreators, ...otherCreators];
  }

  private parseCreatorName(name: string): Record<string, string> {
    const trimmed = String(name || "").trim();
    if (!trimmed) {
      return { name: "" };
    }
    if (trimmed.includes(",")) {
      const [last, first] = trimmed.split(",", 2).map((part) => part.trim());
      if (last && first) {
        return { firstName: first, lastName: last };
      }
      if (last) {
        return { lastName: last };
      }
    }
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return { name: trimmed };
    }
    const lastName = parts.pop() ?? "";
    const firstName = parts.join(" ").trim();
    return { firstName, lastName };
  }

  private extractSyncSection(content: string): string | null {
    const startMatch = ZRR_SYNC_START_RE.exec(content);
    if (!startMatch) {
      return null;
    }
    const afterStart = content.slice(startMatch.index + startMatch[0].length);
    const endMatch = ZRR_SYNC_END_RE.exec(afterStart);
    if (!endMatch) {
      return null;
    }
    return afterStart.slice(0, endMatch.index);
  }

  private extractDocIdFromSyncMarker(content: string): string | null {
    const startMatch = ZRR_SYNC_START_RE.exec(content);
    if (!startMatch) {
      return null;
    }
    const marker = startMatch[0] ?? "";
    const docMatch = marker.match(/doc_id=(["']?)([^"'\s]+)\1/i);
    return docMatch ? docMatch[2].trim() : null;
  }

  private parseSyncedChunkBlocks(section: string): ParsedChunkBlock[] {
    const lines = section.split(/\r?\n/);
    const blocks: ParsedChunkBlock[] = [];
    let currentId = "";
    let currentExclude = false;
    let currentLines: string[] = [];

    const flush = (): void => {
      if (!currentId) {
        return;
      }
      blocks.push({
        chunkId: currentId,
        text: currentLines.join("\n").trim(),
        excludeFlag: currentExclude,
      });
      currentId = "";
      currentExclude = false;
      currentLines = [];
    };

    for (const line of lines) {
      const startMatch = line.match(ZRR_CHUNK_START_RE);
      if (startMatch) {
        flush();
        const attrs = startMatch[1] ?? "";
        const idMatch = attrs.match(/id=(["']?)([^"'\s]+)\1/i);
        const chunkId = idMatch ? idMatch[2].trim() : "";
        if (!chunkId) {
          continue;
        }
        currentId = chunkId;
        currentExclude = /\bexclude\b/i.test(attrs) || /\bdelete\b/i.test(attrs);
        currentLines = [];
        continue;
      }
      if (ZRR_CHUNK_END_RE.test(line)) {
        flush();
        continue;
      }
      if (!currentId) {
        continue;
      }
      if (ZRR_CHUNK_EXCLUDE_ANY_RE.test(line)) {
        currentExclude = true;
        continue;
      }
      currentLines.push(line);
    }

    flush();
    return blocks;
  }

  private normalizeChunkText(text: string): string {
    return text
      .split(/\r?\n/)
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter((line, idx, arr) => !(line === "" && arr[idx - 1] === ""))
      .join("\n")
      .trim();
  }

  private isAnnotationChunk(chunk: Record<string, unknown> | null | undefined): boolean {
    if (!chunk || typeof chunk !== "object") {
      return false;
    }
    return Boolean(chunk.is_annotation || chunk.annotation || chunk.annotation_key);
  }



  private buildSyncedDoclingContent(
    docId: string,
    chunkPayload: Record<string, unknown> | null,
    fallbackMarkdown: string
  ): string {
    const payloadChunks = chunkPayload?.chunks;
    const chunks = (Array.isArray(payloadChunks) ? payloadChunks : [])
      .filter((chunk) => !this.isAnnotationChunk(chunk));
    if (!chunks.length) {
      return `<!-- zrr:sync-start doc_id=${docId} -->\n${fallbackMarkdown}\n<!-- zrr:sync-end -->`;
    }
    const isSectionChunked = chunks.some((chunk) => {
      const section = typeof chunk?.section === "string" ? chunk.section.trim() : "";
      if (section) {
        return true;
      }
      const chunkId = typeof chunk?.chunk_id === "string" ? chunk.chunk_id.trim() : "";
      return Boolean(chunkId && !/^p\d+$/i.test(chunkId));
    });
    const parts: string[] = [`<!-- zrr:sync-start doc_id=${docId} -->`];
    for (const chunk of chunks) {
      const chunkId = typeof chunk?.chunk_id === "string" ? chunk.chunk_id.trim() : "";
      if (!chunkId) {
        continue;
      }
      const pageStart = Number.isFinite(chunk?.page_start ?? NaN) ? Number(chunk.page_start) : null;
      const excluded = Boolean(chunk?.excluded || chunk?.exclude);
      const text = typeof chunk?.text === "string" ? chunk.text.trim() : "";
      let displayText = text;
      if (isSectionChunked) {
        const sectionTitle = typeof chunk?.section === "string" ? chunk.section.trim() : "";
        const headingLine = sectionTitle ? `## ${sectionTitle}` : "";
        if (headingLine && !displayText.startsWith("#")) {
          displayText = displayText
            ? `${headingLine}\n\n${displayText}`
            : headingLine;
        }
      }
      const pageAttr = pageStart !== null
        ? (isSectionChunked ? ` (${pageStart})` : ` page=${pageStart}`)
        : "";
      const sectionAttr = isSectionChunked ? " section" : "";
      const attrs = ` id=${chunkId}${sectionAttr}${pageAttr}${excluded ? " exclude" : ""}`;
      parts.push(`<!-- zrr:chunk${attrs} -->`);
      if (displayText) {
        parts.push(displayText);
      }
      parts.push("<!-- zrr:chunk end -->");
      parts.push("");
    }
    if (parts[parts.length - 1] === "") {
      parts.pop();
    }
    parts.push("<!-- zrr:sync-end -->");
    return parts.join("\n");
  }

  private async readChunkPayload(chunkPath: string): Promise<Record<string, unknown> | null> {
    try {
      const raw = await this.app.vault.adapter.read(chunkPath);
      return JSON.parse(raw);
    } catch (error) {
      console.warn("Failed to read cached chunks JSON", error);
      return null;
    }
  }

  private buildAnnotationChunk(annotation: AnnotationEntry): Record<string, unknown> {
    const parts: string[] = [];
    if (annotation.text) {
      parts.push(annotation.text);
    }
    if (annotation.comment) {
      parts.push(annotation.comment);
    }
    if (annotation.tags.length) {
      parts.push(`Tags: ${annotation.tags.map((tag) => `#${tag}`).join(" ")}`);
    }
    const text = parts.join("\n\n").trim();
    const page = annotation.pageIndex ?? 0;
    const pageLabel = annotation.pageLabel || (annotation.pageIndex ? String(annotation.pageIndex) : "");
    return {
      chunk_id: annotation.key,
      text,
      page_start: page,
      page_end: page,
      annotation_page_label: pageLabel,
      section: annotation.heading,
      chunk_tags: annotation.tags,
      is_annotation: true,
      annotation_key: annotation.key,
      annotation_color: annotation.colorKey,
      annotation_text: annotation.text,
      annotation_comment: annotation.comment,
    };
  }

  private annotationChunkSignature(chunk: Record<string, unknown>): string {
    return JSON.stringify({
      text: chunk.text ?? "",
      page_start: chunk.page_start ?? "",
      page_end: chunk.page_end ?? "",
      section: chunk.section ?? "",
      chunk_tags: Array.isArray(chunk.chunk_tags) ? chunk.chunk_tags : chunk.chunk_tags ?? "",
      annotation_color: chunk.annotation_color ?? "",
      annotation_page_label: chunk.annotation_page_label ?? "",
      annotation_text: chunk.annotation_text ?? "",
      annotation_comment: chunk.annotation_comment ?? "",
    });
  }

  private async updateAnnotationChunks(
    docId: string,
    attachmentKey: string,
    annotations: AnnotationEntry[],
    options?: { allowDeletes?: boolean }
  ): Promise<void> {
    const allowDeletes = options?.allowDeletes !== false;
    const chunkPath = normalizePath(`${CHUNK_CACHE_DIR}/${docId}.json`);
    const adapter = this.app.vault.adapter;
    if (!(await adapter.exists(chunkPath))) {
      return;
    }
    const payload = await this.readChunkPayload(chunkPath);
    if (!payload) {
      return;
    }
    const existing = Array.isArray(payload.chunks) ? payload.chunks : [];
    const baseChunks: Record<string, unknown>[] = [];
    const existingAnnotations = new Map<string, Record<string, unknown>>();
    for (const chunk of existing) {
      const chunkId = typeof chunk?.chunk_id === "string" ? chunk.chunk_id : "";
      if (chunkId && this.isAnnotationChunk(chunk)) {
        existingAnnotations.set(chunkId, chunk);
      } else {
        baseChunks.push(chunk);
      }
    }

    const annotationChunks: Record<string, unknown>[] = [];
    const updatedIds: string[] = [];
    const seen = new Set<string>();

    for (const annotation of annotations) {
      const chunk = this.buildAnnotationChunk(annotation);
      const chunkId = typeof chunk.chunk_id === "string" ? chunk.chunk_id : "";
      if (!chunkId) {
        continue;
      }
      seen.add(chunkId);
      annotationChunks.push(chunk);
      const existingChunk = existingAnnotations.get(chunkId);
      if (!existingChunk) {
        updatedIds.push(chunkId);
        continue;
      }
      if (this.annotationChunkSignature(existingChunk) !== this.annotationChunkSignature(chunk)) {
        updatedIds.push(chunkId);
      }
    }

    const deleteIds: string[] = [];
    if (allowDeletes) {
      for (const chunkId of existingAnnotations.keys()) {
        if (!seen.has(chunkId)) {
          deleteIds.push(chunkId);
        }
      }
    } else {
      for (const [chunkId, chunk] of existingAnnotations.entries()) {
        if (!seen.has(chunkId)) {
          annotationChunks.push(chunk);
        }
      }
    }

    payload.chunks = [...baseChunks, ...annotationChunks];
    await adapter.write(chunkPath, JSON.stringify(payload, null, 2));

    if (updatedIds.length || deleteIds.length) {
      await this.reindexChunkUpdates(docId, chunkPath, updatedIds, deleteIds);
    }

    if (attachmentKey) {
      try {
        const metadata = this.asRecord(payload.metadata) ?? {};
        if (metadata.attachment_key !== attachmentKey) {
          metadata.attachment_key = attachmentKey;
          payload.metadata = metadata;
          await adapter.write(chunkPath, JSON.stringify(payload, null, 2));
        }
      } catch {
        // ignore
      }
    }
  }

  private resolveChunkFromPayload(
    chunks: Record<string, unknown>[],
    chunkId: string,
    docId: string
  ): Record<string, unknown> | null {
    const normalized = this.normalizeChunkIdForNote(chunkId, docId) || chunkId;
    const candidates = new Set([chunkId, normalized, `${docId}:${chunkId}`]);
    for (const chunk of chunks) {
      const id = typeof chunk?.chunk_id === "string" ? chunk.chunk_id : "";
      if (id && candidates.has(id)) {
        return chunk;
      }
    }
    return null;
  }

  private async writeNoteWithSyncSuppressed(notePath: string, content: string): Promise<void> {
    this.noteSyncSuppressed.add(notePath);
    try {
      await this.app.vault.adapter.write(notePath, content);
    } finally {
      window.setTimeout(() => {
        this.noteSyncSuppressed.delete(notePath);
      }, 1500);
    }
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

  private isZoteroNoteFile(file: TFile): boolean {
    const cache = this.app.metadataCache.getFileCache(file);
    const frontmatter = cache?.frontmatter;
    return Boolean(this.getFrontmatterValue(frontmatter, "doc_id") || this.getFrontmatterValue(frontmatter, "zotero_key"));
  }

  private async deleteZoteroNoteAndCacheForFile(file: TFile): Promise<void> {
    const notePath = file.path;
    const content = await this.app.vault.read(file);
    const docId =
      this.extractDocIdFromFrontmatter(content) ?? this.extractDocIdFromSyncMarker(content);
    if (!docId) {
      new Notice("No doc_ID found in this note.");
      return;
    }

    const confirmed = await new Promise<boolean>((resolve) => {
      new ConfirmDeleteNoteModal(this.app, notePath, docId, resolve).open();
    });
    if (!confirmed) {
      return;
    }

    const adapter = this.app.vault.adapter;
    const chunkPath = normalizePath(`${CHUNK_CACHE_DIR}/${docId}.json`);
    const itemPath = normalizePath(`${ITEM_CACHE_DIR}/${docId}.json`);

    let deleteIds: string[] = [];
    if (await adapter.exists(chunkPath)) {
      const payload = await this.readChunkPayload(chunkPath);
      const chunks = Array.isArray(payload?.chunks) ? payload?.chunks : [];
      deleteIds = chunks
        .map((chunk) => (typeof chunk?.chunk_id === "string" ? chunk.chunk_id : ""))
        .map((chunkId) => (
          chunkId.startsWith(`${docId}:`) ? chunkId.slice(docId.length + 1) : chunkId
        ))
        .filter((chunkId) => chunkId);
    }

    if (deleteIds.length > 0) {
      await this.reindexChunkUpdates(docId, chunkPath, [], deleteIds);
    }

    try {
      if (await adapter.exists(chunkPath)) {
        await adapter.remove(chunkPath);
      }
      if (await adapter.exists(itemPath)) {
        await adapter.remove(itemPath);
      }
      await this.removeDocIndexEntry(docId);
      await this.app.fileManager.trashFile(file);
      new Notice(`Deleted note and cache for ${docId}.`);
    } catch (error) {
      console.error("Failed to delete note and cached data", error);
      new Notice("Failed to delete note or cached data. See console for details.");
    }
  }

  private async deleteZoteroNoteAndCache(): Promise<void> {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view || !view.file) {
      new Notice("No active Zotero note found.");
      return;
    }
    await this.deleteZoteroNoteAndCacheForFile(view.file);
  }

  private formatRedisSearchResults(payload: unknown): string {
    const data = this.asRecord(payload) ?? {};
    const total = typeof data.total === "number" ? data.total : 0;
    const query = typeof data.query === "string" ? data.query : "";
    const rawQuery = typeof data.raw_query === "string" ? data.raw_query : "";
    const fieldTypes = data.field_types && typeof data.field_types === "object"
      ? (data.field_types as Record<string, unknown>)
      : null;
    const fallbackUsed = Boolean(data.fallback_used);
    const fallbackReason = typeof data.fallback_reason === "string" ? data.fallback_reason : "";
    const fallbackQueries = Array.isArray(data.fallback_queries) ? data.fallback_queries : [];
    const fallbackFailed = Array.isArray(data.fallback_failed_fields)
      ? data.fallback_failed_fields
      : [];
    const results = Array.isArray(data.results) ? data.results : [];

    const lines: string[] = [];
    lines.push(`Query: ${rawQuery || query}`);
    if (query && rawQuery && query !== rawQuery) {
      lines.push(`Expanded: ${query}`);
    }
    lines.push(`Total matches: ${total}`);
    if (fieldTypes && Object.keys(fieldTypes).length > 0) {
      const entries = Object.keys(fieldTypes)
        .sort()
        .map((key) => {
          const value = fieldTypes[key];
          const text = (typeof value === "string" || typeof value === "number" || typeof value === "boolean")
            ? String(value)
            : "";
          return `${key}:${text}`;
        });
      lines.push(`Field types: {${entries.join(", ")}}`);
    }
    if (fallbackUsed) {
      lines.push(`Fallback: ${fallbackReason || "true"}`);
    }
    if (fallbackQueries.length) {
      lines.push("Fallback queries:");
      for (const clause of fallbackQueries) {
        lines.push(`  - ${clause}`);
      }
    }
    if (fallbackFailed.length) {
      lines.push(`Fallback failed fields: ${fallbackFailed.join(", ")}`);
    }
    lines.push("");

    if (!results.length) {
      lines.push("(no results)");
      return lines.join("\n");
    }

    for (const result of results) {
      const docId = String(result.doc_id || "").trim();
      const chunkId = String(result.chunk_id || "").trim();
      const pageStart = String(result.page_start || "").trim();
      const pageEnd = String(result.page_end || "").trim();
      const title = String(result.title || "").trim();
      const section = String(result.section || "").trim();
      const score = String(result.score || "").trim();
      const authors = String(result.authors || "").trim();
      const itemType = String(result.item_type || "").trim();
      const year = String(result.year || "").trim();
      const tags = String(result.tags || "").trim();
      const chunkTags = String(result.chunk_tags || "").trim();
      const attachmentKey = String(result.attachment_key || "").trim();
      const sourcePdf = String(result.source_pdf || "").trim();
      const text = String(result.text || "").replace(/\s+/g, " ").trim();
      const snippet = text.length > 220 ? `${text.slice(0, 220)}…` : text;

      const labelParts = [docId];
      if (chunkId) {
        labelParts.push(chunkId);
      }
      if (pageStart || pageEnd) {
        labelParts.push(`p.${pageStart || "?"}-${pageEnd || "?"}`);
      }
      lines.push(labelParts.filter(Boolean).join(" • "));
      if (score) {
        lines.push(`  score: ${score}`);
      }
      if (title) {
        lines.push(`  title: ${title}`);
      }
      if (authors) {
        lines.push(`  authors: ${authors}`);
      }
      if (year) {
        lines.push(`  year: ${year}`);
      }
      if (itemType) {
        lines.push(`  item_type: ${itemType}`);
      }
      if (tags) {
        lines.push(`  tags: ${tags}`);
      }
      if (chunkTags) {
        lines.push(`  chunk_tags: ${chunkTags}`);
      }
      if (attachmentKey) {
        lines.push(`  attachment_key: ${attachmentKey}`);
      }
      if (section) {
        lines.push(`  section: ${section}`);
      }
      if (sourcePdf) {
        lines.push(`  source_pdf: ${sourcePdf}`);
      }
      if (snippet) {
        lines.push(`  ${snippet}`);
      }
      lines.push("");
    }

    return lines.join("\n");
  }

  private searchRedisIndex(): void {
    new RedisSearchModal(this.app, this, this.lastRedisSearchTerm).open();
  }

  public async runRedisSearch(term: string): Promise<string> {
    const trimmed = term.trim();
    if (!trimmed) {
      return "(no query)";
    }
    this.lastRedisSearchTerm = trimmed;
    if (!(await this.ensureRedisAvailable("index search"))) {
      return "Redis is not reachable. Please start Redis Stack and try again.";
    }

    const pluginDir = this.getPluginDir();
    const scriptPath = path.join(pluginDir, "tools", "search_redis.py");
    const args = [
      "--query",
      trimmed,
      "--redis-url",
      this.settings.redisUrl,
      "--index",
      this.getRedisIndexName(),
      "--limit",
      "10",
    ];

    try {
      await this.ensureBundledTools();
      const output = await this.runPythonWithOutput(scriptPath, args);
      const payload = JSON.parse(output || "{}");
      const body = this.formatRedisSearchResults(payload);
      return body || "(no results)";
    } catch (error) {
      console.error("Redis search failed", error);
      return "Redis search failed. See console for details.";
    }
  }

  private async showRedisDiagnostics(): Promise<void> {
    if (!(await this.ensureRedisAvailable("diagnostics"))) {
      return;
    }
    const pluginDir = this.getPluginDir();
    const scriptPath = path.join(pluginDir, "tools", "redis_diagnostics.py");
    const args = [
      "--redis-url",
      this.settings.redisUrl,
      "--index",
      this.getRedisIndexName(),
    ];
    try {
      await this.ensureBundledTools();
      const output = await this.runPythonWithOutput(scriptPath, args);
      const payload = JSON.parse(output || "{}");
      const body = `\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\``;
      new OutputModal(this.app, "Redis diagnostics", body || "(empty)").open();
    } catch (error) {
      console.error("Redis diagnostics failed", error);
      new Notice("Redis diagnostics failed. See console for details.");
    }
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
    const trimmedQuery = query.trim();
    const includeOptions = ["data,meta"];
    for (const include of includeOptions) {
      const params = new URLSearchParams();
      params.set("itemType", "-attachment");
      params.set("limit", "25");
      params.set("include", include);
      if (trimmedQuery) {
        params.set("q", trimmedQuery);
      } else {
        params.set("sort", "dateAdded");
        params.set("direction", "desc");
      }
      const url = this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/top?${params.toString()}`);
      try {
        const payload = await this.requestLocalApi(url, `Zotero search failed for ${url}`);
        const items = JSON.parse(payload.toString("utf8"));
        if (!Array.isArray(items)) {
          return [];
        }
        return this.normalizeZoteroSearchResults(items);
      } catch (error) {
        console.warn("Failed to search Zotero via local API", error);
      }
    }
    if (!this.canUseWebApi()) {
      throw new Error("Zotero search failed for all include modes.");
    }
    return this.searchZoteroItemsWeb(trimmedQuery);
  }

  public async hasProcessableAttachment(item: ZoteroLocalItem): Promise<boolean> {
    const values: ZoteroItemValues = item.data ?? item;
    const itemKey = typeof item.key === "string" ? item.key : coerceString(values.key);
    if (!itemKey) {
      return false;
    }
    const attachment = await resolvePdfAttachment(values, itemKey, {
      fetchZoteroChildren: this.fetchZoteroChildren.bind(this),
    });
    return Boolean(attachment);
  }

  private async fetchZoteroChildrenLocal(
    itemKey: string,
    options: { includeAnnotationImage?: boolean } = {}
  ): Promise<unknown[]> {
    const params = new URLSearchParams();
    if (options.includeAnnotationImage) {
      params.set("include", "annotationImage");
    }
    const suffix = params.toString() ? `?${params.toString()}` : "";
    const url = this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${itemKey}/children${suffix}`);
    const payload = await this.requestLocalApi(url, `Zotero children request failed for ${url}`);
    return JSON.parse(payload.toString("utf8"));
  }

  private async fetchZoteroChildrenWeb(
    itemKey: string,
    options: { includeAnnotationImage?: boolean } = {}
  ): Promise<unknown[]> {
    if (!this.canUseWebApi()) {
      const resolved = await this.ensureWebApiLibraryId();
      if (!resolved || !this.canUseWebApi()) {
        throw new Error("Zotero Web API is not configured.");
      }
    }
    const params = new URLSearchParams();
    if (options.includeAnnotationImage) {
      params.set("include", "annotationImage");
    }
    const suffix = params.toString() ? `?${params.toString()}` : "";
    const webUrl = this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/items/${itemKey}/children${suffix}`);
    const payload = await this.requestWebApi(webUrl, `Zotero Web API children request failed for ${webUrl}`);
    return JSON.parse(payload.toString("utf8"));
  }

  private async fetchZoteroChildren(itemKey: string): Promise<unknown[]> {
    try {
      return await this.fetchZoteroChildrenLocal(itemKey);
    } catch (error) {
      console.warn("Failed to fetch Zotero children from local API", error);
      if (!this.canUseWebApi()) {
        throw error;
      }
      return this.fetchZoteroChildrenWeb(itemKey);
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

  private async ensureWebApiLibraryId(): Promise<boolean> {
    const base = (this.settings.webApiBaseUrl || "").trim();
    const apiKey = (this.settings.webApiKey || "").trim();
    if (!base || !apiKey || (this.settings.webApiLibraryId || "").trim()) {
      return Boolean((this.settings.webApiLibraryId || "").trim());
    }
    const url = this.buildWebApiUrl("/keys/current");
    try {
      const payload = await this.requestWebApi(url, `Zotero Web API key lookup failed for ${url}`);
      const parsed = JSON.parse(payload.toString("utf8"));
      const userId = parsed?.userID ?? parsed?.userId ?? parsed?.data?.userID ?? parsed?.data?.userId;
      if (!userId) {
        return false;
      }
      this.settings.webApiLibraryId = String(userId);
      await this.saveSettings();
      console.debug("Resolved Zotero Web API user ID from key", { userId });
      return true;
    } catch (error) {
      console.warn("Failed to resolve Zotero Web API user ID", error);
      return false;
    }
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

  private isZoteroLocalApiRequest(url: string): boolean {
    const configuredBase = (this.settings.zoteroBaseUrl || "").trim();
    if (!configuredBase) {
      return false;
    }
    try {
      const requestUrl = new URL(url);
      const baseUrl = new URL(configuredBase);
      const requestPort = requestUrl.port || (requestUrl.protocol === "https:" ? "443" : "80");
      const basePort = baseUrl.port || (baseUrl.protocol === "https:" ? "443" : "80");
      if (
        requestUrl.protocol !== baseUrl.protocol ||
        requestUrl.hostname !== baseUrl.hostname ||
        requestPort !== basePort
      ) {
        return false;
      }
      const basePath = baseUrl.pathname.replace(/\/$/, "");
      if (!basePath || basePath === "/") {
        return true;
      }
      return requestUrl.pathname === basePath || requestUrl.pathname.startsWith(`${basePath}/`);
    } catch {
      return false;
    }
  }

  private notifyZoteroLocalApiConnectionError(): void {
    this.notifyZoteroApiOnce(
      "Zotero connection error. Start Zotero and enable 'Allow other applications on this computer to communicate with Zotero' in Settings -> Advanced -> General."
    );
  }

  private requestLocalApiRaw(
    url: string,
    options: {
      method?: string;
      headers?: Record<string, string>;
      body?: Buffer | string;
      timeoutMs?: number;
    } = {}
  ): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: Buffer }> {
    return new Promise((resolve, reject) => {
      const isZoteroLocalApiRequest = this.isZoteroLocalApiRequest(url);
      const parsed = new URL(url);
      const lib = parsed.protocol === "https:" ? https : http;
      const method = options.method ?? "GET";
      const headers: Record<string, string> = {
        Accept: "*/*",
        ...(options.headers ?? {}),
      };
      const body = options.body;
      const timeoutMs = Number.isFinite(options.timeoutMs ?? NaN) ? Number(options.timeoutMs) : 0;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
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
            if (timeoutId) {
              clearTimeout(timeoutId);
            }
            if (isZoteroLocalApiRequest) {
              this.lastZoteroApiNotice = null;
            }
            const body = Buffer.concat(chunks);
            resolve({
              statusCode: response.statusCode ?? 0,
              headers: response.headers,
              body,
            });
          });
        }
      );

      if (timeoutMs > 0) {
        timeoutId = setTimeout(() => {
          request.destroy(new Error(`Request timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }
      const requestEmitter = request as unknown as NodeJS.EventEmitter;
      requestEmitter.on("error", (error) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        if (isZoteroLocalApiRequest) {
          this.notifyZoteroLocalApiConnectionError();
        }
        const requestError = error instanceof Error
          ? error
          : new Error(typeof error === "string" ? error : "Request failed");
        reject(requestError);
      });
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

  private async updateChunkJsonSourcePdf(chunkPath: string, sourcePdf: string): Promise<void> {
    if (!sourcePdf) {
      return;
    }
    try {
      const raw = await this.app.vault.adapter.read(chunkPath);
      const payload = JSON.parse(raw);
      if (!payload || typeof payload !== "object") {
        return;
      }
      payload.source_pdf = sourcePdf;
      await this.app.vault.adapter.write(chunkPath, JSON.stringify(payload, null, 2));
    } catch (error) {
      console.warn("Failed to update chunks JSON source_pdf", error);
    }
  }

  public buildPdfLinkFromSourcePath(sourcePdf: string): string {
    if (!sourcePdf) {
      return "";
    }
    const relative = this.toVaultRelativePath(sourcePdf);
    if (relative) {
      return `[[${relative}]]`;
    }
    return `[PDF](${pathToFileURL(sourcePdf).toString()})`;
  }

  private toVaultRelativePath(sourcePath: string): string {
    if (!sourcePath) {
      return "";
    }
    if (!path.isAbsolute(sourcePath) && !/^[A-Za-z]+:\/\//.test(sourcePath)) {
      return normalizePath(sourcePath);
    }
    const vaultBase = path.normalize(this.getVaultBasePath());
    const normalizedSource = path.normalize(sourcePath);
    const vaultPrefix = vaultBase.endsWith(path.sep) ? vaultBase : `${vaultBase}${path.sep}`;
    if (!normalizedSource.startsWith(vaultPrefix)) {
      const workerVaultRoot = path.normalize(PYTHON_WORKER_VAULT_ROOT);
      const workerPrefix = workerVaultRoot.endsWith(path.sep)
        ? workerVaultRoot
        : `${workerVaultRoot}${path.sep}`;
      if (normalizedSource.startsWith(workerPrefix)) {
        return normalizePath(path.relative(workerVaultRoot, normalizedSource));
      }
      return "";
    }
    return normalizePath(path.relative(vaultBase, normalizedSource));
  }

  private normalizeDocIndexPdfPath(pdfPath: string): string {
    if (!pdfPath) {
      return pdfPath;
    }
    const relative = this.toVaultRelativePath(pdfPath);
    return relative || pdfPath;
  }

  private async isFileAccessible(filePath: string): Promise<boolean> {
    if (!filePath) {
      return false;
    }
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private deriveVaultPdfRelativePath(sourcePdf: string, title: string, docId: string): string {
    const rel = this.toVaultRelativePath(sourcePdf);
    if (rel && rel.startsWith(normalizePath(this.settings.outputPdfDir))) {
      return rel;
    }
    const baseName = this.sanitizeFileName(title) || docId;
    return normalizePath(`${this.settings.outputPdfDir}/${baseName}.pdf`);
  }

  private async recoverMissingPdfFromAttachment(
    sourcePdf: string,
    values: ZoteroItemValues,
    itemKey: string,
    docId: string,
    attachmentKey: string | undefined,
    title: string,
    showNotices: boolean
  ): Promise<{ sourcePdf: string; attachmentKey?: string } | null> {
    let attachment = await resolvePdfAttachment(values, itemKey, {
      fetchZoteroChildren: this.fetchZoteroChildren.bind(this),
    });
    if (!attachment && attachmentKey) {
      attachment = { key: attachmentKey };
    }
    if (!attachment) {
      return null;
    }

    const resolvedAttachmentKey = attachment.key || attachmentKey;
    const filePath = attachment.filePath;

    if (!this.settings.copyPdfToVault && filePath && (await this.isFileAccessible(filePath))) {
      return { sourcePdf: filePath, attachmentKey: resolvedAttachmentKey };
    }

    try {
      await this.ensureFolder(this.settings.outputPdfDir);
    } catch (error) {
      console.error("Failed to create PDF output folder", error);
      return null;
    }

    const targetRel = this.deriveVaultPdfRelativePath(sourcePdf, title, docId);
    let buffer: Buffer;
    try {
      if (filePath && (await this.isFileAccessible(filePath))) {
        buffer = await fs.readFile(filePath);
      } else if (resolvedAttachmentKey) {
        buffer = await downloadZoteroPdf(resolvedAttachmentKey, {
          buildZoteroUrl: this.buildZoteroUrl.bind(this),
          getZoteroLibraryPath: this.getZoteroLibraryPath.bind(this),
          canUseWebApi: this.canUseWebApi.bind(this),
          buildWebApiUrl: this.buildWebApiUrl.bind(this),
          getWebApiLibraryPath: this.getWebApiLibraryPath.bind(this),
          requestLocalApiRaw: this.requestLocalApiRaw.bind(this),
          requestWebApiRaw: this.requestWebApiRaw.bind(this),
          requestLocalApi: this.requestLocalApi.bind(this),
          readFile: fs.readFile,
        });
        if (!this.settings.copyPdfToVault && showNotices) {
          new Notice("Local PDF path unavailable; copied PDF into vault for processing.");
        }
      } else {
        return null;
      }
    } catch (error) {
      console.error("Failed to read or download PDF attachment", error);
      return null;
    }

    try {
      await this.app.vault.adapter.writeBinary(targetRel, this.bufferToArrayBuffer(buffer));
    } catch (error) {
      console.error("Failed to write recovered PDF into vault", error);
      return null;
    }

    const targetAbs = this.getAbsoluteVaultPath(targetRel);
    return { sourcePdf: targetAbs, attachmentKey: resolvedAttachmentKey };
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

  private async maybeCreateOcrLayeredPdf(
    sourcePdfPath: string,
    metadata: Record<string, unknown> | null,
    languageHint?: string | null
  ): Promise<string | null> {
    if (!this.settings.createOcrLayeredPdf) {
      return null;
    }
    if (!this.settings.copyPdfToVault) {
      return null;
    }
    if (!sourcePdfPath) {
      return null;
    }
    const ocrUsed = metadata?.ocr_used === true;
    if (!ocrUsed) {
      return null;
    }
    if (!this.toVaultRelativePath(sourcePdfPath)) {
      console.warn("OCR layered PDF requires a vault-local PDF");
      return null;
    }
    try {
      await this.ensureFolder(this.settings.outputPdfDir);
    } catch (error) {
      console.warn("Failed to create OCR PDF output folder", error);
      return null;
    }

    const outputAbs = `${sourcePdfPath}.ocr.tmp`;
    const metadataLanguage = typeof metadata?.languages === "string" ? metadata.languages : "";
    const language = (typeof languageHint === "string" && languageHint.trim()
      ? languageHint
      : (metadataLanguage || "eng")).trim();
    const pluginDir = this.getPluginDir();
    const script = path.join(pluginDir, "tools", "ocr_layered_pdf.py");

    try {
      this.showStatusProgress("Creating OCR PDF...", 0);
      await this.runPythonStreaming(
        script,
        [
          "--pdf",
          sourcePdfPath,
          "--out-pdf",
          outputAbs,
          "--language",
          language,
          "--progress",
        ],
        (payload) => {
          const event = this.asRecord(payload);
          const total = typeof event?.total === "number" ? event.total : 0;
          const current = typeof event?.current === "number" ? event.current : 0;
          if (event?.type === "progress" && total > 0) {
            const percent = Math.round((current / total) * 100);
            this.showStatusProgress(`Creating OCR PDF ${current}/${total}`, percent);
          }
        },
        () => undefined
      );
      await fs.rename(outputAbs, sourcePdfPath);
      return sourcePdfPath;
    } catch (error) {
      console.warn("OCR layered PDF creation failed", error);
      return null;
    }
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

  private findChunkLineInText(text: string, chunkId: string): number | null {
    if (!text || !chunkId) {
      return null;
    }
    const escapedId = this.escapeRegExp(chunkId);
    const markerRe = new RegExp(
      `<!--\\s*zrr:chunk\\b[^>]*\\bid=(["']?)${escapedId}\\1[^>]*-->`,
      "i"
    );
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i += 1) {
      if (markerRe.test(lines[i])) {
        return i;
      }
    }
    return null;
  }

  private findAnnotationLineInText(text: string, blockId: string): number | null {
    if (!text || !blockId) {
      return null;
    }
    const escapedId = this.escapeRegExp(blockId);
    const markerRe = new RegExp(`^\\s*>?\\s*\\^${escapedId}\\b`, "i");
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i += 1) {
      if (markerRe.test(lines[i])) {
        return i;
      }
    }
    return null;
  }

  private async openNoteAtChunk(notePath: string, chunkId: string): Promise<boolean> {
    if (!notePath || !chunkId) {
      return false;
    }
    await this.openNoteInMain(notePath);
    const leaf = this.getMainLeaf();
    const view = leaf.view;
    if (!(view instanceof MarkdownView)) {
      return false;
    }
    const editor = view.editor;
    const normalizedChunkId = this.normalizeChunkIdForNote(chunkId) || chunkId;
    const line = this.findChunkLineInText(editor.getValue(), normalizedChunkId);
    if (line === null) {
      new Notice(`Chunk ${normalizedChunkId} not found in note.`);
      return false;
    }
    editor.setCursor({ line, ch: 0 });
    editor.scrollIntoView(
      { from: { line, ch: 0 }, to: { line, ch: 0 } },
      true
    );
    return true;
  }

  private async openNoteAtAnnotation(
    notePath: string,
    annotationKey: string,
    attachmentKey: string,
    pageToken: string
  ): Promise<boolean> {
    const blockId = this.buildAnnotationBlockId(annotationKey, attachmentKey, pageToken);
    if (!notePath || !blockId) {
      return false;
    }
    await this.openNoteInMain(notePath);
    const leaf = this.getMainLeaf();
    const view = leaf.view;
    if (!(view instanceof MarkdownView)) {
      return false;
    }
    const editor = view.editor;
    const line = this.findAnnotationLineInText(editor.getValue(), blockId);
    if (line === null) {
      new Notice(`Annotation ${annotationKey} not found in note.`);
      return false;
    }
    editor.setCursor({ line, ch: 0 });
    editor.scrollIntoView(
      { from: { line, ch: 0 }, to: { line, ch: 0 } },
      true
    );
    return true;
  }

  public async openInternalLinkInMain(linkText: string): Promise<void> {
    const leaf = this.getMainLeaf();
    const [linkPathRaw, anchorRaw] = linkText.split("#");
    const linkPath = (linkPathRaw || "").trim();
    const anchor = (anchorRaw || "").trim();
    const chunkAnchorPrefix = "zrr-chunk:";
    const file = linkPath
      ? this.app.metadataCache.getFirstLinkpathDest(linkPath, "")
      : null;
    if (file instanceof TFile) {
      const chunkId = anchor.startsWith(chunkAnchorPrefix)
        ? anchor.slice(chunkAnchorPrefix.length).trim()
        : "";
      if (chunkId) {
        const opened = await this.openNoteAtChunk(file.path, chunkId);
        if (opened) {
          return;
        }
      }
      await leaf.openFile(file, { active: true });
      if (linkText.includes("#") && !chunkId) {
        await this.openLinkTextInLeaf(leaf, linkText);
      }
      return;
    }
    await this.openLinkTextInLeaf(leaf, linkText);
  }

  private async openLinkTextInLeaf(leaf: WorkspaceLeaf, linkText: string): Promise<void> {
    const leafAny = leaf as WorkspaceLeaf & {
      openLinkText?: (link: string, sourcePath: string, state?: { active?: boolean }) => Promise<void>;
    };
    if (typeof leafAny.openLinkText === "function") {
      await leafAny.openLinkText(linkText, "", { active: true });
      return;
    }
    await this.app.workspace.openLinkText(linkText, "", "tab");
  }

  private async openNoteInNewTab(notePath: string): Promise<void> {
    const normalized = normalizePath(notePath);
    await this.app.workspace.openLinkText(normalized, "", "tab");
  }

  public async openPdfInMain(sourcePdf: string, pageStart?: string): Promise<boolean> {
    if (!sourcePdf) {
      return false;
    }
    const relative = this.toVaultRelativePath(sourcePdf);
    if (relative) {
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
    const pageLabel = this.formatCitationPageLabel(citation);
    const annotationKey = citation.annotation_key || this.extractAnnotationKey(citation.chunk_id);
    const attachmentKey = citation.attachment_key || this.docIndex?.[citation.doc_id || ""]?.attachment_key;
    const pageStart = citation.page_start ? String(citation.page_start) : "";
    const entry = this.docIndex?.[citation.doc_id || ""] ?? null;
    const noteTitle = this.resolveCitationTitle(entry, entry?.note_path ?? null, citation.doc_id);
    const fullLabel = this.formatCitationLabel(noteTitle, pageLabel);
    const chunkId = this.normalizeChunkIdForNote(citation.chunk_id, citation.doc_id);
    if (this.settings.preferObsidianNoteForCitations && entry?.note_path) {
      if (annotationKey) {
        const pageToken = pageStart || (citation.page_end ? String(citation.page_end) : "0");
        const annotationLink = this.buildNoteAnnotationLink(
          entry.note_path,
          annotationKey,
          attachmentKey || "",
          pageToken,
          fullLabel
        );
        if (annotationLink) {
          return `- ${annotationLink}`;
        }
        return `- ${this.buildNoteLink(entry.note_path, fullLabel)}`;
      }
      if (chunkId && !annotationKey) {
        return `- ${this.buildNoteChunkLink(entry.note_path, chunkId, fullLabel)}`;
      }
    }
    if (attachmentKey) {
      const zoteroUrl = this.buildZoteroDeepLink(docId, attachmentKey, pageStart, annotationKey);
      return `- [${fullLabel}](${zoteroUrl})`;
    }
    return `- ${fullLabel}`;
  }

  private buildNoteChunkLink(notePath: string, chunkId: string, label: string): string {
    const target = normalizePath(notePath).replace(/\.md$/i, "");
    const anchor = `zrr-chunk:${chunkId}`;
    const safeLabel = this.escapeWikiLabel(label);
    return `[[${target}#${anchor}\\|${safeLabel}]]`;
  }

  private buildNoteLink(notePath: string, label: string): string {
    const target = normalizePath(notePath).replace(/\.md$/i, "");
    const safeLabel = this.escapeWikiLabel(label);
    return `[[${target}\\|${safeLabel}]]`;
  }

  private buildNoteAnnotationLink(
    notePath: string,
    annotationKey: string,
    attachmentKey: string,
    pageToken: string,
    label: string
  ): string | null {
    const blockId = this.buildAnnotationBlockId(annotationKey, attachmentKey, pageToken);
    if (!blockId) {
      return null;
    }
    const target = normalizePath(notePath).replace(/\.md$/i, "");
    const safeLabel = this.escapeWikiLabel(label);
    return `[[${target}#^${blockId}\\|${safeLabel}]]`;
  }

  private buildAnnotationBlockId(
    annotationKey: string,
    attachmentKey: string,
    pageToken: string
  ): string | null {
    const key = (annotationKey || "").trim().toUpperCase();
    const attachment = (attachmentKey || "").trim().toUpperCase();
    if (!key || !attachment) {
      return null;
    }
    const page = (pageToken || "").trim() || "0";
    return `${key}a${attachment}p${page}`;
  }

  private escapeWikiLabel(label: string): string {
    if (!label) {
      return "";
    }
    return label.replace(/\|/g, "\\|");
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
          let changed = false;
          for (const entry of Object.values(map)) {
            if (entry && typeof entry.pdf_path === "string") {
              const normalized = this.normalizeDocIndexPdfPath(entry.pdf_path);
              if (normalized !== entry.pdf_path) {
                entry.pdf_path = normalized;
                changed = true;
              }
            }
          }
          if (changed) {
            await this.saveDocIndex(map);
          }
          return map;
        }
        if (entries && typeof entries === "object") {
          const map = entries as Record<string, DocIndexEntry>;
          let changed = false;
          for (const entry of Object.values(map)) {
            if (entry && typeof entry.pdf_path === "string") {
              const normalized = this.normalizeDocIndexPdfPath(entry.pdf_path);
              if (normalized !== entry.pdf_path) {
                entry.pdf_path = normalized;
                changed = true;
              }
            }
          }
          if (changed) {
            await this.saveDocIndex(map);
          }
          return map;
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

  private async pruneDocIndexOrphans(): Promise<{ removed: number; updated: number }> {
    const adapter = this.app.vault.adapter;
    const index = await this.getDocIndex();
    const itemDocIds = new Set(await this.listDocIds(ITEM_CACHE_DIR));
    const chunkDocIds = new Set(await this.listDocIds(CHUNK_CACHE_DIR));
    const noteEntries = await this.scanNotesForDocIds(this.settings.outputNoteDir);

    let removed = 0;
    let updated = 0;
    let changed = false;
    const now = new Date().toISOString();

    for (const docId of Object.keys(index)) {
      const entry = index[docId];
      let hasNote = false;
      const entryNote = entry?.note_path ? entry.note_path.trim() : "";
      if (entryNote && (await adapter.exists(entryNote))) {
        hasNote = true;
      } else if (noteEntries[docId]?.note_path) {
        hasNote = true;
        const noteEntry = noteEntries[docId];
        if (noteEntry.note_path && noteEntry.note_path !== entry.note_path) {
          entry.note_path = noteEntry.note_path;
          updated += 1;
          changed = true;
        }
        if (noteEntry.note_title && noteEntry.note_title !== entry.note_title) {
          entry.note_title = noteEntry.note_title;
          updated += 1;
          changed = true;
        }
        if (updated > 0) {
          entry.updated_at = now;
        }
      }

      const hasCache = itemDocIds.has(docId) || chunkDocIds.has(docId);
      if (!hasNote && !hasCache) {
        delete index[docId];
        removed += 1;
        changed = true;
      }
    }

    if (changed) {
      await this.saveDocIndex(index);
    }
    return { removed, updated };
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
    if (entry.short_title === undefined && existing.short_title) {
      next.short_title = existing.short_title;
    }
    if (entry.pdf_path === undefined && existing.pdf_path) {
      next.pdf_path = existing.pdf_path;
    }
    if (entry.attachment_key === undefined && existing.attachment_key) {
      next.attachment_key = existing.attachment_key;
    }

    if (typeof next.pdf_path === "string") {
      next.pdf_path = this.normalizeDocIndexPdfPath(next.pdf_path);
    }

    index[entry.doc_id] = next;
    await this.saveDocIndex(index);
  }

  private async removeDocIndexEntry(docId: string): Promise<void> {
    const index = await this.getDocIndex();
    if (!index[docId]) {
      await this.removeMetadataSnapshot(docId);
      return;
    }
    delete index[docId];
    await this.saveDocIndex(index);
    await this.removeMetadataSnapshot(docId);
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
        const shortTitle = extractShortTitleFromValues(values);
        if (shortTitle) {
          updates.short_title = shortTitle;
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

    let chunkPayload: Record<string, unknown>;
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

    const values: ZoteroItemValues = item.data ?? item;
    const title = typeof values.title === "string" ? values.title : "";
    const itemKey = (item.key ?? values.key ?? docId).toString();
    const existingEntry = await this.getDocIndexEntry(docId);
    let attachmentKey =
      typeof (this.asRecord(chunkPayload?.metadata)?.attachment_key) === "string"
        ? String(this.asRecord(chunkPayload?.metadata)?.attachment_key)
        : existingEntry?.attachment_key;

    let sourcePdf = typeof chunkPayload.source_pdf === "string" ? chunkPayload.source_pdf : "";
    if (!sourcePdf || !(await this.isFileAccessible(sourcePdf))) {
      const recovered = await this.recoverMissingPdfFromAttachment(
        sourcePdf,
        values,
        itemKey,
        docId,
        attachmentKey,
        title,
        showNotices
      );
      if (!recovered) {
        if (showNotices) {
          new Notice("Cached source PDF is missing and could not be recovered.");
        }
        this.clearStatusProgress();
        return false;
      }
      sourcePdf = recovered.sourcePdf;
      if (recovered.attachmentKey) {
        attachmentKey = recovered.attachmentKey;
      }
      await this.updateChunkJsonSourcePdf(chunkPath, sourcePdf);
    }

    const languageHint = await this.resolveLanguageHint(values, itemKey);
    const doclingLanguageHint = this.buildDoclingLanguageHint(languageHint ?? undefined);
    let notePath = "";
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
      if (this.settings.copyPdfToVault) {
        await this.ensureFolder(this.settings.outputPdfDir);
      }
      if (this.settings.enableFileLogging) {
        const logRel = this.getLogFileRelativePath();
        const logDir = normalizePath(path.dirname(logRel));
        if (logDir) {
          await this.ensureFolder(logDir);
        }
        const spellInfoRel = this.getSpellcheckerInfoRelativePath();
        const spellDir = normalizePath(path.dirname(spellInfoRel));
        if (spellDir) {
          await this.ensureFolder(spellDir);
        }
      }
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
    let layeredPdfPath: string | null = null;
    const registerRecreateProcess = (child: ChildProcess) => {
      if (this.recreateMissingNotesActive) {
        this.recreateMissingNotesProcess = child;
      }
    };

    try {
      this.showStatusProgress(this.formatStatusLabel("Docling extraction...", qualityLabel), 0);
      const doclingLogPath = this.settings.enableFileLogging ? this.getLogFileAbsolutePath() : null;
      await this.runPythonStreaming(
        doclingScript,
        await this.buildDoclingArgs(
          sourcePdf,
          docId,
          chunkPath,
          notePath,
          doclingLanguageHint,
          true
        ),
        (payload) => this.handleDoclingProgress(payload, qualityLabel),
        () => {},
        doclingLogPath,
        "docling_extract",
        registerRecreateProcess
      );
      this.recreateMissingNotesProcess = null;
      qualityLabel = await this.readDoclingQualityLabel(chunkPath);
      if (attachmentKey) {
        await this.annotateChunkJsonWithAttachmentKey(chunkPath, attachmentKey);
      }

      const metadata = await this.readDoclingMetadata(chunkPath);
      const layeredPath = await this.maybeCreateOcrLayeredPdf(
        sourcePdf,
        metadata,
        doclingLanguageHint
      );
      if (layeredPath) {
        sourcePdf = layeredPath;
        layeredPdfPath = layeredPath;
        await this.updateChunkJsonSourcePdf(chunkPath, layeredPath);
      }
    } catch (error) {
      if (this.recreateMissingNotesAbort) {
        this.recreateMissingNotesProcess = null;
        this.clearStatusProgress();
        return false;
      }
      if (showNotices) {
        new Notice("Docling extraction failed. See console for details.");
      }
      console.error(error);
      this.clearStatusProgress();
      return false;
    }

    const logPath = this.settings.enableFileLogging ? this.getLogFileAbsolutePath() : null;
    const redisOk = await this.ensureRedisAvailable("rebuild");
    if (!redisOk) {
      if (showNotices) {
        new Notice("Redis is unavailable; skipping indexing for this note.");
      }
    } else {
      try {
        this.showStatusProgress(this.formatStatusLabel("Indexing chunks...", qualityLabel), 0);
        const indexArgs = [
          "--chunks-json",
          this.getAbsoluteVaultPath(chunkPath),
          "--redis-url",
          this.settings.redisUrl,
          "--index",
          this.getRedisIndexName(),
          "--prefix",
          this.getRedisKeyPrefix(),
          "--embed-base-url",
          this.settings.embedBaseUrl,
          "--embed-api-key",
          this.settings.embedApiKey,
          "--embed-model",
          this.settings.embedModel,
          "--upsert",
          "--progress",
        ];
        this.appendEmbedSubchunkArgs(indexArgs);
        this.appendEmbedContextArgs(indexArgs);
        if (this.settings.embedIncludeMetadata) {
          indexArgs.push("--embed-include-metadata");
        }
        this.appendChunkTaggingArgs(indexArgs, { allowRegenerate: false });
        await this.runPythonStreaming(
          indexScript,
          indexArgs,
          (payload) => {
            const event = this.asRecord(payload);
            const total = typeof event?.total === "number" ? event.total : 0;
            const current = typeof event?.current === "number" ? event.current : 0;
            if (event?.type === "progress" && total > 0) {
              const percent = Math.round((current / total) * 100);
              const message =
                typeof event.message === "string" && event.message.trim()
                  ? event.message
                  : `Indexing chunks ${current}/${total}`;
              const label = this.formatStatusLabel(
                message,
                qualityLabel
              );
              this.showStatusProgress(label, percent);
            }
          },
          () => undefined,
          logPath,
          "index_redisearch",
          registerRecreateProcess
        );
        this.recreateMissingNotesProcess = null;
      } catch (error) {
        if (this.recreateMissingNotesAbort) {
          this.recreateMissingNotesProcess = null;
          this.clearStatusProgress();
          return false;
        }
        if (showNotices) {
          new Notice("Redissearch indexing failed; note will still be rebuilt.");
        }
        console.error(error);
      }
    }

    const pdfLink = layeredPdfPath
      ? this.buildPdfLinkFromSourcePath(layeredPdfPath)
      : this.buildPdfLinkForNote(sourcePdf, existingEntry?.attachment_key, docId);

    try {
      const doclingMd = await this.app.vault.adapter.read(notePath);
      const updatedChunkPayload = await this.readChunkPayload(chunkPath);
      const doclingContent = this.buildSyncedDoclingContent(docId, updatedChunkPayload, doclingMd);
      const noteContent = await this.buildNoteMarkdown(
        values,
        item.meta ?? {},
        docId,
        pdfLink,
        attachmentKey,
        notePath,
        itemPath,
        doclingContent
      );
      await this.writeNoteWithSyncSuppressed(notePath, noteContent);
      const noteFile = this.app.vault.getAbstractFileByPath(notePath);
      if (noteFile instanceof TFile) {
        this.scheduleNoteAnnotationSync(noteFile, 2000, "save");
      }
    } catch (error) {
      if (showNotices) {
        new Notice("Failed to finalize note Markdown.");
      }
      console.error(error);
      this.clearStatusProgress();
      return false;
    }

    try {
      const shortTitle = extractShortTitleFromValues(values);
      await this.updateDocIndex({
        doc_id: docId,
        note_path: notePath,
        note_title: path.basename(notePath, ".md"),
        zotero_title: title,
        short_title: shortTitle || undefined,
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

  async fetchZoteroLibraryOptions(): Promise<Array<{ value: string; label: string }>> {
    const options: Array<{ value: string; label: string }> = [
      { value: "0", label: "My Library (local)" },
    ];
    const groupOptions = await this.fetchZoteroGroupOptions();
    if (groupOptions.length) {
      options.push(...groupOptions);
    }
    return options;
  }

  async fetchEmbeddingModelOptions(): Promise<Array<{ value: string; label: string }>> {
    const current = (this.settings.embedModel || "").trim();
    const options: Array<{ value: string; label: string }> = [];
    const baseUrl = (this.settings.embedBaseUrl || "").trim().replace(/\/$/, "");
    if (!baseUrl) {
      if (current) {
        options.push({ value: current, label: current });
      }
      return options;
    }
    const apiKey = (this.settings.embedApiKey || "").trim();
    const modelIds = await this.fetchModelIds(baseUrl, apiKey);
    if (modelIds.length) {
      const embeddingModels = modelIds.filter((id) => /embed/i.test(id));
      const selected = embeddingModels.length ? embeddingModels : modelIds;
      options.push(...selected.map((id) => ({ value: id, label: id })));
    }
    if (!options.length && current) {
      options.push({ value: current, label: current });
    }
    return options.sort((a, b) => a.label.localeCompare(b.label));
  }

  async fetchChatModelOptions(): Promise<Array<{ value: string; label: string }>> {
    return this.fetchLlmModelOptions(this.settings.chatBaseUrl, this.settings.chatApiKey, "chat");
  }

  async fetchCleanupModelOptions(): Promise<Array<{ value: string; label: string }>> {
    return this.fetchLlmModelOptions(this.settings.llmCleanupBaseUrl, this.settings.llmCleanupApiKey, "cleanup");
  }

  private async fetchLlmModelOptions(
    baseUrlRaw: string,
    apiKeyRaw: string,
    label: string
  ): Promise<Array<{ value: string; label: string }>> {
    const current = label === "cleanup"
      ? (this.settings.llmCleanupModel || "").trim()
      : (this.settings.chatModel || "").trim();
    const options: Array<{ value: string; label: string }> = [];
    const baseUrl = (baseUrlRaw || "").trim().replace(/\/$/, "");
    if (!baseUrl) {
      if (current) {
        options.push({ value: current, label: current });
      }
      return options;
    }
    const apiKey = (apiKeyRaw || "").trim();
    const modelIds = await this.fetchModelIds(baseUrl, apiKey);
    if (modelIds.length) {
      const nonEmbedding = modelIds.filter((id) => !/embed/i.test(id));
      const selected = nonEmbedding.length ? nonEmbedding : modelIds;
      options.push(...selected.map((id) => ({ value: id, label: id })));
    }
    if (!options.length && current) {
      options.push({ value: current, label: current });
    }
    return options.sort((a, b) => a.label.localeCompare(b.label));
  }

  private detectEmbeddingProvider(baseUrl: string): "openai" | "openrouter" | "ollama" | "anthropic" | "generic" {
    const lowered = baseUrl.toLowerCase();
    if (lowered.includes("anthropic")) {
      return "anthropic";
    }
    if (lowered.includes("openrouter")) {
      return "openrouter";
    }
    if (lowered.includes("ollama") || lowered.includes(":11434")) {
      return "ollama";
    }
    if (lowered.includes("openai")) {
      return "openai";
    }
    return "generic";
  }

  private async fetchModelIds(baseUrl: string, apiKey: string): Promise<string[]> {
    const provider = this.detectEmbeddingProvider(baseUrl);
    try {
      if (provider === "anthropic") {
        return await this.fetchAnthropicModels(baseUrl, apiKey);
      }
      const modelIds = await this.fetchOpenAiCompatibleModels(baseUrl, apiKey);
      if (!modelIds.length && provider === "ollama") {
        return await this.fetchOllamaModels(baseUrl);
      }
      return modelIds;
    } catch (error) {
      console.warn("Failed to fetch models", error);
      return [];
    }
  }

  private async fetchOpenAiCompatibleModels(baseUrl: string, apiKey: string): Promise<string[]> {
    const url = `${baseUrl}/models`;
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }
    const response = await this.requestLocalApiRaw(url, { headers });
    if (response.statusCode >= 400) {
      throw new Error(`Model list request failed (${response.statusCode})`);
    }
    const parsed = JSON.parse(response.body.toString("utf8"));
    return this.extractModelIds(parsed);
  }

  private async fetchOllamaModels(baseUrl: string): Promise<string[]> {
    const root = baseUrl.replace(/\/v1\/?$/, "");
    const url = `${root}/api/tags`;
    const response = await this.requestLocalApiRaw(url);
    if (response.statusCode >= 400) {
      throw new Error(`Ollama tags request failed (${response.statusCode})`);
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(response.body.toString("utf8"));
    } catch (error) {
      console.warn("Failed to parse Ollama tags response", error);
      return [];
    }
    if (!parsed || typeof parsed !== "object") {
      return [];
    }
    const list = (parsed as Record<string, unknown>).models;
    if (!Array.isArray(list)) {
      return [];
    }
    return list
      .map((item) => this.extractModelId(item))
      .filter((id): id is string => Boolean(id));
  }

  private async fetchAnthropicModels(baseUrl: string, apiKey: string): Promise<string[]> {
    if (!apiKey) {
      return [];
    }
    const url = `${baseUrl}/models`;
    const headers: Record<string, string> = {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    };
    const response = await this.requestLocalApiRaw(url, { headers });
    if (response.statusCode >= 400) {
      throw new Error(`Anthropic model list request failed (${response.statusCode})`);
    }
    const parsed = JSON.parse(response.body.toString("utf8"));
    return this.extractModelIds(parsed);
  }

  private extractModelIds(payload: unknown): string[] {
    if (Array.isArray(payload)) {
      return payload.map((item) => this.extractModelId(item)).filter((id): id is string => Boolean(id));
    }
    if (!payload || typeof payload !== "object") {
      return [];
    }
    const record = payload as Record<string, unknown>;
    const list = (record.data ?? record.models ?? record.model ?? record.items);
    if (Array.isArray(list)) {
      return list
        .map((item) => this.extractModelId(item))
        .filter((id): id is string => Boolean(id));
    }
    return [];
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== "object") {
      return null;
    }
    return value as Record<string, unknown>;
  }

  private extractModelId(entry: unknown): string | null {
    if (!entry || typeof entry !== "object") {
      return null;
    }
    const record = entry as Record<string, unknown>;
    const idValue = record.id ?? record.name ?? record.model ?? record.identifier;
    if (typeof idValue !== "string") {
      return null;
    }
    const id = idValue.trim();
    return id || null;
  }

  private async fetchZoteroGroupOptions(): Promise<Array<{ value: string; label: string }>> {
    const options = new Map<string, string>();
    const addOptions = (items: Array<{ value: string; label: string }>) => {
      for (const option of items) {
        if (!options.has(option.value)) {
          options.set(option.value, option.label);
        }
      }
    };

    const localApiOk = await this.warnIfZoteroLocalApiUnavailable("Zotero groups");
    if (localApiOk) {
      try {
        const url = this.buildZoteroUrl("/users/0/groups");
        const payload = await this.requestLocalApi(url, `Zotero groups fetch failed for ${url}`);
        addOptions(this.parseZoteroGroupOptions(payload));
      } catch (error) {
        console.warn("Failed to fetch Zotero groups from local API", error);
      }
    }

    if (this.canUseWebApi() && this.settings.webApiLibraryType === "user") {
      const userId = (this.settings.webApiLibraryId || "").trim();
      if (userId) {
        try {
          const url = this.buildWebApiUrl(`/users/${userId}/groups`);
          const payload = await this.requestWebApi(url, `Zotero Web API groups fetch failed for ${url}`);
          addOptions(this.parseZoteroGroupOptions(payload));
        } catch (error) {
          console.warn("Failed to fetch Zotero groups from Web API", error);
        }
      }
    }

    return Array.from(options.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  private parseZoteroGroupOptions(
    payload: Buffer
  ): Array<{ value: string; label: string }> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(payload.toString("utf8"));
    } catch (error) {
      console.warn("Failed to parse Zotero group payload", error);
      return [];
    }
    if (!Array.isArray(parsed)) {
      return [];
    }
    const options: Array<{ value: string; label: string }> = [];
    for (const entry of parsed) {
      if (!entry || typeof entry !== "object") {
        continue;
      }
      const record = (entry as { data?: Record<string, unknown> }).data ?? (entry as Record<string, unknown>);
      const idValue = record.id ?? (entry as Record<string, unknown>).id ?? record.key;
      if (!idValue) {
        continue;
      }
      const id = (typeof idValue === "string" || typeof idValue === "number")
        ? String(idValue).trim()
        : "";
      if (!id) {
        continue;
      }
      const nameValue = record.name ?? (entry as Record<string, unknown>).name ?? id;
      const name = (typeof nameValue === "string" || typeof nameValue === "number")
        ? String(nameValue).trim() || id
        : id;
      options.push({
        value: `groups/${id}`,
        label: `Group: ${name}`,
      });
    }
    return options;
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

  private async buildNoteMarkdown(
    values: ZoteroItemValues,
    meta: Record<string, unknown>,
    docId: string,
    pdfLink: string,
    attachmentKey: string | undefined,
    notePath: string,
    itemPath: string,
    doclingMarkdown: string
  ): Promise<string> {
    const jsonLink = `[[${itemPath}]]`;
    const canEmbed = this.settings.copyPdfToVault && pdfLink.startsWith("[[");
    const zoteroLink = attachmentKey ? this.buildZoteroDeepLink(docId, attachmentKey) : "";
    const frontmatterPdfLink = zoteroLink || pdfLink;
    const displayLink = canEmbed ? pdfLink : (zoteroLink || pdfLink);
    const pdfLine = displayLink ? (canEmbed ? `PDF: !${displayLink}` : `PDF: ${displayLink}`) : "";
    const pdfBlock = pdfLine ? `${pdfLine}\n\n` : "";
    const vars = await this.buildTemplateVars(values, meta, docId, frontmatterPdfLink, jsonLink);
    vars["pdf_block"] = pdfBlock;
    vars["pdf_line"] = pdfLine;
    vars["docling_markdown"] = doclingMarkdown;
    const bodyTemplate = (this.settings.noteBodyTemplate || "").trim();
    const wantsAnnotationBlock = /{{\s*annotation_block\s*}}/i.test(bodyTemplate);
    if (wantsAnnotationBlock && attachmentKey) {
      vars["annotation_block"] = await this.buildAnnotationBlockForAttachment(docId, attachmentKey, notePath);
    } else {
      vars["annotation_block"] = "";
    }
    const frontmatter = this.ensureDocIdInFrontmatter(
      await this.renderFrontmatter(
        values,
        meta,
        docId,
        frontmatterPdfLink,
        jsonLink,
        vars
      ),
      docId
    );
    const frontmatterBlock = frontmatter ? `---\n${frontmatter}\n---\n\n` : "";

    const defaultBody = `${pdfBlock}${doclingMarkdown}`;
    const body = bodyTemplate
      ? this.renderTemplate(bodyTemplate, vars, defaultBody, { appendDocling: true })
      : defaultBody;
    return `${frontmatterBlock}${body}`;
  }

  private async buildAnnotationBlockForAttachment(
    docId: string,
    attachmentKey: string,
    notePath?: string
  ): Promise<string> {
    const resolved = await this.fetchZoteroAnnotationsForDoc(docId, attachmentKey);
    if (resolved.attachmentKey && resolved.attachmentKey !== attachmentKey) {
      await this.updateDocIndex({ doc_id: docId, attachment_key: resolved.attachmentKey });
    }
    await this.attachAnnotationImages(docId, resolved.attachmentKey, resolved.annotations, notePath);
    return this.buildAnnotationBlock(docId, resolved.attachmentKey, resolved.annotations);
  }

  private buildAnnotationBlock(
    docId: string,
    attachmentKey: string,
    annotations: AnnotationEntry[]
  ): string {
    const start = `<!-- zrr:annotations-start doc_id=${docId} attachment_key=${attachmentKey} -->`;
    const end = "<!-- zrr:annotations-end -->";
    if (!annotations.length) {
      return `${start}\n${end}`;
    }
    const colorMap = this.getAnnotationColorMap();
    const colorOrder = Object.keys(colorMap);
    const grouped = new Map<string, AnnotationEntry[]>();
    for (const annotation of annotations) {
      const key = annotation.colorKey || this.normalizeAnnotationColorKey(annotation.colorKey);
      const list = grouped.get(key) ?? [];
      list.push(annotation);
      grouped.set(key, list);
    }
    const lines: string[] = [start];
    const seen = new Set<string>();
    const sortedKeys = [
      ...colorOrder,
      ...Array.from(grouped.keys()).filter((key) => !colorOrder.includes(key)),
    ];
    for (const colorKey of sortedKeys) {
      const entries = grouped.get(colorKey);
      if (!entries || !entries.length) {
        continue;
      }
      seen.add(colorKey);
      const { heading } = this.resolveAnnotationColorMeta(colorKey);
      lines.push("", `## ${heading}`);
      entries.sort((left, right) => {
        const leftToken = (left.sortToken || "").trim();
        const rightToken = (right.sortToken || "").trim();
        if (leftToken && rightToken && leftToken !== rightToken) {
          return leftToken.localeCompare(rightToken, undefined, { numeric: true, sensitivity: "base" });
        }
        if (leftToken && !rightToken) {
          return -1;
        }
        if (!leftToken && rightToken) {
          return 1;
        }
        const leftSortFinite = Number.isFinite(left.sortIndex);
        const rightSortFinite = Number.isFinite(right.sortIndex);
        if (leftSortFinite && rightSortFinite && left.sortIndex !== right.sortIndex) {
          return left.sortIndex - right.sortIndex;
        }
        const leftPage = left.pageIndex ?? 0;
        const rightPage = right.pageIndex ?? 0;
        if (leftPage !== rightPage) {
          return leftPage - rightPage;
        }
        return left.key.localeCompare(right.key);
      });
      for (const entry of entries) {
        lines.push(...this.formatAnnotationCallout(entry, attachmentKey, docId));
      }
    }
    lines.push("", end);
    return lines.join("\n").trim();
  }

  private formatAnnotationCallout(
    entry: AnnotationEntry,
    attachmentKey: string,
    docId: string
  ): string[] {
    const label = this.settings.annotationPageLabel || "Page";
    const pageLabel = entry.pageLabel || (entry.pageIndex ? String(entry.pageIndex) : "?");
    const pageParam = entry.pageIndex ? String(entry.pageIndex) : "";
    const zoteroLink = this.buildZoteroDeepLink(docId, attachmentKey, pageParam, entry.key);
    const header = `> [!${entry.callout}] ${label} [${pageLabel}](${zoteroLink})`;
    const lines: string[] = [header];
    if (entry.imagePath) {
      lines.push(`> ![[${entry.imagePath}]]`);
    }

    const pushLines = (text: string): void => {
      if (!text) {
        return;
      }
      for (const line of text.split(/\r?\n/)) {
        lines.push(line.trim() ? `> ${line}` : ">");
      }
    };

    pushLines(entry.text);

    if (entry.comment) {
      lines.push(">", "> ---");
      pushLines(entry.comment);
    }

    if (entry.tags.length) {
      lines.push(`> **Tags:** ${entry.tags.map((tag) => `#${tag}`).join(" ")}`);
    }

    const pageToken = entry.pageIndex ? String(entry.pageIndex) : "0";
    lines.push(`> ^${entry.key}a${attachmentKey}p${pageToken}`);
    lines.push("");
    return lines;
  }

  private findAnnotationBlockRange(content: string): { start: number; end: number; block: string; startMarker: string } | null {
    const startMatch = ZRR_ANNOTATIONS_START_RE.exec(content);
    if (!startMatch) {
      return null;
    }
    const afterStart = content.slice(startMatch.index + startMatch[0].length);
    const endMatch = ZRR_ANNOTATIONS_END_RE.exec(afterStart);
    if (!endMatch) {
      return null;
    }
    const start = startMatch.index;
    const end = startMatch.index + startMatch[0].length + endMatch.index + endMatch[0].length;
    const block = afterStart.slice(0, endMatch.index);
    return {
      start,
      end,
      block,
      startMarker: startMatch[0],
    };
  }

  private parseAnnotationBlockMarker(marker: string): { docId?: string; attachmentKey?: string } {
    const docMatch = marker.match(/doc_id=(["']?)([^"'\s]+)\1/i);
    const attachmentMatch = marker.match(/attachment_key=(["']?)([^"'\s]+)\1/i);
    return {
      docId: docMatch ? docMatch[2].trim() : undefined,
      attachmentKey: attachmentMatch ? attachmentMatch[2].trim() : undefined,
    };
  }

  private parseAnnotationBlock(
    block: string,
    attachmentKey: string
  ): ParsedAnnotationNote[] {
    const lines = block.split(/\r?\n/);
    const notes: ParsedAnnotationNote[] = [];
    let idx = 0;
    while (idx < lines.length) {
      const line = lines[idx];
      if (!line.trim().startsWith("> [!")) {
        idx += 1;
        continue;
      }
      const calloutLines: string[] = [];
      while (idx < lines.length && lines[idx].trim().startsWith(">")) {
        calloutLines.push(lines[idx]);
        idx += 1;
      }
      const parsed = this.parseAnnotationCallout(calloutLines, attachmentKey);
      if (parsed) {
        notes.push(parsed);
      }
    }
    return notes;
  }

  private parseAnnotationImageLine(
    line: string
  ): { path: string; hash: string } | null {
    const trimmed = line.trim();
    if (!trimmed) {
      return null;
    }
    let pathValue = "";
    const wikiMatch = trimmed.match(/!\[\[([^\]]+)\]\]/);
    if (wikiMatch) {
      pathValue = wikiMatch[1].trim();
    }
    const mdMatch = !pathValue ? trimmed.match(/!\[[^\]]*\]\(([^)]+)\)/) : null;
    if (mdMatch) {
      pathValue = mdMatch[1].trim();
    }
    const htmlMatch = !pathValue ? trimmed.match(/<img[^>]+src=["']([^"']+)["']/i) : null;
    if (htmlMatch) {
      pathValue = htmlMatch[1].trim();
    }
    if (!pathValue) {
      return null;
    }
    const cleaned = pathValue.split("|")[0]?.trim() ?? "";
    if (!cleaned) {
      return null;
    }
    return {
      path: cleaned,
      hash: this.extractAnnotationImageHashFromPath(cleaned),
    };
  }

  private parseAnnotationCallout(
    lines: string[],
    fallbackAttachmentKey: string
  ): ParsedAnnotationNote | null {
    if (!lines.length) {
      return null;
    }
    const header = lines[0].replace(/^>\s?/, "").trim();
    const calloutMatch = header.match(/\[!([^\]]+)\]/);
    const callout = calloutMatch ? calloutMatch[1].trim() : "note";
    const linkMatch = header.match(/\((zotero:\/\/open-pdf\/library\/items\/[^)]+)\)/i);
    let annotationKey = "";
    let attachmentKey = fallbackAttachmentKey;
    let pageLabel = "";
    let pageIndex: number | null = null;
    if (linkMatch) {
      const link = linkMatch[1];
      const attachmentMatch = link.match(/items\/([A-Z0-9]{8})/i);
      if (attachmentMatch) {
        attachmentKey = attachmentMatch[1];
      }
      const annotationMatch = link.match(/annotation=([A-Z0-9]{8})/i);
      if (annotationMatch) {
        annotationKey = annotationMatch[1];
      }
      const pageMatch = link.match(/page=(\d+)/i);
      if (pageMatch) {
        pageIndex = Number(pageMatch[1]);
      }
      const labelMatch = header.match(/\[([^\]]+)\]\(zotero:\/\//i);
      if (labelMatch) {
        pageLabel = labelMatch[1].trim();
      }
    }

    const tagLines: string[] = [];
    const highlightLines: string[] = [];
    const commentLines: string[] = [];
    let inComment = false;
    let imagePath = "";
    let imageHash = "";

    for (let i = 1; i < lines.length; i += 1) {
      const raw = lines[i].replace(/^>\s?/, "");
      const trimmed = raw.trim();
      if (!trimmed) {
        if (inComment) {
          commentLines.push("");
        } else {
          highlightLines.push("");
        }
        continue;
      }
      const imageInfo = this.parseAnnotationImageLine(trimmed);
      if (imageInfo) {
        imagePath = imageInfo.path;
        imageHash = imageInfo.hash;
        continue;
      }
      if (trimmed.startsWith("^")) {
        const match = trimmed.match(/^\^([A-Z0-9]{8})a([A-Z0-9]{8})p(\d+)/i);
        if (match) {
          annotationKey = match[1];
          attachmentKey = match[2];
          pageIndex = Number(match[3]);
        }
        continue;
      }
      if (/^(\*\*tags:\*\*|tags:)/i.test(trimmed)) {
        tagLines.push(trimmed);
        continue;
      }
      if (trimmed === "---") {
        inComment = true;
        continue;
      }
      if (inComment) {
        commentLines.push(raw);
      } else {
        highlightLines.push(raw);
      }
    }

    const tagText = tagLines.join(" ");
    const tags = tagText
      ? tagText
          .replace(/\*\*tags:\*\*/i, "")
          .replace(/tags:/i, "")
          .split(/[\s,]+/)
          .map((tag) => tag.trim().replace(/^#+/, ""))
          .filter(Boolean)
      : [];

    if (!annotationKey) {
      return null;
    }

    return {
      key: annotationKey,
      attachmentKey,
      pageLabel,
      pageIndex,
      callout,
      text: this.normalizeAnnotationText(highlightLines.join("\n")),
      comment: this.normalizeAnnotationText(commentLines.join("\n")),
      tags: this.normalizeAnnotationTags(tags),
      imagePath: imagePath || undefined,
      imageHash: imageHash || undefined,
    };
  }

  private replaceAnnotationBlock(content: string, nextBlock: string): string | null {
    const range = this.findAnnotationBlockRange(content);
    if (!range) {
      return null;
    }
    const before = content.slice(0, range.start);
    const after = content.slice(range.end);
    const block = nextBlock.trim() ? `${nextBlock.trim()}\n` : `${nextBlock}`;
    return `${before}${block}${after}`.replace(/\n{4,}/g, "\n\n\n");
  }

  private async renderFrontmatter(
    values: ZoteroItemValues,
    meta: Record<string, unknown>,
    docId: string,
    pdfLink: string,
    itemJsonLink: string,
    vars?: Record<string, string>
  ): Promise<string> {
    const template = this.settings.frontmatterTemplate ?? "";
    if (!template.trim()) {
      return "";
    }
    const resolved = vars ?? await this.buildTemplateVars(values, meta, docId, pdfLink, itemJsonLink);
    const rendered = this.renderTemplate(template, resolved, "", { appendDocling: false }).trim();
    const cleaned = this.stripEmptyFrontmatterFields(rendered);
    return this.normalizeFrontmatterKeySpacing(cleaned);
  }

  private stripEmptyFrontmatterFields(frontmatter: string): string {
    if (!frontmatter.trim()) {
      return "";
    }
    const lines = frontmatter.split(/\r?\n/);
    const cleaned: string[] = [];
    const keyRe = /^([A-Za-z0-9][A-Za-z0-9 _-]*)\s*:\s*(.*)$/;
    const listItemRe = /^[ \t]+-\s*(.*)$/;
    const preserveEmpty = new Set(["abstract"]);
    const emptyValue = (value: string): boolean => {
      return value === "" || value === "\"\"" || value === "''";
    };

    let idx = 0;
    while (idx < lines.length) {
      const line = lines[idx];
      const keyMatch = line.match(keyRe);
      if (!keyMatch) {
        cleaned.push(line);
        idx += 1;
        continue;
      }
      const key = keyMatch[1].trim();
      const value = keyMatch[2].trim();
      if (preserveEmpty.has(key)) {
        cleaned.push(line);
        idx += 1;
        continue;
      }
      if (!emptyValue(value)) {
        cleaned.push(line);
        idx += 1;
        continue;
      }
      let j = idx + 1;
      const listLines: string[] = [];
      while (j < lines.length) {
        const listMatch = lines[j].match(listItemRe);
        if (!listMatch) {
          break;
        }
        listLines.push(lines[j]);
        j += 1;
      }
      if (listLines.length === 0) {
        idx = j;
        while (idx < lines.length && lines[idx].trim() === "") {
          idx += 1;
        }
        continue;
      }
      const filteredList = listLines.filter((item) => {
        const match = item.match(listItemRe);
        if (!match) {
          return false;
        }
        const itemValue = match[1].trim();
        return !emptyValue(itemValue);
      });
      if (filteredList.length > 0) {
        cleaned.push(line, ...filteredList);
      }
      idx = j;
      if (filteredList.length === 0) {
        while (idx < lines.length && lines[idx].trim() === "") {
          idx += 1;
        }
      }
    }

    while (cleaned.length > 0 && cleaned[cleaned.length - 1].trim() === "") {
      cleaned.pop();
    }
    return cleaned.join("\n").trim();
  }

  private renderTemplate(
    template: string,
    vars: Record<string, string>,
    fallback: string,
    options: { appendDocling?: boolean } = {}
  ): string {
    let rendered = template.replace(/{{\s*([a-z0-9_]+)\s*}}/gi, (_, key) => vars[key] ?? "");
    if (options.appendDocling && !template.includes("{{docling_markdown}}") && vars["docling_markdown"]) {
      rendered = `${rendered}\n\n${vars["docling_markdown"]}`;
    }
    if (!rendered.trim()) {
      return fallback;
    }
    return rendered;
  }

  private async buildTemplateVars(
    values: ZoteroItemValues,
    meta: Record<string, unknown>,
    docId: string,
    pdfLink: string,
    itemJsonLink: string
  ): Promise<Record<string, string>> {
    const title = coerceString(values.title);
    let shortTitle = coerceString(values.shortTitle);
    const date = coerceString(values.date);
    const parsedDate = typeof meta?.parsedDate === "string" ? meta.parsedDate : "";
    const year = extractYear(parsedDate || date);
    const yearNumber = /^\d{4}$/.test(year) ? year : "";
    const creators = Array.isArray(values.creators) ? values.creators : [];
    const authorsList = creators.filter((c) => c.creatorType === "author").map((c) => formatCreatorName(c));
    const authors = authorsList.join("; ");
    const editorsList = creators
      .filter((c) => c.creatorType === "editor" || c.creatorType === "seriesEditor")
      .map((c) => formatCreatorName(c));
    const editors = editorsList.join("; ");
    const rawTagsList = Array.isArray(values.tags)
      ? values.tags
          .map((tag: unknown) => (typeof tag === "string" ? tag : this.asRecord(tag)?.tag))
          .filter((tag): tag is string => typeof tag === "string" && tag.length > 0)
      : [];
    const tagsList = this.sanitizeObsidianTags(rawTagsList);
    const tags = tagsList.join("; ");
    const collectionTitles = await this.resolveCollectionTitles(values);
    const collectionTitle = collectionTitles.join("; ");
    const collectionLinks = this.toObsidianLinks(collectionTitles);
    const collectionLinksText = collectionLinks.join("; ");
    const itemType = coerceString(values.itemType);
    const creatorSummary = typeof meta?.creatorSummary === "string" ? meta.creatorSummary : "";
    const publicationTitle = coerceString(values.publicationTitle);
    const bookTitle = coerceString(values.bookTitle);
    const journalAbbrev = coerceString(values.journalAbbreviation);
    const volume = coerceString(values.volume);
    const issue = coerceString(values.issue);
    const pages = coerceString(values.pages);
    const dateAdded = coerceString(values.dateAdded);
    const dateModified = coerceString(values.dateModified);
    const itemKey = typeof values.key === "string" ? values.key : docId;
    let doi = coerceString(values.DOI);
    if (!doi) {
      doi = extractDoiFromExtra(values);
    }
    let citekey = extractCitekey(values, meta);
    let csl: Record<string, unknown> | null = null;
    if (!doi || !shortTitle || !citekey) {
      csl = await this.fetchZoteroItemCsl(itemKey);
    }
    if (!doi) {
      doi = extractDoiFromCsl(csl);
    }
    if (!shortTitle) {
      shortTitle = extractShortTitleFromCsl(csl);
    }
    if (!citekey) {
      citekey = extractCitekeyFromCsl(csl);
    }
    const isbn = coerceString(values.ISBN);
    const issn = coerceString(values.ISSN);
    const publisher = coerceString(values.publisher);
    const place = coerceString(values.place);
    const url = coerceString(values.url);
    const language = coerceString(values.language);
    const abstractNote = coerceString(values.abstractNote);
    const itemLink = this.buildZoteroDeepLink(itemKey);
    const aliasesList = Array.from(
      new Set(
        [citekey, shortTitle, doi]
          .map((entry) => String(entry || "").trim())
          .filter((entry) => entry.length > 0)
      )
    );
    const aliases = aliasesList.join("; ");

    const vars: Record<string, string> = {
      doc_id: docId,
      zotero_key: typeof values.key === "string" ? values.key : docId,
      item_link: itemLink,
      citekey,
      title,
      short_title: shortTitle,
      date,
      year,
      year_number: yearNumber,
      authors,
      editors,
      aliases,
      tags,
      collection_title: collectionTitle,
      collection_titles: collectionTitle,
      collections_links: collectionLinksText,
      item_type: itemType,
      creator_summary: creatorSummary,
      publication_title: publicationTitle,
      book_title: bookTitle,
      journal_abbrev: journalAbbrev,
      volume,
      issue,
      pages,
      date_added: dateAdded,
      date_modified: dateModified,
      doi,
      isbn,
      issn,
      publisher,
      place,
      url,
      language,
      abstract: abstractNote,
      pdf_link: pdfLink,
      item_json: itemJsonLink,
    };

    for (const [key, value] of Object.entries(vars)) {
      const safe = this.escapeYamlString(value);
      vars[`${key}_yaml`] = safe;
      vars[`${key}_quoted`] = safe;
      vars[`${key}_text`] = safe;
    }

    vars["authors_yaml_list"] = this.toYamlList(authorsList);
    vars["editors_yaml_list"] = this.toYamlList(editorsList);
    vars["tags_yaml_list"] = tagsList.length > 0 ? this.toYamlList(tagsList) : "";
    vars["aliases_yaml_list"] = aliasesList.length > 0 ? this.toYamlList(aliasesList) : "";
    vars["collections_yaml_list"] = this.toYamlList(collectionTitles);
    vars["collections_links_yaml_list"] = this.toYamlList(collectionLinks);
    vars["tags_raw"] = rawTagsList.join("; ");
    vars["tags_raw_yaml"] = this.escapeYamlString(vars["tags_raw"]);
    vars["tags_raw_yaml_list"] = rawTagsList.length > 0 ? this.toYamlList(rawTagsList) : "";
    vars["authors_list"] = vars["authors_yaml_list"];
    vars["editors_list"] = vars["editors_yaml_list"];
    vars["tags_list"] = vars["tags_yaml_list"];
    vars["aliases_list"] = vars["aliases_yaml_list"];
    vars["collections_list"] = vars["collections_yaml_list"];
    vars["collections_links_list"] = vars["collections_links_yaml_list"];

    return vars;
  }

  private escapeYamlString(value: string): string {
    const normalized = String(value).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const safe = normalized
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n");
    return `"${safe}"`;
  }

  private toYamlList(items: string[]): string {
    if (!items.length) {
      return "  - \"\"";
    }
    return items.map((item) => `  - ${this.escapeYamlString(item)}`).join("\n");
  }

  private sanitizeObsidianTags(tags: string[]): string[] {
    const rawMode = this.settings.tagSanitizeMode || "kebab";
    const mode = rawMode === "replace" ? "kebab" : rawMode;
    return tags
      .map((tag) => this.sanitizeObsidianTag(tag, mode))
      .filter((tag) => tag.length > 0);
  }

  private sanitizeObsidianTag(
    tag: string,
    mode: "none" | "camel" | "pascal" | "snake" | "kebab"
  ): string {
    const raw = String(tag || "").trim();
    if (!raw) {
      return "";
    }
    const cleaned = raw.replace(/^#+/, "");
    if (mode === "none") {
      return cleaned;
    }
    const hasNonDigit = (value: string): boolean => !/^\d+$/.test(value);

    const normalizeSegments = (format: "camel" | "pascal" | "snake" | "kebab"): string => {
      const segments = cleaned
        .split("/")
        .map((segment) => {
          const normalized = segment.replace(/[^\p{L}\p{N}]+/gu, " ");
          const parts = normalized.split(/\s+/).filter(Boolean);
          if (!parts.length) {
            return "";
          }
          if (format === "camel" || format === "pascal") {
            const [first, ...rest] = parts;
            const firstWord =
              format === "pascal"
                ? first.charAt(0).toUpperCase() + first.slice(1)
                : first.charAt(0).toLowerCase() + first.slice(1);
            return [
              firstWord,
              ...rest.map((part) => part.charAt(0).toUpperCase() + part.slice(1)),
            ].join("");
          }
          const joiner = format === "snake" ? "_" : "-";
          return parts.join(joiner);
        })
        .filter(Boolean);
      const merged = segments.join("/").replace(/\/{2,}/g, "/").replace(/^\/+|\/+$/g, "");
      return merged;
    };

    const normalized = normalizeSegments(mode);
    return normalized && hasNonDigit(normalized) ? normalized : "";
  }

  private normalizeZoteroTags(tags: string[]): string[] {
    const normalized = new Map<string, string>();
    for (const tag of tags) {
      const value = this.normalizeZoteroTag(tag);
      if (!value) {
        continue;
      }
      const key = value.toLowerCase();
      if (!normalized.has(key)) {
        normalized.set(key, value);
      }
    }
    return Array.from(normalized.values());
  }

  private normalizeZoteroTag(tag: string): string {
    const raw = String(tag || "").trim();
    if (!raw) {
      return "";
    }
    const cleaned = raw.replace(/^#+/, "").trim();
    if (!cleaned) {
      return "";
    }
    const segments = cleaned
      .split("/")
      .map((segment) => {
        let value = segment.trim();
        if (!value) {
          return "";
        }
        value = value.replace(/[_-]+/g, " ");
        value = value.replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
        value = value.replace(/([a-z\\d])([A-Z])/g, "$1 $2");
        value = value.replace(/([a-zA-Z])(\\d)/g, "$1 $2");
        value = value.replace(/(\\d)([a-zA-Z])/g, "$1 $2");
        value = value.replace(/\s+/g, " ").trim();
        return value;
      })
      .filter(Boolean);
    if (!segments.length) {
      return "";
    }
    return segments.join("/");
  }

  private toObsidianLinks(items: string[]): string[] {
    return items
      .map((item) => String(item || "").trim())
      .filter((item) => item.length > 0)
      .map((item) => (item.startsWith("[[") && item.endsWith("]]") ? item : `[[${item}]]`));
  }

  private getVaultBasePath(): string {
    const adapter = this.app.vault.adapter;
    if (adapter instanceof FileSystemAdapter) {
      return adapter.getBasePath();
    }
    const adapterWithBasePath = adapter as FileSystemAdapter & { getBasePath?: () => string };
    const fallback = adapterWithBasePath.getBasePath?.();
    if (fallback) {
      return fallback;
    }
    throw new Error("Vault base path is unavailable.");
  }

  private expandPathValue(value: string): string {
    const raw = (value || "").trim();
    if (!raw) {
      return raw;
    }
    let expanded = raw;
    if (expanded === "~") {
      expanded = os.homedir();
    } else if (expanded.startsWith("~/") || expanded.startsWith("~\\")) {
      expanded = path.join(os.homedir(), expanded.slice(2));
    }
    expanded = expanded.replace(/\$([A-Za-z_][A-Za-z0-9_]*)|\$\{([^}]+)\}/g, (match, name1, name2) => {
      const key = name1 || name2;
      const value = key ? process.env[key] : undefined;
      return value !== undefined ? value : match;
    });
    expanded = expanded.replace(/%([^%]+)%/g, (match, name) => {
      const value = process.env[name];
      return value !== undefined ? value : match;
    });
    return expanded;
  }

  private resolvePythonPath(): string {
    return this.resolveUserPath(this.settings.pythonPath || "");
  }

  private getPythonRuntimeMode(): "worker" | "local" {
    return this.settings.pythonRuntime === "local" ? "local" : "worker";
  }

  private usePythonWorker(): boolean {
    return this.getPythonRuntimeMode() === "worker";
  }

  private getPythonWorkerCacheDir(): string {
    return path.join(this.getVaultBasePath(), CACHE_ROOT, "python-worker-cache");
  }

  private getPythonWorkerApiPort(redisPort?: number): number {
    const effectiveRedisPort = Number.isFinite(redisPort ?? NaN)
      ? Number(redisPort)
      : this.getRedisPortFromUrl();
    const candidate = effectiveRedisPort + PYTHON_WORKER_API_PORT_OFFSET;
    if (candidate >= 1024 && candidate <= 65535) {
      return candidate;
    }
    return PYTHON_WORKER_DEFAULT_API_PORT;
  }

  private getPythonWorkerApiBaseUrl(port?: number): string {
    const effectivePort = Number.isFinite(port ?? NaN)
      ? Number(port)
      : this.getPythonWorkerApiPort();
    return `http://${PYTHON_WORKER_API_HOST}:${effectivePort}`;
  }

  private getPythonWorkerApiPortFromContext(context: ComposeProjectContext): number {
    const envValue = Number.parseInt(String(context.composeEnv.ZRR_WORKER_PORT || ""), 10);
    if (Number.isFinite(envValue) && envValue > 0) {
      return envValue;
    }
    return this.getPythonWorkerApiPort();
  }

  private nextPythonWorkerRequestId(toolName: string): string {
    this.pythonWorkerRequestSeq += 1;
    const safeTool = toolName.replace(/[^a-zA-Z0-9_.-]/g, "_");
    return `${Date.now().toString(36)}-${this.pythonWorkerRequestSeq.toString(36)}-${safeTool}`;
  }

  private logPythonWorkerTiming(event: string, details: Record<string, unknown>): void {
    console.debug("[zrr-python-worker]", event, details);
  }

  private async isPythonWorkerApiHealthy(
    context: ComposeProjectContext,
    timeoutMs = 1500
  ): Promise<boolean> {
    const url = `${this.getPythonWorkerApiBaseUrl(this.getPythonWorkerApiPortFromContext(context))}/health`;
    try {
      const response = await this.requestLocalApiRaw(url, {
        headers: { Accept: "application/json" },
        timeoutMs,
      });
      if (response.statusCode < 200 || response.statusCode >= 300) {
        return false;
      }
      const payload = JSON.parse(response.body.toString("utf8"));
      return Boolean(payload?.ok);
    } catch {
      return false;
    }
  }

  private getWorkerToolName(scriptPath: string): string | null {
    const toolsDir = path.resolve(this.getPluginDir(), "tools");
    const resolved = path.resolve(scriptPath);
    if (path.dirname(resolved) !== toolsDir) {
      return null;
    }
    const basename = path.basename(resolved);
    if (!basename.endsWith(".py")) {
      return null;
    }
    if (basename.includes(path.sep)) {
      return null;
    }
    return basename;
  }

  private getComposeServiceNamesForCurrentRuntime(): string[] {
    if (this.usePythonWorker()) {
      return [REDIS_STACK_SERVICE, PYTHON_WORKER_SERVICE];
    }
    return [REDIS_STACK_SERVICE];
  }

  private toContainerPath(base: string, target: string, containerRoot: string): string | null {
    const relative = path.relative(base, target);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      return null;
    }
    const parts = relative.split(path.sep).filter(Boolean);
    return parts.length ? path.posix.join(containerRoot, ...parts) : containerRoot;
  }

  private mapPathForPythonWorker(rawPath: string): string {
    if (!path.isAbsolute(rawPath)) {
      return rawPath;
    }
    const normalized = path.normalize(rawPath);
    const pluginDir = path.normalize(this.getPluginDir());
    const vaultDir = path.normalize(this.getVaultBasePath());

    return (
      this.toContainerPath(pluginDir, normalized, PYTHON_WORKER_PLUGIN_ROOT) ??
      this.toContainerPath(vaultDir, normalized, PYTHON_WORKER_VAULT_ROOT) ??
      rawPath
    );
  }

  private getWorkerHostAlias(): string {
    const configured = (this.settings.dockerPath || "").toLowerCase();
    if (configured.includes("podman")) {
      return "host.containers.internal";
    }
    return "host.docker.internal";
  }

  private mapUrlForPythonWorker(rawValue: string): string {
    const trimmed = (rawValue || "").trim();
    if (!trimmed) {
      return rawValue;
    }
    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      return rawValue;
    }
    if (!["http:", "https:", "redis:", "rediss:", "redis+tls:"].includes(parsed.protocol)) {
      return rawValue;
    }
    if (!this.isLocalRedisHost(parsed.hostname || "")) {
      return rawValue;
    }
    if (parsed.protocol === "redis:" || parsed.protocol === "rediss:" || parsed.protocol === "redis+tls:") {
      // In worker runtime, prefer the compose service network over host loopback.
      parsed.hostname = REDIS_STACK_SERVICE;
      parsed.port = "6379";
      return parsed.toString();
    }
    parsed.hostname = this.getWorkerHostAlias();
    return parsed.toString();
  }

  private mapPythonArgsForWorker(args: string[]): string[] {
    return args.map((arg, index) => {
      if (index > 0 && args[index - 1] === "--redis-url") {
        return this.mapUrlForPythonWorker(arg);
      }
      if (arg.startsWith("--redis-url=")) {
        const value = arg.slice("--redis-url=".length);
        return `--redis-url=${this.mapUrlForPythonWorker(value)}`;
      }
      const mappedUrl = this.mapUrlForPythonWorker(arg);
      if (mappedUrl !== arg) {
        return mappedUrl;
      }
      if (!path.isAbsolute(arg)) {
        return arg;
      }
      const mapped = this.mapPathForPythonWorker(arg);
      if (mapped === arg) {
        throw new Error(
          `Python worker cannot access path '${arg}'. Keep files under your vault or plugin directory.`
        );
      }
      return mapped;
    });
  }

  private resolveUserPath(value: string, baseDir?: string): string {
    const expanded = this.expandPathValue(value);
    if (!expanded) {
      return expanded;
    }
    const hasSeparator = expanded.includes("/") || expanded.includes("\\");
    if (!hasSeparator) {
      return expanded;
    }
    if (path.isAbsolute(expanded)) {
      return expanded;
    }
    if (baseDir && (expanded.startsWith("./") || expanded.startsWith(".\\"))) {
      return path.join(baseDir, expanded.slice(2));
    }
    return path.join(os.homedir(), expanded);
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

  private async resolveAttachmentOutputDir(
    notePath: string
  ): Promise<{ absolute: string; relative: string } | null> {
    const sourcePath = notePath
      ? (path.isAbsolute(notePath) ? this.toVaultRelativePath(notePath) : normalizePath(notePath))
      : "";
    if (!sourcePath) {
      return null;
    }
    const fileManager = this.app.fileManager;
    if (!fileManager?.getAvailablePathForAttachment) {
      return null;
    }
    try {
      const placeholder = `zrr-image-${Date.now()}.png`;
      const candidate = await fileManager.getAvailablePathForAttachment(placeholder, sourcePath);
      if (!candidate) {
        return null;
      }
      const candidateAbs = path.isAbsolute(candidate)
        ? candidate
        : this.getAbsoluteVaultPath(candidate);
      const absDir = path.normalize(path.dirname(candidateAbs));
      const vaultBase = path.normalize(this.getVaultBasePath());
      const relDir = this.toVaultRelativePath(absDir);
      if (!relDir && absDir !== vaultBase) {
        return null;
      }
      return { absolute: absDir, relative: relDir };
    } catch (error) {
      console.warn("Failed to resolve attachment output dir", error);
      return null;
    }
  }

  private async resolveAnnotationImageOutputDir(
    notePath?: string
  ): Promise<{ absolute: string; relative: string } | null> {
    let baseDir: { absolute: string; relative: string } | null = null;
    if (notePath) {
      baseDir = await this.resolveAttachmentOutputDir(notePath);
    }
    if (!baseDir) {
      const fallback = normalizePath(this.settings.outputNoteDir || "");
      if (!fallback) {
        return null;
      }
      baseDir = {
        absolute: this.getAbsoluteVaultPath(fallback),
        relative: fallback,
      };
    }
    const relative = normalizePath(path.join(baseDir.relative || "", "zrr-annotations"));
    const absolute = path.normalize(path.join(baseDir.absolute, "zrr-annotations"));
    if (relative) {
      await this.ensureFolder(relative);
    }
    return { absolute, relative };
  }

  private async buildDoclingArgs(
    pdfSourcePath: string,
    docId: string,
    chunkPath: string,
    notePath: string,
    languageHint?: string | null,
    includeProgress = false
  ): Promise<string[]> {
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
    if (this.settings.forcePerPageOcr) {
      args.push("--force-per-page-ocr");
    }
    args.push("--quality-threshold", String(this.settings.ocrQualityThreshold));
    if (languageHint) {
      args.push("--language-hint", languageHint);
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
    // Auto-enable dictionary-based correction if a bundled wordlist exists
    const pluginDir = this.getPluginDir();
    const wordlistPath = path.join(pluginDir, "tools", "ocr_wordlist.txt");
    if (existsSync(wordlistPath)) {
      args.push("--enable-dictionary-correction", "--dictionary-path", wordlistPath);
    }

    if (this.settings.enableFileLogging) {
      const logAbs = this.getLogFileAbsolutePath();
      if (logAbs) {
        args.push("--log-file", logAbs);
      }
      const spellInfoAbs = this.getAbsoluteVaultPath(this.getSpellcheckerInfoRelativePath());
      if (spellInfoAbs) {
        args.push("--spellchecker-info-out", spellInfoAbs);
      }
    }

    const attachmentDir = await this.resolveAttachmentOutputDir(notePath);
    if (attachmentDir) {
      if (attachmentDir.relative) {
        await this.ensureFolder(attachmentDir.relative);
      }
      args.push("--image-output-dir", attachmentDir.absolute);
    }

    this.appendOcrEngineArgs(args);

    return args;
  }

  private appendOcrEngineArgs(args: string[]): void {
    const engine = this.settings.ocrEngine;
    const apiKey = (this.settings.paddleApiKey || "").trim();
    const vlApiUrl = (this.settings.paddleVlApiUrl || "").trim();
    const structureApiUrl = (this.settings.paddleStructureApiUrl || "").trim();

    const setPreferFallback = (value: "paddle" | "tesseract") => {
      args.push("--prefer-ocr-engine", value, "--fallback-ocr-engine", value);
    };

    const disableApis = () => {
      args.push("--no-paddle-vl-api", "--no-paddle-structure-api");
    };

    switch (engine) {
      case "tesseract":
        setPreferFallback("tesseract");
        args.push("--no-paddle-vl", "--no-paddle-structure-v3");
        disableApis();
        break;
      case "paddle_structure_local":
        setPreferFallback("paddle");
        args.push("--paddle-structure-v3", "--no-paddle-vl");
        disableApis();
        break;
      case "paddle_vl_local":
        setPreferFallback("paddle");
        args.push("--paddle-vl", "--no-paddle-structure-v3");
        disableApis();
        break;
      case "paddle_structure_api":
        setPreferFallback("paddle");
        args.push("--paddle-structure-v3", "--no-paddle-vl", "--no-paddle-vl-api");
        if (apiKey) {
          args.push("--paddle-structure-api", "--paddle-structure-api-token", apiKey);
          if (structureApiUrl) {
            args.push("--paddle-structure-api-url", structureApiUrl);
          }
        } else {
          args.push("--no-paddle-structure-api");
        }
        break;
      case "paddle_vl_api":
        setPreferFallback("paddle");
        args.push("--paddle-vl", "--no-paddle-structure-v3", "--no-paddle-structure-api");
        if (apiKey) {
          args.push("--paddle-vl-api", "--paddle-vl-api-token", apiKey);
          if (vlApiUrl) {
            args.push("--paddle-vl-api-url", vlApiUrl);
          }
        } else {
          args.push("--no-paddle-vl-api");
        }
        break;
      case "auto":
      default:
        disableApis();
        break;
    }
  }

  private appendEmbedSubchunkArgs(args: string[]): void {
    const subchunkChars = this.settings.embedSubchunkChars;
    if (Number.isFinite(subchunkChars)) {
      args.push("--embed-subchunk-chars", String(Math.max(0, Math.trunc(subchunkChars))));
    }
    const subchunkOverlap = this.settings.embedSubchunkOverlap;
    if (Number.isFinite(subchunkOverlap)) {
      args.push("--embed-subchunk-overlap", String(Math.max(0, Math.trunc(subchunkOverlap))));
    }
  }

  private appendEmbedContextArgs(args: string[]): void {
    const contextWindow = this.settings.embedContextWindow;
    if (Number.isFinite(contextWindow)) {
      args.push("--embed-context-window", String(Math.max(0, Math.trunc(contextWindow))));
    }
    const contextChars = this.settings.embedContextChars;
    if (Number.isFinite(contextChars)) {
      args.push("--embed-context-chars", String(Math.max(0, Math.trunc(contextChars))));
    }
  }

  private appendChunkTaggingArgs(args: string[], options?: { allowRegenerate?: boolean }): void {
    if (options?.allowRegenerate === false) {
      return;
    }
    if (!this.settings.enableChunkTagging) {
      return;
    }
    const baseUrl = (this.settings.llmCleanupBaseUrl || "").trim();
    const model = (this.settings.llmCleanupModel || "").trim();
    if (!baseUrl || !model) {
      return;
    }
    args.push("--generate-chunk-tags", "--tag-base-url", baseUrl, "--tag-model", model);
    const apiKey = (this.settings.llmCleanupApiKey || "").trim();
    if (apiKey) {
      args.push("--tag-api-key", apiKey);
    }
    args.push("--tag-temperature", String(this.settings.llmCleanupTemperature));
  }

  private getRedisDataDir(): string {
    const envOverride = this.resolveUserPath(process.env.ZRR_DATA_DIR || "");
    if (envOverride) {
      return envOverride;
    }
    const override = this.resolveUserPath(this.settings.redisDataDirOverride || "", this.getVaultBasePath());
    if (!this.settings.autoAssignRedisPort && override) {
      return override;
    }
    return path.join(this.getVaultBasePath(), CACHE_ROOT, "redis-data");
  }

  private getDockerComposePath(): string {
    const pluginDir = this.getPluginDir();
    return path.join(pluginDir, "tools", "docker-compose.yml");
  }

  private prependBinaryDirToPath(env: NodeJS.ProcessEnv, binaryPath: string): void {
    if (!binaryPath || !path.isAbsolute(binaryPath)) {
      return;
    }
    const dir = path.dirname(binaryPath);
    const existingPath = env.PATH || "";
    const parts = existingPath ? existingPath.split(path.delimiter) : [];
    if (parts.includes(dir)) {
      return;
    }
    env.PATH = existingPath ? `${dir}${path.delimiter}${existingPath}` : dir;
  }

  private async resolveDockerPath(): Promise<string> {
    const configuredRaw = this.settings.dockerPath?.trim();
    const configured = configuredRaw ? this.resolveUserPath(configuredRaw) : "";
    const dockerCandidates = [
      "/opt/homebrew/bin/docker",
      "/usr/local/bin/docker",
      "/usr/bin/docker",
      "/Applications/Docker.app/Contents/Resources/bin/docker",
    ];
    const podmanCandidates = ["/opt/homebrew/bin/podman", "/usr/local/bin/podman", "/usr/bin/podman"];
    const podmanComposeCandidates = [
      "/opt/homebrew/bin/podman-compose",
      "/usr/local/bin/podman-compose",
      "/usr/bin/podman-compose",
    ];
    const candidates: string[] = [];
    if (configured) {
      candidates.push(configured);
    }

    const preferredKind = configured ? this.getContainerCliKind(configured) : "docker";
    const orderedGroups =
      preferredKind === "podman-compose"
        ? [podmanComposeCandidates, podmanCandidates, dockerCandidates]
        : preferredKind === "podman"
          ? [podmanCandidates, podmanComposeCandidates, dockerCandidates]
          : [dockerCandidates, podmanCandidates, podmanComposeCandidates];

    if (
      !configured ||
      configured === "docker" ||
      configured === "podman" ||
      configured === "podman-compose"
    ) {
      for (const group of orderedGroups) {
        candidates.push(...group);
      }
    }

    for (const candidate of candidates) {
      if (!path.isAbsolute(candidate)) {
        continue;
      }
      try {
        if (await this.isContainerCliAvailable(candidate)) {
          return candidate;
        }
      } catch {
        // Keep trying candidates.
      }
    }

    const pathCandidates = [
      configured,
      preferredKind === "podman" ? "podman" : "docker",
      preferredKind === "podman" ? "docker" : "podman",
      "podman-compose",
    ].filter((value): value is string => Boolean(value && value.trim()));
    for (const candidate of pathCandidates) {
      if (await this.isContainerCliAvailable(candidate)) {
        return candidate;
      }
    }

    return configured || "docker";
  }

  private async isContainerCliAvailable(cliPath: string): Promise<boolean> {
    return new Promise((resolve) => {
      const child = spawn(cliPath, ["--version"]);
      child.on("error", () => resolve(false));
      child.on("close", (code) => resolve(code === 0));
    });
  }

  private getContainerCliKind(cliPath: string): "docker" | "podman" | "podman-compose" {
    const base = path.basename(cliPath);
    if (base === "podman-compose") {
      return "podman-compose";
    }
    if (base.includes("podman")) {
      return "podman";
    }
    return "docker";
  }

  private async isContainerDaemonRunning(cliPath: string): Promise<boolean> {
    const kind = this.getContainerCliKind(cliPath);
    let command = cliPath;
    let args = ["info"];
    if (kind === "podman-compose") {
      const podmanBin = await this.resolvePodmanBin();
      if (!podmanBin) {
        return false;
      }
      command = podmanBin;
    }

    return new Promise((resolve) => {
      const child = spawn(command, args);
      let resolved = false;
      const finish = (ok: boolean): void => {
        if (resolved) {
          return;
        }
        resolved = true;
        resolve(ok);
      };
      const timeout = setTimeout(() => {
        child.kill();
        finish(false);
      }, 2000);
      child.on("error", () => {
        clearTimeout(timeout);
        finish(false);
      });
      child.on("close", (code) => {
        clearTimeout(timeout);
        finish(code === 0);
      });
    });
  }

  private getContainerDaemonHint(cliPath: string): string {
    const kind = this.getContainerCliKind(cliPath);
    if (kind === "podman" || kind === "podman-compose") {
      return "Podman machine not running. Run `podman machine start`.";
    }
    return "Docker Desktop is not running. Start Docker Desktop.";
  }

  private async supportsComposeSubcommand(cliPath: string): Promise<boolean> {
    return new Promise((resolve) => {
      const child = spawn(cliPath, ["compose", "version"]);
      child.on("error", () => resolve(false));
      child.on("close", (code) => resolve(code === 0));
    });
  }

  private async findPodmanComposePath(): Promise<string | null> {
    const candidates = [
      "/opt/homebrew/bin/podman-compose",
      "/usr/local/bin/podman-compose",
      "/usr/bin/podman-compose",
    ];
    for (const candidate of candidates) {
      try {
        await fs.access(candidate);
        return candidate;
      } catch {
        // Keep trying candidates.
      }
    }
    if (await this.isContainerCliAvailable("podman-compose")) {
      return "podman-compose";
    }
    return null;
  }

  private async resolvePodmanBin(): Promise<string | null> {
    const candidates = ["/opt/homebrew/bin/podman", "/usr/local/bin/podman", "/usr/bin/podman"];
    for (const candidate of candidates) {
      if (await this.isContainerCliAvailable(candidate)) {
        return candidate;
      }
    }
    if (await this.isContainerCliAvailable("podman")) {
      return "podman";
    }
    return null;
  }

  private async resolveComposeCommand(
    cliPath: string
  ): Promise<ComposeCommandSpec | null> {
    const base = path.basename(cliPath);
    if (base === "podman-compose") {
      return { command: cliPath, argsPrefix: [] };
    }
    if (base === "podman") {
      const podmanCompose = await this.findPodmanComposePath();
      if (podmanCompose) {
        return { command: podmanCompose, argsPrefix: [] };
      }
      if (await this.supportsComposeSubcommand(cliPath)) {
        return { command: cliPath, argsPrefix: ["compose"] };
      }
      return null;
    }
    if (await this.supportsComposeSubcommand(cliPath)) {
      return { command: cliPath, argsPrefix: ["compose"] };
    }
    return null;
  }

  private async buildComposeEnvironment(
    dockerPath: string,
    composeCommand: ComposeCommandSpec,
    options?: { dataDir?: string; redisPort?: number }
  ): Promise<NodeJS.ProcessEnv> {
    const composeEnv: NodeJS.ProcessEnv = { ...process.env };
    this.prependBinaryDirToPath(composeEnv, dockerPath);
    this.prependBinaryDirToPath(composeEnv, composeCommand.command);
    if (path.basename(composeCommand.command) === "podman-compose") {
      const podmanBin = await this.resolvePodmanBin();
      if (podmanBin) {
        composeEnv.PODMAN_BIN = podmanBin;
        this.prependBinaryDirToPath(composeEnv, podmanBin);
      }
    }
    const dataDir = options?.dataDir || this.getRedisDataDir();
    const redisPort = options?.redisPort ?? this.getRedisPortFromUrl();
    const workerPort = this.getPythonWorkerApiPort(redisPort);
    composeEnv.ZRR_DATA_DIR = this.toComposePath(dataDir);
    composeEnv.ZRR_PORT = String(redisPort);
    composeEnv.ZRR_WORKER_PORT = String(workerPort);
    composeEnv.ZRR_VAULT_DIR = this.toComposePath(this.getVaultBasePath());
    composeEnv.ZRR_PLUGIN_DIR = this.toComposePath(this.getPluginDir());
    composeEnv.ZRR_WORKER_CACHE_DIR = this.toComposePath(this.getPythonWorkerCacheDir());
    return composeEnv;
  }

  private toComposePath(rawPath: string): string {
    if (process.platform !== "win32") {
      return rawPath;
    }
    // Docker/Compose on Windows resolves bind mounts more reliably with forward slashes.
    return rawPath.replace(/\\/g, "/");
  }

  private async resolveComposeProjectContext(
    options?: { dataDir?: string; redisPort?: number }
  ): Promise<ComposeProjectContext> {
    await this.ensureBundledTools();
    const composePath = this.getDockerComposePath();
    const dockerPath = await this.resolveDockerPath();
    if (!(await this.isContainerCliAvailable(dockerPath))) {
      throw new Error(
        'Docker or Podman not found. Install Docker Desktop or Podman and set "Docker/Podman path" in settings.'
      );
    }
    if (!(await this.isContainerDaemonRunning(dockerPath))) {
      throw new Error(this.getContainerDaemonHint(dockerPath));
    }
    const composeCommand = await this.resolveComposeCommand(dockerPath);
    if (!composeCommand) {
      throw new Error(
        "Compose support not found. Install Docker Desktop or Podman with podman-compose."
      );
    }
    const composeEnv = await this.buildComposeEnvironment(dockerPath, composeCommand, options);
    return {
      composePath,
      composeCommand,
      composeEnv,
      project: this.getDockerProjectName(),
    };
  }

  private async maybeShowFirstContainerStartupNotice(silent?: boolean): Promise<void> {
    if (silent || this.settings.firstContainerStartupNoticeShown) {
      return;
    }
    this.settings.firstContainerStartupNoticeShown = true;
    try {
      await this.saveSettings();
    } catch (error) {
      console.warn("Failed to persist first container startup notice flag", error);
    }
    new Notice(
      "First container startup can take several minutes (sometimes 10+ minutes) while images are pulled and worker dependencies are built.",
      16000
    );
  }

  private async autoDetectContainerCliOnLoad(): Promise<void> {
    const resolved = await this.resolveDockerPath();
    if (!(await this.isContainerCliAvailable(resolved))) {
      this.notifyContainerOnce(
        "Docker or Podman not found. Install Docker Desktop or Podman and set Docker/Podman path in settings."
      );
      return;
    }
    const configuredRaw = this.settings.dockerPath?.trim() || "docker";
    const configured = this.expandPathValue(configuredRaw);
    const configuredAvailable = await this.isContainerCliAvailable(configured);
    const isGeneric =
      configuredRaw === "docker" ||
      configuredRaw === "podman" ||
      configuredRaw === "podman-compose";
    const shouldAutoSet = !configuredAvailable && !isGeneric;
    if (shouldAutoSet && resolved && resolved !== configuredRaw) {
      this.settings.dockerPath = resolved;
      await this.saveSettings();
    }
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    if (await this.isContainerDaemonRunning(resolved)) {
      return;
    }
    for (const waitMs of [5000, 10000]) {
      await delay(waitMs);
      if (await this.isContainerDaemonRunning(resolved)) {
        return;
      }
    }
    this.notifyContainerOnce(this.getContainerDaemonHint(resolved));
  }

  private getDockerProjectName(): string {
    const sanitizeProjectName = (name: string): string => {
      return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 32);
    };
    const envOverride = (process.env.ZRR_PROJECT_NAME || "").trim();
    if (envOverride && !this.settings.autoAssignRedisPort) {
      return sanitizeProjectName(envOverride) || "zrr";
    }
    const override = (this.settings.redisProjectName || "").trim();
    if (override && !this.settings.autoAssignRedisPort) {
      return sanitizeProjectName(override) || "zrr";
    }
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

  private getVaultPreferredRedisPort(): number {
    const hash = createHash("sha1").update(this.getVaultBasePath()).digest("hex");
    const offset = Number.parseInt(hash.slice(0, 4), 16) % 2000;
    return 6400 + offset;
  }

  private getRedisHostFromUrl(): string {
    try {
      const parsed = new URL(this.settings.redisUrl);
      return parsed.hostname || "127.0.0.1";
    } catch {
      return "127.0.0.1";
    }
  }

  private isLocalRedisHost(host: string): boolean {
    const normalized = host.trim().toLowerCase();
    if (!normalized) {
      return false;
    }
    if (normalized === "localhost" || normalized === "0.0.0.0" || normalized === "::1") {
      return true;
    }
    return normalized.startsWith("127.");
  }

  private getPortCheckHost(host: string): string {
    if (!this.isLocalRedisHost(host)) {
      return host;
    }
    return "127.0.0.1";
  }

  private async isPortFree(host: string, port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.once("error", () => resolve(false));
      server.once("listening", () => {
        server.close(() => resolve(true));
      });
      server.listen(port, host);
    });
  }

  private async findAvailablePort(host: string, startPort: number): Promise<number | null> {
    const maxAttempts = 25;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const port = startPort + attempt;
      if (await this.isPortFree(host, port)) {
        return port;
      }
    }
    return null;
  }

  private updateRedisUrlPort(redisUrl: string, port: number): string {
    try {
      const parsed = new URL(redisUrl);
      parsed.port = String(port);
      return parsed.toString();
    } catch {
      return `redis://127.0.0.1:${port}`;
    }
  }

  private async isRedisReachable(redisUrl: string): Promise<boolean> {
    let host = "127.0.0.1";
    let port = 6379;
    try {
      const parsed = new URL(redisUrl);
      host = parsed.hostname || host;
      port = parsed.port ? Number(parsed.port) : port;
    } catch {
      return false;
    }

    host = this.getPortCheckHost(host);
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let done = false;
      const finish = (ok: boolean): void => {
        if (done) {
          return;
        }
        done = true;
        socket.destroy();
        resolve(ok);
      };
      socket.setTimeout(500);
      socket.once("connect", () => finish(true));
      socket.once("timeout", () => finish(false));
      socket.once("error", () => finish(false));
      socket.connect(port, host);
    });
  }

  private async isZoteroLocalApiReachable(): Promise<boolean> {
    const raw = (this.settings.zoteroBaseUrl || "").trim();
    if (!raw) {
      return false;
    }
    let host = "127.0.0.1";
    let port = 23119;
    try {
      const parsed = new URL(raw);
      host = parsed.hostname || host;
      if (parsed.port) {
        const parsedPort = Number(parsed.port);
        if (Number.isFinite(parsedPort) && parsedPort > 0) {
          port = parsedPort;
        }
      } else if (parsed.protocol === "https:") {
        port = 443;
      } else {
        port = 80;
      }
    } catch {
      return false;
    }

    return new Promise((resolve) => {
      const socket = new net.Socket();
      let done = false;
      const finish = (ok: boolean): void => {
        if (done) {
          return;
        }
        done = true;
        socket.destroy();
        resolve(ok);
      };
      socket.setTimeout(500);
      socket.once("connect", () => finish(true));
      socket.once("timeout", () => finish(false));
      socket.once("error", () => finish(false));
      socket.connect(port, host);
    });
  }

  private getRedisNamespace(): string {
    const vaultPath = this.getVaultBasePath();
    const vaultName = path
      .basename(vaultPath)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24);
    const hash = createHash("sha1").update(vaultPath).digest("hex").slice(0, 8);
    return `${vaultName || "vault"}-${hash}`;
  }

  private getRedisIndexName(): string {
    const base = (this.settings.redisIndex || "idx:zotero").trim() || "idx:zotero";
    return `${base}:${this.getRedisNamespace()}`;
  }

  private getRedisKeyPrefix(): string {
    const base = (this.settings.redisPrefix || "zotero:chunk:").trim() || "zotero:chunk:";
    const prefix = base.endsWith(":") ? base : `${base}:`;
    return `${prefix}${this.getRedisNamespace()}:`;
  }

  private async isComposeProjectRunning(
    composeCommand: string,
    composeArgsPrefix: string[],
    composePath: string,
    project: string,
    env?: NodeJS.ProcessEnv,
    services: string[] = []
  ): Promise<boolean> {
    const servicesToCheck = services.length ? services : [""];
    for (const service of servicesToCheck) {
      const running = await new Promise<boolean>((resolve) => {
        const serviceArgs = service ? [service] : [];
        const child = spawn(
          composeCommand,
          [...composeArgsPrefix, "-p", project, "-f", composePath, "ps", "-q", ...serviceArgs],
          {
            cwd: path.dirname(composePath),
            env,
          }
        );
        let stdout = "";
        child.stdout.on("data", (data) => {
          stdout += data.toString();
        });
        child.on("error", (error) => {
          console.warn("Redis Stack status check failed", error);
          resolve(false);
        });
        child.on("close", (code) => {
          if (code !== 0) {
            resolve(false);
            return;
          }
          resolve(stdout.trim().length > 0);
        });
      });
      if (!running) {
        return false;
      }
    }
    return true;
  }

  private isContainerNameConflictError(raw: string): boolean {
    return /container name/i.test(raw) && /already in use/i.test(raw);
  }

  private extractConflictingContainerNames(raw: string): string[] {
    const names = new Set<string>();
    const regex = /container name\s+["']\/?([^"'\s]+)["']/gi;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(raw)) !== null) {
      const name = String(match[1] || "").trim().replace(/^\/+/, "");
      if (name) {
        names.add(name);
      }
    }
    return Array.from(names);
  }

  private getExpectedComposeContainerNames(project: string, services: string[]): string[] {
    const serviceSet = new Set<string>([
      ...services,
      REDIS_STACK_SERVICE,
      PYTHON_WORKER_SERVICE,
    ]);
    return Array.from(serviceSet).map((service) => `${project}-${service}-1`);
  }

  private async resolveContainerRuntimeCommandForCompose(
    context: ComposeProjectContext
  ): Promise<string | null> {
    const composeCmd = path.basename(context.composeCommand.command || "");
    if (composeCmd === "podman-compose") {
      const explicit = String(context.composeEnv.PODMAN_BIN || "").trim();
      if (explicit) {
        return explicit;
      }
      return this.resolvePodmanBin();
    }
    return context.composeCommand.command || null;
  }

  private async recoverFromContainerNameConflict(
    error: unknown,
    context: ComposeProjectContext,
    services: string[]
  ): Promise<boolean> {
    const raw = error instanceof Error ? error.message : (typeof error === "string" ? error : "");
    if (!this.isContainerNameConflictError(raw)) {
      return false;
    }
    const expected = this.getExpectedComposeContainerNames(context.project, services);
    const discovered = this.extractConflictingContainerNames(raw);
    const prefixed = `${context.project}-`;
    const containerNames = Array.from(new Set([...expected, ...discovered]))
      .map((name) => name.replace(/^\/+/, "").trim())
      .filter((name) => name.startsWith(prefixed));
    if (!containerNames.length) {
      return false;
    }
    const runtimeCommand = await this.resolveContainerRuntimeCommandForCompose(context);
    if (!runtimeCommand) {
      return false;
    }
    console.warn("Recovering from stale container name conflict", {
      project: context.project,
      containers: containerNames,
    });
    for (const name of containerNames) {
      try {
        await this.runCommand(runtimeCommand, ["rm", "-f", name], {
          cwd: path.dirname(context.composePath),
          env: context.composeEnv,
        });
      } catch (cleanupError) {
        console.warn("Failed to remove stale container during conflict recovery", {
          name,
          cleanupError,
        });
      }
    }
    return true;
  }

  async startRedisStack(silent?: boolean): Promise<void> {
    try {
      await this.ensureBundledTools();
      const composePath = this.getDockerComposePath();
      const dataDir = this.getRedisDataDir();
      const workerCacheDir = this.getPythonWorkerCacheDir();
      await fs.mkdir(dataDir, { recursive: true });
      await fs.mkdir(workerCacheDir, { recursive: true });
      const dockerPath = await this.resolveDockerPath();
      const configuredRaw = this.settings.dockerPath?.trim() || "docker";
      const configured = this.resolveUserPath(configuredRaw);
      const isGeneric =
        configuredRaw === "docker" ||
        configuredRaw === "podman" ||
        configuredRaw === "podman-compose";
      const configuredAvailable = await this.isContainerCliAvailable(configured);
      const shouldAutoSet = !configuredAvailable && !isGeneric;
      if (shouldAutoSet && dockerPath && dockerPath !== configuredRaw) {
        this.settings.dockerPath = dockerPath;
        await this.saveSettings();
        if (!silent) {
          new Notice(`Docker/Podman path set to ${dockerPath}.`);
        }
      }
      if (!(await this.isContainerCliAvailable(dockerPath))) {
        if (!silent) {
          new Notice(
            'Docker or podman not found. Install docker desktop or podman and set "docker/podman path" in settings.'
          );
        }
        return;
      }
      if (!(await this.isContainerDaemonRunning(dockerPath))) {
        if (!silent) {
          new Notice(this.getContainerDaemonHint(dockerPath));
        }
        return;
      }
      const composeCommand = await this.resolveComposeCommand(dockerPath);
      if (!composeCommand) {
        if (!silent) {
          new Notice(
            "Compose support not found. Install docker desktop or podman with podman-compose."
          );
        }
        return;
      }
      const requestedPort = this.getRedisPortFromUrl();
      const composeEnv = await this.buildComposeEnvironment(dockerPath, composeCommand, {
        dataDir,
        redisPort: requestedPort,
      });
      const project = this.getDockerProjectName();
      const composeContext: ComposeProjectContext = {
        composePath,
        composeCommand,
        composeEnv,
        project,
      };
      const requiredServices = this.getComposeServiceNamesForCurrentRuntime();
      if (
        await this.isComposeProjectRunning(
          composeCommand.command,
          composeCommand.argsPrefix,
          composePath,
          project,
          composeEnv,
          requiredServices
        )
      ) {
        if (!silent) {
          new Notice(
            this.usePythonWorker()
              ? "Redis Stack and Python worker already running for this vault."
              : "Redis Stack already running for this vault."
          );
        }
        return;
      }

      const redisHost = this.getRedisHostFromUrl();
      const portCheckHost = this.getPortCheckHost(redisHost);
      const autoAssign = this.settings.autoAssignRedisPort && this.isLocalRedisHost(redisHost);
      let redisUrl = this.settings.redisUrl;
      let redisPort = requestedPort;
      const notifySharedRedisHint = (): void => {
        if (silent) {
          return;
        }
        if (!this.settings.autoAssignRedisPort) {
          new Notice(
            "Redis already running. If you share redis across vaults, disable auto-start redis in this vault."
          );
          return;
        }
        new Notice(`Redis already running at ${redisUrl}.`);
      };

      if (autoAssign) {
        const preferredPort =
          requestedPort === 6379 ? this.getVaultPreferredRedisPort() : requestedPort;
        const availablePort = await this.findAvailablePort(portCheckHost, preferredPort);
        if (!availablePort) {
          throw new Error(`No available Redis port found starting at ${preferredPort}.`);
        }
        if (availablePort !== requestedPort) {
          redisPort = availablePort;
          redisUrl = this.updateRedisUrlPort(redisUrl, redisPort);
          this.settings.redisUrl = redisUrl;
          await this.saveSettings();
          if (!silent) {
            new Notice(`Using Redis port ${redisPort} for this vault.`);
          }
        }
      } else {
        if (this.isLocalRedisHost(redisHost)) {
          const portFree = await this.isPortFree(portCheckHost, redisPort);
          if (!portFree) {
            if (await this.isRedisReachable(redisUrl)) {
              notifySharedRedisHint();
              if (this.usePythonWorker()) {
                await this.maybeShowFirstContainerStartupNotice(silent);
                await this.startPythonWorkerService(composeContext);
              }
            } else if (!silent) {
              new Notice(
                `Port ${redisPort} is already in use and Redis is not reachable at ${redisUrl}. ` +
                  "Update the Redis URL or enable auto-assign."
              );
            }
            return;
          }
        }
        if (await this.isRedisReachable(redisUrl)) {
          notifySharedRedisHint();
          if (this.usePythonWorker()) {
            await this.maybeShowFirstContainerStartupNotice(silent);
            await this.startPythonWorkerService(composeContext);
          }
          return;
        }
      }
      composeEnv.ZRR_PORT = String(redisPort);
      try {
        await this.runCommand(
          composeCommand.command,
          [...composeCommand.argsPrefix, "-p", project, "-f", composePath, "down"],
          { cwd: path.dirname(composePath), env: composeEnv }
        );
      } catch (error) {
        console.warn("Redis Stack stop before restart failed", error);
      }
      const upArgs = [...composeCommand.argsPrefix, "-p", project, "-f", composePath, "up", "-d"];
      if (this.usePythonWorker()) {
        upArgs.push("--build");
      }
      upArgs.push(...requiredServices);
      await this.maybeShowFirstContainerStartupNotice(silent);
      try {
        await this.runCommand(composeCommand.command, upArgs, {
          cwd: path.dirname(composePath),
          env: composeEnv,
        });
      } catch (error) {
        const recovered = await this.recoverFromContainerNameConflict(
          error,
          composeContext,
          requiredServices
        );
        if (!recovered) {
          throw error;
        }
        console.debug("Retrying Redis stack startup after container conflict recovery.");
        await this.runCommand(composeCommand.command, upArgs, {
          cwd: path.dirname(composePath),
          env: composeEnv,
        });
      }
      if (!silent) {
        new Notice("Redis stack started.");
      }
    } catch (error) {
      if (!silent) {
        new Notice("Failed to start redis stack. Check docker/podman and file sharing.");
      }
      console.error("Failed to start Redis Stack", error);
    }
  }

  private async waitForPythonWorkerReady(
    context: ComposeProjectContext,
    timeoutMs = 15 * 60 * 1000
  ): Promise<void> {
    const startedAt = Date.now();
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    while (Date.now() - startedAt < timeoutMs) {
      if (await this.isPythonWorkerApiHealthy(context)) {
        return;
      }
      await delay(2000);
    }
    throw new Error(
      "Python worker is still starting. Check compose logs for the python-worker service."
    );
  }

  private async startPythonWorkerService(context?: ComposeProjectContext): Promise<void> {
    const resolved =
      context ??
      (await this.resolveComposeProjectContext({
        dataDir: this.getRedisDataDir(),
        redisPort: this.getRedisPortFromUrl(),
      }));
    const upArgs = [
      ...resolved.composeCommand.argsPrefix,
      "-p",
      resolved.project,
      "-f",
      resolved.composePath,
      "up",
      "-d",
      "--build",
      PYTHON_WORKER_SERVICE,
    ];
    await this.runCommand(resolved.composeCommand.command, upArgs, {
      cwd: path.dirname(resolved.composePath),
      env: resolved.composeEnv,
    });
  }

  private async ensureWorkerRedisService(
    context: ComposeProjectContext,
    startIfStopped: boolean
  ): Promise<void> {
    if (!this.settings.autoStartRedis) {
      return;
    }
    if (!this.isLocalRedisHost(this.getRedisHostFromUrl())) {
      return;
    }
    const isRunning = await this.isComposeProjectRunning(
      context.composeCommand.command,
      context.composeCommand.argsPrefix,
      context.composePath,
      context.project,
      context.composeEnv,
      [REDIS_STACK_SERVICE]
    );
    if (!isRunning && startIfStopped) {
      const upArgs = [
        ...context.composeCommand.argsPrefix,
        "-p",
        context.project,
        "-f",
        context.composePath,
        "up",
        "-d",
        REDIS_STACK_SERVICE,
      ];
      await this.runCommand(context.composeCommand.command, upArgs, {
        cwd: path.dirname(context.composePath),
        env: context.composeEnv,
      });
    }
    const confirmed = await this.isComposeProjectRunning(
      context.composeCommand.command,
      context.composeCommand.argsPrefix,
      context.composePath,
      context.project,
      context.composeEnv,
      [REDIS_STACK_SERVICE]
    );
    if (!confirmed) {
      throw new Error(
        "Redis service is not running. Start Redis stack now or enable Auto-start Redis stack."
      );
    }
  }

  private async ensurePythonWorkerContext(startIfStopped: boolean): Promise<ComposeProjectContext> {
    const dataDir = this.getRedisDataDir();
    await fs.mkdir(dataDir, { recursive: true });
    await fs.mkdir(this.getPythonWorkerCacheDir(), { recursive: true });
    let context = await this.resolveComposeProjectContext({
      dataDir,
      redisPort: this.getRedisPortFromUrl(),
    });
    const services = [PYTHON_WORKER_SERVICE];
    const running = await this.isComposeProjectRunning(
      context.composeCommand.command,
      context.composeCommand.argsPrefix,
      context.composePath,
      context.project,
      context.composeEnv,
      services
    );
    if (!running && startIfStopped) {
      await this.startPythonWorkerService(context);
      context = await this.resolveComposeProjectContext({
        dataDir,
        redisPort: this.getRedisPortFromUrl(),
      });
    }
    const confirmed = await this.isComposeProjectRunning(
      context.composeCommand.command,
      context.composeCommand.argsPrefix,
      context.composePath,
      context.project,
      context.composeEnv,
      services
    );
    if (!confirmed) {
      throw new Error(
        "Python worker is not running. Start Redis stack now or enable Auto-start Redis stack."
      );
    }
    await this.ensureWorkerRedisService(context, startIfStopped);
    await this.waitForPythonWorkerReady(context);
    return context;
  }

  async setupPythonEnv(): Promise<void> {
    if (this.usePythonWorker()) {
      try {
        new Notice("Setting up python worker environment...");
        this.showStatusProgress("Setting up Python worker environment...", null);
        await this.ensurePythonWorkerContext(true);
        this.clearStatusProgress();
        new Notice("Python worker environment ready.");
      } catch (error) {
        this.clearStatusProgress();
        new Notice("Failed to set up python worker environment. See console for details.");
        console.error("Python worker setup failed", error);
      }
      return;
    }

    const pluginDir = this.getPluginDir();
    const venvDir = this.getPythonVenvDir();
    const venvPython = this.getVenvPythonPath(venvDir);
    await this.ensureBundledTools();
    const requirementsPath = this.resolveRequirementsPath(pluginDir);
    if (!requirementsPath) {
      throw new Error(`requirements.txt not found in ${pluginDir}`);
    }

    try {
      new Notice("Setting up python environment...");
      this.showStatusProgress("Setting up Python environment...", null);
      console.debug(`Python env: using plugin dir ${pluginDir}`);
      console.debug(`Python env: venv path ${venvDir}`);
      await fs.mkdir(path.dirname(venvDir), { recursive: true });

      let bootstrap: { command: string; args: string[] } | null = null;
      const ensureBootstrap = async (): Promise<{ command: string; args: string[] }> => {
        if (!bootstrap) {
          bootstrap = await this.resolveBootstrapPython();
        }
        return bootstrap;
      };

      if (existsSync(venvPython)) {
        const venvVersion = await this.getPythonVersion(venvPython, []);
        if (venvVersion && this.isUnsupportedPythonVersion(venvVersion)) {
          const resolved = await ensureBootstrap();
          console.debug(
            `Python env: existing venv uses Python ${venvVersion.major}.${venvVersion.minor}; rebuilding with ${resolved.command} ${resolved.args.join(
              " "
            )}`
          );
          this.showStatusProgress("Rebuilding Python environment...", null);
          await fs.rm(venvDir, { recursive: true, force: true });
        }
      }

      if (!existsSync(venvPython)) {
        const resolved = await ensureBootstrap();
        console.debug(`Python env: creating venv with ${resolved.command} ${resolved.args.join(" ")}`);
        await this.runCommand(resolved.command, [...resolved.args, "-m", "venv", venvDir], {
          cwd: pluginDir,
        });
      }

      await this.runCommandStreaming(
        venvPython,
        ["-m", "pip", "install", "-r", requirementsPath],
        { cwd: pluginDir },
        (line) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return;
          }
          const collecting = trimmed.match(/^Collecting\s+([^\s]+)/);
          if (collecting) {
            this.showStatusProgress(`Installing ${collecting[1]}...`, null);
            return;
          }
          if (trimmed.startsWith("Installing collected packages")) {
            this.showStatusProgress("Installing packages...", null);
            return;
          }
          if (trimmed.startsWith("Successfully installed")) {
            this.showStatusProgress("Python environment ready.", 100);
          }
        }
      );

      this.settings.pythonPath = venvPython;
      await this.saveSettings();
      this.clearStatusProgress();
      new Notice("Python environment ready.");
    } catch (error) {
      this.clearStatusProgress();
      new Notice("Failed to set up python environment. See console for details.");
      console.error("Python env setup failed", error);
    }
  }

  async detectOcrEngines(): Promise<OcrEngineAvailability> {
    if (this.usePythonWorker()) {
      return {
        tesseract: true,
        paddleStructureLocal: true,
        paddleVlLocal: true,
      };
    }
    const tesseractAvailable = await this.canRunCommand("tesseract", []);
    let pythonCommand = this.resolvePythonPath();
    let pythonArgs: string[] = [];
    if (!pythonCommand) {
      try {
        const resolved = await this.resolveBootstrapPython();
        pythonCommand = resolved.command;
        pythonArgs = resolved.args;
      } catch {
        return {
          tesseract: tesseractAvailable,
          paddleStructureLocal: false,
          paddleVlLocal: false,
        };
      }
    }

    const script = [
      "import importlib.util, json",
      "def has_module(name):",
      "    return importlib.util.find_spec(name) is not None",
      "has_paddle = has_module('paddle')",
      "has_paddleocr = has_module('paddleocr')",
      "has_paddlex = has_module('paddlex')",
      "has_vl = False",
      "if has_paddleocr:",
      "    try:",
      "        from paddleocr import PaddleOCRVL",
      "        has_vl = True",
      "    except Exception:",
      "        has_vl = False",
      "print(json.dumps({'paddle': has_paddle, 'paddleocr': has_paddleocr, 'paddlex': has_paddlex, 'paddle_vl': has_vl}))",
    ].join("\n");

    const pythonStatus = await new Promise<{ ok: boolean; data?: unknown }>((resolve) => {
      const child = spawn(pythonCommand, [...pythonArgs, "-c", script], {
        env: this.buildPythonEnv(),
      });
      let stdout = "";
      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });
      child.on("error", () => resolve({ ok: false }));
      child.on("close", (code) => {
        if (code !== 0) {
          resolve({ ok: false });
          return;
        }
        try {
          const parsed = JSON.parse(stdout.trim());
          resolve({ ok: true, data: parsed });
        } catch {
          resolve({ ok: false });
        }
      });
    });

    if (!pythonStatus.ok || !pythonStatus.data) {
      return {
        tesseract: tesseractAvailable,
        paddleStructureLocal: false,
        paddleVlLocal: false,
      };
    }
    const info = pythonStatus.data as {
      paddle?: boolean;
      paddleocr?: boolean;
      paddlex?: boolean;
      paddle_vl?: boolean;
    };
    const hasPaddle = Boolean(info.paddle);
    const hasPaddleOcr = Boolean(info.paddleocr);
    return {
      tesseract: tesseractAvailable,
      paddleStructureLocal: hasPaddle && hasPaddleOcr && Boolean(info.paddlex),
      paddleVlLocal: hasPaddle && hasPaddleOcr && Boolean(info.paddle_vl),
    };
  }

  private getSharedPythonEnvRoot(): string {
    const home = os.homedir();
    if (process.platform === "win32") {
      const base =
        process.env.LOCALAPPDATA || process.env.APPDATA || path.join(home, "AppData", "Local");
      return path.join(base, "zotero-redisearch-rag");
    }
    const base = process.env.XDG_CACHE_HOME || path.join(home, ".cache");
    return path.join(base, "zotero-redisearch-rag");
  }

  private getPythonVenvDir(): string {
    if (this.settings.pythonEnvLocation === "plugin") {
      return path.join(this.getPluginDir(), ".venv");
    }
    return path.join(this.getSharedPythonEnvRoot(), "venv");
  }

  private getVenvPythonPath(venvDir: string): string {
    if (process.platform === "win32") {
      return path.join(venvDir, "Scripts", "python.exe");
    }
    return path.join(venvDir, "bin", "python");
  }

  private resolveRequirementsPath(pluginDir: string): string | null {
    const candidates = [
      path.join(pluginDir, "requirements.txt"),
      path.join(pluginDir, "tools", "requirements.txt"),
    ];
    return candidates.find((candidate) => existsSync(candidate)) ?? null;
  }

  private async resolveBootstrapPython(): Promise<{ command: string; args: string[] }> {
    const configuredRaw = (this.settings.pythonPath || "").trim();
    const configured = this.expandPathValue(configuredRaw);
    if (configured && (await this.canRunCommand(configured, []))) {
      const version = await this.getPythonVersion(configured, []);
      if (version && this.isUnsupportedPythonVersion(version)) {
        throw new Error(
          `Configured Python ${version.major}.${version.minor} is not supported. Install Python 3.11–3.13 and update the Python path.`
        );
      }
      return { command: configured, args: [] };
    }

    const candidates =
      process.platform === "win32"
        ? [
            { command: "py", args: ["-3.13"] },
            { command: "py", args: ["-3.12"] },
            { command: "py", args: ["-3.11"] },
            { command: "py", args: ["-3.10"] },
            { command: "py", args: ["-3"] },
            { command: "python", args: [] },
          ]
        : [
            { command: "python3.13", args: [] },
            { command: "python3.12", args: [] },
            { command: "python3.11", args: [] },
            { command: "python3.10", args: [] },
            { command: "python3", args: [] },
            { command: "python", args: [] },
          ];

    for (const candidate of candidates) {
      if (await this.canRunCommand(candidate.command, candidate.args)) {
        const version = await this.getPythonVersion(candidate.command, candidate.args);
        if (version && this.isUnsupportedPythonVersion(version)) {
          console.debug(
            `Python env: skipping ${candidate.command} ${candidate.args.join(" ")} (Python ${version.major}.${version.minor} unsupported)`
          );
          continue;
        }
        return candidate;
      }
    }

    throw new Error("No usable Python 3.11–3.13 interpreter found on PATH.");
  }

  private isUnsupportedPythonVersion(version: { major: number; minor: number }): boolean {
    return version.major > 3 || (version.major === 3 && version.minor >= 14);
  }

  private async getPythonVersion(
    command: string,
    args: string[]
  ): Promise<{ major: number; minor: number } | null> {
    return new Promise((resolve) => {
      const child = spawn(command, [
        ...args,
        "-c",
        "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')",
      ]);
      let stdout = "";
      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });
      child.on("error", () => resolve(null));
      child.on("close", (code) => {
        if (code !== 0) {
          resolve(null);
          return;
        }
        const match = stdout.trim().match(/(\d+)\.(\d+)/);
        if (!match) {
          resolve(null);
          return;
        }
        resolve({ major: Number(match[1]), minor: Number(match[2]) });
      });
    });
  }

  private async canRunCommand(command: string, args: string[]): Promise<boolean> {
    return new Promise((resolve) => {
      const child = spawn(command, [...args, "--version"], {
        env: this.buildPythonEnv(),
      });
      child.on("error", () => resolve(false));
      child.on("close", (code) => resolve(code === 0));
    });
  }

  private buildPythonEnv(): NodeJS.ProcessEnv {
    const env = { ...process.env };
    const sep = path.delimiter;
    const current = env.PATH || "";
    const extras = process.platform === "win32" ? [] : ["/opt/homebrew/bin", "/usr/local/bin"];
    const merged = [...extras, current].filter(Boolean).join(sep);
    env.PATH = merged;
    if (!env.PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK) {
      env.PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK = "True";
    }
    if (!env.DISABLE_MODEL_SOURCE_CHECK) {
      env.DISABLE_MODEL_SOURCE_CHECK = "True";
    }
    return env;
  }

  private getLocalPythonInvocation(
    scriptPath: string,
    args: string[]
  ): { command: string; args: string[]; cwd: string; env: NodeJS.ProcessEnv } {
    const pythonPath = this.resolvePythonPath();
    return {
      command: pythonPath,
      args: [scriptPath, ...args],
      cwd: path.dirname(scriptPath),
      env: this.buildPythonEnv(),
    };
  }

  private async runPython(scriptPath: string, args: string[]): Promise<void> {
    if (this.usePythonWorker()) {
      const workerToolName = this.getWorkerToolName(scriptPath);
      if (!workerToolName) {
        throw new Error(
          `Python worker can only run bundled tools under '${path.join(this.getPluginDir(), "tools")}'.`
        );
      }
      await this.runPythonToolWithOutputViaWorkerApi(
        workerToolName,
        args,
        this.settings.autoStartRedis
      );
      return;
    }

    const invocation = this.getLocalPythonInvocation(scriptPath, args);
    return new Promise((resolve, reject) => {
      const child = spawn(invocation.command, invocation.args, {
        cwd: invocation.cwd,
        env: invocation.env,
      });

      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });
      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("error", (error) => {
        this.handlePythonProcessError(String(error));
        reject(error);
      });

      child.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          const diagnostic = stderr.trim() ? stderr : stdout;
          this.handlePythonProcessError(diagnostic);
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
        env: options?.env ?? this.buildPythonEnv(),
      });

      let stderr = "";
      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("error", (error) => {
        reject(error);
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

  private async runPythonStreaming(
    scriptPath: string,
    args: string[],
    onPayload: (payload: unknown) => void,
    onFallbackFinal: (payload: unknown) => void,
    stderrLogPath?: string | null,
    stderrLogLabel = "docling_extract",
    onSpawn?: (child: ChildProcess) => void,
    timeoutSec?: number
  ): Promise<void> {
    if (this.usePythonWorker()) {
      const workerToolName = this.getWorkerToolName(scriptPath);
      if (!workerToolName) {
        throw new Error(
          `Python worker can only run bundled tools under '${path.join(this.getPluginDir(), "tools")}'.`
        );
      }
      await this.runPythonStreamingViaWorkerApi(
        workerToolName,
        args,
        onPayload,
        onFallbackFinal,
        stderrLogPath,
        stderrLogLabel,
        this.settings.autoStartRedis,
        onSpawn,
        timeoutSec
      );
      return;
    }

    const invocation = this.getLocalPythonInvocation(scriptPath, args);
    return new Promise((resolve, reject) => {
      const child = spawn(invocation.command, invocation.args, {
        cwd: invocation.cwd,
        env: invocation.env,
      });
      if (onSpawn) {
        onSpawn(child);
      }

      let stdoutBuffer = "";
      let stderr = "";
      let diagnostic = "";
      let lastPayload: unknown = null;
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
          diagnostic += `${line}\n`;
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

      child.on("error", (error) => {
        this.handlePythonProcessError(String(error));
        reject(error);
      });

      child.on("close", (code) => {
        if (stdoutBuffer.trim()) {
          handleLine(stdoutBuffer);
        }
        if (!sawFinal && lastPayload) {
          onFallbackFinal(lastPayload);
        }
        if (stderrLogPath) {
          void this.appendToLogFile(stderrLogPath, stderr, stderrLogLabel, "STDERR");
        }
        if (code === 0) {
          resolve();
        } else {
          const diagnosticText = stderr.trim() ? stderr : diagnostic;
          this.handlePythonProcessError(diagnosticText);
          reject(new Error(stderr || `Process exited with code ${code}`));
        }
      });
    });
  }

  private runCommandStreaming(
    command: string,
    args: string[],
    options: { cwd?: string; env?: NodeJS.ProcessEnv },
    onLine: (line: string) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: options?.cwd,
        env: options?.env ?? this.buildPythonEnv(),
      });

      const handleChunk = (chunk: Buffer): void => {
        const text = chunk.toString();
        text.split(/\r?\n/).forEach((line) => {
          if (line.trim()) {
            onLine(line);
          }
        });
      };

      let stderr = "";
      child.stdout.on("data", handleChunk);
      child.stderr.on("data", (data) => {
        stderr += data.toString();
        handleChunk(data);
      });

      child.on("error", (error) => {
        reject(error);
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

  private async requestPythonWorkerCancel(
    parsedUrl: URL,
    requestId: string,
    timeoutMs = 2000
  ): Promise<void> {
    const cancelUrl = `${parsedUrl.protocol}//${parsedUrl.host}/cancel`;
    try {
      await this.requestLocalApiRaw(cancelUrl, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-ZRR-Request-Id": requestId,
        },
        body: JSON.stringify({ request_id: requestId }),
        timeoutMs,
      });
      this.logPythonWorkerTiming("cancel-request", { requestId, cancelUrl });
    } catch (error) {
      this.logPythonWorkerTiming("cancel-request-error", {
        requestId,
        cancelUrl,
        error: String(error),
      });
    }
  }

  private async runPythonStreamingViaWorkerApi(
    toolName: string,
    args: string[],
    onPayload: (payload: unknown) => void,
    onFallbackFinal: (payload: unknown) => void,
    stderrLogPath?: string | null,
    stderrLogLabel = "docling_extract",
    startIfStopped = true,
    onSpawn?: (child: ChildProcess) => void,
    timeoutSec?: number
  ): Promise<void> {
    const requestId = this.nextPythonWorkerRequestId(toolName);
    const startedAt = Date.now();
    const context = await this.ensurePythonWorkerContext(startIfStopped);
    const contextReadyAt = Date.now();
    const mappedArgs = this.mapPythonArgsForWorker(args);
    const url = `${this.getPythonWorkerApiBaseUrl(this.getPythonWorkerApiPortFromContext(context))}/run-stream`;
    const parsed = new URL(url);
    const effectiveTimeoutSec = Number.isFinite(timeoutSec ?? NaN)
      ? Math.max(1, Math.trunc(Number(timeoutSec)))
      : 600;
    const body = JSON.stringify({
      tool: toolName,
      args: mappedArgs,
      timeout_sec: effectiveTimeoutSec,
    });
    this.logPythonWorkerTiming("stream-start", {
      requestId,
      tool: toolName,
      argsCount: mappedArgs.length,
      ensureContextMs: contextReadyAt - startedAt,
      port: this.getPythonWorkerApiPortFromContext(context),
      timeoutSec: effectiveTimeoutSec,
    });

    return new Promise((resolve, reject) => {
      let ndjsonBuffer = "";
      let diagnostic = "";
      let lastPayload: unknown = null;
      let sawFinal = false;
      let doneEvent: unknown = null;
      let toolTimingLogged = false;
      let responseOpenedAt: number | null = null;
      let firstStdoutEventAt: number | null = null;
      let stdoutEvents = 0;

      let requestKilled = false;
      const markRequestKilled = (): void => {
        requestKilled = true;
      };

      const request = http.request(
        {
          method: "POST",
          hostname: parsed.hostname,
          port: parsed.port || undefined,
          path: `${parsed.pathname}${parsed.search}`,
          headers: {
            Accept: "application/x-ndjson",
            "Content-Type": "application/json",
            "Content-Length": String(Buffer.byteLength(body)),
            "X-ZRR-Request-Id": requestId,
          },
        },
        (response) => {
          responseOpenedAt = Date.now();
          const handleToolLine = (line: string): void => {
            if (!line.trim()) {
              return;
            }
            try {
              const payload = JSON.parse(line);
              lastPayload = payload;
              if (payload?.type === "final" || payload?.answer) {
                sawFinal = true;
                if (!toolTimingLogged && payload?.timing && typeof payload.timing === "object") {
                  toolTimingLogged = true;
                  this.logPythonWorkerTiming("stream-tool-timing", {
                    requestId,
                    tool: toolName,
                    timing: payload.timing,
                  });
                }
              }
              onPayload(payload);
            } catch {
              diagnostic += `${line}\n`;
            }
          };

          const handleEventLine = (line: string): void => {
            if (!line.trim()) {
              return;
            }
            try {
              const event = JSON.parse(line);
              if (event?.type === "stdout") {
                stdoutEvents += 1;
                if (firstStdoutEventAt === null) {
                  firstStdoutEventAt = Date.now();
                }
                handleToolLine(String(event.line ?? ""));
                return;
              }
              if (event?.type === "done") {
                doneEvent = event;
                return;
              }
              diagnostic += `${line}\n`;
            } catch {
              diagnostic += `${line}\n`;
            }
          };

          if ((response.statusCode ?? 0) >= 400) {
            const chunks: Buffer[] = [];
            response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
            response.on("end", () => {
              markRequestKilled();
              const details = Buffer.concat(chunks).toString("utf8");
              this.logPythonWorkerTiming("stream-http-error", {
                requestId,
                tool: toolName,
                statusCode: response.statusCode ?? 0,
                durationMs: Date.now() - startedAt,
              });
              reject(
                new Error(
                  `Python worker API request failed (${response.statusCode}): ${details || "no response body"}`
                )
              );
            });
            return;
          }

          response.on("data", (chunk) => {
            ndjsonBuffer += chunk.toString();
            const lines = ndjsonBuffer.split(/\r?\n/);
            ndjsonBuffer = lines.pop() ?? "";
            for (const line of lines) {
              handleEventLine(line);
            }
          });

          response.on("end", () => {
            markRequestKilled();
            if (ndjsonBuffer.trim()) {
              handleEventLine(ndjsonBuffer);
            }

            const doneRecord = this.asRecord(doneEvent);
            const stderr = typeof doneRecord?.stderr === "string" ? doneRecord.stderr : "";
            const doneError = typeof doneRecord?.error === "string" ? doneRecord.error.trim() : "";
            const exitCode = typeof doneRecord?.exit_code === "number"
              ? doneRecord.exit_code
              : Number.parseInt(typeof doneRecord?.exit_code === "string" ? doneRecord.exit_code : "1", 10);
            if (!sawFinal && lastPayload) {
              onFallbackFinal(lastPayload);
            }
            if (stderrLogPath && stderr) {
              void this.appendToLogFile(stderrLogPath, stderr, stderrLogLabel, "STDERR");
            }
            this.logPythonWorkerTiming("stream-done", {
              requestId,
              tool: toolName,
              exitCode: Number.isFinite(exitCode) ? exitCode : 1,
              totalMs: Date.now() - startedAt,
              responseOpenMs: responseOpenedAt ? responseOpenedAt - startedAt : null,
              firstStdoutMs: firstStdoutEventAt ? firstStdoutEventAt - startedAt : null,
              stdoutEvents,
              stderrBytes: stderr.length,
              doneError,
            });
            if (Number.isFinite(exitCode) && exitCode === 0) {
              resolve();
              return;
            }
            if (/^(canceled|cancelled|client_disconnected)$/i.test(doneError)) {
              reject(new Error(`Python worker request canceled: ${doneError}`));
              return;
            }
            const diagnosticText = stderr.trim() ? stderr : doneError || diagnostic;
            this.handlePythonProcessError(diagnosticText);
            reject(
              new Error(
                stderr ||
                  doneError ||
                  `Process exited with code ${Number.isFinite(exitCode) ? exitCode : 1}`
              )
            );
          });
        }
      );

      const abortHandle = {
        get killed(): boolean {
          return requestKilled;
        },
        kill: (_signal?: NodeJS.Signals | number): boolean => {
          if (requestKilled) {
            return false;
          }
          markRequestKilled();
          void this.requestPythonWorkerCancel(parsed, requestId);
          request.destroy(new Error("Python worker request aborted"));
          return true;
        },
      } as unknown as ChildProcess;

      if (onSpawn) {
        onSpawn(abortHandle);
      }

      request.setTimeout((effectiveTimeoutSec + 30) * 1000, () => {
        request.destroy(new Error("Python worker streaming request timed out"));
      });
      const requestEmitter = request as unknown as NodeJS.EventEmitter;
      requestEmitter.on("error", (error) => {
        markRequestKilled();
        const errorText = error instanceof Error ? error.message : (typeof error === "string" ? error : "");
        this.logPythonWorkerTiming("stream-request-error", {
          requestId,
          tool: toolName,
          durationMs: Date.now() - startedAt,
          error: errorText,
        });
        this.handlePythonProcessError(errorText);
        const requestError = error instanceof Error
          ? error
          : new Error(errorText || "Python worker streaming request failed");
        reject(requestError);
      });
      request.write(body);
      request.end();
    });
  }

  private handlePythonProcessError(raw: string): void {
    if (!raw) {
      return;
    }
    if (/Python worker cannot access path/i.test(raw)) {
      this.notifyContainerOnce(raw.replace(/^Error:\s*/i, ""));
      return;
    }
    if (/python-worker/i.test(raw) && /(No such service|is not running|not found|no container)/i.test(raw)) {
      this.notifyContainerOnce(
        "Python worker is not running. Start Redis stack now or enable Auto-start Redis stack."
      );
      return;
    }
    if (/Cannot connect to the Docker daemon|docker desktop is not running|podman machine/i.test(raw)) {
      this.notifyContainerOnce("Container runtime is not available. Start Docker Desktop or Podman.");
      return;
    }
    if (/Python worker API request failed|Python worker streaming request timed out|ECONNREFUSED 127\.0\.0\.1/i.test(raw)) {
      this.notifyContainerOnce(
        "Python worker API is not reachable. Start Redis stack now or check python-worker container logs."
      );
      return;
    }
    const missingModule = raw.match(/ModuleNotFoundError:\s+No module named ['"]([^'"]+)['"]/);
    if (missingModule) {
      const notice = this.usePythonWorker()
        ? `Python worker missing module '${missingModule[1]}'. Restart Redis stack to rebuild worker env.`
        : `Python env missing module '${missingModule[1]}'. Open Settings > Python environment > Create/Update.`;
      this.notifyPythonEnvOnce(notice, true);
      return;
    }
    if (/No module named ['"]|ImportError: No module named/i.test(raw)) {
      const notice = this.usePythonWorker()
        ? "Python worker missing required modules. Restart Redis stack to rebuild worker env."
        : "Python env missing required modules. Open Settings > Python environment > Create/Update.";
      this.notifyPythonEnvOnce(notice, true);
      return;
    }
    if (/ENOENT|No such file or directory|not found|command not found|spawn .* ENOENT/i.test(raw)) {
      const notice = this.usePythonWorker()
        ? "Python worker command failed. Start Redis stack and check container logs."
        : "Python not found. Configure the Python path or use Settings > Python environment > Create/Update.";
      this.notifyPythonEnvOnce(notice, true);
    }
  }

  private notifyPythonEnvOnce(message: string, openSettings = false): void {
    if (this.lastPythonEnvNotice === message) {
      return;
    }
    this.lastPythonEnvNotice = message;
    new Notice(message);
    if (openSettings) {
      this.openPluginSettings();
    }
  }

  private notifyContainerOnce(message: string): void {
    if (this.lastContainerNotice === message) {
      return;
    }
    this.lastContainerNotice = message;
    new Notice(message);
  }

  private notifyRedisOnce(message: string): void {
    if (this.lastRedisNotice === message) {
      return;
    }
    this.lastRedisNotice = message;
    new Notice(message);
  }

  private async autoDetectRedisOnLoad(): Promise<void> {
    if (this.settings.autoStartRedis) {
      return;
    }
    const current = (this.settings.redisUrl || "").trim();
    const defaultUrl = "redis://127.0.0.1:6379";
    const candidate = current || defaultUrl;
    const result = await this.checkRedisConnectionWithUrl(candidate, 500);
    if (!result.ok) {
      return;
    }
    if (!current) {
      this.settings.redisUrl = candidate;
      await this.saveSettings();
    }
    this.notifyRedisOnce(`Redis detected at ${candidate}. This instance will be used.`);
  }

  private notifyZoteroApiOnce(message: string): void {
    if (this.lastZoteroApiNotice === message) {
      return;
    }
    this.lastZoteroApiNotice = message;
    new Notice(message);
  }

  private async warnIfZoteroLocalApiUnavailable(context: string): Promise<boolean> {
    const reachable = await this.isZoteroLocalApiReachable();
    if (reachable) {
      this.lastZoteroApiNotice = null;
      return true;
    }
    const label = context ? `${context}` : "this action";
    const message = `Zotero Local API is not reachable for ${label}. Start Zotero or update the Local API URL in settings.`;
    this.notifyZoteroApiOnce(message);
    return false;
  }

  private openPluginSettings(): void {
    const settings = this.app as typeof this.app & {
      setting?: {
        open?: () => void;
        openTabById?: (id: string) => void;
      };
    };
    if (settings.setting?.open) {
      settings.setting.open();
    }
    if (settings.setting?.openTabById) {
      settings.setting.openTabById(this.manifest.id);
    }
  }

  // Logging helpers
  private getLogsDirRelative(): string {
    return normalizePath(`${CACHE_ROOT}/logs`);
  }

  private getLogFileRelativePath(): string {
    const configured = (this.settings.logFilePath || "").trim();
    return normalizePath(configured || `${this.getLogsDirRelative()}/docling_extract.log`);
  }

  private getLogFileAbsolutePath(): string {
    return this.getAbsoluteVaultPath(this.getLogFileRelativePath());
  }

  private getSpellcheckerInfoRelativePath(): string {
    return normalizePath(`${this.getLogsDirRelative()}/spellchecker_info.json`);
  }

  public async openLogFile(): Promise<void> {
    const rel = this.getLogFileRelativePath();
    const adapter = this.app.vault.adapter;
    if (!(await adapter.exists(rel))) {
      new Notice("Log file not found.");
      return;
    }
    try {
      const readLog = async (): Promise<string> => {
        try {
          const content = await adapter.read(rel);
          return content || "(empty)";
        } catch {
          return "(empty)";
        }
      };
      const content = await readLog();
      new OutputModal(this.app, "Log file", content || "(empty)", {
        autoRefresh: true,
        refreshIntervalMs: 2000,
        onRefresh: readLog,
        onClear: async () => {
          await this.clearLogFile();
        },
      }).open();
    } catch (error) {
      new Notice("Failed to open log file.");
      console.error(error);
    }
  }

  public async clearLogFile(): Promise<void> {
    const rel = this.getLogFileRelativePath();
    const adapter = this.app.vault.adapter;
    try {
      const dir = normalizePath(path.dirname(rel));
      if (dir) {
        await this.ensureFolder(dir);
      }
      await adapter.write(rel, "");
      new Notice("Log file cleared.");
    } catch (error) {
      new Notice("Failed to clear log file.");
      console.error(error);
    }
  }

  private async deleteLogFileIfExists(): Promise<void> {
    const rel = this.getLogFileRelativePath();
    const adapter = this.app.vault.adapter;
    try {
      if (await adapter.exists(rel)) {
        await adapter.remove(rel);
      }
    } catch (error) {
      console.warn("Failed to delete log file before import", error);
    }
  }

  private formatLogLines(raw: string, label: string, stream: string): string {
    const lines = raw
      .split(/\r?\n/)
      .map((line) => line.trimEnd())
      .filter((line) => Boolean(line.trim()));
    if (!lines.length) {
      return "";
    }
    const timestamp = new Date().toISOString().replace("T", " ").replace(".", ",");
    return lines.map((line) => `${timestamp} ${stream} ${label}: ${line}`).join("\n") + "\n";
  }

  private async appendToLogFile(
    logFilePath: string,
    raw: string,
    label = "docling_extract",
    stream = "STDERR"
  ): Promise<void> {
    if (!raw || !raw.trim()) {
      return;
    }
    const formatted = this.formatLogLines(raw, label, stream);
    if (!formatted) {
      return;
    }
    try {
      await fs.mkdir(path.dirname(logFilePath), { recursive: true });
      await fs.appendFile(logFilePath, formatted);
    } catch (error) {
      console.warn("Failed to append stderr to log file", error);
    }
  }

  private async runPythonToolWithOutputViaWorkerApi(
    toolName: string,
    args: string[],
    startIfStopped: boolean,
    stderrLogPath?: string | null,
    stderrLogLabel = "docling_extract",
    timeoutSec?: number
  ): Promise<string> {
    if (!this.usePythonWorker()) {
      throw new Error("Worker API is only available in worker runtime mode.");
    }
    const requestId = this.nextPythonWorkerRequestId(toolName);
    const startedAt = Date.now();
    const context = await this.ensurePythonWorkerContext(startIfStopped);
    const contextReadyAt = Date.now();
    const mappedArgs = this.mapPythonArgsForWorker(args);
    const url = `${this.getPythonWorkerApiBaseUrl(this.getPythonWorkerApiPortFromContext(context))}/run`;
    const effectiveTimeoutSec = Number.isFinite(timeoutSec ?? NaN)
      ? Math.max(1, Math.trunc(Number(timeoutSec)))
      : 600;
    const body = JSON.stringify({
      tool: toolName,
      args: mappedArgs,
      timeout_sec: effectiveTimeoutSec,
    });
    const response = await this.requestLocalApiRaw(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-ZRR-Request-Id": requestId,
      },
      body,
      timeoutMs: (effectiveTimeoutSec + 30) * 1000,
    });
    if (response.statusCode < 200 || response.statusCode >= 300) {
      const details = response.body.toString("utf8");
      this.logPythonWorkerTiming("run-http-error", {
        requestId,
        tool: toolName,
        statusCode: response.statusCode,
        totalMs: Date.now() - startedAt,
        ensureContextMs: contextReadyAt - startedAt,
      });
      throw new Error(
        `Python worker API request failed (${response.statusCode}): ${details || "no response body"}`
      );
    }
    const payload = JSON.parse(response.body.toString("utf8") || "{}");
    const stdout = String(payload?.stdout ?? "");
    const stderr = String(payload?.stderr ?? "");
    if (payload?.timing && typeof payload.timing === "object") {
      this.logPythonWorkerTiming("run-tool-timing", {
        requestId,
        tool: toolName,
        timing: payload.timing,
      });
    }
    if (stderrLogPath && stderr) {
      await this.appendToLogFile(stderrLogPath, stderr, stderrLogLabel, "STDERR");
    }
    const exitCode = Number.parseInt(String(payload?.exit_code ?? 1), 10);
    this.logPythonWorkerTiming("run-done", {
      requestId,
      tool: toolName,
      exitCode: Number.isFinite(exitCode) ? exitCode : 1,
      totalMs: Date.now() - startedAt,
      ensureContextMs: contextReadyAt - startedAt,
      requestMs: Date.now() - contextReadyAt,
      stdoutBytes: stdout.length,
      stderrBytes: stderr.length,
      timeoutSec: effectiveTimeoutSec,
    });
    if (!Number.isFinite(exitCode) || exitCode !== 0) {
      const diagnostic = stderr.trim() ? stderr : stdout;
      this.handlePythonProcessError(diagnostic);
      throw new Error(stderr || `Process exited with code ${Number.isFinite(exitCode) ? exitCode : 1}`);
    }
    return stdout.trim();
  }

  private async runPythonWithOutput(
    scriptPath: string,
    args: string[],
    stderrLogPath?: string | null,
    stderrLogLabel = "docling_extract",
    timeoutSec?: number
  ): Promise<string> {
    if (this.usePythonWorker()) {
      const workerToolName = this.getWorkerToolName(scriptPath);
      if (!workerToolName) {
        throw new Error(
          `Python worker can only run bundled tools under '${path.join(this.getPluginDir(), "tools")}'.`
        );
      }
      return this.runPythonToolWithOutputViaWorkerApi(
        workerToolName,
        args,
        this.settings.autoStartRedis,
        stderrLogPath,
        stderrLogLabel,
        timeoutSec
      );
    }

    const invocation = this.getLocalPythonInvocation(scriptPath, args);
    return new Promise((resolve, reject) => {
      const child = spawn(invocation.command, invocation.args, {
        cwd: invocation.cwd,
        env: invocation.env,
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("error", (error) => {
        this.handlePythonProcessError(String(error));
        reject(error);
      });

      child.on("close", (code) => {
        if (stderrLogPath) {
          void this.appendToLogFile(stderrLogPath, stderr, stderrLogLabel, "STDERR");
        }
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          const diagnostic = stderr.trim() ? stderr : stdout;
          this.handlePythonProcessError(diagnostic);
          reject(new Error(stderr || `Process exited with code ${code}`));
        }
      });
    });
  }
}
