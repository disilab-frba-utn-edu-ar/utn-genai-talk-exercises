// Progreso de quien resuelve los ejercicios: qué terminó, por dónde va en la consigna por etapas y, en el 3,
// su tablero. Vive en este navegador: es progreso personal, no algo que se entregue.
import { useSyncExternalStore } from "react"

const CLAVE = "ejercicios:terminados"
const CAMBIO = "ejercicios:progreso"

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

/** Ejercicios que se abrieron con el candado puesto: se eligió "Avanzar igual" sin terminar el anterior. */
const CLAVE_AVANZAR_IGUAL = "ejercicios:avanzar-igual"

const ids = (valor: unknown): string[] =>
  Array.isArray(valor) ? valor.filter((x): x is string => typeof x === "string") : []

function agregar(clave: string, id: string) {
  let valor: unknown
  try {
    valor = JSON.parse(leer(clave) ?? "[]")
  } catch {
    valor = []
  }
  guardar(clave, [...new Set([...ids(valor), id])])
}

export const marcarTerminado = (id: string) => agregar(CLAVE, id)

export function useTerminado(id: string): boolean {
  return ids(useGuardado(CLAVE)).includes(id)
}

export const marcarAvanzarIgual = (id: string) => agregar(CLAVE_AVANZAR_IGUAL, id)

export function useAvanzoIgual(id: string): boolean {
  return ids(useGuardado(CLAVE_AVANZAR_IGUAL)).includes(id)
}

/* ── Consigna por etapas ─────────────────────────────────── */

/**
 * Dónde está cada quien en la consigna por etapas: la pantalla actual (o las preguntas), la más lejana
 * a la que llegó (hasta ahí se puede volver; lo que sigue está bloqueado) y los checks tildados (por su texto).
 * `visitado` distingue "nunca lo abrió" de "está en la primera pantalla".
 */
export type AvanceEtapas = { pos: number | "preguntas"; alcanzada: number; checks: string[]; visitado: boolean }

const claveEtapas = (id: string) => `ejercicios:etapas:${id}`

export function useEtapas(id: string): AvanceEtapas {
  const v = useGuardado(claveEtapas(id)) as Partial<AvanceEtapas> | undefined
  const alcanzada = typeof v?.alcanzada === "number" && v.alcanzada >= 0 ? v.alcanzada : 0
  const pos = v?.pos === "preguntas" || (typeof v?.pos === "number" && v.pos >= 0 && v.pos <= alcanzada) ? v.pos : 0
  return { pos, alcanzada, checks: ids(v?.checks), visitado: v !== undefined }
}

export const guardarEtapas = (id: string, avance: Omit<AvanceEtapas, "visitado">) => guardar(claveEtapas(id), avance)

/** Cuántas preguntas tiene respondidas (en el recuadro, guarde o no): la hoja de checks lo muestra al lado de los checks. */
export const publicarRespondidas = (id: string, cuenta: { hechas: number; total: number }) =>
  guardar(`ejercicios:respondidas:${id}`, cuenta)

export function useRespondidas(id: string): { hechas: number; total: number } | undefined {
  const v = useGuardado(`ejercicios:respondidas:${id}`) as { hechas?: unknown; total?: unknown } | undefined
  return typeof v?.hechas === "number" && typeof v.total === "number" ? { hechas: v.hechas, total: v.total } : undefined
}
