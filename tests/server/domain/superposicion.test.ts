import type { Sesion } from "@shared/types"
import { haySuperposicion } from "../../../server/domain/superposicion"

const sesion = (mentoraId: string, fecha: string, horaInicio: string, horaFin: string, extra: Partial<Sesion> = {}): Sesion => ({
  id: "s",
  mentoraId,
  tipoAsesoriaId: "t",
  colectivoId: "c",
  proyecto: "p",
  contactoNombre: "n",
  contactoEmail: "e@example.org",
  fecha,
  horaInicio,
  horaFin,
  estado: "confirmada",
  ...extra,
})

describe("domain/superposicion · haySuperposicion", () => {
  it("devuelve true cuando hay superposición parcial (sesión nueva empieza antes de que termine la existente)", () => {
    const sesiones: Sesion[] = [sesion("m1", "2026-10-19", "10:00", "11:00")]
    const resultado = haySuperposicion(sesiones, {
      mentoraId: "m1",
      fecha: "2026-10-19",
      horaInicio: "10:30",
      horaFin: "11:15",
    })
    expect(resultado).toBe(true)
  })

  it("devuelve true cuando la sesión nueva contiene a la existente", () => {
    const sesiones: Sesion[] = [sesion("m1", "2026-10-19", "10:30", "11:00")]
    const resultado = haySuperposicion(sesiones, {
      mentoraId: "m1",
      fecha: "2026-10-19",
      horaInicio: "10:00",
      horaFin: "11:30",
    })
    expect(resultado).toBe(true)
  })

  it("devuelve true cuando la sesión nueva empieza y termina exactamente igual a la existente", () => {
    const sesiones: Sesion[] = [sesion("m1", "2026-10-19", "10:00", "11:00")]
    const resultado = haySuperposicion(sesiones, {
      mentoraId: "m1",
      fecha: "2026-10-19",
      horaInicio: "10:00",
      horaFin: "11:00",
    })
    expect(resultado).toBe(true)
  })

  it("devuelve false cuando la sesión nueva empieza justo cuando termina la existente (sin superposición)", () => {
    const sesiones: Sesion[] = [sesion("m1", "2026-10-19", "10:00", "10:30")]
    const resultado = haySuperposicion(sesiones, {
      mentoraId: "m1",
      fecha: "2026-10-19",
      horaInicio: "10:30",
      horaFin: "11:00",
    })
    expect(resultado).toBe(false)
  })

  it("devuelve false cuando la sesión nueva termina justo cuando empieza la existente (sin superposición)", () => {
    const sesiones: Sesion[] = [sesion("m1", "2026-10-19", "10:00", "10:30")]
    const resultado = haySuperposicion(sesiones, {
      mentoraId: "m1",
      fecha: "2026-10-19",
      horaInicio: "09:30",
      horaFin: "10:00",
    })
    expect(resultado).toBe(false)
  })

  it("devuelve false cuando hay sesión confirmada de otra mentora", () => {
    const sesiones: Sesion[] = [sesion("mentora-otra", "2026-10-19", "10:00", "11:00")]
    const resultado = haySuperposicion(sesiones, {
      mentoraId: "m1",
      fecha: "2026-10-19",
      horaInicio: "10:30",
      horaFin: "11:15",
    })
    expect(resultado).toBe(false)
  })

  it("devuelve false cuando hay sesión confirmada de otro día", () => {
    const sesiones: Sesion[] = [sesion("m1", "2026-10-18", "10:00", "11:00")]
    const resultado = haySuperposicion(sesiones, {
      mentoraId: "m1",
      fecha: "2026-10-19",
      horaInicio: "10:30",
      horaFin: "11:15",
    })
    expect(resultado).toBe(false)
  })

  it("devuelve false cuando la sesión existente está cancelada", () => {
    const sesiones: Sesion[] = [sesion("m1", "2026-10-19", "10:00", "11:00", { estado: "cancelada" })]
    const resultado = haySuperposicion(sesiones, {
      mentoraId: "m1",
      fecha: "2026-10-19",
      horaInicio: "10:30",
      horaFin: "11:15",
    })
    expect(resultado).toBe(false)
  })

  it("devuelve false con lista vacía", () => {
    const resultado = haySuperposicion([], {
      mentoraId: "m1",
      fecha: "2026-10-19",
      horaInicio: "10:00",
      horaFin: "11:00",
    })
    expect(resultado).toBe(false)
  })

  it("devuelve false cuando la sesión nueva está completamente al final de la existente", () => {
    const sesiones: Sesion[] = [sesion("m1", "2026-10-19", "10:00", "10:30")]
    const resultado = haySuperposicion(sesiones, {
      mentoraId: "m1",
      fecha: "2026-10-19",
      horaInicio: "11:00",
      horaFin: "12:00",
    })
    expect(resultado).toBe(false)
  })
})