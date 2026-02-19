import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const normalizeVersion = (value) =>
  String(value || "")
    .trim()
    .replace(/^refs\/tags\//, "")
    .replace(/^v/, "");

const parseNumericVersion = (version) => {
  const normalized = normalizeVersion(version);
  if (!normalized) {
    return null;
  }
  const parts = normalized.split(".");
  if (!parts.length) {
    return null;
  }
  const parsed = parts.map((part) => Number.parseInt(part, 10));
  if (parsed.some((part) => !Number.isFinite(part))) {
    return null;
  }
  return parsed;
};

const compareVersions = (left, right) => {
  const normalizedLeft = normalizeVersion(left);
  const normalizedRight = normalizeVersion(right);
  const numericLeft = parseNumericVersion(normalizedLeft);
  const numericRight = parseNumericVersion(normalizedRight);
  if (numericLeft && numericRight) {
    const maxLen = Math.max(numericLeft.length, numericRight.length);
    for (let index = 0; index < maxLen; index += 1) {
      const leftValue = numericLeft[index] ?? 0;
      const rightValue = numericRight[index] ?? 0;
      if (leftValue !== rightValue) {
        return leftValue - rightValue;
      }
    }
    return 0;
  }
  return normalizedLeft.localeCompare(normalizedRight, undefined, {
    numeric: true,
    sensitivity: "base",
  });
};

const normalizeMarkdown = (value) => {
  const markdown = String(value || "").replace(/\r\n/g, "\n");
  const filtered = markdown
    .split("\n")
    .filter((line) => !/full\s+changelog\s*:/i.test(line))
    .join("\n")
    .trim();
  return filtered || "This release includes improvements and fixes.";
};

const toEntries = (candidate) => {
  if (!Array.isArray(candidate)) {
    return [];
  }
  const seen = new Set();
  const entries = [];
  for (const rawEntry of candidate) {
    const version = normalizeVersion(rawEntry?.version);
    if (!version || seen.has(version)) {
      continue;
    }
    seen.add(version);
    entries.push({
      version,
      markdown: normalizeMarkdown(rawEntry?.markdown),
    });
  }
  return entries;
};

const mergeEntries = (...groups) => {
  const seen = new Set();
  const merged = [];
  for (const group of groups) {
    for (const entry of group) {
      const version = normalizeVersion(entry?.version);
      if (!version || seen.has(version)) {
        continue;
      }
      seen.add(version);
      merged.push({
        version,
        markdown: normalizeMarkdown(entry?.markdown),
      });
    }
  }
  return merged;
};

const releaseNotesPath = join("src", "releaseNotes.ts");

const parseJsonLiteral = (source, pattern) => {
  const match = source.match(pattern);
  if (!match) {
    return null;
  }
  try {
    return JSON.parse(match[1]);
  } catch (error) {
    return null;
  }
};

const parseExistingReleaseNotes = () => {
  if (!existsSync(releaseNotesPath)) {
    return [];
  }
  const source = readFileSync(releaseNotesPath, "utf8");
  const logEntries = parseJsonLiteral(
    source,
    /export const RELEASE_NOTES_LOG[^=]*=\s*(\[[\s\S]*?\]);/m
  );
  if (Array.isArray(logEntries)) {
    return toEntries(logEntries);
  }
  const legacyNote = parseJsonLiteral(source, /export const RELEASE_NOTES[^=]*=\s*(\{[\s\S]*?\});/m);
  if (legacyNote && typeof legacyNote === "object") {
    return toEntries([legacyNote]);
  }
  return [];
};

const fetchGitHubReleaseEntries = async () => {
  const repository = String(process.env.GITHUB_REPOSITORY || "").trim();
  if (!repository) {
    return [];
  }
  const token = String(process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "").trim();
  const apiBase = String(process.env.GITHUB_API_URL || "https://api.github.com").trim().replace(/\/+$/, "");
  const perPage = 100;
  const entries = [];
  for (let page = 1; page <= 10; page += 1) {
    const url = `${apiBase}/repos/${repository}/releases?per_page=${perPage}&page=${page}`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "zrr-release-notes-generator",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) {
      throw new Error(`GitHub API ${response.status} while fetching ${url}`);
    }
    const payload = await response.json();
    if (!Array.isArray(payload) || payload.length === 0) {
      break;
    }
    for (const release of payload) {
      if (!release || release.draft || release.prerelease) {
        continue;
      }
      const version = normalizeVersion(release.tag_name);
      if (!version) {
        continue;
      }
      entries.push({
        version,
        markdown: normalizeMarkdown(release.body),
      });
    }
    if (payload.length < perPage) {
      break;
    }
  }
  return toEntries(entries);
};

const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const manifestVersion = normalizeVersion(manifest.version);
const releaseTag = normalizeVersion(process.env.GITHUB_RELEASE_TAG);
const releaseVersion = manifestVersion || releaseTag;

if (!releaseVersion) {
  throw new Error("Could not determine release version from manifest.json or GITHUB_RELEASE_TAG.");
}

const bundledMarkdown = normalizeMarkdown(process.env.GITHUB_RELEASE_BODY);
const existingEntries = parseExistingReleaseNotes();
let githubEntries = [];
try {
  githubEntries = await fetchGitHubReleaseEntries();
} catch (error) {
  console.warn("Failed to fetch release history from GitHub API; using local release notes log only.");
  if (error instanceof Error) {
    console.warn(error.message);
  }
}
const mergedEntries = mergeEntries(
  [{ version: releaseVersion, markdown: bundledMarkdown }],
  githubEntries,
  existingEntries
).sort((left, right) => compareVersions(right.version, left.version));

const output = `// Auto-generated by scripts/generate-release-notes.mjs
// This file is overwritten in GitHub release workflow builds.
export type ReleaseNotesEntry = {
  version: string;
  markdown: string;
};

export const RELEASE_NOTES_LOG: ReleaseNotesEntry[] = ${JSON.stringify(mergedEntries, null, 2)};
`;

writeFileSync(releaseNotesPath, output, "utf8");
console.log(`Generated src/releaseNotes.ts for version ${releaseVersion} with ${mergedEntries.length} entries.`);
