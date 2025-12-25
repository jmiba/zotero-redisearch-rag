"use strict";var le=Object.create;var Z=Object.defineProperty;var ce=Object.getOwnPropertyDescriptor;var de=Object.getOwnPropertyNames;var pe=Object.getPrototypeOf,ue=Object.prototype.hasOwnProperty;var ge=(P,p)=>{for(var e in p)Z(P,e,{get:p[e],enumerable:!0})},ee=(P,p,e,n)=>{if(p&&typeof p=="object"||typeof p=="function")for(let t of de(p))!ue.call(P,t)&&t!==e&&Z(P,t,{get:()=>p[t],enumerable:!(n=ce(p,t))||n.enumerable});return P};var V=(P,p,e)=>(e=P!=null?le(pe(P)):{},ee(p||!P||!P.__esModule?Z(e,"default",{value:P,enumerable:!0}):e,P)),he=P=>ee(Z({},"__esModule",{value:!0}),P);var _e={};ge(_e,{default:()=>G});module.exports=he(_e);var d=require("obsidian"),M=require("child_process"),O=require("fs"),se=V(require("http")),ae=V(require("https")),y=V(require("path")),F=require("url"),oe=require("crypto");var w=require("obsidian"),A=".zotero-redisearch-rag",N=`${A}/items`,z=`${A}/chunks`,ne={zoteroBaseUrl:"http://127.0.0.1:23119/api",zoteroUserId:"0",webApiBaseUrl:"https://api.zotero.org",webApiLibraryType:"user",webApiLibraryId:"",webApiKey:"",pythonPath:"python3",dockerPath:"docker",autoStartRedis:!1,copyPdfToVault:!0,frontmatterTemplate:`doc_id: {{doc_id}}
zotero_key: {{zotero_key}}
title: {{title_yaml}}
year: {{year}}
authors:
{{authors_yaml}}
item_type: {{item_type}}
pdf_link: {{pdf_link}}
item_json: {{item_json}}`,outputPdfDir:"zotero/pdfs",outputNoteDir:"zotero/notes",chatOutputDir:"zotero/chats",chatPaneLocation:"right",redisUrl:"redis://127.0.0.1:6379",redisIndex:"idx:zotero",redisPrefix:"zotero:chunk:",embedBaseUrl:"http://localhost:1234/v1",embedApiKey:"lm-studio",embedModel:"google/embedding-gemma-300m",chatBaseUrl:"http://127.0.0.1:1234/v1",chatApiKey:"",chatModel:"openai/gpt-oss-20b",chatTemperature:.2,chatHistoryMessages:6,ocrMode:"auto",chunkingMode:"page",maxChunkChars:4e3,chunkOverlapChars:250,removeImagePlaceholders:!0,ocrQualityThreshold:.5,enableLlmCleanup:!1,llmCleanupBaseUrl:"http://127.0.0.1:1234/v1",llmCleanupApiKey:"",llmCleanupModel:"openai/gpt-oss-20b",llmCleanupTemperature:0,llmCleanupMinQuality:.35,llmCleanupMaxChars:2e3,enableFileLogging:!1,logFilePath:`${A}/logs/docling_extract.log`,preferPerColumnOcr:!1,columnSplitMargin:8,columnSplitAfterRasterize:!1},B=class extends w.PluginSettingTab{constructor(p,e){super(p,e),this.plugin=e}display(){let{containerEl:p}=this;p.empty(),p.createEl("h2",{text:"Zotero RAG Settings"}),new w.Setting(p).setName("Zotero base URL").setDesc("Local Zotero API base URL, e.g. http://127.0.0.1:23119/api").addText(e=>e.setPlaceholder("http://127.0.0.1:23119/api").setValue(this.plugin.settings.zoteroBaseUrl).onChange(async n=>{this.plugin.settings.zoteroBaseUrl=n.trim(),await this.plugin.saveSettings()})),new w.Setting(p).setName("Zotero user ID").setDesc("Use 0 for local library. You can also enter users/<id> or groups/<id>.").addText(e=>e.setPlaceholder("123456").setValue(this.plugin.settings.zoteroUserId).onChange(async n=>{this.plugin.settings.zoteroUserId=n.trim(),await this.plugin.saveSettings()})),p.createEl("h3",{text:"Zotero Web API (optional fallback)"}),new w.Setting(p).setName("Web API base URL").setDesc("Zotero Web API base URL for write fallback, e.g. https://api.zotero.org").addText(e=>e.setPlaceholder("https://api.zotero.org").setValue(this.plugin.settings.webApiBaseUrl).onChange(async n=>{this.plugin.settings.webApiBaseUrl=n.trim(),await this.plugin.saveSettings()})),new w.Setting(p).setName("Web API library type").setDesc("Library type for Web API writes.").addDropdown(e=>e.addOption("user","user").addOption("group","group").setValue(this.plugin.settings.webApiLibraryType).onChange(async n=>{this.plugin.settings.webApiLibraryType=n,await this.plugin.saveSettings()})),new w.Setting(p).setName("Web API library ID").setDesc("Numeric Zotero user/group ID for Web API writes.").addText(e=>e.setPlaceholder("15218").setValue(this.plugin.settings.webApiLibraryId).onChange(async n=>{this.plugin.settings.webApiLibraryId=n.trim(),await this.plugin.saveSettings()})),new w.Setting(p).setName("Web API key").setDesc("Zotero API key for write fallback (from zotero.org).").addText(e=>e.setPlaceholder("your-api-key").setValue(this.plugin.settings.webApiKey).onChange(async n=>{this.plugin.settings.webApiKey=n.trim(),await this.plugin.saveSettings()})),new w.Setting(p).setName("Python path").setDesc("Path to python3").addText(e=>e.setPlaceholder("python3").setValue(this.plugin.settings.pythonPath).onChange(async n=>{this.plugin.settings.pythonPath=n.trim()||"python3",await this.plugin.saveSettings()})),new w.Setting(p).setName("Copy PDFs into vault").setDesc("Disable to use Zotero storage paths directly. If a local file path is unavailable, the plugin temporarily copies the PDF into the vault for processing.").addToggle(e=>e.setValue(this.plugin.settings.copyPdfToVault).onChange(async n=>{this.plugin.settings.copyPdfToVault=n,await this.plugin.saveSettings()})),new w.Setting(p).setName("Frontmatter template").setDesc("Use {{doc_id}}, {{zotero_key}}, {{title}}, {{title_yaml}}, {{year}}, {{date}}, {{authors}}, {{authors_yaml}}, {{tags}}, {{item_type}}, {{pdf_link}}, {{item_json}}").addTextArea(e=>{e.inputEl.rows=8,e.setValue(this.plugin.settings.frontmatterTemplate).onChange(async n=>{this.plugin.settings.frontmatterTemplate=n,await this.plugin.saveSettings()})}),new w.Setting(p).setName("Docker path").setDesc("CLI path for Docker (used to start Redis Stack).").addText(e=>e.setPlaceholder("docker").setValue(this.plugin.settings.dockerPath).onChange(async n=>{this.plugin.settings.dockerPath=n.trim()||"docker",await this.plugin.saveSettings()})),p.createEl("h3",{text:"Output folders (vault-relative)"}),new w.Setting(p).setName("PDF folder").addText(e=>e.setPlaceholder("zotero/pdfs").setValue(this.plugin.settings.outputPdfDir).onChange(async n=>{this.plugin.settings.outputPdfDir=n.trim(),await this.plugin.saveSettings()})),new w.Setting(p).setName("Notes folder").addText(e=>e.setPlaceholder("zotero/notes").setValue(this.plugin.settings.outputNoteDir).onChange(async n=>{this.plugin.settings.outputNoteDir=n.trim(),await this.plugin.saveSettings()})),new w.Setting(p).setName("Saved chats folder").setDesc("Where exported chat notes are stored (vault-relative).").addText(e=>e.setPlaceholder("zotero/chats").setValue(this.plugin.settings.chatOutputDir).onChange(async n=>{this.plugin.settings.chatOutputDir=n.trim()||"zotero/chats",await this.plugin.saveSettings()})),p.createEl("h3",{text:"Redis Stack"}),new w.Setting(p).setName("Redis URL").addText(e=>e.setPlaceholder("redis://127.0.0.1:6379").setValue(this.plugin.settings.redisUrl).onChange(async n=>{this.plugin.settings.redisUrl=n.trim(),await this.plugin.saveSettings()})),new w.Setting(p).setName("Index name").addText(e=>e.setPlaceholder("idx:zotero").setValue(this.plugin.settings.redisIndex).onChange(async n=>{this.plugin.settings.redisIndex=n.trim(),await this.plugin.saveSettings()})),new w.Setting(p).setName("Key prefix").addText(e=>e.setPlaceholder("zotero:chunk:").setValue(this.plugin.settings.redisPrefix).onChange(async n=>{this.plugin.settings.redisPrefix=n.trim(),await this.plugin.saveSettings()})),new w.Setting(p).setName("Auto-start Redis Stack (Docker Compose)").setDesc("Requires Docker Desktop running and your vault path shared with Docker.").addToggle(e=>e.setValue(this.plugin.settings.autoStartRedis).onChange(async n=>{this.plugin.settings.autoStartRedis=n,await this.plugin.saveSettings()})),new w.Setting(p).setName("Start Redis Stack now").setDesc("Restarts Docker Compose with the vault data directory.").addButton(e=>e.setButtonText("Start").onClick(async()=>{await this.plugin.startRedisStack()})),p.createEl("h3",{text:"Embeddings (LM Studio)"}),new w.Setting(p).setName("Embeddings base URL").addText(e=>e.setPlaceholder("http://localhost:1234/v1").setValue(this.plugin.settings.embedBaseUrl).onChange(async n=>{this.plugin.settings.embedBaseUrl=n.trim(),await this.plugin.saveSettings()})),new w.Setting(p).setName("Embeddings API key").addText(e=>e.setPlaceholder("lm-studio").setValue(this.plugin.settings.embedApiKey).onChange(async n=>{this.plugin.settings.embedApiKey=n.trim(),await this.plugin.saveSettings()})),new w.Setting(p).setName("Embeddings model").addText(e=>e.setPlaceholder("google/embedding-gemma-300m").setValue(this.plugin.settings.embedModel).onChange(async n=>{this.plugin.settings.embedModel=n.trim(),await this.plugin.saveSettings()})),p.createEl("h3",{text:"Chat LLM"}),new w.Setting(p).setName("Chat base URL").setDesc("OpenAI-compatible chat endpoint base URL").addText(e=>e.setPlaceholder("http://localhost:1234/v1").setValue(this.plugin.settings.chatBaseUrl).onChange(async n=>{this.plugin.settings.chatBaseUrl=n.trim(),await this.plugin.saveSettings()})),new w.Setting(p).setName("Chat API key").addText(e=>e.setPlaceholder("lm-studio").setValue(this.plugin.settings.chatApiKey).onChange(async n=>{this.plugin.settings.chatApiKey=n.trim(),await this.plugin.saveSettings()})),new w.Setting(p).setName("Chat model").addText(e=>e.setPlaceholder("meta-llama/llama-3.1-405b-instruct").setValue(this.plugin.settings.chatModel).onChange(async n=>{this.plugin.settings.chatModel=n.trim(),await this.plugin.saveSettings()})),new w.Setting(p).setName("Temperature").addText(e=>e.setPlaceholder("0.2").setValue(String(this.plugin.settings.chatTemperature)).onChange(async n=>{let t=Number.parseFloat(n);this.plugin.settings.chatTemperature=Number.isFinite(t)?t:.2,await this.plugin.saveSettings()})),new w.Setting(p).setName("Chat history messages").setDesc("Number of recent messages to include for conversational continuity (0 disables).").addText(e=>e.setPlaceholder("6").setValue(String(this.plugin.settings.chatHistoryMessages)).onChange(async n=>{let t=Number.parseInt(n,10);this.plugin.settings.chatHistoryMessages=Number.isFinite(t)?Math.max(0,t):6,await this.plugin.saveSettings()})),new w.Setting(p).setName("Chat panel location").setDesc("Where to open the chat view by default.").addDropdown(e=>e.addOption("right","Right sidebar").addOption("main","Main window").setValue(this.plugin.settings.chatPaneLocation).onChange(async n=>{this.plugin.settings.chatPaneLocation=n,await this.plugin.saveSettings()})),p.createEl("h3",{text:"Docling"}),new w.Setting(p).setName("OCR mode").setDesc("auto: skip OCR when text is readable; force if bad: OCR only when text looks poor; force: always OCR.").addDropdown(e=>e.addOption("auto","auto").addOption("force_low_quality","force if quality is bad").addOption("force","force").setValue(this.plugin.settings.ocrMode).onChange(async n=>{this.plugin.settings.ocrMode=n,await this.plugin.saveSettings()})),new w.Setting(p).setName("Prefer per-column OCR on multi-column pages").setDesc("When a multi-column layout is detected, run external OCR per column to preserve reading order.").addToggle(e=>e.setValue(this.plugin.settings.preferPerColumnOcr).onChange(async n=>{this.plugin.settings.preferPerColumnOcr=n,await this.plugin.saveSettings()})),new w.Setting(p).setName("Column split margin (px)").setDesc("Safety margin from detected gutters to avoid cutting characters when splitting columns.").addText(e=>e.setPlaceholder("8").setValue(String(this.plugin.settings.columnSplitMargin)).onChange(async n=>{let t=Number.parseInt(n,10);this.plugin.settings.columnSplitMargin=Number.isFinite(t)?Math.max(0,t):8,await this.plugin.saveSettings()})),new w.Setting(p).setName("Rasterize then per-column OCR").setDesc("Render pages to images (ignore text layer) and then run external per-column OCR.").addToggle(e=>e.setValue(this.plugin.settings.columnSplitAfterRasterize).onChange(async n=>{this.plugin.settings.columnSplitAfterRasterize=n,await this.plugin.saveSettings()})),new w.Setting(p).setName("Text quality threshold").setDesc("Lower values are stricter; below this threshold the text is treated as low quality.").addSlider(e=>{e.setLimits(0,1,.05).setValue(this.plugin.settings.ocrQualityThreshold).setDynamicTooltip().onChange(async n=>{this.plugin.settings.ocrQualityThreshold=n,await this.plugin.saveSettings()})}),new w.Setting(p).setName("Chunking").setDesc("page or section").addDropdown(e=>e.addOption("page","page").addOption("section","section").setValue(this.plugin.settings.chunkingMode).onChange(async n=>{this.plugin.settings.chunkingMode=n,await this.plugin.saveSettings()})),new w.Setting(p).setName("Section chunk max chars").setDesc("Split large section chunks into smaller pieces (section mode only).").addText(e=>e.setPlaceholder("3000").setValue(String(this.plugin.settings.maxChunkChars)).onChange(async n=>{let t=Number.parseInt(n,10);this.plugin.settings.maxChunkChars=Number.isFinite(t)?t:3e3,await this.plugin.saveSettings()})),new w.Setting(p).setName("Section chunk overlap chars").setDesc("Number of characters to overlap when splitting section chunks.").addText(e=>e.setPlaceholder("250").setValue(String(this.plugin.settings.chunkOverlapChars)).onChange(async n=>{let t=Number.parseInt(n,10);this.plugin.settings.chunkOverlapChars=Number.isFinite(t)?t:250,await this.plugin.saveSettings()})),new w.Setting(p).setName("Remove image placeholders").setDesc("Strip '<!-- image -->' tags before chunking.").addToggle(e=>e.setValue(this.plugin.settings.removeImagePlaceholders).onChange(async n=>{this.plugin.settings.removeImagePlaceholders=n,await this.plugin.saveSettings()})),p.createEl("h4",{text:"OCR cleanup (optional)"}),new w.Setting(p).setName("LLM cleanup for low-quality chunks").setDesc("Optional OpenAI-compatible cleanup for poor OCR. Can be slow/costly.").addToggle(e=>e.setValue(this.plugin.settings.enableLlmCleanup).onChange(async n=>{this.plugin.settings.enableLlmCleanup=n,await this.plugin.saveSettings()})),new w.Setting(p).setName("LLM cleanup base URL").setDesc("OpenAI-compatible endpoint, e.g. http://127.0.0.1:1234/v1").addText(e=>e.setPlaceholder("http://127.0.0.1:1234/v1").setValue(this.plugin.settings.llmCleanupBaseUrl).onChange(async n=>{this.plugin.settings.llmCleanupBaseUrl=n.trim(),await this.plugin.saveSettings()})),new w.Setting(p).setName("LLM cleanup API key").setDesc("Optional API key for the cleanup endpoint.").addText(e=>e.setPlaceholder("sk-...").setValue(this.plugin.settings.llmCleanupApiKey).onChange(async n=>{this.plugin.settings.llmCleanupApiKey=n.trim(),await this.plugin.saveSettings()})),new w.Setting(p).setName("LLM cleanup model").setDesc("Model to use for cleanup.").addText(e=>e.setPlaceholder("openai/gpt-oss-20b").setValue(this.plugin.settings.llmCleanupModel).onChange(async n=>{this.plugin.settings.llmCleanupModel=n.trim(),await this.plugin.saveSettings()})),new w.Setting(p).setName("LLM cleanup temperature").setDesc("Lower is more conservative.").addText(e=>e.setPlaceholder("0.0").setValue(String(this.plugin.settings.llmCleanupTemperature)).onChange(async n=>{let t=Number.parseFloat(n);this.plugin.settings.llmCleanupTemperature=Number.isFinite(t)?t:0,await this.plugin.saveSettings()})),new w.Setting(p).setName("LLM cleanup min quality").setDesc("Only run cleanup when chunk quality is below this threshold (0-1).").addSlider(e=>e.setLimits(0,1,.05).setValue(this.plugin.settings.llmCleanupMinQuality).setDynamicTooltip().onChange(async n=>{this.plugin.settings.llmCleanupMinQuality=n,await this.plugin.saveSettings()})),new w.Setting(p).setName("LLM cleanup max chars").setDesc("Skip cleanup for chunks longer than this limit.").addText(e=>e.setPlaceholder("2000").setValue(String(this.plugin.settings.llmCleanupMaxChars)).onChange(async n=>{let t=Number.parseInt(n,10);this.plugin.settings.llmCleanupMaxChars=Number.isFinite(t)?t:2e3,await this.plugin.saveSettings()})),p.createEl("h3",{text:"Logging"}),new w.Setting(p).setName("Enable logging to file").setDesc("Write Docling/Python logs to a file during extraction.").addToggle(e=>e.setValue(this.plugin.settings.enableFileLogging).onChange(async n=>{this.plugin.settings.enableFileLogging=n,await this.plugin.saveSettings()})),new w.Setting(p).setName("Log file path (vault-relative)").setDesc("Where to write logs. Keep inside the vault.").addText(e=>e.setPlaceholder(`${A}/logs/docling_extract.log`).setValue(this.plugin.settings.logFilePath).onChange(async n=>{this.plugin.settings.logFilePath=n.trim()||`${A}/logs/docling_extract.log`,await this.plugin.saveSettings()})),new w.Setting(p).setName("View or clear log").setDesc("Open the log contents or clear the file.").addButton(e=>e.setButtonText("Open log").onClick(async()=>{await this.plugin.openLogFile()})).addButton(e=>e.setButtonText("Clear log").onClick(async()=>{await this.plugin.clearLogFile()})),p.createEl("h3",{text:"Maintenance"}),new w.Setting(p).setName("Reindex Redis from cached chunks").setDesc("Rebuild the Redis index from cached chunk JSON files.").addButton(e=>e.setButtonText("Reindex").onClick(async()=>{await this.plugin.reindexRedisFromCache()})),new w.Setting(p).setName("Recreate missing notes from cache").setDesc("Rebuild missing notes using cached Zotero items and chunks.").addButton(e=>e.setButtonText("Recreate").onClick(async()=>{await this.plugin.recreateMissingNotesFromCache()}))}};var H={"zrr-picker":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
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
`};var te={"docling_extract.py":`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.2.2
import argparse
import json
import logging
import os
import re
import shutil
import sys
from dataclasses import dataclass
from typing import Any, Callable, Dict, Iterable, List, Optional, Sequence, Tuple
import langcodes


LOGGER = logging.getLogger("docling_extract")

# Stores details about the last spellchecker built (backend and dictionary files)
# Example: {"backend": "spylls", "aff": "/path/en_GB.aff", "dic": "/path/en_GB.dic"}
LAST_SPELLCHECKER_INFO: Dict[str, Any] = {}


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
    # When columns are detected, optionally prefer doing external OCR per column
    column_split_ocr: bool = False
    column_split_margin_px: int = 8
    # Optionally rasterize (render pages to images) and then run per-column OCR,
    # guaranteeing the original text layer is ignored
    column_split_after_rasterize: bool = False
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
    # Tesseract tuning
    tesseract_psm: int = 6  # Assume a uniform block of text
    tesseract_oem: int = 1  # LSTM only
    # Optional Hunspell integration
    enable_hunspell: bool = True
    hunspell_aff_path: Optional[str] = None
    hunspell_dic_path: Optional[str] = None
    # Tesseract tuning
    tesseract_psm: int = 6  # Assume a uniform block of text
    tesseract_oem: int = 1  # LSTM only
    # Optional Hunspell integration
    enable_hunspell: bool = True
    hunspell_aff_path: Optional[str] = None
    hunspell_dic_path: Optional[str] = None


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

    # import langcodes

    def normalize_hint(h: str) -> str:
        if not h:
            return ""
        try:
            lang = langcodes.find(h)
            code = lang.to_alpha3()
            if code == "deu":
                return config.default_lang_german
            if code == "eng":
                return config.default_lang_english
            if code == "fra":
                return "fra+eng"  # French + English fallback
            if code == "pol":
                return "pol+eng"  # Polish + English fallback
            # Add more as needed
            return code
        except Exception:
            return h

    if hint:
        return normalize_hint(hint)

    # Try to infer from filename using langcodes
    for pattern, lang_code in [
        (r"(\\bde\\b|_de\\b|-de\\b|deu|german|deutsch)", config.default_lang_german),
        (r"(\\bfr\\b|_fr\\b|-fr\\b|fra|french|francais|fran\xE7ais)", "fra+eng"),
        (r"(\\bit\\b|_it\\b|-it\\b|ita|italian|italiano)", "ita+eng"),
        (r"(\\bes\\b|_es\\b|-es\\b|spa|spanish|espanol|espa\xF1ol)", "spa+eng"),
        (r"(\\bpl\\b|_pl\\b|-pl\\b|pol|polish|polski)", "pol+eng"),
    ]:
        if re.search(pattern, name):
            return lang_code
    return config.default_lang_english


def normalize_languages_for_engine(languages: str, engine: str) -> str:
    lang = languages.lower()
    if engine == "paddle":
        # PaddleOCR expects ISO 639-1 or specific language names (e.g., 'german', 'french', etc.)
        try:
            # Use the first language if multiple are given
            first_lang = lang.split('+')[0].strip()
            code = langcodes.find(first_lang)
            paddle_map = {
                "de": "german",
                "deu": "german",
                "fr": "french",
                "fra": "french",
                "en": "en",
                "eng": "en",
                "it": "italian",
                "ita": "italian",
                "es": "spanish",
                "spa": "spanish",
                "pl": "polish",
                "pol": "polish",
            }
            alpha2 = code.to_alpha2()
            alpha3 = code.to_alpha3()
            if alpha2 in paddle_map:
                return paddle_map[alpha2]
            if alpha3 in paddle_map:
                return paddle_map[alpha3]
        except Exception:
            return "en"
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
        try:
            import paddle  # type: ignore  # paddlepaddle runtime required by PaddleOCR
            _ = paddle  # silence linter
        except Exception:
            raise
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


def build_spellchecker_for_languages(config: DoclingProcessingConfig, languages: str):
    """
    Build a cross-platform spellchecker adapter with a .spell(word) method.
    Tries:
      1) hunspell (C binding) if available
      2) spylls (pure Python) if available
    Returns an object with .spell(str)->bool, or None if unavailable.
    """
    if not config.enable_hunspell:
        return None

    # Resolve aff/dic paths (explicit or auto in tools/hunspell)
    def resolve_paths() -> List[Tuple[str, str]]:
        pairs: List[Tuple[str, str]] = []
        aff = config.hunspell_aff_path
        dic = config.hunspell_dic_path
        if aff and dic and os.path.isfile(aff) and os.path.isfile(dic):
            pairs.append((aff, dic))
            return pairs
        base_dir = os.path.join(os.path.dirname(__file__), "hunspell")
        lang = (languages or "").lower()
        try_codes: List[str] = []
        if any(t in lang for t in ("de", "deu", "german", "deutsch")):
            try_codes += ["de_DE", "de_AT", "de_CH"]
        if any(t in lang for t in ("en", "eng", "english")):
            try_codes += ["en_US", "en_GB"]
        if not try_codes:
            try_codes = ["en_US"]
        # Exact matches first
        for code in try_codes:
            aff_path = os.path.join(base_dir, f"{code}.aff")
            dic_path = os.path.join(base_dir, f"{code}.dic")
            if os.path.isfile(aff_path) and os.path.isfile(dic_path):
                pairs.append((aff_path, dic_path))
        if pairs:
            return pairs

        # Flexible matching: accept stems like de_DE_frami.* or en_US-large.* when both files share the same stem
        try:
            names = os.listdir(base_dir)
        except Exception:
            names = []
        stems_with_aff = {n[:-4] for n in names if n.endswith(".aff")}
        stems_with_dic = {n[:-4] for n in names if n.endswith(".dic")}
        common_stems = list(stems_with_aff & stems_with_dic)

        def stem_priority(stem: str, code: str) -> int:
            # Higher number = higher priority
            if stem == code:
                return 3
            if stem.startswith(code + "_"):
                return 2
            if code in stem:
                return 1
            return 0

        for code in try_codes:
            candidates = sorted(
                [s for s in common_stems if stem_priority(s, code) > 0],
                key=lambda s: stem_priority(s, code),
                reverse=True,
            )
            for stem in candidates:
                aff_path = os.path.join(base_dir, f"{stem}.aff")
                dic_path = os.path.join(base_dir, f"{stem}.dic")
                if os.path.isfile(aff_path) and os.path.isfile(dic_path):
                    pairs.append((aff_path, dic_path))
                    break
        return pairs


    pairs = resolve_paths()
    # If no pairs found, try to download on demand
    if not pairs:
        # Map special cases for repo structure
        repo_map = {
            "de_DE": ("de", "de_DE_frami"),
            "de_AT": ("de", "de_AT"),
            "de_CH": ("de", "de_CH"),
            "en_US": ("en", "en_US"),
            "en_GB": ("en", "en_GB"),
            "fr_FR": ("fr_FR", "fr"),
        }
        lang_code = None
        lang = (languages or "").lower()
        if any(t in lang for t in ("de", "deu", "german", "deutsch")):
            lang_code = "de_DE"
        elif any(t in lang for t in ("en", "eng", "english")):
            lang_code = "en_US"
        elif any(t in lang for t in ("fr", "fra", "french", "francais")):
            lang_code = "fr_FR"
        if not lang_code:
            lang_code = "en_US"
        folder, prefix = repo_map.get(lang_code, (lang_code, lang_code))
        base_url = f"https://raw.githubusercontent.com/LibreOffice/dictionaries/master/{folder}/"
        aff_name = f"{prefix}.aff"
        dic_name = f"{prefix}.dic"
        aff_url = base_url + aff_name
        dic_url = base_url + dic_name
        out_dir = os.path.join(os.path.dirname(__file__), "hunspell")
        os.makedirs(out_dir, exist_ok=True)
        aff_path = os.path.join(out_dir, f"{lang_code}.aff")
        dic_path = os.path.join(out_dir, f"{lang_code}.dic")
        def download(url, out_path):
            try:
                import urllib.request
                print(f"Downloading {url} -> {out_path}")
                urllib.request.urlretrieve(url, out_path)
                return True
            except Exception as exc:
                print(f"Failed to download {url}: {exc}")
                return False
        ok_aff = download(aff_url, aff_path)
        ok_dic = download(dic_url, dic_path)
        if ok_aff and ok_dic:
            print(f"Successfully downloaded Hunspell dictionary for {lang_code} to {out_dir}")
        # Try to resolve again
        pairs = resolve_paths()

    # Attempt hunspell binding first
    try:
        import hunspell  # type: ignore

        for aff_path, dic_path in pairs:
            try:
                hs = hunspell.HunSpell(dic_path, aff_path)
                LOGGER.info(
                    "Spellchecker: using hunspell binding (%s, %s)",
                    os.path.basename(dic_path),
                    os.path.basename(aff_path),
                )
                try:
                    # Record details for external visibility
                    LAST_SPELLCHECKER_INFO.update({
                        "backend": "hunspell",
                        "dic": dic_path,
                        "aff": aff_path,
                    })
                except Exception:
                    pass
                return hs
            except Exception:
                continue
    except Exception:
        pass

    # Attempt spylls fallback (pure Python)
    try:
        from spylls.hunspell import Dictionary as SpyllsDictionary  # type: ignore

        class SpyllsWrapper:
            def __init__(self, d):
                self.d = d

            def spell(self, word: str) -> bool:
                # Try common case variants to recognize lowercased nouns etc.
                variants = [word, word.lower(), word.capitalize(), word.title(), word.upper()]
                seen = set()
                for v in variants:
                    if v in seen:
                        continue
                    seen.add(v)
                    try:
                        if hasattr(self.d, "lookup") and self.d.lookup(v):
                            return True
                    except Exception:
                        pass
                    try:
                        sugg = self.d.suggest(v)
                        if isinstance(sugg, (list, tuple)) and v in sugg:
                            return True
                    except Exception:
                        pass
                return False

        for aff_path, dic_path in pairs:
            try:
                d = None
                errors: List[str] = []
                # Variant A: (aff, dic)
                try:
                    d = SpyllsDictionary.from_files(aff_path, dic_path)
                except Exception as eA:
                    errors.append(f"A(aff,dic): {eA}")
                # Variant B: directory containing both
                if d is None:
                    try:
                        d = SpyllsDictionary.from_files(os.path.dirname(dic_path))
                    except Exception as eB:
                        errors.append(f"B(dir): {eB}")
                # Variant C: stem without extension
                if d is None:
                    try:
                        stem = os.path.splitext(dic_path)[0]
                        d = SpyllsDictionary.from_files(stem)
                    except Exception as eC:
                        errors.append(f"C(stem): {eC}")
                # Variant D: single-path dic
                if d is None:
                    try:
                        d = SpyllsDictionary.from_files(dic_path)
                    except Exception as eD:
                        errors.append(f"D(dic): {eD}")
                # Variant E: single-path aff
                if d is None:
                    try:
                        d = SpyllsDictionary.from_files(aff_path)
                    except Exception as eE:
                        errors.append(f"E(aff): {eE}")

                if d is None:
                    raise RuntimeError("spylls load failed: " + "; ".join(errors))

                LOGGER.info(
                    "Spellchecker: using spylls fallback (%s, %s)",
                    os.path.basename(dic_path),
                    os.path.basename(aff_path),
                )
                try:
                    LAST_SPELLCHECKER_INFO.update({
                        "backend": "spylls",
                        "dic": dic_path,
                        "aff": aff_path,
                    })
                except Exception:
                    pass
                return SpyllsWrapper(d)
            except Exception:
                continue
    except Exception:
        pass

    # Naive .dic fallback (no affix rules) when hunspell/spylls are unavailable
    try:
        class NaiveDicWrapper:
            def __init__(self, words: Sequence[str]):
                self.words = set(w.lower() for w in words if w)

            def spell(self, word: str) -> bool:
                variants = [word, word.lower(), word.capitalize(), word.title(), word.upper()]
                for v in variants:
                    if v.lower() in self.words:
                        return True
                return False

        def load_naive_dic(path: str) -> Optional[NaiveDicWrapper]:
            try:
                entries: List[str] = []
                with open(path, "r", encoding="utf-8", errors="ignore") as fh:
                    first = True
                    for raw in fh:
                        line = raw.strip().lstrip("\\ufeff")
                        if not line:
                            continue
                        if first and line.isdigit():
                            first = False
                            continue
                        first = False
                        base = line.split("/")[0].strip()
                        if base:
                            entries.append(base)
                if entries:
                    LOGGER.info("Spellchecker: using naive .dic (%s) entries=%d", os.path.basename(path), len(entries))
                    return NaiveDicWrapper(entries)
            except Exception as exc:
                LOGGER.warning("Naive .dic load failed for %s: %s", path, exc)
            return None

        # Prefer .dic paths discovered via resolve_paths(); otherwise scan tools/hunspell
        dic_paths: List[str] = []
        for _aff, _dic in pairs:
            if os.path.isfile(_dic):
                dic_paths.append(_dic)
        if not dic_paths:
            base_dir = os.path.join(os.path.dirname(__file__), "hunspell")
            try:
                candidates = [os.path.join(base_dir, name) for name in os.listdir(base_dir) if name.endswith(".dic")]
            except Exception:
                candidates = []
            lang = (languages or "").lower()
            filtered: List[str] = []
            for p in candidates:
                name = os.path.basename(p).lower()
                if ("en" in lang or "eng" in lang) and (name.startswith("en_") or name.startswith("en")):
                    filtered.append(p)
                if ("de" in lang or "deu" in lang or "german" in lang or "deutsch" in lang) and (name.startswith("de_") or name.startswith("de")):
                    filtered.append(p)
            dic_paths = filtered or candidates

        for dic_path in dic_paths:
            wrapper = load_naive_dic(dic_path)
            if wrapper is not None:
                return wrapper
    except Exception:
        pass

    LOGGER.info("Spellchecker: no hunspell/spylls dictionary available")
    try:
        LAST_SPELLCHECKER_INFO.update({"backend": "none"})
    except Exception:
        pass
    return None


def apply_dictionary_correction(text: str, wordlist: Sequence[str], hs=None) -> str:
    if not wordlist:
        # If Hunspell available, do a minimal pass using it only
        if hs is None:
            return text
        dictionary = set()
    else:
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
        if lower in dictionary or (hs is not None and hs.spell(token)):
            return token
        for candidate in generate_candidates(token):
            cand_lower = candidate.lower()
            if cand_lower in dictionary or (hs is not None and hs.spell(candidate)):
                replaced = match_case(candidate, token)
                try:
                    LOGGER.info("Dict correction: %s -> %s", token, replaced)
                except Exception:
                    pass
                return replaced
        return token

    return token_re.sub(replace_token, text)


def apply_umlaut_corrections(text: str, languages: str, wordlist: Sequence[str], hs=None) -> str:
    """
    Convert ASCII digraphs ae/oe/ue to German umlauts \xE4/\xF6/\xFC more comprehensively.

    Strategy:
    - If a dictionary is provided, prefer candidates that appear in it.
    - Otherwise, use word frequency (wordfreq.zipf_frequency) for German to
      select candidates whose frequency noticeably exceeds the original.
    - Preserve original casing (UPPER, Title, lower).
    - Only operate when language is German.
    - Keep conservative: if no strong signal, leave token unchanged.
    """
    lang = (languages or "").lower()
    if not any(token in lang for token in ("de", "deu", "german", "deutsch")):
        return text

    dictionary = {word.lower() for word in (wordlist or [])}

    try:
        from wordfreq import zipf_frequency as _zipf
    except Exception:
        _zipf = None  # wordfreq optional

    ascii_to_umlaut = (("ae", "\\u00e4"), ("oe", "\\u00f6"), ("ue", "\\u00fc"))

    def case_match(candidate: str, original: str) -> str:
        if original.isupper():
            return candidate.upper()
        if original[:1].isupper() and original[1:].islower():
            return candidate.capitalize()
        return candidate

    def generate_variants(token_lower: str) -> List[str]:
        # Generate all unique variants by replacing any subset of ae/oe/ue occurrences
        indices: List[Tuple[int, str, str]] = []
        for ascii_seq, uml in ascii_to_umlaut:
            start = 0
            while True:
                idx = token_lower.find(ascii_seq, start)
                if idx == -1:
                    break
                # Heuristic: avoid replacing "ue" when preceded by 'e' (e.g., "neue", "Treue")
                if ascii_seq == "ue" and idx > 0 and token_lower[idx - 1] == "e":
                    pass
                else:
                    indices.append((idx, ascii_seq, uml))
                start = idx + 1 if idx != -1 else start

        if not indices:
            return []

        # Build combinations
        variants = {token_lower}
        for idx, ascii_seq, uml in indices:
            new_set = set()
            for base in variants:
                # Replace at the same position if still matching
                if base[idx:idx + len(ascii_seq)] == ascii_seq:
                    new_set.add(base[:idx] + uml + base[idx + len(ascii_seq):])
                new_set.add(base)
            variants = new_set
        return [v for v in variants if v != token_lower]

    def pick_best(token: str) -> str:
        lower = token.lower()
        # Quick path: if already contains umlaut, skip
        if any(ch in lower for ch in ("\xE4", "\xF6", "\xFC")):
            return token

        # Generate candidate variants
        candidates = generate_variants(lower)
        if not candidates:
            return token

        # Score candidates
        best = None
        best_score = float("-inf")
        # Base frequency for original
        base_freq = _zipf(lower, "de") if _zipf else 0.0
        for cand in candidates:
            score = 0.0
            if cand in dictionary or (hs is not None and hs.spell(cand)):
                score += 10.0  # strong signal from dictionary
            if _zipf:
                freq = _zipf(cand, "de")
                # Prefer if notably more frequent than original
                score += (freq - base_freq)
            # Prefer shorter (umlaut variant shortens by 1 char per replacement)
            score += (len(lower) - len(cand)) * 0.05
            if score > best_score:
                best = cand
                best_score = score

        # Acceptance threshold: either in dictionary or frequency improved by >= 0.5
        accept = False
        if best is not None:
            if best in dictionary or (hs is not None and hs.spell(best)):
                accept = True
            elif _zipf:
                if (_zipf(best, "de") - base_freq) >= 0.5:
                    accept = True

        if not accept or not best:
            return token
        replaced = case_match(best, token)
        try:
            LOGGER.info("Umlaut correction: %s -> %s", token, replaced)
        except Exception:
            pass
        return replaced

    # Replace word tokens conservatively (length >= 4 to avoid short codes)
    return re.sub(r"[A-Za-z\xC4\xD6\xDC\xE4\xF6\xFC\xDF]{4,}", lambda m: pick_best(m.group(0)), text)


def restore_missing_spaces(text: str, languages: str, hs=None) -> str:
    """
    Conservatively insert spaces inside overlong tokens when a split yields two
    valid words (by Hunspell/Splylls or by wordfreq Zipf >= 3.0 for target langs).

    Heuristics:
    - Consider tokens of length >= 12 with only letters (incl. German chars).
    - Prefer camelCase boundaries (a\u2026zA\u2026Z) when both sides are valid.
    - Otherwise, try a single split; accept only if BOTH parts look valid.
    - Log accepted splits.
    """
    try:
        from wordfreq import zipf_frequency as _zipf
    except Exception:
        _zipf = None

    lang_codes = select_wordfreq_languages(languages)

    def score_word(w: str) -> Tuple[float, bool]:
        spelled = False
        try:
            if hs is not None and hs.spell(w):
                spelled = True
        except Exception:
            pass
        if spelled:
            return 4.0, True
        if _zipf is None:
            return 0.0, False
        try:
            z = max(_zipf(w.lower(), lc) for lc in lang_codes)
        except Exception:
            z = 0.0
        return float(z), False

    token_re = re.compile(r"[A-Za-z\xC4\xD6\xDC\xE4\xF6\xFC\xDF]{12,}")

    def consider_split(tok: str) -> str:
        best = None  # type: Optional[Tuple[str, float, bool, str, float, bool]]

        # Try camelCase boundary first: a\u2026zA\u2026Z
        for m in re.finditer(r"([a-z\xE4\xF6\xFC\xDF])([A-Z\xC4\xD6\xDC])", tok):
            i = m.start(2)
            left, right = tok[:i], tok[i:]
            if len(left) < 3 or len(right) < 3:
                continue
            s1, d1 = score_word(left)
            s2, d2 = score_word(right)
            if (d1 or s1 >= 3.0) and (d2 or s2 >= 3.0):
                combined = s1 + s2
                best = (left, s1, d1, right, s2, d2)
                break

        # Otherwise, try single split positions
        if best is None:
            n = len(tok)
            for i in range(3, n - 2):
                left, right = tok[:i], tok[i:]
                if len(left) < 3 or len(right) < 3:
                    continue
                s1, d1 = score_word(left)
                s2, d2 = score_word(right)
                if (d1 or s1 >= 3.0) and (d2 or s2 >= 3.0):
                    combined = s1 + s2
                    if best is None or combined > (best[1] + best[4]):
                        best = (left, s1, d1, right, s2, d2)

        if best is None:
            return tok

        left, s1, d1, right, s2, d2 = best
        replacement = f"{left} {right}"
        try:
            LOGGER.info(
                "Inserted space: %s -> %s (scores=%.2f/%.2f, dict=%s/%s)",
                tok,
                replacement,
                s1,
                s2,
                d1,
                d2,
            )
        except Exception:
            pass
        return replacement

    return token_re.sub(lambda m: consider_split(m.group(0)), text)


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
    hs = build_spellchecker_for_languages(config, languages) if config.enable_hunspell else None
    # Attempt to restore missing spaces before word-level corrections
    try:
        restored = restore_missing_spaces(cleaned, languages, hs)
        if restored != cleaned:
            LOGGER.info("Applied missing-space restoration pass")
        cleaned = restored
    except Exception as exc:
        LOGGER.warning("Missing-space restoration failed: %s", exc)
    if config.enable_dictionary_correction or hs is not None:
        cleaned = apply_dictionary_correction(cleaned, wordlist, hs)
    cleaned = apply_umlaut_corrections(cleaned, languages, wordlist, hs)
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


def find_tesseract_cmd() -> Optional[str]:
    # Try PATH first
    path = shutil.which("tesseract")
    if path:
        return path
    # Common macOS/Linux locations
    for candidate in ("/opt/homebrew/bin/tesseract", "/usr/local/bin/tesseract", "/usr/bin/tesseract"):
        if os.path.isfile(candidate) or shutil.which(candidate):
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


def _find_column_gutters_from_density(
    density: Sequence[float],
    config: DoclingProcessingConfig,
) -> List[int]:
    """
    Return x-index positions (relative to density array) for vertical gutters.
    Uses same thresholds as count_column_gaps but returns midpoints of long gaps.
    """
    if not density:
        return []
    total = len(density)
    margin = max(1, int(total * 0.05))
    start = margin
    end = max(start + 1, total - margin)
    core = density[start:end]
    if not core:
        return []
    text_level = density_percentile(core, config.column_detect_text_percentile)
    if text_level < config.column_detect_min_text_density:
        return []
    threshold = max(config.column_detect_min_gap_density, text_level * config.column_detect_gap_threshold_ratio)
    min_gap = max(1, int(len(core) * config.column_detect_min_gap_ratio))

    gutters: List[int] = []
    idx = 0
    while idx < len(core):
        if core[idx] < threshold:
            gap_start = idx
            while idx < len(core) and core[idx] < threshold:
                idx += 1
            gap_end = idx
            if gap_end - gap_start >= min_gap:
                gutters.append(start + (gap_start + gap_end) // 2)
        else:
            idx += 1
    # Return up to 2 strongest (center-most) gutters for typical 2-3 columns
    if len(gutters) > 2:
        center = total / 2.0
        gutters = sorted(gutters, key=lambda x: abs(x - center))[:2]
        gutters.sort()
    return sorted(gutters)


def _find_column_splits(image: Any, config: DoclingProcessingConfig) -> List[Tuple[int, int]]:
    """
    Compute x-intervals for columns using density gutters. Returns a list of
    (x0, x1) pixel bounds covering the page width split into columns.
    """
    density = compute_column_density(image, config)
    density = smooth_density(density, config.column_detect_smooth_window)
    gutters = _find_column_gutters_from_density(density, config)
    width = image.size[0]
    if not gutters:
        return [(0, width)]
    xs = [0] + gutters + [width]
    splits: List[Tuple[int, int]] = []
    for i in range(len(xs) - 1):
        x0 = xs[i]
        x1 = xs[i + 1]
        # Expand slightly away from gutter to avoid cutting characters
        if i > 0:
            x0 += config.column_split_margin_px
        if i < len(xs) - 2:
            x1 -= config.column_split_margin_px
        x0 = max(0, min(x0, width))
        x1 = max(0, min(x1, width))
        if x1 - x0 > max(10, int(width * 0.1)):
            splits.append((x0, x1))
    return splits or [(0, width)]


def _fixed_column_splits(image: Any, ncols: int, margin_px: int) -> List[Tuple[int, int]]:
    width = image.size[0]
    if ncols <= 1:
        return [(0, width)]
    col_w = width / float(ncols)
    splits: List[Tuple[int, int]] = []
    for i in range(ncols):
        x0 = int(round(i * col_w))
        x1 = int(round((i + 1) * col_w))
        if i > 0:
            x0 += margin_px
        if i < ncols - 1:
            x1 -= margin_px
        x0 = max(0, min(x0, width))
        x1 = max(0, min(x1, width))
        if x1 - x0 > max(10, int(width * 0.1)):
            splits.append((x0, x1))
    return splits or [(0, width)]


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
    # Ensure the tesseract binary is set explicitly (macOS PATH issues)
    try:
        cmd = find_tesseract_cmd()
        if cmd:
            pytesseract.pytesseract.tesseract_cmd = cmd
            LOGGER.info("Using tesseract binary: %s", cmd)
    except Exception:
        pass

    pages: List[Dict[str, Any]] = []
    total = max(1, len(images))
    for idx, image in enumerate(images, start=1):
        try:
            # Default to a sensible page segmentation and engine mode
            cfg = f"--psm {DoclingProcessingConfig.tesseract_psm} --oem {DoclingProcessingConfig.tesseract_oem}"
            text = pytesseract.image_to_string(image, lang=languages, config=cfg)
        except Exception as exc:
            LOGGER.warning("Tesseract image_to_string failed: %s", exc)
            text = ""
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
    try:
        LOGGER.info("External OCR: rendered %d page images at %ddpi", len(images), config.ocr_dpi)
    except Exception:
        pass

    norm_lang = normalize_languages_for_engine(languages, engine)

    # Fast path: no column splitting requested
    if not config.column_split_ocr:
        if engine == "paddle":
            return ocr_pages_with_paddle(
                images,
                norm_lang,
                progress_cb,
                progress_base,
                progress_span,
            )
        if engine == "tesseract":
            return ocr_pages_with_tesseract(
                images,
                norm_lang,
                progress_cb,
                progress_base,
                progress_span,
            )
        return [], {}

    # Per-column OCR: split each image into columns and OCR left->right
    try:
        LOGGER.info("Using external OCR with per-column splitting (engine=%s, lang=%s)", engine, norm_lang)
    except Exception:
        pass
    pages: List[Dict[str, Any]] = []
    confidences: List[float] = []
    total = max(1, len(images))

    # Prepare engine instance (Paddle is heavy to init)
    paddle_ocr = None
    if engine == "paddle":
        try:
            from paddleocr import PaddleOCR  # type: ignore
            import numpy as np  # noqa: F401
            paddle_ocr = PaddleOCR(use_angle_cls=True, lang=norm_lang)
        except Exception as exc:
            LOGGER.warning("Paddle init failed for per-column OCR: %s", exc)
            # Fallback to Tesseract if available
            try:
                import pytesseract  # noqa: F401
                LOGGER.info("Falling back to Tesseract for per-column OCR")
                engine = "tesseract"
            except Exception:
                return [], {}

    for idx, image in enumerate(images, start=1):
        # Determine columns for this page
        splits = _find_column_splits(image, config)

        # OCR helper over a list of crops
        def ocr_column_crops(crops: List[Tuple[int, int]]) -> Tuple[List[str], float]:
            texts: List[str] = []
            total_len = 0.0
            try:
                import numpy as np
            except Exception:
                np = None  # type: ignore
            for (x0, x1) in crops:
                crop = image.crop((x0, 0, x1, image.size[1]))
                text_part = ""
                if engine == "paddle" and paddle_ocr is not None and np is not None:
                    try:
                        result = paddle_ocr.ocr(np.array(crop), cls=True)
                    except Exception:
                        result = None
                    lines: List[str] = []
                    if result:
                        for entry in result[0] if isinstance(result, list) else result:
                            if not entry:
                                continue
                            if isinstance(entry, (list, tuple)) and len(entry) >= 2:
                                txt = entry[1]
                                if isinstance(txt, (list, tuple)) and txt:
                                    lines.append(str(txt[0]))
                                    if len(txt) > 1 and isinstance(txt[1], (float, int)):
                                        confidences.append(float(txt[1]))
                                else:
                                    lines.append(str(txt))
                    text_part = "\\n".join(lines)
                elif engine == "tesseract":
                    try:
                        import pytesseract
                        cfg = f"--psm {DoclingProcessingConfig.tesseract_psm} --oem {DoclingProcessingConfig.tesseract_oem}"
                        text_part = pytesseract.image_to_string(crop, lang=norm_lang, config=cfg)
                    except Exception as exc:
                        LOGGER.warning("Tesseract OCR failed on column crop: %s", exc)
                        text_part = ""
                else:
                    text_part = ""
                text_part = text_part.strip()
                texts.append(text_part)
                total_len += float(len(text_part))
            return texts, total_len

        col_texts, score = ocr_column_crops(splits)

        # If detection failed or content is very low, try fixed 2/3-column grids and pick best
        if score < 50.0 or len(splits) <= 1:
            best_texts = col_texts
            best_score = score
            best_n = 0
            for n in (2, 3):
                fixed = _fixed_column_splits(image, n, config.column_split_margin_px)
                texts_n, score_n = ocr_column_crops(fixed)
                try:
                    LOGGER.info("Per-column fallback: %d-col grid score=%.0f vs %.0f", n, score_n, best_score)
                except Exception:
                    pass
                if score_n > best_score:
                    best_texts, best_score, best_n = texts_n, score_n, n
            if best_n:
                col_texts = best_texts
                try:
                    LOGGER.info("Per-column fallback chosen: %d columns", best_n)
                except Exception:
                    pass

        # Concatenate columns left->right, keep separation
        page_text = "\\n\\n".join([t for t in col_texts if t])
        if not page_text:
            page_text = ""  # ensure string
        pages.append({"page_num": idx, "text": page_text})

        if progress_cb and progress_span > 0:
            percent = progress_base + int(idx / total * progress_span)
            progress_cb(percent, "ocr", f"Per-column OCR page {idx}/{total}")

    stats: Dict[str, Any] = {}
    if confidences:
        stats["ocr_confidence_avg"] = sum(confidences) / len(confidences)
    LOGGER.info("Applied per-column external OCR on %d pages (engine=%s)", len(pages), engine)
    return pages, stats


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
    try:
        LOGGER.info(
            "convert:start | per_column=%s, ocr=%s, prefer=%s, fallback=%s",
            getattr(config, "column_split_ocr", False),
            getattr(config, "ocr_mode", "auto"),
            getattr(config, "prefer_ocr_engine", "paddle"),
            getattr(config, "fallback_ocr_engine", "tesseract"),
        )
    except Exception:
        pass
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
    # Hard override: if per-column OCR is requested, ensure we plan external per-page OCR
    if getattr(config, "column_split_ocr", False):
        try:
            # Force external OCR path; choose prefer engine, else fallback, else keep prefer
            # (run_external_ocr_pages will auto-fallback to Tesseract if Paddle init fails)
            decision.ocr_engine = (
                config.prefer_ocr_engine
                if config.prefer_ocr_engine in ("paddle", "tesseract")
                else "tesseract"
            )
            if decision.ocr_engine == "paddle" and ("paddle" not in available_engines) and ("tesseract" in available_engines):
                decision.ocr_engine = "tesseract"
            decision.use_external_ocr = True
            decision.ocr_used = True
            decision.per_page_ocr = True
            decision.per_page_reason = "Per-column OCR requested by config"
            LOGGER.info("Per-column OCR override engaged (engine=%s)", decision.ocr_engine)
        except Exception:
            pass
    rasterized_source = False
    rasterized_pdf_path = ""
    rasterize_error: Optional[str] = None
    column_layout: Optional[ColumnLayoutDetection] = None
    if should_rasterize_text_layer(has_text_layer, low_quality, config):
        # If we intend to use external OCR with per-column splitting directly from the PDF,
        # skip rasterization. If 'after_rasterize' is requested, we still rasterize here.
        if config.column_split_ocr and not getattr(config, "column_split_after_rasterize", False) and decision.use_external_ocr and decision.per_page_ocr:
            LOGGER.info("Skipping rasterization to allow external per-column OCR (engine=%s)", decision.ocr_engine)
        else:
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

    if config.column_detect_enable and ( (decision.ocr_used and (rasterized_source or not has_text_layer)) or config.column_split_ocr ):
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
            if column_layout.detected:
                if config.column_split_ocr:
                    # Enforce per-column external OCR
                    available_engines = detect_available_ocr_engines()
                    if not decision.use_external_ocr:
                        if config.prefer_ocr_engine in available_engines:
                            decision.ocr_engine = config.prefer_ocr_engine
                            decision.use_external_ocr = True
                            decision.ocr_used = True
                        elif config.fallback_ocr_engine in available_engines:
                            decision.ocr_engine = config.fallback_ocr_engine
                            decision.use_external_ocr = True
                            decision.ocr_used = True
                    decision.per_page_ocr = True
                    decision.per_page_reason = "Columns detected; using per-column external OCR"
                    LOGGER.info("Per-column OCR will be used due to column layout (engine=%s)", decision.ocr_engine)
                elif decision.use_external_ocr and decision.per_page_ocr:
                    # Without per-column OCR, Docling layout tends to be better
                    decision.per_page_ocr = False
                    decision.per_page_reason = "Columns detected; keep Docling layout"
            else:
                # If detection fails but per-column OCR is requested, try anyway with split heuristics.
                if config.column_split_ocr:
                    available_engines = detect_available_ocr_engines()
                    if not decision.use_external_ocr:
                        if config.prefer_ocr_engine in available_engines:
                            decision.ocr_engine = config.prefer_ocr_engine
                            decision.use_external_ocr = True
                            decision.ocr_used = True
                        elif config.fallback_ocr_engine in available_engines:
                            decision.ocr_engine = config.fallback_ocr_engine
                            decision.use_external_ocr = True
                            decision.ocr_used = True
                    decision.per_page_ocr = True
                    decision.per_page_reason = "Column gutters not found; attempting heuristic per-column OCR"
                    LOGGER.info("Per-column OCR will be attempted heuristically (no gutters detected)")
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
    try:
        LOGGER.info(
            "External OCR gate: used=%s external=%s per_page=%s rasterized=%s column_split=%s after_rasterize=%s",
            decision.ocr_used,
            decision.use_external_ocr,
            decision.per_page_ocr,
            rasterized_source,
            config.column_split_ocr,
            config.column_split_after_rasterize,
        )
    except Exception:
        pass
    if decision.ocr_used and decision.use_external_ocr and decision.per_page_ocr and (not rasterized_source or config.column_split_ocr or config.column_split_after_rasterize):
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
    elif decision.ocr_used and config.column_split_ocr and not decision.use_external_ocr:
        LOGGER.info("Per-column OCR requested, but no external engine available; falling back to Docling OCR")
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
    if column_layout and config.column_split_ocr and decision.use_external_ocr and decision.per_page_ocr:
        metadata["per_column_ocr"] = True
    # Attach spellchecker backend info if available
    if LAST_SPELLCHECKER_INFO:
        try:
            metadata.update({
                "spellchecker_backend": LAST_SPELLCHECKER_INFO.get("backend"),
                "spellchecker_dic": LAST_SPELLCHECKER_INFO.get("dic"),
                "spellchecker_aff": LAST_SPELLCHECKER_INFO.get("aff"),
            })
        except Exception:
            pass
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
    parser.add_argument("--download-hunspell", metavar="LANG_CODE", type=str, help="Download Hunspell dictionary for given language code (e.g. de_DE, en_US, fr_FR)")
    parser.add_argument("--pdf", required=False, help="Path to PDF")
    parser.add_argument("--doc-id", help="Document identifier")
    parser.add_argument("--out-json", help="Output JSON path")
    parser.add_argument("--out-md", help="Output markdown path")
    parser.add_argument("--log-file", help="Optional path to write a detailed log file")
    parser.add_argument("--spellchecker-info-out", help="Optional path to write spellchecker backend info JSON")
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
    parser.add_argument("--enable-dictionary-correction", action="store_true", help="Enable dictionary-based OCR corrections")
    parser.add_argument("--dictionary-path", help="Path to dictionary wordlist (one word per line)")
    parser.add_argument("--enable-hunspell", action="store_true", help="Enable Hunspell dictionary support if available")
    parser.add_argument("--hunspell-aff", help="Path to Hunspell .aff file")
    parser.add_argument("--hunspell-dic", help="Path to Hunspell .dic file")
    parser.add_argument(
        "--prefer-per-column-ocr",
        action="store_true",
        help="If a multi-column layout is detected, force external OCR with per-column splitting",
    )
    parser.add_argument(
        "--column-split-margin",
        type=int,
        help="Pixel margin to keep away from detected gutters when splitting columns",
    )
    parser.add_argument(
        "--column-split-after-rasterize",
        action="store_true",
        help="Render pages to images and then run per-column OCR, ignoring the PDF text layer",
    )
    parser.add_argument(
        "--external-ocr-only",
        action="store_true",
        help="Bypass Docling conversion; render pages to images and run external OCR (respects per-column flags)",
    )

    # Parse only known args to allow --download-hunspell to work standalone
    args, _ = parser.parse_known_args()

    if args.download_hunspell:
        lang_code = args.download_hunspell
        # Map special cases for repo structure
        repo_map = {
            "de_DE": ("de", "de_DE_frami"),
            "de_AT": ("de", "de_AT"),
            "de_CH": ("de", "de_CH"),
            "en_US": ("en", "en_US"),
            "en_GB": ("en", "en_GB"),
            "fr_FR": ("fr_FR", "fr"),
        }
        # Default: folder and file prefix are lang_code
        folder, prefix = repo_map.get(lang_code, (lang_code, lang_code))
        base_url = f"https://raw.githubusercontent.com/LibreOffice/dictionaries/master/{folder}/"
        aff_name = f"{prefix}.aff"
        dic_name = f"{prefix}.dic"
        aff_url = base_url + aff_name
        dic_url = base_url + dic_name
        out_dir = os.path.join(os.path.dirname(__file__), "hunspell")
        os.makedirs(out_dir, exist_ok=True)
        aff_path = os.path.join(out_dir, f"{lang_code}.aff")
        dic_path = os.path.join(out_dir, f"{lang_code}.dic")
        def download(url, out_path):
            try:
                import urllib.request
                urllib.request.urlretrieve(url, out_path)
                return True
            except Exception as exc:
                print(f"Failed to download {url}: {exc}")
                return False
        print(f"Downloading {aff_url} -> {aff_path}")
        ok_aff = download(aff_url, aff_path)
        print(f"Downloading {dic_url} -> {dic_path}")
        ok_dic = download(dic_url, dic_path)
        if ok_aff and ok_dic:
            print(f"Successfully downloaded Hunspell dictionary for {lang_code} to {out_dir}")
            return 0
        else:
            print(f"Failed to download Hunspell dictionary for {lang_code}. Check the language code or try manually.")
            return 1

    # Require --pdf for normal operation
    if not args.pdf:
        parser.print_help()
        return 2

    logging.basicConfig(level=logging.INFO)
    # If a log file was requested, add a file handler
    if args.log_file:
        try:
            fh = logging.FileHandler(args.log_file, encoding="utf-8")
            fh.setLevel(logging.INFO)
            formatter = logging.Formatter("%(asctime)s %(levelname)s %(name)s: %(message)s")
            fh.setFormatter(formatter)
            logging.getLogger().addHandler(fh)
            LOGGER.info("Logging to file: %s", args.log_file)
        except Exception as exc:
            eprint(f"Failed to set up log file {args.log_file}: {exc}")


    if not os.path.isfile(args.pdf):
        eprint(f"PDF not found: {args.pdf}")
        return 2

    if args.quality_only:
        try:
            LOGGER.info(
                "Mode=quality-only | ocr=%s, prefer=%s, fallback=%s, column_split_ocr=%s, lang_hint=%s",
                args.ocr,
                DoclingProcessingConfig().prefer_ocr_engine,
                DoclingProcessingConfig().fallback_ocr_engine,
                False,
                args.language_hint or "",
            )
        except Exception:
            pass
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
    if args.enable_dictionary_correction:
        config.enable_dictionary_correction = True
    if args.dictionary_path:
        config.dictionary_path = args.dictionary_path
    if args.enable_hunspell:
        config.enable_hunspell = True
    if args.hunspell_aff:
        config.hunspell_aff_path = args.hunspell_aff
    if args.hunspell_dic:
        config.hunspell_dic_path = args.hunspell_dic
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

    # Column OCR preferences
    if args.prefer_per_column_ocr:
        config.column_split_ocr = True
    if args.column_split_margin is not None:
        config.column_split_margin_px = max(0, int(args.column_split_margin))
    if args.column_split_after_rasterize:
        config.column_split_after_rasterize = True

    config.llm_correct = build_llm_cleanup_callback(config)

    # Log a concise run configuration summary
    try:
        LOGGER.info(
            "Mode=full | ocr=%s, prefer=%s, fallback=%s, force_low_q=%s, column_split_ocr=%s, split_margin=%spx, after_rasterize=%s, keep_img=%s, dict_correction=%s, lang_hint=%s",
            config.ocr_mode,
            config.prefer_ocr_engine,
            config.fallback_ocr_engine,
            config.force_ocr_on_low_quality_text,
            config.column_split_ocr,
            config.column_split_margin_px,
            getattr(config, "column_split_after_rasterize", False),
            not config.cleanup_remove_image_tags,
            config.enable_dictionary_correction,
            config.language_hint or "",
        )
    except Exception:
        pass

    # Proactively build spellchecker once to record backend info; will be reused lazily later
    spell_langs = select_language_set(config.language_hint, args.pdf, config)
    if config.enable_hunspell:
        try:
            _ = build_spellchecker_for_languages(config, spell_langs)
        except Exception:
            pass

    # Optionally write spellchecker backend info to a file
    if args.spellchecker_info_out:
        try:
            info = dict(LAST_SPELLCHECKER_INFO)
            info["languages"] = spell_langs
            out_dir = os.path.dirname(args.spellchecker_info_out)
            if out_dir:
                os.makedirs(out_dir, exist_ok=True)
            with open(args.spellchecker_info_out, "w", encoding="utf-8") as fh:
                json.dump(info, fh, indent=2)
            LOGGER.info("Wrote spellchecker info to %s", args.spellchecker_info_out)
        except Exception as exc:
            LOGGER.warning("Failed to write spellchecker info file: %s", exc)

    # External OCR only mode
    if args.external_ocr_only:
        try:
            LOGGER.info("Mode=external-ocr-only | per_column=%s, after_rasterize=%s", config.column_split_ocr, config.column_split_after_rasterize)
        except Exception:
            pass
        # Choose engine
        engines = detect_available_ocr_engines()
        engine = config.prefer_ocr_engine if config.prefer_ocr_engine in engines else (
            config.fallback_ocr_engine if config.fallback_ocr_engine in engines else (engines[0] if engines else "tesseract")
        )
        languages = select_language_set(config.language_hint, args.pdf, config)
        ocr_pages, ocr_stats = run_external_ocr_pages(
            args.pdf,
            engine,
            languages,
            config,
        )
        pages = ocr_pages
        total_chars = sum(len(p.get("text", "")) for p in pages)
        try:
            LOGGER.info("External OCR produced %d pages, total_chars=%d (engine=%s)", len(pages), total_chars, engine)
        except Exception:
            pass
        # Fallbacks: if empty text, retry with whole-page OCR and/or Tesseract
        if total_chars == 0:
            try:
                LOGGER.warning("External OCR produced no text; retrying with whole-page OCR")
                cfg2 = DoclingProcessingConfig(ocr_mode="force")
                cfg2.ocr_dpi = config.ocr_dpi
                cfg2.column_split_ocr = False
                retry_engine = engine
                if engine != "tesseract":
                    retry_engine = "tesseract"
                pages2, stats2 = run_external_ocr_pages(
                    args.pdf,
                    retry_engine,
                    languages,
                    cfg2,
                )
                t2 = sum(len(p.get("text", "")) for p in pages2)
                LOGGER.info("Retry external OCR whole-page total_chars=%d (engine=%s)", t2, retry_engine)
                if t2 > total_chars:
                    pages, ocr_stats, total_chars, engine = pages2, stats2, t2, retry_engine
            except Exception as exc:
                LOGGER.warning("Retry OCR failed: %s", exc)

        # Final fallback: use Docling OCR (ocrmac) so we never return empty
        if total_chars == 0:
            try:
                LOGGER.warning("External OCR still empty; falling back to Docling OCR pipeline")
                cfg3 = DoclingProcessingConfig(ocr_mode="force")
                cfg3.force_ocr_on_low_quality_text = True
                result = convert_pdf_with_docling(args.pdf, cfg3)
                pages = result.pages
                languages = result.metadata.get("languages", languages)
                engine = result.metadata.get("ocr_engine", "docling")
                total_chars = sum(len(str(p.get("text", ""))) for p in pages)
                LOGGER.info("Docling OCR fallback produced %d pages, total_chars=%d", len(pages), total_chars)
            except Exception as exc:
                LOGGER.warning("Docling OCR fallback failed: %s", exc)
        markdown = "\\n\\n".join(p.get("text", "") for p in pages)
        payload = {
            "doc_id": args.doc_id or "doc",
            "source_pdf": args.pdf,
            "chunks": build_chunks_page(args.doc_id or "doc", pages, config=config),
            "metadata": {
                "ocr_used": True,
                "ocr_engine": engine,
                "languages": languages,
                "per_column_ocr": bool(config.column_split_ocr),
                **ocr_stats,
            },
        }
        # Optional post-correction (spellchecker/dictionary/umlauts)
        try:
            post_pages = []
            if config.enable_post_correction:
                wordlist = prepare_dictionary_words(config)
                for p in pages:
                    txt = str(p.get("text", ""))
                    if not txt:
                        post_pages.append(p)
                        continue
                    fixed = postprocess_text(txt, config, languages, wordlist)
                    post_pages.append({"page_num": p.get("page_num", 0), "text": fixed})
                pages = post_pages
                total_chars = sum(len(p.get("text", "")) for p in pages)
                LOGGER.info("Post-correction applied; total_chars now %d", total_chars)
        except Exception as exc:
            LOGGER.warning("Post-correction failed: %s", exc)

        # Build markdown and chunks
        markdown = "\\n\\n".join(p.get("text", "") for p in pages)
        postprocess_fn: Optional[Callable[[str], str]] = None
        if config.enable_post_correction:
            wordlist = prepare_dictionary_words(config)
            postprocess_fn = lambda text: postprocess_text(text, config, languages, wordlist)

        chunks = build_chunks_page(args.doc_id or "doc", pages, config=config, postprocess=postprocess_fn)

        # Write outputs if requested
        try:
            if args.out_md:
                with open(args.out_md, "w", encoding="utf-8") as handle:
                    handle.write(markdown)
        except Exception as exc:
            eprint(f"Failed to write markdown: {exc}")
            return 2
        try:
            if args.out_json:
                with open(args.out_json, "w", encoding="utf-8") as handle:
                    json.dump(payload, handle, indent=2)
        except Exception as exc:
            eprint(f"Failed to write JSON: {exc}")
            return 2
        return 0

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
`,"rag_query_redisearch.py":`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.2.2

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


def eprint(message: str) -> None:
    sys.stderr.write(message + "\\n")

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

def is_content_chunk(chunk: Dict[str, Any]) -> bool:
    text = chunk.get("text", "")
    if not text:
        return False

    # 1. Minimum length (filters title pages, citations)
    if len(text) < 500:
        return False

    # 2. Must contain narrative sentences
    # (bibliographies rarely have multiple full sentences)
    if text.count(". ") < 3:
        return False

    return True

def looks_narrative(text: str) -> bool:
    if not text:
        return False

    # Must contain several complete sentences
    if text.count(". ") < 4:
        return False

    # Optional: avoid list-like text
    if text.count("\\n") > len(text) / 80:
        return False

    return True

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
    parser.add_argument("--k", type=int, default=10)
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

    # merge lexical results (unchanged)
    keywords = extract_keywords(args.query)
    lexical_limit = max(args.k, 5)
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

    # Strict filter
    filtered = [
        c for c in retrieved
        if is_content_chunk(c) and looks_narrative(c.get("text", ""))
    ]

    # Fallback: if too strict, keep "contentful" chunks at least (from ORIGINAL retrieved)
    if not filtered:
        filtered = [c for c in retrieved if is_content_chunk(c)]

    retrieved = filtered

    context = build_context(retrieved)

    system_prompt = (
        "Use ONLY the provided context for factual claims. If insufficient, say you do not know. "
        "Chat history is only for conversational continuity or for providing concepts to be retrieved. "
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
aai
aam
abb
abge
abr
absol
abteilungs
acad
acc
acco
accu
ackley
acn
acp
actu
addie
adolphus
adress
af
afew
aff
afton
agarwal
agonized
agonizing
agrar
agt
agu
ahh
ahram
aicha
aigner
aip
aire
aj
ake
aken
ala
alanus
albeck
albers
albornoz
ald
alda
aleksandra
alfaro
alibaba
alittle
alla
allard
alli
allin
allman
allright
alongwith
alonso
ame
amelie
ameri
amg
amityville
amr
ams
analyze
analyzed
analyzing
anan
anc
anca
ance
ande
ander
andersonville
andr
andra
andrae
andrus
ands
andthe
ane
anent
ange
angelis
ani
ania
anish
anneke
anni
annis
antone
antti
anz
ao
apac
apel
aph
apl
apologize
appl
applegate
aq
arbei
arbeits
archeological
archi
ari
aris
armando
armor
arri
arrowsmith
artem
artes
arti
arvid
arxiv
asan
aschauer
ase
asi
askin
aspx
assis
asso
assoc
astro
aswell
ater
atk
atla
atlan
atleast
atmos
ats
att
atta
atten
atthe
aubry
aufge
aufl
aul
aun
aurore
ausge
auskunfts
auss
authorization
authorized
authorizing
avas
avg
avo
aw
aways
awi
ax
ay
ayres
az
azhar
bab
badgley
bagwell
baily
bains
bal
balaji
ballston
bama
banerjee
banz
barger
barnaby
baro
barret
bascom
batchelor
bayless
bayne
baynes
bayo
bbe
beall
beaty
beca
beckedahl
beetz
befor
begleit
behavior
behavioral
behaviors
beit
bek
belcher
bellum
belter
beltran
bemis
bene
bengt
benj
bepreisung
bera
beratungs
bergemann
bernal
bero
berr
berryman
berthier
bertin
bertuch
besse
bestof
beteiligungs
betz
beuth
bewertungs
bge
biblio
bibliotheks
bice
bie
bil
bildungs
bina
bir
birney
birte
bisbee
bischoff
bissell
biswas
bitkom
bitt
bjorn
bj\xF6rk
blacklight
blackwall
blaisdell
blakeley
blakely
ble
bles
blinn
blogspot
blowed
blu
bmi
bmwi
boe
boehm
boggs
bogue
boj
bol
boland
boldt
boller
boney
bonino
borchers
boren
borrego
borrmann
bos
bosman
boulanger
boult
bourdieu
boysen
bpa
brabeck
bracher
brammer
brashear
breck
breuning
breyer
bridgeman
bridgette
brien
brin
brinker
briony
bris
briscoe
brockmann
brok
brost
brubaker
brunner
bruns
bsi
bu
buchner
budrich
bui
buildin
buildup
buisson
bul
bungen
bunn
burchardt
burdett
burks
burling
busi
b\xF6hmer
b\xF6ker
b\xFChren
b\xFCr
b\xFCttner
cabeza
cade
cady
cai
cali
calif
callender
callie
cally
campania
canan
candor
caney
cantrell
cao
capi
caplan
capt
caput
carell
caribe
carmack
caron
carondelet
carpathia
carrasco
carrillo
cassel
cassell
castell
castellanos
castelli
castleman
catalog
cataloging
catalogs
cate
categorization
categorize
categorized
cates
cau
caus
cavalli
cavanaugh
cci
cco
cdi
cec
cecilie
ced
cedrik
cele
celo
centered
centering
centerline
centern
centerpiece
centimeters
centralized
cept
cera
cerf
chai
champollion
chancellorsville
chantel
chao
chapelle
chappell
characterize
characterized
characterizes
characterizing
chas
chawla
ched
chien
chil
childs
chim
chiseled
christof
christophe
chua
chul
chun
cil
cin
cio
cios
cip
cit
civ
civilized
cked
cken
clamor
clarins
claussen
cle
clearinghouse
clemons
cler
clu
cof
coinbase
colla
colo
colonized
color
colored
colorful
colors
colvin
colwell
com
commis
commu
commun
communi
compl
conant
conceptualization
condi
conf
confed
conn
consilium
const
constans
contro
cookson
coons
coord
cordis
cormack
corp
corrado
corre
corte
cortez
costas
couldn
coun
cour
courant
cov
cowles
crain
cre
crea
cremer
crippen
cris
criticize
criticized
croom
cros
crue
cta
cullum
culp
cunard
cuno
cupp
curr
curtin
cus
cutoff
dae
dage
dai
dailey
dak
dalit
dalla
dani
darko
darlin
darrow
dau
davey
dayal
ddi
decentralized
deepwater
defense
defenses
defi
delisle
delt
demeanor
demobilization
democratization
democratizing
dende
dene
denney
dennison
deppe
dept
desy
deve
devel
dhar
diarrhea
dickel
didi
didn
dier
dierkes
dietze
dif
digi
digitalization
digitization
digitize
digitized
dil
diller
dinan
dinh
dini
dipl
direc
diw
dle
doa
doan
docent
docu
doesn
dois
dol
dominika
donatella
donelson
dor
dorman
dors
dorsett
doty
dou
dowell
downtown
doz
dra
dragan
drago
dred
dren
drescher
dressler
dreyer
dri
drumm
drydock
dsgvo
dte
dto
duce
duquesne
durin
durkin
eac
ead
eadie
eam
earle
earnshaw
eastport
ebd
ebe
ebel
eberl
ebi
ebru
ecl
eco
econ
eda
edc
edi
edu
eep
eer
eero
eet
ef
effi
efl
eggenstein
egovernment
ehem
ehr
eickhoff
einge
eini
eir
ek
eldridge
ele
elearning
elec
electrolytic
elek
elevator
eley
elihu
elina
elkin
eln
els
eman
emelia
emer
emerick
emilie
emmons
emp
emphasize
emphasized
emphasizes
emphasizing
ena
enb
ence
endeavor
endeavored
endeavoring
endeavors
ene
enes
engelhardt
engi
engl
engle
engr
enke
enos
enrollment
ent
ents
entstehungs
entwicklungs
enwg
eos
epi
epicenter
epub
equaled
erc
erd
erfahrungs
erick
ern
ert
ertl
erw
ery
eso
esq
ess
esta
estab
etc
ete
etl
etta
ette
europ
europaea
europeana
evi
evtl
ew
ewr
exc
expe
exper
experi
ey
ez
eze
fabienne
fabio
fabricius
fabrizio
faelle
fairbank
fal
fam
fami
fannie
farb
farida
farrar
farris
faruk
fau
favor
favorable
favorably
favored
favorite
favorites
favors
fechner
fect
fel
fellner
fennell
fiberglass
fid
fidler
fied
fif
filippo
filson
finalized
finke
finkle
fiz
fla
flaherty
flam
flavor
fo
foltz
fom
fon
forde
formalized
fors
forschungs
forthe
fos
fournier
frac
frantz
franzen
frasier
fre
frede
fsu
fte
fue
fueled
fueling
fuer
ful
fulfill
fulfillment
fung
furth
fyfe
f\xE4
f\xF6r
f\xFCh
gabbert
gah
galler
galvanized
gan
gangen
gannon
gant
garay
garber
gart
gass
gassmann
gaynor
gebauer
gebhart
geddy
geert
gehostet
gend
gener
generalize
generalized
gennady
geoportal
georgen
georgy
gerdes
gerstner
getz
gfa
ghosh
gia
gie
gien
giga
gillam
gillen
gini
ginn
givens
glaeser
glamor
glaucus
gle
glei
gleim
glenwood
goble
goll
gonzalo
goodell
goodspeed
gorman
gov
gove
gover
govt
gow
goyal
gra
gradl
grandy
gra\xDFhoff
gree
greenlee
gress
grethe
griebel
gris
gro
groessten
groth
grubbs
grueling
gsi
guage
guid
gundlach
gung
guo
gustin
gutach
gutknecht
gvo
g\xF6tting
g\xFCnzel
haa
hadad
hadn
haight
halleck
halliday
hamblin
hammonds
handlungs
hanlon
hanni
hanser
hao
har
harari
harbors
haren
harland
harmonia
harpercollins
harrassowitz
hartig
hartung
haslinger
hasn
hatteras
hausers
hav
havard
havemann
hawken
hayashi
hayman
hazzard
hedlund
hedrick
hee
heesen
heidrich
heinke
heinzel
heise
heit
hel
helbig
helbing
hennessy
henrich
henrike
herchen
hermione
herron
hewes
heyde
hickox
hig
hight
hildreth
hillmann
hinde
hinman
hinze
hippel
hippler
hir
hirt
histo
histor
hite
hoffmeister
hoge
hogrefe
hollenbeck
holliday
holston
holzer
hom
homan
homeoffice
hon
honor
honorably
honored
honoring
honors
hoppe
hoppin
hor
horan
hori
hornbostel
horstmann
hoskins
hospitalization
hospitalized
houten
howards
hre
hu
hua
hubbell
hulbert
huma
humm
hungen
hup
hur
husted
hvac
h\xF6ck
h\xFCbner
h\xFClsmann
iai
iam
iana
iat
ib
ibero
ibi
ibs
ica
ican
ico
icr
ics
ict
ident
idf
idi
idl
idlewild
iel
ife
ifyou
igd
ight
igi
ign
ih
ihave
ihe
ij
ik
ikt
il
ilene
ilie
ille
illi
illus
ils
ime
imma
immortalized
impor
impro
imt
inan
incase
incl
includ
indi
industrialization
infact
infor
informa
ingen
ingraham
inhouse
init
injun
inkl
inl
innis
inno
innova
insbes
inslee
inso
insp
instill
inte
interagency
interes
interhyp
inthe
ione
ior
ious
ipcc
ipp
iro
irt
isadore
isc
isin
isla
ismay
isn
ison
isu
ita
ite
ithink
itis
ity
iven
iwas
iwill
ized
jaap
jabez
jahnke
jama
jamison
janna
janney
jano
jantzen
jarrett
jas
jayne
jenn
jeopardize
jeopardized
jesper
jessika
jewell
jewelry
jewett
ji
jian
jie
jif
jillian
jin
jobe
jochum
johne
jol
jolley
joost
jopp
jordon
jos
jour
jourdan
jugg
justi
juventa
jyoti
j\xF6rn
kad
kaden
kag
kalman
kaminsky
kan
kannt
karan
karina
karolin
karsch
kas
katarzyna
kaupp
kawa
keeble
kees
kei
keiser
keit
keiten
kelli
keo
ket
ketcham
khalsa
khanna
ki
kii
kiley
kilometers
kimber
kirstie
kis
kiva
klei
kli
kmu
kno
knopp
knowl
koeln
kok
kom
kommer
kommis
kommunikations
kon
konstantinos
konstanze
kontroll
konzentrations
koo
koon
koontz
koordinations
kor
kosel
kpi
krahn
kramm
krems
kretz
kreutzer
krogh
kr\xF6ger
kr\xF6ner
kuehn
kug
kuk
kul
kun
kura
kwon
kyiv
k\xE4mper
k\xF6n
k\xF6nigshausen
k\xF6nn
k\xF6ster
laban
labeled
labeling
labored
laborers
laboring
lada
laf
lafferty
lai
laidlaw
lal
lamartine
lames
lamy
landi
landin
lapointe
lar
lastig
latif
lauber
laughlin
laun
lda
leaderboard
lechler
leclair
leed
leggett
legrand
lehnert
leit
leitch
leitungs
lem
lemaire
lemay
lemuel
lenka
leopoldina
ler
lern
letty
leuze
leveled
leveln
levent
lewandowski
lhe
libri
libris
lic
lich
liche
lier
ligue
lile
lim
lindell
linne
lis
lite
litera
liv
lle
lmu
loa
loc
localized
lod
loewe
lofton
loh
loi
lon
lond
longtime
lor
loran
lorena
loring
loui
lous
lovis
lowden
lowenthal
lowrey
lsa
lse
lta
luc
lucke
lue
luella
luiz
lum
lus
lusk
luttrell
lytle
l\xE4n
l\xF6
l\xF6ser
maass
machin
madita
maes
magni
maher
mahmood
maitland
maj
mak
makin
malin
mals
mam
manas
mand
mander
maneuver
maneuverability
maneuverable
maneuvered
mans
marah
marginalized
mari
marjan
marleen
martialed
martius
martyn
marveled
marvelous
maryann
masi
massie
masur
matchen
mateus
mathers
matias
matth
mattison
maximize
mayr
maysville
mbi
mbo
mcadoo
mcclanahan
mcclelland
mccown
mccurdy
mccutcheon
mcfall
mcginnis
mcginty
mcgrady
mckeen
mckelvey
mckenney
mclaurin
mclellan
mcloughlin
mcmillen
mcnabb
mcneal
mcnulty
mcphail
mcvey
meager
meas
mechanicsburg
medi
mei
meinel
meisel
mell
memorialize
memorialized
mende
mense
ment
ments
merc
merce
merrifield
merriman
metcalf
meuser
mex
mga
michener
michi
mie
mil
mili
militar
militarization
millar
millersville
milliken
mindest
minimize
minimized
minimizing
minn
mio
mip
mis
mitscherlich
mittermaier
mobilit\xE4ts
modeler
modelers
modeling
modernization
moglich
mohican
mohler
molded
molloy
mom
moma
monopolize
montauk
mony
mooc
moocs
mor
mowry
moxley
mpi
msa
muenchen
munday
munsey
musser
m\xF6g
m\xFCnch
nace
nachdr
nad
nade
nadeau
nahme
nal
nang
napo
napp
nath
nati
natio
natu
naujoks
nauvoo
naveen
ncbi
nce
neb
nederlandse
neer
neff
neher
neighbor
neighborhood
neighboring
nel
nelles
neto
nevins
newhouse
newyork
nex
ney
nger
nickerson
nida
nien
nijmegen
nikolay
nikos
nin
nir
nis
nisha
nisse
noe
nom
nomos
noncompliance
nonexistent
normalized
northrup
nos
nott
notz
noy
nse
num
nung
nutt
nuttig
nutz
nutzungs
nuys
nwo
obj
obs
oc
occ
occurence
oclock
octo
odebrecht
odo
odr
odum
oellers
ofa
ofcourse
offe
offense
offi
offnen
offs
ofhis
ofi
oftentimes
ofthe
ofthis
ogc
ohi
ohn
ois
okey
ol
oli
olmstead
ome
ona
ond
onetime
onl
ons
onthe
oo
ood
oor
opac
opensource
openstack
opi
opr
optimized
oram
orde
orga
organi
organization
organizational
organizations
organize
organized
organizer
organizers
organizing
ori
origi
ork
orl
orn
ors
osf
osm
osswald
othe
ou
ould
oup
ous
ouse
ov
owers
owncloud
ows
oxley
oya
o\xDFwald
paal
pagano
parkhurst
parkman
parlors
parrish
parte
pasquale
patronized
patsey
patta
pau
pauer
pauley
paulina
pauly
pavillion
pawlik
pekka
pembina
penalize
pendergast
peo
peop
pepe
pepin
pernambuco
perrys
perso
persson
pers\xF6nlichkeits
petsch
pez
phe
phila
philippa
philo
phineas
phong
pietsch
pii
pil
pinus
pis
pitts
pizarro
pla
plagiarized
plaine
planungs
ple
pleasants
ples
pling
plos
plow
plowed
plowing
plows
plugins
pnas
poc
poindexter
poli
polit
politi
pom
pon
popularizing
por
posi
posix
potomac
potosi
potthoff
powe
pra
prabhakar
prac
practica
practiced
practicing
praeger
prather
presi
pressurized
prewar
pri
prin
prioritize
prized
prob
problema
proc
profesional
proj
pron
proquest
prot
proto
prov
pruitt
pryor
publ
publicized
pubmed
purdue
puschmann
puttin
p\xF6schl
qian
qu
quali
qualit\xE4ts
quan
que
quel
ques
quitman
raddatz
rade
radhakrishnan
radke
radtke
ragan
raghavan
ragsdale
raju
ral
rall
rapha
rapp
rass
rauber
ravenswood
rawlins
rda
realization
realize
realized
realizing
rebekah
reco
recognize
recognized
recognizing
redaktionsteam
redman
redstone
refueled
refueling
regener
regi
regner
reichmann
reimer
reits
rekt
rela
reli
rell
remodeled
renz
repl
resi
reso
resourcen
ressources
reto
retz
revista
revo
revolutionized
ria
ric
ridgely
rieck
rien
righ
rigor
rijksmuseum
rin
ris
risi
riv
riviere
ro
rocca
roddy
rodolphe
rohit
rohrer
rol
roo
roommate
roon
ror
rosanne
rosenblum
rowboat
rse
rubenstein
rud
rumors
rumsey
rungen
ruppert
rylan
ryman
r\xF6sch
r\xF6ttgen
r\xFCck
r\xFClke
r\xFCmelin
saas
sach
sachverst\xE4ndigenrates
sacri
safford
sager
sahr
sall
saml
sammen
samu
sandiego
sandro
sandt
sani
sanju
sanna
sanz
saro
saur
savin
savior
saylor
sbe
schachtner
schaffer
sche
schefer
schen
schenck
schland
schlitzer
schnepf
scholze
schoolcraft
schrade
schu
schul
schultes
schulungs
schwandt
sch\xE4ffler
sch\xF6nberger
sci
scientifique
scopus
scrutinized
seco
seits
seize
seized
seizing
sel
sella
seng
senger
sengupta
sens
seq
seria
sert
serv
servi
sess
sev
seve
severa
sey
shal
shalini
shan
shar
shaul
sheed
shel
shen
sheng
sher
sherrod
shing
sho
shoaib
shotwell
shoup
shreve
shu
shukla
shuler
shultz
sibel
siche
sicherheits
sidewalk
siebeck
siebold
sightlines
signa
signaled
signaling
sil
siler
simonds
sinha
siri
sizable
skaggs
skepticism
skeptics
skillful
slaven
slaw
sle
sma
smashwords
sme
smit
smits
smok
snelling
sobre
soc
soep
softwares
som
sommerville
soren
sota
soto
southwesterly
sowell
sozio
spaulding
speci
specialization
specialize
specialized
specialty
spect
spei
spiekermann
spiers
splendor
sprech
spurlock
sru
sta
staden
standardization
standardized
stanek
stansbury
starck
starnes
stata
statista
staton
stavros
stegemann
steinke
stel
stellv
stephane
ster
steyer
stillman
stimson
sto
stoll
stoppin
stor
stra
straightaway
strate
streck
streeter
strother
struct
stu
stuckey
sturges
sturtevant
sua
suc
succor
suf
sug
sugimoto
suhr
sui
sul
suleman
summarization
summarize
summarized
summarizes
summarizing
supe
supp
supt
sur
sus
sut
suzanna
swantje
sympathize
sympathizers
systematized
s\xF6llner
s\xF6nke
taggart
tak
takano
takeda
taliaferro
talmadge
tamir
tamu
tana
tann
tant
tappan
tarver
tas
tasso
taubert
tbe
teague
techn
tei
teichert
telekommunikations
tenn
tera
tert
testi
tha
thacker
thanos
ther
thetis
thi
thia
thibodeau
thie
thiel
thiemann
tho
thoma
thomaston
thornburg
thos
thueringen
thurber
tice
tidwell
tiefergehende
tien
tig
tige
tigt
til
tilson
tion
tions
tis
tite
titty
tivo
tiwari
tke
tla
tle
tna
tober
toda
tol
tolbert
tomasz
totaled
totaling
tothe
totten
toussaint
towa
towson
tra
tradeoffs
tral
traumatized
trav
traveled
traveler
travelers
traveling
tre
tremont
tren
tri
trib
trinh
tro
tru
trum
tr\xF6ger
tsukuba
tte
tubbs
tudo
tung
ture
turen
tuscarora
twen
twente
twigg
tylers
t\xE4t
ua
ual
ub
ubc
uber
uc
ucd
ueber
uel
uhl
uia
uld
uli
ull
umb
ume
umg
underhill
underrepresented
unfavorable
univ
universidad
universitaet
universit\xE4ts
unterneh
unterst\xFCtzungs
usin
usu
usw
utilization
utilize
utilized
utilizing
uu
va
vaca
vadis
valdes
valor
vania
vann
vapor
vapors
var
vari
vas
vauban
veen
velden
veritas
verma
vernet
verschie
verschiede
verwaltungs
vey
viale
vicks
vide
vidya
vierkant
vieweg
vigor
vin
vinh
vir
virg
visser
visualization
visualizations
visualizing
vive
viz
vo
voight
vorder
vorge
vorgehensmodell
vos
vossen
vox
voy
waa
wageningen
wah
wak
wallin
warrenton
wasa
washroom
wasn
wasson
wat
watercolor
watkinson
waverly
wayman
webinare
wech
wef
wegener
wei
weichert
weigel
weils
weingart
wel
wellcome
werf
wescott
wezel
wga
whe
wher
whi
whic
whitepaper
whitten
wieviel
wifi
wik
willful
willson
windeck
wis
wisc
wiss
wissenschafts
withthe
wittenburg
wmo
wofford
woll
wom
wooldridge
woolf
wor
wou
woul
wouldn
wulf
wur
wusst
wuttke
w\xE4h
w\xFCr
w\xFCthrich
xia
xiao
yager
yannis
yare
yasemin
yi
yoon
youn
yu
yumi
yun
yuval
za
zachariah
zalando
zeich
zeidler
zeng
zent
zi
zon
zung
zusam
zwi
\xF6ffent
\xF6pnv
\xFCberarb
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
`};var R=require("obsidian"),q="zotero-redisearch-rag-chat",$=class extends R.ItemView{constructor(e,n){super(e);this.messages=[];this.activeSessionId="default";this.messageEls=new Map;this.pendingRender=new Map;this.busy=!1;this.plugin=n}getViewType(){return q}getDisplayText(){return"Zotero RAG Chat"}getIcon(){return"zrr-chat"}async onOpen(){let{containerEl:e}=this;e.empty(),e.addClass("zrr-chat-view");let n=e.createEl("div",{cls:"zrr-chat-header"});n.createEl("div",{cls:"zrr-chat-title",text:"Zotero RAG Chat"});let t=n.createEl("div",{cls:"zrr-chat-controls"}),i=t.createEl("div",{cls:"zrr-chat-controls-row"});this.sessionSelect=i.createEl("select",{cls:"zrr-chat-session"}),this.sessionSelect.addEventListener("change",async()=>{await this.switchSession(this.sessionSelect.value)});let r=t.createEl("div",{cls:"zrr-chat-controls-row zrr-chat-controls-actions"});this.renameButton=r.createEl("button",{cls:"zrr-chat-rename",text:"Rename",attr:{title:"Rename the current chat"}}),this.renameButton.addEventListener("click",async()=>{await this.promptRenameSession()}),this.copyButton=r.createEl("button",{cls:"zrr-chat-copy",text:"Copy",attr:{title:"Copy this chat to a new note"}}),this.copyButton.addEventListener("click",async()=>{await this.copyChatToNote()}),this.deleteButton=r.createEl("button",{cls:"zrr-chat-delete",text:"Delete",attr:{title:"Delete this chat"}}),this.deleteButton.addEventListener("click",async()=>{await this.deleteChat()}),this.newButton=r.createEl("button",{cls:"zrr-chat-new",text:"New chat",attr:{title:"Start a new chat session"}}),this.newButton.addEventListener("click",async()=>{await this.startNewChat()}),this.messagesEl=e.createEl("div",{cls:"zrr-chat-messages"});let s=e.createEl("div",{cls:"zrr-chat-input"});this.inputEl=s.createEl("textarea",{cls:"zrr-chat-textarea",attr:{placeholder:"Ask your Zotero library..."}}),this.sendButton=s.createEl("button",{cls:"zrr-chat-send",text:"Send"}),this.sendButton.addEventListener("click",()=>this.handleSend()),this.inputEl.addEventListener("keydown",a=>{a.key==="Enter"&&!a.shiftKey&&(a.preventDefault(),this.handleSend())}),await this.loadSessions(),await this.loadHistory(),await this.renderAll()}focusInput(){var e;(e=this.inputEl)==null||e.focus()}async loadHistory(){try{this.messages=await this.plugin.loadChatHistoryForSession(this.activeSessionId)}catch(e){console.error(e),this.messages=[]}}async saveHistory(){try{await this.plugin.saveChatHistoryForSession(this.activeSessionId,this.messages),await this.plugin.finalizeChatSessionNameIfNeeded(this.activeSessionId,this.messages),await this.loadSessions()}catch(e){console.error(e)}}async loadSessions(){let e=await this.plugin.listChatSessions();this.activeSessionId=await this.plugin.getActiveChatSessionId(),this.sessionSelect.empty();for(let n of e){let t=this.sessionSelect.createEl("option",{text:n.name});t.value=n.id,n.id===this.activeSessionId&&(t.selected=!0)}!e.some(n=>n.id===this.activeSessionId)&&e.length>0&&(this.activeSessionId=e[0].id,await this.plugin.setActiveChatSessionId(this.activeSessionId),this.sessionSelect.value=this.activeSessionId)}async promptRenameSession(){var i;let n=(await this.plugin.listChatSessions()).find(r=>r.id===this.activeSessionId);new W(this.app,(i=n==null?void 0:n.name)!=null?i:"New chat",async r=>{await this.plugin.renameChatSession(this.activeSessionId,r),await this.loadSessions()}).open()}async startNewChat(){await this.plugin.saveChatHistoryForSession(this.activeSessionId,this.messages),await this.plugin.finalizeChatSessionNameIfNeeded(this.activeSessionId,this.messages,{force:!0});let e=await this.plugin.createChatSession("New chat");await this.switchSession(e,{skipSave:!0})}async deleteChat(){let e=await this.plugin.listChatSessions();if(e.length<=1){new R.Notice("You must keep at least one chat.");return}let n=e.find(i=>i.id===this.activeSessionId);if(!n)return;new J(this.app,n.name,async()=>{await this.plugin.deleteChatSession(this.activeSessionId);let i=await this.plugin.getActiveChatSessionId();await this.switchSession(i,{skipSave:!0})}).open()}async switchSession(e,n={}){!e||e===this.activeSessionId||(n.skipSave||await this.saveHistory(),this.activeSessionId=e,await this.plugin.setActiveChatSessionId(e),await this.loadSessions(),await this.loadHistory(),await this.renderAll())}async renderAll(){this.messagesEl.empty(),this.messageEls.clear();for(let e of this.messages)await this.renderMessage(e);this.scrollToBottom()}async renderMessage(e){let n=this.messagesEl.createEl("div",{cls:`zrr-chat-message zrr-chat-${e.role}`});n.createEl("div",{cls:"zrr-chat-meta"}).setText(e.role==="user"?"You":"Assistant");let i=n.createEl("div",{cls:"zrr-chat-content"}),r=n.createEl("div",{cls:"zrr-chat-citations"});this.messageEls.set(e.id,{wrapper:n,content:i,citations:r}),await this.renderMessageContent(e)}scheduleRender(e){if(this.pendingRender.has(e.id))return;let n=window.setTimeout(async()=>{this.pendingRender.delete(e.id),await this.renderMessageContent(e),this.scrollToBottom()},80);this.pendingRender.set(e.id,n)}async renderMessageContent(e){var i,r,s;let n=this.messageEls.get(e.id);if(!n)return;let t=await this.plugin.formatInlineCitations(e.content||"",(i=e.citations)!=null?i:[],(r=e.retrieved)!=null?r:[]);n.content.dataset.lastRendered!==t&&(n.content.empty(),await R.MarkdownRenderer.renderMarkdown(t,n.content,"",this.plugin),this.hookInternalLinks(n.content),n.content.dataset.lastRendered=t),n.citations.empty(),await this.renderCitations(n.citations,(s=e.citations)!=null?s:[])}hookInternalLinks(e){let n=e.querySelectorAll("a.internal-link");for(let t of Array.from(n))t.dataset.zrrBound!=="1"&&(t.dataset.zrrBound="1",this.registerDomEvent(t,"click",i=>{i.preventDefault();let r=t.getAttribute("data-href")||t.getAttribute("href")||"";r&&this.plugin.openInternalLinkInMain(r)}))}async renderCitations(e,n){if(e.empty(),!n.length)return;let t=e.createEl("details",{cls:"zrr-chat-citations-details"});t.createEl("summary",{text:`Relevant context sources (${n.length})`,cls:"zrr-chat-citations-summary"});let i=t.createEl("ul",{cls:"zrr-chat-citation-list"});for(let r of n){let s=await this.plugin.resolveCitationDisplay(r),a=i.createEl("li");a.createEl("a",{text:s.noteTitle,href:"#"}).addEventListener("click",c=>{c.preventDefault(),s.notePath&&this.plugin.openNoteInMain(s.notePath)}),a.createEl("span",{text:", p. "}),a.createEl("a",{text:s.pageLabel,href:"#"}).addEventListener("click",c=>{if(c.preventDefault(),s.zoteroUrl){this.plugin.openExternalUrl(s.zoteroUrl);return}if(s.pdfPath){this.plugin.openPdfInMain(s.pdfPath,s.pageStart);return}this.plugin.openCitationTarget(r,s)})}}async copyChatToNote(){var i;let n=(await this.plugin.listChatSessions()).find(r=>r.id===this.activeSessionId),t=(i=n==null?void 0:n.name)!=null?i:"New chat";await this.plugin.createChatNoteFromSession(this.activeSessionId,t,this.messages)}scrollToBottom(){this.messagesEl.scrollTop=this.messagesEl.scrollHeight}async handleSend(){if(this.busy)return;let e=this.inputEl.value.trim();if(!e){new R.Notice("Query cannot be empty.");return}if(!this.plugin.settings.chatBaseUrl){new R.Notice("Chat base URL must be set in settings.");return}this.inputEl.value="",this.busy=!0,this.sendButton.disabled=!0;let n={id:this.generateId(),role:"user",content:e,createdAt:new Date().toISOString()};this.messages.push(n),await this.renderMessage(n),this.scrollToBottom(),await this.saveHistory();let t={id:this.generateId(),role:"assistant",content:"",citations:[],createdAt:new Date().toISOString()};this.messages.push(t),await this.renderMessage(t),this.scrollToBottom();let i=!1,r=this.plugin.getRecentChatHistory(this.messages.slice(0,-2));try{await this.plugin.runRagQueryStreaming(e,s=>{i=!0,t.content+=s,this.scheduleRender(t)},s=>{(!i&&(s!=null&&s.answer)||s!=null&&s.answer)&&(t.content=s.answer),Array.isArray(s==null?void 0:s.citations)&&(t.citations=s.citations),Array.isArray(s==null?void 0:s.retrieved)&&(t.retrieved=s.retrieved),this.scheduleRender(t)},r)}catch(s){console.error(s),t.content="Failed to fetch answer. See console for details.",this.scheduleRender(t)}finally{this.busy=!1,this.sendButton.disabled=!1,await this.saveHistory()}}async clearChat(){this.messages=[],await this.saveHistory(),await this.renderAll()}generateId(){return typeof crypto!="undefined"&&"randomUUID"in crypto?crypto.randomUUID():`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}},W=class extends R.Modal{constructor(p,e,n){super(p),this.initialValue=e,this.onSubmit=n}onOpen(){let{contentEl:p}=this;p.empty(),p.createEl("h3",{text:"Rename chat"});let e=this.initialValue;new R.Setting(p).setName("Name").addText(r=>{r.setValue(e),r.onChange(s=>{e=s})});let n=p.createEl("div");n.style.display="flex",n.style.gap="0.5rem",n.style.marginTop="1rem",n.createEl("button",{text:"Cancel"}).addEventListener("click",()=>this.close()),n.createEl("button",{text:"Save"}).addEventListener("click",()=>{let r=e.trim();if(!r){new R.Notice("Name cannot be empty.");return}this.close(),this.onSubmit(r)})}},J=class extends R.Modal{constructor(p,e,n){super(p),this.chatName=e,this.onConfirm=n}onOpen(){let{contentEl:p}=this;p.empty(),p.createEl("h3",{text:"Delete chat"}),p.createEl("p",{text:`Delete "${this.chatName}"? This cannot be undone.`});let e=p.createEl("div");e.style.display="flex",e.style.gap="0.5rem",e.style.marginTop="1rem",e.createEl("button",{text:"Cancel"}).addEventListener("click",()=>this.close()),e.createEl("button",{text:"Delete"}).addEventListener("click",()=>{this.close(),this.onConfirm()})}};var ie=[{label:"Auto (no hint)",value:""},{label:"English (en)",value:"en"},{label:"German (de)",value:"de"},{label:"German + English (de,en)",value:"de,en"},{label:"French (fr)",value:"fr"},{label:"Spanish (es)",value:"es"},{label:"Italian (it)",value:"it"},{label:"Dutch (nl)",value:"nl"},{label:"Portuguese (pt)",value:"pt"},{label:"Polish (pl)",value:"pl"},{label:"Swedish (sv)",value:"sv"},{label:"Other (custom ISO code)",value:"__custom__"}],re={en:"eng",de:"deu",fr:"fra",es:"spa",it:"ita",nl:"nld",pt:"por",pl:"pol",sv:"swe"},fe=H["zrr-picker"],me=H["zrr-chat"],U=class extends d.Modal{constructor(p,e,n,t,i="Value cannot be empty."){super(p),this.titleText=e,this.placeholder=n,this.onSubmit=t,this.emptyMessage=i}onOpen(){let{contentEl:p}=this;p.empty(),p.createEl("h3",{text:this.titleText});let e=p.createEl("input",{type:"text",placeholder:this.placeholder});e.style.width="100%",e.focus();let n=p.createEl("button",{text:"Submit"});n.style.marginTop="0.75rem";let t=()=>{let i=e.value.trim();if(!i){new d.Notice(this.emptyMessage);return}this.close(),this.onSubmit(i)};n.addEventListener("click",t),e.addEventListener("keydown",i=>{i.key==="Enter"&&t()})}},K=class extends d.Modal{constructor(p,e,n){super(p),this.titleText=e,this.bodyText=n}onOpen(){let{contentEl:p}=this;p.empty(),p.createEl("h3",{text:this.titleText}),p.createEl("pre").setText(this.bodyText)}},Q=class extends d.Modal{constructor(e,n,t){super(e);this.resolved=!1;this.filePath=n,this.onResolve=t}onOpen(){let{contentEl:e}=this;e.empty(),e.createEl("h3",{text:"Overwrite existing note?"}),e.createEl("p",{text:`This will overwrite: ${this.filePath}`});let n=e.createEl("div");n.style.display="flex",n.style.gap="0.5rem",n.style.marginTop="0.75rem";let t=n.createEl("button",{text:"Cancel"}),i=n.createEl("button",{text:"Overwrite"});t.addEventListener("click",()=>{this.resolved=!0,this.close(),this.onResolve(!1)}),i.addEventListener("click",()=>{this.resolved=!0,this.close(),this.onResolve(!0)})}onClose(){this.resolved||this.onResolve(!1)}},Y=class extends d.SuggestModal{constructor(e,n){super(e);this.resolved=!1;this.resolveSelection=n,this.setPlaceholder("Select a language for OCR/quality...")}getSuggestions(e){let n=e.trim().toLowerCase();return n?ie.filter(t=>t.label.toLowerCase().includes(n)||t.value.toLowerCase().includes(n)):ie}renderSuggestion(e,n){n.setText(e.label),n.addEventListener("click",()=>this.handleSelection(e))}onChooseSuggestion(e){this.handleSelection(e)}onClose(){this.resolved||this.resolveSelection(null)}handleSelection(e){if(!this.resolved){if(this.resolved=!0,e.value==="__custom__"){this.close(),new U(this.app,"Custom language hint","e.g., en, de, fr, de,en",n=>this.resolveSelection(n.trim()),"Language hint cannot be empty.").open();return}this.resolveSelection(e.value),this.close()}}},G=class extends d.Plugin{constructor(){super(...arguments);this.docIndex=null}async onload(){await this.loadSettings(),await this.migrateCachePaths(),this.addSettingTab(new B(this.app,this)),this.registerRibbonIcons(),this.registerView(q,e=>new $(e,this)),this.setupStatusBar(),this.registerNoteRenameHandler();try{await this.ensureBundledTools()}catch(e){console.error("Failed to sync bundled tools",e)}this.addCommand({id:"import-zotero-item-index",name:"Import Zotero item and index (Docling -> RedisSearch)",callback:()=>this.importZoteroItem()}),this.addCommand({id:"ask-zotero-library",name:"Ask my Zotero library (RAG via RedisSearch)",callback:()=>this.askZoteroLibrary()}),this.addCommand({id:"open-zotero-chat",name:"Open Zotero RAG chat panel",callback:()=>this.openChatView(!0)}),this.addCommand({id:"rebuild-zotero-note-cache",name:"Rebuild Zotero note from cache (Docling + RedisSearch)",callback:()=>this.rebuildNoteFromCache()}),this.addCommand({id:"rebuild-doc-index-cache",name:"Rebuild doc index from cache",callback:()=>this.rebuildDocIndexFromCache()}),this.addCommand({id:"recreate-missing-notes-cache",name:"Recreate missing notes from cache (Docling + RedisSearch)",callback:()=>this.recreateMissingNotesFromCache()}),this.addCommand({id:"reindex-redis-from-cache",name:"Reindex Redis from cached chunks",callback:()=>this.reindexRedisFromCache()}),this.addCommand({id:"start-redis-stack",name:"Start Redis Stack (Docker Compose)",callback:()=>this.startRedisStack()}),this.settings.autoStartRedis&&this.startRedisStack(!0)}async loadSettings(){this.settings=Object.assign({},ne,await this.loadData())}async saveSettings(){await this.saveData(this.settings)}async importZoteroItem(){var E,S,T;try{await this.ensureBundledTools()}catch(g){new d.Notice("Failed to sync bundled tools. See console for details."),console.error(g);return}let e;try{e=await this.promptZoteroItem()}catch(g){new d.Notice("Zotero search failed. See console for details."),console.error(g);return}if(!e){new d.Notice("No Zotero item selected.");return}let n=(E=e.data)!=null?E:e;!n.key&&e.key&&(n.key=e.key);let t=this.getDocId(n);if(!t){new d.Notice("Could not resolve a stable doc_id from Zotero item.");return}let i=await this.resolveLanguageHint(n,(S=e.key)!=null?S:n.key),r=this.buildDoclingLanguageHint(i!=null?i:void 0),s=await this.resolvePdfAttachment(n,t);if(!s){new d.Notice("No PDF attachment found for item.");return}this.showStatusProgress("Preparing...",5);let a=typeof n.title=="string"?n.title:"",o=await this.getDocIndexEntry(t);o&&new d.Notice("Item already indexed. Updating cached files and index.");let l=this.sanitizeFileName(a)||t;if(o!=null&&o.note_path)l=y.default.basename(o.note_path,".md")||l;else if(o!=null&&o.pdf_path){let g=this.toVaultRelativePath(o.pdf_path);g&&g.startsWith((0,d.normalizePath)(this.settings.outputPdfDir))&&(l=y.default.basename(g,".pdf")||l)}let c=o?l:await this.resolveUniqueBaseName(l,t),u=(0,d.normalizePath)(`${this.settings.outputPdfDir}/${c}.pdf`),h=(0,d.normalizePath)(`${N}/${t}.json`),f=(0,d.normalizePath)(`${z}/${t}.json`),_=this.app.vault.adapter,m=(0,d.normalizePath)(`${this.settings.outputNoteDir}/${c}.md`);if(o!=null&&o.note_path&&await _.exists(o.note_path)&&(m=(0,d.normalizePath)(o.note_path)),await _.exists(m)&&!await this.confirmOverwrite(m)){new d.Notice("Import canceled.");return}try{if(await this.ensureFolder(N),await this.ensureFolder(z),await this.ensureFolder(this.settings.outputNoteDir),this.settings.copyPdfToVault&&await this.ensureFolder(this.settings.outputPdfDir),this.settings.enableFileLogging){let g=this.getLogFileRelativePath(),D=(0,d.normalizePath)(y.default.dirname(g));D&&await this.ensureFolder(D);let I=this.getSpellcheckerInfoRelativePath(),j=(0,d.normalizePath)(y.default.dirname(I));j&&await this.ensureFolder(j)}}catch(g){new d.Notice("Failed to create output folders."),console.error(g),this.clearStatusProgress();return}let x="",k="";try{if(this.settings.copyPdfToVault){let g=s.filePath?await O.promises.readFile(s.filePath):await this.downloadZoteroPdf(s.key);await this.app.vault.adapter.writeBinary(u,this.bufferToArrayBuffer(g)),x=this.getAbsoluteVaultPath(u)}else if(s.filePath)x=s.filePath;else{await this.ensureFolder(this.settings.outputPdfDir);let g=await this.downloadZoteroPdf(s.key);await this.app.vault.adapter.writeBinary(u,this.bufferToArrayBuffer(g)),x=this.getAbsoluteVaultPath(u),new d.Notice("Local PDF path unavailable; copied PDF into vault for processing.")}k=this.buildPdfLinkForNote(x,s.key,t)}catch(g){new d.Notice("Failed to download PDF attachment."),console.error(g),this.clearStatusProgress();return}try{await this.app.vault.adapter.write(h,JSON.stringify(e,null,2))}catch(g){new d.Notice("Failed to write Zotero item JSON."),console.error(g),this.clearStatusProgress();return}let v=this.getPluginDir(),b=y.default.join(v,"tools","docling_extract.py"),L=y.default.join(v,"tools","index_redisearch.py"),C=null;try{C=await this.readDoclingQualityLabelFromPdf(x,r),this.showStatusProgress(this.formatStatusLabel("Docling extraction...",C),0),await this.runPythonStreaming(b,this.buildDoclingArgs(x,t,f,m,r,!0),g=>this.handleDoclingProgress(g,C),()=>{}),C=await this.readDoclingQualityLabel(f),await this.annotateChunkJsonWithAttachmentKey(f,s.key)}catch(g){new d.Notice("Docling extraction failed. See console for details."),console.error(g),this.clearStatusProgress();return}try{this.showStatusProgress(this.formatStatusLabel("Indexing chunks...",C),0),await this.runPythonStreaming(L,["--chunks-json",this.getAbsoluteVaultPath(f),"--redis-url",this.settings.redisUrl,"--index",this.settings.redisIndex,"--prefix",this.settings.redisPrefix,"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--progress"],g=>{if((g==null?void 0:g.type)==="progress"&&g.total){let D=Math.round(g.current/g.total*100),I=this.formatStatusLabel(`Indexing chunks ${g.current}/${g.total}`,C);this.showStatusProgress(I,D)}},()=>{})}catch(g){new d.Notice("RedisSearch indexing failed. See console for details."),console.error(g),this.clearStatusProgress();return}try{let g=await this.app.vault.adapter.read(m),D=this.buildNoteMarkdown(n,(T=e.meta)!=null?T:{},t,k,h,g);await this.app.vault.adapter.write(m,D)}catch(g){new d.Notice("Failed to finalize note markdown."),console.error(g),this.clearStatusProgress();return}try{await this.updateDocIndex({doc_id:t,note_path:m,note_title:c,zotero_title:a,pdf_path:x,attachment_key:s.key})}catch(g){console.error("Failed to update doc index",g)}this.showStatusProgress("Done",100),window.setTimeout(()=>this.clearStatusProgress(),1200),new d.Notice(`Indexed Zotero item ${t}.`)}async askZoteroLibrary(){await this.openChatView(!0)}getChatLeaf(){var n;let e=this.app.workspace.getLeavesOfType(q);return e.length>0?e[0]:this.settings.chatPaneLocation==="right"?(n=this.app.workspace.getRightLeaf(!1))!=null?n:this.app.workspace.getLeaf("split"):this.app.workspace.getLeaf("tab")}async openChatView(e=!1){let n=this.getChatLeaf();await n.setViewState({type:q,active:!0}),this.app.workspace.revealLeaf(n);let t=n.view;return t instanceof $&&e&&t.focusInput(),t}async loadChatHistory(){let e=await this.getActiveChatSessionId();return this.loadChatHistoryForSession(e)}async saveChatHistory(e){let n=await this.getActiveChatSessionId();await this.saveChatHistoryForSession(n,e)}getChatSessionsDir(){return(0,d.normalizePath)(`${A}/chats`)}getChatExportDir(){let e=(this.settings.chatOutputDir||"").trim();return e?(0,d.normalizePath)(e):(0,d.normalizePath)("zotero/chats")}getChatSessionsIndexPath(){return(0,d.normalizePath)(`${this.getChatSessionsDir()}/index.json`)}getChatSessionPath(e){return(0,d.normalizePath)(`${this.getChatSessionsDir()}/${e}.json`)}async listChatSessions(){await this.migrateLegacyChatHistory();let e=this.app.vault.adapter,n=this.getChatSessionsIndexPath();if(!await e.exists(n)){let t=new Date().toISOString(),i=[{id:"default",name:"New chat",createdAt:t,updatedAt:t}];return await this.writeChatSessionsIndex({version:1,active:"default",sessions:i}),i}try{let t=await e.read(n),i=JSON.parse(t);return(Array.isArray(i==null?void 0:i.sessions)?i.sessions:[]).filter(s=>s&&typeof s.id=="string").map(s=>({id:String(s.id),name:typeof s.name=="string"&&s.name.trim()?s.name.trim():String(s.id),createdAt:typeof s.createdAt=="string"?s.createdAt:new Date().toISOString(),updatedAt:typeof s.updatedAt=="string"?s.updatedAt:new Date().toISOString()}))}catch(t){return console.warn("Failed to read chat sessions index",t),[]}}async getActiveChatSessionId(){await this.migrateLegacyChatHistory();let e=this.app.vault.adapter,n=this.getChatSessionsIndexPath();if(!await e.exists(n))return"default";try{let t=await e.read(n),i=JSON.parse(t);return(typeof(i==null?void 0:i.active)=="string"?i.active:"default")||"default"}catch(t){return"default"}}async setActiveChatSessionId(e){var s,a;await this.migrateLegacyChatHistory();let n=await this.readChatSessionsIndex(),t=((s=n.sessions)!=null?s:[]).some(o=>o.id===e),i=new Date().toISOString(),r=t?n.sessions:[...(a=n.sessions)!=null?a:[],{id:e,name:e,createdAt:i,updatedAt:i}];await this.writeChatSessionsIndex({version:1,active:e,sessions:r})}async createChatSession(e){var a;await this.migrateLegacyChatHistory();let n=this.generateChatId(),t=new Date().toISOString(),i=(e||"").trim()||"New chat",s=[...(a=(await this.readChatSessionsIndex()).sessions)!=null?a:[],{id:n,name:i,createdAt:t,updatedAt:t}];return await this.ensureFolder(this.getChatSessionsDir()),await this.app.vault.adapter.write(this.getChatSessionPath(n),JSON.stringify({version:1,messages:[]},null,2)),await this.writeChatSessionsIndex({version:1,active:n,sessions:s}),n}async renameChatSession(e,n){var s,a;await this.migrateLegacyChatHistory();let t=(n||"").trim();if(!t)return;let i=await this.readChatSessionsIndex(),r=((s=i.sessions)!=null?s:[]).map(o=>o.id===e?{...o,name:t}:o);await this.writeChatSessionsIndex({version:1,active:(a=i.active)!=null?a:"default",sessions:r})}async deleteChatSession(e){var a;if(await this.migrateLegacyChatHistory(),!e)return;let n=this.app.vault.adapter,t=await this.readChatSessionsIndex(),i=(a=t.sessions)!=null?a:[];if(i.length<=1)return;let r=i.filter(o=>o.id!==e);if(!r.length)return;let s=t.active===e?r[0].id:t.active;try{await n.remove(this.getChatSessionPath(e))}catch(o){console.warn("Failed to delete chat session file",o)}await this.writeChatSessionsIndex({version:1,active:s,sessions:r})}async loadChatHistoryForSession(e){await this.migrateLegacyChatHistory();let n=this.app.vault.adapter,t=this.getChatSessionPath(e||"default");if(!await n.exists(t))return[];let i=await n.read(t),r;try{r=JSON.parse(i)}catch(a){return[]}let s=Array.isArray(r)?r:r==null?void 0:r.messages;return Array.isArray(s)?s.filter(a=>a&&typeof a.content=="string").map(a=>({id:a.id||this.generateChatId(),role:a.role==="assistant"?"assistant":"user",content:a.content,citations:Array.isArray(a.citations)?a.citations:[],retrieved:Array.isArray(a.retrieved)?a.retrieved:[],createdAt:a.createdAt||new Date().toISOString()})):[]}async saveChatHistoryForSession(e,n){var l,c;await this.migrateLegacyChatHistory(),await this.ensureFolder(this.getChatSessionsDir());let t=this.app.vault.adapter,i=this.getChatSessionPath(e||"default"),r={version:1,messages:n};await t.write(i,JSON.stringify(r,null,2));let s=await this.readChatSessionsIndex(),a=new Date().toISOString(),o=((l=s.sessions)!=null?l:[]).map(u=>u.id===e?{...u,updatedAt:a}:u);await this.writeChatSessionsIndex({version:1,active:(c=s.active)!=null?c:e,sessions:o})}getRecentChatHistory(e){let n=Math.max(0,this.settings.chatHistoryMessages||0);return n?e.filter(i=>{var r;return i&&((r=i.content)==null?void 0:r.trim())}).slice(-n):[]}async readChatSessionsIndex(){let e=this.app.vault.adapter,n=this.getChatSessionsIndexPath(),t=new Date().toISOString();if(!await e.exists(n))return{version:1,active:"default",sessions:[{id:"default",name:"New chat",createdAt:t,updatedAt:t}]};try{let i=await e.read(n),r=JSON.parse(i),s=Array.isArray(r==null?void 0:r.sessions)?r.sessions:[];return{version:1,active:typeof(r==null?void 0:r.active)=="string"?r.active:"default",sessions:s.map(a=>({id:String(a.id),name:typeof a.name=="string"&&a.name.trim()?a.name.trim():String(a.id),createdAt:typeof a.createdAt=="string"?a.createdAt:t,updatedAt:typeof a.updatedAt=="string"?a.updatedAt:t}))}}catch(i){return console.warn("Failed to parse chat sessions index",i),{version:1,active:"default",sessions:[{id:"default",name:"New chat",createdAt:t,updatedAt:t}]}}}async writeChatSessionsIndex(e){await this.ensureFolder(this.getChatSessionsDir()),await this.app.vault.adapter.write(this.getChatSessionsIndexPath(),JSON.stringify(e,null,2))}async migrateLegacyChatHistory(){let e=this.app.vault.adapter,n=(0,d.normalizePath)(`${A}/chat.json`),t=this.getChatSessionsDir(),i=this.getChatSessionsIndexPath(),r=this.getChatSessionPath("default"),s=await e.exists(n),a=await e.exists(r),o=await e.exists(i);if(!s&&o)return;let l=new Date().toISOString();if(await this.ensureFolder(t),s&&!a)try{await e.rename(n,r)}catch(c){try{let u=await e.read(n);await e.write(r,u),await e.remove(n)}catch(u){console.warn("Failed to migrate legacy chat history",u)}}if(!o){let c=[{id:"default",name:"New chat",createdAt:l,updatedAt:l}];await this.writeChatSessionsIndex({version:1,active:"default",sessions:c})}if(o)try{let c=await e.read(i),u=JSON.parse(c),h=Array.isArray(u==null?void 0:u.sessions)?u.sessions:[],f=h.some(m=>(m==null?void 0:m.id)==="default"),_=h.map(m=>(m==null?void 0:m.id)==="default"&&typeof(m==null?void 0:m.name)=="string"&&m.name.trim().toLowerCase()==="default"?{...m,name:"New chat"}:m);f&&JSON.stringify(_)!==JSON.stringify(h)&&await this.writeChatSessionsIndex({version:1,active:typeof(u==null?void 0:u.active)=="string"?u.active:"default",sessions:_.map(m=>({id:String(m.id),name:typeof m.name=="string"?m.name:"New chat",createdAt:typeof m.createdAt=="string"?m.createdAt:l,updatedAt:typeof m.updatedAt=="string"?m.updatedAt:l}))})}catch(c){}}isPlaceholderChatName(e){let n=(e||"").trim().toLowerCase();return n==="new chat"||n==="default"}normalizeChatTitle(e){let n=(e||"").replace(/\s+/g," ").trim();return n.length>60?`${n.slice(0,57)}...`:n}guessTitleFromMessages(e){let n=e.find(i=>i.role==="user"&&i.content.trim());if(!n)return"New chat";let t=n.content.replace(/\s+/g," ").trim().split(" ").slice(0,8).join(" ");return this.normalizeChatTitle(t||"New chat")}async suggestChatTitleWithLlm(e){var i,r,s;let n=(this.settings.chatBaseUrl||"").trim(),t=(this.settings.chatModel||"").trim();if(!n||!t)return null;try{let a=`${n.replace(/\/$/,"")}/chat/completions`,o={"Content-Type":"application/json"};this.settings.chatApiKey&&(o.Authorization=`Bearer ${this.settings.chatApiKey}`);let l=e.slice(-8).map(_=>`${_.role.toUpperCase()}: ${_.content}`).join(`
`).slice(0,4e3),u=await fetch(a,{method:"POST",headers:o,body:JSON.stringify({model:t,temperature:.2,messages:[{role:"system",content:"Generate a short, specific title (3-7 words) for the chat. No quotes, no punctuation at the end."},{role:"user",content:l}]})});if(!u.ok)return null;let h=await u.json(),f=(s=(r=(i=h==null?void 0:h.choices)==null?void 0:i[0])==null?void 0:r.message)==null?void 0:s.content;return typeof f!="string"?null:this.normalizeChatTitle(f.replace(/^\"|\"$/g,"").trim())}catch(a){return console.warn("Chat title suggestion failed",a),null}}async finalizeChatSessionNameIfNeeded(e,n,t={}){var c;if(!e)return;let i=n||[];if(!i.some(u=>u.role==="user"&&u.content.trim())||!t.force&&i.length<4)return;let a=((c=(await this.readChatSessionsIndex()).sessions)!=null?c:[]).find(u=>u.id===e);if(!a||!this.isPlaceholderChatName(a.name))return;let l=await this.suggestChatTitleWithLlm(i)||this.guessTitleFromMessages(i);!l||this.isPlaceholderChatName(l)||await this.renameChatSession(e,l)}async runRagQueryStreaming(e,n,t,i=[]){await this.ensureBundledTools();let r=this.getPluginDir(),s=y.default.join(r,"tools","rag_query_redisearch.py"),a=["--query",e,"--k","5","--redis-url",this.settings.redisUrl,"--index",this.settings.redisIndex,"--prefix",this.settings.redisPrefix,"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--chat-base-url",this.settings.chatBaseUrl,"--chat-api-key",this.settings.chatApiKey,"--chat-model",this.settings.chatModel,"--temperature",String(this.settings.chatTemperature),"--stream"],o=this.buildChatHistoryPayload(i),l=await this.writeChatHistoryTemp(o);l!=null&&l.absolutePath&&a.push("--history-file",l.absolutePath);try{await this.runPythonStreaming(s,a,c=>{if((c==null?void 0:c.type)==="delta"&&typeof c.content=="string"){n(c.content);return}if((c==null?void 0:c.type)==="final"){t(c);return}c!=null&&c.answer&&t(c)},t)}finally{if(l!=null&&l.relativePath)try{await this.app.vault.adapter.remove(l.relativePath)}catch(c){console.warn("Failed to remove chat history temp file",c)}}}buildChatHistoryPayload(e){return this.getRecentChatHistory(e).map(t=>({role:t.role,content:t.content}))}async writeChatHistoryTemp(e){if(!e.length)return null;let n=(0,d.normalizePath)(`${A}/tmp`);await this.ensureFolder(n);let t=`chat_history_${Date.now()}_${Math.random().toString(36).slice(2,8)}.json`,i=(0,d.normalizePath)(`${n}/${t}`),r={version:1,messages:e};return await this.app.vault.adapter.write(i,JSON.stringify(r,null,2)),{relativePath:i,absolutePath:this.getAbsoluteVaultPath(i)}}async resolveCitationDisplay(e){var h,f;let n=await this.getDocIndexEntry(e.doc_id);(!n||!n.note_title||!n.zotero_title||!n.note_path||!n.pdf_path)&&(n=await this.hydrateDocIndexFromCache(e.doc_id));let t=e.doc_id?await this.resolveNotePathForDocId(e.doc_id):n==null?void 0:n.note_path,i=(n==null?void 0:n.zotero_title)||(n==null?void 0:n.note_title)||(t?y.default.basename(t,".md"):e.doc_id||"?"),r=e.pages||`${(h=e.page_start)!=null?h:"?"}-${(f=e.page_end)!=null?f:"?"}`,s=r.includes("-")?r.replace("-"," - "):r,a=e.page_start?String(e.page_start):"",o=(n==null?void 0:n.pdf_path)||e.source_pdf||"",l=e.attachment_key||(n==null?void 0:n.attachment_key),c=e.annotation_key||this.extractAnnotationKey(e.chunk_id),u=e.doc_id?this.buildZoteroDeepLink(e.doc_id,l,a,c):void 0;return{noteTitle:i,pageLabel:s,notePath:t||void 0,pdfPath:o||void 0,zoteroUrl:u,pageStart:a||void 0}}async formatInlineCitations(e,n,t=[]){if(!e)return e;let i=/\[\[?cite:([A-Za-z0-9]+):([^\]\n]+?)\]?\]/g,r=Array.from(e.matchAll(i));if(r.length===0)return e;let s=new Map;for(let o of r){let l=o[0];if(s.has(l))continue;let c=o[1],u=o[2].trim(),h=u.match(/^(\d+)-(\d+)(?::([A-Za-z0-9]+))?$/),f="",_="",m,x;h?(f=h[1],_=h[2],m=h[3]):x=u;let k=x?t.find(C=>{let E=typeof C.doc_id=="string"?C.doc_id:"";if(E&&E!==c)return!1;let S=typeof C.chunk_id=="string"?C.chunk_id:"";return S?S===x||S===`${c}:${x}`||S.endsWith(`:${x}`):!1}):void 0;k&&(!f&&k.page_start!==void 0&&(f=String(k.page_start)),!_&&k.page_end!==void 0&&(_=String(k.page_end)),!m&&typeof k.chunk_id=="string"&&(m=this.extractAnnotationKey(k.chunk_id)));let v={doc_id:c,chunk_id:k==null?void 0:k.chunk_id,annotation_key:m};(f||_)&&(v.page_start=f||_,v.page_end=_||f,v.pages=`${v.page_start}-${v.page_end}`),k!=null&&k.source_pdf&&(v.source_pdf=String(k.source_pdf));let b=(f||_?n.find(C=>{var E,S;return C.doc_id===c&&String((E=C.page_start)!=null?E:"")===f&&String((S=C.page_end)!=null?S:"")===_}):void 0)||n.find(C=>C.doc_id===c)||v;!b.annotation_key&&m&&(b={...b,annotation_key:m});let L=await this.resolveCitationDisplay(b);if(L.zoteroUrl){let C=`${L.noteTitle} p. ${L.pageLabel}`;s.set(l,`[${C}](${L.zoteroUrl})`)}else{let C=L.pageLabel?`${c} p. ${L.pageLabel}`:`${c}`;s.set(l,`(${C})`)}}let a=e;for(let[o,l]of s)a=a.split(o).join(l);return a}handleDoclingProgress(e,n){if(!e||e.type!=="progress")return;let t=Number(e.percent);if(!Number.isFinite(t))return;let i=typeof e.message=="string"&&e.message.trim()?e.message:"Docling extraction...";this.showStatusProgress(this.formatStatusLabel(i,n),Math.round(t))}async createChatNoteFromSession(e,n,t){let i=this.getChatExportDir();await this.ensureFolder(i),await this.getDocIndex();let r=this.sanitizeFileName(n)||"Zotero Chat",s=this.formatTimestamp(new Date),a=(0,d.normalizePath)(`${i}/${r}.md`),o=await this.resolveUniqueNotePath(a,`${r}-${s}.md`),l=await this.buildChatTranscript(n,t);await this.app.vault.adapter.write(o,l),await this.openNoteInNewTab(o),new d.Notice(`Chat copied to ${o}`)}async buildChatTranscript(e,n){var i,r,s;let t=[];t.push(`# ${e||"Zotero Chat"}`),t.push(""),t.push(`Created: ${new Date().toISOString()}`),t.push("");for(let a of n){let o=a.role==="user"?"## You":"## Assistant";t.push(o),t.push("");let l=a.role==="assistant"?await this.formatInlineCitations(a.content||"",(i=a.citations)!=null?i:[],(r=a.retrieved)!=null?r:[]):a.content||"";if(t.push(l.trim()),t.push(""),a.role==="assistant"&&((s=a.citations)!=null&&s.length)){t.push("### Relevant context sources");let c=this.formatCitationsMarkdown(a.citations);c&&(t.push(c),t.push(""))}}return t.join(`
`).trim()+`
`}async resolveUniqueNotePath(e,n){let t=this.app.vault.adapter;if(!await t.exists(e))return e;let i=y.default.dirname(e),r=(0,d.normalizePath)(y.default.join(i,n));if(!await t.exists(r))return r;let s=2;for(;s<1e3;){let a=(0,d.normalizePath)(y.default.join(i,`${y.default.basename(n,".md")}-${s}.md`));if(!await t.exists(a))return a;s+=1}return r}formatTimestamp(e){let n=t=>String(t).padStart(2,"0");return[e.getFullYear(),n(e.getMonth()+1),n(e.getDate()),"-",n(e.getHours()),n(e.getMinutes())].join("")}async openCitationTarget(e,n){let t=n!=null?n:await this.resolveCitationDisplay(e);if(t.notePath){await this.openNoteInMain(t.notePath);return}if(!(t.pdfPath&&await this.openPdfInMain(t.pdfPath,t.pageStart))){if(t.zoteroUrl){this.openExternalUrl(t.zoteroUrl);return}new d.Notice("Unable to open citation target.")}}async rebuildNoteFromCache(){let e=await this.promptDocId();if(!e){new d.Notice("No doc_id provided.");return}await this.rebuildNoteFromCacheForDocId(e,!0)&&new d.Notice(`Rebuilt Zotero note for ${e}.`)}async rebuildDocIndexFromCache(){var l,c,u;let e=this.app.vault.adapter,n=await this.listDocIds(N),t=await this.listDocIds(z),i=await this.scanNotesForDocIds(this.settings.outputNoteDir),r=Object.keys(i),s=Array.from(new Set([...n,...t,...r]));if(s.length===0){new d.Notice("No cached items found.");return}this.showStatusProgress("Rebuilding doc index...",0);let a=await this.getDocIndex(),o=0;for(let h of s){o+=1;let f={},_=i[h];_&&(f.note_path=_.note_path,f.note_title=_.note_title);let m=(0,d.normalizePath)(`${N}/${h}.json`);if(await e.exists(m))try{let v=await e.read(m),b=JSON.parse(v),L=(c=(l=b==null?void 0:b.data)!=null?l:b)!=null?c:{},C=typeof L.title=="string"?L.title:"";C&&(f.zotero_title=C);let E=this.sanitizeFileName(C)||h,S=(0,d.normalizePath)(`${this.settings.outputNoteDir}/${E}.md`),T=(0,d.normalizePath)(`${this.settings.outputNoteDir}/${E}-${h}.md`);await e.exists(S)?(f.note_path=S,f.note_title=y.default.basename(S,".md")):await e.exists(T)&&(f.note_path=T,f.note_title=y.default.basename(T,".md"))}catch(v){console.error("Failed to read cached item JSON",v)}let x=(0,d.normalizePath)(`${z}/${h}.json`);if(await e.exists(x))try{let v=await e.read(x),b=JSON.parse(v);typeof(b==null?void 0:b.source_pdf)=="string"&&(f.pdf_path=b.source_pdf)}catch(v){console.error("Failed to read cached chunks JSON",v)}if(Object.keys(f).length>0){let b={...(u=a[h])!=null?u:{doc_id:h},...f,doc_id:h,updated_at:new Date().toISOString()};!b.note_title&&b.note_path&&(b.note_title=y.default.basename(b.note_path,".md")),a[h]=b}let k=Math.round(o/s.length*100);this.showStatusProgress(`Rebuilding doc index ${o}/${s.length}`,k)}await this.saveDocIndex(a),this.showStatusProgress("Done",100),window.setTimeout(()=>this.clearStatusProgress(),1200),new d.Notice(`Rebuilt doc index for ${s.length} items.`)}async recreateMissingNotesFromCache(){let e=this.app.vault.adapter,n=await this.listDocIds(N),t=await this.listDocIds(z),i=await this.scanNotesForDocIds(this.settings.outputNoteDir),r=Object.keys(i),s=Array.from(new Set([...n,...t,...r]));if(s.length===0){new d.Notice("No cached items found.");return}let a=[];for(let l of s){if(i[l])continue;let c=await this.getDocIndexEntry(l);if(c!=null&&c.note_path&&await e.exists(c.note_path))continue;let u=await this.inferNotePathFromCache(l);u&&await e.exists(u)||a.push(l)}if(a.length===0){new d.Notice("No missing notes detected.");return}this.showStatusProgress("Recreating missing notes...",0);let o=0;for(let l=0;l<a.length;l+=1){let c=a[l],u=Math.round((l+1)/a.length*100);this.showStatusProgress(`Recreating ${l+1}/${a.length}`,u),await this.rebuildNoteFromCacheForDocId(c,!1)&&(o+=1)}this.showStatusProgress("Done",100),window.setTimeout(()=>this.clearStatusProgress(),1200),new d.Notice(`Recreated ${o}/${a.length} missing notes.`)}async reindexRedisFromCache(){try{await this.ensureBundledTools()}catch(s){new d.Notice("Failed to sync bundled tools. See console for details."),console.error(s);return}let e=await this.listDocIds(z);if(e.length===0){new d.Notice("No cached chunks found.");return}let n=this.getPluginDir(),t=y.default.join(n,"tools","index_redisearch.py"),i=0,r=0;this.showStatusProgress("Reindexing cached chunks...",0);for(let s of e){i+=1;let a=Math.round(i/e.length*100);this.showStatusProgress(`Reindexing ${i}/${e.length}`,a);let o=(0,d.normalizePath)(`${z}/${s}.json`);try{await this.runPython(t,["--chunks-json",this.getAbsoluteVaultPath(o),"--redis-url",this.settings.redisUrl,"--index",this.settings.redisIndex,"--prefix",this.settings.redisPrefix,"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--upsert"])}catch(l){r+=1,console.error(`Failed to reindex ${s}`,l)}}this.showStatusProgress("Done",100),window.setTimeout(()=>this.clearStatusProgress(),1200),r===0?new d.Notice(`Reindexed ${e.length} cached items.`):new d.Notice(`Reindexed ${e.length-r}/${e.length} items (see console).`)}async promptZoteroItem(){return new Promise(e=>{new X(this.app,this,e).open()})}async listDocIds(e){let n=this.app.vault.adapter,t=(0,d.normalizePath)(e);return await n.exists(t)?(await n.list(t)).files.filter(r=>r.endsWith(".json")).map(r=>y.default.basename(r,".json")):[]}async listMarkdownFiles(e){let n=this.app.vault.adapter,t=(0,d.normalizePath)(e);if(!await n.exists(t))return[];let i=[t],r=[];for(;i.length>0;){let s=i.pop();if(!s)continue;let a=await n.list(s);for(let o of a.files)o.endsWith(".md")&&r.push(o);for(let o of a.folders)i.push(o)}return r}extractDocIdFromFrontmatter(e){let n=e.match(/^---\s*\n([\s\S]*?)\n---/);if(!n)return null;let i=n[1].split(/\r?\n/);for(let r of i){let s=r.trim();if(!s||s.startsWith("#"))continue;let a=s.split(":");if(a.length<2)continue;let o=a[0].trim().toLowerCase();if(o!=="doc_id"&&o!=="zotero_key")continue;let c=s.slice(s.indexOf(":")+1).trim().replace(/^["']|["']$/g,"").trim();if(c)return c}return null}async scanNotesForDocIds(e){let n=this.app.vault.adapter,t=await this.listMarkdownFiles(e),i={};for(let r of t)try{let s=await n.read(r),a=this.extractDocIdFromFrontmatter(s);if(!a)continue;i[a]={doc_id:a,note_path:r,note_title:y.default.basename(r,".md"),updated_at:new Date().toISOString()}}catch(s){console.error("Failed to read note for doc_id scan",s)}return i}setupStatusBar(){let e=this.addStatusBarItem();e.addClass("zrr-status-progress"),e.addClass("status-bar-item-segment"),e.style.display="none";let n=e.createEl("span",{text:"Idle"});n.addClass("zrr-status-label");let i=e.createEl("div",{cls:"zrr-status-bar"}).createEl("div",{cls:"zrr-status-bar-inner"});this.statusBarEl=e,this.statusLabelEl=n,this.statusBarInnerEl=i}showStatusProgress(e,n){if(!(!this.statusBarEl||!this.statusLabelEl||!this.statusBarInnerEl))if(this.statusBarEl.style.display="flex",this.statusLabelEl.setText(e),n===null)this.statusBarInnerEl.addClass("indeterminate"),this.statusBarInnerEl.style.width="40%";else{this.statusBarInnerEl.removeClass("indeterminate");let t=Math.max(0,Math.min(100,n));this.statusBarInnerEl.style.width=`${t}%`}}clearStatusProgress(){!this.statusBarEl||!this.statusBarInnerEl||(this.statusBarEl.style.display="none",this.statusBarInnerEl.removeClass("indeterminate"),this.statusBarInnerEl.style.width="0%")}formatStatusLabel(e,n){return n?`${e} (Text layer quality ${n})`:e}async readDoclingQualityLabel(e){var n;try{let t=await this.app.vault.adapter.read(e),i=JSON.parse(t),r=(n=i==null?void 0:i.metadata)==null?void 0:n.confidence_proxy;if(typeof r=="number")return r.toFixed(2)}catch(t){console.warn("Failed to read Docling quality metadata",t)}return null}async readDoclingQualityLabelFromPdf(e,n){try{let t=this.getPluginDir(),i=y.default.join(t,"tools","docling_extract.py"),r=this.settings.ocrMode==="force_low_quality"?"auto":this.settings.ocrMode,s=["--quality-only","--pdf",e,"--ocr",r];this.settings.ocrMode==="force_low_quality"&&s.push("--force-ocr-low-quality"),s.push("--quality-threshold",String(this.settings.ocrQualityThreshold)),n&&s.push("--language-hint",n);let a=await this.runPythonWithOutput(i,s),o=JSON.parse(a),l=o==null?void 0:o.confidence_proxy;if(typeof l=="number")return l.toFixed(2)}catch(t){console.warn("Failed to read Docling quality from PDF",t)}return null}async promptDocId(){return new Promise(e=>{new U(this.app,"Rebuild Zotero note from cache","Enter Zotero doc_id (e.g., ABC123)",n=>e(n),"Doc ID cannot be empty.").open()})}async promptLanguageHint(){return new Promise(e=>{new Y(this.app,e).open()})}registerRibbonIcons(){(0,d.addIcon)("zrr-picker",fe),(0,d.addIcon)("zrr-chat",me),this.addRibbonIcon("zrr-picker","Import Zotero item and index",()=>this.importZoteroItem()).addClass("zrr-ribbon-picker"),this.addRibbonIcon("zrr-chat","Open Zotero RAG chat",()=>this.openChatView(!0)).addClass("zrr-ribbon-chat")}async confirmOverwrite(e){return new Promise(n=>{new Q(this.app,e,n).open()})}async resolveLanguageHint(e,n){let t=typeof e.language=="string"?e.language:"",i=this.normalizeZoteroLanguage(t);if(i)return i;let r=await this.promptLanguageHint();if(r===null)return console.info("Language selection canceled."),null;let s=this.normalizeZoteroLanguage(r);if(!s)return console.info("Language selection empty; skipping Zotero update."),"";if(e.language=s,console.info("Language selected",{language:s,itemKey:n}),n)try{await this.updateZoteroItemLanguage(n,e,s),new d.Notice("Saved language to Zotero.")}catch(a){new d.Notice("Failed to write language back to Zotero."),console.error(a)}else console.warn("Language selected but itemKey is missing; skipping Zotero update.");return s}normalizeZoteroLanguage(e){return(e||"").trim().toLowerCase()}buildDoclingLanguageHint(e){let n=this.normalizeZoteroLanguage(e!=null?e:"");if(!n)return null;let t=n.split(/[^a-z]+/).filter(Boolean),i=t.some(s=>["de","deu","ger","german"].includes(s)),r=t.some(s=>["en","eng","english"].includes(s));return i&&r?"deu+eng":i?"deu":r?"eng":t.length===1&&re[t[0]]?re[t[0]]:n}async fetchZoteroItem(e){try{let n=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}`),t=await this.requestLocalApi(n,`Zotero item fetch failed for ${n}`);return JSON.parse(t.toString("utf8"))}catch(n){return console.warn("Failed to fetch Zotero item from local API",n),this.canUseWebApi()?this.fetchZoteroItemWeb(e):null}}async fetchZoteroItemWeb(e){try{let n=this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/items/${e}`),t=await this.requestWebApi(n,`Zotero Web API fetch failed for ${n}`);return JSON.parse(t.toString("utf8"))}catch(n){return console.warn("Failed to fetch Zotero item from Web API",n),null}}async searchZoteroItemsWeb(e){let n=new URLSearchParams;n.set("itemType","-attachment"),n.set("limit","25"),n.set("include","data,meta"),e.trim()&&n.set("q",e.trim());let t=this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/items?${n.toString()}`),i=await this.requestWebApi(t,`Zotero Web API search failed for ${t}`),r=JSON.parse(i.toString("utf8"));return Array.isArray(r)?r.map(s=>{var a,o,l,c;return{key:(o=s.key)!=null?o:(a=s.data)==null?void 0:a.key,data:(l=s.data)!=null?l:{},meta:(c=s.meta)!=null?c:{}}}).filter(s=>typeof s.key=="string"&&s.key.trim().length>0):[]}async updateZoteroItemLanguage(e,n,t){try{await this.updateZoteroItemLanguageLocal(e,n,t);return}catch(i){if(!this.canUseWebApi())throw i;let r=i instanceof Error?i.message:String(i);console.info("Local Zotero write failed; trying Web API",{itemKey:e,reason:r}),await this.updateZoteroItemLanguageWeb(e,n,t)}}async updateZoteroItemLanguageLocal(e,n,t){var k,v,b,L,C,E;let i=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}`),r={...n,language:t},s={"Content-Type":"application/json","Zotero-API-Version":"3"},a=typeof r.version=="number"?r.version:Number(r.version);Number.isNaN(a)||(s["If-Unmodified-Since-Version"]=String(a)),console.info("Zotero language PUT",{url:i,itemKey:e,language:t});try{let S=await this.requestLocalApiWithBody(i,"PUT",r,s,`Zotero update failed for ${i}`);console.info("Zotero language PUT response",{status:S.statusCode})}catch(S){if(!(S instanceof Error?S.message:String(S)).includes("status 501"))throw S;let g=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items`);console.info("Zotero language PUT unsupported; trying POST",{postUrl:g});let D=await this.requestLocalApiWithBody(g,"POST",[r],s,`Zotero update failed for ${g}`);console.info("Zotero language POST response",{status:D.statusCode})}let o=await this.fetchZoteroItem(e);if(this.normalizeZoteroLanguage(typeof((k=o==null?void 0:o.data)==null?void 0:k.language)=="string"?o.data.language:"")===this.normalizeZoteroLanguage(t))return;let c={...(v=o==null?void 0:o.data)!=null?v:n,language:t},u={key:e,version:(C=(L=(b=o==null?void 0:o.data)==null?void 0:b.version)!=null?L:o==null?void 0:o.version)!=null?C:a,data:c},h={...s},f=typeof u.version=="number"?u.version:Number(u.version);Number.isNaN(f)?delete h["If-Unmodified-Since-Version"]:h["If-Unmodified-Since-Version"]=String(f);let _=await this.requestLocalApiWithBody(i,"PUT",u,h,`Zotero update failed for ${i}`);console.info("Zotero language PUT retry response",{status:_.statusCode});let m=await this.fetchZoteroItem(e);if(this.normalizeZoteroLanguage(typeof((E=m==null?void 0:m.data)==null?void 0:E.language)=="string"?m.data.language:"")!==this.normalizeZoteroLanguage(t))throw new Error("Language update did not persist in Zotero.")}async updateZoteroItemLanguageWeb(e,n,t){var _,m,x,k,v;let i=this.getWebApiLibraryPath();if(!i)throw new Error("Web API library path is not configured.");let r=this.buildWebApiUrl(`/${i}/items/${e}`),s=await this.fetchZoteroItemWeb(e),a={...(_=s==null?void 0:s.data)!=null?_:n,language:t},o={"Content-Type":"application/json","Zotero-API-Version":"3","Zotero-API-Key":this.settings.webApiKey},l=(k=(x=(m=s==null?void 0:s.data)==null?void 0:m.version)!=null?x:s==null?void 0:s.version)!=null?k:n==null?void 0:n.version,c=typeof l=="number"?l:Number(l);Number.isNaN(c)||(o["If-Unmodified-Since-Version"]=String(c)),console.info("Zotero Web API language PUT",{url:r,itemKey:e,language:t});let u=await this.requestWebApiWithBody(r,"PUT",a,o,`Zotero Web API update failed for ${r}`);console.info("Zotero Web API language PUT response",{status:u.statusCode});let h=await this.fetchZoteroItemWeb(e);if(this.normalizeZoteroLanguage(typeof((v=h==null?void 0:h.data)==null?void 0:v.language)=="string"?h.data.language:"")!==this.normalizeZoteroLanguage(t))throw new Error("Language update did not persist in Zotero Web API.")}getDocId(e){let n=[e.key,e.itemKey,e.id,e.citationKey];for(let t of n)if(typeof t=="string"&&t.trim())return t.trim();return null}sanitizeFileName(e){let n=e.replace(/[\\/:*?"<>|]/g,"").replace(/\s+/g," ").trim();return n?n.replace(/[.]+$/g,"").trim().slice(0,120):""}registerNoteRenameHandler(){this.registerEvent(this.app.vault.on("rename",async e=>{if(!(!(e instanceof d.TFile)||e.extension!=="md"))try{let n=await this.app.vault.read(e),t=this.extractDocIdFromFrontmatter(n);if(!t)return;await this.updateDocIndex({doc_id:t,note_path:e.path,note_title:y.default.basename(e.path,".md")})}catch(n){console.warn("Failed to update doc index for renamed note",n)}}))}async resolveNotePathForDocId(e){if(!e)return null;let n=this.app.vault.adapter,t=await this.getDocIndexEntry(e);if(t!=null&&t.note_path&&await n.exists(t.note_path))return t.note_path;let r=(await this.scanNotesForDocIds(this.settings.outputNoteDir))[e];return r!=null&&r.note_path?(await this.updateDocIndex({doc_id:e,note_path:r.note_path,note_title:r.note_title}),r.note_path):null}async resolveUniqueBaseName(e,n){let t=this.app.vault.adapter,i=(0,d.normalizePath)(`${this.settings.outputNoteDir}/${e}.md`),r=(0,d.normalizePath)(`${this.settings.outputPdfDir}/${e}.pdf`),s=await t.exists(i),a=this.settings.copyPdfToVault?await t.exists(r):!1;return s||a?`${e}-${n}`:e}async searchZoteroItems(e){let n=new URLSearchParams;n.set("itemType","-attachment"),n.set("limit","25"),n.set("include","data,meta"),e.trim()&&n.set("q",e.trim());let t=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items?${n.toString()}`);try{let i=await this.requestLocalApi(t,`Zotero search failed for ${t}`),r=JSON.parse(i.toString("utf8"));return Array.isArray(r)?r.map(s=>{var a,o,l,c;return{key:(o=s.key)!=null?o:(a=s.data)==null?void 0:a.key,data:(l=s.data)!=null?l:{},meta:(c=s.meta)!=null?c:{}}}).filter(s=>typeof s.key=="string"&&s.key.trim().length>0):[]}catch(i){if(console.warn("Failed to search Zotero via local API",i),!this.canUseWebApi())throw i;return this.searchZoteroItemsWeb(e)}}async resolvePdfAttachment(e,n){let t=this.pickPdfAttachment(e);if(t)return t;try{let i=await this.fetchZoteroChildren(n);for(let r of i){let s=this.toPdfAttachment(r);if(s)return s}}catch(i){console.error("Failed to fetch Zotero children",i)}return null}pickPdfAttachment(e){var t,i,r;let n=(r=(i=(t=e.attachments)!=null?t:e.children)!=null?i:e.items)!=null?r:[];if(!Array.isArray(n))return null;for(let s of n){let a=this.toPdfAttachment(s);if(a)return a}return null}toPdfAttachment(e){var r,s,a,o,l,c;if(((a=(r=e==null?void 0:e.contentType)!=null?r:e==null?void 0:e.mimeType)!=null?a:(s=e==null?void 0:e.data)==null?void 0:s.contentType)!=="application/pdf")return null;let t=(c=(o=e==null?void 0:e.key)!=null?o:e==null?void 0:e.attachmentKey)!=null?c:(l=e==null?void 0:e.data)==null?void 0:l.key;if(!t)return null;let i=this.extractAttachmentPath(e);return i?{key:t,filePath:i}:{key:t}}extractAttachmentPath(e){var t,i,r,s,a,o,l,c;let n=(c=(s=(i=(t=e==null?void 0:e.links)==null?void 0:t.enclosure)==null?void 0:i.href)!=null?s:(r=e==null?void 0:e.enclosure)==null?void 0:r.href)!=null?c:(l=(o=(a=e==null?void 0:e.data)==null?void 0:a.links)==null?void 0:o.enclosure)==null?void 0:l.href;if(typeof n=="string"&&n.startsWith("file://"))try{return(0,F.fileURLToPath)(n)}catch(u){return null}return null}async fetchZoteroChildren(e){let n=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}/children`);try{let t=await this.requestLocalApi(n,`Zotero children request failed for ${n}`);return JSON.parse(t.toString("utf8"))}catch(t){if(console.warn("Failed to fetch Zotero children from local API",t),!this.canUseWebApi())throw t;let i=this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/items/${e}/children`),r=await this.requestWebApi(i,`Zotero Web API children request failed for ${i}`);return JSON.parse(r.toString("utf8"))}}async downloadZoteroPdf(e){let n=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}/file`);try{let t=await this.requestLocalApiRaw(n),i=await this.followFileRedirect(t);if(i)return i;if(t.statusCode>=300)throw new Error(`Request failed, status ${t.statusCode}`);return t.body}catch(t){if(console.warn("Failed to download PDF from local API",t),!this.canUseWebApi())throw t;let i=this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/items/${e}/file`),r=await this.requestWebApiRaw(i),s=await this.followFileRedirect(r);if(s)return s;if(r.statusCode>=300)throw new Error(`Web API request failed, status ${r.statusCode}`);return r.body}}buildZoteroUrl(e){return`${this.settings.zoteroBaseUrl.replace(/\/$/,"")}${e}`}canUseWebApi(){return!!((this.settings.webApiBaseUrl||"").trim()&&this.settings.webApiKey&&this.settings.webApiLibraryId)}getWebApiLibraryPath(){let e=(this.settings.webApiLibraryId||"").trim();return e?`${this.settings.webApiLibraryType==="group"?"groups":"users"}/${e}`:""}buildWebApiUrl(e){return`${this.settings.webApiBaseUrl.replace(/\/$/,"")}${e}`}requestLocalApiRaw(e,n={}){return new Promise((t,i)=>{var u,h;let r=new URL(e),s=r.protocol==="https:"?ae.default:se.default,a=(u=n.method)!=null?u:"GET",o={Accept:"*/*",...(h=n.headers)!=null?h:{}},l=n.body;if(l!==void 0&&o["Content-Length"]===void 0){let f=Buffer.isBuffer(l)?l.length:Buffer.byteLength(l);o["Content-Length"]=String(f)}let c=s.request({method:a,hostname:r.hostname,port:r.port||void 0,path:`${r.pathname}${r.search}`,headers:o},f=>{let _=[];f.on("data",m=>_.push(Buffer.from(m))),f.on("end",()=>{var x;let m=Buffer.concat(_);t({statusCode:(x=f.statusCode)!=null?x:0,headers:f.headers,body:m})})});c.on("error",i),l!==void 0&&c.write(l),c.end()})}async requestLocalApi(e,n){let t=await this.requestLocalApiRaw(e);if(t.statusCode>=400){let i=t.body.toString("utf8");throw new Error(`${n!=null?n:"Request failed"}, status ${t.statusCode}: ${i||"no response body"}`)}if(t.statusCode>=300)throw new Error(`${n!=null?n:"Request failed"}, status ${t.statusCode}`);return t.body}async requestLocalApiWithBody(e,n,t,i,r){let s=JSON.stringify(t),a=await this.requestLocalApiRaw(e,{method:n,headers:i,body:s});if(a.statusCode>=400){let o=a.body.toString("utf8");throw new Error(`${r!=null?r:"Request failed"}, status ${a.statusCode}: ${o||"no response body"}`)}if(a.statusCode>=300)throw new Error(`${r!=null?r:"Request failed"}, status ${a.statusCode}`);return{statusCode:a.statusCode,body:a.body}}async requestWebApi(e,n){let t={"Zotero-API-Version":"3","Zotero-API-Key":this.settings.webApiKey},i=await this.requestLocalApiRaw(e,{headers:t});if(i.statusCode>=400){let r=i.body.toString("utf8");throw new Error(`${n!=null?n:"Request failed"}, status ${i.statusCode}: ${r||"no response body"}`)}if(i.statusCode>=300)throw new Error(`${n!=null?n:"Request failed"}, status ${i.statusCode}`);return i.body}requestWebApiRaw(e,n={}){var i;let t={"Zotero-API-Version":"3","Zotero-API-Key":this.settings.webApiKey,...(i=n.headers)!=null?i:{}};return this.requestLocalApiRaw(e,{...n,headers:t})}async requestWebApiWithBody(e,n,t,i,r){let s=JSON.stringify(t),a=await this.requestLocalApiRaw(e,{method:n,headers:i,body:s});if(a.statusCode>=400){let o=a.body.toString("utf8");throw new Error(`${r!=null?r:"Request failed"}, status ${a.statusCode}: ${o||"no response body"}`)}if(a.statusCode>=300)throw new Error(`${r!=null?r:"Request failed"}, status ${a.statusCode}`);return{statusCode:a.statusCode,body:a.body}}async followFileRedirect(e){if(e.statusCode<300||e.statusCode>=400)return null;let n=e.headers.location,t=Array.isArray(n)?n[0]:n;if(!t||typeof t!="string")return null;if(t.startsWith("file://")){let i=(0,F.fileURLToPath)(t);return O.promises.readFile(i)}return t.startsWith("http://")||t.startsWith("https://")?this.requestLocalApi(t):null}bufferToArrayBuffer(e){return e.buffer.slice(e.byteOffset,e.byteOffset+e.byteLength)}async annotateChunkJsonWithAttachmentKey(e,n){if(n)try{let t=await this.app.vault.adapter.read(e),i=JSON.parse(t);if(!i||typeof i!="object")return;let r=i.metadata&&typeof i.metadata=="object"?i.metadata:{};r.attachment_key=n,i.metadata=r,await this.app.vault.adapter.write(e,JSON.stringify(i,null,2))}catch(t){console.warn("Failed to annotate chunks JSON with attachment key",t)}}buildPdfLinkFromSourcePath(e){if(!e)return"";let n=y.default.normalize(this.getVaultBasePath()),t=y.default.normalize(e),i=n.endsWith(y.default.sep)?n:`${n}${y.default.sep}`;return t.startsWith(i)?`[[${(0,d.normalizePath)(y.default.relative(n,t))}]]`:`[PDF](${(0,F.pathToFileURL)(e).toString()})`}toVaultRelativePath(e){if(!e)return"";let n=y.default.normalize(this.getVaultBasePath()),t=y.default.normalize(e),i=n.endsWith(y.default.sep)?n:`${n}${y.default.sep}`;return t.startsWith(i)?(0,d.normalizePath)(y.default.relative(n,t)):""}buildPdfLinkForNote(e,n,t){return!e&&!n?"":!this.settings.copyPdfToVault&&n?`[PDF](${this.buildZoteroDeepLink(t!=null?t:"",n)})`:this.buildPdfLinkFromSourcePath(e)}getMainLeaf(){let e=new Set(this.app.workspace.getLeavesOfType(q)),n=this.app.workspace.getLeavesOfType("markdown").find(i=>!e.has(i));if(n)return n;let t=this.app.workspace.getLeaf(!1);return t&&!e.has(t)?t:this.app.workspace.getLeaf("tab")}async openNoteInMain(e){let n=(0,d.normalizePath)(e),t=this.app.vault.getAbstractFileByPath(n),i=this.getMainLeaf();if(t instanceof d.TFile){await i.openFile(t,{active:!0});return}await this.app.workspace.openLinkText(n,"",!1)}async openInternalLinkInMain(e){let n=this.getMainLeaf(),t=e.split("#")[0].trim(),i=t?this.app.metadataCache.getFirstLinkpathDest(t,""):null;if(i instanceof d.TFile){await n.openFile(i,{active:!0}),e.includes("#")&&(this.app.workspace.setActiveLeaf(n,{focus:!0}),await this.app.workspace.openLinkText(e,"",!1));return}this.app.workspace.setActiveLeaf(n,{focus:!0}),await this.app.workspace.openLinkText(e,"",!1)}async openNoteInNewTab(e){let n=(0,d.normalizePath)(e);await this.app.workspace.openLinkText(n,"","tab")}async openPdfInMain(e,n){if(!e)return!1;let t=y.default.normalize(this.getVaultBasePath()),i=y.default.normalize(e),r=t.endsWith(y.default.sep)?t:`${t}${y.default.sep}`;if(i.startsWith(r)){let s=(0,d.normalizePath)(y.default.relative(t,i)),a=n?`#page=${n}`:"";return await this.app.workspace.openLinkText(`${s}${a}`,"","tab"),!0}try{return window.open((0,F.pathToFileURL)(e).toString()),!0}catch(s){return!1}}openExternalUrl(e){e&&window.open(e)}buildZoteroDeepLink(e,n,t,i){if(n){let r=new URLSearchParams;t&&r.set("page",t),i&&r.set("annotation",i);let s=r.toString()?`?${r.toString()}`:"";return`zotero://open-pdf/library/items/${n}${s}`}return`zotero://select/library/items/${e}`}extractAnnotationKey(e){if(!e)return;let t=(e.includes(":")?e.split(":").slice(1).join(":"):e).trim().toUpperCase();if(/^[A-Z0-9]{8}$/.test(t))return t}formatCitationsMarkdown(e){return e.length?e.map(t=>this.formatCitationMarkdown(t)).filter(Boolean).join(`
`):""}formatCitationMarkdown(e){var f,_,m,x,k,v;let n=e.doc_id||"?",t=e.pages||`${(f=e.page_start)!=null?f:"?"}-${(_=e.page_end)!=null?_:"?"}`,i=`${n}`,r=t.includes("-")?t.replace("-"," - "):t,s=e.annotation_key||this.extractAnnotationKey(e.chunk_id),a=e.attachment_key||((x=(m=this.docIndex)==null?void 0:m[e.doc_id||""])==null?void 0:x.attachment_key),o=e.page_start?String(e.page_start):"",l=(v=(k=this.docIndex)==null?void 0:k[e.doc_id||""])!=null?v:null,c=(l==null?void 0:l.zotero_title)||(l==null?void 0:l.note_title)||i,u=l!=null&&l.note_path?(0,d.normalizePath)(l.note_path).replace(/\.md$/i,""):this.sanitizeFileName(c)||c,h=u&&u!==c?`[[${u}|${c}]]`:`[[${c}]]`;if(a){let b=this.buildZoteroDeepLink(n,a,o,s);return`- ${h}, p. [${r}](${b})`}return`- ${h}, p. ${r}`}generateChatId(){return typeof crypto!="undefined"&&"randomUUID"in crypto?crypto.randomUUID():`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}getDocIndexPath(){return(0,d.normalizePath)(`${A}/doc_index.json`)}async getDocIndex(){return this.docIndex?this.docIndex:(this.docIndex=await this.loadDocIndexFromDisk(),this.docIndex)}async loadDocIndexFromDisk(){var t;let e=this.app.vault.adapter,n=this.getDocIndexPath();if(!await e.exists(n))return{};try{let i=await e.read(n),r=JSON.parse(i);if(r&&typeof r=="object"){let s=(t=r.entries)!=null?t:r;if(Array.isArray(s)){let a={};for(let o of s)o!=null&&o.doc_id&&(a[String(o.doc_id)]=o);return a}if(s&&typeof s=="object")return s}}catch(i){console.error("Failed to read doc index",i)}return{}}async saveDocIndex(e){await this.ensureFolder(A);let n=this.app.vault.adapter,t=this.getDocIndexPath(),i={version:1,entries:e};await n.write(t,JSON.stringify(i,null,2)),this.docIndex=e}async updateDocIndex(e){var r;let n=await this.getDocIndex(),t=(r=n[e.doc_id])!=null?r:{doc_id:e.doc_id},i={...t,...e,doc_id:e.doc_id,updated_at:new Date().toISOString()};e.note_path===void 0&&t.note_path&&(i.note_path=t.note_path),e.note_title===void 0&&t.note_title&&(i.note_title=t.note_title),e.zotero_title===void 0&&t.zotero_title&&(i.zotero_title=t.zotero_title),e.pdf_path===void 0&&t.pdf_path&&(i.pdf_path=t.pdf_path),e.attachment_key===void 0&&t.attachment_key&&(i.attachment_key=t.attachment_key),n[e.doc_id]=i,await this.saveDocIndex(n)}async hydrateDocIndexFromCache(e){var a,o;if(!e)return null;let n=this.app.vault.adapter,t=await this.getDocIndexEntry(e),i={},r=(0,d.normalizePath)(`${N}/${e}.json`);if(await n.exists(r))try{let l=await n.read(r),c=JSON.parse(l),u=(o=(a=c==null?void 0:c.data)!=null?a:c)!=null?o:{},h=typeof u.title=="string"?u.title:"";if(h&&(i.zotero_title=h),!i.note_title||!i.note_path){let f=this.sanitizeFileName(h)||e,_=(0,d.normalizePath)(`${this.settings.outputNoteDir}/${f}.md`),m=(0,d.normalizePath)(`${this.settings.outputNoteDir}/${f}-${e}.md`),x="";await n.exists(_)?x=_:await n.exists(m)&&(x=m),x&&(i.note_path=x,i.note_title=y.default.basename(x,".md"))}}catch(l){console.error("Failed to read cached item JSON",l)}!i.note_title&&(t!=null&&t.note_path)&&(i.note_title=y.default.basename(t.note_path,".md"));let s=(0,d.normalizePath)(`${z}/${e}.json`);if(await n.exists(s))try{let l=await n.read(s),c=JSON.parse(l);typeof(c==null?void 0:c.source_pdf)=="string"&&(i.pdf_path=c.source_pdf)}catch(l){console.error("Failed to read cached chunks JSON",l)}return Object.keys(i).length>0&&await this.updateDocIndex({doc_id:e,...i}),this.getDocIndexEntry(e)}async getDocIndexEntry(e){var t;return e&&(t=(await this.getDocIndex())[e])!=null?t:null}async inferNotePathFromCache(e){var i,r;let n=this.app.vault.adapter,t=(0,d.normalizePath)(`${N}/${e}.json`);if(!await n.exists(t))return"";try{let s=await n.read(t),a=JSON.parse(s),o=(r=(i=a==null?void 0:a.data)!=null?i:a)!=null?r:{},l=typeof o.title=="string"?o.title:"",c=this.sanitizeFileName(l)||e,u=(0,d.normalizePath)(`${this.settings.outputNoteDir}/${c}.md`),h=(0,d.normalizePath)(`${this.settings.outputNoteDir}/${c}-${e}.md`);if(await n.exists(u))return u;if(await n.exists(h))return h}catch(s){console.error("Failed to infer note path from cache",s)}return""}async rebuildNoteFromCacheForDocId(e,n){var C,E,S,T;try{await this.ensureBundledTools()}catch(g){return n&&new d.Notice("Failed to sync bundled tools. See console for details."),console.error(g),!1}let t=this.app.vault.adapter,i=(0,d.normalizePath)(`${N}/${e}.json`),r=(0,d.normalizePath)(`${z}/${e}.json`);if(!await t.exists(i)||!await t.exists(r))return n&&new d.Notice("Cached item or chunks JSON not found."),!1;this.showStatusProgress("Preparing...",5);let s;try{let g=await t.read(i);s=JSON.parse(g)}catch(g){return n&&new d.Notice("Failed to read cached item JSON."),console.error(g),this.clearStatusProgress(),!1}let a;try{let g=await t.read(r);a=JSON.parse(g)}catch(g){return n&&new d.Notice("Failed to read cached chunks JSON."),console.error(g),this.clearStatusProgress(),!1}let o=typeof a.source_pdf=="string"?a.source_pdf:"";if(!o)return n&&new d.Notice("Cached chunk JSON is missing source_pdf."),this.clearStatusProgress(),!1;try{await O.promises.access(o)}catch(g){return n&&new d.Notice("Cached source PDF path is not accessible."),console.error(g),this.clearStatusProgress(),!1}let l=(C=s.data)!=null?C:s,c=typeof l.title=="string"?l.title:"",u=await this.resolveLanguageHint(l,(E=s.key)!=null?E:l.key),h=this.buildDoclingLanguageHint(u!=null?u:void 0),f="",_=await this.getDocIndexEntry(e),m=typeof((S=a==null?void 0:a.metadata)==null?void 0:S.attachment_key)=="string"?a.metadata.attachment_key:_==null?void 0:_.attachment_key;if(_!=null&&_.note_path&&await t.exists(_.note_path)&&(f=(0,d.normalizePath)(_.note_path)),!f){let g=this.sanitizeFileName(c)||e,D=(0,d.normalizePath)(`${this.settings.outputNoteDir}/${g}.md`),I=await t.exists(D)?g:await this.resolveUniqueBaseName(g,e);f=(0,d.normalizePath)(`${this.settings.outputNoteDir}/${I}.md`)}try{if(await this.ensureFolder(this.settings.outputNoteDir),this.settings.enableFileLogging){let g=this.getLogFileRelativePath(),D=(0,d.normalizePath)(y.default.dirname(g));D&&await this.ensureFolder(D);let I=this.getSpellcheckerInfoRelativePath(),j=(0,d.normalizePath)(y.default.dirname(I));j&&await this.ensureFolder(j)}}catch(g){return n&&new d.Notice("Failed to create notes folder."),console.error(g),this.clearStatusProgress(),!1}let x=this.getPluginDir(),k=y.default.join(x,"tools","docling_extract.py"),v=y.default.join(x,"tools","index_redisearch.py"),b=null;try{b=await this.readDoclingQualityLabelFromPdf(o,h),this.showStatusProgress(this.formatStatusLabel("Docling extraction...",b),0),await this.runPythonStreaming(k,this.buildDoclingArgs(o,e,r,f,h,!0),g=>this.handleDoclingProgress(g,b),()=>{}),b=await this.readDoclingQualityLabel(r),m&&await this.annotateChunkJsonWithAttachmentKey(r,m)}catch(g){return n&&new d.Notice("Docling extraction failed. See console for details."),console.error(g),this.clearStatusProgress(),!1}try{this.showStatusProgress(this.formatStatusLabel("Indexing chunks...",b),0),await this.runPythonStreaming(v,["--chunks-json",this.getAbsoluteVaultPath(r),"--redis-url",this.settings.redisUrl,"--index",this.settings.redisIndex,"--prefix",this.settings.redisPrefix,"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--upsert","--progress"],g=>{if((g==null?void 0:g.type)==="progress"&&g.total){let D=Math.round(g.current/g.total*100),I=this.formatStatusLabel(`Indexing chunks ${g.current}/${g.total}`,b);this.showStatusProgress(I,D)}},()=>{})}catch(g){return n&&new d.Notice("RedisSearch indexing failed. See console for details."),console.error(g),this.clearStatusProgress(),!1}let L=this.buildPdfLinkForNote(o,_==null?void 0:_.attachment_key,e);try{let g=await this.app.vault.adapter.read(f),D=this.buildNoteMarkdown(l,(T=s.meta)!=null?T:{},e,L,i,g);await this.app.vault.adapter.write(f,D)}catch(g){return n&&new d.Notice("Failed to finalize note markdown."),console.error(g),this.clearStatusProgress(),!1}try{await this.updateDocIndex({doc_id:e,note_path:f,note_title:y.default.basename(f,".md"),zotero_title:c,pdf_path:o})}catch(g){console.error("Failed to update doc index",g)}return!0}getZoteroLibraryPath(){let e=(this.settings.zoteroUserId||"0").trim();return!e||e==="0"?"users/0":e.startsWith("users/")||e.startsWith("groups/")?e:`users/${e}`}async ensureFolder(e){let n=this.app.vault.adapter,t=(0,d.normalizePath)(e).split("/").filter(Boolean),i="";for(let r of t)i=i?`${i}/${r}`:r,await n.exists(i)||await n.mkdir(i)}buildNoteMarkdown(e,n,t,i,r,s){let a=`[[${r}]]`,o=this.renderFrontmatter(e,n,t,i,a);return`${o?`---
${o}
---

`:""}PDF: ${i}

Item JSON: ${a}

${s}`}renderFrontmatter(e,n,t,i,r){var o;let s=(o=this.settings.frontmatterTemplate)!=null?o:"";if(!s.trim())return"";let a=this.buildTemplateVars(e,n,t,i,r);return s.replace(/{{\s*([a-z0-9_]+)\s*}}/gi,(l,c)=>{var u;return(u=a[c])!=null?u:""}).trim()}buildTemplateVars(e,n,t,i,r){let s=typeof e.title=="string"?e.title:"",a=typeof e.shortTitle=="string"?e.shortTitle:"",o=typeof e.date=="string"?e.date:"",l=typeof(n==null?void 0:n.parsedDate)=="string"?n.parsedDate:"",c=this.extractYear(l||o),h=(Array.isArray(e.creators)?e.creators:[]).filter(b=>b.creatorType==="author").map(b=>this.formatCreatorName(b)),f=h.join("; "),_=Array.isArray(e.tags)?e.tags.map(b=>typeof b=="string"?b:b==null?void 0:b.tag).filter(Boolean):[],m=_.join("; "),x=typeof e.itemType=="string"?e.itemType:"",k=typeof(n==null?void 0:n.creatorSummary)=="string"?n.creatorSummary:"",v={doc_id:t,zotero_key:typeof e.key=="string"?e.key:t,title:s,short_title:a,date:o,year:c,authors:f,tags:m,item_type:x,creator_summary:k,pdf_link:this.escapeYamlString(i),item_json:this.escapeYamlString(r)};for(let[b,L]of Object.entries(v))v[`${b}_yaml`]=this.escapeYamlString(L);return v.authors_yaml=this.toYamlList(h),v.tags_yaml=this.toYamlList(_),v}extractYear(e){if(!e)return"";let n=e.match(/\b(\d{4})\b/);return n?n[1]:""}formatCreatorName(e){if(!e||typeof e!="object")return"";if(e.name)return String(e.name);let n=e.firstName?String(e.firstName):"",t=e.lastName?String(e.lastName):"";return[t,n].filter(Boolean).join(", ")||`${n} ${t}`.trim()}escapeYamlString(e){return`"${String(e).replace(/\\/g,"\\\\").replace(/"/g,'\\"')}"`}toYamlList(e){return e.length?e.map(n=>`  - ${this.escapeYamlString(n)}`).join(`
`):'  - ""'}getVaultBasePath(){var t;let e=this.app.vault.adapter;if(e instanceof d.FileSystemAdapter)return e.getBasePath();let n=(t=e.getBasePath)==null?void 0:t.call(e);if(n)return n;throw new Error("Vault base path is unavailable.")}getPluginDir(){var i;let e=this.getVaultBasePath(),n=(i=this.manifest.dir)!=null?i:this.manifest.id;if(!n)throw new Error("Plugin directory is unavailable.");let t=y.default.isAbsolute(n)?n:y.default.join(e,n);return y.default.normalize(t)}async ensureBundledTools(){var r;let e=this.getPluginDir(),n=y.default.join(e,"tools");await O.promises.mkdir(n,{recursive:!0});let t=s=>{var o;let a=s.match(/zotero-redisearch-rag tool version:\s*([0-9]+\.[0-9]+\.[0-9]+)/);return(o=a==null?void 0:a[1])!=null?o:null},i=(s,a)=>{let o=s.split(".").map(c=>parseInt(c,10)),l=a.split(".").map(c=>parseInt(c,10));for(let c=0;c<3;c++){let u=o[c]||0,h=l[c]||0;if(u!==h)return u-h}return 0};for(let[s,a]of Object.entries(te)){let o=y.default.join(n,s),l=!0;try{let c=await O.promises.readFile(o,"utf8"),u=t(c),h=(r=t(a))!=null?r:this.manifest.version;c===a?l=!1:u&&h?l=i(h,u)>0:l=!1}catch(c){l=!0}l&&await O.promises.writeFile(o,a,"utf8")}}async migrateCachePaths(){let e="zotero/items",n="zotero/chunks",t=N,i=z,r=this.app.vault.adapter,s=(0,d.normalizePath)(e),a=(0,d.normalizePath)(n),o=(0,d.normalizePath)(t),l=(0,d.normalizePath)(i),c=o.split("/").slice(0,-1).join("/"),u=l.split("/").slice(0,-1).join("/");c&&await this.ensureFolder(c),u&&await this.ensureFolder(u);let h=await r.exists(s),f=await r.exists(a),_=await r.exists(o),m=await r.exists(l);h&&!_&&await r.rename(s,o),f&&!m&&await r.rename(a,l)}getAbsoluteVaultPath(e){let n=this.getVaultBasePath(),t=y.default.isAbsolute(e)?e:y.default.join(n,e);return y.default.normalize(t)}buildDoclingArgs(e,n,t,i,r,s=!1){let a=this.settings.ocrMode==="force_low_quality"?"auto":this.settings.ocrMode,o=["--pdf",e,"--doc-id",n,"--out-json",this.getAbsoluteVaultPath(t),"--out-md",this.getAbsoluteVaultPath(i),"--chunking",this.settings.chunkingMode,"--ocr",a];s&&o.push("--progress"),this.settings.ocrMode==="force_low_quality"&&o.push("--force-ocr-low-quality"),o.push("--quality-threshold",String(this.settings.ocrQualityThreshold)),r&&o.push("--language-hint",r),this.settings.maxChunkChars>0&&o.push("--max-chunk-chars",String(this.settings.maxChunkChars)),this.settings.chunkOverlapChars>0&&o.push("--chunk-overlap-chars",String(this.settings.chunkOverlapChars)),this.settings.removeImagePlaceholders||o.push("--keep-image-tags"),this.settings.preferPerColumnOcr&&(o.push("--prefer-per-column-ocr"),this.settings.columnSplitMargin>0&&o.push("--column-split-margin",String(this.settings.columnSplitMargin)),this.settings.columnSplitAfterRasterize&&o.push("--column-split-after-rasterize"),o.push("--external-ocr-only")),this.settings.enableLlmCleanup&&(o.push("--enable-llm-cleanup"),this.settings.llmCleanupBaseUrl&&o.push("--llm-cleanup-base-url",this.settings.llmCleanupBaseUrl),this.settings.llmCleanupApiKey&&o.push("--llm-cleanup-api-key",this.settings.llmCleanupApiKey),this.settings.llmCleanupModel&&o.push("--llm-cleanup-model",this.settings.llmCleanupModel),o.push("--llm-cleanup-temperature",String(this.settings.llmCleanupTemperature)),o.push("--llm-cleanup-min-quality",String(this.settings.llmCleanupMinQuality)),o.push("--llm-cleanup-max-chars",String(this.settings.llmCleanupMaxChars)));let l=this.getPluginDir(),c=y.default.join(l,"tools","ocr_wordlist.txt");if((0,O.existsSync)(c)&&o.push("--enable-dictionary-correction","--dictionary-path",c),this.settings.enableFileLogging){let u=this.getLogFileAbsolutePath();u&&o.push("--log-file",u);let h=this.getAbsoluteVaultPath(this.getSpellcheckerInfoRelativePath());h&&o.push("--spellchecker-info-out",h)}return o}getRedisDataDir(){return y.default.join(this.getVaultBasePath(),A,"redis-data")}getDockerComposePath(){let e=this.getPluginDir();return y.default.join(e,"tools","docker-compose.yml")}getDockerProjectName(){let e=this.getVaultBasePath(),n=y.default.basename(e).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,18),t=(0,oe.createHash)("sha1").update(e).digest("hex").slice(0,8);return`zrr-${n||"vault"}-${t}`}getRedisPortFromUrl(){try{let e=new URL(this.settings.redisUrl),n=e.port?Number(e.port):6379;return Number.isFinite(n)&&n>0?n:6379}catch(e){return 6379}}async startRedisStack(e){var n;try{await this.ensureBundledTools();let t=this.getDockerComposePath(),i=this.getRedisDataDir();await O.promises.mkdir(i,{recursive:!0});let r=((n=this.settings.dockerPath)==null?void 0:n.trim())||"docker",s=this.getDockerProjectName(),a=String(this.getRedisPortFromUrl());try{await this.runCommand(r,["compose","-p",s,"-f",t,"down"],{cwd:y.default.dirname(t)})}catch(o){console.warn("Redis Stack stop before restart failed",o)}await this.runCommand(r,["compose","-p",s,"-f",t,"up","-d"],{cwd:y.default.dirname(t),env:{...process.env,ZRR_DATA_DIR:i,ZRR_PORT:a}}),e||new d.Notice("Redis Stack started.")}catch(t){e||new d.Notice("Failed to start Redis Stack. Check Docker Desktop and File Sharing."),console.error("Failed to start Redis Stack",t)}}runPython(e,n){return new Promise((t,i)=>{let r=(0,M.spawn)(this.settings.pythonPath,[e,...n],{cwd:y.default.dirname(e)}),s="";r.stderr.on("data",a=>{s+=a.toString()}),r.on("close",a=>{a===0?t():i(new Error(s||`Process exited with code ${a}`))})})}runCommand(e,n,t){return new Promise((i,r)=>{let s=(0,M.spawn)(e,n,{cwd:t==null?void 0:t.cwd,env:t==null?void 0:t.env}),a="";s.stderr.on("data",o=>{a+=o.toString()}),s.on("close",o=>{o===0?i():r(new Error(a||`Process exited with code ${o}`))})})}runPythonStreaming(e,n,t,i){return new Promise((r,s)=>{let a=(0,M.spawn)(this.settings.pythonPath,[e,...n],{cwd:y.default.dirname(e)}),o="",l="",c=null,u=!1,h=f=>{if(f.trim())try{let _=JSON.parse(f);c=_,((_==null?void 0:_.type)==="final"||_!=null&&_.answer)&&(u=!0),t(_)}catch(_){}};a.stdout.on("data",f=>{var m;o+=f.toString();let _=o.split(/\r?\n/);o=(m=_.pop())!=null?m:"";for(let x of _)h(x)}),a.stderr.on("data",f=>{l+=f.toString()}),a.on("close",f=>{o.trim()&&h(o),!u&&c&&i(c),f===0?r():s(new Error(l||`Process exited with code ${f}`))})})}getLogsDirRelative(){return(0,d.normalizePath)(`${A}/logs`)}getLogFileRelativePath(){let e=(this.settings.logFilePath||"").trim();return(0,d.normalizePath)(e||`${this.getLogsDirRelative()}/docling_extract.log`)}getLogFileAbsolutePath(){return this.getAbsoluteVaultPath(this.getLogFileRelativePath())}getSpellcheckerInfoRelativePath(){return(0,d.normalizePath)(`${this.getLogsDirRelative()}/spellchecker_info.json`)}async openLogFile(){let e=this.getLogFileRelativePath(),n=this.app.vault.adapter;if(!await n.exists(e)){new d.Notice("Log file not found.");return}try{let t=await n.read(e);new K(this.app,"Docling log",t||"(empty)").open()}catch(t){new d.Notice("Failed to open log file."),console.error(t)}}async clearLogFile(){let e=this.getLogFileRelativePath(),n=this.app.vault.adapter;try{let t=(0,d.normalizePath)(y.default.dirname(e));t&&await this.ensureFolder(t),await n.write(e,""),new d.Notice("Log file cleared.")}catch(t){new d.Notice("Failed to clear log file."),console.error(t)}}runPythonWithOutput(e,n){return new Promise((t,i)=>{let r=(0,M.spawn)(this.settings.pythonPath,[e,...n],{cwd:y.default.dirname(e)}),s="",a="";r.stdout.on("data",o=>{s+=o.toString()}),r.stderr.on("data",o=>{a+=o.toString()}),r.on("close",o=>{o===0?t(s.trim()):i(new Error(a||`Process exited with code ${o}`))})})}},X=class extends d.SuggestModal{constructor(e,n,t){super(e);this.lastError=null;this.indexedDocIds=null;this.plugin=n,this.resolveSelection=t,this.setPlaceholder("Search Zotero items...")}async getSuggestions(e){try{if(!this.indexedDocIds){let n=await this.plugin.getDocIndex();this.indexedDocIds=new Set(Object.keys(n))}return await this.plugin.searchZoteroItems(e)}catch(n){let t=n instanceof Error?n.message:String(n);return this.lastError!==t&&(this.lastError=t,new d.Notice(t)),console.error("Zotero search failed",n),[]}}renderSuggestion(e,n){var u,h,f;let t=(h=(u=e.data)==null?void 0:u.title)!=null?h:"[No title]",i=this.extractYear(e),r=this.getDocId(e),s=r?(f=this.indexedDocIds)==null?void 0:f.has(r):!1,a=this.getPdfStatus(e);s&&n.addClass("zrr-indexed-item"),a==="no"&&n.addClass("zrr-no-pdf-item"),n.createEl("div",{text:t});let o=n.createEl("small"),l=!1,c=()=>{l&&o.createSpan({text:" \u2022 "})};i&&(o.createSpan({text:i}),l=!0),s&&(c(),o.createSpan({text:"Indexed",cls:"zrr-indexed-flag"}),l=!0),a==="no"&&(c(),o.createSpan({text:"No attachment",cls:"zrr-no-pdf-flag"}),l=!0),n.addEventListener("click",()=>{this.resolveSelection&&(this.resolveSelection(e),this.resolveSelection=null),this.close()})}onChooseSuggestion(e,n){this.resolveSelection&&(this.resolveSelection(e),this.resolveSelection=null),this.close()}onClose(){this.resolveSelection&&(this.resolveSelection(null),this.resolveSelection=null)}getDocId(e){var t,i,r;let n=(r=(i=e.key)!=null?i:(t=e.data)==null?void 0:t.key)!=null?r:"";return typeof n=="string"?n:""}getPdfStatus(e){var i,r,s,a,o,l,c;let n=(l=(o=(s=(i=e.data)==null?void 0:i.attachments)!=null?s:(r=e.data)==null?void 0:r.children)!=null?o:(a=e.data)==null?void 0:a.items)!=null?l:[];if(Array.isArray(n)&&n.length>0)return n.some(h=>this.isPdfAttachment(h))?"yes":"no";let t=(c=e.meta)==null?void 0:c.numChildren;return typeof t=="number"&&t===0?"no":"unknown"}isPdfAttachment(e){var t,i,r,s,a,o;return((o=(a=(r=(t=e==null?void 0:e.contentType)!=null?t:e==null?void 0:e.mimeType)!=null?r:(i=e==null?void 0:e.data)==null?void 0:i.contentType)!=null?a:(s=e==null?void 0:e.data)==null?void 0:s.mimeType)!=null?o:"")==="application/pdf"}extractYear(e){var i,r,s,a;let n=(a=(s=(i=e.meta)==null?void 0:i.parsedDate)!=null?s:(r=e.data)==null?void 0:r.date)!=null?a:"";if(typeof n!="string")return"";let t=n.match(/\b(\d{4})\b/);return t?t[1]:""}};
