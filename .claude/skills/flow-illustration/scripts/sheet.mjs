#!/usr/bin/env node
// Contact sheet: lay static SVGs out in a grid with their names, write one PNG.
//
//   node sheet.mjs <out.png> <a.svg> <b.svg> ... [--cols 3] [--cell 360] [--scale 1.5] [--tile]
//
// --tile draws each cell on the brand-guide grey (#F6F6F3) so edges of white figures show.

import { readFileSync, writeFileSync } from "node:fs"
import { basename } from "node:path"
import { svgToPng } from "./lib/raster.mjs"

const args = process.argv.slice(2)
const opt = { cols: 3, cell: 360, scale: 1.5 }
const files = []
let out
for (let i = 0; i < args.length; i++) {
  const a = args[i]
  if (a === "--tile") opt.tile = true
  else if (a.startsWith("--")) opt[a.slice(2)] = +args[++i]
  else if (!out) out = a
  else files.push(a)
}
if (!out || !files.length) {
  console.error("usage: node sheet.mjs <out.png> <a.svg> ... [--cols 3] [--cell 360]")
  process.exit(1)
}

const cols = Math.min(opt.cols, files.length)
const items = files.map((f) => {
  const svg = readFileSync(f, "utf8")
  const m = svg.match(/width="([\d.]+)" height="([\d.]+)"/)
  return { name: basename(f).replace(/\.svg$/, ""), svg, w: +m[1], h: +m[2] }
})
const cellW = opt.cell
const rowsH = []
for (let r = 0; r < Math.ceil(items.length / cols); r++) {
  const row = items.slice(r * cols, r * cols + cols)
  rowsH.push(Math.max(...row.map((it) => (it.h * Math.min(1, (cellW - 24) / it.w)) + 44)))
}
const W = cols * cellW
const H = rowsH.reduce((a, b) => a + b, 0)
let y = 0
const parts = []
rowsH.forEach((rh, r) => {
  items.slice(r * cols, r * cols + cols).forEach((it, c) => {
    const k = Math.min(1, (cellW - 24) / it.w)
    const x = c * cellW + 12
    const inner = it.svg.replace(/^<svg [^>]*?>/, (s) => s.replace("<svg ", `<svg x="${x}" y="${y + 30}" width="${it.w * k}" height="${it.h * k}" `).replace(/ width="[\d.]+" height="[\d.]+"(?= viewBox)/, ""))
    if (opt.tile) parts.push(`<rect x="${x}" y="${y + 30}" width="${it.w * k}" height="${it.h * k}" fill="#F6F6F3"/>`)
    parts.push(inner)
    parts.push(`<text x="${x}" y="${y + 20}" font-family="Commit Mono" font-size="11" fill="#8F8E8A">${it.name}</text>`)
  })
  y += rh
})
const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="#FFFFFF"/>${parts.join("")}</svg>`
writeFileSync(out, await svgToPng(sheet, { scale: opt.scale }))
console.log(`${out}: ${items.length} figures`)
