import { Text as CMText } from "@codemirror/state";
import type { EditorView, ViewUpdate } from "@codemirror/view";
import { ViewPlugin } from "@codemirror/view";
import type { App, WorkspaceLeaf } from "obsidian";
import { MarkdownView, TFile, normalizePath, setIcon } from "obsidian";
import { CHUNK_CACHE_DIR } from "./settings";

type ChunkMarkerInfo = {
  chunkId?: string;
  pageNumber?: number;
};

type ChunkStartLine = {
  line: number;
  text: string;
};

export type PdfSidebarHelpers = {
  extractDocIdFromDoc: (doc: CMText) => string | null;
  findChunkStartLineInDoc: (doc: CMText, fromLine: number) => ChunkStartLine | null;
  parseChunkMarkerLine: (line: string) => ChunkMarkerInfo | null;
  extractFirstChunkMarkerFromContent: (content: string) => ChunkMarkerInfo | null;
};

export type PdfSidebarDependencies = {
  app: App;
  iconSvg?: string;
  resolveDocIdForNote: (file: TFile, content: string) => Promise<string | null>;
  getDocIndexEntry: (docId: string) => Promise<{ pdf_path?: string } | null>;
  hydrateDocIndexFromCache: (docId: string) => Promise<{ pdf_path?: string } | null>;
  toVaultRelativePath: (path: string) => string | null;
  normalizeChunkIdForNote: (chunkId: string, docId?: string) => string | null;
  readChunkPayload: (chunkPath: string) => Promise<unknown>;
};

const getTopVisibleLineNumber = (view: EditorView): number | null => {
  const rect = view.scrollDOM.getBoundingClientRect();
  const pos = view.posAtCoords({ x: rect.left + 8, y: + rect.height * 0.25 });
  if (pos === null) {
    return null;
  }
  return view.state.doc.lineAt(pos).number;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as Record<string, unknown>;
};

export class PdfSidebarController {
  private readonly deps: PdfSidebarDependencies;
  private readonly helpers: PdfSidebarHelpers;
  private pdfSidebarLeaf: WorkspaceLeaf | null = null;
  private pdfSidebarDocId: string | null = null;
  private pdfSidebarPdfPath: string | null = null;
  private pdfSidebarPage: number | null = null;
  private pendingPdfSync: { docId: string; pageNumber?: number; chunkId?: string } | null = null;
  private chunkPageCache = new Map<string, Map<string, number>>();
  private previewScrollEl: HTMLElement | null = null;
  private previewScrollHandler: ((event: Event) => void) | null = null;
  private previewScrollFrame: number | null = null;
  private pdfSyncInFlight = false;
  private queuedPdfSync: { docId: string; pageNumber?: number; chunkId?: string } | null = null;

  constructor(deps: PdfSidebarDependencies, helpers: PdfSidebarHelpers) {
    this.deps = deps;
    this.helpers = helpers;
  }

