import { appendFileSync, cpSync, mkdirSync, mkdtempSync } from "node:fs"
import type { AddressInfo } from "node:net"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { MetricasAgentes } from "@shared/types"
import { soloLoopback } from "../../../server/routes/metricas-agentes"
import { crearAppDePrueba } from "./helpers"

const AHORA_LOGS = new Date("2026-10-27T17:12:00.000Z")

/** Los logs de las fixtures se copian a un directorio temporal: ningún test escribe en logs/ ni en data/. */
function crearLogsDePrueba() {
  const logsDir = mkdtempSync(join(tmpdir(), "metricas-"))
  cpSync(join(process.cwd(), "tests", "server", "fixtures", "logs"), logsDir, { recursive: true })
  return logsDir
}

/** Un "home" temporal con las transcripciones de las fixtures: los tests nunca leen el ~ real. */
function crearHomeDePrueba(conTranscripciones = true) {
  const home = mkdtempSync(join(tmpdir(), "home-"))
  if (conTranscripciones) cpSync(join(process.cwd(), "tests", "server", "fixtures", "home"), home, { recursive: true })
  return home
}

function crear(extra: { logsDir?: string; homeDir?: string; intervaloPollingMs?: number } = {}) {
  const logsDir = extra.logsDir ?? crearLogsDePrueba()
  const homeDir = extra.homeDir ?? crearHomeDePrueba(false)
  const { app, api } = crearAppDePrueba([], {
    logsDir,
    metricas: { reloj: () => AHORA_LOGS, intervaloPollingMs: extra.intervaloPollingMs ?? 50, debounceMs: 10, homeDir },
  })
  return { app, api, logsDir, homeDir }
}

describe("GET /api/metricas-agentes", () => {
  it("devuelve las métricas de los tres agentes", async () => {
    const { api } = crear()
    const res = await api.get("/api/metricas-agentes")
    expect(res.status).toBe(200)
    const m = res.body as MetricasAgentes
    expect(m.origen).toBe("actual")
    expect(m.kpis.sesiones).toBe(3)
    expect(m.kpis.fallas).toBe(2)
    expect(m.comandosRecientes).toBeUndefined()
  })

  it("no expone prompts, salidas ni secretos", async () => {
    const { api } = crear()
    const texto = JSON.stringify((await api.get("/api/metricas-agentes?detalle=1")).body)
    for (const prohibido of ["PROMPT-UNICO", "LASTMSG", "sk-test-SECRETO", "ana@example.org", "salida-secreta", "persona"]) {
      expect(texto, prohibido).not.toContain(prohibido)
    }
  })

  it("aplica los filtros de agente, sesión y ventana", async () => {
    const { api } = crear()
    const porAgente = (await api.get("/api/metricas-agentes?agente=codex")).body as MetricasAgentes
    expect(porAgente.sesiones.map((s) => s.agente)).toEqual(["codex"])
    const porSesion = (await api.get("/api/metricas-agentes?sesion=bb76875c")).body as MetricasAgentes
    expect(porSesion.kpis.sesiones).toBe(1)
    const ventana = (await api.get("/api/metricas-agentes?ventana=8")).body as MetricasAgentes
    expect(ventana.sesiones.map((s) => s.agente)).toEqual(["claude"])
  })

  it("el modo detalle muestra comandos redactados", async () => {
    const { api } = crear()
    const m = (await api.get("/api/metricas-agentes?detalle=1")).body as MetricasAgentes
    expect(m.comandosRecientes?.length).toBeGreaterThan(0)
    expect(JSON.stringify(m.comandosRecientes)).toContain("Bearer [redactado]")
  })

  it("sin logs responde vacío (no es un error)", async () => {
    const { api } = crear({ logsDir: join(mkdtempSync(join(tmpdir(), "vacio-")), "no-existe") })
    const res = await api.get("/api/metricas-agentes")
    expect(res.status).toBe(200)
    expect(res.body.vacio).toBe(true)
  })

  it.each([
    ["agente=gemini", /agente/i],
    ["ventana=abc", /ventana/i],
    ["ventana=0", /ventana/i],
    ["sesion=../x", /sesión/i],
    ["origen=archivo/../..", /origen/i],
    ["origen=otro", /origen/i],
  ])("400 con %s", async (consulta, mensaje) => {
    const { api } = crear()
    const res = await api.get(`/api/metricas-agentes?${consulta}`)
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(mensaje)
  })
})

