import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

import { describe, expect, it } from "vite-plus/test";

const navigationScript = readFileSync(new URL("./navigation.js", import.meta.url), "utf8");

class MockAnchor {
  attributes = new Map();
  classNames = new Set(["nav-link"]);
  classList = {
    contains: (name) => this.classNames.has(name),
    toggle: (name, enabled) => {
      if (enabled) this.classNames.add(name);
      else this.classNames.delete(name);
    },
  };

  constructor(href, active = false) {
    this.href = href;
    if (active) this.classNames.add("active");
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  setAttribute(name, value) {
    this.attributes.set(name, value);
  }
}

function applyCurrentPageState(currentUrl, links) {
  runInNewContext(navigationScript, {
    HTMLAnchorElement: MockAnchor,
    URL,
    decodeURIComponent,
    document: { querySelectorAll: () => links },
    window: {
      location: {
        href: currentUrl,
        origin: new URL(currentUrl).origin,
      },
    },
  });
}

describe("documentation navigation", () => {
  it("marks the matching page across clean URL variants", () => {
    const root = new MockAnchor("http://127.0.0.1:4174/index.html", true);
    const overview = new MockAnchor("http://127.0.0.1:4174/product/overview/index.html");

    applyCurrentPageState("http://127.0.0.1:4174/product/overview.html", [root, overview]);

    expect(root.classList.contains("active")).toBe(false);
    expect(root.getAttribute("aria-current")).toBeNull();
    expect(overview.classList.contains("active")).toBe(true);
    expect(overview.getAttribute("aria-current")).toBe("page");
  });

  it("keeps the root page selected", () => {
    const root = new MockAnchor("http://127.0.0.1:4174/index.html");
    const overview = new MockAnchor("http://127.0.0.1:4174/product/overview/index.html", true);

    applyCurrentPageState("http://127.0.0.1:4174/", [root, overview]);

    expect(root.getAttribute("aria-current")).toBe("page");
    expect(overview.classList.contains("active")).toBe(false);
  });
});
