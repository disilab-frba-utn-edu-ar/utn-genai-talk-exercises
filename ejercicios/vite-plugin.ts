// Guarda las respuestas de los ejercicios en ejercicios/<id>/respuestas.json (para seguir editándolas)
// y en ejercicios/<id>/RESPUESTAS.md (lo que se entrega).
// Vive en el servidor de desarrollo de Vite (`npm run dev`): no es parte de la API del producto.
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import type { ServerResponse } from "node:http"
import { join } from "node:path"
import type { Plugin } from "vite"

const DIR = join(process.cwd(), "ejercicios")
const LIMITE_BYTES = 1_000_000

function responder(res: ServerResponse, status: number, cuerpo: unknown) {
  res.statusCode = status
  res.setHeader("Content-Type", "application/json")
  res.end(JSON.stringify(cuerpo))
}

export function respuestasEjercicios(): Plugin {
  return {
    name: "respuestas-ejercicios",
    configureServer(server) {
      server.middlewares.use("/ejercicios-api", (req, res) => {
        // El id se valida contra las carpetas existentes: nada de rutas arbitrarias en disco.
        const id = req.url?.match(/^\/(\d{2}-[a-z0-9-]+)\/respuestas$/)?.[1]
        if (!id || !existsSync(join(DIR, id, "ejercicio.json"))) {
          return responder(res, 404, { error: "El ejercicio no existe" })
        }
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
          writeFileSync(join(DIR, id, "RESPUESTAS.md"), markdown)
          responder(res, 200, guardadas)
        })
      })
    },
  }
}
