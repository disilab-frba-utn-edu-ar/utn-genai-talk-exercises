import type { Repositorios } from "../repositories"

export function crearServicioCatalogos(repos: Repositorios) {
  return {
    habilidades: () => repos.habilidades.listar(),
    tiposAsesoria: () => repos.tiposAsesoria.listar(),
    colectivos: () => repos.colectivos.listar(),
  }
}
