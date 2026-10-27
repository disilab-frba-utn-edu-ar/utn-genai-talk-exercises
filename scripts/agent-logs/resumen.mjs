#!/usr/bin/env node
// Resume logs/agent-actions.jsonl para responder las preguntas de los ejercicios.
//
// Uso:
//   npm run logs:resumen                 → resumen de la última sesión con actividad
//   npm run logs:resumen -- --todas      → resumen de todas las sesiones
//   npm run logs:resumen -- --timeline   → además, la línea de tiempo completa
//   npm run logs:resumen -- --archivo logs/archivo/<archivo>.jsonl → lee un log archivado por logs:limpiar

import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

const argv = process.argv.slice(2)
const args = new Set(argv)
const archivo = argv.includes("--archivo") ? argv[argv.indexOf("--archivo") + 1] : undefined
const logFile = archivo ?? join(process.env.AGENT_LOG_DIR ?? join(process.cwd(), "logs"), "agent-actions.jsonl")

if (!existsSync(logFile)) {
  console.log(`No hay logs todavía (${logFile}). ¿Están configurados los hooks?`)
  process.exit(0)
}

const entries = readFileSync(logFile, "utf-8")
  .split("\n")
  .filter(Boolean)
  .map((line) => {
    try {
      return JSON.parse(line)
    } catch {
      return null
    }
  })
  .filter(Boolean)

const sessions = new Map()
for (const entry of entries) {
  const key = `${entry.agent} · ${entry.session ?? "sin-sesion"}`
  if (!sessions.has(key)) sessions.set(key, [])
  sessions.get(key).push(entry)
}

const keys = [...sessions.keys()]
// Algunos agentes abren sesiones sin prompts ni herramientas (solo SessionStart/SessionEnd): no cuentan como "la última".
const conActividad = keys.filter((key) => sessions.get(key).some((e) => e.event === "UserPromptSubmit" || e.event === "PreToolUse"))
const selected = args.has("--todas") ? keys : (conActividad.length ? conActividad : keys).slice(-1)

const PRE_EVENTS = new Set(["PreToolUse"])

function count(items) {
  const map = new Map()
  for (const item of items) map.set(item, (map.get(item) ?? 0) + 1)
  return [...map.entries()].sort((a, b) => b[1] - a[1])
}

// Muestra las rutas relativas a la raíz del repo para que el resumen sea legible.
function relative(text) {
  const root = process.cwd().replaceAll("\\", "/") + "/"
  return text.replaceAll("\\", "/").startsWith(root) ? text.replaceAll("\\", "/").slice(root.length) : text
}

function inputField(entry, ...names) {
  const input = typeof entry.input === "object" && entry.input ? entry.input : {}
  for (const name of names) if (input[name]) return relative(String(input[name]))
  return undefined
}

function describe(entry) {
  if (entry.prompt) return `prompt: ${String(entry.prompt).slice(0, 100)}`
  if (!entry.tool) return entry.source ?? entry.reason ?? ""
  const detail =
    inputField(entry, "command", "cmd") ??
    inputField(entry, "file_path", "path", "filePath", "notebook_path") ??
    inputField(entry, "pattern", "query", "regex", "url", "skill") ??
    (typeof entry.input === "string" ? entry.input : "")
  return `${entry.tool} ${detail.slice(0, 100)}`.trim()
}

for (const key of selected) {
  const list = sessions.get(key)
  const first = new Date(list[0].ts)
  const last = new Date(list.at(-1).ts)
  const toolCalls = list.filter((e) => PRE_EVENTS.has(e.event) && e.tool)

  console.log(`\n━━━ Sesión ${key}`)
  console.log(`Inicio: ${first.toLocaleString()}  ·  Duración: ${Math.round((last - first) / 1000)} s`)
  console.log(`Eventos registrados: ${list.length}  ·  Llamadas a herramientas: ${toolCalls.length}`)

  console.log("\nEventos por tipo:")
  for (const [name, n] of count(list.map((e) => e.event))) console.log(`  ${String(n).padStart(4)}  ${name}`)

  console.log("\nHerramientas usadas:")
  for (const [name, n] of count(toolCalls.map((e) => e.tool))) console.log(`  ${String(n).padStart(4)}  ${name}`)

  const commands = toolCalls.map((e) => inputField(e, "command", "cmd")).filter(Boolean)
  if (commands.length) {
    console.log("\nComandos de terminal:")
    for (const cmd of commands) console.log(`  $ ${cmd.slice(0, 140)}`)
  }

  const files = toolCalls.map((e) => inputField(e, "file_path", "path", "filePath")).filter(Boolean)
  if (files.length) {
    console.log("\nArchivos tocados (lectura o escritura):")
    for (const [file, n] of count(files)) console.log(`  ${String(n).padStart(4)}  ${file}`)
  }

  const mcp = toolCalls.filter((e) => /^mcp__|^use_mcp_tool$|^mcp_/i.test(e.tool))
  if (mcp.length) {
    console.log("\nHerramientas MCP:")
    for (const [name, n] of count(mcp.map((e) => e.tool))) console.log(`  ${String(n).padStart(4)}  ${name}`)
  }

  const skills = toolCalls.filter((e) => /skill/i.test(e.tool) || /SKILL\.md/.test(JSON.stringify(e.input ?? "")))
  if (skills.length) {
    console.log("\nSkills activadas o leídas:")
    for (const entry of skills) console.log(`  ${describe(entry)}`)
  }

  if (args.has("--timeline")) {
    console.log("\nLínea de tiempo:")
    for (const entry of list) {
      const time = new Date(entry.ts).toLocaleTimeString()
      console.log(`  ${time}  ${entry.event.padEnd(18)} ${describe(entry)}`)
    }
  }
}

if (!args.has("--todas") && keys.length > 1) {
  console.log(`\n(Hay ${keys.length} sesiones en el log. Usá --todas para verlas todas.)`)
}
