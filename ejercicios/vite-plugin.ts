// Guarda las respuestas de los ejercicios en ejercicios/<id>/respuestas.json (para seguir editándolas)
// y en ejercicios/<id>/RESPUESTAS.md (lo que se entrega), la captura opcional en ejercicios/<id>/captura.<ext>
// y, en el ejercicio 3, un ejercicios/<id>/tarea-<historia>.md por cada historia tomada del tablero.
// Vive en el servidor de desarrollo de Vite (`npm run dev`): no es parte de la API del producto.
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import type { ServerResponse } from "node:http"
import { join } from "node:path"
import type { Connect, Plugin } from "vite"

const DIR = join(process.cwd(), "ejercicios")
const LIMITE_BYTES = 1_000_000
const LIMITE_CAPTURA = 5_000_000
const EXTENSIONES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" }

/** El archivo de la captura de un ejercicio, si hay una. */
const captura = (id: string) =>
  Object.entries(EXTENSIONES)
    .map(([tipo, ext]) => ({ tipo, archivo: join(DIR, id, `captura.${ext}`), nombre: `captura.${ext}` }))
    .find((c) => existsSync(c.archivo))

type Historia = { id: string; titulo: string; tamano: string; historia: string; criterios: string[]; casosBorde: string[]; apis: string[] }

