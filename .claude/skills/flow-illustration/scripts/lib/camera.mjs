// Orthographic cameras. World: x right, y away from the viewer along the ground,
// z up. "flat" ignores z and uses (x, y) as screen coordinates, so every 2D motif
// is authored in plain screen px.

import { rad, ellipseFromMatrix } from "./math.mjs"

const PRESETS = {
  flat: null,
  iso: { azimuth: 45, elevation: 35.264 },
  // A lower, wider look: planes read as shelves, good for stacks of layers.
  shelf: { azimuth: 30, elevation: 24 },
  // Steeper look: almost a plan, a hint of depth.
  plan: { azimuth: 20, elevation: 62 },
  // Side-on: z is height, y is depth; useful for orbits standing up.
  front: { azimuth: 0, elevation: 12 },
}

export function makeCamera(spec = {}) {
  const view = typeof spec === "string" ? spec : spec.view ?? "flat"
  if (view === "flat") {
    const k = spec.zoom ?? 1
    return {
      view,
      flat: true,
      project: ([x, y]) => [x * k, y * k],
      depth: ([, y]) => y,
      circle: (center, r) => ({ cx: center[0] * k, cy: center[1] * k, rx: r * k, ry: r * k, rot: 0 }),
      basis: () => ({ u: [k, 0], v: [0, k] }),
      zoom: k,
    }
  }
  const preset = PRESETS[view] ?? {}
  const az = rad(spec.azimuth ?? preset.azimuth ?? 45)
  const el = rad(spec.elevation ?? preset.elevation ?? 35.264)
  const ca = Math.cos(az), sa = Math.sin(az), ce = Math.cos(el), se = Math.sin(el)
  const k = spec.zoom ?? 1

  const project = ([x, y, z = 0]) => {
    const x1 = x * ca - y * sa
    const y1 = x * sa + y * ca
    return [k * x1, k * (y1 * se - z * ce)]
  }
  const depth = ([x, y, z = 0]) => (x * sa + y * ca) * ce + z * se

  // Screen images of a plane's unit axes. plane: "xy" ground, "xz" wall facing the
  // viewer at azimuth 0, "yz" side wall.
  const basis = (plane = "xy") => {
    const o = project([0, 0, 0])
    const axes = { xy: [[1, 0, 0], [0, 1, 0]], xz: [[1, 0, 0], [0, 0, -1]], yz: [[0, 1, 0], [0, 0, -1]] }[plane]
    const u = project(axes[0]), v = project(axes[1])
    return { u: [u[0] - o[0], u[1] - o[1]], v: [v[0] - o[0], v[1] - o[1]] }
  }

  const circle = (center, r, plane = "xy") => {
    const [cx, cy] = project(center)
    const { u, v } = basis(plane)
    const e = ellipseFromMatrix(u[0] * r, v[0] * r, u[1] * r, v[1] * r)
    return { cx, cy, rx: e.rx, ry: e.ry, rot: e.rot }
  }

  return { view, flat: false, project, depth, circle, basis, azimuth: az, elevation: el, zoom: k }
}

// Map a local 2D point on a plane into world 3D. A plane is { z, origin:[x,y], axis }.
export function onPlane(p, plane = {}) {
  const [ox = 0, oy = 0] = plane.origin ?? []
  const z = plane.z ?? 0
  if (plane.axis === "xz") return [ox + p[0], plane.y ?? 0, z - p[1]]
  if (plane.axis === "yz") return [plane.x ?? 0, oy + p[0], z - p[1]]
  return [ox + p[0], oy + p[1], (p[2] ?? 0) + z]
}
