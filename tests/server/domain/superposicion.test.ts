import type { Sesion } from "@shared/types"
import { haySuperposicion } from "../../../server/domain/superposicion"

const existente: Sesion = {
  id: "sesion", mentoraId: "mentora", tipoAsesoriaId: "revision_de_codigo",
  colectivoId: "colectivo", proyecto: "Revisar código", contactoNombre: "Ana",
  contactoEmail: "ana@example.org", fecha: "2026-10-19",
  horaInicio: "10:00", horaFin: "11:00", estado: "confirmada",
}
const candidata = { mentoraId: "mentora", fecha: "2026-10-19", horaInicio: "10:30", horaFin: "11:15" }

describe("haySuperposicion", () => {
  it.each([
    ["parcial posterior", "10:30", "11:15"],
    ["parcial anterior", "09:45", "10:15"],
    ["contenida", "10:15", "10:45"],
    ["envolvente", "09:00", "12:00"],
    ["idéntica", "10:00", "11:00"],
  ])("detecta superposición %s", (_, horaInicio, horaFin) => {
    expect(haySuperposicion([existente], { ...candidata, horaInicio, horaFin })).toBe(true)
  })

  it.each([
    ["adyacente anterior", "09:30", "10:00"],
    ["adyacente posterior", "11:00", "11:30"],
    ["separada anterior", "08:00", "09:00"],
    ["separada posterior", "12:00", "13:00"],
  ])("permite una sesión %s", (_, horaInicio, horaFin) => {
    expect(haySuperposicion([existente], { ...candidata, horaInicio, horaFin })).toBe(false)
  })

  it.each<Partial<Sesion>>([
    { estado: "cancelada" }, { mentoraId: "otra" }, { fecha: "2026-10-20" },
  ])("ignora sesiones fuera del criterio: %j", (cambio) => {
    expect(haySuperposicion([{ ...existente, ...cambio }], candidata)).toBe(false)
  })

  it("permite reservar sin sesiones previas", () => {
    expect(haySuperposicion([], candidata)).toBe(false)
  })

  it("encuentra un conflicto entre sesiones irrelevantes sin mutar las entradas", () => {
    const sesiones = Object.freeze([Object.freeze({ ...existente, estado: "cancelada" as const }), Object.freeze(existente)])
    expect(haySuperposicion(sesiones, Object.freeze(candidata))).toBe(true)
  })
})
