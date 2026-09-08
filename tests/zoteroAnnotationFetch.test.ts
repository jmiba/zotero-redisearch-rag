import assert from "node:assert/strict";
import test from "node:test";

import {
  fetchAnnotationChildrenPreferLocal,
  getAnnotationFetchPersistencePolicy,
  type AnnotationChildrenFetchOptions,
} from "../src/zoteroAnnotationFetch.ts";

// @lat: [[tests#Zotero Annotation Fetch Safety#Successful Empty Local Reads]]
test("successful empty local annotation reads do not contact the Web API", async () => {
  const directCalls: Array<AnnotationChildrenFetchOptions | undefined> = [];
  let directWebResolutions = 0;
  const directResult = await fetchAnnotationChildrenPreferLocal(
    async (options) => {
      directCalls.push(options);
      return [];
    },
    async () => {
      directWebResolutions += 1;
      return async () => {
        throw new Error("Web API should not be called");
      };
    }
  );

  assert.deepEqual(directCalls, [{ includeAnnotationImage: true }]);
  assert.equal(directWebResolutions, 0);
  assert.deepEqual(directResult, {
    children: [],
    hadFetchError: false,
    source: "local",
  });

  const fallbackCalls: Array<AnnotationChildrenFetchOptions | undefined> = [];
  let fallbackWebResolutions = 0;
  const fallbackResult = await fetchAnnotationChildrenPreferLocal(
    async (options) => {
      fallbackCalls.push(options);
      if (options?.includeAnnotationImage) {
        throw new Error("annotationImage unsupported");
      }
      return [];
    },
    async () => {
      fallbackWebResolutions += 1;
      return async () => [];
    }
  );

  assert.deepEqual(fallbackCalls, [{ includeAnnotationImage: true }, undefined]);
  assert.equal(fallbackWebResolutions, 0);
  assert.equal(fallbackResult.hadFetchError, false);
  assert.equal(fallbackResult.source, "local");
});

// @lat: [[tests#Zotero Annotation Fetch Safety#Web Fallback After Local Failure]]
test("Web annotation fallback runs only after both local requests fail", async () => {
  const localError = new Error("local API unavailable");
  const localCalls: Array<AnnotationChildrenFetchOptions | undefined> = [];
  const webCalls: Array<AnnotationChildrenFetchOptions | undefined> = [];
  let webResolutions = 0;

  const result = await fetchAnnotationChildrenPreferLocal(
    async (options) => {
      localCalls.push(options);
      throw localError;
    },
    async () => {
      webResolutions += 1;
      return async (options) => {
        webCalls.push(options);
        return [{ key: "ANNOT001" }];
      };
    }
  );

  assert.deepEqual(localCalls, [{ includeAnnotationImage: true }, undefined]);
  assert.equal(webResolutions, 1);
  assert.deepEqual(webCalls, [{ includeAnnotationImage: true }]);
  assert.deepEqual(result.children, [{ key: "ANNOT001" }]);
  assert.equal(result.hadFetchError, false);
  assert.equal(result.source, "web");
  assert.equal(result.localError, localError);
});

// @lat: [[tests#Zotero Annotation Fetch Safety#Incomplete Fetch Persistence]]
test("incomplete annotation fetches preserve snapshots and cached chunks", async () => {
  const localError = new Error("local API unavailable");
  const webError = new Error("Web API unavailable");
  const result = await fetchAnnotationChildrenPreferLocal(
    async () => {
      throw localError;
    },
    async () => async () => {
      throw webError;
    }
  );

  assert.equal(result.hadFetchError, true);
  assert.equal(result.source, "none");
  assert.equal(result.localError, localError);
  assert.equal(result.webError, webError);
  assert.deepEqual(getAnnotationFetchPersistencePolicy(result.hadFetchError), {
    replaceSnapshot: false,
    allowChunkDeletes: false,
  });
  assert.deepEqual(getAnnotationFetchPersistencePolicy(false), {
    replaceSnapshot: true,
    allowChunkDeletes: true,
  });
});
