# flow-illustration

Abstract illustrations for Flow: the dashed-line, grey-circle, blue-square language of the
flowengineering.com feature pages, as a skill and a small render engine. Describe the concept
to Claude ("make an illustration for required reviewers", "a how-it-works explainer for
automations", "a hero for the agents section on blue") and it writes a spec, renders it,
checks it, and hands you SVG, animated SVG, PNG, a React component, or video.

## Install

Copy this folder to `~/.claude/skills/flow-illustration` (Claude Code) or upload it as a
skill in Claude. Then, once:

```bash
cd ~/.claude/skills/flow-illustration/scripts && npm install
```

That installs the PNG rasteriser (@resvg/resvg-js). Node 18+ is required; `ffmpeg` only for
MP4/WebM/GIF.

## Use it by hand

```bash
# one figure, the usual formats
node scripts/render.mjs examples/small/impact-analysis.json --out out/

# everything a destination might need
node scripts/render.mjs my-figure.json --formats svg,animated,png,tsx,mp4

# check the build order without a browser
node scripts/render.mjs my-figure.json --formats strip

# contact sheet, gallery
node scripts/sheet.mjs sheet.png out/*.svg --cols 4 --cell 300
node scripts/gallery.mjs examples/index.html examples/large examples/small
```

## What's inside

| Path | |
|---|---|
| `SKILL.md` | The system: vocabulary, rules, workflow, motifs, outputs, review checklist |
| `references/concepts.md` | ~45 Flow concepts → metaphor → example (the support-page illustration map) |
| `references/spec.md` | Spec format: every primitive, motif, parameter, anchor |
| `references/vocabulary.md` | Exact sizes, colors, dash patterns, themes, motion values and their sources |
| `references/composition.md` | Explainers, 3D scenes, heroes, labels, choreography, pitfalls |
| `examples/small/` | 40 glyphs (240×200) with spec, SVG, animated SVG, PNG |
| `examples/large/` | 9 explainers and scenes, with MP4s for six of them |
| `examples/index.html` | Gallery of all examples, animated |
| `scripts/` | `render.mjs`, `sheet.mjs`, `gallery.mjs`, and the engine in `lib/` |
| `assets/fonts/` | Commit Mono (MIT) for labels in PNG and video |

## Outputs

- `name.svg`: static, for Figma, slides, docs.
- `name.animated.svg`: self-contained CSS + SMIL animation, works as an `<img>`; respects
  reduced motion.
- `name.png`: @2x by default (`--png-scale`).
- `Name.tsx`: a `motion/react` component in the website's idiom (whileInView once, spring pops,
  marching dashes). Uses `m.*` by default (needs the site's LazyMotion provider); pass
  `--motion motion` elsewhere.
- `name.mp4` / `.webm` / `.gif`: the build plus three seconds of loops; `--loop` for a seamless
  loop of the finished figure.

The engine has no runtime dependencies beyond Node; resvg is only for PNG and video.
