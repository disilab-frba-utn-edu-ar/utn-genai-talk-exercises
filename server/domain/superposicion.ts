// Detección de superposición de sesiones de una mentora. Función pura, sin IO.
import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"

type RangoSesion = Pick<Sesion, "mentoraId" | "fecha" | "horaInicio" | "horaFin">

/**
 * Indica si la sesión nueva se superpone con alguna sesión confirmada de la
 * misma mentora y fecha. Los extremos que se tocan (termina 10:30 / empieza
 * 10:30) no cuentan como superposición.
 */
export function haySuperposicion(sesiones: Sesion[], nueva: RangoSesion): boolean {
  const inicio = aMinutos(nueva.horaInicio)
  const fin = aMinutos(nueva.horaFin)
  return sesiones.some(
    (s) =>
      s.estado === "confirmada" &&
      s.mentoraId === nueva.mentoraId &&
      s.fecha === nueva.fecha &&
      aMinutos(s.horaInicio) < fin &&
      inicio < aMinutos(s.horaFin),
  )
}
