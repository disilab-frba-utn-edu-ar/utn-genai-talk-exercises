// Detección de sesiones superpuestas de una mentora. Función pura: sin IO.
import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"

type RangoReservado = Pick<Sesion, "mentoraId" | "fecha" | "horaInicio" | "horaFin">

/**
 * Indica si el rango propuesto se superpone con alguna sesión confirmada de la
 * misma mentora y la misma fecha. Los extremos que se tocan (una termina a las
 * 10:30 y otra empieza a las 10:30) no cuentan como superposición.
 */
export function haySuperposicion(sesiones: Sesion[], { mentoraId, fecha, horaInicio, horaFin }: RangoReservado): boolean {
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
