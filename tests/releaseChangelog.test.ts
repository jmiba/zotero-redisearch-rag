import assert from "node:assert/strict";
import test from "node:test";

import {
  extractTopReleaseBody,
  parseChangelogEntries,
} from "../scripts/release-changelog.mjs";

const changelog = `# Changelog
## 1.2.3
- Current fix
  - Current detail

## 1.2.2 (Bugfix Release)
- Previous fix
`;

// @lat: [[tests#Release Packaging]]
test("release body comes from the top changelog entry", () => {
  assert.equal(extractTopReleaseBody(changelog, "1.2.3"), "- Current fix\n  - Current detail");
});

test("release body generation rejects a manifest/changelog version mismatch", () => {
  assert.throws(
    () => extractTopReleaseBody(changelog, "1.2.4"),
    /Top CHANGELOG\.md version 1\.2\.3 does not match manifest version 1\.2\.4/
  );
});

test("changelog parsing preserves release history and optional heading labels", () => {
  assert.deepEqual(parseChangelogEntries(changelog), [
    { version: "1.2.3", markdown: "- Current fix\n  - Current detail" },
    { version: "1.2.2", markdown: "- Previous fix" },
  ]);
});
