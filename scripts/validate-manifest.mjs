import fs from "node:fs/promises";
import path from "node:path";

const SEMVER_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const ID_RE = /^[a-z0-9][a-z0-9-]*$/;

function pushError(errors, message) {
  errors.push(message);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

async function main() {
  const manifestPathArg = process.argv[2] || "manifest.json";
  const manifestPath = path.resolve(process.cwd(), manifestPathArg);
  const errors = [];

  let raw;
  try {
    raw = await fs.readFile(manifestPath, "utf8");
  } catch (error) {
    console.error(`Manifest validation failed: unable to read ${manifestPath}`);
    console.error(String(error));
    process.exit(1);
  }

  let manifest;
  try {
    manifest = JSON.parse(raw);
  } catch (error) {
    console.error(`Manifest validation failed: invalid JSON in ${manifestPath}`);
    console.error(String(error));
    process.exit(1);
  }

  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    console.error("Manifest validation failed: root value must be an object.");
    process.exit(1);
  }

  const requiredStringFields = [
    "id",
    "name",
    "version",
    "minAppVersion",
    "description",
    "author",
  ];
  for (const field of requiredStringFields) {
    if (!isNonEmptyString(manifest[field])) {
      pushError(errors, `'${field}' must be a non-empty string.`);
    }
  }

  if (typeof manifest.isDesktopOnly !== "boolean") {
    pushError(errors, "'isDesktopOnly' must be a boolean.");
  }

  if (isNonEmptyString(manifest.id) && !ID_RE.test(manifest.id)) {
    pushError(errors, "'id' must match /^[a-z0-9][a-z0-9-]*$/.");
  }

  if (isNonEmptyString(manifest.version) && !SEMVER_RE.test(manifest.version)) {
    pushError(errors, "'version' must be a valid semantic version (e.g. 0.9.12).");
  }

  if (isNonEmptyString(manifest.minAppVersion) && !SEMVER_RE.test(manifest.minAppVersion)) {
    pushError(errors, "'minAppVersion' must be a valid semantic version.");
  }

  if (manifest.authorUrl !== undefined) {
    if (typeof manifest.authorUrl !== "string" || manifest.authorUrl.trim().length === 0) {
      pushError(errors, "'authorUrl' must be a non-empty string when provided.");
    } else {
      try {
        const url = new URL(manifest.authorUrl);
        if (url.protocol !== "http:" && url.protocol !== "https:") {
          pushError(errors, "'authorUrl' must use http or https.");
        }
      } catch {
        pushError(errors, "'authorUrl' must be a valid URL.");
      }
    }
  }

  if (errors.length > 0) {
    console.error(`Manifest validation failed for ${manifestPath}:`);
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(`Manifest validation passed: ${manifestPath}`);
}

await main();
