---
name: flow-illustration
description: Flow Engineering's abstract illustration system — the dashed-line, grey-circle, blue-square language of the flowengineering.com feature pages, extended into a full vocabulary for product explainers, help and support pages, docs, decks, and heroes. Renders a small JSON spec into SVG, animated SVG, PNG, a motion/react TSX component, or MP4/WebM/GIF, from a 240×200 benefit glyph up to multi-step process explainers, wide branching diagrams, isometric 3D stacks of the systems graph, and Lissajous line-art heroes. Use this skill whenever anyone needs an illustration, diagram, icon-like glyph, explainer graphic, figure, animation, or hero visual for Flow — requirements, traceability, the systems graph, impact analysis, branching, baselines, reviews, stage gates, agents, automations, skills, MCP, integrations, security — or asks to "illustrate", "draw", "visualise", "make a graphic for", or "animate" a Flow concept, or to make something "like the illustrations on the Flow website". Never hand-write these SVGs; write a spec and render it.
---

# Flow illustration

Flow explains a complex product with a very small drawing language: dashed grey links, white
circles, blue squares, and one ringed blue node. The website's feature pages use it at
glyph size (three per row under a heading). This skill turns that language into a system
anyone on the team can use for any concept, at any size, and in any format, without
drifting from the brand.

The engine lives in `scripts/`. Specs are JSON. Forty-nine worked examples live in
`examples/` (40 glyphs, 9 explainers and scenes) and double as templates: copy the nearest
one and change it.

## The language in one screen

| Mark | Drawn as | Means |
|---|---|---|
| **circle** | r5, white fill, 1px grey `#8F8E8A` | A thing in the program: a requirement, part, test, file, person. Present, not yet acted on. |
| **square** | 9×9 solid brand blue `#1F3ACB` | An outcome: verified, updated, approved, landed. The *result*. |
| **node** | r12 blue ring + 8×8 blue square | Flow itself: the live model, the baseline, the agent at work. **One per figure.** |
| **donut** | r12 dashed ring + r4 ring, grey | Waiting or frozen: a pending change request, a snapshot, a copy under review. |
| **ghost** | r5 dashed circle | Not real yet: a proposal, an alternative, an unstructured document. |
| **flag** | 8px mustard `#E29B03` diamond | At risk: suspect link, conflict, finding. Rare, at most one or two. |
| **dot** | small filled grey dot | A point on a grid or a curve: search space, crossings, ticks. |
| **line** | 1px grey, dash `4 5`, dashes march | A relationship: trace, link, flow of work. Drawn source → target. |
| **ring** | dashed circle | A scope: orbit, boundary, review lens. |
| **solid hairline** | 1px grey | Structure: an axis, a gate, a baseline tick. |
| **label / numeral** | Commit Mono 10px, grey / blue | Names of parts and step numbers, only in explainers. |

Grey is the world. Blue is what Flow does to it. Mustard is what needs a human.

## Non-negotiables

- **One node per figure.** The ringed square is Flow. Two of them means two Flows. The only
  exceptions: one per panel in a `steps` explainer, one per plane in a `stack` of alternatives.
- **Grey dominates.** Blue squares mark outcomes, not decoration: in a glyph, one to six, only
  where something is done. More blue than grey reads as a chart, not an explanation.
- **Mustard is rare.** One flag, two at most, and only when the concept involves risk.
- **No other colors, no gradients, no shadows, no rounded tiles, no icons, no arrows.** Direction
  comes from the order things appear in and the march of the dashes, not arrowheads.
- **Marks never scale with the drawing.** A bigger figure has more marks and more space, not
  bigger circles. (`scale` exists for billboard output only.)
- **Abstract, not literal.** No documents with folded corners, no gears, no robots, no brains,
  no cloud shapes. A supplier PDF is a ghost circle; an agent is the node; a reviewer is a circle
  that becomes a square.
- **One idea per glyph.** If the claim needs "and", it is two glyphs or a `steps` explainer.
- **Text lives outside small figures.** Glyphs carry no labels; the page's heading and body do the
  talking. Explainers may label parts (≤ 3 words each, lowercase mono, proper names keep their
  case) and number steps.
- **Never hand-write the SVG.** Write a spec, render, look, adjust the spec.

## Workflow

1. **Write the claim** in one sentence: "Change one requirement and every affected item is found."
   If there is no claim, there is no illustration.
2. **Find the concept** in [references/concepts.md](references/concepts.md). It maps ~45 Flow
   concepts (systems graph, traceability, impact, branching, reviews, agents, MCP, security…)
   to a metaphor, a motif, and an example file. If the concept is new, pick the metaphor from the
   motif table below.
3. **Pick the scale.**
   - *Glyph* — 240×200, one motif, no text. Website benefit rows, help-article headers, cards.
   - *Explainer* — 600–900 wide. A `steps` row of 3–5 numbered panels, or one wide motif
     (branching timeline) with sparse labels. Support pages, docs, onboarding.
   - *Scene* — 640×400 and up. A 3D `stack`, a large `graph`, or a Lissajous hero. Section
     heroes, decks, launch posts, video.
4. **Copy the nearest example** from `examples/small/` or `examples/large/` into the working
   folder and edit it. Spec format: [references/spec.md](references/spec.md).
5. **Render and look** before showing anyone:
   ```bash
   node <skill>/scripts/render.mjs figure.json --formats svg,png,strip
   ```
   The renderer prints lint warnings (`  ! …`) for what can be checked automatically: more
   than one node, too many flags or squares, colliding marks, clipping, off-centre glyphs,
   overlapping labels, slow builds. Fix each one, or know exactly why it is right.
   Then Read the PNG, and `figure.strip.png` (six frames of the build) for the choreography.
   Check against the review list below, adjust the spec, render again. Two or three rounds is normal.
