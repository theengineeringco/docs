# Spec format

A spec is a JSON object (or an `.mjs` file whose default export is one spec, an array of
specs, or a function returning either). Render it with:

```bash
node <skill>/scripts/render.mjs figure.json [--formats svg,animated,png,tsx,mp4,webm,gif,strip] [--out dir]
```

Other flags: `--png-scale 3`, `--background "#fff"`, `--frame 1.2` (PNG at t = 1.2 s),
`--seconds 6` and `--fps 30` (video), `--loop` (video of the loops only, seamless),
`--motion motion` (TSX imports `motion` instead of `m`), `--quiet` (skip lint warnings),
`--strip-cols 2` (strip layout; wide figures default to a 2-column grid). Several specs at once:
`render.mjs a.json b.json …` or a glob. Contact sheet of SVGs:
`node scripts/sheet.mjs out.png a.svg b.svg … --cols 4 --cell 300 [--tile]`.

## Top level

```jsonc
{
  "name": "impact-analysis",          // file names; TSX component becomes ImpactAnalysisIllustration
  "title": "Impact in seconds",       // <title> / aria-label
  "description": "…",                 // <desc>
  "size": [240, 200],                  // canvas px at 1x
  "theme": "light",                    // light | tile | dark | blue
  "colors": { "accent": "#1F3ACB" },   // override theme keys (rarely)
  "background": null,                  // null = transparent; default is the theme's
  "camera": "flat",                    // flat | iso | shelf | plan | front | { view, azimuth, elevation, marks }
  "fit": false,                        // false | "center" | "contain" (3D cameras default to "contain")
  "padding": 24,                       // used by fit
  "viewBox": [35, 0, 205, 200],        // optional crop, e.g. the site's left-aligned benefit box
  "align": "left",                     // left | right: preserveAspectRatio xMin/xMax
  "scale": 1,                          // mark size multiplier, billboards only
  "motion": { "stagger": 0.1, "lines": "draw", "march": true },
  "layers": [ … ]
}
```

`motion` keys: `stagger` (s per beat, 0.1), `within` (s between marks in one beat, 0.05),
`delay` (0.05), `lines` (`draw` from source to target, or `fade` like the current site),
`march` (dashes move, true), `popDuration`, `fadeDuration`, `drawDuration`, `spring`
(`{ stiffness, damping, mass }`), `ease`, `wireEase`.

## Layers

Every entry in `layers` is a **primitive** (`"type": "circle"`) or a **motif**
(`"motif": "hub"`). Common keys on any layer:

| Key | Meaning |
|---|---|
| `id` | Name for anchors. A motif's anchors become `"<id>.<anchor>"`. Must be unique. |
| `beat` | When it builds, in beats of `stagger` seconds. Top level: absolute. Nested: relative to the parent. Same rule at every level: layers without a `beat` build one after another; a layer with an explicit `beat` is placed there and does **not** move the cursor for the layers after it. |
| `holdCursor` | `true` on a layer without a `beat`: the next layer starts at the same beat as this one. |
| `offset` | `[dx, dy]` translation of the layer's local coordinates (only an array counts; a traveller's phase is `phase`). |
| `plane` | `{ "z": 80, "origin": [x, y], "axis": "xy" }` lays the layer's flat coordinates onto a 3D plane (3D cameras). |
| `enter` | `pop` (marks), `draw` (lines), `fade`, `rise` (planes), `none`. |
| `loop` | `none`, `ping` (node), `pulse` (flag), `{ "type": "orbit", "center": [x,y] or "anchor", "period": 40 }`. |
| `opacity` | 0–1 for the whole layer. |
| `lineStyle` | (motifs) default style for the motif's lines. |
| `layers` | Child layers, expanded in this layer's space (groups). |

Points are `[x, y]`, `[x, y, z]`, or an anchor string such as `"fan.hub"` or `"sg.p3.leaf1"`.

### Kinds

Mark kinds, also usable as one-letter codes in pattern strings (`"kinds": "cscs"`):

| Code | Kind | | Code | Kind |
|---|---|---|---|---|
| `c` | circle (r5) | | `d` | donut |
| `C` | circleSmall (r4) | | `g` | ghost |
| `s` | square (9) | | `f` | flag |
| `n` | node | | `o` / `O` | dot / dotLarge |
| `-` | nothing (skip this position) | | | `focus` (node with r15 ring that draws on) |

