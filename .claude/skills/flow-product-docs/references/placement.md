# Where product pages go

Product pages live in the **Guides** tab. `docs.json` is the source of truth for
group and page order; this file covers what belongs in each group.

| Group | Folder | Purpose | Register |
| --- | --- | --- | --- |
| Get started | `get-started/` | One path from an empty project to a first change | You, numbered steps |
| Core concepts | `core-concepts/` | Why Flow is shaped the way it is; one idea per page | Declarative, third person |
| AI & Automations | `ai-automations/` | Task guides for skills and automations | You, numbered steps |

Each Get started page ends by pointing to the next page and to the Core concepts page
that explains it. Each Core concepts page links to the Get started page where the
reader does it.

Later groups from the private draft (Branching, Collaboration, Searching & Filtering,
Integrations, Administration, Diagrams, Formulas, Importing & Exporting) move over
only when each page is verified against `master`. Keep the draft's slugs so review
links stay stable.
