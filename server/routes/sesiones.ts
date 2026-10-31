import { Router } from "express"
import type { crearServicioSesiones } from "../services/sesiones"

const texto = (valor: unknown) => (typeof valor === "string" && valor ? valor : undefined)

export function rutasSesiones(sesiones: ReturnType<typeof crearServicioSesiones>) {
  const router = Router()

  router.get("/", (req, res) => {
    res.json(sesiones.listar({ mentoraId: texto(req.query.mentoraId), fecha: texto(req.query.fecha) }))
  })

  router.get("/:id", (req, res) => {
    res.json(sesiones.obtener(req.params.id))
  })

  router.post("/", (req, res) => {
    res.status(201).json(sesiones.crear(req.body))
  })

  return router
}
