// Una mentora no puede tener dos sesiones confirmadas superpuestas (constitution).
import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"

type RangoSesion = Pick<Sesion, "mentoraId" | "fecha" | "horaInicio" | "horaFin">

/** Los rangos son semiabiertos: una sesión que termina 10:30 no se superpone con otra que empieza 10:30. */
export function haySuperposicion(sesiones: Sesion[], { mentoraId, fecha, horaInicio, horaFin }: RangoSesion): boolean {
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
