// Clasifica una llamada a herramienta en una categoría común a todos los agentes
// (leer, escribir, ejecutar, buscar, skill, pregunta, mcp, otro) y extrae lo importante:
// las rutas, comandos o consultas. Lo usan log-hook.mjs (al guardar) y resumen.mjs (al mostrar).

const KINDS = [
  ["leer", /^(read|read_files?|read_file|notebookread|view)$/i],
  ["escribir", /^(write|edit|multiedit|notebookedit|editor|apply_patch|write_to_file|replace_in_file|create_file)$/i],
  ["ejecutar", /^(bash|powershell|run_commands?|execute_command|shell|local_shell|exec_command)$/i],
  ["buscar", /^(grep|glob|search_codebase|search_files|list_files|websearch|webfetch|toolsearch)$/i],
  ["skill", /^(skill|skills)$/i],
  ["pregunta", /^(askuserquestion|ask_question|ask_followup_question)$/i],
]

// Cline manda los parámetros como strings con JSON adentro ("[\"ls\"]"): los desarmamos.
export function desenvolver(value) {
  if (typeof value === "string") {
    const text = value.trim()
    if (text.startsWith("[") || text.startsWith("{")) {
      try {
        return desenvolver(JSON.parse(text))
      } catch {
        return value
      }
    }
    return value
  }
  if (Array.isArray(value)) return value.map(desenvolver)
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, desenvolver(v)]))
  return value
}

const lista = (value) => (Array.isArray(value) ? value : value === undefined || value === null ? [] : [value])
const texto = (value) => (typeof value === "string" ? value : value && typeof value === "object" ? (value.path ?? value.command ?? value.query ?? JSON.stringify(value)) : String(value))

function primero(input, nombres) {
  for (const nombre of nombres) if (input[nombre] !== undefined && input[nombre] !== null && input[nombre] !== "") return input[nombre]
  return undefined
}

// apply_patch (Codex) no trae una ruta: trae el parche entero y las rutas están en sus encabezados
// ("*** Update File: ruta"). Buscamos en cualquier texto del input, sea cual sea el nombre del campo.
const ENCABEZADO_PARCHE = /^\*\*\* (Add|Update|Delete) File: (.+)$|^\*\*\* Move to: (.+)$/gm

function rutasDeParche(input) {
  const textos = Object.values(input).filter((valor) => typeof valor === "string")
  const encabezados = textos.flatMap((t) => [...t.matchAll(ENCABEZADO_PARCHE)])
  const rutas = encabezados.map((m) => (m[2] ?? m[3]).trim())
  const soloNuevos = encabezados.length > 0 && encabezados.every((m) => m[1] === "Add")
  return { rutas: [...new Set(rutas)], soloNuevos }
}

// Devuelve { kind, op?, targets, detail }.
//   targets: rutas (leer/escribir), comandos (ejecutar) o consultas (buscar).
//   detail:  una línea corta para mostrar.
export function clasificar(tool, rawInput) {
  const input0 = desenvolver(rawInput)
  const input = input0 && typeof input0 === "object" && !Array.isArray(input0) ? input0 : { value: input0 }
  const name = String(tool ?? "")
  let kind = /^mcp__|^mcp_|^use_mcp_tool$/i.test(name) ? "mcp" : (KINDS.find(([, re]) => re.test(name))?.[0] ?? "otro")
  let op
  let targets = []

  if (kind === "leer") {
    targets = lista(primero(input, ["files", "file_path", "path", "filePath", "notebook_path", "value"])).map(texto)
  } else if (kind === "escribir") {
    targets = lista(primero(input, ["file_path", "path", "filePath", "notebook_path"])).map(texto)
    const parche = /^apply_patch$/i.test(name) ? rutasDeParche(input) : undefined
    if (parche) targets = parche.rutas
    if (parche?.soloNuevos) op = "crear"
    else if (/^write$|create_file|write_to_file/i.test(name)) op = "crear"
    else if (/^editor$/i.test(name)) op = input.insert_line !== undefined ? "insertar" : input.old_text !== undefined ? "editar" : "crear/reemplazar"
    else op = "editar"
  } else if (kind === "ejecutar") {
    targets = lista(primero(input, ["commands", "command", "cmd", "value"])).map(texto)
  } else if (kind === "buscar") {
    targets = lista(primero(input, ["queries", "pattern", "query", "regex", "url", "path"])).map(texto)
  } else if (kind === "skill") {
    const args = input.args && input.args !== "null" ? ` ${texto(input.args)}` : ""
    targets = [`${texto(input.skill ?? input.name ?? "?")}${args}`]
  } else if (kind === "pregunta") {
    targets = lista(primero(input, ["question", "questions", "prompt"])).map((q) => (typeof q === "object" && q ? (q.question ?? JSON.stringify(q)) : texto(q)))
  }

  const detail = targets.join(" · ").replace(/\s+/g, " ").slice(0, 200)
  return { kind, op, targets, detail }
}

// Resultado de una corrida de tests (Vitest) a partir de su salida completa, para ver el rojo y el verde
// de TDD sin abrir el log. Distingue por qué falló: no compila (la función no existe, error de import o
// de sintaxis) o la regla no se cumple (una aserción). undefined si el comando no corre tests.
const CORRE_TESTS = /\b(vitest|npm (run )?test|npx vitest|pnpm (run )?test|yarn test)\b/
const NO_COMPILA = /Cannot find module|Failed to (load|resolve)|is not a function|is not defined|SyntaxError|Transform failed|error TS\d+/
const NO_SE_CUMPLE = /AssertionError|expected .+ to /

export function resultadoDeTests(comando, salida) {
  if (!CORRE_TESTS.test(String(comando ?? ""))) return undefined
  // Claude manda { stdout, stderr }; Codex y Cline, un string.
  const texto =
    typeof salida === "string" ? salida : [salida?.stdout, salida?.stderr, salida?.output].filter(Boolean).join("\n") || JSON.stringify(salida ?? "")
  const linea = texto.match(/^\s*Tests\s+(.+)$/m)?.[1] ?? ""
  const fallaron = Number(linea.match(/(\d+) failed/)?.[1] ?? 0)
  const pasaron = Number(linea.match(/(\d+) passed/)?.[1] ?? 0)
  const suitesRotas = /Failed Suites|Test Files\s+\d+ failed/.test(texto)
  if (!linea && !suitesRotas) return { resultado: "no detectado" }
  const causas = [NO_COMPILA.test(texto) && "no compila", NO_SE_CUMPLE.test(texto) && "la regla no se cumple"].filter(Boolean)
  const rojo = fallaron > 0 || suitesRotas
  return { resultado: rojo ? "rojo" : "verde", fallaron, pasaron, ...(rojo && causas.length ? { causa: causas.join(" y ") } : {}) }
}

// Campos que traen el contenido de un archivo o un diff: no aportan al log (el archivo ya está en disco).
const CAMPOS_PESADOS = new Set(["content", "new_text", "old_text", "new_string", "old_string", "file_text", "text", "patch", "diff", "edits", "new_source"])

export function adelgazar(value) {
  const limpio = desenvolver(value)
  if (!limpio || typeof limpio !== "object" || Array.isArray(limpio)) return limpio
  return Object.fromEntries(
    Object.entries(limpio).map(([clave, valor]) => {
      const esParche = typeof valor === "string" && valor.includes("*** Begin Patch")
      if (!CAMPOS_PESADOS.has(clave) && !esParche) return [clave, valor]
      const largo = typeof valor === "string" ? valor.length : JSON.stringify(valor ?? "").length
      return [clave, `[${largo} caracteres]`]
    }),
  )
}
