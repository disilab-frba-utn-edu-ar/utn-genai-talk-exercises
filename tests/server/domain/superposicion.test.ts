import type { Sesion } from "@shared/types"
import { haySuperposicion } from "../../../server/domain/superposicion"

const MENTORA = "mentora-1"
const FECHA = "2026-10-19"

const sesion = (extra: Partial<Sesion> = {}): Sesion => ({
  id: "s1",
  mentoraId: MENTORA,
  tipoAsesoriaId: "revision_de_codigo",
  colectivoId: "c1",
  proyecto: "Proyecto",
  contactoNombre: "Ana",
  contactoEmail: "ana@example.org",
  fecha: FECHA,
  horaInicio: "10:00",
  horaFin: "11:00",
  estado: "confirmada",
  ...extra,
})

const nueva = (horaInicio: string, horaFin: string, extra: Record<string, string> = {}) => ({
  mentoraId: MENTORA,
  fecha: FECHA,
  horaInicio,
  horaFin,
  ...extra,
})

describe("haySuperposicion", () => {
  it("es false sin sesiones", () => {
    expect(haySuperposicion([], nueva("10:00", "11:00"))).toBe(false)
  })

  it("detecta el mismo horario exacto", () => {
    expect(haySuperposicion([sesion()], nueva("10:00", "11:00"))).toBe(true)
  })

  it("detecta una superposición parcial al final de la existente (10:30–11:15)", () => {
    expect(haySuperposicion([sesion()], nueva("10:30", "11:15"))).toBe(true)
  })

  it("detecta una superposición parcial al comienzo de la existente", () => {
    expect(haySuperposicion([sesion()], nueva("09:30", "10:15"))).toBe(true)
  })

  it("detecta una sesión nueva contenida en la existente", () => {
    expect(haySuperposicion([sesion()], nueva("10:15", "10:45"))).toBe(true)
  })

  it("detecta una sesión nueva que contiene a la existente", () => {
    expect(haySuperposicion([sesion()], nueva("09:00", "12:00"))).toBe(true)
  })

  it("no cuenta como superposición que una termine cuando la otra empieza", () => {
    expect(haySuperposicion([sesion()], nueva("11:00", "11:30"))).toBe(false)
    expect(haySuperposicion([sesion()], nueva("09:30", "10:00"))).toBe(false)
  })

  it("ignora las sesiones canceladas", () => {
    expect(haySuperposicion([sesion({ estado: "cancelada" })], nueva("10:00", "11:00"))).toBe(false)
  })

  it("ignora las sesiones de otra mentora", () => {
    expect(haySuperposicion([sesion({ mentoraId: "otra" })], nueva("10:00", "11:00"))).toBe(false)
  })

  it("ignora las sesiones de otra fecha", () => {
    expect(haySuperposicion([sesion({ fecha: "2026-10-20" })], nueva("10:00", "11:00"))).toBe(false)
  })

  it("alcanza con que una de varias sesiones se superponga", () => {
    const sesiones = [sesion({ horaInicio: "08:00", horaFin: "09:00" }), sesion({ id: "s2" })]
    expect(haySuperposicion(sesiones, nueva("10:30", "11:15"))).toBe(true)
  })
})
