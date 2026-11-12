# Where product pages go

Product docs live in the **Guides** tab of `docs.json`. API material stays in the
**API** tab and release notes in **Release Notes** (see `AGENTS.md`).

## Groups, in order

| Group | Folder | Purpose | Register |
| --- | --- | --- | --- |
| Get started | `get-started/` | One path from an empty project to a first change, using the EV project | You, imperative steps |
| Core concepts | `core-concepts/` | Why Flow is shaped the way it is; one idea per page | Declarative, third person |
| AI & Automations | `ai-automations/` | Task guides for agents, skills, automations | You, imperative steps |

Later groups from the private draft (Branching, Collaboration, Searching & Filtering,
Integrations, Administration, Diagrams, Formulas, Importing & Exporting) move over
only when each page is verified against `master`. Integrations pages arrive from
the integrations branch.

## Page order and hand-offs

Get started reads as one sequence. Each page ends by pointing to the next:

1. What is Flow
2. Starting a project
3. Requirements, systems, tests
4. Getting data into Flow
5. Creating a branch

Core concepts reads from the foundation up:

1. The systems graph
2. The data model
3. Branching
4. AI & Automations

A Get started page links to the Core concepts page that explains it. A Core concepts
page links to the Get started page where the reader does it.

## Paths

Keep the private draft's slugs (`get-started/what-is-flow`) so review links and
redirects stay stable. Lowercase, hyphenated.
