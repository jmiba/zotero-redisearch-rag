# LM Studio Provider Setup

This guide shows how to use LM Studio as an OpenAI-compatible provider for embeddings, chat, and OCR cleanup.

## Prerequisites
- Install and run [LM Studio](https://lmstudio.ai/).
- Enable the local API server in LM Studio.
- Keep LM Studio running while using the plugin.

## 1) Create an LM Studio provider profile
In plugin settings:

1. Open **LLMs**.
2. In **Provider profiles**, create or edit a profile:
   - **Name**: `LM Studio`
   - **Base URL**: `http://127.0.0.1:1234/v1` (or your LM Studio server URL)
   - **API key**: optional; LM Studio typically accepts any non-empty value.

Use the exact base URL shown in LM Studio if it differs.

## 2) Configure embeddings
In **LLMs → Embeddings**:

- Select your LM Studio profile.
- Set **Embed model** to the exact model ID shown in LM Studio.

Recommended for multilingual vaults:
- `text-embedding-embeddinggemma-300m`

If your LM Studio model ID is slightly different, use the exact value LM Studio shows.

## 3) Configure chat and cleanup
In **LLMs → Chat**:
- Select your LM Studio profile.
- Set **Chat model** to the exact LM Studio model ID.

In **OCR → OCR cleanup**:
- Enable cleanup if needed.
- Select the same LM Studio profile.
- Set cleanup model ID.

Recommended for chat and cleanup:
- `openai/gpt-oss-20b`

## 4) Quick verification
- Use **Start Redis stack now** (Prerequisites tab) if Redis is not running.
- Run a small import and open the chat panel.
- If model calls fail, verify:
  - LM Studio server is running.
  - Base URL matches LM Studio.
  - Model IDs match exactly (case-sensitive).

## Common pitfalls
- **Wrong model identifier**: use LM Studio’s exact model ID, not a guessed repository name.
- **Server not running**: LM Studio must stay open with API server enabled.
- **Port mismatch**: update base URL if LM Studio uses a non-default port.
