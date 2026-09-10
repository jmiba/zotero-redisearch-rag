export type AnnotationChildrenFetchOptions = {
  includeAnnotationImage?: boolean;
};

export type AnnotationChildrenFetcher = (
  options?: AnnotationChildrenFetchOptions
) => Promise<unknown[]>;

export type AnnotationChildrenFetchResult = {
  children: unknown[];
  hadFetchError: boolean;
  source: "local" | "web" | "none";
  localError?: unknown;
  webError?: unknown;
};

async function fetchWithAnnotationImageFallback(
  fetchChildren: AnnotationChildrenFetcher
): Promise<unknown[]> {
  try {
    return await fetchChildren({ includeAnnotationImage: true });
  } catch {
    return fetchChildren();
  }
}

function childItemData(child: unknown): Record<string, unknown> | null {
  if (!child || typeof child !== "object" || Array.isArray(child)) {
    return null;
  }
  const record = child as Record<string, unknown>;
  const nested = record.data;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return nested as Record<string, unknown>;
  }
  return record;
}

/**
 * Zotero's local `/items/:key/children` endpoint resolves children through a
 * search whose child expansion only covers itemAttachments and itemNotes, so
 * a successful local response can never contain annotation items (verified
 * against Zotero 7, 9, and 10). Only a local response that actually contains
 * annotation children is authoritative for annotation sync; anything else
 * must be cross-checked against the Web API, the only source that exposes
 * annotation children.
 */
export function containsAnnotationChild(children: unknown[]): boolean {
  return children.some((child) => childItemData(child)?.itemType === "annotation");
}

export async function fetchAnnotationChildrenPreferLocal(
  fetchLocal: AnnotationChildrenFetcher,
  resolveWeb: () => Promise<AnnotationChildrenFetcher | null>
): Promise<AnnotationChildrenFetchResult> {
  let localError: unknown;
  let localChildren: unknown[] | null = null;
  try {
    localChildren = await fetchWithAnnotationImageFallback(fetchLocal);
  } catch (error) {
    localError = error;
  }

  if (localChildren !== null && containsAnnotationChild(localChildren)) {
    return { children: localChildren, hadFetchError: false, source: "local" };
  }

  // Either the local read failed, or it succeeded without annotation items,
  // which the local children endpoint cannot provide. Consult the Web API
  // before concluding that the attachment has no annotations.
  let fetchWeb: AnnotationChildrenFetcher | null;
  try {
    fetchWeb = await resolveWeb();
  } catch (webError) {
    return {
      children: [],
      hadFetchError: true,
      source: "none",
      localError,
      webError,
    };
  }
  if (!fetchWeb) {
    return {
      children: [],
      hadFetchError: true,
      source: "none",
      localError,
    };
  }
  try {
    const children = await fetchWithAnnotationImageFallback(fetchWeb);
    return { children, hadFetchError: false, source: "web", localError };
  } catch (webError) {
    return {
      children: [],
      hadFetchError: true,
      source: "none",
      localError,
      webError,
    };
  }
}

export function getAnnotationFetchPersistencePolicy(
  hadFetchError: boolean
): { replaceSnapshot: boolean; allowChunkDeletes: boolean } {
  const fetchComplete = !hadFetchError;
  return {
    replaceSnapshot: fetchComplete,
    allowChunkDeletes: fetchComplete,
  };
}
