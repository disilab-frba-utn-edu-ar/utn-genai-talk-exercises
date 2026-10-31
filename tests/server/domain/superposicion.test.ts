import type { Sesion } from "@shared/types"
import { haySuperposicion } from "../../../server/domain/superposicion"

const sesion = (extra: Partial<Sesion> = {}): Sesion => ({
  id: "s",
  mentoraId: "m1",
  tipoAsesoriaId: "t",
  colectivoId: "c",
  proyecto: "p",
  contactoNombre: "n",
  contactoEmail: "e@example.org",
  fecha: "2026-10-19",
  horaInicio: "10:00",
  horaFin: "11:00",
  estado: "confirmada",
  ...extra,
})

const base = { mentoraId: "m1", fecha: "2026-10-19", horaInicio: "10:30", horaFin: "11:30" }

describe("domain/superposicion · haySuperposicion", () => {
  it("devuelve false si no hay sesiones", () => {
    expect(haySuperposicion([], base)).toBe(false)
  })

  it("ignora sesiones de otra mentora", () => {
    expect(haySuperposicion([sesion({ mentoraId: "m2" })], base)).toBe(false)
  })

  it("ignora sesiones de otra fecha", () => {
    expect(haySuperposicion([sesion({ fecha: "2026-10-20" })], base)).toBe(false)
  })

  it("ignora sesiones canceladas", () => {
    expect(haySuperposicion([sesion({ estado: "cancelada" })], base)).toBe(false)
  })

  it("detecta superposición parcial", () => {
    expect(haySuperposicion([sesion()], base)).toBe(true)
  })

  it("detecta coincidencia exacta de rango", () => {
    expect(haySuperposicion([sesion()], { ...base, horaInicio: "10:00", horaFin: "11:00" })).toBe(true)
  })

  it("detecta contención", () => {
    expect(haySuperposicion([sesion()], { ...base, horaInicio: "10:15", horaFin: "10:45" })).toBe(true)
  })

  it("detecta superposición por el borde izquierdo", () => {
    expect(haySuperposicion([sesion()], { ...base, horaInicio: "09:30", horaFin: "10:30" })).toBe(true)
  })

  it("no se superponen si una termina cuando la otra empieza", () => {
    expect(haySuperposicion([sesion({ horaInicio: "10:00", horaFin: "10:30" })], { ...base, horaInicio: "10:30", horaFin: "11:30" })).toBe(false)
  })

  it("no se superponen si no se tocan", () => {
    expect(haySuperposicion([sesion({ horaInicio: "10:00", horaFin: "10:30" })], { ...base, horaInicio: "11:00", horaFin: "12:00" })).toBe(false)
  })
})
