import build from "@hono/vite-build/node";
import devServer from "@hono/vite-dev-server";
import { defineConfig } from "vite-plus";

export default defineConfig({
  server: {
    cors: false,
    port: 8787,
  },
  plugins: [
    devServer({
      entry: "src/index.ts",
    }),
    build({
      entry: "src/index.ts",
      port: 8787,
    }),
  ],
});
