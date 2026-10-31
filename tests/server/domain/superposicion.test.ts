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

const args = (horaInicio: string, horaFin: string) => ({
  mentoraId: "m1",
  fecha: LUNES,
  horaInicio,
  horaFin,
})

describe("domain/superposicion · haySuperposicion", () => {
  it("detecta superposición parcial: la nueva empieza dentro de la existente", () => {
    const sesiones = [sesion("10:00", "11:00")]
    expect(haySuperposicion(sesiones, args("10:30", "11:15"))).toBe(true)
  })

  it("detecta superposición parcial: la nueva termina dentro de la existente", () => {
    const sesiones = [sesion("10:00", "11:00")]
    expect(haySuperposicion(sesiones, args("09:30", "10:30"))).toBe(true)
  })

  it("detecta superposición total", () => {
    const sesiones = [sesion("10:00", "11:00")]
    expect(haySuperposicion(sesiones, args("09:00", "12:00"))).toBe(true)
    expect(haySuperposicion(sesiones, args("10:15", "10:45"))).toBe(true)
  })

  it("no considera superposición cuando solo se tocan en el borde", () => {
    const sesiones = [sesion("10:00", "11:00")]
    expect(haySuperposicion(sesiones, args("09:00", "10:00"))).toBe(false)
    expect(haySuperposicion(sesiones, args("11:00", "12:00"))).toBe(false)
  })

  it("ignora sesiones de otra mentora", () => {
    const sesiones = [sesion("10:00", "11:00")]
    expect(haySuperposicion(sesiones, { ...args("10:30", "11:15"), mentoraId: "m2" })).toBe(false)
  })

  it("ignora sesiones de otro día", () => {
    const sesiones = [sesion("10:00", "11:00", { fecha: "2026-10-20" })]
    expect(haySuperposicion(sesiones, args("10:30", "11:15"))).toBe(false)
  })

  it("ignora sesiones canceladas", () => {
    const sesiones = [sesion("10:00", "11:00", { estado: "cancelada" })]
    expect(haySuperposicion(sesiones, args("10:30", "11:15"))).toBe(false)
  })

  it("devuelve false si no hay sesiones", () => {
    expect(haySuperposicion([], args("10:30", "11:15"))).toBe(false)
  })
})
