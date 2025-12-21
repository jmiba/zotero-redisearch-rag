export const TOOL_ASSETS: Record<string, string> = {
  "docling_extract.py": String.raw`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.1.4
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
    if config.enable_llm_correction and config.llm_correct:
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
`,
  "index_redisearch.py": String.raw`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.1.4
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
`,
  "rag_query_redisearch.py": String.raw`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.1.4
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
`,
  "batch_index_pyzotero.py": String.raw`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.1.4
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
`,
  "ocr_wordlist.txt": String.raw`# zotero-redisearch-rag tool version: 0.1.4
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
`,
};