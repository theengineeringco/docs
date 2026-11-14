// Marks -> a React component using motion/react, in the website's idiom
// (src/components/illustrated-benefits.tsx): variants, whileInView once, spring pops,
// marching dashes, reduced-motion respected. Self-contained: no site imports needed.

import { MARCH } from "./tokens.mjs"
import { durationOf } from "./compile.mjs"
import * as M from "./math.mjs"

const r2 = (v) => M.round(v, 2)
const CAMEL = {
  "stroke-width": "strokeWidth",
  "stroke-dasharray": "strokeDasharray",
  "stroke-dashoffset": "strokeDashoffset",
  "stroke-opacity": "strokeOpacity",
  "fill-opacity": "fillOpacity",
  "stroke-linecap": "strokeLinecap",
  "stroke-linejoin": "strokeLinejoin",
  "text-anchor": "textAnchor",
  "font-family": "fontFamily",
  "font-size": "fontSize",
  "letter-spacing": "letterSpacing",
}

function props(o) {
  return Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== null && v !== false && v !== "")
    .map(([k, v]) => {
      const key = CAMEL[k] ?? k
      if (typeof v === "number") return `${key}={${r2(v)}}`
      if (typeof v === "string" && v.startsWith("{")) return `${key}=${v}`
      return `${key}="${String(v).replace(/"/g, "&quot;")}"`
    })
    .join(" ")
}

function paint(m) {
  return {
    fill: m.fill ?? "none",
    "fill-opacity": m.fillOpacity,
    stroke: m.stroke,
    "stroke-width": m.stroke ? m.sw ?? 1 : undefined,
    "stroke-dasharray": m.dash || undefined,
    "stroke-opacity": m.strokeOpacity,
    "stroke-linecap": m.shape === "path" && !m.dash ? "round" : undefined,
    "stroke-linejoin": m.shape === "path" || m.shape === "poly" ? "round" : undefined,
  }
}

// One element. `mi` is the motion namespace ("m" or "motion") when the element
// itself animates (marching dashes, drawn rings), else null for a plain SVG tag.
function el(m, mi, extra = {}) {
  const T = (name) => (mi ? `${mi}.${name}` : name)
  const P = (o) => props({ ...paint(m), ...o, ...extra })
  switch (m.shape) {
    case "circle":
      return `<${T("circle")} ${P({ cx: m.cx, cy: m.cy, r: m.r })} />`
    case "ellipse":
      return `<${T("ellipse")} ${P({ cx: m.cx, cy: m.cy, rx: m.rx, ry: m.ry, transform: m.rot ? `rotate(${r2(m.rot)} ${r2(m.cx)} ${r2(m.cy)})` : undefined })} />`
    case "rect":
      return `<${T("rect")} ${P({ x: m.x, y: m.y, width: m.w, height: m.h })} />`
    case "poly":
      return `<${T("path")} ${P({ d: M.pathD(m.pts, true) })} />`
    case "path":
      return `<${T("path")} ${P({ d: M.pathD(m.pts, m.closed) })} />`
    case "text":
      return `<${T("text")} ${props({ x: m.x, y: m.y, fill: m.fill, fontFamily: m.family, fontSize: m.size, textAnchor: m.anchor, letterSpacing: m.tracking ? r2(m.tracking * m.size) : undefined, ...extra })}>${m.text.replace(/[{}<>]/g, (c) => `{"${c}"}`)}</${T("text")}>`
  }
  return ""
}

