import { App, ItemView, MarkdownRenderer, Modal, Notice, Setting, WorkspaceLeaf, setIcon } from "obsidian";
import type ZoteroRagPlugin from "./main";
import type { ZoteroLocalItem } from "./types";
import { getDocIdFromItem } from "./zoteroItemHelpers";

export const VIEW_TYPE_ZOTERO_CHAT = "zotero-redisearch-rag-chat";

export type ChatCitation = {
  doc_id: string;
  attachment_key?: string;
  chunk_id?: string;
  annotation_key?: string;
  annotation_page_label?: string;
  page_start?: string;
  page_end?: string;
  pages?: string;
  source_pdf?: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: ChatCitation[];
  retrieved?: ChatRetrievedChunk[];
  createdAt: string;
};

export type ChatRetrievedChunk = {
  doc_id?: string;
  chunk_id?: string;
  attachment_key?: string;
  annotation_page_label?: string;
  is_annotation?: string | number | boolean;
  page_start?: string | number;
  page_end?: string | number;
  source_pdf?: string;
  section?: string;
  score?: string | number;
  text?: string;
};

export type RagQueryFinalPayload = {
  canceled?: boolean;
  answer?: string;
  citations?: ChatCitation[];
  retrieved?: ChatRetrievedChunk[];
  query?: string;
  raw_query?: string;
  retrieval_query?: string;
  query_rewritten?: boolean;
  expanded_queries?: string[];
};

const ZOTERO_ITEM_TYPE_ICON_MAP: Record<string, string> = {
  artwork: "image",
  audioRecording: "music",
  bill: "file-text",
  blogPost: "globe",
  book: "book",
  bookSection: "book-open",
  case: "scale",
  computerProgram: "code",
  conferencePaper: "file-text",
  dataset: "database",
  dictionaryEntry: "book",
  document: "file-text",
  email: "mail",
  encyclopediaArticle: "book",
  film: "film",
  forumPost: "message-circle",
  hearing: "file-text",
  interview: "mic",
  journalArticle: "file-text",
  letter: "mail",
  magazineArticle: "file-text",
  manuscript: "file-text",
  map: "map",
  newspaperArticle: "file-text",
  patent: "award",
  podcast: "mic",
  preprint: "file-text",
  presentation: "file-text",
  radioBroadcast: "music",
  report: "file-text",
  statute: "scale",
  thesis: "graduation-cap",
  tvBroadcast: "film",
  videoRecording: "film",
  webpage: "globe",
};

type MessageEls = {
  wrapper: HTMLElement;
  content: HTMLElement;
  citations: HTMLElement;
};

