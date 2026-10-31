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

const candidata = (horaInicio: string, horaFin: string, extra: Partial<{ mentoraId: string; fecha: string }> = {}) => ({
  mentoraId: "m1",
  fecha: LUNES,
  horaInicio,
  horaFin,
  ...extra,
})

describe("domain/superposicion · haySuperposicion", () => {
  it("sin sesiones no hay superposición", () => {
    expect(haySuperposicion([], candidata("10:00", "11:00"))).toBe(false)
  })

  it("detecta una sesión que empieza a la misma hora", () => {
    expect(haySuperposicion([sesion("10:00", "11:00")], candidata("10:00", "10:30"))).toBe(true)
  })

  it("detecta una sesión nueva que empieza en el medio de una existente", () => {
    expect(haySuperposicion([sesion("10:00", "11:00")], candidata("10:30", "11:15"))).toBe(true)
  })

  it("detecta una sesión nueva que termina en el medio de una existente", () => {
    expect(haySuperposicion([sesion("10:00", "11:00")], candidata("09:30", "10:15"))).toBe(true)
  })

  it("detecta una sesión nueva que contiene por completo a una existente", () => {
    expect(haySuperposicion([sesion("10:00", "10:30")], candidata("09:00", "12:00"))).toBe(true)
  })

  it("detecta una sesión nueva contenida por completo en una existente", () => {
    expect(haySuperposicion([sesion("09:00", "12:00")], candidata("10:00", "10:30"))).toBe(true)
  })

  it("no se superponen si una termina justo cuando la otra empieza", () => {
    expect(haySuperposicion([sesion("10:00", "10:30")], candidata("10:30", "11:00"))).toBe(false)
    expect(haySuperposicion([sesion("10:30", "11:00")], candidata("10:00", "10:30"))).toBe(false)
  })

  it("no se superponen si están separadas en el tiempo", () => {
    expect(haySuperposicion([sesion("10:00", "10:30")], candidata("11:00", "11:30"))).toBe(false)
  })

  it("ignora las sesiones canceladas", () => {
    expect(haySuperposicion([sesion("10:00", "11:00", { estado: "cancelada" })], candidata("10:30", "11:15"))).toBe(false)
  })

  it("ignora las sesiones de otra mentora", () => {
    expect(haySuperposicion([sesion("10:00", "11:00", { mentoraId: "m2" })], candidata("10:30", "11:15"))).toBe(false)
  })

  it("ignora las sesiones de otra fecha", () => {
    expect(haySuperposicion([sesion("10:00", "11:00", { fecha: "2026-10-20" })], candidata("10:30", "11:15"))).toBe(false)
  })

  it("basta con que una sola de varias sesiones se superponga", () => {
    const sesiones = [sesion("08:00", "09:00"), sesion("12:00", "13:00"), sesion("10:00", "11:00")]
    expect(haySuperposicion(sesiones, candidata("10:30", "11:15"))).toBe(true)
  })

  it("no modifica la lista de sesiones", () => {
    const sesiones = [sesion("10:00", "11:00")]
    const copia = structuredClone(sesiones)
    haySuperposicion(sesiones, candidata("10:30", "11:15"))
    expect(sesiones).toEqual(copia)
  })
})
