import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import federation from "@originjs/vite-plugin-federation";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "react17",
      filename: "react17.js",

      exposes: {
        "./appInjector": "./src/appInjector",
      },
    }),
  ],
  build: {
    modulePreload: false,
    target: "esnext",
    sourcemap: true,
  },
});
