import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import federation, { Remotes } from "@originjs/vite-plugin-federation";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const remotes: Remotes =
    command === "serve"
      ? {
          react16: "./public/react16/assets/react16.js",
          react17: "./public/react17/assets/react17.js",
          react19: "./public/react19/assets/react19.js",
        }
      : {
          // Go up a level to remove a prefixed "/assets/" from the path in prod 🤷‍♂️
          react16: "../react16/assets/react16.js",
          react17: "../react17/assets/react17.js",
          react19: "../react19/assets/react19.js",
        };

  const base = command === "serve" ? "" : "/recording/test/examples/rdt-react-versions/dist/";

  return {
    base,
    plugins: [
      react(),
      federation({
        name: "host-app",
        remotes,
      }),
    ],
    build: {
      modulePreload: false,
      target: "esnext",
      sourcemap: true,
    },
  };
});
