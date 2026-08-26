function stripAnsiCodes(value: string): string {
  const escapeChar = String.fromCharCode(27);
  return value.replace(new RegExp(`${escapeChar}\\[[0-?]*[ -/]*[@-~]`, "g"), "");
}

function isLowSignalPythonDiagnosticLine(line: string): boolean {
  const trimmed = stripAnsiCodes(line).trim();
  return (
    /^\d{4}-\d{2}-\d{2}[T\s][^ ]+\s+(DEBUG|INFO)\b/.test(trimmed)
    || /^\[(DEBUG|INFO)\]\s+\d{4}-\d{2}-\d{2}\b/.test(trimmed)
    || (
      trimmed.includes("Connectivity check to the model hoster has been skipped")
      && trimmed.includes("PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK")
    )
    || /^Downloading https:\/\/raw\.githubusercontent\.com\/LibreOffice\/dictionaries\/.* -> /.test(trimmed)
    || /^Successfully downloaded Hunspell dictionary\b/.test(trimmed)
    || /^Failed to download https:\/\/raw\.githubusercontent\.com\/LibreOffice\/dictionaries\//.test(trimmed)
    || /^Loading weights:\s+/.test(trimmed)
  );
}

// @lat: [[tests#Tests#Native Worker Failure Diagnostics#Signal Exit Summary]]
export function formatProcessExitDiagnostic(exitCode: number): string {
  if (!Number.isFinite(exitCode)) {
    return "Process exited with code 1";
  }
  if (exitCode >= 0) {
    return `Process exited with code ${exitCode}`;
  }
  const signalNumber = Math.abs(Math.trunc(exitCode));
  const signalNames: Record<number, string> = {
    6: "SIGABRT",
    9: "SIGKILL",
    11: "SIGSEGV",
    15: "SIGTERM",
  };
  const signal = signalNames[signalNumber] ?? `signal ${signalNumber}`;
  const hints: Partial<Record<number, string>> = {
    6: " (native process abort)",
    9: " (possible worker memory limit or container kill)",
    11: " (native process crash, for example in Paddle or ONNX Runtime)",
  };
  return `Process was terminated by ${signal}${hints[signalNumber] ?? ""}`;
}

export function summarizePythonDiagnostic(raw: string, fallback: string): string {
  const normalizedFallback = stripAnsiCodes(fallback).trim();
  if (/^Process was terminated by\b/i.test(normalizedFallback)) {
    return fallback;
  }

  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => Boolean(line.trim()));
  if (!lines.length) {
    return fallback;
  }

  const explicit = [...lines].reverse().find((line) =>
    /^(timeout|timed out|canceled|cancelled|client_disconnected|process exited with code|process was terminated by)\b/i
      .test(stripAnsiCodes(line).trim())
  );
  if (explicit) {
    return explicit;
  }

  const actionableLines = lines.filter((line) => !isLowSignalPythonDiagnosticLine(line));
  if (!actionableLines.length) {
    return fallback;
  }

  const tracebackIndex = actionableLines.findIndex((line) => line.startsWith("Traceback"));
  if (tracebackIndex >= 0) {
    return actionableLines.slice(tracebackIndex).slice(-12).join("\n");
  }
  const preferred = [...actionableLines].reverse().find((line) => (
    /(^error[:\s]|exception|traceback|failed|\btimed out\b|\btimeout(?:\b|_while_waiting)|no module named|not found|enoent|econnrefused|enotfound|valueerror|typeerror|runtimeerror|importerror)/i
      .test(stripAnsiCodes(line))
  ));
  if (preferred) {
    return preferred;
  }
  return actionableLines.slice(-8).join("\n");
}
