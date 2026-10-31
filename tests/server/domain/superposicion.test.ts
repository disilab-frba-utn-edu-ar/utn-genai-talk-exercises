import type { Sesion } from "@shared/types"
import { haySuperposicion } from "../../../server/domain/superposicion"

const existente: Sesion = {
  id: "sesion", mentoraId: "mentora", tipoAsesoriaId: "revision_de_codigo",
  colectivoId: "colectivo", proyecto: "Proyecto", contactoNombre: "Ana",
  contactoEmail: "ana@example.org", fecha: "2026-11-02",
  horaInicio: "10:00", horaFin: "11:00", estado: "confirmada",
}
const nueva = { mentoraId: "mentora", fecha: "2026-11-02", horaInicio: "10:30", horaFin: "11:15" }

describe("haySuperposicion", () => {
  it.each([
    ["cruce al final", "10:30", "11:15", true],
    ["cruce al principio", "09:30", "10:30", true],
    ["contenida", "10:15", "10:45", true],
    ["contiene la existente", "09:30", "11:30", true],
    ["idéntica", "10:00", "11:00", true],
    ["contigua anterior", "09:30", "10:00", false],
    ["contigua posterior", "11:00", "11:30", false],
    ["separada anterior", "08:00", "09:00", false],
    ["separada posterior", "12:00", "13:00", false],
  ])("%s", (_caso, horaInicio, horaFin, esperado) => {
    expect(haySuperposicion([existente], { ...nueva, horaInicio, horaFin })).toBe(esperado)
  })

  it.each<Partial<Sesion>>([
    { estado: "cancelada" }, { mentoraId: "otra" }, { fecha: "2026-11-03" },
  ])("ignora sesiones que no corresponden: %o", (cambios) => {
    expect(haySuperposicion([{ ...existente, ...cambios }], nueva)).toBe(false)
  })

  it("sin sesiones no hay superposición", () => {
    expect(haySuperposicion([], nueva)).toBe(false)
  })

  it("detecta el conflicto aunque haya sesiones irrelevantes antes", () => {
    expect(haySuperposicion([{ ...existente, estado: "cancelada" }, existente], nueva)).toBe(true)
  })
})
