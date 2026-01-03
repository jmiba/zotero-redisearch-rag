#!/usr/bin/env python3
"""
PaddleOCR smoke test for a PDF or an image.

How to run
- From repository root:
    - PDF: python tests/paddle_ocr_smoke.py --pdf /path/to/file.pdf [--dpi 300] [--pages 3] [--max-side 3500] [--dump] [--preview-len 500] [--print-text] [--out out.txt]
    - Image: python tests/paddle_ocr_smoke.py --image /path/to/file.png [--max-side 3500] [--dump] [--preview-len 500] [--print-text] [--out out.txt]

Options
- --pdf: Path to a PDF to OCR. When set, the script renders the first N pages with pdf2image and runs PaddleOCR. Mutually exclusive with --image.
- --image: Path to a single image (PNG/JPG/TIFF, etc.) to OCR. Mutually exclusive with --pdf.
- --dpi: Maximum rasterization DPI for PDF pages (default 300). The effective DPI may be reduced when --max-side is set to avoid oversize images.
- --pages: Number of first pages to OCR from the PDF (default 3). Automatically capped to the total page count.
- --max-side: Maximum pixel length of the longest side of the rendered page/image. Behavior:
    - PDF: target_dpi = max-side * 72 / max(page_width_points, page_height_points); effective_dpi = min(--dpi, target_dpi).
    - Image: the image is downscaled so max(width, height) <= max-side (Lanczos filter).
- --dump: Print raw PaddleOCR result structure information per page (types, sizes, keys) for debugging.
- --preview-len: Print a single-line preview of the first K characters of the OCR text (default 500). Set 0 to disable preview.
- --print-text: Print the full OCR text to stdout.
- --out: Write the full OCR text to the specified file path.
- --out-md: Write layout-labeled markdown output (only when layout OCR is used).
- --pp-structure-v3: Use a layout pipeline instead of plain OCR (PaddleX layout first), with plain OCR fallback for text. Requires extra deps (cv2, shapely, pyclipper, paddlex).

OCR toggles
- --doc-orientation / --no-doc-orientation: Enable/disable document orientation classification before OCR (default overridden in script defaults).
- --doc-unwarping / --no-doc-unwarping: Enable/disable document unwarping before OCR (default overridden in script defaults).
- --textline-orientation / --no-textline-orientation: Enable/disable text line orientation classification for OCR.

Layout tuning (with --pp-structure-v3)
- --layout-model: PaddleX layout model name (PP-DocLayout-L|PP-DocLayout-M|PP-DocLayout-S). Default: PP-DocLayout-L
- --layout-threshold: Float threshold (e.g., 0.2) to keep lower-confidence layout boxes.
- --layout-img-size: Input img_size for PaddleX model (e.g., 1024).
- --layout-merge: Merging mode for overlapping boxes (large|small|union).
- --layout-unclip: Unclip ratio to expand boxes (e.g., 1.2).
- --layout-device: Device string for PaddleX (e.g., cpu, gpu:0). Default determined by PaddleX.
- --layout-nms: Enable NMS in layout post-processing.
 - --fail-on-zero-layout: Exit immediately if zero layout detections are produced.

Examples
- python tests/paddle_ocr_smoke.py --pdf sample.pdf --pages 2 --print-text
- python tests/paddle_ocr_smoke.py --image sample.png --dump --preview-len 300

Notes
- Run inside your plugin virtualenv if you created one (pip install -r requirements.txt).
- Requires: paddleocr, pillow, numpy; pdf2image for PDFs. On macOS, install Poppler for pdf2image (e.g., brew install poppler).
- Default OCR language is English (lang="en"). To test another language, adjust ocr_kwargs["lang"].
"""
import argparse
import os
import sys
import warnings
import numbers
import shutil
from typing import Optional


# -----------------------------------------------------------------------------
# Config overrides
#
# Define overrides for script options. If a corresponding CLI flag is NOT
# provided, these values will be applied after parsing to replace the built-in
# parser defaults.
# -----------------------------------------------------------------------------

GENERAL_DEFAULTS = {
    "dpi": 300,
    "pages": 2,
    "max_side": 3000,
    "preview_len": 500,
    "doc_orientation": False,
    "doc_unwarping": False,
    "textline_orientation": True,
}

LAYOUT_DEFAULTS = {
    "layout_model": "PP-DocLayout-L",     # or PP-DocLayout-M / PP-DocLayout-S
    "layout_threshold": 0.3,               # keep lower-confidence boxes
    "layout_img_size": 6000,               # larger input can help two-column pages
    "layout_merge": "small",              # keep both inner and outer boxes
    "layout_unclip": 1.0,                  # expand boxes slightly
    "layout_device": None,                 # e.g., "cpu" or "gpu:0"; None = PaddleX default
    "layout_nms": True,                    # enable NMS postprocessing
    "fail_on_zero_layout": True,
    "layout_recognize_boxes": True,        # run OCR inside detected layout boxes
    "crop_padding": 50,                    # padding around cropped layout boxes
    "crop_vbias": 0,                       # positive shifts padding downward (less top, more bottom)
}

FLAGS_DEFAULTS = {
    # Enable layout path by default unless CLI overrides
    "pp_structure_v3": True,
    # Enable dump output by default unless CLI overrides
    "dump": True,
    # Default path to save crops under the tests folder
    "save_crops": os.path.join(os.path.dirname(__file__), "_ocr_crops"),
    # Default path to save layout-labeled markdown output
    "out_md": os.path.join(os.path.dirname(__file__), "_ocr_output.md"),
    # Default set of PaddleX layout labels to OCR (case-insensitive, comma-separated)
    "layout_keep_labels": "text,paragraph_title,title,heading,caption,header,number,figure_title,body,section,text_block,textbox,textline,paragraph",
}

# Global counter for saving debug crops when --save-crops is enabled
CROP_SAVE_SEQ = 0

def _cli_provided(*names: str) -> bool:
    """Return True if any of the CLI option names was provided on the command line."""
    argv = sys.argv[1:]
    return any(name in argv for name in names)


