# Work tracking and documentation integration evidence

Editorial working record; exclude via `.mintignore`. No publication or live customer-connection testing was performed by this author. All guides are drafts pending screenshot capture and deployed-feature review.

## Scope and method

Source snapshot: `branch-demo` at `868cce7eb0`, read-only checkout at `/Users/colejcummins/Documents/Codex/2026-11-01/can-we-give/work/branch-demo`.

Guide structure: capabilities → prerequisites → connection steps → verification → troubleshooting → disconnection. Shared write-back sections only where the source exposes a setting and AI write tools. Flow UI text is used for field/button labels. Manual screenshot placeholders are MDX comments, so unavailable images do not render or break the draft site.

No credentials, tenant data, live source records, or GovCloud endpoints were accessed. Source review of generic authentication code does not establish production deployment or vendor account policy. Setup guides reference external product labels already present in Flow's UI rather than introducing unverified detailed vendor menu paths.

All shared connection management endpoints use `RequiresAdmin`; `backend/src/auth/jwt.strategy.ts` documents these workspace-wide routes as all-project-admin by default. `frontend/src/integration-urls.ts`, `frontend/src/components/settings/integrations-page.tsx`, and `backend/src/llms/ai-integration-config.service.ts` show installation endpoint gates and AI availability gates. Guides therefore do not claim universal availability.

## Jira

- UI: `frontend/src/components/settings/jira-integration-page.tsx` — personal OAuth/API credential controls, shared site/project controls, write-back, all-project-admin UI, external collaborator behavior, site selection, default first project.
- Auth/API: `backend/src/jira-integration/jira-integration.controller.ts`, `jira-oauth.service.ts`, `jira-api-key.service.ts` — personal credentials and identity, scopes (`read:jira-work`, `write:jira-work`, `read:jira-user`, `offline_access`), installation-selected authentication mode.
- Behavior: `backend/src/jira-integration/jira-integration.service.ts` — linked project search/create targets, direct issue reads/edits use current user's Jira permission, project validation, last-project removal restriction.
- Important disconnect distinction: shared integration removal preserves OAuth connections but removes saved API-token credentials. Personal disconnection does not remove shared configuration or other users' credentials.
- Release evidence: `CHANGELOG.md` 3.0.6 (July 13, 2026) API-key mode/Data Center; docs `release-notes/2026-09-18.mdx` multiple-site selection; `2026-10-09.mdx` issue search/details; `2026-10-23.mdx` external collaborators.
- No statement that linked projects form a permission boundary. No instructions to contact any regulated endpoint.

## Asana

- UI: `frontend/src/components/settings/asana-integration-page.tsx` — token, numeric Workspace GID/Project GID, test/save, write-back, disconnect.
- API: `backend/src/asana-integration/asana-integration.controller.ts` — admin mutation/test operations.
- Behavior: `backend/src/asana-integration/asana-integration.service.ts` — token/workspace/project test, configured-project listings/create, workspace-wide typeahead search, direct task edit, sections and task moves.
- Important scope limit: project GID is not an authorization boundary. Search covers the workspace, and direct task operations use token permissions.
- Release evidence: `CHANGELOG.md` and docs `release-notes/2026-10-30.mdx` explicitly mention Asana action rendering. This corroborates an existing integration, not initial ship date or every permission behavior.

## Notion

- UI: `frontend/src/components/settings/notion-integration-page.tsx` — create internal integration, share pages through Connections, integration token, test/save and disconnect.
- API/service: `backend/src/notion-integration/notion-integration.controller.ts` and `notion-integration.service.ts` — page search/read only, table content, shared token, bounded rate-limit retry.
- Important test limit: test uses page_size=1; its displayed count is not total accessible pages. Guide explicitly avoids presenting it as an inventory.
- Release evidence: docs `release-notes/2026-09-18.mdx` and `2026-09-25.mdx` rate-limit behavior, corroborated in CHANGELOG.

## Confluence

- UI: `frontend/src/components/settings/confluence-integration-page.tsx` — Cloud vs Data Center, hostname/email/API token vs HTTPS base URL/PAT, optional space key, test/save, write-back.
- API/service: `backend/src/confluence-integration/confluence-integration.controller.ts`, `confluence-integration.service.ts`, and `confluence-client.ts` — shared credentials, server approval, search/list/read/create/update, current-version updates and 409 handling.
- AI gates/tools: `backend/src/llms/ai-integration-config.service.ts` and `ai.service.ts` — write-back gates actual page create/update tools.
- Important scope limit: Space Key scopes search/default listing/create; it does not constrain direct reads/updates. Account permissions remain the security boundary.
- Release evidence: CHANGELOG 3.0.6 (July 13, 2026) Data Center requires configuration; docs `release-notes/2026-10-23.mdx` full-page reading. **No explicit Confluence write-back entry was found in CHANGELOG or current release notes.** Source implements it; verify deployed audience before publishing that capability. No beta label invented because no off-by-default feature flag beyond the intentional write-back permission setting was identified.

