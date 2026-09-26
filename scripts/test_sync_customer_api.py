import copy
import importlib.util
from pathlib import Path
import tempfile
import unittest

module = importlib.util.spec_from_file_location("sync_customer_api", Path(__file__).with_name("sync-customer-api.py"))
sync = importlib.util.module_from_spec(module)
module.loader.exec_module(sync)


def fixture():
    return {
        "openapi": "3.0.0", "info": {"title": "Customer API", "version": "1.0"},
        "paths": {"/entities": {"get": {"tags": ["Branch"], "security": [{"api-key": []}], "responses": {"200": {"description": "OK", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Entity"}}}}}}}},
        "components": {
            "schemas": {"Entity": {"type": "object", "properties": {"name": {"type": "string"}, "child": {"$ref": "#/components/schemas/Child"}}}, "Child": {"type": "object", "properties": {"parent": {"$ref": "#/components/schemas/Entity"}}}, "Unused": {"type": "string"}},
            "securitySchemes": {"api-key": {"type": "apiKey", "in": "header", "name": "X-API-Key"}, "unused-auth": {"type": "http", "scheme": "bearer"}},
        },
    }


class SyncTests(unittest.TestCase):
    def test_prunes_transitively_with_cycles_and_security(self):
        doc = sync.prepare(fixture())
        self.assertEqual(set(doc["components"]["schemas"]), {"Entity", "Child"})
        self.assertEqual(set(doc["components"]["securitySchemes"]), {"api-key"})
        self.assertEqual(doc["paths"]["/entities"]["get"]["tags"], ["Branches"])

    def test_playground_exposes_only_production_despite_source_overrides(self):
        source = fixture()
        source["servers"] = [{"url": url} for url in sync.SOURCES.values()]
        source["paths"]["/entities"]["servers"] = [{"url": sync.SOURCES["RVT"]}]
        source["paths"]["/entities"]["get"]["servers"] = [{"url": sync.SOURCES["Rivian"]}]
        doc = sync.prepare(source)
        self.assertEqual(doc["servers"], [{"url": sync.SOURCES["Production"], "description": "Flow API"}])
        self.assertNotIn("servers", doc["paths"]["/entities"])
        self.assertNotIn("servers", doc["paths"]["/entities"]["get"])

    def test_discriminator_only_references_are_kept(self):
        doc = fixture()
        doc["components"]["schemas"]["Entity"]["discriminator"] = {"propertyName": "type", "mapping": {"unused": "#/components/schemas/Unused"}}
        self.assertIn("Unused", sync.prepare(doc)["components"]["schemas"])

    def test_public_wording_preserves_request_contract(self):
        source = fixture()
        source["paths"]["/entities"]["get"]["parameters"] = [
            {"in": "header", "name": "customer", "required": True,
             "description": "Customer/tenant identifier", "schema": {"type": "string"}}
        ]
        source["paths"]["/entities"]["get"]["summary"] = "List entities for the current tenant"
        source["components"]["schemas"]["Entity"]["properties"]["name"]["description"] = "The tenant's name"
        public = sync.public_wording(source)
        self.assertEqual(sync.contract(source), sync.contract(public))
        self.assertEqual(public["paths"]["/entities"]["get"]["parameters"][0]["description"], "Workspace identifier")
        sync.validate_public_spec(sync.prepare(source))

    def test_policy_failure_retains_snapshot_and_never_rewrites_payload_values(self):
        for location in ["description", "example", "enum", "property"]:
            with self.subTest(location=location), tempfile.TemporaryDirectory() as tmp:
                source = fixture()
                schema = source["components"]["schemas"]["Entity"]
                if location == "property":
                    schema["properties"]["tenant"] = {"type": "string"}
                elif location == "example":
                    schema["example"] = {"description": "tenant"}
                    self.assertEqual(sync.public_wording(schema)["example"], schema["example"])
                elif location == "enum":
                    schema["properties"]["name"]["enum"] = ["tenant"]
                else:
                    schema["description"] = "Select a Rivian environment"
                target = Path(tmp) / "api.json"
                target.write_text("unchanged sentinel")
                with self.assertRaises(ValueError):
                    sync.sync({name: source for name in sync.SOURCES}, target)
                self.assertEqual(target.read_text(), "unchanged sentinel")

    def test_upstream_curl_only_examples_require_review(self):
        source = fixture()
        source["paths"]["/entities"]["get"]["description"] = "```bash\ncurl https://example.test\n```"
        with self.assertRaises(ValueError):
            sync.prepare(source)

    def test_missing_empty_invalid_and_unresolved_fail_closed(self):
        invalid = [None, {}, {**fixture(), "paths": {}}, {**fixture(), "paths": {"/empty": {}}}]
        broken = fixture()
        del broken["components"]["schemas"]["Child"]
        invalid.append(broken)
        for value in invalid:
            with self.subTest(value=value), self.assertRaises(ValueError):
                sync.prepare(value)

    def test_annotation_change_is_compatible_but_schema_change_is_review(self):
        old = sync.prepare(fixture())
        new = copy.deepcopy(old)
        new["paths"]["/entities"]["get"]["description"] = "A clearer explanation"
        self.assertEqual(sync.classify(old, new)[0], "compatible")
        new["components"]["schemas"]["Entity"]["properties"]["name"]["type"] = "number"
        self.assertEqual(sync.classify(old, new)[0], "review")

    def test_property_names_that_match_annotation_keywords_remain_contract(self):
        old = sync.prepare(fixture())
        for name in ["description", "summary", "example", "examples", "servers"]:
            new = copy.deepcopy(old)
            new["components"]["schemas"]["Entity"]["properties"][name] = {"type": "string"}
            self.assertEqual(sync.classify(old, new)[0], "review", name)

    def test_added_operation_compatible_removed_operation_requires_review(self):
        old = sync.prepare(fixture())
        new = copy.deepcopy(old)
        new["paths"]["/entities"]["post"] = {"responses": {"201": {"description": "Created"}}}
        self.assertEqual(sync.classify(old, new)[0], "compatible")
        del new["paths"]["/entities"]["get"]
        self.assertEqual(sync.classify(old, new)[0], "review")

    def test_server_noise_and_object_order_do_not_change_hash(self):
        old = fixture()
        new = dict(reversed(list(copy.deepcopy(old).items())))
        new["servers"] = [{"url": "https://example.test"}]
        new["paths"]["/entities"]["servers"] = [{"url": "https://path.example.test"}]
        new["paths"]["/entities"]["get"]["servers"] = [{"url": "https://operation.example.test"}]
        self.assertEqual(sync.fingerprint(sync.without_server_noise(old)), sync.fingerprint(sync.without_server_noise(new)))

    def test_divergent_unused_schema_or_description_retains_snapshot(self):
        for drift in ["schema", "description"]:
            with self.subTest(drift=drift), tempfile.TemporaryDirectory() as tmp:
                path = Path(tmp) / "api.json"
                path.write_text("unchanged sentinel")
                documents = {name: fixture() for name in sync.SOURCES}
                if drift == "schema":
                    documents["Rivian"]["components"]["schemas"]["Unused"]["type"] = "number"
                else:
                    documents["Rivian"]["info"]["description"] = "Different"
                report = sync.sync(documents, path)
                self.assertEqual(report["status"], "divergent")
                self.assertTrue(any("Rivian vs Production:" in change for change in report["changes"]))
                self.assertEqual(path.read_text(), "unchanged sentinel")

    def test_all_sources_required_and_snapshot_initialization_explicit(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "api.json"
            with self.assertRaises(ValueError):
                sync.sync({"Production": fixture()}, path, True)
            with self.assertRaises(ValueError):
                sync.sync({name: fixture() for name in sync.SOURCES}, path)
            self.assertFalse(path.exists())

    def test_operation_drift_report_names_added_removed_and_changed_operations(self):
        documents = {name: fixture() for name in sync.SOURCES}
        documents["RVT"]["paths"]["/entities"]["get"]["description"] = "Changed"
        documents["RVT"]["paths"]["/entities"]["post"] = {"responses": {"201": {"description": "Created"}}}
        del documents["Rivian"]["paths"]["/entities"]["get"]
        changes = sync.environment_changes(documents)
        self.assertIn("RVT vs Production: Changed operation GET /entities", changes)
        self.assertIn("RVT vs Production: Added operation POST /entities", changes)
        self.assertIn("Rivian vs Production: Removed operation GET /entities", changes)

    def test_initialized_snapshot_is_idempotent(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "api.json"
            documents = {name: fixture() for name in sync.SOURCES}
            self.assertEqual(sync.sync(documents, path, True)["status"], "initial")
            initial = path.read_bytes()
            self.assertEqual(sync.sync(documents, path)["status"], "unchanged")
            self.assertEqual(initial, path.read_bytes())


if __name__ == "__main__":
    unittest.main()
