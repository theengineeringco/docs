// Motifs: parameterised layouts that expand into primitives. Each motif returns
// { items, anchors } where items are primitive specs in local coordinates (already
// offset by `at`) carrying a relative `beat`, and anchors are named points that
// other layers can reference as "<id>.<anchor>".

import { polar, rng, dist, lerp, selfCrossings, turningPoints, TAU, rad } from "./math.mjs"

// Kind shorthand used in pattern strings: "cscs", "nsss" ...
export const KIND = {
  c: "circle",
  C: "circleSmall",
  s: "square",
  n: "node",
  d: "donut",
  o: "dot",
  O: "dotLarge",
  f: "flag",
  g: "ghost",
  r: "halo",
  "-": null,
}

export function kindOf(k) {
  if (k == null) return null
  if (typeof k === "object") return k
  if (k.length === 1 && k in KIND) return KIND[k]
  return k
}

// A kind parameter with a default. null and "-" both mean "no mark here".
export const kd = (v, dflt) => (v === null ? null : kindOf(v ?? dflt))

export function kinds(pattern, n, fallback = "c") {
  if (Array.isArray(pattern)) return Array.from({ length: n }, (_, i) => kindOf(pattern[i % pattern.length] ?? fallback))
  const p = (pattern ?? fallback).toString()
  return Array.from({ length: n }, (_, i) => kindOf(p[i % p.length]))
}

const mark = (kind, at, beat, extra = {}) => {
  if (!kind) return null
  if (typeof kind === "object") return { ...kind, at, beat: kind.beat ?? beat, ...extra }
  return { type: kind, at, beat, ...extra }
}
const line = (from, to, beat, extra = {}) => ({ type: "line", from, to, beat, ...extra })
const compact = (xs) => xs.filter(Boolean)

// ---------------------------------------------------------------------------

// Spokes from a centre. Change, impact, notifications, MCP clients.
function hub(o) {
  const c = o.at ?? [120, 100]
  const n = o.count ?? 8
  const R = o.radius ?? 58
  const start = o.start ?? -90
  const ks = kinds(o.kinds ?? "cs", n)
  const rand = rng(o.seed ?? 3)
  const items = []
  const anchors = { center: c }
  ;(o.rings ?? []).forEach((r) => items.push({ type: "ring", at: c, r, beat: 0 }))
  const ends = []
  for (let i = 0; i < n; i++) {
    const deg = o.angles?.[i] ?? start + (360 / n) * i
    const r = (o.lengths?.[i] ?? R) * (1 + (o.jitter ? (rand() - 0.5) * o.jitter : 0))
    const p = polar(c, r, deg)
    ends.push(p)
    anchors[i] = p
    if (o.spokes !== false && ks[i]) items.push(line(c, p, o.spokeBeats?.[i] ?? 1, { style: o.spokeStyles?.[i] ?? o.spokeStyle }))
  }
  ends.forEach((p, i) => items.push(mark(ks[i], p, 2)))
  if (o.ports) {
    ends.forEach((p, i) => {
      if (!ks[i]) return
      const deg = o.angles?.[i] ?? start + (360 / n) * i
      items.push(mark(kd(o.portKind, "C"), polar(c, o.ports, deg), 1.5))
    })
  }
  if (o.center !== null) items.push(mark(kd(o.center, "n"), c, 0))
  return { items: compact(items), anchors }
}

// One to many (or many to one). Automations, ingestion, formulas.
function fan(o) {
  const dir = o.direction ?? "right"
  const n = o.count ?? 3
  const spread = o.spread ?? 96
  const reach = o.reach ?? 122
  const src = o.at ?? [54, 100]
  const vec = { right: [1, 0], left: [-1, 0], down: [0, 1], up: [0, -1] }[dir]
  const perp = [vec[1], vec[0]]
  const via = o.via === false ? null : o.via ?? 54
  const hubPt = via ? [src[0] + vec[0] * via, src[1] + vec[1] * via] : src
  const targets = []
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1) - 0.5
    const off = o.arc ? Math.cos(t * Math.PI) * o.arc - o.arc : 0
    targets.push([
      src[0] + vec[0] * (reach + off) + perp[0] * t * spread,
      src[1] + vec[1] * (reach + off) + perp[1] * t * spread,
    ])
  }
  const tk = kinds(o.targets ?? "s", n)
  const inbound = !!o.inbound
  const items = []
  const anchors = { source: src, hub: hubPt }
  targets.forEach((p, i) => (anchors[i] = p))
  if (via) items.push(inbound ? line(hubPt, src, 3) : line(src, hubPt, 1))
  targets.forEach((p, i) => items.push(inbound ? line(p, hubPt, 1, { style: o.lineStyles?.[i] }) : line(hubPt, p, 2, { style: o.lineStyles?.[i] })))
  if (o.source !== null) items.push(mark(kd(o.source, (inbound ? "s" : "c")), src, inbound ? 4 : 0))
  targets.forEach((p, i) => items.push(mark(tk[i], p, inbound ? 0 : 3)))
  if (via && o.hubKind !== null) items.push(mark(kd(o.hubKind, "n"), hubPt, inbound ? 2 : 1))
  return { items: compact(items), anchors }
}

