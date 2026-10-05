(() => {
  const defaultBaseUrl = "https://backend.branch.flowengineering.com";
  const storageKey = "flow-api-base-url";
  const slug = "[a-z0-9](?:[a-z0-9-]*[a-z0-9])?";
  const backendHost = new RegExp(
    `^(?:backend\\.${slug}|${slug}\\.backend)\\.branch\\.flowengineering\\.com$`,
  );

  function validateBaseUrl(value) {
    try {
      const url = new URL(value);
      if (
        url.protocol === "https:" &&
        !url.username && !url.password && !url.port &&
        url.pathname === "/" && !url.search && !url.hash &&
        (url.hostname === "backend.branch.flowengineering.com" ||
          backendHost.test(url.hostname))
      ) {
        return url.origin;
      }
    } catch {
      // Invalid links must never redirect playground requests to another host.
    }
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  let baseUrl;
  if (params.has("apiBaseUrl")) {
    baseUrl = validateBaseUrl(params.get("apiBaseUrl"));
    try {
      if (baseUrl) window.sessionStorage.setItem(storageKey, baseUrl);
      else window.sessionStorage.removeItem(storageKey);
    } catch {
      // The link still works when browser storage is disabled.
    }
  } else {
    try {
      baseUrl = validateBaseUrl(window.sessionStorage.getItem(storageKey));
    } catch {
      // Direct visitors use the public default when storage is unavailable.
    }
  }

  // Mintlify applies these values to current and future playgrounds. Session
  // storage also preserves the selection across full-page navigation and reloads.
  window.mintlify.api.playground.setServerVariables({
    baseUrl: baseUrl || defaultBaseUrl,
  });
})();
