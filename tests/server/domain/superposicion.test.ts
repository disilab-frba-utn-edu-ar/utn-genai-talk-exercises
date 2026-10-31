import type { Sesion } from "@shared/types"
import { haySuperposicion } from "../../../server/domain/superposicion"

const LUNES = "2026-10-19"

const sesion = (
  horaInicio: string,
  horaFin: string,
  extra: Partial<Sesion> = {},
): Sesion => ({
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

describe("domain/superposicion · haySuperposicion", () => {
  it("detecta superposición parcial", () => {
    const sesiones = [sesion("10:00", "11:00")]
    expect(
      haySuperposicion(sesiones, {
        mentoraId: "m1",
        fecha: LUNES,
        horaInicio: "10:30",
        horaFin: "11:15",
      }),
    ).toBe(true)
  })

  it("no confunde dos sesiones que se tocan por un extremo: la primera termina 10:30 y la segunda empieza 10:30", () => {
    const sesiones = [sesion("10:00", "10:30")]
    expect(
      haySuperposicion(sesiones, {
        mentoraId: "m1",
        fecha: LUNES,
        horaInicio: "10:30",
        horaFin: "11:00",
      }),
    ).toBe(false)
  })

  it("no confunde dos sesiones que se tocan por el otro extremo: la segunda termina 10:30 y la primera empieza 10:30", () => {
    const sesiones = [sesion("10:30", "11:00")]
    expect(
      haySuperposicion(sesiones, {
        mentoraId: "m1",
        fecha: LUNES,
        horaInicio: "10:00",
        horaFin: "10:30",
      }),
    ).toBe(false)
  })

  it("no considera superpuestas sesiones de otra mentora", () => {
    const sesiones = [sesion("10:00", "11:00", { mentoraId: "m2" })]
    expect(
      haySuperposicion(sesiones, {
        mentoraId: "m1",
        fecha: LUNES,
        horaInicio: "10:30",
        horaFin: "11:00",
      }),
    ).toBe(false)
  })

  it("no considera superpuestas sesiones de otra fecha", () => {
    const sesiones = [sesion("10:00", "11:00")]
    expect(
      haySuperposicion(sesiones, {
        mentoraId: "m1",
        fecha: "2026-10-20",
        horaInicio: "10:30",
        horaFin: "11:00",
      }),
    ).toBe(false)
  })

  it("no considera superpuestas sesiones canceladas", () => {
    const sesiones = [sesion("10:00", "11:00", { estado: "cancelada" })]
    expect(
      haySuperposicion(sesiones, {
        mentoraId: "m1",
        fecha: LUNES,
        horaInicio: "10:30",
        horaFin: "11:00",
      }),
    ).toBe(false)
  })

  it("no reporta superposición si no hay sesiones confirmadas", () => {
    expect(
      haySuperposicion([], {
        mentoraId: "m1",
        fecha: LUNES,
        horaInicio: "10:00",
        horaFin: "10:30",
      }),
    ).toBe(false)
  })
})
