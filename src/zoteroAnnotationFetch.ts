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

export async function fetchAnnotationChildrenPreferLocal(
  fetchLocal: AnnotationChildrenFetcher,
  resolveWeb: () => Promise<AnnotationChildrenFetcher | null>
): Promise<AnnotationChildrenFetchResult> {
  try {
    const children = await fetchWithAnnotationImageFallback(fetchLocal);
    return { children, hadFetchError: false, source: "local" };
  } catch (localError) {
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
