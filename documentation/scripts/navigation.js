(() => {
  const normalizePath = (value) => {
    const url = new URL(value, window.location.origin);
    let path = decodeURIComponent(url.pathname);

    path = path.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
    return path.length > 1 ? path.replace(/\/$/, "") : path;
  };

  const currentPath = normalizePath(window.location.href);

  document.querySelectorAll(".nav-link").forEach((element) => {
    if (!(element instanceof HTMLAnchorElement)) return;

    const isCurrent = normalizePath(element.href) === currentPath;
    element.classList.toggle("active", isCurrent);

    if (isCurrent) {
      element.setAttribute("aria-current", "page");
    } else {
      element.removeAttribute("aria-current");
    }
  });
})();
