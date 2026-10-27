#!/usr/bin/env node
// Resume los logs de logs/<agente>/<sesión>.jsonl para responder las preguntas de los ejercicios.
//
// Uso:
//   npm run logs:resumen                 → resumen de la última sesión con actividad
//   npm run logs:resumen -- --todas      → resumen de todas las sesiones
//   npm run logs:resumen -- --agente cline → solo las sesiones de ese provider (claude | codex | cline)
//   npm run logs:resumen -- --timeline   → además, la línea de tiempo completa
//   npm run logs:resumen -- --archivo logs/archivo/<fecha> → lee logs archivados por logs:limpiar (carpeta o archivo .jsonl)

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { clasificar } from "./clasificar.mjs"

const argv = process.argv.slice(2)
const args = new Set(argv)
const valorDe = (flag) => (argv.includes(flag) ? argv[argv.indexOf(flag) + 1] : undefined)
const archivo = valorDe("--archivo")
const agente = valorDe("--agente")
const logPath = archivo ?? process.env.AGENT_LOG_DIR ?? join(process.cwd(), "logs")

// Devuelve todos los .jsonl bajo una ruta, sin entrar en logs/archivo salvo que se pida con --archivo.
function jsonlEn(ruta, raiz = true) {
  if (!existsSync(ruta)) return []
  if (statSync(ruta).isFile()) return ruta.endsWith(".jsonl") ? [ruta] : []
  return readdirSync(ruta).flatMap((nombre) => (raiz && nombre === "archivo" && !archivo ? [] : jsonlEn(join(ruta, nombre), false)))
}

const EVENTOS_VIEJOS = { agent_start: "TaskStart", agent_end: "TaskComplete", agent_abort: "TaskCancel", prompt_submit: "UserPromptSubmit", tool_call: "PreToolUse", tool_result: "PostToolUse" }

const files = jsonlEn(logPath)
if (files.length === 0) {
  console.log(`No hay logs todavía (${logPath}). ¿Están configurados los hooks?`)
  process.exit(0)
}

const entries = files
  .flatMap((file) => readFileSync(file, "utf-8").split("\n"))
  .filter(Boolean)
  .map((line) => {
    try {
      return JSON.parse(line)
    } catch {
      return null
    }
  })
  .filter(Boolean)
  // Logs escritos antes de normalizar los eventos de Cline 3.x traen nombres en snake_case.
  .map((entry) => ({ ...entry, event: EVENTOS_VIEJOS[entry.event] ?? entry.event }))
  .filter((entry) => !agente || entry.agent === agente)
  .sort((a, b) => String(a.ts).localeCompare(String(b.ts)))

const sessions = new Map()
for (const entry of entries) {
  const key = `${entry.agent} · ${entry.session ?? "sin-sesion"}`
  if (!sessions.has(key)) sessions.set(key, [])
  sessions.get(key).push(entry)
}

// Ordenadas por su último evento, así "la última" es la más reciente aunque venga de otro provider.
const keys = [...sessions.keys()].sort((a, b) => String(sessions.get(a).at(-1).ts).localeCompare(String(sessions.get(b).at(-1).ts)))
// Algunos agentes abren sesiones sin prompts ni herramientas (solo SessionStart/SessionEnd): no cuentan como "la última".
const conActividad = keys.filter((key) => sessions.get(key).some((e) => e.event === "UserPromptSubmit" || e.event === "PreToolUse"))
const selected = args.has("--todas") ? keys : (conActividad.length ? conActividad : keys).slice(-1)

const PRE_EVENTS = new Set(["PreToolUse"])
const FIN_EVENTS = new Set(["Stop", "TaskComplete"])

function count(items) {
  const map = new Map()
  for (const item of items) map.set(item, (map.get(item) ?? 0) + 1)
  return [...map.entries()].sort((a, b) => b[1] - a[1])
}

// Muestra las rutas relativas a la raíz del repo para que el resumen sea legible.
function relative(text) {
  const root = process.cwd().replaceAll("\\", "/") + "/"
  const normalized = String(text).replaceAll("\\", "/")
  return normalized.startsWith(root) ? normalized.slice(root.length) : normalized
}

const corto = (text, max = 100) => {
  const plano = String(text).replace(/\s+/g, " ").trim()
  return plano.length > max ? `${plano.slice(0, max)}…` : plano
}

// Cada llamada a herramienta, ya clasificada (también para logs viejos sin `kind`).
function accion(entry) {
  const { kind, op, targets } = clasificar(entry.tool, entry.input)
  return { ts: entry.ts, tool: entry.tool, kind: entry.kind ?? kind, op: entry.op ?? op, targets: targets.length ? targets : entry.detail ? [entry.detail] : [] }
}

const etiqueta = (a) => (a.op ? `${a.kind} (${a.op})` : a.kind)
const rutas = (a) => (a.kind === "leer" || a.kind === "escribir" ? a.targets.map(relative) : a.targets)