def main() -> int:
    parser = argparse.ArgumentParser(description="Run a PaddleOCR smoke test on a PDF or image.")
    parser.add_argument("--pdf", help="Path to a PDF to OCR")
    parser.add_argument("--image", help="Path to an image to OCR")
    parser.add_argument("--dpi", type=int, default=None, help="Max DPI for PDF rasterization")
    parser.add_argument(
        "--pages",
        type=int,
        default=None,
        help="Number of PDF pages to OCR (default: 3)",
    )
    parser.add_argument(
        "--max-side",
        type=int,
        default=None,
        help="Max rendered side in pixels (0 to disable)",
    )
    parser.add_argument("--dump", action="store_true", help="Print raw result details for debugging")
    parser.add_argument(
        "--preview-len",
        type=int,
        default=None,
        help="Preview length for console output (0 to disable)",
    )
    parser.add_argument(
        "--print-text",
        action="store_true",
        help="Print full OCR text to stdout",
    )
    parser.add_argument(
        "--out",
        help="Optional path to write full OCR text",
    )
    parser.add_argument(
        "--out-md",
        dest="out_md",
        help="Optional path to write layout-labeled markdown output",
    )
    # PP-Structure flag (allow --pp-structure-v3 / --no-pp-structure-v3 when available)
    try:
        bool_action = argparse.BooleanOptionalAction  # type: ignore[attr-defined]
    except Exception:
        bool_action = None
    if bool_action is not None:
        parser.add_argument(
            "--pp-structure-v3",
            dest="pp_structure_v3",
            action=bool_action,  # type: ignore[arg-type]
            default=None,
            help="Enable/disable PP-StructureV3 layout detection pipeline for OCR",
        )
    else:
        parser.add_argument(
            "--pp-structure-v3",
            dest="pp_structure_v3",
            action="store_true",
            help="Use PP-StructureV3 layout detection pipeline for OCR",
        )
    # OCR toggles
    try:
        bool_action = argparse.BooleanOptionalAction  # type: ignore[attr-defined]
    except Exception:
        bool_action = None
    if bool_action is not None:
        parser.add_argument("--doc-orientation", action=bool_action, default=None, help="Enable/disable document orientation classification")  # type: ignore[arg-type]
        parser.add_argument("--doc-unwarping", action=bool_action, default=None, help="Enable/disable document unwarping")  # type: ignore[arg-type]
        parser.add_argument("--textline-orientation", action=bool_action, default=None, help="Enable/disable text line orientation classification")  # type: ignore[arg-type]
    else:
        parser.add_argument("--doc-orientation", action="store_true", help="Enable document orientation classification")
        parser.add_argument("--doc-unwarping", action="store_true", help="Enable document unwarping")
        parser.add_argument("--textline-orientation", action="store_true", help="Enable text line orientation classification")
    # Layout tuning options (PaddleX)
    parser.add_argument(
        "--layout-model",
        choices=["PP-DocLayout-L", "PP-DocLayout-M", "PP-DocLayout-S"],
        default=None,
        help="PaddleX layout model to use",
    )
    parser.add_argument(
        "--layout-threshold",
        type=float,
        default=None,
        help="Layout detection score threshold (e.g., 0.2)",
    )
    parser.add_argument(
        "--layout-img-size",
        type=int,
        default=None,
        help="PaddleX model img_size (e.g., 1024)",
    )
    parser.add_argument(
        "--layout-merge",
        choices=["large", "small", "union"],
        default=None,
        help="Merging mode for overlapping layout boxes",
    )
    parser.add_argument(
        "--layout-unclip",
        type=float,
        default=None,
        help="Unclip ratio to expand layout boxes (e.g., 1.2)",
    )
    parser.add_argument(
        "--crop-padding",
        type=int,
        default=0,
        help="Padding in pixels to add around cropped layout boxes (default: 0)",
    )
    parser.add_argument(
        "--crop-vbias",
        type=int,
        default=0,
        help="Vertical bias for padding: positive reduces top padding and increases bottom padding",
    )
    parser.add_argument(
        "--layout-device",
        type=str,
        default=None,
        help="PaddleX device (e.g., cpu, gpu:0)",
    )
    parser.add_argument(
        "--layout-keep-labels",
        type=str,
        default=None,
        help=(
            "Comma-separated list of PaddleX layout labels to OCR (case-insensitive). "
            "Defaults: text,paragraph_title,title,heading,caption,header,number,figure_title,body,section,text_block,textblock"
        ),
    )
    parser.add_argument(
        "--save-crops",
        type=str,
        default=None,
        help="Optional directory to save detected layout region crops for debugging",
    )
    # Python 3.9+: tri-state boolean with --layout-nms / --no-layout-nms
    try:
        bool_action = argparse.BooleanOptionalAction  # type: ignore[attr-defined]
    except Exception:
        bool_action = None
    if bool_action is not None:
        parser.add_argument(
            "--layout-nms",
            action=bool_action,  # type: ignore[arg-type]
            default=None,
            help="Enable/disable NMS post-processing for layout",
        )
        parser.add_argument(
            "--fail-on-zero-layout",
            action=bool_action,  # type: ignore[arg-type]
            default=None,
            help="Exit with non-zero status if layout detections == 0",
        )
        parser.add_argument(
            "--layout-recognize-boxes",
            action=bool_action,  # type: ignore[arg-type]
            default=None,
            help="Recognize text inside detected layout boxes (PaddleX)",
        )
    else:
        parser.add_argument(
            "--layout-nms",
            action="store_true",
            help="Enable NMS post-processing for layout",
        )
        parser.add_argument(
            "--fail-on-zero-layout",
            action="store_true",
            help="Exit with non-zero status if layout detections == 0",
        )
        parser.add_argument(
            "--layout-recognize-boxes",
            action="store_true",
            help="Recognize text inside detected layout boxes (PaddleX)",
        )
    args = parser.parse_args()

    # Apply override defaults when CLI flags are not provided
    if getattr(args, "pp_structure_v3", None) is None:
        args.pp_structure_v3 = FLAGS_DEFAULTS["pp_structure_v3"]
    if not _cli_provided("--dump") and not getattr(args, "dump", False):
        args.dump = FLAGS_DEFAULTS["dump"]

    if not _cli_provided("--dpi") and args.dpi is None:
        args.dpi = GENERAL_DEFAULTS["dpi"]
    if not _cli_provided("--pages") and args.pages is None:
        args.pages = GENERAL_DEFAULTS["pages"]
    if not _cli_provided("--max-side") and args.max_side is None:
        args.max_side = GENERAL_DEFAULTS["max_side"]
    if not _cli_provided("--preview-len") and args.preview_len is None:
        args.preview_len = GENERAL_DEFAULTS["preview_len"]

    if args.pp_structure_v3:
        if not _cli_provided("--layout-model") and args.layout_model is None:
            args.layout_model = LAYOUT_DEFAULTS["layout_model"]
        if not _cli_provided("--layout-threshold") and args.layout_threshold is None:
            args.layout_threshold = LAYOUT_DEFAULTS["layout_threshold"]
        if not _cli_provided("--layout-img-size") and args.layout_img_size is None:
            args.layout_img_size = LAYOUT_DEFAULTS["layout_img_size"]
        if not _cli_provided("--layout-merge") and args.layout_merge is None:
            args.layout_merge = LAYOUT_DEFAULTS["layout_merge"]
        if not _cli_provided("--layout-unclip") and args.layout_unclip is None:
            args.layout_unclip = LAYOUT_DEFAULTS["layout_unclip"]
        if not _cli_provided("--crop-padding"):
            args.crop_padding = LAYOUT_DEFAULTS.get("crop_padding", 0)
        if not _cli_provided("--crop-vbias"):
            args.crop_vbias = LAYOUT_DEFAULTS.get("crop_vbias", 0)
        if not _cli_provided("--layout-device") and args.layout_device is None:
            args.layout_device = LAYOUT_DEFAULTS["layout_device"]
        # Boolean tri-state; only apply override when parser captured None
        if getattr(args, "layout_nms", None) is None:
            args.layout_nms = LAYOUT_DEFAULTS["layout_nms"]
        if getattr(args, "fail_on_zero_layout", None) is None:
            args.fail_on_zero_layout = LAYOUT_DEFAULTS["fail_on_zero_layout"]
    # Apply flag-level defaults for non-boolean flags
    if not _cli_provided("--save-crops") and getattr(args, "save_crops", None) is None:
        args.save_crops = FLAGS_DEFAULTS["save_crops"]
        if getattr(args, "layout_recognize_boxes", None) is None:
            args.layout_recognize_boxes = LAYOUT_DEFAULTS["layout_recognize_boxes"]
    if not _cli_provided("--out-md") and getattr(args, "out_md", None) is None:
        args.out_md = FLAGS_DEFAULTS["out_md"]

    # OCR toggle defaults
    if getattr(args, "doc_orientation", None) is None and not _cli_provided("--doc-orientation", "--no-doc-orientation"):
        args.doc_orientation = GENERAL_DEFAULTS["doc_orientation"]
    if getattr(args, "doc_unwarping", None) is None and not _cli_provided("--doc-unwarping", "--no-doc-unwarping"):
        args.doc_unwarping = GENERAL_DEFAULTS["doc_unwarping"]
    if getattr(args, "textline_orientation", None) is None and not _cli_provided("--textline-orientation", "--no-textline-orientation"):
        args.textline_orientation = GENERAL_DEFAULTS["textline_orientation"]

    if not args.pdf and not args.image:
        parser.print_help()
        return 2

    if getattr(args, "save_crops", None):
        try:
            if os.path.isdir(args.save_crops):
                shutil.rmtree(args.save_crops)
            elif os.path.exists(args.save_crops):
                os.remove(args.save_crops)
        except Exception as exc:
            if bool(getattr(args, "dump", False)):
                print(f"Failed to clear crops directory: {exc}")

    os.environ["PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK"] = "True"
    os.environ["DISABLE_MODEL_SOURCE_CHECK"] = "True"

    try:
        import numpy as np
        from paddleocr import PaddleOCR
        from PIL import Image as _PILImage
    except Exception as exc:
        print(f"Failed to import PaddleOCR: {exc}")
        return 2

    # Disable Pillow decompression bomb checks for high-DPI PDF renders
    _PILImage.MAX_IMAGE_PIXELS = None  # type: ignore[attr-defined]
    if hasattr(_PILImage, "DecompressionBombWarning"):
        warnings.filterwarnings("ignore", category=_PILImage.DecompressionBombWarning)  # type: ignore[attr-defined]

    ocr_kwargs = {
        "lang": "en",
        "use_doc_orientation_classify": bool(getattr(args, "doc_orientation", True)),
        "use_doc_unwarping": bool(getattr(args, "doc_unwarping", True)),
    }
    # Some PaddleOCR builds expose textline orientation toggle via constructor
    if getattr(args, "textline_orientation", None) is not None:
        ocr_kwargs["use_textline_orientation"] = bool(args.textline_orientation)
    if args.max_side and args.max_side > 0:
        ocr_kwargs["text_det_limit_side_len"] = args.max_side
        ocr_kwargs["text_det_limit_type"] = "max"

    def _create_ocr_direct(kwargs: dict) -> PaddleOCR:
        return PaddleOCR(**kwargs)

    def _try_create_direct(kwargs: dict) -> PaddleOCR | None:
        try:
            return _create_ocr_direct(kwargs)
        except TypeError:
            return None
        except Exception:
            return None

    # Always try to create a plain OCR instance so we can gracefully fall back
    # when PP-Structure is unavailable or yields no text.
    # Try multiple constructor variants for PaddleOCR to be compatible with different versions
    reduced_kwargs = dict(ocr_kwargs)
    reduced_kwargs.pop("use_doc_orientation_classify", None)
    reduced_kwargs.pop("use_doc_unwarping", None)

    # Candidates in order of preference
    ctor_candidates: list[dict] = []
    # 1) Newer versions may support explicit textline orientation flag
    ctor_candidates.append({**ocr_kwargs, "use_textline_orientation": True})
    ctor_candidates.append({**reduced_kwargs, "use_textline_orientation": True})
    # 2) Some versions don't accept textline flag at all
    ctor_candidates.append({**ocr_kwargs})
    ctor_candidates.append({**reduced_kwargs})
    # 3) Older versions use angle classifier flag instead
    ctor_candidates.append({**ocr_kwargs, "use_angle_cls": bool(getattr(args, "textline_orientation", True))})
    ctor_candidates.append({**reduced_kwargs, "use_angle_cls": bool(getattr(args, "textline_orientation", True))})

    ocr: PaddleOCR | None = None
    for kw in ctor_candidates:
        ocr = _try_create_direct(kw)
        if ocr is not None:
            break

    images = []
    if args.pdf:
        try:
            from pdf2image import convert_from_path, pdfinfo_from_path
        except Exception as exc:
            print(f"pdf2image is required for PDF OCR: {exc}")
            return 2
        effective_dpi = args.dpi
        total_pages = 0
        if args.max_side and args.max_side > 0:
            try:
                info = pdfinfo_from_path(args.pdf)
                total_pages = int(info.get("Pages", 0) or 0)
                page_w = float(info.get("Page width", 0) or 0)
                page_h = float(info.get("Page height", 0) or 0)
                max_side_points = max(page_w, page_h)
                if max_side_points > 0:
                    target_dpi = int(args.max_side * 72 / max_side_points)
                    if target_dpi > 0:
                        effective_dpi = min(effective_dpi, target_dpi)
            except Exception as exc:
                print(f"PDF size lookup failed; using dpi={effective_dpi}: {exc}")
        page_count = max(1, int(args.pages))
        if total_pages:
            page_count = min(page_count, total_pages)
        if total_pages:
            print(f"PDF pages: {total_pages}; OCRing first {page_count}")
        images = convert_from_path(args.pdf, dpi=effective_dpi, first_page=1, last_page=page_count)
        if not images:
            print("No pages rendered from PDF.")
            return 2
        print(f"Effective DPI: {effective_dpi}")
        if len(images) != page_count:
            print(f"Rendered pages: {len(images)} (requested {page_count})")
    else:
        try:
            from PIL import Image
        except Exception as exc:
            print(f"Pillow is required for image OCR: {exc}")
            return 2
        images = [Image.open(args.image)]

    def _paddle_obj_to_dict(obj: object) -> dict | None:
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

    def _extract_from_dict(res: dict) -> list[str]:
        texts = res.get("rec_texts") or res.get("texts") or res.get("rec_text")
        if not isinstance(texts, list):
            return []
        return [str(text or "").strip() for text in texts if str(text or "").strip()]

    def _extract_texts(res: object) -> list[str]:
        if isinstance(res, dict):
            return _extract_from_dict(res)
        if isinstance(res, list):
            entries = res
            if len(res) == 1:
                maybe_dict = _paddle_obj_to_dict(res[0])
                if maybe_dict is not None:
                    return _extract_from_dict(maybe_dict)
                if isinstance(res[0], (list, tuple, dict)):
                    entries = res[0]
            if isinstance(entries, dict):
                return _extract_from_dict(entries)
            if isinstance(entries, list) and entries and isinstance(entries[0], dict):
                combined: list[str] = []
                for entry in entries:
                    if isinstance(entry, dict):
                        combined.extend(_extract_from_dict(entry))
                    else:
                        maybe_dict = _paddle_obj_to_dict(entry)
                        if maybe_dict is not None:
                            combined.extend(_extract_from_dict(maybe_dict))
                return combined
            texts: list[str] = []
            for entry in entries:
                if not entry or not isinstance(entry, (list, tuple)) or len(entry) < 2:
                    continue
                text_part = entry[1]
                if isinstance(text_part, (list, tuple)) and text_part:
                    text_val = str(text_part[0] or "").strip()
                else:
                    text_val = str(text_part or "").strip()
                if text_val:
                    texts.append(text_val)
            return texts
        return []

    def _ocr_predict(image: object, det: bool | None = None, rec: bool | None = None, cls: bool | None = None) -> object | None:
        if ocr is None or not hasattr(ocr, "predict"):
            return None
        try:
            if det is None and rec is None and cls is None:
                return ocr.predict(image)  # type: ignore[attr-defined]
            return ocr.predict(image, det=det, rec=rec, cls=cls)  # type: ignore[attr-defined]
        except TypeError:
            try:
                return ocr.predict(image)  # type: ignore[attr-defined]
            except Exception:
                return None
        except Exception:
            return None

    def _ocr_legacy(image: object, **kwargs: object) -> object | None:
        if ocr is None or not hasattr(ocr, "ocr"):
            return None
        try:
            with warnings.catch_warnings():
                warnings.filterwarnings(
                    "ignore",
                    message="Please use `predict` instead.",
                    category=DeprecationWarning,
                )
                return ocr.ocr(image, **kwargs)  # type: ignore[attr-defined]
        except TypeError:
            return None
        except Exception:
            return None

    # PP-Structure helpers (layout pipeline)
    def _strip_html(text: str) -> str:
        import re as _re
        return _re.sub(r"<[^>]+>", " ", text)

    def _block_to_dict(block: object) -> dict:
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

    def _extract_block_lines(block: dict) -> list[str]:
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
            lines: list[str] = []
            for item in res:
                if isinstance(item, str):
                    s = item.strip()
                    if s:
                        lines.append(s)
                elif isinstance(item, dict):
                    tv = item.get("text")
                    if isinstance(tv, str):
                        s = tv.strip()
                        if s:
                            lines.append(s)
            return lines
        return []

    def _paddlex_structure_extract_texts(
        image_obj,
        lang: str,
        src_path: str | None = None,
        page_num: int | None = None,
    ) -> tuple[list[str], bool, list[list[dict]]]:
        """Try PaddleX layout via create_model. If `src_path` is provided, prefer
        calling `model.predict(src_path, ...)` because PaddleX may behave
        differently for file paths vs arrays. Returns [] to let OCR fallback
        produce text; prints diagnostics when available.
        """
        try:
            from paddlex import create_model
        except Exception as exc:
            print(f"PaddleX create_model import failed: {exc}")
            print("Diagnosis: PaddleX create_model not available. Will fall back to plain OCR.")
            return [], False
        cm_kwargs = {"model_name": args.layout_model}
        if args.layout_device:
            cm_kwargs["device"] = args.layout_device
        img_size = args.layout_img_size
        try:
            if img_size:
                model = create_model(**{**cm_kwargs, "img_size": img_size})
            else:
                model = create_model(**cm_kwargs)
        except Exception as exc:
            msg = str(exc)
            print(f"PaddleX create_model('{args.layout_model}') failed: {msg}")
            if img_size is not None and ("not supported set input shape" in msg.lower() or "not supported" in msg.lower()):
                print("Diagnosis: Model does not support overriding img_size; retrying with default config.")
                try:
                    model = create_model(**cm_kwargs)
                except Exception as exc2:
                    print(f"PaddleX create_model retry without img_size failed: {exc2}")
                    return [], False
            else:
                return [], False
        try:
            import numpy as _np
            predict_kwargs = {"batch_size": 1}
            if args.layout_threshold is not None:
                predict_kwargs["threshold"] = args.layout_threshold
            predict_kwargs["layout_nms"] = bool(args.layout_nms)
            if args.layout_unclip is not None:
                predict_kwargs["layout_unclip_ratio"] = args.layout_unclip
            if args.layout_merge is not None:
                predict_kwargs["layout_merge_bboxes_mode"] = args.layout_merge
            # Prefer file path when available because paddlex may optimize file input
            if src_path and isinstance(src_path, str):
                out_gen = model.predict(src_path, **predict_kwargs)
            else:
                out_gen = model.predict(_np.array(image_obj), **predict_kwargs)
            output = list(out_gen)
        except Exception as exc:
            print(f"PaddleX layout predict failed: {exc}")
            return [], False
        layout_has_boxes = False
        # Diagnostics: count detections if possible
        try:
            total = 0
            if isinstance(output, (list, tuple)):
                for res in output:
                        # First try to convert paddlex result objects to dicts
                        try:
                            maybe = _paddle_obj_to_dict(res)
                        except Exception:
                            maybe = None
                        if isinstance(maybe, dict):
                            dets = maybe.get("boxes") or maybe.get("layout") or maybe.get("result") or maybe.get("dt_polys") or maybe.get("predictions") or []
                            if isinstance(dets, (list, tuple)):
                                total += len(dets)
                                continue
                        # Fallback: try existing heuristics on raw objects/dicts
                        res_json = getattr(res, "json", None)
                        if res_json is None and isinstance(res, dict):
                            res_json = res
                        if isinstance(res_json, dict):
                            dets = res_json.get("boxes") or res_json.get("layout") or res_json.get("result") or []
                            total += len(dets) if isinstance(dets, (list, tuple)) else 0
            print(f"PaddleX layout detections: {total}")
            layout_has_boxes = total > 0
            if args.dump:
                print(f"PaddleX raw output length: {len(output)}")
                if output:
                    first = output[0]
                    try:
                        print(f"First output type: {type(first)}")
                        print(f"First output repr: {repr(first)[:200]}")
                    except Exception:
                        pass
                    try:
                        maybe = _paddle_obj_to_dict(first)
                        if isinstance(maybe, dict):
                            print(f"First output dict keys: {sorted(maybe.keys())}")
                            # print sizes for common fields
                            for k in ("boxes", "dt_polys", "rec_texts", "predictions"):
                                if k in maybe:
                                    v = maybe[k]
                                    try:
                                        print(f"  {k} length: {len(v)}")
                                    except Exception:
                                        pass
                    except Exception:
                        pass
            if total == 0 and bool(getattr(args, "fail_on_zero_layout", False)):
                print("Stopping due to --fail-on-zero-layout and 0 layout detections.")
                sys.exit(5)
        except Exception:
            pass
        # If requested, run OCR inside detected layout boxes and reconstruct text
        if bool(getattr(args, "layout_recognize_boxes", False)):
            # Try to extract boxes from first output element
            boxes: list = []
            try:
                first = output[0] if isinstance(output, (list, tuple)) and output else None
                maybe = _paddle_obj_to_dict(first)
                if isinstance(maybe, dict):
                    raw_boxes = maybe.get("boxes") or []
                    if isinstance(raw_boxes, (list, tuple)):
                        boxes = list(raw_boxes)
            except Exception:
                boxes = []
            if boxes:
                layout_has_boxes = True
                from PIL import Image, ImageOps, ImageFilter
                import numpy as _np
                # Helpers to parse OCR entries with quads and order into columns
                def _iter_ocr_entries(res: object) -> list[tuple[object, str]]:
                    out: list[tuple[object, str]] = []
                    # Try generic Paddle object conversion first (handles OCRResult)
                    try:
                        maybe = _paddle_obj_to_dict(res)
                        if isinstance(maybe, dict):
                            texts = maybe.get("rec_texts") or maybe.get("texts") or maybe.get("rec_text")
                            boxes = (
                                maybe.get("dt_polys")
                                or maybe.get("det_polys")
                                or maybe.get("dt_boxes")
                                or maybe.get("boxes")
                            )
                            if isinstance(texts, list):
                                for i, tv in enumerate(texts):
                                    s = str(tv or "").strip()
                                    if not s:
                                        continue
                                    quad = None
                                    if isinstance(boxes, list) and i < len(boxes):
                                        quad = boxes[i]
                                    out.append((quad, s))
                                return out
                    except Exception:
                        pass
                    if isinstance(res, dict):
                        texts = res.get("rec_texts") or res.get("texts") or res.get("rec_text")
                        boxes = (
                            res.get("dt_polys")
                            or res.get("det_polys")
                            or res.get("dt_boxes")
                            or res.get("boxes")
                        )
                        if isinstance(texts, list):
                            for i, tv in enumerate(texts):
                                s = str(tv or "").strip()
                                if not s:
                                    continue
                                quad = None
                                if isinstance(boxes, list) and i < len(boxes):
                                    quad = boxes[i]
                                out.append((quad, s))
                        return out
                    if isinstance(res, list):
                        entries = res
                        if len(res) == 1:
                            maybe = _paddle_obj_to_dict(res[0])
                            if isinstance(maybe, dict):
                                return _iter_ocr_entries(maybe)
                            if isinstance(res[0], (list, tuple, dict)):
                                entries = res[0]
                        if isinstance(entries, dict):
                            return _iter_ocr_entries(entries)
                        for entry in entries:
                            if isinstance(entry, str):
                                s = entry.strip()
                                if s:
                                    out.append((None, s))
                                continue
                            if not isinstance(entry, (list, tuple)):
                                continue
                            if entry and isinstance(entry[0], str):
                                s = str(entry[0] or "").strip()
                                if s:
                                    out.append((None, s))
                                continue
                            quad = entry[0] if len(entry) > 0 else None
                            text_part = entry[1] if len(entry) > 1 else None
                            if isinstance(text_part, (list, tuple)) and text_part:
                                s = str(text_part[0] or "").strip()
                            else:
                                s = str(text_part or "").strip()
                            if s:
                                out.append((quad, s))
                        return out
                    return out

                def _bbox_from_quad(quad: object) -> tuple[float, float, float, float, float] | None:
                    try:
                        if isinstance(quad, (list, tuple)) and quad and isinstance(quad[0], (list, tuple)):
                            xs = [float(p[0]) for p in quad]
                            ys = [float(p[1]) for p in quad]
                            x0, y0, x1, y1 = min(xs), min(ys), max(xs), max(ys)
                            return x0, y0, x1, y1, 0.5 * (x0 + x1)
                    except Exception:
                        return None
                    return None

                def _order_blocks_into_columns(blocks: list[dict]) -> list[list[dict]]:
                    if not blocks:
                        return []

                    def _center_y(block: dict) -> float:
                        try:
                            return 0.5 * (float(block.get("y0", 0.0)) + float(block.get("y1", 0.0)))
                        except Exception:
                            return 0.0

                    def _is_full_width(block: dict) -> bool:
                        page_width = max(1.0, float(w or 1))
                        try:
                            width = float(block.get("x1", 0.0)) - float(block.get("x0", 0.0))
                        except Exception:
                            width = 0.0
                        if width <= 0.0:
                            return False
                        ratio = width / page_width
                        label = str(block.get("label", "")).strip().lower()
                        full_labels = {"title", "heading", "header", "paragraph_title", "figure_title", "caption"}
                        if ratio >= 0.85:
                            return True
                        if label in full_labels and ratio >= 0.6:
                            return True
                        return False

                    def _order_columns(col_blocks: list[dict]) -> list[list[dict]]:
                        if not col_blocks:
                            return []
                        xs = sorted(b["xc"] for b in col_blocks)
                        span = max(1.0, xs[-1] - xs[0]) if xs else 1.0
                        widths = sorted((b["x1"] - b["x0"]) for b in col_blocks)
                        w_med = widths[len(widths) // 2] if widths else 1.0
                        gap_thr = max(0.06 * span, 0.5 * w_med)

                        diffs: list[tuple[float, int]] = []
                        for i in range(1, len(xs)):
                            diffs.append((xs[i] - xs[i - 1], i))
                        candidates = [idx for (gap, idx) in diffs if gap >= gap_thr]

                        blocks_sorted = sorted(col_blocks, key=lambda b: b["xc"])  # align with xs order
                        columns: list[list[dict]] = []
                        used_splits: list[int] = []
                        min_lines = max(3, len(col_blocks) // 20 or 1)

                        if candidates:
                            # Try 3 columns via two splits first
                            cands_sorted = sorted(candidates, reverse=True)
                            tried = False
                            for a_idx in range(min(5, len(cands_sorted))):
                                for b_idx in range(a_idx + 1, min(6, len(cands_sorted))):
                                    a = cands_sorted[a_idx]
                                    b = cands_sorted[b_idx]
                                    lo, hi = min(a, b), max(a, b)
                                    if lo < min_lines or (hi - lo) < min_lines or (len(col_blocks) - hi) < min_lines:
                                        continue
                                    used_splits = [lo, hi]
                                    tried = True
                                    break
                                if tried:
                                    break
                            if not used_splits:
                                # Fallback to 2 columns: largest valid gap
                                for _, i in sorted(diffs, key=lambda t: t[0], reverse=True):
                                    if i >= min_lines and (len(col_blocks) - i) >= min_lines:
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
                            # Threshold grouping
                            cur: list[dict] = []
                            prev_xc: float | None = None
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

                        # Sort columns left-to-right; lines top-down
                        def col_key(col: list[dict]) -> float:
                            # Use left edge to avoid wide boxes shifting column order.
                            left_edges = [b["x0"] for b in col if isinstance(b.get("x0"), (int, float))]
                            if left_edges:
                                return min(left_edges)
                            centers = sorted(b["xc"] for b in col)
                            return centers[len(centers) // 2]

                        columns = [col for col in columns if col]
                        columns.sort(key=col_key)
                        ordered_columns: list[list[dict]] = []
                        for col in columns:
                            col_sorted = sorted(col, key=lambda b: (b["y0"], b["x0"]))
                            if col_sorted:
                                ordered_columns.append(col_sorted)
                        return ordered_columns

                    full_blocks: list[dict] = []
                    normal_blocks: list[dict] = []
                    for block in blocks:
                        if _is_full_width(block):
                            block["full_width"] = True
                            full_blocks.append(block)
                        else:
                            normal_blocks.append(block)

                    if not full_blocks:
                        return _order_columns(blocks)

                    full_blocks = sorted(full_blocks, key=lambda b: b.get("y0", 0.0))
                    normal_sorted = sorted(normal_blocks, key=_center_y)
                    sections: list[tuple[str, list[dict]]] = []

                    normal_idx = 0
                    start_y = float("-inf")

                    def _collect_until(y_max: float) -> list[dict]:
                        nonlocal normal_idx, start_y
                        seg: list[dict] = []
                        while normal_idx < len(normal_sorted):
                            b = normal_sorted[normal_idx]
                            yc = _center_y(b)
                            if yc < start_y:
                                normal_idx += 1
                                continue
                            if yc >= y_max:
                                break
                            seg.append(b)
                            normal_idx += 1
                        return seg

                    for fb in full_blocks:
                        seg = _collect_until(float(fb.get("y0", 0.0)))
                        if seg:
                            sections.append(("columns", seg))
                        sections.append(("full", [fb]))
                        start_y = float(fb.get("y1", fb.get("y0", 0.0)))

                    tail: list[dict] = []
                    while normal_idx < len(normal_sorted):
                        b = normal_sorted[normal_idx]
                        if _center_y(b) >= start_y:
                            tail.append(b)
                        normal_idx += 1
                    if tail:
                        sections.append(("columns", tail))

                    ordered_columns: list[list[dict]] = []
                    for kind, seg in sections:
                        if kind == "full":
                            ordered_columns.append(seg)
                        else:
                            ordered_columns.extend(_order_columns(seg))
                    return ordered_columns

                def _columns_to_text(columns: list[list[dict]]) -> str:
                    if not columns:
                        return ""
                    out_cols: list[str] = []
                    for col in columns:
                        lines = [str(b.get("text", "")).strip() for b in col if str(b.get("text", "")).strip()]
                        if lines:
                            out_cols.append("\n".join(lines))
                    return "\n\n".join([c for c in out_cols if c])

                def _rect_from_box(b) -> tuple[float, float, float, float] | None:
                    # Try attribute-based extraction first (object with coords)
                    try:
                        for names in (("x0","y0","x1","y1"),("xmin","ymin","xmax","ymax"),("left","top","right","bottom")):
                            if all(hasattr(b, n) for n in names):
                                x0 = float(getattr(b, names[0])); y0 = float(getattr(b, names[1]))
                                x1 = float(getattr(b, names[2])); y1 = float(getattr(b, names[3]))
                                return (x0, y0, x1, y1)
                        # Some objects have a bbox attribute
                        bb_attr = getattr(b, "bbox", None)
                        if bb_attr is not None:
                            return _rect_from_box(bb_attr)  # type: ignore
                    except Exception:
                        pass
                    # If it's a foreign object, try to_dict() next
                    if not isinstance(b, (dict, list, tuple)):
                        try:
                            maybe = _paddle_obj_to_dict(b)
                        except Exception:
                            maybe = None
                        if isinstance(maybe, dict):
                            b = maybe
                    if isinstance(b, dict):
                        coord = b.get("coordinate")
                        if coord is not None:
                            try:
                                import numpy as _np4
                                if isinstance(coord, _np4.ndarray):
                                    # Accept shapes (N,2) or flat
                                    if coord.ndim == 2 and coord.shape[1] == 2:
                                        coord = coord.reshape(-1, 2).tolist()
                                    else:
                                        coord = coord.flatten().tolist()
                            except Exception:
                                pass
                            if isinstance(coord, (list, tuple)):
                                # coord can be list of pairs [[x,y],...]
                                if coord and isinstance(coord[0], (list, tuple)) and len(coord[0]) >= 2:
                                    try:
                                        xs = [float(p[0]) for p in coord]
                                        ys = [float(p[1]) for p in coord]
                                        return (min(xs), min(ys), max(xs), max(ys)) if xs and ys else None
                                    except Exception:
                                        pass
                                # coord can be list of dicts [{'x':..,'y':..}, ...]
                                if coord and isinstance(coord[0], dict):
                                    try:
                                        xs = []
                                        ys = []
                                        for d in coord:
                                            x = d.get('x') if 'x' in d else d.get('X')
                                            y = d.get('y') if 'y' in d else d.get('Y')
                                            if x is None or y is None:
                                                continue
                                            xs.append(float(x)); ys.append(float(y))
                                        if xs and ys:
                                            return (min(xs), min(ys), max(xs), max(ys))
                                    except Exception:
                                        pass
                                # flat numeric list [x0,y0,x1,y1,...] or [x0,y0,x1,y1]
                                if len(coord) >= 8 and all(isinstance(v, numbers.Real) for v in coord):
                                    xs = [float(v) for v in coord[0::2]]
                                    ys = [float(v) for v in coord[1::2]]
                                    return (min(xs), min(ys), max(xs), max(ys)) if xs and ys else None
                                if len(coord) == 4 and all(isinstance(v, numbers.Real) for v in coord):
                                    x0, y0, a, b = float(coord[0]), float(coord[1]), float(coord[2]), float(coord[3])
                                    # Heuristic: if third/fourth are not greater than first/second, treat as width/height
                                    if a <= x0 or b <= y0:
                                        x1 = x0 + a
                                        y1 = y0 + b
                                    else:
                                        x1 = a
                                        y1 = b
                                    if x1 > x0 and y1 > y0:
                                        return (x0, y0, x1, y1)
                            # coord can be a dict with various schemas
                            if isinstance(coord, dict):
                                # direct corners
                                try:
                                    for names in (("x0","y0","x1","y1"),("xmin","ymin","xmax","ymax"),("left","top","right","bottom")):
                                        if all(k in coord for k in names):
                                            x0 = float(coord[names[0]]); y0 = float(coord[names[1]])
                                            x1 = float(coord[names[2]]); y1 = float(coord[names[3]])
                                            return (x0, y0, x1, y1)
                                except Exception:
                                    pass
                                # points/poly arrays inside the dict
                                for key in ("points", "poly", "polygon", "coords", "coordinates"):
                                    pts = coord.get(key)
                                    if pts is None:
                                        continue
                                    try:
                                        # normalize numpy
                                        import numpy as _np6
                                        if isinstance(pts, _np6.ndarray):
                                            if pts.ndim == 2 and pts.shape[1] == 2:
                                                pts = pts.reshape(-1, 2).tolist()
                                            else:
                                                pts = pts.flatten().tolist()
                                        if isinstance(pts, (list, tuple)):
                                            if pts and isinstance(pts[0], (list, tuple)) and len(pts[0]) >= 2:
                                                xs = [float(p[0]) for p in pts]
                                                ys = [float(p[1]) for p in pts]
                                                return (min(xs), min(ys), max(xs), max(ys)) if xs and ys else None
                                            if pts and isinstance(pts[0], dict):
                                                xs = []
                                                ys = []
                                                for d in pts:
                                                    x = d.get('x') if 'x' in d else d.get('X')
                                                    y = d.get('y') if 'y' in d else d.get('Y')
                                                    if x is None or y is None:
                                                        continue
                                                    xs.append(float(x)); ys.append(float(y))
                                                if xs and ys:
                                                    return (min(xs), min(ys), max(xs), max(ys))
                                            if len(pts) >= 8 and all(isinstance(v, numbers.Real) for v in pts):
                                                xs = [float(v) for v in pts[0::2]]
                                                ys = [float(v) for v in pts[1::2]]
                                                return (min(xs), min(ys), max(xs), max(ys)) if xs and ys else None
                                            if len(pts) == 4 and all(isinstance(v, (int, float)) for v in pts):
                                                x0, y0, a, b = float(pts[0]), float(pts[1]), float(pts[2]), float(pts[3])
                                                if a <= x0 or b <= y0:
                                                    x1 = x0 + a
                                                    y1 = y0 + b
                                                else:
                                                    x1 = a
                                                    y1 = b
                                                if x1 > x0 and y1 > y0:
                                                    return (x0, y0, x1, y1)
                                    except Exception:
                                        pass
                        bb = b.get("bbox") or b.get("box") or b.get("points") or b.get("poly")
                        if isinstance(bb, dict):
                            try:
                                x0 = float(bb.get("x0", bb.get("left", 0.0)))
                                y0 = float(bb.get("y0", bb.get("top", 0.0)))
                                x1 = float(bb.get("x1", bb.get("right", 0.0)))
                                y1 = float(bb.get("y1", bb.get("bottom", 0.0)))
                                return (x0, y0, x1, y1)
                            except Exception:
                                return None
                        # Some dicts may have explicit corners
                        try:
                            x0 = b.get("x0") or b.get("xmin") or b.get("left")
                            y0 = b.get("y0") or b.get("ymin") or b.get("top")
                            x1 = b.get("x1") or b.get("xmax") or b.get("right")
                            y1 = b.get("y1") or b.get("ymax") or b.get("bottom")
                            if all(v is not None for v in (x0, y0, x1, y1)):
                                return (float(x0), float(y0), float(x1), float(y1))
                        except Exception:
                            pass
                        if isinstance(bb, (list, tuple)):
                            if len(bb) == 4 and all(isinstance(v, (int, float)) for v in bb):
                                return (float(bb[0]), float(bb[1]), float(bb[2]), float(bb[3]))
                            if len(bb) >= 8 and all(isinstance(v, (int, float)) for v in bb):
                                xs = [float(v) for v in bb[0::2]]
                                ys = [float(v) for v in bb[1::2]]
                                return (min(xs), min(ys), max(xs), max(ys)) if xs and ys else None
                    if isinstance(b, (list, tuple)):
                        # Nested list-of-points (poly)
                        if b and isinstance(b[0], (list, tuple)) and len(b[0]) >= 2:
                            try:
                                xs = [float(p[0]) for p in b]
                                ys = [float(p[1]) for p in b]
                                return (min(xs), min(ys), max(xs), max(ys)) if xs and ys else None
                            except Exception:
                                pass
                        # Flat numeric list
                        if len(b) >= 8 and all(isinstance(v, (int, float)) for v in b):
                            xs = [float(v) for v in b[0::2]]
                            ys = [float(v) for v in b[1::2]]
                            return (min(xs), min(ys), max(xs), max(ys)) if xs and ys else None
                        if len(b) >= 4 and all(isinstance(v, (int, float)) for v in b[:4]):
                            return (float(b[0]), float(b[1]), float(b[2]), float(b[3]))
                    # Numpy array support
                    try:
                        import numpy as _np2  # local import
                        if isinstance(b, _np2.ndarray):
                            arr = b.flatten().tolist()
                            if len(arr) >= 8:
                                xs = [float(v) for v in arr[0::2]]
                                ys = [float(v) for v in arr[1::2]]
                                return (min(xs), min(ys), max(xs), max(ys)) if xs and ys else None
                            if len(arr) >= 4:
                                return (float(arr[0]), float(arr[1]), float(arr[2]), float(arr[3]))
                    except Exception:
                        pass
                    return None

                # Prepare OCR on boxes using existing ocr instance
                rects: list[dict] = []
                kept_labels: list[str] = []
                skipped_labels: list[str] = []
                # Build allowed labels set
                if getattr(args, "layout_keep_labels", None):
                    allowed_text_labels = {lbl.strip().lower() for lbl in str(args.layout_keep_labels).split(",") if lbl.strip()}
                else:
                    # Apply default from FLAGS_DEFAULTS if provided
                    try:
                        default_keep = FLAGS_DEFAULTS.get("layout_keep_labels")
                        if default_keep:
                            allowed_text_labels = {lbl.strip().lower() for lbl in str(default_keep).split(",") if lbl.strip()}
                        else:
                            allowed_text_labels = {
                                "text", "paragraph_title", "title", "heading", "caption",
                                "header", "number", "figure_title", "body", "section",
                                "text_block", "textblock", "paragraph", "textbox", "textline"
                            }
                    except Exception:
                        allowed_text_labels = {
                            "text", "paragraph_title", "title", "heading", "caption",
                            "header", "number", "figure_title", "body", "section",
                            "text_block", "textblock", "paragraph", "textbox", "textline"
                        }
                for b in boxes:
                    # Optional: filter by text-like labels
                    label = None
                    if isinstance(b, dict):
                        try:
                            label = str(b.get("label") or "").strip().lower() or None
                        except Exception:
                            label = None
                    else:
                        try:
                            label = str(getattr(b, "label") or "").strip().lower() or None
                        except Exception:
                            label = None
                    take = True
                    if label:
                        if label not in allowed_text_labels:
                            skipped_labels.append(label)
                            take = False
                        else:
                            kept_labels.append(label)
                    if not take:
                        continue
                    r = _rect_from_box(b)
                    if r is not None:
                        x0, y0, x1, y1 = r
                        if x1 > x0 and y1 > y0:
                            rects.append(
                                {
                                    "x0": x0,
                                    "y0": y0,
                                    "x1": x1,
                                    "y1": y1,
                                    "label": label or "text",
                                }
                            )
                # Prepare page size and blocks container once
                w, h = image_obj.size if hasattr(image_obj, "size") else (0, 0)
                blocks: list[dict] = []
                def _save_crop(crop_img, ix0: int, iy0: int, ix1: int, iy1: int) -> None:
                    global CROP_SAVE_SEQ
                    if not getattr(args, "save_crops", None):
                        return
                    try:
                        os.makedirs(args.save_crops, exist_ok=True)
                        CROP_SAVE_SEQ += 1
                        prefix = f"p{page_num}" if page_num is not None else "p0"
                        filename = f"{prefix}_crop_{CROP_SAVE_SEQ:05d}_{ix0}_{iy0}_{ix1}_{iy1}.png"
                        crop_img.save(os.path.join(args.save_crops, filename))
                    except Exception as exc:
                        if bool(getattr(args, "dump", False)):
                            print(f"Failed to save crop: {exc}")

                def _keep_if_text(res: object | None) -> object | None:
                    if not res:
                        return None
                    try:
                        for _, text_val in _iter_ocr_entries(res):
                            if text_val:
                                return res
                    except Exception:
                        return None
                    return None

                def _iter_crop_variants(crop_img):
                    base = crop_img.convert("RGB")
                    yield "orig", base
                    try:
                        gray = ImageOps.grayscale(base)
                        yield "gray", gray.convert("RGB")
                        yield "autocontrast", ImageOps.autocontrast(gray).convert("RGB")
                        bw = ImageOps.autocontrast(gray).point(lambda x: 255 if x > 160 else 0, mode="L").convert("RGB")
                        yield "bw", bw
                    except Exception:
                        pass
                    try:
                        yield "sharp", base.filter(ImageFilter.SHARPEN)
                        yield "unsharp", base.filter(ImageFilter.UnsharpMask(radius=1.5, percent=150, threshold=3))
                    except Exception:
                        pass
                    max_upscale_side = 3500
                    for scale in (1.5, 2.0):
                        try:
                            new_w = max(1, int(base.width * scale))
                            new_h = max(1, int(base.height * scale))
                            if max(new_w, new_h) > max_upscale_side:
                                continue
                            up = base.resize((new_w, new_h), resample=_PILImage.LANCZOS)
                            yield f"up{scale}".replace(".", "p"), up
                            try:
                                up_gray = ImageOps.grayscale(up)
                                yield f"up{scale}".replace(".", "p") + "_gray", up_gray.convert("RGB")
                            except Exception:
                                pass
                        except Exception:
                            continue

                def _run_crop_ocr(crop_img):
                    for variant_name, variant_img in _iter_crop_variants(crop_img):
                        crop_arr = _np.array(variant_img)
                        result = _ocr_predict(
                            crop_arr,
                            det=False,
                            rec=True,
                            cls=bool(getattr(args, "textline_orientation", True)),
                        )
                        result = _keep_if_text(result)
                        if not result:
                            result = _ocr_predict(crop_arr, det=False, rec=True)
                            result = _keep_if_text(result)
                        if not result:
                            result = _ocr_predict(crop_arr)
                            result = _keep_if_text(result)
                        if not result:
                            result = _ocr_legacy(crop_arr)
                            result = _keep_if_text(result)
                        if not result:
                            result = _ocr_legacy(
                                crop_arr,
                                cls=bool(getattr(args, "textline_orientation", True)),
                            )
                            result = _keep_if_text(result)
                        if result:
                            if _cli_provided("--dump"):
                                print(f"Crop OCR succeeded with variant: {variant_name}")
                            return result
                    return None

                if rects:
                    layout_has_boxes = True
                    if bool(getattr(args, "dump", False)):
                        try:
                            print(f"PaddleX rects parsed: {len(rects)}; first: {rects[0] if rects else None}")
                            if kept_labels or skipped_labels:
                                from collections import Counter
                                print(f"Kept labels: {dict(Counter(kept_labels))}; Skipped labels: {dict(Counter(skipped_labels))}")
                        except Exception:
                            pass
                    for rect in rects:
                        try:
                            x0 = rect.get("x0"); y0 = rect.get("y0")
                            x1 = rect.get("x1"); y1 = rect.get("y1")
                            label = rect.get("label") or "text"
                            if x0 is None or y0 is None or x1 is None or y1 is None:
                                continue
                            pad = int(getattr(args, "crop_padding", 0) or 0)
                            vbias = int(getattr(args, "crop_vbias", 0) or 0)
                            
                            # Strict crop of the box content only (clamped to image)
                            cx0 = max(0, int(x0)); cx1 = min(w, int(x1))
                            cy0 = max(0, int(y0)); cy1 = min(h, int(y1))

                            if cx1 <= cx0 or cy1 <= cy0:
                                continue

                            # Shift crop vertically (vbias>0 moves crop downward) while preserving height
                            box_h = cy1 - cy0
                            if vbias:
                                shifted_cy0 = cy0 + vbias
                                shifted_cy0 = min(max(0, shifted_cy0), max(0, h - box_h))
                                cy0 = shifted_cy0
                                cy1 = min(h, cy0 + box_h)

                            # Asymmetric vertical padding: reduce top / add to bottom when vbias > 0
                            pad_top = max(0, pad - vbias)
                            pad_bottom = max(0, pad + vbias)

                            # Virtual padded coordinates (unclamped)
                            vx0 = int(x0) - pad; vy0 = int(y0) - pad_top
                            vx1 = int(x1) + pad; vy1 = int(y1) + pad_bottom
                            
                            dst_w = vx1 - vx0
                            dst_h = vy1 - vy0
                            
                            # White canvas (passepartout)
                            canvas = Image.new("RGB", (dst_w, dst_h), (255, 255, 255))
                            
                            # Paste strict content at correct offset
                            dx = cx0 - vx0
                            dy = cy0 - vy0
                            src_crop = image_obj.crop((cx0, cy0, cx1, cy1))
                            canvas.paste(src_crop, (dx, dy))
                            crop = canvas
                            
                            # Use virtual coordinates for saving and OCR mapping
                            ix0, iy0, ix1, iy1 = vx0, vy0, vx1, vy1
                            _save_crop(crop, ix0, iy0, ix1, iy1)
                        except Exception:
                            continue
                        # Run OCR on the crop using robust inference
                        result_crop = _run_crop_ocr(crop)
                        if not result_crop:
                            continue
                        line_entries: list[dict] = []
                        seq = 0
                        for quad, text_val in _iter_ocr_entries(result_crop):
                            if not text_val:
                                continue
                            seq += 1
                            line_x0 = float(ix0)
                            line_y0 = float(iy0)
                            if quad is not None:
                                bb = _bbox_from_quad(quad)
                                if bb:
                                    bx0, by0, bx1, by1, _ = bb
                                    # map to page coordinates by adding crop offset
                                    bx0 += float(ix0); by0 += float(iy0)
                                    line_x0 = bx0
                                    line_y0 = by0
                            line_entries.append(
                                {"text": text_val, "y0": line_y0, "x0": line_x0, "seq": seq}
                            )
                        if not line_entries:
                            continue
                        line_entries.sort(key=lambda entry: (entry["y0"], entry["x0"], entry["seq"]))
                        block_text = "\n".join(entry["text"] for entry in line_entries if entry["text"])
                        if not block_text.strip():
                            continue
                        bx0, by0, bx1, by1 = float(ix0), float(iy0), float(ix1), float(iy1)
                        bxc = 0.5 * (bx0 + bx1)
                        blocks.append({
                            "x0": bx0,
                            "y0": by0,
                            "x1": bx1,
                            "y1": by1,
                            "xc": bxc,
                            "label": label,
                            "text": block_text,
                        })
                else:
                    if bool(getattr(args, "dump", False)):
                        try:
                            print("PaddleX boxes present but no rects parsed; inspecting first 2 boxes…")
                            for idx_box, bb in enumerate(boxes[:2]):
                                print(f"  Box[{idx_box}] type: {type(bb)}")
                                for names in (("x0","y0","x1","y1"),("xmin","ymin","xmax","ymax"),("left","top","right","bottom")):
                                    try:
                                        if all(hasattr(bb, n) for n in names):
                                            vals = tuple(float(getattr(bb, n)) for n in names)
                                            print(f"  Box[{idx_box}] attrs {names}: {vals}")
                                    except Exception:
                                        pass
                                maybe_bb = None
                                try:
                                    maybe_bb = _paddle_obj_to_dict(bb)
                                except Exception:
                                    maybe_bb = None
                                if isinstance(maybe_bb, dict):
                                    print(f"  Box[{idx_box}] dict keys: {sorted(maybe_bb.keys())}")
                                    try:
                                        coord = maybe_bb.get('coordinate')
                                        if coord is not None:
                                            import numpy as _np5
                                            if isinstance(coord, _np5.ndarray):
                                                print(f"    coordinate ndarray shape: {coord.shape}")
                                            elif isinstance(coord, (list, tuple)):
                                                preview_vals = coord[:8] if len(coord) > 8 else coord
                                                print(f"    coordinate list len: {len(coord)}; first item type: {type(coord[0]) if coord else None}; values: {preview_vals}")
                                                if coord and isinstance(coord[0], (list, tuple)):
                                                    print(f"    first pair: {coord[0]}")
                                                elif coord and isinstance(coord[0], dict):
                                                    print(f"    first dict keys: {list(coord[0].keys())}")
                                            elif isinstance(coord, dict):
                                                print(f"    coordinate dict keys: {list(coord.keys())}")
                                    except Exception:
                                        pass
                                elif isinstance(bb, (list, tuple)):
                                    preview = bb[:8] if len(bb) >= 8 else bb
                                    print(f"  Box[{idx_box}] list/tuple preview: {preview}")
                                else:
                                    try:
                                        import numpy as _np3
                                        if isinstance(bb, _np3.ndarray):
                                            print(f"  Box[{idx_box}] ndarray shape: {bb.shape}")
                                    except Exception:
                                        pass
                        except Exception:
                            pass
                if blocks:
                    columns = _order_blocks_into_columns(blocks)
                    ordered = _columns_to_text(columns)
                    if ordered.strip():
                        return ordered.splitlines(), True, columns
                if layout_has_boxes:
                    if bool(getattr(args, "dump", False)):
                        print("Layout boxes detected but crop OCR produced no text; enabling plain OCR fallback.")
                    layout_has_boxes = False

        print("Diagnosis: PaddleX layout ran. Falling back to plain OCR for text extraction.")
        return [], layout_has_boxes, []

    # Note: legacy paddleocr.ppstructure fallback removed. We use PaddleX for layout and OCR for text.

    def _render_layout_markdown(pages: list[list[list[dict]]], fallback_text: str | None = None) -> str:
        def _normalize_block_text(text: str) -> str:
            text = text.replace("\r\n", "\n").replace("\r", "\n")
            lines = [line.rstrip() for line in text.split("\n")]
            while lines and not lines[0].strip():
                lines.pop(0)
            while lines and not lines[-1].strip():
                lines.pop()
            return "\n".join(lines)

        def _single_line(text: str) -> str:
            return " ".join(_normalize_block_text(text).split()).strip()

        out_lines: list[str] = []
        for page_idx, columns in enumerate(pages, start=1):
            # flatten columns for emptiness check
            page_blocks = [b for col in columns for b in col] if columns else []
            if not page_blocks:
                continue

            out_lines.append(f"## Page {page_idx}")
            non_full_columns = [
                col for col in columns
                if not all(bool(block.get("full_width")) for block in col)
            ]
            col_num = 0
            for col in columns:
                is_full = all(bool(block.get("full_width")) for block in col)
                if not is_full:
                    col_num += 1
                    if len(non_full_columns) > 1:
                        out_lines.append(f"### Column {col_num}")

                for block in col:
                    text_val = _normalize_block_text(str(block.get("text", "") or ""))
                    if not text_val:
                        continue
                    label_val = str(block.get("label", "") or "").strip().lower()

                    # Subheaders / paragraph titles
                    if label_val in {"paragraph_title", "title", "heading", "section", "header"}:
                        heading = _single_line(text_val)
                        if heading:
                            out_lines.append(f"### {heading}")
                        out_lines.append("")
                        continue

                    # Figure / caption handling
                    if label_val in {"figure_title", "caption", "figure", "figure_caption"}:
                        caption = _single_line(text_val)
                        if caption:
                            out_lines.append(f"**figure caption:** {caption}")
                        out_lines.append("")
                        continue

                    # Default: paragraph text
                    out_lines.append("")
                    out_lines.append(text_val)

            out_lines.append("")

        # Fallback to normalized plain text when layout produced nothing
        if not out_lines and fallback_text:
            fb = _normalize_block_text(fallback_text)
            if fb:
                return f"## Page 1\n\n{fb}\n"

        return ("\n".join(out_lines).rstrip() + "\n") if out_lines else ""

    layout_pages: list[list[list[dict]]] = []
    all_lines: list[str] = []
    for idx, image in enumerate(images, start=1):
        print(f"Page {idx} rendered size: {image.width}x{image.height}")
        if args.max_side and args.max_side > 0:
            max_side_px = max(image.width, image.height)
            if max_side_px > args.max_side:
                scale = args.max_side / max_side_px
                new_size = (max(1, int(image.width * scale)), max(1, int(image.height * scale)))
                image = image.resize(new_size, resample=_PILImage.LANCZOS)
                print(f"Page {idx} downscaled to: {image.width}x{image.height}")

        image = image.convert("RGB")
        page_lines: list[str] = []
        if args.pp_structure_v3:
            # Try PaddleX layout; if no layout boxes, fall back to plain OCR for text
            page_lines, layout_boxes, page_columns = _paddlex_structure_extract_texts(
                image, ocr_kwargs.get("lang", "en"), page_num=idx
            )
            layout_pages.append(page_columns)
            if not page_lines:
                if layout_boxes:
                    if args.dump:
                        print("Layout boxes detected; skipping plain OCR fallback for this page.")
                    page_lines = []
                else:
                # Plain OCR path. Ensure we have an OCR instance; try to recreate if missing.
                    if ocr is None:
                        # Retry construction in case environment changed after first page
                        retry_candidates: list[dict] = []
                        retry_candidates.append({**ocr_kwargs, "use_textline_orientation": True})
                        retry_candidates.append({**reduced_kwargs, "use_textline_orientation": True})
                        retry_candidates.append({**ocr_kwargs})
                        retry_candidates.append({**reduced_kwargs})
                        retry_candidates.append({**ocr_kwargs, "use_angle_cls": bool(getattr(args, "textline_orientation", True))})
                        retry_candidates.append({**reduced_kwargs, "use_angle_cls": bool(getattr(args, "textline_orientation", True))})
                        for kw in retry_candidates:
                            ocr = _try_create_direct(kw)
                            if ocr is not None:
                                break
                        if ocr is None:
                            print("Diagnostic: failed to create PaddleOCR for plain OCR fallback.")
                            return 2
                    result = None
                    try:
                        img_np = np.array(image)
                        result = _ocr_predict(img_np)
                        if result is None:
                            result = _ocr_legacy(img_np)
                        if result is None:
                            result = _ocr_legacy(
                                img_np,
                                cls=bool(getattr(args, "textline_orientation", True)),
                            )
                    except Exception as exc:
                        print(f"PaddleOCR failed: {exc}")
                        return 2
                    if args.dump:
                        print(f"Page {idx} result type: {type(result)}")
                        if isinstance(result, dict):
                            print(f"Page {idx} result keys: {sorted(result.keys())}")
                        elif isinstance(result, list):
                            print(f"Page {idx} result list size: {len(result)}")
                            if result:
                                print(f"Page {idx} result[0] type: {type(result[0])}")
                    page_lines = _extract_texts(result) if result else []
        else:
            result = None
            try:
                img_np = np.array(image)
                result = _ocr_predict(img_np)
                if result is None:
                    result = _ocr_legacy(img_np)
                if result is None:
                    result = _ocr_legacy(
                        img_np,
                        cls=bool(getattr(args, "textline_orientation", True)),
                    )
            except Exception as exc:
                print(f"PaddleOCR failed: {exc}")
                return 2

            if args.dump:
                print(f"Page {idx} result type: {type(result)}")
                if isinstance(result, dict):
                    print(f"Page {idx} result keys: {sorted(result.keys())}")
                elif isinstance(result, list):
                    print(f"Page {idx} result list size: {len(result)}")
                    if result:
                        print(f"Page {idx} result[0] type: {type(result[0])}")

            page_lines = _extract_texts(result) if result else []
            layout_pages.append([])
        if page_lines:
            all_lines.extend(page_lines)
            print(f"Page {idx} text chars: {len(''.join(page_lines))}")
        else:
            print(f"Page {idx} text chars: 0")

    text = "\n".join(all_lines).strip()
    print(f"Text chars: {len(text)}")
    if text:
        preview_len = max(0, int(args.preview_len))
        if preview_len:
            preview = text.replace("\n", " ")
            print(f"Preview: {preview[:preview_len]}")
        if args.print_text:
            print(text)
        if args.out:
            try:
                with open(args.out, "w", encoding="utf-8") as handle:
                    handle.write(text)
            except Exception as exc:
                print(f"Failed to write OCR text to {args.out}: {exc}")
        if args.out_md:
            try:
                md_text = _render_layout_markdown(layout_pages, fallback_text=text)
                if md_text:
                    md_dir = os.path.dirname(args.out_md)
                    if md_dir:
                        os.makedirs(md_dir, exist_ok=True)
                    with open(args.out_md, "w", encoding="utf-8") as handle:
                        handle.write(md_text)
            except Exception as exc:
                print(f"Failed to write layout markdown to {args.out_md}: {exc}")
        return 0

    print("No text extracted.")
    return 2


if __name__ == "__main__":
    sys.exit(main())
