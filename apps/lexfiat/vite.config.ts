import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      "@cyrano": path.resolve(import.meta.dirname, "..", "..", "Cyrano"),
      "@cyrano/shared-assets": path.resolve(import.meta.dirname, "..", "..", "Cyrano", "shared-assets"),
    },
    dedupe: ["lucide-react", "react", "react-dom"],
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
  },
  optimizeDeps: {
    include: ["@cyrano/shared-assets"],
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    commonjsOptions: {
      include: [/node_modules/],
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-tabs', '@radix-ui/react-toast'],
          'query-vendor': ['@tanstack/react-query'],
          'icons': ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 300,
  },
  server: {
    fs: {
      strict: false,
      allow: ['..'],
    },
    headers: {
      // Hardened CSP: Remove unsafe-inline and unsafe-eval where possible
      // Note: 'unsafe-inline' for styles is required for Vite HMR in development
      // 'unsafe-eval' is required for Vite's module system in development
      'Content-Security-Policy': process.env.NODE_ENV === 'production'
        ? "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
        : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' ws://localhost:* http://localhost:* https:; frame-ancestors 'none'; base-uri 'self';",
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    },
  },
  preview: {
    port: 4174,
    host: true,
  },
});
