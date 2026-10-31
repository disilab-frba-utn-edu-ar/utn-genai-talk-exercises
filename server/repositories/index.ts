import type { Colectivo, Habilidad, Mentora, Sesion, TipoAsesoria } from "@shared/types"
import { crearJsonStore } from "./json-store"

export function crearRepositorios(dataDir: string) {
  const habilidades = crearJsonStore<Habilidad>(dataDir, "habilidades.json")
  const tipos = crearJsonStore<TipoAsesoria>(dataDir, "tipos-asesoria.json")
  const mentoras = crearJsonStore<Mentora>(dataDir, "mentoras.json")
  const colectivos = crearJsonStore<Colectivo>(dataDir, "colectivos.json")
  const sesiones = crearJsonStore<Sesion>(dataDir, "sesiones.json")

  return {
    habilidades: {
      listar: () => habilidades.leer(),
    },
    tiposAsesoria: {
      listar: () => tipos.leer(),
      buscar: (id: string) => tipos.leer().find((t) => t.id === id),
    },
    mentoras: {
      listar: () => mentoras.leer(),
      buscar: (id: string) => mentoras.leer().find((m) => m.id === id),
    },
    colectivos: {
      listar: () => colectivos.leer(),
      buscar: (id: string) => colectivos.leer().find((c) => c.id === id),
    },
    sesiones: {
      listar: () => sesiones.leer(),
      buscar: (id: string) => sesiones.leer().find((s) => s.id === id),
      agregar: (sesion: Sesion) => sesiones.escribir([...sesiones.leer(), sesion]),
    },
  }
}

export type Repositorios = ReturnType<typeof crearRepositorios>
