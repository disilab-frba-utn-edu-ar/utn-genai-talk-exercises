import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import type { EntradaLog, FiltrosMetricas, TablaPrecios, UsoTokens } from "../../../tipos"
import precios from "../../../precios-modelos.json"
import { crearParserCodex, usoDeLineaClaude, usosDeCline } from "../../../server/domain/uso-tokens"
import { binarioDe, calcularMetricas, percentil, redactar, rutaPublica } from "../../../server/domain/metricas-agentes"

const FIXTURES = join(process.cwd(), "metricas", "tests", "server", "fixtures", "logs")
const RAIZ = "/work/repo"
const AHORA = new Date("2026-10-27T17:12:00.000Z") // pasadas las tres sesiones de las fixtures

function fixture(agente: string): EntradaLog[] {
  const dir = join(FIXTURES, agente)
  return readdirSync(dir).flatMap((f) =>
    readFileSync(join(dir, f), "utf-8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as EntradaLog),
  )
}
const TODAS = [...fixture("claude"), ...fixture("codex"), ...fixture("cline")]
const calcular = (entradas: EntradaLog[] = TODAS, filtros: FiltrosMetricas = {}, ahora = AHORA, usos: UsoTokens[] = []) =>
  calcularMetricas(entradas, filtros, ahora, { raiz: RAIZ, origen: "actual", usos, precios: precios as TablaPrecios })

/** Los usos de tokens de las tres transcripciones de fixtures/home (se parsean igual que en producción). */
function usosDeFixtures(): UsoTokens[] {
  const HOME = join(FIXTURES, "..", "home")
  const jsonl = (ruta: string) => readFileSync(join(HOME, ruta), "utf-8").split("\n").filter(Boolean).map((l) => JSON.parse(l))
  const vistos = new Set<string>()
  const claude = jsonl(".claude/projects/-work-repo/bb76875c-d528-5a9e-9c40-c1ba18725474.jsonl")
    .map((l) => usoDeLineaClaude(l, "bb76875c-d528-5a9e-9c40-c1ba18725474"))
    .filter((r) => r && !vistos.has(r.id) && vistos.add(r.id))
    .map((r) => r!.uso)
  const parsear = crearParserCodex("019a-codex-sesion-1")
  const codex = jsonl(".codex/sessions/2026/10/27/rollout-2026-10-27T17-01-40-019a-codex-sesion-1.jsonl").map(parsear).filter(Boolean) as UsoTokens[]
  const cline = usosDeCline(JSON.parse(readFileSync(join(HOME, ".cline/data/tasks/1761584400000/ui_messages.json"), "utf-8")), "1761584400000")
  return [...claude, ...codex, ...cline]
}
const USOS = usosDeFixtures()

describe("calcularMetricas: KPIs y sesiones", () => {
  it("sin entradas devuelve el estado vacío", () => {
    const m = calcular([])
    expect(m.vacio).toBe(true)
    expect(m.kpis).toMatchObject({ sesiones: 0, prompts: 0, herramientas: 0, fallas: null, tasaFallas: null })
  })

  it("cuenta sesiones, prompts y herramientas de los tres agentes", () => {
    const m = calcular()
    expect(m.kpis.sesiones).toBe(3)
    expect(m.kpis.prompts).toBe(2 + 2 + 1) // Claude 2, Codex 2, Cline: TaskStart con prompt
    expect(m.kpis.herramientas).toBe(10 + 3 + 4) // Claude 10, Codex 3, Cline 4 (ver desglose por sesión)
  })

  it("desglosa por sesión con el id acortado a 8 caracteres", () => {
    const { sesiones } = calcular()
    const claude = sesiones.find((s) => s.agente === "claude")!
    expect(claude.id).toBe("bb76875c")
    expect(claude).toMatchObject({ prompts: 2, turnos: 2, herramientas: 10, fallas: 1 })
    const codex = sesiones.find((s) => s.agente === "codex")!
    expect(codex).toMatchObject({ prompts: 2, turnos: 2, herramientas: 3 })
    const cline = sesiones.find((s) => s.agente === "cline")!
    expect(cline).toMatchObject({ prompts: 1, turnos: 1, herramientas: 4, fallas: 1 })
  })

  it("Codex no reporta fallas: es null, nunca 0", () => {
    const m = calcular(fixture("codex"))
    expect(m.kpis.fallas).toBeNull()
    expect(m.kpis.tasaFallas).toBeNull()
    expect(m.sesiones[0].fallas).toBeNull()
    expect(m.fallasPorHerramienta).toEqual([])
  })

  it("la tasa de fallas solo considera a los agentes que reportan", () => {
    const m = calcular()
    expect(m.kpis.fallas).toBe(2) // 1 de Claude (PostToolUseFailure) + 1 de Cline (success false)
    expect(m.kpis.tasaFallas).toBeCloseTo(2 / (10 + 4))
  })

  it("el tiempo activo descuenta las pausas de más de 5 minutos", () => {
    const claude = calcular(fixture("claude")).sesiones[0]
    expect(claude.duracionMs).toBe(641_000)
    expect(claude.activoMs).toBe(641_000 - 600_000) // la pausa de 30 s a 630 s no cuenta
  })

  it("suma los caracteres devueltos al modelo", () => {
    expect(calcular(fixture("cline")).kpis.caracteresDevueltos).toBe(500 + 800 + 20 + 90)
  })

  it("entiende los nombres viejos en snake_case de Cline", () => {
    const viejo: EntradaLog[] = [
      { ts: "2026-10-27T17:00:00Z", agent: "cline", event: "agent_start", session: "z", prompt: "x" },
      { ts: "2026-10-27T17:00:01Z", agent: "cline", event: "tool_call", session: "z", tool: "read_file", input: { path: "a.ts" } },
      { ts: "2026-10-27T17:00:02Z", agent: "cline", event: "tool_result", session: "z", tool: "read_file", success: true },
    ]
    const m = calcular(viejo)
    expect(m.kpis).toMatchObject({ prompts: 1, herramientas: 1 })
    expect(m.sesiones[0].enCurso).toBe(false)
  })

  it("ignora entradas sin fecha válida", () => {
    expect(calcular([{ event: "PreToolUse", tool: "Bash" }, { ts: "no-es-fecha", agent: "claude" }]).vacio).toBe(true)
  })
})

describe("calcularMetricas: herramientas, acciones y duraciones", () => {
  it("ordena las herramientas más usadas y guarda su tipo", () => {
    const top = calcular().herramientas
    expect(top[0]).toMatchObject({ nombre: "Bash", kind: "ejecutar", n: 4 })
    expect(top.length).toBeLessThanOrEqual(10)
  })

  it("agrupa las acciones por agente y tipo (Bash, exec_command y execute_command son 'ejecutar')", () => {
    const acciones = calcular().acciones
    const ejecutar = (a: string) => acciones.find((x) => x.agente === a && x.kind === "ejecutar")?.n
    expect(ejecutar("claude")).toBe(4)
    expect(ejecutar("codex")).toBe(2)
    expect(ejecutar("cline")).toBe(1)
  })

  it("cuenta las fallas por herramienta", () => {
    const fallas = calcular().fallasPorHerramienta
    expect(fallas).toEqual(expect.arrayContaining([{ nombre: "Bash", n: 1 }, { nombre: "write_to_file", n: 1 }]))
  })

  it("empareja Pre y Post por toolUseId para calcular la duración de Codex", () => {
    const d = calcular(fixture("codex")).duraciones
    const ejecutar = d.find((x) => x.kind === "ejecutar")!
    expect(ejecutar.n).toBe(1)
    expect(ejecutar.p50Ms).toBe(800)
  })

  it("calcula p50 y p95 por tipo con la duración que informa el agente", () => {
    const leer = calcular(fixture("claude")).duraciones.find((x) => x.kind === "leer")!
    expect(leer).toMatchObject({ n: 2, p50Ms: 30, p95Ms: 50 })
  })

  it("percentil usa el método del rango más cercano", () => {
    expect(percentil([10, 20, 30, 40], 50)).toBe(20)
    expect(percentil([10, 20, 30, 40], 95)).toBe(40)
    expect(percentil([], 50)).toBe(0)
  })
})

describe("calcularMetricas: tiempo", () => {
  it("agrupa los eventos por minuto y por agente", () => {
    const { porTiempo } = calcular()
    expect(porTiempo.pasoMin).toBe(1)
    const total = porTiempo.puntos.reduce((s, p) => s + Object.values(p.porAgente).reduce((a, b) => a + (b ?? 0), 0), 0)
    expect(total).toBe(TODAS.length)
    expect(porTiempo.puntos[0].t).toBe("2026-10-27T17:00:00.000Z")
  })

  it("usa tramos más largos cuando el rango es grande", () => {
    const largo: EntradaLog[] = [
      { ts: "2026-10-27T10:00:00Z", agent: "claude", event: "SessionStart", session: "a" },
      { ts: "2026-10-27T17:00:00Z", agent: "claude", event: "Stop", session: "a" },
    ]
    expect(calcular(largo).porTiempo.pasoMin).toBe(10)
  })

  it("con varias sesiones, el paso sale del rango completo y los tramos van en orden", () => {
    // Las sesiones llegan con la más reciente primero: sin ordenar, la línea iba y volvía en diagonal.
    const dosSesiones: EntradaLog[] = [
      { ts: "2026-10-27T10:00:00Z", agent: "claude", event: "SessionStart", session: "vieja" },
      { ts: "2026-10-27T10:05:00Z", agent: "claude", event: "Stop", session: "vieja" },
      { ts: "2026-10-30T10:00:00Z", agent: "cline", event: "SessionStart", session: "nueva" },
      { ts: "2026-10-30T10:05:00Z", agent: "cline", event: "Stop", session: "nueva" },
    ]
    const { porTiempo } = calcular(dosSesiones)
    expect(porTiempo.pasoMin).toBe(60)
    expect(porTiempo.puntos.map((p) => p.t)).toEqual(["2026-10-27T10:00:00.000Z", "2026-10-30T10:00:00.000Z"])
  })

  it("la ventana descarta lo anterior", () => {
    const m = calcular(TODAS, { ventanaMin: 8 }, new Date("2026-10-27T17:12:00.000Z")) // desde las 17:04
    expect(m.sesiones.map((s) => s.agente)).toEqual(["claude"])
  })
})

describe("calcularMetricas: turnos", () => {
  it("Codex cuenta turnos por turn_id y Claude/Cline por prompt", () => {
    const s = calcular().sesiones
    expect(s.find((x) => x.agente === "codex")!.turnos).toBe(2)
    expect(s.find((x) => x.agente === "claude")!.turnos).toBe(2)
  })

  it("las herramientas antes de cualquier prompt abren un turno", () => {
    const m = calcular([
      { ts: "2026-10-27T17:00:00Z", agent: "claude", event: "PreToolUse", session: "q", tool: "Bash", kind: "ejecutar" },
    ])
    expect(m.sesiones[0]).toMatchObject({ prompts: 0, turnos: 1 })
  })
})

describe("calcularMetricas: en curso e interrumpidas", () => {
  it("una llamada sin Post de una sesión reciente está en curso", () => {
    const entradas: EntradaLog[] = [
      { ts: "2026-10-27T17:11:50Z", agent: "claude", event: "PreToolUse", session: "abcdefgh1", tool: "Bash", kind: "ejecutar", toolUseId: "z1", detail: "SECRETO npm test" },
    ]
    const m = calcular(entradas)
    expect(m.enCurso).toEqual([{ agente: "claude", sesion: "abcdefgh", herramienta: "Bash", kind: "ejecutar", desdeMs: 10_000 }])
    expect(m.sesiones[0].enCurso).toBe(true)
  })

  it("una llamada sin Post seguida de un Stop cuenta como interrumpida", () => {
    const m = calcular(fixture("codex"))
    expect(m.sesiones[0].interrumpidas).toBe(1) // call_3 nunca terminó
    expect(m.enCurso).toEqual([])
  })

  it("una llamada vieja sin Post se considera interrumpida, no en curso", () => {
    const m = calcular(
      [{ ts: "2026-10-27T16:00:00Z", agent: "claude", event: "PreToolUse", session: "w", tool: "Bash", kind: "ejecutar" }],
    )
    expect(m.enCurso).toEqual([])
    expect(m.sesiones[0].interrumpidas).toBe(1)
  })

  it("las llamadas en paralelo se emparejan por toolUseId", () => {
    const m = calcular(fixture("claude"))
    expect(m.sesiones[0].interrumpidas).toBe(0)
    expect(m.enCurso).toEqual([])
  })
})

describe("calcularMetricas: archivos, comandos, subagentes, skills y modelos", () => {
  it("las rutas son relativas al repo y las externas no muestran el usuario", () => {
    const m = calcular()
    expect(m.archivosLeidos.map((a) => a.nombre)).toEqual(expect.arrayContaining(["server/app.ts", "shared/types.ts", "(fuera del repo)/notas.txt"]))
    expect(m.archivosEscritos.map((a) => a.nombre)).toEqual(
      expect.arrayContaining(["server/app.ts", "server/domain/horarios.ts", "server/domain/nuevo.ts", "notas/nueva.md"]),
    )
  })

  it("cuenta binarios de shell con subcomandos de la lista blanca, nunca argumentos", () => {
    const nombres = calcular().binarios.map((b) => b.nombre)
    expect(nombres).toEqual(expect.arrayContaining(["git status", "npm test", "npm run lint", "ls", "curl", "git diff"]))
    expect(nombres.join(" ")).not.toMatch(/Authorization|sk-|api\.example/)
  })

  it("cuenta subagentes lanzados, skills y subagentes finalizados", () => {
    const m = calcular()
    expect(m.subagentes).toEqual([{ nombre: "Explore", n: 1 }])
    expect(m.skills).toEqual([{ nombre: "speckit-plan", n: 1 }])
    expect(m.kpis.subagentesFinalizados).toBe(2) // uno de Claude y uno de Codex
  })

  it("lista el modelo solo si el agente lo informa", () => {
    expect(calcular().modelos).toEqual([{ agente: "codex", modelo: "gpt-5-codex", n: expect.any(Number) }])
  })
})

describe("calcularMetricas: filtros y línea de tiempo", () => {
  it("filtra por agente", () => {
    const m = calcular(TODAS, { agente: "cline" })
    expect(m.sesiones.map((s) => s.agente)).toEqual(["cline"])
    expect(m.kpis.sesiones).toBe(1)
  })

  it("filtra por sesión sin perder la lista de sesiones para el selector", () => {
    const m = calcular(TODAS, { sesion: "bb76875c" })
    expect(m.kpis.sesiones).toBe(1)
    expect(m.kpis.prompts).toBe(2)
    expect(m.sesiones).toHaveLength(3)
  })

  it("arma la línea de tiempo de la sesión elegida (o la última) con fallas marcadas", () => {
    const m = calcular(TODAS, { sesion: "bb76875c" })
    expect(m.lineaDeTiempo).toMatchObject({ sesion: "bb76875c", agente: "claude", duracionMs: 641_000 })
    const puntos = m.lineaDeTiempo!.puntos
    expect(puntos.filter((p) => p.tipo === "prompt")).toHaveLength(2)
    expect(puntos.filter((p) => p.falla)).toHaveLength(1)
    expect(calcular().lineaDeTiempo?.agente).toBe("claude") // sin sesión elegida: la de actividad más reciente
  })
})

describe("privacidad: lo que sale del servidor", () => {
  const PROHIBIDOS = [
    "sk-test-SECRETO",
    "SECRETO",
    "ana@example.org",
    "PROMPT-UNICO-CLAUDE",
    "PROMPT-UNICO-CODEX",
    "PROMPT-UNICO-CLINE",
    "LASTMSG-UNICO",
    "salida-secreta",
    "Unauthorized",
    "Authorization",
    "Users/",
    "Users\\\\",
    "persona",
    "api.example.org",
    "Bearer",
  ]

  it("el snapshot serializado no contiene prompts, salidas, errores, secretos ni rutas personales", () => {
    const texto = JSON.stringify(calcular())
    for (const p of PROHIBIDOS) expect(texto, p).not.toContain(p)
  })

  it("tampoco con el modo detalle: los comandos salen redactados", () => {
    const m = calcular(TODAS, { detalle: true })
    const texto = JSON.stringify(m)
    for (const p of PROHIBIDOS.filter((p) => !["api.example.org", "Authorization", "Bearer"].includes(p))) expect(texto, p).not.toContain(p)
    expect(m.comandosRecientes?.some((c) => c.comando.includes("curl"))).toBe(true)
  })

  it("sin detalle no hay comandos", () => {
    expect(calcular().comandosRecientes).toBeUndefined()
  })

  it("los comandos del modo detalle no incluyen la raíz del repo", () => {
    const m = calcular([{ ts: "2026-10-27T17:00:00Z", agent: "claude", event: "PreToolUse", session: "s", tool: "Bash", kind: "ejecutar", input: { command: "cat /work/repo/package.json" } }], { detalle: true })
    expect(m.comandosRecientes?.[0].comando).toBe("cat ./package.json")
  })
})

describe("redactar", () => {
  it.each([
    ["curl -H 'Authorization: Bearer abc.def-123' x", "Bearer [redactado]"],
    ["echo sk-ant-api03-abcDEF123456", "sk-[redactado]"],
    ["git push https://ghp_abcdefghijklmnop123@github.com/x", "ghp_[redactado]"],
    ["mail ana@example.org", "[email]"],
    ["cli --token=abc123 --otro", "--token=[redactado]"],
    ["cli --token abc123", "--token [redactado]"],
    ["API_KEY=abc123 node x", "API_KEY=[redactado]"],
    ["PASSWORD=hunter2", "PASSWORD=[redactado]"],
  ])("%s", (entrada, esperado) => {
    expect(redactar(entrada)).toContain(esperado)
    expect(redactar(entrada)).not.toMatch(/abc123|hunter2|abcDEF|ghp_abcdef|ana@/)
  })

  it("deja intacto un comando común", () => {
    expect(redactar("npm run test -- --run")).toBe("npm run test -- --run")
  })
})

describe("rutaPublica y binarioDe", () => {
  it.each([
    ["/work/repo/server/app.ts", "server/app.ts"],
    ["../otro/x.ts", "(fuera del repo)/x.ts"],
    ["./client/src/App.tsx", "client/src/App.tsx"],
    ["data/mentoras.json", "data/mentoras.json"],
    ["/etc/hosts", "(fuera del repo)/hosts"],
    ["C:\\Users\\persona\\x\\y.txt", "(fuera del repo)/y.txt"],
    ["~/.codex/config.toml", "(fuera del repo)/config.toml"],
  ])("%s → %s", (entrada, esperado) => {
    expect(rutaPublica(entrada, RAIZ)).toBe(esperado)
  })

  it("normaliza las barras de Windows cuando la raíz es de Windows", () => {
    expect(rutaPublica("C:\\work\\repo\\server\\app.ts", "C:\\work\\repo")).toBe("server/app.ts")
  })

  it.each([
    ["git status -sb", ["git status"]],
    ["cd x && npm run test", ["npm run test"]],
    ["npm run algo-raro", ["npm run"]],
    ["FOO=1 npx vitest run | head", ["npx vitest", "head"]],
    ["C:\\nodejs\\node.exe script.js", ["node"]],
    ["git rm secreto", ["git"]],
    ["$(curl x)", ["(otro)"]],
    ["python3 - <<'E'\nimport json\nprint(1); const x = 2\nE\nls", ["python3", "ls"]],
    ["git commit -m \"a; b | c && d\"", ["git commit"]],
    ["echo 'x; rm -rf y' | head", ["echo", "head"]],
  ])("binarioDe(%s)", (comando, esperado) => {
    expect(binarioDe(comando)).toEqual(esperado)
  })
})

describe("calcularMetricas: tokens, modelos y costo", () => {
  const m = () => calcular(TODAS, {}, AHORA, USOS)

  it("sin transcripciones los tokens son n/d (null), nunca 0", () => {
    const sin = calcular()
    expect(sin.tokens).toMatchObject({ disponible: false, total: null, costo: { usd: null, parcial: false, sinPrecio: [] }, porModelo: [], cambiosDeModelo: [] })
    expect(sin.sesiones.every((s) => s.tokens === null && s.costoUsd === null)).toBe(true)
  })

  it("suma entrada, salida y caché de los tres agentes (la respuesta repetida de Claude cuenta una vez)", () => {
    expect(m().tokens.total).toEqual({ entrada: 6060, salida: 1490, cacheLectura: 11300, cacheEscritura: 2900 })
    expect(m().tokens.disponible).toBe(true)
  })

  it("serie por tramo y por agente, con el desglose por tipo", () => {
    const { porTiempo } = m().tokens
    expect(porTiempo.pasoMin).toBe(1)
    expect(porTiempo.puntos[0]).toMatchObject({ t: "2026-10-27T17:00:00.000Z", porAgente: { claude: 6450 } })
    const total = porTiempo.puntos.reduce((n, p) => n + Object.values(p.porAgente).reduce((a, b) => a + (b ?? 0), 0), 0)
    expect(total).toBe(6060 + 1490 + 11300 + 2900)
    const porTipo = porTiempo.puntos.reduce((n, p) => n + p.porTipo.salida, 0)
    expect(porTipo).toBe(1490)
  })

  it("desglosa por sesión: tokens, modelos usados y cambios de modelo", () => {
    const { sesiones } = m()
    const claude = sesiones.find((s) => s.agente === "claude")!
    expect(claude.tokens).toEqual({ entrada: 1160, salida: 820, cacheLectura: 4000, cacheEscritura: 2400 })
    expect(claude.modelos).toEqual(["claude-sonnet-5-5", "claude-haiku-4-5-20251001", "claude-mystery-1"])
    expect(claude.cambiosDeModelo).toBe(2)
    const codex = sesiones.find((s) => s.agente === "codex")!
    expect(codex.modelos).toEqual(["gpt-5-codex", "gpt-5.1-codex"])
    expect(codex.cambiosDeModelo).toBe(1)
    const cline = sesiones.find((s) => s.agente === "cline")!
    expect(cline.modelos).toEqual(["desconocido"])
    expect(cline.cambiosDeModelo).toBe(0)
  })

  it("lista cada cambio de modelo dentro de una sesión", () => {
    expect(m().tokens.cambiosDeModelo.filter((c) => c.agente === "claude")).toEqual([
      { sesion: "bb76875c", agente: "claude", t: "2026-10-27T17:01:10.000Z", de: "claude-sonnet-5-5", a: "claude-haiku-4-5-20251001" },
      { sesion: "bb76875c", agente: "claude", t: "2026-10-27T17:10:35.000Z", de: "claude-haiku-4-5-20251001", a: "claude-mystery-1" },
    ])
  })

  it("el costo se calcula por modelo con la tabla; sin precio es n/d y el total queda parcial", () => {
    const { porModelo, costo } = m().tokens
    const fila = (modelo: string) => porModelo.find((f) => f.modelo === modelo)!
    expect(fila("claude-sonnet-5-5")).toMatchObject({ agente: "claude", solicitudes: 2, entrada: 150, salida: 300, cacheLectura: 4000, cacheEscritura: 2000 })
    expect(fila("claude-sonnet-5-5").costoUsd).toBeCloseTo(0.0117, 10)
    expect(fila("claude-haiku-4-5-20251001").costoUsd).toBeCloseTo(0.004, 10)
    for (const sinPrecio of ["claude-mystery-1", "desconocido"]) expect(fila(sinPrecio).costoUsd, sinPrecio).toBeNull()
    expect(fila("gpt-5-codex").costoUsd).toBeCloseTo(0.0026, 10) // (200+500)*1.25 + (800+1000)*0.125 + 150*10, por millón
    expect(fila("gpt-5.1-codex").costoUsd).toBeCloseTo(0.00045, 10)
    expect(costo.usd).toBeCloseTo(0.0157 + 0.00305, 10)
    expect(costo.parcial).toBe(true)
    expect(costo.sinPrecio.sort()).toEqual(["claude-mystery-1", "desconocido"])
  })

  it("el costo por sesión es n/d si ningún modelo de la sesión tiene precio", () => {
    const { sesiones } = m()
    const cline = sesiones.find((s) => s.agente === "cline")!
    expect(cline.costoUsd).toBeNull() // su modelo no se conoce
    expect(cline.costoParcial).toBe(false)
    const codex = sesiones.find((s) => s.agente === "codex")!
    expect(codex.costoUsd).toBeCloseTo(0.00305, 10)
    expect(codex.costoParcial).toBe(false)
    const claude = sesiones.find((s) => s.agente === "claude")!
    expect(claude.costoUsd).toBeCloseTo(0.0157, 10)
    expect(claude.costoParcial).toBe(true)
  })

  it("si todos los modelos tienen precio el total no es parcial", () => {
    const soloSonnet = USOS.filter((u) => u.modelo === "claude-sonnet-5-5")
    const { costo } = calcular(TODAS, {}, AHORA, soloSonnet).tokens
    expect(costo).toMatchObject({ parcial: false, sinPrecio: [] })
    expect(costo.usd).toBeCloseTo(0.0117, 10)
  })

  it("los filtros de agente, sesión y ventana también valen para los tokens", () => {
    expect(calcular(TODAS, { agente: "codex" }, AHORA, USOS).tokens.total).toEqual({ entrada: 900, salida: 170, cacheLectura: 1800, cacheEscritura: 0 })
    expect(calcular(TODAS, { sesion: "17615844" }, AHORA, USOS).tokens.total?.entrada).toBe(4000)
    expect(calcular(TODAS, { ventanaMin: 8 }, AHORA, USOS).tokens.total).toEqual({ entrada: 10, salida: 20, cacheLectura: 0, cacheEscritura: 0 })
  })

  it("el modelo de los hooks alcanza para saber qué modelo usó una sesión sin transcripción", () => {
    const m2 = calcular(TODAS) // sin usos: Codex informa `model` en cada evento del hook
    expect(m2.sesiones.find((s) => s.agente === "codex")!.modelos).toEqual(["gpt-5-codex"])
    expect(m2.sesiones.find((s) => s.agente === "claude")!.modelos).toEqual([])
  })

  it("privacidad: nada del contenido de las transcripciones sale en el snapshot", () => {
    const texto = JSON.stringify(calcular(TODAS, { detalle: true }, AHORA, USOS))
    for (const prohibido of ["CONTENIDO-SECRETO", "/home/", ".claude/projects", ".codex/sessions", "ui_messages"]) expect(texto, prohibido).not.toContain(prohibido)
  })
})
