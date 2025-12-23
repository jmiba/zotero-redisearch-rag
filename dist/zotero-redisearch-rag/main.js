"use strict";var ae=Object.create;var Z=Object.defineProperty;var oe=Object.getOwnPropertyDescriptor;var ce=Object.getOwnPropertyNames;var le=Object.getPrototypeOf,de=Object.prototype.hasOwnProperty;var pe=(P,p)=>{for(var e in p)Z(P,e,{get:p[e],enumerable:!0})},Y=(P,p,e,t)=>{if(p&&typeof p=="object"||typeof p=="function")for(let n of ce(p))!de.call(P,n)&&n!==e&&Z(P,n,{get:()=>p[n],enumerable:!(t=oe(p,n))||t.enumerable});return P};var V=(P,p,e)=>(e=P!=null?ae(le(P)):{},Y(p||!P||!P.__esModule?Z(e,"default",{value:P,enumerable:!0}):e,P)),ue=P=>Y(Z({},"__esModule",{value:!0}),P);var me={};pe(me,{default:()=>U});module.exports=ue(me);var d=require("obsidian"),M=require("child_process"),O=require("fs"),se=V(require("http")),re=V(require("https")),y=V(require("path")),z=require("url"),ie=require("crypto");var x=require("obsidian"),R=".zotero-redisearch-rag",N=`${R}/items`,T=`${R}/chunks`,X={zoteroBaseUrl:"http://127.0.0.1:23119/api",zoteroUserId:"0",webApiBaseUrl:"https://api.zotero.org",webApiLibraryType:"user",webApiLibraryId:"",webApiKey:"",pythonPath:"python3",dockerPath:"docker",autoStartRedis:!1,copyPdfToVault:!0,frontmatterTemplate:`doc_id: {{doc_id}}
zotero_key: {{zotero_key}}
title: {{title_yaml}}
year: {{year}}
authors:
{{authors_yaml}}
item_type: {{item_type}}
pdf_link: {{pdf_link}}
item_json: {{item_json}}`,outputPdfDir:"zotero/pdfs",outputNoteDir:"zotero/notes",chatOutputDir:"zotero/chats",chatPaneLocation:"right",redisUrl:"redis://127.0.0.1:6379",redisIndex:"idx:zotero",redisPrefix:"zotero:chunk:",embedBaseUrl:"http://localhost:1234/v1",embedApiKey:"lm-studio",embedModel:"google/embedding-gemma-300m",chatBaseUrl:"http://127.0.0.1:1234/v1",chatApiKey:"",chatModel:"openai/gpt-oss-20b",chatTemperature:.2,chatHistoryMessages:6,ocrMode:"auto",chunkingMode:"page",maxChunkChars:4e3,chunkOverlapChars:250,removeImagePlaceholders:!0,ocrQualityThreshold:.5,enableLlmCleanup:!1,llmCleanupBaseUrl:"http://127.0.0.1:1234/v1",llmCleanupApiKey:"",llmCleanupModel:"openai/gpt-oss-20b",llmCleanupTemperature:0,llmCleanupMinQuality:.35,llmCleanupMaxChars:2e3},B=class extends x.PluginSettingTab{constructor(p,e){super(p,e),this.plugin=e}display(){let{containerEl:p}=this;p.empty(),p.createEl("h2",{text:"Zotero RAG Settings"}),new x.Setting(p).setName("Zotero base URL").setDesc("Local Zotero API base URL, e.g. http://127.0.0.1:23119/api").addText(e=>e.setPlaceholder("http://127.0.0.1:23119/api").setValue(this.plugin.settings.zoteroBaseUrl).onChange(async t=>{this.plugin.settings.zoteroBaseUrl=t.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Zotero user ID").setDesc("Use 0 for local library. You can also enter users/<id> or groups/<id>.").addText(e=>e.setPlaceholder("123456").setValue(this.plugin.settings.zoteroUserId).onChange(async t=>{this.plugin.settings.zoteroUserId=t.trim(),await this.plugin.saveSettings()})),p.createEl("h3",{text:"Zotero Web API (optional fallback)"}),new x.Setting(p).setName("Web API base URL").setDesc("Zotero Web API base URL for write fallback, e.g. https://api.zotero.org").addText(e=>e.setPlaceholder("https://api.zotero.org").setValue(this.plugin.settings.webApiBaseUrl).onChange(async t=>{this.plugin.settings.webApiBaseUrl=t.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Web API library type").setDesc("Library type for Web API writes.").addDropdown(e=>e.addOption("user","user").addOption("group","group").setValue(this.plugin.settings.webApiLibraryType).onChange(async t=>{this.plugin.settings.webApiLibraryType=t,await this.plugin.saveSettings()})),new x.Setting(p).setName("Web API library ID").setDesc("Numeric Zotero user/group ID for Web API writes.").addText(e=>e.setPlaceholder("15218").setValue(this.plugin.settings.webApiLibraryId).onChange(async t=>{this.plugin.settings.webApiLibraryId=t.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Web API key").setDesc("Zotero API key for write fallback (from zotero.org).").addText(e=>e.setPlaceholder("your-api-key").setValue(this.plugin.settings.webApiKey).onChange(async t=>{this.plugin.settings.webApiKey=t.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Python path").setDesc("Path to python3").addText(e=>e.setPlaceholder("python3").setValue(this.plugin.settings.pythonPath).onChange(async t=>{this.plugin.settings.pythonPath=t.trim()||"python3",await this.plugin.saveSettings()})),new x.Setting(p).setName("Copy PDFs into vault").setDesc("Disable to use Zotero storage paths directly. If a local file path is unavailable, the plugin temporarily copies the PDF into the vault for processing.").addToggle(e=>e.setValue(this.plugin.settings.copyPdfToVault).onChange(async t=>{this.plugin.settings.copyPdfToVault=t,await this.plugin.saveSettings()})),new x.Setting(p).setName("Frontmatter template").setDesc("Use {{doc_id}}, {{zotero_key}}, {{title}}, {{title_yaml}}, {{year}}, {{date}}, {{authors}}, {{authors_yaml}}, {{tags}}, {{item_type}}, {{pdf_link}}, {{item_json}}").addTextArea(e=>{e.inputEl.rows=8,e.setValue(this.plugin.settings.frontmatterTemplate).onChange(async t=>{this.plugin.settings.frontmatterTemplate=t,await this.plugin.saveSettings()})}),new x.Setting(p).setName("Docker path").setDesc("CLI path for Docker (used to start Redis Stack).").addText(e=>e.setPlaceholder("docker").setValue(this.plugin.settings.dockerPath).onChange(async t=>{this.plugin.settings.dockerPath=t.trim()||"docker",await this.plugin.saveSettings()})),p.createEl("h3",{text:"Output folders (vault-relative)"}),new x.Setting(p).setName("PDF folder").addText(e=>e.setPlaceholder("zotero/pdfs").setValue(this.plugin.settings.outputPdfDir).onChange(async t=>{this.plugin.settings.outputPdfDir=t.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Notes folder").addText(e=>e.setPlaceholder("zotero/notes").setValue(this.plugin.settings.outputNoteDir).onChange(async t=>{this.plugin.settings.outputNoteDir=t.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Saved chats folder").setDesc("Where exported chat notes are stored (vault-relative).").addText(e=>e.setPlaceholder("zotero/chats").setValue(this.plugin.settings.chatOutputDir).onChange(async t=>{this.plugin.settings.chatOutputDir=t.trim()||"zotero/chats",await this.plugin.saveSettings()})),p.createEl("h3",{text:"Redis Stack"}),new x.Setting(p).setName("Redis URL").addText(e=>e.setPlaceholder("redis://127.0.0.1:6379").setValue(this.plugin.settings.redisUrl).onChange(async t=>{this.plugin.settings.redisUrl=t.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Index name").addText(e=>e.setPlaceholder("idx:zotero").setValue(this.plugin.settings.redisIndex).onChange(async t=>{this.plugin.settings.redisIndex=t.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Key prefix").addText(e=>e.setPlaceholder("zotero:chunk:").setValue(this.plugin.settings.redisPrefix).onChange(async t=>{this.plugin.settings.redisPrefix=t.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Auto-start Redis Stack (Docker Compose)").setDesc("Requires Docker Desktop running and your vault path shared with Docker.").addToggle(e=>e.setValue(this.plugin.settings.autoStartRedis).onChange(async t=>{this.plugin.settings.autoStartRedis=t,await this.plugin.saveSettings()})),new x.Setting(p).setName("Start Redis Stack now").setDesc("Restarts Docker Compose with the vault data directory.").addButton(e=>e.setButtonText("Start").onClick(async()=>{await this.plugin.startRedisStack()})),p.createEl("h3",{text:"Embeddings (LM Studio)"}),new x.Setting(p).setName("Embeddings base URL").addText(e=>e.setPlaceholder("http://localhost:1234/v1").setValue(this.plugin.settings.embedBaseUrl).onChange(async t=>{this.plugin.settings.embedBaseUrl=t.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Embeddings API key").addText(e=>e.setPlaceholder("lm-studio").setValue(this.plugin.settings.embedApiKey).onChange(async t=>{this.plugin.settings.embedApiKey=t.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Embeddings model").addText(e=>e.setPlaceholder("google/embedding-gemma-300m").setValue(this.plugin.settings.embedModel).onChange(async t=>{this.plugin.settings.embedModel=t.trim(),await this.plugin.saveSettings()})),p.createEl("h3",{text:"Chat LLM"}),new x.Setting(p).setName("Chat base URL").setDesc("OpenAI-compatible chat endpoint base URL").addText(e=>e.setPlaceholder("http://localhost:1234/v1").setValue(this.plugin.settings.chatBaseUrl).onChange(async t=>{this.plugin.settings.chatBaseUrl=t.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Chat API key").addText(e=>e.setPlaceholder("lm-studio").setValue(this.plugin.settings.chatApiKey).onChange(async t=>{this.plugin.settings.chatApiKey=t.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Chat model").addText(e=>e.setPlaceholder("meta-llama/llama-3.1-405b-instruct").setValue(this.plugin.settings.chatModel).onChange(async t=>{this.plugin.settings.chatModel=t.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Temperature").addText(e=>e.setPlaceholder("0.2").setValue(String(this.plugin.settings.chatTemperature)).onChange(async t=>{let n=Number.parseFloat(t);this.plugin.settings.chatTemperature=Number.isFinite(n)?n:.2,await this.plugin.saveSettings()})),new x.Setting(p).setName("Chat history messages").setDesc("Number of recent messages to include for conversational continuity (0 disables).").addText(e=>e.setPlaceholder("6").setValue(String(this.plugin.settings.chatHistoryMessages)).onChange(async t=>{let n=Number.parseInt(t,10);this.plugin.settings.chatHistoryMessages=Number.isFinite(n)?Math.max(0,n):6,await this.plugin.saveSettings()})),new x.Setting(p).setName("Chat panel location").setDesc("Where to open the chat view by default.").addDropdown(e=>e.addOption("right","Right sidebar").addOption("main","Main window").setValue(this.plugin.settings.chatPaneLocation).onChange(async t=>{this.plugin.settings.chatPaneLocation=t,await this.plugin.saveSettings()})),p.createEl("h3",{text:"Docling"}),new x.Setting(p).setName("OCR mode").setDesc("auto: skip OCR when text is readable; force if bad: OCR only when text looks poor; force: always OCR.").addDropdown(e=>e.addOption("auto","auto").addOption("force_low_quality","force if quality is bad").addOption("force","force").setValue(this.plugin.settings.ocrMode).onChange(async t=>{this.plugin.settings.ocrMode=t,await this.plugin.saveSettings()})),new x.Setting(p).setName("Text quality threshold").setDesc("Lower values are stricter; below this threshold the text is treated as low quality.").addSlider(e=>{e.setLimits(0,1,.05).setValue(this.plugin.settings.ocrQualityThreshold).setDynamicTooltip().onChange(async t=>{this.plugin.settings.ocrQualityThreshold=t,await this.plugin.saveSettings()})}),new x.Setting(p).setName("Chunking").setDesc("page or section").addDropdown(e=>e.addOption("page","page").addOption("section","section").setValue(this.plugin.settings.chunkingMode).onChange(async t=>{this.plugin.settings.chunkingMode=t,await this.plugin.saveSettings()})),new x.Setting(p).setName("Section chunk max chars").setDesc("Split large section chunks into smaller pieces (section mode only).").addText(e=>e.setPlaceholder("3000").setValue(String(this.plugin.settings.maxChunkChars)).onChange(async t=>{let n=Number.parseInt(t,10);this.plugin.settings.maxChunkChars=Number.isFinite(n)?n:3e3,await this.plugin.saveSettings()})),new x.Setting(p).setName("Section chunk overlap chars").setDesc("Number of characters to overlap when splitting section chunks.").addText(e=>e.setPlaceholder("250").setValue(String(this.plugin.settings.chunkOverlapChars)).onChange(async t=>{let n=Number.parseInt(t,10);this.plugin.settings.chunkOverlapChars=Number.isFinite(n)?n:250,await this.plugin.saveSettings()})),new x.Setting(p).setName("Remove image placeholders").setDesc("Strip '<!-- image -->' tags before chunking.").addToggle(e=>e.setValue(this.plugin.settings.removeImagePlaceholders).onChange(async t=>{this.plugin.settings.removeImagePlaceholders=t,await this.plugin.saveSettings()})),p.createEl("h4",{text:"OCR cleanup (optional)"}),new x.Setting(p).setName("LLM cleanup for low-quality chunks").setDesc("Optional OpenAI-compatible cleanup for poor OCR. Can be slow/costly.").addToggle(e=>e.setValue(this.plugin.settings.enableLlmCleanup).onChange(async t=>{this.plugin.settings.enableLlmCleanup=t,await this.plugin.saveSettings()})),new x.Setting(p).setName("LLM cleanup base URL").setDesc("OpenAI-compatible endpoint, e.g. http://127.0.0.1:1234/v1").addText(e=>e.setPlaceholder("http://127.0.0.1:1234/v1").setValue(this.plugin.settings.llmCleanupBaseUrl).onChange(async t=>{this.plugin.settings.llmCleanupBaseUrl=t.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("LLM cleanup API key").setDesc("Optional API key for the cleanup endpoint.").addText(e=>e.setPlaceholder("sk-...").setValue(this.plugin.settings.llmCleanupApiKey).onChange(async t=>{this.plugin.settings.llmCleanupApiKey=t.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("LLM cleanup model").setDesc("Model to use for cleanup.").addText(e=>e.setPlaceholder("openai/gpt-oss-20b").setValue(this.plugin.settings.llmCleanupModel).onChange(async t=>{this.plugin.settings.llmCleanupModel=t.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("LLM cleanup temperature").setDesc("Lower is more conservative.").addText(e=>e.setPlaceholder("0.0").setValue(String(this.plugin.settings.llmCleanupTemperature)).onChange(async t=>{let n=Number.parseFloat(t);this.plugin.settings.llmCleanupTemperature=Number.isFinite(n)?n:0,await this.plugin.saveSettings()})),new x.Setting(p).setName("LLM cleanup min quality").setDesc("Only run cleanup when chunk quality is below this threshold (0-1).").addSlider(e=>e.setLimits(0,1,.05).setValue(this.plugin.settings.llmCleanupMinQuality).setDynamicTooltip().onChange(async t=>{this.plugin.settings.llmCleanupMinQuality=t,await this.plugin.saveSettings()})),new x.Setting(p).setName("LLM cleanup max chars").setDesc("Skip cleanup for chunks longer than this limit.").addText(e=>e.setPlaceholder("2000").setValue(String(this.plugin.settings.llmCleanupMaxChars)).onChange(async t=>{let n=Number.parseInt(t,10);this.plugin.settings.llmCleanupMaxChars=Number.isFinite(n)?n:2e3,await this.plugin.saveSettings()})),p.createEl("h3",{text:"Maintenance"}),new x.Setting(p).setName("Reindex Redis from cached chunks").setDesc("Rebuild the Redis index from cached chunk JSON files.").addButton(e=>e.setButtonText("Reindex").onClick(async()=>{await this.plugin.reindexRedisFromCache()})),new x.Setting(p).setName("Recreate missing notes from cache").setDesc("Rebuild missing notes using cached Zotero items and chunks.").addButton(e=>e.setButtonText("Recreate").onClick(async()=>{await this.plugin.recreateMissingNotesFromCache()}))}};var W={"zrr-picker":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="3" width="18" height="18" rx="3"/>
  <path d="M7.5 8h9"/>
  <path d="M16.5 8 7.5 16"/>
  <path d="M7.5 16h9"/>
</svg>
`,"zrr-chat":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="m6.67,4.05l10.65,0a2.66,2.66 0 0 1 2.66,2.66l0,10.63a2.66,2.66 0 0 1 -2.66,2.66l-7.31,0l-3.36,2.85l0.02,-2.85a2.66,2.66 0 0 1 -2.66,-2.66l0,-10.63a2.66,2.66 0 0 1 2.66,-2.66z"/>
  <path d="m7.5,8l9,0"/>
  <path d="m16.5,8l-9,8"/>
  <path d="m7.5,16l9,0"/>
</svg>
`};var ee={"docling_extract.py":`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.2.2
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


ProgressCallback = Callable[[int, str, str], None]


def make_progress_emitter(enabled: bool) -> ProgressCallback:
    if not enabled:
        def _noop(percent: int, stage: str, message: str) -> None:
            return None
        return _noop

    def _emit(percent: int, stage: str, message: str) -> None:
        payload = {
            "type": "progress",
            "percent": max(0, min(100, int(percent))),
            "stage": stage,
            "message": message,
        }
        print(json.dumps(payload), flush=True)

    return _emit


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
    max_chunk_chars: int = 3000
    chunk_overlap_chars: int = 250
    cleanup_remove_image_tags: bool = True
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


def remove_image_placeholders(text: str) -> str:
    return re.sub(r"<!--\\s*image\\s*-->", "", text, flags=re.IGNORECASE)


def clean_chunk_text(text: str, config: Optional[DoclingProcessingConfig]) -> str:
    if not text:
        return ""
    cleaned = text
    if config and config.cleanup_remove_image_tags:
        cleaned = remove_image_placeholders(cleaned)
    return cleaned


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


def split_paragraphs(text: str) -> List[str]:
    paragraphs = re.split(r"\\n\\s*\\n", text)
    return [para.strip() for para in paragraphs if para.strip()]


def split_long_text(text: str, max_chars: int) -> List[str]:
    if max_chars <= 0 or len(text) <= max_chars:
        return [text]
    sentences = re.split(r"(?<=[.!?])\\s+", text.strip())
    if len(sentences) <= 1:
        return [text[i:i + max_chars] for i in range(0, len(text), max_chars)]
    chunks: List[str] = []
    current: List[str] = []
    current_len = 0
    for sentence in sentences:
        sent = sentence.strip()
        if not sent:
            continue
        if current_len + len(sent) + 1 > max_chars and current:
            chunks.append(" ".join(current).strip())
            current = [sent]
            current_len = len(sent)
        else:
            current.append(sent)
            current_len += len(sent) + 1
    if current:
        chunks.append(" ".join(current).strip())
    return chunks


def split_text_by_size(text: str, max_chars: int, overlap_chars: int) -> List[str]:
    if max_chars <= 0 or len(text) <= max_chars:
        return [text]
    paragraphs = split_paragraphs(text) or [text]
    chunks: List[str] = []
    current: List[str] = []
    current_len = 0

    def flush() -> None:
        nonlocal current, current_len
        if not current:
            return
        chunk = "\\n\\n".join(current).strip()
        chunks.append(chunk)
        current = []
        current_len = 0

    for para in paragraphs:
        for piece in split_long_text(para, max_chars):
            piece_len = len(piece)
            if current_len + piece_len + 2 > max_chars and current:
                flush()
            current.append(piece)
            current_len += piece_len + 2

    flush()

    if overlap_chars <= 0 or len(chunks) <= 1:
        return chunks

    overlapped: List[str] = []
    previous = ""
    for chunk in chunks:
        if previous:
            overlap = previous[-overlap_chars:]
            combined = f"{overlap}\\n{chunk}".strip()
        else:
            combined = chunk
        overlapped.append(combined)
        previous = chunk
    return overlapped


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


def ocr_pages_with_paddle(
    images: Sequence[Any],
    languages: str,
    progress_cb: Optional[ProgressCallback] = None,
    progress_base: int = 0,
    progress_span: int = 0,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    from paddleocr import PaddleOCR

    try:
        import numpy as np
    except Exception as exc:
        raise RuntimeError(f"numpy is required for PaddleOCR: {exc}") from exc

    ocr = PaddleOCR(use_angle_cls=True, lang=languages)
    pages: List[Dict[str, Any]] = []
    confidences: List[float] = []

    total = max(1, len(images))
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
        if progress_cb and progress_span > 0:
            percent = progress_base + int(idx / total * progress_span)
            progress_cb(percent, "ocr", f"OCR page {idx}/{total}")

    avg_conf = sum(confidences) / len(confidences) if confidences else None
    return pages, {"ocr_confidence_avg": avg_conf}


def ocr_pages_with_tesseract(
    images: Sequence[Any],
    languages: str,
    progress_cb: Optional[ProgressCallback] = None,
    progress_base: int = 0,
    progress_span: int = 0,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    import pytesseract

    pages: List[Dict[str, Any]] = []
    total = max(1, len(images))
    for idx, image in enumerate(images, start=1):
        text = pytesseract.image_to_string(image, lang=languages)
        pages.append({"page_num": idx, "text": text})
        if progress_cb and progress_span > 0:
            percent = progress_base + int(idx / total * progress_span)
            progress_cb(percent, "ocr", f"OCR page {idx}/{total}")
    return pages, {}


def run_external_ocr_pages(
    pdf_path: str,
    engine: str,
    languages: str,
    config: DoclingProcessingConfig,
    progress_cb: Optional[ProgressCallback] = None,
    progress_base: int = 0,
    progress_span: int = 0,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    images = render_pdf_pages(pdf_path, config.ocr_dpi)
    if engine == "paddle":
        return ocr_pages_with_paddle(
            images,
            normalize_languages_for_engine(languages, engine),
            progress_cb,
            progress_base,
            progress_span,
        )
    if engine == "tesseract":
        return ocr_pages_with_tesseract(
            images,
            normalize_languages_for_engine(languages, engine),
            progress_cb,
            progress_base,
            progress_span,
        )
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


def convert_pdf_with_docling(
    pdf_path: str,
    config: DoclingProcessingConfig,
    progress_cb: Optional[ProgressCallback] = None,
) -> DoclingConversionResult:
    emit = progress_cb or (lambda _p, _s, _m: None)
    emit(5, "analysis", "Analyzing text layer")
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
    emit(15, "route", "Selecting OCR route")
    rasterized_source = False
    rasterized_pdf_path = ""
    rasterize_error: Optional[str] = None
    column_layout: Optional[ColumnLayoutDetection] = None
    if should_rasterize_text_layer(has_text_layer, low_quality, config):
        try:
            rasterized_pdf_path = rasterize_pdf_to_temp(pdf_path, config.ocr_dpi)
            rasterized_source = True
            emit(25, "rasterize", "Rasterized PDF for OCR")
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
            emit(30, "layout", "Checked column layout")
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
    emit(40, "docling", "Docling conversion running")
    result = converter.convert(docling_input)
    doc = result.document if hasattr(result, "document") else result
    markdown = export_markdown(doc)
    pages = extract_pages(doc)
    if len(pages) <= 1:
        fallback_pages = extract_pages_from_pdf(pdf_path)
        if len(fallback_pages) > len(pages):
            pages = fallback_pages
    emit(70, "docling", "Docling conversion complete")

    ocr_stats: Dict[str, Any] = {}
    if decision.ocr_used and decision.use_external_ocr and decision.per_page_ocr and not rasterized_source:
        try:
            ocr_pages, ocr_stats = run_external_ocr_pages(
                pdf_path,
                decision.ocr_engine,
                languages,
                config,
                progress_cb=emit,
                progress_base=70,
                progress_span=20,
            )
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

    emit(90, "chunking", "Building chunks")
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
    emit(100, "done", "Extraction complete")
    return DoclingConversionResult(markdown=markdown, pages=pages, metadata=metadata)


def build_chunks_page(
    doc_id: str,
    pages: List[Dict[str, Any]],
    config: Optional[DoclingProcessingConfig] = None,
    postprocess: Optional[Callable[[str], str]] = None,
) -> List[Dict[str, Any]]:
    chunks: List[Dict[str, Any]] = []
    for page in pages:
        raw_text = str(page.get("text", ""))
        if postprocess:
            raw_text = postprocess(raw_text)
        raw_text = clean_chunk_text(raw_text, config)
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
        return build_chunks_page(doc_id, pages, config=config)

    for idx, section in enumerate(sections, start=1):
        title = section.get("title", "")
        text = section.get("text", "")
        if postprocess:
            text = postprocess(text)
        text = clean_chunk_text(text, config)
        if not text.strip():
            continue
        base_id = slugify(title) or f"section-{idx}"
        if base_id in seen_ids:
            seen_ids[base_id] += 1
            base_id = f"{base_id}-{seen_ids[base_id]}"
        else:
            seen_ids[base_id] = 1
        max_chars = config.max_chunk_chars if config else 0
        overlap_chars = config.chunk_overlap_chars if config else 0
        segments = split_text_by_size(text, max_chars, overlap_chars)
        for seg_idx, segment in enumerate(segments, start=1):
            cleaned = normalize_text(segment)
            if not cleaned:
                continue
            page_start, page_end = find_page_range(cleaned, pages, config)
            chunk_id = base_id if seg_idx == 1 else f"{base_id}-{seg_idx}"
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
        "--max-chunk-chars",
        type=int,
        help="Max chars for section chunks before splitting (section mode only).",
    )
    parser.add_argument(
        "--chunk-overlap-chars",
        type=int,
        help="Overlap chars when splitting large section chunks.",
    )
    parser.add_argument(
        "--keep-image-tags",
        action="store_true",
        help="Preserve '<!-- image -->' tags instead of removing them.",
    )
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
    parser.add_argument("--progress", action="store_true", help="Emit JSON progress events to stdout")
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
    if args.max_chunk_chars is not None:
        config.max_chunk_chars = args.max_chunk_chars
    if args.chunk_overlap_chars is not None:
        config.chunk_overlap_chars = args.chunk_overlap_chars
    if args.keep_image_tags:
        config.cleanup_remove_image_tags = False
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

    progress_cb = make_progress_emitter(bool(args.progress))

    try:
        conversion = convert_pdf_with_docling(args.pdf, config, progress_cb=progress_cb)
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
            chunks = build_chunks_page(args.doc_id, pages, config=config)
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
# zotero-redisearch-rag tool version: 0.2.2
import argparse
import json
import math
import os
import struct
import sys
from typing import Any, Dict, List, Optional, Tuple

from utils_embedding import normalize_vector, vector_to_bytes, request_embedding
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
    
    
    
        "TAG",
    
    
    
        "authors",
    
    
    
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
        ("attachment_key", ["TAG"]),
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

    # Delete all existing chunk keys for this doc_id before indexing
    pattern = f"{args.prefix}{doc_id}:*"
    try:
        keys_to_delete = client.keys(pattern)
        if keys_to_delete:
            client.delete(*keys_to_delete)
            eprint(f"Deleted {len(keys_to_delete)} existing chunk keys for doc_id {doc_id}")
    except Exception as exc:
        eprint(f"Failed to delete old chunk keys for doc_id {doc_id}: {exc}")

    attachment_key = None
    try:
        meta = payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {}
        key_val = meta.get("attachment_key") if isinstance(meta, dict) else None
        if isinstance(key_val, str) and key_val.strip():
            attachment_key = key_val.strip()
    except Exception:
        attachment_key = None

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
            "attachment_key": str(attachment_key or ""),
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
`,"rag_query_redisearch.py":`# zotero-redisearch-rag tool version: 0.2.2
def eprint(message: str) -> None:
    sys.stderr.write(message + "\\n")
#!/usr/bin/env python3
import argparse
import json
import math
from utils_embedding import normalize_vector, vector_to_bytes, request_embedding
import re
import struct
import sys
from typing import Any, Dict, List

import redis
import requests




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
            "9",
            "doc_id",
            "chunk_id",
            "attachment_key",
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


def load_history_messages(path: str) -> List[Dict[str, Any]]:
    if not path:
        return []
    try:
        with open(path, "r", encoding="utf-8") as handle:
            payload = json.load(handle)
    except Exception:
        return []
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    messages = payload.get("messages") if isinstance(payload, dict) else None
    if isinstance(messages, list):
        return [item for item in messages if isinstance(item, dict)]
    return []


def format_history_block(messages: List[Dict[str, Any]]) -> str:
    lines: List[str] = []
    for message in messages:
        role = str(message.get("role", "")).strip().lower()
        content = str(message.get("content", "")).strip()
        if not content:
            continue
        if role not in ("user", "assistant"):
            role = "user"
        label = "User" if role == "user" else "Assistant"
        lines.append(f"{label}: {content}")
    return "\\n".join(lines)


def extract_annotation_key(chunk_id: str) -> str:
    if not chunk_id:
        return ""
    if ":" in chunk_id:
        chunk_id = chunk_id.split(":", 1)[1]
    candidate = chunk_id.strip().upper()
    if re.fullmatch(r"[A-Z0-9]{8}", candidate):
        return candidate
    return ""


def build_citations(retrieved: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    seen = set()
    citations: List[Dict[str, Any]] = []
    for chunk in retrieved:
        doc_id = chunk.get("doc_id", "")
        chunk_id = chunk.get("chunk_id", "")
        attachment_key = chunk.get("attachment_key", "")
        page_start = chunk.get("page_start", "")
        page_end = chunk.get("page_end", "")
        source_pdf = chunk.get("source_pdf", "")
        key = (doc_id, attachment_key, page_start, page_end, source_pdf)
        if key in seen:
            continue
        seen.add(key)
        annotation_key = extract_annotation_key(str(chunk_id))
        citations.append({
            "doc_id": doc_id,
            "chunk_id": chunk_id,
            "attachment_key": attachment_key,
            "annotation_key": annotation_key or None,
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
    parser.add_argument("--history-file", help="Optional JSON file with recent chat history")
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
            "9",
            "doc_id",
            "chunk_id",
            "attachment_key",
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
        "Use ONLY the provided context for factual claims. If insufficient, say you do not know. "
        "Chat history is only for conversational continuity or for providing concepts to be retrieved"
        "Add inline citations using this exact format: [[cite:DOC_ID:PAGE_START-PAGE_END]]. "
        "Example: ... [[cite:ABC123:12-13]]."
    )
    history_messages = load_history_messages(args.history_file) if args.history_file else []
    history_block = format_history_block(history_messages)
    if history_block:
        history_block = f"Chat history (for reference only):\\n{history_block}\\n\\n"
    user_prompt = f"{history_block}Question: {args.query}\\n\\nContext:\\n{context}"

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
# zotero-redisearch-rag tool version: 0.2.2
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
`,"utils_embedding.py":`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.2.2
import math
import struct
import requests
from typing import List

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
`,"ocr_wordlist.txt":`# zotero-redisearch-rag tool version: 0.2.2
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
`,"docker-compose.yml":`# zotero-redisearch-rag tool version: 0.2.2
services:
  redis-stack:
    image: redis/redis-stack-server:latest
    command: ["redis-stack-server", "/redis-stack.conf", "--dir", "/data"]
    environment:
      - REDIS_ARGS=
    ports:
      - "\${ZRR_PORT:-6379}:6379"
    volumes:
      - "\${ZRR_DATA_DIR:-./.zotero-redisearch-rag/redis-data}:/data"
      - "./redis-stack.conf:/redis-stack.conf:ro"
`,"redis-stack.conf":`# zotero-redisearch-rag tool version: 0.2.2
# Redis Stack persistence config for local RAG index
appendonly yes
appendfsync everysec

dir /data
`};var L=require("obsidian"),q="zotero-redisearch-rag-chat",$=class extends L.ItemView{constructor(e,t){super(e);this.messages=[];this.activeSessionId="default";this.messageEls=new Map;this.pendingRender=new Map;this.busy=!1;this.plugin=t}getViewType(){return q}getDisplayText(){return"Zotero RAG Chat"}getIcon(){return"zrr-chat"}async onOpen(){let{containerEl:e}=this;e.empty(),e.addClass("zrr-chat-view");let t=e.createEl("div",{cls:"zrr-chat-header"});t.createEl("div",{cls:"zrr-chat-title",text:"Zotero RAG Chat"});let n=t.createEl("div",{cls:"zrr-chat-controls"}),s=n.createEl("div",{cls:"zrr-chat-controls-row"});this.sessionSelect=s.createEl("select",{cls:"zrr-chat-session"}),this.sessionSelect.addEventListener("change",async()=>{await this.switchSession(this.sessionSelect.value)});let r=n.createEl("div",{cls:"zrr-chat-controls-row zrr-chat-controls-actions"});this.renameButton=r.createEl("button",{cls:"zrr-chat-rename",text:"Rename",attr:{title:"Rename the current chat"}}),this.renameButton.addEventListener("click",async()=>{await this.promptRenameSession()}),this.copyButton=r.createEl("button",{cls:"zrr-chat-copy",text:"Copy",attr:{title:"Copy this chat to a new note"}}),this.copyButton.addEventListener("click",async()=>{await this.copyChatToNote()}),this.deleteButton=r.createEl("button",{cls:"zrr-chat-delete",text:"Delete",attr:{title:"Delete this chat"}}),this.deleteButton.addEventListener("click",async()=>{await this.deleteChat()}),this.newButton=r.createEl("button",{cls:"zrr-chat-new",text:"New chat",attr:{title:"Start a new chat session"}}),this.newButton.addEventListener("click",async()=>{await this.startNewChat()}),this.messagesEl=e.createEl("div",{cls:"zrr-chat-messages"});let i=e.createEl("div",{cls:"zrr-chat-input"});this.inputEl=i.createEl("textarea",{cls:"zrr-chat-textarea",attr:{placeholder:"Ask your Zotero library..."}}),this.sendButton=i.createEl("button",{cls:"zrr-chat-send",text:"Send"}),this.sendButton.addEventListener("click",()=>this.handleSend()),this.inputEl.addEventListener("keydown",a=>{a.key==="Enter"&&!a.shiftKey&&(a.preventDefault(),this.handleSend())}),await this.loadSessions(),await this.loadHistory(),await this.renderAll()}focusInput(){var e;(e=this.inputEl)==null||e.focus()}async loadHistory(){try{this.messages=await this.plugin.loadChatHistoryForSession(this.activeSessionId)}catch(e){console.error(e),this.messages=[]}}async saveHistory(){try{await this.plugin.saveChatHistoryForSession(this.activeSessionId,this.messages),await this.plugin.finalizeChatSessionNameIfNeeded(this.activeSessionId,this.messages),await this.loadSessions()}catch(e){console.error(e)}}async loadSessions(){let e=await this.plugin.listChatSessions();this.activeSessionId=await this.plugin.getActiveChatSessionId(),this.sessionSelect.empty();for(let t of e){let n=this.sessionSelect.createEl("option",{text:t.name});n.value=t.id,t.id===this.activeSessionId&&(n.selected=!0)}!e.some(t=>t.id===this.activeSessionId)&&e.length>0&&(this.activeSessionId=e[0].id,await this.plugin.setActiveChatSessionId(this.activeSessionId),this.sessionSelect.value=this.activeSessionId)}async promptRenameSession(){var s;let t=(await this.plugin.listChatSessions()).find(r=>r.id===this.activeSessionId);new H(this.app,(s=t==null?void 0:t.name)!=null?s:"New chat",async r=>{await this.plugin.renameChatSession(this.activeSessionId,r),await this.loadSessions()}).open()}async startNewChat(){await this.plugin.saveChatHistoryForSession(this.activeSessionId,this.messages),await this.plugin.finalizeChatSessionNameIfNeeded(this.activeSessionId,this.messages,{force:!0});let e=await this.plugin.createChatSession("New chat");await this.switchSession(e,{skipSave:!0})}async deleteChat(){let e=await this.plugin.listChatSessions();if(e.length<=1){new L.Notice("You must keep at least one chat.");return}let t=e.find(s=>s.id===this.activeSessionId);if(!t)return;new G(this.app,t.name,async()=>{await this.plugin.deleteChatSession(this.activeSessionId);let s=await this.plugin.getActiveChatSessionId();await this.switchSession(s,{skipSave:!0})}).open()}async switchSession(e,t={}){!e||e===this.activeSessionId||(t.skipSave||await this.saveHistory(),this.activeSessionId=e,await this.plugin.setActiveChatSessionId(e),await this.loadSessions(),await this.loadHistory(),await this.renderAll())}async renderAll(){this.messagesEl.empty(),this.messageEls.clear();for(let e of this.messages)await this.renderMessage(e);this.scrollToBottom()}async renderMessage(e){let t=this.messagesEl.createEl("div",{cls:`zrr-chat-message zrr-chat-${e.role}`});t.createEl("div",{cls:"zrr-chat-meta"}).setText(e.role==="user"?"You":"Assistant");let s=t.createEl("div",{cls:"zrr-chat-content"}),r=t.createEl("div",{cls:"zrr-chat-citations"});this.messageEls.set(e.id,{wrapper:t,content:s,citations:r}),await this.renderMessageContent(e)}scheduleRender(e){if(this.pendingRender.has(e.id))return;let t=window.setTimeout(async()=>{this.pendingRender.delete(e.id),await this.renderMessageContent(e),this.scrollToBottom()},80);this.pendingRender.set(e.id,t)}async renderMessageContent(e){var s,r,i;let t=this.messageEls.get(e.id);if(!t)return;let n=await this.plugin.formatInlineCitations(e.content||"",(s=e.citations)!=null?s:[],(r=e.retrieved)!=null?r:[]);t.content.dataset.lastRendered!==n&&(t.content.empty(),await L.MarkdownRenderer.renderMarkdown(n,t.content,"",this.plugin),this.hookInternalLinks(t.content),t.content.dataset.lastRendered=n),t.citations.empty(),await this.renderCitations(t.citations,(i=e.citations)!=null?i:[])}hookInternalLinks(e){let t=e.querySelectorAll("a.internal-link");for(let n of Array.from(t))n.dataset.zrrBound!=="1"&&(n.dataset.zrrBound="1",this.registerDomEvent(n,"click",s=>{s.preventDefault();let r=n.getAttribute("data-href")||n.getAttribute("href")||"";r&&this.plugin.openInternalLinkInMain(r)}))}async renderCitations(e,t){if(e.empty(),!t.length)return;let n=e.createEl("details",{cls:"zrr-chat-citations-details"});n.createEl("summary",{text:`Relevant context sources (${t.length})`,cls:"zrr-chat-citations-summary"});let s=n.createEl("ul",{cls:"zrr-chat-citation-list"});for(let r of t){let i=await this.plugin.resolveCitationDisplay(r),a=s.createEl("li");a.createEl("a",{text:i.noteTitle,href:"#"}).addEventListener("click",l=>{l.preventDefault(),i.notePath&&this.plugin.openNoteInMain(i.notePath)}),a.createEl("span",{text:", p. "}),a.createEl("a",{text:i.pageLabel,href:"#"}).addEventListener("click",l=>{if(l.preventDefault(),i.zoteroUrl){this.plugin.openExternalUrl(i.zoteroUrl);return}if(i.pdfPath){this.plugin.openPdfInMain(i.pdfPath,i.pageStart);return}this.plugin.openCitationTarget(r,i)})}}async copyChatToNote(){var s;let t=(await this.plugin.listChatSessions()).find(r=>r.id===this.activeSessionId),n=(s=t==null?void 0:t.name)!=null?s:"New chat";await this.plugin.createChatNoteFromSession(this.activeSessionId,n,this.messages)}scrollToBottom(){this.messagesEl.scrollTop=this.messagesEl.scrollHeight}async handleSend(){if(this.busy)return;let e=this.inputEl.value.trim();if(!e){new L.Notice("Query cannot be empty.");return}if(!this.plugin.settings.chatBaseUrl){new L.Notice("Chat base URL must be set in settings.");return}this.inputEl.value="",this.busy=!0,this.sendButton.disabled=!0;let t={id:this.generateId(),role:"user",content:e,createdAt:new Date().toISOString()};this.messages.push(t),await this.renderMessage(t),this.scrollToBottom(),await this.saveHistory();let n={id:this.generateId(),role:"assistant",content:"",citations:[],createdAt:new Date().toISOString()};this.messages.push(n),await this.renderMessage(n),this.scrollToBottom();let s=!1,r=this.plugin.getRecentChatHistory(this.messages.slice(0,-2));try{await this.plugin.runRagQueryStreaming(e,i=>{s=!0,n.content+=i,this.scheduleRender(n)},i=>{(!s&&(i!=null&&i.answer)||i!=null&&i.answer)&&(n.content=i.answer),Array.isArray(i==null?void 0:i.citations)&&(n.citations=i.citations),Array.isArray(i==null?void 0:i.retrieved)&&(n.retrieved=i.retrieved),this.scheduleRender(n)},r)}catch(i){console.error(i),n.content="Failed to fetch answer. See console for details.",this.scheduleRender(n)}finally{this.busy=!1,this.sendButton.disabled=!1,await this.saveHistory()}}async clearChat(){this.messages=[],await this.saveHistory(),await this.renderAll()}generateId(){return typeof crypto!="undefined"&&"randomUUID"in crypto?crypto.randomUUID():`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}},H=class extends L.Modal{constructor(p,e,t){super(p),this.initialValue=e,this.onSubmit=t}onOpen(){let{contentEl:p}=this;p.empty(),p.createEl("h3",{text:"Rename chat"});let e=this.initialValue;new L.Setting(p).setName("Name").addText(r=>{r.setValue(e),r.onChange(i=>{e=i})});let t=p.createEl("div");t.style.display="flex",t.style.gap="0.5rem",t.style.marginTop="1rem",t.createEl("button",{text:"Cancel"}).addEventListener("click",()=>this.close()),t.createEl("button",{text:"Save"}).addEventListener("click",()=>{let r=e.trim();if(!r){new L.Notice("Name cannot be empty.");return}this.close(),this.onSubmit(r)})}},G=class extends L.Modal{constructor(p,e,t){super(p),this.chatName=e,this.onConfirm=t}onOpen(){let{contentEl:p}=this;p.empty(),p.createEl("h3",{text:"Delete chat"}),p.createEl("p",{text:`Delete "${this.chatName}"? This cannot be undone.`});let e=p.createEl("div");e.style.display="flex",e.style.gap="0.5rem",e.style.marginTop="1rem",e.createEl("button",{text:"Cancel"}).addEventListener("click",()=>this.close()),e.createEl("button",{text:"Delete"}).addEventListener("click",()=>{this.close(),this.onConfirm()})}};var te=[{label:"Auto (no hint)",value:""},{label:"English (en)",value:"en"},{label:"German (de)",value:"de"},{label:"German + English (de,en)",value:"de,en"},{label:"French (fr)",value:"fr"},{label:"Spanish (es)",value:"es"},{label:"Italian (it)",value:"it"},{label:"Dutch (nl)",value:"nl"},{label:"Portuguese (pt)",value:"pt"},{label:"Polish (pl)",value:"pl"},{label:"Swedish (sv)",value:"sv"},{label:"Other (custom ISO code)",value:"__custom__"}],ne={en:"eng",de:"deu",fr:"fra",es:"spa",it:"ita",nl:"nld",pt:"por",pl:"pol",sv:"swe"},ge=W["zrr-picker"],he=W["zrr-chat"],j=class extends d.Modal{constructor(p,e,t,n,s="Value cannot be empty."){super(p),this.titleText=e,this.placeholder=t,this.onSubmit=n,this.emptyMessage=s}onOpen(){let{contentEl:p}=this;p.empty(),p.createEl("h3",{text:this.titleText});let e=p.createEl("input",{type:"text",placeholder:this.placeholder});e.style.width="100%",e.focus();let t=p.createEl("button",{text:"Submit"});t.style.marginTop="0.75rem";let n=()=>{let s=e.value.trim();if(!s){new d.Notice(this.emptyMessage);return}this.close(),this.onSubmit(s)};t.addEventListener("click",n),e.addEventListener("keydown",s=>{s.key==="Enter"&&n()})}};var J=class extends d.Modal{constructor(e,t,n){super(e);this.resolved=!1;this.filePath=t,this.onResolve=n}onOpen(){let{contentEl:e}=this;e.empty(),e.createEl("h3",{text:"Overwrite existing note?"}),e.createEl("p",{text:`This will overwrite: ${this.filePath}`});let t=e.createEl("div");t.style.display="flex",t.style.gap="0.5rem",t.style.marginTop="0.75rem";let n=t.createEl("button",{text:"Cancel"}),s=t.createEl("button",{text:"Overwrite"});n.addEventListener("click",()=>{this.resolved=!0,this.close(),this.onResolve(!1)}),s.addEventListener("click",()=>{this.resolved=!0,this.close(),this.onResolve(!0)})}onClose(){this.resolved||this.onResolve(!1)}},K=class extends d.SuggestModal{constructor(e,t){super(e);this.resolved=!1;this.resolveSelection=t,this.setPlaceholder("Select a language for OCR/quality...")}getSuggestions(e){let t=e.trim().toLowerCase();return t?te.filter(n=>n.label.toLowerCase().includes(t)||n.value.toLowerCase().includes(t)):te}renderSuggestion(e,t){t.setText(e.label),t.addEventListener("click",()=>this.handleSelection(e))}onChooseSuggestion(e){this.handleSelection(e)}onClose(){this.resolved||this.resolveSelection(null)}handleSelection(e){if(!this.resolved){if(this.resolved=!0,e.value==="__custom__"){this.close(),new j(this.app,"Custom language hint","e.g., en, de, fr, de,en",t=>this.resolveSelection(t.trim()),"Language hint cannot be empty.").open();return}this.resolveSelection(e.value),this.close()}}},U=class extends d.Plugin{constructor(){super(...arguments);this.docIndex=null}async onload(){await this.loadSettings(),await this.migrateCachePaths(),this.addSettingTab(new B(this.app,this)),this.registerRibbonIcons(),this.registerView(q,e=>new $(e,this)),this.setupStatusBar(),this.registerNoteRenameHandler();try{await this.ensureBundledTools()}catch(e){console.error("Failed to sync bundled tools",e)}this.addCommand({id:"import-zotero-item-index",name:"Import Zotero item and index (Docling -> RedisSearch)",callback:()=>this.importZoteroItem()}),this.addCommand({id:"ask-zotero-library",name:"Ask my Zotero library (RAG via RedisSearch)",callback:()=>this.askZoteroLibrary()}),this.addCommand({id:"open-zotero-chat",name:"Open Zotero RAG chat panel",callback:()=>this.openChatView(!0)}),this.addCommand({id:"rebuild-zotero-note-cache",name:"Rebuild Zotero note from cache (Docling + RedisSearch)",callback:()=>this.rebuildNoteFromCache()}),this.addCommand({id:"rebuild-doc-index-cache",name:"Rebuild doc index from cache",callback:()=>this.rebuildDocIndexFromCache()}),this.addCommand({id:"recreate-missing-notes-cache",name:"Recreate missing notes from cache (Docling + RedisSearch)",callback:()=>this.recreateMissingNotesFromCache()}),this.addCommand({id:"reindex-redis-from-cache",name:"Reindex Redis from cached chunks",callback:()=>this.reindexRedisFromCache()}),this.addCommand({id:"start-redis-stack",name:"Start Redis Stack (Docker Compose)",callback:()=>this.startRedisStack()}),this.settings.autoStartRedis&&this.startRedisStack(!0)}async loadSettings(){this.settings=Object.assign({},X,await this.loadData())}async saveSettings(){await this.saveData(this.settings)}async importZoteroItem(){var A,S,I;try{await this.ensureBundledTools()}catch(g){new d.Notice("Failed to sync bundled tools. See console for details."),console.error(g);return}let e;try{e=await this.promptZoteroItem()}catch(g){new d.Notice("Zotero search failed. See console for details."),console.error(g);return}if(!e){new d.Notice("No Zotero item selected.");return}let t=(A=e.data)!=null?A:e;!t.key&&e.key&&(t.key=e.key);let n=this.getDocId(t);if(!n){new d.Notice("Could not resolve a stable doc_id from Zotero item.");return}let s=await this.resolveLanguageHint(t,(S=e.key)!=null?S:t.key),r=this.buildDoclingLanguageHint(s!=null?s:void 0),i=await this.resolvePdfAttachment(t,n);if(!i){new d.Notice("No PDF attachment found for item.");return}this.showStatusProgress("Preparing...",5);let a=typeof t.title=="string"?t.title:"",o=await this.getDocIndexEntry(n);o&&new d.Notice("Item already indexed. Updating cached files and index.");let c=this.sanitizeFileName(a)||n;if(o!=null&&o.note_path)c=y.default.basename(o.note_path,".md")||c;else if(o!=null&&o.pdf_path){let g=this.toVaultRelativePath(o.pdf_path);g&&g.startsWith((0,d.normalizePath)(this.settings.outputPdfDir))&&(c=y.default.basename(g,".pdf")||c)}let l=o?c:await this.resolveUniqueBaseName(c,n),u=(0,d.normalizePath)(`${this.settings.outputPdfDir}/${l}.pdf`),m=(0,d.normalizePath)(`${N}/${n}.json`),h=(0,d.normalizePath)(`${T}/${n}.json`),f=this.app.vault.adapter,_=(0,d.normalizePath)(`${this.settings.outputNoteDir}/${l}.md`);if(o!=null&&o.note_path&&await f.exists(o.note_path)&&(_=(0,d.normalizePath)(o.note_path)),await f.exists(_)&&!await this.confirmOverwrite(_)){new d.Notice("Import canceled.");return}try{await this.ensureFolder(N),await this.ensureFolder(T),await this.ensureFolder(this.settings.outputNoteDir),this.settings.copyPdfToVault&&await this.ensureFolder(this.settings.outputPdfDir)}catch(g){new d.Notice("Failed to create output folders."),console.error(g),this.clearStatusProgress();return}let b="",k="";try{if(this.settings.copyPdfToVault){let g=i.filePath?await O.promises.readFile(i.filePath):await this.downloadZoteroPdf(i.key);await this.app.vault.adapter.writeBinary(u,this.bufferToArrayBuffer(g)),b=this.getAbsoluteVaultPath(u)}else if(i.filePath)b=i.filePath;else{await this.ensureFolder(this.settings.outputPdfDir);let g=await this.downloadZoteroPdf(i.key);await this.app.vault.adapter.writeBinary(u,this.bufferToArrayBuffer(g)),b=this.getAbsoluteVaultPath(u),new d.Notice("Local PDF path unavailable; copied PDF into vault for processing.")}k=this.buildPdfLinkForNote(b,i.key,n)}catch(g){new d.Notice("Failed to download PDF attachment."),console.error(g),this.clearStatusProgress();return}try{await this.app.vault.adapter.write(m,JSON.stringify(e,null,2))}catch(g){new d.Notice("Failed to write Zotero item JSON."),console.error(g),this.clearStatusProgress();return}let v=this.getPluginDir(),w=y.default.join(v,"tools","docling_extract.py"),D=y.default.join(v,"tools","index_redisearch.py"),C=null;try{C=await this.readDoclingQualityLabelFromPdf(b,r),this.showStatusProgress(this.formatStatusLabel("Docling extraction...",C),0),await this.runPythonStreaming(w,this.buildDoclingArgs(b,n,h,_,r,!0),g=>this.handleDoclingProgress(g,C),()=>{}),C=await this.readDoclingQualityLabel(h),await this.annotateChunkJsonWithAttachmentKey(h,i.key)}catch(g){new d.Notice("Docling extraction failed. See console for details."),console.error(g),this.clearStatusProgress();return}try{this.showStatusProgress(this.formatStatusLabel("Indexing chunks...",C),0),await this.runPythonStreaming(D,["--chunks-json",this.getAbsoluteVaultPath(h),"--redis-url",this.settings.redisUrl,"--index",this.settings.redisIndex,"--prefix",this.settings.redisPrefix,"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--progress"],g=>{if((g==null?void 0:g.type)==="progress"&&g.total){let E=Math.round(g.current/g.total*100),F=this.formatStatusLabel(`Indexing chunks ${g.current}/${g.total}`,C);this.showStatusProgress(F,E)}},()=>{})}catch(g){new d.Notice("RedisSearch indexing failed. See console for details."),console.error(g),this.clearStatusProgress();return}try{let g=await this.app.vault.adapter.read(_),E=this.buildNoteMarkdown(t,(I=e.meta)!=null?I:{},n,k,m,g);await this.app.vault.adapter.write(_,E)}catch(g){new d.Notice("Failed to finalize note markdown."),console.error(g),this.clearStatusProgress();return}try{await this.updateDocIndex({doc_id:n,note_path:_,note_title:l,zotero_title:a,pdf_path:b,attachment_key:i.key})}catch(g){console.error("Failed to update doc index",g)}this.showStatusProgress("Done",100),window.setTimeout(()=>this.clearStatusProgress(),1200),new d.Notice(`Indexed Zotero item ${n}.`)}async askZoteroLibrary(){await this.openChatView(!0)}getChatLeaf(){var t;let e=this.app.workspace.getLeavesOfType(q);return e.length>0?e[0]:this.settings.chatPaneLocation==="right"?(t=this.app.workspace.getRightLeaf(!1))!=null?t:this.app.workspace.getLeaf("split"):this.app.workspace.getLeaf("tab")}async openChatView(e=!1){let t=this.getChatLeaf();await t.setViewState({type:q,active:!0}),this.app.workspace.revealLeaf(t);let n=t.view;return n instanceof $&&e&&n.focusInput(),n}async loadChatHistory(){let e=await this.getActiveChatSessionId();return this.loadChatHistoryForSession(e)}async saveChatHistory(e){let t=await this.getActiveChatSessionId();await this.saveChatHistoryForSession(t,e)}getChatSessionsDir(){return(0,d.normalizePath)(`${R}/chats`)}getChatExportDir(){let e=(this.settings.chatOutputDir||"").trim();return e?(0,d.normalizePath)(e):(0,d.normalizePath)("zotero/chats")}getChatSessionsIndexPath(){return(0,d.normalizePath)(`${this.getChatSessionsDir()}/index.json`)}getChatSessionPath(e){return(0,d.normalizePath)(`${this.getChatSessionsDir()}/${e}.json`)}async listChatSessions(){await this.migrateLegacyChatHistory();let e=this.app.vault.adapter,t=this.getChatSessionsIndexPath();if(!await e.exists(t)){let n=new Date().toISOString(),s=[{id:"default",name:"New chat",createdAt:n,updatedAt:n}];return await this.writeChatSessionsIndex({version:1,active:"default",sessions:s}),s}try{let n=await e.read(t),s=JSON.parse(n);return(Array.isArray(s==null?void 0:s.sessions)?s.sessions:[]).filter(i=>i&&typeof i.id=="string").map(i=>({id:String(i.id),name:typeof i.name=="string"&&i.name.trim()?i.name.trim():String(i.id),createdAt:typeof i.createdAt=="string"?i.createdAt:new Date().toISOString(),updatedAt:typeof i.updatedAt=="string"?i.updatedAt:new Date().toISOString()}))}catch(n){return console.warn("Failed to read chat sessions index",n),[]}}async getActiveChatSessionId(){await this.migrateLegacyChatHistory();let e=this.app.vault.adapter,t=this.getChatSessionsIndexPath();if(!await e.exists(t))return"default";try{let n=await e.read(t),s=JSON.parse(n);return(typeof(s==null?void 0:s.active)=="string"?s.active:"default")||"default"}catch(n){return"default"}}async setActiveChatSessionId(e){var i,a;await this.migrateLegacyChatHistory();let t=await this.readChatSessionsIndex(),n=((i=t.sessions)!=null?i:[]).some(o=>o.id===e),s=new Date().toISOString(),r=n?t.sessions:[...(a=t.sessions)!=null?a:[],{id:e,name:e,createdAt:s,updatedAt:s}];await this.writeChatSessionsIndex({version:1,active:e,sessions:r})}async createChatSession(e){var a;await this.migrateLegacyChatHistory();let t=this.generateChatId(),n=new Date().toISOString(),s=(e||"").trim()||"New chat",i=[...(a=(await this.readChatSessionsIndex()).sessions)!=null?a:[],{id:t,name:s,createdAt:n,updatedAt:n}];return await this.ensureFolder(this.getChatSessionsDir()),await this.app.vault.adapter.write(this.getChatSessionPath(t),JSON.stringify({version:1,messages:[]},null,2)),await this.writeChatSessionsIndex({version:1,active:t,sessions:i}),t}async renameChatSession(e,t){var i,a;await this.migrateLegacyChatHistory();let n=(t||"").trim();if(!n)return;let s=await this.readChatSessionsIndex(),r=((i=s.sessions)!=null?i:[]).map(o=>o.id===e?{...o,name:n}:o);await this.writeChatSessionsIndex({version:1,active:(a=s.active)!=null?a:"default",sessions:r})}async deleteChatSession(e){var a;if(await this.migrateLegacyChatHistory(),!e)return;let t=this.app.vault.adapter,n=await this.readChatSessionsIndex(),s=(a=n.sessions)!=null?a:[];if(s.length<=1)return;let r=s.filter(o=>o.id!==e);if(!r.length)return;let i=n.active===e?r[0].id:n.active;try{await t.remove(this.getChatSessionPath(e))}catch(o){console.warn("Failed to delete chat session file",o)}await this.writeChatSessionsIndex({version:1,active:i,sessions:r})}async loadChatHistoryForSession(e){await this.migrateLegacyChatHistory();let t=this.app.vault.adapter,n=this.getChatSessionPath(e||"default");if(!await t.exists(n))return[];let s=await t.read(n),r;try{r=JSON.parse(s)}catch(a){return[]}let i=Array.isArray(r)?r:r==null?void 0:r.messages;return Array.isArray(i)?i.filter(a=>a&&typeof a.content=="string").map(a=>({id:a.id||this.generateChatId(),role:a.role==="assistant"?"assistant":"user",content:a.content,citations:Array.isArray(a.citations)?a.citations:[],retrieved:Array.isArray(a.retrieved)?a.retrieved:[],createdAt:a.createdAt||new Date().toISOString()})):[]}async saveChatHistoryForSession(e,t){var c,l;await this.migrateLegacyChatHistory(),await this.ensureFolder(this.getChatSessionsDir());let n=this.app.vault.adapter,s=this.getChatSessionPath(e||"default"),r={version:1,messages:t};await n.write(s,JSON.stringify(r,null,2));let i=await this.readChatSessionsIndex(),a=new Date().toISOString(),o=((c=i.sessions)!=null?c:[]).map(u=>u.id===e?{...u,updatedAt:a}:u);await this.writeChatSessionsIndex({version:1,active:(l=i.active)!=null?l:e,sessions:o})}getRecentChatHistory(e){let t=Math.max(0,this.settings.chatHistoryMessages||0);return t?e.filter(s=>{var r;return s&&((r=s.content)==null?void 0:r.trim())}).slice(-t):[]}async readChatSessionsIndex(){let e=this.app.vault.adapter,t=this.getChatSessionsIndexPath(),n=new Date().toISOString();if(!await e.exists(t))return{version:1,active:"default",sessions:[{id:"default",name:"New chat",createdAt:n,updatedAt:n}]};try{let s=await e.read(t),r=JSON.parse(s),i=Array.isArray(r==null?void 0:r.sessions)?r.sessions:[];return{version:1,active:typeof(r==null?void 0:r.active)=="string"?r.active:"default",sessions:i.map(a=>({id:String(a.id),name:typeof a.name=="string"&&a.name.trim()?a.name.trim():String(a.id),createdAt:typeof a.createdAt=="string"?a.createdAt:n,updatedAt:typeof a.updatedAt=="string"?a.updatedAt:n}))}}catch(s){return console.warn("Failed to parse chat sessions index",s),{version:1,active:"default",sessions:[{id:"default",name:"New chat",createdAt:n,updatedAt:n}]}}}async writeChatSessionsIndex(e){await this.ensureFolder(this.getChatSessionsDir()),await this.app.vault.adapter.write(this.getChatSessionsIndexPath(),JSON.stringify(e,null,2))}async migrateLegacyChatHistory(){let e=this.app.vault.adapter,t=(0,d.normalizePath)(`${R}/chat.json`),n=this.getChatSessionsDir(),s=this.getChatSessionsIndexPath(),r=this.getChatSessionPath("default"),i=await e.exists(t),a=await e.exists(r),o=await e.exists(s);if(!i&&o)return;let c=new Date().toISOString();if(await this.ensureFolder(n),i&&!a)try{await e.rename(t,r)}catch(l){try{let u=await e.read(t);await e.write(r,u),await e.remove(t)}catch(u){console.warn("Failed to migrate legacy chat history",u)}}if(!o){let l=[{id:"default",name:"New chat",createdAt:c,updatedAt:c}];await this.writeChatSessionsIndex({version:1,active:"default",sessions:l})}if(o)try{let l=await e.read(s),u=JSON.parse(l),m=Array.isArray(u==null?void 0:u.sessions)?u.sessions:[],h=m.some(_=>(_==null?void 0:_.id)==="default"),f=m.map(_=>(_==null?void 0:_.id)==="default"&&typeof(_==null?void 0:_.name)=="string"&&_.name.trim().toLowerCase()==="default"?{..._,name:"New chat"}:_);h&&JSON.stringify(f)!==JSON.stringify(m)&&await this.writeChatSessionsIndex({version:1,active:typeof(u==null?void 0:u.active)=="string"?u.active:"default",sessions:f.map(_=>({id:String(_.id),name:typeof _.name=="string"?_.name:"New chat",createdAt:typeof _.createdAt=="string"?_.createdAt:c,updatedAt:typeof _.updatedAt=="string"?_.updatedAt:c}))})}catch(l){}}isPlaceholderChatName(e){let t=(e||"").trim().toLowerCase();return t==="new chat"||t==="default"}normalizeChatTitle(e){let t=(e||"").replace(/\s+/g," ").trim();return t.length>60?`${t.slice(0,57)}...`:t}guessTitleFromMessages(e){let t=e.find(s=>s.role==="user"&&s.content.trim());if(!t)return"New chat";let n=t.content.replace(/\s+/g," ").trim().split(" ").slice(0,8).join(" ");return this.normalizeChatTitle(n||"New chat")}async suggestChatTitleWithLlm(e){var s,r,i;let t=(this.settings.chatBaseUrl||"").trim(),n=(this.settings.chatModel||"").trim();if(!t||!n)return null;try{let a=`${t.replace(/\/$/,"")}/chat/completions`,o={"Content-Type":"application/json"};this.settings.chatApiKey&&(o.Authorization=`Bearer ${this.settings.chatApiKey}`);let c=e.slice(-8).map(f=>`${f.role.toUpperCase()}: ${f.content}`).join(`
`).slice(0,4e3),u=await fetch(a,{method:"POST",headers:o,body:JSON.stringify({model:n,temperature:.2,messages:[{role:"system",content:"Generate a short, specific title (3-7 words) for the chat. No quotes, no punctuation at the end."},{role:"user",content:c}]})});if(!u.ok)return null;let m=await u.json(),h=(i=(r=(s=m==null?void 0:m.choices)==null?void 0:s[0])==null?void 0:r.message)==null?void 0:i.content;return typeof h!="string"?null:this.normalizeChatTitle(h.replace(/^\"|\"$/g,"").trim())}catch(a){return console.warn("Chat title suggestion failed",a),null}}async finalizeChatSessionNameIfNeeded(e,t,n={}){var l;if(!e)return;let s=t||[];if(!s.some(u=>u.role==="user"&&u.content.trim())||!n.force&&s.length<4)return;let a=((l=(await this.readChatSessionsIndex()).sessions)!=null?l:[]).find(u=>u.id===e);if(!a||!this.isPlaceholderChatName(a.name))return;let c=await this.suggestChatTitleWithLlm(s)||this.guessTitleFromMessages(s);!c||this.isPlaceholderChatName(c)||await this.renameChatSession(e,c)}async runRagQueryStreaming(e,t,n,s=[]){await this.ensureBundledTools();let r=this.getPluginDir(),i=y.default.join(r,"tools","rag_query_redisearch.py"),a=["--query",e,"--k","5","--redis-url",this.settings.redisUrl,"--index",this.settings.redisIndex,"--prefix",this.settings.redisPrefix,"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--chat-base-url",this.settings.chatBaseUrl,"--chat-api-key",this.settings.chatApiKey,"--chat-model",this.settings.chatModel,"--temperature",String(this.settings.chatTemperature),"--stream"],o=this.buildChatHistoryPayload(s),c=await this.writeChatHistoryTemp(o);c!=null&&c.absolutePath&&a.push("--history-file",c.absolutePath);try{await this.runPythonStreaming(i,a,l=>{if((l==null?void 0:l.type)==="delta"&&typeof l.content=="string"){t(l.content);return}if((l==null?void 0:l.type)==="final"){n(l);return}l!=null&&l.answer&&n(l)},n)}finally{if(c!=null&&c.relativePath)try{await this.app.vault.adapter.remove(c.relativePath)}catch(l){console.warn("Failed to remove chat history temp file",l)}}}buildChatHistoryPayload(e){return this.getRecentChatHistory(e).map(n=>({role:n.role,content:n.content}))}async writeChatHistoryTemp(e){if(!e.length)return null;let t=(0,d.normalizePath)(`${R}/tmp`);await this.ensureFolder(t);let n=`chat_history_${Date.now()}_${Math.random().toString(36).slice(2,8)}.json`,s=(0,d.normalizePath)(`${t}/${n}`),r={version:1,messages:e};return await this.app.vault.adapter.write(s,JSON.stringify(r,null,2)),{relativePath:s,absolutePath:this.getAbsoluteVaultPath(s)}}async resolveCitationDisplay(e){var m,h;let t=await this.getDocIndexEntry(e.doc_id);(!t||!t.note_title||!t.zotero_title||!t.note_path||!t.pdf_path)&&(t=await this.hydrateDocIndexFromCache(e.doc_id));let n=e.doc_id?await this.resolveNotePathForDocId(e.doc_id):t==null?void 0:t.note_path,s=(t==null?void 0:t.zotero_title)||(t==null?void 0:t.note_title)||(n?y.default.basename(n,".md"):e.doc_id||"?"),r=e.pages||`${(m=e.page_start)!=null?m:"?"}-${(h=e.page_end)!=null?h:"?"}`,i=r.includes("-")?r.replace("-"," - "):r,a=e.page_start?String(e.page_start):"",o=(t==null?void 0:t.pdf_path)||e.source_pdf||"",c=e.attachment_key||(t==null?void 0:t.attachment_key),l=e.annotation_key||this.extractAnnotationKey(e.chunk_id),u=e.doc_id?this.buildZoteroDeepLink(e.doc_id,c,a,l):void 0;return{noteTitle:s,pageLabel:i,notePath:n||void 0,pdfPath:o||void 0,zoteroUrl:u,pageStart:a||void 0}}async formatInlineCitations(e,t,n=[]){if(!e)return e;let s=/\[\[?cite:([A-Za-z0-9]+):([^\]\n]+?)\]?\]/g,r=Array.from(e.matchAll(s));if(r.length===0)return e;let i=new Map;for(let o of r){let c=o[0];if(i.has(c))continue;let l=o[1],u=o[2].trim(),m=u.match(/^(\d+)-(\d+)(?::([A-Za-z0-9]+))?$/),h="",f="",_,b;m?(h=m[1],f=m[2],_=m[3]):b=u;let k=b?n.find(C=>{let A=typeof C.doc_id=="string"?C.doc_id:"";if(A&&A!==l)return!1;let S=typeof C.chunk_id=="string"?C.chunk_id:"";return S?S===b||S===`${l}:${b}`||S.endsWith(`:${b}`):!1}):void 0;k&&(!h&&k.page_start!==void 0&&(h=String(k.page_start)),!f&&k.page_end!==void 0&&(f=String(k.page_end)),!_&&typeof k.chunk_id=="string"&&(_=this.extractAnnotationKey(k.chunk_id)));let v={doc_id:l,chunk_id:k==null?void 0:k.chunk_id,annotation_key:_};(h||f)&&(v.page_start=h||f,v.page_end=f||h,v.pages=`${v.page_start}-${v.page_end}`),k!=null&&k.source_pdf&&(v.source_pdf=String(k.source_pdf));let w=(h||f?t.find(C=>{var A,S;return C.doc_id===l&&String((A=C.page_start)!=null?A:"")===h&&String((S=C.page_end)!=null?S:"")===f}):void 0)||t.find(C=>C.doc_id===l)||v;!w.annotation_key&&_&&(w={...w,annotation_key:_});let D=await this.resolveCitationDisplay(w);if(D.zoteroUrl){let C=`${D.noteTitle} p. ${D.pageLabel}`;i.set(c,`[${C}](${D.zoteroUrl})`)}else{let C=D.pageLabel?`${l} p. ${D.pageLabel}`:`${l}`;i.set(c,`(${C})`)}}let a=e;for(let[o,c]of i)a=a.split(o).join(c);return a}handleDoclingProgress(e,t){if(!e||e.type!=="progress")return;let n=Number(e.percent);if(!Number.isFinite(n))return;let s=typeof e.message=="string"&&e.message.trim()?e.message:"Docling extraction...";this.showStatusProgress(this.formatStatusLabel(s,t),Math.round(n))}async createChatNoteFromSession(e,t,n){let s=this.getChatExportDir();await this.ensureFolder(s),await this.getDocIndex();let r=this.sanitizeFileName(t)||"Zotero Chat",i=this.formatTimestamp(new Date),a=(0,d.normalizePath)(`${s}/${r}.md`),o=await this.resolveUniqueNotePath(a,`${r}-${i}.md`),c=await this.buildChatTranscript(t,n);await this.app.vault.adapter.write(o,c),await this.openNoteInNewTab(o),new d.Notice(`Chat copied to ${o}`)}async buildChatTranscript(e,t){var s,r,i;let n=[];n.push(`# ${e||"Zotero Chat"}`),n.push(""),n.push(`Created: ${new Date().toISOString()}`),n.push("");for(let a of t){let o=a.role==="user"?"## You":"## Assistant";n.push(o),n.push("");let c=a.role==="assistant"?await this.formatInlineCitations(a.content||"",(s=a.citations)!=null?s:[],(r=a.retrieved)!=null?r:[]):a.content||"";if(n.push(c.trim()),n.push(""),a.role==="assistant"&&((i=a.citations)!=null&&i.length)){n.push("### Relevant context sources");let l=this.formatCitationsMarkdown(a.citations);l&&(n.push(l),n.push(""))}}return n.join(`
`).trim()+`
`}async resolveUniqueNotePath(e,t){let n=this.app.vault.adapter;if(!await n.exists(e))return e;let s=y.default.dirname(e),r=(0,d.normalizePath)(y.default.join(s,t));if(!await n.exists(r))return r;let i=2;for(;i<1e3;){let a=(0,d.normalizePath)(y.default.join(s,`${y.default.basename(t,".md")}-${i}.md`));if(!await n.exists(a))return a;i+=1}return r}formatTimestamp(e){let t=n=>String(n).padStart(2,"0");return[e.getFullYear(),t(e.getMonth()+1),t(e.getDate()),"-",t(e.getHours()),t(e.getMinutes())].join("")}async openCitationTarget(e,t){let n=t!=null?t:await this.resolveCitationDisplay(e);if(n.notePath){await this.openNoteInMain(n.notePath);return}if(!(n.pdfPath&&await this.openPdfInMain(n.pdfPath,n.pageStart))){if(n.zoteroUrl){this.openExternalUrl(n.zoteroUrl);return}new d.Notice("Unable to open citation target.")}}async rebuildNoteFromCache(){let e=await this.promptDocId();if(!e){new d.Notice("No doc_id provided.");return}await this.rebuildNoteFromCacheForDocId(e,!0)&&new d.Notice(`Rebuilt Zotero note for ${e}.`)}async rebuildDocIndexFromCache(){var c,l,u;let e=this.app.vault.adapter,t=await this.listDocIds(N),n=await this.listDocIds(T),s=await this.scanNotesForDocIds(this.settings.outputNoteDir),r=Object.keys(s),i=Array.from(new Set([...t,...n,...r]));if(i.length===0){new d.Notice("No cached items found.");return}this.showStatusProgress("Rebuilding doc index...",0);let a=await this.getDocIndex(),o=0;for(let m of i){o+=1;let h={},f=s[m];f&&(h.note_path=f.note_path,h.note_title=f.note_title);let _=(0,d.normalizePath)(`${N}/${m}.json`);if(await e.exists(_))try{let v=await e.read(_),w=JSON.parse(v),D=(l=(c=w==null?void 0:w.data)!=null?c:w)!=null?l:{},C=typeof D.title=="string"?D.title:"";C&&(h.zotero_title=C);let A=this.sanitizeFileName(C)||m,S=(0,d.normalizePath)(`${this.settings.outputNoteDir}/${A}.md`),I=(0,d.normalizePath)(`${this.settings.outputNoteDir}/${A}-${m}.md`);await e.exists(S)?(h.note_path=S,h.note_title=y.default.basename(S,".md")):await e.exists(I)&&(h.note_path=I,h.note_title=y.default.basename(I,".md"))}catch(v){console.error("Failed to read cached item JSON",v)}let b=(0,d.normalizePath)(`${T}/${m}.json`);if(await e.exists(b))try{let v=await e.read(b),w=JSON.parse(v);typeof(w==null?void 0:w.source_pdf)=="string"&&(h.pdf_path=w.source_pdf)}catch(v){console.error("Failed to read cached chunks JSON",v)}if(Object.keys(h).length>0){let w={...(u=a[m])!=null?u:{doc_id:m},...h,doc_id:m,updated_at:new Date().toISOString()};!w.note_title&&w.note_path&&(w.note_title=y.default.basename(w.note_path,".md")),a[m]=w}let k=Math.round(o/i.length*100);this.showStatusProgress(`Rebuilding doc index ${o}/${i.length}`,k)}await this.saveDocIndex(a),this.showStatusProgress("Done",100),window.setTimeout(()=>this.clearStatusProgress(),1200),new d.Notice(`Rebuilt doc index for ${i.length} items.`)}async recreateMissingNotesFromCache(){let e=this.app.vault.adapter,t=await this.listDocIds(N),n=await this.listDocIds(T),s=await this.scanNotesForDocIds(this.settings.outputNoteDir),r=Object.keys(s),i=Array.from(new Set([...t,...n,...r]));if(i.length===0){new d.Notice("No cached items found.");return}let a=[];for(let c of i){if(s[c])continue;let l=await this.getDocIndexEntry(c);if(l!=null&&l.note_path&&await e.exists(l.note_path))continue;let u=await this.inferNotePathFromCache(c);u&&await e.exists(u)||a.push(c)}if(a.length===0){new d.Notice("No missing notes detected.");return}this.showStatusProgress("Recreating missing notes...",0);let o=0;for(let c=0;c<a.length;c+=1){let l=a[c],u=Math.round((c+1)/a.length*100);this.showStatusProgress(`Recreating ${c+1}/${a.length}`,u),await this.rebuildNoteFromCacheForDocId(l,!1)&&(o+=1)}this.showStatusProgress("Done",100),window.setTimeout(()=>this.clearStatusProgress(),1200),new d.Notice(`Recreated ${o}/${a.length} missing notes.`)}async reindexRedisFromCache(){try{await this.ensureBundledTools()}catch(i){new d.Notice("Failed to sync bundled tools. See console for details."),console.error(i);return}let e=await this.listDocIds(T);if(e.length===0){new d.Notice("No cached chunks found.");return}let t=this.getPluginDir(),n=y.default.join(t,"tools","index_redisearch.py"),s=0,r=0;this.showStatusProgress("Reindexing cached chunks...",0);for(let i of e){s+=1;let a=Math.round(s/e.length*100);this.showStatusProgress(`Reindexing ${s}/${e.length}`,a);let o=(0,d.normalizePath)(`${T}/${i}.json`);try{await this.runPython(n,["--chunks-json",this.getAbsoluteVaultPath(o),"--redis-url",this.settings.redisUrl,"--index",this.settings.redisIndex,"--prefix",this.settings.redisPrefix,"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--upsert"])}catch(c){r+=1,console.error(`Failed to reindex ${i}`,c)}}this.showStatusProgress("Done",100),window.setTimeout(()=>this.clearStatusProgress(),1200),r===0?new d.Notice(`Reindexed ${e.length} cached items.`):new d.Notice(`Reindexed ${e.length-r}/${e.length} items (see console).`)}async promptZoteroItem(){return new Promise(e=>{new Q(this.app,this,e).open()})}async listDocIds(e){let t=this.app.vault.adapter,n=(0,d.normalizePath)(e);return await t.exists(n)?(await t.list(n)).files.filter(r=>r.endsWith(".json")).map(r=>y.default.basename(r,".json")):[]}async listMarkdownFiles(e){let t=this.app.vault.adapter,n=(0,d.normalizePath)(e);if(!await t.exists(n))return[];let s=[n],r=[];for(;s.length>0;){let i=s.pop();if(!i)continue;let a=await t.list(i);for(let o of a.files)o.endsWith(".md")&&r.push(o);for(let o of a.folders)s.push(o)}return r}extractDocIdFromFrontmatter(e){let t=e.match(/^---\s*\n([\s\S]*?)\n---/);if(!t)return null;let s=t[1].split(/\r?\n/);for(let r of s){let i=r.trim();if(!i||i.startsWith("#"))continue;let a=i.split(":");if(a.length<2)continue;let o=a[0].trim().toLowerCase();if(o!=="doc_id"&&o!=="zotero_key")continue;let l=i.slice(i.indexOf(":")+1).trim().replace(/^["']|["']$/g,"").trim();if(l)return l}return null}async scanNotesForDocIds(e){let t=this.app.vault.adapter,n=await this.listMarkdownFiles(e),s={};for(let r of n)try{let i=await t.read(r),a=this.extractDocIdFromFrontmatter(i);if(!a)continue;s[a]={doc_id:a,note_path:r,note_title:y.default.basename(r,".md"),updated_at:new Date().toISOString()}}catch(i){console.error("Failed to read note for doc_id scan",i)}return s}setupStatusBar(){let e=this.addStatusBarItem();e.addClass("zrr-status-progress"),e.addClass("status-bar-item-segment"),e.style.display="none";let t=e.createEl("span",{text:"Idle"});t.addClass("zrr-status-label");let s=e.createEl("div",{cls:"zrr-status-bar"}).createEl("div",{cls:"zrr-status-bar-inner"});this.statusBarEl=e,this.statusLabelEl=t,this.statusBarInnerEl=s}showStatusProgress(e,t){if(!(!this.statusBarEl||!this.statusLabelEl||!this.statusBarInnerEl))if(this.statusBarEl.style.display="flex",this.statusLabelEl.setText(e),t===null)this.statusBarInnerEl.addClass("indeterminate"),this.statusBarInnerEl.style.width="40%";else{this.statusBarInnerEl.removeClass("indeterminate");let n=Math.max(0,Math.min(100,t));this.statusBarInnerEl.style.width=`${n}%`}}clearStatusProgress(){!this.statusBarEl||!this.statusBarInnerEl||(this.statusBarEl.style.display="none",this.statusBarInnerEl.removeClass("indeterminate"),this.statusBarInnerEl.style.width="0%")}formatStatusLabel(e,t){return t?`${e} (Text layer quality ${t})`:e}async readDoclingQualityLabel(e){var t;try{let n=await this.app.vault.adapter.read(e),s=JSON.parse(n),r=(t=s==null?void 0:s.metadata)==null?void 0:t.confidence_proxy;if(typeof r=="number")return r.toFixed(2)}catch(n){console.warn("Failed to read Docling quality metadata",n)}return null}async readDoclingQualityLabelFromPdf(e,t){try{let n=this.getPluginDir(),s=y.default.join(n,"tools","docling_extract.py"),r=this.settings.ocrMode==="force_low_quality"?"auto":this.settings.ocrMode,i=["--quality-only","--pdf",e,"--ocr",r];this.settings.ocrMode==="force_low_quality"&&i.push("--force-ocr-low-quality"),i.push("--quality-threshold",String(this.settings.ocrQualityThreshold)),t&&i.push("--language-hint",t);let a=await this.runPythonWithOutput(s,i),o=JSON.parse(a),c=o==null?void 0:o.confidence_proxy;if(typeof c=="number")return c.toFixed(2)}catch(n){console.warn("Failed to read Docling quality from PDF",n)}return null}async promptDocId(){return new Promise(e=>{new j(this.app,"Rebuild Zotero note from cache","Enter Zotero doc_id (e.g., ABC123)",t=>e(t),"Doc ID cannot be empty.").open()})}async promptLanguageHint(){return new Promise(e=>{new K(this.app,e).open()})}registerRibbonIcons(){(0,d.addIcon)("zrr-picker",ge),(0,d.addIcon)("zrr-chat",he),this.addRibbonIcon("zrr-picker","Import Zotero item and index",()=>this.importZoteroItem()).addClass("zrr-ribbon-picker"),this.addRibbonIcon("zrr-chat","Open Zotero RAG chat",()=>this.openChatView(!0)).addClass("zrr-ribbon-chat")}async confirmOverwrite(e){return new Promise(t=>{new J(this.app,e,t).open()})}async resolveLanguageHint(e,t){let n=typeof e.language=="string"?e.language:"",s=this.normalizeZoteroLanguage(n);if(s)return s;let r=await this.promptLanguageHint();if(r===null)return console.info("Language selection canceled."),null;let i=this.normalizeZoteroLanguage(r);if(!i)return console.info("Language selection empty; skipping Zotero update."),"";if(e.language=i,console.info("Language selected",{language:i,itemKey:t}),t)try{await this.updateZoteroItemLanguage(t,e,i),new d.Notice("Saved language to Zotero.")}catch(a){new d.Notice("Failed to write language back to Zotero."),console.error(a)}else console.warn("Language selected but itemKey is missing; skipping Zotero update.");return i}normalizeZoteroLanguage(e){return(e||"").trim().toLowerCase()}buildDoclingLanguageHint(e){let t=this.normalizeZoteroLanguage(e!=null?e:"");if(!t)return null;let n=t.split(/[^a-z]+/).filter(Boolean),s=n.some(i=>["de","deu","ger","german"].includes(i)),r=n.some(i=>["en","eng","english"].includes(i));return s&&r?"deu+eng":s?"deu":r?"eng":n.length===1&&ne[n[0]]?ne[n[0]]:t}async fetchZoteroItem(e){try{let t=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}`),n=await this.requestLocalApi(t,`Zotero item fetch failed for ${t}`);return JSON.parse(n.toString("utf8"))}catch(t){return console.warn("Failed to fetch Zotero item from local API",t),this.canUseWebApi()?this.fetchZoteroItemWeb(e):null}}async fetchZoteroItemWeb(e){try{let t=this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/items/${e}`),n=await this.requestWebApi(t,`Zotero Web API fetch failed for ${t}`);return JSON.parse(n.toString("utf8"))}catch(t){return console.warn("Failed to fetch Zotero item from Web API",t),null}}async searchZoteroItemsWeb(e){let t=new URLSearchParams;t.set("itemType","-attachment"),t.set("limit","25"),t.set("include","data,meta"),e.trim()&&t.set("q",e.trim());let n=this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/items?${t.toString()}`),s=await this.requestWebApi(n,`Zotero Web API search failed for ${n}`),r=JSON.parse(s.toString("utf8"));return Array.isArray(r)?r.map(i=>{var a,o,c,l;return{key:(o=i.key)!=null?o:(a=i.data)==null?void 0:a.key,data:(c=i.data)!=null?c:{},meta:(l=i.meta)!=null?l:{}}}).filter(i=>typeof i.key=="string"&&i.key.trim().length>0):[]}async updateZoteroItemLanguage(e,t,n){try{await this.updateZoteroItemLanguageLocal(e,t,n);return}catch(s){if(!this.canUseWebApi())throw s;let r=s instanceof Error?s.message:String(s);console.info("Local Zotero write failed; trying Web API",{itemKey:e,reason:r}),await this.updateZoteroItemLanguageWeb(e,t,n)}}async updateZoteroItemLanguageLocal(e,t,n){var k,v,w,D,C,A;let s=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}`),r={...t,language:n},i={"Content-Type":"application/json","Zotero-API-Version":"3"},a=typeof r.version=="number"?r.version:Number(r.version);Number.isNaN(a)||(i["If-Unmodified-Since-Version"]=String(a)),console.info("Zotero language PUT",{url:s,itemKey:e,language:n});try{let S=await this.requestLocalApiWithBody(s,"PUT",r,i,`Zotero update failed for ${s}`);console.info("Zotero language PUT response",{status:S.statusCode})}catch(S){if(!(S instanceof Error?S.message:String(S)).includes("status 501"))throw S;let g=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items`);console.info("Zotero language PUT unsupported; trying POST",{postUrl:g});let E=await this.requestLocalApiWithBody(g,"POST",[r],i,`Zotero update failed for ${g}`);console.info("Zotero language POST response",{status:E.statusCode})}let o=await this.fetchZoteroItem(e);if(this.normalizeZoteroLanguage(typeof((k=o==null?void 0:o.data)==null?void 0:k.language)=="string"?o.data.language:"")===this.normalizeZoteroLanguage(n))return;let l={...(v=o==null?void 0:o.data)!=null?v:t,language:n},u={key:e,version:(C=(D=(w=o==null?void 0:o.data)==null?void 0:w.version)!=null?D:o==null?void 0:o.version)!=null?C:a,data:l},m={...i},h=typeof u.version=="number"?u.version:Number(u.version);Number.isNaN(h)?delete m["If-Unmodified-Since-Version"]:m["If-Unmodified-Since-Version"]=String(h);let f=await this.requestLocalApiWithBody(s,"PUT",u,m,`Zotero update failed for ${s}`);console.info("Zotero language PUT retry response",{status:f.statusCode});let _=await this.fetchZoteroItem(e);if(this.normalizeZoteroLanguage(typeof((A=_==null?void 0:_.data)==null?void 0:A.language)=="string"?_.data.language:"")!==this.normalizeZoteroLanguage(n))throw new Error("Language update did not persist in Zotero.")}async updateZoteroItemLanguageWeb(e,t,n){var f,_,b,k,v;let s=this.getWebApiLibraryPath();if(!s)throw new Error("Web API library path is not configured.");let r=this.buildWebApiUrl(`/${s}/items/${e}`),i=await this.fetchZoteroItemWeb(e),a={...(f=i==null?void 0:i.data)!=null?f:t,language:n},o={"Content-Type":"application/json","Zotero-API-Version":"3","Zotero-API-Key":this.settings.webApiKey},c=(k=(b=(_=i==null?void 0:i.data)==null?void 0:_.version)!=null?b:i==null?void 0:i.version)!=null?k:t==null?void 0:t.version,l=typeof c=="number"?c:Number(c);Number.isNaN(l)||(o["If-Unmodified-Since-Version"]=String(l)),console.info("Zotero Web API language PUT",{url:r,itemKey:e,language:n});let u=await this.requestWebApiWithBody(r,"PUT",a,o,`Zotero Web API update failed for ${r}`);console.info("Zotero Web API language PUT response",{status:u.statusCode});let m=await this.fetchZoteroItemWeb(e);if(this.normalizeZoteroLanguage(typeof((v=m==null?void 0:m.data)==null?void 0:v.language)=="string"?m.data.language:"")!==this.normalizeZoteroLanguage(n))throw new Error("Language update did not persist in Zotero Web API.")}getDocId(e){let t=[e.key,e.itemKey,e.id,e.citationKey];for(let n of t)if(typeof n=="string"&&n.trim())return n.trim();return null}sanitizeFileName(e){let t=e.replace(/[\\/:*?"<>|]/g,"").replace(/\s+/g," ").trim();return t?t.replace(/[.]+$/g,"").trim().slice(0,120):""}registerNoteRenameHandler(){this.registerEvent(this.app.vault.on("rename",async e=>{if(!(!(e instanceof d.TFile)||e.extension!=="md"))try{let t=await this.app.vault.read(e),n=this.extractDocIdFromFrontmatter(t);if(!n)return;await this.updateDocIndex({doc_id:n,note_path:e.path,note_title:y.default.basename(e.path,".md")})}catch(t){console.warn("Failed to update doc index for renamed note",t)}}))}async resolveNotePathForDocId(e){if(!e)return null;let t=this.app.vault.adapter,n=await this.getDocIndexEntry(e);if(n!=null&&n.note_path&&await t.exists(n.note_path))return n.note_path;let r=(await this.scanNotesForDocIds(this.settings.outputNoteDir))[e];return r!=null&&r.note_path?(await this.updateDocIndex({doc_id:e,note_path:r.note_path,note_title:r.note_title}),r.note_path):null}async resolveUniqueBaseName(e,t){let n=this.app.vault.adapter,s=(0,d.normalizePath)(`${this.settings.outputNoteDir}/${e}.md`),r=(0,d.normalizePath)(`${this.settings.outputPdfDir}/${e}.pdf`),i=await n.exists(s),a=this.settings.copyPdfToVault?await n.exists(r):!1;return i||a?`${e}-${t}`:e}async searchZoteroItems(e){let t=new URLSearchParams;t.set("itemType","-attachment"),t.set("limit","25"),t.set("include","data,meta"),e.trim()&&t.set("q",e.trim());let n=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items?${t.toString()}`);try{let s=await this.requestLocalApi(n,`Zotero search failed for ${n}`),r=JSON.parse(s.toString("utf8"));return Array.isArray(r)?r.map(i=>{var a,o,c,l;return{key:(o=i.key)!=null?o:(a=i.data)==null?void 0:a.key,data:(c=i.data)!=null?c:{},meta:(l=i.meta)!=null?l:{}}}).filter(i=>typeof i.key=="string"&&i.key.trim().length>0):[]}catch(s){if(console.warn("Failed to search Zotero via local API",s),!this.canUseWebApi())throw s;return this.searchZoteroItemsWeb(e)}}async resolvePdfAttachment(e,t){let n=this.pickPdfAttachment(e);if(n)return n;try{let s=await this.fetchZoteroChildren(t);for(let r of s){let i=this.toPdfAttachment(r);if(i)return i}}catch(s){console.error("Failed to fetch Zotero children",s)}return null}pickPdfAttachment(e){var n,s,r;let t=(r=(s=(n=e.attachments)!=null?n:e.children)!=null?s:e.items)!=null?r:[];if(!Array.isArray(t))return null;for(let i of t){let a=this.toPdfAttachment(i);if(a)return a}return null}toPdfAttachment(e){var r,i,a,o,c,l;if(((a=(r=e==null?void 0:e.contentType)!=null?r:e==null?void 0:e.mimeType)!=null?a:(i=e==null?void 0:e.data)==null?void 0:i.contentType)!=="application/pdf")return null;let n=(l=(o=e==null?void 0:e.key)!=null?o:e==null?void 0:e.attachmentKey)!=null?l:(c=e==null?void 0:e.data)==null?void 0:c.key;if(!n)return null;let s=this.extractAttachmentPath(e);return s?{key:n,filePath:s}:{key:n}}extractAttachmentPath(e){var n,s,r,i,a,o,c,l;let t=(l=(i=(s=(n=e==null?void 0:e.links)==null?void 0:n.enclosure)==null?void 0:s.href)!=null?i:(r=e==null?void 0:e.enclosure)==null?void 0:r.href)!=null?l:(c=(o=(a=e==null?void 0:e.data)==null?void 0:a.links)==null?void 0:o.enclosure)==null?void 0:c.href;if(typeof t=="string"&&t.startsWith("file://"))try{return(0,z.fileURLToPath)(t)}catch(u){return null}return null}async fetchZoteroChildren(e){let t=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}/children`);try{let n=await this.requestLocalApi(t,`Zotero children request failed for ${t}`);return JSON.parse(n.toString("utf8"))}catch(n){if(console.warn("Failed to fetch Zotero children from local API",n),!this.canUseWebApi())throw n;let s=this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/items/${e}/children`),r=await this.requestWebApi(s,`Zotero Web API children request failed for ${s}`);return JSON.parse(r.toString("utf8"))}}async downloadZoteroPdf(e){let t=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}/file`);try{let n=await this.requestLocalApiRaw(t),s=await this.followFileRedirect(n);if(s)return s;if(n.statusCode>=300)throw new Error(`Request failed, status ${n.statusCode}`);return n.body}catch(n){if(console.warn("Failed to download PDF from local API",n),!this.canUseWebApi())throw n;let s=this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/items/${e}/file`),r=await this.requestWebApiRaw(s),i=await this.followFileRedirect(r);if(i)return i;if(r.statusCode>=300)throw new Error(`Web API request failed, status ${r.statusCode}`);return r.body}}buildZoteroUrl(e){return`${this.settings.zoteroBaseUrl.replace(/\/$/,"")}${e}`}canUseWebApi(){return!!((this.settings.webApiBaseUrl||"").trim()&&this.settings.webApiKey&&this.settings.webApiLibraryId)}getWebApiLibraryPath(){let e=(this.settings.webApiLibraryId||"").trim();return e?`${this.settings.webApiLibraryType==="group"?"groups":"users"}/${e}`:""}buildWebApiUrl(e){return`${this.settings.webApiBaseUrl.replace(/\/$/,"")}${e}`}requestLocalApiRaw(e,t={}){return new Promise((n,s)=>{var u,m;let r=new URL(e),i=r.protocol==="https:"?re.default:se.default,a=(u=t.method)!=null?u:"GET",o={Accept:"*/*",...(m=t.headers)!=null?m:{}},c=t.body;if(c!==void 0&&o["Content-Length"]===void 0){let h=Buffer.isBuffer(c)?c.length:Buffer.byteLength(c);o["Content-Length"]=String(h)}let l=i.request({method:a,hostname:r.hostname,port:r.port||void 0,path:`${r.pathname}${r.search}`,headers:o},h=>{let f=[];h.on("data",_=>f.push(Buffer.from(_))),h.on("end",()=>{var b;let _=Buffer.concat(f);n({statusCode:(b=h.statusCode)!=null?b:0,headers:h.headers,body:_})})});l.on("error",s),c!==void 0&&l.write(c),l.end()})}async requestLocalApi(e,t){let n=await this.requestLocalApiRaw(e);if(n.statusCode>=400){let s=n.body.toString("utf8");throw new Error(`${t!=null?t:"Request failed"}, status ${n.statusCode}: ${s||"no response body"}`)}if(n.statusCode>=300)throw new Error(`${t!=null?t:"Request failed"}, status ${n.statusCode}`);return n.body}async requestLocalApiWithBody(e,t,n,s,r){let i=JSON.stringify(n),a=await this.requestLocalApiRaw(e,{method:t,headers:s,body:i});if(a.statusCode>=400){let o=a.body.toString("utf8");throw new Error(`${r!=null?r:"Request failed"}, status ${a.statusCode}: ${o||"no response body"}`)}if(a.statusCode>=300)throw new Error(`${r!=null?r:"Request failed"}, status ${a.statusCode}`);return{statusCode:a.statusCode,body:a.body}}async requestWebApi(e,t){let n={"Zotero-API-Version":"3","Zotero-API-Key":this.settings.webApiKey},s=await this.requestLocalApiRaw(e,{headers:n});if(s.statusCode>=400){let r=s.body.toString("utf8");throw new Error(`${t!=null?t:"Request failed"}, status ${s.statusCode}: ${r||"no response body"}`)}if(s.statusCode>=300)throw new Error(`${t!=null?t:"Request failed"}, status ${s.statusCode}`);return s.body}requestWebApiRaw(e,t={}){var s;let n={"Zotero-API-Version":"3","Zotero-API-Key":this.settings.webApiKey,...(s=t.headers)!=null?s:{}};return this.requestLocalApiRaw(e,{...t,headers:n})}async requestWebApiWithBody(e,t,n,s,r){let i=JSON.stringify(n),a=await this.requestLocalApiRaw(e,{method:t,headers:s,body:i});if(a.statusCode>=400){let o=a.body.toString("utf8");throw new Error(`${r!=null?r:"Request failed"}, status ${a.statusCode}: ${o||"no response body"}`)}if(a.statusCode>=300)throw new Error(`${r!=null?r:"Request failed"}, status ${a.statusCode}`);return{statusCode:a.statusCode,body:a.body}}async followFileRedirect(e){if(e.statusCode<300||e.statusCode>=400)return null;let t=e.headers.location,n=Array.isArray(t)?t[0]:t;if(!n||typeof n!="string")return null;if(n.startsWith("file://")){let s=(0,z.fileURLToPath)(n);return O.promises.readFile(s)}return n.startsWith("http://")||n.startsWith("https://")?this.requestLocalApi(n):null}bufferToArrayBuffer(e){return e.buffer.slice(e.byteOffset,e.byteOffset+e.byteLength)}async annotateChunkJsonWithAttachmentKey(e,t){if(t)try{let n=await this.app.vault.adapter.read(e),s=JSON.parse(n);if(!s||typeof s!="object")return;let r=s.metadata&&typeof s.metadata=="object"?s.metadata:{};r.attachment_key=t,s.metadata=r,await this.app.vault.adapter.write(e,JSON.stringify(s,null,2))}catch(n){console.warn("Failed to annotate chunks JSON with attachment key",n)}}buildPdfLinkFromSourcePath(e){if(!e)return"";let t=y.default.normalize(this.getVaultBasePath()),n=y.default.normalize(e),s=t.endsWith(y.default.sep)?t:`${t}${y.default.sep}`;return n.startsWith(s)?`[[${(0,d.normalizePath)(y.default.relative(t,n))}]]`:`[PDF](${(0,z.pathToFileURL)(e).toString()})`}toVaultRelativePath(e){if(!e)return"";let t=y.default.normalize(this.getVaultBasePath()),n=y.default.normalize(e),s=t.endsWith(y.default.sep)?t:`${t}${y.default.sep}`;return n.startsWith(s)?(0,d.normalizePath)(y.default.relative(t,n)):""}buildPdfLinkForNote(e,t,n){return!e&&!t?"":!this.settings.copyPdfToVault&&t?`[PDF](${this.buildZoteroDeepLink(n!=null?n:"",t)})`:this.buildPdfLinkFromSourcePath(e)}getMainLeaf(){let e=new Set(this.app.workspace.getLeavesOfType(q)),t=this.app.workspace.getLeavesOfType("markdown").find(s=>!e.has(s));if(t)return t;let n=this.app.workspace.getLeaf(!1);return n&&!e.has(n)?n:this.app.workspace.getLeaf("tab")}async openNoteInMain(e){let t=(0,d.normalizePath)(e),n=this.app.vault.getAbstractFileByPath(t),s=this.getMainLeaf();if(n instanceof d.TFile){await s.openFile(n,{active:!0});return}await this.app.workspace.openLinkText(t,"",!1)}async openInternalLinkInMain(e){let t=this.getMainLeaf(),n=e.split("#")[0].trim(),s=n?this.app.metadataCache.getFirstLinkpathDest(n,""):null;if(s instanceof d.TFile){await t.openFile(s,{active:!0}),e.includes("#")&&(this.app.workspace.setActiveLeaf(t,{focus:!0}),await this.app.workspace.openLinkText(e,"",!1));return}this.app.workspace.setActiveLeaf(t,{focus:!0}),await this.app.workspace.openLinkText(e,"",!1)}async openNoteInNewTab(e){let t=(0,d.normalizePath)(e);await this.app.workspace.openLinkText(t,"","tab")}async openPdfInMain(e,t){if(!e)return!1;let n=y.default.normalize(this.getVaultBasePath()),s=y.default.normalize(e),r=n.endsWith(y.default.sep)?n:`${n}${y.default.sep}`;if(s.startsWith(r)){let i=(0,d.normalizePath)(y.default.relative(n,s)),a=t?`#page=${t}`:"";return await this.app.workspace.openLinkText(`${i}${a}`,"","tab"),!0}try{return window.open((0,z.pathToFileURL)(e).toString()),!0}catch(i){return!1}}openExternalUrl(e){e&&window.open(e)}buildZoteroDeepLink(e,t,n,s){if(t){let r=new URLSearchParams;n&&r.set("page",n),s&&r.set("annotation",s);let i=r.toString()?`?${r.toString()}`:"";return`zotero://open-pdf/library/items/${t}${i}`}return`zotero://select/library/items/${e}`}extractAnnotationKey(e){if(!e)return;let n=(e.includes(":")?e.split(":").slice(1).join(":"):e).trim().toUpperCase();if(/^[A-Z0-9]{8}$/.test(n))return n}formatCitationsMarkdown(e){return e.length?e.map(n=>this.formatCitationMarkdown(n)).filter(Boolean).join(`
`):""}formatCitationMarkdown(e){var h,f,_,b,k,v;let t=e.doc_id||"?",n=e.pages||`${(h=e.page_start)!=null?h:"?"}-${(f=e.page_end)!=null?f:"?"}`,s=`${t}`,r=n.includes("-")?n.replace("-"," - "):n,i=e.annotation_key||this.extractAnnotationKey(e.chunk_id),a=e.attachment_key||((b=(_=this.docIndex)==null?void 0:_[e.doc_id||""])==null?void 0:b.attachment_key),o=e.page_start?String(e.page_start):"",c=(v=(k=this.docIndex)==null?void 0:k[e.doc_id||""])!=null?v:null,l=(c==null?void 0:c.zotero_title)||(c==null?void 0:c.note_title)||s,u=c!=null&&c.note_path?(0,d.normalizePath)(c.note_path).replace(/\.md$/i,""):this.sanitizeFileName(l)||l,m=u&&u!==l?`[[${u}|${l}]]`:`[[${l}]]`;if(a){let w=this.buildZoteroDeepLink(t,a,o,i);return`- ${m}, p. [${r}](${w})`}return`- ${m}, p. ${r}`}generateChatId(){return typeof crypto!="undefined"&&"randomUUID"in crypto?crypto.randomUUID():`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}getDocIndexPath(){return(0,d.normalizePath)(`${R}/doc_index.json`)}async getDocIndex(){return this.docIndex?this.docIndex:(this.docIndex=await this.loadDocIndexFromDisk(),this.docIndex)}async loadDocIndexFromDisk(){var n;let e=this.app.vault.adapter,t=this.getDocIndexPath();if(!await e.exists(t))return{};try{let s=await e.read(t),r=JSON.parse(s);if(r&&typeof r=="object"){let i=(n=r.entries)!=null?n:r;if(Array.isArray(i)){let a={};for(let o of i)o!=null&&o.doc_id&&(a[String(o.doc_id)]=o);return a}if(i&&typeof i=="object")return i}}catch(s){console.error("Failed to read doc index",s)}return{}}async saveDocIndex(e){await this.ensureFolder(R);let t=this.app.vault.adapter,n=this.getDocIndexPath(),s={version:1,entries:e};await t.write(n,JSON.stringify(s,null,2)),this.docIndex=e}async updateDocIndex(e){var r;let t=await this.getDocIndex(),n=(r=t[e.doc_id])!=null?r:{doc_id:e.doc_id},s={...n,...e,doc_id:e.doc_id,updated_at:new Date().toISOString()};e.note_path===void 0&&n.note_path&&(s.note_path=n.note_path),e.note_title===void 0&&n.note_title&&(s.note_title=n.note_title),e.zotero_title===void 0&&n.zotero_title&&(s.zotero_title=n.zotero_title),e.pdf_path===void 0&&n.pdf_path&&(s.pdf_path=n.pdf_path),e.attachment_key===void 0&&n.attachment_key&&(s.attachment_key=n.attachment_key),t[e.doc_id]=s,await this.saveDocIndex(t)}async hydrateDocIndexFromCache(e){var a,o;if(!e)return null;let t=this.app.vault.adapter,n=await this.getDocIndexEntry(e),s={},r=(0,d.normalizePath)(`${N}/${e}.json`);if(await t.exists(r))try{let c=await t.read(r),l=JSON.parse(c),u=(o=(a=l==null?void 0:l.data)!=null?a:l)!=null?o:{},m=typeof u.title=="string"?u.title:"";if(m&&(s.zotero_title=m),!s.note_title||!s.note_path){let h=this.sanitizeFileName(m)||e,f=(0,d.normalizePath)(`${this.settings.outputNoteDir}/${h}.md`),_=(0,d.normalizePath)(`${this.settings.outputNoteDir}/${h}-${e}.md`),b="";await t.exists(f)?b=f:await t.exists(_)&&(b=_),b&&(s.note_path=b,s.note_title=y.default.basename(b,".md"))}}catch(c){console.error("Failed to read cached item JSON",c)}!s.note_title&&(n!=null&&n.note_path)&&(s.note_title=y.default.basename(n.note_path,".md"));let i=(0,d.normalizePath)(`${T}/${e}.json`);if(await t.exists(i))try{let c=await t.read(i),l=JSON.parse(c);typeof(l==null?void 0:l.source_pdf)=="string"&&(s.pdf_path=l.source_pdf)}catch(c){console.error("Failed to read cached chunks JSON",c)}return Object.keys(s).length>0&&await this.updateDocIndex({doc_id:e,...s}),this.getDocIndexEntry(e)}async getDocIndexEntry(e){var n;return e&&(n=(await this.getDocIndex())[e])!=null?n:null}async inferNotePathFromCache(e){var s,r;let t=this.app.vault.adapter,n=(0,d.normalizePath)(`${N}/${e}.json`);if(!await t.exists(n))return"";try{let i=await t.read(n),a=JSON.parse(i),o=(r=(s=a==null?void 0:a.data)!=null?s:a)!=null?r:{},c=typeof o.title=="string"?o.title:"",l=this.sanitizeFileName(c)||e,u=(0,d.normalizePath)(`${this.settings.outputNoteDir}/${l}.md`),m=(0,d.normalizePath)(`${this.settings.outputNoteDir}/${l}-${e}.md`);if(await t.exists(u))return u;if(await t.exists(m))return m}catch(i){console.error("Failed to infer note path from cache",i)}return""}async rebuildNoteFromCacheForDocId(e,t){var C,A,S,I;try{await this.ensureBundledTools()}catch(g){return t&&new d.Notice("Failed to sync bundled tools. See console for details."),console.error(g),!1}let n=this.app.vault.adapter,s=(0,d.normalizePath)(`${N}/${e}.json`),r=(0,d.normalizePath)(`${T}/${e}.json`);if(!await n.exists(s)||!await n.exists(r))return t&&new d.Notice("Cached item or chunks JSON not found."),!1;this.showStatusProgress("Preparing...",5);let i;try{let g=await n.read(s);i=JSON.parse(g)}catch(g){return t&&new d.Notice("Failed to read cached item JSON."),console.error(g),this.clearStatusProgress(),!1}let a;try{let g=await n.read(r);a=JSON.parse(g)}catch(g){return t&&new d.Notice("Failed to read cached chunks JSON."),console.error(g),this.clearStatusProgress(),!1}let o=typeof a.source_pdf=="string"?a.source_pdf:"";if(!o)return t&&new d.Notice("Cached chunk JSON is missing source_pdf."),this.clearStatusProgress(),!1;try{await O.promises.access(o)}catch(g){return t&&new d.Notice("Cached source PDF path is not accessible."),console.error(g),this.clearStatusProgress(),!1}let c=(C=i.data)!=null?C:i,l=typeof c.title=="string"?c.title:"",u=await this.resolveLanguageHint(c,(A=i.key)!=null?A:c.key),m=this.buildDoclingLanguageHint(u!=null?u:void 0),h="",f=await this.getDocIndexEntry(e),_=typeof((S=a==null?void 0:a.metadata)==null?void 0:S.attachment_key)=="string"?a.metadata.attachment_key:f==null?void 0:f.attachment_key;if(f!=null&&f.note_path&&await n.exists(f.note_path)&&(h=(0,d.normalizePath)(f.note_path)),!h){let g=this.sanitizeFileName(l)||e,E=(0,d.normalizePath)(`${this.settings.outputNoteDir}/${g}.md`),F=await n.exists(E)?g:await this.resolveUniqueBaseName(g,e);h=(0,d.normalizePath)(`${this.settings.outputNoteDir}/${F}.md`)}try{await this.ensureFolder(this.settings.outputNoteDir)}catch(g){return t&&new d.Notice("Failed to create notes folder."),console.error(g),this.clearStatusProgress(),!1}let b=this.getPluginDir(),k=y.default.join(b,"tools","docling_extract.py"),v=y.default.join(b,"tools","index_redisearch.py"),w=null;try{w=await this.readDoclingQualityLabelFromPdf(o,m),this.showStatusProgress(this.formatStatusLabel("Docling extraction...",w),0),await this.runPythonStreaming(k,this.buildDoclingArgs(o,e,r,h,m,!0),g=>this.handleDoclingProgress(g,w),()=>{}),w=await this.readDoclingQualityLabel(r),_&&await this.annotateChunkJsonWithAttachmentKey(r,_)}catch(g){return t&&new d.Notice("Docling extraction failed. See console for details."),console.error(g),this.clearStatusProgress(),!1}try{this.showStatusProgress(this.formatStatusLabel("Indexing chunks...",w),0),await this.runPythonStreaming(v,["--chunks-json",this.getAbsoluteVaultPath(r),"--redis-url",this.settings.redisUrl,"--index",this.settings.redisIndex,"--prefix",this.settings.redisPrefix,"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--upsert","--progress"],g=>{if((g==null?void 0:g.type)==="progress"&&g.total){let E=Math.round(g.current/g.total*100),F=this.formatStatusLabel(`Indexing chunks ${g.current}/${g.total}`,w);this.showStatusProgress(F,E)}},()=>{})}catch(g){return t&&new d.Notice("RedisSearch indexing failed. See console for details."),console.error(g),this.clearStatusProgress(),!1}let D=this.buildPdfLinkForNote(o,f==null?void 0:f.attachment_key,e);try{let g=await this.app.vault.adapter.read(h),E=this.buildNoteMarkdown(c,(I=i.meta)!=null?I:{},e,D,s,g);await this.app.vault.adapter.write(h,E)}catch(g){return t&&new d.Notice("Failed to finalize note markdown."),console.error(g),this.clearStatusProgress(),!1}try{await this.updateDocIndex({doc_id:e,note_path:h,note_title:y.default.basename(h,".md"),zotero_title:l,pdf_path:o})}catch(g){console.error("Failed to update doc index",g)}return!0}getZoteroLibraryPath(){let e=(this.settings.zoteroUserId||"0").trim();return!e||e==="0"?"users/0":e.startsWith("users/")||e.startsWith("groups/")?e:`users/${e}`}async ensureFolder(e){let t=this.app.vault.adapter,n=(0,d.normalizePath)(e).split("/").filter(Boolean),s="";for(let r of n)s=s?`${s}/${r}`:r,await t.exists(s)||await t.mkdir(s)}buildNoteMarkdown(e,t,n,s,r,i){let a=`[[${r}]]`,o=this.renderFrontmatter(e,t,n,s,a);return`${o?`---
${o}
---

`:""}PDF: ${s}

Item JSON: ${a}

${i}`}renderFrontmatter(e,t,n,s,r){var o;let i=(o=this.settings.frontmatterTemplate)!=null?o:"";if(!i.trim())return"";let a=this.buildTemplateVars(e,t,n,s,r);return i.replace(/{{\s*([a-z0-9_]+)\s*}}/gi,(c,l)=>{var u;return(u=a[l])!=null?u:""}).trim()}buildTemplateVars(e,t,n,s,r){let i=typeof e.title=="string"?e.title:"",a=typeof e.shortTitle=="string"?e.shortTitle:"",o=typeof e.date=="string"?e.date:"",c=typeof(t==null?void 0:t.parsedDate)=="string"?t.parsedDate:"",l=this.extractYear(c||o),m=(Array.isArray(e.creators)?e.creators:[]).filter(w=>w.creatorType==="author").map(w=>this.formatCreatorName(w)),h=m.join("; "),f=Array.isArray(e.tags)?e.tags.map(w=>typeof w=="string"?w:w==null?void 0:w.tag).filter(Boolean):[],_=f.join("; "),b=typeof e.itemType=="string"?e.itemType:"",k=typeof(t==null?void 0:t.creatorSummary)=="string"?t.creatorSummary:"",v={doc_id:n,zotero_key:typeof e.key=="string"?e.key:n,title:i,short_title:a,date:o,year:l,authors:h,tags:_,item_type:b,creator_summary:k,pdf_link:this.escapeYamlString(s),item_json:this.escapeYamlString(r)};for(let[w,D]of Object.entries(v))v[`${w}_yaml`]=this.escapeYamlString(D);return v.authors_yaml=this.toYamlList(m),v.tags_yaml=this.toYamlList(f),v}extractYear(e){if(!e)return"";let t=e.match(/\b(\d{4})\b/);return t?t[1]:""}formatCreatorName(e){if(!e||typeof e!="object")return"";if(e.name)return String(e.name);let t=e.firstName?String(e.firstName):"",n=e.lastName?String(e.lastName):"";return[n,t].filter(Boolean).join(", ")||`${t} ${n}`.trim()}escapeYamlString(e){return`"${String(e).replace(/\\/g,"\\\\").replace(/"/g,'\\"')}"`}toYamlList(e){return e.length?e.map(t=>`  - ${this.escapeYamlString(t)}`).join(`
`):'  - ""'}getVaultBasePath(){var n;let e=this.app.vault.adapter;if(e instanceof d.FileSystemAdapter)return e.getBasePath();let t=(n=e.getBasePath)==null?void 0:n.call(e);if(t)return t;throw new Error("Vault base path is unavailable.")}getPluginDir(){var s;let e=this.getVaultBasePath(),t=(s=this.manifest.dir)!=null?s:this.manifest.id;if(!t)throw new Error("Plugin directory is unavailable.");let n=y.default.isAbsolute(t)?t:y.default.join(e,t);return y.default.normalize(n)}async ensureBundledTools(){let e=this.getPluginDir(),t=y.default.join(e,"tools");await O.promises.mkdir(t,{recursive:!0});for(let[n,s]of Object.entries(ee)){let r=y.default.join(t,n),i=!0;try{await O.promises.readFile(r,"utf8")===s&&(i=!1)}catch(a){}i&&await O.promises.writeFile(r,s,"utf8")}}async migrateCachePaths(){let e="zotero/items",t="zotero/chunks",n=N,s=T,r=this.app.vault.adapter,i=(0,d.normalizePath)(e),a=(0,d.normalizePath)(t),o=(0,d.normalizePath)(n),c=(0,d.normalizePath)(s),l=o.split("/").slice(0,-1).join("/"),u=c.split("/").slice(0,-1).join("/");l&&await this.ensureFolder(l),u&&await this.ensureFolder(u);let m=await r.exists(i),h=await r.exists(a),f=await r.exists(o),_=await r.exists(c);m&&!f&&await r.rename(i,o),h&&!_&&await r.rename(a,c)}getAbsoluteVaultPath(e){let t=this.getVaultBasePath(),n=y.default.isAbsolute(e)?e:y.default.join(t,e);return y.default.normalize(n)}buildDoclingArgs(e,t,n,s,r,i=!1){let a=this.settings.ocrMode==="force_low_quality"?"auto":this.settings.ocrMode,o=["--pdf",e,"--doc-id",t,"--out-json",this.getAbsoluteVaultPath(n),"--out-md",this.getAbsoluteVaultPath(s),"--chunking",this.settings.chunkingMode,"--ocr",a];return i&&o.push("--progress"),this.settings.ocrMode==="force_low_quality"&&o.push("--force-ocr-low-quality"),o.push("--quality-threshold",String(this.settings.ocrQualityThreshold)),r&&o.push("--language-hint",r),this.settings.maxChunkChars>0&&o.push("--max-chunk-chars",String(this.settings.maxChunkChars)),this.settings.chunkOverlapChars>0&&o.push("--chunk-overlap-chars",String(this.settings.chunkOverlapChars)),this.settings.removeImagePlaceholders||o.push("--keep-image-tags"),this.settings.enableLlmCleanup&&(o.push("--enable-llm-cleanup"),this.settings.llmCleanupBaseUrl&&o.push("--llm-cleanup-base-url",this.settings.llmCleanupBaseUrl),this.settings.llmCleanupApiKey&&o.push("--llm-cleanup-api-key",this.settings.llmCleanupApiKey),this.settings.llmCleanupModel&&o.push("--llm-cleanup-model",this.settings.llmCleanupModel),o.push("--llm-cleanup-temperature",String(this.settings.llmCleanupTemperature)),o.push("--llm-cleanup-min-quality",String(this.settings.llmCleanupMinQuality)),o.push("--llm-cleanup-max-chars",String(this.settings.llmCleanupMaxChars))),o}getRedisDataDir(){return y.default.join(this.getVaultBasePath(),R,"redis-data")}getDockerComposePath(){let e=this.getPluginDir();return y.default.join(e,"tools","docker-compose.yml")}getDockerProjectName(){let e=this.getVaultBasePath(),t=y.default.basename(e).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,18),n=(0,ie.createHash)("sha1").update(e).digest("hex").slice(0,8);return`zrr-${t||"vault"}-${n}`}getRedisPortFromUrl(){try{let e=new URL(this.settings.redisUrl),t=e.port?Number(e.port):6379;return Number.isFinite(t)&&t>0?t:6379}catch(e){return 6379}}async startRedisStack(e){var t;try{await this.ensureBundledTools();let n=this.getDockerComposePath(),s=this.getRedisDataDir();await O.promises.mkdir(s,{recursive:!0});let r=((t=this.settings.dockerPath)==null?void 0:t.trim())||"docker",i=this.getDockerProjectName(),a=String(this.getRedisPortFromUrl());try{await this.runCommand(r,["compose","-p",i,"-f",n,"down"],{cwd:y.default.dirname(n)})}catch(o){console.warn("Redis Stack stop before restart failed",o)}await this.runCommand(r,["compose","-p",i,"-f",n,"up","-d"],{cwd:y.default.dirname(n),env:{...process.env,ZRR_DATA_DIR:s,ZRR_PORT:a}}),e||new d.Notice("Redis Stack started.")}catch(n){e||new d.Notice("Failed to start Redis Stack. Check Docker Desktop and File Sharing."),console.error("Failed to start Redis Stack",n)}}runPython(e,t){return new Promise((n,s)=>{let r=(0,M.spawn)(this.settings.pythonPath,[e,...t],{cwd:y.default.dirname(e)}),i="";r.stderr.on("data",a=>{i+=a.toString()}),r.on("close",a=>{a===0?n():s(new Error(i||`Process exited with code ${a}`))})})}runCommand(e,t,n){return new Promise((s,r)=>{let i=(0,M.spawn)(e,t,{cwd:n==null?void 0:n.cwd,env:n==null?void 0:n.env}),a="";i.stderr.on("data",o=>{a+=o.toString()}),i.on("close",o=>{o===0?s():r(new Error(a||`Process exited with code ${o}`))})})}runPythonStreaming(e,t,n,s){return new Promise((r,i)=>{let a=(0,M.spawn)(this.settings.pythonPath,[e,...t],{cwd:y.default.dirname(e)}),o="",c="",l=null,u=!1,m=h=>{if(h.trim())try{let f=JSON.parse(h);l=f,((f==null?void 0:f.type)==="final"||f!=null&&f.answer)&&(u=!0),n(f)}catch(f){}};a.stdout.on("data",h=>{var _;o+=h.toString();let f=o.split(/\r?\n/);o=(_=f.pop())!=null?_:"";for(let b of f)m(b)}),a.stderr.on("data",h=>{c+=h.toString()}),a.on("close",h=>{o.trim()&&m(o),!u&&l&&s(l),h===0?r():i(new Error(c||`Process exited with code ${h}`))})})}runPythonWithOutput(e,t){return new Promise((n,s)=>{let r=(0,M.spawn)(this.settings.pythonPath,[e,...t],{cwd:y.default.dirname(e)}),i="",a="";r.stdout.on("data",o=>{i+=o.toString()}),r.stderr.on("data",o=>{a+=o.toString()}),r.on("close",o=>{o===0?n(i.trim()):s(new Error(a||`Process exited with code ${o}`))})})}},Q=class extends d.SuggestModal{constructor(e,t,n){super(e);this.lastError=null;this.indexedDocIds=null;this.plugin=t,this.resolveSelection=n,this.setPlaceholder("Search Zotero items...")}async getSuggestions(e){try{if(!this.indexedDocIds){let t=await this.plugin.getDocIndex();this.indexedDocIds=new Set(Object.keys(t))}return await this.plugin.searchZoteroItems(e)}catch(t){let n=t instanceof Error?t.message:String(t);return this.lastError!==n&&(this.lastError=n,new d.Notice(n)),console.error("Zotero search failed",t),[]}}renderSuggestion(e,t){var u,m,h;let n=(m=(u=e.data)==null?void 0:u.title)!=null?m:"[No title]",s=this.extractYear(e),r=this.getDocId(e),i=r?(h=this.indexedDocIds)==null?void 0:h.has(r):!1,a=this.getPdfStatus(e);i&&t.addClass("zrr-indexed-item"),a==="no"&&t.addClass("zrr-no-pdf-item"),t.createEl("div",{text:n});let o=t.createEl("small"),c=!1,l=()=>{c&&o.createSpan({text:" \u2022 "})};s&&(o.createSpan({text:s}),c=!0),i&&(l(),o.createSpan({text:"Indexed",cls:"zrr-indexed-flag"}),c=!0),a==="no"&&(l(),o.createSpan({text:"No attachment",cls:"zrr-no-pdf-flag"}),c=!0),t.addEventListener("click",()=>{this.resolveSelection&&(this.resolveSelection(e),this.resolveSelection=null),this.close()})}onChooseSuggestion(e,t){this.resolveSelection&&(this.resolveSelection(e),this.resolveSelection=null),this.close()}onClose(){this.resolveSelection&&(this.resolveSelection(null),this.resolveSelection=null)}getDocId(e){var n,s,r;let t=(r=(s=e.key)!=null?s:(n=e.data)==null?void 0:n.key)!=null?r:"";return typeof t=="string"?t:""}getPdfStatus(e){var s,r,i,a,o,c,l;let t=(c=(o=(i=(s=e.data)==null?void 0:s.attachments)!=null?i:(r=e.data)==null?void 0:r.children)!=null?o:(a=e.data)==null?void 0:a.items)!=null?c:[];if(Array.isArray(t)&&t.length>0)return t.some(m=>this.isPdfAttachment(m))?"yes":"no";let n=(l=e.meta)==null?void 0:l.numChildren;return typeof n=="number"&&n===0?"no":"unknown"}isPdfAttachment(e){var n,s,r,i,a,o;return((o=(a=(r=(n=e==null?void 0:e.contentType)!=null?n:e==null?void 0:e.mimeType)!=null?r:(s=e==null?void 0:e.data)==null?void 0:s.contentType)!=null?a:(i=e==null?void 0:e.data)==null?void 0:i.mimeType)!=null?o:"")==="application/pdf"}extractYear(e){var s,r,i,a;let t=(a=(i=(s=e.meta)==null?void 0:s.parsedDate)!=null?i:(r=e.data)==null?void 0:r.date)!=null?a:"";if(typeof t!="string")return"";let n=t.match(/\b(\d{4})\b/);return n?n[1]:""}};
