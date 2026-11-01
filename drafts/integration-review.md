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
