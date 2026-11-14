# Diagrams

For now, every diagram is a `VisualPlaceholder` with `kind="Diagram"`. The final
diagrams will be drawn in Flow and replace the placeholders later. Do not use Mermaid
or other generated diagrams on product pages.

## Writing the description

The description is the brief for whoever draws the diagram in Flow, so it must be
complete on its own:

- **Layout**: what the lanes or boxes are and how they are arranged.
- **Nodes**: every element, with its exact label from the reference project.
- **Connections**: every arrow or merge, with its label and direction.
- **Emphasis**: callouts, notes, or styling that carry the point of the section.
- **Takeaway**: what the reader should conclude, said in a callout or note.

Mirror each placeholder as one row in `shot-list.md`.

## Illustrations

Concept glyphs, how-it-works explainers, and section heroes are drawn with the
`flow-illustration` skill (`.claude/skills/flow-illustration`). Start from its concept map
(`references/concepts.md`), copy the nearest example, and render the spec. Its marks have
fixed meanings, so don't reuse them for other things in the same page.

Branching and history diagrams stay as placeholders until they are drawn in Flow. They
need the exact `Merge:` and `Revert:` labels and the arrows below, which the illustration
system does not draw.

## Branching and history diagrams

Draw branches as horizontal lanes, Base on top, with time running left to right. A
dot on a lane is a recorded change, labelled with the value or change, not "commit".

- A merge into a parent is tagged `Merge: <branch>`, matching the record Flow creates.
- An update from the parent is an arrow from the parent's lane down into the child,
  labelled **Update from parent**.
- Baselines are flags above a dot. Reverts are reverse-marked dots on a
  `Revert: <name>` lane.
- Variants run to the right edge without merging back and are drawn solid. Proposals
  are short and drawn dashed.
- Never remove a dot to show an undo or a delete. Fade, close, or reverse it, so the
  diagram shows that history is kept.
- Use one diagram per action. Follow it with a sentence that says what it shows.
