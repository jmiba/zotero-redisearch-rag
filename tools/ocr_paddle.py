#!/usr/bin/env python3
from __future__ import annotations

import json
import logging
import numbers
import os
import re
import tempfile
import time
import warnings
from collections import Counter
from typing import Any, Dict, List, Optional, Sequence, Set, Tuple

LOGGER = logging.getLogger("docling_extract")

_INLINE_MATH_RE = re.compile(r"(?<!\$)\$(?!\$)([^$\n]+?)\$(?!\$)")
_FRACTION_MAP: Dict[Tuple[int, int], str] = {
    (1, 2): "½",
    (1, 3): "⅓",
    (2, 3): "⅔",
    (1, 4): "¼",
    (3, 4): "¾",
    (1, 5): "⅕",
    (2, 5): "⅖",
    (3, 5): "⅗",
    (4, 5): "⅘",
    (1, 6): "⅙",
    (5, 6): "⅚",
    (1, 8): "⅛",
    (3, 8): "⅜",
    (5, 8): "⅝",
    (7, 8): "⅞",
}


def _extract_footnote_marker(value: str) -> Optional[str]:
    match = re.fullmatch(r"\^\s*\{?\s*([^\s{}]+)\s*\}?\s*", value)
    if not match:
        return None
    marker = match.group(1).strip()
    if marker.startswith("\\") and len(marker) == 2:
        marker = marker[1:]
    return marker or None


def _replace_simple_fraction(value: str) -> Optional[str]:
    match = re.fullmatch(r"(\d+)\s*/\s*(\d+)", value)
    if match:
        return _FRACTION_MAP.get((int(match.group(1)), int(match.group(2))))
    match = re.fullmatch(r"\\frac\{\s*(\d+)\s*\}\{\s*(\d+)\s*\}", value)
    if match:
        return _FRACTION_MAP.get((int(match.group(1)), int(match.group(2))))
    return None


def _find_footnotes_section(lines: List[str]) -> Optional[Tuple[int, int]]:
    for idx, line in enumerate(lines):
        if re.match(r"^#{1,6}\s+footnotes\s*$", line.strip(), re.IGNORECASE):
            end = len(lines)
            for jdx in range(idx + 1, len(lines)):
                if re.match(r"^#{1,6}\s+", lines[jdx]):
                    end = jdx
                    break
            return idx, end
    return None


def _normalize_footnote_definition_line(line: str) -> Optional[str]:
    stripped = line.strip()
    if not stripped.startswith("[^"):
        return None
    match = re.match(r"^\[\^\s*([^\]\s]+)\s*\]\s*:?\s*(.*)$", stripped)
    if not match:
        return None
    marker = match.group(1).strip()
    rest = match.group(2).strip()
    if rest:
        return f"[^{marker}]: {rest}"
    return f"[^{marker}]:"


def _normalize_inline_math_for_obsidian(markdown: str, add_footnote_defs: bool = False) -> str:
    if not markdown:
        return markdown
    footnotes: List[str] = []

    def _replace(match: re.Match[str]) -> str:
        content = match.group(1)
        normalized = content.strip()
        if not normalized:
            return match.group(0)
        marker = _extract_footnote_marker(normalized)
        if marker:
            footnotes.append(marker)
            return f"[^{marker}]"
        fraction = _replace_simple_fraction(normalized)
        if fraction:
            return fraction
        return f"$$ {normalized} $$"

    updated = _INLINE_MATH_RE.sub(_replace, markdown)
    lines = updated.splitlines()
    normalized_any = False
    for idx, line in enumerate(lines):
        normalized = _normalize_footnote_definition_line(line)
        if normalized is not None:
            lines[idx] = normalized
            normalized_any = True
    if normalized_any:
        updated = "\n".join(lines)
    if not add_footnote_defs or not footnotes:
        return updated

    footnote_ids = list(dict.fromkeys(footnotes))
    lines = updated.splitlines()
    section = _find_footnotes_section(lines)
    if section:
        start, end = section
        for idx in range(start + 1, end):
            normalized = _normalize_footnote_definition_line(lines[idx])
            if normalized is not None:
                lines[idx] = normalized
            else:
                lines[idx] = lines[idx].rstrip()
        updated = "\n".join(lines)

    missing = [
        marker
        for marker in footnote_ids
        if not re.search(rf"(?m)^\[\^{re.escape(marker)}\]:", updated)
    ]
    if not missing:
        return updated

    if section:
        insert_at = section[1]
        insertion: List[str] = []
        if insert_at > 0 and lines[insert_at - 1].strip():
            insertion.append("")
        insertion.extend([f"[^{marker}]:" for marker in missing])
        lines[insert_at:insert_at] = insertion
        return "\n".join(lines)

    suffix_lines = ["", "## Footnotes", ""]
    suffix_lines.extend([f"[^{marker}]:" for marker in missing])
    if updated and not updated.endswith("\n"):
        updated += "\n"
    return updated + "\n".join(suffix_lines)


