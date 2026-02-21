# Python Setup

This guide explains how Python is provided for Docling tools in Zotero Redis RAG.

## Recommended mode: Python worker container

The plugin now supports a dedicated `python-worker` service (separate from Redis).

1. Open **Settings → Community plugins → Zotero Redis RAG → Prerequisites**.
2. Keep **Advanced Python runtime options** disabled (default).
3. Ensure **Docker/Podman path** is correct.
4. Click **Start Redis stack now**.
5. Wait until startup finishes (first run can take longer while Python deps are installed in the worker venv).

Migration note:
- Legacy installs that previously used implicit local runtime defaults are migrated to worker mode automatically.
- Existing local settings are preserved and can be restored with **Use local runtime (legacy)**.

In this mode:

- No local Python install is required for plugin runtime.
- Redis and Python stay in separate containers.
- Python dependencies are installed into a persistent worker venv.
- OCR binaries are inside the worker image (`tesseract`, `poppler`), with Tesseract language packs
  defaulting to `eng deu fra spa ita nld por pol swe` (override via `ZRR_TESSERACT_LANG_PACKS`).

## Local fallback mode (optional)

Use this if you explicitly want local Python execution.

Prerequisites:

- Python `3.11` to `3.13`
- `pip` available for that Python

In settings:

1. Enable **Settings → Prerequisites → Advanced Python runtime options**.
2. Set **Python runtime** to **Local interpreter/venv**.
3. (Optional) Set **Python path** if auto-detection is wrong.
4. Choose **Python env location** (`Shared user cache` recommended).
5. Click **Python environment → Create/Update**.

Alternative shortcut:
- **Settings → Maintenance → Python Runtime → Use local runtime (legacy)**.

Terminal fallback:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Then set **Python path** to:

- macOS/Linux: `.venv/bin/python`
- Windows: `.venv\Scripts\python.exe`

## Verify

1. Run **Import Zotero item and index (Docling → RedisSearch)** on a small PDF.
2. If extraction fails, inspect logs in **Maintenance → Logs** and container logs (`python-worker`) if using worker mode.

## Common pitfalls

- **Docker/Podman not running**: worker mode cannot start.
- **File sharing not configured**: worker cannot access mounted vault/plugin paths.
- **Worker startup still in progress**: first start may take time due dependency installation.
- **Unsupported local Python version**: local mode works with Python 3.11–3.13.
