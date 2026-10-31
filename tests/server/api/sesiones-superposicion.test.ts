import { crearAppDePrueba, HUERTA_VIVA, sesionDePrueba, VALENTINA } from "./helpers"

const nueva = (extra: Record<string, unknown> = {}) => ({
  mentoraId: VALENTINA,
  tipoAsesoriaId: "revision_de_codigo",
  colectivoId: HUERTA_VIVA,
  proyecto: "Revisar el formulario de inscripción",
  contactoNombre: "Ana",
  contactoEmail: "ana@example.org",
  fecha: "2026-10-19",
  horaInicio: "19:00",
  ...extra,
})

describe("API · POST /api/sesiones · superposición", () => {
  it("409 si la nueva sesión se superpone parcialmente con una confirmada que empieza a otra hora", async () => {
    // Existente 18:30–19:30; la nueva (19:00–19:30) se superpone sin empezar a la misma hora.
    const { api } = crearAppDePrueba([sesionDePrueba({ horaInicio: "18:30", horaFin: "19:30" })])
    const res = await api.post("/api/sesiones").send(nueva())
    expect(res.status).toBe(409)
    expect(res.body).toEqual({ error: "El horario se superpone con otra sesión de la mentora" })
  })

  it("201 si la existente termina justo cuando empieza la nueva", async () => {
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
