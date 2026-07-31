import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    watch: {
      // file events from the host don't propagate into the container reliably
      usePolling: true,
      interval: 300,
    },
    proxy: {
      // IA tab in dev → the host's LM Studio, proxied to dodge CORS entirely.
      // (vite runs inside docker, so "localhost" would be the container itself)
      "/llm": {
        target: "http://host.docker.internal:1234",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/llm/, ""),
      },
    },
  },
});
