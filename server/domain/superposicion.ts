// Una mentora no puede tener dos sesiones confirmadas que se superpongan.
import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"

type RangoDeSesion = Pick<Sesion, "mentoraId" | "fecha" | "horaInicio" | "horaFin">

/** Los extremos no cuentan: una sesión que termina 10:30 no ocupa un rango que empieza 10:30. */
export function ocupaRango(sesion: Sesion, inicio: number, fin: number): boolean {
  return aMinutos(sesion.horaInicio) < fin && inicio < aMinutos(sesion.horaFin)
}

export function haySuperposicion(sesiones: Sesion[], { mentoraId, fecha, horaInicio, horaFin }: RangoDeSesion): boolean {
  const inicio = aMinutos(horaInicio)
  const fin = aMinutos(horaFin)
  return sesiones.some(
    (s) => s.estado === "confirmada" && s.mentoraId === mentoraId && s.fecha === fecha && ocupaRango(s, inicio, fin),
  )
}
