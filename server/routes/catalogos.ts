import { Router } from "express"
import type { crearServicioCatalogos } from "../services/catalogos"

export function rutasCatalogos(catalogos: ReturnType<typeof crearServicioCatalogos>) {
  const router = Router()
  router.get("/habilidades", (_req, res) => {
    res.json(catalogos.habilidades())
  })
  router.get("/tipos-asesoria", (_req, res) => {
    res.json(catalogos.tiposAsesoria())
  })
  router.get("/colectivos", (_req, res) => {
    res.json(catalogos.colectivos())
  })
  return router
}
