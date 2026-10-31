import type { Sesion } from "@shared/types"
import { haySuperposicion } from "../../../server/domain/superposicion"

const LUNES = "2026-10-19"

const sesion = (horaInicio: string, horaFin: string, extra: Partial<Sesion> = {}): Sesion => ({
  id: "s",
  mentoraId: "m1",
  tipoAsesoriaId: "t",
  colectivoId: "c",
  proyecto: "p",
  contactoNombre: "n",
  contactoEmail: "e@example.org",
  fecha: LUNES,
  horaInicio,
  horaFin,
  estado: "confirmada",
  ...extra,
})

const rango = (horaInicio: string, horaFin: string, extra: { mentoraId?: string; fecha?: string } = {}) => ({
  mentoraId: "m1",
  fecha: LUNES,
  horaInicio,
  horaFin,
  ...extra,
})

describe("domain/superposicion · haySuperposicion", () => {
  const revision = sesion("10:00", "11:00")

  it("no hay superposición si no hay sesiones", () => {
    expect(haySuperposicion([], rango("10:00", "11:00"))).toBe(false)
  })

  it("detecta una sesión nueva que empieza durante otra", () => {
    expect(haySuperposicion([revision], rango("10:30", "11:15"))).toBe(true)
  })

  it("detecta una sesión nueva que termina durante otra", () => {
    expect(haySuperposicion([revision], rango("09:30", "10:15"))).toBe(true)
  })

  it("detecta una sesión nueva que contiene a otra o está contenida en ella", () => {
    expect(haySuperposicion([revision], rango("09:00", "12:00"))).toBe(true)
    expect(haySuperposicion([revision], rango("10:15", "10:45"))).toBe(true)
  })

  it("detecta una sesión nueva con el mismo horario", () => {
    expect(haySuperposicion([revision], rango("10:00", "11:00"))).toBe(true)
  })

  it("sesiones que solo se tocan en un extremo no se superponen", () => {
    expect(haySuperposicion([sesion("10:00", "10:30")], rango("10:30", "11:15"))).toBe(false)
    expect(haySuperposicion([revision], rango("09:00", "10:00"))).toBe(false)
  })

  it("ignora las sesiones canceladas", () => {
    expect(haySuperposicion([sesion("10:00", "11:00", { estado: "cancelada" })], rango("10:30", "11:15"))).toBe(false)
  })

  it("ignora las sesiones de otra mentora", () => {
    expect(haySuperposicion([revision], rango("10:30", "11:15", { mentoraId: "m2" }))).toBe(false)
  })

  it("ignora las sesiones de otra fecha", () => {
    expect(haySuperposicion([revision], rango("10:30", "11:15", { fecha: "2026-10-20" }))).toBe(false)
  })
})
