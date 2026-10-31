import type { Sesion } from "@shared/types"
import { haySuperposicion } from "../../../server/domain/superposicion"

const sesion = (horaInicio: string, horaFin: string, extra: Partial<Sesion> = {}): Sesion => ({
  id: "s",
  mentoraId: "m1",
  tipoAsesoriaId: "revision_de_codigo",
  colectivoId: "c1",
  proyecto: "Proyecto",
  contactoNombre: "Ana",
  contactoEmail: "ana@example.org",
  fecha: "2026-10-19",
  horaInicio,
  horaFin,
  estado: "confirmada",
  ...extra,
})

const nueva = (horaInicio: string, horaFin: string, extra: Record<string, string> = {}) => ({
  mentoraId: "m1",
  fecha: "2026-10-19",
  horaInicio,
  horaFin,
  ...extra,
})

describe("domain · haySuperposicion", () => {
  const existentes = [sesion("10:00", "11:00")]

  it("detecta la misma hora de inicio", () => {
    expect(haySuperposicion(existentes, nueva("10:00", "10:30"))).toBe(true)
  })

  it("detecta una sesión que empieza dentro de otra (10:30-11:15 vs 10:00-11:00)", () => {
    expect(haySuperposicion(existentes, nueva("10:30", "11:15"))).toBe(true)
  })

  it("detecta una sesión que termina dentro de otra", () => {
    expect(haySuperposicion(existentes, nueva("09:30", "10:30"))).toBe(true)
  })

  it("detecta una sesión que contiene a otra", () => {
    expect(haySuperposicion(existentes, nueva("09:00", "12:00"))).toBe(true)
  })

  it("no cuenta como superposición que una termine cuando la otra empieza", () => {
    expect(haySuperposicion(existentes, nueva("11:00", "11:30"))).toBe(false)
    expect(haySuperposicion(existentes, nueva("09:30", "10:00"))).toBe(false)
  })

  it("ignora sesiones canceladas, de otra mentora o de otra fecha", () => {
    expect(haySuperposicion([sesion("10:00", "11:00", { estado: "cancelada" })], nueva("10:30", "11:15"))).toBe(false)
    expect(haySuperposicion([sesion("10:00", "11:00", { mentoraId: "m2" })], nueva("10:30", "11:15"))).toBe(false)
    expect(haySuperposicion([sesion("10:00", "11:00", { fecha: "2026-10-20" })], nueva("10:30", "11:15"))).toBe(false)
  })

  it("devuelve false sin sesiones", () => {
    expect(haySuperposicion([], nueva("10:00", "11:00"))).toBe(false)
  })
})
