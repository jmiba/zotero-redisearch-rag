import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const RELEASE_HEADING_RE = /^##\s+(\d+\.\d+\.\d+)(?:\s+.*)?$/;

export function parseChangelogEntries(source) {
  const lines = String(source || "").replace(/\r\n/g, "\n").split("\n");
  const entries = [];
  let current = null;
  for (const line of lines) {
    const heading = line.match(RELEASE_HEADING_RE);
    if (heading) {
      if (current) {
        current.markdown = current.lines.join("\n").trim();
        delete current.lines;
        entries.push(current);
      }
      current = { version: heading[1], lines: [] };
      continue;
    }
    if (current) {
      current.lines.push(line);
    }
  }
  if (current) {
    current.markdown = current.lines.join("\n").trim();
    delete current.lines;
    entries.push(current);
  }
  return entries.filter((entry) => entry.markdown);
}

// @lat: [[architecture#Release Artifact Boundary]]
export function extractTopReleaseBody(source, expectedVersion) {
  const entries = parseChangelogEntries(source);
  if (!entries.length) {
    throw new Error("CHANGELOG.md does not contain a release entry headed by ## x.y.z.");
  }
  const top = entries[0];
  if (top.version !== expectedVersion) {
    throw new Error(
      `Top CHANGELOG.md version ${top.version} does not match manifest version ${expectedVersion}.`
    );
  }
  return top.markdown;
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (invokedPath === import.meta.url) {
  const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
  const expectedVersion = String(manifest.version || "").trim();
  if (!expectedVersion) {
    throw new Error("manifest.json does not contain a version.");
  }
  const changelog = readFileSync("CHANGELOG.md", "utf8");
  process.stdout.write(`${extractTopReleaseBody(changelog, expectedVersion)}\n`);
}
