import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"
import { ocupaRango } from "./horarios"

type RangoSesion = Pick<Sesion, "mentoraId" | "fecha" | "horaInicio" | "horaFin">

/** Los extremos contiguos no se superponen: se comparan intervalos [inicio, fin). */
export function haySuperposicion(sesiones: readonly Sesion[], nueva: RangoSesion): boolean {
  const inicio = aMinutos(nueva.horaInicio)
  const fin = aMinutos(nueva.horaFin)
  return sesiones.some((sesion) =>
    sesion.estado === "confirmada" &&
    sesion.mentoraId === nueva.mentoraId &&
    sesion.fecha === nueva.fecha &&
    ocupaRango(sesion, inicio, fin),
  )
}
