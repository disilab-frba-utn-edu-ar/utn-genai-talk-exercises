import type { Sesion } from "@shared/types"
import { haySuperposicion } from "../../../server/domain/superposicion"

const LUNES = "2026-10-19"
const MARTES = "2026-10-20"

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

const rango = (horaInicio: string, horaFin: string) => ({ mentoraId: "m1", fecha: LUNES, horaInicio, horaFin })

describe("domain/superposicion · haySuperposicion", () => {
  it("no hay superposición si no hay sesiones", () => {
    expect(haySuperposicion([], rango("10:00", "11:00"))).toBe(false)
  })

  it.each([
    ["empieza durante la existente", "10:30", "11:15"],
    ["termina durante la existente", "09:30", "10:30"],
    ["queda contenida en la existente", "10:15", "10:45"],
    ["contiene a la existente", "09:30", "11:30"],
    ["tiene exactamente el mismo horario", "10:00", "11:00"],
    ["empieza a la misma hora y dura menos", "10:00", "10:30"],
  ])("detecta la superposición cuando la nueva %s", (_caso, horaInicio, horaFin) => {
    expect(haySuperposicion([sesion("10:00", "11:00")], rango(horaInicio, horaFin))).toBe(true)
  })

  it.each([
    ["termina justo cuando empieza la existente", "09:00", "10:00"],
    ["empieza justo cuando termina la existente", "11:00", "11:30"],
    ["queda lejos de la existente", "15:00", "16:00"],
  ])("no hay superposición cuando la nueva %s", (_caso, horaInicio, horaFin) => {
    expect(haySuperposicion([sesion("10:00", "11:00")], rango(horaInicio, horaFin))).toBe(false)
  })

  it("una sesión que termina 10:30 no se superpone con otra que empieza 10:30", () => {
    expect(haySuperposicion([sesion("10:00", "10:30")], rango("10:30", "11:00"))).toBe(false)
  })

  it("ignora las sesiones canceladas", () => {
    expect(haySuperposicion([sesion("10:00", "11:00", { estado: "cancelada" })], rango("10:30", "11:15"))).toBe(false)
  })

  it("ignora las sesiones de otra mentora", () => {
    expect(haySuperposicion([sesion("10:00", "11:00", { mentoraId: "m2" })], rango("10:30", "11:15"))).toBe(false)
  })

  it("ignora las sesiones de otra fecha", () => {
    expect(haySuperposicion([sesion("10:00", "11:00", { fecha: MARTES })], rango("10:30", "11:15"))).toBe(false)
  })

  it("encuentra la sesión en conflicto entre varias que no cuentan", () => {
    const sesiones = [
      sesion("10:00", "11:00", { estado: "cancelada" }),
      sesion("10:00", "11:00", { mentoraId: "m2" }),
      sesion("08:00", "09:00"),
      sesion("10:45", "11:30"),
    ]
    expect(haySuperposicion(sesiones, rango("10:30", "11:15"))).toBe(true)
  })
})
