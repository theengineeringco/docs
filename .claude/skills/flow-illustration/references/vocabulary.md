# Vocabulary: marks, lines, color, motion

Measured from the website kit (`flowengineering-website`: `src/components/illustrated-benefits.tsx`,
`illustrated-benefits-motion.ts`, `src/app/product/*/_benefits.tsx`), the Flow Brand Guide's
line-art slide, and `src/components/tools-in-the-loop/` (the turning Lissajous). Values below
are what the engine uses (`scripts/lib/tokens.mjs`). When the site changes, change the tokens.

## 1. Where the language comes from

The site draws every benefit glyph in a `viewBox` of about 205×200 (displayed `h-56`, 224 px
tall, left-aligned with `xMinYMid meet`). Twelve glyphs on four product pages use only five
components: `DashedLine`, `DashedCircle`, `GreyCircle`, `BlueSquare`, `BlueNode`, plus a
dashed grey donut on two pages. That restraint is the style. This skill adds a few marks
(ghost, flag, dot, label, traveller, plane) that the support pages need, each derived from
those five, never a new idiom.

## 2. Marks

| Mark | Geometry (scale 1) | Fill / stroke | Site source |
|---|---|---|---|
| circle | r 5 | fill paper, stroke `#8F8E8A` 1 px | `GreyCircle` |
| circleSmall | r 4 | same | lane starts in the conflict rows |
| square | 9 × 9, centred | fill `#1F3ACB` | `BlueSquare` |
| node | ring r 12 + square 8 × 8 | ring stroke blue 1 px, fill paper | `BlueNode` |
| focus | ring r 15 + square 8 | ring draws on (pathLength) | `SourceIllustration` |
| donut | ring r 12 dashed `3 3` + ring r 4 | grey | `GreyNode` / `GreyDonut` |
| ghost | r 5 dashed `3 3` | grey, fill paper | new: not-yet-real things |
| flag | 8 px square rotated 45° (diamond) | mustard `#E29B03` (yellow-600) | new: the brand's warm secondary |
| dot / dotLarge | r 2.5 / r 4.5 | fill ink | brand-guide line-art dots |
| traveller | 5 × 5 square | blue | new: a change in transit |

**Meaning is fixed.** A square is never "a thing", always "a result". The node is always Flow
(the live model, the baseline, the agent working on it). Don't swap them for variety.

## 3. Lines

| Style | Stroke | Dash | Marches | Use |
|---|---|---|---|---|
| dashed | `#8F8E8A` 1 px | `4 5` | yes | Every relationship by default |
| fine | grey | `3 3` | yes | Secondary links: reviewers, sub-links |
| faint | `#C9C8C4` | `4 5` | yes | Background links: chords, context |
| solid | grey | — | no | Axes, gates, baseline ticks |
| faintSolid | `#C9C8C4` | — | no | Drafting guides, log lines |
| dotted | grey | `1 2.5` | no | Not live: alternatives, what-if, proposals, provenance back to a source document, and moves in time (revert, rebase, restore). Also the back of 3D curves |
| accentDashed | blue | `4 5` | yes | The single path that matters in a big figure (a trace) |
| accent | blue | — | no | Rare; a selected route |
| ink | `#6B6A66` | — | no | Line art (Lissajous), box edges |

Lines go source → target. The dash march (offset 0 → −18 over 2.6 s, linear, infinite) moves
dashes toward the target, so an inbound line must be authored from the outside in. 18 is a
common multiple of both dash periods (9 and 6), so the loop is seamless.

Lines end at mark centres; marks are drawn on top with a paper fill that hides the line end.
Draw order is automatic: planes → rings → lines → marks → travellers → labels.

## 4. Color and themes

| Key | light | tile | dark | blue |
|---|---|---|---|---|
| background | transparent | `#F6F6F3` | `#121212` | `#1F3ACB` |
| paper (mark fill) | `#FFFFFF` | `#F6F6F3` | `#121212` | `#1F3ACB` |
| line | `#8F8E8A` | `#888782` | `#85847F` | white 60% |
| faint | `#C9C8C4` | `#C2C1BD` | `#4A4945` | white 30% |
| ink | `#6B6A66` | `#62615D` | `#B3B2AD` | white 88% |
| accent | `#1F3ACB` | `#1F3ACB` | `#8DACF7` | `#FFFFFF` |
| flag | `#E29B03` | `#E29B03` | `#F8C881` | `#F8C881` |
| label | `#6B6A66` | `#62615D` | `#B3B2AD` | white 88% |

- `#1F3ACB` is brand blue-600; `#8DACF7` is the ramp's light step for dark grounds; white is
  the brand's mark color on blue. Mustard `#E29B03` is the brand's sanctioned warm secondary
  ("for diagrams and data where blue would carry too much weight").
- Line, ink, and label greys are darker than the website's (which uses `#C9C8C4` lines and
  `#8F8E8A` labels on white) so figures stay legible when scaled down: labels and ink are
  at least 4.5:1 against the surface in every theme, lines at least 3:1.
- No third hue. Product accents (green, red, teal, violet) stay in product UI.
- `paper` must equal the surface the figure sits on, or circles show as white discs. On a
  card of a different color, pass `"colors": { "paper": "#…" }`.

## 5. Type inside figures

- Labels: **Commit Mono** 10 px, `label` grey, tracking 0.02 em, lowercase except proper
  names (GovCloud, GitHub, CAD), ≤ 3 words.
  The font ships in `assets/fonts/` (MIT) so PNGs and video render it anywhere; SVGs name
  `'Commit Mono', 'IBM Plex Mono', ui-monospace…` (the site's mono is IBM Plex Mono, the
  brand's is Commit Mono).
- Numerals: the same face in blue, `01` `02`: the site's step label convention.
- Captions under `steps` panels use `ink` grey and can be sentence case.
- Headlines never go inside the figure: set them in Unica 77 LL on the page.

## 6. Motion

| Behaviour | Values | Applies to |
|---|---|---|
| pop | scale 0 → 1, spring stiffness 320, damping 22 (≈ 9% overshoot, settles in ~0.45 s); opacity over 0.3 s | marks, rings |
| draw | dashoffset/pathLength 1 → 0, `cubic-bezier(.65,0,.35,1)`, 0.35–0.9 s by length | lines (dashed lines draw through a mask so the dash pattern survives) |
| fade | opacity over 0.5 s ease-out | the site's line entrance (`motion.lines: "fade"`), labels |
| rise | opacity + translateY 6 → 0 over 0.7 s, ease `[0.22, 1, 0.36, 1]` | 3D planes, tiles |
| march | dashoffset 0 → −18, 2.6 s linear, infinite | every dashed line and ring |
| traveller | moves along a path, eased in-out, rests at the end (`hold` 0.25), fades out | propagation, notifications, traces |
| ping | ring r12 → r25, opacity 0.45 → 0, 2.6 s | the node, when something emanates from it |
| pulse | opacity 1 → 0.35 → 1, 2.4 s | a flag that needs attention |
| orbit | satellites circle the centre, alternate rings counter-rotate | `orbit` with `spin` |

Timing: beats 0.1 s apart (the site's `staggerChildren: 0.1`), marks inside a beat 0.05 s
apart. A glyph builds in 1–1.7 s; an explainer in 2–3 s. Order is the story: the node or
the cause first, links next, outcomes last.

Reduced motion: animated SVG drops all animation and shows the finished figure; TSX passes
`custom = -1` so every variant lands on its final state with no transition and loops are off.

Loops for video: a `--loop` render is seamless when every traveller and orbit period is a
multiple of 2.6 s (2.6, 5.2, 7.8, 10.4, 13…).
