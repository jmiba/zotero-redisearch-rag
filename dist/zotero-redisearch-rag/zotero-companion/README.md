# Zotero Redis RAG Companion

This companion plugin exposes a local HTTP endpoint for cached Zotero annotation images.
It is intended to be used by the Obsidian plugin in this repo.

## Install

1. Use the bundled `zotero-companion/zrr-companion.xpi` from this repo (or build one by zipping `zotero-companion/addon/` so `manifest.json` and `bootstrap.js` are at the zip root).
2. In Zotero: Tools -> Add-ons -> Install Add-on From File.
3. Restart Zotero.

## Endpoints

- `GET /health` -> `{ ok: true }`
- `GET /annotations/<KEY>/image` -> `image/png` (404 if missing)

Server binds to `127.0.0.1:23120` by default.

## Preferences (about:config)

- `extensions.zrr_companion.port` (int, default `23120`)
- `extensions.zrr_companion.token` (string, default empty)

If a token is set, requests must include `Authorization: Bearer <token>` or `X-ZRR-Token: <token>`.

## Settings UI

Open Zotero's settings dialog and scroll to the "Zotero Redis RAG Companion" section.

## Updates

The add-on uses a Zotero `update_url` pointing to `zotero-companion/updates.json` in this repo.
To publish an update, bump the manifest version, rebuild `zrr-companion.xpi`, update the hash in `updates.json`,
and push both files to the repository.
