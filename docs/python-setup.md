# Python Setup

This guide explains how to set up Python for Docling tools used by Zotero Redis RAG.

## Prerequisites

- Python `3.11` to `3.13`
- `pip` available for that Python

Quick check:

```bash
python3 --version
python3 -m pip --version
```

## 1) Default setup: use the settings button (recommended)

In Obsidian plugin settings:

1. Open **Settings → Community plugins → Zotero Redis RAG → Prerequisites**.
2. (Optional) Set **Python path** if auto-detection does not find the right interpreter.
3. Choose **Python env location**:
   - `Shared user cache` (recommended), or
   - `Plugin folder (.venv)`
4. Click **Python environment → Create/Update**.
5. Wait for the success notice (`Python environment ready.`).

This is the default path and should be used first.

Why `Shared user cache` is recommended:

- It keeps the Python environment outside the vault, so Obsidian sync tools do not try to sync large venv files.
- It reduces sync conflicts/churn across devices.

## 2) Fallback: create `.venv` in terminal

Use this only if the settings-button flow fails.

From the plugin directory:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Then set **Python path** to your venv interpreter:

- macOS/Linux: `.venv/bin/python`
- Windows: `.venv\Scripts\python.exe`

## 3) Verify

1. Run **Import Zotero item and index (Docling → RedisSearch)** on a small PDF.
2. If extraction fails, open logs in **Maintenance → Logs**.

## Common pitfalls

- **Unsupported Python version**: 3.10 or 3.14 may fail with dependencies.
- **Wrong interpreter path**: points to a missing or stale virtual environment.
- **Create/Update fails**: set an explicit **Python path** and retry **Create/Update**.
- **`pip` install failed** (terminal fallback): retry inside the activated `.venv`.
- **Permission issues**: make sure Obsidian can read/write the plugin tools and cache folders.
