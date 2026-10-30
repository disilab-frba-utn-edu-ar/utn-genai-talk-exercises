import { spawnSync } from "node:child_process"
import { mkdtempSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { clasificar, resultadoDeTests } from "../../../scripts/agent-logs/clasificar.mjs"

const HOOK = join(process.cwd(), "scripts", "agent-logs", "log-hook.mjs")

/** Corre el hook de verdad con un payload por stdin y devuelve la línea que escribió. */
function registrar(agente: string, payload: object, evento?: string) {
  const logDir = mkdtempSync(join(tmpdir(), "hook-"))
  const resultado = spawnSync("node", [HOOK, agente, ...(evento ? [evento] : [])], {
    input: JSON.stringify(payload),
    env: { ...process.env, AGENT_LOG_DIR: logDir },
    encoding: "utf-8",
  })
  expect(resultado.status).toBe(0)
  const sesion = (payload as { session_id?: string; taskId?: string }).session_id ?? (payload as { taskId?: string }).taskId
  const linea = readFileSync(join(logDir, agente, `${sesion}.jsonl`), "utf-8").trim()
  return { entrada: JSON.parse(linea) as Record<string, unknown>, stdout: resultado.stdout }
}

describe("log-hook: Claude Code (campos de la doc oficial)", () => {
  it("guarda tool_use_id y el subagente que hizo la llamada", () => {
    const { entrada } = registrar("claude", {
      session_id: "s1",
      hook_event_name: "PreToolUse",
      tool_name: "Bash",
      tool_input: { command: "npm test" },
      tool_use_id: "toolu_01",
      agent_id: "ag-7",
      agent_type: "Explore",
    })
    expect(entrada).toMatchObject({ event: "PreToolUse", toolUseId: "toolu_01", subagent: "Explore", subagentId: "ag-7", kind: "ejecutar" })
  })

  it("PostToolUse trae la duración y la falla se deduce del evento", () => {
    const post = registrar("claude", { session_id: "s1", hook_event_name: "PostToolUse", tool_name: "Read", tool_input: {}, tool_response: "x", tool_use_id: "toolu_02", duration_ms: 12 })
    expect(post.entrada).toMatchObject({ toolUseId: "toolu_02", durationMs: 12 })
    const falla = registrar("claude", { session_id: "s1", hook_event_name: "PostToolUseFailure", tool_name: "Bash", tool_input: { command: "x" }, tool_use_id: "toolu_03", error: "boom", is_interrupt: true, duration_ms: 5 })
    expect(falla.entrada).toMatchObject({ event: "PostToolUseFailure", toolUseId: "toolu_03", interrupted: true, durationMs: 5, error: "boom" })
  })

  it("guarda la ruta de la transcripción (de ahí salen los tokens y el modelo, no del hook)", () => {
    const { entrada } = registrar("claude", { session_id: "s1", hook_event_name: "Stop", transcript_path: "/home/u/.claude/projects/x/s1.jsonl" })
    expect(entrada.transcriptPath).toBe("/home/u/.claude/projects/x/s1.jsonl")
    expect(registrar("claude", { session_id: "s2", hook_event_name: "Stop" }).entrada.transcriptPath).toBeUndefined()
  })

  it("el turno sale de prompt_id cuando no hay turn_id", () => {
    const { entrada } = registrar("claude", { session_id: "s1", hook_event_name: "UserPromptSubmit", prompt: "hola", prompt_id: "p-1" })
    expect(entrada.turn).toBe("p-1")
  })
})

describe("log-hook: Codex CLI (forma documentada; campos sin confirmar con logs reales)", () => {
  it("guarda model, turn_id y tool_use_id", () => {
    const { entrada } = registrar("codex", {
      session_id: "c1",
      hook_event_name: "PostToolUse",
      turn_id: "t-1",
      model: "gpt-5-codex",
      tool_name: "exec_command",
      tool_input: { cmd: "ls" },
      tool_response: "a b",
      tool_use_id: "call_1",
    })
    expect(entrada).toMatchObject({ turn: "t-1", model: "gpt-5-codex", toolUseId: "call_1", kind: "ejecutar", outputChars: 3 })
  })

  it("apply_patch: las rutas del parche quedan en detail y el texto del parche no se guarda", () => {
    const parche = "*** Begin Patch\n*** Update File: server/app.ts\n@@\n-a\n+b\n*** Add File: server/nuevo.ts\n+x\n*** End Patch"
    const { entrada } = registrar("codex", { session_id: "c1", hook_event_name: "PreToolUse", tool_name: "apply_patch", tool_input: { input: parche }, tool_use_id: "call_2" })
    expect(entrada).toMatchObject({ kind: "escribir", op: "editar", detail: "server/app.ts · server/nuevo.ts" })
    expect(JSON.stringify(entrada)).not.toContain("Begin Patch")
  })
})

describe("log-hook: Cline (nombres tolerantes donde la doc no los confirma)", () => {
  it("lee executionTimeMs, success y el id de llamada anidados", () => {
    const { entrada, stdout } = registrar("cline", {
      taskId: "k1",
      hookName: "tool_result",
      postToolUse: { toolName: "execute_command", parameters: { command: "ls" }, result: "ok", success: false, executionTimeMs: 40, toolCallId: "tc-9", model: "claude-sonnet" },
    })
    expect(entrada).toMatchObject({ event: "PostToolUse", durationMs: 40, success: false, toolUseId: "tc-9", model: "claude-sonnet" })
    expect(JSON.parse(stdout)).toEqual({ cancel: false })
  })

  it("un payload sin ningún campo nuevo sigue funcionando (compatibilidad)", () => {
    const { entrada } = registrar("cline", { taskId: "k2", hookName: "prompt_submit", userPromptSubmit: { prompt: "hola" } })
    expect(entrada).toMatchObject({ event: "UserPromptSubmit", prompt: "hola" })
    expect(entrada.toolUseId).toBeUndefined()
  })
})

describe("clasificar: rutas de apply_patch", () => {
  const parche = "*** Begin Patch\n*** Update File: a.ts\n*** Move to: b.ts\n*** Delete File: c.ts\n*** End Patch"

  it("las saca del texto del parche, venga como string o dentro de cualquier campo", () => {
    expect(clasificar("apply_patch", parche).targets).toEqual(["a.ts", "b.ts", "c.ts"])
    expect(clasificar("apply_patch", { command: parche }).targets).toEqual(["a.ts", "b.ts", "c.ts"])
  })

  it("si todo son archivos nuevos, la operación es crear", () => {
    expect(clasificar("apply_patch", "*** Add File: nuevo.ts\n+x").op).toBe("crear")
  })

  it("sin rutas legibles no inventa nada", () => {
    expect(clasificar("apply_patch", { input: "otra cosa" }).targets).toEqual([])
  })
})

describe("resultadoDeTests: el rojo y el verde de TDD", () => {
  const noCompila = [
    " FAIL  |server| tests/server/domain/superposicion.test.ts",
    "Error: Cannot find module '../../../server/domain/superposicion'",
    " Test Files  1 failed | 9 passed (10)",
    "      Tests  75 passed (75)",
  ].join("\n")
  const reglaRota = [
    "AssertionError: expected 201 to be 409 // Object.is equality",
    " Test Files  1 failed | 10 passed (11)",
    "      Tests  1 failed | 85 passed (86)",
  ].join("\n")

  it("distingue si falló porque no compila o porque la regla no se cumple", () => {
    expect(resultadoDeTests("npm test", noCompila)).toEqual({ resultado: "rojo", fallaron: 0, pasaron: 75, causa: "no compila" })
    expect(resultadoDeTests("npx vitest run tests/server", reglaRota)).toEqual({ resultado: "rojo", fallaron: 1, pasaron: 85, causa: "la regla no se cumple" })
  })

  it("verde cuando pasan todos", () => {
    expect(resultadoDeTests("npm test 2>&1 | tail -8", " Test Files  11 passed (11)\n      Tests  86 passed (86)")).toEqual({ resultado: "verde", fallaron: 0, pasaron: 86 })
  })

  it("no inventa: sin resumen de Vitest es 'no detectado' y otros comandos no son tests", () => {
    expect(resultadoDeTests("npm test | grep FAIL", "")).toEqual({ resultado: "no detectado" })
    expect(resultadoDeTests("npm run lint", "ok")).toBeUndefined()
  })

  it("el hook lo guarda en el PostToolUse con la salida completa, aunque el extracto la corte", () => {
    const salida = "x".repeat(5000) + "\n" + reglaRota
    const { entrada } = registrar("claude", { session_id: "s-tests", hook_event_name: "PostToolUse", tool_name: "Bash", tool_input: { command: "npm test" }, tool_response: { stdout: salida } })
    expect(entrada.tests).toEqual({ resultado: "rojo", fallaron: 1, pasaron: 85, causa: "la regla no se cumple" })
  })
})
