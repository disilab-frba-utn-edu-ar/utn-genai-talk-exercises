import { crearAppDePrueba, HUERTA_VIVA, sesionDePrueba, VALENTINA } from "./helpers"

const nueva = (extra: Record<string, unknown> = {}) => ({
  mentoraId: VALENTINA,
  tipoAsesoriaId: "revision_de_codigo",
  colectivoId: HUERTA_VIVA,
  proyecto: "Revisar el formulario de inscripción",
  contactoNombre: "Ana",
  contactoEmail: "ana@example.org",
  fecha: "2026-10-19",
  horaInicio: "18:30",
  ...extra,
})

describe("API · POST /api/sesiones · superposición", () => {
  it("409 si la sesión nueva se superpone con una confirmada que empieza antes", async () => {
    // Existente 18:00-19:00; la nueva (revisión de 30 min) empieza 18:30, dentro de la existente.
    const { api } = crearAppDePrueba([sesionDePrueba({ horaInicio: "18:00", horaFin: "19:00" })])
    const res = await api.post("/api/sesiones").send(nueva())
    expect(res.status).toBe(409)
    expect(res.body).toEqual({ error: "El horario se superpone con otra sesión de la mentora" })
  })

  it("201 si la nueva empieza justo cuando termina la existente", async () => {
    const { api } = crearAppDePrueba([sesionDePrueba({ horaInicio: "18:00", horaFin: "18:30" })])
    const res = await api.post("/api/sesiones").send(nueva())
    expect(res.status).toBe(201)
  })
})