  public createSyncExtension(): ViewPlugin<object> {
    const helpers = this.helpers;
    const syncPdfSidebarForDoc = this.syncPdfSidebarForDoc.bind(this);
    return ViewPlugin.fromClass(
      class {
        private view: EditorView;
        private docId: string | null = null;
        private lastPage: number | null = null;
        private lastChunkId: string | null = null;
        private scrollFrame: number | null = null;
        private onScroll: () => void;

        constructor(view: EditorView) {
          this.view = view;
          this.docId = helpers.extractDocIdFromDoc(view.state.doc);
          this.onScroll = () => this.scheduleSync(false);
          view.scrollDOM.addEventListener("scroll", this.onScroll, { passive: true });
          this.scheduleSync(true);
        }

        update(update: ViewUpdate): void {
          if (update.docChanged) {
            this.docId = helpers.extractDocIdFromDoc(update.view.state.doc);
            this.lastPage = null;
            this.lastChunkId = null;
          }
          if (update.docChanged || update.viewportChanged) {
            this.scheduleSync(false);
          }
        }

        destroy(): void {
          this.view.scrollDOM.removeEventListener("scroll", this.onScroll);
          if (this.scrollFrame !== null) {
            window.cancelAnimationFrame(this.scrollFrame);
            this.scrollFrame = null;
          }
        }

        private scheduleSync(force: boolean): void {
          if (this.scrollFrame !== null) {
            return;
          }
          this.scrollFrame = window.requestAnimationFrame(() => {
            this.scrollFrame = null;
            this.syncPdfSidebar(this.view, force);
          });
        }

        private syncPdfSidebar(view: EditorView, force: boolean): void {
          const docId = this.docId;
          if (!docId) {
            return;
          }
          const cursorLine = getTopVisibleLineNumber(view);
          if (cursorLine === null) {
            return;
          }
          const chunkStart = helpers.findChunkStartLineInDoc(view.state.doc, cursorLine);
          if (!chunkStart) {
            return;
          }
          const info = helpers.parseChunkMarkerLine(chunkStart.text);
          const pageNumber = info?.pageNumber ?? null;
          const chunkId = info?.chunkId ?? null;
          if (!pageNumber && !chunkId) {
            return;
          }
          const samePage = pageNumber !== null && this.lastPage === pageNumber;
          const sameChunk = pageNumber === null && chunkId !== null && this.lastChunkId === chunkId;
          if (!force && (samePage || sameChunk)) {
            return;
          }
          this.lastPage = pageNumber;
          this.lastChunkId = chunkId;
          void syncPdfSidebarForDoc(docId, pageNumber ?? undefined, chunkId ?? undefined);
        }
      }
    );
  }

  public async maybeSyncPendingPdf(): Promise<void> {
    if (!this.pendingPdfSync) {
      return;
    }
    if (!this.pdfSidebarLeaf || this.pdfSidebarLeaf.view?.getViewType?.() !== "pdf") {
      const leaf = await this.getPdfSidebarLeaf();
      if (!leaf) {
        return;
      }
    }
    if (!this.pdfSidebarLeaf || !this.isLeafTabActive(this.pdfSidebarLeaf)) {
      return;
    }
    const pending = this.pendingPdfSync;
    this.pendingPdfSync = null;
    await this.syncPdfSidebarForDoc(pending.docId, pending.pageNumber, pending.chunkId);
  }

