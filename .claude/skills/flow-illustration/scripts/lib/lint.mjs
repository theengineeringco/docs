// Automatic part of the review checklist. Runs on every render and prints warnings;
// it never blocks output. The judgement calls (does the claim read?) stay with you.

import { marksBBox } from "./compile.mjs"

const KIND_MARK = new Set(["circle", "circleSmall", "square", "node", "focus", "donut", "ghost", "flag", "dot", "dotLarge"])

function textBox(m) {
  const w = m.text.length * m.size * 0.6
  const x0 = m.anchor === "end" ? m.x - w : m.anchor === "middle" ? m.x - w / 2 : m.x
  return { x0, y0: m.y - m.size * 0.8, x1: x0 + w, y1: m.y + m.size * 0.25 }
}
const hit = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1

export function lint(scene) {
  const warn = []
  const marks = scene.marks.filter((m) => KIND_MARK.has(m.kind))
  const count = (k) => marks.filter((m) => k.includes(m.kind)).length
  const nodes = count(["node", "focus"])
  const flags = count(["flag"])
  const squares = count(["square"])
  const glyph = scene.width <= 320 && scene.height <= 280

  if (nodes > Math.max(1, scene.panels ?? 0)) warn.push(`${nodes} nodes: the ringed square is Flow, keep one per figure (one per panel in steps); pass center: null to motifs when you place your own`)
  if (flags > 2) warn.push(`${flags} flags: mustard is for the one thing that needs a human; keep it to one or two`)
  const inked = marks.filter((m) => !["dot", "dotLarge"].includes(m.kind)).length
  const big = marks.filter((m) => !["dot", "dotLarge", "circleSmall"].includes(m.kind)).length
  if (glyph && squares > 8) warn.push(`${squares} blue squares in a glyph: keep results to the few that matter (1–6)`)
  if (inked >= 6 && squares / inked > 0.6) warn.push(`${squares} of ${inked} marks are blue squares: blue marks results, grey should dominate`)
  if (glyph && big > 22) warn.push(`${big} marks in a glyph: past ~16 it reads as data, not an idea`)

  // collisions: centres closer than the marks' radii allow
  const R = { node: 12, focus: 15, donut: 12, circle: 5, circleSmall: 4, ghost: 5, square: 4.5, flag: 6, dot: 2.5, dotLarge: 4.5 }
  const seen = new Set()
  for (let i = 0; i < marks.length; i++) {
    for (let j = i + 1; j < marks.length; j++) {
      const a = marks[i], b = marks[j]
      if (!a.center || !b.center) continue
      const d = Math.hypot(a.center[0] - b.center[0], a.center[1] - b.center[1])
      const need = (R[a.kind] ?? 5) + (R[b.kind] ?? 5) + 8
      if (d < need) {
        // report in canvas px (after the fit offset), so it can be found in the PNG
        const key = `${Math.round(a.center[0] + scene.offset[0])},${Math.round(a.center[1] + scene.offset[1])}`
        if (seen.has(key)) continue
        seen.add(key)
        warn.push(
          d < 0.5
            ? `two marks on the same spot at (${key}): ${a.kind} + ${b.kind}`
            : `${a.kind} and ${b.kind} collide near (${key}), ${d.toFixed(1)} px apart (need ${need})`
        )
      }
    }
  }

  // clipping and breathing room
  const b = marksBBox(scene.marks.filter((m) => m.shape !== "traveler"))
  if (isFinite(b.w)) {
    const [ox, oy] = scene.offset
    const [vx, vy, vw, vh] = scene.viewBox ?? [0, 0, scene.width, scene.height]
    const L = b.x0 + ox - vx, T = b.y0 + oy - vy, Rm = vx + vw - (b.x1 + ox), Bm = vy + vh - (b.y1 + oy)
    const min = Math.min(L, T, Rm, Bm)
    if (min < 0) warn.push(`content is clipped by ${(-min).toFixed(0)} px at the canvas edge`)
    else if (min < 12) warn.push(`content sits ${min.toFixed(0)} px from the edge; leave ≥ 16`)
    if (glyph) {
      const cx = (L - Rm) / 2, cy = (T - Bm) / 2
      if (Math.abs(cx) > 18 || Math.abs(cy) > 18) warn.push(`composition is off-centre by (${cx.toFixed(0)}, ${cy.toFixed(0)}) px`)
    }
  }

  // labels
  const texts = scene.marks.filter((m) => m.shape === "text")
  if (glyph && texts.length) warn.push(`${texts.length} label(s) in a glyph: glyphs carry no text; let the page say it`)
  for (let i = 0; i < texts.length; i++)
    for (let j = i + 1; j < texts.length; j++) if (hit(textBox(texts[i]), textBox(texts[j]))) warn.push(`labels "${texts[i].text}" and "${texts[j].text}" overlap`)
  for (const t of texts) {
    const words = t.text.trim().split(/\s+/).length
    if (!t.caption && words > 3) warn.push(`label "${t.text}" has ${words} words; labels name parts in ≤ 3 words, the page says the rest`)
    if (t.maxWidth && textBox(t).x1 - textBox(t).x0 > t.maxWidth) warn.push(`caption "${t.text}" is wider than its panel (${Math.round(textBox(t).x1 - textBox(t).x0)} > ${t.maxWidth} px); shorten it (~32 characters at 200 px)`)
    const tb = textBox(t)
    for (const m of marks) {
      if (!m.center) continue
      const r = R[m.kind] ?? 5
      if (hit(tb, { x0: m.center[0] - r, y0: m.center[1] - r, x1: m.center[0] + r, y1: m.center[1] + r })) {
        warn.push(`label "${t.text}" sits on a ${m.kind}`)
        break
      }
    }
  }
  if (scene.buildEnd > 3.5) warn.push(`build takes ${scene.buildEnd.toFixed(1)} s; aim for ≤ 2.5 s (lower motion.stagger or merge beats)`)
  return warn
}
