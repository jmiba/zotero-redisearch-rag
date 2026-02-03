/* eslint-disable no-undef */
"use strict";

var ZRRCompanionPrefs = {
  init() {
    // Placeholder for future settings logic.
  },
};

window.addEventListener(
  "load",
  () => {
    try {
      ZRRCompanionPrefs.init();
    } catch (error) {
      try {
        Zotero.logError(error);
      } catch {
        // ignore
      }
    }
  },
  { once: true }
);
