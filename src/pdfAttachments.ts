import { fileURLToPath } from "url";
import type { PdfAttachment, ZoteroItemValues } from "./types";

export type PdfAttachmentResolverDeps = {
  fetchZoteroChildren: (itemKey: string) => Promise<unknown[]>;
};

export type RawApiResponse = {
  statusCode: number;
  headers: Record<string, unknown>;
  body: Buffer;
};

export type PdfDownloadDeps = {
  buildZoteroUrl: (pathname: string) => string;
  getZoteroLibraryPath: () => string;
  canUseWebApi: () => boolean;
  buildWebApiUrl: (pathname: string) => string;
  getWebApiLibraryPath: () => string;
  requestLocalApiRaw: (url: string) => Promise<RawApiResponse>;
  requestWebApiRaw: (url: string) => Promise<RawApiResponse>;
  requestLocalApi: (url: string) => Promise<Buffer>;
  readFile: (path: string) => Promise<Buffer>;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as Record<string, unknown>;
};

export const resolvePdfAttachment = async (
  values: ZoteroItemValues,
  itemKey: string,
  deps: PdfAttachmentResolverDeps
): Promise<PdfAttachment | null> => {
  const fromValues = pickPdfAttachment(values);
  if (fromValues) {
    return fromValues;
  }

  try {
    const children = await deps.fetchZoteroChildren(itemKey);
    for (const child of children) {
      const attachment = toPdfAttachment(child);
      if (attachment) {
        return attachment;
      }
    }
  } catch (error) {
    console.error("Failed to fetch Zotero children", error);
  }

  return null;
};

export const pickPdfAttachment = (values: ZoteroItemValues): PdfAttachment | null => {
  const attachments = collectAttachmentCandidates(values);
  for (const attachment of attachments) {
    const pdfAttachment = toPdfAttachment(attachment);
    if (pdfAttachment) {
      return pdfAttachment;
    }
  }
  return null;
};

export const collectAttachmentCandidates = (values: ZoteroItemValues): unknown[] => {
  const buckets = [
    values.attachments,
    values.children,
    values.items,
    values["attachment"],
    values["allAttachments"],
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

export const toPdfAttachment = (attachment: unknown): PdfAttachment | null => {
  const record = asRecord(attachment);
  const data = asRecord(record?.data);
  const contentType = record?.contentType ?? record?.mimeType ?? data?.contentType;
  if (contentType !== "application/pdf") {
    return null;
  }
  const key = record?.key ?? record?.attachmentKey ?? data?.key;
  if (typeof key !== "string" || !key.trim()) {
    return null;
  }
  const filePath = extractAttachmentPath(attachment);
  return filePath ? { key, filePath } : { key };
};

export const extractAttachmentPath = (attachment: unknown): string | null => {
  const record = asRecord(attachment);
  const links = asRecord(record?.links);
  const enclosure = asRecord(record?.enclosure);
  const data = asRecord(record?.data);
  const dataLinks = asRecord(data?.links);
  const linksEnclosure = asRecord(links?.enclosure);
  const dataEnclosure = asRecord(dataLinks?.enclosure);
  const href = linksEnclosure?.href ?? enclosure?.href ?? dataEnclosure?.href;
  if (typeof href === "string" && href.startsWith("file://")) {
    try {
      return fileURLToPath(href);
    } catch {
      return null;
    }
  }
  return null;
};

const followFileRedirect = async (
  response: RawApiResponse,
  deps: Pick<PdfDownloadDeps, "requestLocalApi" | "readFile">
): Promise<Buffer | null> => {
  if (response.statusCode < 300 || response.statusCode >= 400) {
    return null;
  }
  const location = response.headers.location;
  const href = Array.isArray(location) ? location[0] : location;
  if (!href || typeof href !== "string") {
    return null;
  }
  if (href.startsWith("file://")) {
    const filePath = fileURLToPath(href);
    return deps.readFile(filePath);
  }
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return deps.requestLocalApi(href);
  }
  return null;
};

export const downloadZoteroPdf = async (
  attachmentKey: string,
  deps: PdfDownloadDeps
): Promise<Buffer> => {
  const url = deps.buildZoteroUrl(`/${deps.getZoteroLibraryPath()}/items/${attachmentKey}/file`);
  try {
    const response = await deps.requestLocalApiRaw(url);
    const redirected = await followFileRedirect(response, deps);
    if (redirected) {
      return redirected;
    }
    if (response.statusCode >= 300) {
      throw new Error(`Request failed, status ${response.statusCode}`);
    }
    return response.body;
  } catch (error) {
    console.warn("Failed to download PDF from local API", error);
    if (!deps.canUseWebApi()) {
      throw error;
    }
    const webUrl = deps.buildWebApiUrl(`/${deps.getWebApiLibraryPath()}/items/${attachmentKey}/file`);
    const response = await deps.requestWebApiRaw(webUrl);
    const redirected = await followFileRedirect(response, deps);
    if (redirected) {
      return redirected;
    }
    if (response.statusCode >= 300) {
      throw new Error(`Web API request failed, status ${response.statusCode}`);
    }
    return response.body;
  }
};
