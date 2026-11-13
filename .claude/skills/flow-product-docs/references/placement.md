# Where product pages go

Product pages live in the **Guides** tab. `docs.json` is the source of truth for
group and page order; this file covers what belongs in each group.

| Group | Folder | Purpose | Register |
| --- | --- | --- | --- |
| Get started | `get-started/` | One path from an empty project to a first change | You, numbered steps |
| Core concepts | `core-concepts/` | Why Flow is shaped the way it is; one idea per page | Declarative, third person |
| AI & Automations | `ai-automations/` | Task guides for skills and automations | You, numbered steps |
| Branching, Collaboration, Searching & Filtering, Diagrams, Dashboards, Formulas | matching folder | One task or feature per page | You, numbered steps |
| Importing & Exporting | `importing-exporting/` | One page per format | You, numbered steps |
| Integrations | `integrations/` | One page per connected tool, plus the list | You, numbered steps |
| Administration | `administration/` | Workspace setup for Admins | You, numbered steps |

Each Get started page ends by pointing to the next page and to the Core concepts page
that explains it. Each Core concepts page links to the Get started page where the
reader does it.

Feature pages state what the feature is for in a sentence or two, then the steps, then
the limits that matter. They link to the Core concepts page behind them rather than
re-explaining it. Keep the draft's slugs so review links stay stable. The draft's
`get-started/running-a-review` stub stays out until review docs resume.