// Parallel lanes. Conflicts, integration paths, review states, workstreams.
function rows(o) {
  const [x0, y0] = o.at ?? [44, 60]
  const n = o.count ?? 3
  const gap = o.gap ?? 40
  const w = o.width ?? 148
  const midF = o.mid ?? 0.5
  const startK = kinds(o.starts ?? "C", n)
  const midK = kinds(o.mids ?? "d", n)
  const endK = kinds(o.ends ?? "s", n)
  const items = []
  const anchors = {}
  for (let i = 0; i < n; i++) {
    const y = y0 + i * gap
    const a = [x0, y], b = [x0 + w, y], m = [x0 + w * midF, y]
    anchors[`start${i}`] = a
    anchors[`mid${i}`] = m
    anchors[`end${i}`] = b
    items.push(line(a, b, 0, { cascade: i }))
    items.push(mark(startK[i], a, 1))
    const mk = o.highlight === i ? "node" : midK[i]
    items.push(mark(mk, m, o.highlight === i ? 3 : 2))
    items.push(mark(endK[i], b, 4))
  }
  return { items: compact(items), anchors }
}

// Concentric dashed rings with satellites. Agents, evidence, security layers.
function orbit(o) {
  const c = o.at ?? [120, 100]
  const radii = o.rings ?? [34, 60]
  const items = []
  const anchors = { center: c }
  radii.forEach((r, i) => items.push({ type: "ring", at: c, r, beat: 0, cascade: i }))
  const rand = rng(o.seed ?? 7)
  let sats = o.satellites
  if (!sats) {
    sats = []
    const per = o.perRing ?? radii.map((_, i) => 3 + i)
    radii.forEach((_, ri) => {
      const n = per[ri] ?? 3
      const off = rand() * 360
      const ks = kinds((o.kinds ?? ["c", "s"])[ri] ?? "c", n)
      for (let i = 0; i < n; i++) sats.push({ ring: ri, angle: off + (360 / n) * i + (rand() - 0.5) * 24, kind: ks[i] })
    })
  }
  sats.forEach((s, i) => {
    const r = radii[s.ring ?? 0]
    const p = polar(c, r, s.angle ?? 0)
    anchors[i] = p
    const loop = o.spin ? { type: "orbit", center: c, period: o.spin * (s.ring % 2 ? -1.6 : 1) } : undefined
    items.push(mark(kd(s.kind, "c"), p, 2 + (s.ring ?? 0) * 0.5, loop ? { loop } : {}))
  })
  if (o.center !== null) items.push(mark(kd(o.center, "n"), c, 1))
  return { items: compact(items), anchors }
}

// Hierarchy. Decomposition, traceability, data model.
function tree(o) {
  const root = o.at ?? [120, 40]
  const dir = o.direction ?? "down"
  const [levelGap, sibGap] = o.spacing ?? [52, 36]
  const route = o.route ?? "bus"
  const levelKinds = (o.levels ?? ["n", "c", "s"]).map(kindOf)
  let spec = o.root
  if (!spec) {
    const br = o.branching ?? [3, 2]
    const build = (depth) => ({
      kind: levelKinds[Math.min(depth, levelKinds.length - 1)],
      children: depth < br.length ? Array.from({ length: br[depth] }, () => build(depth + 1)) : [],
    })
    spec = build(0)
  }
  // tidy layout: leaves get consecutive slots, parents centre over children
  let slot = 0
  const placed = []
  const layout = (nd, depth, parent) => {
    const me = { nd, depth, parent, kids: [] }
    placed.push(me)
    const ch = nd.children ?? []
    if (!ch.length) me.s = slot++
    else {
      me.kids = ch.map((c) => layout(c, depth + 1, me))
      me.s = (me.kids[0].s + me.kids[me.kids.length - 1].s) / 2
    }
    return me
  }
  layout(spec, 0, null)
  const mid = (slot - 1) / 2
  const pos = (p) =>
    dir === "down"
      ? [root[0] + (p.s - mid) * sibGap, root[1] + p.depth * levelGap]
      : [root[0] + p.depth * levelGap, root[1] + (p.s - mid) * sibGap]
  const items = []
  const anchors = { root }
  let leafIdx = 0
  placed.forEach((p) => (p.at = pos(p)))
  placed.forEach((p) => {
    const lvl = p.depth * 2
    if (p.kids.length && route === "bus") {
      // one stem, one bus, one drop per child: no overlapping dashes
      const down = dir === "down"
      const busAt = down ? p.at[1] + levelGap * (o.busAt ?? 0.5) : p.at[0] + levelGap * (o.busAt ?? 0.5)
      const B = (v) => (down ? [v, busAt] : [busAt, v])
      const own = down ? p.at[0] : p.at[1]
      const ks = p.kids.map((k) => (down ? k.at[0] : k.at[1]))
      const lo = Math.min(...ks), hi = Math.max(...ks)
      items.push(line(p.at, B(own), lvl + 1))
      if (lo < own - 0.5) items.push(line(B(own), B(lo), lvl + 1.4))
      if (hi > own + 0.5) items.push(line(B(own), B(hi), lvl + 1.4))
      p.kids.forEach((k, i) => items.push(line(B(down ? k.at[0] : k.at[1]), k.at, lvl + 1.8, { cascade: i, style: k.nd.line })))
    } else if (p.parent && route !== "bus") {
      items.push(line(p.parent.at, p.at, lvl - 1, { route, axis: dir === "down" ? "y" : "x", style: p.nd.line }))
    }
    items.push(mark(kd(p.nd.kind, levelKinds[Math.min(p.depth, levelKinds.length - 1)]), p.at, lvl))
    if (!p.kids.length) anchors[`leaf${leafIdx++}`] = p.at
    if (p.nd.id) anchors[p.nd.id] = p.at
  })
  return { items: compact(items), anchors }
}

