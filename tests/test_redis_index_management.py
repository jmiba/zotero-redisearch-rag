import importlib
import pathlib
import sys
import unittest

import redis


ROOT = pathlib.Path(__file__).resolve().parents[1]
TOOLS_DIR = ROOT / "tools"


def load_index_modules():
    sys.path.insert(0, str(TOOLS_DIR))
    try:
        index_module = importlib.import_module("index_redisearch")
        redis_utils = importlib.import_module("utils_redis")
    finally:
        sys.path.remove(str(TOOLS_DIR))
    return index_module, redis_utils


class FakeRedisClient:
    def __init__(self, info_error: str):
        self.info_error = info_error
        self.calls = []

    def execute_command(self, *args):
        self.calls.append(args)
        if args[0] == "FT.INFO":
            raise redis.exceptions.ResponseError(self.info_error)
        if args[0] == "FT.CREATE":
            return "OK"
        raise AssertionError(f"Unexpected Redis command: {args}")


class RedisIndexManagementTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.index_module, cls.redis_utils = load_index_modules()

    @classmethod
    def tearDownClass(cls):
        sys.modules.pop("index_redisearch", None)
        sys.modules.pop("utils_embedding", None)
        sys.modules.pop("utils_redis", None)

    # @lat: [[tests#Redis Missing Index Recovery]]
    def test_missing_index_variants_call_ft_create(self):
        messages = (
            "SEARCH_INDEX_NOT_FOUND Index not found: idx:zotero:test",
            "Index not found: idx:zotero:test",
            "No such index idx:zotero:test",
            "Unknown Index name",
        )

        for message in messages:
            with self.subTest(message=message):
                client = FakeRedisClient(message)
                self.index_module.ensure_index(
                    client,
                    "idx:zotero:test",
                    "zotero:chunk:test:",
                    3072,
                )

                self.assertTrue(self.redis_utils.is_missing_search_index_error(message))
                self.assertEqual(client.calls[0], ("FT.INFO", "idx:zotero:test"))
                self.assertEqual(client.calls[1][0], "FT.CREATE")
                self.assertEqual(client.calls[1][1], "idx:zotero:test")

    def test_unrelated_redis_error_does_not_create_index(self):
        client = FakeRedisClient("NOAUTH Authentication required")

        with self.assertRaises(redis.exceptions.ResponseError):
            self.index_module.ensure_index(
                client,
                "idx:zotero:test",
                "zotero:chunk:test:",
                3072,
            )

        self.assertFalse(
            self.redis_utils.is_missing_search_index_error("NOAUTH Authentication required")
        )
        self.assertEqual(client.calls, [("FT.INFO", "idx:zotero:test")])


if __name__ == "__main__":
    unittest.main()