6. **Export** what the destination needs (table below) and hand over the spec with the files.

First run in a fresh checkout: `cd <skill>/scripts && npm install` (installs the PNG
rasteriser, @resvg/resvg-js). Without it the renderer falls back to rsvg-convert, cairosvg,
or headless Chrome. Video needs `ffmpeg`.

## Motifs

Motifs are layouts that expand into marks. Choose by the shape of the idea:

| The idea is… | Motif | Examples |
|---|---|---|
| One thing affects many | `hub` (spokes), `fan` (one → hub → many) | impact, change, notifications, automations, MCP |
| Many feed one | `fan` with `inbound: true` | formulas, ingestion, reviews converging |
| Parallel tracks, one stands out | `rows` (`highlight`) | conflicts, integration paths, review states |
| Things circling a centre | `orbit` (`spin` to animate) | agents, evidence, security boundaries |
| Hierarchy | `tree` (bus or straight connectors) | decomposition, data model, traceability |
| Work forks and merges | `branch` | branches, merges, baselines, what-if |
| Everything is connected | `graph` (`layout: "radial"`) | systems graph, the live model |
| A closed set held together | `polygon` | skills, standards, triads |
| A perimeter, a way in | `boundary` (rings + ports) | security, deployment, sandboxes, write access |
| A whole seen at once | `globe`, `petals` | review lens, single source of truth, variants |
| Steps in time, gates | `timeline` | stage gates, baselines, audit trail |
| A search space, coverage | `grid` (`lens`, `selected`, `flagged`) | search, compliance checks, coverage |
| A sequence | `chain` | pipelines, trace chains |
| Brand line art, motion | `lissajous` | heroes, section dividers, loading states |
| Layers of one model (3D) | `stack` with a motif on each plane | systems graph across disciplines, views |
| A process in steps | `steps` with a motif in each panel | "how it works" explainers |

Primitives (`circle`, `square`, `node`, `line`, `ring`, `label`, `traveler`…) can be mixed
with motifs in the same spec, and every motif exposes anchors (`"fan.hub"`, `"g.r1n4"`,
`"sg.p3.leaf1"`) that lines and travellers can connect to. Any kind parameter set to `null` or
`"-"` draws nothing there. Layers without a `beat` build in order; a layer with a `beat` is
placed at that beat and doesn't move the order for the rest.

## Outputs

| Destination | Format | Flag |
|---|---|---|
| Website / product (React) | `<Name>.tsx`, motion/react, whileInView once, reduced-motion aware | `--formats tsx` (`--motion motion` if the app has no LazyMotion provider) |
| Docs, help center, Notion, email-safe web | `name.animated.svg` (CSS + SMIL, works as `<img>`) or `name.svg` | `animated`, `svg` |
| Figma, Slides, Keynote, print | `name.svg` (static) or `name.png` @2x | `svg`, `png` (`--png-scale 3`) |
| Social, launch video, slides with motion | `name.mp4` (build + 3 s), `--loop` for a seamless loop | `mp4`, `webm` (alpha), `gif` |
| Checking choreography | `name.strip.png`, `name@1.2s.png` | `strip`, `--frame 1.2` |

Themes: `light` (default, white page, transparent background), `tile` (brand-guide grey
`#F6F6F3`), `dark` (`#121212`), `blue` (full-bleed brand blue, white marks). Pick the theme of
the surface the figure sits on, so the circles' fill matches it.

## Motion

The site's motion, kept exactly: marks **pop** on a spring (stiffness 320, damping 22), lines
**draw** from source to target (or fade, `motion.lines: "fade"`, as on the current site),
staggered 0.1 s per beat, and dashed lines **march** forever (18 px per 2.6 s). Explainers add
**travellers** (a small blue square moving along a path), **ping** on the node, **pulse** on a
flag, **orbit** for satellites, and the 3D **rise** of planes. Every output honours
`prefers-reduced-motion`. Order of appearance tells the story: cause first, effect last.
Details: [references/vocabulary.md](references/vocabulary.md).

## Review checklist

1. The claim reads in two seconds without the caption.
2. One node (one per panel or alternative plane), blue squares only where something is *done*,
   at most two flags.
3. Grey covers most of the ink; nothing is decorative.
4. Nothing collides: marks ≥ 24 px apart center to center in glyphs, labels clear of lines.
5. The composition sits optically centered in the canvas, with ≥ 24 px clear on every side.
6. Lines run source → target, so the dashes march the right way and the draw-on tells the story.
7. The strip shows cause before effect; the build finishes in under ~2.5 s.
8. Glyphs have no text; explainer labels are lowercase mono, ≤ 3 words, never on top of a line.
9. Theme matches the surface. No colors outside the theme.
10. The spec is saved next to the exports, so anyone can re-render it.

## References

| File | Load when |
|---|---|
| [references/concepts.md](references/concepts.md) | Choosing what to draw for a Flow concept; the support-page illustration map |
| [references/spec.md](references/spec.md) | Writing or editing a spec: every primitive, motif parameter, anchor, camera, motion option |
| [references/vocabulary.md](references/vocabulary.md) | Exact sizes, colors, dash patterns, themes, motion values, and where they come from |
| [references/composition.md](references/composition.md) | Building explainers and scenes: layout, density, labels, 3D, heroes, known pitfalls |

Gallery of every example (animated): `examples/index.html` (open locally).
Brand context (type, color, voice): the `flow-brand` skill if installed.
