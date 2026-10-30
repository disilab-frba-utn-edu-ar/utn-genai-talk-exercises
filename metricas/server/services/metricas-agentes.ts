// Caso de uso de las métricas de agentes: lee los logs, calcula con el dominio y avisa a los
// clientes en vivo. La vigilancia es una sola por proceso: arranca con el primer suscriptor
// y se detiene con el último. `fs.watch` solo dispara una relectura; el polling cubre lo que
// `fs.watch` pierde (eventos duplicados en Windows, carpetas de red, logs/ que todavía no existe
// o que logs:limpiar movió).
import { watch, type FSWatcher } from "node:fs"
import type { AgenteLog, FiltrosMetricas, MetricasAgentes, OrigenDisponible, OrigenLogs, TablaPrecios } from "../../tipos"
import { calcularMetricas } from "../domain/metricas-agentes"
import type { LectorLogs, RepositorioLogs } from "../repositories/logs-agentes"
import type { SesionDeLog, crearRepositorioTranscripciones } from "../repositories/transcripciones-agentes"
import { ErrorDeNegocio } from "../../../server/services/errores"

export type OpcionesMetricas = {
  reloj?: () => Date
  /** Carpeta personal donde los agentes guardan sus transcripciones (por defecto, la del usuario). Los tests usan una temporal. */
  homeDir?: string
  /** Tabla de precios por modelo (por defecto metricas/precios-modelos.json). */
  precios?: TablaPrecios
  /** Cada cuánto se revisan los logs aunque `fs.watch` no avise. */
  intervaloPollingMs?: number
  /** Espera tras un aviso de `fs.watch`, para juntar ráfagas de eventos. */
  debounceMs?: number
}

type Suscriptor = { origen: OrigenLogs; filtros: FiltrosMetricas; alCambiar: (m: MetricasAgentes) => void; ultimo: string; enCurso: boolean }

const sinGenerado = (m: MetricasAgentes) => JSON.stringify({ ...m, generado: undefined })

type Transcripciones = ReturnType<typeof crearRepositorioTranscripciones>

export function crearServicioMetricas(
  repo: RepositorioLogs,
  transcripciones: Transcripciones,
  raiz: string,
  precios: TablaPrecios,
  { reloj = () => new Date(), intervaloPollingMs = 2000, debounceMs = 300 }: OpcionesMetricas = {},
) {
  const lectores = new Map<OrigenLogs, LectorLogs>()
  const lectoresUso = new Map<OrigenLogs, ReturnType<Transcripciones["lector"]>>()
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

  /** Qué transcripción buscar para cada sesión: lo que dejaron los hooks en el log (ruta y modelo). */
  function sesionesDeLog(origen: OrigenLogs): SesionDeLog[] {
    const sesiones = new Map<string, SesionDeLog>()
    for (const e of lectorDe(origen).entradas()) {
      if (!e.session || !["claude", "codex", "cline"].includes(String(e.agent))) continue
      const agente = e.agent as AgenteLog
      const previa = sesiones.get(`${agente}:${e.session}`)
      sesiones.set(`${agente}:${e.session}`, { agente, sesion: e.session, transcriptPath: e.transcriptPath ?? previa?.transcriptPath, modelo: e.model ?? previa?.modelo })
    }
    return [...sesiones.values()]
  }

  /** Lee lo nuevo de las transcripciones. Devuelve true si hay tokens nuevos. */
  function actualizarUso(origen: OrigenLogs): boolean {
    const lector = lectoresUso.get(origen) ?? transcripciones.lector()
    lectoresUso.set(origen, lector)
    return lector.actualizar(sesionesDeLog(origen))
  }

  function calcular(origen: OrigenLogs, filtros: FiltrosMetricas) {
    return calcularMetricas(lectorDe(origen).entradas(), filtros, reloj(), { raiz, origen, usos: lectoresUso.get(origen)?.usos() ?? [], precios })
  }

  function revisar() {
    const cambiaron = new Set<OrigenLogs>()
    for (const origen of new Set([...suscriptores].map((s) => s.origen))) {
      try {
        const hayLineas = lectorDe(origen).actualizar()
        if (actualizarUso(origen) || hayLineas) cambiaron.add(origen)
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
      actualizarUso(origen)
      return calcular(origen, filtros)
    },

    /** Entrega el estado actual enseguida y después cada cambio. Devuelve la función para cancelar. */
    suscribir(origen: OrigenLogs, filtros: FiltrosMetricas, alCambiar: (m: MetricasAgentes) => void): () => void {
      lectorDe(origen).actualizar()
      actualizarUso(origen)
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
