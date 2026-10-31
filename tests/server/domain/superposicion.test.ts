import { haySuperposicion } from "../../../server/domain/superposicion"
import type { Sesion } from "@shared/types"

function sesion(extra: Partial<Sesion> = {}): Sesion {
  return {
    id: "s1",
    mentoraId: "m1",
    tipoAsesoriaId: "revision_de_codigo",
    colectivoId: "c1",
    proyecto: "Proyecto",
    contactoNombre: "Ana",
    contactoEmail: "ana@example.org",
    fecha: "2026-10-19",
    horaInicio: "10:00",
    horaFin: "11:00",
    estado: "confirmada",
    ...extra,
  }
}

const datos = { mentoraId: "m1", fecha: "2026-10-19", horaInicio: "10:30", horaFin: "11:15" }

describe("domain/superposicion · haySuperposicion", () => {
  it("devuelve false si no hay sesiones", () => {
    expect(haySuperposicion([], datos)).toBe(false)
  })

  it("devuelve false si la sesión es de otra mentora", () => {
    expect(haySuperposicion([sesion({ mentoraId: "m2" })], datos)).toBe(false)
  })

  it("devuelve false si la sesión es otro día", () => {
    expect(haySuperposicion([sesion({ fecha: "2026-10-20" })], datos)).toBe(false)
  })

  it("no cuenta las sesiones canceladas", () => {
    expect(haySuperposicion([sesion({ estado: "cancelada" })], datos)).toBe(false)
  })

  it("no se superponen cuando una termina exactamente cuando empieza la otra", () => {
    expect(haySuperposicion([sesion({ horaFin: "10:30" })], { ...datos, horaInicio: "10:30" })).toBe(false)
    expect(haySuperposicion([sesion({ horaInicio: "11:15" })], { ...datos, horaFin: "11:15" })).toBe(false)
  })

  it("detecta superposición parcial (nueva dentro de la existente)", () => {
    expect(haySuperposicion([sesion()], datos)).toBe(true)
  })

  it("detecta superposición cuando la existente está dentro de la nueva", () => {
    expect(haySuperposicion([sesion({ horaInicio: "10:30", horaFin: "11:00" })], datos)).toBe(true)
  })

  it("detecta superposición cuando la nueva empieza antes y termina durante la existente", () => {
    expect(haySuperposicion([sesion({ horaInicio: "10:15", horaFin: "10:45" })], { ...datos, horaInicio: "10:00", horaFin: "10:30" })).toBe(true)
  })
})
