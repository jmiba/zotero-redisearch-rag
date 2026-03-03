import { execSync, spawnSync } from "node:child_process";
import path from "node:path";

function getChangedFiles() {
  const output = execSync("git diff --name-only --diff-filter=ACMRTUXB HEAD", {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function isLintable(file) {
  const normalized = file.replace(/\\/g, "/");
  if (normalized.startsWith("src/")) {
    return normalized.endsWith(".ts") || normalized.endsWith(".tsx");
  }
  return false;
}

function run() {
  const changed = getChangedFiles().filter(isLintable);
  if (!changed.length) {
    console.log("No changed lintable files.");
    return 0;
  }

  const args = ["eslint", "--config", "eslint.config.mjs", ...changed.map((file) => path.normalize(file))];
  const result = spawnSync("npx", args, { stdio: "inherit" });
  return typeof result.status === "number" ? result.status : 1;
}

process.exit(run());
