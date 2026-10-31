// Detección de superposición de sesiones de una mentora. Ver research.md (D3).
// Dos intervalos se superponen si a.inicio < b.fin && b.inicio < a.fin.
// Los toques en el borde (una termina exactamente cuando la otra empieza) NO se superponen.
import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"

type Rango = { mentoraId: string; fecha: string; horaInicio: string; horaFin: string }

export function haySuperposicion(sesiones: Sesion[], rango: Rango): boolean {
  const { mentoraId, fecha, horaInicio, horaFin } = rango
  const inicio = aMinutos(horaInicio)
  const fin = aMinutos(horaFin)

  return sesiones.some(
    (s) =>
      s.estado === "confirmada" &&
      s.mentoraId === mentoraId &&
      s.fecha === fecha &&
      aMinutos(s.horaInicio) < fin &&
      inicio < aMinutos(s.horaFin)
  )
}
