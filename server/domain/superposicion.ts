// Restricción de dominio: una mentora no puede tener dos sesiones confirmadas que se superpongan.
import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"

export type RangoDeSesion = {
  mentoraId: string
  fecha: string
  horaInicio: string
  horaFin: string
}

/**
 * true si el rango pedido se cruza con alguna sesión confirmada de la misma
 * mentora y la misma fecha. Los rangos son semiabiertos [inicio, fin): una
 * sesión que termina 10:30 y otra que empieza 10:30 no se superponen.
 */
export function haySuperposicion(sesiones: Sesion[], { mentoraId, fecha, horaInicio, horaFin }: RangoDeSesion): boolean {
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
