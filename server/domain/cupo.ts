// Cupo mensual de horas de una mentora. Función pura, sin IO. Ver research.md (D3).
import type { Sesion } from "@shared/types"
import { aMinutos } from "./fechas"

/** Mes calendario de una fecha "YYYY-MM-DD", como "YYYY-MM". */
export function mesDe(fecha: string): string {
  return fecha.slice(0, 7)
}

/** Minutos que consumen las sesiones confirmadas (de una misma mentora) que empiezan en el mes. */
export function minutosConsumidos(sesiones: Sesion[], mes: string): number {
  return sesiones
    .filter((s) => s.estado === "confirmada" && mesDe(s.fecha) === mes)
    .reduce((total, s) => total + aMinutos(s.horaFin) - aMinutos(s.horaInicio), 0)
}

/**
 * Minutos que le quedan en el mes, o `undefined` si no tiene cupo definido (sin límite).
 * Un cupo que no sea un número finito mayor o igual a 0 se trata como no definido.
 */
export function minutosRestantes(cupoHoras: unknown, sesiones: Sesion[], mes: string): number | undefined {
  if (typeof cupoHoras !== "number" || !Number.isFinite(cupoHoras) || cupoHoras < 0) return undefined
  return Math.max(0, Math.round(cupoHoras * 60) - minutosConsumidos(sesiones, mes))
}

/** ¿Una asesoría de esa duración entra en lo que queda? Sin límite, siempre entra. */
export function entraEnCupo(restantes: number | undefined, duracionMinutos: number): boolean {
  return restantes === undefined || duracionMinutos <= restantes
}
