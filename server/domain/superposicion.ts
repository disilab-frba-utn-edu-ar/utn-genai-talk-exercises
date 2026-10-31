// Detección de superposición de sesiones de una mentora. Función pura, sin IO.
import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"

type Franja = { mentoraId: string; fecha: string; horaInicio: string; horaFin: string }

/**
 * ¿La franja propuesta se superpone con alguna sesión confirmada de la misma
 * mentora el mismo día? Los extremos que se tocan (termina 10:30, empieza 10:30)
 * no cuentan como superposición.
 */
export function haySuperposicion(sesiones: Sesion[], franja: Franja): boolean {
  const inicio = aMinutos(franja.horaInicio)
  const fin = aMinutos(franja.horaFin)
  return sesiones.some(
    (s) =>
      s.estado === "confirmada" &&
      s.mentoraId === franja.mentoraId &&
      s.fecha === franja.fecha &&
      aMinutos(s.horaInicio) < fin &&
      inicio < aMinutos(s.horaFin),
  )
}
