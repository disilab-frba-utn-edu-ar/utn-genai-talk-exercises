// Detección de superposición de horarios. Pura: sin IO, sin Express.
import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"

type SesionNueva = {
  mentoraId: string
  fecha: string
  horaInicio: string
  horaFin: string
}

/**
 * Devuelve true si hay alguna sesión confirmada de la misma mentora y fecha
 * que se superpone con el rango [horaInicio, horaFin).
 *
 * Dos sesiones se superpongan si empieza una antes de que termine la otra:
 *   inicioA < finB  &&  inicioB < finA
 *
 * Que una termine exactamente cuando la otra empieza (p. ej. 10:30 y 10:30)
 * NO se considera superposición.
 */
export function haySuperposicion(
  sesiones: Sesion[],
  { mentoraId, fecha, horaInicio, horaFin }: SesionNueva,
): boolean {
  const inicio = aMinutos(horaInicio)
  const fin = aMinutos(horaFin)
  return sesiones.some(
    (s) =>
      s.estado === "confirmada" &&
      s.mentoraId === mentoraId &&
      s.fecha === fecha &&
      aMinutos(s.horaInicio) < fin &&
      inicio < aMinutos(s.horaFin),
  )
}