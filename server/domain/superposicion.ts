import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"

type IntervaloSesion = Pick<Sesion, "mentoraId" | "fecha" | "horaInicio" | "horaFin">

/** Los extremos contiguos no se superponen: los intervalos son [inicio, fin). */
export function haySuperposicion(sesiones: readonly Sesion[], nueva: IntervaloSesion): boolean {
  const inicio = aMinutos(nueva.horaInicio)
  const fin = aMinutos(nueva.horaFin)
  return sesiones.some(
    (sesion) =>
      sesion.estado === "confirmada" &&
      sesion.mentoraId === nueva.mentoraId &&
      sesion.fecha === nueva.fecha &&
      inicio < aMinutos(sesion.horaFin) &&
      aMinutos(sesion.horaInicio) < fin,
  )
}