  public updatePreviewScrollHandler(): void {
    const view = this.deps.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view || view.getMode() !== "preview") {
      this.detachPreviewScrollHandler();
      return;
    }
    const container = view.previewMode?.containerEl;
    if (!container) {
      this.detachPreviewScrollHandler();
      return;
    }
    if (this.previewScrollEl === container) {
      return;
    }
    this.detachPreviewScrollHandler();
    const handler = () => this.schedulePreviewSync(view);
    container.addEventListener("scroll", handler, { passive: true });
    this.previewScrollEl = container;
    this.previewScrollHandler = handler;
    this.schedulePreviewSync(view);
  }

  public async syncPdfSidebarForFile(file: TFile): Promise<void> {
    try {
      const content = await this.deps.app.vault.read(file);
      const docId = await this.deps.resolveDocIdForNote(file, content);
      if (!docId) {
        return;
      }
      const firstMarker = this.helpers.extractFirstChunkMarkerFromContent(content);
      await this.syncPdfSidebarForDoc(docId, firstMarker?.pageNumber, firstMarker?.chunkId);
    } catch (error) {
      console.warn("Failed to sync PDF sidebar for opened note", error);
    }
  }

  public async syncPdfSidebarForDoc(
    docId: string | null,
    pageNumber?: number,
    chunkId?: string
  ): Promise<void> {
    if (!docId) {
      return;
    }
    if (this.pdfSyncInFlight) {
      this.queuedPdfSync = { docId, pageNumber, chunkId };
      return;
    }
    this.pdfSyncInFlight = true;
    try {
      let entry = await this.deps.getDocIndexEntry(docId);
      if (!entry) {
        entry = await this.deps.hydrateDocIndexFromCache(docId);
      }
      const pdfPath = entry?.pdf_path ? String(entry.pdf_path) : "";
      if (!pdfPath) {
        return;
      }
      let relativePdf = this.deps.toVaultRelativePath(pdfPath);
      if (!relativePdf) {
        const normalized = normalizePath(pdfPath);
        const directFile = this.deps.app.vault.getAbstractFileByPath(normalized);
        if (directFile instanceof TFile) {
          relativePdf = normalized;
        }
      }
      if (!relativePdf) {
        return;
      }
      const file = this.deps.app.vault.getAbstractFileByPath(relativePdf);
      if (!(file instanceof TFile) || file.extension.toLowerCase() !== "pdf") {
        return;
      }
      const leaf = await this.getPdfSidebarLeaf();
      if (!leaf) {
        this.pendingPdfSync = { docId, pageNumber, chunkId };
        return;
      }
      this.updatePdfSidebarIcon(leaf);
      if (!this.isLeafTabActive(leaf)) {
        this.pendingPdfSync = { docId, pageNumber, chunkId };
        return;
      }
      let nextPage = Number.isFinite(pageNumber ?? NaN) ? Number(pageNumber) : null;
      if (nextPage === null && chunkId) {
        nextPage = await this.resolvePageNumberForChunk(docId, chunkId);
      }
      if (nextPage === null) {
        return;
      }
      if (
        this.pdfSidebarDocId === docId
        && this.pdfSidebarPdfPath === file.path
        && this.pdfSidebarPage === nextPage
      ) {
        return;
      }
      this.pdfSidebarDocId = docId;
      this.pdfSidebarPdfPath = file.path;
      this.pdfSidebarPage = nextPage;
      const relativeLink = relativePdf;
      const linkText = nextPage !== null ? `${relativeLink}#page=${nextPage}` : relativeLink;
      await this.openPdfLinkInLeaf(leaf, linkText);
      this.updatePdfSidebarIcon(leaf);
    } finally {
      this.pdfSyncInFlight = false;
      const queued = this.queuedPdfSync;
      this.queuedPdfSync = null;
      if (queued) {
        void this.syncPdfSidebarForDoc(queued.docId, queued.pageNumber, queued.chunkId);
      }
    }
  }

  private detachPreviewScrollHandler(): void {
    if (this.previewScrollEl && this.previewScrollHandler) {
      this.previewScrollEl.removeEventListener("scroll", this.previewScrollHandler);
    }
    this.previewScrollEl = null;
    this.previewScrollHandler = null;
    if (this.previewScrollFrame !== null) {
      window.cancelAnimationFrame(this.previewScrollFrame);
      this.previewScrollFrame = null;
    }
  }

  private schedulePreviewSync(view: MarkdownView): void {
    if (this.previewScrollFrame !== null) {
      return;
    }
    this.previewScrollFrame = window.requestAnimationFrame(() => {
      this.previewScrollFrame = null;
      this.syncPdfSidebarForPreview(view);
    });
  }

  private syncPdfSidebarForPreview(view: MarkdownView): void {
    const container = this.previewScrollEl;
    if (!container) {
      return;
    }
    const content = view.getViewData();
    if (!content) {
      return;
    }
    const doc = CMText.of(content.split(/\r?\n/));
    const docId = this.helpers.extractDocIdFromDoc(doc);
    if (!docId) {
      return;
    }
    const topLine = this.getPreviewTopLineNumber(container);
    if (topLine === null) {
      return;
    }
    const chunkStart = this.helpers.findChunkStartLineInDoc(doc, topLine + 1);
    if (!chunkStart) {
      return;
    }
    const info = this.helpers.parseChunkMarkerLine(chunkStart.text);
    if (!info?.pageNumber && !info?.chunkId) {
      return;
    }
    void this.syncPdfSidebarForDoc(docId, info?.pageNumber, info?.chunkId);
  }

  private getPreviewTopLineNumber(container: HTMLElement): number | null {
    const containerTop = container.getBoundingClientRect().top;
    const blocks = container.querySelectorAll<HTMLElement>("[data-line]");
    for (const block of Array.from(blocks)) {
      const rect = block.getBoundingClientRect();
      if (rect.bottom >= containerTop + 2) {
        const lineAttr = block.getAttribute("data-line") ?? "";
        const lineNumber = Number.parseInt(lineAttr, 10);
        if (Number.isFinite(lineNumber)) {
          return lineNumber;
        }
      }
    }
    return null;
  }

  private async getPdfSidebarLeaf(): Promise<WorkspaceLeaf | null> {
    if (this.pdfSidebarLeaf && this.pdfSidebarLeaf.view?.getViewType?.() === "pdf") {
      return this.pdfSidebarLeaf;
    }
    const workspaceAny = this.deps.app.workspace as unknown as {
      ensureSideLeaf?: (
        type: string,
        side: "left" | "right",
        options?: { active?: boolean; split?: boolean; reveal?: boolean; state?: unknown }
      ) => Promise<WorkspaceLeaf>;
    };
    if (typeof workspaceAny.ensureSideLeaf === "function") {
      try {
        const leaf = await workspaceAny.ensureSideLeaf("pdf", "right", {
          active: false,
          split: false,
          reveal: true,
        });
        this.pdfSidebarLeaf = leaf;
        this.updatePdfSidebarIcon(leaf);
        return leaf;
      } catch (error) {
        console.warn("Failed to ensure PDF side leaf", error);
      }
    }
    const existing = this.deps.app.workspace.getRightLeaf(false);
    if (existing) {
      this.pdfSidebarLeaf = existing;
      this.updatePdfSidebarIcon(existing);
      return existing;
    }
    const created = this.deps.app.workspace.getRightLeaf(true);
    if (created) {
      this.pdfSidebarLeaf = created;
      this.updatePdfSidebarIcon(created);
      return created;
    }
    return null;
  }

  private isRightSidebarLeaf(leaf: WorkspaceLeaf | null): boolean {
    if (!leaf) {
      return false;
    }
    const rightLeaf = this.deps.app.workspace.getRightLeaf(false);
    if (rightLeaf && rightLeaf === leaf) {
      return true;
    }
    const leafAny = leaf as unknown as { containerEl?: HTMLElement };
    const containerEl = leafAny.containerEl;
    if (!containerEl) {
      return true;
    }
    return Boolean(containerEl.closest(".workspace-split.mod-right-split, .mod-right-split"));
  }

  private updatePdfSidebarIcon(leaf: WorkspaceLeaf | null): void {
    if (!leaf || !this.isRightSidebarLeaf(leaf)) {
      return;
    }
    const leafAny = leaf as unknown as { containerEl?: HTMLElement };
    const containerEl = leafAny.containerEl;
    const targets: HTMLElement[] = [];
    if (containerEl) {
      targets.push(...Array.from(containerEl.querySelectorAll<HTMLElement>(".view-header-icon")));
    }
    const leafAnyTabs = leaf as unknown as {
      tabHeaderEl?: HTMLElement;
      tabHeaderInnerIconEl?: HTMLElement;
    };
    if (leafAnyTabs.tabHeaderEl) {
      targets.push(
        ...Array.from(
          leafAnyTabs.tabHeaderEl.querySelectorAll<HTMLElement>(
            ".workspace-tab-header-inner-icon, .view-header-icon"
          )
        )
      );
    }
    if (leafAnyTabs.tabHeaderInnerIconEl) {
      targets.push(leafAnyTabs.tabHeaderInnerIconEl);
    }
    if (targets.length === 0) {
      return;
    }
    const seen = new Set<HTMLElement>();
    for (const iconEl of targets) {
      if (seen.has(iconEl)) {
        continue;
      }
      seen.add(iconEl);
      iconEl.replaceChildren();
      setIcon(iconEl, "zrr-pdf");
      if (!iconEl.querySelector("svg") && this.deps.iconSvg) {
        const parsed = document.createRange().createContextualFragment(this.deps.iconSvg);
        iconEl.replaceChildren(parsed);
      }
      if (iconEl.dataset) {
        iconEl.dataset.zrrIcon = "zrr-pdf";
      }
    }
    const viewAny = leaf.view as unknown as { icon?: string; getIcon?: () => string };
    viewAny.icon = "zrr-pdf";
    if (typeof viewAny.getIcon === "function") {
      viewAny.getIcon = () => "zrr-pdf";
    }
  }

  private async openPdfLinkInLeaf(leaf: WorkspaceLeaf, linkText: string): Promise<void> {
    const pdfPlus = asRecord(this.getPluginsRegistry()?.["pdf-plus"]);
    const pdfPlusLib = asRecord(pdfPlus?.lib);
    const pdfPlusWorkspace = asRecord(pdfPlusLib?.workspace);
    const pdfPlusOpen =
      typeof pdfPlusWorkspace?.openPDFLinkTextInLeaf === "function"
        ? (pdfPlusWorkspace.openPDFLinkTextInLeaf as (
          leaf: WorkspaceLeaf,
          linkText: string,
          sourcePath: string,
          state?: { active?: boolean }
        ) => Promise<void>)
        : null;
    if (typeof pdfPlusOpen === "function") {
      try {
        await pdfPlusOpen.call(pdfPlusWorkspace, leaf, linkText, "", { active: false });
        return;
      } catch (error) {
        if (!this.isPdfAnnotationRaceError(error)) {
          throw error;
        }
        // Retry once after a short delay; the PDF page/view may still be initializing.
        await this.delay(150);
      }
    }
    const leafAny = leaf as unknown as {
      openLinkText?: (link: string, sourcePath: string, state?: { active?: boolean }) => Promise<void>;
    };
    if (typeof leafAny.openLinkText === "function") {
      try {
        await leafAny.openLinkText(linkText, "", { active: false });
      } catch (error) {
        if (!this.isPdfAnnotationRaceError(error)) {
          throw error;
        }
        await this.delay(150);
        await leafAny.openLinkText(linkText, "", { active: false });
      }
      return;
    }
    await this.deps.app.workspace.openLinkText(linkText, "", false);
  }

  private isPdfAnnotationRaceError(error: unknown): boolean {
    const message = error instanceof Error
      ? error.message
      : (typeof error === "string" ? error : "");
    if (!message) {
      return false;
    }
    return /injectLinkAnnotations/i.test(message)
      || /render method must be called before/i.test(message);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getPluginsRegistry(): Record<string, unknown> | undefined {
    const appAny = this.deps.app as unknown as {
      plugins?: { plugins?: Record<string, unknown> };
    };
    return appAny.plugins?.plugins;
  }

  private isLeafTabActive(leaf: WorkspaceLeaf): boolean {
    const leafAny = leaf as unknown as {
      containerEl?: HTMLElement;
      tabHeaderEl?: HTMLElement;
      parent?: { activeLeaf?: WorkspaceLeaf };
    };
    if (leafAny.parent?.activeLeaf) {
      return leafAny.parent.activeLeaf === leaf;
    }
    const containerEl = leafAny.containerEl;
    if (containerEl?.classList.contains("is-active") || containerEl?.classList.contains("mod-active")) {
      return true;
    }
    const tabHeaderEl = leafAny.tabHeaderEl;
    if (tabHeaderEl?.classList.contains("is-active") || tabHeaderEl?.classList.contains("mod-active")) {
      return true;
    }
    return false;
  }

  private async resolvePageNumberForChunk(docId: string, chunkId: string): Promise<number | null> {
    if (!docId || !chunkId) {
      return null;
    }
    const normalizedId = this.deps.normalizeChunkIdForNote(chunkId, docId) || chunkId;
    const existing = this.chunkPageCache.get(docId);
    if (existing && existing.has(normalizedId)) {
      return existing.get(normalizedId) ?? null;
    }
    const chunkPath = normalizePath(`${CHUNK_CACHE_DIR}/${docId}.json`);
    const adapter = this.deps.app.vault.adapter;
    if (!(await adapter.exists(chunkPath))) {
      return null;
    }
    const payload = asRecord(await this.deps.readChunkPayload(chunkPath));
    const chunks = Array.isArray(payload?.chunks) ? payload.chunks : [];
    const map = new Map<string, number>();
    for (const chunk of chunks) {
      const chunkRecord = asRecord(chunk);
      const id = typeof chunkRecord?.chunk_id === "string" ? chunkRecord.chunk_id.trim() : "";
      if (!id) {
        continue;
      }
      const pageStart = Number.isFinite(chunkRecord?.page_start ?? NaN) ? Number(chunkRecord?.page_start) : null;
      const pageEnd = Number.isFinite(chunkRecord?.page_end ?? NaN) ? Number(chunkRecord?.page_end) : null;
      const pageNumber = pageStart ?? pageEnd;
      if (pageNumber !== null) {
        map.set(id, pageNumber);
        map.set(`${docId}:${id}`, pageNumber);
      }
    }
    this.chunkPageCache.set(docId, map);
    return map.get(normalizedId) ?? map.get(chunkId) ?? null;
  }
}
