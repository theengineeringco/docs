// Spec -> screen-space marks. Two passes: expand layers (motifs + primitives) and
// register anchors in world space, then resolve references, project through the
// camera, style from the theme, and schedule the build (beats) and loops.

import { THEMES, SIZE, DASH, MARCH, MOTION, FONT_MONO } from "./tokens.mjs"
import { makeCamera, onPlane } from "./camera.mjs"
import { MOTIFS, kindOf } from "./motifs.mjs"
import * as M from "./math.mjs"

const MARKS = new Set(["circle", "circleSmall", "square", "node", "focus", "donut", "dot", "dotLarge", "flag", "ghost"])

const LINE_STYLES = {
  dashed: { stroke: "line", dash: "line", march: true },
  fine: { stroke: "line", dash: "fine", march: true },
  solid: { stroke: "line" },
  dotted: { stroke: "line", dash: "dotted" },
  faint: { stroke: "faint", dash: "line", march: true },
  faintSolid: { stroke: "faint" },
  ink: { stroke: "ink" },
  inkDashed: { stroke: "ink", dash: "line", march: true },
  accent: { stroke: "accent" },
  accentDashed: { stroke: "accent", dash: "line", march: true },
  flag: { stroke: "flag", dash: "line", march: true },
  ghost: { stroke: "line", dash: "dotted", opacity: 0.9 },
  none: { stroke: null },
}

const CAT = { plane: 0, frame: 0.5, ring: 1, line: 2, mark: 3, traveler: 4, label: 5 }

export function compile(spec) {
  const first = compileOnce(spec, 1)
  const fit = spec.fit ?? (first.camera.flat ? false : "contain")
  if (!fit) return first
  const pad = spec.padding ?? 24
  const b = marksBBox(first.marks)
  if (!isFinite(b.w)) return first
  let out = first
  if (fit === "contain") {
    const k = Math.min((first.width - 2 * pad) / Math.max(1, b.w), (first.height - 2 * pad) / Math.max(1, b.h), spec.maxZoom ?? 1.6)
    if (Math.abs(k - 1) > 0.01) out = compileOnce(spec, k)
  }
  const bb = marksBBox(out.marks)
  out.offset = [M.round(out.width / 2 - (bb.x0 + bb.w / 2)), M.round(out.height / 2 - (bb.y0 + bb.h / 2))]
  return out
}

