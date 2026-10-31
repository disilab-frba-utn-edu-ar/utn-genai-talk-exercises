import type { Sesion } from "@shared/types"
import { haySuperposicion } from "../../../server/domain/superposicion"

const sesion = (horaInicio: string, horaFin: string, extra: Partial<Sesion> = {}): Sesion => ({
  id: "s1",
  mentoraId: "m1",
  tipoAsesoriaId: "t1",
  colectivoId: "c1",
  proyecto: "Proyecto de prueba",
  contactoNombre: "Contacto",
  contactoEmail: "contacto@example.org",
  fecha: "2026-10-19",
  horaInicio,
  horaFin,
  estado: "confirmada",
  ...extra,
})

describe("domain/superposicion · haySuperposicion", () => {
  it("devuelve false cuando no hay sesiones", () => {
    expect(haySuperposicion([], { mentoraId: "m1", fecha: "2026-10-19", horaInicio: "10:00", horaFin: "11:00" })).toBe(false)
  })

  it("devuelve false para sesiones de otra mentora", () => {
    const existentes = [sesion("09:00", "10:00", { mentoraId: "m2" })]
    expect(haySuperposicion(existentes, { mentoraId: "m1", fecha: "2026-10-19", horaInicio: "10:00", horaFin: "11:00" })).toBe(false)
  })

  it("devuelve false para sesiones de otra fecha", () => {
    const existentes = [sesion("09:00", "10:00", { fecha: "2026-10-20" })]
    expect(haySuperposicion(existentes, { mentoraId: "m1", fecha: "2026-10-19", horaInicio: "10:00", horaFin: "11:00" })).toBe(false)
  })

  it("devuelve false para sesiones canceladas", () => {
    const existentes = [sesion("09:00", "11:00", { estado: "cancelada" })]
    expect(haySuperposicion(existentes, { mentoraId: "m1", fecha: "2026-10-19", horaInicio: "10:00", horaFin: "11:00" })).toBe(false)
  })

  it("detecta superposición cuando la nueva está dentro de una existente", () => {
    const existentes = [sesion("09:00", "11:00")]
    expect(haySuperposicion(existentes, { mentoraId: "m1", fecha: "2026-10-19", horaInicio: "10:00", horaFin: "11:00" })).toBe(true)
  })

  it("detecta superposición cuando la nueva empieza antes y termina dentro", () => {
    const existentes = [sesion("10:00", "11:00")]
    expect(haySuperposicion(existentes, { mentoraId: "m1", fecha: "2026-10-19", horaInicio: "09:30", horaFin: "10:30" })).toBe(true)
  })

  it("detecta superposición cuando la nueva empieza dentro y termina después", () => {
    const existentes = [sesion("10:00", "11:00")]
    expect(haySuperposicion(existentes, { mentoraId: "m1", fecha: "2026-10-19", horaInicio: "10:30", horaFin: "11:30" })).toBe(true)
  })

  it("detecta superposición cuando la nueva cubre completamente a la existente", () => {
    const existentes = [sesion("10:00", "11:00")]
    expect(haySuperposicion(existentes, { mentoraId: "m1", fecha: "2026-10-19", horaInicio: "09:00", horaFin: "12:00" })).toBe(true)
  })

  it("NO detecta superposición cuando una termina exactamente cuando la otra empieza", () => {
    const existentes = [sesion("09:00", "10:00")]
    expect(haySuperposicion(existentes, { mentoraId: "m1", fecha: "2026-10-19", horaInicio: "10:00", horaFin: "11:00" })).toBe(false)
  })

  it("NO detecta superposición cuando una empieza exactamente cuando la otra termina", () => {
    const existentes = [sesion("10:00", "11:00")]
    expect(haySuperposicion(existentes, { mentoraId: "m1", fecha: "2026-10-19", horaInicio: "09:00", horaFin: "10:00" })).toBe(false)
  })

  it("ignora sesiones de otra mentora aunque se solapen", () => {
    const existentes = [sesion("10:00", "11:00", { mentoraId: "m2" })]
    expect(haySuperposicion(existentes, { mentoraId: "m1", fecha: "2026-10-19", horaInicio: "10:30", horaFin: "11:15" })).toBe(false)
  })
})