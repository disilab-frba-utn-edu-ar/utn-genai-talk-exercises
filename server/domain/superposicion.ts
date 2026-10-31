import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"

export type EntradaSuperposicion = {
  mentoraId: string
  fecha: string
  horaInicio: string
  horaFin: string
}

export function haySuperposicion(
  sesiones: readonly Sesion[],
  entrada: EntradaSuperposicion,
): boolean {
  const inicio = aMinutos(entrada.horaInicio)
  const fin = aMinutos(entrada.horaFin)
  return sesiones.some((s) => {
    if (s.estado !== "confirmada") return false
    if (s.mentoraId !== entrada.mentoraId) return false
    if (s.fecha !== entrada.fecha) return false
    const sInicio = aMinutos(s.horaInicio)
    const sFin = aMinutos(s.horaFin)
    return inicio < sFin && sInicio < fin
  })
}
