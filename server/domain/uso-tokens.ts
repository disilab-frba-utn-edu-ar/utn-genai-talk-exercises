// Uso de tokens: convierte las líneas de las transcripciones de cada agente en `UsoTokens` y calcula el costo.
// Función pura, sin IO. De esos archivos solo se leen modelo, tokens y timestamp: nunca el contenido de los mensajes.
// Los nombres de campo confirmados y los supuestos están en specs/003-dashboard-agentes/spec.md.
import type { PreciosPorTramo, PrecioModelo, TablaPrecios, UsoTokens } from "@shared/types"

type Objeto = Record<string, unknown>
const esObjeto = (valor: unknown): valor is Objeto => typeof valor === "object" && valor !== null && !Array.isArray(valor)
const numero = (valor: unknown) => (typeof valor === "number" && Number.isFinite(valor) && valor > 0 ? valor : 0)

/** Primer campo numérico presente entre varios nombres posibles (donde la doc no confirma el nombre). */
const primerNumero = (objeto: Objeto, nombres: string[]) => numero(objeto[nombres.find((n) => typeof objeto[n] === "number") ?? ""])

function fechaISO(valor: unknown): string | undefined {
  if (typeof valor !== "string" && typeof valor !== "number") return undefined
  const fecha = new Date(valor)
  return Number.isNaN(fecha.getTime()) ? undefined : fecha.toISOString()
}

/** El modelo viene de un archivo ajeno: solo se acepta algo con forma de id de modelo. */
function modeloLimpio(valor: unknown): string | undefined {
  return typeof valor === "string" && /^[A-Za-z0-9][\w.:/@+-]{0,79}$/.test(valor) ? valor : undefined
}

const sinTokens = (u: UsoTokens) => u.entrada + u.salida + u.cacheLectura + u.cacheEscritura5m + u.cacheEscritura1h === 0

// ── Claude Code ─────────────────────────────────────────────────────────────

/**
 * Línea de la transcripción de Claude Code (`transcript_path`). Solo `type: "assistant"` trae `message.usage`.
 * Una misma respuesta aparece en varias líneas (una por bloque de contenido) con el mismo `message.id`:
 * quien lee el archivo deduplica por ese id.
 */
export function usoDeLineaClaude(linea: unknown, sesion: string): { id: string; uso: UsoTokens } | undefined {
  if (!esObjeto(linea) || linea.type !== "assistant" || !esObjeto(linea.message) || !esObjeto(linea.message.usage)) return undefined
  const { message } = linea
  const usage = message.usage as Objeto
  if (message.model === "<synthetic>") return undefined
  const ts = fechaISO(linea.timestamp)
  if (!ts) return undefined

  // Con desglose por duración de la caché; sin él, todo cuenta como escritura de 5 minutos.
  const desglose = esObjeto(usage.cache_creation) ? usage.cache_creation : undefined
  const escritura1h = desglose ? numero(desglose.ephemeral_1h_input_tokens) : 0
  const escritura5m = desglose ? numero(desglose.ephemeral_5m_input_tokens) : numero(usage.cache_creation_input_tokens)

  const uso: UsoTokens = {
    ts,
    agente: "claude",
    sesion,
    modelo: modeloLimpio(message.model),
    entrada: numero(usage.input_tokens),
    salida: numero(usage.output_tokens),
    cacheLectura: numero(usage.cache_read_input_tokens),
    cacheEscritura5m: escritura5m,
    cacheEscritura1h: escritura1h,
  }
  if (sinTokens(uso)) return undefined
  const id = typeof message.id === "string" ? message.id : typeof linea.requestId === "string" ? linea.requestId : ts
  return { id, uso }
}

// ── Codex CLI ───────────────────────────────────────────────────────────────

type TokenUsageCodex = { input: number; cached: number; output: number; total: number }

function usoCodex(valor: unknown): TokenUsageCodex | undefined {
  if (!esObjeto(valor)) return undefined
  const input = numero(valor.input_tokens)
  const output = numero(valor.output_tokens)
  return { input, cached: numero(valor.cached_input_tokens), output, total: numero(valor.total_tokens) || input + output }
}

/**
 * Parser con estado para un rollout de Codex: el modelo lo da el último `turn_context` y los
 * `token_count` son acumulados (y a veces se repiten), así que se usa el delta y se ignoran los repetidos.
 * `cached_input_tokens` está incluido en `input_tokens`: la entrada no cacheada es la diferencia.
 */
