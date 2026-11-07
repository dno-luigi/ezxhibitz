import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  server: {
    // `npm run dev` serves the app; `npm run api` serves its backend (worker/) on
    // 8787. In production both are the same origin, so the dev server forwards
    // the same paths there.
    proxy: {
      "/api": "http://127.0.0.1:8787",
      "/f": "http://127.0.0.1:8787",
    },
  },
  resolve: {
    // Exact matches: a plain "@wron/kit" key would also catch "@wron/kit/3d" as a path inside index.jsx.
    alias: [
      { find: /^@wron\/kit$/, replacement: path.resolve(import.meta.dirname, "src/wron-kit/index.jsx") },
      { find: /^@wron\/kit\/3d$/, replacement: path.resolve(import.meta.dirname, "src/wron-kit/three.jsx") },
      { find: /^@wron\/kit\/3d\/objects$/, replacement: path.resolve(import.meta.dirname, "src/wron-kit/three-objects.jsx") },
      { find: /^@wron\/kit\/scroll$/, replacement: path.resolve(import.meta.dirname, "src/wron-kit/scroll.jsx") },
      { find: "@", replacement: path.resolve(import.meta.dirname, "src") },
      // framer-motion needs no alias: motion installs it, and motion/react is built on it.
      { find: /^react-router-dom$/, replacement: "react-router" },
    ],
  },
});
