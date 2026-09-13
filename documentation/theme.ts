import { readFileSync } from "node:fs";

import { defaultTheme, defineTheme } from "@ox-content/vite-plugin";

const documentationColors = {
  primary: "#cf0001",
  primaryHover: "#a90000",
  background: "#ffffff",
  backgroundAlt: "#f8f7f6",
  text: "#3c3c3c",
  textMuted: "#8c8c8c",
  border: "#e6e6e6",
  codeBackground: "#1b1b1b",
  codeBackgroundTop: "#292929",
  codeText: "#ffffff",
};

const documentationSurfaceTokens = {
  "surface-noise-image": "none",
  "surface-noise-size": "0",
  "surface-glass": "#ffffff",
  "color-heading": "#1b1b1b",
  "color-surface-strong": "#e6e6e6",
  "color-border-strong": "#d9d9d9",
};

const themeCss = readFileSync(new URL("./styles/theme.css", import.meta.url), "utf8");
const themeJs = readFileSync(new URL("./scripts/navigation.js", import.meta.url), "utf8");

export const documentationTheme = defineTheme({
  extends: defaultTheme,
  aside: true,
  colors: documentationColors,
  darkColors: documentationColors,
  fonts: {
    sans: '"YakuHanJPs", "Roboto", "Hiragino Kaku Gothic ProN", "ヒラギノ角ゴ ProN W3", Arial, "ncomJp", sans-serif',
    mono: '"Roboto Mono", "SFMono-Regular", Consolas, monospace',
  },
  layout: {
    sidebarWidth: "272px",
    headerHeight: "72px",
    maxContentWidth: "960px",
  },
  header: {
    logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'/%3E",
    showSiteNameText: true,
  },
  footer: {
    message: "Tasklyの規範仕様",
  },
  tokens: {
    ...documentationSurfaceTokens,
    "touch-target": "44px",
    "motion-base": "220ms",
    "motion-ease": "cubic-bezier(0.455, 0.03, 0.515, 0.955)",
    "focus-ring": "3px solid rgba(207, 0, 1, 0.35)",
    "focus-offset": "2px",
  },
  darkTokens: documentationSurfaceTokens,
  css: themeCss,
  js: themeJs,
});
