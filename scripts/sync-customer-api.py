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
# Mintlify shows an operation's description as the page subheader. Source
# descriptions are written for agents and can run to a paragraph, so the page
# leads with a short plain-text blurb and the detail moves into the page body.
SUBHEADER_MAX = 120
# Hand-written subheaders for operations whose first sentence is not a usable
# blurb (too long, a fragment, or a precondition rather than what it does).
PAGE_DESCRIPTIONS = {
    "get /ai/agents": "Lists the agent chats you created or can see, as summaries without transcripts.",
    "post /ai/agents": "Creates an agent chat and, when you include messages, starts the agent on them.",
    "get /ai/agents/{id}": "Returns an agent chat's full transcript with its current status.",
    "post /ai/agents/{id}/messages": "Queues a message and starts the agent on it as soon as the chat is idle.",
    "patch /ai/agents/{id}/messages/{jobId}": "Chooses whether a queued message joins the running turn or waits for the next one.",
    "get /audit-log": "Lists user administration and review-policy changes across the workspace, newest first.",
    "post /convert/drawio-to-tldraw": "Converts draw.io or Flow diagram XML into a tldraw snapshot the diagram editor can load.",
    "post /convert/markdown-to-rich-text": "Converts a markdown string to rich text JSON for entity descriptions.",
    "post /convert/markdown-to-rich-text/batch": "Converts several markdown strings to rich text JSON, returned in the same order.",
    "post /convert/rich-text-to-markdown": "Converts rich text JSON back to a markdown string.",
    "post /convert/tldraw-to-xml": "Converts a tldraw snapshot into XML that encodes the diagram's hierarchy and geometry.",
    "get /project/{projectId}/agents": "Lists the project's persistent agents along with your own personal agents.",
    "post /project/{projectId}/agents": "Creates a project agent that works under its own bot user.",
    "get /project/{projectId}/agents/hand-triggers": "Lists the manual triggers that a project's agents offer in branch and item menus.",
    "delete /project/{projectId}/agents/{agentId}": "Archives a persistent agent, stopping future activation while keeping its conversations and memories.",
    "post /project/{projectId}/agents/{agentId}/triggers/{triggerId}/fire": "Starts a side chat with the agent, using the trigger's prompt on the chosen branch and items.",
    "get /project/{projectId}/audit-log": "Lists changes to a project's configuration, such as its data model, views, and automations, newest first.",
    "post /project/{projectId}/automations": "Creates an automation in the project's shared list or in your personal list.",
    "patch /project/{projectId}/automations/{automationId}": "Updates only the fields you send on an existing automation.",
    "get /project/{projectId}/branch/archived": "Lists deleted and merge-archived branches, newest first.",
    "post /project/{projectId}/branch/baseline/{baselineId}/revert": "Proposes a new branch whose changes undo a baseline, ready to review and merge.",
    "post /project/{projectId}/branch/{id}/auto-merge": "Turns on, or cancels, a merge that runs automatically once the branch meets every requirement.",
    "get /project/{projectId}/branch/{id}/awaiting-my-review-entities": "Lists the changed entities on a branch that await your review.",
    "get /project/{projectId}/branch/{id}/changed-entity-ids": "Lists the entities changed on a branch, each marked as created or updated.",
    "post /project/{projectId}/branch/{id}/delete": "Soft-deletes a branch so it no longer appears in branch lists.",
    "get /project/{projectId}/branch/{id}/deleted-entities": "Lists the entities deleted on a branch, newest first.",
    "post /project/{projectId}/branch/{id}/merge": "Starts a background merge of the branch into its parent and returns a job to poll.",
    "get /project/{projectId}/branch/{id}/merge-readiness": "Lists every blocker that would stop the branch from merging right now.",
    "post /project/{projectId}/branch/{id}/rebase-onto": "Replays a branch's changes onto a different parent as a new branch, leaving the original unchanged.",
    "post /project/{projectId}/branch/{id}/restore": "Restores a deleted branch, with any deleted ancestors it depends on, in one transaction.",
    "get /project/{projectId}/branch/{id}/restore-preview": "Lists the deleted branches a restore would bring back, root-most ancestor first.",
    "post /project/{projectId}/branch/{id}/revert-entity-to-point": "Returns an item to its state right after a chosen history entry.",
    "post /project/{projectId}/branch/{id}/set-owner": "Assigns a branch's owner, or takes ownership yourself when no user is named.",
    "get /project/{projectId}/branch/{id}/stage-gate-status": "Lists the stage-gate violations that would block merging the branch right now.",
    "put /project/{projectId}/data-model/{id}": "Updates a category's metadata and, optionally, its custom fields.",
    "post /project/{projectId}/data-model/{id}/fields/{fieldKey}/tag-options": "Adds missing options to a plain tag field without changing existing ones.",
    "get /project/{projectId}/diagram-symbols": "Lists the enabled diagram symbols with their authored sizes and terminal IDs.",
    "post /project/{projectId}/diagrams": "Creates or updates a diagram from a tldraw snapshot or structured input.",
    "post /project/{projectId}/entities/filter/query": "Returns the IDs of live entities that match typed field conditions, one page at a time.",
    "post /project/{projectId}/entities/restore/batch": "Restores several deleted entities in one transaction, with their fields, links, and position.",
    "get /project/{projectId}/entities/search": "Searches entity names and field values, or resolves exact Flow and Human IDs.",
    "post /project/{projectId}/entities/upsert": "Creates or updates many entities in one atomic call, writing only the values that changed.",
    "get /project/{projectId}/entities/{entityId}/comments": "Lists the comments that start conversations on an item or branch, or the replies in one thread.",
    "post /project/{projectId}/entities/{entityId}/comments": "Starts a conversation on an item or branch, or replies in an existing thread.",
    "delete /project/{projectId}/entities/{entityId}/comments/{commentId}": "Deletes a comment or reply. Only its author can delete it.",
    "get /project/{projectId}/entities/{entityId}/comments/{commentId}": "Returns one comment or reply, without the rest of its conversation.",
    "patch /project/{projectId}/entities/{entityId}/comments/{commentId}": "Edits a comment's text, or resolves and reopens its conversation.",
    "post /project/{projectId}/entities/{entityId}/restore": "Restores a deleted entity with the fields, links, and position it had when deleted.",
    "get /project/{projectId}/events": "Polls a project's branch changes and review events in delivery order, with a resumable cursor.",
    "post /project/{projectId}/files/request-upload": "Returns a temporary URL to upload a file's bytes to directly.",
    "post /project/{projectId}/files/request-uploads": "Returns a temporary upload URL for each of several files in one call.",
    "post /project/{projectId}/files/upload": "Uploads a file of up to 100 MB through the API as multipart form data.",
    "post /project/{projectId}/files/{id}/request-upload": "Returns a temporary URL that replaces an existing file's content while keeping its ID.",
    "get /project/{projectId}/files/{id}/url": "Returns a time-limited URL for downloading or viewing a file.",
    "post /project/{projectId}/import/pdf-page-image": "Renders one PDF page as a PNG image with its pixel dimensions.",
    "post /project/{projectId}/import/runs": "Starts a background import that reads a set of uploaded files page by page.",
    "get /project/{projectId}/import/runs/{runId}": "Reports how much of an import run has been read and what it has found so far.",
    "post /project/{projectId}/import/runs/{runId}/cancel": "Stops an import run. Chunks already read stay available.",
    "get /project/{projectId}/import/runs/{runId}/chunks": "Returns every chunk of an import run with the analysis it produced.",
    "get /project/{projectId}/import/runs/{runId}/output": "Returns an import run's entities, relationships, and notes merged across its chunks.",
    "post /project/{projectId}/reqif-import/upload": "Creates a ReqIF import job and returns a URL to upload the archive to.",
    "post /project/{projectId}/reqif-import/{jobId}/preview": "Previews one page of the items a ReqIF import commit would create or update, without writing.",
    "get /project/{projectId}/symbol-libraries": "Lists the symbol libraries the diagram shape picker offers in this project.",
    "get /project/{projectId}/views/saved": "Lists the project's shared saved views in display order.",
    "post /project/{projectId}/views/saved": "Creates a shared saved view visible to every project member.",
    "patch /project/{projectId}/views/saved/{viewId}": "Updates only the fields you send on a shared saved view.",
    "delete /project/{projectId}/views/saved/{viewId}/relationships": "Removes one nesting rule from a shared saved view and keeps its other rules.",
    "post /project/{projectId}/views/saved/{viewId}/relationships": "Adds a nesting rule to a shared saved view and keeps its existing rules.",
    "post /reqif/parse": "Previews the entities and links a ReqIF document would import, without creating anything.",
    "get /review-policy": "Returns the conditions a branch must meet to merge and who may override them.",
    "delete /user-groups/{id}": "Deletes a user group. Stage gates that reference it lose those reviewers.",
    "patch /users/{id}/name": "Replaces a user's name fields in this workspace.",
}
EDITORIAL_KEYS = {"description", "summary", "example", "examples", "externalDocs", "x-mint"}
# These containers use user-defined keys rather than OpenAPI keywords.
NAMED_MAPS = {"properties", "schemas", "paths", "responses", "headers", "content", "securitySchemes", "parameters", "requestBodies", "links", "callbacks", "encoding", "patternProperties", "$defs", "definitions", "mapping"}
PRIVATE_TERMS = re.compile(r"\b(?:tenants?|environments?|rivian|rvt)\b|backend\.rvtech", re.IGNORECASE)


