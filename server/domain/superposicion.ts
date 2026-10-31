// Una mentora no puede tener dos sesiones confirmadas que se superpongan (constitution).
import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"
import { ocupaRango } from "./horarios"

type RangoDeSesion = Pick<Sesion, "mentoraId" | "fecha" | "horaInicio" | "horaFin">

export function haySuperposicion(sesiones: Sesion[], { mentoraId, fecha, horaInicio, horaFin }: RangoDeSesion): boolean {
  const inicio = aMinutos(horaInicio)
  const fin = aMinutos(horaFin)
  return sesiones.some(
    (s) => s.estado === "confirmada" && s.mentoraId === mentoraId && s.fecha === fecha && ocupaRango(s, inicio, fin),
  )
}
