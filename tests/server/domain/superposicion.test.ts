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
  const existente = [sesion("10:00", "11:00")]

  it("detecta una sesión que empieza durante otra", () => {
    expect(haySuperposicion(existente, rango("10:30", "11:15"))).toBe(true)
  })

  it("detecta una sesión que termina durante otra", () => {
    expect(haySuperposicion(existente, rango("09:30", "10:30"))).toBe(true)
  })

  it("detecta una sesión que empieza a la misma hora", () => {
    expect(haySuperposicion(existente, rango("10:00", "10:30"))).toBe(true)
  })

  it("detecta una sesión contenida en otra y una que contiene a otra", () => {
    expect(haySuperposicion(existente, rango("10:15", "10:45"))).toBe(true)
    expect(haySuperposicion(existente, rango("09:00", "12:00"))).toBe(true)
  })

  it("no considera superpuestas a dos sesiones contiguas", () => {
    expect(haySuperposicion(existente, rango("11:00", "11:30"))).toBe(false)
    expect(haySuperposicion(existente, rango("09:30", "10:00"))).toBe(false)
  })

  it("no detecta superposición con horarios separados ni sin sesiones", () => {
    expect(haySuperposicion(existente, rango("12:00", "13:00"))).toBe(false)
    expect(haySuperposicion([], rango("10:00", "11:00"))).toBe(false)
  })

  it("ignora sesiones canceladas, de otra mentora y de otra fecha", () => {
    const sesiones = [
      sesion("10:00", "11:00", { estado: "cancelada" }),
      sesion("10:00", "11:00", { mentoraId: "m2" }),
      sesion("10:00", "11:00", { fecha: MARTES }),
    ]
    expect(haySuperposicion(sesiones, rango("10:30", "11:15"))).toBe(false)
  })

  it("encuentra la superposición aunque no sea con la primera sesión", () => {
    const sesiones = [sesion("08:00", "09:00"), sesion("10:00", "11:00")]
    expect(haySuperposicion(sesiones, rango("10:30", "11:15"))).toBe(true)
  })
})
