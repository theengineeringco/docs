#!/usr/bin/env node
// Render Flow illustration specs.
//
//   node render.mjs <spec.json|spec.mjs> [...more] [options]
//
//   --out <dir>          output folder (default: next to the spec)
//   --formats <list>     svg,animated,png,tsx,mp4,webm,gif,strip   (default svg,animated,png)
//   --png-scale <n>      PNG pixel density (default 2)
//   --background <css>   PNG/video background (default: theme background, else transparent PNG / white video)
//   --seconds <n>        video length (default: build + 3 s of loops)
//   --fps <n>            video frame rate (default 30)
//   --loop               video of the loops only (seamless, figure already built)
//   --frame <t>          also write <name>@<t>s.png, the figure at time t
//   --strip-cols <n>     columns in the strip sheet (default: 2 for wide figures, else 3 or 6)
//   --motion <m|motion>  TSX import: "m" (site default, needs LazyMotion) or "motion"
//   --quiet              skip the lint warnings (printed as "  ! ..." after each figure)
//
// Exit code 1 on any spec error, with the message.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { resolve, dirname, basename, extname, join } from "node:path"
import { pathToFileURL } from "node:url"
import { spawn } from "node:child_process"
import { compile } from "./lib/compile.mjs"
import { renderStatic, renderAnimated, renderFrame } from "./lib/svg.mjs"
import { svgToPng, hasFfmpeg } from "./lib/raster.mjs"
import { renderTSX } from "./lib/tsx.mjs"
import { MARCH } from "./lib/tokens.mjs"
import { lint } from "./lib/lint.mjs"

const args = process.argv.slice(2)
const files = []
const opt = { formats: "svg,animated,png", "png-scale": "2", fps: "30" }
for (let i = 0; i < args.length; i++) {
  const a = args[i]
  if (a.startsWith("--")) {
    const k = a.slice(2)
    if (k === "loop") opt.loop = true
    else if (k === "quiet") opt.quiet = true
    else opt[k] = args[++i]
  } else files.push(a)
}
if (!files.length) {
  console.error("usage: node render.mjs <spec.json|spec.mjs> [--out dir] [--formats svg,animated,png,tsx,mp4,webm,gif,strip]")
  process.exit(1)
}

async function loadSpec(file) {
  const p = resolve(file)
  if (extname(p) === ".mjs" || extname(p) === ".js") {
    const mod = await import(pathToFileURL(p).href)
    const v = mod.default ?? mod.spec
    return typeof v === "function" ? v() : v
  }
  return JSON.parse(readFileSync(p, "utf8"))
}

const formats = new Set(opt.formats.split(",").map((s) => s.trim()))
let failed = false

for (const file of files) {
  try {
    const specs = [].concat(await loadSpec(file))
    for (const spec of specs) {
      const name = spec.name ?? basename(file, extname(file))
      spec.name = name
      const out = resolve(opt.out ?? dirname(resolve(file)))
      mkdirSync(out, { recursive: true })
      const scene = compile(spec)
      const written = []
      const bg = opt.background ?? scene.background ?? undefined

      if (formats.has("svg")) {
        writeFileSync(join(out, `${name}.svg`), renderStatic(scene))
        written.push(`${name}.svg`)
      }
      if (formats.has("animated")) {
        writeFileSync(join(out, `${name}.animated.svg`), renderAnimated(scene))
        written.push(`${name}.animated.svg`)
      }
      if (formats.has("png")) {
        writeFileSync(join(out, `${name}.png`), await svgToPng(renderStatic(scene), { scale: +opt["png-scale"], background: opt.background }))
        written.push(`${name}.png`)
      }
      if (formats.has("tsx")) {
        writeFileSync(join(out, `${pascal(name)}.tsx`), renderTSX(scene, { motionImport: opt.motion ?? "m" }))
        written.push(`${pascal(name)}.tsx`)
      }
      if (opt.frame != null) {
        const t = +opt.frame
        writeFileSync(join(out, `${name}@${t}s.png`), await svgToPng(renderFrame(scene, t), { scale: +opt["png-scale"], background: opt.background }))
        written.push(`${name}@${t}s.png`)
      }
      if (formats.has("strip")) {
        writeFileSync(join(out, `${name}.strip.png`), await strip(scene, opt))
        written.push(`${name}.strip.png`)
      }
      for (const v of ["mp4", "webm", "gif"]) {
        if (!formats.has(v)) continue
        if (!hasFfmpeg()) throw new Error("ffmpeg is needed for video output")
        const file = join(out, `${name}.${v}`)
        await video(scene, file, v, { ...opt, bg })
        written.push(`${name}.${v}`)
      }
      console.log(`${name}: ${written.join(", ")}  (build ${scene.buildEnd.toFixed(2)}s, ${scene.marks.length} marks) -> ${out}`)
      if (!opt.quiet) for (const w of lint(scene)) console.log(`  ! ${w}`)
    }
  } catch (e) {
    failed = true
    console.error(`${file}: ${e.message}`)
    if (process.env.DEBUG) console.error(e.stack)
  }
}
process.exit(failed ? 1 : 0)

