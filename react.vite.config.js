import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: "react-app",
  publicDir: "../assets",
  build: {
    outDir: "../dist-react",
    emptyOutDir: true,
  },
});
