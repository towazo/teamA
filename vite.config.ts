import { defineConfig } from "vite-plus";
import { createVizeLintConfig } from "oxlint-plugin-vize";

const vizeLint = createVizeLintConfig({
  preset: "essential",
  settings: {
    helpLevel: "short",
  },
});

export default defineConfig({
  defaultPackage: {
    dev: "./frontend",
    preview: "./frontend",
  },
  staged: {
    "*": "vp check --fix",
    "frontend/src/**/*.vue": "vp exec vize fmt --config vize.config.ts --write",
  },
  fmt: {
    ignorePatterns: ["**/.vize/**", "design/**", "frontend/src/**/*.vue"],
  },
  lint: {
    ...vizeLint,
    ignorePatterns: ["**/.vize/**", "design/**"],
    jsPlugins: [...vizeLint.jsPlugins, { name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: {
      ...vizeLint.rules,
      "vite-plus/prefer-vite-plus-imports": "error",
    },
    options: { typeAware: true, typeCheck: true },
  },
});