function compileOnce(spec, zoom) {
  const [width, height] = spec.size ?? [240, 200]
  const theme = { ...(THEMES[spec.theme ?? "light"] ?? THEMES.light), ...(spec.colors ?? {}) }
  const camSpec = typeof spec.camera === "string" ? { view: spec.camera } : { ...(spec.camera ?? {}) }
  camSpec.zoom = (camSpec.zoom ?? 1) * zoom
  const cam = makeCamera(camSpec)
  const s = spec.scale ?? 1
  const motion = { ...MOTION, lines: "draw", march: true, ...(spec.motion ?? {}) }
  const facing = camSpec.marks ?? "screen"

  // ---- pass 1: expand layers, register anchors --------------------------------
  // Layers nest: a layer (or a motif) may carry child `layers`. Each level maps its
  // local points to its parent's space through `offset` and an optional `plane`
  // ({ z, origin:[x,y], axis }) that lays a flat drawing onto a 3D plane.
  const anchors = {}
  const items = []
  let layerN = 0
  let panels = 0
  const root = (q) => [q[0], q[1], q[2] ?? 0]

  const expand = (layer, parentTW, baseBeat, inherited = {}) => {
    const li = layerN++
    const off = Array.isArray(layer.offset) ? layer.offset : [0, 0]
    const plane = layer.plane
    const tw = (q, isWorld = false) => {
      if (isWorld) return parentTW([q[0] + off[0], q[1] + off[1], q[2]], true)
      const l = [q[0] + off[0], q[1] + off[1], q[2]]
      return plane ? parentTW(onPlane(l, plane), true) : parentTW(l, false)
    }
    const toWorld = (p) => (typeof p === "string" ? p : tw(p))
    const motifName = layer.motif ?? (MOTIFS[layer.type] ? layer.type : null)
    let expanded = []
    let children = layer.layers ?? []
    if (motifName) {
      const fn = MOTIFS[motifName]
      if (!fn) throw new Error(`Unknown motif "${motifName}". Motifs: ${Object.keys(MOTIFS).join(", ")}`)
      const res = fn(layer)
      if (res.meta?.panels) panels += res.meta.panels
      expanded = res.items ?? []
      children = [...children, ...(res.layers ?? [])]
      if (layer.id) {
        for (const [k, v] of Object.entries(res.anchors ?? {})) anchors[`${layer.id}.${k}`] = typeof v === "string" ? v : toWorld(v)
        anchors[layer.id] = anchors[`${layer.id}.center`] ?? anchors[`${layer.id}.root`] ?? toWorld(layer.at ?? [0, 0])
      }
      if (layer.lineStyle) expanded.forEach((it) => it.type === "line" && !it.style && (it.style = layer.lineStyle))
    } else if (layer.type && layer.type !== "group") {
      expanded = [{ ...layer, beat: 0, layers: undefined }]
    }
    const inh = { enter: layer.enter ?? inherited.enter, loop: layer.loop ?? inherited.loop, opacity: layer.opacity ?? inherited.opacity, level: layer.level ?? inherited.level, onPlane: !!layer.plane || inherited.onPlane }
    let maxBeat = 0
    const add = (it, base) => {
      const rel = it.beat ?? 0
      maxBeat = Math.max(maxBeat, base - baseBeat + rel)
      const item = { ...it, beat: base + rel, layer: li, toWorld, opacity: it.opacity ?? inh.opacity }
      if (inh.enter && !it.enter) item.enter = inh.enter
      if (inh.loop && !it.loop) item.loop = inh.loop
      if (inh.level != null && it.level == null) item.level = inh.level
      if (inh.onPlane && it.onPlane == null) item.onPlane = true
      items.push(item)
      if (it.id && it.at) anchors[it.id] = toWorld(it.at)
    }
    // items flagged afterChildren (e.g. a stack's cross-plane trace) start once the
    // nested content has finished building
    expanded.filter((it) => !it.afterChildren).forEach((it) => add(it, baseBeat))
    let cursor = baseBeat
    let childEnd = baseBeat + maxBeat
    children.forEach((ch) => {
      const b = ch.beat != null ? baseBeat + ch.beat : cursor
      const end = expand(ch, tw, b, inh)
      childEnd = Math.max(childEnd, end)
      cursor = ch.beat != null || ch.holdCursor ? cursor : end + 1
    })
    maxBeat = Math.max(maxBeat, childEnd - baseBeat)
    expanded.filter((it) => it.afterChildren).forEach((it) => add(it, childEnd + 1))
    return baseBeat + maxBeat
  }

  let cursor = 0
  // The same rule at every level: layers without a beat build one after another; a
  // layer with an explicit beat is placed there and does not move the cursor.
  ;(spec.layers ?? []).forEach((layer) => {
    const base = layer.beat ?? cursor
    const end = expand(layer, root, base)
    if (layer.beat == null && !layer.holdCursor) cursor = end + 1
  })

  const resolve = (p, toWorld) => {
    if (typeof p === "string") {
      const a = anchors[p]
      if (!a) throw new Error(`Unknown anchor "${p}". Known: ${Object.keys(anchors).slice(0, 40).join(", ")}`)
      return a
    }
    return toWorld(p)
  }

  // cascade: order inside one (layer, beat) group unless the motif set one
  const groups = new Map()
  items.forEach((it) => {
    if (it.cascade != null) return
    const k = `${it.layer}:${it.beat}`
    const n = groups.get(k) ?? 0
    it.cascade = n
    groups.set(k, n + 1)
  })

  // ---- pass 2: build marks ------------------------------------------------------
  const C = (key) => (key == null ? undefined : theme[key] ?? key)
  const P = (w) => cam.project(w)
  const lineIndex = {}
  const marks = []
  let seq = 0

  const timing = (it, type) => ({
    type,
    delay: M.round(motion.delay + it.beat * motion.stagger + (it.cascade ?? 0) * motion.within, 3),
  })

  const push = (m, it, cat, w) => {
    m.sort = [it.level ?? (cam.flat ? 0 : M.round(w?.[2] ?? 0, 1)), CAT[cat], cam.flat ? 0 : cam.depth(w ?? [0, 0, 0]), seq++]
    if (cat === "label" && !it.occlude) m.sort[0] = 1e9
    if (cat === "traveler") m.sort[0] = 1e8
    if (it.opacity != null) m.opacity = it.opacity
    marks.push(m)
    return m
  }

  // Marks keep their brand size whatever the camera zoom; rings and planes are
  // geometry and scale with it.
  const disc = (w, r, style, axis, geometry = false) => {
    if (cam.flat || (facing === "screen" && !geometry)) {
      const [x, y] = P(w)
      return { shape: "circle", cx: x, cy: y, r: geometry ? r * (cam.zoom ?? 1) : r, ...style }
    }
    const e = cam.circle(w, geometry ? r : r / (cam.zoom ?? 1), axis)
    return { shape: "ellipse", ...e, ...style }
  }

  const squareAt = (w, size, style) => {
    const [x, y] = P(w)
    if (cam.flat || facing === "screen") return { shape: "rect", x: x - size / 2, y: y - size / 2, w: size, h: size, ...style }
    const z = cam.zoom ?? 1
    const { u, v } = cam.basis("xy")
    const area = Math.abs(u[0] * v[1] - u[1] * v[0]) / (z * z)
    const k = 1 / (z * Math.sqrt(area || 1))
    const h = size / 2
    const pts = [[-h, -h], [h, -h], [h, h], [-h, h]].map(([a, b]) => [x + (u[0] * a + v[0] * b) * k, y + (u[1] * a + v[1] * b) * k])
    return { shape: "poly", pts, closed: true, ...style }
  }

  const markLoops = (it, extra = []) => {
    const out = [...extra]
    const loop = typeof it.loop === "string" ? { type: it.loop } : it.loop
    if (loop && loop.type !== "none" && loop.type !== "march") out.push(loop)
    return out
  }

  const buildMark = (it, w) => {
    const type = it.type
    const r0 = it.r
    const color = it.color ? C(it.color) : null
    const enter = it.enter === "none" ? { type: "none", delay: 0 } : timing(it, it.enter ?? "pop")
    const loopsFor = (center) => {
      const ls = markLoops(it)
      return ls.map((l) => (l.type === "orbit" ? { ...l, center: P(resolve(l.center, it.toWorld)) } : l))
    }
    const [cx, cy] = P(w)
    const base = { enter, loops: loopsFor(), center: [cx, cy], kind: type, id: it.id }
    // marks sitting on a 3D plane hide lines with the plane's color, not the page's
    const paper = it.onPlane && !cam.flat ? C("plane") : C("paper")
    let m
    switch (type) {
      case "circle":
      case "circleSmall":
        m = { ...base, ...disc(w, (r0 ?? (type === "circle" ? SIZE.circle : SIZE.circleSmall)) * s, { fill: paper, stroke: color ?? C("line"), sw: SIZE.stroke * s }) }
        break
      case "ghost":
        m = { ...base, ...disc(w, (r0 ?? SIZE.circle) * s, { fill: paper, stroke: color ?? C("line"), sw: SIZE.stroke * s, dash: dashOf("fine", s) }) }
        break
      case "square":
        m = { ...base, ...squareAt(w, (it.size ?? SIZE.square) * s, { fill: color ?? C("accent") }) }
        break
      case "flag": {
        const d = (it.size ?? SIZE.flag) * s * 0.72
        m = { ...base, shape: "poly", closed: true, pts: [[cx, cy - d], [cx + d, cy], [cx, cy + d], [cx - d, cy]], fill: color ?? C("flag") }
        break
      }
      case "dot":
      case "dotLarge":
        m = { ...base, ...disc(w, (r0 ?? (type === "dot" ? SIZE.dot : SIZE.dotLarge)) * s, { fill: color ?? C("ink") }) }
        break
      case "node":
      case "focus": {
        const ringR = (r0 ?? (type === "node" ? SIZE.nodeRing : 15)) * s
        const ring = disc(w, ringR, { fill: paper, stroke: color ?? C("accent"), sw: SIZE.stroke * s })
        const sq = squareAt(w, (it.size ?? SIZE.nodeSquare) * s, { fill: color ?? C("accent") })
        m = { ...base, shape: "group", children: [ring, sq], ringDraw: type === "focus" }
        if (it.loop === "ping") m.loops = [{ type: "ping", r0: ringR, r1: ringR * 2.1, period: 2.6, color: color ?? C("accent") }]
        break
      }
      case "donut": {
        const ring = disc(w, (r0 ?? SIZE.donutRing) * s, { fill: paper, stroke: color ?? C("line"), sw: SIZE.stroke * s, dash: dashOf("fine", s) })
        const core = disc(w, SIZE.donutCore * s, { fill: "none", stroke: color ?? C("line"), sw: SIZE.stroke * s })
        m = { ...base, shape: "group", children: [ring, core], march: it.loop !== "none" && motion.march }
        break
      }
      default:
        throw new Error(`Unknown mark "${type}"`)
    }
    return push(m, it, "mark", w)
  }

  const routePts = (it, A, B) => {
    const route = it.route ?? "straight"
    const sameZ = Math.abs((A[2] ?? 0) - (B[2] ?? 0)) < 1e-6
    let pts2
    if (route === "straight" || !sameZ) return [A, B]
    const a = [A[0], A[1]], b = [B[0], B[1]]
    if (route === "elbow") pts2 = M.elbow(a, b, { axis: it.axis ?? "x", radius: it.radius ?? 8, at: it.bend ?? 0.5 })
    else if (route === "curve") pts2 = M.sCurve(a, b, { axis: it.axis ?? "x", tension: it.tension ?? 0.5 })
    else if (route === "arc") {
      // Quadratic arc. `lift`: peak height in px, positive bows to the left of travel
      // (up, for a left-to-right line). `bulge`: control-point offset as a share of the
      // chord, positive bows to the right of travel (down, left to right); peak = bulge × chord / 2.
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
      const d = M.sub(b, a)
      const n = M.norm([-d[1], d[0]]) // right of travel in screen space (y down)
      const h = it.lift != null ? -2 * it.lift : (it.bulge ?? 0.25) * M.len(d)
      const ctrl = M.add(mid, M.mul(n, h))
      pts2 = Array.from({ length: 33 }, (_, i) => {
        const t = i / 32
        return [(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * ctrl[0] + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * ctrl[1] + t * t * b[1]]
      })
    } else pts2 = [a, b]
    return pts2.map((p) => [p[0], p[1], A[2] ?? 0])
  }

  const strokeStyle = (it, fallback = "dashed") => {
    const st = typeof it.style === "object" ? it.style : LINE_STYLES[it.style ?? fallback] ?? LINE_STYLES[fallback]
    return {
      stroke: C(it.color ?? st.stroke),
      sw: (it.width ?? SIZE.stroke) * s,
      dash: st.dash ? dashOf(st.dash, s) : null,
      march: !!st.march && motion.march && it.loop !== "none",
      opacity: st.opacity,
    }
  }

  const lineEnter = (it) => (it.enter === "none" ? { type: "none", delay: 0 } : timing(it, it.enter ?? (motion.lines === "fade" ? "fade" : "draw")))

  for (const it of items) {
    const type = it.type
    if (MARKS.has(type)) {
      buildMark(it, resolve(it.at, it.toWorld))
      continue
    }
    switch (type) {
      case "line":
      case "path": {
        const raw = type === "line" ? [resolve(it.from, it.toWorld), ...(it.via ?? []).map((p) => resolve(p, it.toWorld)), resolve(it.to, it.toWorld)] : it.points.map((p) => resolve(p, it.toWorld))
        let world = raw
        if (type === "line" && raw.length === 2) world = routePts(it, raw[0], raw[1])
        if (it.rounded) {
          const z = world[0][2] ?? 0
          world = M.rounded(world.map((p) => [p[0], p[1]]), it.rounded).map((p) => [p[0], p[1], z])
        }
        const pts = world.map(P)
        const st = strokeStyle(it)
        const m = { shape: "path", pts, closed: !!it.closed, fill: "none", ...st, enter: lineEnter(it), loops: markLoops(it), id: it.id }
        // lines that climb between levels sort with their upper end, so they read over
        // the plane they arrive on (diagram x-ray, not strict occlusion)
        const highest = world.reduce((a, b) => ((a[2] ?? 0) >= (b[2] ?? 0) ? a : b))
        push(m, it, "line", it.vertical ? [highest[0], highest[1], (highest[2] ?? 0)] : world[0])
        if (it.id) lineIndex[it.id] = pts
        break
      }
      case "ring": {
        const w = resolve(it.at, it.toWorld)
        const st = strokeStyle(it, it.style ?? "dashed")
        const m = { ...disc(w, it.r, { fill: "none", ...st }, it.axis ?? "xy", true), enter: it.enter === "none" ? { type: "none", delay: 0 } : timing(it, it.enter ?? "pop"), loops: markLoops(it), center: P(w), id: it.id }
        push(m, it, "ring", w)
        break
      }
      case "ellipse": {
        const w = resolve(it.at, it.toWorld)
        const st = strokeStyle(it, it.style ?? "dashed")
        let m
        if (cam.flat) {
          const [x, y] = P(w)
          m = { shape: "ellipse", cx: x, cy: y, rx: it.rx * cam.zoom, ry: it.ry * cam.zoom, rot: it.rot ?? 0, fill: "none", ...st }
        } else {
          const pts = []
          for (let i = 0; i <= 96; i++) {
            const t = (i / 96) * M.TAU
            const r = M.rad(it.rot ?? 0)
            const lx = it.rx * Math.cos(t), ly = it.ry * Math.sin(t)
            pts.push(P([w[0] + lx * Math.cos(r) - ly * Math.sin(r), w[1] + lx * Math.sin(r) + ly * Math.cos(r), w[2]]))
          }
          m = { shape: "path", pts, closed: true, fill: "none", ...st }
        }
        push({ ...m, enter: it.enter === "none" ? { type: "none", delay: 0 } : timing(it, it.enter ?? "pop"), loops: markLoops(it), center: P(w) }, it, "ring", w)
        break
      }
      case "plane":
      case "frame": {
        const w = resolve(it.at, it.toWorld)
        const [pw, pd] = it.size ?? [160, 120]
        const z = w[2] ?? 0
        const corners = [
          [w[0] - pw / 2, w[1] - pd / 2, z],
          [w[0] + pw / 2, w[1] - pd / 2, z],
          [w[0] + pw / 2, w[1] + pd / 2, z],
          [w[0] - pw / 2, w[1] + pd / 2, z],
        ]
        const pts = corners.map(P)
        const isPlane = type === "plane"
        const st = isPlane
          ? { fill: C(it.fill ?? "plane"), fillOpacity: it.fillOpacity ?? 0.86, stroke: C(it.stroke ?? "planeStroke"), sw: SIZE.stroke * s, dash: it.style === "dashed" ? dashOf("line", s) : null }
          : { fill: it.fill ? C(it.fill) : "none", ...strokeStyle(it, it.style ?? "dashed") }
        push({ shape: "poly", pts, closed: true, ...st, enter: it.enter === "none" ? { type: "none", delay: 0 } : timing(it, it.enter ?? (isPlane ? "rise" : "draw")), loops: markLoops(it), center: P(w) }, it, isPlane ? "plane" : "frame", [w[0], w[1], z - 0.001])
        if (it.label) {
          const corner = it.labelCorner ?? "left"
          const anchorPt = corner === "right" ? pts[1] : pts[3]
          const lbl = { type: "label", text: it.label, beat: it.beat + 0.5, cascade: it.cascade, layer: it.layer, occlude: true, level: undefined }
          push(
            textMark(lbl, [anchorPt[0] + (corner === "right" ? 10 : -10), anchorPt[1] + 4], { anchor: corner === "right" ? "start" : "end" }),
            { ...lbl, level: cam.flat ? 0 : M.round(z, 1) },
            "label",
            [w[0], w[1], z]
          )
        }
        break
      }
      case "box": {
        const w = resolve(it.at, it.toWorld)
        const [bw, bd, bh] = it.size ?? [40, 40, 40]
        const x0 = w[0] - bw / 2, x1 = w[0] + bw / 2, y0 = w[1] - bd / 2, y1 = w[1] + bd / 2, z0 = w[2] ?? 0, z1 = z0 + bh
        const faces = [
          { n: [0, 0, 1], q: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], top: true },
          { n: [1, 0, 0], q: [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]] },
          { n: [-1, 0, 0], q: [[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]] },
          { n: [0, 1, 0], q: [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]] },
          { n: [0, -1, 0], q: [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]] },
        ]
        const V = [Math.sin(cam.azimuth ?? 0) * Math.cos(cam.elevation ?? 0), Math.cos(cam.azimuth ?? 0) * Math.cos(cam.elevation ?? 0), Math.sin(cam.elevation ?? 1)]
        const visible = faces.filter((f) => f.n[0] * V[0] + f.n[1] * V[1] + f.n[2] * V[2] > 1e-6)
        const children = visible.map((f) => ({
          shape: "poly",
          closed: true,
          pts: f.q.map(P),
          fill: f.top && it.top ? C(it.top) : C("paper"),
          stroke: C(it.stroke ?? "ink"),
          sw: SIZE.stroke * s,
          strokeOpacity: 0.7,
        }))
        push({ shape: "group", children, enter: timing(it, it.enter ?? "rise"), loops: [], center: P([w[0], w[1], z0 + bh / 2]), kind: "box" }, it, "mark", [w[0], w[1], z0])
        break
      }
      case "label":
      case "numeral": {
        const w = resolve(it.at, it.toWorld)
        const [x, y] = P(w)
        push(textMark(it, [x + (it.dx ?? 0), y + (it.dy ?? 0)], { numeral: type === "numeral" }), it, "label", w)
        break
      }
      case "traveler": {
        let pts
        if (it.alongSamples) pts = it.alongSamples.map((p) => P(it.toWorld(p)))
        else if (typeof it.along === "string") pts = lineIndex[it.along]
        else if (Array.isArray(it.along)) pts = it.along.map((p) => P(resolve(p, it.toWorld)))
        else if (it.from) pts = [P(resolve(it.from, it.toWorld)), P(resolve(it.to, it.toWorld))]
        if (!pts) throw new Error(`traveler needs along: <line id> (declared before it), a points list, or from/to`)
        const size = (it.size ?? SIZE.traveler) * s
        push(
          {
            shape: "traveler",
            pts,
            size,
            fill: C(it.color ?? "accent"),
            glyph: it.glyph ?? "square",
            period: it.period ?? 2.6,
            offset: it.phase ?? (typeof it.offset === "number" ? it.offset : 0),
            closed: !!it.closed,
            hold: it.hold ?? 0.25,
            enter: { type: "travel", delay: M.round(motion.delay + it.beat * motion.stagger, 3) },
            loops: [],
          },
          it,
          "traveler",
          [0, 0, 1e6]
        )
        break
      }
      case "curve": {
        // Lissajous samples: { p:[x,y], z } in layer space. Split into front/back runs.
        const proj = it.samples.map((sm) => ({ q: P(it.toWorld(sm.p)), z: sm.z }))
        const width = (it.width ?? 1.25) * s
        const runs = []
        if (it.depth) {
          let cur = null
          proj.forEach((sm, i) => {
            const front = sm.z >= 0
            if (!cur || cur.front !== front) {
              if (cur) cur.pts.push(sm.q)
              cur = { front, pts: cur ? [cur.pts[cur.pts.length - 1], sm.q] : [sm.q] }
              runs.push(cur)
            } else cur.pts.push(sm.q)
          })
        } else runs.push({ front: true, pts: proj.map((p) => p.q) })
        const ghost = it.style === "ghost"
        const ink = C(it.style === "accent" ? "accent" : it.style === "line" ? "line" : "ink")
        // back runs first so the front reads on top
        ;[...runs].sort((a, b) => a.front - b.front).forEach((run, k) => {
          const m = {
            shape: "path",
            pts: run.pts,
            fill: "none",
            stroke: ghost ? C("line") : ink,
            sw: ghost ? width * 0.8 : width,
            dash: ghost || !run.front ? dashOf("dotted", s) : null,
            opacity: ghost ? 0.9 : run.front ? 1 : 0.75,
            enter: it.enter === "none" ? { type: "none", delay: 0 } : { ...timing(it, "draw"), duration: 1.6 },
            loops: [],
          }
          push(m, { ...it, cascade: 0 }, "line", [0, 0, 0])
        })
        break
      }
      default:
        throw new Error(`Unknown layer type "${type}"`)
    }
  }

  function textMark(it, [x, y], { numeral = false, anchor } = {}) {
    const size = (it.size ?? (numeral ? SIZE.numeral : SIZE.label)) * s
    return {
      shape: "text",
      x,
      y,
      text: String(it.text ?? ""),
      size,
      anchor: anchor ?? it.anchor ?? "start",
      fill: C(it.color ?? (numeral ? "accent" : "label")),
      family: FONT_MONO,
      tracking: it.tracking ?? 0.02,
      enter: it.enter === "none" ? { type: "none", delay: 0 } : timing(it, it.enter ?? "fade"),
      loops: [],
      caption: !!it.caption,
      maxWidth: it.maxWidth,
    }
  }

  marks.sort((a, b) => a.sort[0] - b.sort[0] || a.sort[1] - b.sort[1] || a.sort[2] - b.sort[2] || a.sort[3] - b.sort[3])

  // total build time: the last entrance plus its duration
  let buildEnd = 0
  for (const m of marks) {
    if (m.enter?.type && m.enter.type !== "none") buildEnd = Math.max(buildEnd, m.enter.delay + durationOf(m, motion))
  }

  return {
    name: spec.name ?? "illustration",
    width,
    height,
    theme,
    background: spec.background === undefined ? theme.background : spec.background,
    camera: cam,
    marks,
    motion,
    scale: s,
    offset: [0, 0],
    buildEnd,
    title: spec.title,
    description: spec.description,
    viewBox: spec.viewBox,
    align: spec.align,
    panels,
  }
}

