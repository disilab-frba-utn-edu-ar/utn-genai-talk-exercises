// Cálculo de horarios libres de una mentora. Ver research.md (D3).
import type { DiaDisponible, Disponibilidad, Horario, Sesion } from "@shared/types"
import { aHora, aMinutos, diaSemana, fechaDe, sumarDias } from "./fechas"

/** Cada cuántos minutos puede empezar una sesión. */
export const PASO_MINUTOS = 30

type ParametrosHorarios = {
  disponibilidad: Disponibilidad
  sesiones: Sesion[]
  fecha: string
  duracionMinutos: number
  ahora: Date
}

/** Una sesión que termina a las 10:30 y otra que empieza a las 10:30 NO se superponen. */
export function haySuperposicion(
  sesiones: Sesion[],
  { mentoraId, fecha, horaInicio, horaFin }: {
    mentoraId: string
    fecha: string
    horaInicio: string
    horaFin: string
  }
): boolean {
  const nuevoInicio = aMinutos(horaInicio)
  const nuevoFin = aMinutos(horaFin)

  return sesiones.some(
    (s) =>
      s.mentoraId === mentoraId &&
      s.fecha === fecha &&
      s.estado === "confirmada" &&
      aMinutos(s.horaInicio) < nuevoFin &&
      nuevoInicio < aMinutos(s.horaFin)
  )
}

function ocupaRango(sesion: Sesion, inicio: number, fin: number): boolean {
  return aMinutos(sesion.horaInicio) < fin && inicio < aMinutos(sesion.horaFin)
}

export function calcularHorarios({ disponibilidad, sesiones, fecha, duracionMinutos, ahora }: ParametrosHorarios): Horario[] {
  const rango = disponibilidad[diaSemana(fecha)]
  if (!rango) return []

  const confirmadas = sesiones.filter((s) => s.fecha === fecha && s.estado === "confirmada")
  const esHoy = fecha === fechaDe(ahora)
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes()

  const horarios: Horario[] = []
  for (let inicio = aMinutos(rango.inicio); inicio + duracionMinutos <= aMinutos(rango.fin); inicio += PASO_MINUTOS) {
    const fin = inicio + duracionMinutos
    if (esHoy && inicio <= minutosAhora) continue
    if (confirmadas.some((s) => ocupaRango(s, inicio, fin))) continue
    horarios.push({ inicio: aHora(inicio), fin: aHora(fin) })
  }
  return horarios
}

export function calcularDiasDisponibles({
  dias,
  ...parametros
}: Omit<ParametrosHorarios, "fecha"> & { dias: number }): DiaDisponible[] {
  const hoy = fechaDe(parametros.ahora)
  const resultado: DiaDisponible[] = []
  for (let i = 0; i < dias; i++) {
    const fecha = sumarDias(hoy, i)
    const horarios = calcularHorarios({ ...parametros, fecha })
    if (horarios.length > 0) resultado.push({ fecha, horarios })
  }
  return resultado
}

export function estaDentroDeDisponibilidad(disponibilidad: Disponibilidad, fecha: string, horaInicio: string, horaFin: string): boolean {
  const rango = disponibilidad[diaSemana(fecha)]
  if (!rango) return false
  return aMinutos(rango.inicio) <= aMinutos(horaInicio) && aMinutos(horaFin) <= aMinutos(rango.fin)
}