export function renderTSX(scene, { motionImport = "m" } = {}) {
  const comp = pascal(scene.name) + (/(Illustration|Figure)$/.test(pascal(scene.name)) ? "" : "Illustration")
  const tag = motionImport === "m" ? "m" : "motion"
  const lines = []
  const defs = []
  let maskN = 0
  const ind = (n) => "  ".repeat(n)
  const march = r2(MARCH.distance * scene.scale)

  for (const mk of scene.marks) {
    const d = r2(mk.enter?.delay ?? 0)
    const et = mk.enter?.type ?? "none"
    const op = mk.opacity != null && mk.opacity !== 1 ? r2(mk.opacity) : null

    if (mk.shape === "traveler") {
      const n = 40
      const h = mk.closed ? 0 : M.clamp(mk.hold, 0, 0.6)
      const easeF = M.bezierEase([0.65, 0, 0.35, 1])
      const xs = [], ys = [], os = [], times = []
      for (let i = 0; i <= n; i++) {
        const ph = i / n
        let f = mk.closed ? ph : ph < 1 - h ? easeF(ph / (1 - h)) : 1
        const [x, y] = M.pointAt(mk.pts, f)
        xs.push(r2(x - mk.size / 2))
        ys.push(r2(y - mk.size / 2))
        os.push(mk.closed ? 1 : r2(ph < 0.08 ? ph / 0.08 : ph < 1 - h ? 1 : ph < 1 - h + 0.1 ? 1 - (ph - (1 - h)) / 0.1 : 0))
        times.push(r2(ph))
      }
      const begin = r2(mk.enter.delay + 0.4 + mk.offset * mk.period)
      lines.push(
        `${ind(4)}<${tag}.rect width={${r2(mk.size)}} height={${r2(mk.size)}} fill="${mk.fill}" variants={{ hidden: { opacity: 0 }, visible: (r: boolean) => (r ? { opacity: 0 } : { x: [${xs}], y: [${ys}], opacity: [${os}], transition: { duration: ${mk.period}, times: [${times}], ease: "linear", repeat: Infinity, delay: ${begin} } }) }} custom={reduce} />`
      )
      continue
    }

    const wrapStyle = `style={{ transformBox: "fill-box", transformOrigin: "center" }}`
    const isMarch = (x) => x.dash && (x.march || mk.march)
    const marchProps = (x) => (isMarch(x) ? { variants: "{march}", custom: "{reduce}" } : {})

    if (et === "draw" && (mk.shape === "path" || mk.shape === "poly")) {
      const dd = M.pathD(mk.pts, mk.shape === "poly" || mk.closed)
      const dur = r2(durationOf(mk, scene.motion))
      if (mk.dash) {
        const id = `mask${maskN++}`
        defs.push(
          `${ind(4)}<mask id={\`\${uid}-${id}\`} maskUnits="userSpaceOnUse" x={${-scene.width}} y={${-scene.height}} width={${3 * scene.width}} height={${3 * scene.height}}>\n${ind(5)}<${tag}.path d="${dd}" stroke="#fff" strokeWidth={${r2((mk.sw ?? 1) + 6)}} strokeLinecap="round" fill="none" variants={draw} custom={reduce ? -1 : ${d}} />\n${ind(4)}</mask>`
        )
        const inner = el({ ...mk, shape: "path", closed: mk.shape === "poly" || mk.closed }, isMarch(mk) ? tag : null, { mask: `{\`url(#\${uid}-${id})\`}`, ...marchProps(mk) })
        lines.push(`${ind(4)}${op ? `<g opacity={${op}}>` : ""}${inner}${op ? "</g>" : ""}`)
      } else {
        lines.push(`${ind(4)}${el({ ...mk, shape: "path", closed: mk.shape === "poly" || mk.closed }, tag, { variants: "{draw}", custom: `{reduce ? -1 : ${d}}`, opacity: op ?? undefined })}`)
      }
      continue
    }

    let inner
    if (mk.shape === "group") {
      inner = mk.children
        .map((c, i) => {
          if (mk.ringDraw && i === 0) return el(c, tag, { variants: "{draw}", custom: `{reduce ? -1 : ${d}}` })
          return el(c, isMarch(c) ? tag : null, marchProps(c))
        })
        .join("")
    } else inner = el(mk, isMarch(mk) ? tag : null, marchProps(mk))

    for (const l of mk.loops ?? []) {
      if (l.type === "pulse")
        inner = `<${tag}.g variants={{ hidden: {}, visible: (r: boolean) => (r ? {} : { opacity: [1, 0.35, 1], transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" } }) }} custom={reduce}>${inner}</${tag}.g>`
      if (l.type === "ping") {
        const [cx, cy] = mk.center
        lines.push(
          `${ind(4)}<${tag}.circle cx={${r2(cx)}} cy={${r2(cy)}} stroke="${l.color}" strokeWidth={1} fill="none" variants={{ hidden: { opacity: 0, r: ${r2(l.r0)} }, visible: (r: boolean) => (r ? { opacity: 0 } : { r: [${r2(l.r0)}, ${r2(l.r1)}], opacity: [0.45, 0], transition: { duration: ${l.period}, repeat: Infinity, ease: "linear", delay: ${r2(d + 0.6)} } }) }} custom={reduce} />`
        )
      }
    }
    const variant = { pop: "pop", fade: "fade", rise: "rise", draw: "fade" }[et]
    let out = et === "none" ? `<g${op ? ` opacity={${op}}` : ""}>${inner}</g>` : `<${tag}.g variants={${variant}} custom={reduce ? -1 : ${d}} ${wrapStyle}${op ? ` opacity={${op}}` : ""}>${inner}</${tag}.g>`
    const orbitL = (mk.loops ?? []).find((l) => l.type === "orbit")
    if (orbitL) {
      const [ox, oy] = orbitL.center
      const [px, py] = mk.center
      const xs = [], ys = []
      for (let i = 0; i <= 48; i++) {
        const a = (i / 48) * M.TAU * Math.sign(orbitL.period)
        const dx = px - ox, dy = py - oy
        xs.push(r2(ox + dx * Math.cos(a) - dy * Math.sin(a) - px))
        ys.push(r2(oy + dx * Math.sin(a) + dy * Math.cos(a) - py))
      }
      out = `<${tag}.g variants={{ hidden: {}, visible: (r: boolean) => (r ? {} : { x: [${xs}], y: [${ys}], transition: { duration: ${Math.abs(orbitL.period)}, repeat: Infinity, ease: "linear" } }) }} custom={reduce}>${out}</${tag}.g>`
    }
    lines.push(`${ind(4)}${out}`)
  }

  const off = scene.offset[0] || scene.offset[1] ? ` transform="translate(${scene.offset[0]} ${scene.offset[1]})"` : ""
  const label = (scene.title ?? scene.description ?? "").replace(/"/g, "'")
  const bg = scene.background ? `${"  ".repeat(3)}<rect width={${scene.width}} height={${scene.height}} fill="${scene.background}" />\n` : ""

  return `"use client"

// Generated by the flow-illustration skill from "${scene.name}". Edit the spec and
// re-render rather than hand-editing coordinates.${tag === "m" ? `
// Uses \`m\` components: render inside <LazyMotion> (the website's MotionProvider).` : ""}

import { ${tag}, useReducedMotion, type Variants } from "motion/react"
import { useId } from "react"

const EASE = [0.22, 1, 0.36, 1] as const
const WIRE = [0.65, 0, 0.35, 1] as const

// custom = entrance delay in seconds, or -1 under reduced motion (finished, no motion)
const pop: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: (d: number) =>
    d < 0
      ? { scale: 1, opacity: 1, transition: { duration: 0 } }
      : {
          scale: 1,
          opacity: 1,
          transition: {
            scale: { type: "spring", stiffness: ${scene.motion.spring.stiffness}, damping: ${scene.motion.spring.damping}, delay: d },
            opacity: { duration: 0.3, delay: d },
          },
        },
}

const fade: Variants = {
  hidden: { opacity: 0 },
  visible: (d: number) => (d < 0 ? { opacity: 1, transition: { duration: 0 } } : { opacity: 1, transition: { duration: ${scene.motion.fadeDuration}, ease: "easeOut", delay: d } }),
}

const rise: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: (d: number) => (d < 0 ? { opacity: 1, y: 0, transition: { duration: 0 } } : { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE, delay: d } }),
}

