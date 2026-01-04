// vite.config.ts
import { defineConfig } from "file:///Users/davidtowne/Desktop/coding/codebase/apps/arkiver/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///Users/davidtowne/Desktop/coding/codebase/apps/arkiver/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
import { fileURLToPath } from "url";
var __vite_injected_original_import_meta_url = "file:///Users/davidtowne/Desktop/coding/codebase/apps/arkiver/frontend/vite.config.ts";
var __dirname = path.dirname(fileURLToPath(__vite_injected_original_import_meta_url));
var vite_config_default = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@cyrano": path.resolve(__dirname, "../../../Cyrano")
    },
    dedupe: ["lucide-react", "react", "react-dom"]
  },
  optimizeDeps: {
    include: ["lucide-react"]
  },
  server: {
    port: 5174,
    open: true,
    fs: {
      strict: true,
      deny: ["**/.*"]
    },
    headers: {
      // Hardened CSP: Remove unsafe-inline and unsafe-eval where possible
      // Note: 'unsafe-inline' for styles is required for Vite HMR in development
      // 'unsafe-eval' is required for Vite's module system in development
      "Content-Security-Policy": process.env.NODE_ENV === "production" ? "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' ws://localhost:* http://localhost:* https:; frame-ancestors 'none'; base-uri 'self';",
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "geolocation=(), microphone=(), camera=()"
    }
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    commonjsOptions: {
      include: [/node_modules/]
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvZGF2aWR0b3duZS9EZXNrdG9wL2NvZGluZy9jb2RlYmFzZS9hcHBzL2Fya2l2ZXIvZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9kYXZpZHRvd25lL0Rlc2t0b3AvY29kaW5nL2NvZGViYXNlL2FwcHMvYXJraXZlci9mcm9udGVuZC92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvZGF2aWR0b3duZS9EZXNrdG9wL2NvZGluZy9jb2RlYmFzZS9hcHBzL2Fya2l2ZXIvZnJvbnRlbmQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tICd1cmwnO1xuXG5jb25zdCBfX2Rpcm5hbWUgPSBwYXRoLmRpcm5hbWUoZmlsZVVSTFRvUGF0aChpbXBvcnQubWV0YS51cmwpKTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3JlYWN0KCldLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXG4gICAgICAnQGN5cmFubyc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi8uLi8uLi9DeXJhbm8nKSxcbiAgICB9LFxuICAgIGRlZHVwZTogWydsdWNpZGUtcmVhY3QnLCAncmVhY3QnLCAncmVhY3QtZG9tJ10sXG4gIH0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGluY2x1ZGU6IFsnbHVjaWRlLXJlYWN0J10sXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDUxNzQsXG4gICAgb3BlbjogdHJ1ZSxcbiAgICBmczoge1xuICAgICAgc3RyaWN0OiB0cnVlLFxuICAgICAgZGVueTogW1wiKiovLipcIl0sXG4gICAgfSxcbiAgICBoZWFkZXJzOiB7XG4gICAgICAvLyBIYXJkZW5lZCBDU1A6IFJlbW92ZSB1bnNhZmUtaW5saW5lIGFuZCB1bnNhZmUtZXZhbCB3aGVyZSBwb3NzaWJsZVxuICAgICAgLy8gTm90ZTogJ3Vuc2FmZS1pbmxpbmUnIGZvciBzdHlsZXMgaXMgcmVxdWlyZWQgZm9yIFZpdGUgSE1SIGluIGRldmVsb3BtZW50XG4gICAgICAvLyAndW5zYWZlLWV2YWwnIGlzIHJlcXVpcmVkIGZvciBWaXRlJ3MgbW9kdWxlIHN5c3RlbSBpbiBkZXZlbG9wbWVudFxuICAgICAgJ0NvbnRlbnQtU2VjdXJpdHktUG9saWN5JzogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdwcm9kdWN0aW9uJ1xuICAgICAgICA/IFwiZGVmYXVsdC1zcmMgJ3NlbGYnOyBzY3JpcHQtc3JjICdzZWxmJzsgc3R5bGUtc3JjICdzZWxmJyBodHRwczovL2ZvbnRzLmdvb2dsZWFwaXMuY29tOyBmb250LXNyYyAnc2VsZicgaHR0cHM6Ly9mb250cy5nc3RhdGljLmNvbTsgaW1nLXNyYyAnc2VsZicgZGF0YTogaHR0cHM6OyBjb25uZWN0LXNyYyAnc2VsZicgaHR0cHM6OyBmcmFtZS1hbmNlc3RvcnMgJ25vbmUnOyBiYXNlLXVyaSAnc2VsZic7IGZvcm0tYWN0aW9uICdzZWxmJztcIlxuICAgICAgICA6IFwiZGVmYXVsdC1zcmMgJ3NlbGYnOyBzY3JpcHQtc3JjICdzZWxmJyAndW5zYWZlLWlubGluZScgJ3Vuc2FmZS1ldmFsJzsgc3R5bGUtc3JjICdzZWxmJyAndW5zYWZlLWlubGluZScgaHR0cHM6Ly9mb250cy5nb29nbGVhcGlzLmNvbTsgZm9udC1zcmMgJ3NlbGYnIGh0dHBzOi8vZm9udHMuZ3N0YXRpYy5jb207IGltZy1zcmMgJ3NlbGYnIGRhdGE6IGh0dHBzOjsgY29ubmVjdC1zcmMgJ3NlbGYnIHdzOi8vbG9jYWxob3N0OiogaHR0cDovL2xvY2FsaG9zdDoqIGh0dHBzOjsgZnJhbWUtYW5jZXN0b3JzICdub25lJzsgYmFzZS11cmkgJ3NlbGYnO1wiLFxuICAgICAgJ1gtRnJhbWUtT3B0aW9ucyc6ICdERU5ZJyxcbiAgICAgICdYLUNvbnRlbnQtVHlwZS1PcHRpb25zJzogJ25vc25pZmYnLFxuICAgICAgJ1JlZmVycmVyLVBvbGljeSc6ICdzdHJpY3Qtb3JpZ2luLXdoZW4tY3Jvc3Mtb3JpZ2luJyxcbiAgICAgICdQZXJtaXNzaW9ucy1Qb2xpY3knOiAnZ2VvbG9jYXRpb249KCksIG1pY3JvcGhvbmU9KCksIGNhbWVyYT0oKScsXG4gICAgfSxcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICBvdXREaXI6ICdkaXN0JyxcbiAgICBzb3VyY2VtYXA6IHRydWUsXG4gICAgY29tbW9uanNPcHRpb25zOiB7XG4gICAgICBpbmNsdWRlOiBbL25vZGVfbW9kdWxlcy9dLFxuICAgIH0sXG4gIH0sXG59KTtcblxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUErVyxTQUFTLG9CQUFvQjtBQUM1WSxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMscUJBQXFCO0FBSHdNLElBQU0sMkNBQTJDO0FBS3ZSLElBQU0sWUFBWSxLQUFLLFFBQVEsY0FBYyx3Q0FBZSxDQUFDO0FBRTdELElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNqQixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxXQUFXLE9BQU87QUFBQSxNQUNwQyxXQUFXLEtBQUssUUFBUSxXQUFXLGlCQUFpQjtBQUFBLElBQ3REO0FBQUEsSUFDQSxRQUFRLENBQUMsZ0JBQWdCLFNBQVMsV0FBVztBQUFBLEVBQy9DO0FBQUEsRUFDQSxjQUFjO0FBQUEsSUFDWixTQUFTLENBQUMsY0FBYztBQUFBLEVBQzFCO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixJQUFJO0FBQUEsTUFDRixRQUFRO0FBQUEsTUFDUixNQUFNLENBQUMsT0FBTztBQUFBLElBQ2hCO0FBQUEsSUFDQSxTQUFTO0FBQUE7QUFBQTtBQUFBO0FBQUEsTUFJUCwyQkFBMkIsUUFBUSxJQUFJLGFBQWEsZUFDaEQsMFBBQ0E7QUFBQSxNQUNKLG1CQUFtQjtBQUFBLE1BQ25CLDBCQUEwQjtBQUFBLE1BQzFCLG1CQUFtQjtBQUFBLE1BQ25CLHNCQUFzQjtBQUFBLElBQ3hCO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLElBQ1gsaUJBQWlCO0FBQUEsTUFDZixTQUFTLENBQUMsY0FBYztBQUFBLElBQzFCO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
