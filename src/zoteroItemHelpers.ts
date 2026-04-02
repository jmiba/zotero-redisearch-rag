import type { ZoteroItemValues, ZoteroLocalItem } from "./types";

export type PdfStatus = "yes" | "no" | "unknown";

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as Record<string, unknown>;
};

export const coerceString = (value: unknown): string => {
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (Array.isArray(value)) {
    for (const entry of value) {
      if (typeof entry === "string" && entry.trim()) {
        return entry.trim();
      }
      if (typeof entry === "number" && Number.isFinite(entry)) {
        return String(entry);
      }
    }
  }
  if (value && typeof value === "object") {
    const first = (value as { 0?: unknown })[0];
    if (typeof first === "string" && first.trim()) {
      return first.trim();
    }
    if (typeof first === "number" && Number.isFinite(first)) {
      return String(first);
    }
  }
  return "";
};

export const getDocIdFromValues = (values: ZoteroItemValues): string | null => {
  const candidates = [values.key, values.itemKey, values.id, values.citationKey];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return null;
};

export const getDocIdFromItem = (item: ZoteroLocalItem): string => {
  const key = item.key ?? item.data?.key ?? "";
  return typeof key === "string" ? key : "";
};

export const extractYear = (value: string): string => {
  if (!value) {
    return "";
  }
  const match = value.match(/\b(\d{4})\b/);
  return match ? match[1] : "";
};

export const extractYearFromItem = (item: ZoteroLocalItem): string => {
  const parsed = item.meta?.parsedDate ?? item.data?.date ?? "";
  if (typeof parsed !== "string") {
    return "";
  }
  return extractYear(parsed);
};

export const formatCreatorName = (creator: unknown): string => {
  const record = asRecord(creator);
  if (!record) {
    return "";
  }
  const literalName = coerceString(record.name);
  if (literalName) {
    return literalName;
  }
  const first = coerceString(record.firstName);
  const last = coerceString(record.lastName);
  const combined = [last, first].filter(Boolean).join(", ");
  return combined || `${first} ${last}`.trim();
};

export const extractCitekey = (values: ZoteroItemValues, meta?: Record<string, unknown>): string => {
  const candidates = [
    // Prefer Zotero's native citation-key field variants first.
    values.citationKey,
    values["citation-key"],
    values.citation_key,
    meta?.citationKey,
    meta?.["citation-key"],
    meta?.citation_key,
    // Then fall back to compatibility fields (e.g. Better BibTeX payloads).
    values.citationkey,
    values.citekey,
    values.citeKey,
    values.betterBibtexKey,
    values.betterbibtexkey,
    meta?.citationkey,
    meta?.citekey,
    meta?.citeKey,
    meta?.betterBibtexKey,
    meta?.betterbibtexkey,
  ];
  for (const candidate of candidates) {
    const resolved = coerceString(candidate);
    if (resolved) {
      return resolved;
    }
  }
  const extra = typeof values.extra === "string" ? values.extra : "";
  if (!extra) {
    return "";
  }
  const lines = extra.split(/\r?\n/);
  for (const line of lines) {
    const biblatexMatch = line.match(/^\s*biblatexcitekey\s*\[([^\]]+)\]\s*$/i);
    if (biblatexMatch && biblatexMatch[1]) {
      return biblatexMatch[1].trim();
    }
    const match = line.match(
      /^\s*(citation key|citationkey|citekey|citation-key|bibtex key|bibtexkey|bibtex)\s*:\s*(.+)\s*$/i
    );
    if (match && match[2]) {
      return match[2].trim();
    }
  }
  return "";
};

export const extractCitekeyFromCsl = (csl: Record<string, unknown> | null): string => {
  if (!csl) {
    return "";
  }
  const candidates = [
    csl["citation-key"],
    csl.citationKey,
    csl.citationkey,
    csl.citekey,
    csl.citation_key,
  ];
  for (const candidate of candidates) {
    const resolved = coerceString(candidate);
    if (resolved) {
      return resolved;
    }
  }
  return "";
};

export const extractShortTitleFromCsl = (csl: Record<string, unknown> | null): string => {
  if (!csl) {
    return "";
  }
  const shortTitle = csl["title-short"] ?? csl.shortTitle ?? csl.short_title;
  return typeof shortTitle === "string" ? shortTitle.trim() : "";
};

export const extractShortTitleFromValues = (values: ZoteroItemValues): string => {
  const direct = coerceString(values.shortTitle);
  if (direct) {
    return direct;
  }
  const underscored = coerceString(values.short_title);
  if (underscored) {
    return underscored;
  }
  const hyphenated = coerceString(values["title-short"]);
  if (hyphenated) {
    return hyphenated;
  }
  return "";
};

export const extractDoiFromExtra = (values: ZoteroItemValues): string => {
  const extra = typeof values.extra === "string" ? values.extra : "";
  if (!extra) {
    return "";
  }
  const lines = extra.split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*doi\s*:\s*(.+)\s*$/i);
    if (match && match[1]) {
      return match[1].trim().replace(/[.,;]+$/, "");
    }
  }
  const doiMatch = extra.match(/\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+\b/i);
  return doiMatch ? doiMatch[0].replace(/[.,;]+$/, "") : "";
};

export const extractDoiFromCsl = (csl: Record<string, unknown> | null): string => {
  if (!csl) {
    return "";
  }
  const doi = csl.DOI ?? csl.doi;
  if (typeof doi === "string") {
    return doi.trim().replace(/[.,;]+$/, "");
  }
  return "";
};

export const collectItemAttachments = (data: Record<string, unknown> | undefined): unknown[] => {
  if (!data) {
    return [];
  }
  const buckets = [
    data.attachments,
    data.children,
    data.items,
    data.attachment,
    data.allAttachments,
  ];
  const collected: unknown[] = [];
  for (const bucket of buckets) {
    if (!bucket) {
      continue;
    }
    if (Array.isArray(bucket)) {
      collected.push(...bucket);
    } else if (typeof bucket === "object") {
      collected.push(bucket);
    }
  }
  return collected;
};

export const isPdfAttachment = (entry: unknown): boolean => {
  const record = asRecord(entry);
  const data = asRecord(record?.data);
  const contentType =
    record?.contentType ?? record?.mimeType ?? data?.contentType ?? data?.mimeType ?? "";
  if (contentType === "application/pdf") {
    return true;
  }
  const filename =
    record?.filename ??
    record?.fileName ??
    data?.filename ??
    data?.fileName ??
    record?.path ??
    data?.path ??
    "";
  if (typeof filename === "string" && filename.toLowerCase().endsWith(".pdf")) {
    return true;
  }
  return false;
};

export const getPdfStatusFromItem = (item: ZoteroLocalItem): PdfStatus => {
  const attachments = collectItemAttachments(item.data);
  if (attachments.length > 0) {
    const hasPdf = attachments.some((entry) => isPdfAttachment(entry));
    return hasPdf ? "yes" : "no";
  }
  const numChildren = item.meta?.numChildren;
  if (typeof numChildren === "number" && numChildren === 0) {
    return "no";
  }
  return "unknown";
};
