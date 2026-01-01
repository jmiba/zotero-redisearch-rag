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


# -----------------------------------------------------------------------------
# Config overrides
#
# Define overrides for script options. If a corresponding CLI flag is NOT
# provided, these values will be applied after parsing to replace the built-in
# parser defaults.
# -----------------------------------------------------------------------------

GENERAL_DEFAULTS = {
    "dpi": 200,
    "pages": 1,
    "max_side": 2500,
    "preview_len": 500,
    "doc_orientation": False,
    "doc_unwarping": False,
    "textline_orientation": True,
}

LAYOUT_DEFAULTS = {
    "layout_model": "PP-DocLayout-L",     # or PP-DocLayout-M / PP-DocLayout-S
    "layout_threshold": 0.15,               # keep lower-confidence boxes
    "layout_img_size": None,               # larger input can help two-column pages
    "layout_merge": "union",              # keep both inner and outer boxes
    "layout_unclip": 1.2,                  # expand boxes slightly
    "layout_device": None,                 # e.g., "cpu" or "gpu:0"; None = PaddleX default
    "layout_nms": True,                    # enable NMS postprocessing
    "fail_on_zero_layout": True,
}

FLAGS_DEFAULTS = {
    # Enable layout path by default unless CLI overrides
    "pp_structure_v3": True,
    # Enable dump output by default unless CLI overrides
    "dump": False,
}

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
        "--layout-device",
        type=str,
        default=None,
        help="PaddleX device (e.g., cpu, gpu:0)",
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
        if not _cli_provided("--layout-device") and args.layout_device is None:
            args.layout_device = LAYOUT_DEFAULTS["layout_device"]
        # Boolean tri-state; only apply override when parser captured None
        if getattr(args, "layout_nms", None) is None:
            args.layout_nms = LAYOUT_DEFAULTS["layout_nms"]
        if getattr(args, "fail_on_zero_layout", None) is None:
            args.fail_on_zero_layout = LAYOUT_DEFAULTS["fail_on_zero_layout"]

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

    def _paddlex_structure_extract_texts(image_obj, lang: str, src_path: str | None = None) -> list[str]:
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
            return []
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
                    return []
            else:
                return []
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
            return []
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
        print("Diagnosis: PaddleX layout ran. Using plain OCR for text extraction.")
        return []

    # Note: legacy paddleocr.ppstructure fallback removed. We use PaddleX for layout and OCR for text.

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
            page_lines = _paddlex_structure_extract_texts(image, ocr_kwargs.get("lang", "en"))
            if not page_lines:
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
                    # Try modern API first
                    if hasattr(ocr, "predict"):
                        try:
                            result = ocr.predict(img_np)  # type: ignore[attr-defined]
                        except TypeError:
                            result = None
                    # Fallback to legacy API without cls first (to avoid unexpected kw errors)
                    if result is None and hasattr(ocr, "ocr"):
                        try:
                            result = ocr.ocr(img_np)  # type: ignore[attr-defined]
                        except TypeError:
                            result = None
                    # Fallback to legacy API with cls flag
                    if result is None and hasattr(ocr, "ocr"):
                        result = ocr.ocr(img_np, cls=bool(getattr(args, "textline_orientation", True)))  # type: ignore[attr-defined]
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
                if hasattr(ocr, "predict"):
                    try:
                        result = ocr.predict(img_np)  # type: ignore[attr-defined]
                    except TypeError:
                        result = None
                if result is None and hasattr(ocr, "ocr"):
                    try:
                        result = ocr.ocr(img_np)  # type: ignore[attr-defined]
                    except TypeError:
                        result = None
                if result is None and hasattr(ocr, "ocr"):
                    result = ocr.ocr(img_np, cls=bool(getattr(args, "textline_orientation", True)))  # type: ignore[attr-defined]
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
        return 0

    print("No text extracted.")
    return 2


if __name__ == "__main__":
    sys.exit(main())
