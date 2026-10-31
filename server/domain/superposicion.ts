// Una mentora no puede tener dos sesiones confirmadas que se superpongan (constitution).
import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"

type RangoDeSesion = Pick<Sesion, "mentoraId" | "fecha" | "horaInicio" | "horaFin">

/** Los rangos son semiabiertos: una sesión que termina 10:30 y otra que empieza 10:30 no se superponen. */
export function haySuperposicion(sesiones: Sesion[], { mentoraId, fecha, horaInicio, horaFin }: RangoDeSesion): boolean {
  const inicio = aMinutos(horaInicio)
  const fin = aMinutos(horaFin)
  return sesiones.some(
    (s) =>
      s.estado === "confirmada" &&
      s.mentoraId === mentoraId &&
      s.fecha === fecha &&
      aMinutos(s.horaInicio) < fin &&
      inicio < aMinutos(s.horaFin),
  )
}
