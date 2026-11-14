// Marks -> SVG. Three modes:
//   static    the finished figure, no motion (for PNG, Figma, docs)
//   animated  self-contained SVG: CSS entrance + marching dashes, SMIL travellers and
//             orbits; honours prefers-reduced-motion; works as <img> and inline
//   frame     the figure at time t, computed in JS (for video and GIF frames)

import { MARCH } from "./tokens.mjs"
import { durationOf, dashOf } from "./compile.mjs"
import * as M from "./math.mjs"

const r2 = (v) => M.round(v, 2)

function attrs(o) {
  return Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== null && v !== false && v !== "")
    .map(([k, v]) => `${k}="${typeof v === "number" ? r2(v) : esc(String(v))}"`)
    .join(" ")
}
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

function paint(m, extra = {}) {
  return {
    fill: m.fill ?? "none",
    "fill-opacity": m.fillOpacity,
    stroke: m.stroke,
    "stroke-width": m.stroke ? m.sw ?? 1 : undefined,
    "stroke-dasharray": m.dash || undefined,
    "stroke-opacity": m.strokeOpacity,
    "stroke-linecap": m.shape === "path" && !m.dash ? "round" : undefined,
    "stroke-linejoin": m.shape === "path" || m.shape === "poly" ? "round" : undefined,
    ...extra,
  }
}

// One shape element (no animation wrapper).
function shapeEl(m, extra = {}) {
  switch (m.shape) {
    case "circle":
      return `<circle ${attrs({ cx: m.cx, cy: m.cy, r: m.r, ...paint(m, extra) })}/>`
    case "ellipse":
      return `<ellipse ${attrs({ cx: m.cx, cy: m.cy, rx: m.rx, ry: m.ry, transform: m.rot ? `rotate(${r2(m.rot)} ${r2(m.cx)} ${r2(m.cy)})` : undefined, ...paint(m, extra) })}/>`
    case "rect":
      return `<rect ${attrs({ x: m.x, y: m.y, width: m.w, height: m.h, ...paint(m, extra) })}/>`
    case "poly":
      return `<path ${attrs({ d: M.pathD(m.pts, true), ...paint(m, extra) })}/>`
    case "path":
      return `<path ${attrs({ d: M.pathD(m.pts, m.closed), ...paint(m, extra) })}/>`
    case "text":
      return `<text ${attrs({
        x: m.x,
        y: m.y,
        fill: m.fill,
        "font-family": m.family,
        "font-size": m.size,
        "text-anchor": m.anchor,
        "letter-spacing": m.tracking ? r2(m.tracking * m.size) : undefined,
        ...extra,
      })}>${esc(m.text)}</text>`
    case "group":
      return m.children.map((c) => shapeEl(c, {})).join("")
  }
  return ""
}

function background(scene) {
  if (!scene.background) return ""
  const [x, y, w, h] = scene.viewBox ?? [0, 0, scene.width, scene.height]
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${scene.background}"/>`
}

function open(scene, extra = "") {
  const t = scene.title ? `<title>${esc(scene.title)}</title>` : ""
  const d = scene.description ? `<desc>${esc(scene.description)}</desc>` : ""
  const vb = scene.viewBox ? scene.viewBox.join(" ") : `0 0 ${scene.width} ${scene.height}`
  const w = scene.viewBox ? scene.viewBox[2] : scene.width, h = scene.viewBox ? scene.viewBox[3] : scene.height
  const par = scene.align === "left" ? ` preserveAspectRatio="xMinYMid meet"` : scene.align === "right" ? ` preserveAspectRatio="xMaxYMid meet"` : ""
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vb}"${par} fill="none" role="img"${extra}>${t}${d}`
}

const content = (scene, inner) =>
  scene.offset[0] || scene.offset[1] ? `<g transform="translate(${scene.offset[0]} ${scene.offset[1]})">${inner}</g>` : inner

// ---------------------------------------------------------------------------

export function renderStatic(scene) {
  const body = scene.marks
    .map((m) => {
      if (m.shape === "traveler") return ""
      const op = m.opacity != null && m.opacity !== 1 ? ` opacity="${r2(m.opacity)}"` : ""
      const el = shapeEl(m)
      return op ? `<g${op}>${el}</g>` : el
    })
    .join("\n")
  return `${open(scene)}${background(scene)}${content(scene, body)}</svg>\n`
}

// ---------------------------------------------------------------------------

