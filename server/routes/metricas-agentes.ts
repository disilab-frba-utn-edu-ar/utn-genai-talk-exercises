import type { AgenteLog, FiltrosMetricas } from "@shared/types"
import { Router, type RequestHandler } from "express"
import { ErrorDeNegocio } from "../services/errores"
import type { ServicioMetricas } from "../services/metricas-agentes"

const LOOPBACK = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"])
const AGENTES: AgenteLog[] = ["claude", "codex", "cline"]
const UN_ANO_MIN = 365 * 24 * 60

/** Las métricas muestran lo que hizo el agente en este equipo: solo se sirven a quien está en él. */
export const soloLoopback: RequestHandler = (req, res, next) => {
  if (req.socket.remoteAddress && LOOPBACK.has(req.socket.remoteAddress)) return next()
  res.status(403).json({ error: "Las métricas solo se pueden ver desde este equipo" })
}

const texto = (valor: unknown) => (typeof valor === "string" ? valor : undefined)

function leerConsulta(query: Record<string, unknown>, origenes: string[]) {
  const origen = texto(query.origen) ?? "actual"
  if (!origenes.includes(origen)) throw new ErrorDeNegocio(400, "El origen de logs no existe")
  const agente = texto(query.agente)
  const sesion = texto(query.sesion)
  const ventana = texto(query.ventana)
  const filtros: FiltrosMetricas = {}

  if (agente !== undefined) {
    if (!AGENTES.includes(agente as AgenteLog)) throw new ErrorDeNegocio(400, "El agente tiene que ser claude, codex o cline")
    filtros.agente = agente as AgenteLog
  }
  if (sesion !== undefined) {
    if (!/^[A-Za-z0-9._-]{1,40}$/.test(sesion) || sesion.includes("..")) throw new ErrorDeNegocio(400, "El id de sesión no es válido")
    filtros.sesion = sesion
  }
  if (ventana !== undefined) {
    const minutos = Number(ventana)
    if (!/^\d+$/.test(ventana) || minutos < 1 || minutos > UN_ANO_MIN) throw new ErrorDeNegocio(400, "La ventana tiene que ser un número de minutos mayor a 0")
    filtros.ventanaMin = minutos
  }
  if (query.detalle === "1" || query.detalle === "true") filtros.detalle = true
  return { origen, filtros }
}

export function rutasMetricasAgentes(servicio: ServicioMetricas) {
  const router = Router()
  router.use(soloLoopback)

  router.get("/origenes", (_req, res) => {
    res.json(servicio.origenes())
  })

  // Server-Sent Events: el servidor manda el estado completo cada vez que cambia el log.
  router.get("/eventos", (req, res) => {
    const { origen, filtros } = leerConsulta(req.query, servicio.origenes().map((o) => o.id))
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    })
    res.write("retry: 3000\n\n")
    const cancelar = servicio.suscribir(origen, filtros, (m) => res.write(`event: metricas\ndata: ${JSON.stringify(m)}\n\n`))
    const latido = setInterval(() => res.write(": ping\n\n"), 20_000)
    req.on("close", () => {
      clearInterval(latido)
      cancelar()
    })
  })

  router.get("/", (req, res) => {
    const { origen, filtros } = leerConsulta(req.query, servicio.origenes().map((o) => o.id))
    res.json(servicio.obtener(origen, filtros))
  })

  return router
}