`null` and `"-"` mean the same thing for every kind parameter (`center`, `source`, `tip`,
`forkKind`, `startKind`…): no mark there. A skipped position still registers its anchor.

## Primitives

| Type | Keys |
|---|---|
| `circle` `circleSmall` `square` `node` `focus` `donut` `ghost` `flag` `dot` `dotLarge` | `at`, optional `r`, `size`, `color` (theme key or hex), `loop` |
| `line` | `from`, `to`, `via` (extra points), `route` (`straight`, `elbow`, `curve`, `arc`), `axis` (`x`/`y`, for elbow/curve), `radius` (elbow corner, 8), `bend` (0–1, where the elbow turns), `tension` (curve), `lift` (arc peak in px; positive bows to the left of travel, i.e. up on a left-to-right line), `bulge` (older arc control: share of the chord, positive bows to the right of travel; peak = bulge × chord ÷ 2), `style`, `width`, `color`, `id` |
| `path` | `points`, `closed`, `rounded` (corner radius), `style`, `id` |
| `ring` | `at`, `r`, `style` (default dashed), `axis` (`xy`, `xz`, `yz` in 3D) |
| `ellipse` | `at`, `rx`, `ry`, `rot`, `style` |
| `frame` | `at` (centre), `size`, `style` (default dashed; `none` for a filled tile), `fill` (e.g. `tile`) |
| `plane` | `at` `[x, y, z]` (centre), `size` `[w, d]`, `label`, `labelCorner` (`left`/`right`), `fill`, `fillOpacity` (0.86), `style` |
| `box` | `at` `[x, y, z]` (base centre), `size` `[w, d, h]`, `top` (`accent` for a blue lid), `stroke` |
| `label` / `numeral` | `at`, `text`, `dx`, `dy`, `anchor` (`start`/`middle`/`end`), `size` (10), `color` (`label`, `ink`, `accent`), `tracking` (0.02 em) |
| `traveler` | `along` (a line `id` declared earlier, or a list of points/anchors), or `from`/`to`; `period` (s, use multiples of 2.6), `phase` (0–1, staggers several travellers), `hold` (fraction resting at the end, 0.25), `size` (5), `glyph` (`square`/`dot`), `closed`. On an `accentDashed` path a blue traveller is low-contrast; prefer it on grey paths. |

### Line styles

`dashed` (default: grey, 4 5, marches) · `fine` (grey 3 3, marches) · `solid` · `dotted`
(1 2.5) · `faint` (lighter dashed) · `faintSolid` · `ink` (darker solid) · `inkDashed` ·
`accent` (blue solid) · `accentDashed` (blue dashed, marches: the one path that matters) ·
`flag` (mustard dashed) · `ghost` · `none`.

### Theme color keys

`background`, `paper` (fill that hides lines under marks: the surface color), `line`,
`faint`, `ink`, `accent`, `accentSoft`, `flag`, `label`, `plane`, `planeStroke`, `tile`.

## Motifs

All motifs take `at` (their anchor point) and `id`. Defaults are tuned for a 240×200 glyph
centred at (120, 100).

### hub — spokes from a centre
`count` (8) · `radius` (58) · `start` (−90°) · `angles` (explicit degrees) · `lengths`
(per spoke) · `kinds` (`"cs"`) · `rings` (dashed rings, radii) · `ports` (radius: small circle
where each spoke crosses a boundary) · `portKind` · `spokes` (false = no lines) · `spokeStyle` ·
`spokeStyles` (per spoke, e.g. one `accentDashed` among `faint`) · `spokeBeats` (per spoke) ·
`jitter` + `seed` · `center` (`"n"`; `null` for none).
Anchors: `center`, `0` … `n-1`.

### fan — one → (hub) → many, or many → one
`direction` (`right` `left` `down` `up`) · `count` (3) · `spread` (96, across) · `reach` (122,
along) · `via` (54: distance to the hub; `false` = no hub) · `arc` (bow the targets) ·
`targets` (`"s"`) · `lineStyles` (per target) · `source` (`"c"`) · `hubKind` (`"n"`) · `inbound`
(true = lines flow from the targets into the hub and on to `at`).
Anchors: `source`, `hub`, `0` … `n-1`.

### rows — parallel lanes
`count` (3) · `gap` (40) · `width` (148) · `mid` (0.5) · `starts` (`"C"`) · `mids` (`"d"`) ·
`ends` (`"s"`) · `highlight` (lane index that gets the node).
Anchors: `start<i>`, `mid<i>`, `end<i>`.

