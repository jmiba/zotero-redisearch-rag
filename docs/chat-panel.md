# Chat Panel

The chat panel lets you ask questions across your indexed library and keep conversations in Obsidian.

## Open the chat view
Use the command palette:

- **Open Zotero Research Assistant chat panel**

The panel opens in Obsidian (right sidebar by default).

## Manage sessions
Chats are saved as sessions so you can pick up where you left off.
- **New chat**: Start a fresh session.
- **Rename**: Give the current session a better title.
- **Delete**: Remove the current session (you must keep at least one).

Use the sort button next to the session selector to choose name, last-modified, or created-time ordering. The selected sort order is saved and the default is most recently updated first.

While a response is still streaming, session switching and session-management actions are disabled. Finish or cancel the current response first so chat history from one session cannot affect another in-flight request.

## Copy a chat to a note
Click **Copy** to export the current session to a Markdown note. The note is saved in your **Saved chats folder** (configurable in settings).

## History and citations
- The chat uses recent messages for conversational continuity.
- If **Rewrite follow-up queries** is enabled, recent chat history is also used to rewrite the current message into a standalone retrieval query before search.
- Answers include citations that link back to the exact chunks used.
- If the retrieved chunks don’t contain enough information, the model is instructed to say it doesn’t know.
