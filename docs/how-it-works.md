# How It Works

This plugin turns your Zotero PDFs into searchable notes inside Obsidian and then answers questions using only that material.

## The basic flow
1. You pick a Zotero item.
2. Docling extracts the text (OCR is used if the PDF is scanned or low‑quality).
3. The text is split into small pieces called chunks.
4. Each chunk is turned into an embedding (a numeric summary) and stored in Redis.
5. When you ask a question, the plugin finds the most relevant chunks and the LLM writes an answer.
6. The answer includes citations that link back to those exact chunks.

## What “chunks” mean
A chunk is a small, readable slice of the PDF text, usually one page or a section. Chunks keep the search precise and make it possible to jump straight to the source. You can edit chunk text in your note, and only the changed chunks are re‑indexed.

## What “citations” mean
A citation is a link to the exact chunk used to write the answer. Clicking it takes you back to the source in your note or PDF. This makes it easy to verify the answer and read the surrounding context.

## What “doc_id” means
`doc_id` is the internal ID the plugin assigns to a Zotero item. It ties everything together: the Zotero metadata, the note, the cached chunks, and the Redis index. You usually don’t need to use it directly, but you may see it in sync markers or logs.

## Why answers are grounded
The plugin only gives the LLM the chunks it retrieved from your library. The model is instructed to use that material for facts and to say “I don’t know” if the chunks don’t contain enough information. This keeps answers tied to your sources instead of general web knowledge.
