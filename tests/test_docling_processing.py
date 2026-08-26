import importlib.util
import pathlib
import sys
import types
import unittest
from types import SimpleNamespace
from unittest.mock import Mock, patch


class FakeRequestsTimeout(Exception):
    pass


def load_module():
    root = pathlib.Path(__file__).resolve().parents[1]
    module_path = root / "tools" / "docling_extract.py"
    spec = importlib.util.spec_from_file_location("docling_extract", module_path)
    module = importlib.util.module_from_spec(spec)
    class FakeLang:
        def __init__(self, code: str):
            self.code = code

        def to_alpha3(self):
            mapping = {
                "de": "deu",
                "deu": "deu",
                "eng": "eng",
                "en": "eng",
            }
            return mapping.get(self.code, self.code)

    fake_langcodes = SimpleNamespace(find=lambda value: FakeLang(str(value).lower()))
    fake_ocr_paddle = SimpleNamespace(
        ocr_pages_with_paddle=lambda *args, **kwargs: ([], {}),
        ocr_pages_with_paddle_structure=lambda *args, **kwargs: ([], {}),
        ocr_pages_with_paddle_vl=lambda *args, **kwargs: ([], {}),
    )
    fake_ocr_tesseract = SimpleNamespace(
        find_tesseract_path=lambda: None,
        ocr_pages_with_tesseract=lambda *args, **kwargs: ([], {}),
    )
    with patch.dict(
        sys.modules,
        {
            "langcodes": fake_langcodes,
            "ocr_paddle": fake_ocr_paddle,
            "ocr_tesseract": fake_ocr_tesseract,
        },
    ):
        spec.loader.exec_module(module)
    return module


class DoclingProcessingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.docling = load_module()

    def test_detect_text_layer_from_pages(self):
        config = self.docling.DoclingProcessingConfig()
        pages = [
            {"page_num": 1, "text": "Hello world " * 10},
            {"page_num": 2, "text": ""},
        ]
        self.assertTrue(self.docling.detect_text_layer_from_pages(pages, config))

    def test_select_language_set(self):
        config = self.docling.DoclingProcessingConfig()
        self.assertEqual(
            self.docling.select_language_set(None, "report_de.pdf", config),
            config.default_lang_german,
        )
        self.assertEqual(
            self.docling.select_language_set("eng", "report.pdf", config),
            config.default_lang_english,
        )

    def test_decide_ocr_route_text_layer(self):
        config = self.docling.DoclingProcessingConfig()
        quality = self.docling.TextQuality(200, 0.9, 0.01, 0.8)
        decision = self.docling.decide_ocr_route(
            True,
            quality,
            ["paddle"],
            config,
            config.default_lang_english,
        )
        self.assertFalse(decision.ocr_used)

    def test_default_ocr_route_prefers_paddle(self):
        config = self.docling.DoclingProcessingConfig()
        quality = self.docling.TextQuality(0, 0.0, 0.0, 0.0)
        decision = self.docling.decide_ocr_route(
            False,
            quality,
            ["paddle", "tesseract"],
            config,
            config.default_lang_english,
        )
        self.assertTrue(decision.ocr_used)
        self.assertEqual(decision.ocr_engine, "paddle")

    def test_low_quality_text_layer_does_not_force_paddle_layout_by_default(self):
        config = self.docling.DoclingProcessingConfig()
        config.quality_confidence_threshold = 0.5
        quality = self.docling.TextQuality(200, 0.9, 0.01, 0.2)
        decision = self.docling.decide_ocr_route(
            True,
            quality,
            ["paddle", "tesseract"],
            config,
            config.default_lang_english,
        )
        self.assertFalse(decision.ocr_used)

    def test_explicit_paddle_route_still_uses_paddle(self):
        config = self.docling.DoclingProcessingConfig()
        config.prefer_ocr_engine = "paddle"
        config.fallback_ocr_engine = "paddle"
        quality = self.docling.TextQuality(0, 0.0, 0.0, 0.0)
        decision = self.docling.decide_ocr_route(
            False,
            quality,
            ["paddle", "tesseract"],
            config,
            config.default_lang_english,
        )
        self.assertTrue(decision.ocr_used)
        self.assertEqual(decision.ocr_engine, "paddle")

    def test_requested_external_ocr_missing_raises_before_docling_ocr(self):
        config = self.docling.DoclingProcessingConfig()
        quality = self.docling.TextQuality(0, 0.0, 0.0, 0.0)
        decision = self.docling.decide_ocr_route(
            False,
            quality,
            [],
            config,
            config.default_lang_english,
        )

        with self.assertRaisesRegex(RuntimeError, "External OCR engine unavailable"):
            self.docling.validate_ocr_route(decision, config, [])

    # @lat: [[tests#Tests#Docling Processing Tests#Strict Paddle API Routing]]
    def test_explicit_paddle_vl_api_failure_never_uses_local_paddle(self):
        config = self.docling.DoclingProcessingConfig(
            paddle_use_vl=True,
            paddle_vl_api_url="https://example.invalid/ocr",
            paddle_vl_api_token="configured",
            paddle_api_strict=True,
        )
        local_fallback = Mock(return_value=([{"page_num": 1, "text": "fallback"}], {}))

        with (
            patch.object(self.docling, "render_pdf_pages", return_value=[object()]),
            patch.object(
                self.docling,
                "ocr_pages_with_paddle_vl",
                side_effect=RuntimeError("API queue is full"),
            ),
            patch.object(self.docling, "ocr_pages_with_paddle", local_fallback),
        ):
            with self.assertRaisesRegex(RuntimeError, "explicitly selected"):
                self.docling.run_external_ocr_pages(
                    "missing-test.pdf",
                    "paddle",
                    "eng",
                    config,
                )

        local_fallback.assert_not_called()

    def test_explicit_structure_api_failure_never_uses_local_paddle(self):
        config = self.docling.DoclingProcessingConfig(
            paddle_use_structure_v3=True,
            paddle_structure_api_url="https://example.invalid/ocr",
            paddle_structure_api_token="configured",
            paddle_api_strict=True,
        )
        local_fallback = Mock(return_value=([{"page_num": 1, "text": "fallback"}], {}))

        with (
            patch.object(self.docling, "render_pdf_pages", return_value=[object()]),
            patch.object(
                self.docling,
                "ocr_pages_with_paddle_structure",
                side_effect=RuntimeError("API unavailable"),
            ),
            patch.object(self.docling, "ocr_pages_with_paddle", local_fallback),
        ):
            with self.assertRaisesRegex(RuntimeError, "explicitly selected"):
                self.docling.run_external_ocr_pages(
                    "missing-test.pdf",
                    "paddle",
                    "eng",
                    config,
                )

        local_fallback.assert_not_called()

    def test_external_ocr_configures_docling_selected_engine(self):
        class FakeInputFormat:
            PDF = "pdf"

        class FakePdfPipelineOptions:
            def __init__(self):
                self.accelerator_options = types.SimpleNamespace(num_threads=4)
                self.do_ocr = True
                self.ocr_mode = None
                self.ocr_options = None
                self.ocr_engine = ""
                self.ocr_languages = ""
                self.ocr_lang = ""
                self.layout_batch_size = 4
                self.ocr_batch_size = 4
                self.queue_max_size = 100
                self.table_batch_size = 4

        class FakeRapidOcrOptions:
            def __init__(self, **kwargs):
                self.kwargs = kwargs

        class FakeTesseractCliOcrOptions:
            def __init__(self, **kwargs):
                self.kwargs = kwargs

        class FakePdfFormatOption:
            def __init__(self, pipeline_options):
                self.pipeline_options = pipeline_options

        class FakeDocumentConverter:
            def __init__(self, format_options=None):
                self.format_options = format_options

        fake_modules = {
            "docling": types.ModuleType("docling"),
            "docling.datamodel": types.ModuleType("docling.datamodel"),
            "docling.datamodel.base_models": types.ModuleType("docling.datamodel.base_models"),
            "docling.datamodel.pipeline_options": types.ModuleType("docling.datamodel.pipeline_options"),
            "docling.document_converter": types.ModuleType("docling.document_converter"),
        }
        fake_modules["docling.datamodel.base_models"].InputFormat = FakeInputFormat
        fake_modules["docling.datamodel.pipeline_options"].PdfPipelineOptions = FakePdfPipelineOptions
        fake_modules["docling.datamodel.pipeline_options"].RapidOcrOptions = FakeRapidOcrOptions
        fake_modules["docling.datamodel.pipeline_options"].TesseractCliOcrOptions = FakeTesseractCliOcrOptions
        fake_modules["docling.document_converter"].DocumentConverter = FakeDocumentConverter
        fake_modules["docling.document_converter"].PdfFormatOption = FakePdfFormatOption

        decision = self.docling.OcrRouteDecision(
            True,
            "paddle",
            "eng",
            "No usable text layer detected",
            True,
            False,
            "Quality metrics acceptable",
        )
        with patch.dict(sys.modules, fake_modules):
            converter = self.docling.build_converter(self.docling.DoclingProcessingConfig(), decision)

        options = converter.format_options[FakeInputFormat.PDF].pipeline_options
        self.assertTrue(options.do_ocr)
        self.assertIsNone(options.ocr_mode)
        self.assertEqual(options.ocr_engine, "paddle")
        self.assertIsInstance(options.ocr_options, FakeRapidOcrOptions)
        self.assertEqual(options.ocr_options.kwargs["backend"], "onnxruntime")
        self.assertEqual(options.accelerator_options.num_threads, 1)
        self.assertEqual(options.layout_batch_size, 1)
        self.assertEqual(options.ocr_batch_size, 1)
        self.assertEqual(options.queue_max_size, 8)
        self.assertEqual(options.table_batch_size, 1)

    def test_force_ocr_on_low_quality_text(self):
        config = self.docling.DoclingProcessingConfig()
        config.force_ocr_on_low_quality_text = True
        config.quality_confidence_threshold = 0.5
        quality = self.docling.TextQuality(10, 0.2, 0.5, 0.1)
        decision = self.docling.decide_ocr_route(
            True,
            quality,
            ["paddle"],
            config,
            config.default_lang_english,
        )
        self.assertTrue(decision.ocr_used)

    def test_quality_threshold(self):
        config = self.docling.DoclingProcessingConfig()
        config.quality_confidence_threshold = 0.8
        quality = self.docling.TextQuality(200, 0.9, 0.01, 0.7)
        self.assertTrue(self.docling.is_low_quality(quality, config))

    def test_should_rasterize_text_layer(self):
        config = self.docling.DoclingProcessingConfig()
        config.force_ocr_on_low_quality_text = True
        quality = self.docling.TextQuality(10, 0.2, 0.5, 0.1)
        low_quality = self.docling.is_low_quality(quality, config)
        self.assertTrue(self.docling.should_rasterize_text_layer(True, low_quality, config))

    def test_decide_per_page_ocr(self):
        config = self.docling.DoclingProcessingConfig()
        low_quality = self.docling.TextQuality(20, 0.2, 0.4, 0.1)
        use_per_page, _reason = self.docling.decide_per_page_ocr(False, low_quality, config)
        self.assertTrue(use_per_page)

    def test_count_column_gaps(self):
        config = self.docling.DoclingProcessingConfig()
        config.column_detect_gap_threshold_ratio = 0.5
        config.column_detect_min_gap_ratio = 0.1
        density = [0.9, 0.8, 0.1, 0.1, 0.85, 0.9]
        gaps = self.docling.count_column_gaps(density, config)
        self.assertEqual(gaps, 1)

    def test_postprocess_dehyphenation(self):
        config = self.docling.DoclingProcessingConfig()
        text = "hyphen-\nated"
        output = self.docling.postprocess_text(text, config, "eng", [])
        self.assertIn("hyphenated", output)

    def test_find_page_range_overlap(self):
        config = self.docling.DoclingProcessingConfig()
        pages = [
            {"page_num": 1, "text": "alpha beta gamma"},
            {"page_num": 2, "text": "delta epsilon zeta overlap token"},
            {"page_num": 3, "text": "overlap token eta theta"},
            {"page_num": 4, "text": "iota kappa lambda"},
        ]
        section = "overlap token eta"
        start, end = self.docling.find_page_range(section, pages, config)
        self.assertLessEqual(start, end)
        self.assertTrue(2 <= start <= 3)
        self.assertTrue(2 <= end <= 3)

    def test_dictionary_correction(self):
        corrected = self.docling.apply_dictionary_correction("m0dern", ["modern"])
        self.assertEqual(corrected, "modern")

    def test_hunspell_cache_prefers_worker_cache_env(self):
        with patch.dict(
            self.docling.os.environ,
            {"ZRR_HUNSPELL_CACHE_DIR": "", "XDG_CACHE_HOME": "/tmp/zrr-xdg-cache"},
            clear=False,
        ):
            self.assertEqual(
                self.docling.get_hunspell_cache_dir(),
                "/tmp/zrr-xdg-cache/zrr-hunspell",
            )

    def test_filter_docling_config_overrides_removes_gui_keys(self):
        filtered = self.docling.filter_docling_config_overrides(
            {
                "enable_llm_correction": True,
                "llm_cleanup_model": "test-model",
                "quality_confidence_threshold": 0.2,
                "analysis_max_pages": 7,
                "paddle_use_doc_orientation_classify": True,
                "paddle_use_textline_orientation": True,
            }
        )
        self.assertEqual(filtered, {"analysis_max_pages": 7})

    def test_born_digital_text_layer_detection(self):
        config = self.docling.DoclingProcessingConfig()
        quality = self.docling.TextQuality(
            avg_chars_per_page=3000,
            alpha_ratio=0.85,
            suspicious_token_ratio=0.03,
            confidence_proxy=0.8,
            dictionary_hit_ratio=0.85,
            spellchecker_hit_ratio=0.92,
            image_heavy_ratio=0.0,
            image_page_ratio=0.2,
            ocr_overlay_ratio=0.15,
            digital_page_ratio=0.82,
            layer_classification="digital",
            effective_confidence_proxy=0.86,
        )
        self.assertTrue(
            self.docling.is_born_digital_text_layer(
                True,
                quality,
                False,
                config,
            )
        )

    def test_born_digital_text_layer_detection_overrides_mixed_classifier(self):
        config = self.docling.DoclingProcessingConfig()
        quality = self.docling.TextQuality(
            avg_chars_per_page=3286,
            alpha_ratio=0.84,
            suspicious_token_ratio=0.03,
            confidence_proxy=0.8,
            dictionary_hit_ratio=0.85,
            spellchecker_hit_ratio=0.92,
            image_heavy_ratio=0.0,
            image_page_ratio=0.2,
            ocr_overlay_ratio=0.15,
            digital_page_ratio=0.0,
            layer_classification="mixed",
            effective_confidence_proxy=0.84,
        )
        self.assertTrue(
            self.docling.is_born_digital_text_layer(
                True,
                quality,
                False,
                config,
            )
        )

    def test_determine_postprocess_mode_skips_born_digital(self):
        config = self.docling.DoclingProcessingConfig()
        self.assertEqual(
            self.docling.determine_postprocess_mode(
                config,
                layout_engine_active=False,
                prefer_layout_markdown=False,
                born_digital_text_layer=True,
            ),
            "none",
        )

    def test_umlaut_correction(self):
        text = "ueber"
        output = self.docling.apply_umlaut_corrections(text, "deu+eng", ["\u00fcber"])
        self.assertEqual(output, "\u00fcber")

    def test_escape_gender_stars_is_narrow(self):
        text = "Liebe*r Leser*in und Pirat*innen nutzen *Markdown* und a*b."
        output = self.docling.escape_gender_stars(text)
        self.assertIn("Liebe\\*r", output)
        self.assertIn("Leser\\*in", output)
        self.assertIn("Pirat\\*innen", output)
        self.assertIn("*Markdown*", output)
        self.assertIn("a*b", output)

    def test_ocr_pages_text_chars(self):
        pages = [
            {"page_num": 1, "text": ""},
            {"page_num": 2, "text": "   "},
        ]
        self.assertEqual(self.docling.ocr_pages_text_chars(pages), 0)
        pages = [{"page_num": 1, "text": "hello"}]
        self.assertGreater(self.docling.ocr_pages_text_chars(pages), 0)

    def test_llm_cleanup_disables_after_timeout(self):
        config = self.docling.DoclingProcessingConfig(
            enable_llm_correction=True,
            llm_cleanup_base_url="http://localhost:1234/v1",
            llm_cleanup_model="test-model",
        )
        calls = {"count": 0}

        def post(_endpoint, **_kwargs):
            calls["count"] += 1
            raise FakeRequestsTimeout("timed out")

        fake_requests = SimpleNamespace(
            post=post,
            exceptions=SimpleNamespace(Timeout=FakeRequestsTimeout),
        )
        callback = self.docling.build_llm_cleanup_callback(config)
        self.assertIsNotNone(callback)
        with patch.dict(sys.modules, {"requests": fake_requests}):
            self.assertEqual(callback("first"), "first")
            self.assertEqual(callback("second"), "second")
        self.assertEqual(calls["count"], 1)

    def test_llm_cleanup_budget_disables_future_calls(self):
        config = self.docling.DoclingProcessingConfig(
            enable_llm_correction=True,
            llm_cleanup_base_url="http://localhost:1234/v1",
            llm_cleanup_model="test-model",
            llm_cleanup_timeout_sec=10,
            llm_cleanup_max_total_sec=2,
        )
        calls = {"count": 0, "timeouts": []}

        class Response:
            def raise_for_status(self):
                return None

            def json(self):
                return {"choices": [{"message": {"content": "fixed"}}]}

        def post(_endpoint, **kwargs):
            calls["count"] += 1
            calls["timeouts"].append(kwargs.get("timeout"))
            return Response()

        fake_requests = SimpleNamespace(
            post=post,
            exceptions=SimpleNamespace(Timeout=FakeRequestsTimeout),
        )
        callback = self.docling.build_llm_cleanup_callback(config)
        self.assertIsNotNone(callback)
        with patch.dict(sys.modules, {"requests": fake_requests}):
            with patch.object(self.docling.time, "perf_counter", side_effect=[0.0, 3.0]):
                self.assertEqual(callback("first"), "fixed")
            self.assertEqual(callback("second"), "second")
        self.assertEqual(calls["count"], 1)
        self.assertEqual(calls["timeouts"], [2])


if __name__ == "__main__":
    unittest.main()
