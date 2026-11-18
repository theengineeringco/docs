// Flow docs scene runtime: swaps between captured states. No framework, no network.
(() => {
  const root = document.querySelector("[data-scene]");
  if (!root) return;
  const states = [...root.querySelectorAll("[data-scene-state]")];
  const first = states[0]?.dataset.sceneState;
  const show = (id) => {
    for (const s of states) s.hidden = s.dataset.sceneState !== id;
    const cur = states.find((s) => s.dataset.sceneState === id);
    cur?.querySelectorAll("[data-scene-scroll]").forEach((el) => {
      const [x, y] = el.dataset.sceneScroll.split(",").map(Number);
      el.scrollLeft = x; el.scrollTop = y;
    });
    root.dataset.current = id;
  };
  root.addEventListener("click", (e) => {
    const go = e.target.closest("[data-scene-go]");
    if (go && !go.closest("[hidden]")) { e.preventDefault(); show(go.dataset.sceneGo); return; }
    if (e.target.closest("a, form")) e.preventDefault();
    if (!e.target.closest("[data-scene-el]") && root.dataset.current !== first) show(first);
  });
  root.addEventListener("submit", (e) => e.preventDefault());
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") show(first); });
  show(first);
})();
