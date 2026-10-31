import type { Sesion } from "@shared/types"
import { haySuperposicion } from "../../../server/domain/superposicion"

const LUNES = "2026-10-19"
const MARTES = "2026-10-20"

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

const rango = (horaInicio: string, horaFin: string) => ({ mentoraId: "m1", fecha: LUNES, horaInicio, horaFin })

describe("domain/superposicion · haySuperposicion", () => {
  const existentes = [sesion("10:00", "11:00")]

  it("detecta una sesión que empieza durante otra", () => {
    expect(haySuperposicion(existentes, rango("10:30", "11:15"))).toBe(true)
  })

  it("detecta una sesión que termina durante otra", () => {
    expect(haySuperposicion(existentes, rango("09:30", "10:15"))).toBe(true)
  })

  it("detecta una sesión contenida en otra, que la contiene o con el mismo rango", () => {
    expect(haySuperposicion(existentes, rango("10:15", "10:45"))).toBe(true)
    expect(haySuperposicion(existentes, rango("09:00", "12:00"))).toBe(true)
    expect(haySuperposicion(existentes, rango("10:00", "11:00"))).toBe(true)
  })

  it("no considera superpuestas a sesiones que solo se tocan en un borde", () => {
    expect(haySuperposicion(existentes, rango("11:00", "11:30"))).toBe(false)
    expect(haySuperposicion(existentes, rango("09:30", "10:00"))).toBe(false)
  })

  it("no hay superposición si no hay sesiones o si son en otro horario", () => {
    expect(haySuperposicion([], rango("10:00", "11:00"))).toBe(false)
    expect(haySuperposicion(existentes, rango("14:00", "15:00"))).toBe(false)
  })

  it("ignora sesiones canceladas, de otra mentora o de otra fecha", () => {
    const sesiones = [
      sesion("10:00", "11:00", { estado: "cancelada" }),
      sesion("10:00", "11:00", { mentoraId: "m2" }),
      sesion("10:00", "11:00", { fecha: MARTES }),
    ]
    expect(haySuperposicion(sesiones, rango("10:30", "11:15"))).toBe(false)
  })
})
