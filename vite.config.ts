import { fileURLToPath } from "node:url"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { respuestasEjercicios } from "./ejercicios/vite-plugin"

export default defineConfig({
  root: "client",
  plugins: [react(), respuestasEjercicios()],
  resolve: {
    alias: { "@shared": fileURLToPath(new URL("./shared", import.meta.url)) },
  },
  server: {
    port: 5173,
    proxy: { "/api": "http://localhost:3001" },
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
})
