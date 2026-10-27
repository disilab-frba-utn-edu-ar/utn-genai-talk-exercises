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
    if (/^write$|create_file|write_to_file/i.test(name)) op = "crear"
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

// Campos que traen el contenido de un archivo o un diff: no aportan al log (el archivo ya está en disco).
const CAMPOS_PESADOS = new Set(["content", "new_text", "old_text", "new_string", "old_string", "file_text", "text", "patch", "diff", "edits", "new_source"])

export function adelgazar(value) {
  const limpio = desenvolver(value)
  if (!limpio || typeof limpio !== "object" || Array.isArray(limpio)) return limpio
  return Object.fromEntries(
    Object.entries(limpio).map(([clave, valor]) => {
      if (!CAMPOS_PESADOS.has(clave)) return [clave, valor]
      const largo = typeof valor === "string" ? valor.length : JSON.stringify(valor ?? "").length
      return [clave, `[${largo} caracteres]`]
    }),
  )
}
