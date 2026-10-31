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

const pedido = (horaInicio: string, horaFin: string, extra: Partial<{ mentoraId: string; fecha: string }> = {}) => ({
  mentoraId: "m1",
  fecha: LUNES,
  horaInicio,
  horaFin,
  ...extra,
})

describe("haySuperposicion", () => {
  const existentes = [sesion("10:00", "11:00")]

  it("false si no hay sesiones", () => {
    expect(haySuperposicion([], pedido("10:00", "11:00"))).toBe(false)
  })

  it("true si la nueva empieza dentro de una existente", () => {
    expect(haySuperposicion(existentes, pedido("10:30", "11:15"))).toBe(true)
  })

  it("true si la nueva termina dentro de una existente", () => {
    expect(haySuperposicion(existentes, pedido("09:30", "10:15"))).toBe(true)
  })

  it("true si la nueva contiene a una existente o está contenida en ella", () => {
    expect(haySuperposicion(existentes, pedido("09:00", "12:00"))).toBe(true)
    expect(haySuperposicion(existentes, pedido("10:15", "10:45"))).toBe(true)
  })

  it("true si coinciden exactamente", () => {
    expect(haySuperposicion(existentes, pedido("10:00", "11:00"))).toBe(true)
  })

  it("false si una termina justo cuando empieza la otra", () => {
    expect(haySuperposicion(existentes, pedido("11:00", "11:30"))).toBe(false)
    expect(haySuperposicion(existentes, pedido("09:30", "10:00"))).toBe(false)
  })

  it("false si la nueva está antes o después sin tocarse", () => {
    expect(haySuperposicion(existentes, pedido("08:00", "09:00"))).toBe(false)
    expect(haySuperposicion(existentes, pedido("12:00", "13:00"))).toBe(false)
  })

  it("ignora las sesiones canceladas", () => {
    expect(haySuperposicion([sesion("10:00", "11:00", { estado: "cancelada" })], pedido("10:30", "11:15"))).toBe(false)
  })

  it("ignora las sesiones de otra mentora", () => {
    expect(haySuperposicion(existentes, pedido("10:30", "11:15", { mentoraId: "m2" }))).toBe(false)
  })

  it("ignora las sesiones de otra fecha", () => {
    expect(haySuperposicion(existentes, pedido("10:30", "11:15", { fecha: "2026-10-20" }))).toBe(false)
  })

  it("true si alguna de varias sesiones se superpone", () => {
    const varias = [sesion("08:00", "09:00"), sesion("10:00", "11:00", { estado: "cancelada" }), sesion("14:00", "15:00")]
    expect(haySuperposicion(varias, pedido("08:30", "09:30"))).toBe(true)
    expect(haySuperposicion(varias, pedido("10:00", "11:00"))).toBe(false)
  })
})
