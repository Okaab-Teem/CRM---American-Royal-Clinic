import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-charts": ["recharts"],
          "vendor-dnd": ["@dnd-kit/core", "@dnd-kit/sortable"],
          "vendor-ui": ["lucide-react", "clsx", "tailwind-merge", "class-variance-authority"],
          "vendor-query": ["@tanstack/react-query", "axios"],
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
});
