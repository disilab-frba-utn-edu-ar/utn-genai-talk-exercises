import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"

export type ParametrosSuperposicion = {
  mentoraId: string
  fecha: string
  horaInicio: string
  horaFin: string
}

/**
 * Detecta si una nueva sesión se solapa con alguna sesión confirmada
 * de la misma mentora y fecha. Dos sesiones que solo se tocan en un
 * extremo (una termina a las 10:30 y otra empieza a las 10:30) NO se
 * solapan.
 */
export function haySuperposicion(
  sesiones: Sesion[],
  { mentoraId, fecha, horaInicio, horaFin }: ParametrosSuperposicion,
): boolean {
  const inicio = aMinutos(horaInicio)
  const fin = aMinutos(horaFin)

  return sesiones.some((s) => {
    if (s.mentoraId !== mentoraId) return false
    if (s.fecha !== fecha) return false
    if (s.estado !== "confirmada") return false
    return aMinutos(s.horaInicio) < fin && inicio < aMinutos(s.horaFin)
  })
}