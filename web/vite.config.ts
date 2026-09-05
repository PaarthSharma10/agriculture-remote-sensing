import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev server on :5173 (matches the backend CORS allowlist) with an /api proxy
// to the FastAPI backend on :8000 so the frontend never needs CORS config.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});