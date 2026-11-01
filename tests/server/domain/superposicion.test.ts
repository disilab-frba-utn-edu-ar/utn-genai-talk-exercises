import type { Sesion } from "@shared/types"
import { haySuperposicion } from "../../../server/domain/superposicion"

const unaSesion = (overtime: Partial<Sesion> = {}): Sesion => ({
  id: "s",
  mentoraId: "m1",
  tipoAsesoriaId: "t",
  colectivoId: "c",
  proyecto: "p",
  contactoNombre: "n",
  contactoEmail: "e@example.org",
  fecha: "2026-10-19",
  horaInicio: "10:00",
  horaFin: "11:00",
  estado: "confirmada",
  ...overtime,
})

describe("domain/superposicion · haySuperposicion", () => {
  it("devuelve false cuando no hay sesiones confirmadas", () => {
    expect(
      haySuperposicion([], {
        mentoraId: "m1",
        fecha: "2026-10-19",
        horaInicio: "10:00",
        horaFin: "11:00",
      })
    ).toBe(false)
  })

  it("devuelve false cuando hay sesiones pero de mentoras distintas", () => {
    const sesion = unaSesion()
    expect(
      haySuperposicion([sesion], {
        mentoraId: "m2",
        fecha: "2026-10-19",
        horaInicio: "10:00",
        horaFin: "11:00",
      })
    ).toBe(false)
  })

  it("devuelve false cuando hay sesiones pero de fechas distintas", () => {
    const sesion = unaSesion()
    expect(
      haySuperposicion([sesion], {
        mentoraId: "m1",
        fecha: "2026-10-20",
        horaInicio: "10:00",
        horaFin: "11:00",
      })
    ).toBe(false)
  })

  it("devuelve false cuando la sesión termina exactamente cuando comienza la nueva", () => {
    // Sesión 10:00-10:30, nueva sesión 10:30-11:00: no se superponen
    const sesion = unaSesion({ horaFin: "10:30" })
    expect(
      haySuperposicion([sesion], {
        mentoraId: "m1",
        fecha: "2026-10-19",
        horaInicio: "10:30",
        horaFin: "11:00",
      })
    ).toBe(false)
  })

  it("devuelve true cuando la nueva sesión empieza antes de que termine la existente", () => {
    // Sesión 10:00-11:00, nueva sesión 10:30-11:30: se superponen
    const sesion = unaSesion()
    expect(
      haySuperposicion([sesion], {
        mentoraId: "m1",
        fecha: "2026-10-19",
        horaInicio: "10:30",
        horaFin: "11:30",
      })
    ).toBe(true)
  })

  it("devuelve true cuando la nueva sesión termina después de que empiece la existente", () => {
    // Sesión 10:00-11:00, nueva sesión 09:30-10:30: se superponen
    const sesion = unaSesion()
    expect(
      haySuperposicion([sesion], {
        mentoraId: "m1",
        fecha: "2026-10-19",
        horaInicio: "09:30",
        horaFin: "10:30",
      })
    ).toBe(true)
  })

  it("devuelve false cuando la sesión termina exactamente cuando empieza la otra (límite)", () => {
    // Sesión 09:00-10:00, nueva sesión 10:00-11:00: no se superponen
    const sesion = unaSesion({ horaFin: "10:00" })
    expect(
      haySuperposicion([sesion], {
        mentoraId: "m1",
        fecha: "2026-10-19",
        horaInicio: "10:00",
        horaFin: "11:00",
      })
    ).toBe(false)
  })

  it("ignora sesiones canceladas", () => {
    const sesionCancelada = unaSesion({ estado: "cancelada" })
    expect(
      haySuperposicion([sesionCancelada], {
        mentoraId: "m1",
        fecha: "2026-10-19",
        horaInicio: "10:00",
        horaFin: "11:00",
      })
    ).toBe(false)
  })

  it("ignora sesiones de otros estados", () => {
    const sesion = unaSesion({ estado: "cancelada" })
    expect(
      haySuperposicion([sesion], {
        mentoraId: "m1",
        fecha: "2026-10-19",
        horaInicio: "10:00",
        horaFin: "11:00",
      })
    ).toBe(false)
  })
})