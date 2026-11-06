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

    def test_root_and_logo_open_the_product_overview(self):
        self.assertEqual(self.redirects["/"], "/overview")
        self.assert_page_exists("/")
        self.assertEqual(self.config["logo"]["href"], "/overview")

    def test_overview_and_api_entry_points_remain_accessible(self):
        tabs = self.config["navigation"]["tabs"]
        self.assertEqual([tab["tab"] for tab in tabs], ["Overview", "API", "Release Notes"])
        for group in tabs[0]["groups"]:
            for page in group["pages"]:
                with self.subTest(page=page):
                    self.assert_page_exists("/" + page)
        self.assertEqual(tabs[1]["groups"][0]["pages"][0], "api")
        self.assertNotIn("/api", self.redirects)
        self.assert_page_exists("/api")

    def test_legacy_redirects_resolve_to_existing_pages(self):
        self.assertEqual(len(self.redirects), len(self.config["redirects"]))
        for source in self.redirects:
            with self.subTest(source=source):
                self.assert_page_exists(source)
