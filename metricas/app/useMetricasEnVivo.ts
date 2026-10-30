import type { FiltrosMetricas, MetricasAgentes, OrigenLogs } from "../tipos"
import { useCallback, useEffect, useState } from "react"
import { leerMetricas, suscribirse } from "./api"

export type Conexion = "envivo" | "reconectando" | "consultando"

export type Metricas =
  /** `previo`: los últimos datos recibidos (de otro filtro), para no vaciar los selectores mientras carga. */
  | { estado: "cargando"; previo?: MetricasAgentes }
  | { estado: "error"; error: string; reintentar: () => void }
  | { estado: "lista"; datos: MetricasAgentes; conexion: Conexion }

type Recibido = { clave: string; datos?: MetricasAgentes; previo?: MetricasAgentes; error?: string; conexion: Conexion }

const CADA_MS = 5000

/**
 * Métricas en vivo: SSE y, si falla tres veces seguidas, consulta por HTTP cada 5 s.
 * Cada cambio de filtro, de origen o de "reintentar" abre una conexión nueva.
 */
export function useMetricasEnVivo(origen: OrigenLogs, filtros: FiltrosMetricas): Metricas {
  const [intento, setIntento] = useState(0)
  const [recibido, setRecibido] = useState<Recibido | null>(null)
  const clave = `${origen}|${filtros.agente ?? ""}|${filtros.sesion ?? ""}|${filtros.ventanaMin ?? ""}|${filtros.detalle ? 1 : 0}#${intento}`
  const reintentar = useCallback(() => setIntento((n) => n + 1), [])

  useEffect(() => {
    let vigente = true
    let sondeo: ReturnType<typeof setInterval> | undefined
    // Conserva los últimos datos de esta conexión cuando solo cambia el estado de la conexión.
    const actualizar = (cambio: Omit<Recibido, "clave">) =>
      vigente &&
      setRecibido((anterior) => ({
        clave,
        datos: anterior?.clave === clave ? anterior.datos : undefined,
        previo: cambio.datos ?? anterior?.datos ?? anterior?.previo,
        ...cambio,
      }))

    const consultar = () =>
      leerMetricas(origen, filtros).then(
        (datos) => actualizar({ datos, conexion: "consultando" }),
        (error: unknown) => actualizar({ error: error instanceof Error ? error.message : String(error), conexion: "consultando" }),
      )

    const cancelar = suscribirse(origen, filtros, {
      alRecibir: (datos) => actualizar({ datos, conexion: "envivo" }),
      alReconectar: () => actualizar({ conexion: "reconectando" }),
      alRendirse: () => {
        void consultar()
        sondeo = setInterval(consultar, CADA_MS)
      },
    })
    return () => {
      vigente = false
      cancelar()
      clearInterval(sondeo)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `clave` identifica origen y filtros; el objeto `filtros` cambia en cada render
  }, [clave])

  if (recibido?.clave !== clave) return { estado: "cargando", previo: recibido?.datos ?? recibido?.previo }
  if (recibido.datos) return { estado: "lista", datos: recibido.datos, conexion: recibido.conexion }
  if (recibido.error !== undefined) return { estado: "error", error: recibido.error, reintentar }
  return { estado: "cargando", previo: recibido.previo }
}
