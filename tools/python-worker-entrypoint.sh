#!/bin/sh
set -eu

VENV_DIR="${ZRR_WORKER_VENV_DIR:-/workspace/cache/venv}"
STAMP_FILE="${VENV_DIR}/.requirements.sha256"
DOCLING_ARTIFACTS_PATH="${DOCLING_ARTIFACTS_PATH:-/workspace/cache/docling/models}"
HF_HOME="${HF_HOME:-/workspace/cache/huggingface}"
HF_HUB_CACHE="${HF_HUB_CACHE:-${HF_HOME}/hub}"
XDG_CACHE_HOME="${XDG_CACHE_HOME:-/workspace/cache/xdg}"
ZRR_DOCLING_PREFETCH="${ZRR_DOCLING_PREFETCH:-1}"

mkdir -p "$(dirname "${VENV_DIR}")"
mkdir -p "${DOCLING_ARTIFACTS_PATH}" "${HF_HOME}" "${HF_HUB_CACHE}" "${XDG_CACHE_HOME}"

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

if [ "${ZRR_DOCLING_PREFETCH}" = "1" ]; then
  DOCLING_VERSION="$("${VENV_DIR}/bin/python" - <<'PY'
import importlib.metadata as metadata
try:
    print(metadata.version("docling"))
except Exception:
    print("")
PY
)"
  PREFETCH_STAMP="${DOCLING_ARTIFACTS_PATH}/.zrr-docling-version"
  PREFETCH_NEEDED=0
  if [ -n "${DOCLING_VERSION}" ]; then
    if [ ! -f "${PREFETCH_STAMP}" ] || [ "$(cat "${PREFETCH_STAMP}" 2>/dev/null || true)" != "${DOCLING_VERSION}" ]; then
      PREFETCH_NEEDED=1
    fi
  elif [ -z "$(find "${DOCLING_ARTIFACTS_PATH}" -mindepth 1 -print -quit 2>/dev/null || true)" ]; then
    PREFETCH_NEEDED=1
  fi

  REQUIRED_DOCLING_MODEL_FILES="
RapidOcr/torch/PP-OCRv4/det/ch_PP-OCRv4_det_mobile.pth
"
  for required_model in ${REQUIRED_DOCLING_MODEL_FILES}; do
    if [ ! -f "${DOCLING_ARTIFACTS_PATH}/${required_model}" ]; then
      echo "Docling model cache is missing ${required_model}; refreshing model prefetch." >&2
      PREFETCH_NEEDED=1
      break
    fi
  done

  if [ "${PREFETCH_NEEDED}" = "1" ]; then
    echo "Prefetching Docling models into ${DOCLING_ARTIFACTS_PATH}..." >&2
    if "${VENV_DIR}/bin/python" - <<'PY'
import os
from pathlib import Path
from docling.utils.model_downloader import download_models

download_models(output_dir=Path(os.environ["DOCLING_ARTIFACTS_PATH"]))
PY
    then
      PREFETCH_COMPLETE=1
      for required_model in ${REQUIRED_DOCLING_MODEL_FILES}; do
        if [ ! -f "${DOCLING_ARTIFACTS_PATH}/${required_model}" ]; then
          echo "Warning: Docling model prefetch finished but ${required_model} is still missing." >&2
          PREFETCH_COMPLETE=0
          break
        fi
      done
      if [ "${PREFETCH_COMPLETE}" = "1" ] && [ -n "${DOCLING_VERSION}" ]; then
        printf "%s\n" "${DOCLING_VERSION}" > "${PREFETCH_STAMP}"
      fi
    else
      echo "Warning: Docling model prefetch failed; worker will continue and Docling may still try live downloads during import." >&2
    fi
  fi
fi

exec "$@"
