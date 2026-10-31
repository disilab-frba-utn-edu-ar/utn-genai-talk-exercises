// Restricción de dominio: una mentora no puede tener dos sesiones confirmadas que se superpongan.
import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"

export type Intervalo = Pick<Sesion, "mentoraId" | "fecha" | "horaInicio" | "horaFin">

/**
 * Indica si `nueva` se superpone con alguna sesión confirmada de la misma mentora y fecha.
 * Los intervalos son semiabiertos [inicio, fin): una que termina 10:30 y otra que empieza 10:30 no chocan.
 */
export function haySuperposicion(sesiones: Sesion[], nueva: Intervalo): boolean {
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
