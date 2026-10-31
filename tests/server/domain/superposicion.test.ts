import type { Sesion } from "@shared/types"
import { haySuperposicion } from "../../../server/domain/superposicion"

const LUNES = "2026-10-19"

const sesion = (horaInicio: string, horaFin: string, extra: Partial<Sesion> = {}): Sesion => ({
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

const nueva = (horaInicio: string, horaFin: string, extra: Record<string, string> = {}) => ({
  mentoraId: "m1",
  fecha: LUNES,
  horaInicio,
  horaFin,
  ...extra,
})

describe("haySuperposicion", () => {
  const existentes = [sesion("10:00", "11:00")]

  it("detecta una superposición parcial al final de la existente", () => {
    expect(haySuperposicion(existentes, nueva("10:30", "11:15"))).toBe(true)
  })

  it("detecta una superposición parcial al principio de la existente", () => {
    expect(haySuperposicion(existentes, nueva("09:30", "10:30"))).toBe(true)
  })

  it("detecta que la nueva contiene a la existente, o está contenida", () => {
    expect(haySuperposicion(existentes, nueva("09:30", "11:30"))).toBe(true)
    expect(haySuperposicion(existentes, nueva("10:15", "10:45"))).toBe(true)
  })

  it("detecta el mismo inicio", () => {
    expect(haySuperposicion(existentes, nueva("10:00", "10:30"))).toBe(true)
  })

  it("no cuenta como superposición que una termine cuando la otra empieza", () => {
    expect(haySuperposicion(existentes, nueva("11:00", "11:30"))).toBe(false)
    expect(haySuperposicion(existentes, nueva("09:30", "10:00"))).toBe(false)
  })

  it("ignora sesiones de otra mentora o de otra fecha", () => {
    expect(haySuperposicion(existentes, nueva("10:30", "11:15", { mentoraId: "m2" }))).toBe(false)
    expect(haySuperposicion(existentes, nueva("10:30", "11:15", { fecha: "2026-10-21" }))).toBe(false)
  })

  it("ignora sesiones canceladas", () => {
    expect(haySuperposicion([sesion("10:00", "11:00", { estado: "cancelada" })], nueva("10:30", "11:15"))).toBe(false)
  })

  it("no hay superposición sin sesiones", () => {
    expect(haySuperposicion([], nueva("10:00", "11:00"))).toBe(false)
  })
})
