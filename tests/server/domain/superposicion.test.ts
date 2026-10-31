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

const nueva = (extra: Partial<{ mentoraId: string; fecha: string; horaInicio: string; horaFin: string }> = {}) => ({
  mentoraId: MENTORA,
  fecha: FECHA,
  horaInicio: "10:30",
  horaFin: "11:15",
  ...extra,
})

describe("haySuperposicion", () => {
  it("detecta una superposición parcial (10:00-11:00 vs 10:30-11:15)", () => {
    expect(haySuperposicion([sesion()], nueva())).toBe(true)
  })

  it("detecta una superposición parcial por el inicio (10:00-11:00 vs 09:30-10:30)", () => {
    expect(haySuperposicion([sesion()], nueva({ horaInicio: "09:30", horaFin: "10:30" }))).toBe(true)
  })

  it("detecta que el rango nuevo contiene a la sesión existente", () => {
    expect(haySuperposicion([sesion()], nueva({ horaInicio: "09:00", horaFin: "12:00" }))).toBe(true)
  })

  it("detecta que el rango nuevo está contenido en la sesión existente", () => {
    expect(haySuperposicion([sesion()], nueva({ horaInicio: "10:15", horaFin: "10:45" }))).toBe(true)
  })

  it("detecta el mismo horario exacto", () => {
    expect(haySuperposicion([sesion()], nueva({ horaInicio: "10:00", horaFin: "11:00" }))).toBe(true)
  })

  it("no hay superposición si una termina cuando la otra empieza (11:00 / 11:00)", () => {
    expect(haySuperposicion([sesion()], nueva({ horaInicio: "11:00", horaFin: "11:30" }))).toBe(false)
  })

  it("no hay superposición si la nueva termina cuando la existente empieza (09:30 / 10:00)", () => {
    expect(haySuperposicion([sesion()], nueva({ horaInicio: "09:30", horaFin: "10:00" }))).toBe(false)
  })

  it("ignora las sesiones canceladas", () => {
    expect(haySuperposicion([sesion({ estado: "cancelada" })], nueva())).toBe(false)
  })

  it("ignora las sesiones de otra mentora", () => {
    expect(haySuperposicion([sesion({ mentoraId: "mentora-2" })], nueva())).toBe(false)
  })

  it("ignora las sesiones de otra fecha", () => {
    expect(haySuperposicion([sesion({ fecha: "2026-10-20" })], nueva())).toBe(false)
  })

  it("es false sin sesiones", () => {
    expect(haySuperposicion([], nueva())).toBe(false)
  })

  it("alcanza con que una de varias sesiones se superponga", () => {
    const sesiones = [sesion({ id: "a", horaInicio: "08:00", horaFin: "09:00" }), sesion({ id: "b" })]
    expect(haySuperposicion(sesiones, nueva())).toBe(true)
  })
})
