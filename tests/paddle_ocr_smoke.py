#!/usr/bin/env python3
import argparse
import os
import sys
import warnings


def main() -> int:
    parser = argparse.ArgumentParser(description="Run a PaddleOCR smoke test on a PDF or image.")
    parser.add_argument("--pdf", help="Path to a PDF to OCR")
    parser.add_argument("--image", help="Path to an image to OCR")
    parser.add_argument("--dpi", type=int, default=300, help="Max DPI for PDF rasterization")
    parser.add_argument(
        "--pages",
        type=int,
        default=3,
        help="Number of PDF pages to OCR (default: 3)",
    )
    parser.add_argument(
        "--max-side",
        type=int,
        default=3500,
        help="Max rendered side in pixels (0 to disable)",
    )
    parser.add_argument("--dump", action="store_true", help="Print raw result details for debugging")
    parser.add_argument(
        "--preview-len",
        type=int,
        default=500,
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
    args = parser.parse_args()

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
        "use_doc_orientation_classify": True,
        "use_doc_unwarping": True,
    }
    if args.max_side and args.max_side > 0:
        ocr_kwargs["text_det_limit_side_len"] = args.max_side
        ocr_kwargs["text_det_limit_type"] = "max"

    def _create_ocr(kwargs: dict, use_textline_orientation: bool) -> PaddleOCR:
        try:
            return PaddleOCR(use_textline_orientation=use_textline_orientation, **kwargs)
        except TypeError:
            return PaddleOCR(use_angle_cls=use_textline_orientation, **kwargs)

    def _try_create(kwargs: dict, use_textline_orientation: bool) -> PaddleOCR | None:
        try:
            return _create_ocr(kwargs, use_textline_orientation)
        except TypeError:
            return None

    ocr = _try_create(ocr_kwargs, True)
    if ocr is None:
        reduced_kwargs = dict(ocr_kwargs)
        reduced_kwargs.pop("use_doc_orientation_classify", None)
        reduced_kwargs.pop("use_doc_unwarping", None)
        ocr = _try_create(reduced_kwargs, True)
    if ocr is None:
        legacy_kwargs = dict(ocr_kwargs)
        if "text_det_limit_side_len" in legacy_kwargs:
            legacy_kwargs["det_limit_side_len"] = legacy_kwargs.pop("text_det_limit_side_len")
        if "text_det_limit_type" in legacy_kwargs:
            legacy_kwargs["det_limit_type"] = legacy_kwargs.pop("text_det_limit_type")
        ocr = _try_create(legacy_kwargs, True)
    if ocr is None:
        legacy_kwargs = dict(ocr_kwargs)
        legacy_kwargs.pop("use_doc_orientation_classify", None)
        legacy_kwargs.pop("use_doc_unwarping", None)
        if "text_det_limit_side_len" in legacy_kwargs:
            legacy_kwargs["det_limit_side_len"] = legacy_kwargs.pop("text_det_limit_side_len")
        if "text_det_limit_type" in legacy_kwargs:
            legacy_kwargs["det_limit_type"] = legacy_kwargs.pop("text_det_limit_type")
        ocr = _create_ocr(legacy_kwargs, True)

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
        result = None
        try:
            result = ocr.predict(np.array(image))  # type: ignore[attr-defined]
        except Exception:
            try:
                result = ocr.ocr(np.array(image), cls=True)
            except Exception:
                try:
                    result = ocr.ocr(np.array(image))
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
