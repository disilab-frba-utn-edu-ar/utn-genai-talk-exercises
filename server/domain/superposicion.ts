// Detección de sesiones superpuestas de una mentora (Restricción de Dominio).
import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"

export type IntervaloDeSesion = Pick<Sesion, "mentoraId" | "fecha" | "horaInicio" | "horaFin">

/**
 * Indica si el intervalo se superpone con alguna sesión confirmada de la misma
 * mentora en la misma fecha. Los intervalos son semiabiertos [inicio, fin):
 * una sesión que termina 10:30 y otra que empieza 10:30 no se superponen.
 */
export function haySuperposicion(sesiones: readonly Sesion[], { mentoraId, fecha, horaInicio, horaFin }: IntervaloDeSesion): boolean {
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
