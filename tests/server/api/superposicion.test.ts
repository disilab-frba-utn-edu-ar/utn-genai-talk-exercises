import { crearAppDePrueba, HUERTA_VIVA, sesionDePrueba, VALENTINA } from "./helpers"

const LUNES = "2026-10-19"

const nueva = (extra: Record<string, unknown> = {}) => ({
  mentoraId: VALENTINA,
  tipoAsesoriaId: "revision_de_codigo", // dura 30 minutos
  colectivoId: HUERTA_VIVA,
  proyecto: "Revisar el formulario de inscripción",
  contactoNombre: "Ana",
  contactoEmail: "ana@example.org",
  fecha: LUNES,
  horaInicio: "19:00",
  ...extra,
})

describe("API · POST /api/sesiones · superposición de horarios", () => {
  it("409 si el horario se superpone con una sesión confirmada que empieza antes", async () => {
    // Existente 18:30–19:30; la nueva es 19:00–19:30 (distinta hora de inicio).
    const { api } = crearAppDePrueba([sesionDePrueba({ horaInicio: "18:30", horaFin: "19:30" })])
    const res = await api.post("/api/sesiones").send(nueva())
    expect(res.status).toBe(409)
    expect(res.body).toEqual({ error: "El horario se superpone con otra sesión de la mentora" })
  })

  it("409 si la nueva empieza dentro de una sesión más larga", async () => {
    // Existente 19:00–20:00; la nueva es 19:30–20:00.
    const { api } = crearAppDePrueba([sesionDePrueba({ horaInicio: "19:00", horaFin: "20:00" })])
    const res = await api.post("/api/sesiones").send(nueva({ horaInicio: "19:30" }))
    expect(res.status).toBe(409)
    expect(res.body).toEqual({ error: "El horario se superpone con otra sesión de la mentora" })
  })

  it("201 si la nueva empieza justo cuando termina la existente", async () => {
    const { api } = crearAppDePrueba([sesionDePrueba({ horaInicio: "18:30", horaFin: "19:00" })])
    const res = await api.post("/api/sesiones").send(nueva())
    expect(res.status).toBe(201)
  })

  it("201 si la sesión que se superpone está cancelada", async () => {
    const { api } = crearAppDePrueba([sesionDePrueba({ horaInicio: "18:30", horaFin: "19:30", estado: "cancelada" })])
    const res = await api.post("/api/sesiones").send(nueva())
    expect(res.status).toBe(201)
  })
})
