import importlib.util
import pathlib
import sys
import types
import unittest
from unittest.mock import patch


def load_module():
    root = pathlib.Path(__file__).resolve().parents[1]
    tools_dir = root / "tools"
    module_path = tools_dir / "rag_query_redisearch.py"
    spec = importlib.util.spec_from_file_location("rag_query_redisearch", module_path)
    module = importlib.util.module_from_spec(spec)

    class FakeRedis:
        calls = []
        client = object()

        @classmethod
        def from_url(cls, *args, **kwargs):
            cls.calls.append((args, kwargs))
            return cls.client

    fake_redis = types.ModuleType("redis")
    fake_redis.Redis = FakeRedis
    fake_requests = types.ModuleType("requests")

    sys.path.insert(0, str(tools_dir))
    try:
        with patch.dict(sys.modules, {"redis": fake_redis, "requests": fake_requests}):
            spec.loader.exec_module(module)
    finally:
        sys.path.remove(str(tools_dir))
        sys.modules.pop("utils_embedding", None)
        sys.modules.pop("utils_redis", None)
    return module, FakeRedis


class RagRedisProtocolTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rag, cls.fake_redis = load_module()

    # @lat: [[tests#Redis Client Compatibility#RAG Parses RESP3]]
    def test_rag_client_uses_resp3(self):
        self.fake_redis.calls.clear()
        client = self.rag.create_redis_client("redis://127.0.0.1:6379")

        self.assertIs(client, self.fake_redis.client)
        self.assertEqual(
            self.fake_redis.calls,
            [
                (
                    ("redis://127.0.0.1:6379",),
                    {"decode_responses": False, "protocol": 3},
                )
            ],
        )

    def test_rag_parser_normalizes_resp3_search_map(self):
        raw = {
            b"attributes": [],
            b"results": [
                {
                    b"id": b"zrr:resp3:1",
                    b"extra_attributes": {
                        b"text": b"hello redis",
                        b"page_start": b"1",
                    },
                    b"values": [],
                }
            ],
            b"total_results": 1,
        }

        self.assertEqual(
            self.rag.parse_results(raw),
            [{"text": "hello redis", "page_start": "1"}],
        )
        self.assertEqual(self.rag.parse_search_total(raw), 1)

    def test_rag_parser_still_accepts_resp2_search_array(self):
        raw = [1, b"zrr:resp2:1", [b"text", b"hello redis", b"page_start", b"1"]]

        self.assertEqual(
            self.rag.parse_results(raw),
            [{"text": "hello redis", "page_start": "1"}],
        )
        self.assertEqual(self.rag.parse_search_total(raw), 1)

    def test_rag_parser_reads_resp3_index_attributes(self):
        raw = {
            b"attributes": [
                {
                    b"identifier": b"embedding",
                    b"attribute": b"embedding",
                    b"type": b"VECTOR",
                    b"dim": 768,
                }
            ]
        }

        client = types.SimpleNamespace(execute_command=lambda *_args: raw)

        self.assertEqual(self.rag.get_index_vector_dim(client, "zrr_idx"), 768)


if __name__ == "__main__":
    unittest.main()
