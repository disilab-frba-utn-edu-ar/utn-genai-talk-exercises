// Detección de sesiones superpuestas de una mentora. Función pura, sin IO.
import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"

type RangoNuevo = Pick<Sesion, "mentoraId" | "fecha" | "horaInicio" | "horaFin">

/**
 * Indica si el rango nuevo se superpone con alguna sesión confirmada de la misma
 * mentora y fecha. Los rangos que solo se tocan en un borde no se superponen.
 */
export function haySuperposicion(sesiones: Sesion[], nueva: RangoNuevo): boolean {
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
