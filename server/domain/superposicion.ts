// Regla de dominio: una mentora no puede tener dos sesiones confirmadas que se
// superpongan (constitution, Restricciones de Dominio). Función pura: sin IO.
import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"

export type PropuestaSesion = Pick<Sesion, "mentoraId" | "fecha" | "horaInicio" | "horaFin">

/**
 * True si la propuesta se superpone con alguna sesión confirmada de la misma
 * mentora el mismo día. Dos rangos que se tocan (una termina 10:30 y la otra
 * empieza 10:30) NO se superponen.
 */
export function haySuperposicion(sesiones: Sesion[], propuesta: PropuestaSesion): boolean {
  const inicio = aMinutos(propuesta.horaInicio)
  const fin = aMinutos(propuesta.horaFin)
  return sesiones.some(
    (s) =>
      s.mentoraId === propuesta.mentoraId &&
      s.fecha === propuesta.fecha &&
      s.estado === "confirmada" &&
      aMinutos(s.horaInicio) < fin &&
      inicio < aMinutos(s.horaFin),
  )
}

