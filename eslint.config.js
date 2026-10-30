import js from "@eslint/js"
import reactHooks from "eslint-plugin-react-hooks"
import globals from "globals"
import tseslint from "typescript-eslint"

export default tseslint.config(
  { ignores: ["dist", "node_modules", "coverage", "logs", ".specify", ".claude", ".agents"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["client/**/*.{ts,tsx}", "ejercicios/app/**/*.{ts,tsx}", "ejercicios/tests/**/*.{ts,tsx}", "metricas/app/**/*.{ts,tsx}", "metricas/tests/client/**/*.{ts,tsx}", "tests/client/**/*.{ts,tsx}"],
    languageOptions: { globals: globals.browser },
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    files: ["server/**/*.ts", "metricas/server/**/*.ts", "metricas/tipos.ts", "ejercicios/vite-plugin.ts", "tests/server/**/*.ts", "metricas/tests/server/**/*.ts", "scripts/**/*.mjs", "*.config.{js,ts}"],
    languageOptions: { globals: globals.node },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
)
