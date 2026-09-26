#!/usr/bin/env python3
"""Snapshot public deployed customer OpenAPI contracts. No customer data is fetched."""
import argparse
import copy
import hashlib
import json
import os
import re
from pathlib import Path
import sys
from concurrent.futures import ThreadPoolExecutor
from urllib.request import Request, urlopen

SOURCES = {
    "Production": "https://backend.branch.flowengineering.com",
    "RVT": "https://backend.rvtech.branch.flowengineering.com",
    "Rivian": "https://backend.rivian.branch.flowengineering.com",
}
METHODS = {"get", "put", "post", "delete", "options", "head", "patch", "trace"}
# UI support identity is not part of the integration reference.
EXCLUDED_PATHS = {"/pylon-identity/token"}
TAG_NAMES = {"Branch": "Branches", "ai": "Automations"}
PAGE_TITLES = {
    "get /ai/trigger/branch/checks": "Get branch automation checks",
    "get /ai/trigger/branch/status": "Get branch automation status",
    "get /notifications/feed": "List notifications",
    "post /notifications/feed/read-all": "Mark all notifications read",
    "get /notifications/feed/unread-count": "Count unread notifications",
    "patch /notifications/feed/{id}/read": "Mark a notification read",
    "patch /notifications/feed/{id}/unread": "Mark a notification unread",
    "get /notifications/preferences": "Get notification preferences",
    "patch /notifications/preferences": "Update notification preferences",
    "get /notifications/subscribers": "List subscribers",
    "delete /notifications/subscriptions": "Remove a subscription",
    "post /notifications/subscriptions": "Create a subscription",
    "get /notifications/subscriptions/status": "Get subscription status",
    "post /project/{projectId}/branch/{id}/protect": "Protect a branch",
    "post /project/{projectId}/branch/{id}/unprotect": "Unprotect a branch",
    "post /project/{projectId}/branch/{id}/set-require-review": "Set branch review requirements",
    "get /users/by-ids": "Get users by ID",
    "post /users/invite/bulk": "Invite users in bulk",
    "post /users/invite/bulk-detailed": "Invite users with roles and access",
    "get /users/with-permissions": "List users with permissions",
}
EDITORIAL_KEYS = {"description", "summary", "example", "examples", "externalDocs", "x-mint"}


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def fingerprint(value):
    return hashlib.sha256(canonical(value).encode()).hexdigest()


