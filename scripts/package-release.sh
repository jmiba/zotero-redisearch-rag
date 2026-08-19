#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="${ROOT_DIR}/dist/community-release"

cd "${ROOT_DIR}"

RELEASE_BODY="$(node scripts/release-changelog.mjs)"
GITHUB_RELEASE_BODY="${RELEASE_BODY}" node scripts/generate-release-notes.mjs
npm run build:release

rm -rf "${DIST_DIR}"
mkdir -p "${DIST_DIR}"

cp "${ROOT_DIR}/main.js" "${ROOT_DIR}/manifest.json" "${DIST_DIR}/"
if [ -f "${ROOT_DIR}/styles.css" ]; then
  cp "${ROOT_DIR}/styles.css" "${DIST_DIR}/"
fi

echo "Release assets created in ${DIST_DIR}: main.js, manifest.json, styles.css"