export class ZoteroChatView extends ItemView {
  private plugin: ZoteroRagPlugin;
  private messages: ChatMessage[] = [];
  private messagesEl!: HTMLElement;
  private inputWrapEl!: HTMLElement;
  private inputEl!: HTMLTextAreaElement;
  private sendButton!: HTMLButtonElement;
  private newButton!: HTMLButtonElement;
  private renameButton!: HTMLButtonElement;
  private copyButton!: HTMLButtonElement;
  private sessionSelect!: HTMLSelectElement;
  private deleteButton!: HTMLButtonElement;
  private activeSessionId = "default";
  private messageEls = new Map<string, MessageEls>();
  private pendingRender = new Map<string, number>();
  private pendingThinking = new Set<string>();
  private busy = false;
  private cancelPending = false;
  private mentionOverlayEl: HTMLElement | null = null;
  private mentionListEl: HTMLElement | null = null;
  private mentionEmptyEl: HTMLElement | null = null;
  private mentionSuggestions: ZoteroLocalItem[] = [];
  private mentionSelectedIndex = 0;
  private mentionContext: { from: number; to: number; query: string } | null = null;
  private mentionQuerySequence = 0;
  private mentionDebounceHandle: number | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: ZoteroRagPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE_ZOTERO_CHAT;
  }

  getDisplayText(): string {
    return "Zotero research assistant chat";
  }

  getIcon(): string {
    return "zrr-chat";
  }

  async onOpen(): Promise<void> {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("zrr-chat-view");

    const header = containerEl.createEl("div", { cls: "zrr-chat-header" });
    header.createEl("div", { cls: "zrr-chat-title", text: "Zotero research assistant chat" });
    const controls = header.createEl("div", { cls: "zrr-chat-controls" });
    const selectRow = controls.createEl("div", { cls: "zrr-chat-controls-row" });
    this.sessionSelect = selectRow.createEl("select", { cls: "zrr-chat-session" });
    this.sessionSelect.addEventListener("change", () => {
      void this.switchSession(this.sessionSelect.value);
    });
    const buttonRow = controls.createEl("div", { cls: "zrr-chat-controls-row zrr-chat-controls-actions" });
    this.renameButton = buttonRow.createEl("button", {
      cls: "zrr-chat-rename",
      text: "Rename",
      attr: { title: "Rename the current chat" },
    });
    this.renameButton.addEventListener("click", () => {
      void this.promptRenameSession();
    });
    this.copyButton = buttonRow.createEl("button", {
      cls: "zrr-chat-copy",
      text: "Copy",
      attr: { title: "Copy this chat to a new note" },
    });
    this.copyButton.addEventListener("click", () => {
      void this.copyChatToNote();
    });
    this.deleteButton = buttonRow.createEl("button", {
      cls: "zrr-chat-delete",
      text: "Delete",
      attr: { title: "Delete this chat" },
    });
    this.deleteButton.addEventListener("click", () => {
      void this.deleteChat();
    });
    this.newButton = buttonRow.createEl("button", {
      cls: "zrr-chat-new",
      text: "New chat",
      attr: { title: "Start a new chat session" },
    });
    this.newButton.addEventListener("click", () => {
      void this.startNewChat();
    });

    this.messagesEl = containerEl.createEl("div", { cls: "zrr-chat-messages" });

    this.inputWrapEl = containerEl.createEl("div", { cls: "zrr-chat-input" });
    this.inputEl = this.inputWrapEl.createEl("textarea", {
      cls: "zrr-chat-textarea",
      attr: { placeholder: "Ask your Zotero library..." },
    });
    this.sendButton = this.inputWrapEl.createEl("button", {
      cls: "zrr-chat-send",
      attr: { "aria-label": "Send message", title: "Send message" },
    });
    this.createMentionOverlay();
    this.updateSendButtonState();
    this.sendButton.addEventListener("click", () => {
      void this.handleSendButtonClick();
    });
    this.inputEl.addEventListener("keydown", (event) => {
      if (this.handleMentionOverlayKeydown(event)) {
        return;
      }
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        if (!this.busy) {
          void this.handleSend();
        }
      }
    });
    this.inputEl.addEventListener("input", () => {
      this.scheduleZoteroMentionPicker();
    });
    this.inputEl.addEventListener("click", () => {
      this.scheduleZoteroMentionPicker();
    });
    this.inputEl.addEventListener("keyup", () => {
      this.scheduleZoteroMentionPicker();
    });
    this.registerDomEvent(document, "mousedown", (event) => {
      if (!this.inputWrapEl) {
        return;
      }
      const target = event.target;
      if (target instanceof Node && !this.inputWrapEl.contains(target)) {
        this.closeMentionOverlay();
      }
    });

    await this.loadSessions();
    await this.loadHistory();
    await this.renderAll();
  }

  focusInput(): void {
    this.inputEl?.focus();
  }

  onClose(): Promise<void> {
    this.closeMentionOverlay();
    this.clearMentionPickerDebounce();
    return Promise.resolve();
  }

  private async loadHistory(): Promise<void> {
    try {
      this.messages = await this.plugin.loadChatHistoryForSession(this.activeSessionId);
    } catch (error) {
      console.error(error);
      this.messages = [];
    }
  }

  private async saveHistory(): Promise<void> {
    try {
      await this.plugin.saveChatHistoryForSession(this.activeSessionId, this.messages);
      await this.plugin.finalizeChatSessionNameIfNeeded(this.activeSessionId, this.messages);
      await this.loadSessions();
    } catch (error) {
      console.error(error);
    }
  }

  private updateSessionControlsState(): void {
    const busyTitle = "Finish or cancel the current response first";
    const setBusyState = (
      control: HTMLButtonElement | HTMLSelectElement | undefined,
      defaultTitle: string
    ): void => {
      if (!control) {
        return;
      }
      control.disabled = this.busy;
      control.setAttr("title", this.busy ? busyTitle : defaultTitle);
    };

    setBusyState(this.sessionSelect, "Switch chat session");
    setBusyState(this.renameButton, "Rename the current chat");
    setBusyState(this.deleteButton, "Delete this chat");
    setBusyState(this.newButton, "Start a new chat session");
  }

  private async loadSessions(): Promise<void> {
    const sessions = await this.plugin.listChatSessions();
    this.activeSessionId = await this.plugin.getActiveChatSessionId();
    this.sessionSelect.empty();
    for (const session of sessions) {
      const option = this.sessionSelect.createEl("option", { text: session.name });
      option.value = session.id;
      if (session.id === this.activeSessionId) {
        option.selected = true;
      }
    }
    if (!sessions.some((s) => s.id === this.activeSessionId) && sessions.length > 0) {
      this.activeSessionId = sessions[0].id;
      await this.plugin.setActiveChatSessionId(this.activeSessionId);
      this.sessionSelect.value = this.activeSessionId;
    }
    this.updateSessionControlsState();
  }

  private async promptRenameSession(): Promise<void> {
    if (this.busy) {
      new Notice("Finish or cancel the current response before renaming this chat.");
      return;
    }
    const sessions = await this.plugin.listChatSessions();
    const current = sessions.find((s) => s.id === this.activeSessionId);
    const modal = new RenameChatModal(this.app, current?.name ?? "New chat", async (name) => {
      await this.plugin.renameChatSession(this.activeSessionId, name);
      await this.loadSessions();
    });
    modal.open();
  }

  private async startNewChat(): Promise<void> {
    if (this.busy) {
      new Notice("Finish or cancel the current response before starting a new chat.");
      return;
    }
    await this.plugin.saveChatHistoryForSession(this.activeSessionId, this.messages);
    await this.plugin.finalizeChatSessionNameIfNeeded(this.activeSessionId, this.messages, { force: true });
    const sessionId = await this.plugin.createChatSession("New chat");
    await this.switchSession(sessionId, { skipSave: true });
  }

  private async deleteChat(): Promise<void> {
    if (this.busy) {
      new Notice("Finish or cancel the current response before deleting this chat.");
      return;
    }
    const sessions = await this.plugin.listChatSessions();
    if (sessions.length <= 1) {
      new Notice("You must keep at least one chat.");
      return;
    }
    const current = sessions.find((s) => s.id === this.activeSessionId);
    if (!current) {
      return;
    }
    const modal = new ConfirmDeleteChatModal(this.app, current.name, async () => {
      await this.plugin.deleteChatSession(this.activeSessionId);
      const nextSessionId = await this.plugin.getActiveChatSessionId();
      await this.switchSession(nextSessionId, { skipSave: true });
    });
    modal.open();
  }

  private async switchSession(
    sessionId: string,
    options: { skipSave?: boolean } = {}
  ): Promise<void> {
    if (this.busy) {
      this.sessionSelect.value = this.activeSessionId;
      new Notice("Finish or cancel the current response before switching chats.");
      return;
    }
    if (!sessionId || sessionId === this.activeSessionId) {
      return;
    }
    if (!options.skipSave) {
      await this.saveHistory();
    }
    this.activeSessionId = sessionId;
    await this.plugin.setActiveChatSessionId(sessionId);
    await this.loadSessions();
    await this.loadHistory();
    await this.renderAll();
  }

  private async renderAll(): Promise<void> {
    this.messagesEl.empty();
    this.messageEls.clear();
    const validIds = new Set(this.messages.map((message) => message.id));
    for (const messageId of Array.from(this.pendingThinking)) {
      if (!validIds.has(messageId)) {
        this.pendingThinking.delete(messageId);
      }
    }
    for (const message of this.messages) {
      await this.renderMessage(message);
    }
    this.scrollToBottom();
  }

  private async renderMessage(message: ChatMessage): Promise<void> {
    const wrapper = this.messagesEl.createEl("div", {
      cls: `zrr-chat-message zrr-chat-${message.role}`,
    });
    const metaRow = wrapper.createEl("div", { cls: "zrr-chat-meta-row" });
    const meta = metaRow.createEl("div", { cls: "zrr-chat-meta" });
    meta.setText(message.role === "user" ? "You" : "Zotero Assistant");
    const actions = metaRow.createEl("div", { cls: "zrr-chat-message-actions" });
    const copyButton = actions.createEl("button", {
      cls: "zrr-chat-message-copy zrr-chat-icon-button",
      attr: { title: "Copy this message", "aria-label": "Copy this message" },
    });
    setIcon(copyButton, "copy");
    copyButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      void this.copyMessage(message);
    });
    const deleteButton = actions.createEl("button", {
      cls: "zrr-chat-message-delete zrr-chat-icon-button",
      attr: { title: "Delete this message", "aria-label": "Delete this message" },
    });
    setIcon(deleteButton, "trash-2");
    deleteButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      void this.deleteMessage(message.id);
    });
    const contentEl = wrapper.createEl("div", { cls: "zrr-chat-content" });
    const citationsEl = wrapper.createEl("div", { cls: "zrr-chat-citations" });
    this.messageEls.set(message.id, { wrapper, content: contentEl, citations: citationsEl });
    await this.renderMessageContent(message);
  }

  private async copyMessage(message: ChatMessage): Promise<void> {
    const formatted = await this.plugin.formatInlineCitations(
      message.content || "",
      message.citations ?? [],
      message.retrieved ?? []
    );
    const content = (formatted || "").trim();
    if (!content) {
      new Notice("Nothing to copy.");
      return;
    }
    if (!navigator.clipboard?.writeText) {
      new Notice("Clipboard API unavailable. Select text to copy.");
      return;
    }
    try {
      await navigator.clipboard.writeText(content);
      new Notice("Message copied to clipboard.");
    } catch (error) {
      console.error("Failed to copy message", error);
      new Notice("Failed to copy message.");
    }
  }

  private async deleteMessage(messageId: string): Promise<void> {
    const index = this.messages.findIndex((message) => message.id === messageId);
    if (index === -1) {
      return;
    }
    const confirmDelete = await this.confirmDeleteMessage();
    if (!confirmDelete) {
      return;
    }
    this.messages.splice(index, 1);
    const els = this.messageEls.get(messageId);
    if (els) {
      els.wrapper.remove();
    }
    this.messageEls.delete(messageId);
    const pending = this.pendingRender.get(messageId);
    if (pending !== undefined) {
      window.clearTimeout(pending);
      this.pendingRender.delete(messageId);
    }
    this.pendingThinking.delete(messageId);
    await this.saveHistory();
  }

  private async confirmDeleteMessage(): Promise<boolean> {
    return new Promise((resolve) => {
      new ConfirmDeleteMessageModal(this.app, resolve).open();
    });
  }

  private scheduleRender(message: ChatMessage): void {
    if (this.pendingRender.has(message.id)) {
      return;
    }
    const handle = window.setTimeout(() => {
      this.pendingRender.delete(message.id);
      void this.renderMessageContent(message).then(() => {
        this.scrollToBottom();
      });
    }, 80);
    this.pendingRender.set(message.id, handle);
  }

  private async renderMessageContent(message: ChatMessage): Promise<void> {
    const els = this.messageEls.get(message.id);
    if (!els) {
      return;
    }
    const isThinking =
      message.role === "assistant"
      && !message.content.trim()
      && this.pendingThinking.has(message.id);
    if (isThinking) {
      if (els.content.dataset.lastRendered !== "__thinking__") {
        els.content.empty();
        this.renderThinkingIndicator(els.content);
        els.content.dataset.lastRendered = "__thinking__";
      }
      els.citations.empty();
      return;
    }
    // Only update if content actually changed to reduce flicker
    const newContent = await this.plugin.formatInlineCitations(
      message.content || "",
      message.citations ?? [],
      message.retrieved ?? []
    );
    // Use a data attribute to store last rendered content
    if (els.content.dataset.lastRendered !== newContent) {
      els.content.empty();
      await MarkdownRenderer.render(this.app, newContent, els.content, "", this);
      this.hookInternalLinks(els.content);
      els.content.dataset.lastRendered = newContent;
    }
    // Always update citations (they may change at end)
    els.citations.empty();
    await this.renderCitations(els.citations, message.citations ?? []);
  }

  private renderThinkingIndicator(container: HTMLElement): void {
    const indicator = container.createEl("div", { cls: "zrr-chat-thinking" });
    indicator.setAttr("role", "status");
    indicator.setAttr("aria-live", "polite");
    indicator.createEl("span", { cls: "zrr-chat-thinking-spinner" });
    indicator.createEl("span", { cls: "zrr-chat-thinking-text", text: "Thinking" });
    const dots = indicator.createEl("span", { cls: "zrr-chat-thinking-dots" });
    dots.createEl("span");
    dots.createEl("span");
    dots.createEl("span");
  }

  private hookInternalLinks(container: HTMLElement): void {
    const links = container.querySelectorAll<HTMLAnchorElement>("a.internal-link");
    for (const link of Array.from(links)) {
      if (link.dataset.zrrBound === "1") {
        continue;
      }
      link.dataset.zrrBound = "1";
      this.registerDomEvent(link, "click", (event) => {
        event.preventDefault();
        const href = link.getAttribute("data-href") || link.getAttribute("href") || "";
        if (!href) {
          return;
        }
        void this.plugin.openInternalLinkInMain(href);
      });
    }
  }

  private async renderCitations(container: HTMLElement, citations: ChatCitation[]): Promise<void> {
    container.empty();
    if (!citations.length) {
      return;
    }
    const details = container.createEl("details", { cls: "zrr-chat-citations-details" });
    details.createEl("summary", {
      text: `Relevant context sources (${citations.length})`,
      cls: "zrr-chat-citations-summary",
    });
    const list = details.createEl("ul", { cls: "zrr-chat-citation-list" });

    for (const citation of citations) {
      const display = await this.plugin.resolveCitationDisplay(citation);
      const item = list.createEl("li");
      const label = `${display.noteTitle} p. ${display.pageLabel}`;
      const link = item.createEl("a", { text: label, href: "#" });
      link.addEventListener("click", (event) => {
        event.preventDefault();
        void this.plugin.openCitationTarget(citation, display);
      });
      if (citation.annotation_key) {
        item.createEl("span", { text: "Annotation", cls: "zrr-chat-citation-badge" });
      }
    }
  }

  private async copyChatToNote(): Promise<void> {
    const sessions = await this.plugin.listChatSessions();
    const current = sessions.find((s) => s.id === this.activeSessionId);
    const title = current?.name ?? "New chat";
    await this.plugin.createChatNoteFromSession(this.activeSessionId, title, this.messages);
  }

  private scrollToBottom(): void {
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  private updateSendButtonState(): void {
    if (!this.sendButton) {
      return;
    }
    this.updateSessionControlsState();
    if (this.busy) {
      this.sendButton.disabled = this.cancelPending;
      setIcon(this.sendButton, this.cancelPending ? "loader-2" : "square");
      this.sendButton.setAttr("aria-label", this.cancelPending ? "Canceling..." : "Cancel response");
      this.sendButton.setAttr("title", this.cancelPending ? "Canceling..." : "Cancel response");
      return;
    }
    this.sendButton.disabled = false;
    setIcon(this.sendButton, "send");
    this.sendButton.setAttr("aria-label", "Send message");
    this.sendButton.setAttr("title", "Send message");
  }

  private isCancellationError(error: unknown): boolean {
    const text = error instanceof Error
      ? error.message
      : (typeof error === "string" ? error : "");
    const lowered = text.toLowerCase();
    return (
      lowered.includes("request canceled") ||
      lowered.includes("request cancelled") ||
      lowered.includes("request aborted") ||
      lowered.includes("python worker request aborted") ||
      lowered.includes("client_disconnected")
    );
  }

  private async handleSendButtonClick(): Promise<void> {
    if (this.busy) {
      if (this.cancelPending) {
        return;
      }
      this.cancelPending = true;
      this.updateSendButtonState();
      const canceled = this.plugin.cancelActiveRagQuery();
      if (!canceled) {
        this.cancelPending = false;
        this.updateSendButtonState();
      }
      return;
    }
    await this.handleSend();
  }

  private async handleSend(): Promise<void> {
    if (this.busy) {
      return;
    }
    const query = this.inputEl.value.trim();
    if (!query) {
      new Notice("Query cannot be empty.");
      return;
    }
    if (!this.plugin.settings.chatBaseUrl) {
      new Notice("Chat base URL must be set in settings.");
      return;
    }

    this.inputEl.value = "";
    this.clearMentionPickerDebounce();
    this.closeMentionOverlay();
    this.busy = true;
    this.cancelPending = false;
    this.updateSendButtonState();

    const userMessage: ChatMessage = {
      id: this.generateId(),
      role: "user",
      content: query,
      createdAt: new Date().toISOString(),
    };
    this.messages.push(userMessage);
    await this.renderMessage(userMessage);
    this.scrollToBottom();
    await this.saveHistory();

    const assistantMessage: ChatMessage = {
      id: this.generateId(),
      role: "assistant",
      content: "",
      citations: [],
      createdAt: new Date().toISOString(),
    };
    this.messages.push(assistantMessage);
    this.pendingThinking.add(assistantMessage.id);
    await this.renderMessage(assistantMessage);
    this.scrollToBottom();

    let sawDelta = false;
    let wasCanceled = false;
    const historyMessages = this.plugin.getRecentChatHistory(this.messages.slice(0, -2));
    try {
      await this.plugin.runRagQueryStreaming(
        query,
        (delta) => {
          this.pendingThinking.delete(assistantMessage.id);
          sawDelta = true;
          assistantMessage.content += delta;
          this.scheduleRender(assistantMessage);
        },
        (finalPayload) => {
          this.pendingThinking.delete(assistantMessage.id);
          if (finalPayload?.canceled) {
            wasCanceled = true;
            if (!sawDelta && !assistantMessage.content.trim()) {
              assistantMessage.content =
                typeof finalPayload?.answer === "string" && finalPayload.answer.trim()
                  ? finalPayload.answer
                  : "Request canceled.";
            }
            this.scheduleRender(assistantMessage);
            return;
          }
          if (!sawDelta && finalPayload?.answer) {
            assistantMessage.content = finalPayload.answer;
          } else if (finalPayload?.answer) {
            assistantMessage.content = finalPayload.answer;
          }
          if (Array.isArray(finalPayload?.citations)) {
            assistantMessage.citations = finalPayload.citations;
          }
          if (Array.isArray(finalPayload?.retrieved)) {
            assistantMessage.retrieved = finalPayload.retrieved;
          }
          this.scheduleRender(assistantMessage);
        },
        historyMessages
      );
    } catch (error) {
      console.error(error);
      this.pendingThinking.delete(assistantMessage.id);
      if (wasCanceled || this.isCancellationError(error)) {
        if (!sawDelta && !assistantMessage.content.trim()) {
          assistantMessage.content = "Request canceled.";
        }
      } else {
        assistantMessage.content = "Failed to fetch answer. See console for details.";
      }
      this.scheduleRender(assistantMessage);
    } finally {
      this.pendingThinking.delete(assistantMessage.id);
      this.busy = false;
      this.cancelPending = false;
      this.updateSendButtonState();
      await this.saveHistory();
    }
  }

  private generateId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private scheduleZoteroMentionPicker(): void {
    if (this.busy) {
      this.closeMentionOverlay();
      return;
    }
    const context = this.getMentionContextAtCursor();
    if (context && context.query.length === 0) {
      this.clearMentionPickerDebounce();
      void this.updateMentionSuggestions();
      return;
    }
    this.clearMentionPickerDebounce();
    this.mentionDebounceHandle = window.setTimeout(() => {
      this.mentionDebounceHandle = null;
      void this.updateMentionSuggestions();
    }, 180);
  }

  private clearMentionPickerDebounce(): void {
    if (this.mentionDebounceHandle !== null) {
      window.clearTimeout(this.mentionDebounceHandle);
      this.mentionDebounceHandle = null;
    }
  }

  private getMentionContextAtCursor(): { from: number; to: number; query: string } | null {
    const value = this.inputEl.value;
    const cursor = this.inputEl.selectionStart ?? value.length;
    const before = value.slice(0, cursor);
    const after = value.slice(cursor);
    const lastWhitespace = before.search(/\S+$/);
    const from = lastWhitespace === -1 ? cursor : lastWhitespace;
    const nextWhitespaceOffset = after.search(/\s/);
    const to = nextWhitespaceOffset === -1 ? value.length : cursor + nextWhitespaceOffset;
    const token = value.slice(from, to);
    if (!token || !token.startsWith("@")) {
      return null;
    }
    const query = token.slice(1).trim();
    return { from, to, query };
  }

  private async updateMentionSuggestions(): Promise<void> {
    if (this.busy) {
      this.closeMentionOverlay();
      return;
    }
    const context = this.getMentionContextAtCursor();
    if (!context) {
      this.closeMentionOverlay();
      return;
    }
    const sequence = ++this.mentionQuerySequence;
    try {
      const suggestions = await this.searchIndexedMentionItems(context.query);
      if (sequence !== this.mentionQuerySequence) {
        return;
      }
      this.mentionContext = context;
      this.mentionSuggestions = suggestions;
      this.mentionSelectedIndex = 0;
      this.renderMentionOverlay();
    } catch (error) {
      console.error("Failed to fetch mention suggestions", error);
      this.closeMentionOverlay();
    }
  }

  private async searchIndexedMentionItems(query: string): Promise<ZoteroLocalItem[]> {
    return this.plugin.searchIndexedZoteroItems(query.trim(), 8);
  }

  private getMentionIconName(item: ZoteroLocalItem): string {
    const itemType = typeof item.data?.itemType === "string" ? item.data.itemType.trim() : "";
    return ZOTERO_ITEM_TYPE_ICON_MAP[itemType] ?? "file-text";
  }

  private insertSelectedMention(item: ZoteroLocalItem, context: { from: number; to: number }): void {
    const docId = getDocIdFromItem(item);
    const rawTitle = typeof item.data?.title === "string" ? item.data.title.trim() : "";
    const title = rawTitle || "Untitled";
    const replacement = docId ? `"${title}" (doc_id ${docId})` : `"${title}"`;
    const value = this.inputEl.value;
    const next = `${value.slice(0, context.from)}${replacement}${value.slice(context.to)}`;
    this.inputEl.value = next;
    const caret = context.from + replacement.length;
    this.inputEl.setSelectionRange(caret, caret);
    this.inputEl.focus();
    this.closeMentionOverlay();
  }

  private createMentionOverlay(): void {
    this.mentionOverlayEl = this.inputWrapEl.createDiv({ cls: "zrr-chat-mention-overlay" });
    this.mentionOverlayEl.setAttr("role", "listbox");
    this.mentionOverlayEl.setAttr("aria-label", "Indexed Zotero citation suggestions");
    this.mentionListEl = this.mentionOverlayEl.createDiv({ cls: "zrr-chat-mention-list" });
    this.mentionEmptyEl = this.mentionOverlayEl.createDiv({
      cls: "zrr-chat-mention-empty",
      text: "No indexed Zotero notes found.",
    });
    this.closeMentionOverlay();
  }

  private renderMentionOverlay(): void {
    if (!this.mentionOverlayEl || !this.mentionListEl || !this.mentionEmptyEl || !this.mentionContext) {
      return;
    }
    this.mentionListEl.empty();
    const hasSuggestions = this.mentionSuggestions.length > 0;
    this.mentionEmptyEl.toggleClass("is-visible", !hasSuggestions);
    if (!hasSuggestions) {
      this.mentionOverlayEl.addClass("is-open");
      return;
    }

    this.mentionSuggestions.forEach((item, index) => {
      const option = this.mentionListEl!.createDiv({ cls: "zrr-chat-mention-item" });
      if (index === this.mentionSelectedIndex) {
        option.addClass("is-active");
      }
      option.setAttr("role", "option");
      option.setAttr("aria-selected", index === this.mentionSelectedIndex ? "true" : "false");

      const iconEl = option.createSpan({ cls: "zrr-chat-mention-icon" });
      setIcon(iconEl, this.getMentionIconName(item));
      const textWrap = option.createDiv({ cls: "zrr-chat-mention-text" });
      const title = typeof item.data?.title === "string" && item.data.title.trim() ? item.data.title.trim() : "Untitled";
      textWrap.createDiv({ cls: "zrr-chat-mention-title", text: title });
      const docId = getDocIdFromItem(item);
      const itemType = typeof item.data?.itemType === "string" ? item.data.itemType.trim() : "";
      const metaParts = [docId ? `doc_id ${docId}` : "No doc_id"];
      if (itemType) {
        metaParts.push(itemType);
      }
      textWrap.createDiv({ cls: "zrr-chat-mention-meta", text: metaParts.join(" - ") });

      option.addEventListener("mousedown", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!this.mentionContext) {
          return;
        }
        this.insertSelectedMention(item, this.mentionContext);
      });
    });

    this.mentionOverlayEl.addClass("is-open");
  }

  private closeMentionOverlay(): void {
    this.mentionSuggestions = [];
    this.mentionSelectedIndex = 0;
    this.mentionContext = null;
    if (this.mentionOverlayEl) {
      this.mentionOverlayEl.removeClass("is-open");
    }
  }

  private handleMentionOverlayKeydown(event: KeyboardEvent): boolean {
    if (!this.mentionOverlayEl?.hasClass("is-open") || !this.mentionContext) {
      if (event.key === "Escape") {
        this.closeMentionOverlay();
      }
      return false;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (this.mentionSuggestions.length > 0) {
        this.mentionSelectedIndex = (this.mentionSelectedIndex + 1) % this.mentionSuggestions.length;
        this.renderMentionOverlay();
      }
      return true;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (this.mentionSuggestions.length > 0) {
        this.mentionSelectedIndex =
          (this.mentionSelectedIndex - 1 + this.mentionSuggestions.length) % this.mentionSuggestions.length;
        this.renderMentionOverlay();
      }
      return true;
    }
    if (event.key === "Enter" || event.key === "Tab") {
      if (this.mentionSuggestions.length === 0) {
        return false;
      }
      event.preventDefault();
      const selected = this.mentionSuggestions[this.mentionSelectedIndex] ?? this.mentionSuggestions[0];
      if (!selected || !this.mentionContext) {
        return true;
      }
      this.insertSelectedMention(selected, this.mentionContext);
      return true;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      this.closeMentionOverlay();
      return true;
    }
    return false;
  }
}

