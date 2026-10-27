// Métricas de agentes: función pura (entradas del log, filtros, ahora) → MetricasAgentes.
// Sin IO. Define también qué sale del servidor: solo agregados y metadatos (Principio IV, spec 003 FR-002).
// Nunca se copian prompt, lastMessage, output, el texto de error ni el input crudo al resultado.
import type { AgenteLog, ConteoMetrica, EntradaLog, FiltrosMetricas, MetricasAgentes, PuntoLineaDeTiempo, SesionMetricas } from "@shared/types"
import { clasificar } from "../../scripts/agent-logs/clasificar.mjs"

const AGENTES: AgenteLog[] = ["claude", "codex", "cline"]
const PAUSA_MAX_MS = 5 * 60_000 // una pausa más larga no cuenta como tiempo activo
const HUERFANA_MS = 10 * 60_000 // una llamada sin Post de hace más que esto se da por interrumpida
const TOP = 10
const MAX_SESIONES = 50
const MAX_PUNTOS_LINEA = 500
const MAX_COMANDOS = 20

// Logs escritos antes de normalizar los eventos de Cline 3.x traen nombres en snake_case.
const EVENTOS_VIEJOS: Record<string, string> = {
  agent_start: "TaskStart",
  agent_resume: "TaskResume",
  agent_end: "TaskComplete",
  agent_abort: "TaskCancel",
  prompt_submit: "UserPromptSubmit",
  tool_call: "PreToolUse",
  tool_result: "PostToolUse",
}

const CIERRES = new Set(["Stop", "TaskComplete", "TaskCancel", "SessionEnd"])

type Evento = EntradaLog & { t: number; evento: string; agente: AgenteLog; clave: string }

type Llamada = { pre: Evento; id?: string }

type Opciones = { raiz: string; origen: string }

// ── Privacidad ──────────────────────────────────────────────────────────────

const normalizar = (ruta: string) => ruta.replaceAll("\\", "/")
const nombreDe = (ruta: string) => normalizar(ruta).split("/").filter(Boolean).at(-1) ?? ruta

