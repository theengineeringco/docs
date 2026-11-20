// Capture runner for docs screenshots. Runs one step file in a persistent 1440 x 900 browser
// profile; DSF=2 for closeups, components, and crops. Install Playwright beside it first:
// npm install playwright@<branch-demo e2e version>.
// Run one capture step in a persistent 1440x900 browser profile.
// usage: node run.js <step.js> [--url <url>]   step.js exports async ({page, shot, log}) => {}
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const DIR = __dirname, STATE = path.join(DIR, 'state.json');
(async () => {
  const step = require(path.resolve(process.argv[2]));
  const urlArg = process.argv.indexOf('--url');
  const state = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : {};
  const ctx = await chromium.launchPersistentContext(path.join(DIR, 'profile'), {
    viewport: { width: 1440, height: 900 }, deviceScaleFactor: +(process.env.DSF || 1), colorScheme: 'light', locale: 'en-US',
  });
  const page = ctx.pages()[0] || await ctx.newPage();
  const url = urlArg > 0 ? process.argv[urlArg + 1] : state.url;
  if (url) await page.goto(url, { waitUntil: 'domcontentloaded' });
  const shot = async (name) => { await page.mouse.move(850, 27); await page.waitForTimeout(800); const f = path.join(DIR, 'raw', `${name}.png`); fs.mkdirSync(path.dirname(f), { recursive: true }); await page.screenshot({ path: f }); console.log('saved', f); };
  // Capture one element (or an explicit clip) instead of the viewport. Records the element's
  // own corner radius so the renderer can keep its true shape.
  const shotEl = async (name, target, { pad = 0 } = {}) => {
    await page.mouse.move(850, 27); await page.waitForTimeout(800);
    const box = target.x !== undefined ? target : await target.boundingBox();
    const radius = target.x !== undefined ? 0 : await target.evaluate(e => parseFloat(getComputedStyle(e).borderTopLeftRadius) || 0);
    const clip = { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: box.width + 2 * pad, height: box.height + 2 * pad };
    const f = path.join(DIR, 'raw', `${name}.png`); fs.mkdirSync(path.dirname(f), { recursive: true });
    await page.screenshot({ path: f, clip });
    fs.writeFileSync(f.replace(/\.png$/, '.json'), JSON.stringify({ radius: pad ? 0 : radius, dsf: +(process.env.DSF || 1) }));
    console.log('saved', f, 'radius', radius);
  };
  const log = (...a) => console.log(...a);
  try { await step({ page, shot, shotEl, log, state }); }
  catch (e) { console.log('STEP ERROR:', e.message.split('\n')[0]); }
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(DIR, 'last.png') });
  state.url = page.url(); fs.writeFileSync(STATE, JSON.stringify(state, null, 2));
  console.log('url:', state.url);
  await ctx.close();
})();
