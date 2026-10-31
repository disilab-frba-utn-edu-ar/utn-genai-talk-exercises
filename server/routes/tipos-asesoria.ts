import { Router } from "express"
import type { crearServicioReservaPorTipo } from "../services/reserva-por-tipo"

const texto = (valor: unknown) => (typeof valor === "string" && valor ? valor : undefined)

export function rutasTiposAsesoria(reservaPorTipo: ReturnType<typeof crearServicioReservaPorTipo>) {
  const router = Router()

  router.get("/:id/disponibilidad", (req, res) => {
    const dias = texto(req.query.dias) ? Number(req.query.dias) : undefined
    res.json(reservaPorTipo.disponibilidad(req.params.id, Number.isFinite(dias) ? dias : undefined))
  })

  router.get("/:id/asignacion", (req, res) => {
    res.json(reservaPorTipo.asignar(req.params.id, texto(req.query.fecha), texto(req.query.horaInicio)))
  })

  return router
}