// Git-style branching on a horizontal trunk. Branches, merges, baselines, reviews.
// Timing follows the pen: a mark appears when the line reaching it has drawn there.
function branch(o) {
  const [x0, y0] = o.at ?? [52, 100]
  const L = o.length ?? 140
  const laneGap = o.laneGap ?? 46
  const items = []
  const anchors = { start: [x0, y0], end: [x0 + L, y0] }
  const X = (f) => x0 + f * L
  // beats a line of `px` takes to draw (draw time is length/260 s, 0.35..0.9 s; a beat is 0.1 s)
  const drawBeats = (px) => Math.min(9, Math.max(3.5, px / 26))
  const trunkBeats = drawBeats(L)
  const at = (f) => f * trunkBeats // when the trunk's pen reaches fraction f
  const mergeAt = []
  items.push(line([x0, y0], [x0 + L, y0], 0, { style: o.trunkStyle ?? "dashed" }))
  ;(o.commits ?? []).forEach((f, i) => items.push(mark(kd(o.commitKind, "o"), [X(f), y0], at(f) + 0.5, { cascade: 0 })))
  ;(o.branches ?? []).forEach((b, i) => {
    const lane = b.lane ?? (i % 2 ? 1 : -1) * (1 + Math.floor(i / 2))
    const y = y0 + lane * (b.laneGap ?? laneGap)
    const fx = X(b.from ?? 0.15)
    const tx = b.to != null ? X(b.to) : X(b.until ?? 0.85)
    const pts = [[fx, y0], [fx, y], [tx, y]]
    if (b.to != null) pts.push([tx, y0])
    const rise = Math.abs(y - y0), run = Math.abs(tx - fx)
    const t0 = b.beat ?? at(b.from ?? 0.15) + 1 // lane starts once its fork point exists
    const dur = drawBeats(rise * (b.to != null ? 2 : 1) + run)
    const reach = (px) => t0 + (px / (rise * (b.to != null ? 2 : 1) + run)) * dur // pen arrives at path length px
    items.push({ type: "path", points: pts, rounded: o.radius ?? 0, beat: t0, style: b.style })
    anchors[`fork${i}`] = [fx, y0]
    anchors[`lane${i}`] = [fx, y]
    items.push(mark(kd(b.forkKind, "c"), [fx, y0], t0 - 0.6))
    ;(b.commits ?? []).forEach((f, k) => {
      const x = lerp(fx, tx, f)
      items.push(mark(kd(b.commitKind, "c"), [x, y], reach(rise + f * run) + 0.3, { cascade: 0 }))
      anchors[`b${i}c${k}`] = [x, y]
    })
    if (b.to != null) {
      anchors[`merge${i}`] = [tx, y0]
      items.push(mark(kd(b.mergeKind, "s"), [tx, y0], t0 + dur + 0.3))
      mergeAt.push({ x: tx, t: t0 + dur + 0.3, lane })
    } else {
      anchors[`tip${i}`] = [tx, y]
      items.push(mark(kd(b.tip, "s"), [tx, y], t0 + dur + 0.3))
    }
  })
  ;(o.baselines ?? []).forEach((f, i) => {
    const x = X(f)
    const h = o.baselineHeight ?? 18
    // a baseline is recorded once whatever merges at it has landed; its tick sits on the
    // side away from the merging lane so it doesn't run into the drop
    const landed = mergeAt.filter((m) => Math.abs(m.x - x) < 1)
    const side = o.baselineSide ?? (landed.length ? (landed.every((m) => m.lane < 0) ? "below" : landed.every((m) => m.lane > 0) ? "above" : "both") : "both")
    const ya = side === "below" ? y0 + 4 : y0 - h, yb = side === "above" ? y0 - 4 : y0 + h
    items.push(line([x, ya], [x, yb], landed.length ? Math.max(...landed.map((m) => m.t)) + 1 : at(f) + 1, { style: "solid", loop: "none" }))
    anchors[`baseline${i}`] = [x, y0]
  })
  if (o.head !== null) {
    const hf = o.head ?? 1
    const hx = X(hf)
    // the head is the live baseline: it appears as soon as the trunk reaches it
    items.push(mark(kd(o.headKind, "n"), [hx, y0], o.headBeat ?? at(hf)))
    anchors.head = [hx, y0]
  }
  // no start mark when a fork sits right next to it (two circles would touch)
  const crowded = (o.branches ?? []).some((b) => X(b.from ?? 0.15) - x0 < 24)
  if (!crowded) {
    const sk = kd(o.startKind, "c")
    if (sk) items.push(mark(sk, [x0, y0], 0))
  }
  return { items: compact(items), anchors }
}

