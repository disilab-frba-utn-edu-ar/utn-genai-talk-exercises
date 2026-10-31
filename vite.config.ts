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
    // Solo este equipo: ni la web ni la API se abren a la red del aula.
    host: "127.0.0.1",
    port: 5173,
    proxy: { "/api": `http://127.0.0.1:${process.env.PORT ?? 3001}` },
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
})
