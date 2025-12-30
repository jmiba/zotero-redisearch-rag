import { App, ItemView, MarkdownRenderer, Modal, Notice, Setting, WorkspaceLeaf } from "obsidian";
import type ZoteroRagPlugin from "./main";

export const VIEW_TYPE_ZOTERO_CHAT = "zotero-redisearch-rag-chat";

export type ChatCitation = {
  doc_id: string;
  attachment_key?: string;
  chunk_id?: string;
  annotation_key?: string;
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
  page_start?: string | number;
  page_end?: string | number;
  source_pdf?: string;
  section?: string;
  score?: string | number;
  text?: string;
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
  private busy = false;

  constructor(leaf: WorkspaceLeaf, plugin: ZoteroRagPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE_ZOTERO_CHAT;
  }

  getDisplayText(): string {
    return "Zotero RAG Chat";
  }

  getIcon(): string {
    return "zrr-chat";
  }

  async onOpen(): Promise<void> {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("zrr-chat-view");

    const header = containerEl.createEl("div", { cls: "zrr-chat-header" });
    header.createEl("div", { cls: "zrr-chat-title", text: "Zotero RAG Chat" });
    const controls = header.createEl("div", { cls: "zrr-chat-controls" });
    const selectRow = controls.createEl("div", { cls: "zrr-chat-controls-row" });
    this.sessionSelect = selectRow.createEl("select", { cls: "zrr-chat-session" }) as HTMLSelectElement;
    this.sessionSelect.addEventListener("change", async () => {
      await this.switchSession(this.sessionSelect.value);
    });
    const buttonRow = controls.createEl("div", { cls: "zrr-chat-controls-row zrr-chat-controls-actions" });
    this.renameButton = buttonRow.createEl("button", {
      cls: "zrr-chat-rename",
      text: "Rename",
      attr: { title: "Rename the current chat" },
    });
    this.renameButton.addEventListener("click", async () => {
      await this.promptRenameSession();
    });
    this.copyButton = buttonRow.createEl("button", {
      cls: "zrr-chat-copy",
      text: "Copy",
      attr: { title: "Copy this chat to a new note" },
    });
    this.copyButton.addEventListener("click", async () => {
      await this.copyChatToNote();
    });
    this.deleteButton = buttonRow.createEl("button", {
      cls: "zrr-chat-delete",
      text: "Delete",
      attr: { title: "Delete this chat" },
    });
    this.deleteButton.addEventListener("click", async () => {
      await this.deleteChat();
    });
    this.newButton = buttonRow.createEl("button", {
      cls: "zrr-chat-new",
      text: "New chat",
      attr: { title: "Start a new chat session" },
    });
    this.newButton.addEventListener("click", async () => {
      await this.startNewChat();
    });

    this.messagesEl = containerEl.createEl("div", { cls: "zrr-chat-messages" });

    const inputWrap = containerEl.createEl("div", { cls: "zrr-chat-input" });
    this.inputEl = inputWrap.createEl("textarea", {
      cls: "zrr-chat-textarea",
      attr: { placeholder: "Ask your Zotero library..." },
    }) as HTMLTextAreaElement;
    this.sendButton = inputWrap.createEl("button", { cls: "zrr-chat-send", text: "Send" });
    this.sendButton.addEventListener("click", () => this.handleSend());
    this.inputEl.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        this.handleSend();
      }
    });

    await this.loadSessions();
    await this.loadHistory();
    await this.renderAll();
  }

  focusInput(): void {
    this.inputEl?.focus();
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

  private async loadSessions(): Promise<void> {
    const sessions = await this.plugin.listChatSessions();
    this.activeSessionId = await this.plugin.getActiveChatSessionId();
    this.sessionSelect.empty();
    for (const session of sessions) {
      const option = this.sessionSelect.createEl("option", { text: session.name }) as HTMLOptionElement;
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
  }

  private async promptRenameSession(): Promise<void> {
    const sessions = await this.plugin.listChatSessions();
    const current = sessions.find((s) => s.id === this.activeSessionId);
    const modal = new RenameChatModal(this.app, current?.name ?? "New chat", async (name) => {
      await this.plugin.renameChatSession(this.activeSessionId, name);
      await this.loadSessions();
    });
    modal.open();
  }

  private async startNewChat(): Promise<void> {
    await this.plugin.saveChatHistoryForSession(this.activeSessionId, this.messages);
    await this.plugin.finalizeChatSessionNameIfNeeded(this.activeSessionId, this.messages, { force: true });
    const sessionId = await this.plugin.createChatSession("New chat");
    await this.switchSession(sessionId, { skipSave: true });
  }

  private async deleteChat(): Promise<void> {
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
    for (const message of this.messages) {
      await this.renderMessage(message);
    }
    this.scrollToBottom();
  }

  private async renderMessage(message: ChatMessage): Promise<void> {
    const wrapper = this.messagesEl.createEl("div", {
      cls: `zrr-chat-message zrr-chat-${message.role}`,
    });
    const meta = wrapper.createEl("div", { cls: "zrr-chat-meta" });
    meta.setText(message.role === "user" ? "You" : "Zotero Assistant");
    const contentEl = wrapper.createEl("div", { cls: "zrr-chat-content" });
    const citationsEl = wrapper.createEl("div", { cls: "zrr-chat-citations" });
    this.messageEls.set(message.id, { wrapper, content: contentEl, citations: citationsEl });
    await this.renderMessageContent(message);
  }

  private scheduleRender(message: ChatMessage): void {
    if (this.pendingRender.has(message.id)) {
      return;
    }
    const handle = window.setTimeout(async () => {
      this.pendingRender.delete(message.id);
      await this.renderMessageContent(message);
      this.scrollToBottom();
    }, 80);
    this.pendingRender.set(message.id, handle);
  }

  private async renderMessageContent(message: ChatMessage): Promise<void> {
    const els = this.messageEls.get(message.id);
    if (!els) {
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
      await MarkdownRenderer.renderMarkdown(newContent, els.content, "", this.plugin);
      this.hookInternalLinks(els.content);
      els.content.dataset.lastRendered = newContent;
    }
    // Always update citations (they may change at end)
    els.citations.empty();
    await this.renderCitations(els.citations, message.citations ?? []);
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
    this.busy = true;
    this.sendButton.disabled = true;

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
    await this.renderMessage(assistantMessage);
    this.scrollToBottom();

    let sawDelta = false;
    const historyMessages = this.plugin.getRecentChatHistory(this.messages.slice(0, -2));
    try {
      await this.plugin.runRagQueryStreaming(
        query,
        (delta) => {
          sawDelta = true;
          assistantMessage.content += delta;
          this.scheduleRender(assistantMessage);
        },
        (finalPayload) => {
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
      assistantMessage.content = "Failed to fetch answer. See console for details.";
      this.scheduleRender(assistantMessage);
    } finally {
      this.busy = false;
      this.sendButton.disabled = false;
      await this.saveHistory();
    }
  }

  private generateId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

class RenameChatModal extends Modal {
  private initialValue: string;
  private onSubmit: (value: string) => void;

  constructor(app: App, initialValue: string, onSubmit: (value: string) => void) {
    super(app);
    this.initialValue = initialValue;
    this.onSubmit = onSubmit;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
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
    buttons.style.display = "flex";
    buttons.style.gap = "0.5rem";
    buttons.style.marginTop = "1rem";

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
      this.onSubmit(trimmed);
    });
  }
}

class ConfirmDeleteChatModal extends Modal {
  private chatName: string;
  private onConfirm: () => void;

  constructor(app: App, chatName: string, onConfirm: () => void) {
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
    buttons.style.display = "flex";
    buttons.style.gap = "0.5rem";
    buttons.style.marginTop = "1rem";

    const cancel = buttons.createEl("button", { text: "Cancel" });
    cancel.addEventListener("click", () => this.close());

    const confirm = buttons.createEl("button", { text: "Delete" });
    confirm.addEventListener("click", () => {
      this.close();
      this.onConfirm();
    });
  }
}
