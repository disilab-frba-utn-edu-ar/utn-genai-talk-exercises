// Progreso de quien resuelve los ejercicios: qué terminó y, en el 3, su tablero. Vive en este
// navegador: es progreso personal, no algo que se entregue.
import { useSyncExternalStore } from "react"

const CLAVE = "ejercicios:terminados"
const CAMBIO = "ejercicios:progreso"

/** Métricas muestra lo mismo que los logs, más fácil de leer: se habilita al terminar el ejercicio 1. */
export const HABILITA_METRICAS = "01-observabilidad-con-hooks"
/** El ejercicio 3 se habilita al terminar el 2. */
export const HABILITA_SDD = "02-skill-y-mcp"

// Sin almacenamiento (modo privado) se recuerda solo mientras la pestaña esté abierta.
const enMemoria = new Map<string, string>()

function leer(clave: string): string | null {
  try {
    return localStorage.getItem(clave)
  } catch {
    return enMemoria.get(clave) ?? null
  }
}

export function guardar(clave: string, valor: unknown) {
  const crudo = JSON.stringify(valor)
  enMemoria.set(clave, crudo)
  try {
    localStorage.setItem(clave, crudo)
  } catch {
    // queda en memoria
  }
  window.dispatchEvent(new Event(CAMBIO))
}

function suscribir(avisar: () => void) {
  // "storage" llega desde otras pestañas; CAMBIO, desde esta.
  window.addEventListener(CAMBIO, avisar)
  window.addEventListener("storage", avisar)
  return () => {
    window.removeEventListener(CAMBIO, avisar)
    window.removeEventListener("storage", avisar)
  }
}

/** El JSON guardado en `clave`, tal cual (lo valida quien lo usa). undefined si no hay nada o está roto. */
export function useGuardado(clave: string): unknown {
  const crudo = useSyncExternalStore(suscribir, () => leer(clave), () => null)
  if (crudo === null) return undefined
  try {
    return JSON.parse(crudo)
  } catch {
    return undefined
  }
}

const terminados = (valor: unknown): string[] =>
  Array.isArray(valor) ? valor.filter((x): x is string => typeof x === "string") : []

export function marcarTerminado(id: string) {
  let valor: unknown
  try {
    valor = JSON.parse(leer(CLAVE) ?? "[]")
  } catch {
    valor = []
  }
  guardar(CLAVE, [...new Set([...terminados(valor), id])])
}

export function useTerminado(id: string): boolean {
  return terminados(useGuardado(CLAVE)).includes(id)
}
