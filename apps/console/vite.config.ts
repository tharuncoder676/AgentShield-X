import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@agentshield/ui": path.resolve(__dirname, "../../packages/ui/src"),
      "@agentshield/api-client": path.resolve(__dirname, "../../packages/api-client/src"),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    watch: {
      ignored: ["**/downloads/**", "**/*.mp4", "**/*.exe", "**/*.dmg", "**/*.AppImage", "**/*.zip", "**/*.tar.gz"],
    },
    proxy: {
      "/v1": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        ws: true,
      },
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/downloads": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
