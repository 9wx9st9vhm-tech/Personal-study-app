import { defineConfig } from "vite";

// Vite serves and bundles the TypeScript interface.
// Tauri expects the dev server on a fixed port (see src-tauri/tauri.conf.json).
export default defineConfig({
  clearScreen: false,
  server: { port: 1420, strictPort: true },
  build: { target: "safari15", outDir: "dist" },
});
