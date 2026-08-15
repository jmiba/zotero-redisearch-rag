import importlib.util
import pathlib
import sys
import unittest
from types import SimpleNamespace
from unittest.mock import patch


def load_module():
    root = pathlib.Path(__file__).resolve().parents[1]
    module_path = root / "tools" / "ocr_paddle.py"
    spec = importlib.util.spec_from_file_location("ocr_paddle_under_test", module_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class FakeImage:
    def convert(self, _mode):
        return self


class PaddleOcrVlTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.ocr_paddle = load_module()

    # @lat: [[tests#Tests#Docling Processing Tests#PaddleOCR-VL Version Selection]]
    def test_local_vl_route_explicitly_selects_version_1_6(self):
        constructor_kwargs = []

        class FakePaddleOCRVL:
            def __init__(self, **kwargs):
                constructor_kwargs.append(kwargs)

            def predict(self, _image, **_kwargs):
                return []

        fake_paddleocr = SimpleNamespace(PaddleOCRVL=FakePaddleOCRVL)
        fake_numpy = SimpleNamespace(array=lambda value: value)
        config = SimpleNamespace()
        helpers = {"ocr_pages_text_chars": lambda pages: sum(len(page["text"]) for page in pages)}

        with patch.dict(sys.modules, {"numpy": fake_numpy, "paddleocr": fake_paddleocr}):
            pages, stats = self.ocr_paddle.ocr_pages_with_paddle_vl(
                [FakeImage()],
                "eng",
                config,
                helpers,
            )

        self.assertEqual(constructor_kwargs, [{"pipeline_version": "v1.6"}])
        self.assertEqual(pages, [{"page_num": 1, "text": ""}])
        self.assertEqual(stats["layout_model"], "PaddleOCR-VL-1.6")


if __name__ == "__main__":
    unittest.main()