describe("tokens, modelos y costo", () => {
  it("sin transcripciones los tokens son n/d (null), no ceros", async () => {
    const { api } = crear()
    const m = (await api.get("/api/metricas-agentes")).body as MetricasAgentes
    expect(m.tokens.disponible).toBe(false)
    expect(m.tokens.total).toBeNull()
    expect(m.tokens.costo.usd).toBeNull()
    expect(m.sesiones.every((s) => s.tokens === null && s.costoUsd === null)).toBe(true)
  })

  it("lee las transcripciones de Claude, Codex y Cline y calcula el costo con la tabla del repo", async () => {
    const { api } = crear({ homeDir: crearHomeDePrueba() })
    const m = (await api.get("/api/metricas-agentes")).body as MetricasAgentes
    expect(m.tokens.total).toEqual({ entrada: 6060, salida: 1490, cacheLectura: 11300, cacheEscritura: 2900 })
    expect(m.tokens.costo.usd).toBeCloseTo(0.01875, 10)
    expect(m.tokens.costo.parcial).toBe(true)
    const claude = m.sesiones.find((s) => s.agente === "claude")!
    expect(claude.modelos).toEqual(["claude-sonnet-5-5", "claude-haiku-4-5-20251001", "claude-mystery-1"])
    expect(claude.cambiosDeModelo).toBe(2)
    expect(m.tokens.porModelo.find((f) => f.modelo === "gpt-5-codex")?.costoUsd).toBeCloseTo(0.0026, 10)
    expect(m.tokens.porModelo.find((f) => f.modelo === "desconocido")?.costoUsd).toBeNull()
  })

  it("filtra los tokens por agente", async () => {
    const { api } = crear({ homeDir: crearHomeDePrueba() })
    const m = (await api.get("/api/metricas-agentes?agente=cline")).body as MetricasAgentes
    expect(m.tokens.total).toEqual({ entrada: 4000, salida: 500, cacheLectura: 5500, cacheEscritura: 500 })
  })

  it("usa el transcriptPath que guardó el hook y el modelo que informó (Cline no lo guarda en su archivo)", async () => {
    const logsDir = mkdtempSync(join(tmpdir(), "metricas-"))
    const home = crearHomeDePrueba()
    const tareas = join(home, "otra-carpeta", "tasks", "tarea-9")
    mkdirSync(tareas, { recursive: true })
    cpSync(join(home, ".cline", "data", "tasks", "1761584400000", "ui_messages.json"), join(tareas, "ui_messages.json"))
    mkdirSync(join(logsDir, "cline"))
    appendFileSync(
      join(logsDir, "cline", "tarea-9.jsonl"),
      JSON.stringify({ ts: "2026-10-27T17:03:20Z", agent: "cline", event: "TaskStart", session: "tarea-9", prompt: "x", model: "claude-sonnet-5-5", transcriptPath: join(tareas, "ui_messages.json") }) + "\n",
    )
    const { api } = crear({ logsDir, homeDir: home })
    const m = (await api.get("/api/metricas-agentes")).body as MetricasAgentes
    expect(m.sesiones[0].modelos).toEqual(["claude-sonnet-5-5"])
    expect(m.sesiones[0].tokens?.entrada).toBe(4000)
    expect(m.sesiones[0].costoUsd).not.toBeNull()
  })

  it("no expone contenido de las transcripciones ni rutas del equipo", async () => {
    const home = crearHomeDePrueba()
    const { api } = crear({ homeDir: home })
    const texto = JSON.stringify((await api.get("/api/metricas-agentes?detalle=1")).body)
    for (const prohibido of ["CONTENIDO-SECRETO", home, ".claude", ".codex", ".cline", "ui_messages", "transcript"]) expect(texto, prohibido).not.toContain(prohibido)
  })
})

describe("orígenes archivados", () => {
  it("lista 'actual' y las carpetas de logs/archivo, y permite leer una", async () => {
    const logsDir = crearLogsDePrueba()
    const carpeta = join(logsDir, "archivo", "2026-10-20T10-00-00-000Z", "claude")
    mkdirSync(carpeta, { recursive: true })
    appendFileSync(join(carpeta, "vieja.jsonl"), JSON.stringify({ ts: "2026-10-20T10:00:00Z", agent: "claude", event: "UserPromptSubmit", session: "vieja123" }) + "\n")
    const { api } = crear({ logsDir })

    const origenes = (await api.get("/api/metricas-agentes/origenes")).body as { id: string }[]
    expect(origenes.map((o) => o.id)).toEqual(["actual", "archivo/2026-10-20T10-00-00-000Z"])

    const archivada = (await api.get("/api/metricas-agentes?origen=archivo/2026-10-20T10-00-00-000Z")).body as MetricasAgentes
    expect(archivada.sesiones.map((s) => s.id)).toEqual(["vieja123"])
    const actual = (await api.get("/api/metricas-agentes")).body as MetricasAgentes
    expect(actual.sesiones.map((s) => s.id)).not.toContain("vieja123")
  })
})

