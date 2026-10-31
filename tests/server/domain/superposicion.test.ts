import type { Sesion } from "@shared/types"
import { haySuperposicion } from "../../../server/domain/horarios"

const LUNES = "2026-10-19"

const sesionConfirmada = (horaInicio: string, horaFin: string, extra: Partial<Sesion> = {}): Sesion => ({
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

describe("domain/horarios · haySuperposicion", () => {
  it("devuelve true cuando hay una sesión confirmada que se superpone", () => {
    const sesiones = [sesionConfirmada("10:00", "11:00")]
    expect(
      haySuperposicion(sesiones, {
        mentoraId: "m1",
        fecha: LUNES,
        horaInicio: "10:30",
        horaFin: "11:15",
      })
    ).toBe(true)
  })

  it("devuelve false cuando las sesiones solo tocan boundaries (una termina cuando otra empieza)", () => {
    const sesiones = [sesionConfirmada("10:00", "10:30")]
    expect(
      haySuperposicion(sesiones, {
        mentoraId: "m1",
        fecha: LUNES,
        horaInicio: "10:30",
        horaFin: "11:00",
      })
    ).toBe(false)
  })

  it("devuelve true cuando una sesión está completamente contenida en otra", () => {
    const sesiones = [sesionConfirmada("09:00", "12:00")]
    expect(
      haySuperposicion(sesiones, {
        mentoraId: "m1",
        fecha: LUNES,
        horaInicio: "10:00",
        horaFin: "11:00",
      })
    ).toBe(true)
  })

  it("devuelve false cuando la sesión es de otra mentora", () => {
    const sesiones = [sesionConfirmada("10:00", "11:00", { mentoraId: "m2" })]
    expect(
      haySuperposicion(sesiones, {
        mentoraId: "m1",
        fecha: LUNES,
        horaInicio: "10:30",
        horaFin: "11:15",
      })
    ).toBe(false)
  })

  it("devuelve false cuando la sesión es de otro día", () => {
    const sesiones = [sesionConfirmada("10:00", "11:00", { fecha: "2026-10-20" })]
    expect(
      haySuperposicion(sesiones, {
        mentoraId: "m1",
        fecha: LUNES,
        horaInicio: "10:30",
        horaFin: "11:15",
      })
    ).toBe(false)
  })

  it("devuelve false cuando la sesión está cancelada", () => {
    const sesiones = [sesionConfirmada("10:00", "11:00", { estado: "cancelada" })]
    expect(
      haySuperposicion(sesiones, {
        mentoraId: "m1",
        fecha: LUNES,
        horaInicio: "10:30",
        horaFin: "11:15",
      })
    ).toBe(false)
  })

  it("devuelve false cuando no hay superposición con sesiones de otra mentora", () => {
    const sesiones = [
      sesionConfirmada("09:00", "10:00", { mentoraId: "m2" }),
      sesionConfirmada("11:00", "12:00", { mentoraId: "m2" }),
    ]
    expect(
      haySuperposicion(sesiones, {
        mentoraId: "m1",
        fecha: LUNES,
        horaInicio: "10:30",
        horaFin: "11:15",
      })
    ).toBe(false)
  })
})