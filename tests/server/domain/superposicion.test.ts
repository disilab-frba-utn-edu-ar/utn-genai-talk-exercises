import type { Sesion } from "@shared/types"
import { haySuperposicion } from "../../../server/domain/superposicion"

/**
 * Test de la función del dominio que reemplazará la comprobación de superposición
 * del servicio de sesiones.
 *
 * Serie de pruebas de la función `haySuperposicion`:
 * - solo sesiones confirmadas de la misma mentora y fecha cuentan
 * - sesiones con distinto estado (cancelada) no cuentan
 * - sesiones de otra mentora o otro día no cuentan
 * - sesión que termina 10:30 y otra que empieza 10:30 no se superponen
 * - solapamiento real de 5 minutos sí se superpone
 * - sesión totalmente contenida dentro de otra sí se superpone
 * - sesión adyacente al final (fin == otro inicio) no se superpone
 */
describe("domain/superposicion", () => {
  const sesionDe = (extra: Partial<Sesion>): Sesion => ({
    id: "s",
    mentoraId: "m1",
    tipoAsesoriaId: "t",
    colectivoId: "c",
    proyecto: "p",
    contactoNombre: "n",
    contactoEmail: "e@example.org",
    fecha: "2026-10-19",
    horaInicio: "09:00",
    horaFin: "10:00",
    estado: "confirmada",
    ...extra,
  })

  it("devuelve true cuando hay una sesión confirmada de la misma mentora y mismo día que se superpone", () => {
    const sesiones = [
      sesionDe({ id: "a", horaInicio: "08:00", horaFin: "09:00" }),
      sesionDe({ id: "b", horaInicio: "08:30", horaFin: "09:30" }),
    ]
    expect(haySuperposicion(sesiones, { mentoraId: "m1", fecha: "2026-10-19", horaInicio: "08:30", horaFin: "09:30" })).toBe(true)
  })

  it("devuelve false cuando hay una sesión cancelada de la misma mentora y mismo día", () => {
    const sesiones = [sesionDe({ id: "a", estado: "cancelada", horaInicio: "08:30", horaFin: "09:30" })]
    expect(haySuperposicion(sesiones, { mentoraId: "m1", fecha: "2026-10-19", horaInicio: "08:00", horaFin: "09:00" })).toBe(false)
  })

  it("devuelve false cuando hay una sesión de la misma mentora pero de otro día", () => {
    const sesiones = [sesionDe({ id: "a", fecha: "2026-10-20", horaInicio: "08:30", horaFin: "09:30" })]
    expect(haySuperposicion(sesiones, { mentoraId: "m1", fecha: "2026-10-19", horaInicio: "08:00", horaFin: "09:00" })).toBe(false)
  })

  it("devuelve false cuando hay una sesión de otra mentora en el mismo día", () => {
    const sesiones = [sesionDe({ id: "a", mentoraId: "m2", horaInicio: "08:30", horaFin: "09:30" })]
    expect(haySuperposicion(sesiones, { mentoraId: "m1", fecha: "2026-10-19", horaInicio: "08:00", horaFin: "09:00" })).toBe(false)
  })

  it("devuelve false cuando una sesión termina a las 10:30 y la nueva empieza a las 10:30", () => {
    const sesiones = [sesionDe({ id: "a", horaInicio: "09:00", horaFin: "10:30" })]
    expect(haySuperposicion(sesiones, { mentoraId: "m1", fecha: "2026-10-19", horaInicio: "10:30", horaFin: "11:00" })).toBe(false)
  })

  it("devuelve false cuando una sesión empieza a las 10:30 y la nueva termina a las 10:30", () => {
    const sesiones = [sesionDe({ id: "a", horaInicio: "09:00", horaFin: "10:00" })]
    expect(haySuperposicion(sesiones, { mentoraId: "m1", fecha: "2026-10-19", horaInicio: "10:00", horaFin: "10:30" })).toBe(false)
  })

  it("devuelve true cuando la nueva sesión se superpone por 5 minutos con una confirmada", () => {
    const sesiones = [sesionDe({ id: "a", horaInicio: "10:00", horaFin: "11:00" })]
    expect(haySuperposicion(sesiones, { mentoraId: "m1", fecha: "2026-10-19", horaInicio: "10:55", horaFin: "11:30" })).toBe(true)
  })

  it("devuelve true cuando una sesión confirmada está totalmente contenida en la nueva", () => {
    const sesiones = [sesionDe({ id: "a", horaInicio: "10:30", horaFin: "11:00" })]
    expect(haySuperposicion(sesiones, { mentoraId: "m1", fecha: "2026-10-19", horaInicio: "10:00", horaFin: "11:30" })).toBe(true)
  })

  it("devuelve false cuando la nueva sesión está totalmente fuera de los límites de la confirmada", () => {
    const sesiones = [sesionDe({ id: "a", horaInicio: "10:00", horaFin: "11:00" })]
    expect(haySuperposicion(sesiones, { mentoraId: "m1", fecha: "2026-10-19", horaInicio: "09:00", horaFin: "09:30" })).toBe(false)
  })
})
