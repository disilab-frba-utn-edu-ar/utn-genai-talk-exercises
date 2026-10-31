// Regla de la constitution: una mentora no puede tener dos sesiones confirmadas que se superpongan.
import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"

type Franja = { mentoraId: string; fecha: string; horaInicio: string; horaFin: string }

/** Dos franjas que solo se tocan en un borde (una termina cuando la otra empieza) no se superponen. */
export function haySuperposicion(sesiones: Sesion[], nueva: Franja): boolean {
  const inicio = aMinutos(nueva.horaInicio)
  const fin = aMinutos(nueva.horaFin)
  return sesiones.some(
    (s) =>
      s.estado === "confirmada" &&
      s.mentoraId === nueva.mentoraId &&
      s.fecha === nueva.fecha &&
      aMinutos(s.horaInicio) < fin &&
      inicio < aMinutos(s.horaFin),
  )
}
