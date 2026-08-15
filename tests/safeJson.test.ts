import assert from "node:assert/strict";
import test from "node:test";

import {
  asUnknownRecord,
  asUnknownRecordArray,
  mergeCompatibleSettings,
  parseJsonUnknown,
} from "../src/safeJson.ts";

// @lat: [[tests#TypeScript Boundary Safety]]
test("parseJsonUnknown keeps JSON behind an unknown boundary", () => {
  const parsed = parseJsonUnknown('{"ok":true}');
  assert.deepEqual(asUnknownRecord(parsed), { ok: true });
});

test("asUnknownRecordArray drops primitive and array entries", () => {
  assert.deepEqual(asUnknownRecordArray([{ id: "one" }, null, "bad", ["bad"], { id: "two" }]), [
    { id: "one" },
    { id: "two" },
  ]);
});

test("mergeCompatibleSettings accepts known compatible values only", () => {
  const defaults = {
    enabled: false,
    count: 2,
    name: "default",
    profiles: [{ id: "default", apiKey: "" }],
    memory: {},
  };

  assert.deepEqual(
    mergeCompatibleSettings(defaults, {
      enabled: true,
      count: "wrong",
      name: "saved",
      profiles: [{ id: "local", apiKey: "secret" }],
      memory: { local: { mode: "safe" } },
      unknown: "discarded",
    }),
    {
      enabled: true,
      count: 2,
      name: "saved",
      profiles: [{ id: "local", apiKey: "secret" }],
      memory: { local: { mode: "safe" } },
    }
  );
});

test("mergeCompatibleSettings rejects malformed nested array entries", () => {
  const defaults = { profiles: [{ id: "default", apiKey: "" }] };
  assert.deepEqual(
    mergeCompatibleSettings(defaults, { profiles: [{ id: "local", apiKey: 123 }] }),
    defaults
  );
  assert.deepEqual(
    mergeCompatibleSettings(defaults, { profiles: [{ id: "local" }] }),
    defaults
  );
});

test("mergeCompatibleSettings validates dynamic record values from an exemplar", () => {
  const defaults = {
    colorMap: { yellow: { heading: "Questions", callout: "question" } },
  };
  assert.deepEqual(
    mergeCompatibleSettings(defaults, {
      colorMap: { custom: { heading: "Custom", callout: "note" } },
    }),
    { colorMap: { custom: { heading: "Custom", callout: "note" } } }
  );
  assert.deepEqual(
    mergeCompatibleSettings(defaults, {
      colorMap: { custom: { heading: "Custom", callout: 42 } },
    }),
    defaults
  );
  assert.deepEqual(
    mergeCompatibleSettings(defaults, {
      colorMap: { custom: { heading: "Custom" } },
    }),
    defaults
  );
});
