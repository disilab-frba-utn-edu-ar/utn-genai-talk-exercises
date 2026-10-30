import { readFileSync } from "node:fs"
import { join } from "node:path"
import type { TablaPrecios, UsoTokens } from "../../../tipos"
import { buscarPrecio, costoDe, crearParserCodex, usoDeLineaClaude, usosDeCline } from "../../../server/domain/uso-tokens"
import precios from "../../../precios-modelos.json"

const HOME = join(process.cwd(), "metricas", "tests", "server", "fixtures", "home")
const lineas = (ruta: string) => readFileSync(join(HOME, ruta), "utf-8").split("\n").filter(Boolean).map((l) => JSON.parse(l))
const CLAUDE = ".claude/projects/-work-repo/bb76875c-d528-5a9e-9c40-c1ba18725474.jsonl"
const CODEX = ".codex/sessions/2026/10/27/rollout-2026-10-27T17-01-40-019a-codex-sesion-1.jsonl"
const TABLA = precios as TablaPrecios

describe("Claude Code: usage de la transcripción", () => {
  it("toma modelo, tokens y timestamp de las líneas assistant", () => {
    const usos = lineas(CLAUDE).map((l) => usoDeLineaClaude(l, "s1")).filter(Boolean)
    const m1 = usos[0]!
    expect(m1.id).toBe("msg_1")
    expect(m1.uso).toEqual({
      ts: "2026-10-27T17:00:02.000Z",
      agente: "claude",
      sesion: "s1",
      modelo: "claude-sonnet-5-5",
      entrada: 100,
      salida: 200,
      cacheLectura: 1000,
      cacheEscritura5m: 0,
      cacheEscritura1h: 2000,
    })
  })

  it("las líneas de usuario y adjuntos no producen uso", () => {
    expect(usoDeLineaClaude({ type: "user", message: { role: "user", content: "hola" } }, "s")).toBeUndefined()
    expect(usoDeLineaClaude({ type: "attachment" }, "s")).toBeUndefined()
    expect(usoDeLineaClaude("basura", "s")).toBeUndefined()
  })

  it("sin desglose, la escritura de caché cuenta como de 5 minutos", () => {
    const uso = usoDeLineaClaude({ type: "assistant", timestamp: "2026-10-27T17:00:00Z", message: { id: "x", model: "m", usage: { input_tokens: 1, output_tokens: 2, cache_creation_input_tokens: 400 } } }, "s")!.uso
    expect(uso).toMatchObject({ cacheEscritura5m: 400, cacheEscritura1h: 0, cacheLectura: 0 })
  })

  it("ignora los mensajes sintéticos o sin tokens", () => {
    const base = { type: "assistant", timestamp: "2026-10-27T17:00:00Z" }
    expect(usoDeLineaClaude({ ...base, message: { id: "a", model: "<synthetic>", usage: { input_tokens: 5, output_tokens: 5 } } }, "s")).toBeUndefined()
    expect(usoDeLineaClaude({ ...base, message: { id: "b", model: "m", usage: { input_tokens: 0, output_tokens: 0 } } }, "s")).toBeUndefined()
    expect(usoDeLineaClaude({ ...base, message: { id: "c", model: "m" } }, "s")).toBeUndefined()
  })

  it("un modelo con texto raro no se muestra: queda sin modelo", () => {
    const uso = usoDeLineaClaude({ type: "assistant", timestamp: "2026-10-27T17:00:00Z", message: { id: "x", model: "CONTENIDO SECRETO con espacios", usage: { input_tokens: 1, output_tokens: 1 } } }, "s")!.uso
    expect(uso.modelo).toBeUndefined()
  })
})

describe("Codex CLI: rollout", () => {
  const usos = () => {
    const parsear = crearParserCodex("019a-codex-sesion-1")
    return lineas(CODEX).map(parsear).filter(Boolean) as UsoTokens[]
  }

  it("usa el delta de last_token_usage y el modelo del turn_context activo", () => {
    expect(usos().map((u) => [u.modelo, u.entrada, u.cacheLectura, u.salida])).toEqual([
      ["gpt-5-codex", 200, 800, 50], // input 1000 incluye 800 de caché: entrada no cacheada = 200
      ["gpt-5-codex", 500, 1000, 100],
      ["gpt-5.1-codex", 200, 0, 20], // cambió el modelo en el segundo turno
    ])
  })

  it("ignora los token_count repetidos y los que no traen info", () => {
    expect(usos()).toHaveLength(3)
  })

  it("sin last_token_usage calcula el delta con la diferencia de los acumulados", () => {
    const parsear = crearParserCodex("s")
    const total = (i: number, c: number, o: number) => ({ input_tokens: i, cached_input_tokens: c, output_tokens: o, reasoning_output_tokens: 0, total_tokens: i + o })
    const ev = (ts: string, info: object) => ({ timestamp: ts, type: "event_msg", payload: { type: "token_count", info } })
    parsear(ev("2026-10-27T17:00:00Z", { total_token_usage: total(100, 0, 10) }))
    const segundo = parsear(ev("2026-10-27T17:00:05Z", { total_token_usage: total(300, 100, 40) }))!
    expect(segundo).toMatchObject({ entrada: 100, cacheLectura: 100, salida: 30 })
  })

  it("sin turn_context el modelo queda indefinido", () => {
    const uso = crearParserCodex("s")({ timestamp: "2026-10-27T17:00:00Z", type: "event_msg", payload: { type: "token_count", info: { last_token_usage: { input_tokens: 10, output_tokens: 1 } } } })!
    expect(uso.modelo).toBeUndefined()
  })
})

