// Una mentora no puede tener dos sesiones confirmadas que se superpongan (constitution).
import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"

type Intervalo = Pick<Sesion, "mentoraId" | "fecha" | "horaInicio" | "horaFin">

/** Los intervalos son semiabiertos: una sesión que termina 10:30 y otra que empieza 10:30 no se superponen. */
export function haySuperposicion(sesiones: Sesion[], nueva: Intervalo): boolean {
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
