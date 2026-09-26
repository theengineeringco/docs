"""Publication checks for API wording, navigation, and runnable language options."""
import ast
import importlib.util
import json
from pathlib import Path
import re
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
MODULE = importlib.util.spec_from_file_location("sync_api", ROOT / "scripts/sync-customer-api.py")
sync = importlib.util.module_from_spec(MODULE)
MODULE.loader.exec_module(sync)
FENCES = re.compile(r"^```([^\n]*)\n(.*?)^```", re.MULTILINE | re.DOTALL)
GROUPS = re.compile(r"<CodeGroup(?:\s[^>]*)?>.*?</CodeGroup>", re.DOTALL)


class ApiDocsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pages = {p: p.read_text() for p in [ROOT / "api.mdx", *sorted((ROOT / "api").rglob("*.mdx"))]}
        cls.config = json.loads((ROOT / "docs.json").read_text())
        cls.api_nav = next(tab for tab in cls.config["navigation"]["tabs"] if tab["tab"] == "API")

    def test_public_api_wording_and_navigation(self):
        for path, content in self.pages.items():
            with self.subTest(path=path.relative_to(ROOT)):
                self.assertIsNone(sync.PRIVATE_TERMS.search(content))
        self.assertIsNone(sync.PRIVATE_TERMS.search(json.dumps(self.api_nav)))
        self.assertEqual([group["group"] for group in self.api_nav["groups"]], ["Quickstart", "Examples", "Automations", "Endpoints"])
        sync.validate_public_spec(json.loads((ROOT / "openapi/customer-api.json").read_text()))

    def test_every_curl_block_has_python_and_javascript_options(self):
        for path, content in self.pages.items():
            groups = list(GROUPS.finditer(content))
            for fence in FENCES.finditer(content):
                if not re.search(r"\bcurl\b", fence[2], re.IGNORECASE):
                    continue
                with self.subTest(path=path.relative_to(ROOT), line=content[:fence.start()].count("\n") + 1):
                    group = next((g for g in groups if g.start() <= fence.start() < g.end()), None)
                    self.assertIsNotNone(group, "cURL must be inside a CodeGroup")
                    labels = {block[1] for block in FENCES.finditer(group[0])}
                    self.assertTrue({"bash cURL", "python Python", "javascript JavaScript"} <= labels)
        self.assertEqual(set(self.config["api"]["examples"]["languages"]), {"curl", "python", "javascript"})

    def test_example_syntax_without_sending_requests(self):
        with tempfile.TemporaryDirectory() as directory:
            script = Path(directory) / "example.mjs"
            for path, content in self.pages.items():
                for index, fence in enumerate(FENCES.finditer(content)):
                    language = fence[1].split()[0]
                    with self.subTest(path=path.relative_to(ROOT), block=index, language=language):
                        if language == "python":
                            ast.parse(fence[2])
                        elif language == "javascript":
                            script.write_text(fence[2])
                            subprocess.run(["node", "--check", str(script)], check=True, capture_output=True, text=True)
                        elif language == "bash":
                            subprocess.run(["bash", "-n"], input=fence[2], check=True, capture_output=True, text=True)


if __name__ == "__main__":
    unittest.main()
