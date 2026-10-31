import type { Sesion } from "@shared/types"
import { haySuperposicion } from "../../../server/domain/superposicion"

const LUNES = "2026-10-19"
const MARTES = "2026-10-20"

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

const pedido = (horaInicio: string, horaFin: string, extra: Partial<{ mentoraId: string; fecha: string }> = {}) => ({
  mentoraId: "m1",
  fecha: LUNES,
  horaInicio,
  horaFin,
  ...extra,
})

describe("domain/superposicion · haySuperposicion", () => {
  const revision = sesion("10:00", "11:00")

  it("no hay superposición si no hay sesiones", () => {
    expect(haySuperposicion([], pedido("10:00", "11:00"))).toBe(false)
  })

  it("detecta una sesión que empieza a la misma hora", () => {
    expect(haySuperposicion([revision], pedido("10:00", "10:30"))).toBe(true)
  })

  it("detecta un solapamiento parcial al final de la sesión existente", () => {
    expect(haySuperposicion([revision], pedido("10:30", "11:15"))).toBe(true)
  })

  it("detecta un solapamiento parcial al principio de la sesión existente", () => {
    expect(haySuperposicion([revision], pedido("09:30", "10:15"))).toBe(true)
  })

  it("detecta una sesión nueva contenida en la existente", () => {
    expect(haySuperposicion([revision], pedido("10:15", "10:45"))).toBe(true)
  })

  it("detecta una sesión nueva que contiene a la existente", () => {
    expect(haySuperposicion([revision], pedido("09:00", "12:00"))).toBe(true)
  })

  it("sesiones contiguas no se superponen", () => {
    expect(haySuperposicion([sesion("10:00", "10:30")], pedido("10:30", "11:00"))).toBe(false)
    expect(haySuperposicion([sesion("10:30", "11:00")], pedido("10:00", "10:30"))).toBe(false)
  })

  it("ignora las sesiones canceladas", () => {
    expect(haySuperposicion([sesion("10:00", "11:00", { estado: "cancelada" })], pedido("10:30", "11:15"))).toBe(false)
  })

  it("ignora las sesiones de otra mentora", () => {
    expect(haySuperposicion([sesion("10:00", "11:00", { mentoraId: "m2" })], pedido("10:30", "11:15"))).toBe(false)
  })

  it("ignora las sesiones de otra fecha", () => {
    expect(haySuperposicion([sesion("10:00", "11:00", { fecha: MARTES })], pedido("10:30", "11:15"))).toBe(false)
  })

  it("encuentra la superposición entre varias sesiones", () => {
    const sesiones = [
      sesion("09:00", "09:30"),
      sesion("10:00", "11:00", { estado: "cancelada" }),
      sesion("12:00", "13:00"),
    ]
    expect(haySuperposicion(sesiones, pedido("10:00", "11:00"))).toBe(false)
    expect(haySuperposicion(sesiones, pedido("11:30", "12:30"))).toBe(true)
  })
})
