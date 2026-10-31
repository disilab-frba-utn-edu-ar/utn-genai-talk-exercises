import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"

export type DatosHorarioSesion = {
  mentoraId: string
  fecha: string
  horaInicio: string
  horaFin: string
}

/**
 * Detecta si una sesión se superpone con alguna sesión confirmada de la misma
 * mentora y del mismo día. No hace IO: es una regla de negocio pura.
 *
 * Dos intervalos se superpongan cuando empiezan antes de que el otro termine
 * (`inicioA < finB && inicioB < finA`). Una sesión que termina a las 10:30 y
 * otra que empieza a las 10:30 NO se superponen.
 */
export function haySuperposicion(
  sesiones: Sesion[],
  { mentoraId, fecha, horaInicio, horaFin }: DatosHorarioSesion,
): boolean {
  const inicio = aMinutos(horaInicio)
  const fin = aMinutos(horaFin)

  return sesiones.some((s) => {
    if (s.mentoraId !== mentoraId || s.fecha !== fecha || s.estado !== "confirmada") return false
    return aMinutos(s.horaInicio) < fin && inicio < aMinutos(s.horaFin)
  })
}