---
name: flow-product-docs
description: >-
  Write, revise, or place Flow product documentation (the Guides tab: Get
  started, Core concepts, AI & Automations, and later product sections) in the
  voice of Flow's own product demos, grounded in the electric vehicle reference
  project. Use whenever drafting or editing an MDX page outside the API and
  Release Notes tabs, choosing a worked example, or turning demo or sales
  material into docs.
---

# Flow product docs

Flow's product docs teach the way the team demos the product: start from a question
an engineer asks, show where Flow answers it, and keep one example project running
through every page. The example is an **electric vehicle**.

`AGENTS.md` (Voice, Content boundaries, Guides) applies in full. This skill adds only
what is specific to product pages.

| Read | When |
| --- | --- |
| `references/ev-reference-project.md` | Always. The only source for example names, values, and owners |
| `references/demo-voice.md` | Converting demo or sales narration into docs |
| `references/verified-ui.md` | Writing steps that name UI labels or click paths |
| `references/placement.md` | Adding a page or choosing its group |

## The voice

1. **Lead with the engineer's question**, then show the Flow feature that answers it.
2. **One example, all the way down.** Never invent a second vehicle or reuse the
   electric bike from earlier drafts.
3. **Owners are engineers closest to the design**, named by role.
4. **Describe views by the task they serve.** Same records, no duplication.
5. **Branches do two jobs**: lasting variants and in-progress proposals. Keep them apart.
6. **The agent proposes; the owner decides.**
7. **Close on the outcome**, once per page.

Get started is second person with numbered steps. Core concepts is declarative third
person.

## Tell each story once

Each recurring idea has one home page; elsewhere, one sentence and a link.

| Idea | Home |
| --- | --- |
| Ownership | `core-concepts/the-systems-graph` |
| Views (table, tree, Reader, diagram) | `core-concepts/the-systems-graph` |
| Variants and proposals | `core-concepts/branching` |
| External-tool actions are not undone by branches | `core-concepts/branching` |
| The GitHub firmware review | `core-concepts/ai-automations` |

## Product-page boundaries

On top of `AGENTS.md`'s content boundaries:

- No presenter or colleague names from demos. Use roles.
- No customer-specific vocabulary from demos; re-express the idea with the EV project.
- No screenshot placeholders, `noindex`, or author notes on a published page. This
  overrides the placeholder rule in the user-level `flow-doc-style` skill. Track
  needed visuals in `references/shot-list.md`.
- No links to pages that are not in this repository.
