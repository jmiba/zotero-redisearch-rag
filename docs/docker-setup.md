# Docker Setup

This guide explains how to configure Docker (or Podman) so the plugin can start Redis Stack and the Python worker reliably.

## 1) Install and start Docker/Podman

Install one of:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Podman](https://podman.io) (+ Compose support)

Start the daemon/runtime before using the plugin.

Quick checks:

```bash
docker version
docker compose version
```

For Podman:

```bash
podman version
podman compose version
```

## 2) Configure file sharing

If you use Docker Desktop or Podman Desktop, ensure your vault path is shared/mountable.

If file sharing is missing, Redis startup usually fails with mount errors (for example, `Mounts denied` or `operation not permitted`).

## 3) Configure plugin prerequisites

In **Settings → Prerequisites**:

- **Docker/Podman path**: set the CLI binary (`docker`/`podman` or full path).
- **Advanced Python runtime options**: keep disabled (default) for worker runtime.
- **Redis URL**: keep default unless you run your own Redis.
- **Auto-assign Redis port**: recommended to avoid port conflicts across vaults.
- **Auto-start Redis stack**: enable if you want automatic startup when needed.

Then click **Start Redis stack now** once to validate setup.

Important first-start note:

- The first startup can take several minutes because Docker/Podman may need to pull base images and build worker dependencies.
- On slower connections or machines, this can take 10+ minutes.

Optional: customize OCR language packs baked into the worker image with `ZRR_TESSERACT_LANG_PACKS`.
Default is `eng deu fra spa ita nld por pol swe`.

Example:

```bash
export ZRR_TESSERACT_LANG_PACKS="eng deu fra"
docker compose build python-worker
docker compose up -d redis-stack python-worker
```

## 4) Verify Redis + Python worker startup

If needed, run:

```bash
docker compose config
docker compose pull redis-stack
docker compose up -d redis-stack python-worker
docker compose ps -a
docker compose logs redis-stack
docker compose logs python-worker
```

## Common pitfalls

- **Daemon not running**: CLI exists but Docker/Podman engine is stopped.
- **Wrong binary path**: plugin points to a non-working executable.
- **Compose unavailable**: Podman needs `podman compose` or `podman-compose`.
- **Port conflict**: `6379` already in use (enable **Auto-assign Redis port**).
- **Invalid override paths**: custom Redis data/project override folders are missing or not writable.
- **Multi-vault shared override conflict**: if two vaults use the same project/data-dir overrides, they share one compose project. In worker mode this can cause `/workspace/vault/...` missing-path errors when both vaults run concurrently.
- **Network/auth issues**: image pull blocked by proxy, firewall, or credential errors.

## Recommended multi-vault setup

- Prefer one compose project per vault.
- Keep **Auto-assign Redis port** enabled for multi-vault use, or set unique overrides per vault:
  - unique **Redis project name override**
  - unique **Redis data directory override**
- Only reuse identical overrides across vaults if you intentionally want one shared stack and accept single-active-vault import/reindex behavior.
