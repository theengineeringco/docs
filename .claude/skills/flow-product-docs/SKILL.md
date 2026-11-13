---
name: flow-product-docs
description: >-
  Write, revise, or place Flow product documentation (the Guides tab: Get
  started, Core concepts, AI & Automations, and later product sections) in the
  voice of Flow's own product demos. Use whenever drafting or editing an MDX page outside the API and
  Release Notes tabs, choosing a worked example, or turning demo or sales
  material into docs.
---

# Flow product docs

## The guiding principle

> Flow is a source of truth that lets humans and agents deeply understand your
> physical system. It pulls and manages context from multiple places to make it clear
> what you are intending to build and how close you are to achieving that. Based on
> this, it lets you spin up bots which work in the background to help close the gap
> and increase your engineering velocity.

Every page should serve that sentence. Three consequences:

- **Flow models any system and any structure**: product breakdowns, interfaces,
  requirements, tests, analyses, parts, suppliers, risks, decisions, whatever the team
  defines. Requirements are one kind of item, not the center. Never describe Flow as
  a requirements tool, and do not default to a requirement when any item would do.
- **Intent and progress**: frame features by how they show what the team intends to
  build and how close it is.
- **Humans and agents read the same source**: context in Flow is what makes agents
  useful; agents run in the background to close the gap.

`AGENTS.md` (Voice, Content boundaries, Guides) applies in full. This skill adds only
what is specific to product pages.

| Read | When |
| --- | --- |
| `references/ev-reference-project.md` | You need a concrete example. The only source for example names, values, and owners |
| `references/demo-voice.md` | Converting demo or sales narration into docs |
| `references/verified-ui.md` | Writing steps that name UI labels or click paths |
| `references/placement.md` | Adding a page or choosing its group |
| `references/diagrams.md` | Drawing a branching or history diagram |

## Examples: use sparingly

The electric vehicle is the shared example, not the subject. Use it only where a
concrete case teaches something a plain description cannot, usually once per page, and
never as the frame of a feature page. Most task pages need no example at all. When
you do use one, take names and values from the reference project, never invent a
second product, and do not reuse the electric bike from earlier drafts. Vary the item
kinds: a system, an interface, an analysis, or a test, not always a requirement.

## The voice

1. **Lead with the engineer's question**, then show the Flow feature that answers it.
2. **Owners are engineers closest to the design**, named by role.
3. **Describe views by the task they serve.** Same records, no duplication.
4. **Branches do two jobs**: lasting variants and in-progress proposals. Keep them apart.
5. **The agent proposes; the owner decides.**
6. **Close on the outcome**, once per page.
7. **Plain and short.** Task pages state what the feature is for in one or two
   sentences, then the steps, then the limits that matter.

Get started and feature task pages are second person with numbered steps. Core
concepts is declarative third person.

## Tell each story once

Each recurring idea has one home page; elsewhere, one sentence and a link.

| Idea | Home |
| --- | --- |
| Ownership | `core-concepts/the-systems-graph` |
| Views (table, tree, Reader, diagram) | `core-concepts/the-systems-graph` |
| Variants and proposals | `core-concepts/branching` |
| External-tool actions are not undone by branches | `core-concepts/branching` |
| Every change is traceable | `core-concepts/branching`; task detail in `branching/tracing-history` |
| The GitHub firmware review | `core-concepts/ai-automations` |

## Product-page boundaries

On top of `AGENTS.md`'s content boundaries:

- No presenter or colleague names from demos. Use roles.
- No customer-specific vocabulary from demos; re-express the idea generically or with the reference project.
- Mark every visual a page needs with the `VisualPlaceholder` component from
  `/snippets/visual-placeholder.jsx`: `kind="Screenshot"` or `kind="Diagram"`, a short
  `title`, and a one- to three-sentence body that says exactly what to capture or draw.
  Name the screen and its state, the example data on it, and what to highlight; for
  diagrams, the nodes, the connections, and what is emphasized. "New project dialog" is
  too vague; "New project with Start from set to an existing project and all four What
  to import options checked" is right. Place it right after the paragraph it
  illustrates, and mirror it as one row in `references/shot-list.md`. No `noindex`, `<Note>` placeholders, or author notes. When a real image lands,
  replace the component and remove its row.
- Visuals follow the `flow-brand` skill in `theengineeringco/branch-demo`
  (`references/product-media.md` and `references/backgrounds.md`): real product pixels
  from a disposable preview with the seeded Electric Vehicle demo, on the supplied
  logo-free backgrounds. Never AI-generated UI. Diagrams follow its line-art language.
- No links to pages that are not in this repository.