describe("acceso solo desde loopback", () => {
  function correr(remoteAddress: string | undefined) {
    let status = 0
    let cuerpo: unknown
    let siguio = false
    const res = { status: (s: number) => ({ json: (c: unknown) => ((status = s), (cuerpo = c)) }) }
    soloLoopback({ socket: { remoteAddress } } as never, res as never, () => (siguio = true))
    return { status, cuerpo, siguio }
  }

  it.each(["127.0.0.1", "::1", "::ffff:127.0.0.1"])("deja pasar %s", (ip) => {
    expect(correr(ip).siguio).toBe(true)
  })

  it.each(["192.168.1.20", "10.0.0.5", "::ffff:192.168.1.20", undefined])("403 para %s", (ip) => {
    const r = correr(ip)
    expect(r.siguio).toBe(false)
    expect(r.status).toBe(403)
    expect(r.cuerpo).toEqual({ error: expect.any(String) })
  })
})

describe("GET /api/metricas-agentes/eventos (SSE)", () => {
  async function conectar(app: ReturnType<typeof crear>["app"], consulta = "") {
    const servidor = app.listen(0, "127.0.0.1")
    await new Promise((r) => servidor.once("listening", r))
    const { port } = servidor.address() as AddressInfo
    const abortar = new AbortController()
    const res = await fetch(`http://127.0.0.1:${port}/api/metricas-agentes/eventos${consulta}`, { signal: abortar.signal })
    const lector = res.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ""
    /** Espera el próximo evento `metricas` del stream. */
    async function siguiente(): Promise<MetricasAgentes> {
      for (;;) {
        const fin = buffer.indexOf("\n\n")
        if (fin >= 0) {
          const bloque = buffer.slice(0, fin)
          buffer = buffer.slice(fin + 2)
          const datos = bloque.split("\n").find((l) => l.startsWith("data: "))
          if (bloque.includes("event: metricas") && datos) return JSON.parse(datos.slice(6)) as MetricasAgentes
          continue
        }
        const { value, done } = await lector.read()
        if (done) throw new Error("el stream se cerró")
        buffer += decoder.decode(value, { stream: true })
      }
    }
    const cerrar = async () => {
      abortar.abort()
      servidor.closeAllConnections()
      await new Promise((r) => servidor.close(r))
    }
    return { res, siguiente, cerrar }
  }

  it("manda el estado inicial y un evento nuevo cuando el hook agrega una línea", async () => {
    const { app, logsDir } = crear()
    const sse = await conectar(app)
    try {
      expect(sse.res.headers.get("content-type")).toContain("text/event-stream")
      const inicial = await sse.siguiente()
      expect(inicial.kpis.herramientas).toBe(17)

      appendFileSync(
        join(logsDir, "claude", "bb76875c-d528-5a9e-9c40-c1ba18725474.jsonl"),
        JSON.stringify({ ts: "2026-10-27T17:11:00Z", agent: "claude", event: "PreToolUse", session: "bb76875c-d528-5a9e-9c40-c1ba18725474", tool: "Bash", kind: "ejecutar", toolUseId: "nuevo" }) + "\n",
      )
      let siguiente = await sse.siguiente()
      while (siguiente.kpis.herramientas === 17) siguiente = await sse.siguiente()
      expect(siguiente.kpis.herramientas).toBe(18)
      expect(siguiente.enCurso).toHaveLength(1)
    } finally {
      await sse.cerrar()
    }
  })

  it("manda un evento nuevo cuando solo crece la transcripción (sin líneas nuevas en el log de los hooks)", async () => {
    const home = crearHomeDePrueba()
    const { app } = crear({ homeDir: home })
    const sse = await conectar(app)
    try {
      const inicial = await sse.siguiente()
      expect(inicial.tokens.total?.salida).toBe(1490)
      appendFileSync(
        join(home, ".claude", "projects", "-work-repo", "bb76875c-d528-5a9e-9c40-c1ba18725474.jsonl"),
        JSON.stringify({ type: "assistant", timestamp: "2026-10-27T17:11:00Z", message: { id: "msg_vivo", model: "claude-sonnet-5-5", usage: { input_tokens: 1, output_tokens: 10 } } }) + "\n",
      )
      let siguiente = await sse.siguiente()
      while (siguiente.tokens.total?.salida === 1490) siguiente = await sse.siguiente()
      expect(siguiente.tokens.total?.salida).toBe(1500)
    } finally {
      await sse.cerrar()
    }
  })

  it("responde 400 con filtros inválidos, sin abrir el stream", async () => {
    const { api } = crear()
    for (const consulta of ["agente=x", "origen=archivo/no-existe"]) {
      const res = await api.get(`/api/metricas-agentes/eventos?${consulta}`)
      expect(res.status, consulta).toBe(400)
    }
  })
})
