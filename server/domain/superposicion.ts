// Una mentora no puede tener dos sesiones confirmadas que se superpongan (constitución).
import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"

export type FranjaPedida = Pick<Sesion, "mentoraId" | "fecha" | "horaInicio" | "horaFin">

/**
 * Indica si la franja pedida choca con alguna sesión confirmada de la misma mentora
 * en la misma fecha. Los rangos son [inicio, fin): terminar a las 10:30 y empezar
 * a las 10:30 no es superposición.
 */
export function haySuperposicion(sesiones: Sesion[], { mentoraId, fecha, horaInicio, horaFin }: FranjaPedida): boolean {
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
