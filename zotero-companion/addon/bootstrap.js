/* eslint-disable no-undef */
/* global Zotero, ChromeUtils, IOUtils, Cc, Ci */
"use strict";

let Services = (typeof globalThis !== "undefined" && globalThis.Services) ? globalThis.Services : null;
let NetUtil = (typeof globalThis !== "undefined" && globalThis.NetUtil) ? globalThis.NetUtil : null;

const PREF_BRANCH = "extensions.zrr_companion.";
const DEFAULT_PORT = 23120;

let serverSocket = null;
let currentPort = DEFAULT_PORT;
let chromeHandle = null;

function log(msg) {
  Zotero.debug(`ZRR Companion: ${msg}`);
}

function logConsole(msg) {
  if (!Services?.console) return;
  try {
    Services.console.logStringMessage(`ZRR Companion: ${msg}`);
  } catch {
    // ignore
  }
}

function importModule(esModulePaths, legacyPath) {
  if (ChromeUtils.importESModule) {
    for (const path of esModulePaths) {
      try {
        return ChromeUtils.importESModule(path);
      } catch {
        // try next path
      }
    }
    return null;
  }
  if (legacyPath && ChromeUtils.import) {
    try {
      return ChromeUtils.import(legacyPath);
    } catch {
      // ignore
    }
  }
  return null;
}

function ensureModules() {
  if (!Services && typeof globalThis !== "undefined" && globalThis.Services) {
    Services = globalThis.Services;
  }
  if (!NetUtil && typeof globalThis !== "undefined" && globalThis.NetUtil) {
    NetUtil = globalThis.NetUtil;
  }
  if (!Services) {
    const servicesModule = importModule(
      ["resource://gre/modules/Services.sys.mjs", "resource://gre/modules/Services.mjs"],
      "resource://gre/modules/Services.jsm"
    );
    Services = servicesModule?.Services || null;
  }

  if (!NetUtil) {
    const netUtilModule = importModule(
      ["resource://gre/modules/NetUtil.sys.mjs", "resource://gre/modules/NetUtil.mjs"],
      "resource://gre/modules/NetUtil.jsm"
    );
    NetUtil = netUtilModule?.NetUtil || null;
  }

  if (!Services || !NetUtil) {
    const missing = [
      !Services ? "Services" : null,
      !NetUtil ? "NetUtil" : null,
    ]
      .filter(Boolean)
      .join(", ");
    log(`Failed to load modules: ${missing}`);
    try {
      Zotero.logError(new Error(`ZRR Companion failed to load modules: ${missing}`));
    } catch {
      // ignore
    }
    return false;
  }

  return true;
}

function install() {
  log("Installed");
}

async function startup({ id, version, resourceURI, rootURI }, reason) {
  log(`Starting v${version}`);
  rootURI = rootURI || resourceURI.spec;
  try {
    if (!ensureModules()) {
      return;
    }
    await Zotero.initializationPromise;

    try {
      const aomStartup = Cc["@mozilla.org/addons/addon-manager-startup;1"]
        .getService(Ci.amIAddonManagerStartup);
      const manifestURI = Services.io.newURI(rootURI + "manifest.json");
      chromeHandle = aomStartup.registerChrome(manifestURI, [
        ["content", "zrr-companion", "content/"]
      ]);
    } catch (error) {
      log(`Chrome registration failed: ${error}`);
    }

    registerPreferencePane(rootURI);
    registerPrefObserver();
    startServer();
    if (!serverSocket) {
      Services.tm.dispatchToMainThread(() => {
        startServer();
      });
    }

    log("Startup complete");
  } catch (error) {
    log(`Startup error: ${error}`);
    Zotero.logError(error);
    logConsole(`Startup error: ${error}`);
  }
}

function shutdown({ id, version, resourceURI, rootURI }, reason) {
  if (reason === APP_SHUTDOWN) {
    return;
  }
  stopServer();
  if (chromeHandle) {
    chromeHandle.destruct();
    chromeHandle = null;
  }
  log("Shutdown complete");
}

function uninstall() {
  log("Uninstalled");
}

function getPref(name, fallback) {
  const prefName = `${PREF_BRANCH}${name}`;
  try {
    if (Zotero?.Prefs?.get) {
      const value = Zotero.Prefs.get(prefName);
      return value !== undefined && value !== null ? value : fallback;
    }
  } catch {
    // ignore
  }
  try {
    if (Services.prefs.getPrefType(prefName) === Services.prefs.PREF_STRING) {
      return Services.prefs.getStringPref(prefName, fallback);
    }
    if (Services.prefs.getPrefType(prefName) === Services.prefs.PREF_INT) {
      return Services.prefs.getIntPref(prefName, fallback);
    }
    if (Services.prefs.getPrefType(prefName) === Services.prefs.PREF_BOOL) {
      return Services.prefs.getBoolPref(prefName, fallback);
    }
  } catch {
    // ignore
  }
  return fallback;
}

