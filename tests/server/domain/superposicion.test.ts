import type { Sesion } from "@shared/types"
import { haySuperposicion } from "../../../server/domain/superposicion"

const existente: Sesion = {
  id: "s1",
  mentoraId: "m1",
  tipoAsesoriaId: "revision_de_codigo",
  colectivoId: "c1",
  proyecto: "Revisar el formulario",
  contactoNombre: "Ana",
  contactoEmail: "ana@example.org",
  fecha: "2026-10-19",
  horaInicio: "10:00",
  horaFin: "11:00",
  estado: "confirmada",
}

const nueva = {
  mentoraId: "m1",
  fecha: "2026-10-19",
  horaInicio: "10:30",
  horaFin: "11:15",
}

describe("domain/superposicion · haySuperposicion", () => {
  it.each([
    ["10:30", "11:15"],
    ["09:30", "10:30"],
    ["10:15", "10:45"],
    ["09:30", "11:30"],
    ["10:00", "11:00"],
    ["10:00", "10:30"],
    ["10:30", "11:00"],
  ])("detecta superposición para %s–%s contra 10:00–11:00", (horaInicio, horaFin) => {
    expect(haySuperposicion([existente], { ...nueva, horaInicio, horaFin })).toBe(true)
  })

  it.each([
    ["09:30", "10:00"],
    ["11:00", "11:30"],
    ["08:00", "09:00"],
    ["12:00", "13:00"],
  ])("no considera superposición para %s–%s contra 10:00–11:00", (horaInicio, horaFin) => {
    expect(haySuperposicion([existente], { ...nueva, horaInicio, horaFin })).toBe(false)
  })

  it.each<Partial<Sesion>>([
    { estado: "cancelada" },
    { mentoraId: "m2" },
    { fecha: "2026-10-20" },
  ])("ignora sesiones con %o", (extra) => {
    expect(haySuperposicion([{ ...existente, ...extra }], nueva)).toBe(false)
  })

  it("devuelve false sin sesiones", () => {
    expect(haySuperposicion([], nueva)).toBe(false)
  })

  it("encuentra el conflicto entre otras sesiones sin modificar las entradas", () => {
    const sesiones = [
      Object.freeze({ ...existente, estado: "cancelada" as const }),
      Object.freeze({ ...existente }),
    ]
    expect(haySuperposicion(Object.freeze(sesiones), Object.freeze(nueva))).toBe(true)
  })
})
