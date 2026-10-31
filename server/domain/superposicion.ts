import type { Sesion } from "@shared/types"

export type SesionPropuesta = {
  mentoraId: string
  fecha: string
  horaInicio: string
  horaFin: string
}

/**
 * Detecta si una sesión propuesta se superpone con alguna sesión existente.
 *
 * Solo cuentan las sesiones con estado "confirmada", de la misma mentora y
 * de la misma fecha. Una sesión que termina a las 10:30 y otra que empieza a
 * las 10:30 NO se superpone (el fin de una coincide con el inicio de la otra).
 *
 * Función pura: no hace IO.
 */
export function haySuperposicion(
  sesiones: Sesion[],
  { mentoraId, fecha, horaInicio, horaFin }: SesionPropuesta,
): boolean {
  const inicio = aMinutos(horaInicio)
  const fin = aMinutos(horaFin)

  return sesiones.some((s) => {
    if (s.mentoraId !== mentoraId) return false
    if (s.fecha !== fecha) return false
    if (s.estado !== "confirmada") return false
    const sInicio = aMinutos(s.horaInicio)
    const sFin = aMinutos(s.horaFin)
    return sInicio < fin && inicio < sFin
  })
}

function aMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number)
  return h * 60 + m
}