function registerPreferencePane(rootURI) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ZoteroAny = Zotero;
    if (ZoteroAny.PreferencePanes?.register) {
      ZoteroAny.PreferencePanes.register({
        pluginID: "zrr-companion@zotero-redisearch-rag",
        src: rootURI + "content/preferences.xhtml",
        scripts: [rootURI + "content/preferences.js"],
        stylesheets: [rootURI + "content/preferences.css"],
        label: "Zotero Research Assistant Companion",
      });
      log("Preference pane registered");
    } else {
      log("PreferencePanes API not available");
    }
  } catch (error) {
    log(`Preference pane registration failed: ${error}`);
  }
}

function registerPrefObserver() {
  if (!Zotero?.Prefs?.registerObserver) {
    return;
  }
  try {
    Zotero.Prefs.registerObserver(`${PREF_BRANCH}port`, () => {
      refreshServerFromPrefs();
    }, true);
  } catch {
    // ignore
  }
}

function refreshServerFromPrefs() {
  const nextPort = Number(getPref("port", DEFAULT_PORT)) || DEFAULT_PORT;
  if (nextPort === currentPort) {
    return;
  }
  stopServer();
  currentPort = nextPort;
  startServer();
}

function startServer() {
  if (serverSocket) {
    return;
  }
  const port = Number(getPref("port", DEFAULT_PORT)) || DEFAULT_PORT;
  try {
    currentPort = port;
    serverSocket = Cc["@mozilla.org/network/server-socket;1"].createInstance(Ci.nsIServerSocket);
    serverSocket.init(port, true, -1);
    serverSocket.asyncListen({
      onSocketAccepted: (socket, transport) => {
        handleConnection(transport).catch((error) => {
          Zotero.logError(error);
          logConsole(`Request handler error: ${error}`);
        });
      },
      onStopListening: () => undefined,
    });
    log(`Listening on 127.0.0.1:${port}`);
    logConsole(`Listening on 127.0.0.1:${port}`);
  } catch (error) {
    serverSocket = null;
    log(`Failed to start server: ${error}`);
    logConsole(`Failed to start server: ${error}`);
    Zotero.logError(error);
  }
}

function stopServer() {
  if (!serverSocket) {
    return;
  }
  try {
    serverSocket.close();
  } catch (error) {
    Zotero.logError(error);
  } finally {
    serverSocket = null;
  }
}

async function handleConnection(transport) {
  const input = transport.openInputStream(0, 0, 0);
  const pump = Cc["@mozilla.org/network/input-stream-pump;1"].createInstance(Ci.nsIInputStreamPump);
  pump.init(input, 0, 0, false);

  let data = "";
  let handled = false;

  const processIfReady = (force) => {
    if (handled) {
      return;
    }
    if (!force && !data.includes("\r\n\r\n")) {
      return;
    }
    handled = true;
    const request = parseHttpRequest(data);
    if (!request) {
      writeJsonResponse(transport, 400, { error: "Malformed request" });
      return;
    }
    handleRequest(request, transport).catch((error) => {
      Zotero.logError(error);
      logConsole(`Request handler error: ${error}`);
    });
  };

  pump.asyncRead(
    {
      onStartRequest() {},
      onDataAvailable(request, stream, offset, count) {
        data += NetUtil.readInputStreamToString(stream, count);
        processIfReady(false);
      },
      onStopRequest(request, statusCode) {
        if (handled) {
          return;
        }
        if (statusCode !== 0) {
          logConsole(`Socket read failed (${statusCode})`);
          return;
        }
        processIfReady(true);
      },
    },
    null
  );
}

async function handleRequest(request, transport) {
  const started = Date.now();
  logConsole(`Request ${request.method} ${request.path}`);
  const token = String(getPref("token", "") || "").trim();
  if (token) {
    const header = request.headers.authorization || request.headers["x-zrr-token"] || "";
    const auth = header.startsWith("Bearer ") ? header.slice(7) : header;
    if (auth !== token) {
      writeJsonResponse(transport, 401, { error: "Unauthorized" });
      logConsole(`Responded 401 in ${Date.now() - started}ms`);
      return;
    }
  }

  let url;
  try {
    url = new URL(request.path, "http://127.0.0.1");
  } catch {
    writeJsonResponse(transport, 400, { error: "Malformed request" });
    return;
  }

  if (request.method !== "GET") {
    writeJsonResponse(transport, 405, { error: "Method not allowed" });
    logConsole(`Responded 405 in ${Date.now() - started}ms`);
    return;
  }

  if (url.pathname === "/health") {
    writeJsonResponse(transport, 200, { ok: true });
    logConsole(`Responded 200 /health in ${Date.now() - started}ms`);
    return;
  }

  const imageMatch = url.pathname.match(/^\/annotations\/([A-Za-z0-9]{8})\/image$/);
  if (imageMatch) {
    const key = imageMatch[1].toUpperCase();
    const result = await fetchAnnotationImage(key);
    if (!result) {
      writeJsonResponse(transport, 404, { error: "Annotation image not found" });
      logConsole(`Responded 404 /annotations/${key}/image in ${Date.now() - started}ms`);
      return;
    }
    writeBinaryResponse(transport, 200, "image/png", result);
    logConsole(`Responded 200 /annotations/${key}/image in ${Date.now() - started}ms`);
    return;
  }

  writeJsonResponse(transport, 404, { error: "Not found" });
  logConsole(`Responded 404 ${url.pathname} in ${Date.now() - started}ms`);
}