### orbit — rings with satellites
`rings` (`[34, 60]`) · `satellites` (`[{ ring, angle, kind }]`) or `perRing` + `kinds` +
`seed` · `spin` (seconds per turn: satellites orbit, alternate rings counter-rotate) · `center`.
Anchors: `center`, `0` … for satellites.

### tree — hierarchy
`direction` (`down`, `right`) · `spacing` (`[levelGap, siblingGap]`, `[52, 36]`) · `branching`
(`[3, 2]`) or `root` (`{ kind, id, children: [...] }`) · `levels` (kind per depth,
`["n", "c", "s"]`) · `route` (`bus`: one stem, one bus, a drop per child; `straight`;
`elbow`) · `busAt` (0.5).
Anchors: `root`, `leaf0` …, and any node `id`.

### branch — git-style trunk with branches
`length` (140) · `laneGap` (46) · `radius` (corner, 0) · `trunkStyle` · `commits` (fractions on
the trunk) · `commitKind` (`"o"`) · `branches`: `[{ from, to | until, lane (−1 up, +1 down),
laneGap, commits: [fractions], commitKind, tip, mergeKind, forkKind, style, beat }]` (`to`
merges back, `until` leaves it open with a `tip`) · `baselines` (fractions: a solid tick) ·
`baselineHeight` (18) · `baselineSide` (`auto`: away from the lane that merges there; `both`,
`above`, `below`) · `head` (fraction for the node, default end; `null` for none) · `headKind` ·
`headBeat` · `startKind` (dropped automatically when a fork sits within 24 px of the start).
Timing follows the pen: the head appears as the trunk reaches it, each lane starts once its
fork exists, commits pop as their lane reaches them, merges and baselines land last. Override a
lane with `beat`, the head with `headBeat`.
Anchors: `start`, `end`, `head`, `fork<i>`, `lane<i>`, `merge<i>`, `tip<i>`, `b<i>c<k>`,
`baseline<i>`.

### graph — a network
Scatter (default): `size` (`[170, 130]`) · `count` (18) · `seed` · `k` (neighbours, 2) ·
`hole` (empty radius round the centre) · `spokes` (5) · `squares` / `squareCount` · `shape`
(`rect`). Radial (`layout: "radial"`, recommended): `rings` (nodes per ring, `[5, 9]`) ·
`radii` · `offsets` (start angle per ring) · `angleJitter` · `radiusJitter` · `chords` (0–1
share of ring-neighbour links, faint) · `squares` (`[[ring, i], …]`) · `marks` (`{ "1,3": "f" }`
overrides) · `ringKinds` · `center`.
Anchors: `center`, scatter `0` …, radial `r<ring>n<i>`.

### polygon — a closed set
`sides` (3) · `radius` (64) · `rotation` (−90) · `vertices` (`"s"`) · `midpoints` (`"c"`) · `center`.
Anchors: `center`, `v<i>`, `m<i>`.

### globe — circle, meridians, equator
`radius` (52) · `meridians` (`[20]`, rx values) · `parallels` · `equator` · `extend` · `poles`
· `ends` · `center`. Anchors: `center`, `west`, `east`.

### petals — overlapping rings round a centre
`count` (5) · `radius` (40) · `distance` (34, centre to each ring) · `start` · `marks` (kinds at
the outer tips) · `center` (`focus`). Anchors: `center`, `0` ….

### timeline — an axis with gates and events
`length` (150) · `direction` (`right`, `down`) · `axisStyle` · `ticks` (count of dots) · `gates`
(fractions: solid bars) · `gateHeight` · `events`: `[{ at, kind, lift, label, beat }]` (`lift`
raises the event off the axis on a stem, px, positive = above; `beat` times one event on its own).
Don't put a gate and an event at the same fraction: the bar runs through the mark.
Anchors: `start`, `end`, `gate<i>`, `e<i>`.

### grid — a lattice
`cols` (7) · `rows` (5) · `gap` (24) · `kind` (`"o"`) · `dotSize` · `dotColor` · `selected`
(`[[col, row], …]`) or `selectCount` + `seed` · `selectedKind` (`square`) · `selectedSize` ·
`flagged` · `lens` (`{ at: [col, row], r }`).
Anchors: `"c,r"` for every cell, `lens`.

