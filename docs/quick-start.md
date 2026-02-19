# Quick Start

This page walks you through a minimal, working setup so you can import a Zotero item and ask your first question.

## Prerequisites
- Obsidian (desktop)
- Zotero 7 or 8 (desktop)
- Docker Desktop or Podman (for Redis Stack)
- A local or cloud OpenAI-compatible model provider

## 1) Enable the Zotero local API (read-only)
In Zotero:

1. Open **Settings → Advanced**.
2. Enable **Allow other applications on this computer to communicate with Zotero**.

No API key is needed for the local API.

## 2) Install the plugin
Recommended:

1. Download the latest release zip.
2. Unzip into your vault at:

   - `<vault>/.obsidian/plugins/zotero-redisearch-rag/`
3. Ensure the folder contains `main.js`, `manifest.json`, `versions.json`, and `tools/`.

Alternatives:

- **BRAT**: Use BRAT to install `jmiba/zotero-redisearch-rag`.
- **Build from source**:

  ```bash
  npm install
  npm run build
  ```
  Then copy the plugin folder into your vault as above.

## 3) Start Redis Stack
In Obsidian, run:

- **Command palette → Start Redis Stack (Docker/Podman Compose)**

If Docker or Podman isn’t running, start it first.

## 4) Start a model provider
Use any OpenAI‑compatible local server or a cloud provider.

Local options:

- **LM Studio**: start the server and note the **model ID** shown in LM Studio.
- **Ollama**: start the daemon and use the OpenAI‑compatible endpoint at `http://localhost:11434/v1`.

Cloud options:

- **OpenAI** or **OpenRouter** with your API key.

## 5) Set up Python for Docling
Default (recommended):

1. Open **Settings → Community plugins → Zotero Redis RAG → Prerequisites**.
2. Set **Python runtime** to **Python worker container (recommended)**.
3. Click **Start Redis stack now**.
4. Wait for startup to finish (first run may take longer while worker dependencies install).

Fallback (terminal, local runtime mode only):

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

For full details, see [Python Setup](python-setup.md).

## 6) Configure the plugin
Open **Settings → Community plugins → Zotero Redis RAG** and set:

- **Prerequisites**: Python runtime, Docker/Podman path, Redis URL
- **LLM provider profiles** (optional but recommended)
- **Embeddings** and **Chat** models
- **Output folders** (PDFs, notes, chats)

> [!TIP]
> **Templating**: Customize note frontmatter/body with placeholders. See [Templating reference](templating-reference.md).

## 7) Import your first item
Run:

- **Command palette → Import Zotero item and index (Docling → RedisSearch)**

Pick an item with a PDF attachment. The plugin will create a note and index its chunks.

## 8) Ask your first question
Run:

- **Command palette → Ask my Zotero library (RAG via RedisSearch)**

Answers include citations that link back to the exact chunk in your note or PDF.

---

If you want a deeper walkthrough, continue to **How It Works** and **Daily Workflow**.
