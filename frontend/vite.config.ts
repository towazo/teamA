import vize from "@vizejs/vite-plugin";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [vize({ configMode: "auto" })],
  server: {
    port: 5173,
  },
});
