# Engineering integration guide evidence

Draft editorial record; exclude from the published site through `.mintignore`.

Source snapshot: `branch-demo` commit `868cce7eb0`, read-only checkout at `/Users/colejcummins/Documents/Codex/2026-11-01/can-we-give/work/branch-demo`.

All six guides use the Flow integration settings UI for labels and flows, backend authorization/controller/service code for access boundaries, and `CHANGELOG.md` for release-level capabilities. No application data, credentials, customer content, or GovCloud data was accessed. No live provider sign-in or connection test was performed.

## Evidence by guide

### Onshape

- `frontend/src/components/settings/onshape-integration-page.tsx`: admin-only connection, server/key/document inputs, Test Connection/Save, webhook registration, write-back, disconnect labels.
- `backend/src/onshape-integration/onshape-integration.controller.ts`: RequiresAdmin guards; model lifecycle event handling; document webhook boundary; write-back guards for CAD writes.
- `backend/src/onshape-integration/onshape-integration.service.ts:190`: disconnect refuses while webhook remains registered.
- `backend/src/onshape-integration/onshape-plm.service.ts`: document data and CAD handling.
- `CHANGELOG.md:2986`: Enterprise host support; `CHANGELOG.md:4306`: read-only preview support. Existing CAD write APIs are not represented as a full CAD-edit tutorial; guide promises the settings page's variable-edit capability only.
- Access limit: document ID determines webhook target; service/controller CAD requests can address other documents available to the shared key. Guide does not claim document ID is an access boundary.

### Altium

- `frontend/src/components/settings/altium-integration-page.tsx`: personal OAuth, Connected to Altium, optional reconnect time, unavailable setup message, disconnect.
- `backend/src/altium-integration/altium-integration.controller.ts`: personal current-user access and AllowedForReadOnly connection management.
- `backend/src/altium-integration/altium-integration.service.ts`: tools require own connected account; only read queries; per-result size bound.
- `backend/src/altium-integration/altium-oauth.service.ts`: Nexar authorization.
- `CHANGELOG.md:1000`: initial read-only integration; **superseded availability at `CHANGELOG.md:250`** says EU now supported like other hosted deployments. Do not repeat the old not-yet-hosted limitation.
- Limit: authorization provider's live consent wording was not inspected. Guide asks readers to complete the actual displayed consent without inventing a scope-picker UI.

### Boltline

- `frontend/src/components/settings/boltline-integration-page.tsx`: shared admin-managed key from profile `/me`, Test Connection/Save, Boltline Write-Back.
- `backend/src/boltline-integration/boltline-integration.controller.ts`: admin guards for management.
- `backend/src/boltline-integration/boltline-integration.service.ts`: user-scoped key, BOM truncation reporting, work-plan steps, draft creation/revision, partial mutation result IDs.
- `CHANGELOG.md:2956`: BOMs and work-plan steps; `CHANGELOG.md:2962`: explicit write permission, draft default, writes survive branch discard, partial-write reporting; `CHANGELOG.md:573`: work-plan approval UI.
- Limit: no exact provider-side write scope name is invented; guide requires an API key with write permission as the product UI states.

### Teamcenter

- `frontend/src/components/settings/teamcenter-integration-page.tsx`: all-project admin connection, project-admin rules, Server URL/Service account/Password, optional Active Workspace URL, Test and connect, revision-rule grouping, Check now, disconnect effects.
- `backend/src/teamcenter-integration/teamcenter-integration.controller.ts`: role guards and project-rule scope.
- `backend/src/teamcenter-integration/teamcenter-integration.service.ts`: singleton connection, revision selection, connection management.
- `docs/teamcenter-integration.md`: read-only reference scope, no BOM import/JT/CAD conversion, no-rule failure, baseline/poll limitations, installation compatibility requirements.
- `CHANGELOG.md:1661`: released linking and change detection, requires configuration and compatibility checks, **not yet available on Flow-hosted deployments**. Guide preserves this limitation.
- Limit: no customer installation compatibility is asserted. No live server was accessed.

### GitLab

- `frontend/src/components/settings/gitlab-integration-page.tsx`: shared admin connection, OAuth availability fallback, group/project token scope and role, host settings, webhook events, capability controls, token disconnect cleanup.
- `frontend/src/components/settings/gitlab-project-setup.tsx`: Maintainer/Owner project selection, no automatic selection, Save selected projects, managed webhooks, shared access, retry/reauthorize/disconnect behavior.
- `frontend/src/components/settings/gitlab-pipeline-triggers-section.tsx`: project/ref/variables and user/automation access configuration.
- `backend/src/gitlab-integration/gitlab-connection.controller.ts` and `gitlab-connection.service.ts`: admin OAuth/project setup; shared credential resolution.
- `CHANGELOG.md:124`: pipeline triggers; `CHANGELOG.md:129`: conditional GitLab.com OAuth; `CHANGELOG.md:187`: after-merge automations; `CHANGELOG.md:1274`: @flow comments.
- Limit: automated pipeline start requires configured permission plus write-back. Guide is setup scope, not a complete automation/pipeline tutorial. Unlike Bitbucket, no unsupported per-user GitLab connection is claimed.

