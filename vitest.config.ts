import { fileURLToPath } from "node:url"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

const alias = { "@shared": fileURLToPath(new URL("./shared", import.meta.url)) }

export default defineConfig({
  plugins: [react()],
  resolve: { alias },
  test: {
    globals: true,
    projects: [
      {
        extends: true,
        test: { name: "server", environment: "node", include: ["tests/server/**/*.test.ts", "metricas/tests/server/**/*.test.ts"] },
      },
      {
        extends: true,
        test: {
          name: "client",
          environment: "jsdom",
          include: ["tests/client/**/*.test.tsx", "ejercicios/tests/**/*.test.tsx", "metricas/tests/client/**/*.test.tsx"],
          setupFiles: ["tests/client/setup.ts"],
        },
      },
    ],
  },
})