def _paddlex_layout_ocr_pages(
    images: Sequence[Any],
    languages: str,
    config: Any,
    helpers: Dict[str, Any],
    progress_cb: Optional[Any] = None,
    progress_base: int = 0,
    progress_span: int = 0,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    global LOGGER
    LOGGER = helpers.get("logger", LOGGER)
    ocr_pages_text_chars = helpers["ocr_pages_text_chars"]

    try:
        import numpy as np
        from paddleocr import PaddleOCR
        from PIL import Image as _PILImage, ImageOps, ImageFilter
    except Exception as exc:
        raise RuntimeError(f"PaddleX layout OCR dependencies missing: {exc}") from exc

    layout_model = str(getattr(config, "paddle_layout_model", "PP-DocLayout-L"))
    layout_threshold = getattr(config, "paddle_layout_threshold", 0.5)
    layout_img_size = getattr(config, "paddle_layout_img_size", None)
    layout_merge = getattr(config, "paddle_layout_merge", "small")
    layout_unclip = getattr(config, "paddle_layout_unclip", 1.05)
    crop_padding = int(getattr(config, "paddle_crop_padding", 0))
    crop_vbias = int(getattr(config, "paddle_crop_vbias", 0))
    layout_device = getattr(config, "paddle_layout_device", None)
    layout_nms = bool(getattr(config, "paddle_layout_nms", True))
    layout_keep_labels = str(
        getattr(
            config,
            "paddle_layout_keep_labels",
            "text,paragraph_title,title,heading,caption,header,number,figure_title,body,section,text_block,textbox,textline,paragraph",
        )
    )
    layout_recognize_boxes = bool(getattr(config, "paddle_layout_recognize_boxes", True))
    fail_on_zero_layout = bool(getattr(config, "paddle_layout_fail_on_zero", False))
    max_side_px = int(getattr(config, "paddle_target_max_side_px", 0) or 0)
    use_file_path = bool(getattr(config, "paddle_layout_use_file_path", True))
    save_crops_dir = getattr(config, "paddle_layout_save_crops", None)
    dump = bool(getattr(config, "paddle_dump", False))
    if save_crops_dir:
        LOGGER.info("Paddle layout crop debugging enabled: %s", save_crops_dir)

    def _dump_log(message: str, *args: Any) -> None:
        if not dump:
            return
        LOGGER.info("Paddle dump: " + message, *args)

    _PILImage.MAX_IMAGE_PIXELS = None  # type: ignore[attr-defined]
    if hasattr(_PILImage, "DecompressionBombWarning"):
        warnings.filterwarnings("ignore", category=_PILImage.DecompressionBombWarning)  # type: ignore[attr-defined]

    ocr_kwargs: Dict[str, Any] = {"lang": languages}
    if max_side_px > 0:
        ocr_kwargs["text_det_limit_side_len"] = max_side_px
        ocr_kwargs["text_det_limit_type"] = "max"
    if getattr(config, "paddle_use_doc_orientation_classify", False):
        ocr_kwargs["use_doc_orientation_classify"] = True
    if getattr(config, "paddle_use_doc_unwarping", False):
        ocr_kwargs["use_doc_unwarping"] = True
    if getattr(config, "paddle_use_textline_orientation", None) is not None:
        ocr_kwargs["use_textline_orientation"] = bool(config.paddle_use_textline_orientation)

    def _create_ocr_direct(kwargs: Dict[str, Any]) -> PaddleOCR:
        return PaddleOCR(**kwargs)

    def _try_create_direct(kwargs: Dict[str, Any]) -> Optional[PaddleOCR]:
        try:
            return _create_ocr_direct(kwargs)
        except TypeError:
            return None
        except Exception:
            return None

    reduced_kwargs = dict(ocr_kwargs)
    reduced_kwargs.pop("use_doc_orientation_classify", None)
    reduced_kwargs.pop("use_doc_unwarping", None)

    ctor_candidates: List[Dict[str, Any]] = []
    use_tlo = bool(getattr(config, "paddle_use_textline_orientation", True))
    ctor_candidates.append({**ocr_kwargs, "use_textline_orientation": use_tlo})
    ctor_candidates.append({**reduced_kwargs, "use_textline_orientation": use_tlo})
    ctor_candidates.append({**ocr_kwargs})
    ctor_candidates.append({**reduced_kwargs})
    ctor_candidates.append({**ocr_kwargs, "use_angle_cls": use_tlo})
    ctor_candidates.append({**reduced_kwargs, "use_angle_cls": use_tlo})

    ocr: Optional[PaddleOCR] = None
    for kw in ctor_candidates:
        ocr = _try_create_direct(kw)
        if ocr is not None:
            break

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

    def _extract_from_dict(res: Dict[str, Any]) -> List[str]:
        texts = res.get("rec_texts") or res.get("texts") or res.get("rec_text")
        if not isinstance(texts, list):
            return []
        return [str(text or "").strip() for text in texts if str(text or "").strip()]

    def _extract_texts(res: Any) -> List[str]:
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
                combined: List[str] = []
                for entry in entries:
                    if isinstance(entry, dict):
                        combined.extend(_extract_from_dict(entry))
                    else:
                        maybe_dict = _paddle_obj_to_dict(entry)
                        if maybe_dict is not None:
                            combined.extend(_extract_from_dict(maybe_dict))
                return combined
            texts: List[str] = []
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

    def _ocr_predict(image: Any, det: Optional[bool] = None, rec: Optional[bool] = None, cls: Optional[bool] = None) -> Any:
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

    def _ocr_legacy(image: Any, **kwargs: Any) -> Any:
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

    def _strip_html(text: str) -> str:
        return re.sub(r"<[^>]+>", " ", text)

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

    crop_seq = 0

    def _paddlex_structure_extract_texts(
        image_obj: Any,
        lang: str,
        src_path: Optional[str] = None,
        page_num: Optional[int] = None,
    ) -> Tuple[List[str], bool, List[List[Dict[str, Any]]], int, int]:
        try:
            from paddlex import create_model
        except Exception as exc:
            LOGGER.warning("PaddleX create_model import failed: %s", exc)
            return [], False, [], 0, 0

        cm_kwargs: Dict[str, Any] = {"model_name": layout_model}
        if layout_device:
            cm_kwargs["device"] = layout_device
        img_size = layout_img_size
        try:
            if img_size:
                model = create_model(**{**cm_kwargs, "img_size": img_size})
            else:
                model = create_model(**cm_kwargs)
        except Exception as exc:
            msg = str(exc)
            LOGGER.warning("PaddleX create_model('%s') failed: %s", layout_model, msg)
            if img_size is not None and ("not supported set input shape" in msg.lower() or "not supported" in msg.lower()):
                LOGGER.info("PaddleX model does not support overriding img_size; retrying with default config.")
                try:
                    model = create_model(**cm_kwargs)
                except Exception as exc2:
                    LOGGER.warning("PaddleX create_model retry without img_size failed: %s", exc2)
                    return [], False, [], 0, 0
            else:
                return [], False, [], 0, 0
        try:
            predict_kwargs: Dict[str, Any] = {"batch_size": 1}
            if layout_threshold is not None:
                predict_kwargs["threshold"] = layout_threshold
            predict_kwargs["layout_nms"] = bool(layout_nms)
            if layout_unclip is not None:
                predict_kwargs["layout_unclip_ratio"] = layout_unclip
            if layout_merge is not None:
                predict_kwargs["layout_merge_bboxes_mode"] = layout_merge
            if src_path and isinstance(src_path, str):
                out_gen = model.predict(src_path, **predict_kwargs)
            else:
                out_gen = model.predict(np.array(image_obj), **predict_kwargs)
            output = list(out_gen)
        except Exception as exc:
            LOGGER.warning("PaddleX layout predict failed: %s", exc)
            return [], False, [], 0, 0

        layout_has_boxes = False
        total = 0
        try:
            if isinstance(output, (list, tuple)):
                for res in output:
                    try:
                        maybe = _paddle_obj_to_dict(res)
                    except Exception:
                        maybe = None
                    if isinstance(maybe, dict):
                        dets = (
                            maybe.get("boxes")
                            or maybe.get("layout")
                            or maybe.get("result")
                            or maybe.get("dt_polys")
                            or maybe.get("predictions")
                            or []
                        )
                        if isinstance(dets, (list, tuple)):
                            total += len(dets)
                            continue
                    res_json = getattr(res, "json", None)
                    if res_json is None and isinstance(res, dict):
                        res_json = res
                    if isinstance(res_json, dict):
                        dets = res_json.get("boxes") or res_json.get("layout") or res_json.get("result") or []
                        total += len(dets) if isinstance(dets, (list, tuple)) else 0
            layout_has_boxes = total > 0
            _dump_log("PaddleX layout detections: %d", total)
            if dump:
                try:
                    _dump_log("PaddleX raw output length: %d", len(output))
                    if output:
                        first = output[0]
                        _dump_log("PaddleX first output type: %s", type(first))
                        try:
                            first_repr = repr(first)
                            if first_repr:
                                _dump_log("PaddleX first output repr: %s", first_repr[:200])
                        except Exception:
                            pass
                        try:
                            maybe = _paddle_obj_to_dict(first)
                        except Exception:
                            maybe = None
                        if isinstance(maybe, dict):
                            try:
                                _dump_log("PaddleX first output dict keys: %s", sorted(maybe.keys()))
                            except Exception:
                                _dump_log("PaddleX first output dict keys: %s", list(maybe.keys()))
                            for field in ("boxes", "dt_polys", "rec_texts", "predictions"):
                                if field in maybe:
                                    try:
                                        _dump_log("  %s length: %d", field, len(maybe[field]))
                                    except Exception:
                                        pass
                except Exception:
                    pass
        except Exception:
            pass
        if total == 0 and fail_on_zero_layout:
            raise RuntimeError("PaddleX layout detected 0 boxes and fail_on_zero_layout is enabled.")

        if not layout_recognize_boxes:
            return [], layout_has_boxes, [], total, 0

        boxes: List[Any] = []
        try:
            first = output[0] if isinstance(output, (list, tuple)) and output else None
            maybe = _paddle_obj_to_dict(first)
            if isinstance(maybe, dict):
                raw_boxes = maybe.get("boxes") or []
                if isinstance(raw_boxes, (list, tuple)):
                    boxes = list(raw_boxes)
        except Exception:
            boxes = []

        if not boxes:
            return [], layout_has_boxes, [], total, 0

        layout_has_boxes = True

        def _iter_ocr_entries(res: Any) -> List[Tuple[Any, str]]:
            out: List[Tuple[Any, str]] = []
            try:
                maybe = _paddle_obj_to_dict(res)
                if isinstance(maybe, dict):
                    texts = maybe.get("rec_texts") or maybe.get("texts") or maybe.get("rec_text")
                    box_list = (
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
                            if isinstance(box_list, list) and i < len(box_list):
                                quad = box_list[i]
                            out.append((quad, s))
                        return out
            except Exception:
                pass
            if isinstance(res, dict):
                texts = res.get("rec_texts") or res.get("texts") or res.get("rec_text")
                box_list = (
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
                        if isinstance(box_list, list) and i < len(box_list):
                            quad = box_list[i]
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

        def _bbox_from_quad(quad: Any) -> Optional[Tuple[float, float, float, float, float]]:
            try:
                if isinstance(quad, (list, tuple)) and quad and isinstance(quad[0], (list, tuple)):
                    xs = [float(p[0]) for p in quad]
                    ys = [float(p[1]) for p in quad]
                    x0, y0, x1, y1 = min(xs), min(ys), max(xs), max(ys)
                    return x0, y0, x1, y1, 0.5 * (x0 + x1)
            except Exception:
                return None
            return None

        def _order_blocks_into_columns(blocks: List[Dict[str, Any]]) -> List[List[Dict[str, Any]]]:
            if not blocks:
                return []

            def _center_y(block: Dict[str, Any]) -> float:
                try:
                    return 0.5 * (float(block.get("y0", 0.0)) + float(block.get("y1", 0.0)))
                except Exception:
                    return 0.0

            def _is_full_width(block: Dict[str, Any]) -> bool:
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

            def _order_columns(col_blocks: List[Dict[str, Any]]) -> List[List[Dict[str, Any]]]:
                if not col_blocks:
                    return []
                xs = sorted(b["xc"] for b in col_blocks)
                span = max(1.0, xs[-1] - xs[0]) if xs else 1.0
                widths = sorted((b["x1"] - b["x0"]) for b in col_blocks)
                w_med = widths[len(widths) // 2] if widths else 1.0
                gap_thr = max(0.06 * span, 0.5 * w_med)

                diffs: List[Tuple[float, int]] = []
                for i in range(1, len(xs)):
                    diffs.append((xs[i] - xs[i - 1], i))
                candidates = [idx for (gap, idx) in diffs if gap >= gap_thr]

                blocks_sorted = sorted(col_blocks, key=lambda b: b["xc"])
                columns: List[List[Dict[str, Any]]] = []
                used_splits: List[int] = []
                min_lines = max(3, len(col_blocks) // 20 or 1)

                if candidates:
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

                def col_key(col: List[Dict[str, Any]]) -> float:
                    left_edges = [b["x0"] for b in col if isinstance(b.get("x0"), (int, float))]
                    if left_edges:
                        return min(left_edges)
                    centers = sorted(b["xc"] for b in col)
                    return centers[len(centers) // 2]

                columns = [col for col in columns if col]
                columns.sort(key=col_key)
                ordered_columns: List[List[Dict[str, Any]]] = []
                for col in columns:
                    col_sorted = sorted(col, key=lambda b: (b["y0"], b["x0"]))
                    if col_sorted:
                        ordered_columns.append(col_sorted)
                return ordered_columns

            full_blocks: List[Dict[str, Any]] = []
            normal_blocks: List[Dict[str, Any]] = []
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
            sections: List[Tuple[str, List[Dict[str, Any]]]] = []

            normal_idx = 0
            start_y = float("-inf")

            def _collect_until(y_max: float) -> List[Dict[str, Any]]:
                nonlocal normal_idx, start_y
                seg: List[Dict[str, Any]] = []
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

            tail: List[Dict[str, Any]] = []
            while normal_idx < len(normal_sorted):
                b = normal_sorted[normal_idx]
                if _center_y(b) >= start_y:
                    tail.append(b)
                normal_idx += 1
            if tail:
                sections.append(("columns", tail))

            ordered_columns: List[List[Dict[str, Any]]] = []
            for kind, seg in sections:
                if kind == "full":
                    ordered_columns.append(seg)
                else:
                    ordered_columns.extend(_order_columns(seg))
            return ordered_columns

        def _columns_to_text(columns: List[List[Dict[str, Any]]]) -> str:
            if not columns:
                return ""
            out_cols: List[str] = []
            for col in columns:
                lines = [str(b.get("text", "")).strip() for b in col if str(b.get("text", "")).strip()]
                if lines:
                    out_cols.append("\n".join(lines))
            return "\n\n".join([c for c in out_cols if c])

        def _rect_from_box(b: Any) -> Optional[Tuple[float, float, float, float]]:
            try:
                for names in (("x0", "y0", "x1", "y1"), ("xmin", "ymin", "xmax", "ymax"), ("left", "top", "right", "bottom")):
                    if all(hasattr(b, n) for n in names):
                        x0 = float(getattr(b, names[0]))
                        y0 = float(getattr(b, names[1]))
                        x1 = float(getattr(b, names[2]))
                        y1 = float(getattr(b, names[3]))
                        return (x0, y0, x1, y1)
                bb_attr = getattr(b, "bbox", None)
                if bb_attr is not None:
                    return _rect_from_box(bb_attr)
            except Exception:
                pass

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
                        import numpy as _np4  # type: ignore

                        if isinstance(coord, _np4.ndarray):
                            if coord.ndim == 2 and coord.shape[1] == 2:
                                coord = coord.reshape(-1, 2).tolist()
                            else:
                                coord = coord.flatten().tolist()
                    except Exception:
                        pass
                    if isinstance(coord, (list, tuple)):
                        if coord and isinstance(coord[0], (list, tuple)) and len(coord[0]) >= 2:
                            try:
                                xs = [float(p[0]) for p in coord]
                                ys = [float(p[1]) for p in coord]
                                return (min(xs), min(ys), max(xs), max(ys)) if xs and ys else None
                            except Exception:
                                pass
                        if coord and isinstance(coord[0], dict):
                            try:
                                xs: List[float] = []
                                ys: List[float] = []
                                for entry in coord:
                                    x = entry.get("x") if "x" in entry else entry.get("X")
                                    y = entry.get("y") if "y" in entry else entry.get("Y")
                                    if x is None or y is None:
                                        continue
                                    xs.append(float(x))
                                    ys.append(float(y))
                                if xs and ys:
                                    return (min(xs), min(ys), max(xs), max(ys))
                            except Exception:
                                pass
                        if len(coord) >= 8 and all(isinstance(v, numbers.Real) for v in coord):
                            xs = [float(v) for v in coord[0::2]]
                            ys = [float(v) for v in coord[1::2]]
                            return (min(xs), min(ys), max(xs), max(ys)) if xs and ys else None
                        if len(coord) == 4 and all(isinstance(v, numbers.Real) for v in coord):
                            x0, y0, a, b_val = map(float, coord)
                            if a <= x0 or b_val <= y0:
                                x1 = x0 + a
                                y1 = y0 + b_val
                            else:
                                x1 = a
                                y1 = b_val
                            if x1 > x0 and y1 > y0:
                                return (x0, y0, x1, y1)
                if isinstance(coord, dict):
                    try:
                        for names in (("x0", "y0", "x1", "y1"), ("xmin", "ymin", "xmax", "ymax"), ("left", "top", "right", "bottom")):
                            if all(k in coord for k in names):
                                x0 = float(coord[names[0]])
                                y0 = float(coord[names[1]])
                                x1 = float(coord[names[2]])
                                y1 = float(coord[names[3]])
                                return (x0, y0, x1, y1)
                    except Exception:
                        pass
                    for key in ("points", "poly", "polygon", "coords", "coordinates"):
                        pts = coord.get(key)
                        if pts is None:
                            continue
                        try:
                            import numpy as _np5  # type: ignore

                            if isinstance(pts, _np5.ndarray):
                                if pts.ndim == 2 and pts.shape[1] == 2:
                                    pts = pts.reshape(-1, 2).tolist()
                                else:
                                    pts = pts.flatten().tolist()
                        except Exception:
                            pass
                        if isinstance(pts, (list, tuple)):
                            if pts and isinstance(pts[0], (list, tuple)) and len(pts[0]) >= 2:
                                xs = [float(p[0]) for p in pts]
                                ys = [float(p[1]) for p in pts]
                                return (min(xs), min(ys), max(xs), max(ys)) if xs and ys else None
                            if pts and isinstance(pts[0], dict):
                                xs = []
                                ys = []
                                for entry in pts:
                                    x = entry.get("x") if "x" in entry else entry.get("X")
                                    y = entry.get("y") if "y" in entry else entry.get("Y")
                                    if x is None or y is None:
                                        continue
                                    xs.append(float(x))
                                    ys.append(float(y))
                                if xs and ys:
                                    return (min(xs), min(ys), max(xs), max(ys))
                            if len(pts) >= 8 and all(isinstance(v, numbers.Real) for v in pts):
                                xs = [float(v) for v in pts[0::2]]
                                ys = [float(v) for v in pts[1::2]]
                                return (min(xs), min(ys), max(xs), max(ys)) if xs and ys else None
                            if len(pts) == 4 and all(isinstance(v, numbers.Real) for v in pts):
                                x0, y0, a, b_val = map(float, pts[:4])
                                if a <= x0 or b_val <= y0:
                                    x1 = x0 + a
                                    y1 = y0 + b_val
                                else:
                                    x1 = a
                                    y1 = b_val
                                if x1 > x0 and y1 > y0:
                                    return (x0, y0, x1, y1)
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
                    if len(bb) == 4 and all(isinstance(v, numbers.Real) for v in bb):
                        return (float(bb[0]), float(bb[1]), float(bb[2]), float(bb[3]))
                    if len(bb) >= 8 and all(isinstance(v, numbers.Real) for v in bb):
                        xs = [float(v) for v in bb[0::2]]
                        ys = [float(v) for v in bb[1::2]]
                        return (min(xs), min(ys), max(xs), max(ys)) if xs and ys else None

            if isinstance(b, (list, tuple)):
                if b and isinstance(b[0], (list, tuple)) and len(b[0]) >= 2:
                    try:
                        xs = [float(p[0]) for p in b]
                        ys = [float(p[1]) for p in b]
                        return (min(xs), min(ys), max(xs), max(ys)) if xs and ys else None
                    except Exception:
                        pass
                if len(b) >= 8 and all(isinstance(v, numbers.Real) for v in b):
                    xs = [float(v) for v in b[0::2]]
                    ys = [float(v) for v in b[1::2]]
                    return (min(xs), min(ys), max(xs), max(ys)) if xs and ys else None
                if len(b) >= 4 and all(isinstance(v, numbers.Real) for v in b[:4]):
                    return (float(b[0]), float(b[1]), float(b[2]), float(b[3]))

            try:
                import numpy as _np6  # type: ignore

                if isinstance(b, _np6.ndarray):
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

        rects: List[Dict[str, Any]] = []
        kept_labels: List[str] = []
        skipped_labels: List[str] = []
        if layout_keep_labels:
            allowed_text_labels = {lbl.strip().lower() for lbl in str(layout_keep_labels).split(",") if lbl.strip()}
        else:
            allowed_text_labels = {
                "text", "paragraph_title", "title", "heading", "caption",
                "header", "number", "figure_title", "body", "section",
                "text_block", "textblock", "paragraph", "textbox", "textline",
            }
        for b in boxes:
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
                    rects.append({"x0": x0, "y0": y0, "x1": x1, "y1": y1, "label": label or "text"})

        w, h = image_obj.size if hasattr(image_obj, "size") else (0, 0)
        blocks: List[Dict[str, Any]] = []

        def _save_crop(crop_img: Any, ix0: int, iy0: int, ix1: int, iy1: int) -> None:
            nonlocal crop_seq
            if not save_crops_dir:
                return
            try:
                os.makedirs(save_crops_dir, exist_ok=True)
                crop_seq += 1
                prefix = f"p{page_num}" if page_num is not None else "p0"
                filename = f"{prefix}_crop_{crop_seq:05d}_{ix0}_{iy0}_{ix1}_{iy1}.png"
                crop_img.save(os.path.join(save_crops_dir, filename))
            except Exception as exc:
                if dump:
                    _dump_log("Failed to save crop: %s", exc)

        def _keep_if_text(res: Any) -> Any:
            if not res:
                return None
            try:
                for _, text_val in _iter_ocr_entries(res):
                    if text_val:
                        return res
            except Exception:
                return None
            return None

        def _iter_crop_variants(crop_img: Any):
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

        def _run_crop_ocr(crop_img: Any) -> Any:
            for variant_name, variant_img in _iter_crop_variants(crop_img):
                crop_arr = np.array(variant_img)
                result = _ocr_predict(
                    crop_arr,
                    det=False,
                    rec=True,
                    cls=bool(getattr(config, "paddle_use_textline_orientation", True)),
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
                        cls=bool(getattr(config, "paddle_use_textline_orientation", True)),
                    )
                    result = _keep_if_text(result)
                if result:
                    _dump_log("Crop OCR succeeded with variant: %s", variant_name)
                    return result
            return None

        if rects:
            if dump:
                try:
                    first_rect = rects[0] if rects else None
                    _dump_log("PaddleX rects parsed: %d; first=%s", len(rects), first_rect)
                    if kept_labels or skipped_labels:
                        kept_counts = dict(Counter(kept_labels)) if kept_labels else {}
                        skipped_counts = dict(Counter(skipped_labels)) if skipped_labels else {}
                        _dump_log("PaddleX labels kept=%s skipped=%s", kept_counts, skipped_counts)
                except Exception:
                    pass
            for rect in rects:
                try:
                    x0 = rect.get("x0"); y0 = rect.get("y0")
                    x1 = rect.get("x1"); y1 = rect.get("y1")
                    label = rect.get("label") or "text"
                    if x0 is None or y0 is None or x1 is None or y1 is None:
                        continue
                    
                    # Strict crop of the box content only (clamped to image)
                    cx0 = max(0, int(x0)); cx1 = min(w, int(x1))
                    cy0 = max(0, int(y0)); cy1 = min(h, int(y1))

                    if cx1 <= cx0 or cy1 <= cy0:
                        continue

                    # Shift crop vertically (vbias>0 moves crop downward) while preserving height
                    box_h = cy1 - cy0
                    if crop_vbias:
                        shifted_cy0 = cy0 + crop_vbias
                        # Clamp start so height fits in image
                        shifted_cy0 = min(max(0, shifted_cy0), max(0, h - box_h))
                        cy0 = shifted_cy0
                        cy1 = min(h, cy0 + box_h)

                    # Asymmetric vertical padding: reduce top / add to bottom when crop_vbias > 0
                    pad_top = max(0, crop_padding - crop_vbias)
                    pad_bottom = max(0, crop_padding + crop_vbias)

                    # Virtual padded coordinates (unclamped)
                    vx0 = int(x0) - crop_padding
                    vx1 = int(x1) + crop_padding
                    vy0 = int(y0) - pad_top
                    vy1 = int(y1) + pad_bottom
                    
                    dst_w = vx1 - vx0
                    dst_h = vy1 - vy0
                    
                    # White canvas (passepartout)
                    canvas = _PILImage.new("RGB", (dst_w, dst_h), (255, 255, 255))
                    
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
                result_crop = _run_crop_ocr(crop)
                if not result_crop:
                    continue
                line_entries: List[Dict[str, Any]] = []
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
                            bx0, by0, _, _, _ = bb
                            line_x0 = bx0 + float(ix0)
                            line_y0 = by0 + float(iy0)
                    line_entries.append({"text": text_val, "y0": line_y0, "x0": line_x0, "seq": seq})
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
            if dump and boxes:
                try:
                    _dump_log(
                        "PaddleX boxes present but no rects parsed; inspecting first %d box(es)",
                        min(len(boxes), 2),
                    )
                    for idx_box, bb in enumerate(boxes[:2]):
                        _dump_log("  Box[%d] type: %s", idx_box, type(bb))
                        for names in (("x0", "y0", "x1", "y1"), ("xmin", "ymin", "xmax", "ymax"), ("left", "top", "right", "bottom")):
                            try:
                                if all(hasattr(bb, n) for n in names):
                                    vals = tuple(float(getattr(bb, n)) for n in names)
                                    _dump_log("  Box[%d] attrs %s: %s", idx_box, names, vals)
                            except Exception:
                                pass
                        maybe_bb = None
                        try:
                            maybe_bb = _paddle_obj_to_dict(bb)
                        except Exception:
                            maybe_bb = None
                        if isinstance(maybe_bb, dict):
                            try:
                                _dump_log("  Box[%d] dict keys: %s", idx_box, sorted(maybe_bb.keys()))
                            except Exception:
                                _dump_log("  Box[%d] dict keys: %s", idx_box, list(maybe_bb.keys()))
                            try:
                                coord = maybe_bb.get("coordinate")
                            except Exception:
                                coord = None
                            if coord is not None:
                                try:
                                    if isinstance(coord, np.ndarray):
                                        _dump_log("    coordinate ndarray shape: %s", getattr(coord, "shape", None))
                                    elif isinstance(coord, (list, tuple)):
                                        preview_vals = coord[:8] if len(coord) > 8 else coord
                                        _dump_log(
                                            "    coordinate list len: %d preview: %s",
                                            len(coord),
                                            preview_vals,
                                        )
                                        if coord and isinstance(coord[0], (list, tuple)):
                                            _dump_log("    coordinate first pair: %s", coord[0])
                                        elif coord and isinstance(coord[0], dict):
                                            _dump_log("    coordinate first dict keys: %s", list(coord[0].keys()))
                                    elif isinstance(coord, dict):
                                        _dump_log("    coordinate dict keys: %s", list(coord.keys()))
                                except Exception:
                                    pass
                        elif isinstance(bb, (list, tuple)):
                            preview = bb[:8] if len(bb) >= 8 else bb
                            _dump_log("  Box[%d] list/tuple preview: %s", idx_box, preview)
                        else:
                            try:
                                if isinstance(bb, np.ndarray):
                                    _dump_log("  Box[%d] ndarray shape: %s", idx_box, bb.shape)
                            except Exception:
                                pass
                except Exception:
                    pass

        if blocks:
            columns = _order_blocks_into_columns(blocks)
            ordered = _columns_to_text(columns)
            if ordered.strip():
                return ordered.splitlines(), True, columns, total, len(blocks)

        if layout_has_boxes:
            _dump_log("Layout boxes detected but crop OCR produced no text; enabling plain OCR fallback.")
            return [], True, [], total, 0
        _dump_log("PaddleX layout produced no boxes; falling back to plain OCR.")
        return [], False, [], total, 0

    def _render_layout_markdown(pages: List[List[List[Dict[str, Any]]]], fallback_text: Optional[str] = None) -> str:
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

        out_lines: List[str] = []
        for page_idx, columns in enumerate(pages, start=1):
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

                    if label_val in {"paragraph_title", "title", "heading", "section", "header"}:
                        heading = _single_line(text_val)
                        if heading:
                            out_lines.append(f"### {heading}")
                        out_lines.append("")
                        continue

                    if label_val in {"figure_title", "caption", "figure", "figure_caption"}:
                        caption = _single_line(text_val)
                        if caption:
                            out_lines.append(f"**figure caption:** {caption}")
                        out_lines.append("")
                        continue

                    out_lines.append("")
                    out_lines.append(text_val)

            out_lines.append("")

        if not out_lines and fallback_text:
            fb = _normalize_block_text(fallback_text)
            if fb:
                return f"## Page 1\n\n{fb}\n"

        return ("\n".join(out_lines).rstrip() + "\n") if out_lines else ""

    pages: List[Dict[str, Any]] = []
    layout_pages: List[List[List[Dict[str, Any]]]] = []
    all_lines: List[str] = []
    total_boxes = 0
    total_blocks = 0
    pages_with_boxes = 0
    pages_with_blocks = 0
    fullpage_fallback_pages = 0
    total = max(1, len(images))
    if progress_cb and progress_span > 0:
        progress_cb(progress_base, "layout", f"Paddle layout page 1/{total}")

    for idx, image in enumerate(images, start=1):
        page_img = image.convert("RGB")
        if max_side_px > 0:
            max_side = max(page_img.width, page_img.height)
            if max_side > max_side_px:
                scale = max_side_px / max_side
                new_size = (max(1, int(page_img.width * scale)), max(1, int(page_img.height * scale)))
                page_img = page_img.resize(new_size, resample=_PILImage.LANCZOS)
        src_path = None
        if use_file_path:
            try:
                fd, src_path = tempfile.mkstemp(prefix="paddlex_layout_", suffix=".png")
                os.close(fd)
                page_img.save(src_path)
            except Exception:
                src_path = None
        try:
            page_lines, layout_boxes, page_columns, box_count, block_count = _paddlex_structure_extract_texts(
                page_img,
                languages,
                src_path=src_path,
                page_num=idx,
            )
        finally:
            if src_path:
                try:
                    os.unlink(src_path)
                except Exception:
                    pass
        layout_pages.append(page_columns)
        if layout_boxes:
            pages_with_boxes += 1
            total_boxes += int(box_count or 0)
        if page_columns:
            pages_with_blocks += 1
            total_blocks += int(block_count or 0)

        if not page_lines:
            if layout_boxes:
                _dump_log("Page %d: layout boxes detected but no text lines produced; skipping plain OCR fallback.", idx)
                page_lines = []
            else:
                _dump_log("Page %d: layout produced no boxes; running plain OCR fallback.", idx)
                fullpage_fallback_pages += 1
                if ocr is None:
                    for kw in ctor_candidates:
                        ocr = _try_create_direct(kw)
                        if ocr is not None:
                            break
                    if ocr is None:
                        raise RuntimeError("Failed to create PaddleOCR for plain OCR fallback.")
                result = None
                try:
                    img_np = np.array(page_img)
                    result = _ocr_predict(img_np)
                    if result is None:
                        result = _ocr_legacy(img_np)
                    if result is None:
                        result = _ocr_legacy(
                            img_np,
                            cls=bool(getattr(config, "paddle_use_textline_orientation", True)),
                        )
                except Exception as exc:
                    raise RuntimeError(f"PaddleOCR failed: {exc}") from exc
                page_lines = _extract_texts(result) if result else []

        if page_lines:
            all_lines.extend(page_lines)
        page_text = "\n".join(page_lines).strip()
        pages.append({"page_num": idx, "text": page_text})

        if progress_cb and progress_span > 0:
            percent = progress_base + int(idx / total * progress_span)
            progress_cb(percent, "layout", f"Paddle layout page {idx}/{total}")

    text = "\n".join(all_lines).strip()
    LOGGER.info(
        "PaddleX layout OCR complete: pages=%d, text_chars=%d",
        len(pages),
        ocr_pages_text_chars(pages),
    )
    layout_markdown = _render_layout_markdown(layout_pages, fallback_text=text)
    return pages, {
        "layout_used": True,
        "layout_model": layout_model,
        "layout_boxes_total": total_boxes,
        "layout_blocks_total": total_blocks,
        "layout_pages_with_boxes": pages_with_boxes,
        "layout_pages_with_blocks": pages_with_blocks,
        "layout_pages_fullpage_fallback": fullpage_fallback_pages,
        "layout_markdown": layout_markdown,
    }

def ocr_pages_with_paddle_structure(
    images: Sequence[Any],
    languages: str,
    config: Any,
    helpers: Dict[str, Any],
    progress_cb: Optional[Any] = None,
    progress_base: int = 0,
    progress_span: int = 0,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    global LOGGER
    LOGGER = helpers.get("logger", LOGGER)
    structure_api_disabled = bool(getattr(config, "paddle_structure_api_disable", False))
    structure_api_url = getattr(config, "paddle_structure_api_url", None) or os.getenv("PADDLE_STRUCTURE_API_URL")
    structure_api_token = getattr(config, "paddle_structure_api_token", None) or os.getenv("PADDLE_STRUCTURE_API_TOKEN")
    structure_api_timeout = getattr(config, "paddle_structure_api_timeout_sec", 120)
    if structure_api_url and structure_api_token and not structure_api_disabled:
        orig_url = getattr(config, "paddle_vl_api_url", None)
        orig_token = getattr(config, "paddle_vl_api_token", None)
        orig_timeout = getattr(config, "paddle_vl_api_timeout_sec", None)
        orig_disable = getattr(config, "paddle_vl_api_disable", None)
        setattr(config, "paddle_vl_api_url", structure_api_url)
        setattr(config, "paddle_vl_api_token", structure_api_token)
        setattr(config, "paddle_vl_api_timeout_sec", structure_api_timeout)
        setattr(config, "paddle_vl_api_disable", False)
        try:
            pages, stats = ocr_pages_with_paddle_vl(
                images,
                languages,
                config,
                helpers,
                progress_cb,
                progress_base,
                progress_span,
            )
        finally:
            setattr(config, "paddle_vl_api_url", orig_url)
            setattr(config, "paddle_vl_api_token", orig_token)
            setattr(config, "paddle_vl_api_timeout_sec", orig_timeout)
            setattr(config, "paddle_vl_api_disable", orig_disable)
        if isinstance(stats, dict):
            stats["layout_model"] = "PP-StructureV3 API"
        return pages, stats
    if bool(getattr(config, "paddle_use_paddlex_layout", True)):
        try:
            return _paddlex_layout_ocr_pages(
                images,
                languages,
                config,
                helpers,
                progress_cb,
                progress_base,
                progress_span,
            )
        except Exception as exc:
            LOGGER.warning("PaddleX layout OCR failed; falling back to PaddleOCR: %s", exc)
    return ocr_pages_with_paddle(
        images,
        languages,
        config,
        helpers,
        progress_cb,
        progress_base,
        progress_span,
    )


def ocr_pages_with_paddle_vl(
    images: Sequence[Any],
    languages: str,
    config: Any,
    helpers: Dict[str, Any],
    progress_cb: Optional[Any] = None,
    progress_base: int = 0,
    progress_span: int = 0,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    global LOGGER
    LOGGER = helpers.get("logger", LOGGER)
    ocr_pages_text_chars = helpers["ocr_pages_text_chars"]

    api_url = getattr(config, "paddle_vl_api_url", None) or os.getenv("PADDLE_VL_API_URL")
    api_token = getattr(config, "paddle_vl_api_token", None) or os.getenv("PADDLE_VL_API_TOKEN")
    api_timeout = getattr(config, "paddle_vl_api_timeout_sec", 120)
    source_path = helpers.get("ocr_source_path")

    api_disabled = bool(getattr(config, "paddle_vl_api_disable", False))
    if api_url and api_token and not api_disabled:
        api_max_pages = int(getattr(config, "paddle_vl_api_max_pages", 100) or 100)
        if api_max_pages <= 0:
            api_max_pages = 100
        api_max_chunk_bytes = int(getattr(config, "paddle_vl_api_max_chunk_bytes", 0) or 0)
        if api_max_chunk_bytes <= 0:
            try:
                env_value = os.getenv("PADDLE_VL_API_MAX_CHUNK_BYTES", "")
                if env_value:
                    api_max_chunk_bytes = int(env_value)
            except Exception:
                api_max_chunk_bytes = 0
        api_images = list(images) if images else []
        source_page_count = None
        source_reader = None
        PdfWriter = None
        if isinstance(source_path, str) and source_path.lower().endswith(".pdf") and os.path.isfile(source_path):
            try:
                from pypdf import PdfReader, PdfWriter  # type: ignore
                source_reader = PdfReader(source_path)
                source_page_count = len(source_reader.pages)
            except Exception:
                source_page_count = None
                source_reader = None
                PdfWriter = None
        original_count = source_page_count if source_page_count else (len(api_images) if api_images else None)
        if api_max_chunk_bytes > 0:
            LOGGER.info(
                "PaddleOCR-VL API payload cap: %d bytes (max pages per chunk: %d).",
                api_max_chunk_bytes,
                api_max_pages,
            )
        elif original_count and original_count > api_max_pages:
            LOGGER.info(
                "PaddleOCR-VL API batch size %d; splitting %d pages into chunks.",
                api_max_pages,
                original_count,
            )
        try:
            import base64
            import io
            import requests
        except Exception as exc:
            raise RuntimeError(f"PaddleOCR-VL API dependencies missing: {exc}") from exc

        headers = {
            "Authorization": f"token {api_token}",
            "Content-Type": "application/json",
        }

        def _normalize_ignore_labels(value: Any) -> Optional[List[str]]:
            if not value:
                return None
            if isinstance(value, str):
                labels = [item.strip() for item in value.split(",") if item.strip()]
            elif isinstance(value, (list, tuple, set)):
                labels = [str(item).strip() for item in value if str(item).strip()]
            else:
                labels = [str(value).strip()] if str(value).strip() else []
            return labels or None

        optional_payload: Dict[str, Any] = {}
        ignore_labels = _normalize_ignore_labels(getattr(config, "paddle_vl_markdown_ignore_labels", None))
        if ignore_labels:
            optional_payload["markdownIgnoreLabels"] = ignore_labels
        if getattr(config, "paddle_use_doc_orientation_classify", None) is not None:
            optional_payload["useDocOrientationClassify"] = bool(config.paddle_use_doc_orientation_classify)
        if getattr(config, "paddle_use_doc_unwarping", None) is not None:
            optional_payload["useDocUnwarping"] = bool(config.paddle_use_doc_unwarping)
        use_layout_detection = getattr(config, "paddle_vl_use_layout_detection", None)
        if use_layout_detection is not None:
            optional_payload["useLayoutDetection"] = bool(use_layout_detection)
        if getattr(config, "paddle_vl_use_chart_recognition", None) is not None:
            optional_payload["useChartRecognition"] = bool(config.paddle_vl_use_chart_recognition)
        if getattr(config, "paddle_vl_prompt_label", None):
            optional_payload["promptLabel"] = str(config.paddle_vl_prompt_label)
        layout_nms = getattr(config, "paddle_vl_layout_nms", None)
        if layout_nms is None:
            layout_nms = getattr(config, "paddle_layout_nms", None)
        if layout_nms is not None:
            optional_payload["layoutNms"] = bool(layout_nms)
        if getattr(config, "paddle_vl_repetition_penalty", None) is not None:
            optional_payload["repetitionPenalty"] = getattr(config, "paddle_vl_repetition_penalty")
        if getattr(config, "paddle_vl_temperature", None) is not None:
            optional_payload["temperature"] = getattr(config, "paddle_vl_temperature")
        if getattr(config, "paddle_vl_top_p", None) is not None:
            optional_payload["topP"] = getattr(config, "paddle_vl_top_p")
        if getattr(config, "paddle_vl_min_pixels", None) is not None:
            optional_payload["minPixels"] = int(getattr(config, "paddle_vl_min_pixels"))
        if getattr(config, "paddle_vl_max_pixels", None) is not None:
            optional_payload["maxPixels"] = int(getattr(config, "paddle_vl_max_pixels"))

        def _strip_markup(text: str) -> str:
            text = re.sub(r"<[^>]+>", " ", text)
            text = re.sub(r"!\[[^\]]*]\([^)]+\)", " ", text)
            text = re.sub(r"\s+", " ", text)
            return text.strip()

        def _estimate_payload_bytes(file_bytes: bytes) -> int:
            if not file_bytes:
                return 0
            b64_len = 4 * ((len(file_bytes) + 2) // 3)
            return b64_len + 200

        def _build_pdf_bytes(page_list: Sequence[Any]) -> bytes:
            if PdfWriter is None:
                raise RuntimeError("PDF chunking requires pypdf.")
            writer = PdfWriter()
            for page in page_list:
                writer.add_page(page)
            buffer = io.BytesIO()
            writer.write(buffer)
            buffer.seek(0)
            return buffer.read()

        def _build_payload(file_bytes: bytes, file_type: int) -> Dict[str, Any]:
            payload: Dict[str, Any] = {
                "file": base64.b64encode(file_bytes).decode("ascii"),
                "fileType": file_type,
            }
            payload.update(optional_payload)
            return payload

        def _shorten_text(value: str, limit: int = 240) -> str:
            if len(value) <= limit:
                return value
            return f"{value[:limit]}...<truncated {len(value) - limit} chars>"

        def _keys_preview(value: Dict[str, Any], limit: int = 12) -> List[str]:
            keys = [str(k) for k in value.keys()]
            keys.sort()
            return keys[:limit]

        def _collect_block_labels_summary(value: Any, counts: Dict[str, int], limit: int = 24) -> None:
            if len(counts) >= limit:
                return
            if isinstance(value, dict):
                for key, item in value.items():
                    key_str = str(key)
                    if key_str in {
                        "block_label",
                        "blockLabel",
                        "block_label_name",
                        "blockLabelName",
                        "block_label_type",
                        "blockLabelType",
                    }:
                        if isinstance(item, str):
                            label = item.strip()
                            if label:
                                counts[label] = counts.get(label, 0) + 1
                        continue
                    _collect_block_labels_summary(item, counts, limit)
            elif isinstance(value, list):
                for item in value:
                    _collect_block_labels_summary(item, counts, limit)

        def _summarize_layout_entry(entry: Any) -> Any:
            if not isinstance(entry, dict):
                return {"type": type(entry).__name__}
            summary: Dict[str, Any] = {"keys": _keys_preview(entry)}
            label_counts: Dict[str, int] = {}
            _collect_block_labels_summary(entry, label_counts)
            if label_counts:
                summary["block_label_count"] = sum(label_counts.values())
                top = sorted(label_counts.items(), key=lambda item: (-item[1], item[0]))
                summary["block_label_values"] = [label for label, _ in top[:12]]
            markdown = entry.get("markdown")
            if isinstance(markdown, dict):
                md_text = markdown.get("text") or markdown.get("markdown") or markdown.get("content")
                if isinstance(md_text, str):
                    summary["markdown_len"] = len(md_text)
                    summary["markdown_preview"] = _shorten_text(md_text)
                md_images = markdown.get("images") or markdown.get("markdown_images") or markdown.get("markdownImages")
                if isinstance(md_images, dict):
                    summary["markdown_images_count"] = len(md_images)
                    summary["markdown_images_keys"] = _keys_preview(md_images, limit=6)
            elif isinstance(markdown, str):
                summary["markdown_len"] = len(markdown)
                summary["markdown_preview"] = _shorten_text(markdown)
            output_images = entry.get("outputImages")
            if isinstance(output_images, dict):
                summary["output_images_count"] = len(output_images)
                summary["output_images_keys"] = _keys_preview(output_images, limit=6)
            pruned = entry.get("prunedResult")
            if isinstance(pruned, list):
                summary["pruned_result_count"] = len(pruned)
                preview: List[Dict[str, Any]] = []
                for block in pruned[:5]:
                    if not isinstance(block, dict):
                        preview.append({"type": type(block).__name__})
                        continue
                    preview.append(_summarize_pruned_block(block))
                summary["pruned_result_preview"] = preview
            elif isinstance(pruned, dict):
                summary["pruned_result_count"] = 1
                preview: Dict[str, Any] = {"keys": _keys_preview(pruned, limit=12)}
                parsing_list = pruned.get("parsing_res_list") if isinstance(pruned, dict) else None
                if isinstance(parsing_list, list):
                    preview["parsing_res_count"] = len(parsing_list)
                    parsing_preview: List[Dict[str, Any]] = []
                    for block in parsing_list[:5]:
                        if not isinstance(block, dict):
                            parsing_preview.append({"type": type(block).__name__})
                            continue
                        parsing_preview.append(_summarize_pruned_block(block))
                    preview["parsing_res_preview"] = parsing_preview
                summary["pruned_result_preview"] = preview
            return summary

        def _summarize_pruned_block(block: Dict[str, Any]) -> Dict[str, Any]:
            def _find_string_by_keys(value: Any, keys: Set[str], depth: int = 0, limit: int = 3) -> Optional[str]:
                if depth > limit:
                    return None
                if isinstance(value, dict):
                    for key, item in value.items():
                        if key in keys and isinstance(item, str) and item.strip():
                            return item.strip()
                    for item in value.values():
                        found = _find_string_by_keys(item, keys, depth + 1, limit)
                        if found:
                            return found
                elif isinstance(value, list):
                    for item in value[:5]:
                        found = _find_string_by_keys(item, keys, depth + 1, limit)
                        if found:
                            return found
                return None

            def _find_bbox(value: Any, depth: int = 0, limit: int = 3) -> Optional[List[float]]:
                if depth > limit:
                    return None
                if isinstance(value, (list, tuple)) and len(value) >= 4:
                    try:
                        return [round(float(x), 2) for x in value[:4]]
                    except Exception:
                        return None
                if isinstance(value, dict):
                    if all(k in value for k in ("x0", "y0", "x1", "y1")):
                        try:
                            return [
                                round(float(value["x0"]), 2),
                                round(float(value["y0"]), 2),
                                round(float(value["x1"]), 2),
                                round(float(value["y1"]), 2),
                            ]
                        except Exception:
                            return None
                    if all(k in value for k in ("left", "top", "width", "height")):
                        try:
                            left = float(value["left"])
                            top = float(value["top"])
                            return [
                                round(left, 2),
                                round(top, 2),
                                round(left + float(value["width"]), 2),
                                round(top + float(value["height"]), 2),
                            ]
                        except Exception:
                            return None
                    for item in value.values():
                        found = _find_bbox(item, depth + 1, limit)
                        if found:
                            return found
                if isinstance(value, list):
                    for item in value[:5]:
                        found = _find_bbox(item, depth + 1, limit)
                        if found:
                            return found
                return None

            preview: Dict[str, Any] = {}
            for key in ("block_label", "blockLabel", "label", "type", "block_type", "blockType"):
                val = block.get(key)
                if isinstance(val, str) and val.strip():
                    preview["block_label"] = val.strip()
                    break
            for key in ("id", "block_id", "blockId", "uuid", "uid"):
                val = block.get(key)
                if isinstance(val, (int, str)) and str(val).strip():
                    preview[key] = str(val).strip()
                    break
            for key in ("parent_id", "parentId", "group_id", "groupId", "layout_id", "layoutId"):
                val = block.get(key)
                if isinstance(val, (int, str)) and str(val).strip():
                    preview[key] = str(val).strip()
            for key in ("image_id", "imageId", "img_id", "imgId", "image_index", "img_idx"):
                val = block.get(key)
                if isinstance(val, (int, str)) and str(val).strip():
                    preview[key] = str(val).strip()
                    break
            image_keys = {
                "image",
                "img",
                "image_path",
                "imagePath",
                "img_path",
                "src",
                "url",
                "path",
                "file",
                "file_path",
                "filePath",
            }
            image_ref = _find_string_by_keys(block, image_keys)
            if image_ref:
                preview["image_ref"] = image_ref
            text_keys = {
                "text",
                "content",
                "ocr_text",
                "ocrText",
                "caption",
                "figure_caption",
                "footnote",
                "note",
                "value",
            }
            text_val = _find_string_by_keys(block, text_keys)
            if text_val:
                preview["text_preview"] = _shorten_text(text_val, limit=160)
            bbox_val = _find_bbox(block)
            if bbox_val:
                preview["bbox"] = bbox_val
            preview["keys"] = _keys_preview(block, limit=12)
            return preview

        def _summarize_result(value: Any) -> Any:
            if isinstance(value, dict):
                summary: Dict[str, Any] = {"keys": _keys_preview(value)}
                layout_key = None
                layout_val = None
                for key in (
                    "layoutParsingResults",
                    "layout_parsing_results",
                    "layoutParsingResult",
                    "layout_parsing_result",
                ):
                    if key in value:
                        layout_key = key
                        layout_val = value.get(key)
                        break
                if layout_key is not None:
                    summary["layout_key"] = layout_key
                    if isinstance(layout_val, list):
                        summary["layout_count"] = len(layout_val)
                        if layout_val:
                            summary["layout_preview"] = _summarize_layout_entry(layout_val[0])
                    elif layout_val is not None:
                        summary["layout_count"] = 1
                        summary["layout_preview"] = _summarize_layout_entry(layout_val)
                return summary
            if isinstance(value, list):
                preview: Dict[str, Any] = {"list_len": len(value)}
                if value:
                    preview["first_item_type"] = type(value[0]).__name__
                    if isinstance(value[0], dict):
                        preview["first_item_keys"] = _keys_preview(value[0])
                return preview
            if isinstance(value, str):
                return {"text_preview": _shorten_text(value)}
            return {"type": type(value).__name__}

        def _summarize_api_response(value: Any) -> Dict[str, Any]:
            summary: Dict[str, Any] = {}
            if isinstance(value, dict):
                for key in ("code", "status", "message", "msg", "error", "error_msg", "errorMsg"):
                    if key in value:
                        summary[key] = _shorten_text(str(value.get(key)))
                if "result" in value:
                    summary["result"] = _summarize_result(value.get("result"))
                else:
                    summary["result"] = _summarize_result(value)
                summary["keys"] = _keys_preview(value)
                return summary
            summary["result"] = _summarize_result(value)
            return summary

        def _is_timeout_error(exc: Exception) -> bool:
            try:
                if isinstance(exc, requests.exceptions.Timeout):
                    return True
                if isinstance(exc, requests.exceptions.ConnectionError):
                    message = str(exc).lower()
                    if "timed out" in message or "timeout" in message:
                        return True
            except Exception:
                pass
            if isinstance(exc, TimeoutError):
                return True
            message = str(exc).lower()
            return "timed out" in message or "timeout" in message

        def _is_http_500_error(exc: Exception) -> bool:
            message = str(exc).lower()
            if "status=500" in message:
                return True
            if "errorcode\":500" in message or "errorcode':500" in message:
                return True
            if "internal server error" in message:
                return True
            return False

        def _request_api(file_bytes: bytes, file_type: int, label: str) -> Dict[str, Any]:
            payload = _build_payload(file_bytes, file_type)
            max_attempts = 3
            delay_sec = 2
            response = None
            for attempt in range(1, max_attempts + 1):
                try:
                    response = requests.post(api_url, json=payload, headers=headers, timeout=api_timeout)
                    break
                except Exception as exc:
                    if _is_timeout_error(exc) and attempt < max_attempts:
                        LOGGER.warning(
                            "PaddleOCR-VL API timeout (%s). Retrying %d/%d in %ds.",
                            label,
                            attempt,
                            max_attempts,
                            delay_sec,
                        )
                        time.sleep(delay_sec)
                        delay_sec *= 2
                        continue
                    raise RuntimeError(f"PaddleOCR-VL API request failed ({label}): {exc}") from exc
            if response is None:
                raise RuntimeError(f"PaddleOCR-VL API request failed ({label}): no response")
            if response.status_code != 200:
                if response.status_code == 429:
                    retry_after = response.headers.get("Retry-After")
                    message = (
                        "PaddleOCR-VL API rate limited (429): daily 3000-page limit reached. "
                        "Wait for the quota reset or request whitelist access."
                    )
                    if retry_after:
                        message = f"{message} Retry-After: {retry_after}"
                    raise RuntimeError(message)
                body = ""
                try:
                    body = response.text.strip()
                except Exception:
                    body = ""
                raise RuntimeError(
                    f"PaddleOCR-VL API request failed ({label}): status={response.status_code} {body}"
                )
            try:
                data = response.json()
            except Exception as exc:
                raise RuntimeError(f"PaddleOCR-VL API response parse failed ({label}): {exc}") from exc
            summary = _summarize_api_response(data)
            try:
                LOGGER.info("PaddleOCR-VL API response (%s): %s", label, json.dumps(summary, ensure_ascii=True))
            except Exception:
                LOGGER.info("PaddleOCR-VL API response (%s): %r", label, summary)
            return data

        def _extract_layout_results(data: Any) -> List[Dict[str, Any]]:
            if isinstance(data, dict):
                def _is_success_message(value: Any) -> bool:
                    if value is None:
                        return False
                    text = str(value).strip().lower()
                    return text in {"success", "ok", "ok."}

                error_code = data.get("errorCode")
                if error_code is None:
                    error_code = data.get("error_code")
                error_msg = data.get("error_msg") or data.get("errorMsg")
                error_field = data.get("error")
                if error_msg is None and isinstance(error_field, dict):
                    error_msg = error_field.get("message") or error_field.get("msg")
                if error_code is not None:
                    try:
                        code_int = int(error_code)
                    except Exception:
                        code_int = None
                    if code_int is not None and code_int != 0:
                        err = error_msg or error_field or error_code
                        raise RuntimeError(f"PaddleOCR-VL API error: {err}")
                    if code_int is None and error_msg and not _is_success_message(error_msg):
                        raise RuntimeError(f"PaddleOCR-VL API error: {error_msg}")
                else:
                    if isinstance(error_field, bool):
                        if error_field and not _is_success_message(error_msg):
                            err = error_msg or error_field
                            raise RuntimeError(f"PaddleOCR-VL API error: {err}")
                    elif error_msg and not _is_success_message(error_msg):
                        raise RuntimeError(f"PaddleOCR-VL API error: {error_msg}")
                result = data.get("result") if "result" in data else data
            else:
                result = data
            if isinstance(result, dict):
                for key in (
                    "layoutParsingResults",
                    "layout_parsing_results",
                    "layoutParsingResult",
                    "layout_parsing_result",
                ):
                    val = result.get(key)
                    if isinstance(val, list):
                        return val
                    if isinstance(val, dict):
                        return [val]
            if isinstance(result, list):
                return [r for r in result if isinstance(r, dict)]
            return []

        def _extract_markdown_text(entry: Dict[str, Any]) -> Optional[str]:
            md_info = entry.get("markdown")
            if isinstance(md_info, dict):
                for key in ("text", "markdown", "content"):
                    val = md_info.get(key)
                    if isinstance(val, str) and val.strip():
                        return val.strip()
            if isinstance(md_info, str) and md_info.strip():
                return md_info.strip()
            for key in ("markdown", "markdown_text", "text", "content"):
                val = entry.get(key)
                if isinstance(val, str) and val.strip():
                    return val.strip()
            return None

        def _extract_markdown_images(entry: Dict[str, Any]) -> Dict[str, Any]:
            images: Dict[str, Any] = {}
            md_info = entry.get("markdown")
            if isinstance(md_info, dict):
                candidate = md_info.get("images") or md_info.get("markdown_images") or md_info.get("markdownImages")
                if isinstance(candidate, dict):
                    images.update(candidate)
            for key in ("markdown_images", "markdownImages"):
                candidate = entry.get(key)
                if isinstance(candidate, dict):
                    images.update(candidate)
            return images

        def _extract_page_text(entry: Dict[str, Any], md_text: Optional[str]) -> str:
            for key in ("text", "ocrText", "ocr_text", "content"):
                val = entry.get(key)
                if isinstance(val, str) and val.strip():
                    return val.strip()
            if md_text:
                return _strip_markup(md_text)
            return ""

        def _image_to_bytes(image: Any) -> bytes:
            if isinstance(image, (bytes, bytearray)):
                return bytes(image)
            if isinstance(image, str) and os.path.isfile(image):
                with open(image, "rb") as handle:
                    return handle.read()
            if hasattr(image, "save"):
                img = image
                if hasattr(img, "convert"):
                    try:
                        img = img.convert("RGB")
                    except Exception:
                        img = image
                buffer = io.BytesIO()
                try:
                    img.save(buffer, format="PNG")
                except Exception:
                    buffer = io.BytesIO()
                    img.save(buffer, format="JPEG")
                return buffer.getvalue()
            try:
                import numpy as np
                from PIL import Image as _PILImage
            except Exception:
                raise RuntimeError("Unsupported image type for PaddleOCR-VL API.")
            if isinstance(image, np.ndarray):
                buffer = io.BytesIO()
                _PILImage.fromarray(image).save(buffer, format="PNG")
                return buffer.getvalue()
            raise RuntimeError("Unsupported image type for PaddleOCR-VL API.")

        pages: List[Dict[str, Any]] = []
        markdown_items: List[str] = []
        markdown_images: Dict[str, Any] = {}
        markdown_image_labels: Dict[str, str] = {}
        page_counter = 0
        if progress_cb and progress_span > 0:
            progress_cb(progress_base, "ocr", "Paddle OCR-VL API initializing")

        def _normalize_image_ref(value: Any) -> Optional[str]:
            if isinstance(value, str):
                return value.strip() or None
            if isinstance(value, dict):
                for key in ("image", "img", "src", "url", "path", "file", "file_path", "filePath"):
                    cand = value.get(key)
                    if isinstance(cand, str) and cand.strip():
                        return cand.strip()
            return None

        def _merge_label(existing: Optional[str], incoming: str) -> str:
            if not existing:
                return incoming
            if incoming.lower() in existing.lower():
                return existing
            if existing.lower() in incoming.lower():
                return incoming
            return f"{existing}; {incoming}"

        def _store_image_label(ref: str, label: str) -> None:
            if not ref or not label:
                return
            label = label.strip()
            if not label:
                return
            markdown_image_labels[ref] = _merge_label(markdown_image_labels.get(ref), label)
            filename = os.path.basename(ref)
            if filename:
                markdown_image_labels[filename] = _merge_label(markdown_image_labels.get(filename), label)

        def _extract_block_bbox(block: Dict[str, Any]) -> Optional[List[float]]:
            for key in ("block_bbox", "bbox", "box", "rect", "xyxy"):
                val = block.get(key)
                if isinstance(val, (list, tuple)) and len(val) >= 4:
                    try:
                        return [float(val[0]), float(val[1]), float(val[2]), float(val[3])]
                    except Exception:
                        continue
                if isinstance(val, dict):
                    if all(k in val for k in ("x0", "y0", "x1", "y1")):
                        try:
                            return [float(val["x0"]), float(val["y0"]), float(val["x1"]), float(val["y1"])]
                        except Exception:
                            continue
                    if all(k in val for k in ("left", "top", "width", "height")):
                        try:
                            left = float(val["left"])
                            top = float(val["top"])
                            return [left, top, left + float(val["width"]), top + float(val["height"])]
                        except Exception:
                            continue
            return None

        def _extract_block_text(block: Dict[str, Any]) -> Optional[str]:
            text_keys = {
                "block_content",
                "text",
                "content",
                "ocr_text",
                "ocrText",
                "caption",
                "figure_caption",
                "footnote",
                "note",
                "value",
            }
            fragments: List[str] = []

            def walk(value: Any, depth: int = 0) -> None:
                if depth > 4 or len(fragments) >= 8:
                    return
                if isinstance(value, str):
                    chunk = value.strip()
                    if chunk:
                        fragments.append(chunk)
                    return
                if isinstance(value, dict):
                    for key in text_keys:
                        if key in value:
                            walk(value[key], depth + 1)
                    for item in value.values():
                        walk(item, depth + 1)
                elif isinstance(value, list):
                    for item in value[:8]:
                        walk(item, depth + 1)

            walk(block)
            if not fragments:
                return None
            deduped: List[str] = []
            seen: Set[str] = set()
            for frag in fragments:
                if frag in seen:
                    continue
                seen.add(frag)
                deduped.append(frag)
            return " ".join(deduped).strip() or None

        def _parse_bbox_from_image_key(key: str) -> Optional[List[float]]:
            match = re.search(r"_(\d+(?:\.\d+)?)_(\d+(?:\.\d+)?)_(\d+(?:\.\d+)?)_(\d+(?:\.\d+)?)\.(?:png|jpg|jpeg|webp)$", key, re.IGNORECASE)
            if not match:
                return None
            try:
                return [float(match.group(1)), float(match.group(2)), float(match.group(3)), float(match.group(4))]
            except Exception:
                return None

        def _bbox_overlap_x(a: List[float], b: List[float]) -> float:
            overlap = max(0.0, min(a[2], b[2]) - max(a[0], b[0]))
            width = max(1.0, min(a[2] - a[0], b[2] - b[0]))
            return overlap / width if width > 0 else 0.0

        def _attach_vision_footnotes(entry: Dict[str, Any], md_images: Dict[str, Any]) -> None:
            if not md_images:
                return
            pruned = entry.get("prunedResult")
            parsing_list = None
            if isinstance(pruned, dict):
                parsing_list = pruned.get("parsing_res_list")
            elif isinstance(pruned, list):
                parsing_list = pruned
            if not isinstance(parsing_list, list):
                return
            image_blocks: List[Dict[str, Any]] = []
            footnote_blocks: List[Dict[str, Any]] = []
            for block in parsing_list:
                if not isinstance(block, dict):
                    continue
                label = (
                    block.get("block_label")
                    or block.get("blockLabel")
                    or block.get("label")
                    or block.get("type")
                    or ""
                )
                label = str(label).strip().lower()
                bbox = _extract_block_bbox(block)
                if label == "image" and bbox:
                    image_blocks.append({"bbox": bbox})
                elif label == "vision_footnote" and bbox:
                    text = _extract_block_text(block)
                    if text:
                        footnote_blocks.append({"bbox": bbox, "text": text})
            if not image_blocks or not footnote_blocks:
                return
            image_keys = [key for key in md_images.keys() if isinstance(key, str)]
            image_key_bboxes: List[Tuple[str, List[float]]] = []
            for key in image_keys:
                bbox = _parse_bbox_from_image_key(key)
                if bbox:
                    image_key_bboxes.append((key, bbox))
            image_block_to_key: Dict[int, str] = {}
            if image_key_bboxes:
                for idx, block in enumerate(image_blocks):
                    best_key = None
                    best_score = None
                    for key, bbox in image_key_bboxes:
                        score = sum(abs(a - b) for a, b in zip(block["bbox"], bbox))
                        if best_score is None or score < best_score:
                            best_score = score
                            best_key = key
                    if best_key:
                        image_block_to_key[idx] = best_key
            if not image_block_to_key and len(image_blocks) == 1 and len(image_keys) == 1:
                image_block_to_key[0] = image_keys[0]

            for footnote in footnote_blocks:
                best_idx = None
                best_gap = None
                for idx, image_block in enumerate(image_blocks):
                    img_bbox = image_block["bbox"]
                    foot_bbox = footnote["bbox"]
                    overlap_ratio = _bbox_overlap_x(img_bbox, foot_bbox)
                    if overlap_ratio < 0.2:
                        continue
                    vertical_gap = foot_bbox[1] - img_bbox[3]
                    if vertical_gap < -10:
                        continue
                    gap_score = max(0.0, vertical_gap)
                    if best_gap is None or gap_score < best_gap:
                        best_gap = gap_score
                        best_idx = idx
                if best_idx is None:
                    continue
                key = image_block_to_key.get(best_idx)
                if key:
                    _store_image_label(key, footnote["text"])

        def _collect_block_labels(value: Any) -> None:
            if isinstance(value, dict):
                label = (
                    value.get("block_label")
                    or value.get("blockLabel")
                    or value.get("label")
                    or value.get("blockLabelName")
                )
                image_ref = _normalize_image_ref(
                    value.get("image")
                    or value.get("img")
                    or value.get("image_path")
                    or value.get("imagePath")
                    or value.get("img_path")
                    or value.get("src")
                )
                if isinstance(label, str) and image_ref:
                    _store_image_label(image_ref, label)
                for item in value.values():
                    _collect_block_labels(item)
            elif isinstance(value, list):
                for item in value:
                    _collect_block_labels(item)

        def _append_page(entry: Dict[str, Any]) -> None:
            nonlocal page_counter
            md_text = _extract_markdown_text(entry)
            if md_text:
                markdown_items.append(md_text)
            md_images = _extract_markdown_images(entry)
            if md_images:
                markdown_images.update(md_images)
                _attach_vision_footnotes(entry, md_images)
            _collect_block_labels(entry)
            page_counter += 1
            text = _extract_page_text(entry, md_text)
            page_entry = {"page_num": page_counter, "text": (text or "").strip()}
            if isinstance(md_text, str) and md_text.strip():
                page_entry["markdown"] = md_text.strip()
            pages.append(page_entry)

        def _run_api_for_images(
            image_list: Optional[List[Any]] = None,
            overall_total: Optional[int] = None,
            page_offset: int = 0,
        ) -> None:
            images_to_process = image_list if image_list is not None else api_images
            total = max(1, len(images_to_process))
            for idx, image in enumerate(images_to_process, start=1):
                if progress_cb and progress_span > 0:
                    if overall_total:
                        current_idx = page_offset + idx
                        percent = progress_base + int(max(0, current_idx - 1) / overall_total * progress_span)
                        progress_cb(percent, "ocr", f"Paddle OCR-VL API page {current_idx}/{overall_total}")
                    else:
                        percent = progress_base + int((idx - 1) / total * progress_span)
                        progress_cb(percent, "ocr", f"Paddle OCR-VL API page {idx}/{total}")
                file_bytes = _image_to_bytes(image)
                data = _request_api(file_bytes, 1, f"page {idx}/{total}")
                layout_results = _extract_layout_results(data)
                if not layout_results:
                    _append_page({})
                else:
                    for entry in layout_results:
                        _append_page(entry)
                if progress_cb and progress_span > 0:
                    if overall_total:
                        current_idx = page_offset + idx
                        percent = progress_base + int(current_idx / overall_total * progress_span)
                        progress_cb(percent, "ocr", f"Paddle OCR-VL API page {current_idx}/{overall_total}")
                    else:
                        percent = progress_base + int(idx / total * progress_span)
                        progress_cb(percent, "ocr", f"Paddle OCR-VL API page {idx}/{total}")

        if isinstance(source_path, str) and os.path.isfile(source_path):
            file_type = 0 if source_path.lower().endswith(".pdf") else 1
            chunked = False
            needs_chunking = file_type == 0 and (
                api_max_chunk_bytes > 0
                or (source_page_count and source_page_count > api_max_pages)
            )
            if needs_chunking and source_reader is not None:
                total_pages = source_page_count or len(source_reader.pages)
                start = 0
                processed_any = False

                def _process_pdf_chunk(page_start: int, page_list: Sequence[Any]) -> None:
                    if not page_list:
                        return
                    chunk_len = len(page_list)
                    label = f"{os.path.basename(source_path)} p{page_start + 1}-{page_start + chunk_len}"
                    try:
                        file_bytes = _build_pdf_bytes(page_list)
                    except Exception as exc:
                        LOGGER.warning("Failed to build PDF chunk: %s", exc)
                        if api_images:
                            image_slice = api_images[page_start : page_start + chunk_len]
                            _run_api_for_images(image_slice, total_pages, page_start)
                        return
                    try:
                        data = _request_api(file_bytes, file_type, label)
                    except Exception as exc:
                        if _is_http_500_error(exc) and chunk_len > 1:
                            mid = chunk_len // 2
                            LOGGER.warning(
                                "PaddleOCR-VL API 500 for pages %d-%d; splitting and retrying.",
                                page_start + 1,
                                page_start + chunk_len,
                            )
                            _process_pdf_chunk(page_start, page_list[:mid])
                            _process_pdf_chunk(page_start + mid, page_list[mid:])
                            return
                        if _is_http_500_error(exc) and api_images:
                            LOGGER.warning(
                                "PaddleOCR-VL API 500 for pages %d-%d; retrying per-page images.",
                                page_start + 1,
                                page_start + chunk_len,
                            )
                            image_slice = api_images[page_start : page_start + chunk_len]
                            _run_api_for_images(image_slice, total_pages, page_start)
                            return
                        raise
                    layout_results = _extract_layout_results(data)
                    if not layout_results and api_images:
                        LOGGER.warning(
                            "PaddleOCR-VL API returned no layout results for pages %d-%d; retrying per-page images.",
                            page_start + 1,
                            page_start + chunk_len,
                        )
                        image_slice = api_images[page_start : page_start + chunk_len]
                        _run_api_for_images(image_slice, total_pages, page_start)
                    else:
                        for entry in layout_results:
                            _append_page(entry)
                            if progress_cb and progress_span > 0:
                                percent = progress_base + int(page_counter / total_pages * progress_span)
                                progress_cb(percent, "ocr", f"Paddle OCR-VL API page {page_counter}/{total_pages}")
                        if not layout_results:
                            for _ in range(max(1, chunk_len)):
                                _append_page({})

                while start < total_pages:
                    chunk_pages: List[Any] = []
                    chunk_bytes = b""
                    page_idx = start
                    while page_idx < total_pages and len(chunk_pages) < api_max_pages:
                        chunk_pages.append(source_reader.pages[page_idx])
                        page_idx += 1
                        if api_max_chunk_bytes > 0:
                            try:
                                chunk_bytes = _build_pdf_bytes(chunk_pages)
                            except Exception as exc:
                                LOGGER.warning("Failed to build PDF chunk: %s", exc)
                                chunk_pages.pop()
                                break
                            if _estimate_payload_bytes(chunk_bytes) > api_max_chunk_bytes:
                                if len(chunk_pages) == 1:
                                    LOGGER.warning(
                                        "Single-page PDF chunk exceeds payload cap (%d bytes).",
                                        api_max_chunk_bytes,
                                    )
                                else:
                                    chunk_pages.pop()
                                    try:
                                        chunk_bytes = _build_pdf_bytes(chunk_pages)
                                    except Exception as exc:
                                        LOGGER.warning("Failed to build PDF chunk: %s", exc)
                                        chunk_pages = []
                                break
                    if not chunk_pages:
                        break
                    if api_max_chunk_bytes <= 0:
                        try:
                            chunk_bytes = _build_pdf_bytes(chunk_pages)
                        except Exception as exc:
                            LOGGER.warning("Failed to build PDF chunk: %s", exc)
                            break
                    chunk_len = len(chunk_pages)
                    _process_pdf_chunk(start, chunk_pages)
                    processed_any = True
                    start += chunk_len
                if start < total_pages and api_images:
                    LOGGER.warning(
                        "PaddleOCR-VL API chunking incomplete; retrying remaining pages per-image.",
                    )
                    image_slice = api_images[start:total_pages]
                    _run_api_for_images(image_slice, total_pages, start)
                    processed_any = True
                    start = total_pages
                chunked = processed_any and start >= total_pages
            if not chunked:
                if needs_chunking and file_type == 0 and api_images:
                    LOGGER.warning(
                        "PaddleOCR-VL API chunking unavailable; using per-page images instead.",
                    )
                    _run_api_for_images(api_images, source_page_count or len(api_images))
                else:
                    with open(source_path, "rb") as handle:
                        file_bytes = handle.read()
                    data = _request_api(file_bytes, file_type, os.path.basename(source_path))
                    layout_results = _extract_layout_results(data)
                    if not layout_results and file_type == 0 and api_images:
                        LOGGER.warning("PaddleOCR-VL API returned no layout results for PDF; retrying per-page images.")
                        _run_api_for_images(api_images, source_page_count)
                    else:
                        total_pages = len(layout_results) or max(1, len(api_images))
                        for entry in layout_results:
                            _append_page(entry)
                            if progress_cb and progress_span > 0:
                                percent = progress_base + int(page_counter / total_pages * progress_span)
                                progress_cb(percent, "ocr", f"Paddle OCR-VL API page {page_counter}/{total_pages}")
                        if not layout_results:
                            for _ in range(max(1, len(api_images))):
                                _append_page({})
        else:
            _run_api_for_images()

        layout_markdown = "\n\n".join(markdown_items) if markdown_items else None
        if isinstance(layout_markdown, str) and layout_markdown.strip():
            layout_markdown = _normalize_inline_math_for_obsidian(
                layout_markdown,
                add_footnote_defs=True,
            )
        for page in pages:
            md_value = page.get("markdown")
            if isinstance(md_value, str) and md_value.strip():
                page["markdown"] = _normalize_inline_math_for_obsidian(md_value)
        text_chars = ocr_pages_text_chars(pages)
        if text_chars == 0 and isinstance(layout_markdown, str) and layout_markdown.strip():
            fallback_text = _strip_markup(layout_markdown)
            if fallback_text:
                if pages:
                    pages[0]["text"] = fallback_text
                else:
                    pages = [{"page_num": 1, "text": fallback_text}]
                text_chars = ocr_pages_text_chars(pages)
        LOGGER.info(
            "PaddleOCR-VL API OCR complete: pages=%d, text_chars=%d",
            len(pages),
            text_chars,
        )
        stats: Dict[str, Any] = {
            "layout_used": True,
            "layout_model": "PaddleOCR-VL API",
        }
        if isinstance(layout_markdown, str) and layout_markdown.strip():
            stats["layout_markdown"] = layout_markdown
        if markdown_images:
            stats["layout_markdown_images"] = markdown_images
        if markdown_image_labels:
            stats["layout_markdown_image_labels"] = markdown_image_labels
        return pages, stats

    try:
        import numpy as np
        from paddleocr import PaddleOCRVL
    except Exception as exc:
        raise RuntimeError(f"PaddleOCR-VL dependencies missing (install paddleocr[doc-parser]): {exc}") from exc

    pipeline_kwargs: Dict[str, Any] = {}
    if getattr(config, "paddle_use_doc_orientation_classify", None) is not None:
        pipeline_kwargs["use_doc_orientation_classify"] = bool(config.paddle_use_doc_orientation_classify)
    if getattr(config, "paddle_use_doc_unwarping", None) is not None:
        pipeline_kwargs["use_doc_unwarping"] = bool(config.paddle_use_doc_unwarping)
    use_layout_detection = getattr(config, "paddle_vl_use_layout_detection", None)
    if use_layout_detection is not None:
        pipeline_kwargs["use_layout_detection"] = bool(use_layout_detection)
    if getattr(config, "paddle_vl_use_chart_recognition", None) is not None:
        pipeline_kwargs["use_chart_recognition"] = bool(config.paddle_vl_use_chart_recognition)
    if getattr(config, "paddle_vl_format_block_content", None) is not None:
        pipeline_kwargs["format_block_content"] = bool(config.paddle_vl_format_block_content)
    if getattr(config, "paddle_vl_device", None):
        pipeline_kwargs["device"] = str(config.paddle_vl_device)
    if getattr(config, "paddle_vl_rec_backend", None):
        pipeline_kwargs["vl_rec_backend"] = str(config.paddle_vl_rec_backend)
    if getattr(config, "paddle_vl_rec_server_url", None):
        pipeline_kwargs["vl_rec_server_url"] = str(config.paddle_vl_rec_server_url)
    if getattr(config, "paddle_vl_rec_max_concurrency", None) is not None:
        pipeline_kwargs["vl_rec_max_concurrency"] = int(config.paddle_vl_rec_max_concurrency)
    if getattr(config, "paddle_vl_rec_api_key", None):
        pipeline_kwargs["vl_rec_api_key"] = str(config.paddle_vl_rec_api_key)

    predict_kwargs: Dict[str, Any] = {}
    if getattr(config, "paddle_use_doc_orientation_classify", None) is not None:
        predict_kwargs["use_doc_orientation_classify"] = bool(config.paddle_use_doc_orientation_classify)
    if getattr(config, "paddle_use_doc_unwarping", None) is not None:
        predict_kwargs["use_doc_unwarping"] = bool(config.paddle_use_doc_unwarping)
    if use_layout_detection is not None:
        predict_kwargs["use_layout_detection"] = bool(use_layout_detection)
    if getattr(config, "paddle_vl_use_chart_recognition", None) is not None:
        predict_kwargs["use_chart_recognition"] = bool(config.paddle_vl_use_chart_recognition)
    if getattr(config, "paddle_vl_format_block_content", None) is not None:
        predict_kwargs["format_block_content"] = bool(config.paddle_vl_format_block_content)
    layout_threshold = getattr(config, "paddle_vl_layout_threshold", None)
    if layout_threshold is None:
        layout_threshold = getattr(config, "paddle_layout_threshold", None)
    if layout_threshold is not None:
        predict_kwargs["layout_threshold"] = layout_threshold
    layout_nms = getattr(config, "paddle_vl_layout_nms", None)
    if layout_nms is None:
        layout_nms = getattr(config, "paddle_layout_nms", None)
    if layout_nms is not None:
        predict_kwargs["layout_nms"] = bool(layout_nms)
    layout_unclip = getattr(config, "paddle_vl_layout_unclip", None)
    if layout_unclip is None:
        layout_unclip = getattr(config, "paddle_layout_unclip", None)
    if layout_unclip is not None:
        predict_kwargs["layout_unclip_ratio"] = layout_unclip
    layout_merge = getattr(config, "paddle_vl_layout_merge", None)
    if layout_merge is None:
        layout_merge = getattr(config, "paddle_layout_merge", None)
    if layout_merge:
        predict_kwargs["layout_merge_bboxes_mode"] = layout_merge
    if getattr(config, "paddle_vl_prompt_label", None) and use_layout_detection is False:
        predict_kwargs["prompt_label"] = str(config.paddle_vl_prompt_label)
    if getattr(config, "paddle_vl_use_queues", None) is not None:
        predict_kwargs["use_queues"] = bool(config.paddle_vl_use_queues)

    pipeline = PaddleOCRVL(**pipeline_kwargs)

    def _as_dict(obj: Any) -> Optional[Dict[str, Any]]:
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
        return None

    def _result_to_dict(res: Any) -> Optional[Dict[str, Any]]:
        direct = _as_dict(res)
        if direct is not None:
            return direct
        for attr in ("json", "res", "result"):
            val = getattr(res, attr, None)
            val_dict = _as_dict(val)
            if val_dict is not None:
                return val_dict
        return None

    def _extract_markdown_text(md_info: Any, md_dict: Optional[Dict[str, Any]]) -> Optional[str]:
        if isinstance(md_dict, dict):
            for key in ("markdown", "markdown_text", "text", "content"):
                val = md_dict.get(key)
                if isinstance(val, str) and val.strip():
                    return val.strip()
        if isinstance(md_info, str) and md_info.strip():
            return md_info.strip()
        if md_info is not None:
            for attr in ("markdown", "markdown_text", "text", "content"):
                val = getattr(md_info, attr, None)
                if isinstance(val, str) and val.strip():
                    return val.strip()
        return None

    def _extract_markdown(
        res: Any,
        res_dict: Optional[Dict[str, Any]] = None,
    ) -> Tuple[Optional[str], Optional[Any], Optional[Dict[str, Any]]]:
        md_info = getattr(res, "markdown", None)
        if md_info is None and isinstance(res_dict, dict):
            md_info = res_dict.get("markdown") or res_dict.get("layout_markdown")
        md_dict = _as_dict(md_info)
        md_text = _extract_markdown_text(md_info, md_dict)
        if not md_text and isinstance(res_dict, dict):
            for key in ("markdown", "layout_markdown", "markdown_text", "text"):
                val = res_dict.get(key)
                if isinstance(val, str) and val.strip():
                    md_text = val.strip()
                    break
        return md_text, md_info, md_dict

    def _extract_markdown_images(
        md_info: Any,
        md_dict: Optional[Dict[str, Any]],
        res_dict: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        images: Dict[str, Any] = {}
        for source in (md_dict, res_dict):
            if not isinstance(source, dict):
                continue
            candidate = source.get("markdown_images") or source.get("images")
            if isinstance(candidate, dict):
                images.update(candidate)
        if md_info is not None:
            for attr in ("markdown_images", "images"):
                candidate = getattr(md_info, attr, None)
                if isinstance(candidate, dict):
                    images.update(candidate)
        return images

    def _extract_block_text(res: Any, res_dict: Optional[Dict[str, Any]] = None) -> str:
        candidates: List[Any] = []
        if isinstance(res_dict, dict):
            candidates.append(res_dict)
            if "res" in res_dict:
                candidates.append(res_dict.get("res"))
        inner_res = getattr(res, "res", None)
        if inner_res is not None:
            candidates.append(inner_res)
        candidates.append(res)
        for candidate in candidates:
            if candidate is None:
                continue
            if isinstance(candidate, dict):
                blocks = candidate.get("parsing_res_list") or candidate.get("layout_parsing_res")
            else:
                blocks = getattr(candidate, "parsing_res_list", None) or getattr(candidate, "layout_parsing_res", None)
            if not isinstance(blocks, list) or not blocks:
                continue
            lines: List[str] = []
            for block in blocks:
                if isinstance(block, dict):
                    text_val = block.get("block_content") or block.get("content") or block.get("text")
                else:
                    text_val = getattr(block, "block_content", None)
                    if text_val is None:
                        text_val = getattr(block, "content", None)
                    if text_val is None:
                        text_val = getattr(block, "text", None)
                if isinstance(text_val, str) and text_val.strip():
                    lines.append(text_val.strip())
            if lines:
                return "\n".join(lines).strip()
        return ""

    def _strip_markup(text: str) -> str:
        text = re.sub(r"<[^>]+>", " ", text)
        text = re.sub(r"!\[[^\]]*]\([^)]+\)", " ", text)
        text = re.sub(r"\s+", " ", text)
        return text.strip()

    pages: List[Dict[str, Any]] = []
    markdown_items: List[Any] = []
    markdown_images: Dict[str, Any] = {}
    total = max(1, len(images))
    if progress_cb and progress_span > 0:
        progress_cb(progress_base, "ocr", "Paddle OCR-VL initializing")

    for idx, image in enumerate(images, start=1):
        if progress_cb and progress_span > 0:
            percent = progress_base + int((idx - 1) / total * progress_span)
            progress_cb(percent, "ocr", f"Paddle OCR-VL page {idx}/{total}")
        try:
            img = image.convert("RGB") if hasattr(image, "convert") else image
        except Exception:
            img = image
        img_arr = np.array(img)
        results = pipeline.predict(img_arr, **predict_kwargs)
        if not results:
            pages.append({"page_num": idx, "text": ""})
            continue
        res = results[0]
        res_dict = _result_to_dict(res)
        md_text, md_info, md_dict = _extract_markdown(res, res_dict)
        md_images = _extract_markdown_images(md_info, md_dict, res_dict)
        if md_info is not None:
            if isinstance(md_info, str) and md_info.strip():
                markdown_items.append({"markdown": md_info.strip()})
            else:
                markdown_items.append(md_dict if md_dict is not None else md_info)
        elif md_text:
            markdown_items.append({"markdown": md_text})
        if md_images:
            markdown_images.update(md_images)
        text = _extract_block_text(res, res_dict)
        if not text and md_text:
            text = _strip_markup(md_text)
        pages.append({"page_num": idx, "text": (text or "").strip()})
        if progress_cb and progress_span > 0:
            percent = progress_base + int(idx / total * progress_span)
            progress_cb(percent, "ocr", f"Paddle OCR-VL page {idx}/{total}")

    layout_markdown = None
    if markdown_items:
        concat = getattr(pipeline, "concatenate_markdown_pages", None)
        if callable(concat):
            try:
                layout_markdown = concat(markdown_items)
            except Exception:
                layout_markdown = None
        if layout_markdown is None:
            page_texts: List[str] = []
            for md in markdown_items:
                text_val = _extract_markdown_text(md, _as_dict(md))
                if isinstance(text_val, str) and text_val.strip():
                    page_texts.append(text_val.strip())
            if page_texts:
                layout_markdown = "\n\n".join(page_texts)

    text_chars = ocr_pages_text_chars(pages)
    if text_chars == 0 and isinstance(layout_markdown, str) and layout_markdown.strip():
        fallback_text = _strip_markup(layout_markdown)
        if fallback_text:
            if pages:
                pages[0]["text"] = fallback_text
            else:
                pages = [{"page_num": 1, "text": fallback_text}]
            text_chars = ocr_pages_text_chars(pages)
    LOGGER.info(
        "PaddleOCR-VL OCR complete: pages=%d, text_chars=%d",
        len(pages),
        text_chars,
    )
    stats: Dict[str, Any] = {
        "layout_used": True,
        "layout_model": "PaddleOCR-VL",
    }
    if isinstance(layout_markdown, str) and layout_markdown.strip():
        stats["layout_markdown"] = layout_markdown
    if markdown_images:
        stats["layout_markdown_images"] = markdown_images
    return pages, stats


def ocr_pages_with_paddle(
    images: Sequence[Any],
    languages: str,
    config: Any,
    helpers: Dict[str, Any],
    progress_cb: Optional[Any] = None,
    progress_base: int = 0,
    progress_span: int = 0,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    global LOGGER
    LOGGER = helpers.get("logger", LOGGER)
    ocr_pages_text_chars = helpers["ocr_pages_text_chars"]
    detect_repeated_line_clusters = helpers["detect_repeated_line_clusters"]
    normalize_boilerplate_line = helpers["normalize_boilerplate_line"]
    matches_repeated_cluster = helpers["matches_repeated_cluster"]
    is_boilerplate_line = helpers["is_boilerplate_line"]
    edge_ids_by_y = helpers["edge_ids_by_y"]
    select_edge_texts_by_y = helpers["select_edge_texts_by_y"]
    order_blocks_into_columns = helpers["order_blocks_into_columns"]

    from paddleocr import PaddleOCR

    try:
        import numpy as np
    except Exception as exc:
        raise RuntimeError(f"numpy is required for PaddleOCR: {exc}") from exc

    # PaddleOCR orientation classification uses use_textline_orientation
    ocr_kwargs: Dict[str, Any] = {"lang": languages}
    if config.paddle_target_max_side_px > 0:
        ocr_kwargs["text_det_limit_side_len"] = config.paddle_target_max_side_px
        ocr_kwargs["text_det_limit_type"] = "max"
    if config.paddle_use_doc_orientation_classify:
        ocr_kwargs["use_doc_orientation_classify"] = True
    if config.paddle_use_doc_unwarping:
        ocr_kwargs["use_doc_unwarping"] = True

    # Robust PaddleOCR construction to handle API differences across versions
    def _create_ocr_direct(kwargs: Dict[str, Any]) -> PaddleOCR:
        return PaddleOCR(**kwargs)

    def _try_create_direct(kwargs: Dict[str, Any]) -> Optional[PaddleOCR]:
        try:
            return _create_ocr_direct(kwargs)
        except TypeError:
            return None
        except Exception:
            return None

    reduced_kwargs = dict(ocr_kwargs)
    reduced_kwargs.pop("use_doc_orientation_classify", None)
    reduced_kwargs.pop("use_doc_unwarping", None)

    ctor_candidates: List[Dict[str, Any]] = []
    use_tlo = bool(getattr(config, "paddle_use_textline_orientation", False))
    # Prefer explicit textline orientation when supported
    ctor_candidates.append({**ocr_kwargs, "use_textline_orientation": use_tlo})
    ctor_candidates.append({**reduced_kwargs, "use_textline_orientation": use_tlo})
    # Without textline flag
    ctor_candidates.append({**ocr_kwargs})
    ctor_candidates.append({**reduced_kwargs})
    # Legacy angle classifier flag
    ctor_candidates.append({**ocr_kwargs, "use_angle_cls": use_tlo})
    ctor_candidates.append({**reduced_kwargs, "use_angle_cls": use_tlo})

    ocr: Optional[PaddleOCR] = None
    for kw in ctor_candidates:
        ocr = _try_create_direct(kw)
        if ocr is not None:
            break
    if ocr is None:
        # Final hard attempt to surface a meaningful error
        ocr = _create_ocr_direct(ocr_kwargs)
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
    # Emit an immediate progress update so the UI replaces the initial 'initializing' label
    if progress_cb and progress_span > 0:
        progress_cb(progress_base, "ocr", f"Paddle OCR page 1/{total} (running)")
    total_pages = len(images)
    boilerplate_enabled = bool(
        config.enable_boilerplate_removal and helpers.get("boilerplate_prepass_enabled", True)
    )
    repeat_threshold = 0
    repeated_clusters: List[Any] = []
    page_edge_candidates: List[List[str]] = []
    source_path = helpers.get("ocr_source_path")
    doc_label = os.path.basename(source_path) if isinstance(source_path, str) and source_path else ""
    doc_suffix = f" ({doc_label})" if doc_label else ""

    for idx, image in enumerate(images, start=1):
        if boilerplate_enabled:
            LOGGER.info("Paddle OCR prepass %d/%d%s: start", idx, total_pages, doc_suffix)
        t_start = time.perf_counter()
        edge_lines: List[Tuple[str, float]] = []
        result = None
        image_arr = _image_to_array(image)
        # Try inference with multiple APIs for compatibility
        def _run_ocr_inference(img_arr: Any) -> Any:
            res = None
            # Try modern API first
            if hasattr(ocr, "predict"):
                try:
                    res = ocr.predict(img_arr)  # type: ignore[attr-defined]
                except TypeError:
                    res = None
                except Exception:
                    res = None
            # Legacy API without cls
            if res is None and hasattr(ocr, "ocr"):
                try:
                    res = ocr.ocr(img_arr)  # type: ignore[attr-defined]
                except TypeError:
                    res = None
                except Exception:
                    res = None
            # Legacy API with cls flag
            if res is None and hasattr(ocr, "ocr"):
                try:
                    res = ocr.ocr(img_arr, cls=use_tlo)  # type: ignore[attr-defined]
                except Exception:
                    res = None
            return res

        try:
            result = _run_ocr_inference(image_arr)
        except Exception as exc:
            LOGGER.debug("PaddleOCR inference failed: %s", exc)
            result = None

        if result is not None:
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
        if boilerplate_enabled and edge_lines:
            page_edge_candidates.append(
                select_edge_texts_by_y(edge_lines, config.boilerplate_edge_lines)
            )
        if boilerplate_enabled:
            elapsed = time.perf_counter() - t_start
            LOGGER.info(
                "Paddle OCR prepass %d/%d%s: done in %.2fs (edge_lines=%d)",
                idx,
                total_pages,
                doc_suffix,
                elapsed,
                len(edge_lines),
            )

    if boilerplate_enabled and total_pages >= config.boilerplate_min_pages:
        repeated_clusters, repeat_threshold = detect_repeated_line_clusters(
            page_edge_candidates,
            total_pages,
            config,
        )
    removed_total = 0

    for idx, image in enumerate(images, start=1):
        if progress_cb and progress_span > 0:
            percent = progress_base + int((idx - 1) / total * progress_span)
            progress_cb(percent, "ocr", f"Paddle OCR page {idx}/{total} (running)")
        LOGGER.info("Paddle OCR page %d/%d: start", idx, total)
        t_start = time.perf_counter()
        # Prefer new API: predict(); fall back to ocr() with/without cls
        image_arr = _image_to_array(image)
        # Prefer new API, but fall back as needed
        try:
            result = _run_ocr_inference(image_arr)
        except Exception:
            result = None
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
        if boilerplate_enabled and blocks:
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
            ordered_text = "\n".join(fallback_lines)
        pages.append({"page_num": idx, "text": ordered_text})
        elapsed = time.perf_counter() - t_start
        LOGGER.info(
            "Paddle OCR page %d/%d: done in %.2fs (text_chars=%d, blocks=%d)",
            idx,
            total,
            elapsed,
            len(ordered_text),
            len(blocks),
        )
        if progress_cb and progress_span > 0:
            percent = progress_base + int(idx / total * progress_span)
            progress_cb(percent, "ocr", f"Paddle OCR page {idx}/{total}")

    if removed_total and boilerplate_enabled:
        LOGGER.info(
            "Boilerplate removal (OCR lines): removed %s lines (repeat_threshold=%s, repeated_lines=%s)",
            removed_total,
            repeat_threshold,
            len(repeated_clusters),
        )

    avg_conf = sum(confidences) / len(confidences) if confidences else None
    LOGGER.info(
        "Paddle OCR complete: pages=%d, text_chars=%d",
        len(pages),
        ocr_pages_text_chars(pages),
    )
    return pages, {"ocr_confidence_avg": avg_conf}