export function dashOf(key, s = 1) {
  const pat = DASH[key] ?? key
  return pat
    .split(/[ ,]+/)
    .map((v) => M.round(parseFloat(v) * s, 2))
    .join(" ")
}

export function durationOf(m, motion = MOTION) {
  const t = m.enter?.type
  if (m.enter?.duration) return m.enter.duration
  if (t === "pop") return motion.popDuration
  if (t === "fade") return motion.fadeDuration
  if (t === "rise") return 0.7
  if (t === "draw") {
    if (m.shape === "path") return M.clamp(M.polyLength(m.pts) / 260, 0.35, 0.9)
    return motion.drawDuration
  }
  return 0
}

export function marksBBox(marks) {
  const pts = []
  const add = (m) => {
    switch (m.shape) {
      case "circle":
        pts.push([m.cx - m.r, m.cy - m.r], [m.cx + m.r, m.cy + m.r])
        break
      case "ellipse": {
        const R = Math.max(m.rx, m.ry)
        pts.push([m.cx - R, m.cy - R], [m.cx + R, m.cy + R])
        break
      }
      case "rect":
        pts.push([m.x, m.y], [m.x + m.w, m.y + m.h])
        break
      case "poly":
      case "path":
      case "traveler":
        pts.push(...m.pts)
        break
      case "text": {
        const w = m.text.length * m.size * 0.6
        const x0 = m.anchor === "end" ? m.x - w : m.anchor === "middle" ? m.x - w / 2 : m.x
        pts.push([x0, m.y - m.size], [x0 + w, m.y + m.size * 0.3])
        break
      }
      case "group":
        m.children.forEach(add)
        break
    }
  }
  marks.forEach(add)
  return M.bbox(pts)
}

export { kindOf }
