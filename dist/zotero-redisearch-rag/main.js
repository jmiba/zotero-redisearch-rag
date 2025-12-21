"use strict";var K=Object.create;var N=Object.defineProperty;var W=Object.getOwnPropertyDescriptor;var Y=Object.getOwnPropertyNames;var Q=Object.getPrototypeOf,X=Object.prototype.hasOwnProperty;var ee=(w,p)=>{for(var e in p)N(w,e,{get:p[e],enumerable:!0})},U=(w,p,e,t)=>{if(p&&typeof p=="object"||typeof p=="function")for(let r of Y(p))!X.call(w,r)&&r!==e&&N(w,r,{get:()=>p[r],enumerable:!(t=W(p,r))||t.enumerable});return w};var z=(w,p,e)=>(e=w!=null?K(Q(w)):{},U(p||!w||!w.__esModule?N(e,"default",{value:w,enumerable:!0}):e,w)),te=w=>U(N({},"__esModule",{value:!0}),w);var re={};ee(re,{default:()=>O});module.exports=te(re);var l=require("obsidian"),I=require("child_process"),E=require("fs"),G=z(require("http")),J=z(require("https")),h=z(require("path")),R=require("url");var f=require("obsidian"),D=".zotero-redisearch-rag",P=`${D}/items`,S=`${D}/chunks`,V={zoteroBaseUrl:"http://127.0.0.1:23119/api",zoteroUserId:"0",pythonPath:"python3",dockerPath:"docker",autoStartRedis:!1,copyPdfToVault:!0,frontmatterTemplate:`doc_id: {{doc_id}}
zotero_key: {{zotero_key}}
title: {{title_yaml}}
year: {{year}}
authors:
{{authors_yaml}}
item_type: {{item_type}}
pdf_link: {{pdf_link}}
item_json: {{item_json}}`,outputPdfDir:"zotero/pdfs",outputNoteDir:"zotero/notes",chatPaneLocation:"right",redisUrl:"redis://127.0.0.1:6379",redisIndex:"idx:zotero",redisPrefix:"zotero:chunk:",embedBaseUrl:"http://localhost:1234/v1",embedApiKey:"lm-studio",embedModel:"google/embedding-gemma-300m",chatBaseUrl:"http://127.0.0.1:1234/v1",chatApiKey:"",chatModel:"openai/gpt-oss-20b",chatTemperature:.2,ocrMode:"auto",chunkingMode:"page",enableLlmCleanup:!1,llmCleanupBaseUrl:"http://127.0.0.1:1234/v1",llmCleanupApiKey:"",llmCleanupModel:"openai/gpt-oss-20b",llmCleanupTemperature:0,llmCleanupMinQuality:.35,llmCleanupMaxChars:2e3},q=class extends f.PluginSettingTab{constructor(p,e){super(p,e),this.plugin=e}display(){let{containerEl:p}=this;p.empty(),p.createEl("h2",{text:"Zotero RAG Settings"}),new f.Setting(p).setName("Zotero base URL").setDesc("Local Zotero API base URL, e.g. http://127.0.0.1:23119/api").addText(e=>e.setPlaceholder("http://127.0.0.1:23119/api").setValue(this.plugin.settings.zoteroBaseUrl).onChange(async t=>{this.plugin.settings.zoteroBaseUrl=t.trim(),await this.plugin.saveSettings()})),new f.Setting(p).setName("Zotero user ID").setDesc("Use 0 for local library. You can also enter users/<id> or groups/<id>.").addText(e=>e.setPlaceholder("123456").setValue(this.plugin.settings.zoteroUserId).onChange(async t=>{this.plugin.settings.zoteroUserId=t.trim(),await this.plugin.saveSettings()})),new f.Setting(p).setName("Python path").setDesc("Path to python3").addText(e=>e.setPlaceholder("python3").setValue(this.plugin.settings.pythonPath).onChange(async t=>{this.plugin.settings.pythonPath=t.trim()||"python3",await this.plugin.saveSettings()})),new f.Setting(p).setName("Copy PDFs into vault").setDesc("Disable to use Zotero storage paths directly.").addToggle(e=>e.setValue(this.plugin.settings.copyPdfToVault).onChange(async t=>{this.plugin.settings.copyPdfToVault=t,await this.plugin.saveSettings()})),new f.Setting(p).setName("Frontmatter template").setDesc("Use {{doc_id}}, {{zotero_key}}, {{title}}, {{title_yaml}}, {{year}}, {{date}}, {{authors}}, {{authors_yaml}}, {{tags}}, {{item_type}}, {{pdf_link}}, {{item_json}}").addTextArea(e=>{e.inputEl.rows=8,e.setValue(this.plugin.settings.frontmatterTemplate).onChange(async t=>{this.plugin.settings.frontmatterTemplate=t,await this.plugin.saveSettings()})}),new f.Setting(p).setName("Docker path").setDesc("CLI path for Docker (used to start Redis Stack).").addText(e=>e.setPlaceholder("docker").setValue(this.plugin.settings.dockerPath).onChange(async t=>{this.plugin.settings.dockerPath=t.trim()||"docker",await this.plugin.saveSettings()})),p.createEl("h3",{text:"Output folders (vault-relative)"}),new f.Setting(p).setName("PDF folder").addText(e=>e.setPlaceholder("zotero/pdfs").setValue(this.plugin.settings.outputPdfDir).onChange(async t=>{this.plugin.settings.outputPdfDir=t.trim(),await this.plugin.saveSettings()})),new f.Setting(p).setName("Notes folder").addText(e=>e.setPlaceholder("zotero/notes").setValue(this.plugin.settings.outputNoteDir).onChange(async t=>{this.plugin.settings.outputNoteDir=t.trim(),await this.plugin.saveSettings()})),p.createEl("h3",{text:"Redis Stack"}),new f.Setting(p).setName("Redis URL").addText(e=>e.setPlaceholder("redis://127.0.0.1:6379").setValue(this.plugin.settings.redisUrl).onChange(async t=>{this.plugin.settings.redisUrl=t.trim(),await this.plugin.saveSettings()})),new f.Setting(p).setName("Index name").addText(e=>e.setPlaceholder("idx:zotero").setValue(this.plugin.settings.redisIndex).onChange(async t=>{this.plugin.settings.redisIndex=t.trim(),await this.plugin.saveSettings()})),new f.Setting(p).setName("Key prefix").addText(e=>e.setPlaceholder("zotero:chunk:").setValue(this.plugin.settings.redisPrefix).onChange(async t=>{this.plugin.settings.redisPrefix=t.trim(),await this.plugin.saveSettings()})),new f.Setting(p).setName("Auto-start Redis Stack (Docker Compose)").setDesc("Requires Docker Desktop running and your vault path shared with Docker.").addToggle(e=>e.setValue(this.plugin.settings.autoStartRedis).onChange(async t=>{this.plugin.settings.autoStartRedis=t,await this.plugin.saveSettings()})),new f.Setting(p).setName("Start Redis Stack now").setDesc("Runs Docker Compose with the vault data directory.").addButton(e=>e.setButtonText("Start").onClick(async()=>{await this.plugin.startRedisStack()})),p.createEl("h3",{text:"Embeddings (LM Studio)"}),new f.Setting(p).setName("Embeddings base URL").addText(e=>e.setPlaceholder("http://localhost:1234/v1").setValue(this.plugin.settings.embedBaseUrl).onChange(async t=>{this.plugin.settings.embedBaseUrl=t.trim(),await this.plugin.saveSettings()})),new f.Setting(p).setName("Embeddings API key").addText(e=>e.setPlaceholder("lm-studio").setValue(this.plugin.settings.embedApiKey).onChange(async t=>{this.plugin.settings.embedApiKey=t.trim(),await this.plugin.saveSettings()})),new f.Setting(p).setName("Embeddings model").addText(e=>e.setPlaceholder("google/embedding-gemma-300m").setValue(this.plugin.settings.embedModel).onChange(async t=>{this.plugin.settings.embedModel=t.trim(),await this.plugin.saveSettings()})),p.createEl("h3",{text:"Chat LLM"}),new f.Setting(p).setName("Chat base URL").setDesc("OpenAI-compatible chat endpoint base URL").addText(e=>e.setPlaceholder("http://localhost:1234/v1").setValue(this.plugin.settings.chatBaseUrl).onChange(async t=>{this.plugin.settings.chatBaseUrl=t.trim(),await this.plugin.saveSettings()})),new f.Setting(p).setName("Chat API key").addText(e=>e.setPlaceholder("lm-studio").setValue(this.plugin.settings.chatApiKey).onChange(async t=>{this.plugin.settings.chatApiKey=t.trim(),await this.plugin.saveSettings()})),new f.Setting(p).setName("Chat model").addText(e=>e.setPlaceholder("meta-llama/llama-3.1-405b-instruct").setValue(this.plugin.settings.chatModel).onChange(async t=>{this.plugin.settings.chatModel=t.trim(),await this.plugin.saveSettings()})),new f.Setting(p).setName("Temperature").addText(e=>e.setPlaceholder("0.2").setValue(String(this.plugin.settings.chatTemperature)).onChange(async t=>{let r=Number.parseFloat(t);this.plugin.settings.chatTemperature=Number.isFinite(r)?r:.2,await this.plugin.saveSettings()})),new f.Setting(p).setName("Chat panel location").setDesc("Where to open the chat view by default.").addDropdown(e=>e.addOption("right","Right sidebar").addOption("main","Main window").setValue(this.plugin.settings.chatPaneLocation).onChange(async t=>{this.plugin.settings.chatPaneLocation=t,await this.plugin.saveSettings()})),p.createEl("h3",{text:"Docling"}),new f.Setting(p).setName("OCR mode").setDesc("auto, force, or off").addDropdown(e=>e.addOption("auto","auto").addOption("force","force").addOption("off","off").setValue(this.plugin.settings.ocrMode).onChange(async t=>{this.plugin.settings.ocrMode=t,await this.plugin.saveSettings()})),new f.Setting(p).setName("Chunking").setDesc("page or section").addDropdown(e=>e.addOption("page","page").addOption("section","section").setValue(this.plugin.settings.chunkingMode).onChange(async t=>{this.plugin.settings.chunkingMode=t,await this.plugin.saveSettings()})),p.createEl("h4",{text:"OCR cleanup (optional)"}),new f.Setting(p).setName("LLM cleanup for low-quality chunks").setDesc("Optional OpenAI-compatible cleanup for poor OCR. Can be slow/costly.").addToggle(e=>e.setValue(this.plugin.settings.enableLlmCleanup).onChange(async t=>{this.plugin.settings.enableLlmCleanup=t,await this.plugin.saveSettings()})),new f.Setting(p).setName("LLM cleanup base URL").setDesc("OpenAI-compatible endpoint, e.g. http://127.0.0.1:1234/v1").addText(e=>e.setPlaceholder("http://127.0.0.1:1234/v1").setValue(this.plugin.settings.llmCleanupBaseUrl).onChange(async t=>{this.plugin.settings.llmCleanupBaseUrl=t.trim(),await this.plugin.saveSettings()})),new f.Setting(p).setName("LLM cleanup API key").setDesc("Optional API key for the cleanup endpoint.").addText(e=>e.setPlaceholder("sk-...").setValue(this.plugin.settings.llmCleanupApiKey).onChange(async t=>{this.plugin.settings.llmCleanupApiKey=t.trim(),await this.plugin.saveSettings()})),new f.Setting(p).setName("LLM cleanup model").setDesc("Model to use for cleanup.").addText(e=>e.setPlaceholder("openai/gpt-oss-20b").setValue(this.plugin.settings.llmCleanupModel).onChange(async t=>{this.plugin.settings.llmCleanupModel=t.trim(),await this.plugin.saveSettings()})),new f.Setting(p).setName("LLM cleanup temperature").setDesc("Lower is more conservative.").addText(e=>e.setPlaceholder("0.0").setValue(String(this.plugin.settings.llmCleanupTemperature)).onChange(async t=>{let r=Number.parseFloat(t);this.plugin.settings.llmCleanupTemperature=Number.isFinite(r)?r:0,await this.plugin.saveSettings()})),new f.Setting(p).setName("LLM cleanup min quality").setDesc("Only run cleanup when chunk quality is below this threshold (0-1).").addText(e=>e.setPlaceholder("0.35").setValue(String(this.plugin.settings.llmCleanupMinQuality)).onChange(async t=>{let r=Number.parseFloat(t);this.plugin.settings.llmCleanupMinQuality=Number.isFinite(r)?r:.35,await this.plugin.saveSettings()})),new f.Setting(p).setName("LLM cleanup max chars").setDesc("Skip cleanup for chunks longer than this limit.").addText(e=>e.setPlaceholder("2000").setValue(String(this.plugin.settings.llmCleanupMaxChars)).onChange(async t=>{let r=Number.parseInt(t,10);this.plugin.settings.llmCleanupMaxChars=Number.isFinite(r)?r:2e3,await this.plugin.saveSettings()}))}};var H={"docling_extract.py":String.raw`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.1.5
import argparse
import json
import logging
import os
import re
import sys
from dataclasses import dataclass
from typing import Any, Callable, Dict, Iterable, List, Optional, Sequence, Tuple


LOGGER = logging.getLogger("docling_extract")


def eprint(message: str) -> None:
    sys.stderr.write(message + "\n")


@dataclass
class DoclingProcessingConfig:
    ocr_mode: str = "auto"
    prefer_ocr_engine: str = "paddle"
    fallback_ocr_engine: str = "tesseract"
    language_hint: Optional[str] = None
    default_lang_german: str = "deu+eng"
    default_lang_english: str = "eng"
    min_text_chars_per_page: int = 40
    min_text_pages_ratio: float = 0.3
    quality_alpha_ratio_threshold: float = 0.6
    quality_suspicious_token_threshold: float = 0.25
    quality_min_avg_chars_per_page: int = 80
    per_page_ocr_on_low_quality: bool = True
    enable_post_correction: bool = True
    enable_dictionary_correction: bool = False
    dictionary_path: Optional[str] = None
    dictionary_words: Optional[Sequence[str]] = None
    default_dictionary_name: str = "ocr_wordlist.txt"
    enable_llm_correction: bool = False
    llm_correct: Optional[Callable[[str], str]] = None
    llm_cleanup_base_url: Optional[str] = None
    llm_cleanup_api_key: Optional[str] = None
    llm_cleanup_model: Optional[str] = None
    llm_cleanup_temperature: float = 0.0
    llm_cleanup_timeout_sec: int = 60
    llm_correction_min_quality: float = 0.35
    llm_correction_max_chars: int = 2000
    postprocess_markdown: bool = False
    analysis_max_pages: int = 5
    ocr_dpi: int = 300


@dataclass
class OcrRouteDecision:
    ocr_used: bool
    ocr_engine: str
    languages: str
    route_reason: str
    use_external_ocr: bool
    per_page_ocr: bool
    per_page_reason: str


@dataclass
class TextQuality:
    avg_chars_per_page: float
    alpha_ratio: float
    suspicious_token_ratio: float
    confidence_proxy: float

@dataclass
class DoclingConversionResult:
    markdown: str
    pages: List[Dict[str, Any]]
    metadata: Dict[str, Any]


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def normalize_whitespace(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def dehyphenate_text(text: str) -> str:
    return re.sub(r"(?<=\w)-\s*\n\s*(?=\w)", "", text)


def replace_ligatures(text: str) -> str:
    return (
        text.replace("\ufb01", "fi")
        .replace("\ufb02", "fl")
        .replace("\ufb03", "ffi")
        .replace("\ufb04", "ffl")
    )


def estimate_text_quality(pages: Sequence[Dict[str, Any]]) -> TextQuality:
    if not pages:
        return TextQuality(0.0, 0.0, 1.0, 0.0)

    texts = [str(page.get("text", "")) for page in pages]
    total_chars = sum(len(text) for text in texts)
    alpha_chars = sum(sum(char.isalpha() for char in text) for text in texts)
    alpha_ratio = alpha_chars / max(1, total_chars)

    tokens = re.findall(r"[A-Za-z0-9]+", " ".join(texts))
    suspicious_tokens = [
        token for token in tokens
        if (sum(char.isdigit() for char in token) / max(1, len(token))) > 0.5
        or re.search(r"(.)\1\1", token)
    ]
    suspicious_ratio = len(suspicious_tokens) / max(1, len(tokens))

    avg_chars = total_chars / max(1, len(pages))
    confidence = max(0.0, min(1.0, alpha_ratio * (1.0 - suspicious_ratio)))
    return TextQuality(avg_chars, alpha_ratio, suspicious_ratio, confidence)


def detect_text_layer_from_pages(pages: Sequence[Dict[str, Any]], config: DoclingProcessingConfig) -> bool:
    if not pages:
        return False
    pages_with_text = 0
    for page in pages:
        cleaned = normalize_text(str(page.get("text", "")))
        if len(cleaned) >= config.min_text_chars_per_page:
            pages_with_text += 1
    ratio = pages_with_text / max(1, len(pages))
    return ratio >= config.min_text_pages_ratio


def is_low_quality(quality: TextQuality, config: DoclingProcessingConfig) -> bool:
    return (
        quality.avg_chars_per_page < config.quality_min_avg_chars_per_page
        or quality.alpha_ratio < config.quality_alpha_ratio_threshold
        or quality.suspicious_token_ratio > config.quality_suspicious_token_threshold
    )


def decide_per_page_ocr(
    has_text_layer: bool,
    quality: TextQuality,
    config: DoclingProcessingConfig,
) -> Tuple[bool, str]:
    if not config.per_page_ocr_on_low_quality:
        return False, "Per-page OCR disabled by config"
    if not has_text_layer and is_low_quality(quality, config):
        return True, "Low-quality scan detected"
    if quality.suspicious_token_ratio > config.quality_suspicious_token_threshold:
        return True, "High suspicious token ratio"
    if quality.avg_chars_per_page < config.quality_min_avg_chars_per_page:
        return True, "Low text density"
    return False, "Quality metrics acceptable"


def select_language_set(
    language_hint: Optional[str],
    filename: str,
    config: DoclingProcessingConfig,
) -> str:
    hint = (language_hint or "").lower().strip()
    name = os.path.basename(filename).lower()

    if hint:
        if any(token in hint for token in ("de", "deu", "ger", "german", "deutsch")):
            return config.default_lang_german
        if any(token in hint for token in ("en", "eng", "english")):
            return config.default_lang_english
        return hint

    if re.search(r"(\bde\b|_de\b|-de\b|deu|german|deutsch)", name):
        return config.default_lang_german
    return config.default_lang_english


def normalize_languages_for_engine(languages: str, engine: str) -> str:
    lang = languages.lower()
    if engine == "paddle":
        if any(token in lang for token in ("deu", "ger", "de", "german", "deutsch")):
            return "german"
        return "en"
    return languages


def decide_ocr_route(
    has_text_layer: bool,
    quality: TextQuality,
    available_engines: Sequence[str],
    config: DoclingProcessingConfig,
    languages: str,
) -> OcrRouteDecision:
    if config.ocr_mode == "off":
        return OcrRouteDecision(
            False,
            "none",
            languages,
            "OCR disabled by config",
            False,
            False,
            "Per-page OCR disabled by config",
        )

    if config.ocr_mode == "force":
        ocr_used = True
        route_reason = "OCR forced by config"
    elif has_text_layer:
        return OcrRouteDecision(
            False,
            "none",
            languages,
            "Text layer detected",
            False,
            False,
            "Per-page OCR not applicable (text layer)",
        )
    else:
        ocr_used = True
        route_reason = "No usable text layer detected"

    engine = "docling"
    use_external = False
    if ocr_used:
        if config.prefer_ocr_engine in available_engines:
            engine = config.prefer_ocr_engine
            use_external = True
        elif config.fallback_ocr_engine in available_engines:
            engine = config.fallback_ocr_engine
            use_external = True

    low_quality = is_low_quality(quality, config)
    per_page = False
    per_page_reason = "Per-page OCR not applicable"
    if use_external:
        per_page, per_page_reason = decide_per_page_ocr(has_text_layer, quality, config)
    if low_quality and not has_text_layer:
        route_reason = f"{route_reason}; low-quality scan suspected"

    return OcrRouteDecision(ocr_used, engine, languages, route_reason, use_external, per_page, per_page_reason)


def detect_available_ocr_engines() -> List[str]:
    available: List[str] = []
    try:
        import paddleocr  # noqa: F401
        from pdf2image import convert_from_path  # noqa: F401
        available.append("paddle")
    except Exception:
        pass
    try:
        import pytesseract  # noqa: F401
        from pdf2image import convert_from_path  # noqa: F401
        available.append("tesseract")
    except Exception:
        pass
    return available


def load_default_wordlist(config: DoclingProcessingConfig) -> Sequence[str]:
    path = config.dictionary_path
    if not path:
        path = os.path.join(os.path.dirname(__file__), config.default_dictionary_name)
    if not path or not os.path.isfile(path):
        return []
    try:
        with open(path, "r", encoding="utf-8") as handle:
            return [line.strip() for line in handle if line.strip() and not line.startswith("#")]
    except Exception as exc:
        LOGGER.warning("Failed to load dictionary word list: %s", exc)
        return []


def prepare_dictionary_words(config: DoclingProcessingConfig) -> Sequence[str]:
    if not config.enable_dictionary_correction:
        return []
    if config.dictionary_words:
        return [word.strip() for word in config.dictionary_words if word and word.strip()]
    words = load_default_wordlist(config)
    if not words:
        LOGGER.warning("Dictionary correction enabled but no wordlist was loaded.")
    return words


def apply_dictionary_correction(text: str, wordlist: Sequence[str]) -> str:
    if not wordlist:
        return text
    dictionary = {word.lower() for word in wordlist}
    token_re = re.compile(r"[A-Za-z0-9]+")

    def match_case(candidate: str, original: str) -> str:
        if original.isupper():
            return candidate.upper()
        if original[:1].isupper():
            return candidate.capitalize()
        return candidate

    def generate_candidates(token: str) -> Iterable[str]:
        candidates: List[str] = []
        if any(char.isdigit() for char in token) and any(char.isalpha() for char in token):
            candidates.append(token.replace("0", "o"))
            candidates.append(token.replace("1", "l"))
            candidates.append(token.replace("5", "s"))
        if "rn" in token:
            candidates.append(token.replace("rn", "m"))
        return candidates

    def replace_token(match: re.Match) -> str:
        token = match.group(0)
        lower = token.lower()
        if lower in dictionary:
            return token
        for candidate in generate_candidates(token):
            if candidate.lower() in dictionary:
                return match_case(candidate, token)
        return token

    return token_re.sub(replace_token, text)


def apply_umlaut_corrections(text: str, languages: str, wordlist: Sequence[str]) -> str:
    lang = languages.lower()
    if not any(token in lang for token in ("de", "deu", "german", "deutsch")):
        return text

    dictionary = {word.lower() for word in wordlist}
    replacements = {
        "ueber": "\u00fcber",
        "fuer": "f\u00fcr",
        "koennen": "k\u00f6nnen",
        "muessen": "m\u00fcssen",
        "haeufig": "h\u00e4ufig",
    }

    def replace_match(match: re.Match) -> str:
        token = match.group(0)
        lower = token.lower()
        if lower in replacements:
            replacement = replacements[lower]
            if token.isupper():
                return replacement.upper()
            if token[:1].isupper():
                return replacement.capitalize()
            return replacement
        if dictionary:
            for ascii_seq, umlaut in (("ae", "\u00e4"), ("oe", "\u00f6"), ("ue", "\u00fc")):
                if ascii_seq in lower:
                    candidate = lower.replace(ascii_seq, umlaut)
                    if candidate in dictionary:
                        return candidate
        return token

    return re.sub(r"[A-Za-z]{4,}", replace_match, text)


def should_apply_llm_correction(text: str, config: DoclingProcessingConfig) -> bool:
    if not config.enable_llm_correction:
        return False
    if not config.llm_correct:
        return False
    if config.llm_correction_max_chars and len(text) > config.llm_correction_max_chars:
        return False
    quality = estimate_text_quality([{"text": text}])
    return quality.confidence_proxy < config.llm_correction_min_quality


def build_llm_cleanup_callback(config: DoclingProcessingConfig) -> Optional[Callable[[str], str]]:
    if not config.enable_llm_correction:
        return None
    if not config.llm_cleanup_base_url or not config.llm_cleanup_model:
        LOGGER.warning("LLM cleanup enabled but base URL or model is missing.")
        return None

    base_url = config.llm_cleanup_base_url.rstrip("/")
    endpoint = f"{base_url}/chat/completions"
    api_key = (config.llm_cleanup_api_key or "").strip()

    def _call(text: str) -> str:
        try:
            import requests
        except Exception as exc:
            LOGGER.warning("requests not available for LLM cleanup: %s", exc)
            return text

        headers = {"Content-Type": "application/json"}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        payload = {
            "model": config.llm_cleanup_model,
            "temperature": config.llm_cleanup_temperature,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are an OCR cleanup assistant. Fix OCR errors without changing meaning. "
                        "Do not add content. Return corrected text only."
                    ),
                },
                {"role": "user", "content": text},
            ],
        }
        try:
            response = requests.post(endpoint, headers=headers, json=payload, timeout=config.llm_cleanup_timeout_sec)
            response.raise_for_status()
            data = response.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content")
            if content:
                return str(content).strip()
        except Exception as exc:
            LOGGER.warning("LLM cleanup failed: %s", exc)
        return text

    return _call


def postprocess_text(
    text: str,
    config: DoclingProcessingConfig,
    languages: str,
    wordlist: Sequence[str],
) -> str:
    if not text:
        return text
    cleaned = dehyphenate_text(text)
    cleaned = replace_ligatures(cleaned)
    cleaned = normalize_whitespace(cleaned)
    if config.enable_dictionary_correction:
        cleaned = apply_dictionary_correction(cleaned, wordlist)
    cleaned = apply_umlaut_corrections(cleaned, languages, wordlist)
    if should_apply_llm_correction(cleaned, config) and config.llm_correct:
        cleaned = config.llm_correct(cleaned)
    return cleaned

def export_markdown(doc: Any) -> str:
    for method_name in ("export_to_markdown", "to_markdown", "export_to_md"):
        method = getattr(doc, method_name, None)
        if callable(method):
            return method()
    for method_name in ("export_to_text", "to_text"):
        method = getattr(doc, method_name, None)
        if callable(method):
            return method()
    return str(doc)


def export_text(doc: Any) -> str:
    for method_name in ("export_to_text", "to_text"):
        method = getattr(doc, method_name, None)
        if callable(method):
            return method()
    return str(doc)


def extract_pages(doc: Any) -> List[Dict[str, Any]]:
    pages: List[Dict[str, Any]] = []
    pages_attr = getattr(doc, "pages", None)
    if pages_attr is not None and not isinstance(pages_attr, (str, bytes, dict)):
        try:
            pages_list = list(pages_attr)
        except TypeError:
            pages_list = []
        if pages_list:
            for idx, page in enumerate(pages_list, start=1):
                page_num = getattr(page, "page_number", None) or getattr(page, "number", None) or idx
                text = None
                for attr in ("text", "content", "markdown", "md"):
                    if hasattr(page, attr):
                        value = getattr(page, attr)
                        text = value() if callable(value) else value
                        break
                if text is None and hasattr(page, "export_to_text"):
                    text = page.export_to_text()
                if text is None:
                    text = str(page)
                pages.append({"page_num": int(page_num), "text": str(text)})
            return pages

    full_text = export_text(doc)
    if full_text:
        pages.append({"page_num": 1, "text": full_text})
    return pages


def extract_pages_from_pdf(pdf_path: str, max_pages: Optional[int] = None) -> List[Dict[str, Any]]:
    try:
        from pypdf import PdfReader
    except Exception as exc:
        eprint(f"pypdf is not available for fallback page extraction: {exc}")
        return []

    pages: List[Dict[str, Any]] = []
    try:
        reader = PdfReader(pdf_path)
        for idx, page in enumerate(reader.pages, start=1):
            if max_pages is not None and idx > max_pages:
                break
            try:
                text = page.extract_text() or ""
            except Exception:
                text = ""
            pages.append({"page_num": idx, "text": text})
    except Exception as exc:
        eprint(f"Failed to extract pages with pypdf: {exc}")
        return []

    return pages


def split_markdown_sections(markdown: str) -> List[Dict[str, Any]]:
    sections: List[Dict[str, Any]] = []
    current_title = ""
    current_lines: List[str] = []

    def flush() -> None:
        nonlocal current_title, current_lines
        if current_title or current_lines:
            sections.append({
                "title": current_title.strip(),
                "text": "\n".join(current_lines).strip(),
            })
        current_title = ""
        current_lines = []

    for line in markdown.splitlines():
        if line.startswith("#"):
            flush()
            current_title = line.lstrip("#").strip()
        else:
            current_lines.append(line)

    flush()
    return sections


def find_page_range(section_text: str, pages: List[Dict[str, Any]]) -> Tuple[int, int]:
    if not pages:
        return 0, 0

    cleaned = normalize_text(section_text)
    if not cleaned:
        return 0, 0

    snippet_start = cleaned[:200]
    snippet_end = cleaned[-200:]

    page_start = 0
    page_end = 0

    for page in pages:
        page_clean = normalize_text(page.get("text", ""))
        if snippet_start and snippet_start in page_clean:
            page_start = page.get("page_num", 0)
            break

    for page in reversed(pages):
        page_clean = normalize_text(page.get("text", ""))
        if snippet_end and snippet_end in page_clean:
            page_end = page.get("page_num", 0)
            break

    if page_start == 0:
        page_start = pages[0].get("page_num", 0)
    if page_end == 0:
        page_end = pages[-1].get("page_num", 0)

    return int(page_start), int(page_end)


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug


def configure_layout_options(pipeline_options: Any) -> None:
    if hasattr(pipeline_options, "layout_mode"):
        pipeline_options.layout_mode = "accurate"
    if hasattr(pipeline_options, "detect_layout"):
        pipeline_options.detect_layout = True
    if hasattr(pipeline_options, "extract_tables"):
        pipeline_options.extract_tables = True
    if hasattr(pipeline_options, "table_structure"):
        pipeline_options.table_structure = True
    layout_options = getattr(pipeline_options, "layout_options", None)
    if layout_options is not None:
        for name, value in (
            ("detect_columns", True),
            ("detect_tables", True),
            ("enable_table_structure", True),
            ("max_columns", 3),
        ):
            if hasattr(layout_options, name):
                setattr(layout_options, name, value)


def build_converter(config: DoclingProcessingConfig, decision: OcrRouteDecision):
    from docling.document_converter import DocumentConverter

    try:
        from docling.datamodel.base_models import InputFormat
        from docling.datamodel.pipeline_options import PdfPipelineOptions, OCRMode
        from docling.document_converter import PdfFormatOption
    except Exception:
        return DocumentConverter()

    pipeline_options = PdfPipelineOptions()
    if not decision.ocr_used:
        if hasattr(pipeline_options, "do_ocr"):
            pipeline_options.do_ocr = False
        if hasattr(pipeline_options, "ocr_mode"):
            pipeline_options.ocr_mode = OCRMode.DISABLED
    elif config.ocr_mode == "force":
        if hasattr(pipeline_options, "do_ocr"):
            pipeline_options.do_ocr = True
        if hasattr(pipeline_options, "ocr_mode"):
            pipeline_options.ocr_mode = OCRMode.FORCE
    else:
        if hasattr(pipeline_options, "ocr_mode"):
            pipeline_options.ocr_mode = OCRMode.AUTO

    if decision.ocr_used:
        if hasattr(pipeline_options, "ocr_engine"):
            pipeline_options.ocr_engine = decision.ocr_engine
        if hasattr(pipeline_options, "ocr_languages"):
            pipeline_options.ocr_languages = decision.languages
        if hasattr(pipeline_options, "ocr_lang"):
            pipeline_options.ocr_lang = decision.languages

    configure_layout_options(pipeline_options)

    format_options = {InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)}
    return DocumentConverter(format_options=format_options)


def render_pdf_pages(pdf_path: str, dpi: int) -> List[Any]:
    from pdf2image import convert_from_path

    return convert_from_path(pdf_path, dpi=dpi)


def ocr_pages_with_paddle(images: Sequence[Any], languages: str) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    from paddleocr import PaddleOCR

    try:
        import numpy as np
    except Exception as exc:
        raise RuntimeError(f"numpy is required for PaddleOCR: {exc}") from exc

    ocr = PaddleOCR(use_angle_cls=True, lang=languages)
    pages: List[Dict[str, Any]] = []
    confidences: List[float] = []

    for idx, image in enumerate(images, start=1):
        result = ocr.ocr(np.array(image), cls=True)
        lines: List[str] = []
        if result:
            for entry in result[0] if isinstance(result, list) else result:
                if not entry:
                    continue
                if isinstance(entry, (list, tuple)) and len(entry) >= 2:
                    text_part = entry[1]
                    if isinstance(text_part, (list, tuple)) and text_part:
                        lines.append(str(text_part[0]))
                        if len(text_part) > 1 and isinstance(text_part[1], (float, int)):
                            confidences.append(float(text_part[1]))
                    else:
                        lines.append(str(text_part))
        pages.append({"page_num": idx, "text": "\n".join(lines)})

    avg_conf = sum(confidences) / len(confidences) if confidences else None
    return pages, {"ocr_confidence_avg": avg_conf}


def ocr_pages_with_tesseract(images: Sequence[Any], languages: str) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    import pytesseract

    pages: List[Dict[str, Any]] = []
    for idx, image in enumerate(images, start=1):
        text = pytesseract.image_to_string(image, lang=languages)
        pages.append({"page_num": idx, "text": text})
    return pages, {}


def run_external_ocr_pages(
    pdf_path: str,
    engine: str,
    languages: str,
    config: DoclingProcessingConfig,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    images = render_pdf_pages(pdf_path, config.ocr_dpi)
    if engine == "paddle":
        return ocr_pages_with_paddle(images, normalize_languages_for_engine(languages, engine))
    if engine == "tesseract":
        return ocr_pages_with_tesseract(images, normalize_languages_for_engine(languages, engine))
    return [], {}


def convert_pdf_with_docling(pdf_path: str, config: DoclingProcessingConfig) -> DoclingConversionResult:
    analysis_pages = extract_pages_from_pdf(pdf_path, max_pages=config.analysis_max_pages)
    has_text_layer = detect_text_layer_from_pages(analysis_pages, config)
    quality = estimate_text_quality(analysis_pages)
    languages = select_language_set(config.language_hint, pdf_path, config)
    available_engines = detect_available_ocr_engines()
    decision = decide_ocr_route(has_text_layer, quality, available_engines, config, languages)

    LOGGER.info(
        "Text-layer check: %s (avg_chars=%.1f, alpha_ratio=%.2f, suspicious=%.2f)",
        has_text_layer,
        quality.avg_chars_per_page,
        quality.alpha_ratio,
        quality.suspicious_token_ratio,
    )
    if available_engines:
        LOGGER.info("Available OCR engines: %s", ", ".join(available_engines))
    else:
        LOGGER.info("Available OCR engines: none (external OCR disabled)")

    LOGGER.info(
        "Docling OCR route: %s (engine=%s, languages=%s)",
        decision.route_reason,
        decision.ocr_engine,
        decision.languages,
    )
    LOGGER.info("Per-page OCR: %s (%s)", decision.per_page_ocr, decision.per_page_reason)
    if decision.ocr_used and not decision.use_external_ocr:
        LOGGER.info("External OCR unavailable; relying on Docling OCR.")

    converter = build_converter(config, decision)
    result = converter.convert(pdf_path)
    doc = result.document if hasattr(result, "document") else result
    markdown = export_markdown(doc)
    pages = extract_pages(doc)
    if len(pages) <= 1:
        fallback_pages = extract_pages_from_pdf(pdf_path)
        if len(fallback_pages) > len(pages):
            pages = fallback_pages

    ocr_stats: Dict[str, Any] = {}
    if decision.ocr_used and decision.use_external_ocr and decision.per_page_ocr:
        try:
            ocr_pages, ocr_stats = run_external_ocr_pages(pdf_path, decision.ocr_engine, languages, config)
            if ocr_pages:
                pages = ocr_pages
                if config.postprocess_markdown and not markdown.strip():
                    markdown = "\n\n".join(page.get("text", "") for page in ocr_pages)
        except Exception as exc:
            LOGGER.warning("External OCR failed (%s): %s", decision.ocr_engine, exc)

    metadata = {
        "ocr_used": decision.ocr_used,
        "ocr_engine": decision.ocr_engine,
        "languages": decision.languages,
        "route_reason": decision.route_reason,
        "per_page_reason": decision.per_page_reason,
        "text_layer_detected": has_text_layer,
        "avg_chars_per_page": quality.avg_chars_per_page,
        "alpha_ratio": quality.alpha_ratio,
        "suspicious_token_ratio": quality.suspicious_token_ratio,
        "confidence_proxy": quality.confidence_proxy,
        "per_page_ocr": decision.per_page_ocr,
    }
    metadata.update(ocr_stats)
    return DoclingConversionResult(markdown=markdown, pages=pages, metadata=metadata)


def build_chunks_page(
    doc_id: str,
    pages: List[Dict[str, Any]],
    postprocess: Optional[Callable[[str], str]] = None,
) -> List[Dict[str, Any]]:
    chunks: List[Dict[str, Any]] = []
    for page in pages:
        raw_text = str(page.get("text", ""))
        if postprocess:
            raw_text = postprocess(raw_text)
        cleaned = normalize_text(raw_text)
        if not cleaned:
            continue
        page_num = int(page.get("page_num", 0))
        chunk_id = f"p{page_num}"
        chunks.append({
            "chunk_id": chunk_id,
            "text": cleaned,
            "page_start": page_num,
            "page_end": page_num,
            "section": "",
            "char_count": len(cleaned),
        })
    return chunks


def build_chunks_section(
    doc_id: str,
    markdown: str,
    pages: List[Dict[str, Any]],
    postprocess: Optional[Callable[[str], str]] = None,
) -> List[Dict[str, Any]]:
    sections = split_markdown_sections(markdown)
    chunks: List[Dict[str, Any]] = []
    seen_ids: Dict[str, int] = {}

    if not sections:
        return build_chunks_page(doc_id, pages)

    for idx, section in enumerate(sections, start=1):
        title = section.get("title", "")
        text = section.get("text", "")
        if postprocess:
            text = postprocess(text)
        cleaned = normalize_text(text)
        if not cleaned:
            continue
        page_start, page_end = find_page_range(cleaned, pages)
        base_id = slugify(title) or f"section-{idx}"
        if base_id in seen_ids:
            seen_ids[base_id] += 1
            chunk_id = f"{base_id}-{seen_ids[base_id]}"
        else:
            seen_ids[base_id] = 1
            chunk_id = base_id
        chunks.append({
            "chunk_id": chunk_id,
            "text": cleaned,
            "page_start": page_start,
            "page_end": page_end,
            "section": title,
            "char_count": len(cleaned),
        })
    return chunks


def main() -> int:
    parser = argparse.ArgumentParser(description="Extract PDF content with Docling and produce chunks.")
    parser.add_argument("--pdf", required=True, help="Path to PDF")
    parser.add_argument("--doc-id", required=True, help="Document identifier")
    parser.add_argument("--out-json", required=True, help="Output JSON path")
    parser.add_argument("--out-md", required=True, help="Output markdown path")
    parser.add_argument("--chunking", choices=["page", "section"], default="page")
    parser.add_argument("--ocr", choices=["auto", "force", "off"], default="auto")
    parser.add_argument("--enable-llm-cleanup", action="store_true", help="Enable LLM cleanup for low-quality chunks")
    parser.add_argument("--llm-cleanup-base-url", help="OpenAI-compatible base URL for LLM cleanup")
    parser.add_argument("--llm-cleanup-api-key", help="API key for LLM cleanup")
    parser.add_argument("--llm-cleanup-model", help="Model name for LLM cleanup")
    parser.add_argument("--llm-cleanup-temperature", type=float, help="Temperature for LLM cleanup")
    parser.add_argument("--llm-cleanup-max-chars", type=int, help="Max chars per chunk for LLM cleanup")
    parser.add_argument("--llm-cleanup-min-quality", type=float, help="Min quality threshold for LLM cleanup")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO)

    if not os.path.isfile(args.pdf):
        eprint(f"PDF not found: {args.pdf}")
        return 2

    try:
        out_json_dir = os.path.dirname(args.out_json)
        out_md_dir = os.path.dirname(args.out_md)
        if out_json_dir:
            os.makedirs(out_json_dir, exist_ok=True)
        if out_md_dir:
            os.makedirs(out_md_dir, exist_ok=True)
    except Exception as exc:
        eprint(f"Failed to create output directories: {exc}")
        return 2

    config = DoclingProcessingConfig(ocr_mode=args.ocr)
    if args.enable_llm_cleanup:
        config.enable_llm_correction = True
    if args.llm_cleanup_base_url:
        config.llm_cleanup_base_url = args.llm_cleanup_base_url
    if args.llm_cleanup_api_key:
        config.llm_cleanup_api_key = args.llm_cleanup_api_key
    if args.llm_cleanup_model:
        config.llm_cleanup_model = args.llm_cleanup_model
    if args.llm_cleanup_temperature is not None:
        config.llm_cleanup_temperature = args.llm_cleanup_temperature
    if args.llm_cleanup_max_chars is not None:
        config.llm_correction_max_chars = args.llm_cleanup_max_chars
    if args.llm_cleanup_min_quality is not None:
        config.llm_correction_min_quality = args.llm_cleanup_min_quality

    config.llm_correct = build_llm_cleanup_callback(config)

    try:
        conversion = convert_pdf_with_docling(args.pdf, config)
    except Exception as exc:
        eprint(f"Docling conversion failed: {exc}")
        return 2

    markdown = conversion.markdown
    if config.enable_post_correction and config.postprocess_markdown and conversion.metadata.get("ocr_used"):
        wordlist = prepare_dictionary_words(config)
        languages = conversion.metadata.get("languages", config.default_lang_english)
        markdown = postprocess_text(markdown, config, languages, wordlist)

    try:
        with open(args.out_md, "w", encoding="utf-8") as handle:
            handle.write(markdown)
    except Exception as exc:
        eprint(f"Failed to write markdown: {exc}")
        return 2

    try:
        pages = conversion.pages
        languages = conversion.metadata.get("languages", config.default_lang_english)
        postprocess_fn: Optional[Callable[[str], str]] = None
        if config.enable_post_correction and conversion.metadata.get("ocr_used"):
            wordlist = prepare_dictionary_words(config)
            postprocess_fn = lambda text: postprocess_text(text, config, languages, wordlist)

        if postprocess_fn:
            pages = [
                {"page_num": page.get("page_num", idx + 1), "text": postprocess_fn(str(page.get("text", "")))}
                for idx, page in enumerate(pages)
            ]

        if args.chunking == "section":
            chunks = build_chunks_section(args.doc_id, markdown, pages, postprocess=postprocess_fn)
        else:
            chunks = build_chunks_page(args.doc_id, pages)
    except Exception as exc:
        eprint(f"Failed to build chunks: {exc}")
        return 2

    chunks = [chunk for chunk in chunks if chunk.get("text")]

    payload = {
        "doc_id": args.doc_id,
        "source_pdf": args.pdf,
        "chunks": chunks,
        "metadata": conversion.metadata,
    }

    try:
        with open(args.out_json, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, indent=2)
    except Exception as exc:
        eprint(f"Failed to write JSON: {exc}")
        return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())
`,"index_redisearch.py":String.raw`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.1.5
import argparse
import json
import math
import os
import struct
import sys
from typing import Any, Dict, List

import redis
import requests


def eprint(message: str) -> None:
    sys.stderr.write(message + "\n")


def normalize_vector(values: List[float]) -> List[float]:
    norm = math.sqrt(sum(v * v for v in values))
    if norm == 0:
        return values
    return [v / norm for v in values]


def vector_to_bytes(values: List[float]) -> bytes:
    return struct.pack("<" + "f" * len(values), *values)


def request_embedding(base_url: str, api_key: str, model: str, text: str) -> List[float]:
    url = base_url.rstrip("/") + "/embeddings"
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    response = requests.post(url, json={"input": text, "model": model}, headers=headers, timeout=120)
    if response.status_code >= 400:
        raise RuntimeError(f"Embedding request failed: {response.status_code} {response.text}")
    payload = response.json()
    data = payload.get("data")
    if not data:
        raise RuntimeError("Embedding response missing data field")
    embedding = data[0].get("embedding")
    if not embedding:
        raise RuntimeError("Embedding response missing embedding")
    return [float(x) for x in embedding]


def ensure_index(client: redis.Redis, index_name: str, prefix: str) -> None:
    try:
        client.execute_command("FT.INFO", index_name)
        return
    except redis.exceptions.ResponseError as exc:
        message = str(exc).lower()
        if "unknown index name" not in message:
            raise

    client.execute_command(
        "FT.CREATE",
        index_name,
        "ON",
        "HASH",
        "PREFIX",
        "1",
        prefix,
        "SCHEMA",
        "doc_id",
        "TAG",
        "chunk_id",
        "TAG",
        "source_pdf",
        "TEXT",
        "page_start",
        "NUMERIC",
        "page_end",
        "NUMERIC",
        "section",
        "TEXT",
        "text",
        "TEXT",
        "embedding",
        "VECTOR",
        "HNSW",
        "6",
        "TYPE",
        "FLOAT32",
        "DIM",
        "768",
        "DISTANCE_METRIC",
        "COSINE",
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Index Docling chunks into RedisSearch.")
    parser.add_argument("--chunks-json", required=True)
    parser.add_argument("--redis-url", required=True)
    parser.add_argument("--index", required=True)
    parser.add_argument("--prefix", required=True)
    parser.add_argument("--embed-base-url", required=True)
    parser.add_argument("--embed-api-key", default="")
    parser.add_argument("--embed-model", required=True)
    parser.add_argument("--upsert", action="store_true")
    parser.add_argument("--progress", action="store_true")
    args = parser.parse_args()

    if not os.path.isfile(args.chunks_json):
        eprint(f"Chunks JSON not found: {args.chunks_json}")
        return 2

    try:
        with open(args.chunks_json, "r", encoding="utf-8") as handle:
            payload = json.load(handle)
    except Exception as exc:
        eprint(f"Failed to read chunks JSON: {exc}")
        return 2

    doc_id = payload.get("doc_id")
    chunks = payload.get("chunks")
    if not doc_id or not isinstance(chunks, list):
        eprint("Invalid chunks JSON schema")
        return 2

    client = redis.Redis.from_url(args.redis_url, decode_responses=False)

    try:
        ensure_index(client, args.index, args.prefix)
    except Exception as exc:
        eprint(f"Failed to ensure index: {exc}")
        return 2

    valid_chunks = []
    for chunk in chunks:
        text = str(chunk.get("text", ""))
        if not text.strip():
            continue
        chunk_id = chunk.get("chunk_id")
        if not chunk_id:
            continue
        valid_chunks.append(chunk)

    total = len(valid_chunks)
    current = 0

    for chunk in valid_chunks:
        current += 1
        text = str(chunk.get("text", ""))
        chunk_id = chunk.get("chunk_id")

        stable_chunk_id = f"{doc_id}:{chunk_id}"
        key = f"{args.prefix}{stable_chunk_id}"

        if not args.upsert and client.exists(key):
            continue

        try:
            embedding = request_embedding(args.embed_base_url, args.embed_api_key, args.embed_model, text)
            if len(embedding) != 768:
                raise RuntimeError(f"Embedding dim mismatch: {len(embedding)}")
            embedding = normalize_vector(embedding)
        except Exception as exc:
            eprint(f"Embedding failed for chunk {stable_chunk_id}: {exc}")
            return 2

        fields: Dict[str, Any] = {
            "doc_id": str(doc_id),
            "chunk_id": stable_chunk_id,
            "source_pdf": str(payload.get("source_pdf", "")),
            "page_start": int(chunk.get("page_start", 0)),
            "page_end": int(chunk.get("page_end", 0)),
            "section": str(chunk.get("section", "")),
            "text": text,
            "embedding": vector_to_bytes(embedding),
        }

        try:
            client.hset(key, mapping=fields)
        except Exception as exc:
            eprint(f"Failed to index chunk {stable_chunk_id}: {exc}")
            return 2

        if args.progress:
            print(json.dumps({"type": "progress", "current": current, "total": total}), flush=True)

    return 0


if __name__ == "__main__":
    sys.exit(main())
`,"rag_query_redisearch.py":String.raw`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.1.5
import argparse
import json
import math
import struct
import sys
from typing import Any, Dict, List

import redis
import requests


def eprint(message: str) -> None:
    sys.stderr.write(message + "\n")


def normalize_vector(values: List[float]) -> List[float]:
    norm = math.sqrt(sum(v * v for v in values))
    if norm == 0:
        return values
    return [v / norm for v in values]


def vector_to_bytes(values: List[float]) -> bytes:
    return struct.pack("<" + "f" * len(values), *values)


def request_embedding(base_url: str, api_key: str, model: str, text: str) -> List[float]:
    url = base_url.rstrip("/") + "/embeddings"
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    response = requests.post(url, json={"input": text, "model": model}, headers=headers, timeout=120)
    response.encoding = "utf-8"
    if response.status_code >= 400:
        raise RuntimeError(f"Embedding request failed: {response.status_code} {response.text}")
    payload = response.json()
    data = payload.get("data")
    if not data:
        raise RuntimeError("Embedding response missing data field")
    embedding = data[0].get("embedding")
    if not embedding:
        raise RuntimeError("Embedding response missing embedding")
    return [float(x) for x in embedding]


def is_temperature_unsupported(message: str) -> bool:
    lowered = message.lower()
    return "temperature" in lowered and (
        "not supported" in lowered or "unsupported" in lowered or "unknown parameter" in lowered
    )


def is_stream_unsupported(message: str) -> bool:
    lowered = message.lower()
    return "stream" in lowered and ("not supported" in lowered or "unsupported" in lowered or "unknown parameter" in lowered)


def request_chat(
    base_url: str,
    api_key: str,
    model: str,
    temperature: float,
    system_prompt: str,
    user_prompt: str,
) -> str:
    url = base_url.rstrip("/") + "/chat/completions"
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    base_payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }
    payload = dict(base_payload)
    payload["temperature"] = temperature

    response = requests.post(url, json=payload, headers=headers, timeout=120)
    response.encoding = "utf-8"
    if response.status_code >= 400:
        error_text = response.text
        if is_temperature_unsupported(error_text):
            response = requests.post(url, json=base_payload, headers=headers, timeout=120)
            response.encoding = "utf-8"
            if response.status_code >= 400:
                raise RuntimeError(f"Chat request failed: {response.status_code} {response.text}")
        else:
            raise RuntimeError(f"Chat request failed: {response.status_code} {error_text}")

    data = response.json()
    choices = data.get("choices")
    if not choices:
        raise RuntimeError("Chat response missing choices")
    message = choices[0].get("message") or {}
    content = message.get("content")
    if not content:
        raise RuntimeError("Chat response missing content")
    return content


def request_chat_stream(
    base_url: str,
    api_key: str,
    model: str,
    temperature: float,
    system_prompt: str,
    user_prompt: str,
    on_delta,
) -> str:
    url = base_url.rstrip("/") + "/chat/completions"
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    base_payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "stream": True,
    }
    payload = dict(base_payload)
    payload["temperature"] = temperature

    response = requests.post(url, json=payload, headers=headers, timeout=120, stream=True)
    response.encoding = "utf-8"
    if response.status_code >= 400:
        error_text = response.text
        if is_temperature_unsupported(error_text):
            response = requests.post(url, json=base_payload, headers=headers, timeout=120, stream=True)
            response.encoding = "utf-8"
            if response.status_code >= 400:
                raise RuntimeError(f"Chat request failed: {response.status_code} {response.text}")
        else:
            raise RuntimeError(f"Chat request failed: {response.status_code} {error_text}")

    content_parts: List[str] = []
    for raw_line in response.iter_lines(decode_unicode=True):
        if not raw_line:
            continue
        line = raw_line.strip()
        if not line.startswith("data:"):
            continue
        data = line[5:].strip()
        if data == "[DONE]":
            break
        try:
            payload = json.loads(data)
        except Exception:
            continue
        choices = payload.get("choices") or []
        if not choices:
            continue
        delta = choices[0].get("delta") or {}
        piece = delta.get("content")
        if not piece:
            continue
        content_parts.append(piece)
        on_delta(piece)

    return "".join(content_parts)


def decode_value(value: Any) -> Any:
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="ignore")
    return value


def parse_results(raw: List[Any]) -> List[Dict[str, Any]]:
    results: List[Dict[str, Any]] = []
    if not raw or len(raw) < 2:
        return results

    for idx in range(1, len(raw), 2):
        if idx + 1 >= len(raw):
            break
        fields_raw = raw[idx + 1]
        if not isinstance(fields_raw, list):
            continue
        field_map: Dict[str, Any] = {}
        for i in range(0, len(fields_raw), 2):
            key = decode_value(fields_raw[i])
            value = decode_value(fields_raw[i + 1]) if i + 1 < len(fields_raw) else ""
            field_map[str(key)] = value
        results.append(field_map)
    return results


def build_context(retrieved: List[Dict[str, Any]]) -> str:
    blocks = []
    for chunk in retrieved:
        doc_id = chunk.get("doc_id", "")
        chunk_id = chunk.get("chunk_id", "")
        source_pdf = chunk.get("source_pdf", "")
        page_start = chunk.get("page_start", "")
        page_end = chunk.get("page_end", "")
        score = chunk.get("score", "")
        text = chunk.get("text", "")
        pages = f"{page_start}-{page_end}"
        block = (
            f"<Document source='{source_pdf}' pages='{pages}' doc_id='{doc_id}' "
            f"chunk_id='{chunk_id}' score='{score}'>\n{text}\n</Document>"
        )
        blocks.append(block)
    return "\n\n".join(blocks)


def build_citations(retrieved: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    seen = set()
    citations: List[Dict[str, Any]] = []
    for chunk in retrieved:
        doc_id = chunk.get("doc_id", "")
        page_start = chunk.get("page_start", "")
        page_end = chunk.get("page_end", "")
        source_pdf = chunk.get("source_pdf", "")
        key = (doc_id, page_start, page_end, source_pdf)
        if key in seen:
            continue
        seen.add(key)
        citations.append({
            "doc_id": doc_id,
            "page_start": page_start,
            "page_end": page_end,
            "pages": f"{page_start}-{page_end}",
            "source_pdf": source_pdf,
        })
    return citations


def main() -> int:
    parser = argparse.ArgumentParser(description="Query RedisSearch and answer with RAG.")
    parser.add_argument("--query", required=True)
    parser.add_argument("--k", type=int, default=5)
    parser.add_argument("--redis-url", required=True)
    parser.add_argument("--index", required=True)
    parser.add_argument("--prefix", required=True)
    parser.add_argument("--embed-base-url", required=True)
    parser.add_argument("--embed-api-key", default="")
    parser.add_argument("--embed-model", required=True)
    parser.add_argument("--chat-base-url", required=True)
    parser.add_argument("--chat-api-key", default="")
    parser.add_argument("--chat-model", required=True)
    parser.add_argument("--temperature", type=float, default=0.2)
    parser.add_argument("--stream", action="store_true")
    args = parser.parse_args()

    try:
        embedding = request_embedding(args.embed_base_url, args.embed_api_key, args.embed_model, args.query)
        if len(embedding) != 768:
            raise RuntimeError(f"Embedding dim mismatch: {len(embedding)}")
        embedding = normalize_vector(embedding)
        vec = vector_to_bytes(embedding)
    except Exception as exc:
        eprint(f"Failed to embed query: {exc}")
        return 2

    client = redis.Redis.from_url(args.redis_url, decode_responses=False)

    try:
        raw = client.execute_command(
            "FT.SEARCH",
            args.index,
            f"*=>[KNN {args.k} @embedding $vec AS score]",
            "PARAMS",
            "2",
            "vec",
            vec,
            "SORTBY",
            "score",
            "RETURN",
            "8",
            "doc_id",
            "chunk_id",
            "source_pdf",
            "page_start",
            "page_end",
            "section",
            "text",
            "score",
            "DIALECT",
            "2",
        )
    except Exception as exc:
        eprint(f"RedisSearch query failed: {exc}")
        return 2

    retrieved = parse_results(raw)
    context = build_context(retrieved)

    system_prompt = (
        "Use ONLY the provided context. If insufficient, say you do not know. "
        "Provide citations by doc_id and pages."
    )
    user_prompt = f"Question: {args.query}\n\nContext:\n{context}"

    citations = build_citations(retrieved)

    answer = ""
    streamed = False
    if args.stream:
        def emit(obj: Dict[str, Any]) -> None:
            print(json.dumps(obj, ensure_ascii=False), flush=True)

        try:
            answer = request_chat_stream(
                args.chat_base_url,
                args.chat_api_key,
                args.chat_model,
                args.temperature,
                system_prompt,
                user_prompt,
                lambda chunk: emit({"type": "delta", "content": chunk}),
            )
            streamed = True
        except Exception as exc:
            if is_stream_unsupported(str(exc)):
                streamed = False
            else:
                eprint(f"Chat request failed: {exc}")
                return 2

    if not streamed:
        try:
            answer = request_chat(
                args.chat_base_url,
                args.chat_api_key,
                args.chat_model,
                args.temperature,
                system_prompt,
                user_prompt,
            )
        except Exception as exc:
            eprint(f"Chat request failed: {exc}")
            return 2

    output = {
        "query": args.query,
        "answer": answer,
        "citations": citations,
        "retrieved": retrieved,
    }

    if args.stream and streamed:
        print(json.dumps({"type": "final", **output}, ensure_ascii=False), flush=True)
    else:
        print(json.dumps(output, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
`,"batch_index_pyzotero.py":String.raw`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.1.5
import argparse
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List, Set

from pyzotero import zotero
from tqdm import tqdm


def eprint(message: str) -> None:
    sys.stderr.write(message + "\n")


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def load_checkpoint(path: Path) -> Set[str]:
    if not path.exists():
        return set()
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        items = data.get("processed", [])
        return set(str(x) for x in items)
    except Exception:
        return set()


def save_checkpoint(path: Path, processed: Set[str]) -> None:
    payload = {"processed": sorted(processed)}
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def run_script(script: Path, args: List[str]) -> None:
    command = [sys.executable, str(script)] + args
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or f"Command failed: {' '.join(command)}")


def fetch_parent_item(client: zotero.Zotero, parent_key: str) -> Dict[str, Any]:
    try:
        item = client.item(parent_key)
        if isinstance(item, list):
            return item[0] if item else {}
        return item
    except Exception:
        return {}


def main() -> int:
    parser = argparse.ArgumentParser(description="Batch index a Zotero library with Docling and RedisSearch.")
    parser.add_argument("--library-id", required=True)
    parser.add_argument("--library-type", choices=["user", "group"], required=True)
    parser.add_argument("--api-key", required=True)
    parser.add_argument("--redis-url", required=True)
    parser.add_argument("--index", required=True)
    parser.add_argument("--prefix", required=True)
    parser.add_argument("--embed-base-url", required=True)
    parser.add_argument("--embed-api-key", default="")
    parser.add_argument("--embed-model", required=True)
    parser.add_argument("--out-dir", default="./data")
    parser.add_argument("--ocr", choices=["auto", "force", "off"], default="auto")
    parser.add_argument("--chunking", choices=["page", "section"], default="page")
    parser.add_argument("--limit", type=int)
    parser.add_argument("--since", type=int)
    parser.add_argument("--reindex", action="store_true")
    args = parser.parse_args()

    out_dir = Path(args.out_dir).resolve()
    pdf_dir = out_dir / "pdfs"
    item_dir = out_dir / "items"
    doc_dir = out_dir / "docs"
    chunk_dir = out_dir / "chunks"
    checkpoint_path = out_dir / "checkpoint.json"

    for folder in (pdf_dir, item_dir, doc_dir, chunk_dir):
        ensure_dir(folder)

    processed = set() if args.reindex else load_checkpoint(checkpoint_path)

    client = zotero.Zotero(args.library_id, args.library_type, args.api_key)

    params: Dict[str, Any] = {"itemType": "attachment"}
    if args.limit:
        params["limit"] = args.limit
    if args.since:
        params["since"] = args.since

    try:
        attachments = client.everything(client.items(**params))
    except Exception as exc:
        eprint(f"Failed to fetch Zotero items: {exc}")
        return 2

    pdf_items = []
    for item in attachments:
        data = item.get("data", {})
        content_type = data.get("contentType", "") or ""
        if content_type.startswith("application/pdf"):
            pdf_items.append(item)

    script_dir = Path(__file__).resolve().parent
    docling_script = script_dir / "docling_extract.py"
    index_script = script_dir / "index_redisearch.py"

    errors: List[str] = []

    for item in tqdm(pdf_items, desc="Indexing PDFs"):
        attachment_key = item.get("key")
        if not attachment_key:
            continue
        parent_key = item.get("data", {}).get("parentItem")
        doc_id = parent_key or attachment_key

        if doc_id in processed:
            continue

        pdf_path = pdf_dir / f"{attachment_key}.pdf"
        item_path = item_dir / f"{doc_id}.json"
        doc_path = doc_dir / f"{doc_id}.md"
        chunk_path = chunk_dir / f"{doc_id}.json"

        try:
            content = client.file(attachment_key)
            if not content:
                raise RuntimeError("Empty PDF content")
            pdf_path.write_bytes(content)
        except Exception as exc:
            errors.append(f"{doc_id}: download failed ({exc})")
            continue

        try:
            metadata = fetch_parent_item(client, parent_key) if parent_key else item
            item_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
        except Exception as exc:
            errors.append(f"{doc_id}: metadata write failed ({exc})")
            continue

        try:
            run_script(
                docling_script,
                [
                    "--pdf",
                    str(pdf_path),
                    "--doc-id",
                    doc_id,
                    "--out-json",
                    str(chunk_path),
                    "--out-md",
                    str(doc_path),
                    "--chunking",
                    args.chunking,
                    "--ocr",
                    args.ocr,
                ],
            )
        except Exception as exc:
            errors.append(f"{doc_id}: docling failed ({exc})")
            continue

        try:
            run_script(
                index_script,
                [
                    "--chunks-json",
                    str(chunk_path),
                    "--redis-url",
                    args.redis_url,
                    "--index",
                    args.index,
                    "--prefix",
                    args.prefix,
                    "--embed-base-url",
                    args.embed_base_url,
                    "--embed-api-key",
                    args.embed_api_key,
                    "--embed-model",
                    args.embed_model,
                ],
            )
        except Exception as exc:
            errors.append(f"{doc_id}: redis index failed ({exc})")
            continue

        processed.add(doc_id)
        save_checkpoint(checkpoint_path, processed)

    if errors:
        eprint("Failures:")
        for entry in errors:
            eprint(f"- {entry}")

    eprint(f"Processed {len(processed)} items. Errors: {len(errors)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
`,"ocr_wordlist.txt":String.raw`# zotero-redisearch-rag tool version: 0.1.5
# Minimal English/German wordlist for optional OCR correction
abstract
analysis
appendix
bibliography
chapter
conclusion
data
document
discussion
example
figure
history
introduction
library
method
methods
model
number
page
pages
reference
research
results
science
section
study
system
table
text
and
are
for
from
in
of
the
to
with
aber
aus
bei
der
die
das
ein
eine
fuer
geschichte
ist
kann
koennen
mit
muessen
nicht
ueber
und
wurde
werden
zum
zur
zusammenfassung
abbildung
tabelle
methode
analyse
`,"docker-compose.yml":String.raw`# zotero-redisearch-rag tool version: 0.1.5
services:
  redis-stack:
    image: redis/redis-stack-server:latest
    container_name: redis-stack
    command: ["redis-stack-server", "/redis-stack.conf"]
    ports:
      - "6379:6379"
    volumes:
      - "\${ZRR_DATA_DIR:-./.zotero-redisearch-rag/redis-data}:/data"
      - "./redis-stack.conf:/redis-stack.conf:ro"
`,"redis-stack.conf":String.raw`# zotero-redisearch-rag tool version: 0.1.5
# Redis Stack persistence config for local RAG index
appendonly yes
appendfsync everysec

dir /data
`};var T=require("obsidian"),F="zotero-redisearch-rag-chat",A=class extends T.ItemView{constructor(e,t){super(e);this.messages=[];this.messageEls=new Map;this.pendingRender=new Map;this.busy=!1;this.plugin=t}getViewType(){return F}getDisplayText(){return"Zotero RAG Chat"}async onOpen(){let{containerEl:e}=this;e.empty(),e.addClass("zrr-chat-view");let t=e.createEl("div",{cls:"zrr-chat-header"});t.createEl("div",{cls:"zrr-chat-title",text:"Zotero RAG Chat"}),this.clearButton=t.createEl("button",{cls:"zrr-chat-clear",text:"Clear"}),this.clearButton.addEventListener("click",()=>this.clearChat()),this.messagesEl=e.createEl("div",{cls:"zrr-chat-messages"});let r=e.createEl("div",{cls:"zrr-chat-input"});this.inputEl=r.createEl("textarea",{cls:"zrr-chat-textarea",attr:{placeholder:"Ask your Zotero library..."}}),this.sendButton=r.createEl("button",{cls:"zrr-chat-send",text:"Send"}),this.sendButton.addEventListener("click",()=>this.handleSend()),this.inputEl.addEventListener("keydown",s=>{s.key==="Enter"&&!s.shiftKey&&(s.preventDefault(),this.handleSend())}),await this.loadHistory(),await this.renderAll()}focusInput(){var e;(e=this.inputEl)==null||e.focus()}async loadHistory(){try{this.messages=await this.plugin.loadChatHistory()}catch(e){console.error(e),this.messages=[]}}async saveHistory(){try{await this.plugin.saveChatHistory(this.messages)}catch(e){console.error(e)}}async renderAll(){this.messagesEl.empty(),this.messageEls.clear();for(let e of this.messages)await this.renderMessage(e);this.scrollToBottom()}async renderMessage(e){let t=this.messagesEl.createEl("div",{cls:`zrr-chat-message zrr-chat-${e.role}`});t.createEl("div",{cls:"zrr-chat-meta"}).setText(e.role==="user"?"You":"Assistant");let s=t.createEl("div",{cls:"zrr-chat-content"}),i=t.createEl("div",{cls:"zrr-chat-citations"});this.messageEls.set(e.id,{wrapper:t,content:s,citations:i}),await this.renderMessageContent(e)}scheduleRender(e){if(this.pendingRender.has(e.id))return;let t=window.setTimeout(async()=>{this.pendingRender.delete(e.id),await this.renderMessageContent(e),this.scrollToBottom()},80);this.pendingRender.set(e.id,t)}async renderMessageContent(e){var r;let t=this.messageEls.get(e.id);t&&(t.content.empty(),t.citations.empty(),await T.MarkdownRenderer.renderMarkdown(e.content||"",t.content,"",this.plugin),await this.renderCitations(t.citations,(r=e.citations)!=null?r:[]))}async renderCitations(e,t){if(e.empty(),!t.length)return;e.createEl("div",{cls:"zrr-chat-citations-label",text:"Citations"});let r=e.createEl("ul",{cls:"zrr-chat-citation-list"});for(let s of t){let i=await this.plugin.resolveCitationDisplay(s),n=r.createEl("li");n.createEl("a",{text:i.label,href:"#"}).addEventListener("click",c=>{c.preventDefault(),this.plugin.openCitationTarget(s,i)}),i.zoteroUrl&&(n.createEl("span",{text:" \xB7 "}),n.createEl("a",{text:"Zotero",href:"#"}).addEventListener("click",d=>{d.preventDefault(),this.plugin.openExternalUrl(i.zoteroUrl)}))}}scrollToBottom(){this.messagesEl.scrollTop=this.messagesEl.scrollHeight}async handleSend(){if(this.busy)return;let e=this.inputEl.value.trim();if(!e){new T.Notice("Query cannot be empty.");return}if(!this.plugin.settings.chatBaseUrl){new T.Notice("Chat base URL must be set in settings.");return}this.inputEl.value="",this.busy=!0,this.sendButton.disabled=!0;let t={id:this.generateId(),role:"user",content:e,createdAt:new Date().toISOString()};this.messages.push(t),await this.renderMessage(t),this.scrollToBottom(),await this.saveHistory();let r={id:this.generateId(),role:"assistant",content:"",citations:[],createdAt:new Date().toISOString()};this.messages.push(r),await this.renderMessage(r),this.scrollToBottom();let s=!1;try{await this.plugin.runRagQueryStreaming(e,i=>{s=!0,r.content+=i,this.scheduleRender(r)},i=>{(!s&&(i!=null&&i.answer)||i!=null&&i.answer)&&(r.content=i.answer),Array.isArray(i==null?void 0:i.citations)&&(r.citations=i.citations),this.scheduleRender(r)})}catch(i){console.error(i),r.content="Failed to fetch answer. See console for details.",this.scheduleRender(r)}finally{this.busy=!1,this.sendButton.disabled=!1,await this.saveHistory()}}async clearChat(){this.messages=[],await this.saveHistory(),await this.renderAll()}generateId(){return typeof crypto!="undefined"&&"randomUUID"in crypto?crypto.randomUUID():`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}};var B=class extends l.Modal{constructor(p,e,t,r,s="Value cannot be empty."){super(p),this.titleText=e,this.placeholder=t,this.onSubmit=r,this.emptyMessage=s}onOpen(){let{contentEl:p}=this;p.empty(),p.createEl("h3",{text:this.titleText});let e=p.createEl("input",{type:"text",placeholder:this.placeholder});e.style.width="100%",e.focus();let t=p.createEl("button",{text:"Submit"});t.style.marginTop="0.75rem";let r=()=>{let s=e.value.trim();if(!s){new l.Notice(this.emptyMessage);return}this.close(),this.onSubmit(s)};t.addEventListener("click",r),e.addEventListener("keydown",s=>{s.key==="Enter"&&r()})}};var O=class extends l.Plugin{constructor(){super(...arguments);this.docIndex=null}async onload(){await this.loadSettings(),await this.migrateCachePaths(),this.addSettingTab(new q(this.app,this)),this.registerView(F,e=>new A(e,this)),this.setupStatusBar();try{await this.ensureBundledTools()}catch(e){console.error("Failed to sync bundled tools",e)}this.addCommand({id:"import-zotero-item-index",name:"Import Zotero item and index (Docling -> RedisSearch)",callback:()=>this.importZoteroItem()}),this.addCommand({id:"ask-zotero-library",name:"Ask my Zotero library (RAG via RedisSearch)",callback:()=>this.askZoteroLibrary()}),this.addCommand({id:"open-zotero-chat",name:"Open Zotero RAG chat panel",callback:()=>this.openChatView(!0)}),this.addCommand({id:"rebuild-zotero-note-cache",name:"Rebuild Zotero note from cache (Docling + RedisSearch)",callback:()=>this.rebuildNoteFromCache()}),this.addCommand({id:"rebuild-doc-index-cache",name:"Rebuild doc index from cache",callback:()=>this.rebuildDocIndexFromCache()}),this.addCommand({id:"recreate-missing-notes-cache",name:"Recreate missing notes from cache (Docling + RedisSearch)",callback:()=>this.recreateMissingNotesFromCache()}),this.addCommand({id:"start-redis-stack",name:"Start Redis Stack (Docker Compose)",callback:()=>this.startRedisStack()}),this.settings.autoStartRedis&&this.startRedisStack(!0)}async loadSettings(){this.settings=Object.assign({},V,await this.loadData())}async saveSettings(){await this.saveData(this.settings)}async importZoteroItem(){var C,x;try{await this.ensureBundledTools()}catch(o){new l.Notice("Failed to sync bundled tools. See console for details."),console.error(o);return}let e;try{e=await this.promptZoteroItem()}catch(o){new l.Notice("Zotero search failed. See console for details."),console.error(o);return}if(!e){new l.Notice("No Zotero item selected.");return}let t=(C=e.data)!=null?C:e;!t.key&&e.key&&(t.key=e.key);let r=this.getDocId(t);if(!r){new l.Notice("Could not resolve a stable doc_id from Zotero item.");return}let s=await this.resolvePdfAttachment(t,r);if(!s){new l.Notice("No PDF attachment found for item.");return}this.showStatusProgress("Preparing...",5);let i=typeof t.title=="string"?t.title:"",n=this.sanitizeFileName(i)||r,a=await this.resolveUniqueBaseName(n,r),c=(0,l.normalizePath)(`${this.settings.outputPdfDir}/${a}.pdf`),d=(0,l.normalizePath)(`${P}/${r}.json`),u=(0,l.normalizePath)(`${S}/${r}.json`),g=(0,l.normalizePath)(`${this.settings.outputNoteDir}/${a}.md`);try{await this.ensureFolder(P),await this.ensureFolder(S),await this.ensureFolder(this.settings.outputNoteDir),this.settings.copyPdfToVault&&await this.ensureFolder(this.settings.outputPdfDir)}catch(o){new l.Notice("Failed to create output folders."),console.error(o),this.clearStatusProgress();return}let m="",_="";try{if(this.settings.copyPdfToVault){let o=s.filePath?await E.promises.readFile(s.filePath):await this.downloadZoteroPdf(s.key);await this.app.vault.adapter.writeBinary(c,this.bufferToArrayBuffer(o)),m=this.getAbsoluteVaultPath(c),_=`[[${c}]]`}else{if(!s.filePath){new l.Notice("PDF file path missing. Enable PDF copying or check Zotero storage."),this.clearStatusProgress();return}m=s.filePath,_=`[PDF](${(0,R.pathToFileURL)(s.filePath).toString()})`}}catch(o){new l.Notice("Failed to download PDF attachment."),console.error(o),this.clearStatusProgress();return}try{await this.app.vault.adapter.write(d,JSON.stringify(e,null,2))}catch(o){new l.Notice("Failed to write Zotero item JSON."),console.error(o),this.clearStatusProgress();return}let y=this.getPluginDir(),b=h.default.join(y,"tools","docling_extract.py"),k=h.default.join(y,"tools","index_redisearch.py");try{this.showStatusProgress("Docling extraction...",null),await this.runPython(b,this.buildDoclingArgs(m,r,u,g))}catch(o){new l.Notice("Docling extraction failed. See console for details."),console.error(o),this.clearStatusProgress();return}try{this.showStatusProgress("Indexing chunks...",0),await this.runPythonStreaming(k,["--chunks-json",this.getAbsoluteVaultPath(u),"--redis-url",this.settings.redisUrl,"--index",this.settings.redisIndex,"--prefix",this.settings.redisPrefix,"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--progress"],o=>{if((o==null?void 0:o.type)==="progress"&&o.total){let v=Math.round(o.current/o.total*100);this.showStatusProgress(`Indexing chunks ${o.current}/${o.total}`,v)}},()=>{})}catch(o){new l.Notice("RedisSearch indexing failed. See console for details."),console.error(o),this.clearStatusProgress();return}try{let o=await this.app.vault.adapter.read(g),v=this.buildNoteMarkdown(t,(x=e.meta)!=null?x:{},r,_,d,o);await this.app.vault.adapter.write(g,v)}catch(o){new l.Notice("Failed to finalize note markdown."),console.error(o),this.clearStatusProgress();return}try{await this.updateDocIndex({doc_id:r,note_path:g,note_title:a,zotero_title:i,pdf_path:m,attachment_key:s.key})}catch(o){console.error("Failed to update doc index",o)}this.showStatusProgress("Done",100),window.setTimeout(()=>this.clearStatusProgress(),1200),new l.Notice(`Indexed Zotero item ${r}.`)}async askZoteroLibrary(){await this.openChatView(!0)}getChatLeaf(){var e;return this.settings.chatPaneLocation==="right"?(e=this.app.workspace.getRightLeaf(!1))!=null?e:this.app.workspace.getLeaf("split"):this.app.workspace.getLeaf("tab")}async openChatView(e=!1){let t=this.getChatLeaf();await t.setViewState({type:F,active:!0}),this.app.workspace.revealLeaf(t);let r=t.view;return r instanceof A&&e&&r.focusInput(),r}async loadChatHistory(){let e=this.app.vault.adapter,t=(0,l.normalizePath)(`${D}/chat.json`);if(!await e.exists(t))return[];let r=await e.read(t),s;try{s=JSON.parse(r)}catch(n){return[]}let i=Array.isArray(s)?s:s==null?void 0:s.messages;return Array.isArray(i)?i.filter(n=>n&&typeof n.content=="string").map(n=>({id:n.id||this.generateChatId(),role:n.role==="assistant"?"assistant":"user",content:n.content,citations:Array.isArray(n.citations)?n.citations:[],createdAt:n.createdAt||new Date().toISOString()})):[]}async saveChatHistory(e){await this.ensureFolder(D);let t=this.app.vault.adapter,r=(0,l.normalizePath)(`${D}/chat.json`),s={version:1,messages:e};await t.write(r,JSON.stringify(s,null,2))}async runRagQueryStreaming(e,t,r){await this.ensureBundledTools();let s=this.getPluginDir(),i=h.default.join(s,"tools","rag_query_redisearch.py"),n=["--query",e,"--k","5","--redis-url",this.settings.redisUrl,"--index",this.settings.redisIndex,"--prefix",this.settings.redisPrefix,"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--chat-base-url",this.settings.chatBaseUrl,"--chat-api-key",this.settings.chatApiKey,"--chat-model",this.settings.chatModel,"--temperature",String(this.settings.chatTemperature),"--stream"];return this.runPythonStreaming(i,n,a=>{if((a==null?void 0:a.type)==="delta"&&typeof a.content=="string"){t(a.content);return}if((a==null?void 0:a.type)==="final"){r(a);return}a!=null&&a.answer&&r(a)},r)}async resolveCitationDisplay(e){var d,u;let t=await this.getDocIndexEntry(e.doc_id);(!t||!t.note_title||!t.zotero_title||!t.note_path||!t.pdf_path)&&(t=await this.hydrateDocIndexFromCache(e.doc_id));let r=(t==null?void 0:t.zotero_title)||(t==null?void 0:t.note_title)||e.doc_id||"?",s=e.pages||`${(d=e.page_start)!=null?d:"?"}-${(u=e.page_end)!=null?u:"?"}`,i=`${r} pages ${s}`,n=e.page_start?String(e.page_start):"",a=(t==null?void 0:t.pdf_path)||e.source_pdf||"",c=e.doc_id?this.buildZoteroDeepLink(e.doc_id,t==null?void 0:t.attachment_key,n):void 0;return{label:i,notePath:t==null?void 0:t.note_path,pdfPath:a||void 0,zoteroUrl:c,pageStart:n||void 0}}async openCitationTarget(e,t){let r=t!=null?t:await this.resolveCitationDisplay(e);if(r.notePath){await this.openNoteInMain(r.notePath);return}if(!(r.pdfPath&&await this.openPdfInMain(r.pdfPath,r.pageStart))){if(r.zoteroUrl){this.openExternalUrl(r.zoteroUrl);return}new l.Notice("Unable to open citation target.")}}async rebuildNoteFromCache(){let e=await this.promptDocId();if(!e){new l.Notice("No doc_id provided.");return}await this.rebuildNoteFromCacheForDocId(e,!0)&&new l.Notice(`Rebuilt Zotero note for ${e}.`)}async rebuildDocIndexFromCache(){var d,u,g;let e=this.app.vault.adapter,t=await this.listDocIds(P),r=await this.listDocIds(S),s=await this.scanNotesForDocIds(this.settings.outputNoteDir),i=Object.keys(s),n=Array.from(new Set([...t,...r,...i]));if(n.length===0){new l.Notice("No cached items found.");return}this.showStatusProgress("Rebuilding doc index...",0);let a=await this.getDocIndex(),c=0;for(let m of n){c+=1;let _={},y=s[m];y&&(_.note_path=y.note_path,_.note_title=y.note_title);let b=(0,l.normalizePath)(`${P}/${m}.json`);if(await e.exists(b))try{let x=await e.read(b),o=JSON.parse(x),v=(u=(d=o==null?void 0:o.data)!=null?d:o)!=null?u:{},L=typeof v.title=="string"?v.title:"";L&&(_.zotero_title=L);let Z=this.sanitizeFileName(L)||m,M=(0,l.normalizePath)(`${this.settings.outputNoteDir}/${Z}.md`),$=(0,l.normalizePath)(`${this.settings.outputNoteDir}/${Z}-${m}.md`);await e.exists(M)?(_.note_path=M,_.note_title=h.default.basename(M,".md")):await e.exists($)&&(_.note_path=$,_.note_title=h.default.basename($,".md"))}catch(x){console.error("Failed to read cached item JSON",x)}let k=(0,l.normalizePath)(`${S}/${m}.json`);if(await e.exists(k))try{let x=await e.read(k),o=JSON.parse(x);typeof(o==null?void 0:o.source_pdf)=="string"&&(_.pdf_path=o.source_pdf)}catch(x){console.error("Failed to read cached chunks JSON",x)}if(Object.keys(_).length>0){let o={...(g=a[m])!=null?g:{doc_id:m},..._,doc_id:m,updated_at:new Date().toISOString()};!o.note_title&&o.note_path&&(o.note_title=h.default.basename(o.note_path,".md")),a[m]=o}let C=Math.round(c/n.length*100);this.showStatusProgress(`Rebuilding doc index ${c}/${n.length}`,C)}await this.saveDocIndex(a),this.showStatusProgress("Done",100),window.setTimeout(()=>this.clearStatusProgress(),1200),new l.Notice(`Rebuilt doc index for ${n.length} items.`)}async recreateMissingNotesFromCache(){let e=this.app.vault.adapter,t=await this.listDocIds(P),r=await this.listDocIds(S),s=await this.scanNotesForDocIds(this.settings.outputNoteDir),i=Object.keys(s),n=Array.from(new Set([...t,...r,...i]));if(n.length===0){new l.Notice("No cached items found.");return}let a=[];for(let d of n){if(s[d])continue;let u=await this.getDocIndexEntry(d);if(u!=null&&u.note_path&&await e.exists(u.note_path))continue;let g=await this.inferNotePathFromCache(d);g&&await e.exists(g)||a.push(d)}if(a.length===0){new l.Notice("No missing notes detected.");return}this.showStatusProgress("Recreating missing notes...",0);let c=0;for(let d=0;d<a.length;d+=1){let u=a[d],g=Math.round((d+1)/a.length*100);this.showStatusProgress(`Recreating ${d+1}/${a.length}`,g),await this.rebuildNoteFromCacheForDocId(u,!1)&&(c+=1)}this.showStatusProgress("Done",100),window.setTimeout(()=>this.clearStatusProgress(),1200),new l.Notice(`Recreated ${c}/${a.length} missing notes.`)}async promptZoteroItem(){return new Promise(e=>{new j(this.app,this,e).open()})}async listDocIds(e){let t=this.app.vault.adapter,r=(0,l.normalizePath)(e);return await t.exists(r)?(await t.list(r)).files.filter(i=>i.endsWith(".json")).map(i=>h.default.basename(i,".json")):[]}async listMarkdownFiles(e){let t=this.app.vault.adapter,r=(0,l.normalizePath)(e);if(!await t.exists(r))return[];let s=[r],i=[];for(;s.length>0;){let n=s.pop();if(!n)continue;let a=await t.list(n);for(let c of a.files)c.endsWith(".md")&&i.push(c);for(let c of a.folders)s.push(c)}return i}extractDocIdFromFrontmatter(e){let t=e.match(/^---\s*\n([\s\S]*?)\n---/);if(!t)return null;let s=t[1].split(/\r?\n/);for(let i of s){let n=i.trim();if(!n||n.startsWith("#"))continue;let a=n.split(":");if(a.length<2)continue;let c=a[0].trim().toLowerCase();if(c!=="doc_id"&&c!=="zotero_key")continue;let u=n.slice(n.indexOf(":")+1).trim().replace(/^["']|["']$/g,"").trim();if(u)return u}return null}async scanNotesForDocIds(e){let t=this.app.vault.adapter,r=await this.listMarkdownFiles(e),s={};for(let i of r)try{let n=await t.read(i),a=this.extractDocIdFromFrontmatter(n);if(!a)continue;s[a]={doc_id:a,note_path:i,note_title:h.default.basename(i,".md"),updated_at:new Date().toISOString()}}catch(n){console.error("Failed to read note for doc_id scan",n)}return s}setupStatusBar(){let e=this.addStatusBarItem();e.addClass("zrr-status-progress"),e.addClass("status-bar-item-segment"),e.style.display="none";let t=e.createEl("span",{text:"Idle"});t.addClass("zrr-status-label");let s=e.createEl("div",{cls:"zrr-status-bar"}).createEl("div",{cls:"zrr-status-bar-inner"});this.statusBarEl=e,this.statusLabelEl=t,this.statusBarInnerEl=s}showStatusProgress(e,t){if(!(!this.statusBarEl||!this.statusLabelEl||!this.statusBarInnerEl))if(this.statusBarEl.style.display="flex",this.statusLabelEl.setText(e),t===null)this.statusBarInnerEl.addClass("indeterminate"),this.statusBarInnerEl.style.width="40%";else{this.statusBarInnerEl.removeClass("indeterminate");let r=Math.max(0,Math.min(100,t));this.statusBarInnerEl.style.width=`${r}%`}}clearStatusProgress(){!this.statusBarEl||!this.statusBarInnerEl||(this.statusBarEl.style.display="none",this.statusBarInnerEl.removeClass("indeterminate"),this.statusBarInnerEl.style.width="0%")}async promptDocId(){return new Promise(e=>{new B(this.app,"Rebuild Zotero note from cache","Enter Zotero doc_id (e.g., ABC123)",t=>e(t),"Doc ID cannot be empty.").open()})}getDocId(e){let t=[e.key,e.itemKey,e.id,e.citationKey];for(let r of t)if(typeof r=="string"&&r.trim())return r.trim();return null}sanitizeFileName(e){let t=e.replace(/[\\/:*?"<>|]/g,"").replace(/\s+/g," ").trim();return t?t.replace(/[.]+$/g,"").trim().replace(/ /g,"-").slice(0,120):""}async resolveUniqueBaseName(e,t){let r=this.app.vault.adapter,s=(0,l.normalizePath)(`${this.settings.outputNoteDir}/${e}.md`),i=(0,l.normalizePath)(`${this.settings.outputPdfDir}/${e}.pdf`),n=await r.exists(s),a=this.settings.copyPdfToVault?await r.exists(i):!1;return n||a?`${e}-${t}`:e}async searchZoteroItems(e){let t=new URLSearchParams;t.set("itemType","-attachment"),t.set("limit","25"),t.set("include","data,meta"),e.trim()&&t.set("q",e.trim());let r=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items?${t.toString()}`),s=await this.requestLocalApi(r,`Zotero search failed for ${r}`),i=JSON.parse(s.toString("utf8"));return Array.isArray(i)?i.map(n=>{var a,c,d,u;return{key:(c=n.key)!=null?c:(a=n.data)==null?void 0:a.key,data:(d=n.data)!=null?d:{},meta:(u=n.meta)!=null?u:{}}}).filter(n=>typeof n.key=="string"&&n.key.trim().length>0):[]}async resolvePdfAttachment(e,t){let r=this.pickPdfAttachment(e);if(r)return r;try{let s=await this.fetchZoteroChildren(t);for(let i of s){let n=this.toPdfAttachment(i);if(n)return n}}catch(s){console.error("Failed to fetch Zotero children",s)}return null}pickPdfAttachment(e){var r,s,i;let t=(i=(s=(r=e.attachments)!=null?r:e.children)!=null?s:e.items)!=null?i:[];if(!Array.isArray(t))return null;for(let n of t){let a=this.toPdfAttachment(n);if(a)return a}return null}toPdfAttachment(e){var i,n,a,c,d,u;if(((a=(i=e==null?void 0:e.contentType)!=null?i:e==null?void 0:e.mimeType)!=null?a:(n=e==null?void 0:e.data)==null?void 0:n.contentType)!=="application/pdf")return null;let r=(u=(c=e==null?void 0:e.key)!=null?c:e==null?void 0:e.attachmentKey)!=null?u:(d=e==null?void 0:e.data)==null?void 0:d.key;if(!r)return null;let s=this.extractAttachmentPath(e);return s?{key:r,filePath:s}:{key:r}}extractAttachmentPath(e){var r,s,i,n,a,c,d,u;let t=(u=(n=(s=(r=e==null?void 0:e.links)==null?void 0:r.enclosure)==null?void 0:s.href)!=null?n:(i=e==null?void 0:e.enclosure)==null?void 0:i.href)!=null?u:(d=(c=(a=e==null?void 0:e.data)==null?void 0:a.links)==null?void 0:c.enclosure)==null?void 0:d.href;if(typeof t=="string"&&t.startsWith("file://"))try{return(0,R.fileURLToPath)(t)}catch(g){return null}return null}async fetchZoteroChildren(e){let t=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}/children`),r=await this.requestLocalApi(t,`Zotero children request failed for ${t}`);return JSON.parse(r.toString("utf8"))}async downloadZoteroPdf(e){let t=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}/file`),r=await this.requestLocalApiRaw(t),s=await this.followFileRedirect(r);if(s)return s;if(r.statusCode>=300)throw new Error(`Request failed, status ${r.statusCode}`);return r.body}buildZoteroUrl(e){return`${this.settings.zoteroBaseUrl.replace(/\/$/,"")}${e}`}requestLocalApiRaw(e){return new Promise((t,r)=>{let s=new URL(e),n=(s.protocol==="https:"?J.default:G.default).request({method:"GET",hostname:s.hostname,port:s.port||void 0,path:`${s.pathname}${s.search}`,headers:{Accept:"*/*"}},a=>{let c=[];a.on("data",d=>c.push(Buffer.from(d))),a.on("end",()=>{var u;let d=Buffer.concat(c);t({statusCode:(u=a.statusCode)!=null?u:0,headers:a.headers,body:d})})});n.on("error",r),n.end()})}async requestLocalApi(e,t){let r=await this.requestLocalApiRaw(e);if(r.statusCode>=400){let s=r.body.toString("utf8");throw new Error(`${t!=null?t:"Request failed"}, status ${r.statusCode}: ${s||"no response body"}`)}if(r.statusCode>=300)throw new Error(`${t!=null?t:"Request failed"}, status ${r.statusCode}`);return r.body}async followFileRedirect(e){if(e.statusCode<300||e.statusCode>=400)return null;let t=e.headers.location,r=Array.isArray(t)?t[0]:t;if(!r||typeof r!="string")return null;if(r.startsWith("file://")){let s=(0,R.fileURLToPath)(r);return E.promises.readFile(s)}return r.startsWith("http://")||r.startsWith("https://")?this.requestLocalApi(r):null}bufferToArrayBuffer(e){return e.buffer.slice(e.byteOffset,e.byteOffset+e.byteLength)}buildPdfLinkFromSourcePath(e){if(!e)return"";let t=h.default.normalize(this.getVaultBasePath()),r=h.default.normalize(e),s=t.endsWith(h.default.sep)?t:`${t}${h.default.sep}`;return r.startsWith(s)?`[[${(0,l.normalizePath)(h.default.relative(t,r))}]]`:`[PDF](${(0,R.pathToFileURL)(e).toString()})`}async openNoteInMain(e){let t=(0,l.normalizePath)(e);await this.app.workspace.openLinkText(t,"","tab")}async openPdfInMain(e,t){if(!e)return!1;let r=h.default.normalize(this.getVaultBasePath()),s=h.default.normalize(e),i=r.endsWith(h.default.sep)?r:`${r}${h.default.sep}`;if(s.startsWith(i)){let n=(0,l.normalizePath)(h.default.relative(r,s)),a=t?`#page=${t}`:"";return await this.app.workspace.openLinkText(`${n}${a}`,"","tab"),!0}try{return window.open((0,R.pathToFileURL)(e).toString()),!0}catch(n){return!1}}openExternalUrl(e){e&&window.open(e)}buildZoteroDeepLink(e,t,r){if(t){let s=r?`?page=${encodeURIComponent(r)}`:"";return`zotero://open-pdf/library/items/${t}${s}`}return`zotero://select/library/items/${e}`}formatCitationsMarkdown(e){return e.length?e.map(r=>this.formatCitationMarkdown(r)).filter(Boolean).join(`
`):""}formatCitationMarkdown(e){var n,a;let t=e.doc_id||"?",r=e.pages||`${(n=e.page_start)!=null?n:"?"}-${(a=e.page_end)!=null?a:"?"}`,s=`${t} pages ${r}`,i=e.source_pdf||"";if(i){let c=this.buildPdfLinkFromSourcePath(i);if(c.startsWith("[["))return`- [[${c.slice(2,-2)}|${s}]]`;let d=c.match(/^\[PDF\]\((.+)\)$/);if(d)return`- [${s}](${d[1]})`}return`- ${s}`}generateChatId(){return typeof crypto!="undefined"&&"randomUUID"in crypto?crypto.randomUUID():`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}getDocIndexPath(){return(0,l.normalizePath)(`${D}/doc_index.json`)}async getDocIndex(){return this.docIndex?this.docIndex:(this.docIndex=await this.loadDocIndexFromDisk(),this.docIndex)}async loadDocIndexFromDisk(){var r;let e=this.app.vault.adapter,t=this.getDocIndexPath();if(!await e.exists(t))return{};try{let s=await e.read(t),i=JSON.parse(s);if(i&&typeof i=="object"){let n=(r=i.entries)!=null?r:i;if(Array.isArray(n)){let a={};for(let c of n)c!=null&&c.doc_id&&(a[String(c.doc_id)]=c);return a}if(n&&typeof n=="object")return n}}catch(s){console.error("Failed to read doc index",s)}return{}}async saveDocIndex(e){await this.ensureFolder(D);let t=this.app.vault.adapter,r=this.getDocIndexPath(),s={version:1,entries:e};await t.write(r,JSON.stringify(s,null,2)),this.docIndex=e}async updateDocIndex(e){var i;let t=await this.getDocIndex(),r=(i=t[e.doc_id])!=null?i:{doc_id:e.doc_id},s={...r,...e,doc_id:e.doc_id,updated_at:new Date().toISOString()};e.note_path===void 0&&r.note_path&&(s.note_path=r.note_path),e.note_title===void 0&&r.note_title&&(s.note_title=r.note_title),e.zotero_title===void 0&&r.zotero_title&&(s.zotero_title=r.zotero_title),e.pdf_path===void 0&&r.pdf_path&&(s.pdf_path=r.pdf_path),e.attachment_key===void 0&&r.attachment_key&&(s.attachment_key=r.attachment_key),t[e.doc_id]=s,await this.saveDocIndex(t)}async hydrateDocIndexFromCache(e){var a,c;if(!e)return null;let t=this.app.vault.adapter,r=await this.getDocIndexEntry(e),s={},i=(0,l.normalizePath)(`${P}/${e}.json`);if(await t.exists(i))try{let d=await t.read(i),u=JSON.parse(d),g=(c=(a=u==null?void 0:u.data)!=null?a:u)!=null?c:{},m=typeof g.title=="string"?g.title:"";if(m&&(s.zotero_title=m),!s.note_title||!s.note_path){let _=this.sanitizeFileName(m)||e,y=(0,l.normalizePath)(`${this.settings.outputNoteDir}/${_}.md`),b=(0,l.normalizePath)(`${this.settings.outputNoteDir}/${_}-${e}.md`),k="";await t.exists(y)?k=y:await t.exists(b)&&(k=b),k&&(s.note_path=k,s.note_title=h.default.basename(k,".md"))}}catch(d){console.error("Failed to read cached item JSON",d)}!s.note_title&&(r!=null&&r.note_path)&&(s.note_title=h.default.basename(r.note_path,".md"));let n=(0,l.normalizePath)(`${S}/${e}.json`);if(await t.exists(n))try{let d=await t.read(n),u=JSON.parse(d);typeof(u==null?void 0:u.source_pdf)=="string"&&(s.pdf_path=u.source_pdf)}catch(d){console.error("Failed to read cached chunks JSON",d)}return Object.keys(s).length>0&&await this.updateDocIndex({doc_id:e,...s}),this.getDocIndexEntry(e)}async getDocIndexEntry(e){var r;return e&&(r=(await this.getDocIndex())[e])!=null?r:null}async inferNotePathFromCache(e){var s,i;let t=this.app.vault.adapter,r=(0,l.normalizePath)(`${P}/${e}.json`);if(!await t.exists(r))return"";try{let n=await t.read(r),a=JSON.parse(n),c=(i=(s=a==null?void 0:a.data)!=null?s:a)!=null?i:{},d=typeof c.title=="string"?c.title:"",u=this.sanitizeFileName(d)||e,g=(0,l.normalizePath)(`${this.settings.outputNoteDir}/${u}.md`),m=(0,l.normalizePath)(`${this.settings.outputNoteDir}/${u}-${e}.md`);if(await t.exists(g))return g;if(await t.exists(m))return m}catch(n){console.error("Failed to infer note path from cache",n)}return""}async rebuildNoteFromCacheForDocId(e,t){var C,x;try{await this.ensureBundledTools()}catch(o){return t&&new l.Notice("Failed to sync bundled tools. See console for details."),console.error(o),!1}let r=this.app.vault.adapter,s=(0,l.normalizePath)(`${P}/${e}.json`),i=(0,l.normalizePath)(`${S}/${e}.json`);if(!await r.exists(s)||!await r.exists(i))return t&&new l.Notice("Cached item or chunks JSON not found."),!1;this.showStatusProgress("Preparing...",5);let n;try{let o=await r.read(s);n=JSON.parse(o)}catch(o){return t&&new l.Notice("Failed to read cached item JSON."),console.error(o),this.clearStatusProgress(),!1}let a;try{let o=await r.read(i);a=JSON.parse(o)}catch(o){return t&&new l.Notice("Failed to read cached chunks JSON."),console.error(o),this.clearStatusProgress(),!1}let c=typeof a.source_pdf=="string"?a.source_pdf:"";if(!c)return t&&new l.Notice("Cached chunk JSON is missing source_pdf."),this.clearStatusProgress(),!1;try{await E.promises.access(c)}catch(o){return t&&new l.Notice("Cached source PDF path is not accessible."),console.error(o),this.clearStatusProgress(),!1}let d=(C=n.data)!=null?C:n,u=typeof d.title=="string"?d.title:"",g="",m=await this.getDocIndexEntry(e);if(m!=null&&m.note_path&&await r.exists(m.note_path)&&(g=(0,l.normalizePath)(m.note_path)),!g){let o=this.sanitizeFileName(u)||e,v=(0,l.normalizePath)(`${this.settings.outputNoteDir}/${o}.md`),L=await r.exists(v)?o:await this.resolveUniqueBaseName(o,e);g=(0,l.normalizePath)(`${this.settings.outputNoteDir}/${L}.md`)}try{await this.ensureFolder(this.settings.outputNoteDir)}catch(o){return t&&new l.Notice("Failed to create notes folder."),console.error(o),this.clearStatusProgress(),!1}let _=this.getPluginDir(),y=h.default.join(_,"tools","docling_extract.py"),b=h.default.join(_,"tools","index_redisearch.py");try{this.showStatusProgress("Docling extraction...",null),await this.runPython(y,this.buildDoclingArgs(c,e,i,g))}catch(o){return t&&new l.Notice("Docling extraction failed. See console for details."),console.error(o),this.clearStatusProgress(),!1}try{this.showStatusProgress("Indexing chunks...",0),await this.runPythonStreaming(b,["--chunks-json",this.getAbsoluteVaultPath(i),"--redis-url",this.settings.redisUrl,"--index",this.settings.redisIndex,"--prefix",this.settings.redisPrefix,"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--upsert","--progress"],o=>{if((o==null?void 0:o.type)==="progress"&&o.total){let v=Math.round(o.current/o.total*100);this.showStatusProgress(`Indexing chunks ${o.current}/${o.total}`,v)}},()=>{})}catch(o){return t&&new l.Notice("RedisSearch indexing failed. See console for details."),console.error(o),this.clearStatusProgress(),!1}let k=this.buildPdfLinkFromSourcePath(c);try{let o=await this.app.vault.adapter.read(g),v=this.buildNoteMarkdown(d,(x=n.meta)!=null?x:{},e,k,s,o);await this.app.vault.adapter.write(g,v)}catch(o){return t&&new l.Notice("Failed to finalize note markdown."),console.error(o),this.clearStatusProgress(),!1}try{await this.updateDocIndex({doc_id:e,note_path:g,note_title:h.default.basename(g,".md"),zotero_title:u,pdf_path:c})}catch(o){console.error("Failed to update doc index",o)}return!0}getZoteroLibraryPath(){let e=(this.settings.zoteroUserId||"0").trim();return!e||e==="0"?"users/0":e.startsWith("users/")||e.startsWith("groups/")?e:`users/${e}`}async ensureFolder(e){let t=this.app.vault.adapter,r=(0,l.normalizePath)(e).split("/").filter(Boolean),s="";for(let i of r)s=s?`${s}/${i}`:i,await t.exists(s)||await t.mkdir(s)}buildNoteMarkdown(e,t,r,s,i,n){let a=`[[${i}]]`,c=this.renderFrontmatter(e,t,r,s,a);return`${c?`---
${c}
---

`:""}PDF: ${s}

Item JSON: ${a}

${n}`}renderFrontmatter(e,t,r,s,i){var c;let n=(c=this.settings.frontmatterTemplate)!=null?c:"";if(!n.trim())return"";let a=this.buildTemplateVars(e,t,r,s,i);return n.replace(/{{\s*([a-z0-9_]+)\s*}}/gi,(d,u)=>{var g;return(g=a[u])!=null?g:""}).trim()}buildTemplateVars(e,t,r,s,i){let n=typeof e.title=="string"?e.title:"",a=typeof e.shortTitle=="string"?e.shortTitle:"",c=typeof e.date=="string"?e.date:"",d=typeof(t==null?void 0:t.parsedDate)=="string"?t.parsedDate:"",u=this.extractYear(d||c),m=(Array.isArray(e.creators)?e.creators:[]).filter(o=>o.creatorType==="author").map(o=>this.formatCreatorName(o)),_=m.join("; "),y=Array.isArray(e.tags)?e.tags.map(o=>typeof o=="string"?o:o==null?void 0:o.tag).filter(Boolean):[],b=y.join("; "),k=typeof e.itemType=="string"?e.itemType:"",C=typeof(t==null?void 0:t.creatorSummary)=="string"?t.creatorSummary:"",x={doc_id:r,zotero_key:typeof e.key=="string"?e.key:r,title:n,short_title:a,date:c,year:u,authors:_,tags:b,item_type:k,creator_summary:C,pdf_link:this.escapeYamlString(s),item_json:this.escapeYamlString(i)};for(let[o,v]of Object.entries(x))x[`${o}_yaml`]=this.escapeYamlString(v);return x.authors_yaml=this.toYamlList(m),x.tags_yaml=this.toYamlList(y),x}extractYear(e){if(!e)return"";let t=e.match(/\b(\d{4})\b/);return t?t[1]:""}formatCreatorName(e){if(!e||typeof e!="object")return"";if(e.name)return String(e.name);let t=e.firstName?String(e.firstName):"",r=e.lastName?String(e.lastName):"";return[r,t].filter(Boolean).join(", ")||`${t} ${r}`.trim()}escapeYamlString(e){return`"${String(e).replace(/\\/g,"\\\\").replace(/"/g,'\\"')}"`}toYamlList(e){return e.length?e.map(t=>`  - ${this.escapeYamlString(t)}`).join(`
`):'  - ""'}getVaultBasePath(){var r;let e=this.app.vault.adapter;if(e instanceof l.FileSystemAdapter)return e.getBasePath();let t=(r=e.getBasePath)==null?void 0:r.call(e);if(t)return t;throw new Error("Vault base path is unavailable.")}getPluginDir(){var s;let e=this.getVaultBasePath(),t=(s=this.manifest.dir)!=null?s:this.manifest.id;if(!t)throw new Error("Plugin directory is unavailable.");let r=h.default.isAbsolute(t)?t:h.default.join(e,t);return h.default.normalize(r)}async ensureBundledTools(){let e=this.getPluginDir(),t=h.default.join(e,"tools");await E.promises.mkdir(t,{recursive:!0});for(let[r,s]of Object.entries(H)){let i=h.default.join(t,r),n=!0;try{await E.promises.readFile(i,"utf8")===s&&(n=!1)}catch(a){}n&&await E.promises.writeFile(i,s,"utf8")}}async migrateCachePaths(){let e="zotero/items",t="zotero/chunks",r=P,s=S,i=this.app.vault.adapter,n=(0,l.normalizePath)(e),a=(0,l.normalizePath)(t),c=(0,l.normalizePath)(r),d=(0,l.normalizePath)(s),u=c.split("/").slice(0,-1).join("/"),g=d.split("/").slice(0,-1).join("/");u&&await this.ensureFolder(u),g&&await this.ensureFolder(g);let m=await i.exists(n),_=await i.exists(a),y=await i.exists(c),b=await i.exists(d);m&&!y&&await i.rename(n,c),_&&!b&&await i.rename(a,d)}getAbsoluteVaultPath(e){let t=this.getVaultBasePath(),r=h.default.isAbsolute(e)?e:h.default.join(t,e);return h.default.normalize(r)}buildDoclingArgs(e,t,r,s){let i=["--pdf",e,"--doc-id",t,"--out-json",this.getAbsoluteVaultPath(r),"--out-md",this.getAbsoluteVaultPath(s),"--chunking",this.settings.chunkingMode,"--ocr",this.settings.ocrMode];return this.settings.enableLlmCleanup&&(i.push("--enable-llm-cleanup"),this.settings.llmCleanupBaseUrl&&i.push("--llm-cleanup-base-url",this.settings.llmCleanupBaseUrl),this.settings.llmCleanupApiKey&&i.push("--llm-cleanup-api-key",this.settings.llmCleanupApiKey),this.settings.llmCleanupModel&&i.push("--llm-cleanup-model",this.settings.llmCleanupModel),i.push("--llm-cleanup-temperature",String(this.settings.llmCleanupTemperature)),i.push("--llm-cleanup-min-quality",String(this.settings.llmCleanupMinQuality)),i.push("--llm-cleanup-max-chars",String(this.settings.llmCleanupMaxChars))),i}getRedisDataDir(){return h.default.join(this.getVaultBasePath(),D,"redis-data")}getDockerComposePath(){let e=this.getPluginDir();return h.default.join(e,"tools","docker-compose.yml")}async startRedisStack(e){var t;try{await this.ensureBundledTools();let r=this.getDockerComposePath(),s=this.getRedisDataDir();await E.promises.mkdir(s,{recursive:!0});let i=((t=this.settings.dockerPath)==null?void 0:t.trim())||"docker";await this.runCommand(i,["compose","-f",r,"up","-d"],{cwd:h.default.dirname(r),env:{...process.env,ZRR_DATA_DIR:s}}),e||new l.Notice("Redis Stack started.")}catch(r){e||new l.Notice("Failed to start Redis Stack. Check Docker Desktop and File Sharing."),console.error("Failed to start Redis Stack",r)}}runPython(e,t){return new Promise((r,s)=>{let i=(0,I.spawn)(this.settings.pythonPath,[e,...t],{cwd:h.default.dirname(e)}),n="";i.stderr.on("data",a=>{n+=a.toString()}),i.on("close",a=>{a===0?r():s(new Error(n||`Process exited with code ${a}`))})})}runCommand(e,t,r){return new Promise((s,i)=>{let n=(0,I.spawn)(e,t,{cwd:r==null?void 0:r.cwd,env:r==null?void 0:r.env}),a="";n.stderr.on("data",c=>{a+=c.toString()}),n.on("close",c=>{c===0?s():i(new Error(a||`Process exited with code ${c}`))})})}runPythonStreaming(e,t,r,s){return new Promise((i,n)=>{let a=(0,I.spawn)(this.settings.pythonPath,[e,...t],{cwd:h.default.dirname(e)}),c="",d="",u=null,g=!1,m=_=>{if(_.trim())try{let y=JSON.parse(_);u=y,((y==null?void 0:y.type)==="final"||y!=null&&y.answer)&&(g=!0),r(y)}catch(y){}};a.stdout.on("data",_=>{var b;c+=_.toString();let y=c.split(/\r?\n/);c=(b=y.pop())!=null?b:"";for(let k of y)m(k)}),a.stderr.on("data",_=>{d+=_.toString()}),a.on("close",_=>{c.trim()&&m(c),!g&&u&&s(u),_===0?i():n(new Error(d||`Process exited with code ${_}`))})})}runPythonWithOutput(e,t){return new Promise((r,s)=>{let i=(0,I.spawn)(this.settings.pythonPath,[e,...t],{cwd:h.default.dirname(e)}),n="",a="";i.stdout.on("data",c=>{n+=c.toString()}),i.stderr.on("data",c=>{a+=c.toString()}),i.on("close",c=>{c===0?r(n.trim()):s(new Error(a||`Process exited with code ${c}`))})})}},j=class extends l.SuggestModal{constructor(e,t,r){super(e);this.lastError=null;this.plugin=t,this.resolveSelection=r,this.setPlaceholder("Search Zotero items...")}async getSuggestions(e){try{return await this.plugin.searchZoteroItems(e)}catch(t){let r=t instanceof Error?t.message:String(t);return this.lastError!==r&&(this.lastError=r,new l.Notice(r)),console.error("Zotero search failed",t),[]}}renderSuggestion(e,t){var i,n;let r=(n=(i=e.data)==null?void 0:i.title)!=null?n:"[No title]",s=this.extractYear(e);t.createEl("div",{text:r}),t.createEl("small",{text:s?`${s}`:""}),t.addEventListener("click",()=>{this.resolveSelection&&(this.resolveSelection(e),this.resolveSelection=null),this.close()})}onChooseSuggestion(e,t){this.resolveSelection&&(this.resolveSelection(e),this.resolveSelection=null),this.close()}onClose(){this.resolveSelection&&(this.resolveSelection(null),this.resolveSelection=null)}extractYear(e){var s,i,n,a;let t=(a=(n=(s=e.meta)==null?void 0:s.parsedDate)!=null?n:(i=e.data)==null?void 0:i.date)!=null?a:"";if(typeof t!="string")return"";let r=t.match(/\b(\d{4})\b/);return r?r[1]:""}};
