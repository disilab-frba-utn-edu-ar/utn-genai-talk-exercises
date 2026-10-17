import { existsSync } from "node:fs"
import { join } from "node:path"
import express, { type ErrorRequestHandler } from "express"
import { DEFAULT_DATA_DIR } from "./config"
import { crearRepositorios } from "./repositories"
import { rutasCatalogos } from "./routes/catalogos"
import { rutasMentoras } from "./routes/mentoras"
import { rutasSesiones } from "./routes/sesiones"
import { crearServicioCatalogos } from "./services/catalogos"
import { ErrorDeNegocio } from "./services/errores"
import { crearServicioMentoras } from "./services/mentoras"
import { crearServicioSesiones } from "./services/sesiones"

type Opciones = {
  dataDir?: string
  /** Permite fijar "ahora" en los tests. */
  reloj?: () => Date
}

export function createApp({ dataDir = DEFAULT_DATA_DIR, reloj = () => new Date() }: Opciones = {}) {
  const repos = crearRepositorios(dataDir)
  const app = express()
  app.use(express.json())

  const api = express.Router()
  api.get("/health", (_req, res) => {
    res.json({ status: "ok" })
  })
  api.use(rutasCatalogos(crearServicioCatalogos(repos)))
  api.use("/mentoras", rutasMentoras(crearServicioMentoras(repos, reloj)))
  api.use("/sesiones", rutasSesiones(crearServicioSesiones(repos, reloj)))
  api.use((_req, res) => {
    res.status(404).json({ error: "Recurso no encontrado" })
  })
  app.use("/api", api)

  // En producción (npm start) Express también sirve el cliente compilado.
  const dist = join(process.cwd(), "dist")
  if (existsSync(dist)) {
    app.use(express.static(dist))
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(join(dist, "index.html"))
    })
  }

  const manejarErrores: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof ErrorDeNegocio) {
      res.status(error.status).json({ error: error.message })
      return
    }
    if (error instanceof SyntaxError) {
      res.status(400).json({ error: "El cuerpo de la solicitud no es JSON válido" })
      return
    }
    console.error(error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
  app.use(manejarErrores)

  return app
}