/** Ruta relativa al repo; lo que cae afuera se muestra solo con su nombre. */
export function rutaPublica(ruta: string, raiz: string): string {
  const r = normalizar(ruta)
  const base = normalizar(raiz).replace(/\/$/, "")
  const esWindows = /^[A-Za-z]:/.test(base)
  const dentro = (esWindows ? r.toLowerCase() : r).startsWith(`${esWindows ? base.toLowerCase() : base}/`)
  if (dentro) return r.slice(base.length + 1)
  if (r === base) return "."
  const absoluta = r.startsWith("/") || r.startsWith("~") || /^[A-Za-z]:/.test(r)
  if (!absoluta && !r.startsWith("../")) return r.replace(/^\.\//, "")
  return `(fuera del repo)/${nombreDe(r)}`
}

const PATRONES_SECRETOS: [RegExp, string][] = [
  [/\bBearer\s+[^\s'"]+/gi, "Bearer [redactado]"],
  [/\bsk-[A-Za-z0-9_-]{6,}/g, "sk-[redactado]"],
  [/\b(gh[pousr]|github_pat)_[A-Za-z0-9_]{6,}/g, "$1_[redactado]"],
  [/\bAKIA[0-9A-Z]{16}\b/g, "AKIA[redactado]"],
  [/(--(?:token|password|secret|api-key)[= ])[^\s'"]+/gi, "$1[redactado]"],
  [/\b([A-Za-z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD|PASSWD)[A-Za-z0-9_]*=)[^\s'"]+/gi, "$1[redactado]"],
  [/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, "[email]"],
]

/** Tapa credenciales y emails de un comando para mostrarlo en el modo detalle. */
export function redactar(texto: string): string {
  return PATRONES_SECRETOS.reduce((t, [patron, reemplazo]) => t.replace(patron, reemplazo), texto)
}

// Subcomandos que se muestran junto al binario: nunca los argumentos.
const SUBCOMANDOS: Record<string, Set<string>> = {
  git: new Set(["status", "diff", "log", "add", "commit", "checkout", "switch", "branch", "push", "pull", "fetch", "merge", "rebase", "stash", "show"]),
  npm: new Set(["test", "install", "ci", "run", "start"]),
  npx: new Set(["vitest", "tsc", "eslint", "tsx", "vite", "prettier"]),
}
const SCRIPTS_NPM = new Set(["test", "lint", "typecheck", "build", "dev", "seed", "logs:resumen", "logs:limpiar"])

/** Binarios de una línea de shell, con subcomando de la lista blanca (`git status`, `npm run test`). */
export function binarioDe(comando: string): string[] {
  return comando
    .split(/&&|\|\||;|\||\n/)
    .map((segmento) => segmento.trim().split(/\s+/).filter((t) => !/^\w+=/.test(t)))
    .filter((tokens) => tokens[0] && tokens[0] !== "cd")
    .map(([primero, segundo, tercero]) => {
      const bin = nombreDe(primero).replace(/\.(exe|cmd|bat)$/i, "")
      if (!/^[\w.+-]+$/.test(bin)) return "(otro)"
      if (!SUBCOMANDOS[bin]?.has(segundo)) return bin
      if (bin === "npm" && segundo === "run") return SCRIPTS_NPM.has(tercero) ? `npm run ${tercero}` : "npm run"
      return `${bin} ${segundo}`
    })
}

// ── Utilidades ──────────────────────────────────────────────────────────────

export function percentil(valores: number[], p: number): number {
  if (valores.length === 0) return 0
  const orden = [...valores].sort((a, b) => a - b)
  return orden[Math.max(0, Math.ceil((p / 100) * orden.length) - 1)]
}

function contar<T>(items: T[], clave: (item: T) => string): ConteoMetrica[] {
  const mapa = new Map<string, number>()
  for (const item of items) mapa.set(clave(item), (mapa.get(clave(item)) ?? 0) + 1)
  return [...mapa.entries()].map(([nombre, n]) => ({ nombre, n })).sort((a, b) => b.n - a.n || a.nombre.localeCompare(b.nombre))
}

const idCorto = (sesion: string) => sesion.slice(0, 8)
const esPre = (e: Evento) => e.evento === "PreToolUse" && !!e.tool
const esPost = (e: Evento) => e.evento === "PostToolUse" || e.evento === "PostToolUseFailure"
const esPrompt = (e: Evento) => e.evento === "UserPromptSubmit" || (e.evento === "TaskStart" && e.prompt !== undefined)
const kindDe = (e: Evento) => e.kind ?? clasificar(e.tool, e.input).kind

/** Rutas, comandos o consultas de una llamada: del input si está, si no del `detail` que guardó el hook. */
function objetivos(e: Evento): string[] {
  const { targets } = clasificar(e.tool, e.input)
  if (targets.length > 0) return targets
  return e.detail ? e.detail.split(" · ") : []
}

function normalizarEntradas(entradas: EntradaLog[]): Evento[] {
  const eventos: Evento[] = []
  for (const entrada of entradas) {
    const t = Date.parse(String(entrada.ts))
    const agente = entrada.agent as AgenteLog
    if (Number.isNaN(t) || !AGENTES.includes(agente)) continue
    const evento = EVENTOS_VIEJOS[String(entrada.event)] ?? String(entrada.event)
    eventos.push({ ...entrada, t, evento, agente, clave: `${agente}:${entrada.session ?? "sin-sesion"}` })
  }
  return eventos.sort((a, b) => a.t - b.t)
}

// ── Una sesión ──────────────────────────────────────────────────────────────

type AnalisisSesion = {
  eventos: Evento[]
  resumen: SesionMetricas
  /** Llamadas con su resultado, para duraciones y fallas. */
  resultados: { pre?: Evento; post: Evento; durationMs?: number; falla: boolean }[]
  pendientes: Evento[]
  interrumpidas: Evento[]
  reportaFallas: boolean
}

function analizarSesion(eventos: Evento[], ahora: number): AnalisisSesion {
  const primero = eventos[0]
  const ultimo = eventos.at(-1)!
  const reportaFallas = primero.agente === "claude" || eventos.some((e) => e.success !== undefined)

  let activoMs = 0
  for (let i = 1; i < eventos.length; i++) {
    const salto = eventos[i].t - eventos[i - 1].t
    if (salto <= PAUSA_MAX_MS) activoMs += salto
  }

  // Empareja cada Pre con su Post: por toolUseId si lo hay; si no, el más antiguo de la misma herramienta.
  const pendientes: Llamada[] = []
  const interrumpidas: Evento[] = []
  const resultados: AnalisisSesion["resultados"] = []
  for (const e of eventos) {
    if (esPre(e)) {
      pendientes.push({ pre: e, id: e.toolUseId })
    } else if (esPost(e)) {
      const i = pendientes.findIndex((p) => (e.toolUseId ? p.id === e.toolUseId : !p.id && p.pre.tool === e.tool))
      const pre = i >= 0 ? pendientes.splice(i, 1)[0].pre : undefined
      const durationMs = e.durationMs ?? (pre && e.toolUseId ? e.t - pre.t : undefined)
      resultados.push({ pre, post: e, durationMs, falla: e.evento === "PostToolUseFailure" || e.success === false })
    } else if (CIERRES.has(e.evento) || esPrompt(e)) {
      interrumpidas.push(...pendientes.splice(0).map((p) => p.pre))
    }
  }
  const sinCerrar = pendientes.map((p) => p.pre)
  const enCurso = sinCerrar.filter((e) => ahora - e.t <= HUERFANA_MS)
  interrumpidas.push(...sinCerrar.filter((e) => ahora - e.t > HUERFANA_MS))

  const prompts = eventos.filter(esPrompt).length
  const turnosIds = new Set(eventos.map((e) => e.turn).filter(Boolean))
  const herramientas = eventos.filter(esPre).length
  const primerPrompt = eventos.findIndex(esPrompt)
  const sinPrompt = herramientas > 0 && (primerPrompt === -1 || eventos.findIndex(esPre) < primerPrompt)
  // Codex informa turn_id; en los demás cada prompt abre un turno (igual que logs:resumen).
  const turnos = primero.agente === "codex" && turnosIds.size > 0 ? turnosIds.size : prompts + (sinPrompt ? 1 : 0)

  return {
    eventos,
    reportaFallas,
    resultados,
    pendientes: enCurso,
    interrumpidas,
    resumen: {
      id: idCorto(String(primero.session ?? "sin-sesion")),
      agente: primero.agente,
      inicio: new Date(primero.t).toISOString(),
      duracionMs: ultimo.t - primero.t,
      activoMs,
      prompts,
      turnos,
      herramientas,
      fallas: reportaFallas ? resultados.filter((r) => r.falla).length : null,
      interrumpidas: interrumpidas.length,
      enCurso: enCurso.length > 0,
    },
  }
}

// ── Línea de tiempo ─────────────────────────────────────────────────────────

function lineaDeTiempo(a: AnalisisSesion): NonNullable<MetricasAgentes["lineaDeTiempo"]> {
  const inicio = a.eventos[0].t
  const fallidas = new Set(a.resultados.filter((r) => r.falla && r.pre).map((r) => r.pre))
  const puntos: PuntoLineaDeTiempo[] = []
  for (const e of a.eventos) {
    const t = e.t - inicio
    if (esPre(e)) puntos.push({ t, tipo: "herramienta", kind: kindDe(e), falla: fallidas.has(e) || undefined })
    else if (esPrompt(e)) puntos.push({ t, tipo: "prompt" })
    else if (CIERRES.has(e.evento) && e.evento !== "SessionEnd") puntos.push({ t, tipo: "fin" })
  }
  return { sesion: a.resumen.id, agente: a.resumen.agente, duracionMs: a.resumen.duracionMs, puntos: puntos.slice(0, MAX_PUNTOS_LINEA) }
}

// ── Eventos por tramo de tiempo ─────────────────────────────────────────────

function porTiempo(eventos: Evento[]): MetricasAgentes["porTiempo"] {
  if (eventos.length === 0) return { pasoMin: 1, puntos: [] }
  const rangoMin = (eventos.at(-1)!.t - eventos[0].t) / 60_000
  const pasoMin = rangoMin <= 180 ? 1 : rangoMin <= 24 * 60 ? 10 : 60
  const paso = pasoMin * 60_000
  const tramos = new Map<number, Partial<Record<AgenteLog, number>>>()
  for (const e of eventos) {
    const tramo = Math.floor(e.t / paso) * paso
    const fila = tramos.get(tramo) ?? {}
    fila[e.agente] = (fila[e.agente] ?? 0) + 1
    tramos.set(tramo, fila)
  }
  return {
    pasoMin,
    puntos: [...tramos.entries()].map(([t, porAgente]) => ({ t: new Date(t).toISOString(), porAgente })),
  }
}

// ── Cálculo principal ───────────────────────────────────────────────────────

export function calcularMetricas(entradas: EntradaLog[], filtros: FiltrosMetricas, ahora: Date, { raiz, origen }: Opciones): MetricasAgentes {
  const desde = filtros.ventanaMin ? ahora.getTime() - filtros.ventanaMin * 60_000 : -Infinity
  const visibles = normalizarEntradas(entradas).filter((e) => e.t >= desde && (!filtros.agente || e.agente === filtros.agente))

  const porSesion = new Map<string, Evento[]>()
  for (const e of visibles) porSesion.set(e.clave, [...(porSesion.get(e.clave) ?? []), e])
  const todas = [...porSesion.values()].map((eventos) => analizarSesion(eventos, ahora.getTime()))
  todas.sort((a, b) => b.eventos.at(-1)!.t - a.eventos.at(-1)!.t) // la más reciente primero

  const elegidas = filtros.sesion ? todas.filter((a) => a.resumen.id === filtros.sesion) : todas
  const eventos = elegidas.flatMap((a) => a.eventos)
  const llamadas = eventos.filter(esPre)
  const resultados = elegidas.flatMap((a) => a.resultados)
  const reportan = elegidas.filter((a) => a.reportaFallas)
  const llamadasQueReportan = reportan.reduce((n, a) => n + a.resumen.herramientas, 0)
  const fallas = reportan.length > 0 ? reportan.reduce((n, a) => n + (a.resumen.fallas ?? 0), 0) : null

  const archivos = (kind: string) =>
    contar(llamadas.filter((e) => kindDe(e) === kind).flatMap(objetivos), (r) => rutaPublica(r, raiz)).slice(0, TOP)
  const comandos = llamadas.filter((e) => kindDe(e) === "ejecutar").flatMap(objetivos)
  const lanzadas = llamadas.filter((e) => /^(agent|task)$/i.test(e.tool ?? ""))

  const porKind = new Map<string, number[]>()
  for (const r of resultados) {
    const kind = r.pre ? kindDe(r.pre) : kindDe(r.post)
    if (r.durationMs !== undefined && r.durationMs >= 0) porKind.set(kind, [...(porKind.get(kind) ?? []), r.durationMs])
  }

  const m: MetricasAgentes = {
    generado: ahora.toISOString(),
    origen,
    filtros,
    vacio: todas.length === 0,
    kpis: {
      sesiones: elegidas.length,
      prompts: elegidas.reduce((n, a) => n + a.resumen.prompts, 0),
      herramientas: llamadas.length,
      fallas,
      tasaFallas: fallas === null || llamadasQueReportan === 0 ? null : fallas / llamadasQueReportan,
      tiempoActivoMs: elegidas.reduce((n, a) => n + a.resumen.activoMs, 0),
      caracteresDevueltos: eventos.filter((e) => e.evento === "PostToolUse").reduce((n, e) => n + (e.outputChars ?? 0), 0),
      subagentesFinalizados: eventos.filter((e) => e.evento === "SubagentStop").length,
    },
    porTiempo: porTiempo(eventos),
    herramientas: contar(llamadas, (e) => `${e.tool}\u0000${kindDe(e)}`)
      .slice(0, TOP)
      .map(({ nombre, n }) => ({ nombre: nombre.split("\u0000")[0], kind: nombre.split("\u0000")[1], n })),
    acciones: [...contar(llamadas, (e) => `${e.agente}\u0000${kindDe(e)}`)].map(({ nombre, n }) => ({
      agente: nombre.split("\u0000")[0] as AgenteLog,
      kind: nombre.split("\u0000")[1],
      n,
    })),
    fallasPorHerramienta: contar(
      resultados.filter((r) => r.falla),
      (r) => r.post.tool ?? "(sin nombre)",
    ),
    duraciones: [...porKind.entries()]
      .map(([kind, valores]) => ({ kind, n: valores.length, p50Ms: percentil(valores, 50), p95Ms: percentil(valores, 95) }))
      .sort((a, b) => b.n - a.n),
    archivosLeidos: archivos("leer"),
    archivosEscritos: archivos("escribir"),
    binarios: contar(comandos.flatMap(binarioDe), (b) => b).slice(0, TOP),
    subagentes: contar(lanzadas, (e) => String((e.input as { subagent_type?: unknown } | undefined)?.subagent_type ?? "sin nombre")),
    skills: contar(
      llamadas.filter((e) => kindDe(e) === "skill" || objetivos(e).some((t) => /SKILL\.md/.test(t))),
      (e) => objetivos(e)[0]?.split(" ")[0].replace(/^.*[/\\]([^/\\]+)[/\\]SKILL\.md$/, "$1") ?? "(sin nombre)",
    ),
    mcp: contar(llamadas.filter((e) => kindDe(e) === "mcp"), (e) => e.tool ?? "mcp"),
    modelos: contar(eventos.filter((e) => e.model), (e) => `${e.agente}\u0000${e.model}`).map(({ nombre, n }) => ({
      agente: nombre.split("\u0000")[0] as AgenteLog,
      modelo: nombre.split("\u0000")[1],
      n,
    })),
    sesiones: todas.slice(0, MAX_SESIONES).map((a) => a.resumen),
    enCurso: elegidas.flatMap((a) =>
      a.pendientes.map((e) => ({
        agente: e.agente,
        sesion: a.resumen.id,
        herramienta: e.tool ?? "",
        kind: kindDe(e),
        desdeMs: ahora.getTime() - e.t,
      })),
    ),
    lineaDeTiempo: (filtros.sesion ? elegidas[0] : todas[0]) ? lineaDeTiempo((filtros.sesion ? elegidas[0] : todas[0])!) : null,
  }

  if (filtros.detalle) {
    m.comandosRecientes = llamadas
      .filter((e) => kindDe(e) === "ejecutar")
      .slice(-MAX_COMANDOS)
      .reverse()
      .map((e) => ({
        ts: new Date(e.t).toISOString(),
        agente: e.agente,
        comando: redactar(objetivos(e).join(" ").replaceAll(normalizar(raiz), ".")).replace(/\s+/g, " ").slice(0, 200),
      }))
  }
  return m
}
