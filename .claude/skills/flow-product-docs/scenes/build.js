#!/usr/bin/env node
// Build interactive static scenes from the live app.
//
//   node build.js specs/<name>.js [--out <docs repo root>]
//
// A spec exports { name, title, url, viewport, states: [{ id, setup(page), targets,
// hotspots }] }. Each state's setup runs in order in one browser session, then the
// state is frozen with serialize.js. Output, under <out>:
//   scenes/<name>/index.html      the interactive scene
//   scenes/<name>/fallback.png    a 2x render of the first state
//   scenes/_assets/               shared app CSS, fonts and images, content-hashed,
//                                 plus the scene runtime
//   scenes/<name>/scene.json      size and provenance for the <Scene> snippet
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

  // Shared assets: download fonts and images, rewrite them to hashed local files.
  const assets = path.join(outRoot, "scenes", "_assets");
  fs.mkdirSync(path.join(assets, "files"), { recursive: true });
  let css = captured[0].css;
  for (const u of captured[0].urls) {
    try {
      const res = await fetch(u);
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      const ext = path.extname(new URL(u).pathname).slice(0, 8) || ".bin";
      const name = `${sha(buf)}${ext}`;
      fs.writeFileSync(path.join(assets, "files", name), buf);
      css = css.split(`url("${u}")`).join(`url("files/${name}")`);
    } catch { /* leave the absolute URL; the offline check reports it */ }
  }
  const cssName = `app-${sha(css)}.css`;
  fs.writeFileSync(path.join(assets, cssName), css);
  for (const f of ["scene.js", "scene.css"]) fs.copyFileSync(path.join(HERE, "runtime", f), path.join(assets, f));

  // Place each captured element in the frame inside a positioned box.
  const place = (c) => c.html.map((html, k) => {
    const r = c.rects[k];
    return `<div data-scene-el style="position:absolute;left:${(r.x - x0).toFixed(2)}px;top:${(r.y - y0).toFixed(2)}px;width:${r.w}px;height:${r.h}px">${html}</div>`;
  }).join("\n");
  const states = captured.map((c, i) =>
    `<div data-scene-state="${c.id}"${i ? " hidden" : ""}>\n${place(c)}\n</div>`).join("\n");
  const r = captured[0].root;
  const doc = `<!doctype html>
<html class="${r.htmlClass}" style="${r.htmlStyle}" lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${spec.title}</title>
<link rel="stylesheet" href="../_assets/${cssName}">
<link rel="stylesheet" href="../_assets/scene.css">
<script src="../_assets/scene.js" defer></script>
</head>
<body class="${r.bodyClass}">
<div data-scene style="width:${w}px;height:${h}px" role="img" aria-label="${spec.title}">
${states}
</div>
</body>
</html>
`;
  const dir = path.join(outRoot, "scenes", spec.name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), doc);
  fs.writeFileSync(path.join(dir, "scene.json"), JSON.stringify({
    name: spec.name, title: spec.title, width: w, height: h,
    states: captured.map((c) => c.id), source: spec.url.replace(/\?.*$/, ""), product_commit: productCommit.trim(),
    captured_at: new Date().toISOString(),
  }, null, 2) + "\n");

  // Fallback PNG rendered from the static scene itself, and an offline check.
  const b2 = await chromium.launch();
  const p2 = await (await b2.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 })).newPage();
  const escaped = [];
  const used = new Set();
  p2.on("request", (req) => {
    const u = req.url();
    if (!u.startsWith("file:")) escaped.push(u);
    else if (u.includes("/_assets/files/")) used.add(path.basename(new URL(u).pathname));
  });
  await p2.goto("file://" + path.join(dir, "index.html"));
  await p2.waitForTimeout(800);
  await p2.locator("[data-scene]").screenshot({ path: path.join(dir, "fallback.png"), omitBackground: true });
  // Render every state so lazily loaded fonts in any state are recorded.
  for (const st of captured.slice(1)) {
    await p2.evaluate((id) => {
      document.querySelectorAll("[data-scene-state]").forEach((e) => { e.hidden = e.dataset.sceneState !== id; });
    }, st.id);
    await p2.waitForTimeout(300);
  }
  await b2.close();
  const metaPath = path.join(dir, "scene.json");
  const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  meta.css = cssName; meta.files = [...used].sort();
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + "\n");

  // Keep only shared assets some scene still uses.
  const keepFiles = new Set(), keepCss = new Set();
  for (const d of fs.readdirSync(path.join(outRoot, "scenes"))) {
    const m = path.join(outRoot, "scenes", d, "scene.json");
    if (!fs.existsSync(m)) continue;
    const j = JSON.parse(fs.readFileSync(m, "utf8"));
    (j.files || []).forEach((f) => keepFiles.add(f));
    if (j.css) keepCss.add(j.css);
  }
  for (const f of fs.readdirSync(path.join(assets, "files"))) if (!keepFiles.has(f)) fs.rmSync(path.join(assets, "files", f));
  for (const f of fs.readdirSync(assets)) if (/^app-.*\.css$/.test(f) && !keepCss.has(f)) fs.rmSync(path.join(assets, f));
  console.log(`scene ${spec.name}: ${w}x${h}, css ${(css.length / 1024).toFixed(0)} KB, html ${(doc.length / 1024).toFixed(0)} KB`);
  if (escaped.length) { console.log("NETWORK REQUESTS ESCAPED:", [...new Set(escaped)].slice(0, 10)); process.exitCode = 1; }
})();
