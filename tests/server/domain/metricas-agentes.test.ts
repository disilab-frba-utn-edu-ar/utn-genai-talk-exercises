import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import type { EntradaLog, FiltrosMetricas } from "@shared/types"
import { binarioDe, calcularMetricas, percentil, redactar, rutaPublica } from "../../../server/domain/metricas-agentes"

const FIXTURES = join(process.cwd(), "tests", "server", "fixtures", "logs")
const RAIZ = "/work/repo"
const AHORA = new Date("2026-10-27T17:12:00.000Z") // pasadas las tres sesiones de las fixtures

function fixture(agente: string): EntradaLog[] {
  const dir = join(FIXTURES, agente)
  return readdirSync(dir).flatMap((f) =>
    readFileSync(join(dir, f), "utf-8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as EntradaLog),
  )
}
const TODAS = [...fixture("claude"), ...fixture("codex"), ...fixture("cline")]
const calcular = (entradas: EntradaLog[] = TODAS, filtros: FiltrosMetricas = {}, ahora = AHORA) =>
  calcularMetricas(entradas, filtros, ahora, { raiz: RAIZ, origen: "actual" })

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
  ])("binarioDe(%s)", (comando, esperado) => {
    expect(binarioDe(comando)).toEqual(esperado)
  })
})
