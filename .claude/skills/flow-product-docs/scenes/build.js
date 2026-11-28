#!/usr/bin/env node
// Build interactive static scenes from the live app.
//
//   node build.js specs/<name>.js [--out <docs repo root>]
//
// A spec exports { name, title, url, viewport, states: [{ id, setup(page), targets,
// hotspots }] }. Each state's setup runs in order in one browser session, then the
// state is frozen with serialize.js. Hosted Mintlify serves only images from the repo,
// so each scene is one self-contained document (pruned CSS, inlined fonts and runtime)
// shipped as a generated snippet and shown through an iframe srcdoc. Output, under <out>:
//   snippets/scenes/<name>.jsx    export const scene = { name, title, width, height, html }
//   scenes/<name>/fallback.png    a 2x render of the first state
//   scenes/<name>/scene.json      size and provenance
const { chromium } = require("playwright");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const HERE = __dirname;
const args = process.argv.slice(2);
const specPath = path.resolve(args[0]);
const outRoot = path.resolve(args.includes("--out") ? args[args.indexOf("--out") + 1] : path.join(HERE, "../../../.."));
const spec = require(specPath);
const sha = (buf) => crypto.createHash("sha256").update(buf).digest("hex").slice(0, 16);
const serializeSrc = fs.readFileSync(path.join(HERE, "serialize.js"), "utf8");

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: spec.viewport || { width: 1440, height: 900 }, deviceScaleFactor: 1, colorScheme: "light" });
  const page = await ctx.newPage();
  await page.goto(spec.url, { waitUntil: "domcontentloaded" });

  const captured = [];
  for (const state of spec.states) {
    await state.setup(page);
    await page.mouse.move(1, 1);
    await page.waitForTimeout(600);
    await page.evaluate(serializeSrc + "\nwindow.serializeScene = serializeScene; window.freezeRule = freezeRule;");
    const out = await page.evaluate((a) => window.serializeScene(a), { targets: state.targets, hotspots: state.hotspots || [], pad: spec.pad || 0 });
    captured.push({ id: state.id, ...out });
    console.log(`state ${state.id}: ${out.html.length} element(s)`);
  }
  const productCommit = await page.evaluate(() => fetch("/version.txt").then((r) => r.text()).catch(() => "")).catch(() => "");
  await browser.close();

  // One frame for every state, so switching states never shifts the layout.
  const pad = spec.pad ?? 0;
  const all = captured.flatMap((c) => c.rects);
  const x0 = Math.floor(Math.min(...all.map((r) => r.x)) - pad);
  const y0 = Math.floor(Math.min(...all.map((r) => r.y)) - pad);
  const w = Math.ceil(Math.max(...all.map((r) => r.x + r.w)) + pad) - x0;
  const h = Math.ceil(Math.max(...all.map((r) => r.y + r.h)) + pad) - y0;

  // Download fonts and images into a scratch folder; the full scene is rendered from
  // there once to find the CSS rules and fonts it actually uses.
  const work = fs.mkdtempSync(path.join(require("os").tmpdir(), `scene-${spec.name}-`));
  let css = captured[0].css;
  for (const u of captured[0].urls) {
    try {
      const res = await fetch(u);
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      const ext = path.extname(new URL(u).pathname).slice(0, 8) || ".bin";
      const file = path.join(work, `${sha(buf)}${ext}`);
      fs.writeFileSync(file, buf);
      css = css.split(`url("${u}")`).join(`url("file://${file}")`);
    } catch { /* leave the absolute URL; the offline check reports it */ }
  }
  const runtimeCss = fs.readFileSync(path.join(HERE, "runtime", "scene.css"), "utf8");
  const runtimeJs = fs.readFileSync(path.join(HERE, "runtime", "scene.js"), "utf8");

  // Place each captured element in the frame inside a positioned box.
  const place = (c) => c.html.map((html, k) => {
    const r = c.rects[k];
    return `<div data-scene-el style="position:absolute;left:${(r.x - x0).toFixed(2)}px;top:${(r.y - y0).toFixed(2)}px;width:${r.w}px;height:${r.h}px">${html}</div>`;
  }).join("\n");
  const states = captured.map((c, i) =>
    `<div data-scene-state="${c.id}"${i ? " hidden" : ""}>\n${place(c)}\n</div>`).join("\n");
  const r = captured[0].root;
  const renderDoc = (styles, script) => `<!doctype html>
<html class="${r.htmlClass}" style="${r.htmlStyle}" lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${spec.title}</title>
<style>${styles}</style>
</head>
<body class="${r.bodyClass}">
<div data-scene style="width:${w}px;height:${h}px" role="img" aria-label="${spec.title}">
${states}
</div>
${script ? `<script>${script}</script>` : ""}
</body>
</html>
`;

  // Render the full scene, then keep only rules that match something in some state.
  const b2 = await chromium.launch();
  const ctx2 = await b2.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  const p2 = await ctx2.newPage();
  const fullPath = path.join(work, "full.html");
  fs.writeFileSync(fullPath, renderDoc(css + "\n" + runtimeCss, ""));
  await p2.goto("file://" + fullPath);
  await p2.waitForTimeout(800);
  const pruned = await p2.evaluate(pruneCss);
  await p2.close();

  // Inline the fonts and images the kept rules reference.
  let finalCss = pruned + "\n" + runtimeCss;
  for (const m of new Set(finalCss.match(/url\("file:\/\/[^"]+"\)/g) || [])) {
    const file = m.slice(12, -2);
    const ext = path.extname(file).slice(1);
    const mime = { woff2: "font/woff2", woff: "font/woff", ttf: "font/ttf", otf: "font/otf", svg: "image/svg+xml", png: "image/png" }[ext] || "application/octet-stream";
    finalCss = finalCss.split(m).join(`url("data:${mime};base64,${fs.readFileSync(file).toString("base64")}")`);
  }
  const doc = renderDoc(finalCss, runtimeJs);

  // Outputs: a generated snippet for the <Scene> iframe, a fallback PNG, provenance.
  const dir = path.join(outRoot, "scenes", spec.name);
  fs.mkdirSync(dir, { recursive: true });
  const snippetDir = path.join(outRoot, "snippets", "scenes");
  fs.mkdirSync(snippetDir, { recursive: true });
  fs.writeFileSync(path.join(snippetDir, `${spec.name}.jsx`),
    `// Generated by .claude/skills/flow-product-docs/scenes/build.js from specs/${spec.name}.js. Do not edit.\n` +
    `export const scene = ${JSON.stringify({ name: spec.name, title: spec.title, width: w, height: h, html: doc })};\n`);

  // Render the final, self-contained document: fallback PNG and an offline check.
  const p3 = await ctx2.newPage();
  const escaped = [];
  p3.on("request", (req) => { const u = req.url(); if (!u.startsWith("data:") && !u.startsWith("about:")) escaped.push(u); });
  await p3.setContent(doc, { waitUntil: "load" });
  await p3.waitForTimeout(800);
  await p3.locator("[data-scene]").screenshot({ path: path.join(dir, "fallback.png"), omitBackground: true });
  await b2.close();
  fs.rmSync(work, { recursive: true, force: true });

  fs.writeFileSync(path.join(dir, "scene.json"), JSON.stringify({
    name: spec.name, title: spec.title, width: w, height: h,
    states: captured.map((c) => c.id), source: spec.url.replace(/\?.*$/, ""), product_commit: productCommit.trim(),
    captured_at: new Date().toISOString(), bytes: Buffer.byteLength(doc),
  }, null, 2) + "\n");
  console.log(`scene ${spec.name}: ${w}x${h}, css ${(css.length / 1024).toFixed(0)} KB -> ${(pruned.length / 1024).toFixed(0)} KB, document ${(Buffer.byteLength(doc) / 1024).toFixed(0)} KB`);
  if (escaped.length) { console.log("NETWORK REQUESTS ESCAPED:", [...new Set(escaped)].slice(0, 10)); process.exitCode = 1; }
})();

