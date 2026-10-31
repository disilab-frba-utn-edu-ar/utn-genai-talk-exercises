import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"

export interface ParametrosSuperposicion {
  mentoraId: string
  fecha: string
  horaInicio: string
  horaFin: string
}

/**
 * Detecta si una nueva sesión se superpone con alguna sesión confirmada de la
 * misma mentora y mismo día.
 *
 * Una sesión que termina 10:30 y otra que empieza 10:30 NO se superponen:
 * el intervalo abierto (inicio < fin) se usa en ambos lados.
 *
 * Solo cuentan sesiones con estado "confirmada", mismo `mentoraId` y misma `fecha`.
 * Esta función no hace IO.
 */
export function haySuperposicion(
  sesiones: Sesion[],
  { mentoraId, fecha, horaInicio, horaFin }: ParametrosSuperposicion,
): boolean {
  const fin = aMinutos(horaFin)
  const inicio = aMinutos(horaInicio)

  return sesiones.some((s) => {
    if (s.mentoraId !== mentoraId) return false
    if (s.fecha !== fecha) return false
    if (s.estado !== "confirmada") return false
    const sFin = aMinutos(s.horaFin)
    const sInicio = aMinutos(s.horaInicio)
    return sInicio < fin && inicio < sFin
  })
}
