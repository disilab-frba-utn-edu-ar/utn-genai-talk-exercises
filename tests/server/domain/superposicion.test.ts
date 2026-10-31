import type { Sesion } from "@shared/types"
import { haySuperposicion } from "../../../server/domain/superposicion"

const sesion = (horaInicio: string, horaFin: string, extra: Partial<Sesion> = {}): Sesion => ({
  id: "s",
  mentoraId: "m1",
  tipoAsesoriaId: "t",
  colectivoId: "c",
  proyecto: "p",
  contactoNombre: "n",
  contactoEmail: "e@example.org",
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

describe("domain/superposicion · haySuperposicion", () => {
  const existentes = [sesion("10:00", "11:00")]

  it("detecta el mismo horario exacto", () => {
    expect(haySuperposicion(existentes, nueva("10:00", "11:00"))).toBe(true)
  })

  it("detecta una sesión que empieza en medio de otra y termina después", () => {
    expect(haySuperposicion(existentes, nueva("10:30", "11:15"))).toBe(true)
  })

  it("detecta una sesión que empieza antes y termina en medio de otra", () => {
    expect(haySuperposicion(existentes, nueva("09:30", "10:30"))).toBe(true)
  })

  it("detecta una sesión contenida en otra y una que la contiene", () => {
    expect(haySuperposicion(existentes, nueva("10:15", "10:45"))).toBe(true)
    expect(haySuperposicion(existentes, nueva("09:00", "12:00"))).toBe(true)
  })

  it("no cuenta como superposición que una termine justo cuando la otra empieza", () => {
    expect(haySuperposicion(existentes, nueva("11:00", "11:30"))).toBe(false)
    expect(haySuperposicion(existentes, nueva("09:30", "10:00"))).toBe(false)
  })

  it("no se superpone con horarios lejanos", () => {
    expect(haySuperposicion(existentes, nueva("14:00", "15:00"))).toBe(false)
  })

  it("ignora las sesiones canceladas", () => {
    expect(haySuperposicion([sesion("10:00", "11:00", { estado: "cancelada" })], nueva("10:30", "11:15"))).toBe(false)
  })

  it("ignora las sesiones de otra mentora", () => {
    expect(haySuperposicion([sesion("10:00", "11:00", { mentoraId: "m2" })], nueva("10:30", "11:15"))).toBe(false)
  })

  it("ignora las sesiones de otra fecha", () => {
    expect(haySuperposicion([sesion("10:00", "11:00", { fecha: "2026-10-20" })], nueva("10:30", "11:15"))).toBe(false)
  })

  it("devuelve false sin sesiones", () => {
    expect(haySuperposicion([], nueva("10:00", "11:00"))).toBe(false)
  })
})
