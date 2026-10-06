(() => {
  const titles = new Set(["Quickstart", "Automations", "Flow MCP", "Endpoints"]);
  const sections = new Map();
  const storageKey = "flow-api-sidebar-open";
  const openTitles = new Set();
  const revealedTitles = new Set();
  let pathname;
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(storageKey));
    if (Array.isArray(saved)) {
      for (const title of saved) {
        if (titles.has(title)) openTitles.add(title);
      }
    }
  } catch {
    // Blocked storage or an invalid saved value must not prevent navigation.
  }

  function setOpen(title, expanded, animate) {
    if (expanded) openTitles.add(title);
    else openTitles.delete(title);
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify([...openTitles]));
    } catch {
      // In-memory state still survives Mintlify's client-side navigation.
    }
    for (const section of sections.values()) {
      if (section.title === title) section.setExpanded(expanded, animate);
    }
  }
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let nextId = 0;
  let pending = false;

  function enhance(header, title, links) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "flow-sidebar-toggle";
    button.setAttribute("aria-label", title);
    const initiallyExpanded = openTitles.has(title);
    button.setAttribute("aria-expanded", String(initiallyExpanded));
    if (!links.id) links.id = `flow-sidebar-links-${++nextId}`;
    button.setAttribute("aria-controls", links.id);
    header.classList.add("flow-sidebar-header");
    header.append(button);
    links.classList.add("flow-sidebar-links");
    links.hidden = !initiallyExpanded;
    links.inert = !initiallyExpanded;
    let animation;

    function setExpanded(expanded, animate) {
      if ((button.getAttribute("aria-expanded") === "true") === expanded) return;
      const height = links.getBoundingClientRect().height;
      animation?.cancel();
      button.setAttribute("aria-expanded", String(expanded));
      links.hidden = false;
      links.inert = !expanded;
      links.classList.remove("flow-sidebar-animating");

      if (!animate || reducedMotion.matches) {
        links.hidden = !expanded;
        return;
      }

      links.classList.add("flow-sidebar-animating");
      animation = links.animate(
        [{ height: `${height}px` }, { height: `${expanded ? links.scrollHeight : 0}px` }],
        { duration: 220, easing: "cubic-bezier(0.2, 0, 0, 1)" },
      );
      animation.onfinish = () => {
        links.hidden = !expanded;
        links.classList.remove("flow-sidebar-animating");
        animation = undefined;
      };
    }

    button.addEventListener("click", () => {
      setOpen(title, button.getAttribute("aria-expanded") !== "true", true);
    });

    sections.set(header, {
      title,
      links,
      button,
      setExpanded,
      remove() {
        animation?.cancel();
        button.remove();
        header.classList.remove("flow-sidebar-header");
        links.classList.remove("flow-sidebar-links", "flow-sidebar-animating");
        links.hidden = false;
        links.inert = false;
      },
    });
  }

  function refresh() {
    pending = false;
    if (pathname !== window.location.pathname) {
      pathname = window.location.pathname;
      revealedTitles.clear();
    }
    // Mintlify can reuse or replace sidebar nodes during client-side navigation.
    for (const [header, section] of sections) {
      if (!header.isConnected ||
          header.querySelector(".sidebar-title")?.textContent.trim() !== section.title ||
          header.nextElementSibling !== section.links ||
          !header.contains(section.button)) {
        section.remove();
        sections.delete(header);
      }
    }

    for (const header of document.querySelectorAll(".sidebar-group-header")) {
      const title = header.querySelector(".sidebar-title")?.textContent.trim();
      const links = header.nextElementSibling;
      if (titles.has(title) && links?.matches("ul.sidebar-group") && !sections.has(header)) {
        enhance(header, title, links);
      }
    }

    for (const section of sections.values()) {
      const activeLink = section.links.querySelector('a[aria-current="page"]');
      // Reveal a destination once per navigation, so an explicit collapse on
      // the current page survives rerenders and reopening the mobile menu.
      if (activeLink?.pathname === pathname && !revealedTitles.has(section.title)) {
        revealedTitles.add(section.title);
        setOpen(section.title, true, false);
      }
    }
  }

  refresh();
  new MutationObserver(() => {
    if (!pending) {
      pending = true;
      requestAnimationFrame(refresh);
    }
  }).observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["aria-current"],
  });
})();
