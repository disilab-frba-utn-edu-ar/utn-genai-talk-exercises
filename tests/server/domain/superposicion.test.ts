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

const params = (
  horaInicio: string,
  horaFin: string,
  mentoraId = "m1",
  fecha = LUNES,
) => ({
  mentoraId,
  fecha,
  horaInicio,
  horaFin,
})

describe("domain/superposicion · haySuperposicion", () => {
  it("devuelve false si no hay sesiones", () => {
    expect(haySuperposicion([], params("10:00", "11:00"))).toBe(false)
  })

  it("devuelve true con superposición parcial (la nueva empieza dentro de la existente)", () => {
    expect(
      haySuperposicion([sesion("10:00", "11:00")], params("10:30", "11:15")),
    ).toBe(true)
  })

  it("devuelve true cuando la nueva contiene a la existente", () => {
    expect(
      haySuperposicion([sesion("10:30", "11:00")], params("10:00", "11:30")),
    ).toBe(true)
  })

  it("devuelve true cuando la existente contiene a la nueva", () => {
    expect(
      haySuperposicion([sesion("10:00", "11:30")], params("10:30", "11:00")),
    ).toBe(true)
  })

  it("devuelve true cuando empiezan a la misma hora", () => {
    expect(
      haySuperposicion([sesion("10:00", "11:00")], params("10:00", "11:00")),
    ).toBe(true)
  })

  it("devuelve false si solo se tocan en el límite (una termina cuando la otra empieza)", () => {
    expect(haySuperposicion([sesion("10:00", "10:30")], params("10:30", "11:00"))).toBe(
      false,
    )
    expect(haySuperposicion([sesion("10:30", "11:00")], params("10:00", "10:30"))).toBe(
      false,
    )
  })

  it("ignora sesiones canceladas", () => {
    expect(
      haySuperposicion(
        [sesion("10:00", "11:00", { estado: "cancelada" })],
        params("10:30", "11:15"),
      ),
    ).toBe(false)
  })

  it("ignora sesiones de otra mentora", () => {
    expect(
      haySuperposicion(
        [sesion("10:00", "11:00", { mentoraId: "m2" })],
        params("10:30", "11:15", "m1"),
      ),
    ).toBe(false)
  })

  it("ignora sesiones de otro día", () => {
    expect(
      haySuperposicion(
        [sesion("10:00", "11:00", { fecha: "2026-10-20" })],
        params("10:30", "11:15", "m1", "2026-10-19"),
      ),
    ).toBe(false)
  })
})