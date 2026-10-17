#!/usr/bin/env node
// Registra cada evento de hook de un agente de código en logs/agent-actions.jsonl.
//
// Uso (lo invocan los hooks, no hace falta correrlo a mano):
//   node scripts/agent-logs/log-hook.mjs <agente> [evento]
//
// - <agente>: claude | codex | cline
// - [evento]: opcional; si no viene, se toma del JSON recibido por stdin.
//
// El script NUNCA bloquea al agente: ante cualquier error sale con código 0.
// Para Cline imprime {"cancel": false} por stdout, que es lo que espera su hook.

import { appendFileSync, mkdirSync, readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const [, , agent = "desconocido", eventArg] = process.argv

const scriptDir = dirname(fileURLToPath(import.meta.url))
const projectDir = resolve(scriptDir, "..", "..")
const logDir = process.env.AGENT_LOG_DIR ?? join(projectDir, "logs")
const logFile = join(logDir, "agent-actions.jsonl")

// Límite de caracteres para entradas/salidas de herramientas: el objetivo es
// observar qué hace el agente, no duplicar archivos enteros en el log.
const MAX_CHARS = Number(process.env.AGENT_LOG_MAX_CHARS ?? 2000)

function readStdin() {
  try {
    return readFileSync(0, "utf-8")
  } catch {
    return ""
  }
}

function truncate(value) {
  if (value === undefined || value === null) return undefined
  const text = typeof value === "string" ? value : JSON.stringify(value)
  if (text.length <= MAX_CHARS) return value
  return `${text.slice(0, MAX_CHARS)}… [+${text.length - MAX_CHARS} caracteres]`
}

// Cada agente manda un payload con forma distinta. Lo llevamos a un formato común.
function normalize(payload) {
  // Cline anida los datos del evento bajo una clave con el nombre del hook
  // (preToolUse, postToolUse, userPromptSubmit, taskStart, ...).
  const nested =
    payload.preToolUse ??
    payload.postToolUse ??
    payload.userPromptSubmit ??
    payload.taskStart ??
    payload.taskResume ??
    payload.taskComplete ??
    payload.taskCancel ??
    payload.preCompact ??
    {}

  const event = eventArg ?? payload.hook_event_name ?? payload.hookName ?? "desconocido"
  const tool = payload.tool_name ?? nested.toolName ?? nested.tool ?? undefined
  const input = payload.tool_input ?? nested.parameters ?? undefined
  const output = payload.tool_response ?? nested.result ?? undefined
  const prompt = payload.prompt ?? nested.prompt ?? undefined

  return {
    ts: new Date().toISOString(),
    agent,
    event,
    session: payload.session_id ?? payload.taskId ?? undefined,
    turn: payload.turn_id ?? undefined,
    model: payload.model ?? undefined,
    tool,
    input: truncate(input),
    output: truncate(output),
    success: nested.success ?? undefined,
    durationMs: nested.executionTimeMs ?? undefined,
    prompt: truncate(prompt),
    lastMessage: truncate(payload.last_assistant_message ?? undefined),
    source: payload.source ?? undefined,
    reason: payload.reason ?? undefined,
  }
}

try {
  const raw = readStdin()
  let payload = {}
  try {
    payload = raw.trim() ? JSON.parse(raw) : {}
  } catch {
    payload = { unparsed: raw }
  }

  const entry = normalize(payload)
  if (process.env.AGENT_LOG_RAW === "1") entry.raw = payload

  mkdirSync(logDir, { recursive: true })
  appendFileSync(logFile, JSON.stringify(entry) + "\n", "utf-8")
} catch (error) {
  // Nunca interrumpir al agente por un problema del logger.
  process.stderr.write(`[agent-logs] no se pudo registrar el evento: ${error}\n`)
}

if (agent === "cline") {
  process.stdout.write(JSON.stringify({ cancel: false }))
}
process.exit(0)
