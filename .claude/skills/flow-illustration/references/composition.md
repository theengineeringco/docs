# Composition: glyphs, explainers, scenes

## Glyphs (240 × 200)

- Content sits in a ~160 × 130 box centred on (120, 100): x 40–200, y 35–165. Leave
  ≥ 24 px clear to every edge so the glyph survives cropping (the site crops to
  `viewBox="35 0 205 200"` and left-aligns: add `"viewBox": [35, 0, 205, 200], "align": "left"`
  to match it exactly).
- Spacing comes from a few distances: 24 (tightest, mark to mark), 40–48 (row gap, link
  length), 52–60 (spoke radius), 96 (fan spread). Marks closer than 24 px centre to centre
  collide visually; donuts and nodes need 30+.
- 6–16 marks. Fewer reads empty, more reads as data.
- 1–6 blue squares (only where something is done), one node, up to two flags. The rest grey.
- No text.

## Explainers (600–900 wide)

**Steps** (`large/change-flow`, `large/how-reviews-work`): panels 200 × 170, gap 22, grey tiles
(`tile` fill), numerals top-left, captions 20 px under each panel in ink grey, sentence case,
≤ 6 words (~32 characters). Canvas width = 2 × left inset + n × 200 + (n − 1) × 22. Panels can
hold a group (`{ "layers": [...] }`) when one motif isn't enough. Each panel is
a glyph authored in panel-local coordinates, centred near (100, 88). Keep one motif per panel
and repeat marks across panels so the reader can follow an item from step to step (the node
that pinged in 02 is the agent in 03). 3–5 panels; more becomes a slideshow.

**Wide diagrams** (`large/branching-wide`, 760 × 280): one motif stretched, rounded corners
(`radius: 10`) at this size, lane gap 56–60, labels in lowercase mono placed at lane starts
(`dx: 14, dy: −14` above, `dy: 22` below) and baselines (`anchor: "middle"`). Alternate labels
above and below the trunk so they never stack. Label only what the caption can't say.

## Scenes (640 × 400 and up)

**3D stacks** (`large/systems-graph-stack`): camera `shelf` (azimuth 30, elevation 24). Up to
four planes, 240 × 170, `gap` ~100 so planes never overlap on screen. Give each plane a
different motif (tree, radial graph, grid, rows) so disciplines read as different, put
plane-local content inside 15–85% of the plane, and draw one trace across planes in
`accentDashed` with a traveller on it. Plane labels on the left, lowercase. Marks face the
screen (default); `camera.marks: "plane"` lays them flat as ellipses and rhombi, which is more
literal but less legible. Use `route: "straight"` for trees on planes (bus elbows zigzag in
projection).

**Graph heroes** (`large/agents-graph`): radial graph, rings `[6, 11, 16]`, `size` ~ 88% of the
canvas, `chords: 0.35`, 4–6 squares on outer rings, one flag, node with `ping`, 2–3
travellers from the node to squares. On `blue` theme everything inverts to white.

**Line-art heroes** (`large/lissajous-hero`): `tile` theme, 1:3 in the rest pose (`turn: 0`)
is the Flow symbol; 3:2 and 3:4 are its family. `guides: "y"` adds drafting lines through the
dots. Two travellers at a slow period (13 s) for motion. For the symbol turning in 3D on the
website, reuse `src/components/tools-in-the-loop/lissajous.tsx` rather than this engine.

**Alternatives in 3D** (`large/deployment-stack`): when planes are versions of one thing (cloud,
GovCloud, self-hosted), give the stack `alternatives: true`; each plane then carries its own
node, and lint counts it like steps panels. Use `boundary` for perimeters and a ghost outside
wired to the port for "one way in".

## Labels

Lowercase Commit Mono (proper names keep their case), 10 px at scale 1, label grey, ≤ 3 words, a noun phrase
("baseline 12", "agent: thermal rerun", "what if: 420 Nm"). Never on top of a line; offset
from the mark it names by ≥ 14 px. Numerals for steps only. If you need more than five labels,
the explanation belongs in the page copy.

## Motion choreography

- Cause first: the node or the incoming event appears first, links draw away from it, results
  pop last. Set `beat` on layers to force order; motifs already order themselves this way.
- Loops are ambient: dash march everywhere; travellers on at most three paths; one ping; one
  pulse. A scene where everything moves explains nothing.
- Builds take 1–1.7 s for glyphs and 2–3 s for explainers. Raise `motion.stagger` (0.12–0.14)
  for slow, deliberate heroes; lower it for dense figures.
- Check the order in the strip (`--formats strip`) or at a moment (`--frame 1.4`).

## Pitfalls (each one cost a render)

- **`offset` is the layer translation** (`[dx, dy]`). Petals use `distance`, travellers `phase`,
  timeline events `lift`.
- **Foreshortening on planes.** On `shelf`, plane-local directions around 54° and 234° shrink to
  ~40% on screen. A hub of radius 50 on a plane needs spokes at angles like −90, −10, 90, 170.
- **Motif centres add a node.** `hub`, `orbit`, `graph`, `fan` draw a node by default. If you
  place your own node (for `ping`), pass `"center": null` to the motif or you get two.
- **Two circles touching** at a branch start: a fork within 24 px of the trunk start suppresses
  the start mark automatically; otherwise move `from` to ≥ 0.15.
- **Cross-plane connectors** must reference plane-motif anchors (`"<stackId>.p<i>.<anchor>"`);
  they build after all planes finish.
- **Override keys** in `marks` (radial graph) and grid cells are strings `"ring,index"` with no
  space.
- **Travellers** reference a line `id` only if that line is declared earlier; otherwise use
  `from`/`to` or a list of anchors in `along`. A blue traveller on a blue path barely shows.
- **Explicit beats** place a layer without moving the build cursor, at every level. To make a
  later layer wait, give it a beat too.
- **Paper must match the surface**, or circles become white discs on a grey card.
- **Seamless video loops** need periods that are multiples of 2.6 s.
- **Dashed lines that overlap** (two links along the same segment) double their dashes and look
  broken. Route trees with `bus`, or offset parallel links by ≥ 6 px.
