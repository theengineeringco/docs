---
name: flow-product-docs
description: >-
  Write, revise, or place Flow product documentation (Guides tab: Get started,
  Core concepts, AI & Automations, and later product sections) in the voice of
  Flow's own product demos, grounded in the electric vehicle reference project.
  Use whenever drafting or editing an MDX page outside the API and Release Notes
  tabs, deciding where a product page belongs in the navigation, choosing a
  worked example, or turning demo or sales material into docs. Pair with the
  user-level flow-doc-style skill for house style rules.
---

# Flow product docs

Flow's product docs teach the way the team demos the product: start from a question
an engineer actually asks, show where Flow answers it, and keep one example project
running through every page. The example is an **electric vehicle**. Every page uses
the same systems, requirements, variants, and people-roles so a reader who finishes
Get started can open Core concepts and recognize everything.

Read `references/ev-reference-project.md` before writing. It is the single source
for example names and values. Read `references/demo-voice.md` when converting demo
narration into docs, and `references/placement.md` before adding or moving a page.

## The voice

The demos are spoken and fast. The docs keep their order of ideas and their
concreteness, and drop their filler.

1. **Lead with the engineer's question.** "Why does this requirement exist?" "Where
   in the design is it delivered?" "What else changes if I change this?" Name the
   question in the first lines, then show the Flow feature that answers it.
2. **One example, all the way down.** Top speed decomposes into drag coefficient and
   powertrain torque; drag decomposes into frontal area. Use the reference project's
   names and numbers. Never invent a second example vehicle, and never mix in the
   electric bike from earlier drafts.
3. **Ownership sits with the engineer closest to the design.** Requirements belong to
   the mechanical, electrical, or software engineer who designs the part, not to a
   central systems engineer. Say who owns what by role.
4. **Pivot, don't duplicate.** The same records answer different questions in
   different views: systems, functions, verification, risk; table, tree, Reader,
   diagram. Describe a view by the task it serves.
5. **Branches do two jobs.** Variants hold lasting differences (Coupe, Truck, SUV from
   a shared Base). Proposals hold work in progress (a battery capacity trade study,
   BMS improvements, DC fast charging), developed in parallel. Keep the two apart.
6. **Agents meet engineers in their tools, and engineers stay accountable.** The
   firmware review in GitHub flags a conflict with a requirement and names both
   owners. The agent proposes; the owner decides.
7. **Close on the outcome, not the feature.** One place for the information, faster
   iteration, everyone moving in the same direction. Say it once per page, plainly.

Register: second person and imperative steps in Get started; declarative, third
person explanation in Core concepts. Sentence-case headings. No hype words, no
exclamation marks, no "simply", "easily", "very", "really", "just", "Let me show you".

## Ground every claim in the product

Demo narration is evidence of intent, not of shipped behavior. Before a UI label,
click path, or capability goes into a page, confirm it on `master` of
`theengineeringco/branch-demo` (frontend strings under `frontend/src`). Known traps:

- Skills and Automations live in **Settings → AI**, not in the agent sidebar.
- Proposal and variant labels depend on the org's updated variant view (default
  off). With it on, the new-branch dialog says **New change request** or asks for a
  **Variant name**; with it off, it says **New branch**. Write steps that work in
  both, or name both labels.
- Personal skills and My FLOW.md apply to the user's chats and the agents they
  delegate to, never to automation runs.

If a demo shows something not on `master`, leave it out and note it for the author.

## Never publish

- Customer names, customer programs, or customer-specific vocabulary from demos
  (for example design-unit numbering, review-gate names, or a customer's source
  systems). Re-express the idea with the EV project.
- Real people's names, including the presenters. Use roles: the aerodynamics
  engineer, the BMS software engineer.
- Numbers from a demo that described a specific customer dataset.
- Screenshot placeholders, `noindex`, or author notes on a published page. Track
  needed visuals in `references/shot-list.md` instead.
- Links to pages that are not in this repository yet.

## Checklist

- [ ] Opens with the engineer's question or task, not a feature definition.
- [ ] Every example comes from `references/ev-reference-project.md`, with matching
      names, values, and units.
- [ ] Owners are named by role; no real names; no customer material.
- [ ] Every UI label and step checked against `master`.
- [ ] Variant versus proposal distinction intact; flag-dependent labels covered.
- [ ] Page sits in the right group per `references/placement.md`; links resolve.
- [ ] `npx --yes mint@4.2.939 validate` and `npx --yes mint@4.2.939 broken-links` pass.
