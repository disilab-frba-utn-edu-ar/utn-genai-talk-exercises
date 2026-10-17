import { Router } from "express"
import type { crearServicioMentoras } from "../services/mentoras"

const texto = (valor: unknown) => (typeof valor === "string" && valor ? valor : undefined)

export function rutasMentoras(mentoras: ReturnType<typeof crearServicioMentoras>) {
  const router = Router()

  router.get("/", (req, res) => {
    res.json(mentoras.listar(texto(req.query.habilidad)))
  })

  router.get("/:id", (req, res) => {
    res.json(mentoras.obtener(req.params.id))
  })

  router.get("/:id/disponibilidad", (req, res) => {
    const dias = texto(req.query.dias) ? Number(req.query.dias) : undefined
    res.json(mentoras.disponibilidad(req.params.id, texto(req.query.tipoAsesoriaId), Number.isFinite(dias) ? dias : undefined))
  })

  return router
}