def public_wording(value, context="object"):
    """Normalize editorial wording without changing wire names or example data."""
    if isinstance(value, list):
        return [public_wording(child) for child in value]
    if not isinstance(value, dict):
        return value
    result = {}
    for key, child in value.items():
        if context != "map" and key in {"description", "summary", "title"} and isinstance(child, str):
            child = re.sub(r"\bcustomer/tenant\b", "Workspace", child, flags=re.IGNORECASE)
            child = re.sub(r"\btenant(s?)\b", lambda match: "workspace" + match[1], child, flags=re.IGNORECASE)
        # Examples and vendor extensions are arbitrary payloads. Leave them intact.
        elif context != "map" and (key in {"example", "examples", "default", "enum", "const"} or key.startswith("x-")):
            result[key] = child
            continue
        result[key] = public_wording(child, "map" if context != "map" and key in NAMED_MAPS and isinstance(child, dict) else "object")
    return result


def validate_public_spec(spec):
    # A new term in wire names, examples, or unhandled prose needs human review,
    # never a silent rewrite of the API contract or an automatic publication.
    if PRIVATE_TERMS.search(canonical(spec)):
        raise ValueError("Public API wording policy failed; retain the published reference and review the source text")
    for obj in walk(spec):
        for key in ("description", "summary"):
            if isinstance(obj.get(key), str) and re.search(r"```[^\n]*\n(?:(?!```).)*\bcurl\b", obj[key], re.DOTALL):
                raise ValueError("Inline cURL examples need reviewed Python and JavaScript alternatives")


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


