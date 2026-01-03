#!/usr/bin/env python3
from __future__ import annotations

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
    repeat_threshold = 0
    repeated_clusters: List[Any] = []
    page_edge_candidates: List[List[str]] = []

    for idx, image in enumerate(images, start=1):
        if config.enable_boilerplate_removal:
            LOGGER.info("Paddle OCR prepass %d/%d: start", idx, total_pages)
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
        if config.enable_boilerplate_removal and edge_lines:
            page_edge_candidates.append(
                select_edge_texts_by_y(edge_lines, config.boilerplate_edge_lines)
            )
        if config.enable_boilerplate_removal:
            elapsed = time.perf_counter() - t_start
            LOGGER.info(
                "Paddle OCR prepass %d/%d: done in %.2fs (edge_lines=%d)",
                idx,
                total_pages,
                elapsed,
                len(edge_lines),
            )

    if config.enable_boilerplate_removal and total_pages >= config.boilerplate_min_pages:
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

    if removed_total and config.enable_boilerplate_removal:
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
