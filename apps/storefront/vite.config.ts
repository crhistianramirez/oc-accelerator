import { defineConfig, splitVendorChunkPlugin } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/",
  build: {
    outDir: "dist",
  },
  server: {
    port: 3001,
  },
  plugins: [splitVendorChunkPlugin(), react()],
});