export function crearParserCodex(sesion: string) {
  let modelo: string | undefined
  let anterior: TokenUsageCodex | undefined
  return (linea: unknown): UsoTokens | undefined => {
    if (!esObjeto(linea) || !esObjeto(linea.payload)) return undefined
    const { payload } = linea
    if (linea.type === "turn_context") {
      modelo = modeloLimpio(payload.model) ?? modelo
      return undefined
    }
    if (linea.type !== "event_msg" || payload.type !== "token_count" || !esObjeto(payload.info)) return undefined

    const total = usoCodex(payload.info.total_token_usage)
    if (total && anterior && total.total === anterior.total) return undefined // el mismo evento repetido
    const ultimo = usoCodex(payload.info.last_token_usage)
    const delta =
      ultimo ??
      (total ? { input: total.input - (anterior?.input ?? 0), cached: total.cached - (anterior?.cached ?? 0), output: total.output - (anterior?.output ?? 0), total: 0 } : undefined)
    if (total) anterior = total
    const ts = fechaISO(linea.timestamp)
    if (!delta || !ts) return undefined

    const uso: UsoTokens = {
      ts,
      agente: "codex",
      sesion,
      modelo,
      entrada: Math.max(0, delta.input - delta.cached),
      salida: Math.max(0, delta.output), // los tokens de razonamiento ya van dentro de la salida
      cacheLectura: Math.max(0, delta.cached),
      cacheEscritura5m: 0,
      cacheEscritura1h: 0,
    }
    return sinTokens(uso) ? undefined : uso
  }
}

// ── Cline ───────────────────────────────────────────────────────────────────

/** `ui_messages.json` es un array; en `say: "api_req_started"` el `text` es un JSON con los tokens de la solicitud. */
export function usosDeCline(mensajes: unknown, sesion: string, modelo?: string): UsoTokens[] {
  if (!Array.isArray(mensajes)) return []
  const usos: UsoTokens[] = []
  for (const mensaje of mensajes) {
    if (!esObjeto(mensaje) || mensaje.say !== "api_req_started" || typeof mensaje.text !== "string") continue
    let datos: unknown
    try {
      datos = JSON.parse(mensaje.text)
    } catch {
      continue
    }
    const ts = fechaISO(mensaje.ts)
    if (!esObjeto(datos) || !ts) continue
    const uso: UsoTokens = {
      ts,
      agente: "cline",
      sesion,
      modelo: modeloLimpio(modelo),
      entrada: primerNumero(datos, ["tokensIn", "tokens_in", "inputTokens", "input_tokens"]),
      salida: primerNumero(datos, ["tokensOut", "tokens_out", "outputTokens", "output_tokens"]),
      cacheLectura: primerNumero(datos, ["cacheReads", "cache_reads", "cacheReadTokens", "cache_read_input_tokens"]),
      cacheEscritura5m: primerNumero(datos, ["cacheWrites", "cache_writes", "cacheWriteTokens", "cache_creation_input_tokens"]),
      cacheEscritura1h: 0,
    }
    if (!sinTokens(uso)) usos.push(uso) // una solicitud que todavía no terminó no trae tokens
  }
  return usos
}

// ── Precios ─────────────────────────────────────────────────────────────────

/** El id de la tabla coincide con el modelo, con o sin sufijo de fecha (`-20251001`) o `-latest`. */
export function buscarPrecio(modelo: string | undefined, tabla: TablaPrecios): PrecioModelo | undefined {
  if (!modelo) return undefined
  return tabla.modelos.find((m) => new RegExp(`^${m.id.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}(-\\d{8}|-latest)?$`).test(modelo))
}

/** Costo estimado en USD a precio de lista; null si el modelo o algún tipo de token usado no tiene precio (nunca 0). */
export function costoDe(uso: UsoTokens, tabla: TablaPrecios): number | null {
  const precio = buscarPrecio(uso.modelo, tabla)
  if (!precio) return null
  const prompt = uso.entrada + uso.cacheLectura + uso.cacheEscritura5m + uso.cacheEscritura1h
  const p: PreciosPorTramo = precio.umbralPrompt !== undefined && precio.superior && prompt > precio.umbralPrompt ? precio.superior : precio

  const partes: [number, number | undefined][] = [
    [uso.entrada, p.entrada],
    [uso.salida, p.salida],
    [uso.cacheLectura, p.cacheLectura],
    [uso.cacheEscritura5m, p.cacheEscritura5m],
    [uso.cacheEscritura1h, p.cacheEscritura1h],
  ]
  let total = 0
  for (const [tokens, porMillon] of partes) {
    if (tokens === 0) continue
    if (porMillon === undefined) return null
    total += (tokens * porMillon) / 1e6
  }
  return total
}
