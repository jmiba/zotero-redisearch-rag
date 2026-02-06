# Troubleshooting

This page lists common issues and how to resolve them.

## Common errors and fixes
- **“No such index idx:zotero”**
  - Start Redis Stack and run **Reindex Redis from cached chunks**.

- **“Failed to sync bundled tools”**
  - Restart Obsidian and try again. If it persists, reinstall the plugin.

- **“No PDF attachment found for item”**
  - The selected Zotero item doesn’t have a PDF attachment. Add one in Zotero and re‑import.

## Redis index mismatch and reindex
If you change embedding models or the index schema gets out of sync, you may see errors about embedding dimensions or missing fields.

Fix:

1. Run **Drop & rebuild Redis index**.
2. Then run **Reindex Redis from cached chunks**.

This rebuilds the Redis index using your current settings.

## Model identifier issues
- **LM Studio**: Use the exact **model ID** shown in LM Studio, not the repository name.
- **Ollama**: Use the OpenAI‑compatible endpoint and a model name that exists in Ollama.

If model refresh fails, double‑check the base URL and API key in the provider profile.

## OCR quality problems and cleanup
If OCR output is noisy or incomplete:

- Switch **OCR mode** to “OCR only if text is poor” or “Always OCR.”
- Try a different **OCR engine** (Tesseract vs. Paddle options).
- Enable **OCR cleanup** with an LLM to improve low‑quality text.

For scanned PDFs, installing Tesseract + Poppler improves OCR accuracy.

## Redis Stack start failures

Docker/Podman will **pull** the image (if missing) and then create a container.
If no Redis container appears (or it exits immediately), common causes to check:

- **Missing file sharing configuration**: Docker Desktop/Podman Desktop must allow mounting your vault path (and plugin/tools path if separate). Typical errors include `Mounts denied` or `operation not permitted`.
- **Docker/Podman isn’t running**: The CLI exists, but the daemon is stopped.
- **Wrong Docker/Podman path**: The plugin points to a non‑working binary.
- **Compose not available**: Podman needs `podman compose` or `podman-compose`.
- **Image pull failed**: Network issue, registry auth/rate limit, or blocked access.
- **Port conflict**: Redis port is already in use (enable Auto‑assign Redis port).
- **Stale containers**: An old Redis container or project name is conflicting.
- **Vault path not accessible**: Vault is on an external drive or blocked path.
- **Data directory not writable**: `.obsidian/zotero-redisearch-rag/redis-data` can’t be created.
- **Invalid bind mount/config path**: For example, `./redis-stack.conf` is missing or unreadable.
- **Redis config/startup error**: Container is created, then exits because Redis fails to start.

Quick checks:

```bash
docker compose config
docker compose pull redis-stack
docker compose up -d redis-stack
docker compose ps -a
docker compose logs redis-stack
```
