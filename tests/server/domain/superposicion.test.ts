import type { Sesion } from "@shared/types"
import { haySuperposicion } from "../../../server/domain/superposicion"

const sesion = (
  horaInicio: string,
  horaFin: string,
  extra: Partial<Sesion> = {},
): Sesion => ({
  id: "s1",
  mentoraId: "m1",
  tipoAsesoriaId: "t1",
  colectivoId: "c1",
  proyecto: "proyecto",
  contactoNombre: "nombre",
  contactoEmail: "n@example.org",
  fecha: "2026-10-19",
  horaInicio,
  horaFin,
  estado: "confirmada",
  ...extra,
})

const params = (overrides: Partial<Parameters<typeof haySuperposicion>[1]> = {}) => ({
  mentoraId: "m1",
  fecha: "2026-10-19",
  horaInicio: "10:00",
  horaFin: "11:00",
  ...overrides,
})

describe("domain/superposicion · haySuperposicion", () => {
  it("devuelve false si no hay sesiones", () => {
    expect(haySuperposicion([], params())).toBe(false)
  })

  it("devuelve false si la mentora es distinta", () => {
    const sesiones = [sesion("10:30", "11:30", { mentoraId: "m2" })]
    expect(haySuperposicion(sesiones, params())).toBe(false)
  })

  it("devuelve false si la fecha es distinta", () => {
    const sesiones = [sesion("10:30", "11:30", { fecha: "2026-10-20" })]
    expect(haySuperposicion(sesiones, params())).toBe(false)
  })

  it("devuelve false si la sesión existente está cancelada", () => {
    const sesiones = [sesion("10:30", "11:30", { estado: "cancelada" })]
    expect(haySuperposicion(sesiones, params())).toBe(false)
  })

  it("devuelve true cuando la nueva sesión empieza durante una existente", () => {
    const sesiones = [sesion("09:00", "10:30")]
    expect(haySuperposicion(sesiones, params({ horaInicio: "10:00", horaFin: "11:00" }))).toBe(true)
  })

  it("devuelve true cuando la nueva sesión termina durante una existente", () => {
    const sesiones = [sesion("10:30", "12:00")]
    expect(haySuperposicion(sesiones, params({ horaInicio: "10:00", horaFin: "11:00" }))).toBe(true)
  })

  it("devuelve true cuando la nueva sesión contiene a la existente", () => {
    const sesiones = [sesion("10:30", "11:30")]
    expect(haySuperposicion(sesiones, params({ horaInicio: "10:00", horaFin: "12:00" }))).toBe(true)
  })

  it("devuelve true cuando la existente contiene a la nueva", () => {
    const sesiones = [sesion("10:00", "12:00")]
    expect(haySuperposicion(sesiones, params({ horaInicio: "10:30", horaFin: "11:30" }))).toBe(true)
  })

  it("devuelve true cuando empiezan a la misma hora", () => {
    const sesiones = [sesion("10:00", "11:00")]
    expect(haySuperposicion(sesiones, params())).toBe(true)
  })

  it("devuelve false cuando solo se tocan en un extremo (adyacentes)", () => {
    const sesiones = [sesion("09:00", "10:00")]
    expect(haySuperposicion(sesiones, params({ horaInicio: "10:00", horaFin: "11:00" }))).toBe(false)

    const sesiones2 = [sesion("11:00", "12:00")]
    expect(haySuperposicion(sesiones2, params({ horaInicio: "10:00", horaFin: "11:00" }))).toBe(false)
  })
})