### Bitbucket

- `frontend/src/components/settings/bitbucket-integration-page.tsx`: separate workspace and personal connections, exact token scopes, Data Center permissions, OAuth-managed webhook picker, manual webhook events, test-before-save, capability labels.
- `backend/src/bitbucket-integration/bitbucket-integration.controller.ts`: workspace admin guards, personal connections permitted for read-only members.
- `backend/src/bitbucket-integration/bitbucket-integration.service.ts`: personal request access, automation writer repository checks, shared disconnect best-effort managed-hook cleanup; personal auth stored separately.
- `CHANGELOG.md:1395`: Cloud, personal access, OAuth configuration requirement; `CHANGELOG.md:1405`: Data Center requires approved server, individual file commits.
- Limit: shared Premium workspace tokens are supported, personal workspace tokens are not. The guide keeps those flows distinct. Exact scopes are sourced from Flow UI rather than an invented minimum-scope promise.

## Screenshot capture checklist

All screenshot placeholders are MDX comments containing the prescribed markdown image syntax. They do not render broken images. Replace each comment with a real annotated screenshot before final screenshot completion. Use a test workspace and redact credentials and personal/account data. Number callouts, add a short caption and a “Requires human intervention” banner. No synthetic UI images were generated.

### onshape

- `images/onshape-api-key.png` — Create an Onshape API key.
- `images/onshape-connection.png` — Enter the Onshape connection details.
- `images/onshape-test-save.png` — Test and save Onshape.
- `images/onshape-webhook.png` — Register the Onshape webhook.
- `images/onshape-write-back.png` — Enable Onshape write-back.
- `images/onshape-disconnect.png` — Remove the Onshape webhook and disconnect.

### altium

- `images/altium-connect.png` — Start a personal Altium connection.
- `images/altium-authorize.png` — Authorize the Altium connection.
- `images/altium-connected.png` — Confirm the connected Altium account.
- `images/altium-disconnect.png` — Disconnect your Altium account.

### boltline

- `images/boltline-api-key.png` — Generate a Boltline API key.
- `images/boltline-connection.png` — Enter the Boltline API key.
- `images/boltline-test-save.png` — Test and save Boltline.
- `images/boltline-write-back.png` — Enable Boltline write-back.
- `images/boltline-disconnect.png` — Disconnect Boltline.

### teamcenter

- `images/teamcenter-connection.png` — Enter the Teamcenter server and service account.
- `images/teamcenter-test.png` — Test the Teamcenter connection.
- `images/teamcenter-rules.png` — Choose Teamcenter revision rules for Flow projects.
- `images/teamcenter-link.png` — Select a Teamcenter item in Flow.
- `images/teamcenter-check.png` — Check linked Teamcenter items for changes.
- `images/teamcenter-disconnect.png` — Confirm Teamcenter disconnection.

### gitlab

- `images/gitlab-authorize.png` — Authorize a GitLab account.
- `images/gitlab-projects.png` — Select GitLab projects for Flow.
- `images/gitlab-status.png` — Review GitLab project connection status.
- `images/gitlab-token-setup.png` — Prepare GitLab token authentication.
- `images/gitlab-token-save.png` — Save GitLab token credentials.
- `images/gitlab-webhook.png` — Configure a GitLab project webhook.
- `images/gitlab-capabilities.png` — Enable GitLab repository capabilities.
- `images/gitlab-pipelines.png` — Configure GitLab pipeline permissions.
- `images/gitlab-disconnect.png` — Disconnect the shared GitLab connection.

### bitbucket

- `images/bitbucket-workspace-authorize.png` — Authorize the shared Bitbucket connection.
- `images/bitbucket-repositories.png` — Choose Bitbucket webhook repositories.
- `images/bitbucket-token.png` — Configure Bitbucket token credentials.
- `images/bitbucket-webhook.png` — Configure the Bitbucket webhook.
- `images/bitbucket-personal-cloud.png` — Connect a personal Bitbucket Cloud account.
- `images/bitbucket-personal-server.png` — Connect a personal Bitbucket Data Center token.
- `images/bitbucket-capabilities.png` — Enable Bitbucket agent capabilities.
- `images/bitbucket-disconnect.png` — Disconnect personal or shared Bitbucket access.