// A seeded network. The systems graph, "millions of connections".
function graph(o) {
  const c = o.at ?? [120, 100]
  const [w, h] = o.size ?? [170, 130]
  const n = o.count ?? 18
  const rand = rng(o.seed ?? 11)
  const minD = o.minDistance ?? Math.sqrt((w * h) / n) * 0.62
  if (o.layout === "radial") return radialGraph(o, c, w, h, rand)
  const pts = []
  let guard = 0
  while (pts.length < n && guard++ < 6000) {
    const p =
      o.shape === "rect"
        ? [c[0] + (rand() - 0.5) * w, c[1] + (rand() - 0.5) * h]
        : (() => {
            const a = rand() * TAU, r = Math.sqrt(rand())
            return [c[0] + Math.cos(a) * r * (w / 2), c[1] + Math.sin(a) * r * (h / 2)]
          })()
    if (dist(p, c) < (o.hole ?? 26)) continue
    if (pts.every((q) => dist(p, q) >= minD)) pts.push(p)
  }
  const k = o.k ?? 2
  const edges = new Set()
  const E = []
  pts.forEach((p, i) => {
    const near = pts
      .map((q, j) => [j, dist(p, q)])
      .filter(([j]) => j !== i)
      .sort((a, b) => a[1] - b[1])
      .slice(0, k)
    near.forEach(([j]) => {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`
      if (!edges.has(key)) {
        edges.add(key)
        E.push([i, j])
      }
    })
  })
  const items = []
  const anchors = { center: c }
  E.forEach(([i, j], e) => items.push(line(pts[i], pts[j], 1, { cascade: e * 0.3, style: o.edgeStyle })))
  // centre spokes to the nearest few
  const spokes = o.spokes ?? 5
  pts
    .map((p, i) => [i, dist(p, c)])
    .sort((a, b) => a[1] - b[1])
    .slice(0, spokes)
    .forEach(([i]) => items.push(line(c, pts[i], 0.5)))
  const squares = new Set(o.squares ?? [])
  if (!o.squares) {
    const ns = o.squareCount ?? 4
    while (squares.size < Math.min(ns, pts.length)) squares.add(Math.floor(rand() * pts.length))
  }
  pts.forEach((p, i) => {
    anchors[i] = p
    items.push(mark(squares.has(i) ? "square" : kd(o.kind, "c"), p, squares.has(i) ? 3 : 2, { cascade: i * 0.2 }))
  })
  if (o.center !== null) items.push(mark(kd(o.center, "n"), c, 0))
  return { items: compact(items), anchors }
}

// Rings of nodes around the live centre: ordered, readable, "everything connected".
function radialGraph(o, c, w, h, rand) {
  const counts = o.rings ?? [5, 9]
  const radii = o.radii ?? counts.map((_, i) => (i + 1) / counts.length)
  const items = []
  const anchors = { center: c }
  const ringPts = counts.map((n, ri) => {
    const off = (o.offsets?.[ri] ?? rand() * 360)
    return Array.from({ length: n }, (_, i) => {
      const deg = off + (360 / n) * i + (rand() - 0.5) * (o.angleJitter ?? 14)
      const rr = radii[ri] * (1 + (rand() - 0.5) * (o.radiusJitter ?? 0.12))
      return [c[0] + Math.cos(rad(deg)) * rr * (w / 2), c[1] + Math.sin(rad(deg)) * rr * (h / 2)]
    })
  })
  const squares = new Set((o.squares ?? []).map((v) => v.join(",")))
  const sqCount = o.squareCount ?? 3
  if (!o.squares) {
    const outer = ringPts.length - 1
    while (squares.size < Math.min(sqCount, ringPts[outer].length)) squares.add(`${outer},${Math.floor(rand() * ringPts[outer].length)}`)
  }
  // spokes: centre to the first ring
  ringPts[0].forEach((p) => items.push(line(c, p, 0.6)))
  // each node on ring k>0 links to its nearest node on ring k-1
  ringPts.forEach((ring, ri) => {
    if (!ri) return
    ring.forEach((p, i) => {
      const prev = ringPts[ri - 1]
      const nearest = prev.reduce((best, q) => (dist(p, q) < dist(p, best) ? q : best), prev[0])
      items.push(line(nearest, p, 1 + ri, { cascade: i * 0.4 }))
    })
  })
  // a few chords along each ring
  ringPts.forEach((ring, ri) => {
    ring.forEach((p, i) => {
      if (rand() < (o.chords ?? 0.45)) items.push(line(p, ring[(i + 1) % ring.length], 1.5 + ri, { cascade: i * 0.4, style: o.chordStyle ?? "faint" }))
    })
  })
  ringPts.forEach((ring, ri) =>
    ring.forEach((p, i) => {
      anchors[`r${ri}n${i}`] = p
      const sq = squares.has(`${ri},${i}`)
      const over = o.marks?.[`${ri},${i}`] ?? o.marks?.[`${ri}, ${i}`]
      const k = over ? kindOf(over) : sq ? "square" : kindOf((o.ringKinds ?? [])[ri] ?? o.kind ?? "c")
      items.push(mark(k, p, k === "square" || k === "flag" ? 4 + ri : 2 + ri, { cascade: i * 0.3 }))
    })
  )
  if (o.center !== null) items.push(mark(kd(o.center, "n"), c, 0))
  return { items: compact(items), anchors }
}

// Regular polygon with marks at vertices and on edges. Skills, standards, triads.
function polygon(o) {
  const c = o.at ?? [120, 108]
  const n = o.sides ?? 3
  const R = o.radius ?? 64
  const rot = o.rotation ?? -90
  const vk = kinds(o.vertices ?? "s", n)
  const mk = kinds(o.midpoints ?? "c", n)
  const V = Array.from({ length: n }, (_, i) => polar(c, R, rot + (360 / n) * i))
  const items = []
  const anchors = { center: c }
  V.forEach((p, i) => {
    const q = V[(i + 1) % n]
    items.push(line(p, q, 0, { cascade: i }))
    anchors[`v${i}`] = p
    anchors[`m${i}`] = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]
    items.push(mark(mk[i], anchors[`m${i}`], 1))
  })
  V.forEach((p, i) => items.push(mark(vk[i], p, 2)))
  if (o.center) items.push(mark(kindOf(o.center), c, 3))
  return { items: compact(items), anchors }
}

// A dashed globe: circle, meridians, equator. Review lens, whole-program view.
function globe(o) {
  const c = o.at ?? [120, 100]
  const r = o.radius ?? 52
  const items = [{ type: "ring", at: c, r, beat: 0 }]
  ;(o.meridians ?? [20]).forEach((rx, i) => items.push({ type: "ellipse", at: c, rx, ry: r, beat: 0, cascade: i + 1 }))
  ;(o.parallels ?? []).forEach((ry, i) => items.push({ type: "ellipse", at: c, rx: r, ry, beat: 0, cascade: i + 1 }))
  const ext = o.extend ?? 12
  if (o.equator !== false) items.push(line([c[0] - r - ext, c[1]], [c[0] + r + ext, c[1]], 1))
  const pk = kd(o.poles, "c")
  items.push(mark(pk, [c[0], c[1] - r], 2), mark(pk, [c[0], c[1] + r], 2))
  items.push(mark(kd(o.center, "c"), c, 2))
  const ek = kd(o.ends, "s")
  items.push(mark(ek, [c[0] - r - ext - 6, c[1]], 3), mark(ek, [c[0] + r + ext + 6, c[1]], 3))
  return { items: compact(items), anchors: { center: c, west: [c[0] - r - ext - 6, c[1]], east: [c[0] + r + ext + 6, c[1]] } }
}

// Overlapping dashed circles around a centre. One source of truth, variants.
function petals(o) {
  const c = o.at ?? [120, 100]
  const n = o.count ?? 5
  const r = o.radius ?? 40
  const off = o.distance ?? 34
  const start = o.start ?? -90
  const items = []
  const anchors = { center: c }
  for (let i = 0; i < n; i++) {
    const p = polar(c, off, start + (360 / n) * i)
    anchors[i] = p
    items.push({ type: "ring", at: p, r, beat: 0, cascade: i })
    if (o.marks) items.push(mark(kindOf(o.marks[i % o.marks.length]), polar(c, off + r, start + (360 / n) * i), 2))
  }
  if (o.center !== null) items.push(mark(kd(o.center, "focus"), c, 1))
  return { items: compact(items), anchors }
}

// A measured axis with events and gates. Audit trail, stage gates, release cadence.
function timeline(o) {
  const [x0, y0] = o.at ?? [44, 100]
  const L = o.length ?? 150
  const vertical = o.direction === "down"
  const P = (f, off = 0) => (vertical ? [x0 + off, y0 + f * L] : [x0 + f * L, y0 + off])
  const items = [line(P(0), P(1), 0, { style: o.axisStyle ?? "dashed" })]
  const anchors = { start: P(0), end: P(1) }
  const ticks = o.ticks ?? 0
  for (let i = 0; i <= ticks && ticks; i++) items.push(mark("dot", P(i / ticks), 1, { cascade: i * 0.5, r: 1.6 }))
  ;(o.gates ?? []).forEach((f, i) => {
    const h = o.gateHeight ?? 14
    items.push(line(P(f, -h), P(f, h), 2, { style: "solid", loop: "none", cascade: i }))
    anchors[`gate${i}`] = P(f)
  })
  ;(o.events ?? []).forEach((e, i) => {
    const off = e.lift != null ? -e.lift : e.offset ?? 0 // lift: px off the axis, positive = above (or left)
    const f = e.at ?? i / Math.max(1, (o.events.length ?? 1) - 1)
    const p = P(f, off)
    const b = e.beat ?? 3
    anchors[`e${i}`] = p
    if (off) items.push(line(P(f), p, b - 0.5, { cascade: i }))
    items.push(mark(kd(e.kind, "c"), p, b, { cascade: e.beat != null ? 0 : i }))
    if (e.label) items.push({ type: "label", at: p, text: e.label, beat: b + 1, dy: vertical ? 3.5 : off <= 0 ? -16 : 22, dx: vertical ? 18 : 0, anchor: vertical ? "start" : "middle", cascade: i })
  })
  return { items: compact(items), anchors }
}

// A lattice. Coverage, search, dashboards, "every clause checked".
function grid(o) {
  const [x0, y0] = o.at ?? [48, 40]
  const cols = o.cols ?? 7
  const rowsN = o.rows ?? 5
  const gap = o.gap ?? 24
  const rand = rng(o.seed ?? 5)
  const sel = new Set((o.selected ?? []).map(([c, r]) => `${c},${r}`))
  if (!o.selected && o.selectCount) while (sel.size < o.selectCount) sel.add(`${Math.floor(rand() * cols)},${Math.floor(rand() * rowsN)}`)
  const flagged = new Set((o.flagged ?? []).map(([c, r]) => `${c},${r}`))
  const items = []
  const anchors = {}
  for (let r = 0; r < rowsN; r++)
    for (let c = 0; c < cols; c++) {
      const p = [x0 + c * gap, y0 + r * gap]
      anchors[`${c},${r}`] = p
      const key = `${c},${r}`
      const k = flagged.has(key) ? "flag" : sel.has(key) ? o.selectedKind ?? "square" : kd(o.kind, "o")
      items.push(mark(k, p, sel.has(key) || flagged.has(key) ? 2 : 0, { cascade: (c + r) * 0.4, r: k === "dot" ? o.dotSize ?? 1.8 : undefined, size: sel.has(key) ? o.selectedSize : undefined, color: k === "dot" ? o.dotColor : undefined }))
    }
  if (o.lens) {
    const [lc, lr] = o.lens.at
    const p = [x0 + lc * gap, y0 + lr * gap]
    items.push({ type: "ring", at: p, r: o.lens.r ?? gap * 1.6, beat: 1 })
    anchors.lens = p
  }
  return { items: compact(items), anchors }
}

// Nested boundaries with ports: security perimeters, deployment scopes, sandboxes.
// Rings only (no seeded satellites); ports are small marks where things cross.
function boundary(o) {
  const c = o.at ?? [120, 100]
  const radii = o.rings ?? [36, 58]
  const items = []
  const anchors = { center: c }
  radii.forEach((r, i) => items.push({ type: "ring", at: c, r, beat: i * 0.6, style: o.style ?? "dashed" }))
  const outer = radii[radii.length - 1]
  ;(o.ports ?? []).forEach((p, i) => {
    const deg = typeof p === "number" ? p : p.angle
    const r = typeof p === "number" ? outer : radii[p.ring ?? radii.length - 1]
    const at = polar(c, r, deg)
    anchors[`port${i}`] = at
    items.push(mark(kd(typeof p === "number" ? o.portKind : p.kind ?? o.portKind, "C"), at, radii.length * 0.6 + 0.5 + i * 0.2))
  })
  const ck = kd(o.center, "n")
  if (ck) items.push(mark(ck, c, 0))
  return { items: compact(items), anchors }
}

// A sequence of marks joined by dashed lines. Pipelines, trace chains.
function chain(o) {
  let pts = o.points
  const n = o.count ?? pts?.length ?? 4
  if (!pts) {
    const [x0, y0] = o.at ?? [52, 100]
    const L = o.length ?? 140
    pts = Array.from({ length: n }, (_, i) => [x0 + (L * i) / Math.max(1, n - 1), y0 + (o.wave ? Math.sin(i * 1.7) * o.wave : 0)])
  }
  const ks = kinds(o.kinds ?? "cccs", pts.length)
  const items = []
  const anchors = {}
  pts.forEach((p, i) => {
    anchors[i] = p
    if (i) items.push(line(pts[i - 1], p, i * 2 - 1, { route: o.route, axis: o.axis }))
    items.push(mark(ks[i], p, i * 2))
  })
  return { items: compact(items), anchors }
}

// Lissajous figure, the symbol's family. 2D or 3D (turning about its vertical axis).
function lissajous(o) {
  const c = o.at ?? [120, 100]
  const [w, h] = o.size ?? [150, 150]
  const ax = w / 2, ay = h / 2
  const a = o.a ?? 1, b = o.b ?? 3
  const phase = rad(o.phase ?? 90)
  const turn = rad(o.turn ?? 0)
  const N = o.samples ?? 720
  const depth = o.depth ?? true
  const sample = (ph) => {
    const pts = []
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * TAU
      const z = Math.cos(a * t + ph + turn)
      pts.push({ p: [c[0] + ax * Math.sin(a * t + ph + turn), c[1] - ay * Math.sin(b * t)], z, t })
    }
    return pts
  }
  const items = []
  const anchors = { center: c }
  const curve = sample(phase)
  const style = o.style ?? "ink"
  if (o.ghost != null) {
    const g = sample(rad(o.ghost))
    items.push({ type: "curve", samples: g, depth: false, style: "ghost", beat: 0, width: o.width })
  }
  items.push({ type: "curve", samples: curve, depth, style, beat: 0.5, width: o.width ?? 1.25, id: o.id ? `${o.id}.curve` : undefined })
  const pts2 = curve.map((s) => s.p)
  const dots = o.dots ?? "both"
  const crossings = dots === "crossings" || dots === "both" ? selfCrossings(pts2, 6, { minSep: Math.ceil(N / 60) }) : []
  const turning = dots === "extremes" || dots === "both" ? turningPoints(pts2, { axes: o.turningAxes ?? "xy" }).filter((p) => !crossings.some((q) => dist(p, q) < 6)) : []
  const found = []
  crossings.forEach((p) => found.push({ p, kind: o.crossingKind ?? "dotLarge" }))
  turning.forEach((p) => found.push({ p, kind: o.turningKind ?? "dot" }))
  found.forEach(({ p, kind }, i) => {
    anchors[`dot${i}`] = p
    items.push({ type: kind, at: p, beat: 2, cascade: i * 0.4, color: o.dotColor })
  })
  // drafting guides: faint hairlines through the dots, past the figure's extent
  if (o.guides) {
    const ext = o.guideExtent ?? 40
    const xs = [], ys = []
    found.forEach(({ p }) => {
      if (!xs.some((x) => Math.abs(x - p[0]) < 3)) xs.push(p[0])
      if (!ys.some((y) => Math.abs(y - p[1]) < 3)) ys.push(p[1])
    })
    const g = o.guides === true ? "xy" : o.guides
    if (g.includes("x")) xs.forEach((x, i) => items.push({ type: "line", from: [x, c[1] - ay - ext], to: [x, c[1] + ay + ext], style: "faintSolid", beat: -0.5, cascade: i * 0.3, loop: "none", level: -1 }))
    if (g.includes("y")) ys.forEach((y, i) => items.push({ type: "line", from: [c[0] - ax - ext, y], to: [c[0] + ax + ext, y], style: "faintSolid", beat: -0.5, cascade: i * 0.3, loop: "none", level: -1 }))
  }
  ;(o.travelers ? Array.from({ length: o.travelers }) : []).forEach((_, i) =>
    items.push({ type: "traveler", alongSamples: pts2, beat: 3, offset: i / o.travelers, period: o.travelPeriod ?? 10.4, closed: true })
  )
  return { items, anchors }
}

// Stacked planes for 3D views: layers of the program (requirements, design, CAD,
// tests), views, variants. Each plane carries a motif (plane-local coordinates,
// 0..w by 0..d), explicit `layers`, explicit `marks`, or seeded marks.
function stack(o) {
  const n = o.count ?? o.planes?.length ?? 3
  const gap = o.gap ?? 80
  const [w, d] = o.size ?? [180, 150]
  const [cx, cy] = o.at ?? [0, 0]
  const sid = o.id ?? "stack"
  const step = o.beatGap ?? 2
  const items = []
  const layers = []
  const anchors = {}
  const rand = rng(o.seed ?? 21)
  const planeNodes = []
  for (let i = 0; i < n; i++) {
    const P = o.planes?.[i] ?? {}
    const z = (o.z0 ?? 0) + i * gap
    const origin = [cx - w / 2 + (P.shift?.[0] ?? 0), cy - d / 2 + (P.shift?.[1] ?? 0)]
    const plane = { z, origin }
    items.push({ type: "plane", at: [origin[0] + w / 2, origin[1] + d / 2, z], size: [w, d], beat: i * step, style: P.style, label: P.label, labelCorner: o.labelCorner, fill: P.fill })
    anchors[`p${i}`] = [origin[0] + w / 2, origin[1] + d / 2, z]
    if (P.motif || P.layers) {
      const { label, style, shift, fill, ...content } = P
      layers.push({ ...content, plane, beat: i * step + 0.6, id: P.id ?? `${sid}.p${i}` })
      planeNodes.push([])
      continue
    }
    let nodes = P.marks
    if (!nodes) {
      const count = P.count ?? o.perPlane ?? 5
      nodes = []
      let guard = 0
      while (nodes.length < count && guard++ < 2000) {
        const p = [w * (0.16 + rand() * 0.68), d * (0.16 + rand() * 0.68)]
        if (nodes.every((q) => dist(p, q.at ?? q) > Math.min(w, d) * 0.22)) nodes.push({ at: p, kind: kindOf((P.kinds ?? "ccs")[nodes.length % (P.kinds ?? "ccs").length]) })
      }
    }
    const world = nodes.map((m) => {
      const at = m.at ?? m
      return { kind: kd(m.kind, "c"), at: [origin[0] + at[0], origin[1] + at[1], z] }
    })
    planeNodes.push(world)
    world.forEach((m, k) => {
      anchors[`p${i}n${k}`] = m.at
      items.push(mark(m.kind, m.at, i * step + 0.8, { cascade: k * 0.3, onPlane: true }))
    })
    if (P.links !== false && o.links !== false) {
      const order = [...world].sort((p, q) => p.at[0] + p.at[1] - (q.at[0] + q.at[1]))
      for (let k = 1; k < order.length; k++) items.push(line(order[k - 1].at, order[k].at, i * step + 0.5, { cascade: k * 0.2 }))
    }
  }
  // connectors between planes: [plane, node] pairs for seeded marks, or anchor names
  const conns = o.connectors ?? (o.planes?.some((P) => P.motif || P.layers) ? [] : Array.from({ length: n - 1 }, (_, i) => ({ from: [i, 0], to: [i + 1, 0] })))
  conns.forEach((cn, k) => {
    const pick = (ref) => (typeof ref === "string" ? ref : planeNodes[ref[0]]?.[ref[1]]?.at)
    const A = pick(cn.from), B = pick(cn.to)
    if (A && B) items.push(line(A, B, k * 1.2 + (cn.beat ?? 0), { style: cn.style, vertical: true, id: cn.id, afterChildren: true }))
  })
  return { items: compact(items), anchors, layers, meta: { panels: o.alternatives ? n : 0 } }
}

// A row of numbered panels, each holding its own motif: process explainers
// (01 change lands, 02 graph flags impact, 03 agent proposes, 04 human merges).
// Panel content is authored in panel-local coordinates (0..cell[0], 0..cell[1]).
function steps(o) {
  const [x0, y0] = o.at ?? [0, 0]
  const [cw, ch] = o.cell ?? [200, 170]
  const gap = o.gap ?? 24
  const list = o.items ?? []
  const step = o.beatGap ?? 5
  const items = []
  const anchors = {}
  const layers = []
  list.forEach((st, i) => {
    const x = x0 + i * (cw + gap)
    anchors[i] = [x + cw / 2, y0 + ch / 2]
    if (o.tiles !== false) items.push({ type: "frame", at: [x + cw / 2, y0 + ch / 2], size: [cw, ch], style: "none", fill: o.tileFill ?? "tile", beat: i * step, enter: "fade" })
    if (o.numerals !== false) items.push({ type: "numeral", at: [x + 14, y0 + 22], text: String(i + 1).padStart(2, "0"), beat: i * step })
    const caption = o.labels?.[i] ?? st.caption
    if (caption) items.push({ type: "label", at: [x, y0 + ch + 20], text: caption, beat: i * step + 1, color: "ink", size: o.labelSize, caption: true, maxWidth: cw })
    const { caption: _c, ...content } = st
    layers.push({ ...content, offset: [x + (st.offset?.[0] ?? 0), y0 + (st.offset?.[1] ?? 0)], beat: i * step + 0.5, id: st.id ?? (o.id ? `${o.id}.s${i}` : undefined) })
    if (o.connect && i < list.length - 1)
      items.push({ type: "line", from: [x + cw - (o.connectInset ?? 18), y0 + ch / 2], to: [x + cw + gap + (o.connectInset ?? 18), y0 + ch / 2], beat: i * step + step - 1, style: "dashed" })
  })
  return { items: compact(items), anchors, layers, meta: { panels: list.length } }
}

export const MOTIFS = { hub, fan, rows, orbit, tree, branch, graph, polygon, globe, petals, timeline, grid, chain, lissajous, stack, steps, boundary }
