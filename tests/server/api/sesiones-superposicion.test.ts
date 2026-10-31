import { crearAppDePrueba, sesionDePrueba, VALENTINA } from "./helpers"

const LUNES = "2026-10-19"

const datosNueva = (extra: Record<string, unknown> = {}) => ({
  mentoraId: VALENTINA,
  tipoAsesoriaId: "revision_de_codigo",
  colectivoId: "c0e1a2b3-0000-4000-8000-000000000001",
  proyecto: "Revisar el formulario de inscripción",
  contactoNombre: "Ana",
  contactoEmail: "ana@example.org",
  fecha: LUNES,
  horaInicio: "19:00",
  ...extra,
})

describe("API · POST /api/sesiones · superposición de horarios", () => {
  it("409 por superposición real con una sesión confirmada de la misma mentora", async () => {
    const { api } = crearAppDePrueba([sesionDePrueba({ horaInicio: "18:00", horaFin: "19:00" })])
    const res = await api.post("/api/sesiones").send(datosNueva({ horaInicio: "18:30", horaFin: "19:30" }))
    expect(res.status).toBe(409)
    expect(res.body).toEqual({ error: "El horario se superpone con otra sesión de la mentora" })
  })

  it("409 por superposición cuando la sesión confirmada cubre todo el nuevo rango", async () => {
    const { api } = crearAppDePrueba([sesionDePrueba({ horaInicio: "18:00", horaFin: "20:00" })])
    const res = await api.post("/api/sesiones").send(datosNueva({ horaInicio: "18:30", horaFin: "19:30" }))
    expect(res.status).toBe(409)
    expect(res.body).toEqual({ error: "El horario se superpone con otra sesión de la mentora" })
  })

  it("409 por sesión que empieza antes y termina después de la nueva", async () => {
    const { api } = crearAppDePrueba([sesionDePrueba({ horaInicio: "19:00", horaFin: "20:00" })])
    const res = await api.post("/api/sesiones").send(datosNueva({ horaInicio: "19:30", horaFin: "19:45" }))
    expect(res.status).toBe(409)
    expect(res.body).toEqual({ error: "El horario se superpone con otra sesión de la mentora" })
  })

  it("no devuelve 409 cuando la sesión termina 19:00 y la nueva empieza 19:00", async () => {
    const { api } = crearAppDePrueba([sesionDePrueba({ horaInicio: "18:00", horaFin: "19:00" })])
    const res = await api.post("/api/sesiones").send(datosNueva({ horaInicio: "19:00" }))
    expect(res.status).not.toBe(409)
    expect(res.status).toBe(201)
  })

  it("no devuelve 409 cuando la sesión empieza 19:30 y la nueva termina 19:30", async () => {
    const { api } = crearAppDePrueba([sesionDePrueba({ horaInicio: "19:30", horaFin: "20:30" })])
    const res = await api.post("/api/sesiones").send(datosNueva({ horaInicio: "19:00" }))
    expect(res.status).not.toBe(409)
    expect(res.status).toBe(201)
  })
})
