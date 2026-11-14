// Flow illustration tokens. Measured from the website kit
// (flowengineering-website: src/components/illustrated-benefits*.ts*) and the Flow
// Brand Guide line-art slide. Sizes are px at scale 1, the size the website draws
// its benefit illustrations at. Bigger figures add marks and space, not bigger marks.
//
// Line and label greys are darker than the site's for legibility: in every theme, labels
// and ink are at least 4.5:1 against the surface and lines at least 3:1.

export const BLUE = "#1F3ACB"

export const THEMES = {
  // White page, the website default. Transparent background, white occluding fills.
  light: {
    background: null,
    paper: "#FFFFFF",
    line: "#8F8E8A",
    faint: "#C9C8C4",
    ink: "#6B6A66",
    accent: BLUE,
    accentSoft: "rgba(31,58,203,0.10)",
    flag: "#E29B03",
    label: "#6B6A66",
    plane: "#FFFFFF",
    planeStroke: "#B5B4AF",
    tile: "#F6F6F3",
  },
  // Brand-guide specimen tile: gray-100.
  tile: {
    background: "#F6F6F3",
    paper: "#F6F6F3",
    line: "#888782",
    faint: "#C2C1BD",
    ink: "#62615D",
    accent: BLUE,
    accentSoft: "rgba(31,58,203,0.10)",
    flag: "#E29B03",
    label: "#62615D",
    plane: "#FBFBF9",
    planeStroke: "#ADACA7",
    tile: "#EFEFEB",
  },
  // Deep neutral surface (site --surface-deep).
  dark: {
    background: "#121212",
    paper: "#121212",
    line: "#85847F",
    faint: "#4A4945",
    ink: "#B3B2AD",
    accent: "#8DACF7",
    accentSoft: "rgba(141,172,247,0.14)",
    flag: "#F8C881",
    label: "#B3B2AD",
    plane: "#1B1B1A",
    planeStroke: "#5C5B56",
    tile: "#1A1A19",
  },
  // Full-bleed brand blue field (deck covers, dividers).
  blue: {
    background: BLUE,
    paper: BLUE,
    line: "rgba(255,255,255,0.6)",
    faint: "rgba(255,255,255,0.3)",
    ink: "rgba(255,255,255,0.88)",
    accent: "#FFFFFF",
    accentSoft: "rgba(255,255,255,0.14)",
    flag: "#F8C881",
    label: "rgba(255,255,255,0.88)",
    plane: "#2342D6",
    planeStroke: "rgba(255,255,255,0.5)",
    tile: "rgba(255,255,255,0.06)",
  },
}

// Mark geometry at scale 1.
export const SIZE = {
  stroke: 1,
  circle: 5, // grey circle radius
  circleSmall: 4, // lane-start circle
  square: 9, // blue square side
  nodeRing: 12, // live node ring radius
  nodeSquare: 8, // square inside the live node
  donutRing: 12,
  donutCore: 4,
  dot: 2.5, // filled line-art dot
  dotLarge: 4.5,
  flag: 8, // mustard diamond side (before rotation)
  traveler: 5,
  label: 10,
  numeral: 10,
}

export const DASH = {
  line: "4 5", // relationships, traces
  fine: "3 3", // pending / frozen rings
  dotted: "1 2.5", // back side of 3D line art, ghost phases
}

// One period that both dash patterns divide (4+5=9, 3+3=6), so marching loops seamlessly.
export const MARCH = { distance: 18, duration: 2.6 }

export const MOTION = {
  stagger: 0.1, // seconds between beats
  within: 0.05, // seconds between marks inside one beat
  delay: 0.05,
  spring: { stiffness: 320, damping: 22, mass: 1 }, // the site's pop
  popDuration: 0.6,
  fadeDuration: 0.5,
  drawDuration: 0.7,
  ease: [0.22, 1, 0.36, 1], // the site's ease-out everywhere
  wireEase: [0.65, 0, 0.35, 1], // .flow-wire
}

export const FONT_MONO = "'Commit Mono', 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
export const FONT_SANS = "'Unica77 LL', 'Unica 77 LL', 'Helvetica Neue', Helvetica, Arial, sans-serif"
