# Companion Addon

The Zotero companion add-on exposes cached annotation images that Zotero's regular HTTP APIs do not return.

It is optional and local only. The Obsidian plugin uses it when annotation image embedding is enabled and Zotero APIs cannot provide image or ink annotation payloads directly.

## Addon Runtime

The add-on runs inside Zotero and binds a local server socket to the configured loopback port.

`zotero-companion/addon/bootstrap.js` registers the preference pane, observes port and token preferences, starts or restarts the server, parses basic HTTP requests, and logs status to Zotero.

Default preferences are declared in `zotero-companion/addon/prefs.js`.

## Health Endpoint

The health endpoint is the lightweight readiness check used by the Obsidian plugin.

`GET /health` returns JSON `{ "ok": true }` when the add-on server is reachable and authorized. `src/main.ts` exposes this through the command `Check Zotero companion status`.

## Image Endpoint

The image endpoint returns a PNG payload for a cached Zotero image or ink annotation.

`GET /annotations/<KEY>/image` looks up the annotation by library and key, verifies it is an annotation item of type `image` or `ink`, reads `Zotero.Annotations.getCacheImagePath`, and returns `image/png`. Missing annotations, wrong types, or missing cache files return 404.

The Obsidian side writes successful images into the note attachment area described in [[zotero-sync#Annotation Images]].

## Token Authorization

The companion token is optional, but when set it is required for every request.

The add-on accepts `Authorization: Bearer <token>` or `X-ZRR-Token: <token>`. The Obsidian plugin sends the configured token when fetching health or annotation image endpoints.

## Distribution

The add-on is distributed as `zotero-companion/zrr-companion.xpi` with an update manifest in the repo.

Publishing requires bumping the add-on manifest version, rebuilding the XPI from `zotero-companion/addon/`, updating the hash in `zotero-companion/updates.json`, and committing both generated artifacts.

