#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="${ROOT_DIR}/dist"

PLUGIN_ID="$(python3 - <<'PY'
import json
from pathlib import Path
manifest = Path("manifest.json")
data = json.loads(manifest.read_text(encoding="utf-8"))
print(data.get("id", "plugin"))
PY
)"

rm -rf "${DIST_DIR}"
mkdir -p "${DIST_DIR}/${PLUGIN_ID}"

cp "${ROOT_DIR}/main.js" "${ROOT_DIR}/manifest.json" "${DIST_DIR}/${PLUGIN_ID}/"
cp -R "${ROOT_DIR}/tools" "${DIST_DIR}/${PLUGIN_ID}/"

(
  cd "${DIST_DIR}"
  zip -r "${PLUGIN_ID}.zip" "${PLUGIN_ID}" > /dev/null
)

echo "Release package created at ${DIST_DIR}/${PLUGIN_ID}.zip"
