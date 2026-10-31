import type { Sesion } from "@shared/types"
import { haySuperposicion } from "../../../server/domain/superposicion"

const LUNES = "2026-10-19"
const MARTES = "2026-10-20"

const sesion = (extra: Partial<Sesion> = {}): Sesion => ({
  id: "s",
  mentoraId: "m1",
  tipoAsesoriaId: "t",
  colectivoId: "c",
  proyecto: "p",
  contactoNombre: "n",
  contactoEmail: "e@example.org",
  fecha: LUNES,
  horaInicio: "10:00",
  horaFin: "11:00",
  estado: "confirmada",
  ...extra,
})

describe("domain/superposicion · haySuperposicion", () => {
  it("devuelve false si no hay sesiones", () => {
    expect(haySuperposicion([], { mentoraId: "m1", fecha: LUNES, horaInicio: "10:00", horaFin: "11:00" })).toBe(false)
  })

  it("detecta solapamiento parcial", () => {
    expect(haySuperposicion([sesion()], { mentoraId: "m1", fecha: LUNES, horaInicio: "10:30", horaFin: "11:30" })).toBe(true)
  })

  it("detecta solapamiento total / igualdad de rango", () => {
    expect(haySuperposicion([sesion()], { mentoraId: "m1", fecha: LUNES, horaInicio: "10:00", horaFin: "11:00" })).toBe(true)
  })

  it("detecta cuando la nueva contiene a la existente", () => {
    expect(haySuperposicion([sesion()], { mentoraId: "m1", fecha: LUNES, horaInicio: "09:30", horaFin: "11:30" })).toBe(true)
  })

  it("NO se superponen si una termina justo cuando la otra empieza", () => {
    expect(haySuperposicion([sesion({ horaInicio: "10:00", horaFin: "10:30" })], { mentoraId: "m1", fecha: LUNES, horaInicio: "10:30", horaFin: "11:00" })).toBe(false)
    expect(haySuperposicion([sesion({ horaInicio: "10:30", horaFin: "11:00" })], { mentoraId: "m1", fecha: LUNES, horaInicio: "10:00", horaFin: "10:30" })).toBe(false)
  })

  it("ignora sesiones canceladas", () => {
    expect(haySuperposicion([sesion({ estado: "cancelada" })], { mentoraId: "m1", fecha: LUNES, horaInicio: "10:30", horaFin: "11:30" })).toBe(false)
  })

  it("ignora sesiones de otra mentora", () => {
    expect(haySuperposicion([sesion({ mentoraId: "m2" })], { mentoraId: "m1", fecha: LUNES, horaInicio: "10:30", horaFin: "11:30" })).toBe(false)
  })

  it("ignora sesiones de otra fecha", () => {
    expect(haySuperposicion([sesion({ fecha: MARTES })], { mentoraId: "m1", fecha: LUNES, horaInicio: "10:30", horaFin: "11:30" })).toBe(false)
  })
})
