import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  server: {
    port: 3000,
  },
  ssr: {
    noExternal: ["katex"],
  },
  css: {
    devSourcemap: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@backend": path.resolve(__dirname, "../backend"),
    },
  },
  optimizeDeps: {
    include: [
      "@backend/convex/_generated/api",
      "@backend/convex/_generated/dataModel",
      "@backend/convex/ai/schema",
    ],
  },
  build: {
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["@tanstack/react-router", "@tanstack/react-start"],
        },
      },
    },
  },
  plugins: [
    tanstackStart({
      customViteReactPlugin: true,
      tsr: {
        routesDirectory: "src/routes",
      },
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
});