def plain_blurb(text):
    """Return text when it can stand alone as a page subheader, else None."""
    text = (text or "").strip()
    if not text or len(text) > SUBHEADER_MAX or "\n" in text or re.search(r"[`*_\[\]<>{}|]", text):
        return None
    return text if text[-1] in ".!?" else None


def mdx_body(text):
    """Escape prose for MDX while leaving code spans and fences literal."""
    parts = re.split(r"(```.*?```|`[^`\n]*`)", text, flags=re.DOTALL)
    for index in range(0, len(parts), 2):
        parts[index] = parts[index].replace("<", "&lt;").replace("{", "&#123;").replace("}", "&#125;")
    return "".join(parts)


def page_copy(key, description):
    """Split a source description into (subheader, body markdown or None)."""
    description = (description or "").strip()
    if key in PAGE_DESCRIPTIONS:
        return PAGE_DESCRIPTIONS[key], mdx_body(description) if description else None
    if len(description) <= SUBHEADER_MAX and "\n" not in description:
        return description, None
    paragraphs = description.split("\n\n", 1)
    sentences = re.split(r"(?<=[.!?])\s+(?=[A-Z(\"])", paragraphs[0], maxsplit=1)
    lead = plain_blurb(sentences[0])
    if lead is None:
        # No usable blurb: publish no subheader rather than a wall of text.
        return "", mdx_body(description)
    remainder = "\n\n".join(part for part in (sentences[1] if len(sentences) > 1 else "", paragraphs[1] if len(paragraphs) > 1 else "") if part.strip())
    return lead, mdx_body(remainder) if remainder else None


