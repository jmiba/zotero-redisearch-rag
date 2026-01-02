#!/usr/bin/env python3
from __future__ import annotations

import logging
import re
import time
import warnings
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
        from paddlex import create_model
    except Exception as exc:
        raise RuntimeError(f"PaddleX create_model not available: {exc}") from exc

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
    layout_device = getattr(config, "paddle_layout_device", None)
    layout_nms = bool(getattr(config, "paddle_layout_nms", True))
    layout_keep_labels = str(getattr(
        config,
        "paddle_layout_keep_labels",
        "text,paragraph_title,title,heading,caption,header,number,figure_title,body,section,text_block,textbox,textline,paragraph",
    ))
    layout_recognize_boxes = bool(getattr(config, "paddle_layout_recognize_boxes", True))
    fail_on_zero_layout = bool(getattr(config, "paddle_layout_fail_on_zero", False))
    max_side_px = int(getattr(config, "paddle_target_max_side_px", 0) or 0)

    cm_kwargs: Dict[str, Any] = {"model_name": layout_model}
    if layout_device:
        cm_kwargs["device"] = layout_device
    model = None
    if layout_img_size:
        try:
            model = create_model(**{**cm_kwargs, "img_size": layout_img_size})
        except Exception:
            model = None
    if model is None:
        model = create_model(**cm_kwargs)

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
    use_tlo = bool(getattr(config, "paddle_use_textline_orientation", False))
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
    if ocr is None:
        ocr = _create_ocr_direct(ocr_kwargs)

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
        return None

    def _iter_ocr_entries(res: Any) -> List[Tuple[Any, str]]:
        out: List[Tuple[Any, str]] = []
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

    def _extract_texts(res: Any) -> List[str]:
        if isinstance(res, dict):
            texts = res.get("rec_texts") or res.get("texts") or res.get("rec_text")
            if isinstance(texts, list):
                return [str(tv or "").strip() for tv in texts if str(tv or "").strip()]
            return []
        if isinstance(res, list):
            entries = res
            if len(res) == 1:
                maybe_dict = _paddle_obj_to_dict(res[0])
                if maybe_dict is not None:
                    return _extract_texts(maybe_dict)
                if isinstance(res[0], (list, tuple, dict)):
                    entries = res[0]
            if isinstance(entries, dict):
                return _extract_texts(entries)
            if isinstance(entries, list) and entries and isinstance(entries[0], dict):
                combined: List[str] = []
                for entry in entries:
                    if isinstance(entry, dict):
                        combined.extend(_extract_texts(entry))
                    else:
                        maybe_dict = _paddle_obj_to_dict(entry)
                        if maybe_dict is not None:
                            combined.extend(_extract_texts(maybe_dict))
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
        maybe = _paddle_obj_to_dict(res)
        if isinstance(maybe, dict):
            return _extract_texts(maybe)
        return []

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
        for _, variant_img in _iter_crop_variants(crop_img):
            crop_arr = np.array(variant_img)
            result = _ocr_predict(
                crop_arr,
                det=False,
                rec=True,
                cls=bool(getattr(config, "paddle_use_textline_orientation", False)),
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
                result = _ocr_legacy(crop_arr, cls=bool(getattr(config, "paddle_use_textline_orientation", False)))
                result = _keep_if_text(result)
            if result:
                return result
        return None

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

    def _rect_from_box(b: Any) -> Optional[Tuple[float, float, float, float]]:
        try:
            for names in (("x0", "y0", "x1", "y1"), ("xmin", "ymin", "xmax", "ymax"), ("left", "top", "right", "bottom")):
                if all(hasattr(b, n) for n in names):
                    x0 = float(getattr(b, names[0])); y0 = float(getattr(b, names[1]))
                    x1 = float(getattr(b, names[2])); y1 = float(getattr(b, names[3]))
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
                    if hasattr(coord, "tolist"):
                        coord = coord.tolist()
                except Exception:
                    pass
                if isinstance(coord, dict):
                    try:
                        x0 = float(coord.get("x0", coord.get("left", 0.0)))
                        y0 = float(coord.get("y0", coord.get("top", 0.0)))
                        x1 = float(coord.get("x1", coord.get("right", 0.0)))
                        y1 = float(coord.get("y1", coord.get("bottom", 0.0)))
                        return (x0, y0, x1, y1)
                    except Exception:
                        pass
                if isinstance(coord, (list, tuple)):
                    flat = coord
                    if flat and isinstance(flat[0], (list, tuple)):
                        xs = [float(p[0]) for p in flat if len(p) >= 2]
                        ys = [float(p[1]) for p in flat if len(p) >= 2]
                        if xs and ys:
                            return (min(xs), min(ys), max(xs), max(ys))
                    if len(flat) >= 8 and all(isinstance(v, (int, float)) for v in flat):
                        xs = [float(v) for v in flat[0::2]]
                        ys = [float(v) for v in flat[1::2]]
                        return (min(xs), min(ys), max(xs), max(ys)) if xs and ys else None
                    if len(flat) >= 4 and all(isinstance(v, (int, float)) for v in flat[:4]):
                        return (float(flat[0]), float(flat[1]), float(flat[2]), float(flat[3]))
            for key in ("bbox", "box", "points"):
                if key in b:
                    return _rect_from_box(b[key])
            try:
                x0 = float(b.get("x0", b.get("left", 0.0)))
                y0 = float(b.get("y0", b.get("top", 0.0)))
                x1 = float(b.get("x1", b.get("right", 0.0)))
                y1 = float(b.get("y1", b.get("bottom", 0.0)))
                if x1 > x0 and y1 > y0:
                    return (x0, y0, x1, y1)
            except Exception:
                pass
        if isinstance(b, (list, tuple)):
            if len(b) >= 4 and all(isinstance(v, (int, float)) for v in b[:4]):
                return (float(b[0]), float(b[1]), float(b[2]), float(b[3]))
        return None

    def _order_blocks_into_columns(blocks: List[Dict[str, Any]], page_width: float) -> List[List[Dict[str, Any]]]:
        if not blocks:
            return []

        def _center_y(block: Dict[str, Any]) -> float:
            try:
                return 0.5 * (float(block.get("y0", 0.0)) + float(block.get("y1", 0.0)))
            except Exception:
                return 0.0

        def _is_full_width(block: Dict[str, Any]) -> bool:
            page_width_safe = max(1.0, float(page_width or 1))
            try:
                width = float(block.get("x1", 0.0)) - float(block.get("x0", 0.0))
            except Exception:
                width = 0.0
            if width <= 0.0:
                return False
            ratio = width / page_width_safe
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

    def _run_full_page_ocr(image_obj: Any) -> str:
        result = None
        try:
            img_arr = np.array(image_obj)
            result = _ocr_predict(img_arr)
            if result is None:
                result = _ocr_legacy(img_arr)
            if result is None:
                result = _ocr_legacy(img_arr, cls=bool(getattr(config, "paddle_use_textline_orientation", False)))
        except Exception:
            result = None
        if not result:
            return ""
        blocks: List[Dict[str, Any]] = []
        fallback_lines: List[str] = _extract_texts(result)
        for quad, text_val in _iter_ocr_entries(result):
            if not text_val:
                continue
            if quad is None:
                if text_val not in fallback_lines:
                    fallback_lines.append(text_val)
                continue
            bb = _bbox_from_quad(quad)
            if not bb:
                if text_val not in fallback_lines:
                    fallback_lines.append(text_val)
                continue
            x0, y0, x1, y1, xc = bb
            blocks.append({"x0": x0, "y0": y0, "x1": x1, "y1": y1, "xc": xc, "text": text_val, "label": "text"})
        if blocks:
            page_w = float(getattr(image_obj, "width", 1.0) or 1.0)
            columns = _order_blocks_into_columns(blocks, page_w)
            return _columns_to_text(columns)
        return "\n".join(fallback_lines)

    allowed_text_labels = {lbl.strip().lower() for lbl in layout_keep_labels.split(",") if lbl.strip()}
    pages: List[Dict[str, Any]] = []
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
        predict_kwargs: Dict[str, Any] = {}
        if layout_threshold is not None:
            predict_kwargs["threshold"] = float(layout_threshold)
        predict_kwargs["layout_nms"] = bool(layout_nms)
        if layout_unclip is not None:
            predict_kwargs["layout_unclip_ratio"] = float(layout_unclip)
        if layout_merge is not None:
            predict_kwargs["layout_merge_bboxes_mode"] = layout_merge
        predict_kwargs.setdefault("batch_size", 1)
        output = model.predict(np.array(page_img), **predict_kwargs)
        output_list: List[Any]
        if isinstance(output, (list, tuple)):
            output_list = list(output)
        elif isinstance(output, dict) or isinstance(output, (str, bytes)):
            output_list = [output]
        else:
            try:
                output_list = list(output)  # handle generator outputs from PaddleX
            except Exception:
                output_list = [output]
        boxes: List[Any] = []
        try:
            first = output_list[0] if output_list else output
            maybe = _paddle_obj_to_dict(first)
            if isinstance(maybe, dict):
                boxes = list(
                    maybe.get("boxes")
                    or maybe.get("layout")
                    or maybe.get("result")
                    or maybe.get("dt_polys")
                    or maybe.get("predictions")
                    or []
                )
            elif isinstance(first, dict):
                boxes = list(first.get("boxes") or first.get("layout") or first.get("result") or [])
        except Exception:
            boxes = []
        layout_has_boxes = bool(boxes)
        if not layout_has_boxes and fail_on_zero_layout:
            raise RuntimeError("PaddleX layout detected 0 boxes and fail_on_zero_layout is enabled.")

        blocks: List[Dict[str, Any]] = []
        rects: List[Dict[str, Any]] = []
        if layout_recognize_boxes and boxes:
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
                if label and label not in allowed_text_labels:
                    take = False
                if not take:
                    continue
                r = _rect_from_box(b)
                if r is not None:
                    x0, y0, x1, y1 = r
                    if x1 > x0 and y1 > y0:
                        rects.append({"x0": x0, "y0": y0, "x1": x1, "y1": y1, "label": label or "text"})
            w = float(page_img.width or 1)
            h = float(page_img.height or 1)
            for rect in rects:
                try:
                    x0 = rect.get("x0"); y0 = rect.get("y0")
                    x1 = rect.get("x1"); y1 = rect.get("y1")
                    label = rect.get("label") or "text"
                    if x0 is None or y0 is None or x1 is None or y1 is None:
                        continue
                    ix0 = max(0, int(x0)); iy0 = max(0, int(y0))
                    ix1 = min(int(w), int(x1)); iy1 = min(int(h), int(y1))
                    if ix1 <= ix0 or iy1 <= iy0:
                        continue
                    crop = page_img.crop((ix0, iy0, ix1, iy1))
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

        if boxes:
            suffix = "" if blocks else " (fallback to full-page OCR)"
            LOGGER.info(
                "PaddleX layout page %d: boxes=%d, kept=%d, blocks=%d%s",
                idx,
                len(boxes),
                len(rects),
                len(blocks),
                suffix,
            )
        else:
            LOGGER.info("PaddleX layout page %d: no boxes detected; using full-page OCR", idx)

        if blocks:
            columns = _order_blocks_into_columns(blocks, float(page_img.width or 1))
            page_text = _columns_to_text(columns)
        else:
            page_text = _run_full_page_ocr(page_img)

        pages.append({"page_num": idx, "text": page_text})
        if progress_cb and progress_span > 0:
            percent = progress_base + int(idx / total * progress_span)
            progress_cb(percent, "layout", f"Paddle layout page {idx}/{total}")

    LOGGER.info(
        "PaddleX layout OCR complete: pages=%d, text_chars=%d",
        len(pages),
        ocr_pages_text_chars(pages),
    )
    return pages, {"layout_used": True, "layout_model": layout_model}


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
            LOGGER.warning("PaddleX layout OCR failed; falling back to PP-Structure: %s", exc)
    ocr_pages_text_chars = helpers["ocr_pages_text_chars"]
    detect_repeated_line_clusters = helpers["detect_repeated_line_clusters"]
    normalize_boilerplate_line = helpers["normalize_boilerplate_line"]
    matches_repeated_cluster = helpers["matches_repeated_cluster"]
    is_boilerplate_line = helpers["is_boilerplate_line"]
    edge_ids_by_y = helpers["edge_ids_by_y"]
    order_blocks_into_columns = helpers["order_blocks_into_columns"]

    def _check_ppstructure_deps() -> None:
        missing: List[str] = []
        for module_name in ("cv2", "pyclipper", "shapely", "paddlex"):
            try:
                __import__(module_name)
            except Exception:
                missing.append(module_name)
        if missing:
            raise RuntimeError(
                "PP-Structure dependencies missing: "
                + ", ".join(missing)
                + ". Install them in the plugin venv."
            )

    def _resolve_ppstructure():
        import importlib
        import pkgutil

        candidates = [
            ("paddleocr", "PPStructure"),
            ("paddleocr", "PPStructureV3"),
            ("paddleocr.ppstructure", "PPStructure"),
            ("paddleocr.ppstructure", "PPStructureV3"),
            ("paddleocr.ppstructure.predict_system", "PPStructure"),
            ("paddleocr.ppstructure.predict_system", "StructureSystem"),
            ("paddleocr._pipelines", "PPStructure"),
            ("paddleocr._pipelines", "PPStructureV3"),
            ("paddleocr._pipelines", "StructureSystem"),
        ]
        for module_name, attr_name in candidates:
            try:
                module = importlib.import_module(module_name)
            except Exception:
                continue
            if hasattr(module, attr_name):
                LOGGER.info("PPStructure resolved from %s.%s", module_name, attr_name)
                return getattr(module, attr_name)

        try:
            pipelines = importlib.import_module("paddleocr._pipelines")
        except Exception:
            pipelines = None
        if pipelines and hasattr(pipelines, "__path__"):
            for modinfo in pkgutil.walk_packages(pipelines.__path__, pipelines.__name__ + "."):
                if "structure" not in modinfo.name:
                    continue
                try:
                    module = importlib.import_module(modinfo.name)
                except Exception:
                    continue
                for attr_name in ("PPStructure", "PPStructureV3", "StructureSystem"):
                    if hasattr(module, attr_name):
                        LOGGER.info("PPStructure resolved from %s.%s", modinfo.name, attr_name)
                        return getattr(module, attr_name)
        raise RuntimeError(
            "PPStructure not available in paddleocr; install a version that ships PPStructure."
        )

    _check_ppstructure_deps()
    PPStructure = _resolve_ppstructure()
    structure_name = getattr(PPStructure, "__name__", "")
    structure_module = getattr(PPStructure, "__module__", "")
    use_v3 = "v3" in structure_name.lower() or "pp_structurev3" in structure_module.lower()

    try:
        import numpy as np
    except Exception as exc:
        raise RuntimeError(f"numpy is required for PPStructure: {exc}") from exc

    if use_v3:
        structure_kwargs: Dict[str, Any] = {"lang": languages}
        if config.paddle_target_max_side_px > 0:
            structure_kwargs["text_det_limit_side_len"] = config.paddle_target_max_side_px
            structure_kwargs["text_det_limit_type"] = "max"
        if config.paddle_use_textline_orientation:
            structure_kwargs["use_textline_orientation"] = True
        if config.paddle_use_doc_orientation_classify:
            structure_kwargs["use_doc_orientation_classify"] = True
        if config.paddle_use_doc_unwarping:
            structure_kwargs["use_doc_unwarping"] = True
    else:
        structure_kwargs = {
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

    def _create_structure(kwargs: Dict[str, Any]) -> Any:
        return PPStructure(**kwargs)

    structure = None
    try:
        structure = _create_structure(structure_kwargs)
    except TypeError:
        reduced_kwargs = dict(structure_kwargs)
        reduced_kwargs.pop("use_textline_orientation", None)
        reduced_kwargs.pop("use_doc_orientation_classify", None)
        reduced_kwargs.pop("use_doc_unwarping", None)
        reduced_kwargs.pop("text_det_limit_side_len", None)
        reduced_kwargs.pop("text_det_limit_type", None)
        try:
            structure = _create_structure(reduced_kwargs)
        except TypeError:
            reduced_kwargs.pop("structure_version", None)
            structure = _create_structure(reduced_kwargs)
        except Exception as exc:
            LOGGER.exception("PP-Structure init failed with reduced kwargs: %s", exc)
            raise
    except Exception as exc:
        LOGGER.exception("PP-Structure init failed: %s", exc)
        raise

    def _run_structure(structure_obj: Any, image_arr: Any) -> Any:
        if callable(structure_obj):
            return structure_obj(image_arr)
        predict = getattr(structure_obj, "predict", None)
        if callable(predict):
            try:
                return predict(image_arr)
            except Exception:
                return predict([image_arr])
        paddlex_pipeline = getattr(structure_obj, "paddlex_pipeline", None)
        pipeline_predict = getattr(paddlex_pipeline, "predict", None)
        if callable(pipeline_predict):
            try:
                return pipeline_predict(image_arr)
            except Exception:
                return pipeline_predict([image_arr])
        raise RuntimeError("PP-Structure instance is not callable and has no predict method.")

    # Optional: Prepare a PaddleOCR recognizer for recognition on layout boxes
    _pp_ocr = None
    _use_tlo_flag = bool(getattr(config, "paddle_use_textline_orientation", False))
    if bool(getattr(config, "paddle_recognize_from_layout_boxes", False)):
        try:
            from paddleocr import PaddleOCR  # type: ignore
        except Exception as exc:
            LOGGER.warning("PaddleOCR not available for box-level recognition: %s", exc)
            _pp_ocr = None
        if _pp_ocr is None:
            ocr_kwargs: Dict[str, Any] = {"lang": str(languages)}
            if config.paddle_target_max_side_px > 0:
                ocr_kwargs["text_det_limit_side_len"] = config.paddle_target_max_side_px
                ocr_kwargs["text_det_limit_type"] = "max"
            if config.paddle_use_doc_orientation_classify:
                ocr_kwargs["use_doc_orientation_classify"] = True
            if config.paddle_use_doc_unwarping:
                ocr_kwargs["use_doc_unwarping"] = True

            def _create_ocr_direct_pp(kwargs: Dict[str, Any]):
                return PaddleOCR(**kwargs)

            def _try_create_direct_pp(kwargs: Dict[str, Any]):
                try:
                    return _create_ocr_direct_pp(kwargs)
                except TypeError:
                    return None
                except Exception:
                    return None

            reduced_kwargs = dict(ocr_kwargs)
            reduced_kwargs.pop("use_doc_orientation_classify", None)
            reduced_kwargs.pop("use_doc_unwarping", None)

            ctor_candidates: List[Dict[str, Any]] = []
            ctor_candidates.append({**ocr_kwargs, "use_textline_orientation": _use_tlo_flag})
            ctor_candidates.append({**reduced_kwargs, "use_textline_orientation": _use_tlo_flag})
            ctor_candidates.append({**ocr_kwargs})
            ctor_candidates.append({**reduced_kwargs})
            ctor_candidates.append({**ocr_kwargs, "use_angle_cls": _use_tlo_flag})
            ctor_candidates.append({**reduced_kwargs, "use_angle_cls": _use_tlo_flag})

            for kw in ctor_candidates:
                _pp_ocr = _try_create_direct_pp(kw)
                if _pp_ocr is not None:
                    break
            if _pp_ocr is None:
                try:
                    _pp_ocr = _create_ocr_direct_pp(ocr_kwargs)
                except Exception as exc:
                    LOGGER.warning("PaddleOCR init failed for box recognition: %s", exc)
                    _pp_ocr = None

    def _pp_run_ocr_inference(img_arr: Any):
        if _pp_ocr is None:
            return None
        res = None
        if hasattr(_pp_ocr, "predict"):
            try:
                res = _pp_ocr.predict(img_arr)  # type: ignore[attr-defined]
            except TypeError:
                res = None
            except Exception:
                res = None
        if res is None and hasattr(_pp_ocr, "ocr"):
            try:
                res = _pp_ocr.ocr(img_arr)  # type: ignore[attr-defined]
            except TypeError:
                res = None
            except Exception:
                res = None
        if res is None and hasattr(_pp_ocr, "ocr"):
            try:
                res = _pp_ocr.ocr(img_arr, cls=_use_tlo_flag)  # type: ignore[attr-defined]
            except Exception:
                res = None
        return res

    def _pp_bbox_from_quad(quad: Sequence[Sequence[float]]) -> Tuple[float, float, float, float, float]:
        xs = [p[0] for p in quad]
        ys = [p[1] for p in quad]
        x0, y0, x1, y1 = float(min(xs)), float(min(ys)), float(max(xs)), float(max(ys))
        xc = 0.5 * (x0 + x1)
        return x0, y0, x1, y1, xc

    def _pp_iter_entries(result: Any) -> List[Tuple[Any, str, Optional[float]]]:
        if isinstance(result, dict):
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
            out: List[Tuple[Any, str, Optional[float]]] = []
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
                out.append((quad, text_str, conf_val))
            return out
        if isinstance(result, list):
            entries = result
            if len(result) == 1:
                elem = result[0]
                if isinstance(elem, dict):
                    return _pp_iter_entries(elem)
                if isinstance(elem, (list, tuple, dict)):
                    entries = elem  # type: ignore
            if isinstance(entries, dict):
                return _pp_iter_entries(entries)
            out: List[Tuple[Any, str, Optional[float]]] = []
            for entry in entries:  # type: ignore
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
                    out.append((quad, text_str, conf_val))
            return out
        return []

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

    def _extract_bbox(block: Dict[str, Any]) -> Optional[Tuple[float, float, float, float]]:
        bbox = block.get("bbox") or block.get("box") or block.get("points")
        if bbox is None:
            return None
        if isinstance(bbox, dict):
            try:
                x0 = float(bbox.get("x0", bbox.get("left", 0.0)))
                y0 = float(bbox.get("y0", bbox.get("top", 0.0)))
                x1 = float(bbox.get("x1", bbox.get("right", 0.0)))
                y1 = float(bbox.get("y1", bbox.get("bottom", 0.0)))
                return x0, y0, x1, y1
            except Exception:
                return None
        if isinstance(bbox, (list, tuple)):
            if len(bbox) == 4 and all(isinstance(v, (int, float)) for v in bbox):
                x0, y0, x1, y1 = bbox
                return float(x0), float(y0), float(x1), float(y1)
            if len(bbox) >= 4 and all(isinstance(v, (list, tuple)) for v in bbox):
                xs = []
                ys = []
                for pt in bbox:
                    if len(pt) < 2:
                        continue
                    xs.append(float(pt[0]))
                    ys.append(float(pt[1]))
                if xs and ys:
                    return min(xs), min(ys), max(xs), max(ys)
            if len(bbox) >= 8 and all(isinstance(v, (int, float)) for v in bbox):
                xs = [float(v) for v in bbox[0::2]]
                ys = [float(v) for v in bbox[1::2]]
                if xs and ys:
                    return min(xs), min(ys), max(xs), max(ys)
        return None

    def _is_header_footer(bbox: Optional[Tuple[float, float, float, float]], page_h: float) -> bool:
        if not bbox or page_h <= 0:
            return False
        _, y0, _, y1 = bbox
        top_band = max(0.0, float(config.paddle_structure_header_ratio))
        bottom_band = max(0.0, float(config.paddle_structure_footer_ratio))
        if top_band > 0 and y1 <= page_h * top_band:
            return True
        if bottom_band > 0 and y0 >= page_h * (1.0 - bottom_band):
            return True
        return False

    pages: List[Dict[str, Any]] = []
    total = max(1, len(images))
    # Emit an immediate progress update to override any earlier 'starting' label
    if progress_cb and progress_span > 0:
        progress_cb(progress_base, "layout", f"Paddle layout page 1/{total}")
    total_pages = len(images)
    removed_total = 0
    repeat_threshold = 0
    repeated_clusters: List[Any] = []
    page_records: List[Dict[str, Any]] = []
    edge_candidates: List[List[str]] = []

    for idx, image in enumerate(images, start=1):
        LOGGER.info("PP-Structure page %d/%d: layout start", idx, total)
        t_start = time.perf_counter()
        result = _run_structure(structure, np.array(image))
        if isinstance(result, dict):
            blocks = (
                result.get("layout")
                or result.get("blocks")
                or result.get("result")
                or result.get("items")
                or []
            )
        elif hasattr(result, "layout"):
            blocks = getattr(result, "layout", []) or []
        else:
            blocks = result if isinstance(result, list) else []
        elapsed = time.perf_counter() - t_start
        LOGGER.info(
            "PP-Structure page %d/%d: layout done in %.2fs (blocks=%d)",
            idx,
            total,
            elapsed,
            len(blocks),
        )
        page_h = float(getattr(image, "height", 0.0) or 0.0)
        record_blocks: List[Dict[str, Any]] = []
        edge_lines: List[str] = []
        for block in blocks:
            block_dict = _block_to_dict(block)
            if not block_dict:
                continue
            block_type = str(
                block_dict.get("type")
                or block_dict.get("label")
                or block_dict.get("category")
                or ""
            ).lower()
            block_lines = _extract_block_lines(block_dict)
            if not block_lines:
                continue
            bbox = _extract_bbox(block_dict)
            is_edge = _is_header_footer(bbox, page_h)
            if is_edge:
                edge_lines.append(" ".join(block_lines).strip())
            record_blocks.append(
                {
                    "type": block_type,
                    "lines": block_lines,
                    "edge": is_edge,
                    "bbox": bbox,
                }
            )
        page_records.append({"page_num": idx, "blocks": record_blocks})
        if config.enable_boilerplate_removal and edge_lines:
            edge_candidates.append([line for line in edge_lines if line])

    if config.enable_boilerplate_removal and total_pages >= config.boilerplate_min_pages:
        repeated_clusters, repeat_threshold = detect_repeated_line_clusters(
            edge_candidates,
            total_pages,
            config,
        )

    for record in page_records:
        page_num = int(record.get("page_num", 0))
        page_img = images[page_num - 1] if 1 <= page_num <= len(images) else None
        used_recognition = bool(
            config.paddle_recognize_from_layout_boxes and _pp_ocr is not None and page_img is not None
        )
        page_text = ""
        if used_recognition:
            line_blocks: List[Dict[str, Any]] = []
            fallback_lines: List[str] = []
            for b in record["blocks"]:
                bbox = b.get("bbox")
                block_lines = b.get("lines") or []
                block_text = " ".join(block_lines).strip()
                if not bbox or not isinstance(bbox, (tuple, list)) or len(bbox) != 4:
                    if block_text:
                        fallback_lines.append(block_text)
                    continue
                if config.enable_boilerplate_removal and b.get("edge"):
                    normalized = normalize_boilerplate_line(block_text)
                    if matches_repeated_cluster(block_text, repeated_clusters, config) or is_boilerplate_line(normalized):
                        removed_total += 1
                        continue
                x0, y0, x1, y1 = bbox  # type: ignore
                try:
                    crop = page_img.crop((int(x0), int(y0), int(x1), int(y1)))
                    arr = np.array(crop)
                except Exception:
                    if block_text:
                        fallback_lines.append(block_text)
                    continue
                result = _pp_run_ocr_inference(arr)
                if result is None:
                    if block_text:
                        fallback_lines.append(block_text)
                    continue
                for quad, text_val, _ in _pp_iter_entries(result):
                    if not text_val:
                        continue
                    if quad is None:
                        fallback_lines.append(text_val)
                        continue
                    try:
                        bx0, by0, bx1, by1, bxc = _pp_bbox_from_quad(quad)
                        # Map to page coordinates by adding crop offset
                        bx0 += float(x0); by0 += float(y0); bx1 += float(x0); by1 += float(y0)
                        bxc = 0.5 * (bx0 + bx1)
                        line_blocks.append({
                            "x0": bx0,
                            "y0": by0,
                            "x1": bx1,
                            "y1": by1,
                            "xc": bxc,
                            "text": text_val,
                            "line_id": len(line_blocks),
                        })
                    except Exception:
                        fallback_lines.append(text_val)
                        continue

            edge_ids: Set[int] = set()
            if config.enable_boilerplate_removal and line_blocks:
                edge_ids = edge_ids_by_y(
                    [(b["line_id"], b["y0"]) for b in line_blocks],
                    config.boilerplate_edge_lines,
                )
            if edge_ids:
                filtered_blocks: List[Dict[str, Any]] = []
                for b in line_blocks:
                    normalized = normalize_boilerplate_line(str(b.get("text", "")).strip())
                    is_edge = b.get("line_id") in edge_ids
                    if is_edge and (
                        matches_repeated_cluster(str(b.get("text", "")), repeated_clusters, config)
                        or is_boilerplate_line(normalized)
                    ):
                        removed_total += 1
                        continue
                    filtered_blocks.append(b)
                line_blocks = filtered_blocks
            if line_blocks:
                page_text = order_blocks_into_columns(
                    line_blocks, log_label="Paddle-PPStruct", preserve_single_column_order=True
                )
            else:
                page_text = "\n".join(fallback_lines)
        else:
            # Fallback: use PP-Structure text directly
            lines_out: List[str] = []
            for block in record["blocks"]:
                block_lines = block["lines"]
                block_text = " ".join(block_lines).strip()
                if not block_text:
                    continue
                if config.enable_boilerplate_removal and block["edge"]:
                    normalized = normalize_boilerplate_line(block_text)
                    if matches_repeated_cluster(block_text, repeated_clusters, config) or is_boilerplate_line(normalized):
                        removed_total += 1
                        continue
                if block["type"] in ("title", "header", "heading"):
                    lines_out.append(f"# {block_text}")
                else:
                    lines_out.append("\n".join(block_lines))
            page_text = "\n\n".join(lines_out).strip()

        pages.append({"page_num": page_num, "text": page_text})
        if progress_cb and progress_span > 0:
            percent = progress_base + int(page_num / total * progress_span)
            progress_cb(percent, "layout", f"Paddle layout page {page_num}/{total}")

    if removed_total and config.enable_boilerplate_removal:
        LOGGER.info(
            "Boilerplate removal (PP-Structure): removed %s blocks (repeat_threshold=%s, repeated_lines=%s)",
            removed_total,
            repeat_threshold,
            len(repeated_clusters),
        )
    LOGGER.info(
        "PP-Structure OCR complete: pages=%d, text_chars=%d",
        len(pages),
        ocr_pages_text_chars(pages),
    )

    return pages, {"layout_used": True, "layout_model": config.paddle_structure_version}


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
