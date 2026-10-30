// Único lugar de Métricas que hace fetch o abre un EventSource (Principio VI). Lo atiende
// server/routes/metricas-agentes.ts. Vive junto a la UI, separado del producto, igual que ejercicios/app/api.ts.
import type { FiltrosMetricas, MetricasAgentes, OrigenDisponible, OrigenLogs } from "../tipos"

const BASE = "/api/metricas-agentes"
const ERRORES_PARA_RENDIRSE = 3

function consulta(origen: OrigenLogs, filtros: FiltrosMetricas) {
  const params = new URLSearchParams({ origen })
  if (filtros.agente) params.set("agente", filtros.agente)
  if (filtros.sesion) params.set("sesion", filtros.sesion)
  if (filtros.ventanaMin) params.set("ventana", String(filtros.ventanaMin))
  if (filtros.detalle) params.set("detalle", "1")
  return params.toString()
}

async function pedir<T>(ruta: string): Promise<T> {
  let respuesta: Response
  try {
    respuesta = await fetch(ruta)
  } catch {
    throw new Error("No pudimos conectarnos con el servidor. ¿Está corriendo npm run dev?")
  }
  const cuerpo = await respuesta.json().catch(() => null)
  if (!respuesta.ok) throw new Error(cuerpo?.error ?? "Ocurrió un error inesperado")
  return cuerpo as T
}

export const leerOrigenes = () => pedir<OrigenDisponible[]>(`${BASE}/origenes`)

export const leerMetricas = (origen: OrigenLogs, filtros: FiltrosMetricas) => pedir<MetricasAgentes>(`${BASE}?${consulta(origen, filtros)}`)

export type Oyentes = {
  alRecibir: (m: MetricasAgentes) => void
  /** Un error de conexión: EventSource reintenta solo. */
  alReconectar: () => void
  /** Tres errores seguidos: se cierra la conexión y el que llama pasa a consultar por HTTP. */
  alRendirse: () => void
}

/** Se suscribe al stream de eventos (SSE). Devuelve la función que cierra la conexión. */
export function suscribirse(origen: OrigenLogs, filtros: FiltrosMetricas, { alRecibir, alReconectar, alRendirse }: Oyentes): () => void {
  const fuente = new EventSource(`${BASE}/eventos?${consulta(origen, filtros)}`)
  let errores = 0
  fuente.addEventListener("metricas", (evento) => {
    errores = 0
    alRecibir(JSON.parse((evento as MessageEvent<string>).data) as MetricasAgentes)
  })
  fuente.addEventListener("error", () => {
    errores++
    if (errores < ERRORES_PARA_RENDIRSE) return alReconectar()
    fuente.close()
    alRendirse()
  })
  return () => fuente.close()
}
