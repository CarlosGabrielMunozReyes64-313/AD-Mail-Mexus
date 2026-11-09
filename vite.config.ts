import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      react({ babel: { plugins: ["babel-plugin-react-compiler"] } }),
      tailwindcss(),
    ],
    build: {
      rollupOptions: { output: { manualChunks: { graficas: ["recharts"] } } },
    },
    server: {
      proxy: {
        "/api": { target: env.API_PROXY_TARGET || "http://127.0.0.1:8000" },
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      css: true,
    },
  };
});
