import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const tools = [
  { name: "docling_extract.py", path: "tools/docling_extract.py" },
  { name: "index_redisearch.py", path: "tools/index_redisearch.py" },
  { name: "ocr_layered_pdf.py", path: "tools/ocr_layered_pdf.py" },
  { name: "rag_query_redisearch.py", path: "tools/rag_query_redisearch.py" },
  { name: "batch_index_pyzotero.py", path: "tools/batch_index_pyzotero.py" },
  { name: "utils_embedding.py", path: "tools/utils_embedding.py" }, // <-- Add this line
  { name: "ocr_wordlist.txt", path: "tools/ocr_wordlist.txt" },
  { name: "requirements.txt", path: "requirements.txt" },
  { name: "docker-compose.yml", path: "docker-compose.yml" },
  { name: "redis-stack.conf", path: "redis-stack.conf" },
];

const icons = [
  { name: "zrr-picker", path: "icon.svg" },
  { name: "zrr-chat", path: "icon-chat.svg" },
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

for (const entry of tools) {
  const content = readFileSync(entry.path, "utf8");
  const stamped = stampContent(content);
  lines.push(`  "${entry.name}": ${JSON.stringify(stamped)},`);
}

lines.push("};");

writeFileSync(join("src", "toolAssets.ts"), lines.join("\n"), "utf8");

const iconLines = ["export const ICON_ASSETS: Record<string, string> = {"];
for (const entry of icons) {
  const content = readFileSync(entry.path, "utf8");
  iconLines.push(`  "${entry.name}": ${JSON.stringify(content)},`);
}
iconLines.push("};");
writeFileSync(join("src", "iconAssets.ts"), iconLines.join("\n"), "utf8");
