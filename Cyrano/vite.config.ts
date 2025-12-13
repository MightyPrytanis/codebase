// NOTE: This vite.config.ts is currently not used by the build process.
// The build script uses 'tsc' (TypeScript compiler) instead.
// This config is kept for potential future frontend client development.
// If a 'client' directory is added, update the paths below accordingly.

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      // NOTE: These directories don't exist yet. Update when client is added.
      // "@": path.resolve(import.meta.dirname, "client", "src"),
      // "@shared": path.resolve(import.meta.dirname, "shared"),
      // "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      "@shared": path.resolve(import.meta.dirname, "shared-assets"),
    },
  },
  // NOTE: Commented out until 'client' directory exists
  // root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
