import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      // See src/lib/icons.ts. Exact match only, so the deep per-icon imports
      // inside that file still resolve to the real package.
      { find: /^lucide-react$/, replacement: "/src/lib/icons.ts" },
    ],
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      "/availability": "http://127.0.0.1:8080",
      "/bookings": "http://127.0.0.1:8080",
      "/health": "http://127.0.0.1:8080",
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split big vendor libs into their own cacheable chunks so a copy
        // change to the site doesn't force visitors to re-download React.
        manualChunks(id: string) {
          if (id.includes("node_modules")) {
            if (id.includes("framer-motion")) return "motion";
            if (id.includes("react")) return "react";
          }
        },
      },
    },
  },
});
