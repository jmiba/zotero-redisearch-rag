#!/bin/sh
set -eu

VENV_DIR="${ZRR_WORKER_VENV_DIR:-/workspace/cache/venv}"
STAMP_FILE="${VENV_DIR}/.requirements.sha256"

mkdir -p "$(dirname "${VENV_DIR}")"

if [ ! -x "${VENV_DIR}/bin/python" ]; then
  python3 -m venv "${VENV_DIR}"
fi

REQ_FILE=""
for candidate in \
  "${ZRR_WORKER_REQUIREMENTS:-}" \
  "/workspace/plugin/tools/requirements.txt" \
  "/workspace/plugin/requirements.txt"
do
  if [ -n "${candidate}" ] && [ -f "${candidate}" ]; then
    REQ_FILE="${candidate}"
    break
  fi
done

if [ -z "${REQ_FILE}" ]; then
  echo "Python worker requirements file not found. Checked: ${ZRR_WORKER_REQUIREMENTS:-<unset>}, /workspace/plugin/tools/requirements.txt, /workspace/plugin/requirements.txt" >&2
  exit 2
fi

CURRENT_HASH="$(sha256sum "${REQ_FILE}" | awk '{print $1}')"
INSTALLED_HASH=""
if [ -f "${STAMP_FILE}" ]; then
  INSTALLED_HASH="$(cat "${STAMP_FILE}" || true)"
fi

if [ "${CURRENT_HASH}" != "${INSTALLED_HASH}" ]; then
  "${VENV_DIR}/bin/pip" install --upgrade pip
  "${VENV_DIR}/bin/pip" install -r "${REQ_FILE}"
  printf "%s\n" "${CURRENT_HASH}" > "${STAMP_FILE}"
fi

exec "$@"
