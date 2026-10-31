import type { DiaDisponible, MentoraPublica } from "@shared/types"
import { calcularDiasDisponibles } from "../domain/horarios"
import { aMentoraPublica, puedeDar } from "../domain/mentoras"
import type { Repositorios } from "../repositories"
import { invalido, noEncontrado } from "./errores"

export const DIAS_RESERVABLES = 14

export function crearServicioMentoras(repos: Repositorios, reloj: () => Date) {
  return {
    listar(habilidad?: string): MentoraPublica[] {
      const tipos = repos.tiposAsesoria.listar()
      const sesiones = repos.sesiones.listar()
      const ahora = reloj()
      return repos.mentoras
        .listar()
        .filter((m) => !habilidad || m.habilidades.includes(habilidad))
        .map((m) =>
          aMentoraPublica(m, tipos, sesiones.filter((s) => s.mentoraId === m.id), ahora),
        )
    },

    obtener(id: string): MentoraPublica {
      const mentora = repos.mentoras.buscar(id)
      if (!mentora) throw noEncontrado("La mentora no existe")
      const sesiones = repos.sesiones.listar().filter((s) => s.mentoraId === id)
      return aMentoraPublica(mentora, repos.tiposAsesoria.listar(), sesiones, reloj())
    },

    disponibilidad(id: string, tipoAsesoriaId: string | undefined, dias = DIAS_RESERVABLES): DiaDisponible[] {
      const mentora = repos.mentoras.buscar(id)
      if (!mentora) throw noEncontrado("La mentora no existe")
      if (!tipoAsesoriaId) throw invalido("Falta el tipo de asesoría")
      const tipo = repos.tiposAsesoria.buscar(tipoAsesoriaId)
      if (!tipo) throw noEncontrado("El tipo de asesoría no existe")
      if (!puedeDar(mentora, tipo)) throw invalido("La mentora no ofrece ese tipo de asesoría")

      return calcularDiasDisponibles({
        disponibilidad: mentora.disponibilidad,
        sesiones: repos.sesiones.listar().filter((s) => s.mentoraId === id),
        duracionMinutos: tipo.duracionMinutos,
        cupoHoras: mentora.cupoMensualHoras,
        ahora: reloj(),
        dias: Math.min(Math.max(dias, 1), DIAS_RESERVABLES),
      })
    },
  }
}
