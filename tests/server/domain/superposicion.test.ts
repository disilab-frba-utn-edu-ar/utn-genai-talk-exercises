import type { Sesion } from "@shared/types"
import { haySuperposicion } from "../../../server/domain/superposicion"

const LUNES = "2026-10-19"

const sesion = (
  horaInicio: string,
  horaFin: string,
  extra: Partial<Sesion> = {},
): Sesion => ({
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

const propuesta = (extra: Partial<{ mentoraId: string; fecha: string; horaInicio: string; horaFin: string }> = {}) => ({
  mentoraId: "m1",
  fecha: LUNES,
  horaInicio: "10:00",
  horaFin: "11:00",
  ...extra,
})

describe("domain/superposicion · haySuperposicion", () => {
  it("detecta superposición parcial (la nueva empieza antes y termina dentro de la existente)", () => {
    expect(
      haySuperposicion([sesion("09:00", "10:30")], propuesta({ horaInicio: "10:00", horaFin: "11:00" })),
    ).toBe(true)
  })

  it("detecta superposición cuando la nueva contiene a la existente", () => {
    expect(
      haySuperposicion([sesion("10:15", "10:45")], propuesta({ horaInicio: "10:00", horaFin: "11:00" })),
    ).toBe(true)
  })

  it("detecta superposición cuando la nueva empieza antes y termina después", () => {
    expect(
      haySuperposicion([sesion("10:30", "11:30")], propuesta({ horaInicio: "10:00", horaFin: "11:00" })),
    ).toBe(true)
  })

  it("detecta superposición exacta (mismo inicio y fin)", () => {
    expect(
      haySuperposicion([sesion("10:00", "11:00")], propuesta()),
    ).toBe(true)
  })

  it("NO detecta superposición cuando la nueva empieza exactamente cuando termina la existente", () => {
    expect(
      haySuperposicion([sesion("09:00", "10:00")], propuesta({ horaInicio: "10:00", horaFin: "11:00" })),
    ).toBe(false)
  })

  it("NO detecta superposición cuando la nueva termina exactamente cuando empieza la existente", () => {
    expect(
      haySuperposicion([sesion("11:00", "12:00")], propuesta({ horaInicio: "10:00", horaFin: "11:00" })),
    ).toBe(false)
  })

  it("no hay superposición con sesiones de otra mentora", () => {
    expect(
      haySuperposicion([sesion("10:00", "11:00", { mentoraId: "m2" })], propuesta()),
    ).toBe(false)
  })

  it("no hay superposición con sesiones de otra fecha", () => {
    expect(
      haySuperposicion([sesion("10:00", "11:00", { fecha: "2026-10-20" })], propuesta()),
    ).toBe(false)
  })

  it("ignora sesiones canceladas", () => {
    expect(
      haySuperposicion([sesion("10:00", "11:00", { estado: "cancelada" })], propuesta()),
    ).toBe(false)
  })

  it("devuelve false si no hay sesiones", () => {
    expect(haySuperposicion([], propuesta())).toBe(false)
  })
})
