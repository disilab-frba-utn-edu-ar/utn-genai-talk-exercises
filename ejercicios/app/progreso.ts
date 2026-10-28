// Qué ejercicios marcó como terminados quien los resuelve. Vive en este navegador: es progreso
// personal, no algo que se entregue.
import { useSyncExternalStore } from "react"

const CLAVE = "ejercicios:terminados"
const CAMBIO = "ejercicios:progreso"

/** Métricas muestra lo mismo que los logs, más fácil de leer: se habilita al terminar el ejercicio 1. */
export const HABILITA_METRICAS = "01-observabilidad-con-hooks"

// Sin almacenamiento (modo privado) se recuerda solo mientras la pestaña esté abierta.
let enMemoria = "[]"

function leer(): string {
  try {
    return localStorage.getItem(CLAVE) ?? "[]"
  } catch {
    return enMemoria
  }
}

const terminados = (crudo: string): string[] => {
  try {
    const lista: unknown = JSON.parse(crudo)
    return Array.isArray(lista) ? lista.filter((x): x is string => typeof x === "string") : []
  } catch {
    return []
  }
}

export function marcarTerminado(id: string) {
  enMemoria = JSON.stringify([...new Set([...terminados(leer()), id])])
  try {
    localStorage.setItem(CLAVE, enMemoria)
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

export function useTerminado(id: string): boolean {
  const crudo = useSyncExternalStore(suscribir, leer, () => "[]")
  return terminados(crudo).includes(id)
}