class RenameChatModal extends Modal {
  private initialValue: string;
  private onSubmit: (value: string) => Promise<void> | void;

  constructor(app: App, initialValue: string, onSubmit: (value: string) => Promise<void> | void) {
    super(app);
    this.initialValue = initialValue;
    this.onSubmit = onSubmit;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("zrr-chat-rename-modal");
    contentEl.createEl("h3", { text: "Rename chat" });

    let value = this.initialValue;
    new Setting(contentEl)
      .setName("Name")
      .addText((text) => {
        text.setValue(value);
        text.onChange((next) => {
          value = next;
        });
      });

    const buttons = contentEl.createEl("div");
    buttons.addClass("zrr-u-display-flex");
    buttons.addClass("zrr-u-gap-0-5rem");
    buttons.addClass("zrr-u-margin-top-1rem");
    const cancel = buttons.createEl("button", { text: "Cancel" });
    cancel.addEventListener("click", () => this.close());

    const save = buttons.createEl("button", { text: "Save" });
    save.addEventListener("click", () => {
      const trimmed = value.trim();
      if (!trimmed) {
        new Notice("Name cannot be empty.");
        return;
      }
      this.close();
      void Promise.resolve(this.onSubmit(trimmed));
    });
  }
}

class ConfirmDeleteChatModal extends Modal {
  private chatName: string;
  private onConfirm: () => Promise<void> | void;

