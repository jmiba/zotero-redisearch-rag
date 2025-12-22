"use strict";var ne=Object.create;var $=Object.defineProperty;var re=Object.getOwnPropertyDescriptor;var se=Object.getOwnPropertyNames;var ie=Object.getPrototypeOf,ae=Object.prototype.hasOwnProperty;var oe=(P,p)=>{for(var e in p)$(P,e,{get:p[e],enumerable:!0})},H=(P,p,e,t)=>{if(p&&typeof p=="object"||typeof p=="function")for(let n of se(p))!ae.call(P,n)&&n!==e&&$(P,n,{get:()=>p[n],enumerable:!(t=re(p,n))||t.enumerable});return P};var U=(P,p,e)=>(e=P!=null?ne(ie(P)):{},H(p||!P||!P.__esModule?$(e,"default",{value:P,enumerable:!0}):e,P)),le=P=>H($({},"__esModule",{value:!0}),P);var ce={};oe(ce,{default:()=>j});module.exports=le(ce);var l=require("obsidian"),z=require("child_process"),I=require("fs"),X=U(require("http")),ee=U(require("https")),_=U(require("path")),N=require("url");var x=require("obsidian"),R=".zotero-redisearch-rag",E=`${R}/items`,T=`${R}/chunks`,J={zoteroBaseUrl:"http://127.0.0.1:23119/api",zoteroUserId:"0",webApiBaseUrl:"https://api.zotero.org",webApiLibraryType:"user",webApiLibraryId:"",webApiKey:"",pythonPath:"python3",dockerPath:"docker",autoStartRedis:!1,copyPdfToVault:!0,frontmatterTemplate:`doc_id: {{doc_id}}
zotero_key: {{zotero_key}}
title: {{title_yaml}}
year: {{year}}
authors:
{{authors_yaml}}
item_type: {{item_type}}
pdf_link: {{pdf_link}}
item_json: {{item_json}}`,outputPdfDir:"zotero/pdfs",outputNoteDir:"zotero/notes",chatPaneLocation:"right",redisUrl:"redis://127.0.0.1:6379",redisIndex:"idx:zotero",redisPrefix:"zotero:chunk:",embedBaseUrl:"http://localhost:1234/v1",embedApiKey:"lm-studio",embedModel:"google/embedding-gemma-300m",chatBaseUrl:"http://127.0.0.1:1234/v1",chatApiKey:"",chatModel:"openai/gpt-oss-20b",chatTemperature:.2,ocrMode:"auto",chunkingMode:"page",ocrQualityThreshold:.5,enableLlmCleanup:!1,llmCleanupBaseUrl:"http://127.0.0.1:1234/v1",llmCleanupApiKey:"",llmCleanupModel:"openai/gpt-oss-20b",llmCleanupTemperature:0,llmCleanupMinQuality:.35,llmCleanupMaxChars:2e3},Z=class extends x.PluginSettingTab{constructor(p,e){super(p,e),this.plugin=e}display(){let{containerEl:p}=this;p.empty(),p.createEl("h2",{text:"Zotero RAG Settings"}),new x.Setting(p).setName("Zotero base URL").setDesc("Local Zotero API base URL, e.g. http://127.0.0.1:23119/api").addText(e=>e.setPlaceholder("http://127.0.0.1:23119/api").setValue(this.plugin.settings.zoteroBaseUrl).onChange(async t=>{this.plugin.settings.zoteroBaseUrl=t.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Zotero user ID").setDesc("Use 0 for local library. You can also enter users/<id> or groups/<id>.").addText(e=>e.setPlaceholder("123456").setValue(this.plugin.settings.zoteroUserId).onChange(async t=>{this.plugin.settings.zoteroUserId=t.trim(),await this.plugin.saveSettings()})),p.createEl("h3",{text:"Zotero Web API (optional fallback)"}),new x.Setting(p).setName("Web API base URL").setDesc("Zotero Web API base URL for write fallback, e.g. https://api.zotero.org").addText(e=>e.setPlaceholder("https://api.zotero.org").setValue(this.plugin.settings.webApiBaseUrl).onChange(async t=>{this.plugin.settings.webApiBaseUrl=t.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Web API library type").setDesc("Library type for Web API writes.").addDropdown(e=>e.addOption("user","user").addOption("group","group").setValue(this.plugin.settings.webApiLibraryType).onChange(async t=>{this.plugin.settings.webApiLibraryType=t,await this.plugin.saveSettings()})),new x.Setting(p).setName("Web API library ID").setDesc("Numeric Zotero user/group ID for Web API writes.").addText(e=>e.setPlaceholder("15218").setValue(this.plugin.settings.webApiLibraryId).onChange(async t=>{this.plugin.settings.webApiLibraryId=t.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Web API key").setDesc("Zotero API key for write fallback (from zotero.org).").addText(e=>e.setPlaceholder("your-api-key").setValue(this.plugin.settings.webApiKey).onChange(async t=>{this.plugin.settings.webApiKey=t.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Python path").setDesc("Path to python3").addText(e=>e.setPlaceholder("python3").setValue(this.plugin.settings.pythonPath).onChange(async t=>{this.plugin.settings.pythonPath=t.trim()||"python3",await this.plugin.saveSettings()})),new x.Setting(p).setName("Copy PDFs into vault").setDesc("Disable to use Zotero storage paths directly. If a local file path is unavailable, the plugin temporarily copies the PDF into the vault for processing.").addToggle(e=>e.setValue(this.plugin.settings.copyPdfToVault).onChange(async t=>{this.plugin.settings.copyPdfToVault=t,await this.plugin.saveSettings()})),new x.Setting(p).setName("Frontmatter template").setDesc("Use {{doc_id}}, {{zotero_key}}, {{title}}, {{title_yaml}}, {{year}}, {{date}}, {{authors}}, {{authors_yaml}}, {{tags}}, {{item_type}}, {{pdf_link}}, {{item_json}}").addTextArea(e=>{e.inputEl.rows=8,e.setValue(this.plugin.settings.frontmatterTemplate).onChange(async t=>{this.plugin.settings.frontmatterTemplate=t,await this.plugin.saveSettings()})}),new x.Setting(p).setName("Docker path").setDesc("CLI path for Docker (used to start Redis Stack).").addText(e=>e.setPlaceholder("docker").setValue(this.plugin.settings.dockerPath).onChange(async t=>{this.plugin.settings.dockerPath=t.trim()||"docker",await this.plugin.saveSettings()})),p.createEl("h3",{text:"Output folders (vault-relative)"}),new x.Setting(p).setName("PDF folder").addText(e=>e.setPlaceholder("zotero/pdfs").setValue(this.plugin.settings.outputPdfDir).onChange(async t=>{this.plugin.settings.outputPdfDir=t.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Notes folder").addText(e=>e.setPlaceholder("zotero/notes").setValue(this.plugin.settings.outputNoteDir).onChange(async t=>{this.plugin.settings.outputNoteDir=t.trim(),await this.plugin.saveSettings()})),p.createEl("h3",{text:"Redis Stack"}),new x.Setting(p).setName("Redis URL").addText(e=>e.setPlaceholder("redis://127.0.0.1:6379").setValue(this.plugin.settings.redisUrl).onChange(async t=>{this.plugin.settings.redisUrl=t.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Index name").addText(e=>e.setPlaceholder("idx:zotero").setValue(this.plugin.settings.redisIndex).onChange(async t=>{this.plugin.settings.redisIndex=t.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Key prefix").addText(e=>e.setPlaceholder("zotero:chunk:").setValue(this.plugin.settings.redisPrefix).onChange(async t=>{this.plugin.settings.redisPrefix=t.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Auto-start Redis Stack (Docker Compose)").setDesc("Requires Docker Desktop running and your vault path shared with Docker.").addToggle(e=>e.setValue(this.plugin.settings.autoStartRedis).onChange(async t=>{this.plugin.settings.autoStartRedis=t,await this.plugin.saveSettings()})),new x.Setting(p).setName("Start Redis Stack now").setDesc("Restarts Docker Compose with the vault data directory.").addButton(e=>e.setButtonText("Start").onClick(async()=>{await this.plugin.startRedisStack()})),p.createEl("h3",{text:"Embeddings (LM Studio)"}),new x.Setting(p).setName("Embeddings base URL").addText(e=>e.setPlaceholder("http://localhost:1234/v1").setValue(this.plugin.settings.embedBaseUrl).onChange(async t=>{this.plugin.settings.embedBaseUrl=t.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Embeddings API key").addText(e=>e.setPlaceholder("lm-studio").setValue(this.plugin.settings.embedApiKey).onChange(async t=>{this.plugin.settings.embedApiKey=t.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Embeddings model").addText(e=>e.setPlaceholder("google/embedding-gemma-300m").setValue(this.plugin.settings.embedModel).onChange(async t=>{this.plugin.settings.embedModel=t.trim(),await this.plugin.saveSettings()})),p.createEl("h3",{text:"Chat LLM"}),new x.Setting(p).setName("Chat base URL").setDesc("OpenAI-compatible chat endpoint base URL").addText(e=>e.setPlaceholder("http://localhost:1234/v1").setValue(this.plugin.settings.chatBaseUrl).onChange(async t=>{this.plugin.settings.chatBaseUrl=t.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Chat API key").addText(e=>e.setPlaceholder("lm-studio").setValue(this.plugin.settings.chatApiKey).onChange(async t=>{this.plugin.settings.chatApiKey=t.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Chat model").addText(e=>e.setPlaceholder("meta-llama/llama-3.1-405b-instruct").setValue(this.plugin.settings.chatModel).onChange(async t=>{this.plugin.settings.chatModel=t.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Temperature").addText(e=>e.setPlaceholder("0.2").setValue(String(this.plugin.settings.chatTemperature)).onChange(async t=>{let n=Number.parseFloat(t);this.plugin.settings.chatTemperature=Number.isFinite(n)?n:.2,await this.plugin.saveSettings()})),new x.Setting(p).setName("Chat panel location").setDesc("Where to open the chat view by default.").addDropdown(e=>e.addOption("right","Right sidebar").addOption("main","Main window").setValue(this.plugin.settings.chatPaneLocation).onChange(async t=>{this.plugin.settings.chatPaneLocation=t,await this.plugin.saveSettings()})),p.createEl("h3",{text:"Docling"}),new x.Setting(p).setName("OCR mode").setDesc("auto: skip OCR when text is readable; force if bad: OCR only when text looks poor; force: always OCR.").addDropdown(e=>e.addOption("auto","auto").addOption("force_low_quality","force if quality is bad").addOption("force","force").setValue(this.plugin.settings.ocrMode).onChange(async t=>{this.plugin.settings.ocrMode=t,await this.plugin.saveSettings()})),new x.Setting(p).setName("Text quality threshold").setDesc("Lower values are stricter; below this threshold the text is treated as low quality.").addSlider(e=>{e.setLimits(0,1,.05).setValue(this.plugin.settings.ocrQualityThreshold).setDynamicTooltip().onChange(async t=>{this.plugin.settings.ocrQualityThreshold=t,await this.plugin.saveSettings()})}),new x.Setting(p).setName("Chunking").setDesc("page or section").addDropdown(e=>e.addOption("page","page").addOption("section","section").setValue(this.plugin.settings.chunkingMode).onChange(async t=>{this.plugin.settings.chunkingMode=t,await this.plugin.saveSettings()})),p.createEl("h4",{text:"OCR cleanup (optional)"}),new x.Setting(p).setName("LLM cleanup for low-quality chunks").setDesc("Optional OpenAI-compatible cleanup for poor OCR. Can be slow/costly.").addToggle(e=>e.setValue(this.plugin.settings.enableLlmCleanup).onChange(async t=>{this.plugin.settings.enableLlmCleanup=t,await this.plugin.saveSettings()})),new x.Setting(p).setName("LLM cleanup base URL").setDesc("OpenAI-compatible endpoint, e.g. http://127.0.0.1:1234/v1").addText(e=>e.setPlaceholder("http://127.0.0.1:1234/v1").setValue(this.plugin.settings.llmCleanupBaseUrl).onChange(async t=>{this.plugin.settings.llmCleanupBaseUrl=t.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("LLM cleanup API key").setDesc("Optional API key for the cleanup endpoint.").addText(e=>e.setPlaceholder("sk-...").setValue(this.plugin.settings.llmCleanupApiKey).onChange(async t=>{this.plugin.settings.llmCleanupApiKey=t.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("LLM cleanup model").setDesc("Model to use for cleanup.").addText(e=>e.setPlaceholder("openai/gpt-oss-20b").setValue(this.plugin.settings.llmCleanupModel).onChange(async t=>{this.plugin.settings.llmCleanupModel=t.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("LLM cleanup temperature").setDesc("Lower is more conservative.").addText(e=>e.setPlaceholder("0.0").setValue(String(this.plugin.settings.llmCleanupTemperature)).onChange(async t=>{let n=Number.parseFloat(t);this.plugin.settings.llmCleanupTemperature=Number.isFinite(n)?n:0,await this.plugin.saveSettings()})),new x.Setting(p).setName("LLM cleanup min quality").setDesc("Only run cleanup when chunk quality is below this threshold (0-1).").addText(e=>e.setPlaceholder("0.35").setValue(String(this.plugin.settings.llmCleanupMinQuality)).onChange(async t=>{let n=Number.parseFloat(t);this.plugin.settings.llmCleanupMinQuality=Number.isFinite(n)?n:.35,await this.plugin.saveSettings()})),new x.Setting(p).setName("LLM cleanup max chars").setDesc("Skip cleanup for chunks longer than this limit.").addText(e=>e.setPlaceholder("2000").setValue(String(this.plugin.settings.llmCleanupMaxChars)).onChange(async t=>{let n=Number.parseInt(t,10);this.plugin.settings.llmCleanupMaxChars=Number.isFinite(n)?n:2e3,await this.plugin.saveSettings()}))}};var Q={"docling_extract.py":`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.1.7
import argparse
import json
import logging
import os
import re
import statistics
import shutil
import sys
from dataclasses import dataclass
from typing import Any, Callable, Dict, Iterable, List, Optional, Sequence, Tuple


LOGGER = logging.getLogger("docling_extract")


def eprint(message: str) -> None:
    sys.stderr.write(message + "\\n")


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
    quality_confidence_threshold: float = 0.5
    quality_use_wordfreq: bool = True
    quality_wordfreq_min_zipf: float = 3.0
    column_detect_enable: bool = True
    column_detect_dpi: int = 150
    column_detect_max_pages: int = 3
    column_detect_crop_top_ratio: float = 0.08
    column_detect_crop_bottom_ratio: float = 0.08
    column_detect_threshold_std_mult: float = 1.0
    column_detect_threshold_min: int = 120
    column_detect_threshold_max: int = 210
    column_detect_text_percentile: float = 0.7
    column_detect_min_text_density: float = 0.02
    column_detect_gap_threshold_ratio: float = 0.2
    column_detect_min_gap_density: float = 0.01
    column_detect_min_gap_ratio: float = 0.03
    column_detect_min_pages_ratio: float = 0.4
    column_detect_smooth_window: int = 5
    page_range_sample_tokens: int = 200
    page_range_min_overlap: float = 0.02
    page_range_min_hits: int = 5
    page_range_top_k: int = 5
    page_range_peak_ratio: float = 0.5
    page_range_cluster_gap: int = 1
    page_range_max_span_ratio: float = 0.7
    per_page_ocr_on_low_quality: bool = True
    force_ocr_on_low_quality_text: bool = False
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
    analysis_sample_strategy: str = "middle"
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
    dictionary_hit_ratio: Optional[float] = None

@dataclass
class ColumnLayoutDetection:
    detected: bool
    page_ratio: float
    reason: str

@dataclass
class DoclingConversionResult:
    markdown: str
    pages: List[Dict[str, Any]]
    metadata: Dict[str, Any]


def normalize_text(text: str) -> str:
    return re.sub(r"\\s+", " ", text).strip()


def normalize_whitespace(text: str) -> str:
    text = text.replace("\\r\\n", "\\n").replace("\\r", "\\n")
    text = re.sub(r"[ \\t]+", " ", text)
    text = re.sub(r"\\n{3,}", "\\n\\n", text)
    return text.strip()


def dehyphenate_text(text: str) -> str:
    return re.sub(r"(?<=\\w)-\\s*\\n\\s*(?=\\w)", "", text)


def replace_ligatures(text: str) -> str:
    return (
        text.replace("\\ufb01", "fi")
        .replace("\\ufb02", "fl")
        .replace("\\ufb03", "ffi")
        .replace("\\ufb04", "ffl")
    )


def select_wordfreq_languages(languages: str) -> List[str]:
    lang = (languages or "").lower()
    selected: List[str] = []
    if any(token in lang for token in ("deu", "ger", "de", "german", "deutsch")):
        selected.append("de")
    if any(token in lang for token in ("eng", "en", "english")):
        selected.append("en")
    if not selected:
        selected.append("en")
    return selected


def compute_dictionary_hit_ratio(
    tokens: Sequence[str],
    languages: str,
    min_zipf: float,
) -> Optional[float]:
    try:
        from wordfreq import zipf_frequency
    except Exception:
        return None

    if not tokens:
        return None
    lang_codes = select_wordfreq_languages(languages)
    hits = 0
    total = 0
    for token in tokens:
        lower = token.lower()
        if len(lower) < 2:
            continue
        total += 1
        if any(zipf_frequency(lower, lang) >= min_zipf for lang in lang_codes):
            hits += 1
    if not total:
        return None
    return hits / total


def estimate_text_quality(
    pages: Sequence[Dict[str, Any]],
    config: Optional[DoclingProcessingConfig] = None,
    languages: Optional[str] = None,
) -> TextQuality:
    if not pages:
        return TextQuality(0.0, 0.0, 1.0, 0.0, None)

    texts = [str(page.get("text", "")) for page in pages]
    total_chars = sum(len(text) for text in texts)
    alpha_chars = sum(sum(char.isalpha() for char in text) for text in texts)
    alpha_ratio = alpha_chars / max(1, total_chars)

    tokens = re.findall(r"[A-Za-z0-9]+", " ".join(texts))
    suspicious_tokens = [
        token for token in tokens
        if (sum(char.isdigit() for char in token) / max(1, len(token))) > 0.5
        or re.search(r"(.)\\1\\1", token)
    ]
    suspicious_ratio = len(suspicious_tokens) / max(1, len(tokens))

    avg_chars = total_chars / max(1, len(pages))
    dictionary_hit_ratio = None
    if config and config.quality_use_wordfreq and languages:
        dictionary_hit_ratio = compute_dictionary_hit_ratio(
            tokens,
            languages,
            config.quality_wordfreq_min_zipf,
        )
    confidence = alpha_ratio * (1.0 - suspicious_ratio)
    if dictionary_hit_ratio is not None:
        confidence *= 0.4 + (0.6 * dictionary_hit_ratio)
    confidence = max(0.0, min(1.0, confidence))
    return TextQuality(avg_chars, alpha_ratio, suspicious_ratio, confidence, dictionary_hit_ratio)


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
    if quality.confidence_proxy < config.quality_confidence_threshold:
        return True
    return (
        quality.avg_chars_per_page < config.quality_min_avg_chars_per_page
        or quality.alpha_ratio < config.quality_alpha_ratio_threshold
        or quality.suspicious_token_ratio > config.quality_suspicious_token_threshold
    )


def should_rasterize_text_layer(has_text_layer: bool, low_quality: bool, config: DoclingProcessingConfig) -> bool:
    if config.ocr_mode == "force":
        return True
    return bool(has_text_layer and low_quality and config.force_ocr_on_low_quality_text)


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

    if re.search(r"(\\bde\\b|_de\\b|-de\\b|deu|german|deutsch)", name):
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
    low_quality = is_low_quality(quality, config)
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
    elif has_text_layer and not (config.force_ocr_on_low_quality_text and low_quality):
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
        if has_text_layer:
            route_reason = "Text layer detected but low quality"
        else:
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
        "ueber": "\\u00fcber",
        "fuer": "f\\u00fcr",
        "koennen": "k\\u00f6nnen",
        "muessen": "m\\u00fcssen",
        "haeufig": "h\\u00e4ufig",
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
            for ascii_seq, umlaut in (("ae", "\\u00e4"), ("oe", "\\u00f6"), ("ue", "\\u00fc")):
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
    languages = select_language_set(config.language_hint, "", config)
    quality = estimate_text_quality([{"text": text}], config, languages)
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


def select_analysis_page_indices(
    total_pages: int,
    max_pages: Optional[int],
    sample_strategy: str,
) -> List[int]:
    if total_pages <= 0:
        return []
    if not max_pages or max_pages <= 0 or total_pages <= max_pages:
        return list(range(1, total_pages + 1))

    strategy = (sample_strategy or "first").lower()
    if strategy == "middle":
        start = max(1, (total_pages - max_pages) // 2 + 1)
        end = min(total_pages, start + max_pages - 1)
        return list(range(start, end + 1))
    return list(range(1, max_pages + 1))


def extract_pages_from_pdf(
    pdf_path: str,
    max_pages: Optional[int] = None,
    sample_strategy: str = "first",
) -> List[Dict[str, Any]]:
    try:
        from pypdf import PdfReader
    except Exception as exc:
        eprint(f"pypdf is not available for fallback page extraction: {exc}")
        return []

    pages: List[Dict[str, Any]] = []
    try:
        reader = PdfReader(pdf_path)
        page_indices = select_analysis_page_indices(len(reader.pages), max_pages, sample_strategy)
        for idx in page_indices:
            page = reader.pages[idx - 1]
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
                "text": "\\n".join(current_lines).strip(),
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


_PAGE_RANGE_STOPWORDS = {
    "the", "and", "for", "with", "that", "this", "from", "into", "over",
    "under", "after", "before", "were", "was", "are", "is", "its", "their",
    "then", "than", "than", "which", "when", "where", "have", "has", "had",
    "into", "onto", "upon", "your", "yours", "they", "them", "these", "those",
    "will", "would", "could", "should", "about", "there", "here", "while",
    "what", "why", "how", "not", "but", "you", "your", "our", "ours", "his",
    "her", "she", "him", "she", "him", "its", "also", "such", "been", "being",
    "out", "one", "two", "three", "four", "five", "six", "seven", "eight",
    "nine", "ten", "more", "most", "some", "many", "few", "each", "per",
}


def tokenize_for_page_range(text: str) -> List[str]:
    tokens = re.findall(r"[A-Za-z0-9]{3,}", text.lower())
    return [token for token in tokens if token not in _PAGE_RANGE_STOPWORDS]


def sample_tokens(tokens: Sequence[str], max_tokens: int) -> List[str]:
    if max_tokens <= 0 or len(tokens) <= max_tokens:
        return list(tokens)
    step = max(1, len(tokens) // max_tokens)
    return list(tokens[::step])


def compute_page_overlap(
    section_text: str,
    pages: List[Dict[str, Any]],
    config: DoclingProcessingConfig,
) -> List[Tuple[float, int, int]]:
    section_tokens = tokenize_for_page_range(section_text)
    if not section_tokens:
        return []
    sample = sample_tokens(section_tokens, config.page_range_sample_tokens)
    sample_set = set(sample)
    total = len(sample_set)
    results: List[Tuple[float, int, int]] = []
    for page in pages:
        page_text = str(page.get("text", ""))
        page_tokens = set(tokenize_for_page_range(page_text))
        hits = len(sample_set & page_tokens)
        ratio = hits / max(1, total)
        results.append((ratio, hits, int(page.get("page_num", 0))))
    return results


def select_overlap_cluster(
    overlap_scores: Sequence[Tuple[float, int, int]],
    config: DoclingProcessingConfig,
) -> List[int]:
    if not overlap_scores:
        return []
    max_ratio = max(score[0] for score in overlap_scores)
    max_hits = max(score[1] for score in overlap_scores)
    ratio_cutoff = max(config.page_range_min_overlap, max_ratio * config.page_range_peak_ratio)
    hits_cutoff = max(config.page_range_min_hits, int(max_hits * config.page_range_peak_ratio))
    candidates = [
        (ratio, hits, page_num)
        for ratio, hits, page_num in overlap_scores
        if ratio >= ratio_cutoff or hits >= hits_cutoff
    ]
    if not candidates:
        candidates = sorted(overlap_scores, reverse=True)[: config.page_range_top_k]

    candidates.sort(key=lambda item: item[2])
    clusters: List[List[Tuple[float, int, int]]] = []
    current: List[Tuple[float, int, int]] = []
    for entry in candidates:
        if not current:
            current.append(entry)
            continue
        if entry[2] - current[-1][2] <= config.page_range_cluster_gap:
            current.append(entry)
        else:
            clusters.append(current)
            current = [entry]
    if current:
        clusters.append(current)

    def cluster_score(cluster: Sequence[Tuple[float, int, int]]) -> Tuple[float, float]:
        ratios = [item[0] for item in cluster]
        return (sum(ratios), max(ratios))

    best_cluster = max(clusters, key=cluster_score)
    page_nums = [item[2] for item in best_cluster]
    if len(page_nums) > 1:
        span_ratio = (max(page_nums) - min(page_nums) + 1) / max(1, len(overlap_scores))
        if span_ratio > config.page_range_max_span_ratio:
            trimmed = sorted(best_cluster, reverse=True)[: config.page_range_top_k]
            page_nums = [item[2] for item in trimmed]
    return page_nums


def find_page_range(
    section_text: str,
    pages: List[Dict[str, Any]],
    config: Optional[DoclingProcessingConfig] = None,
) -> Tuple[int, int]:
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

    if page_start == 0 or page_end == 0:
        config = config or DoclingProcessingConfig()
        overlap_scores = compute_page_overlap(cleaned, pages, config)
        page_nums = select_overlap_cluster(overlap_scores, config)
        if page_nums:
            if page_start == 0:
                page_start = min(page_nums)
            if page_end == 0:
                page_end = max(page_nums)

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


def find_poppler_path() -> Optional[str]:
    env_path = os.environ.get("POPPLER_PATH")
    if env_path and os.path.isfile(os.path.join(env_path, "pdftoppm")):
        return env_path
    pdftoppm = shutil.which("pdftoppm")
    if pdftoppm:
        return os.path.dirname(pdftoppm)
    for candidate in ("/opt/homebrew/bin", "/usr/local/bin", "/usr/bin"):
        if os.path.isfile(os.path.join(candidate, "pdftoppm")):
            return candidate
    return None


def render_pdf_pages(pdf_path: str, dpi: int) -> List[Any]:
    from pdf2image import convert_from_path

    poppler_path = find_poppler_path()
    if poppler_path:
        if shutil.which("pdftoppm") is None:
            LOGGER.info("Poppler not on PATH; using %s", poppler_path)
        return convert_from_path(pdf_path, dpi=dpi, poppler_path=poppler_path)
    return convert_from_path(pdf_path, dpi=dpi)


def render_pdf_pages_sample(pdf_path: str, dpi: int, max_pages: int) -> List[Any]:
    from pdf2image import convert_from_path

    if max_pages <= 0:
        return []
    poppler_path = find_poppler_path()
    kwargs = {"dpi": dpi, "first_page": 1, "last_page": max_pages}
    if poppler_path:
        if shutil.which("pdftoppm") is None:
            LOGGER.info("Poppler not on PATH; using %s", poppler_path)
        kwargs["poppler_path"] = poppler_path
    return convert_from_path(pdf_path, **kwargs)


def compute_column_density(
    image: Any,
    config: DoclingProcessingConfig,
    target_width: int = 300,
) -> List[float]:
    gray = image.convert("L")
    width, height = gray.size
    if width > target_width:
        scale = target_width / max(1, width)
        gray = gray.resize((target_width, max(1, int(height * scale))))
    width, height = gray.size
    crop_top = int(height * config.column_detect_crop_top_ratio)
    crop_bottom = int(height * config.column_detect_crop_bottom_ratio)
    if crop_top + crop_bottom < height - 1:
        gray = gray.crop((0, crop_top, width, height - crop_bottom))

    try:
        import numpy as np
    except Exception:
        pixels = list(gray.getdata())
        w, h = gray.size
        if w == 0 or h == 0:
            return []
        sorted_pixels = sorted(pixels)
        median = sorted_pixels[len(sorted_pixels) // 2]
        mean = sum(pixels) / max(1, len(pixels))
        variance = sum((value - mean) ** 2 for value in pixels) / max(1, len(pixels))
        std = variance ** 0.5
        threshold = median - (std * config.column_detect_threshold_std_mult)
        threshold = min(threshold, config.column_detect_threshold_max)
        threshold = max(threshold, config.column_detect_threshold_min)
        densities = [0] * w
        for y in range(h):
            row = pixels[y * w:(y + 1) * w]
            for x, value in enumerate(row):
                if value < threshold:
                    densities[x] += 1
        return [count / h for count in densities]

    arr = np.asarray(gray)
    if arr.size == 0:
        return []
    median = float(np.median(arr))
    std = float(arr.std())
    threshold = median - (std * config.column_detect_threshold_std_mult)
    threshold = min(threshold, config.column_detect_threshold_max)
    threshold = max(threshold, config.column_detect_threshold_min)
    mask = arr < threshold
    return mask.mean(axis=0).tolist()


def smooth_density(density: Sequence[float], window: int) -> List[float]:
    if window <= 1 or not density:
        return list(density)
    size = max(1, int(window))
    half = size // 2
    smoothed: List[float] = []
    for idx in range(len(density)):
        start = max(0, idx - half)
        end = min(len(density), idx + half + 1)
        smoothed.append(sum(density[start:end]) / max(1, end - start))
    return smoothed


def density_percentile(density: Sequence[float], percentile: float) -> float:
    if not density:
        return 0.0
    clamped = max(0.0, min(1.0, percentile))
    sorted_vals = sorted(density)
    idx = int(round(clamped * (len(sorted_vals) - 1)))
    return sorted_vals[idx]


def count_column_gaps(
    density: Sequence[float],
    config: DoclingProcessingConfig,
) -> int:
    if not density:
        return 0
    total = len(density)
    margin = max(1, int(total * 0.05))
    start = margin
    end = max(start + 1, total - margin)
    core = density[start:end]
    if not core:
        return 0
    text_level = density_percentile(core, config.column_detect_text_percentile)
    if text_level < config.column_detect_min_text_density:
        return 0
    threshold = max(config.column_detect_min_gap_density, text_level * config.column_detect_gap_threshold_ratio)
    min_gap = max(1, int(len(core) * config.column_detect_min_gap_ratio))

    gaps = 0
    idx = 0
    while idx < len(core):
        if core[idx] < threshold:
            gap_start = idx
            while idx < len(core) and core[idx] < threshold:
                idx += 1
            if idx - gap_start >= min_gap:
                gaps += 1
        else:
            idx += 1
    return gaps


def detect_multicolumn_layout(
    images: Sequence[Any],
    config: DoclingProcessingConfig,
) -> ColumnLayoutDetection:
    if not images:
        return ColumnLayoutDetection(False, 0.0, "No pages available")
    sample = list(images[: config.column_detect_max_pages])
    if not sample:
        return ColumnLayoutDetection(False, 0.0, "No sample pages")

    hits = 0
    for image in sample:
        density = compute_column_density(image, config)
        density = smooth_density(density, config.column_detect_smooth_window)
        gaps = count_column_gaps(density, config)
        if gaps >= 1:
            hits += 1
    ratio = hits / max(1, len(sample))
    detected = ratio >= config.column_detect_min_pages_ratio
    reason = f"{hits}/{len(sample)} pages show column gutters"
    return ColumnLayoutDetection(detected, ratio, reason)


def rasterize_pdf_to_temp(pdf_path: str, dpi: int) -> str:
    from tempfile import NamedTemporaryFile

    images = render_pdf_pages(pdf_path, dpi)
    if not images:
        raise RuntimeError("Failed to render PDF pages for rasterization.")

    temp_file = NamedTemporaryFile(delete=False, suffix=".pdf")
    temp_file.close()
    first = images[0]
    rest = images[1:]
    first.save(temp_file.name, format="PDF", save_all=True, append_images=rest)
    return temp_file.name


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
        pages.append({"page_num": idx, "text": "\\n".join(lines)})

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


def build_quality_report(pdf_path: str, config: DoclingProcessingConfig) -> Dict[str, Any]:
    analysis_pages = extract_pages_from_pdf(
        pdf_path,
        max_pages=config.analysis_max_pages,
        sample_strategy=config.analysis_sample_strategy,
    )
    has_text_layer = detect_text_layer_from_pages(analysis_pages, config)
    languages = select_language_set(config.language_hint, pdf_path, config)
    quality = estimate_text_quality(analysis_pages, config, languages)
    low_quality = is_low_quality(quality, config)
    return {
        "text_layer_detected": has_text_layer,
        "text_layer_low_quality": has_text_layer and low_quality,
        "avg_chars_per_page": quality.avg_chars_per_page,
        "alpha_ratio": quality.alpha_ratio,
        "suspicious_token_ratio": quality.suspicious_token_ratio,
        "confidence_proxy": quality.confidence_proxy,
        "dictionary_hit_ratio": quality.dictionary_hit_ratio,
    }


def convert_pdf_with_docling(pdf_path: str, config: DoclingProcessingConfig) -> DoclingConversionResult:
    analysis_pages = extract_pages_from_pdf(
        pdf_path,
        max_pages=config.analysis_max_pages,
        sample_strategy=config.analysis_sample_strategy,
    )
    has_text_layer = detect_text_layer_from_pages(analysis_pages, config)
    languages = select_language_set(config.language_hint, pdf_path, config)
    quality = estimate_text_quality(analysis_pages, config, languages)
    low_quality = is_low_quality(quality, config)
    available_engines = detect_available_ocr_engines()
    decision = decide_ocr_route(has_text_layer, quality, available_engines, config, languages)
    rasterized_source = False
    rasterized_pdf_path = ""
    rasterize_error: Optional[str] = None
    column_layout: Optional[ColumnLayoutDetection] = None
    if should_rasterize_text_layer(has_text_layer, low_quality, config):
        try:
            rasterized_pdf_path = rasterize_pdf_to_temp(pdf_path, config.ocr_dpi)
            rasterized_source = True
            LOGGER.info("Rasterized low-quality text layer for Docling OCR.")
        except Exception as exc:
            rasterize_error = str(exc)
            LOGGER.warning("Failed to rasterize PDF for OCR: %s", exc)
    if rasterized_source:
        decision.per_page_ocr = False
        decision.per_page_reason = "Rasterized PDF for Docling OCR"

    if config.column_detect_enable and decision.ocr_used and (rasterized_source or not has_text_layer):
        try:
            sample_images = render_pdf_pages_sample(
                pdf_path,
                config.column_detect_dpi,
                config.column_detect_max_pages,
            )
            column_layout = detect_multicolumn_layout(sample_images, config)
            LOGGER.info(
                "Column layout detection: %s (%s)",
                column_layout.detected,
                column_layout.reason,
            )
            if column_layout.detected and decision.use_external_ocr and decision.per_page_ocr:
                decision.per_page_ocr = False
                decision.per_page_reason = "Columns detected; keep Docling layout"
        except Exception as exc:
            LOGGER.warning("Column layout detection failed: %s", exc)

    dict_ratio = "n/a" if quality.dictionary_hit_ratio is None else f"{quality.dictionary_hit_ratio:.2f}"
    LOGGER.info(
        "Text-layer check: %s (avg_chars=%.1f, alpha_ratio=%.2f, suspicious=%.2f, dict=%s)",
        has_text_layer,
        quality.avg_chars_per_page,
        quality.alpha_ratio,
        quality.suspicious_token_ratio,
        dict_ratio,
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
    docling_input = rasterized_pdf_path or pdf_path
    result = converter.convert(docling_input)
    doc = result.document if hasattr(result, "document") else result
    markdown = export_markdown(doc)
    pages = extract_pages(doc)
    if len(pages) <= 1:
        fallback_pages = extract_pages_from_pdf(pdf_path)
        if len(fallback_pages) > len(pages):
            pages = fallback_pages

    ocr_stats: Dict[str, Any] = {}
    if decision.ocr_used and decision.use_external_ocr and decision.per_page_ocr and not rasterized_source:
        try:
            ocr_pages, ocr_stats = run_external_ocr_pages(pdf_path, decision.ocr_engine, languages, config)
            if ocr_pages:
                pages = ocr_pages
                if config.postprocess_markdown and not markdown.strip():
                    markdown = "\\n\\n".join(page.get("text", "") for page in ocr_pages)
        except Exception as exc:
            LOGGER.warning("External OCR failed (%s): %s", decision.ocr_engine, exc)
    if rasterized_source and rasterized_pdf_path:
        try:
            os.unlink(rasterized_pdf_path)
        except Exception:
            pass

    metadata = {
        "ocr_used": decision.ocr_used,
        "ocr_engine": decision.ocr_engine,
        "languages": decision.languages,
        "route_reason": decision.route_reason,
        "per_page_reason": decision.per_page_reason,
        "text_layer_detected": has_text_layer,
        "text_layer_low_quality": has_text_layer and low_quality,
        "rasterized_source_pdf": rasterized_source,
        "rasterize_failed": bool(rasterize_error),
        "rasterize_error": rasterize_error,
        "column_layout_detected": column_layout.detected if column_layout else None,
        "column_layout_ratio": column_layout.page_ratio if column_layout else None,
        "column_layout_reason": column_layout.reason if column_layout else None,
        "avg_chars_per_page": quality.avg_chars_per_page,
        "alpha_ratio": quality.alpha_ratio,
        "suspicious_token_ratio": quality.suspicious_token_ratio,
        "confidence_proxy": quality.confidence_proxy,
        "dictionary_hit_ratio": quality.dictionary_hit_ratio,
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
    config: Optional[DoclingProcessingConfig] = None,
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
        page_start, page_end = find_page_range(cleaned, pages, config)
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
    parser.add_argument("--doc-id", help="Document identifier")
    parser.add_argument("--out-json", help="Output JSON path")
    parser.add_argument("--out-md", help="Output markdown path")
    parser.add_argument("--chunking", choices=["page", "section"], default="page")
    parser.add_argument("--ocr", choices=["auto", "force", "off"], default="auto")
    parser.add_argument("--language-hint", help="Language hint for OCR/quality (e.g., eng, deu, deu+eng)")
    parser.add_argument(
        "--force-ocr-low-quality",
        action="store_true",
        help="Force OCR when text layer appears low quality",
    )
    parser.add_argument(
        "--quality-threshold",
        type=float,
        help="Confidence threshold for treating text as low quality (0-1)",
    )
    parser.add_argument("--quality-only", action="store_true", help="Output text-layer quality JSON and exit")
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

    if args.quality_only:
        config = DoclingProcessingConfig(ocr_mode=args.ocr)
        if args.force_ocr_low_quality:
            config.force_ocr_on_low_quality_text = True
        if args.quality_threshold is not None:
            config.quality_confidence_threshold = args.quality_threshold
        report = build_quality_report(args.pdf, config)
        print(json.dumps(report))
        return 0

    if not args.doc_id or not args.out_json or not args.out_md:
        eprint("Missing required arguments: --doc-id, --out-json, --out-md")
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
    if args.force_ocr_low_quality:
        config.force_ocr_on_low_quality_text = True
    if args.quality_threshold is not None:
        config.quality_confidence_threshold = args.quality_threshold
    if args.language_hint:
        config.language_hint = args.language_hint
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
            chunks = build_chunks_section(
                args.doc_id,
                markdown,
                pages,
                config=config,
                postprocess=postprocess_fn,
            )
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
`,"index_redisearch.py":`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.1.7
import argparse
import json
import math
import os
import struct
import sys
from typing import Any, Dict, List, Optional, Tuple

import redis
import requests


def eprint(message: str) -> None:
    sys.stderr.write(message + "\\n")


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
        ensure_schema_fields(client, index_name)
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
        "title",
        "TEXT",
        "authors",
        "TAG",
        "SEPARATOR",
        "|",
        "tags",
        "TAG",
        "SEPARATOR",
        "|",
        "year",
        "NUMERIC",
        "item_type",
        "TAG",
        "SEPARATOR",
        "|",
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


def ensure_schema_fields(client: redis.Redis, index_name: str) -> None:
    fields: List[Tuple[str, List[str]]] = [
        ("title", ["TEXT"]),
        ("authors", ["TAG", "SEPARATOR", "|"]),
        ("tags", ["TAG", "SEPARATOR", "|"]),
        ("year", ["NUMERIC"]),
        ("item_type", ["TAG", "SEPARATOR", "|"]),
    ]
    for name, spec in fields:
        try:
            client.execute_command("FT.ALTER", index_name, "SCHEMA", "ADD", name, *spec)
        except redis.exceptions.ResponseError as exc:
            message = str(exc).lower()
            if "duplicate" in message or "already exists" in message:
                continue
            raise


def infer_item_json_path(chunks_json: str, doc_id: str) -> Optional[str]:
    base_name = f"{doc_id}.json"
    chunks_dir = os.path.dirname(chunks_json)
    candidates: List[str] = []
    if os.path.basename(chunks_dir) == "chunks":
        candidates.append(os.path.join(os.path.dirname(chunks_dir), "items", base_name))
    marker = f"{os.sep}chunks{os.sep}"
    if marker in chunks_json:
        candidates.append(chunks_json.replace(marker, f"{os.sep}items{os.sep}"))
    candidates.append(os.path.join(chunks_dir, base_name))
    for candidate in candidates:
        if os.path.isfile(candidate):
            return candidate
    return None


def parse_item_metadata(item_payload: Dict[str, Any]) -> Dict[str, Any]:
    data = item_payload.get("data") if isinstance(item_payload.get("data"), dict) else item_payload
    title = str(data.get("title", "")).strip()
    item_type = str(data.get("itemType", "")).strip()
    tags: List[str] = []
    for tag in data.get("tags", []) or []:
        if isinstance(tag, dict):
            value = str(tag.get("tag", "")).strip()
        else:
            value = str(tag).strip()
        if value:
            tags.append(value)

    creators = data.get("creators", []) or []
    authors: List[str] = []
    for creator in creators:
        if not isinstance(creator, dict):
            continue
        name = ""
        if creator.get("name"):
            name = str(creator.get("name", "")).strip()
        else:
            first = str(creator.get("firstName", "")).strip()
            last = str(creator.get("lastName", "")).strip()
            name = " ".join(part for part in (first, last) if part)
        if name:
            authors.append(name)

    year = 0
    date_field = str(data.get("date", "")).strip()
    match = None
    if date_field:
        match = next(iter(__import__("re").findall(r"(1[5-9]\\\\d{2}|20\\\\d{2})", date_field)), None)
    if match:
        try:
            year = int(match)
        except ValueError:
            year = 0
    elif isinstance(data.get("year"), (int, float)):
        year = int(data.get("year"))

    return {
        "title": title,
        "authors": "|".join(authors),
        "tags": "|".join(tags),
        "year": year,
        "item_type": item_type,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Index Docling chunks into RedisSearch.")
    parser.add_argument("--chunks-json", required=True)
    parser.add_argument("--redis-url", required=True)
    parser.add_argument("--index", required=True)
    parser.add_argument("--prefix", required=True)
    parser.add_argument("--item-json")
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

    item_metadata: Dict[str, Any] = {}
    item_json_path = args.item_json or infer_item_json_path(args.chunks_json, str(doc_id))
    if item_json_path and os.path.isfile(item_json_path):
        try:
            with open(item_json_path, "r", encoding="utf-8") as handle:
                item_payload = json.load(handle)
            item_metadata = parse_item_metadata(item_payload)
        except Exception as exc:
            eprint(f"Failed to read item JSON metadata: {exc}")

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
            "title": str(item_metadata.get("title", "")),
            "authors": str(item_metadata.get("authors", "")),
            "tags": str(item_metadata.get("tags", "")),
            "year": int(item_metadata.get("year", 0)),
            "item_type": str(item_metadata.get("item_type", "")),
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
`,"rag_query_redisearch.py":`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.1.7
import argparse
import json
import math
import re
import struct
import sys
from typing import Any, Dict, List

import redis
import requests


def eprint(message: str) -> None:
    sys.stderr.write(message + "\\n")


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


_QUERY_STOPWORDS = {
    "the", "and", "for", "with", "that", "this", "from", "into", "over",
    "under", "after", "before", "were", "was", "are", "is", "its", "their",
    "then", "than", "which", "when", "where", "have", "has", "had", "onto",
    "upon", "your", "yours", "they", "them", "these", "those", "will", "would",
    "could", "should", "about", "there", "here", "while", "what", "why", "how",
    "not", "but", "you", "your", "our", "ours", "his", "her", "she", "him",
    "also", "such", "been", "being", "out", "one", "two", "three", "four",
    "five", "six", "seven", "eight", "nine", "ten", "more", "most", "some",
    "many", "few", "each", "per", "was", "were", "did", "does", "do",
}


def extract_keywords(query: str) -> List[str]:
    raw_tokens = re.findall(r"[A-Za-z0-9][A-Za-z0-9'\\\\-]{2,}", query)
    keywords: List[str] = []
    for token in raw_tokens:
        cleaned = re.sub(r"[^A-Za-z0-9]", "", token)
        if not cleaned:
            continue
        lower = cleaned.lower()
        if lower in _QUERY_STOPWORDS:
            continue
        if token[:1].isupper() or len(cleaned) >= 5:
            keywords.append(lower)
    seen = set()
    ordered: List[str] = []
    for token in keywords:
        if token in seen:
            continue
        seen.add(token)
        ordered.append(token)
    return ordered


def run_lexical_search(
    client: redis.Redis,
    index: str,
    keywords: List[str],
    limit: int,
) -> List[Dict[str, Any]]:
    if not keywords or limit <= 0:
        return []
    tokens = [re.sub(r"[^A-Za-z0-9]", "", token) for token in keywords]
    tokens = [token for token in tokens if token]
    if not tokens:
        return []
    query = "@text:(" + "|".join(tokens) + ")"
    try:
        raw = client.execute_command(
            "FT.SEARCH",
            index,
            query,
            "LIMIT",
            "0",
            str(limit),
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
    except Exception:
        return []
    return parse_results(raw)


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
            f"chunk_id='{chunk_id}' score='{score}'>\\n{text}\\n</Document>"
        )
        blocks.append(block)
    return "\\n\\n".join(blocks)


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
    keywords = extract_keywords(args.query)
    lexical_limit = max(args.k, 3)
    lexical_results = run_lexical_search(client, args.index, keywords, lexical_limit)
    if lexical_results:
        seen = {item.get("chunk_id") for item in retrieved if item.get("chunk_id")}
        for item in lexical_results:
            chunk_id = item.get("chunk_id")
            if not chunk_id or chunk_id in seen:
                continue
            retrieved.append(item)
            seen.add(chunk_id)
        max_total = args.k + lexical_limit
        if len(retrieved) > max_total:
            retrieved = retrieved[:max_total]
    context = build_context(retrieved)

    system_prompt = (
        "Use ONLY the provided context. If insufficient, say you do not know. "
        "Provide citations by doc_id and pages."
    )
    user_prompt = f"Question: {args.query}\\n\\nContext:\\n{context}"

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
`,"batch_index_pyzotero.py":`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.1.7
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
    sys.stderr.write(message + "\\n")


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
`,"ocr_wordlist.txt":`# zotero-redisearch-rag tool version: 0.1.7
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
`,"docker-compose.yml":`# zotero-redisearch-rag tool version: 0.1.7
services:
  redis-stack:
    image: redis/redis-stack-server:latest
    container_name: redis-stack
    command: ["redis-stack-server", "/redis-stack.conf", "--dir", "/data"]
    environment:
      - REDIS_ARGS=
    ports:
      - "6379:6379"
    volumes:
      - "\${ZRR_DATA_DIR:-./.zotero-redisearch-rag/redis-data}:/data"
      - "./redis-stack.conf:/redis-stack.conf:ro"
`,"redis-stack.conf":`# zotero-redisearch-rag tool version: 0.1.7
# Redis Stack persistence config for local RAG index
appendonly yes
appendfsync everysec

dir /data
`};var q=require("obsidian"),M="zotero-redisearch-rag-chat",F=class extends q.ItemView{constructor(e,t){super(e);this.messages=[];this.messageEls=new Map;this.pendingRender=new Map;this.busy=!1;this.plugin=t}getViewType(){return M}getDisplayText(){return"Zotero RAG Chat"}async onOpen(){let{containerEl:e}=this;e.empty(),e.addClass("zrr-chat-view");let t=e.createEl("div",{cls:"zrr-chat-header"});t.createEl("div",{cls:"zrr-chat-title",text:"Zotero RAG Chat"}),this.clearButton=t.createEl("button",{cls:"zrr-chat-clear",text:"Clear"}),this.clearButton.addEventListener("click",()=>this.clearChat()),this.messagesEl=e.createEl("div",{cls:"zrr-chat-messages"});let n=e.createEl("div",{cls:"zrr-chat-input"});this.inputEl=n.createEl("textarea",{cls:"zrr-chat-textarea",attr:{placeholder:"Ask your Zotero library..."}}),this.sendButton=n.createEl("button",{cls:"zrr-chat-send",text:"Send"}),this.sendButton.addEventListener("click",()=>this.handleSend()),this.inputEl.addEventListener("keydown",r=>{r.key==="Enter"&&!r.shiftKey&&(r.preventDefault(),this.handleSend())}),await this.loadHistory(),await this.renderAll()}focusInput(){var e;(e=this.inputEl)==null||e.focus()}async loadHistory(){try{this.messages=await this.plugin.loadChatHistory()}catch(e){console.error(e),this.messages=[]}}async saveHistory(){try{await this.plugin.saveChatHistory(this.messages)}catch(e){console.error(e)}}async renderAll(){this.messagesEl.empty(),this.messageEls.clear();for(let e of this.messages)await this.renderMessage(e);this.scrollToBottom()}async renderMessage(e){let t=this.messagesEl.createEl("div",{cls:`zrr-chat-message zrr-chat-${e.role}`});t.createEl("div",{cls:"zrr-chat-meta"}).setText(e.role==="user"?"You":"Assistant");let r=t.createEl("div",{cls:"zrr-chat-content"}),s=t.createEl("div",{cls:"zrr-chat-citations"});this.messageEls.set(e.id,{wrapper:t,content:r,citations:s}),await this.renderMessageContent(e)}scheduleRender(e){if(this.pendingRender.has(e.id))return;let t=window.setTimeout(async()=>{this.pendingRender.delete(e.id),await this.renderMessageContent(e),this.scrollToBottom()},80);this.pendingRender.set(e.id,t)}async renderMessageContent(e){var n;let t=this.messageEls.get(e.id);t&&(t.content.empty(),t.citations.empty(),await q.MarkdownRenderer.renderMarkdown(e.content||"",t.content,"",this.plugin),await this.renderCitations(t.citations,(n=e.citations)!=null?n:[]))}async renderCitations(e,t){if(e.empty(),!t.length)return;e.createEl("div",{cls:"zrr-chat-citations-label",text:"Citations"});let n=e.createEl("ul",{cls:"zrr-chat-citation-list"});for(let r of t){let s=await this.plugin.resolveCitationDisplay(r),i=n.createEl("li");i.createEl("a",{text:s.label,href:"#"}).addEventListener("click",o=>{o.preventDefault(),this.plugin.openCitationTarget(r,s)}),s.zoteroUrl&&(i.createEl("span",{text:" \xB7 "}),i.createEl("a",{text:"Zotero",href:"#"}).addEventListener("click",c=>{c.preventDefault(),this.plugin.openExternalUrl(s.zoteroUrl)}))}}scrollToBottom(){this.messagesEl.scrollTop=this.messagesEl.scrollHeight}async handleSend(){if(this.busy)return;let e=this.inputEl.value.trim();if(!e){new q.Notice("Query cannot be empty.");return}if(!this.plugin.settings.chatBaseUrl){new q.Notice("Chat base URL must be set in settings.");return}this.inputEl.value="",this.busy=!0,this.sendButton.disabled=!0;let t={id:this.generateId(),role:"user",content:e,createdAt:new Date().toISOString()};this.messages.push(t),await this.renderMessage(t),this.scrollToBottom(),await this.saveHistory();let n={id:this.generateId(),role:"assistant",content:"",citations:[],createdAt:new Date().toISOString()};this.messages.push(n),await this.renderMessage(n),this.scrollToBottom();let r=!1;try{await this.plugin.runRagQueryStreaming(e,s=>{r=!0,n.content+=s,this.scheduleRender(n)},s=>{(!r&&(s!=null&&s.answer)||s!=null&&s.answer)&&(n.content=s.answer),Array.isArray(s==null?void 0:s.citations)&&(n.citations=s.citations),this.scheduleRender(n)})}catch(s){console.error(s),n.content="Failed to fetch answer. See console for details.",this.scheduleRender(n)}finally{this.busy=!1,this.sendButton.disabled=!1,await this.saveHistory()}}async clearChat(){this.messages=[],await this.saveHistory(),await this.renderAll()}generateId(){return typeof crypto!="undefined"&&"randomUUID"in crypto?crypto.randomUUID():`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}};var K=[{label:"Auto (no hint)",value:""},{label:"English (en)",value:"en"},{label:"German (de)",value:"de"},{label:"German + English (de,en)",value:"de,en"},{label:"French (fr)",value:"fr"},{label:"Spanish (es)",value:"es"},{label:"Italian (it)",value:"it"},{label:"Dutch (nl)",value:"nl"},{label:"Portuguese (pt)",value:"pt"},{label:"Polish (pl)",value:"pl"},{label:"Swedish (sv)",value:"sv"},{label:"Other (custom ISO code)",value:"__custom__"}],Y={en:"eng",de:"deu",fr:"fra",es:"spa",it:"ita",nl:"nld",pt:"por",pl:"pol",sv:"swe"},B=class extends l.Modal{constructor(p,e,t,n,r="Value cannot be empty."){super(p),this.titleText=e,this.placeholder=t,this.onSubmit=n,this.emptyMessage=r}onOpen(){let{contentEl:p}=this;p.empty(),p.createEl("h3",{text:this.titleText});let e=p.createEl("input",{type:"text",placeholder:this.placeholder});e.style.width="100%",e.focus();let t=p.createEl("button",{text:"Submit"});t.style.marginTop="0.75rem";let n=()=>{let r=e.value.trim();if(!r){new l.Notice(this.emptyMessage);return}this.close(),this.onSubmit(r)};t.addEventListener("click",n),e.addEventListener("keydown",r=>{r.key==="Enter"&&n()})}};var V=class extends l.Modal{constructor(e,t,n){super(e);this.resolved=!1;this.filePath=t,this.onResolve=n}onOpen(){let{contentEl:e}=this;e.empty(),e.createEl("h3",{text:"Overwrite existing note?"}),e.createEl("p",{text:`This will overwrite: ${this.filePath}`});let t=e.createEl("div");t.style.display="flex",t.style.gap="0.5rem",t.style.marginTop="0.75rem";let n=t.createEl("button",{text:"Cancel"}),r=t.createEl("button",{text:"Overwrite"});n.addEventListener("click",()=>{this.resolved=!0,this.close(),this.onResolve(!1)}),r.addEventListener("click",()=>{this.resolved=!0,this.close(),this.onResolve(!0)})}onClose(){this.resolved||this.onResolve(!1)}},W=class extends l.SuggestModal{constructor(e,t){super(e);this.resolved=!1;this.resolveSelection=t,this.setPlaceholder("Select a language for OCR/quality...")}getSuggestions(e){let t=e.trim().toLowerCase();return t?K.filter(n=>n.label.toLowerCase().includes(t)||n.value.toLowerCase().includes(t)):K}renderSuggestion(e,t){t.setText(e.label),t.addEventListener("click",()=>this.handleSelection(e))}onChooseSuggestion(e){this.handleSelection(e)}onClose(){this.resolved||this.resolveSelection(null)}handleSelection(e){if(!this.resolved){if(this.resolved=!0,e.value==="__custom__"){this.close(),new B(this.app,"Custom language hint","e.g., en, de, fr, de,en",t=>this.resolveSelection(t.trim()),"Language hint cannot be empty.").open();return}this.resolveSelection(e.value),this.close()}}},j=class extends l.Plugin{constructor(){super(...arguments);this.docIndex=null}async onload(){await this.loadSettings(),await this.migrateCachePaths(),this.addSettingTab(new Z(this.app,this)),this.registerView(M,e=>new F(e,this)),this.setupStatusBar(),this.registerNoteRenameHandler();try{await this.ensureBundledTools()}catch(e){console.error("Failed to sync bundled tools",e)}this.addCommand({id:"import-zotero-item-index",name:"Import Zotero item and index (Docling -> RedisSearch)",callback:()=>this.importZoteroItem()}),this.addCommand({id:"ask-zotero-library",name:"Ask my Zotero library (RAG via RedisSearch)",callback:()=>this.askZoteroLibrary()}),this.addCommand({id:"open-zotero-chat",name:"Open Zotero RAG chat panel",callback:()=>this.openChatView(!0)}),this.addCommand({id:"rebuild-zotero-note-cache",name:"Rebuild Zotero note from cache (Docling + RedisSearch)",callback:()=>this.rebuildNoteFromCache()}),this.addCommand({id:"rebuild-doc-index-cache",name:"Rebuild doc index from cache",callback:()=>this.rebuildDocIndexFromCache()}),this.addCommand({id:"recreate-missing-notes-cache",name:"Recreate missing notes from cache (Docling + RedisSearch)",callback:()=>this.recreateMissingNotesFromCache()}),this.addCommand({id:"reindex-redis-from-cache",name:"Reindex Redis from cached chunks",callback:()=>this.reindexRedisFromCache()}),this.addCommand({id:"start-redis-stack",name:"Start Redis Stack (Docker Compose)",callback:()=>this.startRedisStack()}),this.settings.autoStartRedis&&this.startRedisStack(!0)}async loadSettings(){this.settings=Object.assign({},J,await this.loadData())}async saveSettings(){await this.saveData(this.settings)}async importZoteroItem(){var A,h,D;try{await this.ensureBundledTools()}catch(f){new l.Notice("Failed to sync bundled tools. See console for details."),console.error(f);return}let e;try{e=await this.promptZoteroItem()}catch(f){new l.Notice("Zotero search failed. See console for details."),console.error(f);return}if(!e){new l.Notice("No Zotero item selected.");return}let t=(A=e.data)!=null?A:e;!t.key&&e.key&&(t.key=e.key);let n=this.getDocId(t);if(!n){new l.Notice("Could not resolve a stable doc_id from Zotero item.");return}let r=await this.resolveLanguageHint(t,(h=e.key)!=null?h:t.key),s=this.buildDoclingLanguageHint(r!=null?r:void 0),i=await this.resolvePdfAttachment(t,n);if(!i){new l.Notice("No PDF attachment found for item.");return}this.showStatusProgress("Preparing...",5);let a=typeof t.title=="string"?t.title:"",o=await this.getDocIndexEntry(n);o&&new l.Notice("Item already indexed. Updating cached files and index.");let c=this.sanitizeFileName(a)||n;if(o!=null&&o.note_path)c=_.default.basename(o.note_path,".md")||c;else if(o!=null&&o.pdf_path){let f=this.toVaultRelativePath(o.pdf_path);f&&f.startsWith((0,l.normalizePath)(this.settings.outputPdfDir))&&(c=_.default.basename(f,".pdf")||c)}let d=o?c:await this.resolveUniqueBaseName(c,n),g=(0,l.normalizePath)(`${this.settings.outputPdfDir}/${d}.pdf`),m=(0,l.normalizePath)(`${E}/${n}.json`),u=(0,l.normalizePath)(`${T}/${n}.json`),y=this.app.vault.adapter,w=(0,l.normalizePath)(`${this.settings.outputNoteDir}/${d}.md`);if(o!=null&&o.note_path&&await y.exists(o.note_path)&&(w=(0,l.normalizePath)(o.note_path)),await y.exists(w)&&!await this.confirmOverwrite(w)){new l.Notice("Import canceled.");return}try{await this.ensureFolder(E),await this.ensureFolder(T),await this.ensureFolder(this.settings.outputNoteDir),this.settings.copyPdfToVault&&await this.ensureFolder(this.settings.outputPdfDir)}catch(f){new l.Notice("Failed to create output folders."),console.error(f),this.clearStatusProgress();return}let k="",C="";try{if(this.settings.copyPdfToVault){let f=i.filePath?await I.promises.readFile(i.filePath):await this.downloadZoteroPdf(i.key);await this.app.vault.adapter.writeBinary(g,this.bufferToArrayBuffer(f)),k=this.getAbsoluteVaultPath(g)}else if(i.filePath)k=i.filePath;else{await this.ensureFolder(this.settings.outputPdfDir);let f=await this.downloadZoteroPdf(i.key);await this.app.vault.adapter.writeBinary(g,this.bufferToArrayBuffer(f)),k=this.getAbsoluteVaultPath(g),new l.Notice("Local PDF path unavailable; copied PDF into vault for processing.")}C=this.buildPdfLinkForNote(k,i.key,n)}catch(f){new l.Notice("Failed to download PDF attachment."),console.error(f),this.clearStatusProgress();return}try{await this.app.vault.adapter.write(m,JSON.stringify(e,null,2))}catch(f){new l.Notice("Failed to write Zotero item JSON."),console.error(f),this.clearStatusProgress();return}let v=this.getPluginDir(),b=_.default.join(v,"tools","docling_extract.py"),L=_.default.join(v,"tools","index_redisearch.py"),S=null;try{S=await this.readDoclingQualityLabelFromPdf(k,s),this.showStatusProgress(this.formatStatusLabel("Docling extraction...",S),null),await this.runPython(b,this.buildDoclingArgs(k,n,u,w,s)),S=await this.readDoclingQualityLabel(u)}catch(f){new l.Notice("Docling extraction failed. See console for details."),console.error(f),this.clearStatusProgress();return}try{this.showStatusProgress(this.formatStatusLabel("Indexing chunks...",S),0),await this.runPythonStreaming(L,["--chunks-json",this.getAbsoluteVaultPath(u),"--redis-url",this.settings.redisUrl,"--index",this.settings.redisIndex,"--prefix",this.settings.redisPrefix,"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--progress"],f=>{if((f==null?void 0:f.type)==="progress"&&f.total){let O=Math.round(f.current/f.total*100),te=this.formatStatusLabel(`Indexing chunks ${f.current}/${f.total}`,S);this.showStatusProgress(te,O)}},()=>{})}catch(f){new l.Notice("RedisSearch indexing failed. See console for details."),console.error(f),this.clearStatusProgress();return}try{let f=await this.app.vault.adapter.read(w),O=this.buildNoteMarkdown(t,(D=e.meta)!=null?D:{},n,C,m,f);await this.app.vault.adapter.write(w,O)}catch(f){new l.Notice("Failed to finalize note markdown."),console.error(f),this.clearStatusProgress();return}try{await this.updateDocIndex({doc_id:n,note_path:w,note_title:d,zotero_title:a,pdf_path:k,attachment_key:i.key})}catch(f){console.error("Failed to update doc index",f)}this.showStatusProgress("Done",100),window.setTimeout(()=>this.clearStatusProgress(),1200),new l.Notice(`Indexed Zotero item ${n}.`)}async askZoteroLibrary(){await this.openChatView(!0)}getChatLeaf(){var e;return this.settings.chatPaneLocation==="right"?(e=this.app.workspace.getRightLeaf(!1))!=null?e:this.app.workspace.getLeaf("split"):this.app.workspace.getLeaf("tab")}async openChatView(e=!1){let t=this.getChatLeaf();await t.setViewState({type:M,active:!0}),this.app.workspace.revealLeaf(t);let n=t.view;return n instanceof F&&e&&n.focusInput(),n}async loadChatHistory(){let e=this.app.vault.adapter,t=(0,l.normalizePath)(`${R}/chat.json`);if(!await e.exists(t))return[];let n=await e.read(t),r;try{r=JSON.parse(n)}catch(i){return[]}let s=Array.isArray(r)?r:r==null?void 0:r.messages;return Array.isArray(s)?s.filter(i=>i&&typeof i.content=="string").map(i=>({id:i.id||this.generateChatId(),role:i.role==="assistant"?"assistant":"user",content:i.content,citations:Array.isArray(i.citations)?i.citations:[],createdAt:i.createdAt||new Date().toISOString()})):[]}async saveChatHistory(e){await this.ensureFolder(R);let t=this.app.vault.adapter,n=(0,l.normalizePath)(`${R}/chat.json`),r={version:1,messages:e};await t.write(n,JSON.stringify(r,null,2))}async runRagQueryStreaming(e,t,n){await this.ensureBundledTools();let r=this.getPluginDir(),s=_.default.join(r,"tools","rag_query_redisearch.py"),i=["--query",e,"--k","5","--redis-url",this.settings.redisUrl,"--index",this.settings.redisIndex,"--prefix",this.settings.redisPrefix,"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--chat-base-url",this.settings.chatBaseUrl,"--chat-api-key",this.settings.chatApiKey,"--chat-model",this.settings.chatModel,"--temperature",String(this.settings.chatTemperature),"--stream"];return this.runPythonStreaming(s,i,a=>{if((a==null?void 0:a.type)==="delta"&&typeof a.content=="string"){t(a.content);return}if((a==null?void 0:a.type)==="final"){n(a);return}a!=null&&a.answer&&n(a)},n)}async resolveCitationDisplay(e){var d,g;let t=await this.getDocIndexEntry(e.doc_id);(!t||!t.note_title||!t.zotero_title||!t.note_path||!t.pdf_path)&&(t=await this.hydrateDocIndexFromCache(e.doc_id));let n=e.doc_id?await this.resolveNotePathForDocId(e.doc_id):t==null?void 0:t.note_path,r=(t==null?void 0:t.zotero_title)||(t==null?void 0:t.note_title)||(n?_.default.basename(n,".md"):e.doc_id||"?"),s=e.pages||`${(d=e.page_start)!=null?d:"?"}-${(g=e.page_end)!=null?g:"?"}`,i=`${r} pages ${s}`,a=e.page_start?String(e.page_start):"",o=(t==null?void 0:t.pdf_path)||e.source_pdf||"",c=e.doc_id?this.buildZoteroDeepLink(e.doc_id,t==null?void 0:t.attachment_key,a):void 0;return{label:i,notePath:n||void 0,pdfPath:o||void 0,zoteroUrl:c,pageStart:a||void 0}}async openCitationTarget(e,t){let n=t!=null?t:await this.resolveCitationDisplay(e);if(n.notePath){await this.openNoteInMain(n.notePath);return}if(!(n.pdfPath&&await this.openPdfInMain(n.pdfPath,n.pageStart))){if(n.zoteroUrl){this.openExternalUrl(n.zoteroUrl);return}new l.Notice("Unable to open citation target.")}}async rebuildNoteFromCache(){let e=await this.promptDocId();if(!e){new l.Notice("No doc_id provided.");return}await this.rebuildNoteFromCacheForDocId(e,!0)&&new l.Notice(`Rebuilt Zotero note for ${e}.`)}async rebuildDocIndexFromCache(){var c,d,g;let e=this.app.vault.adapter,t=await this.listDocIds(E),n=await this.listDocIds(T),r=await this.scanNotesForDocIds(this.settings.outputNoteDir),s=Object.keys(r),i=Array.from(new Set([...t,...n,...s]));if(i.length===0){new l.Notice("No cached items found.");return}this.showStatusProgress("Rebuilding doc index...",0);let a=await this.getDocIndex(),o=0;for(let m of i){o+=1;let u={},y=r[m];y&&(u.note_path=y.note_path,u.note_title=y.note_title);let w=(0,l.normalizePath)(`${E}/${m}.json`);if(await e.exists(w))try{let v=await e.read(w),b=JSON.parse(v),L=(d=(c=b==null?void 0:b.data)!=null?c:b)!=null?d:{},S=typeof L.title=="string"?L.title:"";S&&(u.zotero_title=S);let A=this.sanitizeFileName(S)||m,h=(0,l.normalizePath)(`${this.settings.outputNoteDir}/${A}.md`),D=(0,l.normalizePath)(`${this.settings.outputNoteDir}/${A}-${m}.md`);await e.exists(h)?(u.note_path=h,u.note_title=_.default.basename(h,".md")):await e.exists(D)&&(u.note_path=D,u.note_title=_.default.basename(D,".md"))}catch(v){console.error("Failed to read cached item JSON",v)}let k=(0,l.normalizePath)(`${T}/${m}.json`);if(await e.exists(k))try{let v=await e.read(k),b=JSON.parse(v);typeof(b==null?void 0:b.source_pdf)=="string"&&(u.pdf_path=b.source_pdf)}catch(v){console.error("Failed to read cached chunks JSON",v)}if(Object.keys(u).length>0){let b={...(g=a[m])!=null?g:{doc_id:m},...u,doc_id:m,updated_at:new Date().toISOString()};!b.note_title&&b.note_path&&(b.note_title=_.default.basename(b.note_path,".md")),a[m]=b}let C=Math.round(o/i.length*100);this.showStatusProgress(`Rebuilding doc index ${o}/${i.length}`,C)}await this.saveDocIndex(a),this.showStatusProgress("Done",100),window.setTimeout(()=>this.clearStatusProgress(),1200),new l.Notice(`Rebuilt doc index for ${i.length} items.`)}async recreateMissingNotesFromCache(){let e=this.app.vault.adapter,t=await this.listDocIds(E),n=await this.listDocIds(T),r=await this.scanNotesForDocIds(this.settings.outputNoteDir),s=Object.keys(r),i=Array.from(new Set([...t,...n,...s]));if(i.length===0){new l.Notice("No cached items found.");return}let a=[];for(let c of i){if(r[c])continue;let d=await this.getDocIndexEntry(c);if(d!=null&&d.note_path&&await e.exists(d.note_path))continue;let g=await this.inferNotePathFromCache(c);g&&await e.exists(g)||a.push(c)}if(a.length===0){new l.Notice("No missing notes detected.");return}this.showStatusProgress("Recreating missing notes...",0);let o=0;for(let c=0;c<a.length;c+=1){let d=a[c],g=Math.round((c+1)/a.length*100);this.showStatusProgress(`Recreating ${c+1}/${a.length}`,g),await this.rebuildNoteFromCacheForDocId(d,!1)&&(o+=1)}this.showStatusProgress("Done",100),window.setTimeout(()=>this.clearStatusProgress(),1200),new l.Notice(`Recreated ${o}/${a.length} missing notes.`)}async reindexRedisFromCache(){try{await this.ensureBundledTools()}catch(i){new l.Notice("Failed to sync bundled tools. See console for details."),console.error(i);return}let e=await this.listDocIds(T);if(e.length===0){new l.Notice("No cached chunks found.");return}let t=this.getPluginDir(),n=_.default.join(t,"tools","index_redisearch.py"),r=0,s=0;this.showStatusProgress("Reindexing cached chunks...",0);for(let i of e){r+=1;let a=Math.round(r/e.length*100);this.showStatusProgress(`Reindexing ${r}/${e.length}`,a);let o=(0,l.normalizePath)(`${T}/${i}.json`);try{await this.runPython(n,["--chunks-json",this.getAbsoluteVaultPath(o),"--redis-url",this.settings.redisUrl,"--index",this.settings.redisIndex,"--prefix",this.settings.redisPrefix,"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--upsert"])}catch(c){s+=1,console.error(`Failed to reindex ${i}`,c)}}this.showStatusProgress("Done",100),window.setTimeout(()=>this.clearStatusProgress(),1200),s===0?new l.Notice(`Reindexed ${e.length} cached items.`):new l.Notice(`Reindexed ${e.length-s}/${e.length} items (see console).`)}async promptZoteroItem(){return new Promise(e=>{new G(this.app,this,e).open()})}async listDocIds(e){let t=this.app.vault.adapter,n=(0,l.normalizePath)(e);return await t.exists(n)?(await t.list(n)).files.filter(s=>s.endsWith(".json")).map(s=>_.default.basename(s,".json")):[]}async listMarkdownFiles(e){let t=this.app.vault.adapter,n=(0,l.normalizePath)(e);if(!await t.exists(n))return[];let r=[n],s=[];for(;r.length>0;){let i=r.pop();if(!i)continue;let a=await t.list(i);for(let o of a.files)o.endsWith(".md")&&s.push(o);for(let o of a.folders)r.push(o)}return s}extractDocIdFromFrontmatter(e){let t=e.match(/^---\s*\n([\s\S]*?)\n---/);if(!t)return null;let r=t[1].split(/\r?\n/);for(let s of r){let i=s.trim();if(!i||i.startsWith("#"))continue;let a=i.split(":");if(a.length<2)continue;let o=a[0].trim().toLowerCase();if(o!=="doc_id"&&o!=="zotero_key")continue;let d=i.slice(i.indexOf(":")+1).trim().replace(/^["']|["']$/g,"").trim();if(d)return d}return null}async scanNotesForDocIds(e){let t=this.app.vault.adapter,n=await this.listMarkdownFiles(e),r={};for(let s of n)try{let i=await t.read(s),a=this.extractDocIdFromFrontmatter(i);if(!a)continue;r[a]={doc_id:a,note_path:s,note_title:_.default.basename(s,".md"),updated_at:new Date().toISOString()}}catch(i){console.error("Failed to read note for doc_id scan",i)}return r}setupStatusBar(){let e=this.addStatusBarItem();e.addClass("zrr-status-progress"),e.addClass("status-bar-item-segment"),e.style.display="none";let t=e.createEl("span",{text:"Idle"});t.addClass("zrr-status-label");let r=e.createEl("div",{cls:"zrr-status-bar"}).createEl("div",{cls:"zrr-status-bar-inner"});this.statusBarEl=e,this.statusLabelEl=t,this.statusBarInnerEl=r}showStatusProgress(e,t){if(!(!this.statusBarEl||!this.statusLabelEl||!this.statusBarInnerEl))if(this.statusBarEl.style.display="flex",this.statusLabelEl.setText(e),t===null)this.statusBarInnerEl.addClass("indeterminate"),this.statusBarInnerEl.style.width="40%";else{this.statusBarInnerEl.removeClass("indeterminate");let n=Math.max(0,Math.min(100,t));this.statusBarInnerEl.style.width=`${n}%`}}clearStatusProgress(){!this.statusBarEl||!this.statusBarInnerEl||(this.statusBarEl.style.display="none",this.statusBarInnerEl.removeClass("indeterminate"),this.statusBarInnerEl.style.width="0%")}formatStatusLabel(e,t){return t?`${e} (Text layer quality ${t})`:e}async readDoclingQualityLabel(e){var t;try{let n=await this.app.vault.adapter.read(e),r=JSON.parse(n),s=(t=r==null?void 0:r.metadata)==null?void 0:t.confidence_proxy;if(typeof s=="number")return s.toFixed(2)}catch(n){console.warn("Failed to read Docling quality metadata",n)}return null}async readDoclingQualityLabelFromPdf(e,t){try{let n=this.getPluginDir(),r=_.default.join(n,"tools","docling_extract.py"),s=this.settings.ocrMode==="force_low_quality"?"auto":this.settings.ocrMode,i=["--quality-only","--pdf",e,"--ocr",s];this.settings.ocrMode==="force_low_quality"&&i.push("--force-ocr-low-quality"),i.push("--quality-threshold",String(this.settings.ocrQualityThreshold)),t&&i.push("--language-hint",t);let a=await this.runPythonWithOutput(r,i),o=JSON.parse(a),c=o==null?void 0:o.confidence_proxy;if(typeof c=="number")return c.toFixed(2)}catch(n){console.warn("Failed to read Docling quality from PDF",n)}return null}async promptDocId(){return new Promise(e=>{new B(this.app,"Rebuild Zotero note from cache","Enter Zotero doc_id (e.g., ABC123)",t=>e(t),"Doc ID cannot be empty.").open()})}async promptLanguageHint(){return new Promise(e=>{new W(this.app,e).open()})}async confirmOverwrite(e){return new Promise(t=>{new V(this.app,e,t).open()})}async resolveLanguageHint(e,t){let n=typeof e.language=="string"?e.language:"",r=this.normalizeZoteroLanguage(n);if(r)return r;let s=await this.promptLanguageHint();if(s===null)return console.info("Language selection canceled."),null;let i=this.normalizeZoteroLanguage(s);if(!i)return console.info("Language selection empty; skipping Zotero update."),"";if(e.language=i,console.info("Language selected",{language:i,itemKey:t}),t)try{await this.updateZoteroItemLanguage(t,e,i),new l.Notice("Saved language to Zotero.")}catch(a){new l.Notice("Failed to write language back to Zotero."),console.error(a)}else console.warn("Language selected but itemKey is missing; skipping Zotero update.");return i}normalizeZoteroLanguage(e){return(e||"").trim().toLowerCase()}buildDoclingLanguageHint(e){let t=this.normalizeZoteroLanguage(e!=null?e:"");if(!t)return null;let n=t.split(/[^a-z]+/).filter(Boolean),r=n.some(i=>["de","deu","ger","german"].includes(i)),s=n.some(i=>["en","eng","english"].includes(i));return r&&s?"deu+eng":r?"deu":s?"eng":n.length===1&&Y[n[0]]?Y[n[0]]:t}async fetchZoteroItem(e){try{let t=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}`),n=await this.requestLocalApi(t,`Zotero item fetch failed for ${t}`);return JSON.parse(n.toString("utf8"))}catch(t){return console.warn("Failed to fetch Zotero item from local API",t),this.canUseWebApi()?this.fetchZoteroItemWeb(e):null}}async fetchZoteroItemWeb(e){try{let t=this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/items/${e}`),n=await this.requestWebApi(t,`Zotero Web API fetch failed for ${t}`);return JSON.parse(n.toString("utf8"))}catch(t){return console.warn("Failed to fetch Zotero item from Web API",t),null}}async searchZoteroItemsWeb(e){let t=new URLSearchParams;t.set("itemType","-attachment"),t.set("limit","25"),t.set("include","data,meta"),e.trim()&&t.set("q",e.trim());let n=this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/items?${t.toString()}`),r=await this.requestWebApi(n,`Zotero Web API search failed for ${n}`),s=JSON.parse(r.toString("utf8"));return Array.isArray(s)?s.map(i=>{var a,o,c,d;return{key:(o=i.key)!=null?o:(a=i.data)==null?void 0:a.key,data:(c=i.data)!=null?c:{},meta:(d=i.meta)!=null?d:{}}}).filter(i=>typeof i.key=="string"&&i.key.trim().length>0):[]}async updateZoteroItemLanguage(e,t,n){try{await this.updateZoteroItemLanguageLocal(e,t,n);return}catch(r){if(!this.canUseWebApi())throw r;let s=r instanceof Error?r.message:String(r);console.info("Local Zotero write failed; trying Web API",{itemKey:e,reason:s}),await this.updateZoteroItemLanguageWeb(e,t,n)}}async updateZoteroItemLanguageLocal(e,t,n){var C,v,b,L,S,A;let r=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}`),s={...t,language:n},i={"Content-Type":"application/json","Zotero-API-Version":"3"},a=typeof s.version=="number"?s.version:Number(s.version);Number.isNaN(a)||(i["If-Unmodified-Since-Version"]=String(a)),console.info("Zotero language PUT",{url:r,itemKey:e,language:n});try{let h=await this.requestLocalApiWithBody(r,"PUT",s,i,`Zotero update failed for ${r}`);console.info("Zotero language PUT response",{status:h.statusCode})}catch(h){if(!(h instanceof Error?h.message:String(h)).includes("status 501"))throw h;let f=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items`);console.info("Zotero language PUT unsupported; trying POST",{postUrl:f});let O=await this.requestLocalApiWithBody(f,"POST",[s],i,`Zotero update failed for ${f}`);console.info("Zotero language POST response",{status:O.statusCode})}let o=await this.fetchZoteroItem(e);if(this.normalizeZoteroLanguage(typeof((C=o==null?void 0:o.data)==null?void 0:C.language)=="string"?o.data.language:"")===this.normalizeZoteroLanguage(n))return;let d={...(v=o==null?void 0:o.data)!=null?v:t,language:n},g={key:e,version:(S=(L=(b=o==null?void 0:o.data)==null?void 0:b.version)!=null?L:o==null?void 0:o.version)!=null?S:a,data:d},m={...i},u=typeof g.version=="number"?g.version:Number(g.version);Number.isNaN(u)?delete m["If-Unmodified-Since-Version"]:m["If-Unmodified-Since-Version"]=String(u);let y=await this.requestLocalApiWithBody(r,"PUT",g,m,`Zotero update failed for ${r}`);console.info("Zotero language PUT retry response",{status:y.statusCode});let w=await this.fetchZoteroItem(e);if(this.normalizeZoteroLanguage(typeof((A=w==null?void 0:w.data)==null?void 0:A.language)=="string"?w.data.language:"")!==this.normalizeZoteroLanguage(n))throw new Error("Language update did not persist in Zotero.")}async updateZoteroItemLanguageWeb(e,t,n){var y,w,k,C,v;let r=this.getWebApiLibraryPath();if(!r)throw new Error("Web API library path is not configured.");let s=this.buildWebApiUrl(`/${r}/items/${e}`),i=await this.fetchZoteroItemWeb(e),a={...(y=i==null?void 0:i.data)!=null?y:t,language:n},o={"Content-Type":"application/json","Zotero-API-Version":"3","Zotero-API-Key":this.settings.webApiKey},c=(C=(k=(w=i==null?void 0:i.data)==null?void 0:w.version)!=null?k:i==null?void 0:i.version)!=null?C:t==null?void 0:t.version,d=typeof c=="number"?c:Number(c);Number.isNaN(d)||(o["If-Unmodified-Since-Version"]=String(d)),console.info("Zotero Web API language PUT",{url:s,itemKey:e,language:n});let g=await this.requestWebApiWithBody(s,"PUT",a,o,`Zotero Web API update failed for ${s}`);console.info("Zotero Web API language PUT response",{status:g.statusCode});let m=await this.fetchZoteroItemWeb(e);if(this.normalizeZoteroLanguage(typeof((v=m==null?void 0:m.data)==null?void 0:v.language)=="string"?m.data.language:"")!==this.normalizeZoteroLanguage(n))throw new Error("Language update did not persist in Zotero Web API.")}getDocId(e){let t=[e.key,e.itemKey,e.id,e.citationKey];for(let n of t)if(typeof n=="string"&&n.trim())return n.trim();return null}sanitizeFileName(e){let t=e.replace(/[\\/:*?"<>|]/g,"").replace(/\s+/g," ").trim();return t?t.replace(/[.]+$/g,"").trim().slice(0,120):""}registerNoteRenameHandler(){this.registerEvent(this.app.vault.on("rename",async e=>{if(!(!(e instanceof l.TFile)||e.extension!=="md"))try{let t=await this.app.vault.read(e),n=this.extractDocIdFromFrontmatter(t);if(!n)return;await this.updateDocIndex({doc_id:n,note_path:e.path,note_title:_.default.basename(e.path,".md")})}catch(t){console.warn("Failed to update doc index for renamed note",t)}}))}async resolveNotePathForDocId(e){if(!e)return null;let t=this.app.vault.adapter,n=await this.getDocIndexEntry(e);if(n!=null&&n.note_path&&await t.exists(n.note_path))return n.note_path;let s=(await this.scanNotesForDocIds(this.settings.outputNoteDir))[e];return s!=null&&s.note_path?(await this.updateDocIndex({doc_id:e,note_path:s.note_path,note_title:s.note_title}),s.note_path):null}async resolveUniqueBaseName(e,t){let n=this.app.vault.adapter,r=(0,l.normalizePath)(`${this.settings.outputNoteDir}/${e}.md`),s=(0,l.normalizePath)(`${this.settings.outputPdfDir}/${e}.pdf`),i=await n.exists(r),a=this.settings.copyPdfToVault?await n.exists(s):!1;return i||a?`${e}-${t}`:e}async searchZoteroItems(e){let t=new URLSearchParams;t.set("itemType","-attachment"),t.set("limit","25"),t.set("include","data,meta"),e.trim()&&t.set("q",e.trim());let n=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items?${t.toString()}`);try{let r=await this.requestLocalApi(n,`Zotero search failed for ${n}`),s=JSON.parse(r.toString("utf8"));return Array.isArray(s)?s.map(i=>{var a,o,c,d;return{key:(o=i.key)!=null?o:(a=i.data)==null?void 0:a.key,data:(c=i.data)!=null?c:{},meta:(d=i.meta)!=null?d:{}}}).filter(i=>typeof i.key=="string"&&i.key.trim().length>0):[]}catch(r){if(console.warn("Failed to search Zotero via local API",r),!this.canUseWebApi())throw r;return this.searchZoteroItemsWeb(e)}}async resolvePdfAttachment(e,t){let n=this.pickPdfAttachment(e);if(n)return n;try{let r=await this.fetchZoteroChildren(t);for(let s of r){let i=this.toPdfAttachment(s);if(i)return i}}catch(r){console.error("Failed to fetch Zotero children",r)}return null}pickPdfAttachment(e){var n,r,s;let t=(s=(r=(n=e.attachments)!=null?n:e.children)!=null?r:e.items)!=null?s:[];if(!Array.isArray(t))return null;for(let i of t){let a=this.toPdfAttachment(i);if(a)return a}return null}toPdfAttachment(e){var s,i,a,o,c,d;if(((a=(s=e==null?void 0:e.contentType)!=null?s:e==null?void 0:e.mimeType)!=null?a:(i=e==null?void 0:e.data)==null?void 0:i.contentType)!=="application/pdf")return null;let n=(d=(o=e==null?void 0:e.key)!=null?o:e==null?void 0:e.attachmentKey)!=null?d:(c=e==null?void 0:e.data)==null?void 0:c.key;if(!n)return null;let r=this.extractAttachmentPath(e);return r?{key:n,filePath:r}:{key:n}}extractAttachmentPath(e){var n,r,s,i,a,o,c,d;let t=(d=(i=(r=(n=e==null?void 0:e.links)==null?void 0:n.enclosure)==null?void 0:r.href)!=null?i:(s=e==null?void 0:e.enclosure)==null?void 0:s.href)!=null?d:(c=(o=(a=e==null?void 0:e.data)==null?void 0:a.links)==null?void 0:o.enclosure)==null?void 0:c.href;if(typeof t=="string"&&t.startsWith("file://"))try{return(0,N.fileURLToPath)(t)}catch(g){return null}return null}async fetchZoteroChildren(e){let t=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}/children`);try{let n=await this.requestLocalApi(t,`Zotero children request failed for ${t}`);return JSON.parse(n.toString("utf8"))}catch(n){if(console.warn("Failed to fetch Zotero children from local API",n),!this.canUseWebApi())throw n;let r=this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/items/${e}/children`),s=await this.requestWebApi(r,`Zotero Web API children request failed for ${r}`);return JSON.parse(s.toString("utf8"))}}async downloadZoteroPdf(e){let t=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}/file`);try{let n=await this.requestLocalApiRaw(t),r=await this.followFileRedirect(n);if(r)return r;if(n.statusCode>=300)throw new Error(`Request failed, status ${n.statusCode}`);return n.body}catch(n){if(console.warn("Failed to download PDF from local API",n),!this.canUseWebApi())throw n;let r=this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/items/${e}/file`),s=await this.requestWebApiRaw(r),i=await this.followFileRedirect(s);if(i)return i;if(s.statusCode>=300)throw new Error(`Web API request failed, status ${s.statusCode}`);return s.body}}buildZoteroUrl(e){return`${this.settings.zoteroBaseUrl.replace(/\/$/,"")}${e}`}canUseWebApi(){return!!((this.settings.webApiBaseUrl||"").trim()&&this.settings.webApiKey&&this.settings.webApiLibraryId)}getWebApiLibraryPath(){let e=(this.settings.webApiLibraryId||"").trim();return e?`${this.settings.webApiLibraryType==="group"?"groups":"users"}/${e}`:""}buildWebApiUrl(e){return`${this.settings.webApiBaseUrl.replace(/\/$/,"")}${e}`}requestLocalApiRaw(e,t={}){return new Promise((n,r)=>{var g,m;let s=new URL(e),i=s.protocol==="https:"?ee.default:X.default,a=(g=t.method)!=null?g:"GET",o={Accept:"*/*",...(m=t.headers)!=null?m:{}},c=t.body;if(c!==void 0&&o["Content-Length"]===void 0){let u=Buffer.isBuffer(c)?c.length:Buffer.byteLength(c);o["Content-Length"]=String(u)}let d=i.request({method:a,hostname:s.hostname,port:s.port||void 0,path:`${s.pathname}${s.search}`,headers:o},u=>{let y=[];u.on("data",w=>y.push(Buffer.from(w))),u.on("end",()=>{var k;let w=Buffer.concat(y);n({statusCode:(k=u.statusCode)!=null?k:0,headers:u.headers,body:w})})});d.on("error",r),c!==void 0&&d.write(c),d.end()})}async requestLocalApi(e,t){let n=await this.requestLocalApiRaw(e);if(n.statusCode>=400){let r=n.body.toString("utf8");throw new Error(`${t!=null?t:"Request failed"}, status ${n.statusCode}: ${r||"no response body"}`)}if(n.statusCode>=300)throw new Error(`${t!=null?t:"Request failed"}, status ${n.statusCode}`);return n.body}async requestLocalApiWithBody(e,t,n,r,s){let i=JSON.stringify(n),a=await this.requestLocalApiRaw(e,{method:t,headers:r,body:i});if(a.statusCode>=400){let o=a.body.toString("utf8");throw new Error(`${s!=null?s:"Request failed"}, status ${a.statusCode}: ${o||"no response body"}`)}if(a.statusCode>=300)throw new Error(`${s!=null?s:"Request failed"}, status ${a.statusCode}`);return{statusCode:a.statusCode,body:a.body}}async requestWebApi(e,t){let n={"Zotero-API-Version":"3","Zotero-API-Key":this.settings.webApiKey},r=await this.requestLocalApiRaw(e,{headers:n});if(r.statusCode>=400){let s=r.body.toString("utf8");throw new Error(`${t!=null?t:"Request failed"}, status ${r.statusCode}: ${s||"no response body"}`)}if(r.statusCode>=300)throw new Error(`${t!=null?t:"Request failed"}, status ${r.statusCode}`);return r.body}requestWebApiRaw(e,t={}){var r;let n={"Zotero-API-Version":"3","Zotero-API-Key":this.settings.webApiKey,...(r=t.headers)!=null?r:{}};return this.requestLocalApiRaw(e,{...t,headers:n})}async requestWebApiWithBody(e,t,n,r,s){let i=JSON.stringify(n),a=await this.requestLocalApiRaw(e,{method:t,headers:r,body:i});if(a.statusCode>=400){let o=a.body.toString("utf8");throw new Error(`${s!=null?s:"Request failed"}, status ${a.statusCode}: ${o||"no response body"}`)}if(a.statusCode>=300)throw new Error(`${s!=null?s:"Request failed"}, status ${a.statusCode}`);return{statusCode:a.statusCode,body:a.body}}async followFileRedirect(e){if(e.statusCode<300||e.statusCode>=400)return null;let t=e.headers.location,n=Array.isArray(t)?t[0]:t;if(!n||typeof n!="string")return null;if(n.startsWith("file://")){let r=(0,N.fileURLToPath)(n);return I.promises.readFile(r)}return n.startsWith("http://")||n.startsWith("https://")?this.requestLocalApi(n):null}bufferToArrayBuffer(e){return e.buffer.slice(e.byteOffset,e.byteOffset+e.byteLength)}buildPdfLinkFromSourcePath(e){if(!e)return"";let t=_.default.normalize(this.getVaultBasePath()),n=_.default.normalize(e),r=t.endsWith(_.default.sep)?t:`${t}${_.default.sep}`;return n.startsWith(r)?`[[${(0,l.normalizePath)(_.default.relative(t,n))}]]`:`[PDF](${(0,N.pathToFileURL)(e).toString()})`}toVaultRelativePath(e){if(!e)return"";let t=_.default.normalize(this.getVaultBasePath()),n=_.default.normalize(e),r=t.endsWith(_.default.sep)?t:`${t}${_.default.sep}`;return n.startsWith(r)?(0,l.normalizePath)(_.default.relative(t,n)):""}buildPdfLinkForNote(e,t,n){return!e&&!t?"":!this.settings.copyPdfToVault&&t?`[PDF](${this.buildZoteroDeepLink(n!=null?n:"",t)})`:this.buildPdfLinkFromSourcePath(e)}async openNoteInMain(e){let t=(0,l.normalizePath)(e);await this.app.workspace.openLinkText(t,"","tab")}async openPdfInMain(e,t){if(!e)return!1;let n=_.default.normalize(this.getVaultBasePath()),r=_.default.normalize(e),s=n.endsWith(_.default.sep)?n:`${n}${_.default.sep}`;if(r.startsWith(s)){let i=(0,l.normalizePath)(_.default.relative(n,r)),a=t?`#page=${t}`:"";return await this.app.workspace.openLinkText(`${i}${a}`,"","tab"),!0}try{return window.open((0,N.pathToFileURL)(e).toString()),!0}catch(i){return!1}}openExternalUrl(e){e&&window.open(e)}buildZoteroDeepLink(e,t,n){if(t){let r=n?`?page=${encodeURIComponent(n)}`:"";return`zotero://open-pdf/library/items/${t}${r}`}return`zotero://select/library/items/${e}`}formatCitationsMarkdown(e){return e.length?e.map(n=>this.formatCitationMarkdown(n)).filter(Boolean).join(`
`):""}formatCitationMarkdown(e){var i,a;let t=e.doc_id||"?",n=e.pages||`${(i=e.page_start)!=null?i:"?"}-${(a=e.page_end)!=null?a:"?"}`,r=`${t} pages ${n}`,s=e.source_pdf||"";if(s){let o=this.buildPdfLinkFromSourcePath(s);if(o.startsWith("[["))return`- [[${o.slice(2,-2)}|${r}]]`;let c=o.match(/^\[PDF\]\((.+)\)$/);if(c)return`- [${r}](${c[1]})`}return`- ${r}`}generateChatId(){return typeof crypto!="undefined"&&"randomUUID"in crypto?crypto.randomUUID():`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}getDocIndexPath(){return(0,l.normalizePath)(`${R}/doc_index.json`)}async getDocIndex(){return this.docIndex?this.docIndex:(this.docIndex=await this.loadDocIndexFromDisk(),this.docIndex)}async loadDocIndexFromDisk(){var n;let e=this.app.vault.adapter,t=this.getDocIndexPath();if(!await e.exists(t))return{};try{let r=await e.read(t),s=JSON.parse(r);if(s&&typeof s=="object"){let i=(n=s.entries)!=null?n:s;if(Array.isArray(i)){let a={};for(let o of i)o!=null&&o.doc_id&&(a[String(o.doc_id)]=o);return a}if(i&&typeof i=="object")return i}}catch(r){console.error("Failed to read doc index",r)}return{}}async saveDocIndex(e){await this.ensureFolder(R);let t=this.app.vault.adapter,n=this.getDocIndexPath(),r={version:1,entries:e};await t.write(n,JSON.stringify(r,null,2)),this.docIndex=e}async updateDocIndex(e){var s;let t=await this.getDocIndex(),n=(s=t[e.doc_id])!=null?s:{doc_id:e.doc_id},r={...n,...e,doc_id:e.doc_id,updated_at:new Date().toISOString()};e.note_path===void 0&&n.note_path&&(r.note_path=n.note_path),e.note_title===void 0&&n.note_title&&(r.note_title=n.note_title),e.zotero_title===void 0&&n.zotero_title&&(r.zotero_title=n.zotero_title),e.pdf_path===void 0&&n.pdf_path&&(r.pdf_path=n.pdf_path),e.attachment_key===void 0&&n.attachment_key&&(r.attachment_key=n.attachment_key),t[e.doc_id]=r,await this.saveDocIndex(t)}async hydrateDocIndexFromCache(e){var a,o;if(!e)return null;let t=this.app.vault.adapter,n=await this.getDocIndexEntry(e),r={},s=(0,l.normalizePath)(`${E}/${e}.json`);if(await t.exists(s))try{let c=await t.read(s),d=JSON.parse(c),g=(o=(a=d==null?void 0:d.data)!=null?a:d)!=null?o:{},m=typeof g.title=="string"?g.title:"";if(m&&(r.zotero_title=m),!r.note_title||!r.note_path){let u=this.sanitizeFileName(m)||e,y=(0,l.normalizePath)(`${this.settings.outputNoteDir}/${u}.md`),w=(0,l.normalizePath)(`${this.settings.outputNoteDir}/${u}-${e}.md`),k="";await t.exists(y)?k=y:await t.exists(w)&&(k=w),k&&(r.note_path=k,r.note_title=_.default.basename(k,".md"))}}catch(c){console.error("Failed to read cached item JSON",c)}!r.note_title&&(n!=null&&n.note_path)&&(r.note_title=_.default.basename(n.note_path,".md"));let i=(0,l.normalizePath)(`${T}/${e}.json`);if(await t.exists(i))try{let c=await t.read(i),d=JSON.parse(c);typeof(d==null?void 0:d.source_pdf)=="string"&&(r.pdf_path=d.source_pdf)}catch(c){console.error("Failed to read cached chunks JSON",c)}return Object.keys(r).length>0&&await this.updateDocIndex({doc_id:e,...r}),this.getDocIndexEntry(e)}async getDocIndexEntry(e){var n;return e&&(n=(await this.getDocIndex())[e])!=null?n:null}async inferNotePathFromCache(e){var r,s;let t=this.app.vault.adapter,n=(0,l.normalizePath)(`${E}/${e}.json`);if(!await t.exists(n))return"";try{let i=await t.read(n),a=JSON.parse(i),o=(s=(r=a==null?void 0:a.data)!=null?r:a)!=null?s:{},c=typeof o.title=="string"?o.title:"",d=this.sanitizeFileName(c)||e,g=(0,l.normalizePath)(`${this.settings.outputNoteDir}/${d}.md`),m=(0,l.normalizePath)(`${this.settings.outputNoteDir}/${d}-${e}.md`);if(await t.exists(g))return g;if(await t.exists(m))return m}catch(i){console.error("Failed to infer note path from cache",i)}return""}async rebuildNoteFromCacheForDocId(e,t){var L,S,A;try{await this.ensureBundledTools()}catch(h){return t&&new l.Notice("Failed to sync bundled tools. See console for details."),console.error(h),!1}let n=this.app.vault.adapter,r=(0,l.normalizePath)(`${E}/${e}.json`),s=(0,l.normalizePath)(`${T}/${e}.json`);if(!await n.exists(r)||!await n.exists(s))return t&&new l.Notice("Cached item or chunks JSON not found."),!1;this.showStatusProgress("Preparing...",5);let i;try{let h=await n.read(r);i=JSON.parse(h)}catch(h){return t&&new l.Notice("Failed to read cached item JSON."),console.error(h),this.clearStatusProgress(),!1}let a;try{let h=await n.read(s);a=JSON.parse(h)}catch(h){return t&&new l.Notice("Failed to read cached chunks JSON."),console.error(h),this.clearStatusProgress(),!1}let o=typeof a.source_pdf=="string"?a.source_pdf:"";if(!o)return t&&new l.Notice("Cached chunk JSON is missing source_pdf."),this.clearStatusProgress(),!1;try{await I.promises.access(o)}catch(h){return t&&new l.Notice("Cached source PDF path is not accessible."),console.error(h),this.clearStatusProgress(),!1}let c=(L=i.data)!=null?L:i,d=typeof c.title=="string"?c.title:"",g=await this.resolveLanguageHint(c,(S=i.key)!=null?S:c.key),m=this.buildDoclingLanguageHint(g!=null?g:void 0),u="",y=await this.getDocIndexEntry(e);if(y!=null&&y.note_path&&await n.exists(y.note_path)&&(u=(0,l.normalizePath)(y.note_path)),!u){let h=this.sanitizeFileName(d)||e,D=(0,l.normalizePath)(`${this.settings.outputNoteDir}/${h}.md`),f=await n.exists(D)?h:await this.resolveUniqueBaseName(h,e);u=(0,l.normalizePath)(`${this.settings.outputNoteDir}/${f}.md`)}try{await this.ensureFolder(this.settings.outputNoteDir)}catch(h){return t&&new l.Notice("Failed to create notes folder."),console.error(h),this.clearStatusProgress(),!1}let w=this.getPluginDir(),k=_.default.join(w,"tools","docling_extract.py"),C=_.default.join(w,"tools","index_redisearch.py"),v=null;try{v=await this.readDoclingQualityLabelFromPdf(o,m),this.showStatusProgress(this.formatStatusLabel("Docling extraction...",v),null),await this.runPython(k,this.buildDoclingArgs(o,e,s,u,m)),v=await this.readDoclingQualityLabel(s)}catch(h){return t&&new l.Notice("Docling extraction failed. See console for details."),console.error(h),this.clearStatusProgress(),!1}try{this.showStatusProgress(this.formatStatusLabel("Indexing chunks...",v),0),await this.runPythonStreaming(C,["--chunks-json",this.getAbsoluteVaultPath(s),"--redis-url",this.settings.redisUrl,"--index",this.settings.redisIndex,"--prefix",this.settings.redisPrefix,"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--upsert","--progress"],h=>{if((h==null?void 0:h.type)==="progress"&&h.total){let D=Math.round(h.current/h.total*100),f=this.formatStatusLabel(`Indexing chunks ${h.current}/${h.total}`,v);this.showStatusProgress(f,D)}},()=>{})}catch(h){return t&&new l.Notice("RedisSearch indexing failed. See console for details."),console.error(h),this.clearStatusProgress(),!1}let b=this.buildPdfLinkForNote(o,y==null?void 0:y.attachment_key,e);try{let h=await this.app.vault.adapter.read(u),D=this.buildNoteMarkdown(c,(A=i.meta)!=null?A:{},e,b,r,h);await this.app.vault.adapter.write(u,D)}catch(h){return t&&new l.Notice("Failed to finalize note markdown."),console.error(h),this.clearStatusProgress(),!1}try{await this.updateDocIndex({doc_id:e,note_path:u,note_title:_.default.basename(u,".md"),zotero_title:d,pdf_path:o})}catch(h){console.error("Failed to update doc index",h)}return!0}getZoteroLibraryPath(){let e=(this.settings.zoteroUserId||"0").trim();return!e||e==="0"?"users/0":e.startsWith("users/")||e.startsWith("groups/")?e:`users/${e}`}async ensureFolder(e){let t=this.app.vault.adapter,n=(0,l.normalizePath)(e).split("/").filter(Boolean),r="";for(let s of n)r=r?`${r}/${s}`:s,await t.exists(r)||await t.mkdir(r)}buildNoteMarkdown(e,t,n,r,s,i){let a=`[[${s}]]`,o=this.renderFrontmatter(e,t,n,r,a);return`${o?`---
${o}
---

`:""}PDF: ${r}

Item JSON: ${a}

${i}`}renderFrontmatter(e,t,n,r,s){var o;let i=(o=this.settings.frontmatterTemplate)!=null?o:"";if(!i.trim())return"";let a=this.buildTemplateVars(e,t,n,r,s);return i.replace(/{{\s*([a-z0-9_]+)\s*}}/gi,(c,d)=>{var g;return(g=a[d])!=null?g:""}).trim()}buildTemplateVars(e,t,n,r,s){let i=typeof e.title=="string"?e.title:"",a=typeof e.shortTitle=="string"?e.shortTitle:"",o=typeof e.date=="string"?e.date:"",c=typeof(t==null?void 0:t.parsedDate)=="string"?t.parsedDate:"",d=this.extractYear(c||o),m=(Array.isArray(e.creators)?e.creators:[]).filter(b=>b.creatorType==="author").map(b=>this.formatCreatorName(b)),u=m.join("; "),y=Array.isArray(e.tags)?e.tags.map(b=>typeof b=="string"?b:b==null?void 0:b.tag).filter(Boolean):[],w=y.join("; "),k=typeof e.itemType=="string"?e.itemType:"",C=typeof(t==null?void 0:t.creatorSummary)=="string"?t.creatorSummary:"",v={doc_id:n,zotero_key:typeof e.key=="string"?e.key:n,title:i,short_title:a,date:o,year:d,authors:u,tags:w,item_type:k,creator_summary:C,pdf_link:this.escapeYamlString(r),item_json:this.escapeYamlString(s)};for(let[b,L]of Object.entries(v))v[`${b}_yaml`]=this.escapeYamlString(L);return v.authors_yaml=this.toYamlList(m),v.tags_yaml=this.toYamlList(y),v}extractYear(e){if(!e)return"";let t=e.match(/\b(\d{4})\b/);return t?t[1]:""}formatCreatorName(e){if(!e||typeof e!="object")return"";if(e.name)return String(e.name);let t=e.firstName?String(e.firstName):"",n=e.lastName?String(e.lastName):"";return[n,t].filter(Boolean).join(", ")||`${t} ${n}`.trim()}escapeYamlString(e){return`"${String(e).replace(/\\/g,"\\\\").replace(/"/g,'\\"')}"`}toYamlList(e){return e.length?e.map(t=>`  - ${this.escapeYamlString(t)}`).join(`
`):'  - ""'}getVaultBasePath(){var n;let e=this.app.vault.adapter;if(e instanceof l.FileSystemAdapter)return e.getBasePath();let t=(n=e.getBasePath)==null?void 0:n.call(e);if(t)return t;throw new Error("Vault base path is unavailable.")}getPluginDir(){var r;let e=this.getVaultBasePath(),t=(r=this.manifest.dir)!=null?r:this.manifest.id;if(!t)throw new Error("Plugin directory is unavailable.");let n=_.default.isAbsolute(t)?t:_.default.join(e,t);return _.default.normalize(n)}async ensureBundledTools(){let e=this.getPluginDir(),t=_.default.join(e,"tools");await I.promises.mkdir(t,{recursive:!0});for(let[n,r]of Object.entries(Q)){let s=_.default.join(t,n),i=!0;try{await I.promises.readFile(s,"utf8")===r&&(i=!1)}catch(a){}i&&await I.promises.writeFile(s,r,"utf8")}}async migrateCachePaths(){let e="zotero/items",t="zotero/chunks",n=E,r=T,s=this.app.vault.adapter,i=(0,l.normalizePath)(e),a=(0,l.normalizePath)(t),o=(0,l.normalizePath)(n),c=(0,l.normalizePath)(r),d=o.split("/").slice(0,-1).join("/"),g=c.split("/").slice(0,-1).join("/");d&&await this.ensureFolder(d),g&&await this.ensureFolder(g);let m=await s.exists(i),u=await s.exists(a),y=await s.exists(o),w=await s.exists(c);m&&!y&&await s.rename(i,o),u&&!w&&await s.rename(a,c)}getAbsoluteVaultPath(e){let t=this.getVaultBasePath(),n=_.default.isAbsolute(e)?e:_.default.join(t,e);return _.default.normalize(n)}buildDoclingArgs(e,t,n,r,s){let i=this.settings.ocrMode==="force_low_quality"?"auto":this.settings.ocrMode,a=["--pdf",e,"--doc-id",t,"--out-json",this.getAbsoluteVaultPath(n),"--out-md",this.getAbsoluteVaultPath(r),"--chunking",this.settings.chunkingMode,"--ocr",i];return this.settings.ocrMode==="force_low_quality"&&a.push("--force-ocr-low-quality"),a.push("--quality-threshold",String(this.settings.ocrQualityThreshold)),s&&a.push("--language-hint",s),this.settings.enableLlmCleanup&&(a.push("--enable-llm-cleanup"),this.settings.llmCleanupBaseUrl&&a.push("--llm-cleanup-base-url",this.settings.llmCleanupBaseUrl),this.settings.llmCleanupApiKey&&a.push("--llm-cleanup-api-key",this.settings.llmCleanupApiKey),this.settings.llmCleanupModel&&a.push("--llm-cleanup-model",this.settings.llmCleanupModel),a.push("--llm-cleanup-temperature",String(this.settings.llmCleanupTemperature)),a.push("--llm-cleanup-min-quality",String(this.settings.llmCleanupMinQuality)),a.push("--llm-cleanup-max-chars",String(this.settings.llmCleanupMaxChars))),a}getRedisDataDir(){return _.default.join(this.getVaultBasePath(),R,"redis-data")}getDockerComposePath(){let e=this.getPluginDir();return _.default.join(e,"tools","docker-compose.yml")}async startRedisStack(e){var t;try{await this.ensureBundledTools();let n=this.getDockerComposePath(),r=this.getRedisDataDir();await I.promises.mkdir(r,{recursive:!0});let s=((t=this.settings.dockerPath)==null?void 0:t.trim())||"docker";try{await this.runCommand(s,["compose","-f",n,"down"],{cwd:_.default.dirname(n)})}catch(i){console.warn("Redis Stack stop before restart failed",i)}await this.runCommand(s,["compose","-f",n,"up","-d"],{cwd:_.default.dirname(n),env:{...process.env,ZRR_DATA_DIR:r}}),e||new l.Notice("Redis Stack started.")}catch(n){e||new l.Notice("Failed to start Redis Stack. Check Docker Desktop and File Sharing."),console.error("Failed to start Redis Stack",n)}}runPython(e,t){return new Promise((n,r)=>{let s=(0,z.spawn)(this.settings.pythonPath,[e,...t],{cwd:_.default.dirname(e)}),i="";s.stderr.on("data",a=>{i+=a.toString()}),s.on("close",a=>{a===0?n():r(new Error(i||`Process exited with code ${a}`))})})}runCommand(e,t,n){return new Promise((r,s)=>{let i=(0,z.spawn)(e,t,{cwd:n==null?void 0:n.cwd,env:n==null?void 0:n.env}),a="";i.stderr.on("data",o=>{a+=o.toString()}),i.on("close",o=>{o===0?r():s(new Error(a||`Process exited with code ${o}`))})})}runPythonStreaming(e,t,n,r){return new Promise((s,i)=>{let a=(0,z.spawn)(this.settings.pythonPath,[e,...t],{cwd:_.default.dirname(e)}),o="",c="",d=null,g=!1,m=u=>{if(u.trim())try{let y=JSON.parse(u);d=y,((y==null?void 0:y.type)==="final"||y!=null&&y.answer)&&(g=!0),n(y)}catch(y){}};a.stdout.on("data",u=>{var w;o+=u.toString();let y=o.split(/\r?\n/);o=(w=y.pop())!=null?w:"";for(let k of y)m(k)}),a.stderr.on("data",u=>{c+=u.toString()}),a.on("close",u=>{o.trim()&&m(o),!g&&d&&r(d),u===0?s():i(new Error(c||`Process exited with code ${u}`))})})}runPythonWithOutput(e,t){return new Promise((n,r)=>{let s=(0,z.spawn)(this.settings.pythonPath,[e,...t],{cwd:_.default.dirname(e)}),i="",a="";s.stdout.on("data",o=>{i+=o.toString()}),s.stderr.on("data",o=>{a+=o.toString()}),s.on("close",o=>{o===0?n(i.trim()):r(new Error(a||`Process exited with code ${o}`))})})}},G=class extends l.SuggestModal{constructor(e,t,n){super(e);this.lastError=null;this.indexedDocIds=null;this.plugin=t,this.resolveSelection=n,this.setPlaceholder("Search Zotero items...")}async getSuggestions(e){try{if(!this.indexedDocIds){let t=await this.plugin.getDocIndex();this.indexedDocIds=new Set(Object.keys(t))}return await this.plugin.searchZoteroItems(e)}catch(t){let n=t instanceof Error?t.message:String(t);return this.lastError!==n&&(this.lastError=n,new l.Notice(n)),console.error("Zotero search failed",t),[]}}renderSuggestion(e,t){var g,m,u;let n=(m=(g=e.data)==null?void 0:g.title)!=null?m:"[No title]",r=this.extractYear(e),s=this.getDocId(e),i=s?(u=this.indexedDocIds)==null?void 0:u.has(s):!1,a=this.getPdfStatus(e);i&&t.addClass("zrr-indexed-item"),a==="no"&&t.addClass("zrr-no-pdf-item"),t.createEl("div",{text:n});let o=t.createEl("small"),c=!1,d=()=>{c&&o.createSpan({text:" \u2022 "})};r&&(o.createSpan({text:r}),c=!0),i&&(d(),o.createSpan({text:"Indexed",cls:"zrr-indexed-flag"}),c=!0),a==="no"&&(d(),o.createSpan({text:"No PDF",cls:"zrr-no-pdf-flag"}),c=!0),t.addEventListener("click",()=>{this.resolveSelection&&(this.resolveSelection(e),this.resolveSelection=null),this.close()})}onChooseSuggestion(e,t){this.resolveSelection&&(this.resolveSelection(e),this.resolveSelection=null),this.close()}onClose(){this.resolveSelection&&(this.resolveSelection(null),this.resolveSelection=null)}getDocId(e){var n,r,s;let t=(s=(r=e.key)!=null?r:(n=e.data)==null?void 0:n.key)!=null?s:"";return typeof t=="string"?t:""}getPdfStatus(e){var r,s,i,a,o,c,d;let t=(c=(o=(i=(r=e.data)==null?void 0:r.attachments)!=null?i:(s=e.data)==null?void 0:s.children)!=null?o:(a=e.data)==null?void 0:a.items)!=null?c:[];if(Array.isArray(t)&&t.length>0)return t.some(m=>this.isPdfAttachment(m))?"yes":"no";let n=(d=e.meta)==null?void 0:d.numChildren;return typeof n=="number"&&n===0?"no":"unknown"}isPdfAttachment(e){var n,r,s,i,a,o;return((o=(a=(s=(n=e==null?void 0:e.contentType)!=null?n:e==null?void 0:e.mimeType)!=null?s:(r=e==null?void 0:e.data)==null?void 0:r.contentType)!=null?a:(i=e==null?void 0:e.data)==null?void 0:i.mimeType)!=null?o:"")==="application/pdf"}extractYear(e){var r,s,i,a;let t=(a=(i=(r=e.meta)==null?void 0:r.parsedDate)!=null?i:(s=e.data)==null?void 0:s.date)!=null?a:"";if(typeof t!="string")return"";let n=t.match(/\b(\d{4})\b/);return n?n[1]:""}};
