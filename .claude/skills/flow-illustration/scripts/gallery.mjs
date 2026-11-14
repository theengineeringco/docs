#!/usr/bin/env node
// Build an HTML gallery of rendered specs: each figure as its animated SVG, with title,
// description and links to the spec and exports.
//
//   node gallery.mjs <out.html> <dir> [<dir> ...] [--title "Flow illustrations"]
//
// Paths in the page are relative to <out.html>, so open it next to the folders.

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs"
import { join, relative, dirname, basename, resolve } from "node:path"

const args = process.argv.slice(2)
let title = "Flow illustrations"
const dirs = []
let out
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--title") title = args[++i]
  else if (!out) out = resolve(args[i])
  else dirs.push(resolve(args[i]))
}
if (!out || !dirs.length) {
  console.error("usage: node gallery.mjs <out.html> <dir> [...]")
  process.exit(1)
}

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
const sections = dirs.map((dir) => {
  const specs = readdirSync(dir).filter((f) => f.endsWith(".json")).sort()
  const cards = specs.map((f) => {
    const spec = JSON.parse(readFileSync(join(dir, f), "utf8"))
    const name = basename(f, ".json")
    const anim = join(dir, `${name}.animated.svg`)
    const src = existsSync(anim) ? anim : join(dir, `${name}.svg`)
    const [w, h] = spec.size ?? [240, 200]
    const rel = (p) => relative(dirname(out), p)
    const links = [["json", join(dir, f)], ["svg", join(dir, `${name}.svg`)], ["png", join(dir, `${name}.png`)], ["mp4", join(dir, `${name}.mp4`)]]
      .filter(([, p]) => existsSync(p))
      .map(([k, p]) => `<a href="${esc(rel(p))}">${k}</a>`)
      .join(" · ")
    const wide = w > 300
    return `<figure class="card${wide ? " wide" : ""}${spec.theme === "blue" || spec.theme === "dark" ? " deep" : ""}">
  <div class="frame" style="aspect-ratio:${w}/${h}"><img src="${esc(rel(src))}" alt="${esc(spec.title ?? name)}" loading="lazy"></div>
  <figcaption><strong>${esc(spec.title ?? name)}</strong><span>${esc(spec.description ?? "")}</span><code>${esc(name)}</code> <em>${links}</em></figcaption>
</figure>`
  })
  return `<section><h2>${esc(basename(dir))}</h2><div class="grid">${cards.join("\n")}</div></section>`
})

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<style>
:root{--bg:#FDFDFB;--card:#FFFFFF;--text:rgba(1,1,1,.81);--muted:rgba(3,3,2,.55);--rule:rgba(0,0,0,.08);--blue:#1F3ACB}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.45 "Unica77 LL","Helvetica Neue",Helvetica,Arial,sans-serif}
header{padding:48px 16px 8px;max-width:1240px;margin:0 auto}h1{font-weight:400;font-size:40px;letter-spacing:-.03em;margin:0 0 8px}
header p{color:var(--muted);max-width:640px;margin:0}
section{max-width:1240px;margin:0 auto;padding:24px 16px}h2{font-weight:400;font-size:13px;letter-spacing:.04em;text-transform:uppercase;color:var(--muted);margin:24px 0 16px;font-family:"Commit Mono",ui-monospace,monospace}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:24px}
.card{margin:0;background:var(--card);border:1px solid var(--rule)}.card.wide{grid-column:1/-1}
.frame{width:100%;display:flex;align-items:center;justify-content:center}.frame img{width:100%;height:100%;object-fit:contain;display:block}
.card.wide .frame{max-height:560px}
figcaption{padding:12px 14px 14px;border-top:1px solid var(--rule);display:flex;flex-direction:column;gap:4px}
figcaption strong{font-weight:400}figcaption span{color:var(--muted);font-size:13px}
figcaption code{font:12px "Commit Mono",ui-monospace,monospace;color:var(--muted)}figcaption em{font-style:normal;font-size:12px}
a{color:var(--blue);text-decoration:none}a:hover{text-decoration:underline}
@media (max-width:600px){h1{font-size:30px}}
</style></head><body>
<header><h1>${esc(title)}</h1><p>Every example spec in the flow-illustration skill, animated. Reload to replay the build. Copy a spec, change it, render it with <code>node scripts/render.mjs</code>.</p></header>
${sections.join("\n")}
</body></html>
`
writeFileSync(out, html)
console.log(`${out}: ${sections.length} sections`)
