// Detección de superposición de sesiones de una mentora (regla de dominio).
// Función pura: no hace IO.
import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"

export type ParametrosSuperposicion = {
  mentoraId: string
  fecha: string
  horaInicio: string
  horaFin: string
}

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
    // Superposición: intervalos (inicio,fin) y (sInicio,sFin) se intersectan.
    // Tocarse en un extremo NO cuenta como superposición.
    return sInicio < fin && inicio < sFin
  })
}
