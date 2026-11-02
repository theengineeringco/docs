# Integration guide review

Prepared November 1, 2026. This record is excluded from the Mintlify site by `.mintignore`.

## Evidence and scope

- Documentation base: `theengineeringco/docs` main at `4fc93b9`.
- Implementation reference: `theengineeringco/branch-demo` master at `868cce7eb0e59a2efd44fac3bf7b4ab6d82b3f56`.
- Catalog: `frontend/src/integrations-catalog.tsx`, plus Custom MCP from settings.
- Structure reference: https://docs.serval.com/sections/integrations/linear-admin. The reference supplies the information architecture only. Flow auth and capabilities are checked against Flow source.
- Scope: 19 native integrations plus Custom MCP, an overview, navigation, and authoring guidance.
- The source tree can contain changes newer than the published October 30 release. A merged implementation is not deployment evidence. This is a draft PR pending deployment/availability confirmation and screenshot capture.

## Linear evidence

- `frontend/src/components/settings/linear-integration-page.tsx`: API-key instructions, team picker/manual UUID fallback, connection test, write-back and team-management labels.
- `backend/src/linear-integration/linear-integration.controller.ts`: all-project-admin configuration gate and separate project connection actions.
- `backend/src/linear-integration/linear-integration.service.ts`: selected-team boundary, first-team default, configuration-change approval invalidation, read/write operations.
- `frontend/AGENTS.md` Linear integration contract and `frontend/src/client/queries/use-is-all-project-admin.ts`.
- October 9 and October 23 release notes confirm named Linear project support and comment reads.
- Vendor reference: https://linear.app/docs/api-and-webhooks confirms API-key creation and team restriction settings. Exact write-scope labels follow Flow's setup UI; verify the vendor's current update permission behavior before publication.

## GitHub evidence

- `frontend/src/components/settings/github-integration-page.tsx`: managed/dedicated options, workspace read scope, project automation switches, multiple organizations, disconnect retention.
- `frontend/src/components/settings/github-organization-setup.tsx`: explicit review and connect action, owner approval, manual installation ID.
- `frontend/src/components/settings/github-app-setup-card.tsx` and `backend/src/github-integration/github-app-manifest.ts`: service choices, App manifest permissions, installation workflow.
- `frontend/AGENTS.md` and `backend/AGENTS.md` GitHub contracts.
- September 11 release notes confirm multiple organizations; October 23/30 release notes confirm merge triggers, PR readers, inline review mentions, and disconnect retention.

## Slack evidence

- `frontend/src/components/settings/slack-integration-page.tsx` and `slack-app-config-modal.tsx`: manifest, token test/save, signing secret, personal linking and disconnect.
- `slack-project-connections-section.tsx`, `slack-allowed-channels-section.tsx`, `slack-readable-channels-section.tsx`: separate project, posting and history controls.
- `backend/AGENTS.md`: ten-minute personal link, identity invalidation, history and write-back contracts.
- October 23/30 release notes confirm linking and explicit channel-history grants.
- The newly merged attachment-read capability was intentionally not presented as available in this first guide. Confirm its deployed availability before adding instructions for the per-channel attachment switch.

## Screenshots before publication

Every manual-step image placeholder remains inside an MDX comment. This allows the draft to render without broken images, while preserving the `human-intervention:` convention and exact capture location. These are capture instructions, not completed screenshots.

Capture real demo-workspace screenshots, redact keys/tokens/private details, then annotate the exact control with numbered callouts, a short caption, and a “Requires human intervention” banner. Replace each commented placeholder with a real image reference. Do not use AI-generated product screenshots.

Linear: create key; choose teams; test/save; write-back; manage teams; disconnect. If documenting conditional project approval visually, capture that control from an approved non-customer demo environment.

GitHub: managed-App selection; repository install approval; review/connect; dedicated service selection; dedicated App approval/install; browsing/writeback; project automation; organization disconnect.

