// El tablero del ejercicio 3: qué historias tomó quien lo resuelve. Las reglas son puras (se testean
// sin DOM) y el estado se guarda con el progreso, en este navegador.
import contenido from "../03-sdd/tablero.json"
import { guardar, useGuardado } from "./progreso"

export const ID_SDD = "03-sdd"

export type Historia =(typeof contenido.historias)[number]
export type Hecha = (typeof contenido.hechas)[number]
export const { introduccion, felicitacion, hechas, historias, notas } = contenido

export type Columna = "todo" | "en-curso" | "hecho"

/** `elegidas` en el orden en que se tomaron: la primera es la principal. */
export type EstadoTablero = { introVista: boolean; elegidas: string[]; terminadas: string[] }

const CLAVE = "ejercicios:tablero-sdd"
const VACIO: EstadoTablero = { introVista: false, elegidas: [], terminadas: [] }

const ids = (valor: unknown): string[] =>
  Array.isArray(valor) ? valor.filter((x): x is string => historias.some((h) => h.id === x)) : []

export function leerEstado(valor: unknown): EstadoTablero {
  if (typeof valor !== "object" || valor === null) return VACIO
  const v = valor as Record<string, unknown>
  return { introVista: v.introVista === true, elegidas: ids(v.elegidas), terminadas: ids(v.terminadas) }
}

export function columnaDe(estado: EstadoTablero, id: string): Columna {
  if (estado.terminadas.includes(id)) return "hecho"
  return estado.elegidas.includes(id) ? "en-curso" : "todo"
}

/** El título de la primera historia que se tomó (la principal). */
export const tituloPrincipal = (estado: EstadoTablero) => historias.find((h) => h.id === estado.elegidas[0])?.titulo

/** La que está en In Progress ahora (como mucho una). */
export const enCurso = (estado: EstadoTablero) => estado.elegidas.find((id) => !estado.terminadas.includes(id))

/**
 * De To Do a In Progress si no hay otra en curso; de In Progress a Done, o de vuelta a To Do para
 * cambiar de tarea. Done es definitivo. Devuelve el estado nuevo, o null si el movimiento no se permite.
 */
export function mover(estado: EstadoTablero, id: string, destino: Columna): EstadoTablero | null {
  const desde = columnaDe(estado, id)
  if (desde === "todo" && destino === "en-curso" && !enCurso(estado)) return { ...estado, elegidas: [...estado.elegidas, id] }
  if (desde === "en-curso" && destino === "hecho") return { ...estado, terminadas: [...estado.terminadas, id] }
  if (desde === "en-curso" && destino === "todo") return { ...estado, elegidas: estado.elegidas.filter((e) => e !== id) }
  return null
}

export function useTablero() {
  const estado = leerEstado(useGuardado(CLAVE))
  return {
    estado,
    puedeMover: (id: string, destino: Columna) => mover(estado, id, destino) !== null,
    /** true si se movió. */
    mover: (id: string, destino: Columna) => {
      const nuevo = mover(estado, id, destino)
      if (nuevo) guardar(CLAVE, nuevo)
      return nuevo !== null
    },
    terminarIntro: () => guardar(CLAVE, { ...estado, introVista: true }),
  }
}
