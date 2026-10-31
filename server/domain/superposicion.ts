// Detección de superposición entre sesiones de una mentora. Función pura: sin IO.
import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"

type SesionCandidata = Pick<Sesion, "mentoraId" | "fecha" | "horaInicio" | "horaFin">

/**
 * Indica si la sesión candidata se superpone con alguna sesión confirmada de la
 * misma mentora y la misma fecha. Los extremos que se tocan (una termina a la
 * hora en que empieza la otra) NO cuentan como superposición.
 */
export function haySuperposicion(sesiones: Sesion[], candidata: SesionCandidata): boolean {
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
