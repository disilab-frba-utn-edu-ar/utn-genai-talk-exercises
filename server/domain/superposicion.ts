// Detección de superposición de sesiones de una mentora. Pura: sin IO.
import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"

type RangoNuevo = { mentoraId: string; fecha: string; horaInicio: string; horaFin: string }

/**
 * Indica si el rango nuevo se superpone con alguna sesión confirmada de la misma
 * mentora y fecha. Los extremos que se tocan (termina 10:30 / empieza 10:30) no
 * cuentan como superposición.
 */
export function haySuperposicion(sesiones: Sesion[], { mentoraId, fecha, horaInicio, horaFin }: RangoNuevo): boolean {
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
