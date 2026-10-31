import type { DiaDisponible, MentoraPublica } from "@shared/types"
import { elegirMentora, unirDiasDisponibles } from "../domain/asignacion"
import { aHora, aMinutos, esFechaValida, esHoraValida, fechaDe } from "../domain/fechas"
import { calcularDiasDisponibles } from "../domain/horarios"
import { aMentoraPublica, puedeDar } from "../domain/mentoras"
import type { Repositorios } from "../repositories"
import { conflicto, invalido, noEncontrado } from "./errores"
import { DIAS_RESERVABLES } from "./mentoras"

/** Reservar eligiendo solo el tipo de asesoría (specs/003-reservar-por-tipo). */
export function crearServicioReservaPorTipo(repos: Repositorios, reloj: () => Date) {
  function buscarTipo(tipoAsesoriaId: string) {
    const tipo = repos.tiposAsesoria.buscar(tipoAsesoriaId)
    if (!tipo) throw noEncontrado("El tipo de asesoría no existe")
    return tipo
  }

  return {
    disponibilidad(tipoAsesoriaId: string, dias = DIAS_RESERVABLES): DiaDisponible[] {
      const tipo = buscarTipo(tipoAsesoriaId)
      const sesiones = repos.sesiones.listar()
      const ahora = reloj()
      return unirDiasDisponibles(
        repos.mentoras
          .listar()
          .filter((m) => puedeDar(m, tipo))
          .map((m) =>
            calcularDiasDisponibles({
              disponibilidad: m.disponibilidad,
              sesiones: sesiones.filter((s) => s.mentoraId === m.id),
              duracionMinutos: tipo.duracionMinutos,
              ahora,
              dias: Math.min(Math.max(dias, 1), DIAS_RESERVABLES),
            }),
          ),
      )
    },

    asignar(tipoAsesoriaId: string, fecha: string | undefined, horaInicio: string | undefined): MentoraPublica {
      if (!fecha) throw invalido("Falta la fecha")
      if (!horaInicio) throw invalido("Falta la hora de inicio")
      if (!esFechaValida(fecha)) throw invalido("La fecha debe tener el formato AAAA-MM-DD")
      if (!esHoraValida(horaInicio)) throw invalido("La hora de inicio debe tener el formato HH:MM")
      const tipo = buscarTipo(tipoAsesoriaId)

      const ahora = reloj()
      const hoy = fechaDe(ahora)
      const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes()
      if (fecha < hoy || (fecha === hoy && aMinutos(horaInicio) <= minutosAhora)) {
        throw invalido("No se puede reservar una sesión en el pasado")
      }

      const horaFin = aHora(aMinutos(horaInicio) + tipo.duracionMinutos)
      const candidatas = repos.mentoras.listar().filter((m) => puedeDar(m, tipo))
      const mentora = elegirMentora(candidatas, repos.sesiones.listar(), { fecha, horaInicio, horaFin }, hoy)
      if (!mentora) throw conflicto("No hay mentoras libres en ese horario")
      return aMentoraPublica(mentora, repos.tiposAsesoria.listar())
    },
  }
}
