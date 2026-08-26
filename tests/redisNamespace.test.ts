import assert from "node:assert/strict";
import test from "node:test";

import {
  deriveLegacyRedisNamespace,
  parseRedisNamespace,
  resolveRedisNamespace,
} from "../src/redisNamespace.ts";

// @lat: [[tests#Redis Namespace Persistence]]
test("persisted Redis namespace survives vault moves", () => {
  const oldPath = "/Users/test/Second Brain";
  const movedPath = "/Volumes/Notes/Second Brain";
  const persisted = deriveLegacyRedisNamespace(oldPath);

  assert.notEqual(deriveLegacyRedisNamespace(movedPath), persisted);
  assert.deepEqual(resolveRedisNamespace(persisted, movedPath), {
    namespace: persisted,
    shouldPersist: false,
  });
});

test("missing Redis namespace migrates to the legacy path-derived value", () => {
  const vaultPath = "/Users/test/Second Brain";
  assert.deepEqual(resolveRedisNamespace("", vaultPath), {
    namespace: deriveLegacyRedisNamespace(vaultPath),
    shouldPersist: true,
  });
});

test("Redis namespace validation accepts the legacy format and rejects unsafe values", () => {
  assert.equal(parseRedisNamespace("SECOND-BRAIN-7795F220"), "second-brain-7795f220");
  assert.equal(parseRedisNamespace("second_brain"), null);
  assert.equal(parseRedisNamespace("-second-brain"), null);
  assert.equal(parseRedisNamespace("second-brain:"), null);
  assert.equal(parseRedisNamespace("a".repeat(65)), null);
});
