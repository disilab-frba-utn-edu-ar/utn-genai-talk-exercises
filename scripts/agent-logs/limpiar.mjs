#!/usr/bin/env node
// Empieza un log vacío sin perder el anterior: lo mueve a logs/archivo/agent-actions-<fecha>.jsonl.
// Para volver a leerlo: npm run logs:resumen -- --archivo logs/archivo/<archivo>.jsonl

import { existsSync, mkdirSync, renameSync } from "node:fs"
import { join } from "node:path"

const logDir = process.env.AGENT_LOG_DIR ?? join(process.cwd(), "logs")
const logFile = join(logDir, "agent-actions.jsonl")

if (!existsSync(logFile)) {
  console.log("No hay log para limpiar.")
  process.exit(0)
}

const archivoDir = join(logDir, "archivo")
mkdirSync(archivoDir, { recursive: true })
const destino = join(archivoDir, `agent-actions-${new Date().toISOString().replace(/[:.]/g, "-")}.jsonl`)
renameSync(logFile, destino)
console.log(`Log archivado en ${destino}. El próximo evento empieza un log nuevo.`)
