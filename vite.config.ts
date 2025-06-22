import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import mdx from '@mdx-js/rollup';
import tailwindcss from "@tailwindcss/vite";
import path from 'node:path';

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    { enforce: 'pre', ...mdx() },
    tailwindcss(),
    react()
  ],
  resolve: {
    alias: {
      // @ts-ignore
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
        protocol: "ws",
        host,
        port: 1421,
      }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  build: {
    minify: false,
    terserOptions: {
      compress: false,
      mangle: false,
    },
    rollupOptions: {
      output: {
        manualChunks,
        assetFileNames: "assets/[name].[ext]", // Output assets (e.g., images, SVGs) to the assets folder
        entryFileNames: "assets/[name].js", // Output entry files (e.g., JavaScript) to the root directory
        chunkFileNames: "assets/[name].js", // Output dynamic imports (chunks) to the assets folder
      },
    },
  },
});

function manualChunks(id) {
  console.log(id);
  if (id.includes("notic/src/dummy")) {
    return "dummy";
  } else if (id.includes("notic/src")) {
    return "notic";
  } else if (id.includes("node_modules")) {
    if (id.includes("react")) return "react";
    else return "modules"
  }
  return "chunk";
}