  constructor(app: App, chatName: string, onConfirm: () => Promise<void> | void) {
    super(app);
    this.chatName = chatName;
    this.onConfirm = onConfirm;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: "Delete chat" });
    contentEl.createEl("p", { text: `Delete "${this.chatName}"? This cannot be undone.` });

    const buttons = contentEl.createEl("div");
    buttons.addClass("zrr-u-display-flex");
    buttons.addClass("zrr-u-gap-0-5rem");
    buttons.addClass("zrr-u-margin-top-1rem");
    const cancel = buttons.createEl("button", { text: "Cancel" });
    cancel.addEventListener("click", () => this.close());

    const confirm = buttons.createEl("button", { text: "Delete" });
    confirm.addEventListener("click", () => {
      this.close();
      void Promise.resolve(this.onConfirm());
    });
  }
}

class ConfirmDeleteMessageModal extends Modal {
  private onResolve: (confirmed: boolean) => void;
  private resolved = false;

  constructor(app: App, onResolve: (confirmed: boolean) => void) {
    super(app);
    this.onResolve = onResolve;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: "Delete message" });
    contentEl.createEl("p", { text: "Delete this message? This cannot be undone." });

    const buttons = contentEl.createEl("div");
    buttons.addClass("zrr-u-display-flex");
    buttons.addClass("zrr-u-gap-0-5rem");
    buttons.addClass("zrr-u-margin-top-1rem");

    const cancel = buttons.createEl("button", { text: "Cancel" });
    cancel.addEventListener("click", () => {
      this.resolved = true;
      this.close();
      this.onResolve(false);
    });

    const confirm = buttons.createEl("button", { text: "Delete" });
    confirm.addEventListener("click", () => {
      this.resolved = true;
      this.close();
      this.onResolve(true);
    });
  }

  onClose(): void {
    if (!this.resolved) {
      this.onResolve(false);
    }
  }
}