### boundary — nested perimeters with ports
`rings` (radii, `[36, 58]`) · `ports` (angles on the outer ring, or `[{ angle, ring, kind }]`) ·
`portKind` (`"C"`) · `style` · `center` (`"n"`; `null` when the content inside has its own
node). No satellites. Use for security perimeters, deployment scopes, sandboxes, write gates.
Anchors: `center`, `port<i>`.

### chain — marks joined in sequence
`points` or `count` + `length` (+ `wave`) · `kinds` (`"cccs"`) · `route` · `axis`.
Anchors: `0` ….

### lissajous — the symbol's family
`size` (`[150, 150]`) · `a`, `b` (frequencies; 1:3 is the Flow mark, 3:2 and 3:4 read as
Flow too) · `phase` (90) · `turn` (rotation about the vertical axis in degrees, 3D) · `depth`
(true: front arc solid, back arc dotted) · `width` (1.25) · `style` (`ink`, `line`, `accent`) ·
`ghost` (phase in degrees of a dotted second copy; use with `depth: false`) · `dots` (`both`,
`crossings`, `extremes`, `none`) · `crossingKind` (`dotLarge`) · `turningKind` (`dot`) ·
`guides` (`true`, `"x"`, `"y"`: faint drafting hairlines through the dots) · `guideExtent` ·
`travelers` (count of blue squares running the curve) · `travelPeriod` (10.4).
Anchors: `center`, `dot<i>`.

### stack — planes of one model in 3D
Use with a 3D camera (`shelf` reads best). `planes`: `[{ label, motif: "...", …motif params in
plane-local coordinates (0..w, 0..d) } | { label, layers: [...] } | { label, marks: [...] }]`,
bottom plane first · `size` (`[180, 150]`) · `gap` (80, plane spacing in z) · `labelCorner` ·
`connectors`: `[{ from, to, style }]` with anchors like `"<stackId>.p2.r1n2"` (plane `i`'s
motif gets id `<stackId>.p<i>`) — they build after every plane has finished · `beatGap` (2) ·
`alternatives` (true when the planes are versions of the same thing, e.g. deployment targets:
each plane may then carry its own node). Plane depth is foreshortened on screen (about 0.4×
on `shelf`): space marks further apart along the plane's depth than you would on a flat glyph,
and let lint tell you where they still collide.
Anchors: `p<i>` (plane centre), `p<i>n<k>` for seeded marks.

### steps — numbered panels, one motif each
`cell` (`[200, 170]`) · `gap` (24) · `items` (one per panel: a motif spec, or a group
`{ "layers": [...] }` of primitives and motifs, in panel-local coordinates) · `labels` (captions
under each panel; about 32 characters fit a 200 px panel, lint warns past the panel width) ·
`tiles` (grey panel fill, true) · `tileFill` · `numerals` (true: 01, 02…) · `connect` (dashed
line between panels) · `beatGap` (5). Canvas: width = 2 × `at[0]` + n × `cell[0]` +
(n − 1) × `gap`; height = `at[1]` + `cell[1]` + 50 for captions.
Anchors: `0` … (panel centres); panel content ids `<id>.s<i>` when the motif has an id.

## Worked example: a primitive glyph

```json
{
  "name": "suspect-links",
  "size": [240, 200],
  "layers": [
    { "type": "line", "from": [62, 100], "to": [176, 52] },
    { "type": "line", "from": [62, 100], "to": [176, 100] },
    { "type": "line", "from": [62, 100], "to": [176, 148] },
    { "type": "node", "at": [62, 100] },
    { "type": "circle", "at": [176, 52] },
    { "type": "circle", "at": [176, 100] },
    { "type": "circle", "at": [176, 148] },
    { "type": "flag", "at": [119, 76] },
    { "type": "flag", "at": [119, 100] },
    { "type": "flag", "at": [119, 124], "loop": "pulse" }
  ]
}
```

## Worked example: motifs and anchors

```json
{
  "name": "notifications",
  "size": [240, 200],
  "layers": [
    { "motif": "fan", "id": "fan", "at": [62, 100], "via": false, "reach": 116, "spread": 100, "targets": "c", "source": "n" },
    { "type": "traveler", "from": "fan.source", "to": "fan.0", "period": 2.6 },
    { "type": "traveler", "from": "fan.source", "to": "fan.1", "period": 2.6, "offset": 0.15 },
    { "type": "traveler", "from": "fan.source", "to": "fan.2", "period": 2.6, "offset": 0.3 }
  ]
}
```

Larger compositions (`steps`, `stack`, wide `branch` with labels, heroes) are in
`examples/large/`.
