# Diagrams

Every diagram on a product page is drawn with the `flow-illustration` skill
(`.claude/skills/flow-illustration`). Do not use Mermaid, hand-written SVG, or other
generated diagrams.

## Add or change a diagram

1. Write the claim in one sentence. If there is no claim, there is no diagram.
2. Start from the nearest spec in `illustrations/` (this skill), or from the skill's
   concept map and examples for a new kind of figure.
3. Save the spec as `illustrations/<page-group>-<topic>.json`. Its `description` becomes
   the image's alt text, so write it as one or two plain sentences.
4. Render light and dark into `images/illustrations/`:
   `python3 .claude/skills/flow-product-docs/illustrations/build.py <name> --png <scratch dir>`.
   Fix every lint warning, then look at both PNGs.
5. Place it with the `Illustration` snippet after the paragraph it illustrates:
   `<Illustration name="<name>" alt="<description>" />`, imported from
   `/snippets/illustration.jsx`.
6. Follow it with a sentence that says what it shows when the surrounding text doesn't.

Labels are lowercase mono, three words or fewer; proper names (Base, Truck, GitHub) keep
their case. Explanation belongs in the page, not in the figure.

## Branching and history diagrams

Use the `branch` motif: Base is the trunk, time runs left to right, and Base's live state
is the node at the right end.

- A recorded change is a circle on its lane. A result (a merge landing, a settled
  conflict) is a blue square.
- A merge is the lane returning to its parent with a baseline tick; label it
  `merge recorded`.
- A proposal is a dashed lane that merges back. A variant is a solid lane that runs to
  the right edge and never merges.
- An update from the parent is a fine line from the parent's change to the child, with a
  traveller showing direction; label it `update from parent`.
- A revert, rebase copy, move, or restore is dotted: it moves work in time. A revert
  branch's change is a ghost circle.
- A conflict is the one mustard flag; at most two flags per figure.
- Never remove a mark to show an undo or a delete. Ghost it, close it, or add the reverse,
  so the figure shows that history is kept.
- A sub-branch, or a lane off a variant, is a second `branch` motif placed on the parent
  lane with `trunkStyle: "none"`, `startKind: null`, and `head: null`.
