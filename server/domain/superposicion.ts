import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"

type Parametros = {
  mentoraId: string
  fecha: string
  horaInicio: string
  horaFin: string
}

/**
 * Detecta si el rango [horaInicio, horaFin) de una mentora se superpone con alguna
 * sesión confirmada de la misma mentora y la misma fecha. Una sesión que termina
 * exactamente cuando otra empieza NO se considera superposición.
 * Función pura: no hace IO.
 */
export function haySuperposicion(
  sesiones: Sesion[],
  { mentoraId, fecha, horaInicio, horaFin }: Parametros,
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
