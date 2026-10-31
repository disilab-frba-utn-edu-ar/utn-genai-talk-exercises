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

const propuesta = {
  mentoraId: "m1",
  fecha: LUNES,
  horaInicio: "10:30",
  horaFin: "11:15",
}

describe("domain/superposicion · haySuperposicion", () => {
  it("detecta una sesión confirmada que se pisa parcialmente", () => {
    expect(haySuperposicion([sesion("10:00", "11:00")], propuesta)).toBe(true)
    expect(haySuperposicion([sesion("11:00", "12:00")], propuesta)).toBe(true)
  })

  it("detecta sesiones contenidas o que contienen a la propuesta", () => {
    expect(haySuperposicion([sesion("10:45", "11:00")], propuesta)).toBe(true)
    expect(haySuperposicion([sesion("10:00", "12:00")], propuesta)).toBe(true)
  })

  it("detecta una sesión que empieza exactamente a la misma hora", () => {
    expect(haySuperposicion([sesion("10:30", "11:00")], propuesta)).toBe(true)
  })

  it("una sesión que termina justo cuando la otra empieza NO se superpone", () => {
    expect(haySuperposicion([sesion("09:30", "10:30")], propuesta)).toBe(false)
    expect(haySuperposicion([sesion("11:15", "12:00")], propuesta)).toBe(false)
  })

  it("ignora sesiones canceladas", () => {
    expect(haySuperposicion([sesion("10:00", "11:00", { estado: "cancelada" })], propuesta)).toBe(false)
  })

  it("ignora sesiones de otra mentora", () => {
    expect(haySuperposicion([sesion("10:00", "11:00", { mentoraId: "otra" })], propuesta)).toBe(false)
  })

  it("ignora sesiones de otra fecha", () => {
    expect(haySuperposicion([sesion("10:00", "11:00", { fecha: MARTES })], propuesta)).toBe(false)
  })

  it("sin sesiones no hay superposición", () => {
    expect(haySuperposicion([], propuesta)).toBe(false)
  })
})
