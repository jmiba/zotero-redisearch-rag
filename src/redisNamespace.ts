import { createHash } from "crypto";
import path from "path";

const REDIS_NAMESPACE_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

export type RedisNamespaceResolution = {
  namespace: string;
  shouldPersist: boolean;
};

export function parseRedisNamespace(value: string): string | null {
  const normalized = String(value || "").trim().toLowerCase();
  if (!REDIS_NAMESPACE_PATTERN.test(normalized)) {
    return null;
  }
  return normalized;
}

export function deriveLegacyRedisNamespace(vaultPath: string): string {
  const vaultName = path
    .basename(vaultPath)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  const hash = createHash("sha1").update(vaultPath).digest("hex").slice(0, 8);
  return `${vaultName || "vault"}-${hash}`;
}

// @lat: [[architecture#Redis Boundary#Stable Redis Namespace]]
export function resolveRedisNamespace(
  persistedNamespace: string,
  vaultPath: string
): RedisNamespaceResolution {
  const persisted = parseRedisNamespace(persistedNamespace);
  if (persisted) {
    return { namespace: persisted, shouldPersist: persisted !== persistedNamespace };
  }
  return {
    namespace: deriveLegacyRedisNamespace(vaultPath),
    shouldPersist: true,
  };
}
