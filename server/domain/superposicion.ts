// Detección de superposición de sesiones de una mentora (regla de dominio pura, sin IO).
import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"

type ParametrosSuperposicion = {
  mentoraId: string
  fecha: string
  horaInicio: string
  horaFin: string
}

/**
 * Indica si alguna de las sesiones confirmadas de la misma mentora y la misma
 * fecha se superpone con el intervalo [horaInicio, horaFin). Los extremos que
 * se tocan (una termina a las 10:30 y la otra empieza a las 10:30) NO se
 * consideran superpuestos.
 */
export function haySuperposicion(
  sesiones: Sesion[],
  { mentoraId, fecha, horaInicio, horaFin }: ParametrosSuperposicion,
): boolean {
  const inicio = aMinutos(horaInicio)
  const fin = aMinutos(horaFin)
  return sesiones.some((s) => {
    if (s.estado !== "confirmada") return false
    if (s.mentoraId !== mentoraId) return false
    if (s.fecha !== fecha) return false
    const sInicio = aMinutos(s.horaInicio)
    const sFin = aMinutos(s.horaFin)
    return sInicio < fin && inicio < sFin
  })
}
