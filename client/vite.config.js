// client/vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const backendTarget = process.env.SERVER_URL || "http://127.0.0.1:4000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: backendTarget,
        changeOrigin: true,
        ws: true
      }
    }
  }
});