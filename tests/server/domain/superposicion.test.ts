import type { Sesion } from "@shared/types"
import { haySuperposicion } from "../../../server/domain/superposicion"

const LUNES = "2026-10-19"

const sesion = (horaInicio: string, horaFin: string, extra: Partial<Sesion> = {}): Sesion => ({
  id: "s1",
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

describe("domain/superposicion · haySuperposicion", () => {
  it("devuelve false si no hay sesiones", () => {
    expect(
      haySuperposicion([], { mentoraId: "m1", fecha: LUNES, horaInicio: "10:00", horaFin: "11:00" }),
    ).toBe(false)
  })

  it("ignora sesiones de otra mentora", () => {
    const existentes = [sesion("09:00", "10:00", { mentoraId: "m2" })]
    expect(
      haySuperposicion(existentes, { mentoraId: "m1", fecha: LUNES, horaInicio: "09:30", horaFin: "10:30" }),
    ).toBe(false)
  })

  it("ignora sesiones de otro día", () => {
    const existentes = [sesion("09:00", "10:00", { fecha: "2026-10-20" })]
    expect(
      haySuperposicion(existentes, { mentoraId: "m1", fecha: LUNES, horaInicio: "09:30", horaFin: "10:30" }),
    ).toBe(false)
  })

  it("ignora sesiones canceladas", () => {
    const existentes = [sesion("09:00", "11:00", { estado: "cancelada" })]
    expect(
      haySuperposicion(existentes, { mentoraId: "m1", fecha: LUNES, horaInicio: "10:00", horaFin: "11:00" }),
    ).toBe(false)
  })

  it("no considera superposición cuando una termina exactamente cuando empieza la otra", () => {
    const existentes = [sesion("09:00", "10:30")]
    expect(
      haySuperposicion(existentes, { mentoraId: "m1", fecha: LUNES, horaInicio: "10:30", horaFin: "11:30" }),
    ).toBe(false)
    expect(
      haySuperposicion(existentes, { mentoraId: "m1", fecha: LUNES, horaInicio: "08:00", horaFin: "09:00" }),
    ).toBe(false)
  })

  it("detecta superposición cuando la nueva empieza dentro de la existente", () => {
    const existentes = [sesion("10:00", "11:00")]
    expect(
      haySuperposicion(existentes, { mentoraId: "m1", fecha: LUNES, horaInicio: "10:30", horaFin: "11:15" }),
    ).toBe(true)
  })

  it("detecta superposición cuando la nueva contiene a la existente", () => {
    const existentes = [sesion("10:30", "11:00")]
    expect(
      haySuperposicion(existentes, { mentoraId: "m1", fecha: LUNES, horaInicio: "10:00", horaFin: "11:30" }),
    ).toBe(true)
  })

  it("detecta superposición cuando la nueva empieza antes y termina dentro de la existente", () => {
    const existentes = [sesion("10:00", "11:00")]
    expect(
      haySuperposicion(existentes, { mentoraId: "m1", fecha: LUNES, horaInicio: "09:30", horaFin: "10:30" }),
    ).toBe(true)
  })

  it("detecta superposición cuando empiezan a la misma hora", () => {
    const existentes = [sesion("10:00", "11:00")]
    expect(
      haySuperposicion(existentes, { mentoraId: "m1", fecha: LUNES, horaInicio: "10:00", horaFin: "10:30" }),
    ).toBe(true)
  })
})