// Geometry, easing and randomness helpers. No dependencies.

export const TAU = Math.PI * 2
export const rad = (deg) => (deg * Math.PI) / 180
export const lerp = (a, b, t) => a + (b - a) * t
export const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))
export const round = (v, p = 2) => {
  const f = 10 ** p
  const r = Math.round(v * f) / f
  return Object.is(r, -0) ? 0 : r
}

export const add = (a, b) => [a[0] + b[0], a[1] + b[1]]
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1]]
export const mul = (a, k) => [a[0] * k, a[1] * k]
export const len = (a) => Math.hypot(a[0], a[1])
export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1])
export const norm = (a) => {
  const l = len(a) || 1
  return [a[0] / l, a[1] / l]
}
export const polar = (c, r, deg) => [c[0] + r * Math.cos(rad(deg)), c[1] + r * Math.sin(rad(deg))]

// Seeded PRNG (mulberry32) so every figure is reproducible.
export function rng(seed = 1) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Damped spring step response, 0 -> 1 (with overshoot when underdamped).
export function spring({ stiffness = 320, damping = 22, mass = 1 } = {}) {
  const w0 = Math.sqrt(stiffness / mass)
  const zeta = damping / (2 * Math.sqrt(stiffness * mass))
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta)
    return (t) => (t <= 0 ? 0 : 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t)))
  }
  return (t) => (t <= 0 ? 0 : 1 - Math.exp(-w0 * t) * (1 + w0 * t))
}

// CSS linear() approximation of a spring over `duration` seconds.
export function springLinear(cfg, duration, steps = 24) {
  const f = spring(cfg)
  const pts = []
  for (let i = 0; i <= steps; i++) pts.push(round(i === steps ? 1 : f((i / steps) * duration), 3))
  return `linear(${pts.join(", ")})`
}

// cubic-bezier(x1, y1, x2, y2) evaluated at t (Newton + bisection on x).
export function bezierEase([x1, y1, x2, y2]) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by
  const sx = (t) => ((ax * t + bx) * t + cx) * t
  const sy = (t) => ((ay * t + by) * t + cy) * t
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx
  return (x) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let t = x
    for (let i = 0; i < 6; i++) {
      const e = sx(t) - x
      const d = dx(t)
      if (Math.abs(e) < 1e-5) return sy(t)
      if (Math.abs(d) < 1e-6) break
      t -= e / d
    }
    let lo = 0, hi = 1
    t = x
    for (let i = 0; i < 30; i++) {
      const v = sx(t)
      if (Math.abs(v - x) < 1e-5) break
      if (v < x) lo = t
      else hi = t
      t = (lo + hi) / 2
    }
    return sy(t)
  }
}

// ---- polylines -------------------------------------------------------------

export function polyLength(pts) {
  let l = 0
  for (let i = 1; i < pts.length; i++) l += dist(pts[i - 1], pts[i])
  return l
}

export function pointAt(pts, f) {
  const total = polyLength(pts)
  let target = clamp(f) * total
  for (let i = 1; i < pts.length; i++) {
    const seg = dist(pts[i - 1], pts[i])
    if (target <= seg || i === pts.length - 1) {
      const t = seg ? clamp(target / seg) : 0
      return [lerp(pts[i - 1][0], pts[i][0], t), lerp(pts[i - 1][1], pts[i][1], t)]
    }
    target -= seg
  }
  return pts[pts.length - 1]
}

// Cut `a` px off the start and `b` px off the end (to stop a line at a mark's edge).
export function trim(pts, a = 0, b = 0) {
  const total = polyLength(pts)
  if (total <= a + b + 0.5) return pts
  const out = []
  const from = a, to = total - b
  let acc = 0
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], q = pts[i]
    const seg = dist(p, q)
    const s0 = acc, s1 = acc + seg
    if (s1 >= from && s0 <= to) {
      const t0 = seg ? clamp((from - s0) / seg) : 0
      const t1 = seg ? clamp((to - s0) / seg) : 1
      const A = [lerp(p[0], q[0], t0), lerp(p[1], q[1], t0)]
      const B = [lerp(p[0], q[0], t1), lerp(p[1], q[1], t1)]
      if (!out.length) out.push(A)
      out.push(B)
    }
    acc = s1
  }
  return out.length >= 2 ? out : pts
}

// Orthogonal connector: horizontal, then vertical, then horizontal (or V-H-V),
// with rounded elbows like the site's rail-path (radius 8).
export function elbow(a, b, { axis = "x", radius = 8, at = 0.5 } = {}) {
  if (axis === "x") {
    const mx = lerp(a[0], b[0], at)
    if (Math.abs(b[1] - a[1]) < 0.5) return [a, b]
    return rounded([a, [mx, a[1]], [mx, b[1]], b], radius)
  }
  const my = lerp(a[1], b[1], at)
  if (Math.abs(b[0] - a[0]) < 0.5) return [a, b]
  return rounded([a, [a[0], my], [b[0], my], b], radius)
}

