#!/usr/bin/env node
// Empieza con logs vacíos sin perder los anteriores: mueve las carpetas por provider
// (y el viejo agent-actions.jsonl, si existe) a logs/archivo/<fecha>/.
// Para volver a leerlos: npm run logs:resumen -- --archivo logs/archivo/<fecha>

import { existsSync, mkdirSync, readdirSync, renameSync } from "node:fs"
import { join } from "node:path"

const logDir = process.env.AGENT_LOG_DIR ?? join(process.cwd(), "logs")
const pendientes = existsSync(logDir) ? readdirSync(logDir).filter((nombre) => nombre !== "archivo") : []

if (pendientes.length === 0) {
  console.log("No hay logs para limpiar.")
  process.exit(0)
}

const destino = join(logDir, "archivo", new Date().toISOString().replace(/[:.]/g, "-"))
mkdirSync(destino, { recursive: true })
for (const nombre of pendientes) renameSync(join(logDir, nombre), join(destino, nombre))
console.log(`Logs archivados en ${destino}. El próximo evento empieza logs nuevos.`)
