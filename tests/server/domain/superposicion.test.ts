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

const nueva = (horaInicio: string, horaFin: string, extra: { mentoraId?: string; fecha?: string } = {}) => ({
  mentoraId: "m1",
  fecha: LUNES,
  horaInicio,
  horaFin,
  ...extra,
})

describe("domain/superposicion · haySuperposicion", () => {
  const existentes = [sesion("10:00", "11:00")]

  it("detecta una sesión que empieza durante otra", () => {
    expect(haySuperposicion(existentes, nueva("10:30", "11:15"))).toBe(true)
  })

  it("detecta una sesión que termina durante otra", () => {
    expect(haySuperposicion(existentes, nueva("09:30", "10:15"))).toBe(true)
  })

  it("detecta una sesión contenida en otra y una que la contiene", () => {
    expect(haySuperposicion(existentes, nueva("10:15", "10:45"))).toBe(true)
    expect(haySuperposicion(existentes, nueva("09:00", "12:00"))).toBe(true)
  })

  it("detecta una sesión con el mismo horario", () => {
    expect(haySuperposicion(existentes, nueva("10:00", "11:00"))).toBe(true)
  })

  it("sesiones que solo se tocan en el borde no se superponen", () => {
    expect(haySuperposicion(existentes, nueva("11:00", "11:30"))).toBe(false)
    expect(haySuperposicion(existentes, nueva("09:30", "10:00"))).toBe(false)
  })

  it("ignora sesiones canceladas", () => {
    expect(haySuperposicion([sesion("10:00", "11:00", { estado: "cancelada" })], nueva("10:30", "11:15"))).toBe(false)
  })

  it("ignora sesiones de otra mentora o de otra fecha", () => {
    expect(haySuperposicion(existentes, nueva("10:30", "11:15", { mentoraId: "m2" }))).toBe(false)
    expect(haySuperposicion(existentes, nueva("10:30", "11:15", { fecha: "2026-10-20" }))).toBe(false)
  })

  it("sin sesiones no hay superposición", () => {
    expect(haySuperposicion([], nueva("10:00", "11:00"))).toBe(false)
  })
})