// Replace interior corners of a polyline with quarter arcs (sampled).
export function rounded(pts, radius = 8, samples = 8) {
  if (radius <= 0 || pts.length < 3) return pts
  const out = [pts[0]]
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i - 1], c = pts[i], n = pts[i + 1]
    const r = Math.min(radius, dist(p, c) / 2, dist(c, n) / 2)
    const u = norm(sub(p, c)), v = norm(sub(n, c))
    const A = add(c, mul(u, r)), B = add(c, mul(v, r))
    for (let k = 0; k <= samples; k++) {
      const t = k / samples
      // quadratic bezier A -> c -> B approximates the arc closely enough at hairline weight
      const x = (1 - t) ** 2 * A[0] + 2 * (1 - t) * t * c[0] + t * t * B[0]
      const y = (1 - t) ** 2 * A[1] + 2 * (1 - t) * t * c[1] + t * t * B[1]
      out.push([x, y])
    }
  }
  out.push(pts[pts.length - 1])
  return out
}

// Smooth S-curve between two points (horizontal tangents), sampled.
export function sCurve(a, b, { axis = "x", tension = 0.5, samples = 32 } = {}) {
  const c1 = axis === "x" ? [lerp(a[0], b[0], tension), a[1]] : [a[0], lerp(a[1], b[1], tension)]
  const c2 = axis === "x" ? [lerp(b[0], a[0], tension), b[1]] : [b[0], lerp(b[1], a[1], tension)]
  const out = []
  for (let i = 0; i <= samples; i++) {
    const t = i / samples, s = 1 - t
    out.push([
      s ** 3 * a[0] + 3 * s * s * t * c1[0] + 3 * s * t * t * c2[0] + t ** 3 * b[0],
      s ** 3 * a[1] + 3 * s * s * t * c1[1] + 3 * s * t * t * c2[1] + t ** 3 * b[1],
    ])
  }
  return out
}

// Arc sampled from deg0 to deg1 (clockwise in screen space for increasing degrees).
export function arc(c, r, deg0, deg1, samples) {
  const n = samples ?? Math.max(8, Math.ceil((Math.abs(deg1 - deg0) / 360) * 96))
  const out = []
  for (let i = 0; i <= n; i++) out.push(polar(c, r, lerp(deg0, deg1, i / n)))
  return out
}

function segIntersect(p, p2, q, q2) {
  const r = sub(p2, p), s = sub(q2, q)
  const den = r[0] * s[1] - r[1] * s[0]
  if (Math.abs(den) < 1e-9) return null
  const qp = sub(q, p)
  const t = (qp[0] * s[1] - qp[1] * s[0]) / den
  const u = (qp[0] * r[1] - qp[1] * r[0]) / den
  if (t < 0 || t > 1 || u < 0 || u > 1) return null
  return { point: add(p, mul(r, t)), t, u }
}

// Self-crossings of a polyline (deduplicated within `tol` px). Near-tangent touches
// (angle under `minAngle` degrees) and hits between nearby samples are ignored, so
// folds and turning points don't register as crossings.
export function selfCrossings(pts, tol = 3, { minSep = 6, minAngle = 12, closed = true } = {}) {
  const found = []
  const n = pts.length
  const cosMax = Math.cos((minAngle * Math.PI) / 180)
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + minSep; j < n - 1; j++) {
      if (closed && n - 1 - j + i < minSep) continue
      const hit = segIntersect(pts[i], pts[i + 1], pts[j], pts[j + 1])
      if (!hit) continue
      const a = norm(sub(pts[i + 1], pts[i])), b = norm(sub(pts[j + 1], pts[j]))
      if (Math.abs(a[0] * b[0] + a[1] * b[1]) > cosMax) continue
      if (!found.some((f) => dist(f, hit.point) < tol)) found.push(hit.point)
    }
  }
  return found
}

// Turning points of a closed sampled curve: local extremes in x and in y.
export function turningPoints(pts, { axes = "xy", tol = 4 } = {}) {
  const n = pts.length - 1 // last sample repeats the first
  const out = []
  for (const ax of axes === "xy" ? [0, 1] : axes === "x" ? [0] : [1]) {
    for (let i = 0; i < n; i++) {
      const a = pts[(i - 1 + n) % n][ax], b = pts[i][ax], c = pts[(i + 1) % n][ax]
      if ((b > a && b >= c) || (b < a && b <= c)) if (!out.some((f) => dist(f, pts[i]) < tol)) out.push(pts[i])
    }
  }
  return out
}

// Ellipse (rx, ry, rotation in degrees) that is the image of the unit circle under the
// 2x2 linear map [[a, b], [c, d]] (columns = images of the basis vectors).
export function ellipseFromMatrix(a, b, c, d) {
  // SVD of M = [[a, b], [c, d]]
  const E = (a + d) / 2, F = (a - d) / 2, G = (c + b) / 2, H = (c - b) / 2
  const Q = Math.hypot(E, H), R = Math.hypot(F, G)
  const sx = Q + R, sy = Math.abs(Q - R)
  const a1 = Math.atan2(G, F), a2 = Math.atan2(H, E)
  const theta = (a2 + a1) / 2
  return { rx: sx, ry: sy, rot: (theta * 180) / Math.PI }
}

// ---- svg path strings ------------------------------------------------------

export function pathD(pts, closed = false, p = 2) {
  if (!pts.length) return ""
  let d = `M${round(pts[0][0], p)} ${round(pts[0][1], p)}`
  for (let i = 1; i < pts.length; i++) d += `L${round(pts[i][0], p)} ${round(pts[i][1], p)}`
  return closed ? d + "Z" : d
}

export function bbox(pointsList) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const [x, y] of pointsList) {
    if (x < x0) x0 = x
    if (y < y0) y0 = y
    if (x > x1) x1 = x
    if (y > y1) y1 = y
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 }
}
