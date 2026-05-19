FROM python:3.12-slim

ENV DEBIAN_FRONTEND=noninteractive
ARG ZRR_TESSERACT_LANG_PACKS="eng deu fra spa ita nld por pol swe"

RUN set -eux; \
  apt-get update; \
  apt-get install -y --no-install-recommends \
    ca-certificates \
    ccache \
    gcc \
    g++ \
    libglib2.0-0 \
    libgl1 \
    libsm6 \
    libxext6 \
    libxrender1 \
    poppler-utils \
    tesseract-ocr; \
  for lang in ${ZRR_TESSERACT_LANG_PACKS}; do \
    [ -n "${lang}" ] || continue; \
    apt-get install -y --no-install-recommends "tesseract-ocr-${lang}"; \
  done; \
  rm -rf /var/lib/apt/lists/*

COPY tools/python-worker-entrypoint.sh /usr/local/bin/python-worker-entrypoint.sh
RUN chmod +x /usr/local/bin/python-worker-entrypoint.sh

WORKDIR /workspace

ENV ZRR_WORKER_REQUIREMENTS=/workspace/plugin/tools/requirements.txt
ENV ZRR_WORKER_VENV_DIR=/workspace/cache/venv
ENV DOCLING_ARTIFACTS_PATH=/workspace/cache/docling/models
ENV HF_HOME=/workspace/cache/huggingface
ENV HF_HUB_CACHE=/workspace/cache/huggingface/hub
ENV XDG_CACHE_HOME=/workspace/cache/xdg
ENV ZRR_DOCLING_PREFETCH=1
ENV PATH=/workspace/cache/venv/bin:$PATH
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK=True
ENV DISABLE_MODEL_SOURCE_CHECK=True

ENTRYPOINT ["/usr/local/bin/python-worker-entrypoint.sh"]
CMD ["/workspace/cache/venv/bin/python", "/workspace/plugin/tools/python-worker-api.py"]
