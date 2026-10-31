import type { Sesion } from "@shared/types"
import { haySuperposicion } from "../../../server/domain/superposicion"

const MENTORA = "mentora-1"
const FECHA = "2026-10-19"

const sesion = (extra: Partial<Sesion> = {}): Sesion => ({
  id: "s1",
  mentoraId: MENTORA,
  tipoAsesoriaId: "revision_de_codigo",
  colectivoId: "c1",
  proyecto: "Revisar el formulario de inscripción",
  contactoNombre: "Ana",
  contactoEmail: "ana@example.org",
  fecha: FECHA,
  horaInicio: "10:00",
  horaFin: "11:00",
  estado: "confirmada",
  ...extra,
})

const pedido = (horaInicio: string, horaFin: string, extra: Partial<{ mentoraId: string; fecha: string }> = {}) => ({
  mentoraId: MENTORA,
  fecha: FECHA,
  horaInicio,
  horaFin,
  ...extra,
})

describe("haySuperposicion", () => {
  it("false si no hay sesiones", () => {
    expect(haySuperposicion([], pedido("10:00", "11:00"))).toBe(false)
  })

  it("true si empieza a la misma hora", () => {
    expect(haySuperposicion([sesion()], pedido("10:00", "10:30"))).toBe(true)
  })

  it("true si empieza durante otra sesión", () => {
    expect(haySuperposicion([sesion()], pedido("10:30", "11:15"))).toBe(true)
  })

  it("true si termina durante otra sesión", () => {
    expect(haySuperposicion([sesion()], pedido("09:30", "10:15"))).toBe(true)
  })

  it("true si contiene a otra sesión o está contenida en ella", () => {
    expect(haySuperposicion([sesion()], pedido("09:00", "12:00"))).toBe(true)
    expect(haySuperposicion([sesion()], pedido("10:15", "10:45"))).toBe(true)
  })

  it("false si una termina justo cuando empieza la otra", () => {
    expect(haySuperposicion([sesion()], pedido("11:00", "11:30"))).toBe(false)
    expect(haySuperposicion([sesion()], pedido("09:30", "10:00"))).toBe(false)
  })

  it("ignora las sesiones canceladas", () => {
    expect(haySuperposicion([sesion({ estado: "cancelada" })], pedido("10:30", "11:15"))).toBe(false)
  })

  it("ignora las sesiones de otra mentora o de otra fecha", () => {
    expect(haySuperposicion([sesion()], pedido("10:30", "11:15", { mentoraId: "otra" }))).toBe(false)
    expect(haySuperposicion([sesion()], pedido("10:30", "11:15", { fecha: "2026-10-20" }))).toBe(false)
  })

  it("detecta la superposición aunque haya otras sesiones que no chocan", () => {
    const sesiones = [sesion({ id: "a", horaInicio: "08:00", horaFin: "09:00" }), sesion({ id: "b" })]
    expect(haySuperposicion(sesiones, pedido("10:45", "11:30"))).toBe(true)
  })
})