// Agrupa los eventos por turno: cada prompt abre uno y junta lo que el agente hizo hasta el siguiente.
function turnos(list) {
  const result = []
  let actual
  const abrir = (prompt, ts) => result.push((actual = { prompt, ts, acciones: [], fallas: [], fin: undefined }))
  for (const entry of list) {
    if (entry.event === "UserPromptSubmit" || entry.event === "TaskStart") {
      if (entry.event === "TaskStart" && entry.prompt === undefined) continue
      abrir(entry.prompt ?? "", entry.ts)
    } else if (PRE_EVENTS.has(entry.event) && entry.tool) {
      if (!actual) abrir("(sin prompt registrado)", entry.ts)
      actual.acciones.push(accion(entry))
    } else if (entry.event === "PostToolUseFailure") {
      if (actual) actual.fallas.push(entry)
    } else if (FIN_EVENTS.has(entry.event) && actual) {
      actual.fin = entry.lastMessage
    }
  }
  return result
}

for (const key of selected) {
  const list = sessions.get(key)
  const first = new Date(list[0].ts)
  const last = new Date(list.at(-1).ts)
  const toolCalls = list.filter((e) => PRE_EVENTS.has(e.event) && e.tool)
  const acciones = toolCalls.map(accion)
  const lista = turnos(list)

  console.log(`\n━━━ Sesión ${key}`)
  console.log(`Inicio: ${first.toLocaleString()}  ·  Duración: ${Math.round((last - first) / 1000)} s`)
  console.log(`Turnos: ${lista.length}  ·  Llamadas a herramientas: ${toolCalls.length}  ·  Eventos registrados: ${list.length}`)

  console.log("\nPor tipo de acción:")
  for (const [name, n] of count(acciones.map((a) => a.kind))) console.log(`  ${String(n).padStart(4)}  ${name}`)

  console.log("\nHerramientas usadas:")
  for (const [name, n] of count(toolCalls.map((e) => e.tool))) console.log(`  ${String(n).padStart(4)}  ${name}`)

  const leidos = acciones.filter((a) => a.kind === "leer").flatMap(rutas)
  if (leidos.length) {
    console.log("\nArchivos leídos:")
    for (const [file, n] of count(leidos)) console.log(`  ${String(n).padStart(4)}  ${file}`)
  }

  const escritos = acciones.filter((a) => a.kind === "escribir").flatMap((a) => rutas(a).map((file) => `${file}  [${a.op}]`))
  if (escritos.length) {
    console.log("\nArchivos escritos:")
    for (const [file, n] of count(escritos)) console.log(`  ${String(n).padStart(4)}  ${file}`)
  }

  const comandos = acciones.filter((a) => a.kind === "ejecutar").flatMap((a) => a.targets)
  if (comandos.length) {
    console.log("\nComandos de terminal:")
    for (const cmd of comandos) console.log(`  $ ${corto(cmd, 140)}`)
  }

  const mcp = acciones.filter((a) => a.kind === "mcp")
  if (mcp.length) {
    console.log("\nHerramientas MCP:")
    for (const [name, n] of count(mcp.map((a) => a.tool))) console.log(`  ${String(n).padStart(4)}  ${name}`)
  }

  // Además de la herramienta de skills, cuenta quien lee un SKILL.md a mano.
  const skills = acciones.filter((a) => a.kind === "skill" || a.targets.some((t) => /SKILL\.md/.test(t)))
  if (skills.length) {
    console.log("\nSkills activadas o leídas:")
    for (const a of skills) console.log(`  ${corto(a.targets.map(relative).join(" · "), 120)}`)
  }

  console.log("\nTurnos:")
  lista.forEach((turno, i) => {
    const resumen = count(turno.acciones.map((a) => a.kind)).map(([k, n]) => `${k} ${n}`).join(", ")
    const t0 = Math.round((new Date(turno.ts) - first) / 1000)
    console.log(`  ${i + 1}. +${t0}s  ${corto(turno.prompt, 90) || "(prompt vacío)"}`)
    console.log(`       ${turno.acciones.length} herramientas${resumen ? ` (${resumen})` : ""}${turno.fallas.length ? `  ·  ${turno.fallas.length} con error` : ""}`)
    if (args.has("--timeline")) {
      for (const a of turno.acciones) {
        const t = Math.round((new Date(a.ts) - first) / 1000)
        console.log(`       +${String(t).padStart(4)}s  ${etiqueta(a).padEnd(18)} ${corto(rutas(a).join(" · "), 110)}`)
      }
      for (const f of turno.fallas) console.log(`       ✗ falló ${f.tool ?? ""} ${corto(f.error ?? "", 100)}`)
      if (turno.fin) console.log(`       ↳ ${corto(turno.fin, 160)}`)
    }
  })
}

if (!args.has("--todas") && keys.length > 1) {
  console.log(`\n(Hay ${keys.length} sesiones en el log. Usá --todas para verlas todas.)`)
}
