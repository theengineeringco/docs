# Visuals still needed

Published pages carry no placeholders. Capture these from the shipped app (`master`
UI, a workspace with the EV reference project loaded), then add them to the page and
remove the line here. Do not use AI-generated screenshots.

| Page | Shot | Notes |
| --- | --- | --- |
| get-started/what-is-flow | Several structures connected in one model | Systems, interfaces, targets, and evidence in a tree or diagram; owners visible |
| get-started/starting-a-project | New project dialog | Annotate Start from and What to import (human step) |
| get-started/requirements-systems-tests | One connected thread | System, its target, evidence, three results |
| get-started/getting-data-into-flow | CSV/Excel import mapping | Annotate Match items by, validation, confirm (human step) |
| get-started/creating-a-branch | New branch dialog | Show both labels or note the variant-view flag |
| get-started/creating-a-branch | Impact analysis tab | Battery capacity trade study result |
| core-concepts/the-systems-graph | One graph, four views | Table, tree, Reader, diagram of the same items |
| core-concepts/branching | Base → Coupe / Truck / SUV, proposals on Truck | Diagram, not UI |
| core-concepts/ai-automations | GitHub pull request review | Thermal-limit conflict and named owners |
| ai-automations/skills | Settings → AI → Skills | Organizational and Personal sections |
| administration/users-roles | Settings → Users list with Role and Access columns, several rows selected and the Actions menu open | Synthetic users; show Resend invite / Project access / Set role / Remove user |
| administration/users-roles | Grant User Access dialog | Send to chips, Permissions dropdown, Projects picker; synthetic emails |
| administration/user-groups | User Groups page with one group expanded, showing SSO and SCIM badges and the Group actions menu open | Synthetic names |
| administration/user-groups | Branch actions → Editor groups picker with "Anyone (no restriction)" | Any branch other than Base |
| administration/user-groups | "Sync from SSO" dialog with Match, SSO role, Provider | Placeholder role and provider |
| administration/audit-log | Audit Log with the scope picker, type filter, a row's Details popover and the Revert button | Include one "AI agent" Who entry |
| administration/deployments | Diagram: hosted vs customer-managed Flow, labelling app, database, object storage, identity provider, AI services, and Admin vs operator responsibilities | Diagram, not a screenshot |
| administration/sso-scim | SSO Setup connection card with DNS TXT records, Check DNS verification and Activate SSO | Hide the secret; use example.com domains |
| administration/sso-scim | SCIM Provisioning page with SCIM URL, Role/Projects for provisioned users and SCIM Tokens | Do not show a real token |
| administration/sso-scim | SSO Roles with a mapping and the "What your IdP is sending" section expanded | Synthetic claims |
| administration/usage-billing | Usage page with range selector, totals, Daily AI Tokens chart and allowance cards | Synthetic values; no prices |
| importing-exporting/csv | Import wizard mapping step | Mark Identity column, Match items by, Resolve links by |
| importing-exporting/csv | Export dialog | Mark Identity, Write links by, Include collapsed rows, item count |
| importing-exporting/excel | Upload step with Sheet picker | Multi-sheet workbook |
| importing-exporting/reqif | ReqIF export Mappings | Mark Spec object ID / Spec hierarchy ID and preset bar |
| importing-exporting/reqif | ReqIF import Destination step | New branch name, top-level placement, link directions |
| importing-exporting/sysml | Export SysML page | Format, Types, Traceability, Preview with coverage notes (beta workspace) |
| importing-exporting/markdown | More actions → Export as in Reader | Show Markdown and Markdown + Assets entries |
| importing-exporting/word | Reader document beside its .docx | Headings, fields, an image |
| importing-exporting/pdf | Browser print dialog from Reader export | Save-as-PDF destination |
| importing-exporting/html | Exported HTML open in a browser | Headings and a table |
| diagrams/diagrams | Diagram with item cards, shown fields, connectors | Include the link choice popover |
| diagrams/architecture-views | Architecture tab on Battery System | Subsystem cards, interfaces, Open architecture on card toolbar |
| diagrams/architecture-views | Settings → Architecture | Node type and Interface type |
| diagrams/importing-exporting-diagrams | Import diagram dialog | Replace/Add choices, accepted formats |
| diagrams/importing-exporting-diagrams | Diagram menu Export submenu | SVG, PNG, XML |
| integrations/github | Setup wizard "How do you want to connect?" step | Show both options; mask installation IDs |
| integrations/github | Settings page: Organization, Repositories with "Settings for" project picker and Off/On request/Automatic, Advanced switches | Placeholder org and repo names |
| integrations/gitlab | Connect GitLab panel with "Continue to GitLab" and "Set up with a token" | — |
| integrations/gitlab | Token form plus GitLab project webhook (URL, secret, Merge request events, Comments) | Mask secrets |
| integrations/gitlab | Automation trigger with Authors (optional) and Paths (optional) | Use `firmware/` as path |
| integrations/slack | Slack settings: connect options, Channel history access, write-back + Allowed channels, Projects | Mask tokens; generic channel names |
| integrations/slack | /flow settings modal in Slack (project, branch, fork-a-branch option) | — |
| integrations/jira | Personal Jira page with Connect Atlassian; admin Jira site, Linked Projects, Jira Write-Back | Mask account emails |
| integrations/linear | Linear form (API Key, Find teams, Team ID) and Linear Write-Back | Masked key; synthetic team names |
| integrations/integrations-list | Settings → Administration → Integrations list with Custom MCP entry | — |
| searching-filtering/searching | Search dialog with Current branch / All branches tabs, Recents & favorites, a Related by meaning group | — |
| searching-filtering/searching | Toolbar Find in view with highlighted matches and previous/next arrows | — |
| searching-filtering/filtering | View filter bar: Owner is empty chip plus an Advanced filter with OR | — |
| searching-filtering/filtering | Review → Changed Items filter with Changed by (Any AI) and a field "is changed" | — |
| ai-automations/ai-automations-and-trust | Agent conversation with expanded action cards, a Loaded skill card, and a plan awaiting Execute/Refine | Use the reference project; show the cited item links |
| ai-automations/automations | Settings → AI → Automations list showing the Automations and Personal Automations sections | Include the row options menu open on Run automation |
| ai-automations/automations | Automation page: name, runs-as status line, Triggers with Add trigger, Instructions with the Agent/Script tabs | Label Run now and View runs |
| ai-automations/automations | Add trigger dialog listing the trigger groups | Recurring / Flow / Integrations |
| ai-automations/activity | Activity Log with the source sidebar (All sources, Automations), filters, and one expanded thread | Show status chips, including Completed · Passed and Matched |
| ai-automations/activity | Activity thread graph opened from a row's Thread button | |
| ai-automations/impact-analysis | Review page, Impact analysis tab: tree of affected items with Severe and Moderate findings, Re-run, Display Options | Battery capacity trade study branch |
| ai-automations/impact-analysis | A finding marked Fixed after the agent's fix-and-re-run loop | |
| dashboards/dashboards | Dashboard with a bound view, a Filter that includes Within items, and the Value block, Property summary and Link coverage widgets | Click into a chart segment to show its item list |
| dashboards/dashboards | Historical Property summary chart with milestones and the "Not filtered by this dashboard" notice | |
| formulas/custom-functions | Formula editor with `latest(...)` keyed on Test Date over three coastdown results, and the calculated value | Label the selected result and its field |
| branching/branching | New branch dialog with Parent Branch | Also the branch actions menu showing Create a sub branch |
| branching/branching | Update from parent page with a conflict | Show Keep parent / Keep current and the bulk buttons |
| branching/comparing-branches | Comparison page, both Branch/Point pairs | Compare changes tab with one item's before/after; Swap sides icon visible |
| branching/managing-branches | Branch actions menu | Owner actions, Editor groups submenu, Protect/Unprotect, Delete branch |
| branching/managing-branches | Recently deleted branches page | Restore button and restore plan (human step) |
| branching/baselining | Change history popover | Create baseline, a named baseline, the revert control |
| branching/variant-branches | Truck variant item menu showing Apply to variant | Plus Extract non-variant changes target picker |
| collaboration/commenting | Item Discussions tab | Question, reply with @mention, Resolve comment control |
| collaboration/commenting | Reader margin thread | Add a comment on hover, wide layout |
| collaboration/sharing | Share view dialog | Invite people with Can view/Can edit, Shared destination, Link options expanded, Show path above |
| collaboration/sharing-views | View structure panel and Save as new view dialog | Private view / Shared view choice |
| collaboration/subscriptions-notifications | Item details bell with Manage subscribers | Inbox → Notifications (All/Unread, Mark all as read) and the Settings → Notifications channel grid |

The PR-asset screenshots from the agent-workspace work show an agent-sidebar Skills
tab that is not on `master`. Do not use them.
