import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import federation from "@originjs/vite-plugin-federation";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "host-app",
      remotes: {
        react17: "./public/react17/assets/react17.js",
      },
    }),
  ],
  build: {
    modulePreload: false,
    target: "esnext",
    // minify: false,
    // cssCodeSplit: false,
  },
});
