import type { Sesion } from "@shared/types"
import { haySuperposicion } from "../../../server/domain/superposicion"

const existente: Sesion = {
  id: "sesion", mentoraId: "mentora", tipoAsesoriaId: "revision_de_codigo",
  colectivoId: "colectivo", proyecto: "Revisar código", contactoNombre: "Ana",
  contactoEmail: "ana@example.org", fecha: "2026-10-19",
  horaInicio: "10:00", horaFin: "11:00", estado: "confirmada",
}
const nueva = { mentoraId: existente.mentoraId, fecha: existente.fecha }

describe("haySuperposicion", () => {
  it.each([
    ["10:30", "11:15"], ["09:30", "10:30"], ["10:15", "10:45"],
    ["09:30", "11:30"], ["10:00", "11:00"],
  ])("detecta superposición con %s–%s", (horaInicio, horaFin) => {
    expect(haySuperposicion([existente], { ...nueva, horaInicio, horaFin })).toBe(true)
  })

  it.each([
    ["09:00", "09:30"], ["09:00", "10:00"],
    ["11:00", "11:30"], ["11:30", "12:00"],
  ])("permite intervalos separados o contiguos: %s–%s", (horaInicio, horaFin) => {
    expect(haySuperposicion([existente], { ...nueva, horaInicio, horaFin })).toBe(false)
  })

  it.each<Partial<Sesion>>([
    { estado: "cancelada" }, { mentoraId: "otra" }, { fecha: "2026-10-20" },
  ])("ignora sesiones que no corresponden: %j", (extra) => {
    expect(haySuperposicion([{ ...existente, ...extra }], {
      ...nueva, horaInicio: "10:30", horaFin: "11:15",
    })).toBe(false)
  })

  it("devuelve false sin sesiones", () => {
    expect(haySuperposicion([], { ...nueva, horaInicio: "10:30", horaFin: "11:15" })).toBe(false)
  })

  it("busca en toda la lista sin modificar las sesiones", () => {
    const sesiones = Object.freeze([
      Object.freeze({ ...existente, estado: "cancelada" as const }), Object.freeze(existente),
    ])
    expect(haySuperposicion(sesiones, { ...nueva, horaInicio: "10:30", horaFin: "11:15" })).toBe(true)
  })
})