describe("Cline: ui_messages.json", () => {
  const mensajes = JSON.parse(readFileSync(join(HOME, ".cline/data/tasks/1761584400000/ui_messages.json"), "utf-8"))

  it("lee los api_req_started con tokens y saltea los que todavía no terminaron", () => {
    const usos = usosDeCline(mensajes, "1761584400000", "modelo-x")
    expect(usos).toHaveLength(2)
    expect(usos[0]).toMatchObject({ agente: "cline", sesion: "1761584400000", modelo: "modelo-x", entrada: 3000, salida: 400, cacheLectura: 1500, cacheEscritura5m: 500 })
    expect(usos[1]).toMatchObject({ entrada: 1000, salida: 100, cacheLectura: 4000, cacheEscritura5m: 0 })
    expect(usos[0].ts).toBe("2026-10-27T17:03:22.500Z")
  })

  it("también entiende nombres alternativos y no se rompe con datos inesperados", () => {
    const usos = usosDeCline([{ ts: 1_761_584_400_000, say: "api_req_started", text: JSON.stringify({ inputTokens: 7, outputTokens: 3 }) }, { say: "api_req_started", text: "no es json" }, null, 5], "s")
    expect(usos).toHaveLength(1)
    expect(usos[0]).toMatchObject({ entrada: 7, salida: 3, modelo: undefined })
    expect(usosDeCline({ no: "array" }, "s")).toEqual([])
  })
})

