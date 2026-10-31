import type { Sesion } from "@shared/types"
import { haySuperposicion } from "../../../server/domain/superposicion"

const existente: Sesion = {
  id: "s1", mentoraId: "m1", tipoAsesoriaId: "revision_de_codigo",
  colectivoId: "c1", proyecto: "Revisar código", contactoNombre: "Ana",
  contactoEmail: "ana@example.org", fecha: "2026-11-02",
  horaInicio: "10:00", horaFin: "11:00", estado: "confirmada",
}
const nueva = { mentoraId: "m1", fecha: existente.fecha, horaInicio: "10:30", horaFin: "11:15" }

describe("haySuperposicion", () => {
  it.each([
    ["10:30", "11:15"], ["09:45", "10:15"], ["10:15", "10:45"],
    ["09:00", "12:00"], ["10:00", "11:00"],
  ])("detecta el cruce con %s–%s", (horaInicio, horaFin) => {
    expect(haySuperposicion([existente], { ...nueva, horaInicio, horaFin })).toBe(true)
  })

  it.each([["09:00", "10:00"], ["11:00", "11:45"], ["12:00", "13:00"]])(
    "permite intervalos separados o contiguos %s–%s", (horaInicio, horaFin) => {
      expect(haySuperposicion([existente], { ...nueva, horaInicio, horaFin })).toBe(false)
    },
  )

  it.each([
    { estado: "cancelada" as const }, { mentoraId: "m2" }, { fecha: "2026-11-03" },
  ])("ignora una sesión con %j", (extra) => {
    expect(haySuperposicion([{ ...existente, ...extra }], nueva)).toBe(false)
  })

  it("acepta una agenda vacía", () => {
    expect(haySuperposicion([], nueva)).toBe(false)
  })

  it("busca en toda la agenda sin modificar sus entradas", () => {
    const sesiones = Object.freeze([Object.freeze({ ...existente, estado: "cancelada" as const }), Object.freeze(existente)])
    expect(haySuperposicion(sesiones, Object.freeze(nueva))).toBe(true)
  })
})