const draw: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (d: number) =>
    d < 0
      ? { pathLength: 1, opacity: 1, transition: { duration: 0 } }
      : { pathLength: 1, opacity: 1, transition: { pathLength: { duration: ${scene.motion.drawDuration}, ease: WIRE, delay: d }, opacity: { duration: 0.01, delay: d } } },
}

// Dashes march along their path: ${march} is a multiple of both dash periods, so the loop is seamless.
const march: Variants = {
  hidden: {},
  visible: (reduce: boolean) => (reduce ? {} : { strokeDashoffset: [0, -${march}], transition: { repeat: Infinity, ease: "linear", duration: ${MARCH.duration} } }),
}

export function ${comp}({ className }: { className?: string }) {
  const reduce = !!useReducedMotion()
  const uid = useId().replace(/:/g, "")
  return (
    <${tag}.svg
      viewBox="${scene.viewBox ? scene.viewBox.join(" ") : `0 0 ${scene.width} ${scene.height}`}"${scene.align === "left" ? `
      preserveAspectRatio="xMinYMid meet"` : scene.align === "right" ? `
      preserveAspectRatio="xMaxYMid meet"` : ""}
      fill="none"
      className={className}
      role="img"
      aria-label="${label}"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
    >
${bg}${defs.length ? `${ind(3)}<defs>\n${defs.join("\n")}\n${ind(3)}</defs>\n` : ""}${ind(3)}<g${off}>
${lines.join("\n")}
${ind(3)}</g>
    </${tag}.svg>
  )
}
`
}

function pascal(s) {
  return String(s).replace(/(^|[-_ .]+)(\w)/g, (_, __, c) => c.toUpperCase()).replace(/[^A-Za-z0-9]/g, "")
}