def subheaders_to_review(spec):
    """Long descriptions published with an automatic (or no) subheader."""
    return sorted(
        f"{method.upper()} {path}"
        for path, item in spec["paths"].items()
        for method in METHODS.intersection(item)
        if f"{method} {path}" not in PAGE_DESCRIPTIONS and "content" in item[method].get("x-mint", {})
    )


def prepare(spec):
    validate(spec)
    spec = without_server_noise(spec)
    for path in EXCLUDED_PATHS:
        spec["paths"].pop(path, None)
    validate(spec)
    spec = public_wording(prune_components(spec))
    used_tags = set()
    for path, item in spec["paths"].items():
        for method in METHODS.intersection(item):
            op = item[method]
            # Link identity follows the route, so editorial title changes do not
            # break bookmarks. Keep the full source description in the spec;
            # the page shows a short subheader with the detail in its body.
            slug = re.sub(r"[^a-z0-9]+", "-", f"{method}-{path}".lower()).strip("-")
            title = PAGE_TITLES.get(f"{method} {path}", op.get("summary", f"{method.upper()} {path}"))
            subheader, body = page_copy(f"{method} {path}", op.get("description"))
            op["x-mint"] = {"href": f"/api/endpoints/{slug}", "metadata": {"title": title, "sidebarTitle": title}}
            if subheader != (op.get("description") or "").strip():
                op["x-mint"]["metadata"]["description"] = subheader
            if body:
                op["x-mint"]["content"] = body
            if "tags" in op:
                op["tags"] = list(dict.fromkeys(TAG_NAMES.get(tag, tag) for tag in op["tags"]))
                used_tags.update(op["tags"])
    tags = {}
    for tag in spec.get("tags", []):
        tag["name"] = TAG_NAMES.get(tag["name"], tag["name"])
        if tag["name"] in used_tags:
            tags[tag["name"]] = tag
    spec["tags"] = [tags.get(name, {"name": name}) for name in sorted(used_tags)]
    # The app link selects a hosted API at runtime without listing deployments.
    spec["servers"] = [{
        "url": "{baseUrl}",
        "description": "Flow API",
        "variables": {"baseUrl": {"default": SOURCES["Production"]}},
    }]
    # Replace Swagger's shorthand routes and embedded changelog with the
    # maintained API-only guides. Endpoint and schema descriptions are retained.
    spec["info"]["description"] = (
        "Flow customer API reference. Start with the [quickstart](/api/quickstart) "
        "and [authentication guide](/api/authentication)."
    )
    validate_public_spec(spec)
    return spec


def contract(value, context="object"):
    """Remove annotation fields without erasing schema properties with those names."""
    if isinstance(value, list):
        return [contract(v) for v in value]
    if not isinstance(value, dict):
        return value
    result = {}
    # Keys in these objects are user-defined identifiers, not OpenAPI keywords.
    for key, child in value.items():
        if context != "map" and key in EDITORIAL_KEYS:
            continue
        result[key] = contract(child, "map" if context != "map" and key in NAMED_MAPS and isinstance(child, dict) else "object")
    return result


def classify(old, new):
    if canonical(old) == canonical(new):
        return "unchanged", []
    # Report existing contract changes separately from additions and editorial
    # changes. Both categories publish automatically after validation.
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
    return ("structural" if changes else "compatible"), changes


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
    report = {"status": status, "hashes": hashes, "changes": changes, "paths": len(new["paths"]), "operations": sum(len(METHODS.intersection(item)) for item in new["paths"].values()), "schemas": len(new["components"].get("schemas", {})), "subheaders_to_review": subheaders_to_review(new)}
    if status != "unchanged":
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
