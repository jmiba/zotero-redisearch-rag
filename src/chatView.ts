import { ItemView, MarkdownRenderer, Notice, WorkspaceLeaf } from "obsidian";
import type ZoteroRagPlugin from "./main";

export const VIEW_TYPE_ZOTERO_CHAT = "zotero-redisearch-rag-chat";

export type ChatCitation = {
  doc_id: string;
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
  createdAt: string;
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
  private clearButton!: HTMLButtonElement;
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

  async onOpen(): Promise<void> {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("zrr-chat-view");

    const header = containerEl.createEl("div", { cls: "zrr-chat-header" });
    header.createEl("div", { cls: "zrr-chat-title", text: "Zotero RAG Chat" });
    this.clearButton = header.createEl("button", { cls: "zrr-chat-clear", text: "Clear" });
    this.clearButton.addEventListener("click", () => this.clearChat());

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

    await this.loadHistory();
    await this.renderAll();
  }

  focusInput(): void {
    this.inputEl?.focus();
  }

  private async loadHistory(): Promise<void> {
    try {
      this.messages = await this.plugin.loadChatHistory();
    } catch (error) {
      console.error(error);
      this.messages = [];
    }
  }

  private async saveHistory(): Promise<void> {
    try {
      await this.plugin.saveChatHistory(this.messages);
    } catch (error) {
      console.error(error);
    }
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
    meta.setText(message.role === "user" ? "You" : "Assistant");
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
    els.content.empty();
    els.citations.empty();

    await MarkdownRenderer.renderMarkdown(message.content || "", els.content, "", this.plugin);

    if (message.citations && message.citations.length > 0) {
      const citationsMarkdown = this.plugin.formatCitationsMarkdown(message.citations);
      if (citationsMarkdown) {
        const label = els.citations.createEl("div", { cls: "zrr-chat-citations-label", text: "Citations" });
        label.addClass("zrr-chat-citations-label");
        await MarkdownRenderer.renderMarkdown(citationsMarkdown, els.citations, "", this.plugin);
      }
    }
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
          this.scheduleRender(assistantMessage);
        }
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

  private async clearChat(): Promise<void> {
    this.messages = [];
    await this.saveHistory();
    await this.renderAll();
  }

  private generateId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
