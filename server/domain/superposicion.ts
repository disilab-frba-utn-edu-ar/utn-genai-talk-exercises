import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"

type RangoSesion = Pick<Sesion, "mentoraId" | "fecha" | "horaInicio" | "horaFin">

/** Los extremos contiguos no se superponen: [inicio, fin). */
export function haySuperposicion(sesiones: readonly Sesion[], nueva: RangoSesion): boolean {
  const inicio = aMinutos(nueva.horaInicio)
  const fin = aMinutos(nueva.horaFin)

  return sesiones.some(
    (sesion) =>
      sesion.estado === "confirmada" &&
      sesion.mentoraId === nueva.mentoraId &&
      sesion.fecha === nueva.fecha &&
      aMinutos(sesion.horaInicio) < fin &&
      inicio < aMinutos(sesion.horaFin),
  )
}
