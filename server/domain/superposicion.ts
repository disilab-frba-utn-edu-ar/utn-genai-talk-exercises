// Detección de superposición de horarios. Pura: no hace IO.
// Dos intervalos se superponen si comienza uno antes de que termine el otro
// (y viceversa). Un borde compartido (una termina a las 10:30, otra empieza a
// las 10:30) NO se considera superposición.
import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"

export type DetectarSuperposicion = {
  mentoraId: string
  fecha: string
  horaInicio: string
  horaFin: string
}

export function haySuperposicion(
  sesiones: Sesion[],
  { mentoraId, fecha, horaInicio, horaFin }: DetectarSuperposicion,
): boolean {
  const inicio = aMinutos(horaInicio)
  const fin = aMinutos(horaFin)
  return sesiones.some(
    (s) =>
      s.mentoraId === mentoraId &&
      s.fecha === fecha &&
      s.estado === "confirmada" &&
      aMinutos(s.horaInicio) < fin &&
      inicio < aMinutos(s.horaFin),
  )
}
