// Runs inside the app page (via page.evaluate). Freezes the given elements into
// static HTML: each element is cloned with its real classes and placed absolutely at
// its on-screen position, so portalled content (dialogs, menus, popovers) can share
// one frame. Scripts, handlers, and live navigation are stripped; form values,
// canvases, and scroll positions are baked in. Hotspots become data-scene-go attributes.
//
// args: { targets: [selector], hotspots: [{ selector, to }], pad }
// returns: { rects, html, root: { htmlClass, htmlStyle, bodyClass }, css, urls }
// Freeze media queries at capture time: a matching @media block is unwrapped and a
// non-matching one dropped, so the scene keeps the capture's layout (desktop
// breakpoints, light scheme) at any frame size. Walks nested rules (Tailwind v4).
function freezeRule(rule) {
  const kids = (r) => [...(r.cssRules || [])].map(freezeRule).join("\n");
  if (rule instanceof CSSMediaRule) return matchMedia(rule.conditionText || rule.media.mediaText).matches ? kids(rule) : "";
  if (typeof CSSLayerBlockRule !== "undefined" && rule instanceof CSSLayerBlockRule) return `@layer ${rule.name} {\n${kids(rule)}\n}`;
  if (rule instanceof CSSSupportsRule) return `@supports ${rule.conditionText} {\n${kids(rule)}\n}`;
  if (rule instanceof CSSStyleRule && rule.cssRules && rule.cssRules.length) {
    return `${rule.selectorText} {\n${rule.style.cssText}\n${kids(rule)}\n}`;
  }
  return rule.cssText;
}

async function serializeScene({ targets, hotspots = [], pad = 0 }) {
  const els = targets.flatMap((sel) => [...document.querySelectorAll(sel)]).filter((e) => {
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }).filter((e, i, all) => !all.some((o) => o !== e && o.contains(e))); // keep outermost only
  if (!els.length) throw new Error(`no visible element for ${targets.join(", ")}`);

  // Mark hotspots on the live DOM so the marks survive cloning.
  for (const h of hotspots) {
    for (const el of document.querySelectorAll(h.selector)) el.setAttribute("data-scene-go", h.to);
  }
  // Bake live state the clone would lose.
  for (const el of document.querySelectorAll("input, textarea")) el.setAttribute("value", el.value);
  for (const el of document.querySelectorAll("textarea")) el.textContent = el.value;
  for (const el of document.querySelectorAll("*")) {
    if (el.scrollTop || el.scrollLeft) {
      el.setAttribute("data-scene-scroll", `${el.scrollLeft},${el.scrollTop}`);
    }
  }
  const canvases = new Map();
  for (const c of document.querySelectorAll("canvas")) {
    try { canvases.set(c, c.toDataURL("image/png")); } catch { /* tainted canvas: leave blank */ }
  }

  const rects = els.map((e) => e.getBoundingClientRect());
  const layers = [];
  const html = els.map((el, i) => {
    const r = rects[i];
    const clone = el.cloneNode(true);
    clone.setAttribute("data-scene-el", "");
    // Anything positioned against the window (popover wrappers, toasts) escapes its
    // parent's clipping in the app, so lift it out into its own layer at its
    // on-screen position. Pair live and cloned nodes by document order first.
    const liveNodes = [...el.querySelectorAll("*")];
    const cloneNodes = [...clone.querySelectorAll("*")];
    liveNodes.forEach((ln, k) => {
      if (getComputedStyle(ln).position !== "fixed") return;
      if (liveNodes.some((o) => o !== ln && o.contains(ln) && getComputedStyle(o).position === "fixed")) return;
      const lr = ln.getBoundingClientRect();
      const lifted = cloneNodes[k];
      lifted.remove();
      const ls = lifted.style;
      ls.position = "relative"; ls.inset = "auto"; ls.transform = "none"; ls.margin = "0";
      ls.width = `${lr.width}px`; ls.height = `${lr.height}px`;
      layers.push({ rect: { x: lr.left, y: lr.top, w: lr.width, h: lr.height }, node: lifted });
    });
    // Canvases do not clone their pixels; swap them for images.
    const live = [...el.querySelectorAll("canvas")];
    [...clone.querySelectorAll("canvas")].forEach((c, k) => {
      const src = canvases.get(live[k]);
      if (!src) return;
      const img = document.createElement("img");
      img.src = src;
      img.width = c.width; img.height = c.height;
      img.style.cssText = c.style.cssText;
      c.replaceWith(img);
    });
    for (const n of [clone, ...clone.querySelectorAll("*")]) {
      for (const a of [...n.attributes]) {
        if (a.name.startsWith("on")) n.removeAttribute(a.name);
      }
      if (n.tagName === "SCRIPT" || n.tagName === "IFRAME") n.remove();
      if (n.tagName === "A") { n.setAttribute("data-href", n.getAttribute("href") || ""); n.removeAttribute("href"); }
      if (n.tagName === "INPUT" || n.tagName === "TEXTAREA") { n.setAttribute("readonly", ""); n.setAttribute("tabindex", "-1"); }
      if (n.tagName === "BUTTON") n.setAttribute("type", "button");
      n.removeAttribute("autofocus");
    }
    // Neutralize the element's own positioning; the builder wraps it in a box placed
    // at its on-screen position.
    const s = clone.style;
    s.position = "relative"; s.inset = "auto"; s.transform = "none"; s.margin = "0";
    s.width = `${r.width}px`; s.height = `${r.height}px`;
    s.maxWidth = "none"; s.maxHeight = "none"; s.minWidth = "0"; s.minHeight = "0";
    s.animation = "none"; s.transition = "none";
    return clone.outerHTML;
  });
  // Lifted layers go on top, in capture order. Strip handlers from them too.
  for (const l of layers) {
    for (const n of [l.node, ...l.node.querySelectorAll("*")]) {
      for (const at of [...n.attributes]) if (at.name.startsWith("on")) n.removeAttribute(at.name);
    }
    l.node.setAttribute("data-scene-el", "");
    html.push(l.node.outerHTML);
  }

  // Collect the app's stylesheets as text, with absolute URLs.
  let css = "";
  const urls = new Set();
  for (const sheet of document.styleSheets) {
    let text = "";
    try {
      text = [...sheet.cssRules].map(freezeRule).join("\n");
    } catch {
      if (sheet.href) text = await fetch(sheet.href).then((x) => x.text()).catch(() => "");
    }
    const base = sheet.href || location.href;
    text = text.replace(/url\((['"]?)([^'")]+)\1\)/g, (m, q, u) => {
      if (u.startsWith("data:")) return m;
      const abs = new URL(u, base).href;
      urls.add(abs);
      return `url("${abs}")`;
    });
    css += text + "\n";
  }

  return {
    rects: [...rects.map((r) => ({ x: r.left, y: r.top, w: r.width, h: r.height })), ...layers.map((l) => l.rect)],
    html,
    pad,
    root: {
      htmlClass: document.documentElement.className,
      htmlStyle: document.documentElement.getAttribute("style") || "",
      bodyClass: document.body.className,
    },
    css,
    urls: [...urls],
  };
}