// Frames of the build plus one of the loops, for checking choreography without a browser.
// Wide figures go in a 2-column grid so the sheet stays readable.
async function strip(scene, o) {
  const end = scene.buildEnd + 0.2
  const trav = scene.marks.filter((m) => m.shape === "traveler")
  const loopT = trav.length ? Math.max(...trav.map((m) => m.enter.delay + 0.4 + m.offset * m.period + 0.4 * m.period)) : end + 1.3
  const ts = [0.15, 0.3, 0.45, 0.65, 0.85].map((f) => +(end * f).toFixed(2)).concat([+Math.max(end + 0.6, loopT).toFixed(2)])
  const W = scene.width, H = scene.height, gap = 12, head = 18
  const cols = +(o["strip-cols"] ?? (W > 1.5 * H ? 2 : W > H ? 3 : 6))
  const rows = Math.ceil(ts.length / cols)
  const parts = ts.map((t, i) => {
    const x = (i % cols) * (W + gap), y = Math.floor(i / cols) * (H + head + gap)
    const svg = renderFrame(scene, t).replace(/^<svg [^>]*?>/, (m) => m.replace("<svg ", `<svg x="${x}" y="${y + head}" `))
    const label = i === ts.length - 1 ? `t=${t}s (loops)` : `t=${t}s`
    return svg + `<text x="${x + 4}" y="${y + 12}" font-family="Commit Mono" font-size="10" fill="#999">${label}</text>`
  })
  const TW = cols * (W + gap) - gap, TH = rows * (H + head + gap) - gap
  const total = `<svg xmlns="http://www.w3.org/2000/svg" width="${TW}" height="${TH}" viewBox="0 0 ${TW} ${TH}"><rect width="100%" height="100%" fill="${scene.background ?? "#fff"}"/>${parts.join("")}</svg>`
  return svgToPng(total, { scale: TW > 2400 ? 1 : 1.5 })
}

async function video(scene, file, kind, o) {
  const fps = +o.fps
  // A seamless loop needs every period to divide its length: the march is 2.6 s, so the
  // loop is the longest traveller/orbit period rounded up to a multiple of 2.6 s.
  const periods = [MARCH.duration * 2, ...scene.marks.filter((m) => m.shape === "traveler").map((m) => m.period), ...scene.marks.flatMap((m) => (m.loops ?? []).filter((l) => l.period).map((l) => Math.abs(l.period)))]
  const loopLen = Math.ceil(Math.max(...periods) / MARCH.duration - 1e-6) * MARCH.duration
  const seconds = +(o.seconds ?? (o.loop ? loopLen : scene.buildEnd + 3))
  const n = Math.round(seconds * fps)
  const bg = o.bg ?? (kind === "webm" || kind === "gif" ? undefined : "#FFFFFF")
  const scale = kind === "gif" ? 1 : +(o["png-scale"] ?? 2)
  const vf = kind === "gif" ? ["-vf", "split[a][b];[a]palettegen=reserve_transparent=1[p];[b][p]paletteuse"] : []
  const codec =
    kind === "mp4"
      ? ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-movflags", "+faststart"]
      : kind === "webm"
        ? ["-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "30"]
        : []
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-i", "-", ...vf, ...codec, file], { stdio: ["pipe", "inherit", "inherit"] })
  const done = new Promise((res, rej) => ff.on("close", (c) => (c ? rej(new Error(`ffmpeg exited ${c}`)) : res())))
  for (let i = 0; i < n; i++) {
    const t = o.loop ? i / fps : i / fps
    const svg = renderFrame(scene, t, { loopsOnly: !!o.loop })
    const png = await svgToPng(svg, { scale, background: bg })
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once("drain", r))
  }
  ff.stdin.end()
  await done
}

function pascal(s) {
  return s.replace(/(^|[-_ .]+)(\w)/g, (_, __, c) => c.toUpperCase()).replace(/[^A-Za-z0-9]/g, "")
}
