// Detección de superposición de sesiones. Pura: sin IO, sin Express.
import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"

export type VerificarSuperposicion = {
  mentoraId: string
  fecha: string
  horaInicio: string
  horaFin: string
}

/**
 * Devuelve true si alguna sesión confirmada de la misma mentora y fecha se
 * superpone con el intervalo [horaInicio, horaFin).
 *
 * Dos sesiones que solo se tocan en un borde (una termina a las 10:30 y la
 * otra empieza a las 10:30) NO se superponen.
 */
export function haySuperposicion(
  sesiones: Sesion[],
  { mentoraId, fecha, horaInicio, horaFin }: VerificarSuperposicion,
): boolean {
  const inicio = aMinutos(horaInicio)
  const fin = aMinutos(horaFin)
  return sesiones.some(
    (s) =>
      s.mentoraId === mentoraId &&
      s.fecha === fecha &&
      s.estado === "confirmada" &&
      aMinutos(s.horaInicio) < fin &&
      inicio < aMinutos(s.horaFin),
  )
}