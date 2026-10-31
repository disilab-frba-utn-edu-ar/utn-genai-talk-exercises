// Regla de la constitution: una mentora no puede tener dos sesiones confirmadas que se superpongan.
import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"

export type RangoDeSesion = Pick<Sesion, "mentoraId" | "fecha" | "horaInicio" | "horaFin">

/**
 * Indica si `candidata` se superpone con alguna sesión confirmada de la misma
 * mentora en la misma fecha. Los rangos son [inicio, fin): una sesión que
 * termina 10:30 y otra que empieza 10:30 no se superponen.
 */
export function haySuperposicion(sesiones: Sesion[], candidata: RangoDeSesion): boolean {
  const inicio = aMinutos(candidata.horaInicio)
  const fin = aMinutos(candidata.horaFin)
  return sesiones.some(
    (s) =>
      s.estado === "confirmada" &&
      s.mentoraId === candidata.mentoraId &&
      s.fecha === candidata.fecha &&
      aMinutos(s.horaInicio) < fin &&
      inicio < aMinutos(s.horaFin),
  )
}
