# Flow documentation project instructions

## About this project

- This is Flow's public Release Notes site, built on Mintlify.
- Pages are MDX files with YAML frontmatter.
- Global configuration lives in `docs.json`.
- Use the Mintlify MCP server at `https://mcp.mintlify.com` for content, navigation, and configuration changes.
- Use `branch-demo/CHANGELOG.md` as the customer-facing release record. GitHub and production deployment state establish what shipped.
- Treat Eddy digests and `#changelog-charlie` as editorial evidence, not as the system of record.

## TL;DR

- Use `/release-notes` as the only Release Notes index URL.
- Store every dated page at lowercase `release-notes/YYYY-MM-DD`.
- Use ISO dates in paths and filenames: `YYYY-MM-DD`.
- Use the full written date in page titles, sidebar labels, and update labels: `Month D, YYYY` (for example, `September 7, 2026`).
- Prepare one draft nightly at 7:00 PM Pacific when eligible changes shipped since the latest published edition.
- Keep **Release Notes** first in the sidebar and list dated entries newest to oldest.
- Draft on a Mintlify branch. Do not publish until the draft receives explicit approval.
- After publication, verify the index, the new lowercase page URL, navigation order, and redirects from any replaced URL.

## Voice

Write with a confident, declarative, and precise voice.

- State what changed and why it matters. Cut implementation detail.
- Use present tense and active voice.
- Keep sentences concise and vary their rhythm.
- Use sentence case for headings.
- No hype, exclamation marks, emoji, or hedging.
- Use Flow terminology consistently: systems graph, continuous alignment, system of record, impact analysis, requirements, interfaces, and test cases.
- Use the negation-then-assertion pattern only when it clarifies a real shift.

## Release Notes structure

- Prepare one edition nightly at 7:00 PM Pacific when eligible changes shipped since the latest published edition. Publication requires explicit approval.
- Title each Release Notes page with its full publication date in `Month D, YYYY` format.
- Put a `## Contents` section immediately after the frontmatter and before the first feature section. List every subsequent `##` section once, in the same order as the page, and omit links to sections that do not appear.
- Use this exact Markdown shape, replacing the example labels and anchors with the page's real sections:
  ```md
  ## Contents
  - [Primary feature](#primary-feature)
  - [Fixes](#fixes)
  - [Improvements](#improvements)
  - [API changes](#api-changes)
  ```
- Keep the feature links first, ordered by customer impact, followed by any shared sections in their page order.
- Omit empty sections and placeholder text such as “No customer-facing changes.”
- Give each major customer-facing capability its own section before Fixes, Improvements, and API changes.
- Order feature sections from highest to lowest customer impact. Make the amount of detail proportional to that impact: a major feature can use two short paragraphs, while a smaller feature stays at one or two sentences. A narrow limit increase, control, or workflow refinement normally belongs under Improvements instead of receiving its own feature section.
- Use a Fixes section for consequential customer-facing corrections and reliability issues where behavior was wrong, unavailable, or misleading.
- Use an Improvements section for consequential customer-facing refinements, performance gains, and workflow changes where existing behavior is enhanced rather than corrected.
- Order shared sections as Fixes, Improvements, then API changes. Omit any section with no eligible content.
- Include only consequential customer-facing fixes and improvements. Omit cosmetic polish and minor UI behavior unless it blocks or misleads the customer.
- Write each page description and index summary from the release's distinct outcomes. Avoid generic catch-alls such as “stronger reliability,” “reliability improvements,” and “more reliable workflows,” and do not repeat the same closing phrase across adjacent editions.
- Use a short label and one sentence when the outcome is clear. Add another sentence when the behavior or impact would otherwise be ambiguous.
- Put availability, compatibility, or migration caveats in a separate note only when required.
- Group several pull requests into one feature only when they deliver one customer outcome.
- Deduplicate by pull request and customer outcome.
- Create one MDX page per Release Notes edition under lowercase `release-notes/YYYY-MM-DD`.
- Keep the **Release Notes** landing page at `/release-notes` as the first item under **Release Notes**, then list dated entries newest to oldest.
- Keep pull request numbers and evidence in the editorial record, not in public prose.

## Eligibility

Include a change only when it is customer-facing, merged, deployed to its stated audience, supported by release evidence, and significant enough to affect a customer workflow, result, or integration.

State limited availability explicitly:

- _(beta)_ for a feature flag that is off by default
- _(requires configuration)_ for deployment-level setup
- _(Flow-hosted)_ or _(self-hosted)_ when availability differs
- a visible warning for breaking changes, removals, or required operator action

## Content boundaries

Never publish:

- internal service names, implementation details, or debug behavior
- customer names, workspace names, logs, support messages, or customer data
- tenant-specific configuration
- unreleased or rolled-back work
- cosmetic polish, minor animation or flicker fixes, spacing adjustments, or other low-impact UI changes
- tests, refactors, dependency updates, CI, or infrastructure with no customer-visible effect
- security or incident details beyond the safe customer-visible outcome
- a claim, metric, screenshot, or availability statement without evidence

A short Release Notes edition is acceptable when little shipped. Significance matters more than volume.

## Customer API documentation

- The API tab is separate from Release Notes. Keep the existing release-note URLs and content intact; link to that changelog from API pages.
- API pages cover authentication, request conventions, endpoint reference, and integration examples only. Product tutorials belong in the product documentation.
- Keep the API sidebar sections exactly **Quickstart**, **Integrations**, and **Endpoints**.
- Customer API pages, navigation, metadata, and generated reference must not introduce tenant/environment terminology or deployment names. Describe the required `customer` header as a workspace identifier; preserve its wire name, required status, and authentication behavior. Remove deployment-selection instructions from public API guides. Apply this rule to every future edit and sync.
- Every authored cURL code block must have equivalent **Python** and **JavaScript** options in a `CodeGroup`, with matching parameters, headers, payloads, and pagination. Keep all three languages enabled for generated endpoint examples. Validate these requirements with `scripts/test_api_docs.py`.
- Use the customer Swagger documents from the three explicitly supported commercial environments. Never fetch application data or GovCloud data for documentation synchronization.
- Compare Production, RVT, and Rivian specs internally, but publish only the standard Production server in the playground. Do not add a deployment selector or publish tenant identifiers, custom field data, keys, or customer configuration.
- Author pages and navigation through Mintlify MCP. Generated OpenAPI assets and their navigation source wiring, screenshots, and CI tooling are maintained in Git because these file operations are not exposed by the editor tools.
- `openapi/customer-api.json` is generated by `scripts/sync-customer-api.py`; do not hand-edit its endpoints. Validate changes with the Python tests and `npx --yes mint@4.2.939 validate`.
- The nightly GitHub workflow compares deployed customer specs. Unchanged docs produce no update. Compatible reference updates publish automatically after validation. Existing contract changes require a review PR; divergence or failure preserves the published spec. These API rules do not change release-note publication approvals.
- Keep guide and authentication prose under review when the contract changes. Playground requests go directly to the standard Production API host.
- The generator normalizes known editorial wording to workspace terminology. New disallowed text in contract fields or examples stops synchronization for review; never rewrite wire names, enum values, or example payloads to satisfy wording checks.
