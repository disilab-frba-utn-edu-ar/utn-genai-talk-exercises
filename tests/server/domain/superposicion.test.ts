import type { Sesion } from "@shared/types"
import { haySuperposicion } from "../../../server/domain/superposicion"

const LUNES = "2026-10-19"

const sesion = (
  horaInicio: string,
  horaFin: string,
  extra: Partial<Sesion> = {},
): Sesion => ({
  id: "s1",
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
  it("devuelve false si no hay sesiones", () => {
    expect(
      haySuperposicion([], {
        mentoraId: "m1",
        fecha: LUNES,
        horaInicio: "10:00",
        horaFin: "11:00",
      }),
    ).toBe(false)
  })

  it("devuelve false si no hay coincidencia de mentora, fecha o estado confirmada", () => {
    const existentes = [
      sesion("09:00", "10:00", { mentoraId: "otra" }), // otra mentora
      sesion("09:00", "10:00", { fecha: "2026-10-20" }), // otro día
      sesion("09:00", "10:00", { estado: "cancelada" }), // no confirmada
    ]
    expect(
      haySuperposicion(existentes, {
        mentoraId: "m1",
        fecha: LUNES,
        horaInicio: "09:30",
        horaFin: "10:30",
      }),
    ).toBe(false)
  })

  it("detecta superposición parcial (la nueva empieza dentro de la existente)", () => {
    const existentes = [sesion("10:00", "11:00")]
    expect(
      haySuperposicion(existentes, {
        mentoraId: "m1",
        fecha: LUNES,
        horaInicio: "10:30",
        horaFin: "11:15",
      }),
    ).toBe(true)
  })

  it("detecta superposición cuando la nueva contiene a la existente", () => {
    const existentes = [sesion("10:30", "11:00")]
    expect(
      haySuperposicion(existentes, {
        mentoraId: "m1",
        fecha: LUNES,
        horaInicio: "10:00",
        horaFin: "11:15",
      }),
    ).toBe(true)
  })

  it("detecta superposición cuando la existente contiene a la nueva", () => {
    const existentes = [sesion("10:00", "11:15")]
    expect(
      haySuperposicion(existentes, {
        mentoraId: "m1",
        fecha: LUNES,
        horaInicio: "10:30",
        horaFin: "11:00",
      }),
    ).toBe(true)
  })

  it("detecta superposición de rango idéntico", () => {
    const existentes = [sesion("10:00", "11:00")]
    expect(
      haySuperposicion(existentes, {
        mentoraId: "m1",
        fecha: LUNES,
        horaInicio: "10:00",
        horaFin: "11:00",
      }),
    ).toBe(true)
  })

  it("NO detecta superposición cuando solo se tocan en el borde", () => {
    const existentes = [sesion("09:00", "10:30")]
    expect(
      haySuperposicion(existentes, {
        mentoraId: "m1",
        fecha: LUNES,
        horaInicio: "10:30",
        horaFin: "11:00",
      }),
    ).toBe(false)
    expect(
      haySuperposicion(existentes, {
        mentoraId: "m1",
        fecha: LUNES,
        horaInicio: "08:00",
        horaFin: "09:00",
      }),
    ).toBe(false)
  })
})
