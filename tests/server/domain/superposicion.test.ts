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

const nueva = (horaInicio: string, horaFin: string, extra: { mentoraId?: string; fecha?: string } = {}) => ({
  mentoraId: "m1",
  fecha: LUNES,
  horaInicio,
  horaFin,
  ...extra,
})

describe("domain/superposicion · haySuperposicion", () => {
  const existente = [sesion("10:00", "11:00")]

  it("es false si no hay sesiones", () => {
    expect(haySuperposicion([], nueva("10:00", "11:00"))).toBe(false)
  })

  it("detecta una sesión que empieza a la misma hora", () => {
    expect(haySuperposicion(existente, nueva("10:00", "10:30"))).toBe(true)
  })

  it("detecta una superposición parcial al final", () => {
    expect(haySuperposicion(existente, nueva("10:30", "11:15"))).toBe(true)
  })

  it("detecta una superposición parcial al principio", () => {
    expect(haySuperposicion(existente, nueva("09:30", "10:15"))).toBe(true)
  })

  it("detecta una sesión contenida en otra", () => {
    expect(haySuperposicion(existente, nueva("10:15", "10:45"))).toBe(true)
  })

  it("detecta una sesión que contiene a otra", () => {
    expect(haySuperposicion(existente, nueva("09:00", "12:00"))).toBe(true)
  })

  it("sesiones contiguas no se superponen", () => {
    expect(haySuperposicion(existente, nueva("11:00", "11:30"))).toBe(false)
    expect(haySuperposicion(existente, nueva("09:30", "10:00"))).toBe(false)
  })

  it("ignora las sesiones canceladas", () => {
    expect(haySuperposicion([sesion("10:00", "11:00", { estado: "cancelada" })], nueva("10:30", "11:15"))).toBe(false)
  })

  it("ignora las sesiones de otra mentora", () => {
    expect(haySuperposicion(existente, nueva("10:30", "11:15", { mentoraId: "m2" }))).toBe(false)
  })

  it("ignora las sesiones de otra fecha", () => {
    expect(haySuperposicion(existente, nueva("10:30", "11:15", { fecha: MARTES }))).toBe(false)
  })

  it("detecta la superposición aunque haya otras sesiones que no chocan", () => {
    const sesiones = [
      sesion("08:00", "09:00"),
      sesion("10:00", "11:00", { estado: "cancelada" }),
      sesion("10:00", "11:00", { mentoraId: "m2" }),
      sesion("12:00", "13:00"),
    ]
    expect(haySuperposicion(sesiones, nueva("10:00", "11:00"))).toBe(false)
    expect(haySuperposicion(sesiones, nueva("12:30", "13:30"))).toBe(true)
  })
})
