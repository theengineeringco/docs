(() => {
  const titles = new Set(["Quickstart", "Automations", "Flow MCP", "Endpoints"]);
  const sections = new Map();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let nextId = 0;
  let pending = false;

  function enhance(header, title, links) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "flow-sidebar-toggle";
    button.setAttribute("aria-label", title);
    button.setAttribute("aria-expanded", "false");
    if (!links.id) links.id = `flow-sidebar-links-${++nextId}`;
    button.setAttribute("aria-controls", links.id);
    header.classList.add("flow-sidebar-header");
    header.append(button);
    links.classList.add("flow-sidebar-links");
    links.hidden = true;
    links.inert = true;
    let animation;

    button.addEventListener("click", () => {
      const expanded = button.getAttribute("aria-expanded") !== "true";
      const height = links.getBoundingClientRect().height;
      animation?.cancel();
      button.setAttribute("aria-expanded", String(expanded));
      links.hidden = false;
      links.inert = !expanded;
      links.classList.remove("flow-sidebar-animating");

      if (reducedMotion.matches) {
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
    });

    sections.set(header, {
      title,
      links,
      button,
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
  }

  refresh();
  new MutationObserver(() => {
    if (!pending) {
      pending = true;
      requestAnimationFrame(refresh);
    }
  }).observe(document.body, { childList: true, subtree: true });
})();
