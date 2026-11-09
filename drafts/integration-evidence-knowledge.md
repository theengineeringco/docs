# Knowledge and developer integration guide evidence

Draft source snapshot: `branch-demo` commit `868cce7eb0` in `/Users/colejcummins/Documents/Codex/2026-11-01/can-we-give/work/branch-demo`. Read-only inspection; no source changes. Guides are authored in the dedicated documentation worktree. This record is editorial material and belongs under the `drafts` exclusion in `.mintignore`.

All five pages use the Linear guide's structure and Flow house style. The outline is capabilities → prerequisites/authentication → connection → verification → management/troubleshooting → disconnect. Public steps use exact current UI labels. Screenshots are not fabricated: each required screenshot is a skill-format image placeholder inside an MDX comment, so missing assets do not render broken images.

## Common permissions

`backend/src/allowed_schema/allowed_schema.guard.ts:359` requires all-project admin permission for workspace-wide `@RequiresAdmin` routes. All guide prerequisites reflect that requirement even where UI hooks use the broader `useIsAdmin` flag. Flow AI enablement is required for agent capabilities. No account credentials, customer content, or live third-party account data were inspected.

## Google Drive

Sources:

- `frontend/src/components/settings/google-integration-page.tsx`: exact Connect Google, Connected to Google, Drive scope, folder mount, write-back, reconnect and removal labels; personal OAuth separate from workspace scope.
- `backend/src/google-integration/google-integration.controller.ts`: personal connect/disconnect allowed for read-only members; admin-only mount, restrictions, write-back and removal.
- `backend/src/google-integration/google-oauth.service.ts:38`: identity/email plus read-only Drive/Docs, conditional read/write Sheets scope; per-user grants.
- `backend/src/google-integration/google-integration.service.ts`: scope enforcement, write-back checks, removal preserves personal grants.
- Source CHANGELOG 3.0.5 (July 2) introduces Google Drive with configuration; 3.0.13 (August 5) records opt-in Sheets write-back. Public `release-notes/2026-08-07.mdx` records Sheets write-back and `release-notes/2026-09-25.mdx` records read-only users connecting Google.

Limits: UI displays restriction lists but exposes a folder mount picker, so guide does not invent a multi-file restriction editor. Google Docs and Drive stay read-only. No claim of universal deployment availability. No live OAuth/test/write operation performed.

## Microsoft SharePoint

Sources:

- `frontend/src/components/settings/sharepoint-integration-page.tsx`: exact Connect Microsoft, Enable SharePoint for workspace, AI access scope, Limit access to a folder, Allow all accessible files, Disconnect my account, Disable SharePoint for workspace labels.
- `frontend/src/integrations-catalog.tsx`: SharePoint/OneDrive capabilities, conditional GCC label.
- `backend/src/sharepoint-integration/sharepoint-integration.controller.ts`: personal connect/disconnect not opted into read-only access; workspace changes and picker are admin-only.
- `backend/src/sharepoint-integration/sharepoint-oauth.service.ts:49`: delegated `User.Read`, `Files.Read.All`, `Sites.Read.All`, identity and offline permissions; read-only integration.
- `backend/src/sharepoint-integration/sharepoint-integration.service.ts`: personal token access, scope enforcement, site-search fallback, Word/Excel reads, shared removal keeps personal grants.
- Source CHANGELOG 3.0.8 (July 14) records optional mount and AI read tools, requires configuration and hidden when unconfigured.

Limits: no live Microsoft account, Microsoft 365 tenant, or GovCloud data accessed. No special-cloud setup instructions added. Current source labels are documented; review the deployed UI before public publication. Source git history for page most recently lists August 21 changes, so labels are not presumed newly shipped November 1. Public release-note search did not provide a detailed SharePoint setup record. The initial site/library list is bounded; guide directs site search rather than claiming enumeration is exhaustive.

## AoDocs

Sources:

- `frontend/src/components/settings/aodocs-integration-page.tsx`: personal Connect AoDocs, Library scope, mount/change library, shared removal controls.
- `backend/src/aodocs-integration/aodocs-integration.controller.ts`: personal OAuth allowed for read-only members; shared settings admin-only.
- `backend/src/aodocs-integration/aodocs-oauth.service.ts:34`: identity/email scopes only, explicitly no Google Drive scopes.
- `backend/src/aodocs-integration/aodocs-integration.service.ts:286`: default mounted-library search can be overridden by explicit libraryId; document reads depend on account access, not a mount check. Search results metadata, readDocument plain text, preview leading text. Shared removal preserves personal tokens.
- Source CHANGELOG 3.0.11 (July 31) and 3.0.12 (August 3): integration and production OAuth require configuration. Public `release-notes/2026-09-25.mdx` confirms read-only personal connection support.

