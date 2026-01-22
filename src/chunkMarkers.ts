import { Text as CMText } from "@codemirror/state";

export type ChunkMarkerInfo = {
  chunkId?: string;
  pageNumber?: number;
};

export type ChunkStartLine = {
  line: number;
  text: string;
};

export type ZrrBadgeInfo = {
  type: "sync-start" | "sync-end" | "chunk-start" | "chunk-end";
  docId?: string;
  chunkId?: string;
  excluded?: boolean;
  pageNumber?: number;
  chunkKind?: "page" | "section";
};

export const ZRR_SYNC_START_RE = /<!--\s*zrr:sync-start[^>]*-->/i;
export const ZRR_SYNC_END_RE = /<!--\s*zrr:sync-end\s*-->/i;
export const ZRR_CHUNK_START_RE = /<!--\s*zrr:chunk\b([^>]*)-->/i;
export const ZRR_CHUNK_END_RE = /<!--\s*zrr:chunk\s+end\s*-->/i;
export const ZRR_CHUNK_EXCLUDE_ANY_RE = /<!--\s*zrr:(?:exclude|delete)\s*-->/i;

export const parseZrrBadgeInfo = (data: string): ZrrBadgeInfo | null => {
  const trimmed = data.trim();
  if (!trimmed.toLowerCase().startsWith("zrr:")) {
    return null;
  }
  if (/^zrr:sync-start\b/i.test(trimmed)) {
    const docMatch = trimmed.match(/\bdoc_id=(["']?)([^"'\s]+)\1/i);
    return {
      type: "sync-start",
      docId: docMatch ? docMatch[2] : undefined,
    };
  }
  if (/^zrr:sync-end\b/i.test(trimmed)) {
    return { type: "sync-end" };
  }
  if (/^zrr:chunk\s+end\b/i.test(trimmed)) {
    return { type: "chunk-end" };
  }
  const chunkMatch = trimmed.match(/^zrr:chunk\b(.*)$/i);
  if (!chunkMatch) {
    return null;
  }
  const attrs = chunkMatch[1] || "";
  const idMatch = attrs.match(/\bid=(["']?)([^"'\s]+)\1/i);
  const chunkId = idMatch ? idMatch[2] : "";
  const pageAttrMatch = attrs.match(/\bpage(?:_start)?=(["']?)(\d+)\1/i);
  const pageAttr = pageAttrMatch ? Number.parseInt(pageAttrMatch[2], 10) : undefined;
  const pageMatch = chunkId.match(/^p(\d+)$/i);
  const pageFromId = pageMatch ? Number.parseInt(pageMatch[1], 10) : undefined;
  const pageNumber = Number.isFinite(pageAttr ?? NaN) ? pageAttr : pageFromId;
  const excluded = /\bexclude\b/i.test(attrs) || /\bdelete\b/i.test(attrs);
  return {
    type: "chunk-start",
    chunkId: chunkId || undefined,
    excluded,
    pageNumber: Number.isFinite(pageNumber ?? NaN) ? pageNumber : undefined,
    chunkKind: pageNumber ? "page" : "section",
  };
};

export const parseChunkMarkerLine = (line: string): ChunkMarkerInfo | null => {
  if (!line) {
    return null;
  }
  const match = line.match(ZRR_CHUNK_START_RE);
  if (!match) {
    return null;
  }
  const attrs = match[1] || "";
  const idMatch = attrs.match(/\bid=(["']?)([^"'\s]+)\1/i);
  const chunkId = idMatch ? idMatch[2].trim() : undefined;
  const pageAttrMatch = attrs.match(/\bpage(?:_start)?=(["']?)(\d+)\1/i);
  const pageAttr = pageAttrMatch ? Number.parseInt(pageAttrMatch[2], 10) : undefined;
  const pageFromId = chunkId ? extractPageNumberFromChunkId(chunkId) ?? undefined : undefined;
  const pageNumber = Number.isFinite(pageAttr ?? NaN) ? pageAttr : pageFromId;
  return {
    chunkId,
    pageNumber: Number.isFinite(pageNumber ?? NaN) ? Number(pageNumber) : undefined,
  };
};

export const extractDocIdFromDoc = (doc: CMText): string | null => {
  for (let line = 1; line <= doc.lines; line += 1) {
    const text = doc.line(line).text;
    if (ZRR_SYNC_START_RE.test(text)) {
      const docMatch = text.match(/doc_id=([\"']?)([^\"'\s]+)\1/i);
      return docMatch ? docMatch[2].trim() : null;
    }
  }
  return null;
};

export const findChunkStartLineInDoc = (
  doc: CMText,
  fromLine: number
): ChunkStartLine | null => {
  let line = fromLine;
  for (; line >= 1; line -= 1) {
    const text = doc.line(line).text;
    if (ZRR_CHUNK_START_RE.test(text)) {
      return { line, text };
    }
    if (ZRR_SYNC_START_RE.test(text) || ZRR_SYNC_END_RE.test(text)) {
      break;
    }
  }
  return null;
};

export const findChunkEndLineInDoc = (doc: CMText, fromLine: number): number | null => {
  for (let line = fromLine; line <= doc.lines; line += 1) {
    const text = doc.line(line).text;
    if (ZRR_CHUNK_END_RE.test(text)) {
      return line;
    }
    if (ZRR_SYNC_END_RE.test(text)) {
      break;
    }
  }
  return null;
};

export const findChunkAtCursorInDoc = (
  doc: CMText,
  cursorLine: number
): { startLine: number; endLine: number; text: string } | null => {
  const start = findChunkStartLineInDoc(doc, cursorLine);
  if (!start) {
    return null;
  }
  const endLine = findChunkEndLineInDoc(doc, start.line + 1);
  if (endLine === null || cursorLine < start.line || cursorLine > endLine) {
    return null;
  }
  return { startLine: start.line, endLine, text: start.text };
};

export const hasExcludeMarkerInRange = (doc: CMText, startLine: number, endLine: number): boolean => {
  if (startLine > endLine) {
    return false;
  }
  for (let line = startLine; line <= endLine; line += 1) {
    const text = doc.line(line).text;
    if (ZRR_CHUNK_EXCLUDE_ANY_RE.test(text)) {
      return true;
    }
  }
  return false;
};

export const extractPageNumberFromChunkId = (chunkId: string): number | null => {
  if (!chunkId) {
    return null;
  }
  const normalized = chunkId.includes(":") ? chunkId.split(":").pop() ?? chunkId : chunkId;
  const pageMatch = normalized.match(/^p(\d+)$/i);
  if (!pageMatch) {
    return null;
  }
  const pageNumber = Number.parseInt(pageMatch[1], 10);
  return Number.isFinite(pageNumber) ? pageNumber : null;
};

export const extractPageNumberFromChunkLine = (line: string): number | null => {
  const info = parseChunkMarkerLine(line);
  return info?.pageNumber ?? null;
};

export const extractFirstChunkMarkerFromContent = (content: string): ChunkMarkerInfo | null => {
  if (!content) {
    return null;
  }
  const match = content.match(/<!--\s*zrr:chunk\b[^>]*-->/i);
  if (!match) {
    return null;
  }
  return parseChunkMarkerLine(match[0]);
};
