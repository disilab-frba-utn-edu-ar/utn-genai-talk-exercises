import { appendFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { crearRepositorioTranscripciones, type SesionDeLog } from "../../../server/repositories/transcripciones-agentes"

const FIXTURE_HOME = join(process.cwd(), "metricas", "tests", "server", "fixtures", "home")
const CLAUDE_ID = "bb76875c-d528-5a9e-9c40-c1ba18725474"
const CODEX_ID = "019a-codex-sesion-1"
const CLINE_ID = "1761584400000"

const CLAUDE: SesionDeLog = { agente: "claude", sesion: CLAUDE_ID }
const CODEX: SesionDeLog = { agente: "codex", sesion: CODEX_ID }
const CLINE: SesionDeLog = { agente: "cline", sesion: CLINE_ID }

/** Una copia temporal del "home" de las fixtures: los tests agregan líneas sin tocar el original. */
function nuevoHome() {
  const home = mkdtempSync(join(tmpdir(), "home-"))
  cpSync(FIXTURE_HOME, home, { recursive: true })
  return home
}
const rutaClaude = (home: string) => join(home, ".claude", "projects", "-work-repo", `${CLAUDE_ID}.jsonl`)
const rutaCodex = (home: string) => join(home, ".codex", "sessions", "2026", "10", "27", `rollout-2026-10-27T17-01-40-${CODEX_ID}.jsonl`)
const rutaCline = (home: string) => join(home, ".cline", "data", "tasks", CLINE_ID, "ui_messages.json")

const lineaClaude = (id: string, ts: string, extra = {}) =>
  JSON.stringify({ type: "assistant", timestamp: ts, message: { id, model: "claude-sonnet-5-5", content: "CONTENIDO-SECRETO", usage: { input_tokens: 7, output_tokens: 3, ...extra } } }) + "\n"

describe("repositorio de transcripciones: ubicación", () => {
  it("encuentra la transcripción de cada agente en su lugar estándar", () => {
    const lector = crearRepositorioTranscripciones(nuevoHome()).lector()
    expect(lector.actualizar([CLAUDE, CODEX, CLINE])).toBe(true)
    const usos = lector.usos()
    expect(usos.filter((u) => u.agente === "claude")).toHaveLength(4) // msg_1 repetido cuenta una vez
    expect(usos.filter((u) => u.agente === "codex")).toHaveLength(3)
    expect(usos.filter((u) => u.agente === "cline")).toHaveLength(2)
    expect(usos.find((u) => u.agente === "codex")?.modelo).toBe("gpt-5-codex")
  })

  it("también lee las ubicaciones de Cline dentro de VS Code", () => {
    const home = mkdtempSync(join(tmpdir(), "home-"))
    const destino = join(home, ".config", "Code", "User", "globalStorage", "saoudrizwan.claude-dev", "tasks", CLINE_ID)
    mkdirSync(destino, { recursive: true })
    cpSync(rutaCline(FIXTURE_HOME), join(destino, "ui_messages.json"))
    const lector = crearRepositorioTranscripciones(home).lector()
    lector.actualizar([CLINE])
    expect(lector.usos()).toHaveLength(2)
  })

  it("usa transcriptPath cuando el hook lo guardó (por ejemplo, con otra carpeta de configuración)", () => {
    const home = nuevoHome()
    const otra = join(home, "otra-config", "projects", "x")
    mkdirSync(otra, { recursive: true })
    renameSync(rutaClaude(home), join(otra, `${CLAUDE_ID}.jsonl`))
    const lector = crearRepositorioTranscripciones(home).lector()
    lector.actualizar([CLAUDE])
    expect(lector.usos()).toHaveLength(0) // por los lugares estándar ya no está
    lector.actualizar([{ ...CLAUDE, transcriptPath: join(otra, `${CLAUDE_ID}.jsonl`) }])
    expect(lector.usos()).toHaveLength(4)
  })

  it("rechaza rutas que no tienen la forma de una transcripción de esa sesión", () => {
    const home = nuevoHome()
    writeFileSync(join(home, "secreto.jsonl"), lineaClaude("m", "2026-10-27T17:00:00Z"))
    const lector = crearRepositorioTranscripciones(home).lector()
    for (const transcriptPath of ["/etc/passwd", join(home, "secreto.jsonl"), "relativa/x.jsonl", rutaCline(home), `${join(home, "..", "..")}/etc/${CLAUDE_ID}.txt`]) {
      lector.actualizar([{ agente: "claude", sesion: "otra-sesion", transcriptPath }])
      expect(lector.usos(), transcriptPath).toHaveLength(0)
    }
  })

  it("ids de sesión con '..' o separadores no se usan para armar rutas", () => {
    const lector = crearRepositorioTranscripciones(nuevoHome()).lector()
    lector.actualizar([{ agente: "cline", sesion: `../${CLINE_ID}` }, { agente: "claude", sesion: "a/b" }])
    expect(lector.usos()).toEqual([])
  })

  it("una sesión sin transcripción no rompe nada y se reintenta después", () => {
    const home = mkdtempSync(join(tmpdir(), "home-"))
    const lector = crearRepositorioTranscripciones(home, { reintentoMs: 0 }).lector()
    expect(lector.actualizar([CLAUDE])).toBe(false)
    mkdirSync(join(home, ".claude", "projects", "p"), { recursive: true })
    appendFileSync(join(home, ".claude", "projects", "p", `${CLAUDE_ID}.jsonl`), lineaClaude("m1", "2026-10-27T17:00:00Z"))
    expect(lector.actualizar([CLAUDE])).toBe(true)
    expect(lector.usos()).toHaveLength(1)
  })
})

describe("repositorio de transcripciones: lectura incremental", () => {
  it("Claude: solo suma lo nuevo y no duplica el mismo message.id", () => {
    const home = nuevoHome()
    const lector = crearRepositorioTranscripciones(home).lector()
    lector.actualizar([CLAUDE])
    expect(lector.actualizar([CLAUDE])).toBe(false)

    appendFileSync(rutaClaude(home), lineaClaude("msg_nuevo", "2026-10-27T17:20:00Z") + lineaClaude("msg_nuevo", "2026-10-27T17:20:00Z"))
    expect(lector.actualizar([CLAUDE])).toBe(true)
    expect(lector.usos()).toHaveLength(5)
  })

  it("una línea escrita a medias espera a completarse", () => {
    const home = nuevoHome()
    const lector = crearRepositorioTranscripciones(home).lector()
    lector.actualizar([CLAUDE])
    const linea = lineaClaude("msg_corto", "2026-10-27T17:21:00Z")
    appendFileSync(rutaClaude(home), linea.slice(0, 40))
    lector.actualizar([CLAUDE])
    expect(lector.usos()).toHaveLength(4)
    appendFileSync(rutaClaude(home), linea.slice(40))
    lector.actualizar([CLAUDE])
    expect(lector.usos()).toHaveLength(5)
  })

  it("Codex: el parser conserva el modelo y los acumulados entre lecturas", () => {
    const home = nuevoHome()
    const lector = crearRepositorioTranscripciones(home).lector()
    lector.actualizar([CODEX])
    const total = (i: number, c: number, o: number) => ({ input_tokens: i, cached_input_tokens: c, output_tokens: o, reasoning_output_tokens: 0, total_tokens: i + o })
    appendFileSync(rutaCodex(home), JSON.stringify({ timestamp: "2026-10-27T17:05:00Z", type: "event_msg", payload: { type: "token_count", info: { total_token_usage: total(3000, 1800, 190), last_token_usage: total(300, 0, 20) } } }) + "\n")
    lector.actualizar([CODEX])
    const ultimo = lector.usos().filter((u) => u.agente === "codex").at(-1)!
    expect(ultimo).toMatchObject({ modelo: "gpt-5.1-codex", entrada: 300, salida: 20 })
  })

  it("Cline: relee el archivo completo cuando cambia", () => {
    const home = nuevoHome()
    const lector = crearRepositorioTranscripciones(home).lector()
    lector.actualizar([CLINE])
    expect(lector.usos()).toHaveLength(2)
    const mensajes = JSON.parse(readFileSync(rutaCline(home), "utf-8"))
    mensajes.push({ ts: 1_761_584_500_000, type: "say", say: "api_req_started", text: JSON.stringify({ tokensIn: 5, tokensOut: 5 }) })
    writeFileSync(rutaCline(home), JSON.stringify(mensajes))
    expect(lector.actualizar([CLINE])).toBe(true)
    expect(lector.usos()).toHaveLength(3)
    expect(lector.actualizar([CLINE])).toBe(false)
  })

  it("si la transcripción se trunca o se reemplaza, vuelve a leer desde el principio", () => {
    const home = nuevoHome()
    const lector = crearRepositorioTranscripciones(home).lector()
    lector.actualizar([CLAUDE])
    writeFileSync(rutaClaude(home), lineaClaude("solo", "2026-10-27T17:30:00Z"))
    expect(lector.actualizar([CLAUDE])).toBe(true)
    expect(lector.usos()).toHaveLength(1)
  })

  it("un archivo corrupto no tumba la lectura de los demás", () => {
    const home = nuevoHome()
    writeFileSync(rutaCline(home), "{no es json")
    writeFileSync(rutaClaude(home), "basura\n{\n")
    const lector = crearRepositorioTranscripciones(home).lector()
    lector.actualizar([CLAUDE, CODEX, CLINE])
    expect(lector.usos().map((u) => u.agente)).toEqual(["codex", "codex", "codex"])
  })

  it("solo devuelve números, modelo y fechas: nunca el contenido de los mensajes", () => {
    const lector = crearRepositorioTranscripciones(nuevoHome()).lector()
    lector.actualizar([CLAUDE, CODEX, CLINE])
    expect(JSON.stringify(lector.usos())).not.toContain("CONTENIDO-SECRETO")
  })
})