Slack: manifest; token test/save; signing secret; project opt-in; private link request; link confirmation; posting grants; history grants; reconfigure/disconnect.

For the other providers, see `integration-evidence-work-tracking.md`, `integration-evidence-engineering.md`, and `integration-evidence-knowledge.md` in this directory.

## Publication review

- Confirm guide labels and feature availability against the intended release; configuration-only features must keep their caveats.
- Capture and annotate real screenshots; never expose credentials or customer data.
- Review integration scope distinctions and any backend/UI discrepancies recorded in the provider evidence files.
- Validate Mintlify, internal links, navigation coverage, and the existing documentation tests.
- Obtain publication approval before merging the draft PR.

## Pre-PR review results

Manual simplification retained the provider-specific setup paths and removed repeated Jira disconnect prose. A separate correctness review verified all twenty guides against the source. Three findings were confirmed and fixed:

- Google: a mounted folder is the default browse/search scope, not a complete read boundary. Direct Docs/Sheets reads and explicit-folder listing use the connected account's access. Separately configured restrictions still control picker searches and Sheets writes and are not cleared by changing the mount. Evidence: `google-integration.service.ts` listFiles/readDoc/readSheet/writeSheetValues and scope helpers.
- GitLab: configure a self-managed server through Advanced server settings → Change → Save base URL before entering the separate token setup view.
- Boltline: publication is an option on create/revise, not a standalone Flow action on an existing draft. Direct users to finish an existing draft in Boltline.

No correctness findings were rejected. No production integrations were connected or modified during validation.

## Altium logo source

The Altium navigation icon is the unmodified 32px brand icon linked by https://www.altium.com/: https://cdn.files.altium.com/sites/default/files/favicons/altium.com/favicon-32x32.png. It is stored at `images/integrations/altium.png`.

## Capability and automation expansion — November 2, 2026

Expanded Jira, Slack, Google Drive, GitHub, GitLab, Bitbucket, and Linear with source-backed capabilities, three example requests, and three automation ideas each. These are configurable recipes, not claims that automations are installed or running.

Reference: `theengineeringco/branch-demo` `origin/master` at `e9bc3131cf119fca022ebeb1ba926c30791bcfa4`. The user's main checkout was older, so the audit uses freshly fetched source from the existing source-audit worktree. No integration credentials, customer application data, or production connections were accessed.

- `backend/src/llms/ai.service.ts`: Jira read/write tool schemas, named Linear projects and issue comments, Google folder/Doc/range reads and Sheets writes, Slack history and posting, repository browsing and write-back, and allowed GitLab pipelines.
- `shared/src/trigger-types.ts`: schedules, GitHub/GitLab review and merge sources, Bitbucket events, and writer permissions. Jira, Google, and Linear have no built-in event sources/receivers here; recipes use schedules/manual runs or authenticated custom senders.
- `backend/src/github-integration/github-integration.controller.ts` and `backend/src/gitlab-integration/gitlab-integration.controller.ts`: review/merge webhook handling and mention reruns. `backend/src/bitbucket-integration/bitbucket-integration.controller.ts`: created/updated pull-request events, results, and build statuses.
- `backend/src/slack-integration/slack-integration.controller.ts`: mentions start interactive conversations. Project channel-history reads return top-level messages, not every thread reply. Attachment access is intentionally not added in this expansion.
- `frontend/src/components/settings/automations/automation-settings-page.tsx` and trigger types: schedules and author/path scopes. Existing API automation/webhook guides supply the configuration links.
- Release notes: October 2 (run identity and schedules), October 9 (Linear project placement, GitLab mentions, Jira details), October 16 (Bitbucket, GitLab code search), October 23 (merge triggers and Linear comment reads), and October 30 (Slack history).

Examples distinguish reading, external writes, and proposed Flow updates. Pipeline start is not a successful CI result; CI result delivery is a separate custom sender. Recurring issue/PR creation recipes include duplicate-check or output-link guidance. The existing draft publication, screenshot, and availability review requirements remain in effect.
