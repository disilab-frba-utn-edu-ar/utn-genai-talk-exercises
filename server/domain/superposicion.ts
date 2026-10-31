// Detección de superposición entre sesiones de una mentora (constitution: una
// mentora no puede tener dos sesiones confirmadas que se superpongan).
import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"

export type Candidata = Pick<Sesion, "mentoraId" | "fecha" | "horaInicio" | "horaFin">

/**
 * Indica si `candidata` se superpone con alguna sesión confirmada de la misma
 * mentora en la misma fecha. Los extremos que se tocan (una termina 10:30 y la
 * otra empieza 10:30) no cuentan como superposición. Función pura: no hace IO.
 */
export function haySuperposicion(sesiones: Sesion[], candidata: Candidata): boolean {
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
