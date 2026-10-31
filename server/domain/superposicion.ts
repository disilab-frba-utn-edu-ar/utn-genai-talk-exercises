// Detección de superposición entre sesiones de una mentora (constitution: sin dos confirmadas que se pisen).
import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"

type Franja = { mentoraId: string; fecha: string; horaInicio: string; horaFin: string }

/** Solo cuentan las sesiones confirmadas de la misma mentora y fecha; terminar justo cuando otra empieza no pisa. */
export function haySuperposicion(sesiones: Sesion[], { mentoraId, fecha, horaInicio, horaFin }: Franja): boolean {
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
