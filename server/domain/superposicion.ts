// Detección pura de superposición de sesiones. Sin IO.
import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"

export type VerificarSuperposicion = {
  mentoraId: string
  fecha: string
  horaInicio: string
  horaFin: string
}

/** Devuelve true si alguna sesión confirmada de la misma mentora y fecha se superpone con el intervalo [horaInicio, horaFin). */
export function haySuperposicion(sesiones: Sesion[], { mentoraId, fecha, horaInicio, horaFin }: VerificarSuperposicion): boolean {
  const inicio = aMinutos(horaInicio)
  const fin = aMinutos(horaFin)
  return sesiones.some((s) =>
    s.estado === "confirmada" &&
    s.mentoraId === mentoraId &&
    s.fecha === fecha &&
    aMinutos(s.horaInicio) < fin &&
    inicio < aMinutos(s.horaFin),
  )
}
