// Fechas como "YYYY-MM-DD" y horas como "HH:MM", siempre en hora local.
import type { DiaSemana } from "@shared/types"

const DIAS: DiaSemana[] = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"]

const pad = (n: number) => String(n).padStart(2, "0")

function aDate(fecha: string): Date {
  const [anio, mes, dia] = fecha.split("-").map(Number)
  return new Date(anio, mes - 1, dia)
}

export function fechaDe(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function diaSemana(fecha: string): DiaSemana {
  return DIAS[aDate(fecha).getDay()]
}

export function sumarDias(fecha: string, dias: number): string {
  const date = aDate(fecha)
  date.setDate(date.getDate() + dias)
  return fechaDe(date)
}

export function aMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number)
  return h * 60 + m
}

export function aHora(minutos: number): string {
  return `${pad(Math.floor(minutos / 60))}:${pad(minutos % 60)}`
}

export function esFechaValida(fecha: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false
  return fechaDe(aDate(fecha)) === fecha
}

export function esHoraValida(hora: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(hora)
}
