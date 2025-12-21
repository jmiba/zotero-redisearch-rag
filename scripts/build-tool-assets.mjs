import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const tools = [
  "docling_extract.py",
  "index_redisearch.py",
  "rag_query_redisearch.py",
  "batch_index_pyzotero.py",
  "ocr_wordlist.txt",
];

const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const version = manifest.version ?? "unknown";
const stamp = `# zotero-redisearch-rag tool version: ${version}`;

const lines = ["export const TOOL_ASSETS: Record<string, string> = {"];

const stampContent = (content) => {
  const rows = content.split("\n");
  const hasShebang = rows[0]?.startsWith("#!");
  const stampIndex = hasShebang ? 1 : 0;
  if (rows[stampIndex]?.startsWith("# zotero-redisearch-rag tool version:")) {
    rows[stampIndex] = stamp;
  } else {
    rows.splice(stampIndex, 0, stamp);
  }
  return rows.join("\n");
};

for (const name of tools) {
  const content = readFileSync(join("tools", name), "utf8");
  const stamped = stampContent(content);
  lines.push(`  "${name}": String.raw\`${stamped}\`,`);
}

lines.push("};");

writeFileSync(join("src", "toolAssets.ts"), lines.join("\n"), "utf8");
