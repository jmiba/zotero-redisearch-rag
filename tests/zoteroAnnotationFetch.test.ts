import assert from "node:assert/strict";
import test from "node:test";

import {
  fetchAnnotationChildrenPreferLocal,
  getAnnotationFetchPersistencePolicy,
  type AnnotationChildrenFetchOptions,
} from "../src/zoteroAnnotationFetch.ts";

// @lat: [[tests#Zotero Annotation Fetch Safety#Local Reads Without Annotations]]
test("local reads without annotation children defer to the Web API", async () => {
  // A successful local read can never contain annotation items, so it must
  // be cross-checked against the Web API before the fetch is complete.
  const localCalls: Array<AnnotationChildrenFetchOptions | undefined> = [];
  const webCalls: Array<AnnotationChildrenFetchOptions | undefined> = [];
  let webResolutions = 0;
  const crossChecked = await fetchAnnotationChildrenPreferLocal(
    async (options) => {
      localCalls.push(options);
      return [];
    },
    async () => {
      webResolutions += 1;
      return async (options) => {
        webCalls.push(options);
        return [{ key: "ANNOT001", data: { itemType: "annotation" } }];
      };
    }
  );
  assert.deepEqual(localCalls, [{ includeAnnotationImage: true }]);
  assert.equal(webResolutions, 1);
  assert.deepEqual(webCalls, [{ includeAnnotationImage: true }]);
  assert.equal(crossChecked.hadFetchError, false);
  assert.equal(crossChecked.source, "web");
  assert.deepEqual(crossChecked.children, [
    { key: "ANNOT001", data: { itemType: "annotation" } },
  ]);

  // A Web answer completes the fetch even when it lists no annotations.
  const webCallsEmpty: Array<AnnotationChildrenFetchOptions | undefined> = [];
  const emptyWeb = await fetchAnnotationChildrenPreferLocal(
    async () => [],
    async () =>
      async (options) => {
        webCallsEmpty.push(options);
        return [];
      }
  );
  assert.deepEqual(webCallsEmpty, [{ includeAnnotationImage: true }]);
  assert.equal(emptyWeb.hadFetchError, false);
  assert.equal(emptyWeb.source, "web");
  assert.deepEqual(emptyWeb.children, []);
  assert.deepEqual(getAnnotationFetchPersistencePolicy(emptyWeb.hadFetchError), {
    replaceSnapshot: true,
    allowChunkDeletes: true,
  });

  // A failing Web answer leaves the fetch incomplete and keeps the error.
  const webError = new Error("Web API unavailable");
  const failed = await fetchAnnotationChildrenPreferLocal(
    async () => [],
    async () =>
      async () => {
        throw webError;
      }
  );
  assert.equal(failed.hadFetchError, true);
  assert.equal(failed.source, "none");
  assert.equal(failed.localError, undefined);
  assert.equal(failed.webError, webError);
  assert.deepEqual(failed.children, []);
});

// @lat: [[tests#Zotero Annotation Fetch Safety#Local Reads With Annotations]]
test("local reads containing annotation children are authoritative", async () => {
  const localChildren = [
    { key: "NOTE001", data: { itemType: "note" } },
    { key: "ANNOT001", data: { itemType: "annotation" } },
  ];
  const result = await fetchAnnotationChildrenPreferLocal(
    async () => localChildren,
    async () => {
      throw new Error("Web API must not be resolved");
    }
  );
  assert.equal(result.hadFetchError, false);
  assert.equal(result.source, "local");
  assert.deepEqual(result.children, localChildren);

  // Annotation items without a nested data wrapper also make the read
  // authoritative.
  const flat = await fetchAnnotationChildrenPreferLocal(
    async () => [{ itemType: "annotation" }],
    async () => {
      throw new Error("Web API must not be resolved");
    }
  );
  assert.equal(flat.source, "local");
  assert.deepEqual(flat.children, [{ itemType: "annotation" }]);
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
