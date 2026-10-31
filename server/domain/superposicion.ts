// Detección de superposición de horarios. Pura: sin IO, sin Express.
import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"

export type DatosSuperposicion = {
  mentoraId: string
  fecha: string
  horaInicio: string
  horaFin: string
}

/**
 * Devuelve true si existe alguna sesión confirmada de la misma mentora y fecha
 * cuyo horario se solapa con el rango dado.
 *
 * Dos sesiones NO se superponen si una termina exactamente cuando la otra empieza
 * (ej.: 10:00-10:30 y 10:30-11:00).
 */
export function haySuperposicion(
  sesiones: Sesion[],
  { mentoraId, fecha, horaInicio, horaFin }: DatosSuperposicion,
): boolean {
  const inicioNuevo = aMinutos(horaInicio)
  const finNuevo = aMinutos(horaFin)

  return sesiones.some((s) => {
    if (s.mentoraId !== mentoraId) return false
    if (s.fecha !== fecha) return false
    if (s.estado !== "confirmada") return false

    const inicioExistente = aMinutos(s.horaInicio)
    const finExistente = aMinutos(s.horaFin)

    return inicioExistente < finNuevo && inicioNuevo < finExistente
  })
}