Important boundary: mounted library is a DEFAULT SEARCH SCOPE, not an access-control boundary. Guide says this explicitly and avoids promising strict isolation. Google Drive/AoDocs connections are separate. No Drive file ingestion or attachment ingestion claim. Search fan-out is bounded; missing broad-search results require narrowing, not assumptions about access.

## Cursor

Sources:

- `frontend/src/components/settings/cursor-integration-page.tsx`: API Key, Default Repository, Default Branch / Ref, Test Connection, Save and Disconnect. Connected card has no edit form.
- `backend/src/cursor-integration/cursor-integration.controller.ts`: workspace management/test admin-only.
- `backend/src/cursor-integration/cursor-integration.service.ts`: `owner/repo` validation; test validates API key without launching; launch requires default_repo, always uses configured repo/ref, sets autoCreatePr and returns tracking URL.
- `backend/src/llms/ai-integration-config.service.ts:571`: configured integration plus Cursor API/app/GitHub URLs gates agent availability.
- `backend/src/llms/ai.service.ts:18088`: tool schema accepts prompt and optional branchName, no repo/ref override.

Important discrepancy: UI says repository/ref optional and overridable per request. Backend requires default_repo and does not expose per-request repo/ref. Guide follows actual backend contract and calls out the necessary repository. The AI tool's prose also mentions stale repo/ref behavior; no such instructions were copied.

Release limit: source and public release-note searches did not find a Cursor integration-specific release entry. This guide is reviewable source-based draft, not a verified claim that Cursor is available to every customer. Confirm supported audience and deployed availability before publishing. No external Cursor UI was inspected, so API-key creation is described without invented menu paths. No agent task launched.

## Custom MCP

Sources:

- `frontend/src/components/settings/mcp-integration-page.tsx`: all-project admin visibility, None/Bearer token/OAuth auth, optional client registration, displayed redirect URL, Finish connecting, Allowed tools, disabled new connections, test/refresh/remove confirmation.
- `backend/src/mcp-connections/mcp-connections.controller.ts`: admin-only management.
- `backend/src/mcp-connections/mcp-connections.service.ts`: StreamableHTTPClientTransport, public HTTPS/internal-network gate, rejects URL query parameters, reselect changed tools, disabled if no allowed tools, external and what-if restrictions.
- Source CHANGELOG 3.0.19 (September 8) records custom MCP addition; public `release-notes/2026-10-09.mdx:184` confirms OAuth authorization-server binding and recreate guidance.
- Existing `/api/mcp/overview` is linked for opposite-direction Flow MCP access from external clients.

Limits: no blanket compatibility with SSE-only or local stdio servers. No assumption that discovery enables tools. Private-network access requires deployment configuration. Tools operate with shared connection credentials and can create external side effects. No server connected or external tools executed.

## Screenshots required before publication

Capture only a clean demonstration workspace and redact account identifiers, secrets, customer content and URLs. Add numbered control callouts, short captions, and the skill-required “Requires human intervention” banner. Match each placeholder name below. These are actual UI captures, not generated approximations.

- Google: `google-connect.png`, `google-authorize.png`, `google-scope.png`, `google-write-back.png`, `google-reconnect.png`, `google-change-scope.png`, `google-disconnect.png`, `google-remove-workspace.png`.
- SharePoint: `sharepoint-connect.png`, `sharepoint-authorize.png`, `sharepoint-enable.png`, `sharepoint-scope.png`, `sharepoint-change-scope.png`, `sharepoint-disconnect.png`, `sharepoint-disable.png`.
- AoDocs: `aodocs-connect.png`, `aodocs-authorize.png`, `aodocs-library.png`, `aodocs-change-library.png`, `aodocs-disconnect.png`, `aodocs-remove-workspace.png`.
- Cursor: `cursor-api-key.png`, `cursor-configure.png`, `cursor-test-save.png`, `cursor-reconfigure.png`, `cursor-disconnect.png`.
- Custom MCP: `custom-mcp-server.png`, `custom-mcp-authentication.png`, `custom-mcp-authorize.png`, `custom-mcp-enable.png`, `custom-mcp-test.png`, `custom-mcp-refresh.png`, `custom-mcp-remove.png`.

Validation at handoff: five MDX files are 98–112 lines; `git diff --check` passes. Full Mintlify validation remains with parent owner after all guide/navigation changes are integrated. No commits or navigation/config edits made by this subtask.
