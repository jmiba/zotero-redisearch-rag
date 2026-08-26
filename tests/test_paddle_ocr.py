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


class FakeResponse:
    def __init__(self, status_code, payload):
        self.status_code = status_code
        self.payload = payload
        self.headers = {}
        self.text = str(payload)

    def json(self):
        return self.payload


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

    # @lat: [[tests#Tests#Docling Processing Tests#Paddle API Queue Retry]]
    def test_api_queue_full_is_retried_before_success(self):
        responses = [
            FakeResponse(503, {"errorCode": 10010, "errorMsg": "任务提交队列已满，请稍后重试"}),
            FakeResponse(503, {"errorCode": 10010, "errorMsg": "queue is full"}),
            FakeResponse(
                200,
                {
                    "errorCode": 0,
                    "result": {
                        "layoutParsingResults": [
                            {"text": "recovered after retry"},
                        ]
                    },
                },
            ),
        ]
        calls = []

        def post(*_args, **_kwargs):
            calls.append(1)
            return responses.pop(0)

        class FakeTimeout(Exception):
            pass

        class FakeConnectionError(Exception):
            pass

        fake_requests = SimpleNamespace(
            post=post,
            exceptions=SimpleNamespace(
                Timeout=FakeTimeout,
                ConnectionError=FakeConnectionError,
            ),
        )
        config = SimpleNamespace(
            paddle_vl_api_url="https://example.invalid/ocr",
            paddle_vl_api_token="configured",
            paddle_vl_api_timeout_sec=30,
            paddle_vl_api_disable=False,
        )
        helpers = {"ocr_pages_text_chars": lambda pages: sum(len(page["text"]) for page in pages)}

        with (
            patch.dict(sys.modules, {"requests": fake_requests}),
            patch.object(self.ocr_paddle.time, "sleep") as sleep,
        ):
            pages, stats = self.ocr_paddle.ocr_pages_with_paddle_vl(
                [b"image"],
                "eng",
                config,
                helpers,
            )

        self.assertEqual(len(calls), 3)
        self.assertEqual([call.args[0] for call in sleep.call_args_list], [2, 4])
        self.assertEqual(pages[0]["page_num"], 1)
        self.assertEqual(pages[0]["text"], "recovered after retry")
        self.assertEqual(pages[0]["markdown"], "recovered after retry")
        self.assertEqual(stats["layout_model"], "PaddleOCR-VL API")

    def test_api_queue_full_error_is_preserved_after_retry_limit(self):
        payload = {"errorCode": 10010, "errorMsg": "任务提交队列已满，请稍后重试"}
        responses = [FakeResponse(503, payload) for _ in range(3)]

        def post(*_args, **_kwargs):
            return responses.pop(0)

        class FakeTimeout(Exception):
            pass

        class FakeConnectionError(Exception):
            pass

        fake_requests = SimpleNamespace(
            post=post,
            exceptions=SimpleNamespace(
                Timeout=FakeTimeout,
                ConnectionError=FakeConnectionError,
            ),
        )
        config = SimpleNamespace(
            paddle_vl_api_url="https://example.invalid/ocr",
            paddle_vl_api_token="configured",
            paddle_vl_api_timeout_sec=30,
            paddle_vl_api_disable=False,
        )
        helpers = {"ocr_pages_text_chars": lambda pages: sum(len(page["text"]) for page in pages)}

        with (
            patch.dict(sys.modules, {"requests": fake_requests}),
            patch.object(self.ocr_paddle.time, "sleep"),
        ):
            with self.assertRaisesRegex(RuntimeError, "10010"):
                self.ocr_paddle.ocr_pages_with_paddle_vl(
                    [b"image"],
                    "eng",
                    config,
                    helpers,
                )

        self.assertEqual(responses, [])


if __name__ == "__main__":
    unittest.main()