function parseHttpRequest(raw) {
  if (!raw) {
    return null;
  }
  const headerEnd = raw.indexOf("\r\n\r\n");
  const headerBlock = headerEnd >= 0 ? raw.slice(0, headerEnd) : raw;
  const lines = headerBlock.split("\r\n");
  if (!lines.length) {
    return null;
  }
  const [method, path] = lines[0].split(" ");
  if (!method || !path) {
    return null;
  }
  const headers = {};
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    const idx = line.indexOf(":");
    if (idx <= 0) {
      continue;
    }
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    headers[key] = value;
  }
  return { method, path, headers };
}

async function fetchAnnotationImage(annotationKey) {
  const annotationItem = await findAnnotationItem(annotationKey);
  if (!annotationItem) {
    return null;
  }
  const typeId = Zotero.ItemTypes.getID("annotation");
  if (annotationItem.itemTypeID !== typeId) {
    return null;
  }
  const annotationType =
    (annotationItem.annotationType || annotationItem.getField?.("annotationType") || "").toString().toLowerCase();
  if (annotationType !== "image" && annotationType !== "ink") {
    return null;
  }
  const imagePath = Zotero.Annotations.getCacheImagePath(annotationItem);
  if (!imagePath) {
    return null;
  }
  try {
    if (IOUtils?.exists && !(await IOUtils.exists(imagePath))) {
      return null;
    }
    if (IOUtils?.read) {
      return await IOUtils.read(imagePath);
    }
  } catch (error) {
    Zotero.logError(error);
    return null;
  }
  return null;
}

async function findAnnotationItem(annotationKey) {
  const libraryIds = getLibraryIds();
  for (const libraryID of libraryIds) {
    let item = null;
    if (Zotero.Items.getByLibraryAndKey) {
      item = Zotero.Items.getByLibraryAndKey(libraryID, annotationKey);
    } else if (Zotero.Items.getByLibraryAndKeyAsync) {
      item = await Zotero.Items.getByLibraryAndKeyAsync(libraryID, annotationKey);
    }
    if (item) {
      return item;
    }
  }
  if (Zotero.Items.getByLibraryAndKeyAsync) {
    for (const libraryID of libraryIds) {
      try {
        const item = await Zotero.Items.getByLibraryAndKeyAsync(libraryID, annotationKey);
        if (item) {
          return item;
        }
      } catch {
        // ignore
      }
    }
  }
  return null;
}

function getLibraryIds() {
  const ids = [];
  if (Zotero.Libraries?.userLibraryID) {
    ids.push(Zotero.Libraries.userLibraryID);
  }
  if (Zotero.Libraries?.getAll) {
    for (const library of Zotero.Libraries.getAll()) {
      if (library?.libraryID) {
        if (ids.includes(library.libraryID)) {
          continue;
        }
        ids.push(library.libraryID);
      }
    }
  }
  return ids;
}

function writeBinaryResponse(transport, status, contentType, body) {
  const bytes = body instanceof Uint8Array ? body : new Uint8Array(body);
  const headers = {
    "Content-Type": contentType,
    "Content-Length": String(bytes.length),
    Connection: "close",
  };
  writeResponse(transport, status, headers, bytes);
}

function writeJsonResponse(transport, status, payload) {
  const json = JSON.stringify(payload);
  const encoder = new TextEncoder();
  const bytes = encoder.encode(json);
  const headers = {
    "Content-Type": "application/json",
    "Content-Length": String(bytes.length),
    Connection: "close",
  };
  writeResponse(transport, status, headers, bytes);
}

function writeResponse(transport, status, headers, body) {
  const output = transport.openOutputStream(0, 0, 0);
  const binaryOut = Cc["@mozilla.org/binaryoutputstream;1"].createInstance(Ci.nsIBinaryOutputStream);
  binaryOut.setOutputStream(output);

  const statusLine = `HTTP/1.1 ${status} ${statusText(status)}\r\n`;
  binaryOut.writeBytes(statusLine, statusLine.length);
  for (const [key, value] of Object.entries(headers)) {
    const line = `${key}: ${value}\r\n`;
    binaryOut.writeBytes(line, line.length);
  }
  binaryOut.writeBytes("\r\n", 2);
  if (body?.length) {
    const bytes = body instanceof Uint8Array ? body : new Uint8Array(body);
    const chunkSize = 64 * 1024;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      const chunk = bytes.subarray(offset, offset + chunkSize);
      binaryOut.writeByteArray(Array.from(chunk), chunk.length);
    }
  }
  binaryOut.close();
}

function statusText(code) {
  switch (code) {
    case 200:
      return "OK";
    case 400:
      return "Bad Request";
    case 401:
      return "Unauthorized";
    case 404:
      return "Not Found";
    case 405:
      return "Method Not Allowed";
    default:
      return "OK";
  }
}
