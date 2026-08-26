import assert from "node:assert/strict";
import test from "node:test";

import {
  formatProcessExitDiagnostic,
  summarizePythonDiagnostic,
} from "../src/pythonDiagnostics";

test("SIGSEGV exit is reported instead of a generic Paddle error header", () => {
  const fallback = formatProcessExitDiagnostic(-11);

  assert.match(fallback, /SIGSEGV/);
  assert.match(fallback, /native process crash/);
  assert.equal(
    summarizePythonDiagnostic("Error Message Summary:\n", fallback),
    fallback
  );
});

test("ordinary Python failures still prefer their actionable diagnostic", () => {
  assert.equal(
    summarizePythonDiagnostic(
      "2026-08-26 06:00:00 INFO starting\nRuntimeError: API unavailable\n",
      formatProcessExitDiagnostic(2)
    ),
    "RuntimeError: API unavailable"
  );
});