const lista = (items: string[]) => items.map((i) => `- ${i}`).join("\n")
const markdownTarea = (h: Historia) =>
  [
    `# ${h.titulo}`,
    `**Tamaño:** ${h.tamano} · **Tomada:** ${new Date().toISOString()}`,
    `> ${h.historia}`,
    `## Criterios de aceptación\n\n${lista(h.criterios)}`,
    `## Casos borde para pensar\n\n${lista(h.casosBorde)}`,
    `## APIs sugeridas\n\n${lista(h.apis.map((a) => `\`${a}\``))}`,
  ].join("\n\n") + "\n"

/** Tomar una historia crea su archivo; devolverla a To Do lo borra. Solo historias del tablero.json del ejercicio. */
function atenderTarea(id: string, historia: string, req: Connect.IncomingMessage, res: ServerResponse) {
  const tablero = join(DIR, id, "tablero.json")
  const h = existsSync(tablero)
    ? (JSON.parse(readFileSync(tablero, "utf-8")).historias as Historia[]).find((x) => x.id === historia)
    : undefined
  if (!h) return responder(res, 404, { error: "La historia no existe" })
  const archivo = join(DIR, id, `tarea-${h.id}.md`)
  if (req.method === "PUT") {
    writeFileSync(archivo, markdownTarea(h))
    return responder(res, 200, { archivo: `tarea-${h.id}.md` })
  }
  if (req.method === "DELETE") {
    if (existsSync(archivo)) rmSync(archivo)
    return responder(res, 200, null)
  }
  responder(res, 405, { error: "Método no permitido" })
}

function atenderCaptura(id: string, req: Connect.IncomingMessage, res: ServerResponse) {
  const actual = captura(id)
  if (req.method === "GET") {
    if (!actual) return responder(res, 404, { error: "Todavía no hay captura" })
    res.setHeader("Content-Type", actual.tipo)
    return res.end(readFileSync(actual.archivo))
  }
  if (req.method === "DELETE") {
    if (actual) rmSync(actual.archivo)
    return responder(res, 200, null)
  }
  if (req.method !== "PUT") return responder(res, 405, { error: "Método no permitido" })

  const ext = EXTENSIONES[req.headers["content-type"] ?? ""]
  if (!ext) return responder(res, 400, { error: "Tiene que ser una imagen PNG, JPG o WebP" })
  const partes: Buffer[] = []
  let total = 0
  req.on("data", (parte: Buffer) => {
    total += parte.length
    if (total > LIMITE_CAPTURA) {
      responder(res, 413, { error: "La imagen pesa más de 5 MB" })
      req.destroy()
    } else partes.push(parte)
  })
  req.on("end", () => {
    if (actual) rmSync(actual.archivo)
    writeFileSync(join(DIR, id, `captura.${ext}`), Buffer.concat(partes))
    responder(res, 200, { archivo: `captura.${ext}` })
  })
}

/** Leer todo el cuerpo del pedido, hasta LIMITE_BYTES. */
function leerCuerpo(req: Connect.IncomingMessage, alTerminar: (cuerpo: string) => void) {
  let cuerpo = ""
  req.on("data", (parte) => {
    cuerpo += parte
    if (cuerpo.length > LIMITE_BYTES) req.destroy()
  })
  req.on("end", () => alTerminar(cuerpo))
}

const esTexto = (valor: unknown) => typeof valor === "string"

/**
 * Mi perfil, en ejercicios/perfil.json: uno solo para todos los ejercicios. Reemplaza los datos de la
 * entrega que antes iban en cada RESPUESTAS.md, así que vive con las respuestas y se entrega en el mismo commit.
 */
function atenderPerfil(req: Connect.IncomingMessage, res: ServerResponse) {
  const archivo = join(DIR, "perfil.json")
  if (req.method === "GET") return responder(res, 200, existsSync(archivo) ? JSON.parse(readFileSync(archivo, "utf-8")) : null)
  if (req.method !== "PUT") return responder(res, 405, { error: "Método no permitido" })
  leerCuerpo(req, (cuerpo) => {
    let perfil: Record<string, unknown> | null = null
    try {
      perfil = JSON.parse(cuerpo)
    } catch {
      // cuerpo inválido: se responde 400 abajo
    }
    const ejercicios = perfil?.ejercicios
    const valido =
      perfil !== null &&
      typeof perfil === "object" &&
      [perfil.nombre, perfil.modelo, perfil.agente, perfil.comentario].every(esTexto) &&
      Array.isArray(perfil.integrantes) &&
      perfil.integrantes.every(esTexto) &&
      (perfil.puntaje === null || (Number.isInteger(perfil.puntaje) && (perfil.puntaje as number) >= 1 && (perfil.puntaje as number) <= 5)) &&
      typeof ejercicios === "object" &&
      ejercicios !== null &&
      Object.entries(ejercicios).every(
        ([id, e]) =>
          /^\d{2}-[a-z0-9-]+$/.test(id) &&
          existsSync(join(DIR, id, "ejercicio.json")) &&
          typeof e === "object" &&
          e !== null &&
          Object.values(e).every(esTexto),
      )
    if (!valido) return responder(res, 400, { error: "El perfil no tiene el formato esperado" })
    const guardado = { ...perfil, guardado: new Date().toISOString() }
    writeFileSync(archivo, JSON.stringify(guardado, null, 2) + "\n")
    responder(res, 200, guardado)
  })
}

function responder(res: ServerResponse, status: number, cuerpo: unknown) {
  res.statusCode = status
  res.setHeader("Content-Type", "application/json")
  res.end(JSON.stringify(cuerpo))
}

export function respuestasEjercicios(): Plugin {
  return {
    name: "respuestas-ejercicios",
    configureServer(server) {
      // La maqueta de la consigna por etapas (ejercicios/propuestas/): se abre en /propuesta.
      server.middlewares.use("/propuesta", (req, res, next) => {
        if (req.url !== "/" && req.url !== "") return next()
        res.setHeader("Content-Type", "text/html; charset=utf-8")
        res.end(readFileSync(join(DIR, "propuestas", "ejercicios-1-2", "index.html")))
      })
      server.middlewares.use("/ejercicios-api", (req, res) => {
        if (req.url === "/perfil") return atenderPerfil(req, res)
        // El id se valida contra las carpetas existentes: nada de rutas arbitrarias en disco.
        const [, id, recurso, historia] = req.url?.match(/^\/(\d{2}-[a-z0-9-]+)\/(respuestas|captura|tareas)(?:\/([a-z0-9-]+))?$/) ?? []
        if (!id || !existsSync(join(DIR, id, "ejercicio.json"))) {
          return responder(res, 404, { error: "El ejercicio no existe" })
        }
        if (recurso === "captura") return atenderCaptura(id, req, res)
        if (recurso === "tareas" && historia) return atenderTarea(id, historia, req, res)
        if (recurso !== "respuestas" || historia) return responder(res, 404, { error: "No existe" })
        const archivo = join(DIR, id, "respuestas.json")

        if (req.method === "GET") {
          return responder(res, 200, existsSync(archivo) ? JSON.parse(readFileSync(archivo, "utf-8")) : null)
        }
        if (req.method !== "PUT") return responder(res, 405, { error: "Método no permitido" })

        let cuerpo = ""
        req.on("data", (parte) => {
          cuerpo += parte
          if (cuerpo.length > LIMITE_BYTES) req.destroy()
        })
        req.on("end", () => {
          let datos: { general?: unknown; respuestas?: unknown; markdown?: unknown } = {}
          try {
            datos = JSON.parse(cuerpo)
          } catch {
            // cuerpo inválido: se responde 400 abajo
          }
          const { general, respuestas, markdown } = datos
          const sonTextos =
            typeof respuestas === "object" &&
            respuestas !== null &&
            Object.values(respuestas).every((r) => typeof r === "string")
          if (typeof general !== "string" || typeof markdown !== "string" || !sonTextos) {
            return responder(res, 400, { error: "Las respuestas tienen que ser texto" })
          }
          const guardadas = {
            ejercicio: id,
            guardado: new Date().toISOString(),
            general: general.split("\n"),
            respuestas: Object.fromEntries(Object.entries(respuestas as Record<string, string>).map(([n, r]) => [n, r.split("\n")])),
          }
          writeFileSync(archivo, JSON.stringify(guardadas, null, 2) + "\n")
          // La captura se sube aparte; en lo que se entrega se ve debajo de las respuestas.
          const imagen = captura(id)
          const conCaptura = imagen ? `${markdown}\n## Captura de pantalla\n\n![Captura de pantalla](${imagen.nombre})\n` : markdown
          writeFileSync(join(DIR, id, "RESPUESTAS.md"), conCaptura)
          responder(res, 200, guardadas)
        })
      })
    },
  }
}
