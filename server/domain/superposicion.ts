import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"

/** Detecta si una nueva sesión se superpone con sesiones confirmadas existentes.
 *  Solo cuenta sesiones con estado "confirmada" de la misma mentora y misma fecha.
 *  Una sesión que termina a las 10:30 y otra que empieza a las 10:30 NO se superponen.
 *  La función es pura: no hace IO.
 */
export function haySuperposicion(
  sesiones: Sesion[],
  { mentoraId, fecha, horaInicio, horaFin }: { mentoraId: string; fecha: string; horaInicio: string; horaFin: string }
): boolean {
  return sesiones.some(
    (s) =>
      s.mentoraId === mentoraId &&
      s.fecha === fecha &&
      s.estado === "confirmada" &&
      aMinutos(s.horaInicio) < horaFinAMinutos(horaFin) &&
      horaInicioAMinutos(horaInicio) < aMinutos(s.horaFin)
  )
}

function horaInicioAMinutos(hora: string): number {
  return aMinutos(hora) // reutiliza el helper existente
}

function horaFinAMinutos(hora: string): number {
  return aMinutos(hora) // reutiliza el helper existente
}