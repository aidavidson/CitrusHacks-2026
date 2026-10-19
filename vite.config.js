import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  root: fileURLToPath(new URL("./frontend", import.meta.url)),
  publicDir: false,
  plugins: [react()],
  html: { cspNonce: "__SORTIFY_NONCE__" },
  build: { outDir: "../dist", emptyOutDir: true },
});
