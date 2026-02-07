# Docker Setup

This guide explains how to configure Docker (or Podman) so the plugin can start Redis Stack reliably.

## 1) Install And Start Docker/Podman

Install one of:

- Docker Desktop
- Podman (+ Compose support)

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

## 2) Configure File Sharing

If you use Docker Desktop or Podman Desktop, ensure your vault path is shared/mountable.

If file sharing is missing, Redis startup usually fails with mount errors (for example, `Mounts denied` or `operation not permitted`).

## 3) Configure Plugin Prerequisites

In **Settings → Prerequisites**:

- **Docker/Podman path**: set the CLI binary (`docker`/`podman` or full path).
- **Redis URL**: keep default unless you run your own Redis.
- **Auto-assign Redis port**: recommended to avoid port conflicts across vaults.
- **Auto-start Redis stack**: enable if you want automatic startup when needed.

Then click **Start Redis stack now** once to validate setup.

## 4) Verify Redis Container Startup

If needed, run:

```bash
docker compose config
docker compose pull redis-stack
docker compose up -d redis-stack
docker compose ps -a
docker compose logs redis-stack
```

## Common Pitfalls

- **Daemon not running**: CLI exists but Docker/Podman engine is stopped.
- **Wrong binary path**: plugin points to a non-working executable.
- **Compose unavailable**: Podman needs `podman compose` or `podman-compose`.
- **Port conflict**: `6379` already in use (enable **Auto-assign Redis port**).
- **Invalid override paths**: custom Redis data/project override folders are missing or not writable.
- **Network/auth issues**: image pull blocked by proxy, firewall, or credential errors.
