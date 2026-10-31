// Reserva por tipo de asesoría: horarios de varias mentoras y a quién se le asigna la sesión.
// Ver specs/003-reservar-por-tipo/research.md (R1, R2).
import type { DiaDisponible, Horario, Mentora, Sesion } from "@shared/types"
import { sumarDias } from "./fechas"
import { estaDentroDeDisponibilidad } from "./horarios"
import { haySuperposicion, type FranjaPedida } from "./superposicion"

/** Une los días libres de varias mentoras: cada horario una sola vez, todo en orden. */
export function unirDiasDisponibles(listas: DiaDisponible[][]): DiaDisponible[] {
  const porFecha = new Map<string, Map<string, Horario>>()
  for (const { fecha, horarios } of listas.flat()) {
    const delDia = porFecha.get(fecha) ?? new Map<string, Horario>()
    for (const horario of horarios) delDia.set(horario.inicio, horario)
    porFecha.set(fecha, delDia)
  }

  return [...porFecha.entries()]
    .filter(([, horarios]) => horarios.size > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, horarios]) => ({
      fecha,
      horarios: [...horarios.values()].sort((a, b) => a.inicio.localeCompare(b.inicio)),
    }))
}

/** Días hacia adelante (incluido hoy) que cuentan para repartir las sesiones. */
export const DIAS_DE_REPARTO = 14

/**
 * Elige la mentora para una franja entre las que pueden dar el tipo de asesoría:
 * solo las libres (dentro de su disponibilidad y sin sesiones confirmadas superpuestas),
 * la que tiene menos sesiones confirmadas en los próximos 14 días y, si empatan,
 * la primera por orden alfabético (spec 003, FR-007).
 */
export function elegirMentora(
  candidatas: Mentora[],
  sesiones: Sesion[],
  franja: Omit<FranjaPedida, "mentoraId">,
  hoy: string,
): Mentora | null {
  const libres = candidatas.filter(
    (m) =>
      estaDentroDeDisponibilidad(m.disponibilidad, franja.fecha, franja.horaInicio, franja.horaFin) &&
      !haySuperposicion(sesiones, { ...franja, mentoraId: m.id }),
  )
  const hasta = sumarDias(hoy, DIAS_DE_REPARTO - 1)
  const carga = (m: Mentora) =>
    sesiones.filter((s) => s.mentoraId === m.id && s.estado === "confirmada" && hoy <= s.fecha && s.fecha <= hasta).length

  const [elegida] = libres
    .map((mentora) => ({ mentora, carga: carga(mentora) }))
    .sort((a, b) => a.carga - b.carga || a.mentora.nombre.localeCompare(b.mentora.nombre, "es"))
  return elegida?.mentora ?? null
}
