import type { Sesion } from "@shared/types"
import { haySuperposicion } from "../../../server/domain/superposicion"
import { sesionDePrueba } from "../api/helpers"

const MENTORA = "8f3c2a1e-4b5d-4c6e-9f70-1a2b3c4d5e01"
const FECHA = "2026-10-19"

const existente = (extra: Partial<Sesion> = {}) =>
  sesionDePrueba({ mentoraId: MENTORA, fecha: FECHA, horaInicio: "10:00", horaFin: "11:00", ...extra })

const propuesta = (extra: Partial<{ mentoraId: string; fecha: string; horaInicio: string; horaFin: string }> = {}) => ({
  mentoraId: MENTORA,
  fecha: FECHA,
  horaInicio: "10:30",
  horaFin: "11:15",
  ...extra,
})

describe("haySuperposicion", () => {
  it("detecta una superposición parcial (empieza dentro de otra sesión)", () => {
    expect(haySuperposicion([existente()], propuesta())).toBe(true)
  })

  it("detecta una superposición parcial por el otro lado (termina dentro de otra sesión)", () => {
    expect(haySuperposicion([existente()], propuesta({ horaInicio: "09:30", horaFin: "10:15" }))).toBe(true)
  })

  it("detecta cuando la nueva contiene a la existente", () => {
    expect(haySuperposicion([existente()], propuesta({ horaInicio: "09:30", horaFin: "11:30" }))).toBe(true)
  })

  it("detecta cuando la nueva está contenida en la existente", () => {
    expect(haySuperposicion([existente()], propuesta({ horaInicio: "10:15", horaFin: "10:45" }))).toBe(true)
  })

  it("detecta el mismo horario exacto", () => {
    expect(haySuperposicion([existente()], propuesta({ horaInicio: "10:00", horaFin: "11:00" }))).toBe(true)
  })

  it("no hay superposición si una termina justo cuando empieza la otra", () => {
    expect(haySuperposicion([existente({ horaInicio: "10:00", horaFin: "10:30" })], propuesta({ horaInicio: "10:30", horaFin: "11:00" }))).toBe(false)
    expect(haySuperposicion([existente({ horaInicio: "10:30", horaFin: "11:00" })], propuesta({ horaInicio: "10:00", horaFin: "10:30" }))).toBe(false)
  })

  it("no hay superposición con horarios separados", () => {
    expect(haySuperposicion([existente()], propuesta({ horaInicio: "12:00", horaFin: "12:30" }))).toBe(false)
  })

  it("ignora las sesiones canceladas", () => {
    expect(haySuperposicion([existente({ estado: "cancelada" })], propuesta())).toBe(false)
  })

  it("ignora las sesiones de otra mentora", () => {
    expect(haySuperposicion([existente({ mentoraId: "otra-mentora" })], propuesta())).toBe(false)
  })

  it("ignora las sesiones de otra fecha", () => {
    expect(haySuperposicion([existente({ fecha: "2026-10-21" })], propuesta())).toBe(false)
  })

  it("devuelve false sin sesiones", () => {
    expect(haySuperposicion([], propuesta())).toBe(false)
  })

  it("no modifica la lista recibida", () => {
    const sesiones = [existente()]
    const copia = structuredClone(sesiones)
    haySuperposicion(sesiones, propuesta())
    expect(sesiones).toEqual(copia)
  })
})
