# PDF Handling

This section explains how the plugin works with PDFs and how it keeps your note and PDF in sync.

## Copy PDFs to vault vs. link to Zotero
You can choose whether PDFs are stored in your vault or linked directly from Zotero.

- **Copy PDFs to vault = ON**
  - The PDF is copied into your vault and linked from the note.
  - This makes the PDF available inside Obsidian even if Zotero is closed.

- **Copy PDFs to vault = OFF**
  - The note links directly to the Zotero attachment.
  - This is useful if you want to keep the PDF and annotations inside Zotero.

If the local PDF path is unavailable, the plugin temporarily copies the PDF into your vault to process it and lets you know.

## OCR‑layered PDF copy
When OCR is used (cf. [OCR section](settings-reference.md#ocr)), you can optionally create an OCR‑layered PDF. This writes a new, searchable PDF with a text layer (requires Tesseract + Poppler).

- Works only when **Copy PDFs to vault** is enabled.
- The OCR‑layered PDF replaces the vault copy so citations can open the searchable file.

### Install Tesseract + Poppler
These tools are required for creating OCR‑layered PDFs.

- macOS (Homebrew):

  ```bash
  brew install tesseract poppler
  ```
- Windows (Chocolatey):

  ```powershell
  choco install tesseract poppler
  ```
- Ubuntu/Debian:

  ```bash
  sudo apt-get install tesseract-ocr poppler-utils
  ```

## PDF sidebar auto‑sync and preview scroll sync
The plugin can sync the PDF view to the chunk you’re reading in your note.

- When you scroll a synced note, the PDF sidebar jumps to the matching page or section.
- In Reading view, preview scroll sync keeps the PDF aligned as you scroll.

This makes it easy to move between the extracted text in your note and the original PDF page.
