// Detección de superposición entre sesiones de una mentora (constitution: restricciones de dominio).
import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"

type SesionCandidata = Pick<Sesion, "mentoraId" | "fecha" | "horaInicio" | "horaFin">

/**
 * Indica si la sesión candidata se superpone con alguna sesión confirmada de la
 * misma mentora y la misma fecha. Los intervalos son [inicio, fin): una sesión
 * que termina a las 10:30 y otra que empieza a las 10:30 NO se superponen.
 */
export function haySuperposicion(sesiones: readonly Sesion[], candidata: SesionCandidata): boolean {
  const inicio = aMinutos(candidata.horaInicio)
  const fin = aMinutos(candidata.horaFin)
  return sesiones.some(
    (s) =>
      s.estado === "confirmada" &&
      s.mentoraId === candidata.mentoraId &&
      s.fecha === candidata.fecha &&
      aMinutos(s.horaInicio) < fin &&
      inicio < aMinutos(s.horaFin),
  )
}
