import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const port = Number(process.env.PORT || 5173);
const basePath = process.env.BASE_PATH || "/";

if (Number.isNaN(port) || port <= 0) {
  throw new Error("Invalid PORT value");
}

export default defineConfig({
  base: basePath,

  plugins: [
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(
        import.meta.dirname,
        "..",
        "..",
        "attached_assets",
      ),
    },
    dedupe: ["react", "react-dom"],
  },

  root: path.resolve(import.meta.dirname),

  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },

  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    proxy: {
      "/api": {
        target: process.env.API_URL || "http://localhost:8080",
        changeOrigin: true,
      },
    },
    fs: {
      strict: true,
    },
  },

  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});