export function renderAnimated(scene, { id } = {}) {
  const k = id ?? "fi" + hash(scene.name)
  const { motion } = scene
  const spring = M.springLinear(motion.spring, motion.popDuration)
  const ease = `cubic-bezier(${motion.ease.join(",")})`
  const wire = `cubic-bezier(${motion.wireEase.join(",")})`
  const march = MARCH.distance * scene.scale
  const W = scene.width, H = scene.height
  const defs = []
  const body = []
  let maskN = 0

  for (const m of scene.marks) {
    const delay = m.enter?.delay ?? 0
    const et = m.enter?.type ?? "none"
    const op = m.opacity != null && m.opacity !== 1 ? ` opacity="${r2(m.opacity)}"` : ""

    if (m.shape === "traveler") {
      body.push(traveler(m, k))
      continue
    }

    let inner
    const loopClass = m.march || (m.dash && m.marchable !== false && m.loopsMarch !== false && isMarch(m)) ? `${k}-m` : ""
    if (et === "draw" && (m.shape === "path" || m.shape === "poly")) {
      const d = M.pathD(m.pts, m.shape === "poly" || m.closed)
      const dur = r2(durationOf(m, motion))
      if (m.dash) {
        // dashed: reveal through a mask that draws in the path direction
        const mid = `${k}-k${maskN++}`
        defs.push(
          `<mask id="${mid}" maskUnits="userSpaceOnUse" x="${-W}" y="${-H}" width="${3 * W}" height="${3 * H}"><path d="${d}" stroke="#fff" stroke-width="${r2((m.sw ?? 1) + 6)}" fill="none" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1" class="${k}-d" style="animation-duration:${dur}s;animation-delay:${r2(delay)}s"/></mask>`
        )
        inner = `<path ${attrs({ d, ...paint(m), mask: `url(#${mid})`, class: loopClass })}/>`
      } else {
        inner = `<path ${attrs({ d, ...paint(m), pathLength: 1, "stroke-dasharray": "1 1", "stroke-dashoffset": 1, class: `${k}-d`, style: `animation-duration:${dur}s;animation-delay:${r2(delay)}s` })}/>`
      }
      body.push(op ? `<g${op}>${inner}</g>` : inner)
      continue
    }

    // build the element; loops live on the element, the entrance on a wrapper
    if (m.shape === "group") {
      const ch = m.children
        .map((c, i) => {
          const cls = m.march && c.dash ? `${k}-m` : ""
          if (m.ringDraw && i === 0) {
            return shapeEl(c, { pathLength: 1, "stroke-dasharray": "1 1", "stroke-dashoffset": 1, class: `${k}-d`, style: `animation-duration:${motion.drawDuration}s;animation-delay:${r2(delay)}s` })
          }
          return shapeEl(c, { class: cls })
        })
        .join("")
      inner = ch
    } else {
      inner = shapeEl(m, { class: loopClass || undefined })
    }
    for (const l of m.loops ?? []) {
      if (l.type === "pulse") inner = `<g class="${k}-pulse">${inner}</g>`
    }
    const pings = (m.loops ?? []).filter((l) => l.type === "ping").map((l) => ping(m, l, delay + 0.6))
    const orbitL = (m.loops ?? []).find((l) => l.type === "orbit")
    let el = et === "none" ? `<g${op}>${inner}</g>` : `<g class="${k}-${et[0]}"${op} style="animation-delay:${r2(delay)}s">${inner}</g>`
    if (orbitL) el = orbit(m, orbitL, el)
    body.push(pings.join("") + el)
  }

  const css = `
.${k}-p,.${k}-f,.${k}-r{transform-box:fill-box;transform-origin:center;animation-fill-mode:both}
.${k}-p{animation-name:${k}-pop;animation-duration:${motion.popDuration}s;animation-timing-function:cubic-bezier(.34,1.56,.64,1)}
@supports (animation-timing-function:linear(0,1)){.${k}-p{animation-timing-function:${spring}}}
.${k}-f{animation-name:${k}-fade;animation-duration:${motion.fadeDuration}s;animation-timing-function:ease-out}
.${k}-r{animation-name:${k}-rise;animation-duration:.7s;animation-timing-function:${ease}}
.${k}-d{animation-name:${k}-draw;animation-timing-function:${wire};animation-fill-mode:both}
.${k}-m{animation:${k}-march ${MARCH.duration}s linear infinite}
.${k}-pulse{animation:${k}-pulse 2.4s ease-in-out infinite}
@keyframes ${k}-pop{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes ${k}-fade{from{opacity:0}to{opacity:1}}
@keyframes ${k}-rise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes ${k}-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@keyframes ${k}-march{from{stroke-dashoffset:0}to{stroke-dashoffset:-${r2(march)}}}
@keyframes ${k}-pulse{0%,100%{opacity:1}50%{opacity:.35}}
@media (prefers-reduced-motion:reduce){.${k} *{animation:none!important}.${k} .${k}-d{stroke-dashoffset:0}.${k} .${k}-t{display:none}}
`.trim()

  return `${open(scene, ` class="${k}"`)}<style>${css}</style>${defs.length ? `<defs>${defs.join("")}</defs>` : ""}${background(scene)}${content(scene, body.join("\n"))}</svg>\n`
}

function isMarch(m) {
  return !!m.march
}

function traveler(m, k) {
  const d = M.pathD(m.pts, m.closed)
  const s = m.size
  const begin = r2(m.enter.delay + 0.4 + m.offset * m.period)
  const glyph =
    m.glyph === "dot"
      ? `<circle r="${r2(s / 2)}" fill="${m.fill}"/>`
      : `<rect x="${r2(-s / 2)}" y="${r2(-s / 2)}" width="${r2(s)}" height="${r2(s)}" fill="${m.fill}"/>`
  if (m.closed) {
    return `<g class="${k}-t" opacity="0">${glyph}<set attributeName="opacity" to="1" begin="${begin}s"/><animateMotion path="${d}" dur="${m.period}s" begin="${begin}s" repeatCount="indefinite"/></g>`
  }
  const h = M.clamp(m.hold, 0, 0.6)
  const kt = `0;${r2(1 - h)};1`
  return `<g class="${k}-t" opacity="0">${glyph}<animateMotion path="${d}" dur="${m.period}s" begin="${begin}s" repeatCount="indefinite" calcMode="spline" keyTimes="${kt}" keyPoints="0;1;1" keySplines="0.65 0 0.35 1;0 0 1 1"/><animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;0.08;${r2(1 - h)};${r2(Math.min(0.99, 1 - h + 0.1))};1" dur="${m.period}s" begin="${begin}s" repeatCount="indefinite"/></g>`
}

function ping(m, l, begin) {
  const [cx, cy] = m.center
  return `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(l.r0)}" stroke="${l.color}" stroke-width="1" fill="none" opacity="0"><animate attributeName="r" values="${r2(l.r0)};${r2(l.r1)}" dur="${l.period}s" begin="${r2(begin)}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.45;0" dur="${l.period}s" begin="${r2(begin)}s" repeatCount="indefinite"/></circle>`
}

function orbit(m, l, el) {
  const [cx, cy] = l.center
  const [px, py] = m.center
  const r = Math.hypot(px - cx, py - cy)
  const ox = 2 * cx - px, oy = 2 * cy - py
  const sweep = l.period < 0 ? 0 : 1
  const path = `M${r2(px)} ${r2(py)}A${r2(r)} ${r2(r)} 0 1 ${sweep} ${r2(ox)} ${r2(oy)}A${r2(r)} ${r2(r)} 0 1 ${sweep} ${r2(px)} ${r2(py)}`
  return `<g><animateMotion path="${path}" dur="${Math.abs(l.period)}s" begin="0s" repeatCount="indefinite"/><g transform="translate(${r2(-px)} ${r2(-py)})">${el}</g></g>`
}

// ---------------------------------------------------------------------------

export function renderFrame(scene, t, { loopsOnly = false } = {}) {
  const { motion } = scene
  const springF = M.spring(motion.spring)
  const easeF = M.bezierEase(motion.ease)
  const wireF = M.bezierEase(motion.wireEase)
  const march = MARCH.distance * scene.scale
  const body = []

  for (const m0 of scene.marks) {
    const m = m0
    const local = loopsOnly ? 99 : t - (m.enter?.delay ?? 0)
    const et = m.enter?.type ?? "none"
    let opacity = m.opacity ?? 1
    let tf = ""
    let mk = m

    if (m.shape === "traveler") {
      const start = (loopsOnly ? 0 : m.enter.delay + 0.4) + m.offset * m.period
      if (t < start && !loopsOnly) continue
      const ph = (((t - start) / m.period) % 1 + 1) % 1
      let f, o = 1
      if (m.closed) f = ph
      else {
        const h = M.clamp(m.hold, 0, 0.6)
        f = ph < 1 - h ? wireF(ph / (1 - h)) : 1
        o = ph < 0.08 ? ph / 0.08 : ph < 1 - h ? 1 : ph < 1 - h + 0.1 ? 1 - (ph - (1 - h)) / 0.1 : 0
      }
      const [x, y] = M.pointAt(m.pts, f)
      const s = m.size
      body.push(
        m.glyph === "dot"
          ? `<circle cx="${r2(x)}" cy="${r2(y)}" r="${r2(s / 2)}" fill="${m.fill}" opacity="${r2(o)}"/>`
          : `<rect x="${r2(x - s / 2)}" y="${r2(y - s / 2)}" width="${r2(s)}" height="${r2(s)}" fill="${m.fill}" opacity="${r2(o)}"/>`
      )
      continue
    }

    if (et !== "none" && local < 0) continue
    const dur = durationOf(m, motion)
    const p = et === "none" ? 1 : M.clamp(local / Math.max(0.001, dur))
    const [cx, cy] = m.center ?? [0, 0]

    if (et === "pop") {
      const v = springF(Math.max(0, local))
      opacity *= M.clamp(local / 0.3)
      tf = `translate(${r2(cx)} ${r2(cy)}) scale(${M.round(Math.max(0, v), 4)}) translate(${r2(-cx)} ${r2(-cy)})`
    } else if (et === "fade") opacity *= easeF(p)
    else if (et === "rise") {
      const e = easeF(p)
      opacity *= e
      tf = `translate(0 ${r2(6 * (1 - e))})`
    } else if (et === "draw") {
      const f = wireF(p)
      if (m.shape === "path" || m.shape === "poly") {
        const pts = m.shape === "poly" || m.closed ? [...m.pts, m.pts[0]] : m.pts
        if (f < 0.999) mk = { ...m, shape: "path", closed: false, pts: M.trim(pts, 0, (1 - f) * M.polyLength(pts)) }
        if (f <= 0.001) continue
      }
    }

    // loops
    const dashOffset = (mm) => (mm.dash && (mm.march || m.march) ? -march * ((t % MARCH.duration) / MARCH.duration) : undefined)
    for (const l of m.loops ?? []) {
      if (l.type === "pulse") opacity *= 0.675 + 0.325 * Math.cos((t / 2.4) * M.TAU)
      if (l.type === "orbit") {
        const ang = (t / l.period) * 360
        const [ox, oy] = l.center
        const a = M.rad(ang)
        const dx = cx - ox, dy = cy - oy
        const nx = ox + dx * Math.cos(a) - dy * Math.sin(a), ny = oy + dx * Math.sin(a) + dy * Math.cos(a)
        tf = `translate(${r2(nx - cx)} ${r2(ny - cy)}) ${tf}`
      }
      if (l.type === "ping" && local > 0.6) {
        const ph = ((local - 0.6) / l.period) % 1
        body.push(`<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(M.lerp(l.r0, l.r1, ph))}" stroke="${l.color}" stroke-width="1" fill="none" opacity="${r2(0.45 * (1 - ph))}"/>`)
      }
    }

    let el
    if (mk.shape === "group") {
      el = mk.children
        .map((c, i) => {
          if (mk.ringDraw && i === 0 && et !== "none" && p < 1) {
            const f = wireF(M.clamp(local / motion.drawDuration))
            const pts = M.arc([c.cx, c.cy], c.r ?? c.rx, -90, -90 + 360 * f)
            return f > 0.001 ? `<path d="${M.pathD(pts)}" stroke="${c.stroke}" stroke-width="${c.sw}" fill="none"/>` : ""
          }
          return shapeEl(c, { "stroke-dashoffset": dashOffset(c) !== undefined ? r2(dashOffset(c)) : undefined })
        })
        .join("")
    } else {
      const off = dashOffset(mk)
      el = shapeEl(mk, { "stroke-dashoffset": off !== undefined ? r2(off) : undefined })
    }
    const a = []
    if (tf) a.push(`transform="${tf}"`)
    if (opacity < 0.999) a.push(`opacity="${r2(Math.max(0, opacity))}"`)
    body.push(a.length ? `<g ${a.join(" ")}>${el}</g>` : el)
  }
  return `${open(scene)}${background(scene)}${content(scene, body.join("\n"))}</svg>\n`
}

function hash(s) {
  let h = 2166136261
  for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return (h >>> 0).toString(36).slice(0, 5)
}
