"""Keep the docs entry point and legacy URLs connected to published pages."""

import json
from pathlib import Path
import re
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

    def test_homepage_is_a_page_not_a_release_redirect(self):
        self.assertNotIn("/", self.redirects)
        self.assert_page_exists("/")
        self.assertEqual(self.config["logo"]["href"], "/")
        self.assertIn("index", self.config["navigation"]["tabs"][0]["pages"])

    def test_legacy_redirects_resolve_to_existing_pages(self):
        self.assertEqual(len(self.redirects), len(self.config["redirects"]))
        for source in self.redirects:
            with self.subTest(source=source):
                self.assert_page_exists(source)

    def test_homepage_cards_link_to_existing_guides(self):
        links = re.findall(r'href="([^"]+)"', (ROOT / "index.mdx").read_text())
        self.assertTrue(links)
        for path in links:
            with self.subTest(path=path):
                self.assert_page_exists(path)
