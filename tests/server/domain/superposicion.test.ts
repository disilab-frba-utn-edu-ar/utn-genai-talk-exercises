import type { Sesion } from "@shared/types"
import { haySuperposicion } from "../../../server/domain/superposicion"

const FECHA = "2026-10-19"

const sesion = (horaInicio: string, horaFin: string, extra: Partial<Sesion> = {}): Sesion => ({
  id: "s",
  mentoraId: "m1",
  tipoAsesoriaId: "t",
  colectivoId: "c",
  proyecto: "p",
  contactoNombre: "n",
  contactoEmail: "e@example.org",
  fecha: FECHA,
  horaInicio,
  horaFin,
  estado: "confirmada",
  ...extra,
})

const candidata = (horaInicio: string, horaFin: string, extra: Partial<{ mentoraId: string; fecha: string }> = {}) => ({
  mentoraId: "m1",
  fecha: FECHA,
  horaInicio,
  horaFin,
  ...extra,
})

describe("domain/superposicion · haySuperposicion", () => {
  const existentes = [sesion("10:00", "11:00")]

  it("detecta una superposición parcial al final de la existente", () => {
    expect(haySuperposicion(existentes, candidata("10:30", "11:15"))).toBe(true)
  })

  it("detecta una superposición parcial al principio de la existente", () => {
    expect(haySuperposicion(existentes, candidata("09:30", "10:30"))).toBe(true)
  })

  it("detecta una sesión contenida en la existente y una que la contiene", () => {
    expect(haySuperposicion(existentes, candidata("10:15", "10:45"))).toBe(true)
    expect(haySuperposicion(existentes, candidata("09:00", "12:00"))).toBe(true)
  })

  it("detecta el mismo rango exacto", () => {
    expect(haySuperposicion(existentes, candidata("10:00", "11:00"))).toBe(true)
  })

  it("no cuenta como superposición que una termine cuando la otra empieza", () => {
    expect(haySuperposicion([sesion("10:00", "10:30")], candidata("10:30", "11:00"))).toBe(false)
    expect(haySuperposicion([sesion("10:30", "11:00")], candidata("10:00", "10:30"))).toBe(false)
  })

  it("ignora sesiones canceladas", () => {
    expect(haySuperposicion([sesion("10:00", "11:00", { estado: "cancelada" })], candidata("10:30", "11:15"))).toBe(false)
  })

  it("ignora sesiones de otra mentora", () => {
    expect(haySuperposicion([sesion("10:00", "11:00", { mentoraId: "m2" })], candidata("10:30", "11:15"))).toBe(false)
  })

  it("ignora sesiones de otra fecha", () => {
    expect(haySuperposicion([sesion("10:00", "11:00", { fecha: "2026-10-20" })], candidata("10:30", "11:15"))).toBe(false)
  })

  it("devuelve false sin sesiones y no modifica la lista recibida", () => {
    expect(haySuperposicion([], candidata("10:00", "11:00"))).toBe(false)
    const copia = structuredClone(existentes)
    haySuperposicion(existentes, candidata("10:30", "11:15"))
    expect(existentes).toEqual(copia)
  })
})
