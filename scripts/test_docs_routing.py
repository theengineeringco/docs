"""Keep the docs entry point and legacy URLs connected to published pages."""

import json
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class DocsRoutingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.config = json.loads((ROOT / "docs.json").read_text())
        cls.redirects = {
            rule["source"]: rule["destination"]
            for rule in cls.config["redirects"]
        }

    def assert_page_exists(self, path):
        visited = set()
        while path in self.redirects:
            self.assertNotIn(path, visited, f"Redirect loop: {visited}")
            visited.add(path)
            path = self.redirects[path]
        slug = path.strip("/") or "index"
        self.assertTrue((ROOT / f"{slug}.mdx").is_file(), f"Missing page: {path}")

    def test_root_and_logo_open_the_api_overview(self):
        self.assertEqual(self.redirects["/"], "/api")
        self.assert_page_exists("/")
        self.assertEqual(self.config["logo"]["href"], "/api")

    def test_legacy_redirects_resolve_to_existing_pages(self):
        self.assertEqual(len(self.redirects), len(self.config["redirects"]))
        for source in self.redirects:
            with self.subTest(source=source):
                self.assert_page_exists(source)
