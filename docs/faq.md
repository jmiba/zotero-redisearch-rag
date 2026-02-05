# FAQ

## Why do I need Redis?
Redis Stack provides a fast vector index so the plugin can find relevant chunks quickly. It keeps the search local and responsive.

## Why does the plugin create chunk markers in my notes?
Chunk markers tell the plugin which text is synced and where each chunk starts and ends. This lets it reindex only what changed instead of reprocessing the whole document.

## Why do answers sometimes say “I don’t know”?
The model is instructed to use only the retrieved chunks. If the chunks don’t contain enough information, it will say it doesn’t know instead of guessing.

## Can I edit the notes?
Yes. You can edit inside chunks. Just avoid deleting the chunk markers unless you want to remove that chunk from sync.

## Performance tips
- Use a smaller, faster embedding model for large libraries.
- Enable **Auto‑assign Redis port** for multi‑vault setups.
- Reindex from cache instead of re‑running OCR when possible.
- If queries feel slow, consider enabling a local LLM server and embeddings model.