// Runs in the rendered scene. Keeps a style rule when its selector, with interaction
// pseudo-classes and pseudo-elements removed, matches an element in any state; keeps
// at-rules the kept rules depend on (@keyframes, @property, layers), and only the
// @font-face rules the scene actually loads, each trimmed to its woff2 source.
async function pruneCss() {
  // Show every state at once so each state's fonts load, then record them.
  for (const s of document.querySelectorAll("[data-scene-state]")) s.hidden = false;
  await new Promise((r) => setTimeout(r, 300));
  await document.fonts.ready;
  const norm = (v) => String(v || "").replace(/["']/g, "").replace(/\s+/g, " ").trim().toLowerCase();
  const key = (fam, weight, style, range) => [fam, weight || "normal", style || "normal", range || "u+0-10ffff"].map(norm).join("|");
  const loaded = new Set([...document.fonts].filter((f) => f.status === "loaded").map((f) => key(f.family, f.weight, f.style, f.unicodeRange)));

  const DYNAMIC = /::?(hover|focus-visible|focus-within|focus|active|visited|placeholder|placeholder-shown|before|after|selection|marker|backdrop|file-selector-button|-webkit-[\w-]+|-moz-[\w-]+)(?![\w-])/g;
  const matches = (sel) => {
    for (const part of sel.split(/,(?![^(]*\))/)) {
      const bare = part.replace(DYNAMIC, "").replace(/:(is|where|not|has)\(\s*\)/g, "").trim() || "*";
      try { if (document.querySelector(bare)) return true; } catch { return true; }
    }
    return false;
  };
  const fontFace = (rule) => {
    const st = rule.style;
    const k = key(st.getPropertyValue("font-family"), st.getPropertyValue("font-weight"), st.getPropertyValue("font-style"), st.getPropertyValue("unicode-range"));
    if (!loaded.has(k)) return "";
    const srcs = st.getPropertyValue("src").split(/,(?=\s*url\()/);
    const src = srcs.find((x) => /woff2/.test(x)) || srcs[0];
    const rest = [...st].filter((p) => p !== "src").map((p) => `${p}: ${st.getPropertyValue(p)};`).join(" ");
    return `@font-face { ${rest} src: ${src.trim()}; }`;
  };
  const walk = (rules) => [...rules].map((rule) => {
    if (rule instanceof CSSStyleRule) return matches(rule.selectorText) ? rule.cssText : "";
    if (rule instanceof CSSFontFaceRule) return fontFace(rule);
    if (rule instanceof CSSMediaRule) { const k = walk(rule.cssRules); return k.trim() ? `@media ${rule.media.mediaText} {\n${k}\n}` : ""; }
    if (rule instanceof CSSSupportsRule) { const k = walk(rule.cssRules); return k.trim() ? `@supports ${rule.conditionText} {\n${k}\n}` : ""; }
    if (typeof CSSLayerBlockRule !== "undefined" && rule instanceof CSSLayerBlockRule) { const k = walk(rule.cssRules); return k.trim() ? `@layer ${rule.name} {\n${k}\n}` : ""; }
    return rule.cssText; // @keyframes, @property, @layer statements
  }).filter((t) => t.trim()).join("\n");
  return [...document.styleSheets].map((s) => walk(s.cssRules)).join("\n");
}