## Qase

- UI: `frontend/src/components/settings/qase-integration-page.tsx` — token test, project picker/manual codes, replace token, save/disconnect.
- API/service: `backend/src/qase-integration/qase-integration.controller.ts`, `qase-integration.service.ts`, `qase-client.ts` — search and verification read operations, project membership validation for explicit verification requests, bounded latest-result scan, status mapping.
- AI: `backend/src/llms/ai.service.ts` Qase tools — search entities case/run/result/defect/plan/requirement, result mapping, first-project default, bounded filters.
- Important scope limit: project codes do not restrict search; token permissions govern account-wide search. Verification results are reads; no implicit field synchronization or Qase write-back is promised.
- Release evidence: docs `release-notes/2026-09-18.mdx` Qase TestOps and CHANGELOG corresponding release.

## Relyence

- UI: `frontend/src/components/settings/relyence-integration-page.tsx` — API key plus username/password, test-only analysis ID, save credentials, separate Link analysis, exactly one analysis, write-back.
- API/service: `backend/src/relyence-integration/relyence-integration.controller.ts`, `relyence-integration.service.ts`, `relyence-client.ts` — credential token exchange, linked analysis validation, subsystem/function read/insert/update.
- AI gate: `backend/src/llms/ai-integration-config.service.ts` requires credentials, approved endpoint, and at least one linked analysis before exposing tools.
- Important setup distinction: entering Analysis ID in the connection test never links it. Guide explicitly separates save credentials and Link analysis.
- Release evidence: CHANGELOG 3.0.2 (June 15, 2026) Relyence integration; docs `release-notes/2026-10-30.mdx` Relyence action rendering. Neither is an exhaustive contract for the current source snapshot.

## Screenshots still required

Capture real, sanitized screens. Annotate each with numbered control callouts, a short caption, and the skill's “Requires human intervention” banner. Match the instructions beside the corresponding placeholder. Never include tokens, passwords, customer records, personal identities, or real tenant names. Do not generate synthetic product screenshots.

### Jira

- `images/jira-authorize.png` — Authorize a personal Atlassian connection.
- `images/jira-site.png` — Select the shared Jira site in Flow.
- `images/jira-projects.png` — Add linked Jira projects in Flow.
- `images/jira-api-instance.png` — Configure the Jira instance for token authentication.
- `images/jira-api-credential.png` — Save a personal Jira API credential.
- `images/jira-api-test.png` — Test the saved Jira credential.
- `images/jira-write-back.png` — Enable Jira write-back in Flow.
- `images/jira-disconnect.png` — Disconnect a personal Jira connection.
- `images/jira-remove-workspace.png` — Remove the shared Jira integration.

### Asana

- `images/asana-token.png` — Create an Asana personal access token.
- `images/asana-settings.png` — Enter the Asana token and numeric IDs in Flow.
- `images/asana-test-save.png` — Test and save the Asana connection.
- `images/asana-write-back.png` — Enable Asana write-back in Flow.
- `images/asana-disconnect.png` — Disconnect Asana in Flow.

### Notion

- `images/notion-create-integration.png` — Create a Notion internal integration.
- `images/notion-share-page.png` — Share a Notion page with the integration.
- `images/notion-token.png` — Enter the Notion integration token in Flow.
- `images/notion-test-save.png` — Test and save the Notion connection.
- `images/notion-page-access.png` — Manage page access for the Notion integration.
- `images/notion-disconnect.png` — Disconnect Notion in Flow.

### Confluence

- `images/confluence-token.png` — Prepare a Confluence API token or personal access token.
- `images/confluence-settings.png` — Choose the Confluence instance type and enter credentials.
- `images/confluence-space.png` — Set the optional Confluence space key.
- `images/confluence-test-save.png` — Test and save the Confluence connection.
- `images/confluence-write-back.png` — Enable Confluence write-back in Flow.
- `images/confluence-disconnect.png` — Disconnect Confluence in Flow.

### Qase

- `images/qase-api-token.png` — Prepare a Qase token with the required access.
- `images/qase-test.png` — Test a Qase API token in Flow.
- `images/qase-projects.png` — Choose Qase project codes in Flow.
- `images/qase-save.png` — Save and inspect the Qase connection.
- `images/qase-replace-token.png` — Replace the saved Qase token.
- `images/qase-disconnect.png` — Disconnect Qase in Flow.

### Relyence

- `images/relyence-api-key.png` — Generate a Relyence API key.
- `images/relyence-test.png` — Enter and test Relyence credentials in Flow.
- `images/relyence-save.png` — Save the Relyence credentials.
- `images/relyence-link-analysis.png` — Link a Relyence analysis in Flow.
- `images/relyence-write-back.png` — Enable Relyence write-back in Flow.
- `images/relyence-change-analysis.png` — Replace the linked Relyence analysis.
- `images/relyence-disconnect.png` — Disconnect Relyence in Flow.