def walk(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk(child)


def validate(spec):
    if not isinstance(spec, dict) or not str(spec.get("openapi", "")).startswith("3."):
        raise ValueError("Expected an OpenAPI 3 document")
    if not isinstance(spec.get("info"), dict) or not spec["info"].get("title") or not spec["info"].get("version"):
        raise ValueError("OpenAPI info.title and info.version are required")
    paths = spec.get("paths")
    if not isinstance(paths, dict) or not paths:
        raise ValueError("OpenAPI paths must be a nonempty object")
    operations = 0
    for path, item in paths.items():
        if not path.startswith("/") or not isinstance(item, dict):
            raise ValueError(f"Invalid path item: {path}")
        for method in METHODS.intersection(item):
            op = item[method]
            if not isinstance(op, dict) or not isinstance(op.get("responses"), dict) or not op["responses"]:
                raise ValueError(f"Missing responses: {method.upper()} {path}")
            operations += 1
    if not operations:
        raise ValueError("OpenAPI document contains no operations")


def without_server_noise(spec):
    """Ignore deployment host overrides, never a schema property named servers."""
    spec = copy.deepcopy(spec)
    spec.pop("servers", None)
    for item in spec["paths"].values():
        item.pop("servers", None)
        for method in METHODS.intersection(item):
            item[method].pop("servers", None)
    return spec


def component_for_ref(ref, components):
    if not isinstance(ref, str) or not ref.startswith("#/components/"):
        raise ValueError(f"Unsupported non-component reference: {ref}")
    parts = [p.replace("~1", "/").replace("~0", "~") for p in ref[2:].split("/")]
    if len(parts) < 3:
        raise ValueError(f"Invalid component reference: {ref}")
    current = {"components": components}
    try:
        for part in parts:
            current = current[int(part)] if isinstance(current, list) else current[part]
    except (KeyError, IndexError, ValueError, TypeError) as exc:
        raise ValueError(f"Unresolved reference: {ref}") from exc
    return parts[1], parts[2]


def prune_components(spec):
    components = spec.pop("components", {})
    kept = {}
    pending = [spec]
    seen = set()
    while pending:
        for node in walk(pending.pop()):
            references = []
            if "$ref" in node:
                references.append(component_for_ref(node["$ref"], components))
            for security in node.get("security", []) if isinstance(node.get("security"), list) else []:
                references.extend(("securitySchemes", name) for name in security)
            discriminator = node.get("discriminator")
            if isinstance(discriminator, dict):
                for ref in discriminator.get("mapping", {}).values():
                    references.append(component_for_ref(ref, components) if ref.startswith("#/") else ("schemas", ref))
            for group, name in references:
                if (group, name) in seen:
                    continue
                if name not in components.get(group, {}):
                    raise ValueError(f"Unresolved component: {group}/{name}")
                seen.add((group, name))
                value = components[group][name]
                kept.setdefault(group, {})[name] = value
                pending.append(value)
    spec["components"] = kept
    return spec


def prepare(spec):
    validate(spec)
    spec = without_server_noise(spec)
    for path in EXCLUDED_PATHS:
        spec["paths"].pop(path, None)
    validate(spec)
    spec = prune_components(spec)
    used_tags = set()
    for path, item in spec["paths"].items():
        for method in METHODS.intersection(item):
            op = item[method]
            # Link identity follows the route, so editorial title changes do not
            # break bookmarks. Keep the full source description in the spec.
            slug = re.sub(r"[^a-z0-9]+", "-", f"{method}-{path}".lower()).strip("-")
            title = PAGE_TITLES.get(f"{method} {path}", op.get("summary", f"{method.upper()} {path}"))
            op["x-mint"] = {"href": f"/api/endpoints/{slug}", "metadata": {"title": title, "sidebarTitle": title}}
            if "tags" in op:
                op["tags"] = list(dict.fromkeys(TAG_NAMES.get(tag, tag) for tag in op["tags"]))
                used_tags.update(op["tags"])
    tags = {}
    for tag in spec.get("tags", []):
        tag["name"] = TAG_NAMES.get(tag["name"], tag["name"])
        if tag["name"] in used_tags:
            tags[tag["name"]] = tag
    spec["tags"] = [tags.get(name, {"name": name}) for name in sorted(used_tags)]
    spec["servers"] = [{"url": url, "description": name} for name, url in SOURCES.items()]
    # Replace Swagger's shorthand routes and embedded changelog with the
    # maintained API-only guides. Endpoint and schema descriptions are retained.
    spec["info"]["description"] = (
        "Flow customer API reference. Start with the [quickstart](/api/quickstart) "
        "and [authentication guide](/api/authentication)."
    )
    return spec


def contract(value, context="object"):
    """Remove annotation fields without erasing schema properties with those names."""
    if isinstance(value, list):
        return [contract(v) for v in value]
    if not isinstance(value, dict):
        return value
    result = {}
    # Keys in these objects are user-defined identifiers, not OpenAPI keywords.
    maps = {"properties", "schemas", "paths", "responses", "headers", "content", "securitySchemes", "parameters", "requestBodies", "links", "callbacks", "encoding", "patternProperties", "$defs", "definitions", "mapping"}
    for key, child in value.items():
        if context != "map" and key in EDITORIAL_KEYS:
            continue
        result[key] = contract(child, "map" if context != "map" and key in maps and isinstance(child, dict) else "object")
    return result


def classify(old, new):
    if canonical(old) == canonical(new):
        return "unchanged", []
    # Treat uncertain structural changes as review-required. Only wholly new
    # endpoints/components and editorial improvements may publish automatically.
    before, after = contract(old), contract(new)
    changes = []
    for key in set(before) | set(after):
        if key in {"paths", "components", "tags"}:
            continue
        if before.get(key) != after.get(key):
            changes.append(f"Changed API metadata or global contract: {key}")
    for path, item in before["paths"].items():
        if path not in after["paths"]:
            changes.append(f"Removed path: {path}")
            continue
        next_item = after["paths"][path]
        for key, value in item.items():
            if next_item.get(key) != value:
                changes.append(f"Changed or removed: {key.upper()} {path}")
        for key in set(next_item) - set(item) - METHODS:
            changes.append(f"Added path-level contract: {key} {path}")
    for group, entries in before.get("components", {}).items():
        for name, value in entries.items():
            if after.get("components", {}).get(group, {}).get(name) != value:
                changes.append(f"Changed or removed component: {group}/{name}")
    return ("review" if changes else "compatible"), changes


def environment_changes(documents):
    baseline = without_server_noise(documents["Production"])
    changes = ["Deployed customer API documents differ across environments. Existing reference retained."]
    for name, source in documents.items():
        if name == "Production":
            continue
        other = without_server_noise(source)
        for path in sorted(set(baseline["paths"]) | set(other["paths"])):
            before, after = baseline["paths"].get(path, {}), other["paths"].get(path, {})
            for method in sorted(METHODS.intersection(set(before) | set(after))):
                if before.get(method) != after.get(method):
                    kind = "Added" if method not in before else "Removed" if method not in after else "Changed"
                    changes.append(f"{name} vs Production: {kind} operation {method.upper()} {path}")
            if {k: v for k, v in before.items() if k not in METHODS} != {k: v for k, v in after.items() if k not in METHODS}:
                changes.append(f"{name} vs Production: Changed path-level contract {path}")
        before, after = baseline.get("components", {}), other.get("components", {})
        for group in sorted(set(before) | set(after)):
            for component in sorted(set(before.get(group, {})) | set(after.get(group, {}))):
                if before.get(group, {}).get(component) != after.get(group, {}).get(component):
                    changes.append(f"{name} vs Production: Changed component {group}/{component}")
        for key in sorted((set(baseline) | set(other)) - {"paths", "components"}):
            if baseline.get(key) != other.get(key):
                changes.append(f"{name} vs Production: Changed document field {key}")
    return changes


def fetch(name_url):
    name, url = name_url
    request = Request(url + "/customer-api-json", headers={"Accept": "application/json", "User-Agent": "Flow-API-docs-sync/1.0"})
    with urlopen(request, timeout=45) as response:
        # Bound unexpected responses to 20 MB and reject HTML/login/error bodies.
        data = response.read(20_000_001)
        if len(data) > 20_000_000:
            raise ValueError(f"{name}: response exceeds 20 MB")
        spec = json.loads(data)
    validate(spec)
    return name, spec


def sync(documents, target, initialize=False):
    if set(documents) != set(SOURCES):
        raise ValueError("Every configured environment must be fetched successfully")
    for spec in documents.values():
        validate(spec)
    hashes = {name: fingerprint(without_server_noise(spec)) for name, spec in documents.items()}
    # Compare the entire deployed document, including unused schemas, before
    # pruning. Even currently undocumented tenant drift requires human review.
    if len(set(hashes.values())) != 1:
        return {"status": "divergent", "hashes": hashes, "changes": environment_changes(documents)}
    new = prepare(documents["Production"])
    if target.exists():
        old = json.loads(target.read_text())
        validate(old)
        status, changes = classify(old, new)
    elif initialize:
        status, changes = "initial", []
    else:
        raise ValueError("Committed API snapshot missing; initialize it explicitly after review")
    report = {"status": status, "hashes": hashes, "changes": changes, "paths": len(new["paths"]), "operations": sum(len(METHODS.intersection(item)) for item in new["paths"].values()), "schemas": len(new["components"].get("schemas", {}))}
    if status != "unchanged":
        # A review candidate is written locally, but the workflow only publishes
        # it on the dedicated review branch. The default branch stays intact.
        target.parent.mkdir(parents=True, exist_ok=True)
        temp = target.with_suffix(".json.tmp")
        temp.write_text(json.dumps(new, indent=2, sort_keys=True, ensure_ascii=False) + "\n")
        temp.replace(target)
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=Path("openapi/customer-api.json"))
    parser.add_argument("--report", type=Path, default=Path("/tmp/customer-api-sync-report.json"))
    parser.add_argument("--initialize", action="store_true", help="Allow creation of the first reviewed snapshot")
    args = parser.parse_args()
    try:
        with ThreadPoolExecutor(max_workers=len(SOURCES)) as pool:
            documents = dict(pool.map(fetch, SOURCES.items()))
        report = sync(documents, args.output, args.initialize)
    except Exception as exc:
        report = {"status": "failed", "changes": [str(exc)]}
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2) + "\n")
    if os.environ.get("GITHUB_OUTPUT"):
        with open(os.environ["GITHUB_OUTPUT"], "a") as output:
            output.write(f"status={report['status']}\n")
    print(json.dumps(report, indent=2))
    return 1 if report["status"] == "failed" else 0


if __name__ == "__main__":
    sys.exit(main())
