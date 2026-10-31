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

const nueva = (horaInicio: string, horaFin: string, extra: Partial<{ mentoraId: string; fecha: string }> = {}) => ({
  mentoraId: "m1",
  fecha: FECHA,
  horaInicio,
  horaFin,
  ...extra,
})

describe("domain/superposicion · haySuperposicion", () => {
  const existentes = [sesion("10:00", "11:00")]

  it("detecta la misma hora de inicio", () => {
    expect(haySuperposicion(existentes, nueva("10:00", "10:30"))).toBe(true)
  })

  it("detecta una sesión nueva que empieza dentro de la existente", () => {
    expect(haySuperposicion(existentes, nueva("10:30", "11:15"))).toBe(true)
  })

  it("detecta una sesión nueva que termina dentro de la existente", () => {
    expect(haySuperposicion(existentes, nueva("09:30", "10:30"))).toBe(true)
  })

  it("detecta una sesión nueva que contiene a la existente", () => {
    expect(haySuperposicion(existentes, nueva("09:30", "11:30"))).toBe(true)
  })

  it("detecta una sesión nueva contenida en la existente", () => {
    expect(haySuperposicion(existentes, nueva("10:15", "10:45"))).toBe(true)
  })

  it("no hay superposición si una termina cuando la otra empieza", () => {
    expect(haySuperposicion(existentes, nueva("11:00", "11:30"))).toBe(false)
    expect(haySuperposicion(existentes, nueva("09:30", "10:00"))).toBe(false)
  })

  it("no hay superposición con rangos separados", () => {
    expect(haySuperposicion(existentes, nueva("12:00", "12:30"))).toBe(false)
  })

  it("ignora las sesiones canceladas", () => {
    expect(haySuperposicion([sesion("10:00", "11:00", { estado: "cancelada" })], nueva("10:00", "11:00"))).toBe(false)
  })

  it("ignora las sesiones de otra mentora", () => {
    expect(haySuperposicion([sesion("10:00", "11:00", { mentoraId: "m2" })], nueva("10:00", "11:00"))).toBe(false)
  })

  it("ignora las sesiones de otra fecha", () => {
    expect(haySuperposicion([sesion("10:00", "11:00", { fecha: "2026-10-21" })], nueva("10:00", "11:00"))).toBe(false)
  })

  it("sin sesiones no hay superposición", () => {
    expect(haySuperposicion([], nueva("10:00", "11:00"))).toBe(false)
  })

  it("no modifica las sesiones recibidas", () => {
    const copia = structuredClone(existentes)
    haySuperposicion(existentes, nueva("10:30", "11:15"))
    expect(existentes).toEqual(copia)
  })
})
