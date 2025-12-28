"use strict";var he=Object.create;var H=Object.defineProperty;var fe=Object.getOwnPropertyDescriptor;var me=Object.getOwnPropertyNames;var ye=Object.getPrototypeOf,be=Object.prototype.hasOwnProperty;var we=(C,p)=>{for(var e in p)H(C,e,{get:p[e],enumerable:!0})},oe=(C,p,e,n)=>{if(p&&typeof p=="object"||typeof p=="function")for(let t of me(p))!be.call(C,t)&&t!==e&&H(C,t,{get:()=>p[t],enumerable:!(n=fe(p,t))||n.enumerable});return C};var W=(C,p,e)=>(e=C!=null?he(ye(C)):{},oe(p||!C||!C.__esModule?H(e,"default",{value:C,enumerable:!0}):e,C)),xe=C=>oe(H({},"__esModule",{value:!0}),C);var Ee={};we(Ee,{default:()=>Y});module.exports=xe(Ee);var d=require("obsidian"),V=require("@codemirror/state"),M=require("@codemirror/view"),z=require("child_process"),D=require("fs"),ge=W(require("http")),_e=W(require("https")),te=W(require("net")),f=W(require("path")),Z=require("url"),J=require("crypto");var x=require("obsidian"),O=".zotero-redisearch-rag",$=`${O}/items`,F=`${O}/chunks`,le={zoteroBaseUrl:"http://127.0.0.1:23119/api",zoteroUserId:"0",webApiBaseUrl:"https://api.zotero.org",webApiLibraryType:"user",webApiLibraryId:"",webApiKey:"",pythonPath:"python3",dockerPath:"docker",autoStartRedis:!1,copyPdfToVault:!0,frontmatterTemplate:`doc_id: {{doc_id}}
zotero_key: {{zotero_key}}
title: {{title_yaml}}
year: {{year}}
authors:
{{authors_yaml}}
item_type: {{item_type}}
pdf_link: {{pdf_link}}
item_json: {{item_json}}`,outputPdfDir:"zotero/pdfs",outputNoteDir:"zotero/notes",chatOutputDir:"zotero/chats",chatPaneLocation:"right",redisUrl:"redis://127.0.0.1:6379",autoAssignRedisPort:!0,redisIndex:"idx:zotero",redisPrefix:"zotero:chunk:",embedBaseUrl:"http://localhost:1234/v1",embedApiKey:"lm-studio",embedModel:"google/embedding-gemma-300m",chatBaseUrl:"http://127.0.0.1:1234/v1",chatApiKey:"",chatModel:"openai/gpt-oss-20b",chatTemperature:.2,chatHistoryMessages:6,ocrMode:"auto",chunkingMode:"page",maxChunkChars:4e3,chunkOverlapChars:250,removeImagePlaceholders:!0,ocrQualityThreshold:.5,enableLlmCleanup:!1,llmCleanupBaseUrl:"http://127.0.0.1:1234/v1",llmCleanupApiKey:"",llmCleanupModel:"openai/gpt-oss-20b",llmCleanupTemperature:0,llmCleanupMinQuality:.35,llmCleanupMaxChars:2e3,enableFileLogging:!1,logFilePath:`${O}/logs/docling_extract.log`,createOcrLayeredPdf:!1,preferVaultPdfForCitations:!1},K=class extends x.PluginSettingTab{constructor(p,e){super(p,e),this.plugin=e}display(){let{containerEl:p}=this;p.empty(),p.createEl("h2",{text:"Zotero RAG Settings"}),new x.Setting(p).setName("Zotero base URL").setDesc("Local Zotero API base URL, e.g. http://127.0.0.1:23119/api").addText(e=>e.setPlaceholder("http://127.0.0.1:23119/api").setValue(this.plugin.settings.zoteroBaseUrl).onChange(async n=>{this.plugin.settings.zoteroBaseUrl=n.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Zotero user ID").setDesc("Use 0 for local library. You can also enter users/<id> or groups/<id>.").addText(e=>e.setPlaceholder("123456").setValue(this.plugin.settings.zoteroUserId).onChange(async n=>{this.plugin.settings.zoteroUserId=n.trim(),await this.plugin.saveSettings()})),p.createEl("h3",{text:"Zotero Web API (optional fallback)"}),new x.Setting(p).setName("Web API base URL").setDesc("Zotero Web API base URL for write fallback, e.g. https://api.zotero.org").addText(e=>e.setPlaceholder("https://api.zotero.org").setValue(this.plugin.settings.webApiBaseUrl).onChange(async n=>{this.plugin.settings.webApiBaseUrl=n.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Web API library type").setDesc("Library type for Web API writes.").addDropdown(e=>e.addOption("user","user").addOption("group","group").setValue(this.plugin.settings.webApiLibraryType).onChange(async n=>{this.plugin.settings.webApiLibraryType=n,await this.plugin.saveSettings()})),new x.Setting(p).setName("Web API library ID").setDesc("Numeric Zotero user/group ID for Web API writes.").addText(e=>e.setPlaceholder("15218").setValue(this.plugin.settings.webApiLibraryId).onChange(async n=>{this.plugin.settings.webApiLibraryId=n.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Web API key").setDesc("Zotero API key for write fallback (from zotero.org).").addText(e=>e.setPlaceholder("your-api-key").setValue(this.plugin.settings.webApiKey).onChange(async n=>{this.plugin.settings.webApiKey=n.trim(),await this.plugin.saveSettings()})),p.createEl("h3",{text:"Prerequisites"}),new x.Setting(p).setName("Python path").setDesc("Optional path to the Python interpreter used to create or run the plugin env.").addText(e=>e.setPlaceholder("python3").setValue(this.plugin.settings.pythonPath).onChange(async n=>{this.plugin.settings.pythonPath=n.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Python environment").setDesc("Create or update the plugin's Python env (.venv in the plugin folder).").addButton(e=>{e.setButtonText("Create/Update").setCta(),e.onClick(async()=>{e.setDisabled(!0);try{await this.plugin.setupPythonEnv()}finally{e.setDisabled(!1)}})}),new x.Setting(p).setName("Docker/Podman path").setDesc("CLI path for Docker or Podman (used to start Redis Stack).").addText(e=>e.setPlaceholder("docker").setValue(this.plugin.settings.dockerPath).onChange(async n=>{this.plugin.settings.dockerPath=n.trim()||"docker",await this.plugin.saveSettings()})),new x.Setting(p).setName("Redis URL").addText(e=>e.setPlaceholder("redis://127.0.0.1:6379").setValue(this.plugin.settings.redisUrl).onChange(async n=>{this.plugin.settings.redisUrl=n.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Auto-assign Redis port").setDesc("When starting Redis Stack, pick a free local port and update the Redis URL.").addToggle(e=>e.setValue(this.plugin.settings.autoAssignRedisPort).onChange(async n=>{this.plugin.settings.autoAssignRedisPort=n,await this.plugin.saveSettings()})),new x.Setting(p).setName("Auto-start Redis Stack (Docker/Podman Compose)").setDesc("Requires Docker Desktop running and your vault path shared with Docker.").addToggle(e=>e.setValue(this.plugin.settings.autoStartRedis).onChange(async n=>{this.plugin.settings.autoStartRedis=n,await this.plugin.saveSettings()})),new x.Setting(p).setName("Start Redis Stack now").setDesc("Restarts Docker/Podman Compose with the vault data directory.").addButton(e=>e.setButtonText("Start").onClick(async()=>{await this.plugin.startRedisStack()})),new x.Setting(p).setName("Copy PDFs into vault").setDesc("Disable to use Zotero storage paths directly. If a local file path is unavailable, the plugin temporarily copies the PDF into the vault for processing.").addToggle(e=>e.setValue(this.plugin.settings.copyPdfToVault).onChange(async n=>{this.plugin.settings.copyPdfToVault=n,!n&&this.plugin.settings.createOcrLayeredPdf&&(this.plugin.settings.createOcrLayeredPdf=!1),await this.plugin.saveSettings(),this.display()})),new x.Setting(p).setName("Create OCR-layered PDF copy").setDesc("When OCR is used, replace the vault PDF with a Tesseract text layer (requires Copy PDFs into vault).").addToggle(e=>{let n=this.plugin.settings.copyPdfToVault;e.setValue(n?this.plugin.settings.createOcrLayeredPdf:!1).setDisabled(!n).onChange(async t=>{if(!this.plugin.settings.copyPdfToVault){this.plugin.settings.createOcrLayeredPdf=!1,await this.plugin.saveSettings();return}this.plugin.settings.createOcrLayeredPdf=t,await this.plugin.saveSettings()})}),new x.Setting(p).setName("Frontmatter template").setDesc("Use {{doc_id}}, {{zotero_key}}, {{title}}, {{title_yaml}}, {{year}}, {{date}}, {{authors}}, {{authors_yaml}}, {{tags}}, {{item_type}}, {{pdf_link}}, {{item_json}}").addTextArea(e=>{e.inputEl.rows=8,e.setValue(this.plugin.settings.frontmatterTemplate).onChange(async n=>{this.plugin.settings.frontmatterTemplate=n,await this.plugin.saveSettings()})}),p.createEl("h3",{text:"Output folders (vault-relative)"}),new x.Setting(p).setName("PDF folder").addText(e=>e.setPlaceholder("zotero/pdfs").setValue(this.plugin.settings.outputPdfDir).onChange(async n=>{this.plugin.settings.outputPdfDir=n.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Notes folder").addText(e=>e.setPlaceholder("zotero/notes").setValue(this.plugin.settings.outputNoteDir).onChange(async n=>{this.plugin.settings.outputNoteDir=n.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Saved chats folder").setDesc("Where exported chat notes are stored (vault-relative).").addText(e=>e.setPlaceholder("zotero/chats").setValue(this.plugin.settings.chatOutputDir).onChange(async n=>{this.plugin.settings.chatOutputDir=n.trim()||"zotero/chats",await this.plugin.saveSettings()})),new x.Setting(p).setName("Prefer vault PDF for citations").setDesc("Use vault PDFs for citation links when available instead of Zotero deep links.").addToggle(e=>e.setValue(this.plugin.settings.preferVaultPdfForCitations).onChange(async n=>{this.plugin.settings.preferVaultPdfForCitations=n,await this.plugin.saveSettings()})),p.createEl("h3",{text:"Embeddings (LM Studio)"}),new x.Setting(p).setName("Embeddings base URL").addText(e=>e.setPlaceholder("http://localhost:1234/v1").setValue(this.plugin.settings.embedBaseUrl).onChange(async n=>{this.plugin.settings.embedBaseUrl=n.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Embeddings API key").addText(e=>e.setPlaceholder("lm-studio").setValue(this.plugin.settings.embedApiKey).onChange(async n=>{this.plugin.settings.embedApiKey=n.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Embeddings model").addText(e=>e.setPlaceholder("google/embedding-gemma-300m").setValue(this.plugin.settings.embedModel).onChange(async n=>{this.plugin.settings.embedModel=n.trim(),await this.plugin.saveSettings()})),p.createEl("h3",{text:"Chat LLM"}),new x.Setting(p).setName("Chat base URL").setDesc("OpenAI-compatible chat endpoint base URL").addText(e=>e.setPlaceholder("http://localhost:1234/v1").setValue(this.plugin.settings.chatBaseUrl).onChange(async n=>{this.plugin.settings.chatBaseUrl=n.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Chat API key").addText(e=>e.setPlaceholder("lm-studio").setValue(this.plugin.settings.chatApiKey).onChange(async n=>{this.plugin.settings.chatApiKey=n.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Chat model").addText(e=>e.setPlaceholder("meta-llama/llama-3.1-405b-instruct").setValue(this.plugin.settings.chatModel).onChange(async n=>{this.plugin.settings.chatModel=n.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("Temperature").addText(e=>e.setPlaceholder("0.2").setValue(String(this.plugin.settings.chatTemperature)).onChange(async n=>{let t=Number.parseFloat(n);this.plugin.settings.chatTemperature=Number.isFinite(t)?t:.2,await this.plugin.saveSettings()})),new x.Setting(p).setName("Chat history messages").setDesc("Number of recent messages to include for conversational continuity (0 disables).").addText(e=>e.setPlaceholder("6").setValue(String(this.plugin.settings.chatHistoryMessages)).onChange(async n=>{let t=Number.parseInt(n,10);this.plugin.settings.chatHistoryMessages=Number.isFinite(t)?Math.max(0,t):6,await this.plugin.saveSettings()})),new x.Setting(p).setName("Chat panel location").setDesc("Where to open the chat view by default.").addDropdown(e=>e.addOption("right","Right sidebar").addOption("main","Main window").setValue(this.plugin.settings.chatPaneLocation).onChange(async n=>{this.plugin.settings.chatPaneLocation=n,await this.plugin.saveSettings()})),p.createEl("h3",{text:"Docling"}),new x.Setting(p).setName("OCR mode").setDesc("auto: skip OCR when text is readable; force if bad: OCR only when text looks poor; force: always OCR.").addDropdown(e=>e.addOption("auto","auto").addOption("force_low_quality","force if quality is bad").addOption("force","force").setValue(this.plugin.settings.ocrMode).onChange(async n=>{this.plugin.settings.ocrMode=n,await this.plugin.saveSettings()})),new x.Setting(p).setName("Text quality threshold").setDesc("Lower values are stricter; below this threshold the text is treated as low quality.").addSlider(e=>{e.setLimits(0,1,.05).setValue(this.plugin.settings.ocrQualityThreshold).setDynamicTooltip().onChange(async n=>{this.plugin.settings.ocrQualityThreshold=n,await this.plugin.saveSettings()})}),new x.Setting(p).setName("Chunking").setDesc("page or section").addDropdown(e=>e.addOption("page","page").addOption("section","section").setValue(this.plugin.settings.chunkingMode).onChange(async n=>{this.plugin.settings.chunkingMode=n,await this.plugin.saveSettings()})),new x.Setting(p).setName("Section chunk max chars").setDesc("Split large section chunks into smaller pieces (section mode only).").addText(e=>e.setPlaceholder("3000").setValue(String(this.plugin.settings.maxChunkChars)).onChange(async n=>{let t=Number.parseInt(n,10);this.plugin.settings.maxChunkChars=Number.isFinite(t)?t:3e3,await this.plugin.saveSettings()})),new x.Setting(p).setName("Section chunk overlap chars").setDesc("Number of characters to overlap when splitting section chunks.").addText(e=>e.setPlaceholder("250").setValue(String(this.plugin.settings.chunkOverlapChars)).onChange(async n=>{let t=Number.parseInt(n,10);this.plugin.settings.chunkOverlapChars=Number.isFinite(t)?t:250,await this.plugin.saveSettings()})),new x.Setting(p).setName("Remove image placeholders").setDesc("Strip '<!-- image -->' tags before chunking.").addToggle(e=>e.setValue(this.plugin.settings.removeImagePlaceholders).onChange(async n=>{this.plugin.settings.removeImagePlaceholders=n,await this.plugin.saveSettings()})),p.createEl("h4",{text:"OCR cleanup (optional)"}),new x.Setting(p).setName("LLM cleanup for low-quality chunks").setDesc("Optional OpenAI-compatible cleanup for poor OCR. Can be slow/costly.").addToggle(e=>e.setValue(this.plugin.settings.enableLlmCleanup).onChange(async n=>{this.plugin.settings.enableLlmCleanup=n,await this.plugin.saveSettings()})),new x.Setting(p).setName("LLM cleanup base URL").setDesc("OpenAI-compatible endpoint, e.g. http://127.0.0.1:1234/v1").addText(e=>e.setPlaceholder("http://127.0.0.1:1234/v1").setValue(this.plugin.settings.llmCleanupBaseUrl).onChange(async n=>{this.plugin.settings.llmCleanupBaseUrl=n.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("LLM cleanup API key").setDesc("Optional API key for the cleanup endpoint.").addText(e=>e.setPlaceholder("sk-...").setValue(this.plugin.settings.llmCleanupApiKey).onChange(async n=>{this.plugin.settings.llmCleanupApiKey=n.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("LLM cleanup model").setDesc("Model to use for cleanup.").addText(e=>e.setPlaceholder("openai/gpt-oss-20b").setValue(this.plugin.settings.llmCleanupModel).onChange(async n=>{this.plugin.settings.llmCleanupModel=n.trim(),await this.plugin.saveSettings()})),new x.Setting(p).setName("LLM cleanup temperature").setDesc("Lower is more conservative.").addText(e=>e.setPlaceholder("0.0").setValue(String(this.plugin.settings.llmCleanupTemperature)).onChange(async n=>{let t=Number.parseFloat(n);this.plugin.settings.llmCleanupTemperature=Number.isFinite(t)?t:0,await this.plugin.saveSettings()})),new x.Setting(p).setName("LLM cleanup min quality").setDesc("Only run cleanup when chunk quality is below this threshold (0-1).").addSlider(e=>e.setLimits(0,1,.05).setValue(this.plugin.settings.llmCleanupMinQuality).setDynamicTooltip().onChange(async n=>{this.plugin.settings.llmCleanupMinQuality=n,await this.plugin.saveSettings()})),new x.Setting(p).setName("LLM cleanup max chars").setDesc("Skip cleanup for chunks longer than this limit.").addText(e=>e.setPlaceholder("2000").setValue(String(this.plugin.settings.llmCleanupMaxChars)).onChange(async n=>{let t=Number.parseInt(n,10);this.plugin.settings.llmCleanupMaxChars=Number.isFinite(t)?t:2e3,await this.plugin.saveSettings()})),p.createEl("h3",{text:"Logging"}),new x.Setting(p).setName("Enable logging to file").setDesc("Write Docling/Python logs to a file during extraction.").addToggle(e=>e.setValue(this.plugin.settings.enableFileLogging).onChange(async n=>{this.plugin.settings.enableFileLogging=n,await this.plugin.saveSettings()})),new x.Setting(p).setName("Log file path (vault-relative)").setDesc("Where to write logs. Keep inside the vault.").addText(e=>e.setPlaceholder(`${O}/logs/docling_extract.log`).setValue(this.plugin.settings.logFilePath).onChange(async n=>{this.plugin.settings.logFilePath=n.trim()||`${O}/logs/docling_extract.log`,await this.plugin.saveSettings()})),new x.Setting(p).setName("View or clear log").setDesc("Open the log contents or clear the file.").addButton(e=>e.setButtonText("Open log").onClick(async()=>{var n,t;await((t=(n=this.plugin).openLogFile)==null?void 0:t.call(n))})).addButton(e=>e.setButtonText("Clear log").onClick(async()=>{var n,t;await((t=(n=this.plugin).clearLogFile)==null?void 0:t.call(n))})),p.createEl("h3",{text:"Maintenance"}),new x.Setting(p).setName("Reindex Redis from cached chunks").setDesc("Rebuild the Redis index from cached chunk JSON files.").addButton(e=>e.setButtonText("Reindex").onClick(async()=>{await this.plugin.reindexRedisFromCache()})),new x.Setting(p).setName("Recreate missing notes from cache").setDesc("Rebuild missing notes using cached Zotero items and chunks.").addButton(e=>e.setButtonText("Recreate").onClick(async()=>{await this.plugin.recreateMissingNotesFromCache()}))}};var X={"zrr-picker":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
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
`};var ce={"docling_extract.py":`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.2.5
import argparse
import json
import math
import logging
import os
import re
import shutil
import sys
from dataclasses import dataclass
from typing import Any, Callable, Dict, Iterable, List, Optional, Sequence, Set, Tuple
import langcodes
import warnings

# Reduce noisy warnings and route them to logging
logging.captureWarnings(True)
try:
    from PIL import Image as _PILImage  # type: ignore
    # Disable DecompressionBomb warnings (we control DPI); still safe for local PDFs
    _PILImage.MAX_IMAGE_PIXELS = None  # type: ignore[attr-defined]
    if hasattr(_PILImage, "DecompressionBombWarning"):
        warnings.filterwarnings("ignore", category=_PILImage.DecompressionBombWarning)  # type: ignore[attr-defined]
except Exception:
    pass
warnings.filterwarnings("ignore", category=DeprecationWarning)


LOGGER = logging.getLogger("docling_extract")

# Stores details about the last spellchecker built (backend and dictionary files)
# Example: {"backend": "spylls", "aff": "/path/en_GB.aff", "dic": "/path/en_GB.dic"}
LAST_SPELLCHECKER_INFO: Dict[str, Any] = {}
SPELLCHECKER_CACHE: Dict[str, Any] = {}


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
    quality_image_heavy_text_chars: int = 200
    quality_image_heavy_min_images: int = 2
    quality_image_heavy_ratio_threshold: float = 0.6
    quality_image_heavy_penalty: float = 0.3
    quality_image_page_ratio_threshold: float = 0.7
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
    enable_boilerplate_removal: bool = True
    boilerplate_min_line_len: int = 8
    boilerplate_repeat_ratio: float = 0.4
    boilerplate_min_pages: int = 3
    boilerplate_edge_lines: int = 3
    boilerplate_ngram_size: int = 3
    boilerplate_near_dup_threshold: float = 0.82
    postprocess_markdown: bool = True
    analysis_max_pages: int = 5
    analysis_sample_strategy: str = "middle"
    ocr_dpi: int = 300
    ocr_overlay_dpi: int = 400
    paddle_max_dpi: int = 300
    paddle_target_max_side_px: int = 3500
    paddle_use_doc_orientation_classify: bool = True
    paddle_use_doc_unwarping: bool = True
    paddle_use_textline_orientation: bool = True
    paddle_use_structure_v3: bool = True
    paddle_structure_version: str = "PP-StructureV3"
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
    spellchecker_hit_ratio: Optional[float] = None
    image_heavy_ratio: Optional[float] = None
    image_page_ratio: Optional[float] = None

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


@dataclass
class BoilerplateCluster:
    rep: str
    shingles: Set[str]
    count: int = 0


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

_BOILERPLATE_PATTERNS = [
    re.compile(r"(?i)^this content downloaded from"),
    re.compile(r"(?i)content downloaded from"),
    re.compile(r"(?i)^all use subject to"),
    re.compile(r"(?i)about\\s*\\.?jstor\\.org/terms"),
    re.compile(r"(?i)^jstor is a not-for-profit"),
    re.compile(r"(?i)^your use of the jstor archive"),
    re.compile(r"(?i)^for more information about jstor"),
    re.compile(r"(?i)^state historical society"),
    re.compile(r"(?i)\\b\\d{1,3}(?:\\.\\d{1,3}){3}\\b.*\\butc\\b"),
]
_PAGE_NUMBER_RE = re.compile(r"^[ivxlcdm]+$|^\\d{1,4}$", re.IGNORECASE)
_IP_RE = re.compile(r"\\b\\d{1,3}(?:\\.\\d{1,3}){3}\\b")
_TIME_RE = re.compile(r"\\b\\d{1,2}:\\d{2}(?::\\d{2})?\\b")
_DATE_ISO_RE = re.compile(r"\\b\\d{4}-\\d{2}-\\d{2}\\b")
_DATE_SLASH_RE = re.compile(r"\\b\\d{1,2}/\\d{1,2}/\\d{2,4}\\b")
_MONTH_RE = (
    r"(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|"
    r"jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)"
)
_DATE_TEXT_RE = re.compile(rf"\\b\\d{{1,2}}\\s+{_MONTH_RE}\\s+\\d{{2,4}}\\b", re.IGNORECASE)
_DATE_TEXT_REVERSE = re.compile(rf"\\b{_MONTH_RE}\\s+\\d{{1,2}},?\\s+\\d{{4}}\\b", re.IGNORECASE)
_LONG_NUM_RE = re.compile(r"\\b\\d{4,}\\b")


def mask_boilerplate_tokens(text: str) -> str:
    cleaned = text
    cleaned = _IP_RE.sub("<ip>", cleaned)
    cleaned = _TIME_RE.sub("<time>", cleaned)
    cleaned = _DATE_ISO_RE.sub("<date>", cleaned)
    cleaned = _DATE_SLASH_RE.sub("<date>", cleaned)
    cleaned = _DATE_TEXT_RE.sub("<date>", cleaned)
    cleaned = _DATE_TEXT_REVERSE.sub("<date>", cleaned)
    cleaned = _LONG_NUM_RE.sub("<num>", cleaned)
    cleaned = re.sub(r"\\d", "0", cleaned)
    return cleaned


def normalize_boilerplate_line(line: str) -> str:
    cleaned = line.replace("\\u00a0", " ")
    cleaned = cleaned.lower()
    cleaned = mask_boilerplate_tokens(cleaned)
    cleaned = re.sub(r"\\s+", " ", cleaned).strip()
    return cleaned


def is_boilerplate_line(line: str) -> bool:
    if not line:
        return False
    if _PAGE_NUMBER_RE.match(line):
        return True
    for pattern in _BOILERPLATE_PATTERNS:
        if pattern.search(line):
            return True
    return False


def line_shingles(text: str, size: int) -> Set[str]:
    cleaned = re.sub(r"\\s+", "", text)
    if size <= 1:
        return {cleaned} if cleaned else set()
    if len(cleaned) <= size:
        return {cleaned} if cleaned else set()
    return {cleaned[i:i + size] for i in range(len(cleaned) - size + 1)}


def jaccard_similarity(a: Set[str], b: Set[str]) -> float:
    if not a or not b:
        return 0.0
    union = a | b
    if not union:
        return 0.0
    return len(a & b) / len(union)


def match_boilerplate_cluster(
    shingles: Set[str],
    clusters: Sequence[BoilerplateCluster],
    threshold: float,
) -> Optional[int]:
    best_idx: Optional[int] = None
    best_score = 0.0
    for idx, cluster in enumerate(clusters):
        score = jaccard_similarity(shingles, cluster.shingles)
        if score >= threshold and score > best_score:
            best_idx = idx
            best_score = score
    return best_idx


def get_edge_lines(lines: Sequence[str], edge_lines: int) -> List[str]:
    if edge_lines <= 0:
        return list(lines)
    total = len(lines)
    if total <= edge_lines * 2:
        return list(lines)
    return list(lines[:edge_lines]) + list(lines[-edge_lines:])


def is_edge_line_index(idx: int, total: int, edge_lines: int) -> bool:
    if edge_lines <= 0:
        return True
    return idx < edge_lines or idx >= max(0, total - edge_lines)


def select_edge_texts_by_y(
    lines: Sequence[Tuple[str, float]],
    edge_lines: int,
) -> List[str]:
    if edge_lines <= 0:
        return [text for text, _ in lines]
    sorted_lines = sorted(lines, key=lambda item: item[1])
    total = len(sorted_lines)
    if total <= edge_lines * 2:
        return [text for text, _ in sorted_lines]
    top = sorted_lines[:edge_lines]
    bottom = sorted_lines[-edge_lines:]
    return [text for text, _ in top + bottom]


def edge_ids_by_y(
    items: Sequence[Tuple[int, float]],
    edge_lines: int,
) -> Set[int]:
    if edge_lines <= 0:
        return {idx for idx, _ in items}
    sorted_items = sorted(items, key=lambda item: item[1])
    total = len(sorted_items)
    if total <= edge_lines * 2:
        return {idx for idx, _ in sorted_items}
    top = sorted_items[:edge_lines]
    bottom = sorted_items[-edge_lines:]
    return {idx for idx, _ in top + bottom}


def detect_repeated_line_clusters(
    page_lines: Sequence[Sequence[str]],
    total_pages: int,
    config: DoclingProcessingConfig,
) -> Tuple[List[BoilerplateCluster], int]:
    if total_pages < config.boilerplate_min_pages:
        return [], 0
    threshold = max(2, int(math.ceil(total_pages * config.boilerplate_repeat_ratio)))
    clusters: List[BoilerplateCluster] = []
    for lines in page_lines:
        seen: Set[int] = set()
        for line in lines:
            normalized = normalize_boilerplate_line(line)
            if not normalized or len(normalized) < config.boilerplate_min_line_len:
                continue
            shingles = line_shingles(normalized, config.boilerplate_ngram_size)
            idx = match_boilerplate_cluster(
                shingles,
                clusters,
                config.boilerplate_near_dup_threshold,
            )
            if idx is None:
                clusters.append(BoilerplateCluster(rep=normalized, shingles=shingles, count=0))
                idx = len(clusters) - 1
            if idx not in seen:
                clusters[idx].count += 1
                seen.add(idx)
    repeated = [cluster for cluster in clusters if cluster.count >= threshold]
    return repeated, threshold


def matches_repeated_cluster(
    line: str,
    clusters: Sequence[BoilerplateCluster],
    config: DoclingProcessingConfig,
) -> bool:
    if not clusters:
        return False
    normalized = normalize_boilerplate_line(line)
    if not normalized:
        return False
    shingles = line_shingles(normalized, config.boilerplate_ngram_size)
    return match_boilerplate_cluster(
        shingles,
        clusters,
        config.boilerplate_near_dup_threshold,
    ) is not None


def detect_repeated_lines(
    pages: Sequence[Dict[str, Any]],
    config: DoclingProcessingConfig,
) -> Tuple[List[BoilerplateCluster], int]:
    total_pages = len(pages)
    if total_pages < config.boilerplate_min_pages:
        return [], 0
    page_lines: List[List[str]] = []
    for page in pages:
        lines = str(page.get("text", "")).splitlines()
        page_lines.append(get_edge_lines(lines, config.boilerplate_edge_lines))
    clusters, threshold = detect_repeated_line_clusters(page_lines, total_pages, config)
    return clusters, threshold


def remove_boilerplate_from_pages(
    pages: List[Dict[str, Any]],
    config: DoclingProcessingConfig,
) -> Tuple[List[Dict[str, Any]], List[BoilerplateCluster], Dict[str, Any]]:
    if not config.enable_boilerplate_removal or not pages:
        return pages, [], {}
    repeated_clusters, threshold = detect_repeated_lines(pages, config)
    removed_total = 0
    updated_pages: List[Dict[str, Any]] = []
    for page in pages:
        text = str(page.get("text", ""))
        if not text:
            updated_pages.append(page)
            continue
        lines = text.splitlines()
        kept_lines: List[str] = []
        removed_page = 0
        for idx, line in enumerate(lines):
            normalized = normalize_boilerplate_line(line)
            if not normalized:
                kept_lines.append("")
                continue
            is_edge = is_edge_line_index(idx, len(lines), config.boilerplate_edge_lines)
            if is_edge and (
                matches_repeated_cluster(line, repeated_clusters, config)
                or is_boilerplate_line(normalized)
            ):
                removed_page += 1
                continue
            kept_lines.append(line)
        removed_total += removed_page
        new_page = dict(page)
        new_page["text"] = "\\n".join(kept_lines).strip()
        updated_pages.append(new_page)
    if removed_total:
        LOGGER.info(
            "Boilerplate removal: removed %s lines (repeat_threshold=%s, repeated_lines=%s)",
            removed_total,
            threshold,
            len(repeated_clusters),
        )
    return updated_pages, repeated_clusters, {
        "removed_lines": removed_total,
        "repeat_threshold": threshold,
        "repeated_lines": len(repeated_clusters),
    }


def remove_boilerplate_from_markdown(
    markdown: str,
    repeated_clusters: Sequence[BoilerplateCluster],
    config: DoclingProcessingConfig,
) -> str:
    if not config.enable_boilerplate_removal or not markdown:
        return markdown
    kept: List[str] = []
    removed = 0
    for line in markdown.splitlines():
        normalized = normalize_boilerplate_line(line)
        if not normalized:
            kept.append(line)
            continue
        if matches_repeated_cluster(line, repeated_clusters, config) or is_boilerplate_line(normalized):
            removed += 1
            continue
        kept.append(line)
    if removed:
        LOGGER.info("Boilerplate removal: stripped %s markdown lines", removed)
    return "\\n".join(kept).strip()

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


def compute_spellchecker_hit_ratio(
    tokens: Sequence[str],
    languages: str,
    config: Optional[DoclingProcessingConfig],
) -> Optional[float]:
    if not config or not config.enable_hunspell or not languages:
        return None
    hs = build_spellchecker_for_languages(config, languages)
    if hs is None:
        return None
    hits = 0
    total = 0
    for token in tokens:
        if len(token) < 2:
            continue
        if not any(char.isalpha() for char in token):
            continue
        total += 1
        try:
            if hs.spell(token):
                hits += 1
        except Exception:
            continue
    if not total:
        return None
    return hits / total


def compute_image_heavy_ratio(
    pages: Sequence[Dict[str, Any]],
    config: DoclingProcessingConfig,
) -> Optional[float]:
    if not pages:
        return None
    heavy = 0
    total = 0
    for page in pages:
        total += 1
        text = str(page.get("text", ""))
        image_count = int(page.get("image_count") or 0)
        if len(text) < config.quality_image_heavy_text_chars and image_count >= config.quality_image_heavy_min_images:
            heavy += 1
    if not total:
        return None
    return heavy / total


def compute_image_page_ratio(pages: Sequence[Dict[str, Any]]) -> Optional[float]:
    if not pages:
        return None
    total = 0
    with_images = 0
    for page in pages:
        total += 1
        image_count = int(page.get("image_count") or 0)
        if image_count > 0:
            with_images += 1
    if not total:
        return None
    return with_images / total


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
    spellchecker_hit_ratio = None
    image_heavy_ratio = None
    image_page_ratio = None
    if config and config.quality_use_wordfreq and languages:
        dictionary_hit_ratio = compute_dictionary_hit_ratio(
            tokens,
            languages,
            config.quality_wordfreq_min_zipf,
        )
    if config and languages:
        spellchecker_hit_ratio = compute_spellchecker_hit_ratio(tokens, languages, config)
        image_heavy_ratio = compute_image_heavy_ratio(pages, config)
    if config:
        image_page_ratio = compute_image_page_ratio(pages)
    lexicon_ratio = None
    if dictionary_hit_ratio is not None and spellchecker_hit_ratio is not None:
        lexicon_ratio = max(dictionary_hit_ratio, spellchecker_hit_ratio)
    elif dictionary_hit_ratio is not None:
        lexicon_ratio = dictionary_hit_ratio
    elif spellchecker_hit_ratio is not None:
        lexicon_ratio = spellchecker_hit_ratio
    confidence = alpha_ratio * (1.0 - suspicious_ratio)
    if lexicon_ratio is not None:
        confidence *= 0.4 + (0.6 * lexicon_ratio)
    if (
        image_heavy_ratio is not None
        and config
        and image_heavy_ratio >= config.quality_image_heavy_ratio_threshold
    ):
        penalty = 1.0 - (config.quality_image_heavy_penalty * image_heavy_ratio)
        confidence *= max(0.0, penalty)
    confidence = max(0.0, min(1.0, confidence))
    return TextQuality(
        avg_chars,
        alpha_ratio,
        suspicious_ratio,
        confidence,
        dictionary_hit_ratio,
        spellchecker_hit_ratio,
        image_heavy_ratio,
        image_page_ratio,
    )


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


def get_pdf_max_page_points(pdf_path: str, max_pages: int = 3) -> Optional[float]:
    try:
        from pypdf import PdfReader
    except Exception:
        return None
    try:
        reader = PdfReader(pdf_path)
        max_side = 0.0
        total_pages = len(reader.pages)
        sample_count = min(max_pages, total_pages)
        for idx in range(sample_count):
            page = reader.pages[idx]
            width = float(page.mediabox.width)
            height = float(page.mediabox.height)
            max_side = max(max_side, width, height)
        return max_side or None
    except Exception:
        return None


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
        import paddle  # noqa: F401
        from pdf2image import convert_from_path  # noqa: F401
        available.append("paddle")
    except Exception:
        pass
    try:
        import pytesseract  # noqa: F401
        from pdf2image import convert_from_path  # noqa: F401
        if find_tesseract_path():
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
    cache_key = f"{languages}|{config.hunspell_aff_path or ''}|{config.hunspell_dic_path or ''}"
    if cache_key in SPELLCHECKER_CACHE:
        return SPELLCHECKER_CACHE[cache_key]

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
                SPELLCHECKER_CACHE[cache_key] = hs
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
                wrapper = SpyllsWrapper(d)
                SPELLCHECKER_CACHE[cache_key] = wrapper
                return wrapper
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
                SPELLCHECKER_CACHE[cache_key] = wrapper
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
            if hs is not None and (hs.spell(w) or hs.spell(w.lower())):
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
        base_score, base_dict = score_word(tok)
        if base_dict or base_score >= 3.0:
            return tok
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
    allow_missing_space: bool = True,
    progress_cb: Optional[ProgressCallback] = None,
    progress_label: Optional[str] = None,
) -> str:
    if not text:
        return text
    cleaned = dehyphenate_text(text)
    cleaned = replace_ligatures(cleaned)
    cleaned = normalize_whitespace(cleaned)
    hs = build_spellchecker_for_languages(config, languages) if config.enable_hunspell else None
    try:
        from wordfreq import zipf_frequency as _zipf
    except Exception:
        _zipf = None
    lang_codes = select_wordfreq_languages(languages)

    dictionary = {word.lower() for word in (wordlist or [])}

    def is_valid_word(word: str) -> bool:
        lower = word.lower()
        if lower in dictionary:
            return True
        if hs is not None and (hs.spell(word) or hs.spell(lower)):
            return True
        if _zipf is not None:
            try:
                return max(_zipf(lower, lc) for lc in lang_codes) >= 3.0
            except Exception:
                return False
        return False

    def match_case(candidate: str, original: str) -> str:
        if original.isupper():
            return candidate.upper()
        if original[:1].isupper():
            return candidate.capitalize()
        return candidate

    def merge_broken_words(input_text: str) -> str:
        token_re = re.compile(r"\\b([A-Za-z\xC4\xD6\xDC\xE4\xF6\xFC\xDF]{2,})\\s+([A-Za-z\xC4\xD6\xDC\xE4\xF6\xFC\xDF]{2,})\\b")

        def repl(match: re.Match) -> str:
            w1 = match.group(1)
            w2 = match.group(2)
            combined = w1 + w2
            if len(combined) < 5:
                return match.group(0)
            if not is_valid_word(combined):
                return match.group(0)
            w1_ok = is_valid_word(w1)
            w2_ok = is_valid_word(w2)
            if w1_ok and w2_ok:
                return match.group(0)
            return match_case(combined, w1)

        prev = input_text
        for _ in range(2):
            updated = token_re.sub(repl, prev)
            if updated == prev:
                break
            prev = updated
        return prev
    # Attempt to restore missing spaces before word-level corrections
    if allow_missing_space:
        try:
            restored = restore_missing_spaces(cleaned, languages, hs)
            if restored != cleaned:
                LOGGER.info("Applied missing-space restoration pass")
            cleaned = restored
        except Exception as exc:
            LOGGER.warning("Missing-space restoration failed: %s", exc)

    def split_concatenated_words(input_text: str) -> str:
        token_re = re.compile(r"[A-Za-z\xC4\xD6\xDC\xE4\xF6\xFC\xDF]{6,}")
        has_caps_re = re.compile(r"[a-z\xE4\xF6\xFC\xDF][A-Z\xC4\xD6\xDC]")

        def score_word(word: str) -> Tuple[float, bool]:
            spelled = False
            try:
                if hs is not None and (hs.spell(word) or hs.spell(word.lower())):
                    spelled = True
            except Exception:
                pass
            if spelled:
                return 5.0, True
            if _zipf is None:
                return 0.0, False
            try:
                z = max(_zipf(word.lower(), lc) for lc in lang_codes)
            except Exception:
                z = 0.0
            return float(z), False

        def is_strong_word(word: str) -> bool:
            score, spelled = score_word(word)
            return spelled or score >= 4.0

        def repl(match: re.Match) -> str:
            tok = match.group(0)
            base_score, base_dict = score_word(tok)
            if base_dict or base_score >= 3.0:
                return tok
            if len(tok) < 10 and not has_caps_re.search(tok):
                return tok

            best = None  # type: Optional[Tuple[str, float, str, float]]
            for i in range(3, len(tok) - 2):
                left, right = tok[:i], tok[i:]
                if len(left) < 3 or len(right) < 3:
                    continue
                if not (is_strong_word(left) and is_strong_word(right)):
                    continue
                s1, _ = score_word(left)
                s2, _ = score_word(right)
                combined = s1 + s2
                if best is None or combined > (best[1] + best[3]):
                    best = (left, s1, right, s2)

            if best is None:
                return tok
            left, s1, right, s2 = best
            if _zipf is not None and (s1 + s2) - base_score < 3.0:
                return tok
            try:
                LOGGER.info(
                    "Split concat: %s -> %s %s (scores=%.2f/%.2f base=%.2f)",
                    tok,
                    left,
                    right,
                    s1,
                    s2,
                    base_score,
                )
            except Exception:
                pass
            return f"{left} {right}"

        return token_re.sub(repl, input_text)

    cleaned = split_concatenated_words(cleaned)
    cleaned = merge_broken_words(cleaned)
    if config.enable_dictionary_correction or hs is not None:
        cleaned = apply_dictionary_correction(cleaned, wordlist, hs)
    cleaned = apply_umlaut_corrections(cleaned, languages, wordlist, hs)
    if should_apply_llm_correction(cleaned, config) and config.llm_correct:
        if progress_cb:
            label = f"LLM cleanup ({progress_label})" if progress_label else "LLM cleanup..."
            progress_cb(100, "llm_cleanup", label)
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
            image_count = 0
            try:
                resources = page.get("/Resources") or {}
                x_objects = resources.get("/XObject")
                if x_objects:
                    x_objects = x_objects.get_object() if hasattr(x_objects, "get_object") else x_objects
                    for obj in x_objects.values():
                        try:
                            resolved = obj.get_object() if hasattr(obj, "get_object") else obj
                            if resolved.get("/Subtype") == "/Image":
                                image_count += 1
                        except Exception:
                            continue
            except Exception:
                image_count = 0
            pages.append({"page_num": idx, "text": text, "image_count": image_count})
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


POPPLER_LOGGED_ONCE = False
TESSERACT_LOGGED_ONCE = False


def find_tesseract_path() -> Optional[str]:
    env_cmd = os.environ.get("TESSERACT_CMD") or os.environ.get("TESSERACT_PATH")
    if env_cmd and os.path.isfile(env_cmd):
        return env_cmd
    tesseract_cmd = shutil.which("tesseract")
    if tesseract_cmd:
        return tesseract_cmd
    for candidate in ("/opt/homebrew/bin/tesseract", "/usr/local/bin/tesseract", "/usr/bin/tesseract"):
        if os.path.isfile(candidate):
            return candidate
    return None


def render_pdf_pages(pdf_path: str, dpi: int) -> List[Any]:
    from pdf2image import convert_from_path

    poppler_path = find_poppler_path()
    if poppler_path:
        global POPPLER_LOGGED_ONCE
        if shutil.which("pdftoppm") is None and not POPPLER_LOGGED_ONCE:
            LOGGER.info("Poppler not on PATH; using %s", poppler_path)
            POPPLER_LOGGED_ONCE = True
        return convert_from_path(pdf_path, dpi=dpi, poppler_path=poppler_path)
    return convert_from_path(pdf_path, dpi=dpi)


def render_pdf_pages_sample(pdf_path: str, dpi: int, max_pages: int) -> List[Any]:
    from pdf2image import convert_from_path

    if max_pages <= 0:
        return []
    poppler_path = find_poppler_path()
    kwargs = {"dpi": dpi, "first_page": 1, "last_page": max_pages}
    if poppler_path:
        global POPPLER_LOGGED_ONCE
        if shutil.which("pdftoppm") is None and not POPPLER_LOGGED_ONCE:
            LOGGER.info("Poppler not on PATH; using %s", poppler_path)
            POPPLER_LOGGED_ONCE = True
        kwargs["poppler_path"] = poppler_path
    return convert_from_path(pdf_path, **kwargs)


def get_pdf_page_count(pdf_path: str) -> int:
    """Return total number of pages using pypdf (fast and light)."""
    try:
        from pypdf import PdfReader  # type: ignore
        reader = PdfReader(pdf_path)
        return int(len(reader.pages))
    except Exception:
        return 0


def select_column_sample_indices(total_pages: int, max_pages: int) -> List[int]:
    """Pick up to max_pages page indices spread across the document (1-based)."""
    if total_pages <= 0:
        return []
    k = max(1, max_pages)
    k = min(k, total_pages)
    if k == 1:
        return [max(1, (total_pages + 1) // 2)]
    if k == 2:
        return [1, total_pages]
    # Spread evenly including first and last
    step = (total_pages - 1) / (k - 1)
    return [int(round(1 + i * step)) for i in range(k)]


def render_pdf_pages_at_indices(pdf_path: str, dpi: int, indices: Sequence[int]) -> List[Any]:
    """Render specific 1-based page indices to images. May call pdf2image multiple times."""
    from pdf2image import convert_from_path
    images: List[Any] = []
    if not indices:
        return images
    poppler_path = find_poppler_path()
    for idx in indices:
        kwargs = {"dpi": dpi, "first_page": int(idx), "last_page": int(idx)}
        if poppler_path:
            global POPPLER_LOGGED_ONCE
            if shutil.which("pdftoppm") is None and not POPPLER_LOGGED_ONCE:
                LOGGER.info("Poppler not on PATH; using %s", poppler_path)
                POPPLER_LOGGED_ONCE = True
            kwargs["poppler_path"] = poppler_path
        try:
            imgs = convert_from_path(pdf_path, **kwargs)
            if imgs:
                images.append(imgs[0])
        except Exception:
            continue
    return images


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
    # Build a robust binarization threshold: combine median-std rule with Otsu
    median = float(np.median(arr))
    std = float(arr.std())
    thr_a = median - (std * config.column_detect_threshold_std_mult)
    thr_a = min(thr_a, float(config.column_detect_threshold_max))
    thr_a = max(thr_a, float(config.column_detect_threshold_min))

    # Otsu threshold (fast implementation without external deps)
    try:
        hist, _ = np.histogram(arr, bins=256, range=(0, 255))
        hist = hist.astype(np.float64)
        total = hist.sum()
        if total > 0:
            prob = hist / total
            omega = np.cumsum(prob)
            mu = np.cumsum(prob * np.arange(256))
            mu_t = mu[-1]
            sigma_b2 = (mu_t * omega - mu) ** 2 / np.maximum(omega * (1.0 - omega), 1e-9)
            k = int(np.nanargmax(sigma_b2))
            thr_b = float(k)
        else:
            thr_b = thr_a
    except Exception:
        thr_b = thr_a

    threshold = 0.5 * (thr_a + thr_b)
    mask = arr < threshold

    # Focus on the vertical band with the most text-like pixels to avoid full-width pictures at top
    h = mask.shape[0]
    band_h = max(1, int(h * 0.6))  # use central 60% by default (adaptive below)
    if band_h < h:
        step = max(1, int(h * 0.04))
        best_y = 0
        best_score = -1.0
        # Slide a window to find the densest text band
        for y in range(0, h - band_h + 1, step):
            score = mask[y : y + band_h, :].mean()
            if score > best_score:
                best_score = score
                best_y = y
        mask = mask[best_y : best_y + band_h, :]

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


def find_column_gaps(
    density: Sequence[float],
    config: DoclingProcessingConfig,
) -> List[Tuple[int, int]]:
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

    gaps: List[Tuple[int, int]] = []
    idx = 0
    while idx < len(core):
        if core[idx] < threshold:
            gap_start = idx
            while idx < len(core) and core[idx] < threshold:
                idx += 1
            if idx - gap_start >= min_gap:
                gaps.append((start + gap_start, start + idx))
        else:
            idx += 1
    return gaps


def count_column_gaps(
    density: Sequence[float],
    config: DoclingProcessingConfig,
) -> int:
    return len(find_column_gaps(density, config))


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


def split_blocks_into_columns(
    blocks: List[Dict[str, Any]], log_label: str = "OCR"
) -> Tuple[List[List[Dict[str, Any]]], float, float]:
    if not blocks:
        return [], 0.0, 0.0
    # Robust grouping by x-center: find one or two big gaps -> 2 or 3 columns
    xs = sorted(b["xc"] for b in blocks)
    x_min, x_max = xs[0], xs[-1]
    span = max(1.0, x_max - x_min)
    widths = sorted((b["x1"] - b["x0"]) for b in blocks)
    w_med = widths[len(widths) // 2] if widths else 1.0
    # Lower threshold than before: helps separate three narrow columns
    gap_thr = max(0.06 * span, 0.5 * w_med)

    # Compute gaps between consecutive x-centers
    diffs: List[Tuple[float, int]] = []
    for i in range(1, len(xs)):
        diffs.append((xs[i] - xs[i - 1], i))  # (gap, split_index)
    gap_values = sorted(gap for gap, _ in diffs)
    median_gap = gap_values[len(gap_values) // 2] if gap_values else 0.0
    # Candidate split positions are those with large gaps
    candidates = [idx for (gap, idx) in diffs if gap >= gap_thr]

    # Build columns by splitting at up to two largest valid gaps ensuring min size per group
    min_lines = max(3, len(blocks) // 20 or 1)
    columns: List[List[Dict[str, Any]]] = []
    blocks_sorted = sorted(blocks, key=lambda b: b["xc"])  # align with xs order
    used_splits: List[int] = []
    if candidates:
        # Prefer two-gap (3-column) split if possible
        cands_sorted = sorted(
            ((xs[i - 1], xs[i], i) for i in candidates), key=lambda t: t[1] - t[0], reverse=True
        )
        # Try all pairs of split indices to form 3 groups
        tried = False
        for _a in range(min(5, len(cands_sorted))):
            for _b in range(_a + 1, min(6, len(cands_sorted))):
                i1 = cands_sorted[_a][2]
                i2 = cands_sorted[_b][2]
                a, b = sorted([i1, i2])
                if a < min_lines or (b - a) < min_lines or (len(blocks) - b) < min_lines:
                    continue
                used_splits = [a, b]
                tried = True
                break
            if tried:
                break
        if not used_splits:
            # Fall back to single split (2 columns)
            # pick the largest valid gap that yields two groups of minimum size
            for _, _, i in cands_sorted:
                if i >= min_lines and (len(blocks) - i) >= min_lines:
                    used_splits = [i]
                    break

    if used_splits:
        used_splits = sorted(set(used_splits))
        start = 0
        for s in used_splits:
            columns.append(blocks_sorted[start:s])
            start = s
        columns.append(blocks_sorted[start:])
    else:
        # Fallback threshold grouping
        cur: List[Dict[str, Any]] = []
        prev_xc: Optional[float] = None
        for b in blocks_sorted:
            if prev_xc is None or abs(b["xc"] - prev_xc) <= gap_thr:
                cur.append(b)
            else:
                if cur:
                    columns.append(cur)
                cur = [b]
            prev_xc = b["xc"]
        if cur:
            columns.append(cur)

    def _kmeans_1d(points: List[float], k: int) -> Optional[Tuple[List[List[int]], List[float]]]:
        if len(points) < k:
            return None
        sorted_points = sorted(points)
        centers = []
        for i in range(k):
            pct = (i + 0.5) / k
            idx = int(pct * (len(sorted_points) - 1))
            centers.append(sorted_points[idx])
        for _ in range(20):
            clusters: List[List[int]] = [[] for _ in range(k)]
            for idx, val in enumerate(points):
                nearest = min(range(k), key=lambda c: abs(val - centers[c]))
                clusters[nearest].append(idx)
            new_centers = []
            for c_idx in range(k):
                if not clusters[c_idx]:
                    return None
                new_centers.append(sum(points[i] for i in clusters[c_idx]) / len(clusters[c_idx]))
            if max(abs(new_centers[i] - centers[i]) for i in range(k)) < 0.5:
                centers = new_centers
                break
            centers = new_centers
        return clusters, centers

    def _kmeans_improvement(points: List[float], clusters: List[List[int]], centers: List[float]) -> float:
        mean = sum(points) / len(points)
        total_var = sum((val - mean) ** 2 for val in points) / max(1, len(points))
        if total_var <= 1e-6:
            return 0.0
        within = 0.0
        for c_idx, cluster in enumerate(clusters):
            center = centers[c_idx]
            for i in cluster:
                within += (points[i] - center) ** 2
        within /= max(1, len(points))
        return (total_var - within) / total_var

    def _boundary_valley_ok(points: List[float], centers: List[float], span_points: float) -> bool:
        ordered = sorted(centers)
        if len(ordered) <= 1:
            return False
        band = max(0.04 * span_points, 1.5 * w_med)
        band = min(band, 0.2 * span_points)
        total = len(points)
        for i in range(len(ordered) - 1):
            boundary = 0.5 * (ordered[i] + ordered[i + 1])
            count = sum(1 for val in points if abs(val - boundary) <= band / 2)
            expected = max(1e-6, band / span_points * total)
            if (count / expected) > 0.85:
                return False
        return True

    if len(columns) <= 1 and len(blocks_sorted) >= 20:
        min_lines = max(3, len(blocks_sorted) // 20 or 1)

        def _try_kmeans(points: List[float], basis: str) -> Optional[Tuple[List[List[Dict[str, Any]]], float, int, str]]:
            span_points = max(1.0, max(points) - min(points))
            best_cols: Optional[List[List[Dict[str, Any]]]] = None
            best_score = 0.0
            best_k = 0
            for k in (2, 3):
                if len(blocks_sorted) < k * min_lines:
                    continue
                result = _kmeans_1d(points, k)
                if not result:
                    continue
                clusters, centers = result
                if min(len(c) for c in clusters) < min_lines:
                    continue
                improvement = _kmeans_improvement(points, clusters, centers)
                if improvement < 0.6:
                    continue
                if not _boundary_valley_ok(points, centers, span_points):
                    continue
                ordered = sorted(range(k), key=lambda i: centers[i])
                ordered_centers = [centers[i] for i in ordered]
                min_gap = min(
                    ordered_centers[i + 1] - ordered_centers[i]
                    for i in range(len(ordered_centers) - 1)
                )
                if min_gap < 0.02 * span_points:
                    continue
                score = improvement + (min_gap / span_points)
                if score > best_score:
                    best_score = score
                    best_k = k
                    best_cols = [[blocks_sorted[i] for i in clusters[idx]] for idx in ordered]
            if best_cols:
                return best_cols, best_score, best_k, basis
            return None

        candidates = [
            _try_kmeans([b["xc"] for b in blocks_sorted], "xc"),
            _try_kmeans([b["x0"] for b in blocks_sorted], "x0"),
        ]
        best = None
        for candidate in candidates:
            if not candidate:
                continue
            if best is None or candidate[1] > best[1]:
                best = candidate
        if best:
            columns, best_score, best_k, basis = best
            try:
                LOGGER.info(
                    "%s column grouping fallback (kmeans-%s): k=%d score=%.2f",
                    log_label,
                    basis,
                    best_k,
                    best_score,
                )
            except Exception:
                pass

    # Sort columns left-to-right by median x center
    def col_key(col: List[Dict[str, Any]]) -> float:
        centers = sorted(b["xc"] for b in col)
        return centers[len(centers) // 2]

    columns = [col for col in columns if col]
    columns.sort(key=col_key)
    try:
        LOGGER.info("%s column grouping: k=%d (gap_thr=%.2f, span=%.1f)", log_label, len(columns), gap_thr, span)
    except Exception:
        pass
    return columns, gap_thr, span


def order_blocks_into_columns(
    blocks: List[Dict[str, Any]],
    log_label: str = "OCR",
    preserve_single_column_order: bool = False,
) -> str:
    columns, _, _ = split_blocks_into_columns(blocks, log_label=log_label)
    if not columns:
        return ""
    # Within each column, sort top-down and join
    col_texts: List[str] = []
    for col in columns:
        if preserve_single_column_order and len(columns) == 1:
            col_sorted = sorted(col, key=lambda b: b.get("line_id", 0))
        else:
            col_sorted = sorted(col, key=lambda b: (b["y0"], b["x0"]))
        lines: List[str] = []
        for block in col_sorted:
            raw = str(block.get("text", "")).strip()
            if not raw:
                continue
            lines.append(raw)
        col_texts.append("\\n".join(lines))
    # Read columns left to right
    return "\\n\\n".join(t for t in col_texts if t)


def ocr_pages_text_chars(pages: Sequence[Dict[str, Any]]) -> int:
    return sum(len(str(page.get("text", "")).strip()) for page in pages)


def has_output_text(markdown: str, pages: Sequence[Dict[str, Any]]) -> bool:
    return bool(markdown.strip()) or ocr_pages_text_chars(pages) > 0


def ocr_pages_with_paddle_structure(
    images: Sequence[Any],
    languages: str,
    config: DoclingProcessingConfig,
    progress_cb: Optional[ProgressCallback] = None,
    progress_base: int = 0,
    progress_span: int = 0,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    from paddleocr import PPStructure

    try:
        import numpy as np
    except Exception as exc:
        raise RuntimeError(f"numpy is required for PPStructure: {exc}") from exc

    structure_kwargs: Dict[str, Any] = {
        "lang": languages,
        "layout": True,
        "ocr": True,
        "show_log": False,
    }
    if config.paddle_use_textline_orientation:
        structure_kwargs["use_textline_orientation"] = True
    if config.paddle_use_doc_orientation_classify:
        structure_kwargs["use_doc_orientation_classify"] = True
    if config.paddle_use_doc_unwarping:
        structure_kwargs["use_doc_unwarping"] = True
    if config.paddle_structure_version:
        structure_kwargs["structure_version"] = config.paddle_structure_version

    def _create_structure(kwargs: Dict[str, Any]) -> PPStructure:
        return PPStructure(**kwargs)

    structure = None
    try:
        structure = _create_structure(structure_kwargs)
    except TypeError:
        reduced_kwargs = dict(structure_kwargs)
        reduced_kwargs.pop("use_textline_orientation", None)
        reduced_kwargs.pop("use_doc_orientation_classify", None)
        reduced_kwargs.pop("use_doc_unwarping", None)
        try:
            structure = _create_structure(reduced_kwargs)
        except TypeError:
            reduced_kwargs.pop("structure_version", None)
            structure = _create_structure(reduced_kwargs)

    def _block_to_dict(block: Any) -> Dict[str, Any]:
        if isinstance(block, dict):
            return block
        to_dict = getattr(block, "to_dict", None)
        if callable(to_dict):
            try:
                converted = to_dict()
                if isinstance(converted, dict):
                    return converted
            except Exception:
                return {}
        return {}

    def _strip_html(text: str) -> str:
        return re.sub(r"<[^>]+>", " ", text)

    def _extract_block_lines(block: Dict[str, Any]) -> List[str]:
        res = block.get("res") or block.get("text") or block.get("content")
        if isinstance(res, str):
            cleaned = _strip_html(res).strip()
            return [cleaned] if cleaned else []
        if isinstance(res, dict):
            text_val = res.get("text")
            if isinstance(text_val, str):
                cleaned = text_val.strip()
                return [cleaned] if cleaned else []
            html_val = res.get("html")
            if isinstance(html_val, str):
                cleaned = _strip_html(html_val).strip()
                return [cleaned] if cleaned else []
        if isinstance(res, list):
            lines: List[str] = []
            for item in res:
                if isinstance(item, str):
                    item = item.strip()
                    if item:
                        lines.append(item)
                    continue
                if isinstance(item, dict):
                    text_val = item.get("text")
                    if isinstance(text_val, str):
                        text_val = text_val.strip()
                        if text_val:
                            lines.append(text_val)
            return lines
        return []

    pages: List[Dict[str, Any]] = []
    total = max(1, len(images))
    for idx, image in enumerate(images, start=1):
        result = structure(np.array(image))
        blocks = result if isinstance(result, list) else []
        lines_out: List[str] = []
        for block in blocks:
            block_dict = _block_to_dict(block)
            block_type = str(
                block_dict.get("type")
                or block_dict.get("label")
                or block_dict.get("category")
                or ""
            ).lower()
            block_lines = _extract_block_lines(block_dict)
            if not block_lines:
                continue
            if block_type in ("title", "header", "heading"):
                title = " ".join(block_lines).strip()
                if title:
                    lines_out.append(f"# {title}")
            else:
                lines_out.append("\\n".join(block_lines))
        pages.append({"page_num": idx, "text": "\\n\\n".join(lines_out).strip()})
        if progress_cb and progress_span > 0:
            percent = progress_base + int(idx / total * progress_span)
            progress_cb(percent, "layout", f"Layout page {idx}/{total}")

    return pages, {"layout_used": True, "layout_model": config.paddle_structure_version}


def ocr_pages_with_paddle(
    images: Sequence[Any],
    languages: str,
    config: DoclingProcessingConfig,
    progress_cb: Optional[ProgressCallback] = None,
    progress_base: int = 0,
    progress_span: int = 0,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    from paddleocr import PaddleOCR

    try:
        import numpy as np
    except Exception as exc:
        raise RuntimeError(f"numpy is required for PaddleOCR: {exc}") from exc

    # Newer PaddleOCR prefers use_textline_orientation; older uses use_angle_cls
    ocr_kwargs: Dict[str, Any] = {"lang": languages}
    if config.paddle_target_max_side_px > 0:
        ocr_kwargs["text_det_limit_side_len"] = config.paddle_target_max_side_px
        ocr_kwargs["text_det_limit_type"] = "max"
    if config.paddle_use_doc_orientation_classify:
        ocr_kwargs["use_doc_orientation_classify"] = True
    if config.paddle_use_doc_unwarping:
        ocr_kwargs["use_doc_unwarping"] = True

    def _create_ocr(kwargs: Dict[str, Any], use_textline_orientation: bool) -> PaddleOCR:
        try:
            return PaddleOCR(use_textline_orientation=use_textline_orientation, **kwargs)
        except TypeError:
            return PaddleOCR(use_angle_cls=use_textline_orientation, **kwargs)

    def _try_create(kwargs: Dict[str, Any], use_textline_orientation: bool) -> Optional[PaddleOCR]:
        try:
            return _create_ocr(kwargs, use_textline_orientation)
        except TypeError:
            return None

    ocr = _try_create(ocr_kwargs, config.paddle_use_textline_orientation)
    if ocr is None:
        reduced_kwargs = dict(ocr_kwargs)
        reduced_kwargs.pop("use_doc_orientation_classify", None)
        reduced_kwargs.pop("use_doc_unwarping", None)
        ocr = _try_create(reduced_kwargs, config.paddle_use_textline_orientation)
    if ocr is None:
        legacy_kwargs = dict(ocr_kwargs)
        if "text_det_limit_side_len" in legacy_kwargs:
            legacy_kwargs["det_limit_side_len"] = legacy_kwargs.pop("text_det_limit_side_len")
        if "text_det_limit_type" in legacy_kwargs:
            legacy_kwargs["det_limit_type"] = legacy_kwargs.pop("text_det_limit_type")
        ocr = _try_create(legacy_kwargs, config.paddle_use_textline_orientation)
    if ocr is None:
        legacy_kwargs = dict(ocr_kwargs)
        legacy_kwargs.pop("use_doc_orientation_classify", None)
        legacy_kwargs.pop("use_doc_unwarping", None)
        if "text_det_limit_side_len" in legacy_kwargs:
            legacy_kwargs["det_limit_side_len"] = legacy_kwargs.pop("text_det_limit_side_len")
        if "text_det_limit_type" in legacy_kwargs:
            legacy_kwargs["det_limit_type"] = legacy_kwargs.pop("text_det_limit_type")
        ocr = _create_ocr(legacy_kwargs, config.paddle_use_textline_orientation)
    pages: List[Dict[str, Any]] = []
    confidences: List[float] = []

    def _bbox_from_quad(quad: Sequence[Sequence[float]]) -> Tuple[float, float, float, float, float]:
        xs = [p[0] for p in quad]
        ys = [p[1] for p in quad]
        x0, y0, x1, y1 = float(min(xs)), float(min(ys)), float(max(xs)), float(max(ys))
        xc = 0.5 * (x0 + x1)
        return x0, y0, x1, y1, xc

    def _image_to_array(img: Any) -> Any:
        if hasattr(img, "convert"):
            try:
                img = img.convert("RGB")
            except Exception:
                pass
        return np.array(img)

    def _paddle_obj_to_dict(obj: Any) -> Optional[Dict[str, Any]]:
        if obj is None:
            return None
        if isinstance(obj, dict):
            return obj
        to_dict = getattr(obj, "to_dict", None)
        if callable(to_dict):
            try:
                converted = to_dict()
                if isinstance(converted, dict):
                    return converted
            except Exception:
                return None
        rec_texts = getattr(obj, "rec_texts", None)
        dt_polys = getattr(obj, "dt_polys", None)
        if rec_texts is not None or dt_polys is not None:
            return {"rec_texts": rec_texts, "dt_polys": dt_polys, "rec_scores": getattr(obj, "rec_scores", None)}
        return None

    def _extract_from_paddle_dict(result: Dict[str, Any]) -> List[Tuple[Any, str, Optional[float]]]:
        texts = result.get("rec_texts") or result.get("texts") or result.get("rec_text")
        if not isinstance(texts, list):
            return []
        boxes = (
            result.get("dt_polys")
            or result.get("det_polys")
            or result.get("dt_boxes")
            or result.get("boxes")
        )
        scores = result.get("rec_scores") or result.get("scores") or result.get("rec_score")
        entries: List[Tuple[Any, str, Optional[float]]] = []
        for idx, text_val in enumerate(texts):
            text_str = str(text_val or "").strip()
            if not text_str:
                continue
            quad = None
            if isinstance(boxes, list) and idx < len(boxes):
                quad = boxes[idx]
            conf_val = None
            if isinstance(scores, list) and idx < len(scores):
                try:
                    conf_val = float(scores[idx])
                except Exception:
                    conf_val = None
            entries.append((quad, text_str, conf_val))
        return entries

    def _iter_paddle_entries(result: Any) -> List[Tuple[Any, str, Optional[float]]]:
        if isinstance(result, dict):
            return _extract_from_paddle_dict(result)
        if isinstance(result, list):
            entries = result
            if len(result) == 1:
                maybe_dict = _paddle_obj_to_dict(result[0])
                if maybe_dict is not None:
                    return _extract_from_paddle_dict(maybe_dict)
                if isinstance(result[0], (list, tuple, dict)):
                    entries = result[0]
            if isinstance(entries, dict):
                return _extract_from_paddle_dict(entries)
            if isinstance(entries, list) and entries and isinstance(entries[0], dict):
                combined: List[Tuple[Any, str, Optional[float]]] = []
                for entry in entries:
                    if isinstance(entry, dict):
                        combined.extend(_extract_from_paddle_dict(entry))
                    else:
                        maybe_dict = _paddle_obj_to_dict(entry)
                        if maybe_dict is not None:
                            combined.extend(_extract_from_paddle_dict(maybe_dict))
                return combined
            extracted: List[Tuple[Any, str, Optional[float]]] = []
            for entry in entries:
                if not entry or not isinstance(entry, (list, tuple)):
                    continue
                quad = entry[0] if len(entry) > 0 else None
                text_part = entry[1] if len(entry) > 1 else None
                if text_part is None:
                    continue
                text_str = ""
                conf_val = None
                if isinstance(text_part, (list, tuple)) and text_part:
                    text_str = str(text_part[0] or "").strip()
                    if len(text_part) > 1 and isinstance(text_part[1], (float, int)):
                        conf_val = float(text_part[1])
                else:
                    text_str = str(text_part or "").strip()
                if text_str:
                    extracted.append((quad, text_str, conf_val))
            return extracted
        return []

    total = max(1, len(images))
    total_pages = len(images)
    repeat_threshold = 0
    repeated_clusters: List[BoilerplateCluster] = []
    page_edge_candidates: List[List[str]] = []

    for image in images:
        edge_lines: List[Tuple[str, float]] = []
        result = None
        image_arr = _image_to_array(image)
        try:
            result = ocr.predict(image_arr)  # type: ignore[attr-defined]
        except Exception as exc:
            LOGGER.debug("PaddleOCR predict failed; falling back to ocr: %s", exc)
        if not result:
            try:
                result = ocr.ocr(image_arr, cls=True)
            except TypeError:
                result = ocr.ocr(image_arr)
        if result:
            for quad, text_val, _ in _iter_paddle_entries(result):
                if not text_val:
                    continue
                if quad is None:
                    continue
                try:
                    _, y0_val, _, _, _ = _bbox_from_quad(quad)
                except Exception:
                    y0_val = 0.0
                edge_lines.append((text_val, y0_val))
        if config.enable_boilerplate_removal and edge_lines:
            page_edge_candidates.append(
                select_edge_texts_by_y(edge_lines, config.boilerplate_edge_lines)
            )

    if config.enable_boilerplate_removal and total_pages >= config.boilerplate_min_pages:
        repeated_clusters, repeat_threshold = detect_repeated_line_clusters(
            page_edge_candidates,
            total_pages,
            config,
        )
    removed_total = 0

    for idx, image in enumerate(images, start=1):
        # Prefer new API: predict(); fall back to ocr() with/without cls
        image_arr = _image_to_array(image)
        try:
            result = ocr.predict(image_arr)  # type: ignore[attr-defined]
        except Exception:
            try:
                result = ocr.ocr(image_arr, cls=True)
            except TypeError:
                result = ocr.ocr(image_arr)
        blocks: List[Dict[str, Any]] = []
        fallback_lines: List[str] = []
        if result:
            for quad, text_val, conf_val in _iter_paddle_entries(result):
                if conf_val is not None:
                    confidences.append(conf_val)
                if not text_val:
                    continue
                if quad is None:
                    fallback_lines.append(text_val)
                    continue
                try:
                    x0, y0, x1, y1, xc = _bbox_from_quad(quad)
                except Exception:
                    fallback_lines.append(text_val)
                    continue
                blocks.append({
                    "x0": x0,
                    "y0": y0,
                    "x1": x1,
                    "y1": y1,
                    "xc": xc,
                    "text": text_val,
                    "line_id": len(blocks),
                })
        edge_ids: Set[int] = set()
        if config.enable_boilerplate_removal and blocks:
            edge_ids = edge_ids_by_y(
                [(b["line_id"], b["y0"]) for b in blocks],
                config.boilerplate_edge_lines,
            )
        if edge_ids:
            filtered_blocks: List[Dict[str, Any]] = []
            for b in blocks:
                normalized = normalize_boilerplate_line(str(b.get("text", "")).strip())
                is_edge = b.get("line_id") in edge_ids
                if is_edge and (
                    matches_repeated_cluster(str(b.get("text", "")), repeated_clusters, config)
                    or is_boilerplate_line(normalized)
                ):
                    removed_total += 1
                    continue
                filtered_blocks.append(b)
            blocks = filtered_blocks
        if blocks:
            ordered_text = order_blocks_into_columns(
                blocks,
                log_label="Paddle",
                preserve_single_column_order=True,
            )
        else:
            ordered_text = "\\n".join(fallback_lines)
        pages.append({"page_num": idx, "text": ordered_text})
        if progress_cb and progress_span > 0:
            percent = progress_base + int(idx / total * progress_span)
            progress_cb(percent, "ocr", f"OCR page {idx}/{total}")

    if removed_total and config.enable_boilerplate_removal:
        LOGGER.info(
            "Boilerplate removal (OCR lines): removed %s lines (repeat_threshold=%s, repeated_lines=%s)",
            removed_total,
            repeat_threshold,
            len(repeated_clusters),
        )

    avg_conf = sum(confidences) / len(confidences) if confidences else None
    return pages, {"ocr_confidence_avg": avg_conf}


def ocr_pages_with_tesseract(
    images: Sequence[Any],
    languages: str,
    config: DoclingProcessingConfig,
    progress_cb: Optional[ProgressCallback] = None,
    progress_base: int = 0,
    progress_span: int = 0,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    import pytesseract
    tesseract_cmd = find_tesseract_path()
    if tesseract_cmd:
        global TESSERACT_LOGGED_ONCE
        if shutil.which("tesseract") is None and not TESSERACT_LOGGED_ONCE:
            LOGGER.info("Tesseract not on PATH; using %s", tesseract_cmd)
            TESSERACT_LOGGED_ONCE = True
        pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
    else:
        raise RuntimeError("Tesseract not found on PATH; set TESSERACT_CMD or install tesseract.")

    def _safe_float(values: Any, idx: int) -> float:
        if isinstance(values, list) and idx < len(values):
            try:
                return float(values[idx])
            except Exception:
                return 0.0
        return 0.0

    def _group_words_into_lines(words: List[Dict[str, Any]]) -> List[List[Dict[str, Any]]]:
        if not words:
            return []
        heights = sorted((w["y1"] - w["y0"]) for w in words)
        h_med = heights[len(heights) // 2] if heights else 1.0
        y_thr = max(4.0, 0.6 * h_med)
        words_sorted = sorted(words, key=lambda w: (w["yc"], w["x0"]))
        lines: List[List[Dict[str, Any]]] = []
        current: List[Dict[str, Any]] = []
        current_y: Optional[float] = None
        for w in words_sorted:
            if current_y is None or abs(w["yc"] - current_y) <= y_thr:
                current.append(w)
            else:
                lines.append(current)
                current = [w]
            current_y = w["yc"]
        if current:
            lines.append(current)
        return lines

    pages: List[Dict[str, Any]] = []
    confidences: List[float] = []
    total = max(1, len(images))
    repeat_threshold = 0
    repeated_clusters: List[BoilerplateCluster] = []
    removed_total = 0
    if config.enable_boilerplate_removal and total >= config.boilerplate_min_pages:
        page_edge_candidates: List[List[str]] = []
        for image in images:
            line_items: List[Tuple[str, float]] = []
            try:
                data = pytesseract.image_to_data(
                    image, lang=languages, output_type=pytesseract.Output.DICT
                )
                items = len(data.get("text", []))
                words: List[Dict[str, Any]] = []
                for i in range(items):
                    raw_text = str(data["text"][i] or "").strip()
                    if not raw_text:
                        continue
                    x0 = _safe_float(data.get("left"), i)
                    y0 = _safe_float(data.get("top"), i)
                    x1 = x0 + _safe_float(data.get("width"), i)
                    y1 = y0 + _safe_float(data.get("height"), i)
                    yc = 0.5 * (y0 + y1)
                    words.append(
                        {
                            "x0": x0,
                            "y0": y0,
                            "x1": x1,
                            "y1": y1,
                            "yc": yc,
                            "text": raw_text,
                        }
                    )
                for line_words in _group_words_into_lines(words):
                    line_sorted = sorted(line_words, key=lambda w: w["x0"])
                    line_text = " ".join(w["text"] for w in line_sorted if w["text"]).strip()
                    if not line_text:
                        continue
                    line_y0 = min(w["y0"] for w in line_sorted)
                    line_items.append((line_text, line_y0))
            except Exception:
                line_items = []
            if line_items:
                page_edge_candidates.append(
                    select_edge_texts_by_y(line_items, config.boilerplate_edge_lines)
                )
        repeated_clusters, repeat_threshold = detect_repeated_line_clusters(
            page_edge_candidates,
            total,
            config,
        )
    for idx, image in enumerate(images, start=1):
        text = ""
        words: List[Dict[str, Any]] = []
        try:
            data = pytesseract.image_to_data(
                image, lang=languages, output_type=pytesseract.Output.DICT
            )
            items = len(data.get("text", []))
            for i in range(items):
                raw_text = str(data["text"][i] or "").strip()
                if not raw_text:
                    continue
                x0 = _safe_float(data.get("left"), i)
                y0 = _safe_float(data.get("top"), i)
                x1 = x0 + _safe_float(data.get("width"), i)
                y1 = y0 + _safe_float(data.get("height"), i)
                xc = 0.5 * (x0 + x1)
                yc = 0.5 * (y0 + y1)
                words.append(
                    {
                        "x0": x0,
                        "y0": y0,
                        "x1": x1,
                        "y1": y1,
                        "xc": xc,
                        "yc": yc,
                        "text": raw_text,
                    }
                )

                conf_raw = data.get("conf", [None])[i]
                try:
                    conf_val = float(conf_raw)
                except Exception:
                    conf_val = None
                if conf_val is not None and conf_val >= 0:
                    confidences.append(conf_val)

            if words:
                columns, _, _ = split_blocks_into_columns(words, log_label="Tesseract")
                column_lines: List[List[Dict[str, Any]]] = []
                line_id_counter = 0
                for col in columns:
                    lines: List[Dict[str, Any]] = []
                    for line_words in _group_words_into_lines(col):
                        line_sorted = sorted(line_words, key=lambda w: w["x0"])
                        line_text = " ".join(w["text"] for w in line_sorted if w["text"])
                        if not line_text:
                            continue
                        line_y0 = min(w["y0"] for w in line_sorted)
                        line_y1 = max(w["y1"] for w in line_sorted)
                        line_x0 = min(w["x0"] for w in line_sorted)
                        lines.append(
                            {
                                "text": line_text,
                                "y0": line_y0,
                                "y1": line_y1,
                                "x0": line_x0,
                                "line_id": line_id_counter,
                            }
                        )
                        line_id_counter += 1
                    lines.sort(key=lambda l: (l["y0"], l["x0"]))
                    column_lines.append(lines)
                edge_ids: Set[int] = set()
                if config.enable_boilerplate_removal and column_lines:
                    all_lines = [line for col_lines in column_lines for line in col_lines]
                    edge_ids = edge_ids_by_y(
                        [(line["line_id"], line["y0"]) for line in all_lines],
                        config.boilerplate_edge_lines,
                    )
                if edge_ids:
                    filtered_columns: List[List[Dict[str, Any]]] = []
                    for lines in column_lines:
                        filtered_lines: List[Dict[str, Any]] = []
                        for line in lines:
                            normalized = normalize_boilerplate_line(str(line.get("text", "")).strip())
                            is_edge = line.get("line_id") in edge_ids
                            if is_edge and (
                                matches_repeated_cluster(str(line.get("text", "")), repeated_clusters, config)
                                or is_boilerplate_line(normalized)
                            ):
                                removed_total += 1
                                continue
                            filtered_lines.append(line)
                        filtered_columns.append(filtered_lines)
                    column_lines = filtered_columns
                def _join_lines(lines: List[Dict[str, Any]]) -> str:
                    heights = [line["y1"] - line["y0"] for line in lines if line.get("y1") is not None]
                    heights = sorted(h for h in heights if h > 0)
                    h_med = heights[len(heights) // 2] if heights else 10.0
                    gap_thr = max(6.0, 1.6 * h_med)
                    paragraphs: List[str] = []
                    current = ""
                    prev_y1: Optional[float] = None
                    for line in lines:
                        line_text = str(line.get("text", "")).strip()
                        if not line_text:
                            continue
                        y0 = float(line.get("y0") or 0.0)
                        y1 = float(line.get("y1") or y0)
                        if current and prev_y1 is not None and (y0 - prev_y1) > gap_thr:
                            paragraphs.append(current.strip())
                            current = ""
                        if not current:
                            current = line_text
                        else:
                            if current.endswith("-"):
                                current = current[:-1] + line_text.lstrip()
                            else:
                                current = current.rstrip() + " " + line_text.lstrip()
                        prev_y1 = y1
                    if current:
                        paragraphs.append(current.strip())
                    return "\\n\\n".join(paragraphs)

                col_texts = [_join_lines(lines) for lines in column_lines if lines]
                text = "\\n\\n".join(t for t in col_texts if t)
        except Exception:
            text = ""

        if not text:
            text = pytesseract.image_to_string(image, lang=languages)
        pages.append({"page_num": idx, "text": text})
        if progress_cb and progress_span > 0:
            percent = progress_base + int(idx / total * progress_span)
            progress_cb(percent, "ocr", f"OCR page {idx}/{total}")
    if removed_total and config.enable_boilerplate_removal:
        LOGGER.info(
            "Boilerplate removal (OCR lines): removed %s lines (repeat_threshold=%s, repeated_lines=%s)",
            removed_total,
            repeat_threshold,
            len(repeated_clusters),
        )
    avg_conf = sum(confidences) / len(confidences) if confidences else None
    return pages, {"ocr_confidence_avg": avg_conf}


def run_external_ocr_pages(
    pdf_path: str,
    engine: str,
    languages: str,
    config: DoclingProcessingConfig,
    dpi: Optional[int] = None,
    progress_cb: Optional[ProgressCallback] = None,
    progress_base: int = 0,
    progress_span: int = 0,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    effective_dpi = dpi or config.ocr_dpi
    if engine == "paddle":
        max_side_points = get_pdf_max_page_points(pdf_path)
        if max_side_points and config.paddle_target_max_side_px > 0:
            target_dpi = int(config.paddle_target_max_side_px * 72 / max_side_points)
            if target_dpi > 0 and target_dpi < effective_dpi:
                LOGGER.info(
                    "Paddle OCR DPI adjusted for page size: %d -> %d",
                    effective_dpi,
                    target_dpi,
                )
                effective_dpi = target_dpi
        if config.paddle_max_dpi > 0 and effective_dpi > config.paddle_max_dpi:
            LOGGER.info(
                "Paddle OCR DPI capped: %d -> %d",
                effective_dpi,
                config.paddle_max_dpi,
            )
            effective_dpi = config.paddle_max_dpi
    images = render_pdf_pages(pdf_path, effective_dpi)
    if engine == "paddle":
        if config.paddle_use_structure_v3:
            try:
                return ocr_pages_with_paddle_structure(
                    images,
                    normalize_languages_for_engine(languages, engine),
                    config,
                    progress_cb,
                    progress_base,
                    progress_span,
                )
            except Exception as exc:
                LOGGER.warning("PP-StructureV3 failed; falling back to PaddleOCR: %s", exc)
        return ocr_pages_with_paddle(
            images,
            normalize_languages_for_engine(languages, engine),
            config,
            progress_cb,
            progress_base,
            progress_span,
        )
    if engine == "tesseract":
        return ocr_pages_with_tesseract(
            images,
            normalize_languages_for_engine(languages, engine),
            config,
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
    text_layer_overlay = bool(
        has_text_layer
        and quality.image_page_ratio is not None
        and quality.image_page_ratio >= config.quality_image_page_ratio_threshold
    )
    if quality.image_page_ratio is not None:
        LOGGER.info(
            "Text-layer overlay: %s (img_pages=%.2f, threshold=%.2f)",
            text_layer_overlay,
            quality.image_page_ratio,
            config.quality_image_page_ratio_threshold,
        )
    return {
        "text_layer_detected": has_text_layer,
        "text_layer_low_quality": has_text_layer and low_quality,
        "text_layer_overlay": text_layer_overlay,
        "avg_chars_per_page": quality.avg_chars_per_page,
        "alpha_ratio": quality.alpha_ratio,
        "suspicious_token_ratio": quality.suspicious_token_ratio,
        "confidence_proxy": quality.confidence_proxy,
        "dictionary_hit_ratio": quality.dictionary_hit_ratio,
        "spellchecker_hit_ratio": quality.spellchecker_hit_ratio,
        "image_heavy_ratio": quality.image_heavy_ratio,
        "image_page_ratio": quality.image_page_ratio,
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
    text_layer_overlay = bool(
        has_text_layer
        and quality.image_page_ratio is not None
        and quality.image_page_ratio >= config.quality_image_page_ratio_threshold
    )
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
            # Spread sampling across document to avoid false negatives on front-matter
            total_pages = get_pdf_page_count(pdf_path)
            sample_indices = select_column_sample_indices(total_pages, config.column_detect_max_pages)
            if not sample_indices:
                sample_indices = list(range(1, min(3, total_pages or 3) + 1))
            LOGGER.info("Column layout sample pages: %s", sample_indices)

            sample_images = render_pdf_pages_at_indices(pdf_path, config.column_detect_dpi, sample_indices)
            column_layout = detect_multicolumn_layout(sample_images, config)
            # If not detected, retry at a higher DPI once
            if not column_layout.detected and config.column_detect_dpi < 220:
                hi_dpi = 300
                hi_images = render_pdf_pages_at_indices(pdf_path, hi_dpi, sample_indices)
                hi_layout = detect_multicolumn_layout(hi_images, config)
                if hi_layout.detected:
                    column_layout = hi_layout
                    LOGGER.info("Column layout detection (hi-dpi %d): %s (%s)", hi_dpi, column_layout.detected, column_layout.reason)
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
    spell_ratio = "n/a" if quality.spellchecker_hit_ratio is None else f"{quality.spellchecker_hit_ratio:.2f}"
    img_ratio = "n/a" if quality.image_heavy_ratio is None else f"{quality.image_heavy_ratio:.2f}"
    img_pages_ratio = "n/a" if quality.image_page_ratio is None else f"{quality.image_page_ratio:.2f}"
    LOGGER.info(
        "Text-layer check: %s (avg_chars=%.1f, alpha_ratio=%.2f, suspicious=%.2f, dict=%s, spell=%s, img=%s, img_pages=%s)",
        has_text_layer,
        quality.avg_chars_per_page,
        quality.alpha_ratio,
        quality.suspicious_token_ratio,
        dict_ratio,
        spell_ratio,
        img_ratio,
        img_pages_ratio,
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
    ocr_engine_used = decision.ocr_engine
    external_ocr_used = False
    # Always allow external OCR if selected, even when the PDF was rasterized for Docling,
    # so we can prefer column-aware ordering from Paddle/Tesseract when desired.
    if decision.ocr_used and decision.use_external_ocr:
        ocr_dpi = config.ocr_overlay_dpi if text_layer_overlay else config.ocr_dpi
        if ocr_dpi != config.ocr_dpi:
            LOGGER.info("External OCR DPI bumped for overlay: %d -> %d", config.ocr_dpi, ocr_dpi)
        try:
            ocr_pages, ocr_stats = run_external_ocr_pages(
                pdf_path,
                decision.ocr_engine,
                languages,
                config,
                dpi=ocr_dpi,
                progress_cb=emit,
                progress_base=70,
                progress_span=20,
            )
            if ocr_pages:
                ocr_text_chars = ocr_pages_text_chars(ocr_pages)
                if ocr_text_chars > 0:
                    pages = ocr_pages
                    external_ocr_used = True
                    if config.postprocess_markdown and not markdown.strip():
                        markdown = "\\n\\n".join(page.get("text", "") for page in ocr_pages)
                else:
                    ocr_stats = {}
                    LOGGER.warning(
                        "External OCR returned empty text (%s). Keeping Docling text.",
                        decision.ocr_engine,
                    )
        except Exception as exc:
            LOGGER.warning("External OCR failed (%s): %s", decision.ocr_engine, exc)
            if decision.ocr_engine != "tesseract" and "tesseract" in available_engines:
                try:
                    LOGGER.info("Retrying external OCR with tesseract.")
                    ocr_pages, ocr_stats = run_external_ocr_pages(
                        pdf_path,
                        "tesseract",
                        languages,
                        config,
                        dpi=ocr_dpi,
                        progress_cb=emit,
                        progress_base=70,
                        progress_span=20,
                    )
                    if ocr_pages:
                        ocr_text_chars = ocr_pages_text_chars(ocr_pages)
                        if ocr_text_chars > 0:
                            pages = ocr_pages
                            ocr_engine_used = "tesseract"
                            external_ocr_used = True
                            if config.postprocess_markdown and not markdown.strip():
                                markdown = "\\n\\n".join(page.get("text", "") for page in ocr_pages)
                        else:
                            ocr_stats = {}
                            LOGGER.warning(
                                "External OCR returned empty text (tesseract). Keeping Docling text."
                            )
                except Exception as exc2:
                    LOGGER.warning("External OCR failed (tesseract): %s", exc2)
    if rasterized_source and rasterized_pdf_path:
        try:
            os.unlink(rasterized_pdf_path)
        except Exception:
            pass

    fallback_engine: Optional[str] = None
    if not has_output_text(markdown, pages):
        LOGGER.warning("Docling output empty; attempting OCR fallback.")
        fallback_dpi = config.ocr_overlay_dpi if text_layer_overlay else config.ocr_dpi
        fallback_engines: List[str] = []
        if "tesseract" in available_engines and ocr_engine_used != "tesseract":
            fallback_engines.append("tesseract")
        if "paddle" in available_engines and ocr_engine_used != "paddle":
            fallback_engines.append("paddle")
        for engine in fallback_engines:
            try:
                fallback_pages, fallback_stats = run_external_ocr_pages(
                    pdf_path,
                    engine,
                    languages,
                    config,
                    dpi=fallback_dpi,
                )
                if ocr_pages_text_chars(fallback_pages) > 0:
                    pages = fallback_pages
                    markdown = "\\n\\n".join(page.get("text", "") for page in pages)
                    external_ocr_used = True
                    ocr_engine_used = engine
                    ocr_stats = fallback_stats
                    fallback_engine = engine
                    LOGGER.warning("External OCR fallback succeeded with %s.", engine)
                    break
                LOGGER.warning("External OCR fallback returned empty text (%s).", engine)
            except Exception as exc:
                LOGGER.warning("External OCR fallback failed (%s): %s", engine, exc)
        if not has_output_text(markdown, pages):
            fallback_pages = extract_pages_from_pdf(pdf_path)
            if ocr_pages_text_chars(fallback_pages) > 0:
                pages = fallback_pages
                markdown = "\\n\\n".join(page.get("text", "") for page in pages)
                external_ocr_used = False
                ocr_stats = dict(ocr_stats)
                ocr_stats["text_layer_fallback"] = True
                fallback_engine = "text_layer"
                LOGGER.warning("Text-layer fallback succeeded after empty output.")

    emit(90, "chunking", "Building chunks")
    metadata = {
        "ocr_used": decision.ocr_used,
        "ocr_engine": ocr_engine_used,
        "external_ocr_used": external_ocr_used,
        "languages": decision.languages,
        "route_reason": decision.route_reason,
        "per_page_reason": decision.per_page_reason,
        "text_layer_detected": has_text_layer,
        "text_layer_low_quality": has_text_layer and low_quality,
        "text_layer_overlay": text_layer_overlay,
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
        "spellchecker_hit_ratio": quality.spellchecker_hit_ratio,
        "image_heavy_ratio": quality.image_heavy_ratio,
        "image_page_ratio": quality.image_page_ratio,
        "per_page_ocr": decision.per_page_ocr,
    }
    if fallback_engine:
        metadata["output_fallback"] = fallback_engine
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
    postprocess: Optional[Callable[[str, Optional[str]], str]] = None,
) -> List[Dict[str, Any]]:
    chunks: List[Dict[str, Any]] = []
    total_pages = len(pages)
    for page in pages:
        raw_text = str(page.get("text", ""))
        if postprocess:
            page_num = int(page.get("page_num", 0))
            raw_text = postprocess(raw_text, f"page {page_num}/{total_pages}")
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
    postprocess: Optional[Callable[[str, Optional[str]], str]] = None,
) -> List[Dict[str, Any]]:
    sections = split_markdown_sections(markdown)
    chunks: List[Dict[str, Any]] = []
    seen_ids: Dict[str, int] = {}

    if not sections:
        return build_chunks_page(doc_id, pages, config=config)

    total_sections = len(sections)
    for idx, section in enumerate(sections, start=1):
        title = section.get("title", "")
        text = section.get("text", "")
        if postprocess:
            text = postprocess(text, f"section {idx}/{total_sections}")
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
        "--paddle-structure-v3",
        dest="paddle_structure_v3",
        action="store_true",
        default=None,
        help="Use PP-StructureV3 layout parsing for Paddle OCR",
    )
    parser.add_argument(
        "--no-paddle-structure-v3",
        dest="paddle_structure_v3",
        action="store_false",
        default=None,
        help="Disable PP-StructureV3 layout parsing for Paddle OCR",
    )
    parser.add_argument(
        "--paddle-structure-version",
        help="Override Paddle PP-Structure version (e.g., PP-StructureV3)",
    )
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
    if args.paddle_structure_v3 is not None:
        config.paddle_use_structure_v3 = args.paddle_structure_v3
    if args.paddle_structure_version:
        config.paddle_structure_version = args.paddle_structure_version
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

    config.llm_correct = build_llm_cleanup_callback(config)

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

    progress_cb = make_progress_emitter(bool(args.progress))

    try:
        conversion = convert_pdf_with_docling(args.pdf, config, progress_cb=progress_cb)
    except Exception as exc:
        eprint(f"Docling conversion failed: {exc}")
        return 2

    try:
        pages = conversion.pages
        original_pages = pages
        languages = conversion.metadata.get("languages", config.default_lang_english)
        postprocess_fn: Optional[Callable[[str, Optional[str]], str]] = None
        ocr_used = bool(conversion.metadata.get("ocr_used"))
        should_postprocess = config.enable_post_correction and ocr_used
        if should_postprocess:
            wordlist = prepare_dictionary_words(config)
            allow_missing_space = ocr_used
            def safe_postprocess(text: str, label: Optional[str]) -> str:
                processed = postprocess_text(
                    text,
                    config,
                    languages,
                    wordlist,
                    allow_missing_space=allow_missing_space,
                    progress_cb=progress_cb,
                    progress_label=label,
                )
                if text.strip() and not processed.strip():
                    LOGGER.warning("Postprocess removed all text for %s; keeping original.", label or "text")
                    return text
                return processed

            postprocess_fn = lambda text, label=None: safe_postprocess(text, label)

        if postprocess_fn:
            total_pages = len(pages)
            updated_pages: List[Dict[str, Any]] = []
            for idx, page in enumerate(pages, start=1):
                label = f"page {idx}/{total_pages}"
                updated_pages.append({
                    "page_num": page.get("page_num", idx),
                    "text": postprocess_fn(str(page.get("text", "")), label),
                })
            pages = updated_pages
            if ocr_pages_text_chars(pages) == 0 and ocr_pages_text_chars(original_pages) > 0:
                LOGGER.warning("Postprocess removed all page text; keeping original pages.")
                pages = original_pages

        markdown = conversion.markdown
        original_markdown = markdown
        if config.enable_post_correction and config.postprocess_markdown and should_postprocess:
            wordlist = prepare_dictionary_words(config)
            allow_missing_space = ocr_used
            if progress_cb:
                progress_cb(100, "postprocess_markdown", "Postprocess markdown...")
            processed_markdown = postprocess_text(
                markdown,
                config,
                languages,
                wordlist,
                allow_missing_space=allow_missing_space,
                progress_cb=progress_cb,
                progress_label="markdown",
            )
            if original_markdown.strip() and not processed_markdown.strip():
                LOGGER.warning("Postprocess removed all markdown; keeping original.")
                markdown = original_markdown
            else:
                markdown = processed_markdown

        repeated_clusters: List[BoilerplateCluster] = []
        external_ocr_used = bool(conversion.metadata.get("external_ocr_used"))
        if config.enable_boilerplate_removal and not external_ocr_used:
            pre_boilerplate_pages = pages
            pre_boilerplate_markdown = markdown
            pages, repeated_clusters, _ = remove_boilerplate_from_pages(pages, config)
            markdown = remove_boilerplate_from_markdown(markdown, repeated_clusters, config)
            if not has_output_text(markdown, pages) and has_output_text(pre_boilerplate_markdown, pre_boilerplate_pages):
                LOGGER.warning("Boilerplate removal removed all text; keeping original.")
                pages = pre_boilerplate_pages
                markdown = pre_boilerplate_markdown

        if external_ocr_used:
            markdown = "\\n\\n".join(page.get("text", "") for page in pages)

        if not markdown.strip():
            LOGGER.warning("Markdown empty; rebuilding from %d pages", len(pages))
            markdown = "\\n\\n".join(str(page.get("text", "")) for page in pages)

        if not has_output_text(markdown, pages):
            eprint("Extraction produced empty output after fallback attempts.")
            return 2

        LOGGER.info("Docling output: pages=%d, markdown_chars=%d", len(pages), len(markdown))

        try:
            with open(args.out_md, "w", encoding="utf-8") as handle:
                handle.write(markdown)
        except Exception as exc:
            eprint(f"Failed to write markdown: {exc}")
            return 2

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
# zotero-redisearch-rag tool version: 0.2.5
import argparse
import json
import os
import sys
from typing import Any, Dict, List, Optional, Tuple

from utils_embedding import normalize_vector, vector_to_bytes, request_embedding
import redis


def eprint(message: str) -> None:
    sys.stderr.write(message + "\\n")


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
        "attachment_key",
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

    attachment_key = None
    try:
        meta = payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {}
        key_val = meta.get("attachment_key") if isinstance(meta, dict) else None
        if isinstance(key_val, str) and key_val.strip():
            attachment_key = key_val.strip()
    except Exception:
        attachment_key = None

    client = redis.Redis.from_url(args.redis_url, decode_responses=False)

    # Delete all existing chunk keys for this doc_id before indexing
    pattern = f"{args.prefix}{doc_id}:*"
    deleted = 0
    try:
        batch: List[bytes] = []
        for key in client.scan_iter(match=pattern, count=500):
            batch.append(key)
            if len(batch) >= 500:
                client.delete(*batch)
                deleted += len(batch)
                batch = []
        if batch:
            client.delete(*batch)
            deleted += len(batch)
        if deleted:
            eprint(f"Deleted {deleted} existing chunk keys for doc_id {doc_id}")
    except Exception as exc:
        eprint(f"Failed to delete old chunk keys for doc_id {doc_id}: {exc}")

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
            if args.progress:
                print(
                    json.dumps(
                        {
                            "type": "progress",
                            "stage": "embedding",
                            "current": current,
                            "total": total,
                            "message": f"Embedding chunk {current}/{total}",
                        }
                    ),
                    flush=True,
                )
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
            print(
                json.dumps(
                    {
                        "type": "progress",
                        "stage": "index",
                        "current": current,
                        "total": total,
                        "message": f"Indexing chunks {current}/{total}",
                    }
                ),
                flush=True,
            )

    return 0


if __name__ == "__main__":
    sys.exit(main())
`,"ocr_layered_pdf.py":`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.2.5
import argparse
import io
import json
import os
import shutil
import sys

from typing import Optional

from pdf2image import convert_from_path
from pypdf import PdfReader, PdfWriter
import pytesseract


def eprint(message: str) -> None:
    sys.stderr.write(message + "\\n")


def emit_progress(current: int, total: int) -> None:
    print(json.dumps({"type": "progress", "current": current, "total": total}), flush=True)


def resolve_poppler_path(explicit: Optional[str]) -> Optional[str]:
    if explicit:
        return explicit
    if shutil.which("pdfinfo") or shutil.which("pdftoppm"):
        return None
    for candidate in ("/opt/homebrew/bin", "/usr/local/bin"):
        if os.path.isfile(os.path.join(candidate, "pdfinfo")) or os.path.isfile(
            os.path.join(candidate, "pdftoppm")
        ):
            return candidate
    return None


def resolve_tesseract_path(explicit: Optional[str]) -> Optional[str]:
    if explicit:
        return explicit
    found = shutil.which("tesseract")
    if found:
        return found
    for candidate in ("/opt/homebrew/bin/tesseract", "/usr/local/bin/tesseract", "/usr/bin/tesseract"):
        if os.path.isfile(candidate):
            return candidate
    return None


def get_page_count(pdf_path: str) -> int:
    try:
        reader = PdfReader(pdf_path)
        return len(reader.pages)
    except Exception:
        return 0


def ocr_page_to_pdf(image, language: str) -> Optional[bytes]:
    try:
        return pytesseract.image_to_pdf_or_hocr(image, extension="pdf", lang=language)
    except Exception as exc:
        eprint(f"Tesseract OCR failed: {exc}")
        return None


def main() -> int:
    parser = argparse.ArgumentParser(description="Create a PDF with an OCR text layer via Tesseract.")
    parser.add_argument("--pdf", required=True, help="Input PDF path")
    parser.add_argument("--out-pdf", required=True, help="Output PDF path")
    parser.add_argument("--language", default="eng", help="Tesseract language code, e.g. eng, deu+eng")
    parser.add_argument("--dpi", type=int, default=300, help="Rasterization DPI")
    parser.add_argument("--poppler-path", help="Optional poppler bin path (pdfinfo/pdftoppm)")
    parser.add_argument("--tesseract-path", help="Optional tesseract binary path")
    parser.add_argument("--progress", action="store_true", help="Emit JSON progress events")
    args = parser.parse_args()

    if not os.path.isfile(args.pdf):
        eprint(f"PDF not found: {args.pdf}")
        return 2

    out_dir = os.path.dirname(args.out_pdf)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    poppler_path = resolve_poppler_path(args.poppler_path)
    if poppler_path:
        eprint(f"Poppler not on PATH; using {poppler_path}")
    tesseract_path = resolve_tesseract_path(args.tesseract_path)
    if tesseract_path:
        pytesseract.pytesseract.tesseract_cmd = tesseract_path
        if not shutil.which("tesseract"):
            eprint(f"Tesseract not on PATH; using {tesseract_path}")

    total_pages = get_page_count(args.pdf)
    if total_pages <= 0:
        try:
            images = convert_from_path(args.pdf, dpi=args.dpi, poppler_path=poppler_path)
        except Exception as exc:
            eprint(f"Failed to rasterize PDF: {exc}")
            return 2
        total_pages = len(images)
        images_by_index = {idx + 1: img for idx, img in enumerate(images)}
    else:
        images_by_index = {}

    if total_pages == 0:
        eprint("No pages detected in PDF.")
        return 2

    writer = PdfWriter()
    language = (args.language or "eng").strip() or "eng"

    for page_idx in range(1, total_pages + 1):
        if page_idx in images_by_index:
            image = images_by_index[page_idx]
        else:
            try:
                images = convert_from_path(
                    args.pdf,
                    dpi=args.dpi,
                    first_page=page_idx,
                    last_page=page_idx,
                    poppler_path=poppler_path,
                )
            except Exception as exc:
                eprint(f"Failed to rasterize page {page_idx}: {exc}")
                return 2
            if not images:
                continue
            image = images[0]

        pdf_bytes = ocr_page_to_pdf(image, language)
        if not pdf_bytes:
            return 2
        try:
            reader = PdfReader(io.BytesIO(pdf_bytes))
            if reader.pages:
                writer.add_page(reader.pages[0])
        except Exception as exc:
            eprint(f"Failed to parse OCR page {page_idx}: {exc}")
            return 2

        if args.progress:
            emit_progress(page_idx, total_pages)

    try:
        with open(args.out_pdf, "wb") as handle:
            writer.write(handle)
    except Exception as exc:
        eprint(f"Failed to write output PDF: {exc}")
        return 2

    if args.progress:
        print(json.dumps({"type": "final", "output_pdf": args.out_pdf, "pages": total_pages}), flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
`,"rag_query_redisearch.py":`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.2.5

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
# zotero-redisearch-rag tool version: 0.2.5
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
# zotero-redisearch-rag tool version: 0.2.5
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
`,"ocr_wordlist.txt":`# zotero-redisearch-rag tool version: 0.2.5
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
`,"requirements.txt":`# zotero-redisearch-rag tool version: 0.2.5
docling
paddleocr
paddlepaddle==3.2.2
pdf2image
pypdf
pytesseract
redis
requests
pyzotero
tqdm
wordfreq

# Optional for language normalization and spellchecking
langcodes
# hunspell  # Disabled: fails to build on macOS/Python 3.13, use spylls fallback
spylls
`,"docker-compose.yml":`# zotero-redisearch-rag tool version: 0.2.5
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
`,"redis-stack.conf":`# zotero-redisearch-rag tool version: 0.2.5
# Redis Stack persistence config for local RAG index
appendonly yes
appendfsync everysec

dir /data
`};var R=require("obsidian"),G="zotero-redisearch-rag-chat",U=class extends R.ItemView{constructor(e,n){super(e);this.messages=[];this.activeSessionId="default";this.messageEls=new Map;this.pendingRender=new Map;this.busy=!1;this.plugin=n}getViewType(){return G}getDisplayText(){return"Zotero RAG Chat"}getIcon(){return"zrr-chat"}async onOpen(){let{containerEl:e}=this;e.empty(),e.addClass("zrr-chat-view");let n=e.createEl("div",{cls:"zrr-chat-header"});n.createEl("div",{cls:"zrr-chat-title",text:"Zotero RAG Chat"});let t=n.createEl("div",{cls:"zrr-chat-controls"}),i=t.createEl("div",{cls:"zrr-chat-controls-row"});this.sessionSelect=i.createEl("select",{cls:"zrr-chat-session"}),this.sessionSelect.addEventListener("change",async()=>{await this.switchSession(this.sessionSelect.value)});let r=t.createEl("div",{cls:"zrr-chat-controls-row zrr-chat-controls-actions"});this.renameButton=r.createEl("button",{cls:"zrr-chat-rename",text:"Rename",attr:{title:"Rename the current chat"}}),this.renameButton.addEventListener("click",async()=>{await this.promptRenameSession()}),this.copyButton=r.createEl("button",{cls:"zrr-chat-copy",text:"Copy",attr:{title:"Copy this chat to a new note"}}),this.copyButton.addEventListener("click",async()=>{await this.copyChatToNote()}),this.deleteButton=r.createEl("button",{cls:"zrr-chat-delete",text:"Delete",attr:{title:"Delete this chat"}}),this.deleteButton.addEventListener("click",async()=>{await this.deleteChat()}),this.newButton=r.createEl("button",{cls:"zrr-chat-new",text:"New chat",attr:{title:"Start a new chat session"}}),this.newButton.addEventListener("click",async()=>{await this.startNewChat()}),this.messagesEl=e.createEl("div",{cls:"zrr-chat-messages"});let s=e.createEl("div",{cls:"zrr-chat-input"});this.inputEl=s.createEl("textarea",{cls:"zrr-chat-textarea",attr:{placeholder:"Ask your Zotero library..."}}),this.sendButton=s.createEl("button",{cls:"zrr-chat-send",text:"Send"}),this.sendButton.addEventListener("click",()=>this.handleSend()),this.inputEl.addEventListener("keydown",a=>{a.key==="Enter"&&!a.shiftKey&&(a.preventDefault(),this.handleSend())}),await this.loadSessions(),await this.loadHistory(),await this.renderAll()}focusInput(){var e;(e=this.inputEl)==null||e.focus()}async loadHistory(){try{this.messages=await this.plugin.loadChatHistoryForSession(this.activeSessionId)}catch(e){console.error(e),this.messages=[]}}async saveHistory(){try{await this.plugin.saveChatHistoryForSession(this.activeSessionId,this.messages),await this.plugin.finalizeChatSessionNameIfNeeded(this.activeSessionId,this.messages),await this.loadSessions()}catch(e){console.error(e)}}async loadSessions(){let e=await this.plugin.listChatSessions();this.activeSessionId=await this.plugin.getActiveChatSessionId(),this.sessionSelect.empty();for(let n of e){let t=this.sessionSelect.createEl("option",{text:n.name});t.value=n.id,n.id===this.activeSessionId&&(t.selected=!0)}!e.some(n=>n.id===this.activeSessionId)&&e.length>0&&(this.activeSessionId=e[0].id,await this.plugin.setActiveChatSessionId(this.activeSessionId),this.sessionSelect.value=this.activeSessionId)}async promptRenameSession(){var i;let n=(await this.plugin.listChatSessions()).find(r=>r.id===this.activeSessionId);new ee(this.app,(i=n==null?void 0:n.name)!=null?i:"New chat",async r=>{await this.plugin.renameChatSession(this.activeSessionId,r),await this.loadSessions()}).open()}async startNewChat(){await this.plugin.saveChatHistoryForSession(this.activeSessionId,this.messages),await this.plugin.finalizeChatSessionNameIfNeeded(this.activeSessionId,this.messages,{force:!0});let e=await this.plugin.createChatSession("New chat");await this.switchSession(e,{skipSave:!0})}async deleteChat(){let e=await this.plugin.listChatSessions();if(e.length<=1){new R.Notice("You must keep at least one chat.");return}let n=e.find(i=>i.id===this.activeSessionId);if(!n)return;new ne(this.app,n.name,async()=>{await this.plugin.deleteChatSession(this.activeSessionId);let i=await this.plugin.getActiveChatSessionId();await this.switchSession(i,{skipSave:!0})}).open()}async switchSession(e,n={}){!e||e===this.activeSessionId||(n.skipSave||await this.saveHistory(),this.activeSessionId=e,await this.plugin.setActiveChatSessionId(e),await this.loadSessions(),await this.loadHistory(),await this.renderAll())}async renderAll(){this.messagesEl.empty(),this.messageEls.clear();for(let e of this.messages)await this.renderMessage(e);this.scrollToBottom()}async renderMessage(e){let n=this.messagesEl.createEl("div",{cls:`zrr-chat-message zrr-chat-${e.role}`});n.createEl("div",{cls:"zrr-chat-meta"}).setText(e.role==="user"?"You":"Assistant");let i=n.createEl("div",{cls:"zrr-chat-content"}),r=n.createEl("div",{cls:"zrr-chat-citations"});this.messageEls.set(e.id,{wrapper:n,content:i,citations:r}),await this.renderMessageContent(e)}scheduleRender(e){if(this.pendingRender.has(e.id))return;let n=window.setTimeout(async()=>{this.pendingRender.delete(e.id),await this.renderMessageContent(e),this.scrollToBottom()},80);this.pendingRender.set(e.id,n)}async renderMessageContent(e){var i,r,s;let n=this.messageEls.get(e.id);if(!n)return;let t=await this.plugin.formatInlineCitations(e.content||"",(i=e.citations)!=null?i:[],(r=e.retrieved)!=null?r:[]);n.content.dataset.lastRendered!==t&&(n.content.empty(),await R.MarkdownRenderer.renderMarkdown(t,n.content,"",this.plugin),this.hookInternalLinks(n.content),n.content.dataset.lastRendered=t),n.citations.empty(),await this.renderCitations(n.citations,(s=e.citations)!=null?s:[])}hookInternalLinks(e){let n=e.querySelectorAll("a.internal-link");for(let t of Array.from(n))t.dataset.zrrBound!=="1"&&(t.dataset.zrrBound="1",this.registerDomEvent(t,"click",i=>{i.preventDefault();let r=t.getAttribute("data-href")||t.getAttribute("href")||"";r&&this.plugin.openInternalLinkInMain(r)}))}async renderCitations(e,n){if(e.empty(),!n.length)return;let t=e.createEl("details",{cls:"zrr-chat-citations-details"});t.createEl("summary",{text:`Relevant context sources (${n.length})`,cls:"zrr-chat-citations-summary"});let i=t.createEl("ul",{cls:"zrr-chat-citation-list"});for(let r of n){let s=await this.plugin.resolveCitationDisplay(r),a=i.createEl("li");a.createEl("a",{text:s.noteTitle,href:"#"}).addEventListener("click",c=>{c.preventDefault(),s.notePath&&this.plugin.openNoteInMain(s.notePath)}),a.createEl("span",{text:", p. "}),a.createEl("a",{text:s.pageLabel,href:"#"}).addEventListener("click",c=>{if(c.preventDefault(),s.zoteroUrl){this.plugin.openExternalUrl(s.zoteroUrl);return}if(s.pdfPath){this.plugin.openPdfInMain(s.pdfPath,s.pageStart);return}this.plugin.openCitationTarget(r,s)})}}async copyChatToNote(){var i;let n=(await this.plugin.listChatSessions()).find(r=>r.id===this.activeSessionId),t=(i=n==null?void 0:n.name)!=null?i:"New chat";await this.plugin.createChatNoteFromSession(this.activeSessionId,t,this.messages)}scrollToBottom(){this.messagesEl.scrollTop=this.messagesEl.scrollHeight}async handleSend(){if(this.busy)return;let e=this.inputEl.value.trim();if(!e){new R.Notice("Query cannot be empty.");return}if(!this.plugin.settings.chatBaseUrl){new R.Notice("Chat base URL must be set in settings.");return}this.inputEl.value="",this.busy=!0,this.sendButton.disabled=!0;let n={id:this.generateId(),role:"user",content:e,createdAt:new Date().toISOString()};this.messages.push(n),await this.renderMessage(n),this.scrollToBottom(),await this.saveHistory();let t={id:this.generateId(),role:"assistant",content:"",citations:[],createdAt:new Date().toISOString()};this.messages.push(t),await this.renderMessage(t),this.scrollToBottom();let i=!1,r=this.plugin.getRecentChatHistory(this.messages.slice(0,-2));try{await this.plugin.runRagQueryStreaming(e,s=>{i=!0,t.content+=s,this.scheduleRender(t)},s=>{(!i&&(s!=null&&s.answer)||s!=null&&s.answer)&&(t.content=s.answer),Array.isArray(s==null?void 0:s.citations)&&(t.citations=s.citations),Array.isArray(s==null?void 0:s.retrieved)&&(t.retrieved=s.retrieved),this.scheduleRender(t)},r)}catch(s){console.error(s),t.content="Failed to fetch answer. See console for details.",this.scheduleRender(t)}finally{this.busy=!1,this.sendButton.disabled=!1,await this.saveHistory()}}generateId(){return typeof crypto!="undefined"&&"randomUUID"in crypto?crypto.randomUUID():`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}},ee=class extends R.Modal{constructor(p,e,n){super(p),this.initialValue=e,this.onSubmit=n}onOpen(){let{contentEl:p}=this;p.empty(),p.createEl("h3",{text:"Rename chat"});let e=this.initialValue;new R.Setting(p).setName("Name").addText(r=>{r.setValue(e),r.onChange(s=>{e=s})});let n=p.createEl("div");n.style.display="flex",n.style.gap="0.5rem",n.style.marginTop="1rem",n.createEl("button",{text:"Cancel"}).addEventListener("click",()=>this.close()),n.createEl("button",{text:"Save"}).addEventListener("click",()=>{let r=e.trim();if(!r){new R.Notice("Name cannot be empty.");return}this.close(),this.onSubmit(r)})}},ne=class extends R.Modal{constructor(p,e,n){super(p),this.chatName=e,this.onConfirm=n}onOpen(){let{contentEl:p}=this;p.empty(),p.createEl("h3",{text:"Delete chat"}),p.createEl("p",{text:`Delete "${this.chatName}"? This cannot be undone.`});let e=p.createEl("div");e.style.display="flex",e.style.gap="0.5rem",e.style.marginTop="1rem",e.createEl("button",{text:"Cancel"}).addEventListener("click",()=>this.close()),e.createEl("button",{text:"Delete"}).addEventListener("click",()=>{this.close(),this.onConfirm()})}};var de=[{label:"Auto (no hint)",value:""},{label:"English (en)",value:"en"},{label:"German (de)",value:"de"},{label:"German + English (de,en)",value:"de,en"},{label:"French (fr)",value:"fr"},{label:"Spanish (es)",value:"es"},{label:"Italian (it)",value:"it"},{label:"Dutch (nl)",value:"nl"},{label:"Portuguese (pt)",value:"pt"},{label:"Polish (pl)",value:"pl"},{label:"Swedish (sv)",value:"sv"},{label:"Other (custom ISO code)",value:"__custom__"}],pe={en:"eng",de:"deu",fr:"fra",es:"spa",it:"ita",nl:"nld",pt:"por",pl:"pol",sv:"swe"},ve=X["zrr-picker"],ke=X["zrr-chat"],Q=class extends d.Modal{constructor(p,e,n,t,i="Value cannot be empty."){super(p),this.titleText=e,this.placeholder=n,this.onSubmit=t,this.emptyMessage=i}onOpen(){let{contentEl:p}=this;p.empty(),p.createEl("h3",{text:this.titleText});let e=p.createEl("input",{type:"text",placeholder:this.placeholder});e.style.width="100%",e.focus();let n=p.createEl("button",{text:"Submit"});n.style.marginTop="0.75rem";let t=()=>{let i=e.value.trim();if(!i){new d.Notice(this.emptyMessage);return}this.close(),this.onSubmit(i)};n.addEventListener("click",t),e.addEventListener("keydown",i=>{i.key==="Enter"&&t()})}},Pe=C=>C.includes("STDERR")?"zrr-log-stderr":C.includes("ERROR")?"zrr-log-error":C.includes("WARNING")||C.includes("WARN")?"zrr-log-warning":C.includes("INFO")?"zrr-log-info":null,ue=C=>{let p=new V.RangeSetBuilder;for(let{from:e,to:n}of C.visibleRanges){let t=e;for(;t<=n;){let i=C.state.doc.lineAt(t),r=Pe(i.text);r&&p.add(i.from,i.from,M.Decoration.line({class:r})),t=i.to+1}}return p.finish()},Ce=M.EditorView.theme({".cm-scroller":{fontFamily:"var(--font-monospace)",fontSize:"0.85rem"},".zrr-log-error":{color:"var(--text-error)"},".zrr-log-warning":{color:"var(--text-accent)"},".zrr-log-info":{color:"var(--text-muted)"},".zrr-log-stderr":{color:"var(--text-accent)"}}),Se=M.ViewPlugin.fromClass(class{constructor(C){this.decorations=ue(C)}update(C){(C.docChanged||C.viewportChanged)&&(this.decorations=ue(C.view))}},{decorations:C=>C.decorations}),ie=class extends d.Modal{constructor(p,e,n){super(p),this.titleText=e,this.bodyText=n}onOpen(){let{contentEl:p}=this;p.empty(),this.modalEl&&(this.modalEl.style.width="80vw",this.modalEl.style.maxWidth="1200px",this.modalEl.style.height="80vh",this.modalEl.style.maxHeight="90vh",this.modalEl.style.resize="both",this.modalEl.style.overflow="auto"),p.style.display="flex",p.style.flexDirection="column",p.style.height="100%",p.createEl("h3",{text:this.titleText});let e=p.createDiv();e.style.flex="1",e.style.minHeight="0",e.style.border="1px solid var(--background-modifier-border)",e.style.borderRadius="6px";let n=V.EditorState.create({doc:this.bodyText,extensions:[Ce,Se,M.EditorView.editable.of(!0),V.EditorState.readOnly.of(!1),M.EditorView.lineWrapping]});this.editorView=new M.EditorView({state:n,parent:e})}onClose(){var p;(p=this.editorView)==null||p.destroy(),this.editorView=void 0}},re=class extends d.Modal{constructor(e,n,t){super(e);this.resolved=!1;this.filePath=n,this.onResolve=t}onOpen(){let{contentEl:e}=this;e.empty(),e.createEl("h3",{text:"Overwrite existing note?"}),e.createEl("p",{text:`This will overwrite: ${this.filePath}`});let n=e.createEl("div");n.style.display="flex",n.style.gap="0.5rem",n.style.marginTop="0.75rem";let t=n.createEl("button",{text:"Cancel"}),i=n.createEl("button",{text:"Overwrite"});t.addEventListener("click",()=>{this.resolved=!0,this.close(),this.onResolve(!1)}),i.addEventListener("click",()=>{this.resolved=!0,this.close(),this.onResolve(!0)})}onClose(){this.resolved||this.onResolve(!1)}},se=class extends d.SuggestModal{constructor(e,n){super(e);this.resolved=!1;this.resolveSelection=n,this.setPlaceholder("Select a language for OCR/quality...")}getSuggestions(e){let n=e.trim().toLowerCase();return n?de.filter(t=>t.label.toLowerCase().includes(n)||t.value.toLowerCase().includes(n)):de}renderSuggestion(e,n){n.setText(e.label),n.addEventListener("click",()=>this.handleSelection(e))}onChooseSuggestion(e){this.handleSelection(e)}onClose(){this.resolved||this.resolveSelection(null)}handleSelection(e){if(!this.resolved){if(this.resolved=!0,e.value==="__custom__"){this.close(),new Q(this.app,"Custom language hint","e.g., en, de, fr, de,en",n=>this.resolveSelection(n.trim()),"Language hint cannot be empty.").open();return}this.resolveSelection(e.value),this.close()}}},Y=class extends d.Plugin{constructor(){super(...arguments);this.docIndex=null;this.lastPythonEnvNotice=null;this.lastContainerNotice=null}async onload(){await this.loadSettings(),await this.migrateCachePaths(),this.addSettingTab(new K(this.app,this)),this.registerRibbonIcons(),this.registerView(G,e=>new U(e,this)),this.setupStatusBar(),this.registerNoteRenameHandler();try{await this.ensureBundledTools()}catch(e){console.error("Failed to sync bundled tools",e)}this.addCommand({id:"import-zotero-item-index",name:"Import Zotero item and index (Docling -> RedisSearch)",callback:()=>this.importZoteroItem()}),this.addCommand({id:"ask-zotero-library",name:"Ask my Zotero library (RAG via RedisSearch)",callback:()=>this.askZoteroLibrary()}),this.addCommand({id:"open-zotero-chat",name:"Open Zotero RAG chat panel",callback:()=>this.openChatView(!0)}),this.addCommand({id:"rebuild-zotero-note-cache",name:"Rebuild Zotero note from cache (Docling + RedisSearch)",callback:()=>this.rebuildNoteFromCache()}),this.addCommand({id:"rebuild-doc-index-cache",name:"Rebuild doc index from cache",callback:()=>this.rebuildDocIndexFromCache()}),this.addCommand({id:"recreate-missing-notes-cache",name:"Recreate missing notes from cache (Docling + RedisSearch)",callback:()=>this.recreateMissingNotesFromCache()}),this.addCommand({id:"reindex-redis-from-cache",name:"Reindex Redis from cached chunks",callback:()=>this.reindexRedisFromCache()}),this.addCommand({id:"start-redis-stack",name:"Start Redis Stack (Docker/Podman Compose)",callback:()=>this.startRedisStack()}),this.autoDetectContainerCliOnLoad(),this.settings.autoStartRedis&&this.startRedisStack(!0)}async loadSettings(){this.settings=Object.assign({},le,await this.loadData())}async saveSettings(){await this.saveData(this.settings)}async importZoteroItem(){var N,S,A;try{await this.ensureBundledTools()}catch(y){new d.Notice("Failed to sync bundled tools. See console for details."),console.error(y);return}let e;try{e=await this.promptZoteroItem()}catch(y){new d.Notice("Zotero search failed. See console for details."),console.error(y);return}if(!e){new d.Notice("No Zotero item selected.");return}let n=(N=e.data)!=null?N:e;!n.key&&e.key&&(n.key=e.key);let t=this.getDocId(n);if(!t){new d.Notice("Could not resolve a stable doc_id from Zotero item.");return}let i=await this.resolveLanguageHint(n,(S=e.key)!=null?S:n.key),r=this.buildDoclingLanguageHint(i!=null?i:void 0),s=await this.resolvePdfAttachment(n,t);if(!s){new d.Notice("No PDF attachment found for item.");return}this.showStatusProgress("Preparing...",5);let a=typeof n.title=="string"?n.title:"",o=await this.getDocIndexEntry(t);o&&new d.Notice("Item already indexed. Updating cached files and index.");let l=this.sanitizeFileName(a)||t;if(o!=null&&o.note_path)l=f.default.basename(o.note_path,".md")||l;else if(o!=null&&o.pdf_path){let y=this.toVaultRelativePath(o.pdf_path);y&&y.startsWith((0,d.normalizePath)(this.settings.outputPdfDir))&&(l=f.default.basename(y,".pdf")||l)}let c=o?l:await this.resolveUniqueBaseName(l,t),u=(0,d.normalizePath)(`${this.settings.outputPdfDir}/${c}.pdf`),_=(0,d.normalizePath)(`${$}/${t}.json`),h=(0,d.normalizePath)(`${F}/${t}.json`),m=this.app.vault.adapter,g=(0,d.normalizePath)(`${this.settings.outputNoteDir}/${c}.md`);if(o!=null&&o.note_path&&await m.exists(o.note_path)&&(g=(0,d.normalizePath)(o.note_path)),await m.exists(g)&&!await this.confirmOverwrite(g)){new d.Notice("Import canceled.");return}try{if(await this.ensureFolder($),await this.ensureFolder(F),await this.ensureFolder(this.settings.outputNoteDir),this.settings.copyPdfToVault&&await this.ensureFolder(this.settings.outputPdfDir),this.settings.enableFileLogging){let y=this.getLogFileRelativePath(),T=(0,d.normalizePath)(f.default.dirname(y));T&&await this.ensureFolder(T);let I=this.getSpellcheckerInfoRelativePath(),w=(0,d.normalizePath)(f.default.dirname(I));w&&await this.ensureFolder(w)}}catch(y){new d.Notice("Failed to create output folders."),console.error(y),this.clearStatusProgress();return}let b="",v="";try{if(this.settings.copyPdfToVault){let y=s.filePath?await D.promises.readFile(s.filePath):await this.downloadZoteroPdf(s.key);await this.app.vault.adapter.writeBinary(u,this.bufferToArrayBuffer(y)),b=this.getAbsoluteVaultPath(u)}else if(s.filePath)b=s.filePath;else{await this.ensureFolder(this.settings.outputPdfDir);let y=await this.downloadZoteroPdf(s.key);await this.app.vault.adapter.writeBinary(u,this.bufferToArrayBuffer(y)),b=this.getAbsoluteVaultPath(u),new d.Notice("Local PDF path unavailable; copied PDF into vault for processing.")}v=this.buildPdfLinkForNote(b,s.key,t)}catch(y){new d.Notice("Failed to download PDF attachment."),console.error(y),this.clearStatusProgress();return}try{await this.app.vault.adapter.write(_,JSON.stringify(e,null,2))}catch(y){new d.Notice("Failed to write Zotero item JSON."),console.error(y),this.clearStatusProgress();return}let P=this.getPluginDir(),k=f.default.join(P,"tools","docling_extract.py"),E=f.default.join(P,"tools","index_redisearch.py"),L=null;try{L=await this.readDoclingQualityLabelFromPdf(b,r),this.showStatusProgress(this.formatStatusLabel("Docling extraction...",L),0);let y=this.settings.enableFileLogging?this.getLogFileAbsolutePath():null;await this.runPythonStreaming(k,this.buildDoclingArgs(b,t,h,g,r,!0),w=>this.handleDoclingProgress(w,L),()=>{},y),L=await this.readDoclingQualityLabel(h),await this.annotateChunkJsonWithAttachmentKey(h,s.key);let T=await this.readDoclingMetadata(h),I=await this.maybeCreateOcrLayeredPdf(b,T,r);I&&(b=I,v=this.buildPdfLinkFromSourcePath(I),await this.updateChunkJsonSourcePdf(h,I))}catch(y){new d.Notice("Docling extraction failed. See console for details."),console.error(y),this.clearStatusProgress();return}try{this.showStatusProgress(this.formatStatusLabel("Indexing chunks...",L),0),await this.runPythonStreaming(E,["--chunks-json",this.getAbsoluteVaultPath(h),"--redis-url",this.settings.redisUrl,"--index",this.getRedisIndexName(),"--prefix",this.getRedisKeyPrefix(),"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--progress"],y=>{if((y==null?void 0:y.type)==="progress"&&y.total){let T=Math.round(y.current/y.total*100),I=typeof y.message=="string"&&y.message.trim()?y.message:`Indexing chunks ${y.current}/${y.total}`,w=this.formatStatusLabel(I,L);this.showStatusProgress(w,T)}},()=>{})}catch(y){new d.Notice("RedisSearch indexing failed. See console for details."),console.error(y),this.clearStatusProgress();return}try{let y=await this.app.vault.adapter.read(g),T=this.buildNoteMarkdown(n,(A=e.meta)!=null?A:{},t,v,_,y);await this.app.vault.adapter.write(g,T)}catch(y){new d.Notice("Failed to finalize note markdown."),console.error(y),this.clearStatusProgress();return}try{await this.updateDocIndex({doc_id:t,note_path:g,note_title:c,zotero_title:a,pdf_path:b,attachment_key:s.key})}catch(y){console.error("Failed to update doc index",y)}this.showStatusProgress("Done",100),window.setTimeout(()=>this.clearStatusProgress(),1200),new d.Notice(`Indexed Zotero item ${t}.`)}async askZoteroLibrary(){await this.openChatView(!0)}getChatLeaf(){var n;let e=this.app.workspace.getLeavesOfType(G);return e.length>0?e[0]:this.settings.chatPaneLocation==="right"?(n=this.app.workspace.getRightLeaf(!1))!=null?n:this.app.workspace.getLeaf("split"):this.app.workspace.getLeaf("tab")}async openChatView(e=!1){let n=this.getChatLeaf();await n.setViewState({type:G,active:!0}),this.app.workspace.revealLeaf(n);let t=n.view;return t instanceof U&&e&&t.focusInput(),t}async loadChatHistory(){let e=await this.getActiveChatSessionId();return this.loadChatHistoryForSession(e)}async saveChatHistory(e){let n=await this.getActiveChatSessionId();await this.saveChatHistoryForSession(n,e)}getChatSessionsDir(){return(0,d.normalizePath)(`${O}/chats`)}getChatExportDir(){let e=(this.settings.chatOutputDir||"").trim();return e?(0,d.normalizePath)(e):(0,d.normalizePath)("zotero/chats")}getChatSessionsIndexPath(){return(0,d.normalizePath)(`${this.getChatSessionsDir()}/index.json`)}getChatSessionPath(e){return(0,d.normalizePath)(`${this.getChatSessionsDir()}/${e}.json`)}async listChatSessions(){await this.migrateLegacyChatHistory();let e=this.app.vault.adapter,n=this.getChatSessionsIndexPath();if(!await e.exists(n)){let t=new Date().toISOString(),i=[{id:"default",name:"New chat",createdAt:t,updatedAt:t}];return await this.writeChatSessionsIndex({version:1,active:"default",sessions:i}),i}try{let t=await e.read(n),i=JSON.parse(t);return(Array.isArray(i==null?void 0:i.sessions)?i.sessions:[]).filter(s=>s&&typeof s.id=="string").map(s=>({id:String(s.id),name:typeof s.name=="string"&&s.name.trim()?s.name.trim():String(s.id),createdAt:typeof s.createdAt=="string"?s.createdAt:new Date().toISOString(),updatedAt:typeof s.updatedAt=="string"?s.updatedAt:new Date().toISOString()}))}catch(t){return console.warn("Failed to read chat sessions index",t),[]}}async getActiveChatSessionId(){await this.migrateLegacyChatHistory();let e=this.app.vault.adapter,n=this.getChatSessionsIndexPath();if(!await e.exists(n))return"default";try{let t=await e.read(n),i=JSON.parse(t);return(typeof(i==null?void 0:i.active)=="string"?i.active:"default")||"default"}catch(t){return"default"}}async setActiveChatSessionId(e){var s,a;await this.migrateLegacyChatHistory();let n=await this.readChatSessionsIndex(),t=((s=n.sessions)!=null?s:[]).some(o=>o.id===e),i=new Date().toISOString(),r=t?n.sessions:[...(a=n.sessions)!=null?a:[],{id:e,name:e,createdAt:i,updatedAt:i}];await this.writeChatSessionsIndex({version:1,active:e,sessions:r})}async createChatSession(e){var a;await this.migrateLegacyChatHistory();let n=this.generateChatId(),t=new Date().toISOString(),i=(e||"").trim()||"New chat",s=[...(a=(await this.readChatSessionsIndex()).sessions)!=null?a:[],{id:n,name:i,createdAt:t,updatedAt:t}];return await this.ensureFolder(this.getChatSessionsDir()),await this.app.vault.adapter.write(this.getChatSessionPath(n),JSON.stringify({version:1,messages:[]},null,2)),await this.writeChatSessionsIndex({version:1,active:n,sessions:s}),n}async renameChatSession(e,n){var s,a;await this.migrateLegacyChatHistory();let t=(n||"").trim();if(!t)return;let i=await this.readChatSessionsIndex(),r=((s=i.sessions)!=null?s:[]).map(o=>o.id===e?{...o,name:t}:o);await this.writeChatSessionsIndex({version:1,active:(a=i.active)!=null?a:"default",sessions:r})}async deleteChatSession(e){var a;if(await this.migrateLegacyChatHistory(),!e)return;let n=this.app.vault.adapter,t=await this.readChatSessionsIndex(),i=(a=t.sessions)!=null?a:[];if(i.length<=1)return;let r=i.filter(o=>o.id!==e);if(!r.length)return;let s=t.active===e?r[0].id:t.active;try{await n.remove(this.getChatSessionPath(e))}catch(o){console.warn("Failed to delete chat session file",o)}await this.writeChatSessionsIndex({version:1,active:s,sessions:r})}async loadChatHistoryForSession(e){await this.migrateLegacyChatHistory();let n=this.app.vault.adapter,t=this.getChatSessionPath(e||"default");if(!await n.exists(t))return[];let i=await n.read(t),r;try{r=JSON.parse(i)}catch(a){return[]}let s=Array.isArray(r)?r:r==null?void 0:r.messages;return Array.isArray(s)?s.filter(a=>a&&typeof a.content=="string").map(a=>({id:a.id||this.generateChatId(),role:a.role==="assistant"?"assistant":"user",content:a.content,citations:Array.isArray(a.citations)?a.citations:[],retrieved:Array.isArray(a.retrieved)?a.retrieved:[],createdAt:a.createdAt||new Date().toISOString()})):[]}async saveChatHistoryForSession(e,n){var l,c;await this.migrateLegacyChatHistory(),await this.ensureFolder(this.getChatSessionsDir());let t=this.app.vault.adapter,i=this.getChatSessionPath(e||"default"),r={version:1,messages:n};await t.write(i,JSON.stringify(r,null,2));let s=await this.readChatSessionsIndex(),a=new Date().toISOString(),o=((l=s.sessions)!=null?l:[]).map(u=>u.id===e?{...u,updatedAt:a}:u);await this.writeChatSessionsIndex({version:1,active:(c=s.active)!=null?c:e,sessions:o})}getRecentChatHistory(e){let n=Math.max(0,this.settings.chatHistoryMessages||0);return n?e.filter(i=>{var r;return i&&((r=i.content)==null?void 0:r.trim())}).slice(-n):[]}async readChatSessionsIndex(){let e=this.app.vault.adapter,n=this.getChatSessionsIndexPath(),t=new Date().toISOString();if(!await e.exists(n))return{version:1,active:"default",sessions:[{id:"default",name:"New chat",createdAt:t,updatedAt:t}]};try{let i=await e.read(n),r=JSON.parse(i),s=Array.isArray(r==null?void 0:r.sessions)?r.sessions:[];return{version:1,active:typeof(r==null?void 0:r.active)=="string"?r.active:"default",sessions:s.map(a=>({id:String(a.id),name:typeof a.name=="string"&&a.name.trim()?a.name.trim():String(a.id),createdAt:typeof a.createdAt=="string"?a.createdAt:t,updatedAt:typeof a.updatedAt=="string"?a.updatedAt:t}))}}catch(i){return console.warn("Failed to parse chat sessions index",i),{version:1,active:"default",sessions:[{id:"default",name:"New chat",createdAt:t,updatedAt:t}]}}}async writeChatSessionsIndex(e){await this.ensureFolder(this.getChatSessionsDir()),await this.app.vault.adapter.write(this.getChatSessionsIndexPath(),JSON.stringify(e,null,2))}async migrateLegacyChatHistory(){let e=this.app.vault.adapter,n=(0,d.normalizePath)(`${O}/chat.json`),t=this.getChatSessionsDir(),i=this.getChatSessionsIndexPath(),r=this.getChatSessionPath("default"),s=await e.exists(n),a=await e.exists(r),o=await e.exists(i);if(!s&&o)return;let l=new Date().toISOString();if(await this.ensureFolder(t),s&&!a)try{await e.rename(n,r)}catch(c){try{let u=await e.read(n);await e.write(r,u),await e.remove(n)}catch(u){console.warn("Failed to migrate legacy chat history",u)}}if(!o){let c=[{id:"default",name:"New chat",createdAt:l,updatedAt:l}];await this.writeChatSessionsIndex({version:1,active:"default",sessions:c})}if(o)try{let c=await e.read(i),u=JSON.parse(c),_=Array.isArray(u==null?void 0:u.sessions)?u.sessions:[],h=_.some(g=>(g==null?void 0:g.id)==="default"),m=_.map(g=>(g==null?void 0:g.id)==="default"&&typeof(g==null?void 0:g.name)=="string"&&g.name.trim().toLowerCase()==="default"?{...g,name:"New chat"}:g);h&&JSON.stringify(m)!==JSON.stringify(_)&&await this.writeChatSessionsIndex({version:1,active:typeof(u==null?void 0:u.active)=="string"?u.active:"default",sessions:m.map(g=>({id:String(g.id),name:typeof g.name=="string"?g.name:"New chat",createdAt:typeof g.createdAt=="string"?g.createdAt:l,updatedAt:typeof g.updatedAt=="string"?g.updatedAt:l}))})}catch(c){}}isPlaceholderChatName(e){let n=(e||"").trim().toLowerCase();return n==="new chat"||n==="default"}normalizeChatTitle(e){let n=(e||"").replace(/\s+/g," ").trim();return n.length>60?`${n.slice(0,57)}...`:n}guessTitleFromMessages(e){let n=e.find(i=>i.role==="user"&&i.content.trim());if(!n)return"New chat";let t=n.content.replace(/\s+/g," ").trim().split(" ").slice(0,8).join(" ");return this.normalizeChatTitle(t||"New chat")}async suggestChatTitleWithLlm(e){var i,r,s;let n=(this.settings.chatBaseUrl||"").trim(),t=(this.settings.chatModel||"").trim();if(!n||!t)return null;try{let a=`${n.replace(/\/$/,"")}/chat/completions`,o={"Content-Type":"application/json"};this.settings.chatApiKey&&(o.Authorization=`Bearer ${this.settings.chatApiKey}`);let l=e.slice(-8).map(m=>`${m.role.toUpperCase()}: ${m.content}`).join(`
`).slice(0,4e3),u=await fetch(a,{method:"POST",headers:o,body:JSON.stringify({model:t,temperature:.2,messages:[{role:"system",content:"Generate a short, specific title (3-7 words) for the chat. No quotes, no punctuation at the end."},{role:"user",content:l}]})});if(!u.ok)return null;let _=await u.json(),h=(s=(r=(i=_==null?void 0:_.choices)==null?void 0:i[0])==null?void 0:r.message)==null?void 0:s.content;return typeof h!="string"?null:this.normalizeChatTitle(h.replace(/^\"|\"$/g,"").trim())}catch(a){return console.warn("Chat title suggestion failed",a),null}}async finalizeChatSessionNameIfNeeded(e,n,t={}){var c;if(!e)return;let i=n||[];if(!i.some(u=>u.role==="user"&&u.content.trim())||!t.force&&i.length<4)return;let a=((c=(await this.readChatSessionsIndex()).sessions)!=null?c:[]).find(u=>u.id===e);if(!a||!this.isPlaceholderChatName(a.name))return;let l=await this.suggestChatTitleWithLlm(i)||this.guessTitleFromMessages(i);!l||this.isPlaceholderChatName(l)||await this.renameChatSession(e,l)}async runRagQueryStreaming(e,n,t,i=[]){await this.ensureBundledTools();let r=this.getPluginDir(),s=f.default.join(r,"tools","rag_query_redisearch.py"),a=["--query",e,"--k","5","--redis-url",this.settings.redisUrl,"--index",this.getRedisIndexName(),"--prefix",this.getRedisKeyPrefix(),"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--chat-base-url",this.settings.chatBaseUrl,"--chat-api-key",this.settings.chatApiKey,"--chat-model",this.settings.chatModel,"--temperature",String(this.settings.chatTemperature),"--stream"],o=this.buildChatHistoryPayload(i),l=await this.writeChatHistoryTemp(o);l!=null&&l.absolutePath&&a.push("--history-file",l.absolutePath);try{await this.runPythonStreaming(s,a,c=>{if((c==null?void 0:c.type)==="delta"&&typeof c.content=="string"){n(c.content);return}if((c==null?void 0:c.type)==="final"){t(c);return}c!=null&&c.answer&&t(c)},t)}finally{if(l!=null&&l.relativePath)try{await this.app.vault.adapter.remove(l.relativePath)}catch(c){console.warn("Failed to remove chat history temp file",c)}}}buildChatHistoryPayload(e){return this.getRecentChatHistory(e).map(t=>({role:t.role,content:t.content}))}async writeChatHistoryTemp(e){if(!e.length)return null;let n=(0,d.normalizePath)(`${O}/tmp`);await this.ensureFolder(n);let t=`chat_history_${Date.now()}_${Math.random().toString(36).slice(2,8)}.json`,i=(0,d.normalizePath)(`${n}/${t}`),r={version:1,messages:e};return await this.app.vault.adapter.write(i,JSON.stringify(r,null,2)),{relativePath:i,absolutePath:this.getAbsoluteVaultPath(i)}}async resolveCitationDisplay(e){var _,h;let n=await this.getDocIndexEntry(e.doc_id);(!n||!n.note_title||!n.zotero_title||!n.note_path||!n.pdf_path)&&(n=await this.hydrateDocIndexFromCache(e.doc_id));let t=e.doc_id?await this.resolveNotePathForDocId(e.doc_id):n==null?void 0:n.note_path,i=(n==null?void 0:n.zotero_title)||(n==null?void 0:n.note_title)||(t?f.default.basename(t,".md"):e.doc_id||"?"),r=e.pages||`${(_=e.page_start)!=null?_:"?"}-${(h=e.page_end)!=null?h:"?"}`,s=r.includes("-")?r.replace("-"," - "):r,a=e.page_start?String(e.page_start):"",o=(n==null?void 0:n.pdf_path)||e.source_pdf||"",l=e.attachment_key||(n==null?void 0:n.attachment_key),c=e.annotation_key||this.extractAnnotationKey(e.chunk_id),u=e.doc_id?this.buildZoteroDeepLink(e.doc_id,l,a,c):void 0;return this.settings.preferVaultPdfForCitations&&o&&this.toVaultRelativePath(o)&&(u=void 0),{noteTitle:i,pageLabel:s,notePath:t||void 0,pdfPath:o||void 0,zoteroUrl:u,pageStart:a||void 0}}async formatInlineCitations(e,n,t=[]){if(!e)return e;let i=/\[\[?cite:([A-Za-z0-9]+):([^\]\n]+?)\]?\]/g,r=Array.from(e.matchAll(i));if(r.length===0)return e;let s=new Map;for(let o of r){let l=o[0];if(s.has(l))continue;let c=o[1],u=o[2].trim(),_=u.match(/^(\d+)-(\d+)(?::([A-Za-z0-9]+))?$/),h="",m="",g,b;_?(h=_[1],m=_[2],g=_[3]):b=u;let v=b?t.find(S=>{let A=typeof S.doc_id=="string"?S.doc_id:"";if(A&&A!==c)return!1;let y=typeof S.chunk_id=="string"?S.chunk_id:"";return y?y===b||y===`${c}:${b}`||y.endsWith(`:${b}`):!1}):void 0;v&&(!h&&v.page_start!==void 0&&(h=String(v.page_start)),!m&&v.page_end!==void 0&&(m=String(v.page_end)),!g&&typeof v.chunk_id=="string"&&(g=this.extractAnnotationKey(v.chunk_id)));let P={doc_id:c,chunk_id:v==null?void 0:v.chunk_id,annotation_key:g};(h||m)&&(P.page_start=h||m,P.page_end=m||h,P.pages=`${P.page_start}-${P.page_end}`),v!=null&&v.source_pdf&&(P.source_pdf=String(v.source_pdf));let k=(h||m?n.find(S=>{var A,y;return S.doc_id===c&&String((A=S.page_start)!=null?A:"")===h&&String((y=S.page_end)!=null?y:"")===m}):void 0)||n.find(S=>S.doc_id===c)||P;!k.annotation_key&&g&&(k={...k,annotation_key:g});let E=await this.resolveCitationDisplay(k),L=`${E.noteTitle} p. ${E.pageLabel}`,N=this.settings.preferVaultPdfForCitations?this.buildVaultPdfCitationLink(E.pdfPath||"",E.pageStart,L):"";if(N)s.set(l,N);else if(E.zoteroUrl)s.set(l,`[${L}](${E.zoteroUrl})`);else{let S=E.pageLabel?`${c} p. ${E.pageLabel}`:`${c}`;s.set(l,`(${S})`)}}let a=e;for(let[o,l]of s)a=a.split(o).join(l);return a}handleDoclingProgress(e,n){if(!e||e.type!=="progress")return;let t=Number(e.percent);if(!Number.isFinite(t))return;let i=typeof e.message=="string"&&e.message.trim()?e.message:"Docling extraction...";this.showStatusProgress(this.formatStatusLabel(i,n),Math.round(t))}async createChatNoteFromSession(e,n,t){let i=this.getChatExportDir();await this.ensureFolder(i),await this.getDocIndex();let r=this.sanitizeFileName(n)||"Zotero Chat",s=this.formatTimestamp(new Date),a=(0,d.normalizePath)(`${i}/${r}.md`),o=await this.resolveUniqueNotePath(a,`${r}-${s}.md`),l=await this.buildChatTranscript(n,t);await this.app.vault.adapter.write(o,l),await this.openNoteInNewTab(o),new d.Notice(`Chat copied to ${o}`)}async buildChatTranscript(e,n){var i,r,s;let t=[];t.push(`# ${e||"Zotero Chat"}`),t.push(""),t.push(`Created: ${new Date().toISOString()}`),t.push("");for(let a of n){let o=a.role==="user"?"## You":"## Assistant";t.push(o),t.push("");let l=a.role==="assistant"?await this.formatInlineCitations(a.content||"",(i=a.citations)!=null?i:[],(r=a.retrieved)!=null?r:[]):a.content||"";if(t.push(l.trim()),t.push(""),a.role==="assistant"&&((s=a.citations)!=null&&s.length)){t.push("### Relevant context sources");let c=this.formatCitationsMarkdown(a.citations);c&&(t.push(c),t.push(""))}}return t.join(`
`).trim()+`
`}async resolveUniqueNotePath(e,n){let t=this.app.vault.adapter;if(!await t.exists(e))return e;let i=f.default.dirname(e),r=(0,d.normalizePath)(f.default.join(i,n));if(!await t.exists(r))return r;let s=2;for(;s<1e3;){let a=(0,d.normalizePath)(f.default.join(i,`${f.default.basename(n,".md")}-${s}.md`));if(!await t.exists(a))return a;s+=1}return r}formatTimestamp(e){let n=t=>String(t).padStart(2,"0");return[e.getFullYear(),n(e.getMonth()+1),n(e.getDate()),"-",n(e.getHours()),n(e.getMinutes())].join("")}async openCitationTarget(e,n){let t=n!=null?n:await this.resolveCitationDisplay(e);if(t.notePath){await this.openNoteInMain(t.notePath);return}if(!(t.pdfPath&&await this.openPdfInMain(t.pdfPath,t.pageStart))){if(t.zoteroUrl){this.openExternalUrl(t.zoteroUrl);return}new d.Notice("Unable to open citation target.")}}async rebuildNoteFromCache(){let e=await this.promptDocId();if(!e){new d.Notice("No doc_id provided.");return}await this.rebuildNoteFromCacheForDocId(e,!0)&&new d.Notice(`Rebuilt Zotero note for ${e}.`)}async rebuildDocIndexFromCache(){var l,c,u;let e=this.app.vault.adapter,n=await this.listDocIds($),t=await this.listDocIds(F),i=await this.scanNotesForDocIds(this.settings.outputNoteDir),r=Object.keys(i),s=Array.from(new Set([...n,...t,...r]));if(s.length===0){new d.Notice("No cached items found.");return}this.showStatusProgress("Rebuilding doc index...",0);let a=await this.getDocIndex(),o=0;for(let _ of s){o+=1;let h={},m=i[_];m&&(h.note_path=m.note_path,h.note_title=m.note_title);let g=(0,d.normalizePath)(`${$}/${_}.json`);if(await e.exists(g))try{let P=await e.read(g),k=JSON.parse(P),E=(c=(l=k==null?void 0:k.data)!=null?l:k)!=null?c:{},L=typeof E.title=="string"?E.title:"";L&&(h.zotero_title=L);let N=this.sanitizeFileName(L)||_,S=(0,d.normalizePath)(`${this.settings.outputNoteDir}/${N}.md`),A=(0,d.normalizePath)(`${this.settings.outputNoteDir}/${N}-${_}.md`);await e.exists(S)?(h.note_path=S,h.note_title=f.default.basename(S,".md")):await e.exists(A)&&(h.note_path=A,h.note_title=f.default.basename(A,".md"))}catch(P){console.error("Failed to read cached item JSON",P)}let b=(0,d.normalizePath)(`${F}/${_}.json`);if(await e.exists(b))try{let P=await e.read(b),k=JSON.parse(P);typeof(k==null?void 0:k.source_pdf)=="string"&&(h.pdf_path=k.source_pdf)}catch(P){console.error("Failed to read cached chunks JSON",P)}if(Object.keys(h).length>0){let k={...(u=a[_])!=null?u:{doc_id:_},...h,doc_id:_,updated_at:new Date().toISOString()};!k.note_title&&k.note_path&&(k.note_title=f.default.basename(k.note_path,".md")),a[_]=k}let v=Math.round(o/s.length*100);this.showStatusProgress(`Rebuilding doc index ${o}/${s.length}`,v)}await this.saveDocIndex(a),this.showStatusProgress("Done",100),window.setTimeout(()=>this.clearStatusProgress(),1200),new d.Notice(`Rebuilt doc index for ${s.length} items.`)}async recreateMissingNotesFromCache(){let e=this.app.vault.adapter,n=await this.listDocIds($),t=await this.listDocIds(F),i=await this.scanNotesForDocIds(this.settings.outputNoteDir),r=Object.keys(i),s=Array.from(new Set([...n,...t,...r]));if(s.length===0){new d.Notice("No cached items found.");return}let a=[];for(let l of s){if(i[l])continue;let c=await this.getDocIndexEntry(l);if(c!=null&&c.note_path&&await e.exists(c.note_path))continue;let u=await this.inferNotePathFromCache(l);u&&await e.exists(u)||a.push(l)}if(a.length===0){new d.Notice("No missing notes detected.");return}this.showStatusProgress("Recreating missing notes...",0);let o=0;for(let l=0;l<a.length;l+=1){let c=a[l],u=Math.round((l+1)/a.length*100);this.showStatusProgress(`Recreating ${l+1}/${a.length}`,u),await this.rebuildNoteFromCacheForDocId(c,!1)&&(o+=1)}this.showStatusProgress("Done",100),window.setTimeout(()=>this.clearStatusProgress(),1200),new d.Notice(`Recreated ${o}/${a.length} missing notes.`)}async reindexRedisFromCache(){try{await this.ensureBundledTools()}catch(s){new d.Notice("Failed to sync bundled tools. See console for details."),console.error(s);return}let e=await this.listDocIds(F);if(e.length===0){new d.Notice("No cached chunks found.");return}let n=this.getPluginDir(),t=f.default.join(n,"tools","index_redisearch.py"),i=0,r=0;this.showStatusProgress("Reindexing cached chunks...",0);for(let s of e){i+=1;let a=Math.round(i/e.length*100);this.showStatusProgress(`Reindexing ${i}/${e.length}`,a);let o=(0,d.normalizePath)(`${F}/${s}.json`);try{await this.runPython(t,["--chunks-json",this.getAbsoluteVaultPath(o),"--redis-url",this.settings.redisUrl,"--index",this.getRedisIndexName(),"--prefix",this.getRedisKeyPrefix(),"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--upsert"])}catch(l){r+=1,console.error(`Failed to reindex ${s}`,l)}}this.showStatusProgress("Done",100),window.setTimeout(()=>this.clearStatusProgress(),1200),r===0?new d.Notice(`Reindexed ${e.length} cached items.`):new d.Notice(`Reindexed ${e.length-r}/${e.length} items (see console).`)}async promptZoteroItem(){return new Promise(e=>{new ae(this.app,this,e).open()})}async listDocIds(e){let n=this.app.vault.adapter,t=(0,d.normalizePath)(e);return await n.exists(t)?(await n.list(t)).files.filter(r=>r.endsWith(".json")).map(r=>f.default.basename(r,".json")):[]}async listMarkdownFiles(e){let n=this.app.vault.adapter,t=(0,d.normalizePath)(e);if(!await n.exists(t))return[];let i=[t],r=[];for(;i.length>0;){let s=i.pop();if(!s)continue;let a=await n.list(s);for(let o of a.files)o.endsWith(".md")&&r.push(o);for(let o of a.folders)i.push(o)}return r}extractDocIdFromFrontmatter(e){let n=e.match(/^---\s*\n([\s\S]*?)\n---/);if(!n)return null;let i=n[1].split(/\r?\n/);for(let r of i){let s=r.trim();if(!s||s.startsWith("#"))continue;let a=s.split(":");if(a.length<2)continue;let o=a[0].trim().toLowerCase();if(o!=="doc_id"&&o!=="zotero_key")continue;let c=s.slice(s.indexOf(":")+1).trim().replace(/^["']|["']$/g,"").trim();if(c)return c}return null}async scanNotesForDocIds(e){let n=this.app.vault.adapter,t=await this.listMarkdownFiles(e),i={};for(let r of t)try{let s=await n.read(r),a=this.extractDocIdFromFrontmatter(s);if(!a)continue;i[a]={doc_id:a,note_path:r,note_title:f.default.basename(r,".md"),updated_at:new Date().toISOString()}}catch(s){console.error("Failed to read note for doc_id scan",s)}return i}setupStatusBar(){let e=this.addStatusBarItem();e.addClass("zrr-status-progress"),e.addClass("status-bar-item-segment"),e.style.display="none";let n=e.createEl("span",{text:"Idle"});n.addClass("zrr-status-label");let i=e.createEl("div",{cls:"zrr-status-bar"}).createEl("div",{cls:"zrr-status-bar-inner"});this.statusBarEl=e,this.statusLabelEl=n,this.statusBarInnerEl=i}showStatusProgress(e,n){if(!(!this.statusBarEl||!this.statusLabelEl||!this.statusBarInnerEl))if(this.statusBarEl.style.display="flex",this.statusLabelEl.setText(e),n===null)this.statusBarInnerEl.addClass("indeterminate"),this.statusBarInnerEl.style.width="40%";else{this.statusBarInnerEl.removeClass("indeterminate");let t=Math.max(0,Math.min(100,n));this.statusBarInnerEl.style.width=`${t}%`}}clearStatusProgress(){!this.statusBarEl||!this.statusBarInnerEl||(this.statusBarEl.style.display="none",this.statusBarInnerEl.removeClass("indeterminate"),this.statusBarInnerEl.style.width="0%")}formatStatusLabel(e,n){return n?`${e} (Text layer quality ${n})`:e}async readDoclingQualityLabel(e){var n;try{let t=await this.app.vault.adapter.read(e),i=JSON.parse(t),r=(n=i==null?void 0:i.metadata)==null?void 0:n.confidence_proxy;if(typeof r=="number")return r.toFixed(2)}catch(t){console.warn("Failed to read Docling quality metadata",t)}return null}async readDoclingMetadata(e){try{let n=await this.app.vault.adapter.read(e),t=JSON.parse(n),i=t==null?void 0:t.metadata;if(i&&typeof i=="object")return i}catch(n){console.warn("Failed to read Docling metadata",n)}return null}async readDoclingQualityLabelFromPdf(e,n){try{let t=this.getPluginDir(),i=f.default.join(t,"tools","docling_extract.py"),r=this.settings.ocrMode==="force_low_quality"?"auto":this.settings.ocrMode,s=["--quality-only","--pdf",e,"--ocr",r],a=this.settings.enableFileLogging?this.getLogFileAbsolutePath():null;a&&s.push("--log-file",a),this.settings.ocrMode==="force_low_quality"&&s.push("--force-ocr-low-quality"),s.push("--quality-threshold",String(this.settings.ocrQualityThreshold)),n&&s.push("--language-hint",n);let o=await this.runPythonWithOutput(i,s,a),l=JSON.parse(o),c=l==null?void 0:l.confidence_proxy;if(typeof c=="number")return c.toFixed(2)}catch(t){console.warn("Failed to read Docling quality from PDF",t)}return null}async promptDocId(){return new Promise(e=>{new Q(this.app,"Rebuild Zotero note from cache","Enter Zotero doc_id (e.g., ABC123)",n=>e(n),"Doc ID cannot be empty.").open()})}async promptLanguageHint(){return new Promise(e=>{new se(this.app,e).open()})}registerRibbonIcons(){(0,d.addIcon)("zrr-picker",ve),(0,d.addIcon)("zrr-chat",ke),this.addRibbonIcon("zrr-picker","Import Zotero item and index",()=>this.importZoteroItem()).addClass("zrr-ribbon-picker"),this.addRibbonIcon("zrr-chat","Open Zotero RAG chat",()=>this.openChatView(!0)).addClass("zrr-ribbon-chat")}async confirmOverwrite(e){return new Promise(n=>{new re(this.app,e,n).open()})}async resolveLanguageHint(e,n){let t=typeof e.language=="string"?e.language:"",i=this.normalizeZoteroLanguage(t);if(i)return i;let r=await this.promptLanguageHint();if(r===null)return console.info("Language selection canceled."),null;let s=this.normalizeZoteroLanguage(r);if(!s)return console.info("Language selection empty; skipping Zotero update."),"";if(e.language=s,console.info("Language selected",{language:s,itemKey:n}),n)try{await this.updateZoteroItemLanguage(n,e,s),new d.Notice("Saved language to Zotero.")}catch(a){new d.Notice("Failed to write language back to Zotero."),console.error(a)}else console.warn("Language selected but itemKey is missing; skipping Zotero update.");return s}normalizeZoteroLanguage(e){return(e||"").trim().toLowerCase()}buildDoclingLanguageHint(e){let n=this.normalizeZoteroLanguage(e!=null?e:"");if(!n)return null;let t=n.split(/[^a-z]+/).filter(Boolean),i=t.some(s=>["de","deu","ger","german"].includes(s)),r=t.some(s=>["en","eng","english"].includes(s));return i&&r?"deu+eng":i?"deu":r?"eng":t.length===1&&pe[t[0]]?pe[t[0]]:n}async fetchZoteroItem(e){try{let n=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}`),t=await this.requestLocalApi(n,`Zotero item fetch failed for ${n}`);return JSON.parse(t.toString("utf8"))}catch(n){return console.warn("Failed to fetch Zotero item from local API",n),this.canUseWebApi()?this.fetchZoteroItemWeb(e):null}}async fetchZoteroItemWeb(e){try{let n=this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/items/${e}`),t=await this.requestWebApi(n,`Zotero Web API fetch failed for ${n}`);return JSON.parse(t.toString("utf8"))}catch(n){return console.warn("Failed to fetch Zotero item from Web API",n),null}}async searchZoteroItemsWeb(e){let n=new URLSearchParams;n.set("itemType","-attachment"),n.set("limit","25"),n.set("include","data,meta"),e.trim()&&n.set("q",e.trim());let t=this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/items?${n.toString()}`),i=await this.requestWebApi(t,`Zotero Web API search failed for ${t}`),r=JSON.parse(i.toString("utf8"));return Array.isArray(r)?r.map(s=>{var a,o,l,c;return{key:(o=s.key)!=null?o:(a=s.data)==null?void 0:a.key,data:(l=s.data)!=null?l:{},meta:(c=s.meta)!=null?c:{}}}).filter(s=>typeof s.key=="string"&&s.key.trim().length>0):[]}async updateZoteroItemLanguage(e,n,t){try{await this.updateZoteroItemLanguageLocal(e,n,t);return}catch(i){if(!this.canUseWebApi())throw i;let r=i instanceof Error?i.message:String(i);console.info("Local Zotero write failed; trying Web API",{itemKey:e,reason:r}),await this.updateZoteroItemLanguageWeb(e,n,t)}}async updateZoteroItemLanguageLocal(e,n,t){var v,P,k,E,L,N;let i=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}`),r={...n,language:t},s={"Content-Type":"application/json","Zotero-API-Version":"3"},a=typeof r.version=="number"?r.version:Number(r.version);Number.isNaN(a)||(s["If-Unmodified-Since-Version"]=String(a)),console.info("Zotero language PUT",{url:i,itemKey:e,language:t});try{let S=await this.requestLocalApiWithBody(i,"PUT",r,s,`Zotero update failed for ${i}`);console.info("Zotero language PUT response",{status:S.statusCode})}catch(S){if(!(S instanceof Error?S.message:String(S)).includes("status 501"))throw S;let y=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items`);console.info("Zotero language PUT unsupported; trying POST",{postUrl:y});let T=await this.requestLocalApiWithBody(y,"POST",[r],s,`Zotero update failed for ${y}`);console.info("Zotero language POST response",{status:T.statusCode})}let o=await this.fetchZoteroItem(e);if(this.normalizeZoteroLanguage(typeof((v=o==null?void 0:o.data)==null?void 0:v.language)=="string"?o.data.language:"")===this.normalizeZoteroLanguage(t))return;let c={...(P=o==null?void 0:o.data)!=null?P:n,language:t},u={key:e,version:(L=(E=(k=o==null?void 0:o.data)==null?void 0:k.version)!=null?E:o==null?void 0:o.version)!=null?L:a,data:c},_={...s},h=typeof u.version=="number"?u.version:Number(u.version);Number.isNaN(h)?delete _["If-Unmodified-Since-Version"]:_["If-Unmodified-Since-Version"]=String(h);let m=await this.requestLocalApiWithBody(i,"PUT",u,_,`Zotero update failed for ${i}`);console.info("Zotero language PUT retry response",{status:m.statusCode});let g=await this.fetchZoteroItem(e);if(this.normalizeZoteroLanguage(typeof((N=g==null?void 0:g.data)==null?void 0:N.language)=="string"?g.data.language:"")!==this.normalizeZoteroLanguage(t))throw new Error("Language update did not persist in Zotero.")}async updateZoteroItemLanguageWeb(e,n,t){var m,g,b,v,P;let i=this.getWebApiLibraryPath();if(!i)throw new Error("Web API library path is not configured.");let r=this.buildWebApiUrl(`/${i}/items/${e}`),s=await this.fetchZoteroItemWeb(e),a={...(m=s==null?void 0:s.data)!=null?m:n,language:t},o={"Content-Type":"application/json","Zotero-API-Version":"3","Zotero-API-Key":this.settings.webApiKey},l=(v=(b=(g=s==null?void 0:s.data)==null?void 0:g.version)!=null?b:s==null?void 0:s.version)!=null?v:n==null?void 0:n.version,c=typeof l=="number"?l:Number(l);Number.isNaN(c)||(o["If-Unmodified-Since-Version"]=String(c)),console.info("Zotero Web API language PUT",{url:r,itemKey:e,language:t});let u=await this.requestWebApiWithBody(r,"PUT",a,o,`Zotero Web API update failed for ${r}`);console.info("Zotero Web API language PUT response",{status:u.statusCode});let _=await this.fetchZoteroItemWeb(e);if(this.normalizeZoteroLanguage(typeof((P=_==null?void 0:_.data)==null?void 0:P.language)=="string"?_.data.language:"")!==this.normalizeZoteroLanguage(t))throw new Error("Language update did not persist in Zotero Web API.")}getDocId(e){let n=[e.key,e.itemKey,e.id,e.citationKey];for(let t of n)if(typeof t=="string"&&t.trim())return t.trim();return null}sanitizeFileName(e){let n=e.replace(/[\\/:*?"<>|]/g,"").replace(/\s+/g," ").trim();return n?n.replace(/[.]+$/g,"").trim().slice(0,120):""}registerNoteRenameHandler(){this.registerEvent(this.app.vault.on("rename",async e=>{if(!(!(e instanceof d.TFile)||e.extension!=="md"))try{let n=await this.app.vault.read(e),t=this.extractDocIdFromFrontmatter(n);if(!t)return;await this.updateDocIndex({doc_id:t,note_path:e.path,note_title:f.default.basename(e.path,".md")})}catch(n){console.warn("Failed to update doc index for renamed note",n)}}))}async resolveNotePathForDocId(e){if(!e)return null;let n=this.app.vault.adapter,t=await this.getDocIndexEntry(e);if(t!=null&&t.note_path&&await n.exists(t.note_path))return t.note_path;let r=(await this.scanNotesForDocIds(this.settings.outputNoteDir))[e];return r!=null&&r.note_path?(await this.updateDocIndex({doc_id:e,note_path:r.note_path,note_title:r.note_title}),r.note_path):null}async resolveUniqueBaseName(e,n){let t=this.app.vault.adapter,i=(0,d.normalizePath)(`${this.settings.outputNoteDir}/${e}.md`),r=(0,d.normalizePath)(`${this.settings.outputPdfDir}/${e}.pdf`),s=await t.exists(i),a=this.settings.copyPdfToVault?await t.exists(r):!1;return s||a?`${e}-${n}`:e}async searchZoteroItems(e){let n=new URLSearchParams;n.set("itemType","-attachment"),n.set("limit","25"),n.set("include","data,meta"),e.trim()&&n.set("q",e.trim());let t=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items?${n.toString()}`);try{let i=await this.requestLocalApi(t,`Zotero search failed for ${t}`),r=JSON.parse(i.toString("utf8"));return Array.isArray(r)?r.map(s=>{var a,o,l,c;return{key:(o=s.key)!=null?o:(a=s.data)==null?void 0:a.key,data:(l=s.data)!=null?l:{},meta:(c=s.meta)!=null?c:{}}}).filter(s=>typeof s.key=="string"&&s.key.trim().length>0):[]}catch(i){if(console.warn("Failed to search Zotero via local API",i),!this.canUseWebApi())throw i;return this.searchZoteroItemsWeb(e)}}async resolvePdfAttachment(e,n){let t=this.pickPdfAttachment(e);if(t)return t;try{let i=await this.fetchZoteroChildren(n);for(let r of i){let s=this.toPdfAttachment(r);if(s)return s}}catch(i){console.error("Failed to fetch Zotero children",i)}return null}pickPdfAttachment(e){var t,i,r;let n=(r=(i=(t=e.attachments)!=null?t:e.children)!=null?i:e.items)!=null?r:[];if(!Array.isArray(n))return null;for(let s of n){let a=this.toPdfAttachment(s);if(a)return a}return null}toPdfAttachment(e){var r,s,a,o,l,c;if(((a=(r=e==null?void 0:e.contentType)!=null?r:e==null?void 0:e.mimeType)!=null?a:(s=e==null?void 0:e.data)==null?void 0:s.contentType)!=="application/pdf")return null;let t=(c=(o=e==null?void 0:e.key)!=null?o:e==null?void 0:e.attachmentKey)!=null?c:(l=e==null?void 0:e.data)==null?void 0:l.key;if(!t)return null;let i=this.extractAttachmentPath(e);return i?{key:t,filePath:i}:{key:t}}extractAttachmentPath(e){var t,i,r,s,a,o,l,c;let n=(c=(s=(i=(t=e==null?void 0:e.links)==null?void 0:t.enclosure)==null?void 0:i.href)!=null?s:(r=e==null?void 0:e.enclosure)==null?void 0:r.href)!=null?c:(l=(o=(a=e==null?void 0:e.data)==null?void 0:a.links)==null?void 0:o.enclosure)==null?void 0:l.href;if(typeof n=="string"&&n.startsWith("file://"))try{return(0,Z.fileURLToPath)(n)}catch(u){return null}return null}async fetchZoteroChildren(e){let n=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}/children`);try{let t=await this.requestLocalApi(n,`Zotero children request failed for ${n}`);return JSON.parse(t.toString("utf8"))}catch(t){if(console.warn("Failed to fetch Zotero children from local API",t),!this.canUseWebApi())throw t;let i=this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/items/${e}/children`),r=await this.requestWebApi(i,`Zotero Web API children request failed for ${i}`);return JSON.parse(r.toString("utf8"))}}async downloadZoteroPdf(e){let n=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}/file`);try{let t=await this.requestLocalApiRaw(n),i=await this.followFileRedirect(t);if(i)return i;if(t.statusCode>=300)throw new Error(`Request failed, status ${t.statusCode}`);return t.body}catch(t){if(console.warn("Failed to download PDF from local API",t),!this.canUseWebApi())throw t;let i=this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/items/${e}/file`),r=await this.requestWebApiRaw(i),s=await this.followFileRedirect(r);if(s)return s;if(r.statusCode>=300)throw new Error(`Web API request failed, status ${r.statusCode}`);return r.body}}buildZoteroUrl(e){return`${this.settings.zoteroBaseUrl.replace(/\/$/,"")}${e}`}canUseWebApi(){return!!((this.settings.webApiBaseUrl||"").trim()&&this.settings.webApiKey&&this.settings.webApiLibraryId)}getWebApiLibraryPath(){let e=(this.settings.webApiLibraryId||"").trim();return e?`${this.settings.webApiLibraryType==="group"?"groups":"users"}/${e}`:""}buildWebApiUrl(e){return`${this.settings.webApiBaseUrl.replace(/\/$/,"")}${e}`}requestLocalApiRaw(e,n={}){return new Promise((t,i)=>{var u,_;let r=new URL(e),s=r.protocol==="https:"?_e.default:ge.default,a=(u=n.method)!=null?u:"GET",o={Accept:"*/*",...(_=n.headers)!=null?_:{}},l=n.body;if(l!==void 0&&o["Content-Length"]===void 0){let h=Buffer.isBuffer(l)?l.length:Buffer.byteLength(l);o["Content-Length"]=String(h)}let c=s.request({method:a,hostname:r.hostname,port:r.port||void 0,path:`${r.pathname}${r.search}`,headers:o},h=>{let m=[];h.on("data",g=>m.push(Buffer.from(g))),h.on("end",()=>{var b;let g=Buffer.concat(m);t({statusCode:(b=h.statusCode)!=null?b:0,headers:h.headers,body:g})})});c.on("error",i),l!==void 0&&c.write(l),c.end()})}async requestLocalApi(e,n){let t=await this.requestLocalApiRaw(e);if(t.statusCode>=400){let i=t.body.toString("utf8");throw new Error(`${n!=null?n:"Request failed"}, status ${t.statusCode}: ${i||"no response body"}`)}if(t.statusCode>=300)throw new Error(`${n!=null?n:"Request failed"}, status ${t.statusCode}`);return t.body}async requestLocalApiWithBody(e,n,t,i,r){let s=JSON.stringify(t),a=await this.requestLocalApiRaw(e,{method:n,headers:i,body:s});if(a.statusCode>=400){let o=a.body.toString("utf8");throw new Error(`${r!=null?r:"Request failed"}, status ${a.statusCode}: ${o||"no response body"}`)}if(a.statusCode>=300)throw new Error(`${r!=null?r:"Request failed"}, status ${a.statusCode}`);return{statusCode:a.statusCode,body:a.body}}async requestWebApi(e,n){let t={"Zotero-API-Version":"3","Zotero-API-Key":this.settings.webApiKey},i=await this.requestLocalApiRaw(e,{headers:t});if(i.statusCode>=400){let r=i.body.toString("utf8");throw new Error(`${n!=null?n:"Request failed"}, status ${i.statusCode}: ${r||"no response body"}`)}if(i.statusCode>=300)throw new Error(`${n!=null?n:"Request failed"}, status ${i.statusCode}`);return i.body}requestWebApiRaw(e,n={}){var i;let t={"Zotero-API-Version":"3","Zotero-API-Key":this.settings.webApiKey,...(i=n.headers)!=null?i:{}};return this.requestLocalApiRaw(e,{...n,headers:t})}async requestWebApiWithBody(e,n,t,i,r){let s=JSON.stringify(t),a=await this.requestLocalApiRaw(e,{method:n,headers:i,body:s});if(a.statusCode>=400){let o=a.body.toString("utf8");throw new Error(`${r!=null?r:"Request failed"}, status ${a.statusCode}: ${o||"no response body"}`)}if(a.statusCode>=300)throw new Error(`${r!=null?r:"Request failed"}, status ${a.statusCode}`);return{statusCode:a.statusCode,body:a.body}}async followFileRedirect(e){if(e.statusCode<300||e.statusCode>=400)return null;let n=e.headers.location,t=Array.isArray(n)?n[0]:n;if(!t||typeof t!="string")return null;if(t.startsWith("file://")){let i=(0,Z.fileURLToPath)(t);return D.promises.readFile(i)}return t.startsWith("http://")||t.startsWith("https://")?this.requestLocalApi(t):null}bufferToArrayBuffer(e){return e.buffer.slice(e.byteOffset,e.byteOffset+e.byteLength)}async annotateChunkJsonWithAttachmentKey(e,n){if(n)try{let t=await this.app.vault.adapter.read(e),i=JSON.parse(t);if(!i||typeof i!="object")return;let r=i.metadata&&typeof i.metadata=="object"?i.metadata:{};r.attachment_key=n,i.metadata=r,await this.app.vault.adapter.write(e,JSON.stringify(i,null,2))}catch(t){console.warn("Failed to annotate chunks JSON with attachment key",t)}}async updateChunkJsonSourcePdf(e,n){if(n)try{let t=await this.app.vault.adapter.read(e),i=JSON.parse(t);if(!i||typeof i!="object")return;i.source_pdf=n,await this.app.vault.adapter.write(e,JSON.stringify(i,null,2))}catch(t){console.warn("Failed to update chunks JSON source_pdf",t)}}buildPdfLinkFromSourcePath(e){if(!e)return"";let n=f.default.normalize(this.getVaultBasePath()),t=f.default.normalize(e),i=n.endsWith(f.default.sep)?n:`${n}${f.default.sep}`;return t.startsWith(i)?`[[${(0,d.normalizePath)(f.default.relative(n,t))}]]`:`[PDF](${(0,Z.pathToFileURL)(e).toString()})`}toVaultRelativePath(e){if(!e)return"";let n=f.default.normalize(this.getVaultBasePath()),t=f.default.normalize(e),i=n.endsWith(f.default.sep)?n:`${n}${f.default.sep}`;return t.startsWith(i)?(0,d.normalizePath)(f.default.relative(n,t)):""}async isFileAccessible(e){if(!e)return!1;try{return await D.promises.access(e),!0}catch(n){return!1}}deriveVaultPdfRelativePath(e,n,t){let i=this.toVaultRelativePath(e);if(i&&i.startsWith((0,d.normalizePath)(this.settings.outputPdfDir)))return i;let r=this.sanitizeFileName(n)||t;return(0,d.normalizePath)(`${this.settings.outputPdfDir}/${r}.pdf`)}async recoverMissingPdfFromAttachment(e,n,t,i,r,s,a){let o=await this.resolvePdfAttachment(n,t);if(!o&&r&&(o={key:r}),!o)return null;let l=o.key||r,c=o.filePath;if(!this.settings.copyPdfToVault&&c&&await this.isFileAccessible(c))return{sourcePdf:c,attachmentKey:l};try{await this.ensureFolder(this.settings.outputPdfDir)}catch(m){return console.error("Failed to create PDF output folder",m),null}let u=this.deriveVaultPdfRelativePath(e,s,i),_;try{if(c&&await this.isFileAccessible(c))_=await D.promises.readFile(c);else if(l)_=await this.downloadZoteroPdf(l),!this.settings.copyPdfToVault&&a&&new d.Notice("Local PDF path unavailable; copied PDF into vault for processing.");else return null}catch(m){return console.error("Failed to read or download PDF attachment",m),null}try{await this.app.vault.adapter.writeBinary(u,this.bufferToArrayBuffer(_))}catch(m){return console.error("Failed to write recovered PDF into vault",m),null}return{sourcePdf:this.getAbsoluteVaultPath(u),attachmentKey:l}}buildPdfLinkForNote(e,n,t){return!e&&!n?"":!this.settings.copyPdfToVault&&n?`[PDF](${this.buildZoteroDeepLink(t!=null?t:"",n)})`:this.buildPdfLinkFromSourcePath(e)}buildVaultPdfCitationLink(e,n,t){if(!e)return"";let i=this.toVaultRelativePath(e);if(!i)return"";let r=n?`#page=${n}`:"";return`[[${i}${r}|${t||i}]]`}async maybeCreateOcrLayeredPdf(e,n,t){if(!this.settings.createOcrLayeredPdf||!this.settings.copyPdfToVault||!e||!((n==null?void 0:n.ocr_used)===!0))return null;if(!this.toVaultRelativePath(e))return console.warn("OCR layered PDF requires a vault-local PDF"),null;try{await this.ensureFolder(this.settings.outputPdfDir)}catch(l){return console.warn("Failed to create OCR PDF output folder",l),null}let r=`${e}.ocr.tmp`,s=(t||(n==null?void 0:n.languages)||"eng").toString(),a=this.getPluginDir(),o=f.default.join(a,"tools","ocr_layered_pdf.py");try{return this.showStatusProgress("Creating OCR PDF...",0),await this.runPythonStreaming(o,["--pdf",e,"--out-pdf",r,"--language",s,"--progress"],l=>{if((l==null?void 0:l.type)==="progress"&&l.total){let c=Math.round(l.current/l.total*100);this.showStatusProgress(`Creating OCR PDF ${l.current}/${l.total}`,c)}},()=>{}),await D.promises.rename(r,e),e}catch(l){return console.warn("OCR layered PDF creation failed",l),null}}getMainLeaf(){let e=new Set(this.app.workspace.getLeavesOfType(G)),n=this.app.workspace.getLeavesOfType("markdown").find(i=>!e.has(i));if(n)return n;let t=this.app.workspace.getLeaf(!1);return t&&!e.has(t)?t:this.app.workspace.getLeaf("tab")}async openNoteInMain(e){let n=(0,d.normalizePath)(e),t=this.app.vault.getAbstractFileByPath(n),i=this.getMainLeaf();if(t instanceof d.TFile){await i.openFile(t,{active:!0});return}await this.app.workspace.openLinkText(n,"",!1)}async openInternalLinkInMain(e){let n=this.getMainLeaf(),t=e.split("#")[0].trim(),i=t?this.app.metadataCache.getFirstLinkpathDest(t,""):null;if(i instanceof d.TFile){await n.openFile(i,{active:!0}),e.includes("#")&&(this.app.workspace.setActiveLeaf(n,{focus:!0}),await this.app.workspace.openLinkText(e,"",!1));return}this.app.workspace.setActiveLeaf(n,{focus:!0}),await this.app.workspace.openLinkText(e,"",!1)}async openNoteInNewTab(e){let n=(0,d.normalizePath)(e);await this.app.workspace.openLinkText(n,"","tab")}async openPdfInMain(e,n){if(!e)return!1;let t=f.default.normalize(this.getVaultBasePath()),i=f.default.normalize(e),r=t.endsWith(f.default.sep)?t:`${t}${f.default.sep}`;if(i.startsWith(r)){let s=(0,d.normalizePath)(f.default.relative(t,i)),a=n?`#page=${n}`:"";return await this.app.workspace.openLinkText(`${s}${a}`,"","tab"),!0}try{return window.open((0,Z.pathToFileURL)(e).toString()),!0}catch(s){return!1}}openExternalUrl(e){e&&window.open(e)}buildZoteroDeepLink(e,n,t,i){if(n){let r=new URLSearchParams;t&&r.set("page",t),i&&r.set("annotation",i);let s=r.toString()?`?${r.toString()}`:"";return`zotero://open-pdf/library/items/${n}${s}`}return`zotero://select/library/items/${e}`}extractAnnotationKey(e){if(!e)return;let t=(e.includes(":")?e.split(":").slice(1).join(":"):e).trim().toUpperCase();if(/^[A-Z0-9]{8}$/.test(t))return t}formatCitationsMarkdown(e){return e.length?e.map(t=>this.formatCitationMarkdown(t)).filter(Boolean).join(`
`):""}formatCitationMarkdown(e){var h,m,g,b,v,P;let n=e.doc_id||"?",t=e.pages||`${(h=e.page_start)!=null?h:"?"}-${(m=e.page_end)!=null?m:"?"}`,i=`${n}`,r=t.includes("-")?t.replace("-"," - "):t,s=e.annotation_key||this.extractAnnotationKey(e.chunk_id),a=e.attachment_key||((b=(g=this.docIndex)==null?void 0:g[e.doc_id||""])==null?void 0:b.attachment_key),o=e.page_start?String(e.page_start):"",l=(P=(v=this.docIndex)==null?void 0:v[e.doc_id||""])!=null?P:null,c=(l==null?void 0:l.zotero_title)||(l==null?void 0:l.note_title)||i,u=l!=null&&l.note_path?(0,d.normalizePath)(l.note_path).replace(/\.md$/i,""):this.sanitizeFileName(c)||c,_=u&&u!==c?`[[${u}|${c}]]`:`[[${c}]]`;if(this.settings.preferVaultPdfForCitations){let k=(l==null?void 0:l.pdf_path)||e.source_pdf||"",E=this.buildVaultPdfCitationLink(k,o,r);if(E)return`- ${_}, p. ${E}`}if(a){let k=this.buildZoteroDeepLink(n,a,o,s);return`- ${_}, p. [${r}](${k})`}return`- ${_}, p. ${r}`}generateChatId(){return typeof crypto!="undefined"&&"randomUUID"in crypto?crypto.randomUUID():`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}getDocIndexPath(){return(0,d.normalizePath)(`${O}/doc_index.json`)}async getDocIndex(){return this.docIndex?this.docIndex:(this.docIndex=await this.loadDocIndexFromDisk(),this.docIndex)}async loadDocIndexFromDisk(){var t;let e=this.app.vault.adapter,n=this.getDocIndexPath();if(!await e.exists(n))return{};try{let i=await e.read(n),r=JSON.parse(i);if(r&&typeof r=="object"){let s=(t=r.entries)!=null?t:r;if(Array.isArray(s)){let a={};for(let o of s)o!=null&&o.doc_id&&(a[String(o.doc_id)]=o);return a}if(s&&typeof s=="object")return s}}catch(i){console.error("Failed to read doc index",i)}return{}}async saveDocIndex(e){await this.ensureFolder(O);let n=this.app.vault.adapter,t=this.getDocIndexPath(),i={version:1,entries:e};await n.write(t,JSON.stringify(i,null,2)),this.docIndex=e}async updateDocIndex(e){var r;let n=await this.getDocIndex(),t=(r=n[e.doc_id])!=null?r:{doc_id:e.doc_id},i={...t,...e,doc_id:e.doc_id,updated_at:new Date().toISOString()};e.note_path===void 0&&t.note_path&&(i.note_path=t.note_path),e.note_title===void 0&&t.note_title&&(i.note_title=t.note_title),e.zotero_title===void 0&&t.zotero_title&&(i.zotero_title=t.zotero_title),e.pdf_path===void 0&&t.pdf_path&&(i.pdf_path=t.pdf_path),e.attachment_key===void 0&&t.attachment_key&&(i.attachment_key=t.attachment_key),n[e.doc_id]=i,await this.saveDocIndex(n)}async hydrateDocIndexFromCache(e){var a,o;if(!e)return null;let n=this.app.vault.adapter,t=await this.getDocIndexEntry(e),i={},r=(0,d.normalizePath)(`${$}/${e}.json`);if(await n.exists(r))try{let l=await n.read(r),c=JSON.parse(l),u=(o=(a=c==null?void 0:c.data)!=null?a:c)!=null?o:{},_=typeof u.title=="string"?u.title:"";if(_&&(i.zotero_title=_),!i.note_title||!i.note_path){let h=this.sanitizeFileName(_)||e,m=(0,d.normalizePath)(`${this.settings.outputNoteDir}/${h}.md`),g=(0,d.normalizePath)(`${this.settings.outputNoteDir}/${h}-${e}.md`),b="";await n.exists(m)?b=m:await n.exists(g)&&(b=g),b&&(i.note_path=b,i.note_title=f.default.basename(b,".md"))}}catch(l){console.error("Failed to read cached item JSON",l)}!i.note_title&&(t!=null&&t.note_path)&&(i.note_title=f.default.basename(t.note_path,".md"));let s=(0,d.normalizePath)(`${F}/${e}.json`);if(await n.exists(s))try{let l=await n.read(s),c=JSON.parse(l);typeof(c==null?void 0:c.source_pdf)=="string"&&(i.pdf_path=c.source_pdf)}catch(l){console.error("Failed to read cached chunks JSON",l)}return Object.keys(i).length>0&&await this.updateDocIndex({doc_id:e,...i}),this.getDocIndexEntry(e)}async getDocIndexEntry(e){var t;return e&&(t=(await this.getDocIndex())[e])!=null?t:null}async inferNotePathFromCache(e){var i,r;let n=this.app.vault.adapter,t=(0,d.normalizePath)(`${$}/${e}.json`);if(!await n.exists(t))return"";try{let s=await n.read(t),a=JSON.parse(s),o=(r=(i=a==null?void 0:a.data)!=null?i:a)!=null?r:{},l=typeof o.title=="string"?o.title:"",c=this.sanitizeFileName(l)||e,u=(0,d.normalizePath)(`${this.settings.outputNoteDir}/${c}.md`),_=(0,d.normalizePath)(`${this.settings.outputNoteDir}/${c}-${e}.md`);if(await n.exists(u))return u;if(await n.exists(_))return _}catch(s){console.error("Failed to infer note path from cache",s)}return""}async rebuildNoteFromCacheForDocId(e,n){var S,A,y,T,I;try{await this.ensureBundledTools()}catch(w){return n&&new d.Notice("Failed to sync bundled tools. See console for details."),console.error(w),!1}let t=this.app.vault.adapter,i=(0,d.normalizePath)(`${$}/${e}.json`),r=(0,d.normalizePath)(`${F}/${e}.json`);if(!await t.exists(i)||!await t.exists(r))return n&&new d.Notice("Cached item or chunks JSON not found."),!1;this.showStatusProgress("Preparing...",5);let s;try{let w=await t.read(i);s=JSON.parse(w)}catch(w){return n&&new d.Notice("Failed to read cached item JSON."),console.error(w),this.clearStatusProgress(),!1}let a;try{let w=await t.read(r);a=JSON.parse(w)}catch(w){return n&&new d.Notice("Failed to read cached chunks JSON."),console.error(w),this.clearStatusProgress(),!1}let o=(S=s.data)!=null?S:s,l=typeof o.title=="string"?o.title:"",c=((y=(A=s.key)!=null?A:o.key)!=null?y:e).toString(),u=await this.getDocIndexEntry(e),_=typeof((T=a==null?void 0:a.metadata)==null?void 0:T.attachment_key)=="string"?a.metadata.attachment_key:u==null?void 0:u.attachment_key,h=typeof a.source_pdf=="string"?a.source_pdf:"";if(!h||!await this.isFileAccessible(h)){let w=await this.recoverMissingPdfFromAttachment(h,o,c,e,_,l,n);if(!w)return n&&new d.Notice("Cached source PDF is missing and could not be recovered."),this.clearStatusProgress(),!1;h=w.sourcePdf,w.attachmentKey&&(_=w.attachmentKey),await this.updateChunkJsonSourcePdf(r,h)}let m=await this.resolveLanguageHint(o,c),g=this.buildDoclingLanguageHint(m!=null?m:void 0),b="";if(u!=null&&u.note_path&&await t.exists(u.note_path)&&(b=(0,d.normalizePath)(u.note_path)),!b){let w=this.sanitizeFileName(l)||e,q=(0,d.normalizePath)(`${this.settings.outputNoteDir}/${w}.md`),j=await t.exists(q)?w:await this.resolveUniqueBaseName(w,e);b=(0,d.normalizePath)(`${this.settings.outputNoteDir}/${j}.md`)}try{if(await this.ensureFolder(this.settings.outputNoteDir),this.settings.copyPdfToVault&&await this.ensureFolder(this.settings.outputPdfDir),this.settings.enableFileLogging){let w=this.getLogFileRelativePath(),q=(0,d.normalizePath)(f.default.dirname(w));q&&await this.ensureFolder(q);let j=this.getSpellcheckerInfoRelativePath(),B=(0,d.normalizePath)(f.default.dirname(j));B&&await this.ensureFolder(B)}}catch(w){return n&&new d.Notice("Failed to create notes folder."),console.error(w),this.clearStatusProgress(),!1}let v=this.getPluginDir(),P=f.default.join(v,"tools","docling_extract.py"),k=f.default.join(v,"tools","index_redisearch.py"),E=null,L=null;try{E=await this.readDoclingQualityLabelFromPdf(h,g),this.showStatusProgress(this.formatStatusLabel("Docling extraction...",E),0);let w=this.settings.enableFileLogging?this.getLogFileAbsolutePath():null;await this.runPythonStreaming(P,this.buildDoclingArgs(h,e,r,b,g,!0),B=>this.handleDoclingProgress(B,E),()=>{},w),E=await this.readDoclingQualityLabel(r),_&&await this.annotateChunkJsonWithAttachmentKey(r,_);let q=await this.readDoclingMetadata(r),j=await this.maybeCreateOcrLayeredPdf(h,q,g);j&&(h=j,L=j,await this.updateChunkJsonSourcePdf(r,j))}catch(w){return n&&new d.Notice("Docling extraction failed. See console for details."),console.error(w),this.clearStatusProgress(),!1}try{this.showStatusProgress(this.formatStatusLabel("Indexing chunks...",E),0),await this.runPythonStreaming(k,["--chunks-json",this.getAbsoluteVaultPath(r),"--redis-url",this.settings.redisUrl,"--index",this.getRedisIndexName(),"--prefix",this.getRedisKeyPrefix(),"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--upsert","--progress"],w=>{if((w==null?void 0:w.type)==="progress"&&w.total){let q=Math.round(w.current/w.total*100),j=typeof w.message=="string"&&w.message.trim()?w.message:`Indexing chunks ${w.current}/${w.total}`,B=this.formatStatusLabel(j,E);this.showStatusProgress(B,q)}},()=>{})}catch(w){return n&&new d.Notice("RedisSearch indexing failed. See console for details."),console.error(w),this.clearStatusProgress(),!1}let N=L?this.buildPdfLinkFromSourcePath(L):this.buildPdfLinkForNote(h,u==null?void 0:u.attachment_key,e);try{let w=await this.app.vault.adapter.read(b),q=this.buildNoteMarkdown(o,(I=s.meta)!=null?I:{},e,N,i,w);await this.app.vault.adapter.write(b,q)}catch(w){return n&&new d.Notice("Failed to finalize note markdown."),console.error(w),this.clearStatusProgress(),!1}try{await this.updateDocIndex({doc_id:e,note_path:b,note_title:f.default.basename(b,".md"),zotero_title:l,pdf_path:h})}catch(w){console.error("Failed to update doc index",w)}return!0}getZoteroLibraryPath(){let e=(this.settings.zoteroUserId||"0").trim();return!e||e==="0"?"users/0":e.startsWith("users/")||e.startsWith("groups/")?e:`users/${e}`}async ensureFolder(e){let n=this.app.vault.adapter,t=(0,d.normalizePath)(e).split("/").filter(Boolean),i="";for(let r of t)i=i?`${i}/${r}`:r,await n.exists(i)||await n.mkdir(i)}buildNoteMarkdown(e,n,t,i,r,s){let a=`[[${r}]]`,o=this.renderFrontmatter(e,n,t,i,a);return`${o?`---
${o}
---

`:""}PDF: ${i}

Item JSON: ${a}

${s}`}renderFrontmatter(e,n,t,i,r){var o;let s=(o=this.settings.frontmatterTemplate)!=null?o:"";if(!s.trim())return"";let a=this.buildTemplateVars(e,n,t,i,r);return s.replace(/{{\s*([a-z0-9_]+)\s*}}/gi,(l,c)=>{var u;return(u=a[c])!=null?u:""}).trim()}buildTemplateVars(e,n,t,i,r){let s=typeof e.title=="string"?e.title:"",a=typeof e.shortTitle=="string"?e.shortTitle:"",o=typeof e.date=="string"?e.date:"",l=typeof(n==null?void 0:n.parsedDate)=="string"?n.parsedDate:"",c=this.extractYear(l||o),_=(Array.isArray(e.creators)?e.creators:[]).filter(k=>k.creatorType==="author").map(k=>this.formatCreatorName(k)),h=_.join("; "),m=Array.isArray(e.tags)?e.tags.map(k=>typeof k=="string"?k:k==null?void 0:k.tag).filter(Boolean):[],g=m.join("; "),b=typeof e.itemType=="string"?e.itemType:"",v=typeof(n==null?void 0:n.creatorSummary)=="string"?n.creatorSummary:"",P={doc_id:t,zotero_key:typeof e.key=="string"?e.key:t,title:s,short_title:a,date:o,year:c,authors:h,tags:g,item_type:b,creator_summary:v,pdf_link:this.escapeYamlString(i),item_json:this.escapeYamlString(r)};for(let[k,E]of Object.entries(P))P[`${k}_yaml`]=this.escapeYamlString(E);return P.authors_yaml=this.toYamlList(_),P.tags_yaml=this.toYamlList(m),P}extractYear(e){if(!e)return"";let n=e.match(/\b(\d{4})\b/);return n?n[1]:""}formatCreatorName(e){if(!e||typeof e!="object")return"";if(e.name)return String(e.name);let n=e.firstName?String(e.firstName):"",t=e.lastName?String(e.lastName):"";return[t,n].filter(Boolean).join(", ")||`${n} ${t}`.trim()}escapeYamlString(e){return`"${String(e).replace(/\\/g,"\\\\").replace(/"/g,'\\"')}"`}toYamlList(e){return e.length?e.map(n=>`  - ${this.escapeYamlString(n)}`).join(`
`):'  - ""'}getVaultBasePath(){var t;let e=this.app.vault.adapter;if(e instanceof d.FileSystemAdapter)return e.getBasePath();let n=(t=e.getBasePath)==null?void 0:t.call(e);if(n)return n;throw new Error("Vault base path is unavailable.")}getPluginDir(){var i;let e=this.getVaultBasePath(),n=(i=this.manifest.dir)!=null?i:this.manifest.id;if(!n)throw new Error("Plugin directory is unavailable.");let t=f.default.isAbsolute(n)?n:f.default.join(e,n);return f.default.normalize(t)}async ensureBundledTools(){let e=this.getPluginDir(),n=f.default.join(e,"tools");await D.promises.mkdir(n,{recursive:!0});for(let[t,i]of Object.entries(ce)){let r=f.default.join(n,t),s=!0;try{await D.promises.readFile(r,"utf8")===i&&(s=!1)}catch(a){}s&&await D.promises.writeFile(r,i,"utf8")}}async migrateCachePaths(){let e="zotero/items",n="zotero/chunks",t=$,i=F,r=this.app.vault.adapter,s=(0,d.normalizePath)(e),a=(0,d.normalizePath)(n),o=(0,d.normalizePath)(t),l=(0,d.normalizePath)(i),c=o.split("/").slice(0,-1).join("/"),u=l.split("/").slice(0,-1).join("/");c&&await this.ensureFolder(c),u&&await this.ensureFolder(u);let _=await r.exists(s),h=await r.exists(a),m=await r.exists(o),g=await r.exists(l);_&&!m&&await r.rename(s,o),h&&!g&&await r.rename(a,l)}getAbsoluteVaultPath(e){let n=this.getVaultBasePath(),t=f.default.isAbsolute(e)?e:f.default.join(n,e);return f.default.normalize(t)}buildDoclingArgs(e,n,t,i,r,s=!1){let a=this.settings.ocrMode==="force_low_quality"?"auto":this.settings.ocrMode,o=["--pdf",e,"--doc-id",n,"--out-json",this.getAbsoluteVaultPath(t),"--out-md",this.getAbsoluteVaultPath(i),"--chunking",this.settings.chunkingMode,"--ocr",a];s&&o.push("--progress"),this.settings.ocrMode==="force_low_quality"&&o.push("--force-ocr-low-quality"),o.push("--quality-threshold",String(this.settings.ocrQualityThreshold)),r&&o.push("--language-hint",r),this.settings.maxChunkChars>0&&o.push("--max-chunk-chars",String(this.settings.maxChunkChars)),this.settings.chunkOverlapChars>0&&o.push("--chunk-overlap-chars",String(this.settings.chunkOverlapChars)),this.settings.removeImagePlaceholders||o.push("--keep-image-tags"),this.settings.enableLlmCleanup&&(o.push("--enable-llm-cleanup"),this.settings.llmCleanupBaseUrl&&o.push("--llm-cleanup-base-url",this.settings.llmCleanupBaseUrl),this.settings.llmCleanupApiKey&&o.push("--llm-cleanup-api-key",this.settings.llmCleanupApiKey),this.settings.llmCleanupModel&&o.push("--llm-cleanup-model",this.settings.llmCleanupModel),o.push("--llm-cleanup-temperature",String(this.settings.llmCleanupTemperature)),o.push("--llm-cleanup-min-quality",String(this.settings.llmCleanupMinQuality)),o.push("--llm-cleanup-max-chars",String(this.settings.llmCleanupMaxChars)));let l=this.getPluginDir(),c=f.default.join(l,"tools","ocr_wordlist.txt");if((0,D.existsSync)(c)&&o.push("--enable-dictionary-correction","--dictionary-path",c),this.settings.enableFileLogging){let u=this.getLogFileAbsolutePath();u&&o.push("--log-file",u);let _=this.getAbsoluteVaultPath(this.getSpellcheckerInfoRelativePath());_&&o.push("--spellchecker-info-out",_)}return o}getRedisDataDir(){return f.default.join(this.getVaultBasePath(),O,"redis-data")}getDockerComposePath(){let e=this.getPluginDir();return f.default.join(e,"tools","docker-compose.yml")}async resolveDockerPath(){var l;let e=(l=this.settings.dockerPath)==null?void 0:l.trim(),n=["/opt/homebrew/bin/docker","/usr/local/bin/docker","/usr/bin/docker","/Applications/Docker.app/Contents/Resources/bin/docker"],t=["/opt/homebrew/bin/podman","/usr/local/bin/podman","/usr/bin/podman"],i=["/opt/homebrew/bin/podman-compose","/usr/local/bin/podman-compose","/usr/bin/podman-compose"],r=[];e&&r.push(e);let s=e?this.getContainerCliKind(e):"docker",a=s==="podman-compose"?[i,t,n]:s==="podman"?[t,i,n]:[n,t,i];if(!e||e==="docker"||e==="podman"||e==="podman-compose")for(let c of a)r.push(...c);for(let c of r)if(f.default.isAbsolute(c))try{if(await this.isContainerCliAvailable(c))return c}catch(u){}let o=[e,s==="podman"?"podman":"docker",s==="podman"?"docker":"podman","podman-compose"].filter(c=>!!(c&&c.trim()));for(let c of o)if(await this.isContainerCliAvailable(c))return c;return e||"docker"}async isContainerCliAvailable(e){return new Promise(n=>{let t=(0,z.spawn)(e,["--version"]);t.on("error",()=>n(!1)),t.on("close",i=>n(i===0))})}getContainerCliKind(e){let n=f.default.basename(e);return n==="podman-compose"?"podman-compose":n.includes("podman")?"podman":"docker"}async isContainerDaemonRunning(e){let n=this.getContainerCliKind(e),t=e,i=["info"];if(n==="podman-compose"){let r=await this.resolvePodmanBin();if(!r)return!1;t=r}return new Promise(r=>{let s=(0,z.spawn)(t,i),a=!1,o=c=>{a||(a=!0,r(c))},l=setTimeout(()=>{s.kill(),o(!1)},2e3);s.on("error",()=>{clearTimeout(l),o(!1)}),s.on("close",c=>{clearTimeout(l),o(c===0)})})}getContainerDaemonHint(e){let n=this.getContainerCliKind(e);return n==="podman"||n==="podman-compose"?"Podman machine not running. Run `podman machine start`.":"Docker Desktop is not running. Start Docker Desktop."}async supportsComposeSubcommand(e){return new Promise(n=>{let t=(0,z.spawn)(e,["compose","version"]);t.on("error",()=>n(!1)),t.on("close",i=>n(i===0))})}async findPodmanComposePath(){let e=["/opt/homebrew/bin/podman-compose","/usr/local/bin/podman-compose","/usr/bin/podman-compose"];for(let n of e)try{return await D.promises.access(n),n}catch(t){}return await this.isContainerCliAvailable("podman-compose")?"podman-compose":null}async resolvePodmanBin(){let e=["/opt/homebrew/bin/podman","/usr/local/bin/podman","/usr/bin/podman"];for(let n of e)if(await this.isContainerCliAvailable(n))return n;return await this.isContainerCliAvailable("podman")?"podman":null}async resolveComposeCommand(e){let n=f.default.basename(e);if(n==="podman-compose")return{command:e,argsPrefix:[]};if(n==="podman"){let t=await this.findPodmanComposePath();return t?{command:t,argsPrefix:[]}:await this.supportsComposeSubcommand(e)?{command:e,argsPrefix:["compose"]}:null}return await this.supportsComposeSubcommand(e)?{command:e,argsPrefix:["compose"]}:null}async autoDetectContainerCliOnLoad(){var r;let e=await this.resolveDockerPath();if(!await this.isContainerCliAvailable(e)){this.notifyContainerOnce("Docker or Podman not found. Install Docker Desktop or Podman and set Docker/Podman path in settings.");return}let n=((r=this.settings.dockerPath)==null?void 0:r.trim())||"docker";(!await this.isContainerCliAvailable(n)||n==="docker"||n==="podman"||n==="podman-compose")&&e&&e!==n&&(this.settings.dockerPath=e,await this.saveSettings()),await this.isContainerDaemonRunning(e)||this.notifyContainerOnce(this.getContainerDaemonHint(e))}getDockerProjectName(){let e=this.getVaultBasePath(),n=f.default.basename(e).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,18),t=(0,J.createHash)("sha1").update(e).digest("hex").slice(0,8);return`zrr-${n||"vault"}-${t}`}getRedisPortFromUrl(){try{let e=new URL(this.settings.redisUrl),n=e.port?Number(e.port):6379;return Number.isFinite(n)&&n>0?n:6379}catch(e){return 6379}}getVaultPreferredRedisPort(){let e=(0,J.createHash)("sha1").update(this.getVaultBasePath()).digest("hex");return 6400+Number.parseInt(e.slice(0,4),16)%2e3}getRedisHostFromUrl(){try{return new URL(this.settings.redisUrl).hostname||"127.0.0.1"}catch(e){return"127.0.0.1"}}isLocalRedisHost(e){let n=e.trim().toLowerCase();return n?n==="localhost"||n==="0.0.0.0"||n==="::1"?!0:n.startsWith("127."):!1}getPortCheckHost(e){return this.isLocalRedisHost(e)?"127.0.0.1":e}async isPortFree(e,n){return new Promise(t=>{let i=te.default.createServer();i.once("error",()=>t(!1)),i.once("listening",()=>{i.close(()=>t(!0))}),i.listen(n,e)})}async findAvailablePort(e,n){for(let i=0;i<25;i+=1){let r=n+i;if(await this.isPortFree(e,r))return r}return null}updateRedisUrlPort(e,n){try{let t=new URL(e);return t.port=String(n),t.toString()}catch(t){return`redis://127.0.0.1:${n}`}}async isRedisReachable(e){let n="127.0.0.1",t=6379;try{let i=new URL(e);n=i.hostname||n,t=i.port?Number(i.port):t}catch(i){return!1}return new Promise(i=>{let r=new te.default.Socket,s=!1,a=o=>{s||(s=!0,r.destroy(),i(o))};r.setTimeout(500),r.once("connect",()=>a(!0)),r.once("timeout",()=>a(!1)),r.once("error",()=>a(!1)),r.connect(t,n)})}getRedisNamespace(){let e=this.getVaultBasePath(),n=f.default.basename(e).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,24),t=(0,J.createHash)("sha1").update(e).digest("hex").slice(0,8);return`${n||"vault"}-${t}`}getRedisIndexName(){return`${(this.settings.redisIndex||"idx:zotero").trim()||"idx:zotero"}:${this.getRedisNamespace()}`}getRedisKeyPrefix(){let e=(this.settings.redisPrefix||"zotero:chunk:").trim()||"zotero:chunk:";return`${e.endsWith(":")?e:`${e}:`}${this.getRedisNamespace()}:`}async isComposeProjectRunning(e,n,t,i,r){return new Promise(s=>{let a=(0,z.spawn)(e,[...n,"-p",i,"-f",t,"ps","-q"],{cwd:f.default.dirname(t),env:r}),o="";a.stdout.on("data",l=>{o+=l.toString()}),a.on("error",l=>{console.warn("Redis Stack status check failed",l),s(!1)}),a.on("close",l=>{if(l!==0){s(!1);return}s(o.trim().length>0)})})}async startRedisStack(e){var n;try{await this.ensureBundledTools();let t=this.getDockerComposePath(),i=this.getRedisDataDir();await D.promises.mkdir(i,{recursive:!0});let r=await this.resolveDockerPath(),s=((n=this.settings.dockerPath)==null?void 0:n.trim())||"docker";if((!await this.isContainerCliAvailable(s)||!s||s==="docker"||s==="podman"||s==="podman-compose")&&r&&r!==s&&(this.settings.dockerPath=r,await this.saveSettings(),e||new d.Notice(`Docker/Podman path set to ${r}.`)),!await this.isContainerCliAvailable(r)){e||new d.Notice('Docker or Podman not found. Install Docker Desktop or Podman and set "Docker/Podman path" in settings.');return}if(!await this.isContainerDaemonRunning(r)){e||new d.Notice(this.getContainerDaemonHint(r));return}let o=await this.resolveComposeCommand(r);if(!o){e||new d.Notice("Compose support not found. Install Docker Desktop or Podman with podman-compose.");return}let l={...process.env};if(f.default.basename(o.command)==="podman-compose"){let v=await this.resolvePodmanBin();if(v&&(l.PODMAN_BIN=v,f.default.isAbsolute(v))){let P=f.default.dirname(v),k=l.PATH||"";k.split(f.default.delimiter).includes(P)||(l.PATH=`${P}${f.default.delimiter}${k}`)}}let c=this.getDockerProjectName();if(await this.isComposeProjectRunning(o.command,o.argsPrefix,t,c,l)){e||new d.Notice("Redis Stack already running for this vault.");return}let u=this.getRedisPortFromUrl(),_=this.getRedisHostFromUrl(),h=this.getPortCheckHost(_),m=this.settings.autoAssignRedisPort&&this.isLocalRedisHost(_),g=this.settings.redisUrl,b=u;if(m){let v=u===6379?this.getVaultPreferredRedisPort():u,P=await this.findAvailablePort(h,v);if(!P)throw new Error(`No available Redis port found starting at ${v}.`);P!==u&&(b=P,g=this.updateRedisUrlPort(g,b),this.settings.redisUrl=g,await this.saveSettings(),e||new d.Notice(`Using Redis port ${b} for this vault.`))}else if(await this.isRedisReachable(g)){e||new d.Notice(`Redis already running at ${g}.`);return}l.ZRR_DATA_DIR=i,l.ZRR_PORT=String(b);try{await this.runCommand(o.command,[...o.argsPrefix,"-p",c,"-f",t,"down"],{cwd:f.default.dirname(t),env:l})}catch(v){console.warn("Redis Stack stop before restart failed",v)}await this.runCommand(o.command,[...o.argsPrefix,"-p",c,"-f",t,"up","-d"],{cwd:f.default.dirname(t),env:l}),e||new d.Notice("Redis Stack started.")}catch(t){e||new d.Notice("Failed to start Redis Stack. Check Docker/Podman and file sharing."),console.error("Failed to start Redis Stack",t)}}async setupPythonEnv(){let e=this.getPluginDir(),n=this.getPythonVenvDir(),t=this.getVenvPythonPath(n);await this.ensureBundledTools();let i=this.resolveRequirementsPath(e);if(!i)throw new Error(`requirements.txt not found in ${e}`);try{new d.Notice("Setting up Python environment..."),this.showStatusProgress("Setting up Python environment...",null),console.log(`Python env: using plugin dir ${e}`),console.log(`Python env: venv path ${n}`);let r=null,s=async()=>(r||(r=await this.resolveBootstrapPython()),r);if((0,D.existsSync)(t)){let a=await this.getPythonVersion(t,[]);if(a&&this.isUnsupportedPythonVersion(a)){let o=await s();console.log(`Python env: existing venv uses Python ${a.major}.${a.minor}; rebuilding with ${o.command} ${o.args.join(" ")}`),this.showStatusProgress("Rebuilding Python environment...",null),await D.promises.rm(n,{recursive:!0,force:!0})}}if(!(0,D.existsSync)(t)){let a=await s();console.log(`Python env: creating venv with ${a.command} ${a.args.join(" ")}`),await this.runCommand(a.command,[...a.args,"-m","venv",n],{cwd:e})}await this.runCommandStreaming(t,["-m","pip","install","-r",i],{cwd:e},a=>{let o=a.trim();if(!o)return;let l=o.match(/^Collecting\s+([^\s]+)/);if(l){this.showStatusProgress(`Installing ${l[1]}...`,null);return}if(o.startsWith("Installing collected packages")){this.showStatusProgress("Installing packages...",null);return}o.startsWith("Successfully installed")&&this.showStatusProgress("Python environment ready.",100)}),this.settings.pythonPath=t,await this.saveSettings(),this.clearStatusProgress(),new d.Notice("Python environment ready.")}catch(r){this.clearStatusProgress(),new d.Notice("Failed to set up Python environment. See console for details."),console.error("Python env setup failed",r)}}getPythonVenvDir(){return f.default.join(this.getPluginDir(),".venv")}getVenvPythonPath(e){return process.platform==="win32"?f.default.join(e,"Scripts","python.exe"):f.default.join(e,"bin","python")}resolveRequirementsPath(e){var t;return(t=[f.default.join(e,"requirements.txt"),f.default.join(e,"tools","requirements.txt")].find(i=>(0,D.existsSync)(i)))!=null?t:null}async resolveBootstrapPython(){let e=(this.settings.pythonPath||"").trim();if(e&&await this.canRunCommand(e,[])){let t=await this.getPythonVersion(e,[]);if(t&&this.isUnsupportedPythonVersion(t))throw new Error(`Configured Python ${t.major}.${t.minor} is not supported. Install Python 3.11 or 3.12 and update the Python path.`);return{command:e,args:[]}}let n=process.platform==="win32"?[{command:"py",args:["-3.12"]},{command:"py",args:["-3.11"]},{command:"py",args:["-3.10"]},{command:"py",args:["-3"]},{command:"python",args:[]}]:[{command:"python3.12",args:[]},{command:"python3.11",args:[]},{command:"python3.10",args:[]},{command:"python3",args:[]},{command:"python",args:[]}];for(let t of n)if(await this.canRunCommand(t.command,t.args)){let i=await this.getPythonVersion(t.command,t.args);if(i&&this.isUnsupportedPythonVersion(i)){console.log(`Python env: skipping ${t.command} ${t.args.join(" ")} (Python ${i.major}.${i.minor} unsupported)`);continue}return t}throw new Error("No usable Python 3.11/3.12 interpreter found on PATH.")}isUnsupportedPythonVersion(e){return e.major>3||e.major===3&&e.minor>=13}async getPythonVersion(e,n){return new Promise(t=>{let i=(0,z.spawn)(e,[...n,"-c","import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')"]),r="";i.stdout.on("data",s=>{r+=s.toString()}),i.on("error",()=>t(null)),i.on("close",s=>{if(s!==0){t(null);return}let a=r.trim().match(/(\d+)\.(\d+)/);if(!a){t(null);return}t({major:Number(a[1]),minor:Number(a[2])})})})}async canRunCommand(e,n){return new Promise(t=>{let i=(0,z.spawn)(e,[...n,"--version"],{env:this.buildPythonEnv()});i.on("error",()=>t(!1)),i.on("close",r=>t(r===0))})}buildPythonEnv(){let e={...process.env},n=f.default.delimiter,t=e.PATH||"",r=[...process.platform==="win32"?[]:["/opt/homebrew/bin","/usr/local/bin"],t].filter(Boolean).join(n);return e.PATH=r,e.PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK||(e.PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK="True"),e.DISABLE_MODEL_SOURCE_CHECK||(e.DISABLE_MODEL_SOURCE_CHECK="True"),e}runPython(e,n){return new Promise((t,i)=>{let r=(0,z.spawn)(this.settings.pythonPath,[e,...n],{cwd:f.default.dirname(e),env:this.buildPythonEnv()}),s="";r.stderr.on("data",a=>{s+=a.toString()}),r.on("error",a=>{this.handlePythonProcessError(String(a)),i(a)}),r.on("close",a=>{a===0?t():(this.handlePythonProcessError(s),i(new Error(s||`Process exited with code ${a}`)))})})}runCommand(e,n,t){return new Promise((i,r)=>{var o;let s=(0,z.spawn)(e,n,{cwd:t==null?void 0:t.cwd,env:(o=t==null?void 0:t.env)!=null?o:this.buildPythonEnv()}),a="";s.stderr.on("data",l=>{a+=l.toString()}),s.on("error",l=>{r(l)}),s.on("close",l=>{l===0?i():r(new Error(a||`Process exited with code ${l}`))})})}runPythonStreaming(e,n,t,i,r){return new Promise((s,a)=>{let o=(0,z.spawn)(this.settings.pythonPath,[e,...n],{cwd:f.default.dirname(e),env:this.buildPythonEnv()}),l="",c="",u=null,_=!1,h=m=>{if(m.trim())try{let g=JSON.parse(m);u=g,((g==null?void 0:g.type)==="final"||g!=null&&g.answer)&&(_=!0),t(g)}catch(g){}};o.stdout.on("data",m=>{var b;l+=m.toString();let g=l.split(/\r?\n/);l=(b=g.pop())!=null?b:"";for(let v of g)h(v)}),o.stderr.on("data",m=>{c+=m.toString()}),o.on("error",m=>{this.handlePythonProcessError(String(m)),a(m)}),o.on("close",m=>{l.trim()&&h(l),!_&&u&&i(u),r&&this.appendToLogFile(r,c),m===0?s():(this.handlePythonProcessError(c),a(new Error(c||`Process exited with code ${m}`)))})})}runCommandStreaming(e,n,t,i){return new Promise((r,s)=>{var c;let a=(0,z.spawn)(e,n,{cwd:t==null?void 0:t.cwd,env:(c=t==null?void 0:t.env)!=null?c:this.buildPythonEnv()}),o=u=>{u.toString().split(/\r?\n/).forEach(h=>{h.trim()&&i(h)})},l="";a.stdout.on("data",o),a.stderr.on("data",u=>{l+=u.toString(),o(u)}),a.on("error",u=>{s(u)}),a.on("close",u=>{u===0?r():s(new Error(l||`Process exited with code ${u}`))})})}handlePythonProcessError(e){if(!e)return;let n=e.match(/ModuleNotFoundError:\s+No module named ['"]([^'"]+)['"]/);if(n){let t=`Python env missing module '${n[1]}'. Run "Python environment" in settings.`;this.notifyPythonEnvOnce(t);return}if(/No module named ['"]/.test(e)){this.notifyPythonEnvOnce('Python env missing required modules. Run "Python environment" in settings.');return}/ENOENT|No such file or directory|not found/.test(e)&&this.notifyPythonEnvOnce('Python not found. Configure Python path or run "Python environment" in settings.')}notifyPythonEnvOnce(e){this.lastPythonEnvNotice!==e&&(this.lastPythonEnvNotice=e,new d.Notice(e))}notifyContainerOnce(e){this.lastContainerNotice!==e&&(this.lastContainerNotice=e,new d.Notice(e))}getLogsDirRelative(){return(0,d.normalizePath)(`${O}/logs`)}getLogFileRelativePath(){let e=(this.settings.logFilePath||"").trim();return(0,d.normalizePath)(e||`${this.getLogsDirRelative()}/docling_extract.log`)}getLogFileAbsolutePath(){return this.getAbsoluteVaultPath(this.getLogFileRelativePath())}getSpellcheckerInfoRelativePath(){return(0,d.normalizePath)(`${this.getLogsDirRelative()}/spellchecker_info.json`)}async openLogFile(){let e=this.getLogFileRelativePath(),n=this.app.vault.adapter;if(!await n.exists(e)){new d.Notice("Log file not found.");return}try{let t=await n.read(e);new ie(this.app,"Docling log",t||"(empty)").open()}catch(t){new d.Notice("Failed to open log file."),console.error(t)}}async clearLogFile(){let e=this.getLogFileRelativePath(),n=this.app.vault.adapter;try{let t=(0,d.normalizePath)(f.default.dirname(e));t&&await this.ensureFolder(t),await n.write(e,""),new d.Notice("Log file cleared.")}catch(t){new d.Notice("Failed to clear log file."),console.error(t)}}formatStderrForLog(e){let n=e.split(/\r?\n/).map(i=>i.trimEnd()).filter(i=>!!i.trim());if(!n.length)return"";let t=new Date().toISOString().replace("T"," ").replace("Z","").replace(".",",");return n.map(i=>`${t} STDERR docling_extract: ${i}`).join(`
`)+`
`}async appendToLogFile(e,n){if(!n||!n.trim())return;let t=this.formatStderrForLog(n);if(t)try{await D.promises.mkdir(f.default.dirname(e),{recursive:!0}),await D.promises.appendFile(e,t)}catch(i){console.warn("Failed to append stderr to log file",i)}}runPythonWithOutput(e,n,t){return new Promise((i,r)=>{let s=(0,z.spawn)(this.settings.pythonPath,[e,...n],{cwd:f.default.dirname(e),env:this.buildPythonEnv()}),a="",o="";s.stdout.on("data",l=>{a+=l.toString()}),s.stderr.on("data",l=>{o+=l.toString()}),s.on("error",l=>{this.handlePythonProcessError(String(l)),r(l)}),s.on("close",l=>{t&&this.appendToLogFile(t,o),l===0?i(a.trim()):(this.handlePythonProcessError(o),r(new Error(o||`Process exited with code ${l}`)))})})}},ae=class extends d.SuggestModal{constructor(e,n,t){super(e);this.lastError=null;this.indexedDocIds=null;this.plugin=n,this.resolveSelection=t,this.setPlaceholder("Search Zotero items...")}async getSuggestions(e){try{if(!this.indexedDocIds){let n=await this.plugin.getDocIndex();this.indexedDocIds=new Set(Object.keys(n))}return await this.plugin.searchZoteroItems(e)}catch(n){let t=n instanceof Error?n.message:String(n);return this.lastError!==t&&(this.lastError=t,new d.Notice(t)),console.error("Zotero search failed",n),[]}}renderSuggestion(e,n){var u,_,h;let t=(_=(u=e.data)==null?void 0:u.title)!=null?_:"[No title]",i=this.extractYear(e),r=this.getDocId(e),s=r?(h=this.indexedDocIds)==null?void 0:h.has(r):!1,a=this.getPdfStatus(e);s&&n.addClass("zrr-indexed-item"),a==="no"&&n.addClass("zrr-no-pdf-item"),n.createEl("div",{text:t});let o=n.createEl("small"),l=!1,c=()=>{l&&o.createSpan({text:" \u2022 "})};i&&(o.createSpan({text:i}),l=!0),s&&(c(),o.createSpan({text:"Indexed",cls:"zrr-indexed-flag"}),l=!0),a==="no"&&(c(),o.createSpan({text:"No attachment",cls:"zrr-no-pdf-flag"}),l=!0),n.addEventListener("click",()=>{this.resolveSelection&&(this.resolveSelection(e),this.resolveSelection=null),this.close()})}onChooseSuggestion(e,n){this.resolveSelection&&(this.resolveSelection(e),this.resolveSelection=null),this.close()}onClose(){this.resolveSelection&&(this.resolveSelection(null),this.resolveSelection=null)}getDocId(e){var t,i,r;let n=(r=(i=e.key)!=null?i:(t=e.data)==null?void 0:t.key)!=null?r:"";return typeof n=="string"?n:""}getPdfStatus(e){var i,r,s,a,o,l,c;let n=(l=(o=(s=(i=e.data)==null?void 0:i.attachments)!=null?s:(r=e.data)==null?void 0:r.children)!=null?o:(a=e.data)==null?void 0:a.items)!=null?l:[];if(Array.isArray(n)&&n.length>0)return n.some(_=>this.isPdfAttachment(_))?"yes":"no";let t=(c=e.meta)==null?void 0:c.numChildren;return typeof t=="number"&&t===0?"no":"unknown"}isPdfAttachment(e){var t,i,r,s,a,o;return((o=(a=(r=(t=e==null?void 0:e.contentType)!=null?t:e==null?void 0:e.mimeType)!=null?r:(i=e==null?void 0:e.data)==null?void 0:i.contentType)!=null?a:(s=e==null?void 0:e.data)==null?void 0:s.mimeType)!=null?o:"")==="application/pdf"}extractYear(e){var i,r,s,a;let n=(a=(s=(i=e.meta)==null?void 0:i.parsedDate)!=null?s:(r=e.data)==null?void 0:r.date)!=null?a:"";if(typeof n!="string")return"";let t=n.match(/\b(\d{4})\b/);return t?t[1]:""}};
