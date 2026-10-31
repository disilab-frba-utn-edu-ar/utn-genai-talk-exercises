import type { Sesion } from "@shared/types"
import { haySuperposicion } from "../../../server/domain/superposicion"

const sesion = (
  horaInicio: string,
  horaFin: string,
  extra: Partial<Sesion> = {},
): Sesion => ({
  id: "s1",
  mentoraId: "m1",
  tipoAsesoriaId: "t1",
  colectivoId: "c1",
  proyecto: "proyecto",
  contactoNombre: "Ana",
  contactoEmail: "ana@example.org",
  fecha: "2026-10-19",
  horaInicio,
  horaFin,
  estado: "confirmada",
  ...extra,
})

describe("domain/superposicion · haySuperposicion", () => {
  it("no hay superposición si no hay sesiones", () => {
    expect(
      haySuperposicion([], {
        mentoraId: "m1",
        fecha: "2026-10-19",
        horaInicio: "10:00",
        horaFin: "11:00",
      }),
    ).toBe(false)
  })

  it("no hay superposición de otra mentora mismo día y horario", () => {
    const existentes = [sesion("10:00", "11:00", { mentoraId: "m2" })]
    expect(
      haySuperposicion(existentes, {
        mentoraId: "m1",
        fecha: "2026-10-19",
        horaInicio: "10:00",
        horaFin: "11:00",
      }),
    ).toBe(false)
  })

  it("no hay superposición de otro día", () => {
    const existentes = [sesion("10:00", "11:00", { fecha: "2026-10-20" })]
    expect(
      haySuperposicion(existentes, {
        mentoraId: "m1",
        fecha: "2026-10-19",
        horaInicio: "10:00",
        horaFin: "11:00",
      }),
    ).toBe(false)
  })

  it("ignora sesiones canceladas", () => {
    const existentes = [sesion("10:00", "11:00", { estado: "cancelada" })]
    expect(
      haySuperposicion(existentes, {
        mentoraId: "m1",
        fecha: "2026-10-19",
        horaInicio: "10:00",
        horaFin: "11:00",
      }),
    ).toBe(false)
  })

  it("no hay superposición cuando solo se tocan los bordes (una termina 10:30, otra empieza 10:30)", () => {
    const existentes = [sesion("09:00", "10:30")]
    expect(
      haySuperposicion(existentes, {
        mentoraId: "m1",
        fecha: "2026-10-19",
        horaInicio: "10:30",
        horaFin: "11:00",
      }),
    ).toBe(false)
  })

  it("no hay superposición cuando la nueva termina exactamente cuando empieza la existente", () => {
    const existentes = [sesion("11:00", "12:00")]
    expect(
      haySuperposicion(existentes, {
        mentoraId: "m1",
        fecha: "2026-10-19",
        horaInicio: "10:00",
        horaFin: "11:00",
      }),
    ).toBe(false)
  })

  it("detecta superposición parcial: la nueva empieza dentro de la existente", () => {
    const existentes = [sesion("10:00", "11:00")]
    expect(
      haySuperposicion(existentes, {
        mentoraId: "m1",
        fecha: "2026-10-19",
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
        fecha: "2026-10-19",
        horaInicio: "10:00",
        horaFin: "11:30",
      }),
    ).toBe(true)
  })

  it("detecta superposición cuando la existente contiene a la nueva", () => {
    const existentes = [sesion("10:00", "11:00")]
    expect(
      haySuperposicion(existentes, {
        mentoraId: "m1",
        fecha: "2026-10-19",
        horaInicio: "10:30",
        horaFin: "11:00",
      }),
    ).toBe(true)
  })

  it("detecta superposición cuando empiezan a la misma hora", () => {
    const existentes = [sesion("10:00", "11:00")]
    expect(
      haySuperposicion(existentes, {
        mentoraId: "m1",
        fecha: "2026-10-19",
        horaInicio: "10:00",
        horaFin: "11:00",
      }),
    ).toBe(true)
  })

  it("detecta superposición cuando la nueva empieza antes y termina dentro de la existente", () => {
    const existentes = [sesion("10:30", "11:30")]
    expect(
      haySuperposicion(existentes, {
        mentoraId: "m1",
        fecha: "2026-10-19",
        horaInicio: "10:00",
        horaFin: "11:00",
      }),
    ).toBe(true)
  })
})