describe("precios y costo", () => {
  const uso = (extra: Partial<UsoTokens>): UsoTokens => ({ ts: "2026-10-27T17:00:00Z", agente: "claude", sesion: "s", modelo: "claude-sonnet-5-5", entrada: 0, salida: 0, cacheLectura: 0, cacheEscritura5m: 0, cacheEscritura1h: 0, ...extra })

  it("la tabla anota fecha, fuente oficial y moneda", () => {
    expect(TABLA.actualizado).toBe("2026-10-27")
    expect(TABLA.moneda).toBe("USD")
    expect(TABLA.fuentes[0]).toMatchObject({ proveedor: "Anthropic", url: "https://platform.claude.com/docs/en/about-claude/pricing" })
    for (const m of TABLA.modelos) expect(m.entrada).toBeGreaterThan(0)
    for (const m of TABLA.modelos) expect(TABLA.fuentes.map((f) => f.proveedor), m.id).toContain(m.proveedor)
  })

  it("calcula el costo con entrada, salida y los dos tipos de escritura de caché", () => {
    const c = costoDe(uso({ entrada: 100, salida: 200, cacheLectura: 1000, cacheEscritura1h: 2000 }), TABLA)!
    expect(c).toBeCloseTo(0.0103, 10) // 100*2 + 200*10 + 1000*0.1 + 2000*4, por millón
    expect(costoDe(uso({ modelo: "claude-haiku-4-5-20251001", entrada: 1000, salida: 500, cacheEscritura5m: 400 }), TABLA)).toBeCloseTo(0.004, 10)
  })

  it("acepta el sufijo de fecha pero no confunde modelos parecidos", () => {
    expect(buscarPrecio("claude-haiku-4-5-20251001", TABLA)?.id).toBe("claude-haiku-4-5")
    expect(buscarPrecio("claude-haiku-4-5-latest", TABLA)?.id).toBe("claude-haiku-4-5")
    expect(buscarPrecio("claude-sonnet-5-5", TABLA)?.id).toBe("claude-sonnet-5-5")
    expect(buscarPrecio("claude-sonnet-5", TABLA)).toBeUndefined()
    expect(buscarPrecio("claude-sonnet-4-5-6", TABLA)).toBeUndefined()
  })

  it("entiende las fechas de OpenAI, el prefijo de proveedor y los puntos que usa Cline", () => {
    expect(buscarPrecio("gpt-5-2025-08-07", TABLA)?.id).toBe("gpt-5")
    expect(buscarPrecio("gpt-5.1-codex", TABLA)?.id).toBe("gpt-5.1-codex")
    expect(buscarPrecio("anthropic/claude-sonnet-4.5", TABLA)?.id).toBe("claude-sonnet-4-5")
    expect(buscarPrecio("openai/gpt-5-codex", TABLA)?.id).toBe("gpt-5-codex")
    expect(buscarPrecio("GPT-5-Codex", TABLA)?.id).toBe("gpt-5-codex")
  })

  it("no confunde modelos con el mismo comienzo", () => {
    expect(buscarPrecio("gpt-5-codex-mini", TABLA)).toBeUndefined()
    expect(buscarPrecio("gpt-5-mini", TABLA)?.id).toBe("gpt-5-mini")
    expect(buscarPrecio("gpt-5.1-codex-mini", TABLA)?.id).toBe("gpt-5.1-codex-mini")
    expect(buscarPrecio("gemini-2.5-flash-lite", TABLA)?.id).toBe("gemini-2.5-flash-lite")
    expect(buscarPrecio("gemini-2.5-flash", TABLA)?.id).toBe("gemini-2.5-flash")
  })

  it("un modelo que no está en la tabla (o no informa modelo) tiene costo n/d, nunca 0", () => {
    expect(costoDe(uso({ modelo: "gpt-5.3-codex", entrada: 1000 }), TABLA)).toBeNull() // precio sin confirmar: no se cargó
    expect(costoDe(uso({ modelo: "modelo-inventado", entrada: 1000 }), TABLA)).toBeNull()
    expect(costoDe(uso({ modelo: undefined, entrada: 1000 }), TABLA)).toBeNull()
  })

  it("incluye los modelos de OpenAI (Codex) y Gemini con su fuente oficial", () => {
    expect(TABLA.fuentes.map((f) => f.proveedor)).toEqual(expect.arrayContaining(["Anthropic", "OpenAI", "Google"]))
    for (const f of TABLA.fuentes) {
      expect(f.url).toMatch(/^https:\/\//)
      expect(f.consultado).toBe("2026-10-27")
    }
    expect(costoDe(uso({ modelo: "gpt-5-codex", entrada: 1e6, cacheLectura: 1e6, salida: 1e6 }), TABLA)).toBeCloseTo(1.25 + 0.125 + 10, 10)
    expect(costoDe(uso({ modelo: "gpt-5.2-codex", entrada: 1e6, salida: 1e6 }), TABLA)).toBeCloseTo(1.75 + 14, 10)
    expect(costoDe(uso({ modelo: "gemini-2.5-pro", entrada: 100_000, salida: 10_000 }), TABLA)).toBeCloseTo((100_000 * 1.25 + 10_000 * 10) / 1e6, 10)
    expect(costoDe(uso({ modelo: "gemini-2.5-pro", entrada: 300_000, salida: 10_000 }), TABLA)).toBeCloseTo((300_000 * 2.5 + 10_000 * 15) / 1e6, 10) // prompt de más de 200 mil
    expect(costoDe(uso({ modelo: "gemini-2.5-flash", entrada: 1000, cacheLectura: 500 }), TABLA)).toBeNull() // sin precio de caché confirmado
  })

  it("el precio superior de gpt-5.5 rige desde los 272 mil tokens de prompt", () => {
    expect(costoDe(uso({ modelo: "gpt-5.5", entrada: 100_000, salida: 1000 }), TABLA)).toBeCloseTo((100_000 * 5 + 1000 * 30) / 1e6, 10)
    expect(costoDe(uso({ modelo: "gpt-5.5", entrada: 300_000, salida: 1000 }), TABLA)).toBeCloseTo((300_000 * 10 + 1000 * 45) / 1e6, 10)
  })

  it("los modelos sin precio confirmado en la fuente oficial no figuran en la tabla", () => {
    for (const id of ["gpt-5.3-codex", "gpt-5.1-codex-max", "gpt-5.5-pro", "gemini-3.8-flash"]) expect(buscarPrecio(id, TABLA), id).toBeUndefined()
  })

  it("si falta el precio de un tipo de token que se usó, no se inventa: n/d", () => {
    const tabla: TablaPrecios = { ...TABLA, modelos: [{ id: "m", nombre: "m", proveedor: "x", entrada: 1, salida: 2 }] }
    expect(costoDe(uso({ modelo: "m", entrada: 10, salida: 10 }), tabla)).toBeCloseTo(0.00003, 10)
    expect(costoDe(uso({ modelo: "m", entrada: 10, cacheLectura: 5 }), tabla)).toBeNull()
  })

  it("aplica el precio superior cuando el prompt pasa el umbral", () => {
    const corto = costoDe(uso({ modelo: "claude-haiku-5-5", entrada: 50_000, salida: 1000 }), TABLA)!
    expect(corto).toBeCloseTo((50_000 * 0.1 + 1000 * 0.5) / 1e6, 10)
    const largo = costoDe(uso({ modelo: "claude-haiku-5-5", entrada: 120_000, salida: 1000 }), TABLA)!
    expect(largo).toBeCloseTo((120_000 * 0.5 + 1000 * 2.5) / 1e6, 10)
  })
})
