import { crearAppDePrueba, HUERTA_VIVA, sesionDePrueba, VALENTINA } from "./helpers"

const LUNES = "2026-10-19"

const nueva = (extra: Record<string, unknown> = {}) => ({
  mentoraId: VALENTINA,
  tipoAsesoriaId: "revision_de_codigo",
  colectivoId: HUERTA_VIVA,
  proyecto: "Revisar el formulario de inscripción",
  contactoNombre: "Ana",
  contactoEmail: "ana@example.org",
  fecha: LUNES,
  horaInicio: "19:00",
  ...extra,
})

describe("API · POST /api/sesiones · superposición", () => {
  it("409 si el horario se superpone parcialmente con otra sesión confirmada de la mentora", async () => {
    // Existente 19:00-20:00; la nueva empieza a las 19:30 (distinta hora de inicio).
    const { api } = crearAppDePrueba([sesionDePrueba({ horaInicio: "19:00", horaFin: "20:00" })])
    const res = await api.post("/api/sesiones").send(nueva({ horaInicio: "19:30" }))
    expect(res.status).toBe(409)
    expect(res.body).toEqual({ error: "El horario se superpone con otra sesión de la mentora" })
  })

  it("201 si la nueva empieza justo cuando termina la existente", async () => {
    const { api } = crearAppDePrueba([sesionDePrueba({ horaInicio: "19:00", horaFin: "19:30" })])
    const res = await api.post("/api/sesiones").send(nueva({ horaInicio: "19:30" }))
    expect(res.status).toBe(201)
  })
})
