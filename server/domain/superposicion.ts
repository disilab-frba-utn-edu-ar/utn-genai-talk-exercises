// Detección de superposición de sesiones de una mentora. Función pura, sin IO.
import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"

export type FranjaSesion = Pick<Sesion, "mentoraId" | "fecha" | "horaInicio" | "horaFin">

/**
 * Indica si la franja propuesta se superpone con alguna sesión confirmada de la
 * misma mentora en la misma fecha. Tocarse en el borde (una termina cuando
 * empieza la otra) no cuenta como superposición.
 */
export function haySuperposicion(sesiones: readonly Sesion[], propuesta: FranjaSesion): boolean {
  const inicio = aMinutos(propuesta.horaInicio)
  const fin = aMinutos(propuesta.horaFin)
  return sesiones.some(
    (s) =>
      s.estado === "confirmada" &&
      s.mentoraId === propuesta.mentoraId &&
      s.fecha === propuesta.fecha &&
      aMinutos(s.horaInicio) < fin &&
      inicio < aMinutos(s.horaFin),
  )
}
