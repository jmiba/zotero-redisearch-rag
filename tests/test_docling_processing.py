import importlib.util
import pathlib
import unittest


def load_module():
    root = pathlib.Path(__file__).resolve().parents[1]
    module_path = root / "tools" / "docling_extract.py"
    spec = importlib.util.spec_from_file_location("docling_extract", module_path)
    module = importlib.util.module_from_spec(spec)
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

    def test_umlaut_correction(self):
        text = "ueber"
        output = self.docling.apply_umlaut_corrections(text, "deu+eng", [])
        self.assertEqual(output, "\u00fcber")

    def test_ocr_pages_text_chars(self):
        pages = [
            {"page_num": 1, "text": ""},
            {"page_num": 2, "text": "   "},
        ]
        self.assertEqual(self.docling.ocr_pages_text_chars(pages), 0)
        pages = [{"page_num": 1, "text": "hello"}]
        self.assertGreater(self.docling.ocr_pages_text_chars(pages), 0)


if __name__ == "__main__":
    unittest.main()
