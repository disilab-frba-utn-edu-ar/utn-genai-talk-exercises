import type { Sesion } from "@shared/types"
import { haySuperposicion } from "../../../server/domain/superposicion"

const sesion = (overrides: Partial<Sesion> = {}): Sesion => ({
  id: "1",
  mentoraId: "m1",
  tipoAsesoriaId: "t1",
  colectivoId: "c1",
  proyecto: "p",
  contactoNombre: "Ana",
  contactoEmail: "ana@example.org",
  fecha: "2026-10-19",
  horaInicio: "10:00",
  horaFin: "11:00",
  estado: "confirmada",
  ...overrides,
})

describe("domain/superposicion", () => {
  it("detecta superposición parcial", () => {
    const sesiones = [sesion({ horaInicio: "10:00", horaFin: "11:00" })]
    expect(haySuperposicion(sesiones, { mentoraId: "m1", fecha: "2026-10-19", horaInicio: "10:30", horaFin: "11:15" })).toBe(true)
  })

  it("no superpone si una termina a las 10:30 y otra empieza 10:30", () => {
    const sesiones = [sesion({ horaInicio: "09:30", horaFin: "10:30" })]
    expect(haySuperposicion(sesiones, { mentoraId: "m1", fecha: "2026-10-19", horaInicio: "10:30", horaFin: "11:00" })).toBe(false)
  })

  it("ignora sesiones canceladas", () => {
    const sesiones = [sesion({ estado: "cancelada" })]
    expect(haySuperposicion(sesiones, { mentoraId: "m1", fecha: "2026-10-19", horaInicio: "10:00", horaFin: "11:00" })).toBe(false)
  })

  it("ignora otra mentora o fecha", () => {
    const sesiones = [sesion({ mentoraId: "m2" })]
    expect(haySuperposicion(sesiones, { mentoraId: "m1", fecha: "2026-10-19", horaInicio: "10:00", horaFin: "11:00" })).toBe(false)
    const sesiones2 = [sesion({ fecha: "2026-10-20" })]
    expect(haySuperposicion(sesiones2, { mentoraId: "m1", fecha: "2026-10-19", horaInicio: "10:00", horaFin: "11:00" })).toBe(false)
  })
})
