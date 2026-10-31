// Verificación determinística de un endpoint con el server levantado.
// Uso: node .claude/skills/nuevo-endpoint/scripts/verificar-endpoint.mjs <url>
import { argv } from "node:process"

const url = argv[2]
if (!url) {
  console.error("Uso: verificar-endpoint.mjs <url>")
  process.exit(2)
}

const res = await fetch(url)
console.log(`${res.status} ${res.statusText} — ${url}`)
if (!res.ok) process.exit(1)
