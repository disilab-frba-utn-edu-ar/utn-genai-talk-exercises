import type { Sesion } from "@shared/types"
import { haySuperposicion } from "../../../server/domain/superposicion"

const sesion = (extra: Partial<Sesion> = {}): Sesion => ({
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
  ...extra,
})

describe("domain/superposicion · haySuperposicion", () => {
  it("devuelve false si no hay sesiones", () => {
    expect(haySuperposicion([], { mentoraId: "m1", fecha: "2026-10-19", horaInicio: "10:00", horaFin: "11:00" })).toBe(false)
  })

  it("ignora sesiones canceladas", () => {
    expect(
      haySuperposicion([sesion({ estado: "cancelada" })], {
        mentoraId: "m1",
        fecha: "2026-10-19",
        horaInicio: "10:30",
        horaFin: "11:15",
      }),
    ).toBe(false)
  })

  it("ignora sesiones de otra mentora o de otra fecha", () => {
    expect(
      haySuperposicion([sesion({ mentoraId: "m2" })], {
        mentoraId: "m1",
        fecha: "2026-10-19",
        horaInicio: "10:30",
        horaFin: "11:15",
      }),
    ).toBe(false)
    expect(
      haySuperposicion([sesion({ fecha: "2026-10-20" })], {
        mentoraId: "m1",
        fecha: "2026-10-19",
        horaInicio: "10:30",
        horaFin: "11:15",
      }),
    ).toBe(false)
  })

  it("detecta superposición parcial", () => {
    expect(
      haySuperposicion([sesion()], {
        mentoraId: "m1",
        fecha: "2026-10-19",
        horaInicio: "10:30",
        horaFin: "11:15",
      }),
    ).toBe(true)
  })

  it("detecta superposición exacta de inicio", () => {
    expect(
      haySuperposicion([sesion()], {
        mentoraId: "m1",
        fecha: "2026-10-19",
        horaInicio: "10:00",
        horaFin: "11:00",
      }),
    ).toBe(true)
  })

  it("detecta cuando la nueva contiene a la existente", () => {
    expect(
      haySuperposicion([sesion()], {
        mentoraId: "m1",
        fecha: "2026-10-19",
        horaInicio: "09:30",
        horaFin: "11:30",
      }),
    ).toBe(true)
  })

  it("detecta cuando la existente contiene a la nueva", () => {
    expect(
      haySuperposicion([sesion()], {
        mentoraId: "m1",
        fecha: "2026-10-19",
        horaInicio: "10:15",
        horaFin: "10:45",
      }),
    ).toBe(true)
  })

  it("no se superponen si una termina cuando la otra empieza", () => {
    expect(
      haySuperposicion([sesion()], {
        mentoraId: "m1",
        fecha: "2026-10-19",
        horaInicio: "11:00",
        horaFin: "12:00",
      }),
    ).toBe(false)
    expect(
      haySuperposicion([sesion({ horaInicio: "09:00", horaFin: "10:00" })], {
        mentoraId: "m1",
        fecha: "2026-10-19",
        horaInicio: "10:00",
        horaFin: "11:00",
      }),
    ).toBe(false)
  })
})
