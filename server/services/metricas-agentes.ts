// Caso de uso de las métricas de agentes: lee los logs, calcula con el dominio y avisa a los
// clientes en vivo. La vigilancia es una sola por proceso: arranca con el primer suscriptor
// y se detiene con el último. `fs.watch` solo dispara una relectura; el polling cubre lo que
// `fs.watch` pierde (eventos duplicados en Windows, carpetas de red, logs/ que todavía no existe
// o que logs:limpiar movió).
import { watch, type FSWatcher } from "node:fs"
import type { FiltrosMetricas, MetricasAgentes, OrigenDisponible, OrigenLogs } from "@shared/types"
import { calcularMetricas } from "../domain/metricas-agentes"
import type { LectorLogs, RepositorioLogs } from "../repositories/logs-agentes"
import { ErrorDeNegocio } from "./errores"

export type OpcionesMetricas = {
  reloj?: () => Date
  /** Cada cuánto se revisan los logs aunque `fs.watch` no avise. */
  intervaloPollingMs?: number
  /** Espera tras un aviso de `fs.watch`, para juntar ráfagas de eventos. */
  debounceMs?: number
}

type Suscriptor = { origen: OrigenLogs; filtros: FiltrosMetricas; alCambiar: (m: MetricasAgentes) => void; ultimo: string; enCurso: boolean }

const sinGenerado = (m: MetricasAgentes) => JSON.stringify({ ...m, generado: undefined })

export function crearServicioMetricas(repo: RepositorioLogs, raiz: string, { reloj = () => new Date(), intervaloPollingMs = 2000, debounceMs = 300 }: OpcionesMetricas = {}) {
  const lectores = new Map<OrigenLogs, LectorLogs>()
  const suscriptores = new Set<Suscriptor>()
  let temporizador: NodeJS.Timeout | undefined
  let pendiente: NodeJS.Timeout | undefined
  let vigilante: FSWatcher | undefined

  function lectorDe(origen: OrigenLogs): LectorLogs {
    const lector = lectores.get(origen) ?? repo.lector(origen)
    if (!lector) throw new ErrorDeNegocio(400, "El origen de logs no existe")
    lectores.set(origen, lector)
    return lector
  }

  function calcular(origen: OrigenLogs, filtros: FiltrosMetricas) {
    return calcularMetricas(lectorDe(origen).entradas(), filtros, reloj(), { raiz, origen })
  }

  function revisar() {
    const cambiaron = new Set<OrigenLogs>()
    for (const origen of new Set([...suscriptores].map((s) => s.origen))) {
      try {
        if (lectorDe(origen).actualizar()) cambiaron.add(origen)
      } catch {
        // el origen archivado desapareció: sus suscriptores no reciben más datos
      }
    }
    for (const s of suscriptores) {
      // Aunque no haya líneas nuevas, lo "en curso" avanza con el reloj.
      if (!cambiaron.has(s.origen) && !s.enCurso) continue
      try {
        enviar(s, calcular(s.origen, s.filtros))
      } catch {
        // idem
      }
    }
    vigilar()
  }

  function enviar(s: Suscriptor, metricas: MetricasAgentes) {
    s.enCurso = metricas.enCurso.length > 0
    const texto = sinGenerado(metricas)
    if (texto === s.ultimo) return
    s.ultimo = texto
    s.alCambiar(metricas)
  }

  function vigilar() {
    if (vigilante) return
    try {
      vigilante = watch(repo.logsDir, { recursive: true }, () => {
        clearTimeout(pendiente)
        pendiente = setTimeout(revisar, debounceMs)
      })
      vigilante.on("error", () => detenerVigilante()) // se reintenta en el próximo ciclo de polling
    } catch {
      // logs/ todavía no existe (o la plataforma no soporta recursive): queda el polling
    }
  }

  function detenerVigilante() {
    vigilante?.close()
    vigilante = undefined
  }

  function detener() {
    clearInterval(temporizador)
    clearTimeout(pendiente)
    temporizador = undefined
    detenerVigilante()
  }

  return {
    origenes: (): OrigenDisponible[] => repo.origenes(),

    obtener(origen: OrigenLogs, filtros: FiltrosMetricas): MetricasAgentes {
      lectorDe(origen).actualizar()
      return calcular(origen, filtros)
    },

    /** Entrega el estado actual enseguida y después cada cambio. Devuelve la función para cancelar. */
    suscribir(origen: OrigenLogs, filtros: FiltrosMetricas, alCambiar: (m: MetricasAgentes) => void): () => void {
      const lector = lectorDe(origen)
      lector.actualizar()
      const s: Suscriptor = { origen, filtros, alCambiar, ultimo: "", enCurso: false }
      suscriptores.add(s)
      enviar(s, calcular(origen, filtros))
      if (!temporizador) {
        temporizador = setInterval(revisar, intervaloPollingMs)
        vigilar()
      }
      return () => {
        suscriptores.delete(s)
        if (suscriptores.size === 0) detener()
      }
    },
  }
}

export type ServicioMetricas = ReturnType<typeof crearServicioMetricas>
