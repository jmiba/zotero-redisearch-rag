import type { ZoteroItemValues, ZoteroLocalItem } from "./types";

export type PdfStatus = "yes" | "no" | "unknown";

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

export const formatCreatorName = (creator: any): string => {
  if (!creator || typeof creator !== "object") {
    return "";
  }
  if (creator.name) {
    return String(creator.name);
  }
  const first = creator.firstName ? String(creator.firstName) : "";
  const last = creator.lastName ? String(creator.lastName) : "";
  const combined = [last, first].filter(Boolean).join(", ");
  return combined || `${first} ${last}`.trim();
};

export const extractCitekey = (values: ZoteroItemValues, meta?: Record<string, any>): string => {
  const candidates = [
    meta?.citationKey,
    meta?.citekey,
    meta?.citeKey,
    meta?.betterBibtexKey,
    meta?.betterbibtexkey,
    values.citationKey,
    values.citekey,
    values.citeKey,
    values.betterBibtexKey,
    values.betterbibtexkey,
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
    const match = line.match(/^\s*(citation key|citekey|citation-key|bibtex key|bibtexkey)\s*:\s*(.+)\s*$/i);
    if (match && match[2]) {
      return match[2].trim();
    }
  }
  return "";
};

export const extractShortTitleFromCsl = (csl: Record<string, any> | null): string => {
  if (!csl) {
    return "";
  }
  const shortTitle = csl["title-short"] ?? csl.shortTitle ?? csl.short_title;
  return typeof shortTitle === "string" ? shortTitle.trim() : "";
};

export const extractShortTitleFromValues = (values: ZoteroItemValues): string => {
  const direct = coerceString((values as any).shortTitle);
  if (direct) {
    return direct;
  }
  const underscored = coerceString((values as any).short_title);
  if (underscored) {
    return underscored;
  }
  const hyphenated = coerceString((values as any)["title-short"]);
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

export const extractDoiFromCsl = (csl: Record<string, any> | null): string => {
  if (!csl) {
    return "";
  }
  const doi = csl.DOI ?? csl.doi;
  if (typeof doi === "string") {
    return doi.trim().replace(/[.,;]+$/, "");
  }
  return "";
};

export const collectItemAttachments = (data: Record<string, any> | undefined): any[] => {
  if (!data) {
    return [];
  }
  const buckets = [
    data.attachments,
    data.children,
    data.items,
    (data as any).attachment,
    (data as any).allAttachments,
  ];
  const collected: any[] = [];
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

export const isPdfAttachment = (entry: any): boolean => {
  const contentType =
    entry?.contentType ?? entry?.mimeType ?? entry?.data?.contentType ?? entry?.data?.mimeType ?? "";
  if (contentType === "application/pdf") {
    return true;
  }
  const filename =
    entry?.filename ??
    entry?.fileName ??
    entry?.data?.filename ??
    entry?.data?.fileName ??
    entry?.path ??
    entry?.data?.path ??
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
