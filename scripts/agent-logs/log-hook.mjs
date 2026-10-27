#!/usr/bin/env node
// Registra cada evento de hook de un agente de código en logs/<agente>/<sesión>.jsonl
// (una carpeta por provider y un archivo por sesión).
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
import { adelgazar, clasificar } from "./clasificar.mjs"

const [, , agent = "desconocido", eventArg] = process.argv

const scriptDir = dirname(fileURLToPath(import.meta.url))
const projectDir = resolve(scriptDir, "..", "..")
const logDir = process.env.AGENT_LOG_DIR ?? join(projectDir, "logs")

// Los ids de sesión vienen del agente: se limpian para usarlos como nombre de archivo.
const safeName = (value) => String(value ?? "").replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 120) || "sin-sesion"

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

// Las salidas de herramientas se guardan como extracto: la evidencia es qué se hizo, no el volcado completo.
const OUTPUT_CHARS = Number(process.env.AGENT_LOG_OUTPUT_CHARS ?? 400)

function excerpt(text) {
  if (!text) return undefined
  return text.length <= OUTPUT_CHARS ? text : `${text.slice(0, OUTPUT_CHARS)}… [+${text.length - OUTPUT_CHARS} caracteres]`
}

// Claude agrega bloques <system-reminder> (CLAUDE.md, git status, skills) al prompt: no son lo que escribió la persona.
function limpiarPrompt(prompt) {
  if (typeof prompt !== "string") return prompt
  return prompt.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, "").trim()
}

// Cline 3.x ejecuta los hooks de .clinerules/hooks/ pero manda el evento con otro
// nombre (hookName en snake_case). Lo llevamos al vocabulario de Claude Code para
// que el log y logs:resumen traten igual a todos los agentes.
const CLINE_EVENTS = {
  agent_start: "TaskStart",
  agent_resume: "TaskResume",
  agent_end: "TaskComplete",
  agent_abort: "TaskCancel",
  agent_error: "TaskError",
  prompt_submit: "UserPromptSubmit",
  tool_call: "PreToolUse",
  tool_result: "PostToolUse",
  session_shutdown: "SessionEnd",
}

// Devuelve el primer valor que exista. Sirve para campos que cada agente nombra distinto
// o que la documentación no confirma: probamos los nombres posibles y, si no está, queda undefined.
const primerDefinido = (...valores) => valores.find((valor) => valor !== undefined && valor !== null)

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

  const rawEvent = eventArg ?? payload.hook_event_name ?? payload.hookName ?? "desconocido"
  const event = CLINE_EVENTS[rawEvent] ?? rawEvent
  const tool = payload.tool_name ?? nested.toolName ?? nested.tool ?? undefined
  const input = payload.tool_input ?? nested.parameters ?? undefined
  const output = payload.tool_response ?? nested.result ?? undefined
  const prompt = payload.prompt ?? nested.prompt ?? nested.taskMetadata?.initialTask ?? undefined
  // Id de la llamada: empareja cada PreToolUse con su PostToolUse (hay llamadas en paralelo).
  // Claude y Codex mandan tool_use_id; Cline no lo documenta, así que probamos varios nombres.
  const toolUseId = primerDefinido(payload.tool_use_id, nested.toolUseId, nested.toolCallId, nested.callId, nested.id)
  const model = primerDefinido(payload.model, payload.modelId, nested.model, nested.modelId, nested.taskMetadata?.model)

  // Solo lo importante: la llamada (con su input adelgazado) se guarda en PreToolUse y
  // el resultado en PostToolUse sin repetir el input, con un extracto corto de la salida.
  const { kind, op, detail } = tool ? clasificar(tool, input) : {}
  const esResultado = event === "PostToolUse"
  const outputText = output === undefined || output === null ? undefined : typeof output === "string" ? output : JSON.stringify(output)
  const sinSalida = kind === "leer" || kind === "escribir" || kind === "skill"

  return {
    ts: new Date().toISOString(),
    agent,
    event,
    session: payload.session_id ?? payload.taskId ?? undefined,
    turn: primerDefinido(payload.turn_id, payload.prompt_id), // Codex: turn_id · Claude: prompt_id
    model,
    subagent: payload.agent_type ?? undefined, // solo si el hook corre dentro de un subagente (o con --agent)
    subagentId: payload.agent_id ?? undefined,
    toolUseId,
    tool,
    kind,
    op,
    detail: detail || undefined,
    input: esResultado ? undefined : truncate(adelgazar(input)),
    output: sinSalida ? undefined : excerpt(outputText),
    outputChars: esResultado ? outputText?.length : undefined,
    error: truncate(payload.error ?? undefined),
    success: nested.success ?? undefined, // Cline; en Claude la falla es el evento PostToolUseFailure
    interrupted: payload.is_interrupt ?? undefined,
    durationMs: payload.duration_ms ?? nested.executionTimeMs ?? undefined,
    prompt: truncate(limpiarPrompt(prompt)),
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

  const agentDir = join(logDir, safeName(agent))
  mkdirSync(agentDir, { recursive: true })
  appendFileSync(join(agentDir, `${safeName(entry.session)}.jsonl`), JSON.stringify(entry) + "\n", "utf-8")
} catch (error) {
  // Nunca interrumpir al agente por un problema del logger.
  process.stderr.write(`[agent-logs] no se pudo registrar el evento: ${error}\n`)
}

if (agent === "cline") {
  process.stdout.write(JSON.stringify({ cancel: false }))
}
process.exit(0)
