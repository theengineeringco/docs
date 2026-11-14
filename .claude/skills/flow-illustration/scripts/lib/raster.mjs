// SVG -> PNG. Prefers @resvg/resvg-js (npm install in scripts/), then rsvg-convert,
// then Python cairosvg, then headless Chrome. Labels use the bundled Commit Mono.

import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { execFileSync, spawnSync } from "node:child_process"
import { writeFileSync, readFileSync, existsSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"

const here = dirname(fileURLToPath(import.meta.url))
const FONT = join(here, "../../assets/fonts/CommitMono-400-Regular.otf")

let resvg = undefined
async function loadResvg() {
  if (resvg !== undefined) return resvg
  try {
    resvg = (await import("@resvg/resvg-js")).Resvg
  } catch {
    resvg = null
  }
  return resvg
}

export async function svgToPng(svg, { scale = 2, background } = {}) {
  const Resvg = await loadResvg()
  if (Resvg) {
    const r = new Resvg(svg, {
      fitTo: { mode: "zoom", value: scale },
      background,
      // Labels are always Commit Mono (bundled). Loading every system font per frame
      // is what makes video slow, so only fall back to them without the bundled file.
      font: { fontFiles: existsSync(FONT) ? [FONT] : [], loadSystemFonts: !existsSync(FONT), defaultFontFamily: "Commit Mono", monospaceFamily: "Commit Mono", sansSerifFamily: "Commit Mono" },
      shapeRendering: 2,
      textRendering: 1,
    })
    return r.render().asPng()
  }
  const dir = mkdtempSync(join(tmpdir(), "flow-ill-"))
  const inP = join(dir, "in.svg"), outP = join(dir, "out.png")
  writeFileSync(inP, svg)
  try {
    if (has("rsvg-convert")) {
      execFileSync("rsvg-convert", ["-z", String(scale), "-o", outP, inP])
      return readFileSync(outP)
    }
    if (spawnSync("python3", ["-c", "import cairosvg"]).status === 0) {
      execFileSync("python3", ["-c", `import cairosvg; cairosvg.svg2png(url=${JSON.stringify(inP)}, write_to=${JSON.stringify(outP)}, scale=${scale})`])
      return readFileSync(outP)
    }
    const chrome = findChrome()
    if (chrome) {
      const m = svg.match(/width="([\d.]+)" height="([\d.]+)"/)
      const [w, h] = m ? [Math.ceil(+m[1] * scale), Math.ceil(+m[2] * scale)] : [800, 600]
      const html = join(dir, "in.html")
      writeFileSync(html, `<html><body style="margin:0;background:transparent"><img src="in.svg" style="width:${w}px;height:${h}px;display:block"></body></html>`)
      execFileSync(chrome, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--default-background-color=00000000", `--window-size=${w},${h}`, `--screenshot=${outP}`, `file://${html}`], { stdio: "ignore" })
      return readFileSync(outP)
    }
    throw new Error("No SVG rasteriser found. Run `npm install` in the skill's scripts/ folder (installs @resvg/resvg-js), or install librsvg / cairosvg / Chrome.")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

function has(cmd) {
  return spawnSync("sh", ["-c", `command -v ${cmd}`]).status === 0
}

function findChrome() {
  const c = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "google-chrome",
    "chromium",
    "chromium-browser",
  ]
  for (const p of c) if (p.startsWith("/") ? existsSync(p) : has(p)) return p
  return null
}

export function hasFfmpeg() {
  return has("ffmpeg")
}
