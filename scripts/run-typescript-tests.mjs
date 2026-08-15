import { spawnSync } from "child_process";
import { mkdtemp, readdir, rm } from "fs/promises";
import os from "os";
import path from "path";

import { build } from "esbuild";

const testDir = path.resolve("tests");
const entries = (await readdir(testDir))
  .filter((name) => name.endsWith(".test.ts"))
  .map((name) => path.join(testDir, name));

if (entries.length === 0) {
  throw new Error("No TypeScript test files found in tests/*.test.ts.");
}

const outputDir = await mkdtemp(path.join(os.tmpdir(), "zrr-typescript-tests-"));
try {
  await build({
    entryPoints: entries,
    bundle: true,
    format: "esm",
    outdir: outputDir,
    platform: "node",
    sourcemap: "inline",
    target: "node20",
  });

  const bundledTests = (await readdir(outputDir))
    .filter((name) => name.endsWith(".js"))
    .map((name) => path.join(outputDir, name));
  const result = spawnSync(process.execPath, ["--test", ...bundledTests], {
    stdio: "inherit",
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
  }
} finally {
  await rm(outputDir, { force: true, recursive: true });
}
