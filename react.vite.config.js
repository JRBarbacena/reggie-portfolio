import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: "react-app",
  // Only runtime assets live here. Source photos stay out of the deployment
  // bundle so Vite does not publish the original image library.
  publicDir: "public",
  build: {
    outDir: "../dist-react",
    emptyOutDir: true,
  },
});
