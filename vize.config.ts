import { defineConfig } from "vize";

export default defineConfig({
  compiler: {
    templateSyntax: "standard",
  },
  vite: {
    scanPatterns: ["src/**/*.vue"],
  },
  linter: {
    enabled: true,
    preset: "essential",
  },
  typeChecker: {
    enabled: true,
    strict: true,
    jsxTypecheck: true,
    tsconfig: "frontend/tsconfig.app.json",
  },
  languageServer: {
    enabled: true,
    lint: true,
    typecheck: false,
    editor: false,
    ecosystem: false,
    formatting: true,
  },
  formatter: {
    printWidth: 100,
    singleQuote: false,
    singleAttributePerLine: false,
    sortAttributes: false,
    sortBlocks: true,
  },
});
