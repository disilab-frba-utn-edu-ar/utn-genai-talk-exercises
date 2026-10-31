import { crearAppDePrueba, HUERTA_VIVA, sesionDePrueba, VALENTINA } from "./helpers"

const LUNES = "2026-10-19"

const nueva = (extra: Record<string, unknown> = {}) => ({
  mentoraId: VALENTINA,
  tipoAsesoriaId: "revision_de_codigo", // 30 minutos
  colectivoId: HUERTA_VIVA,
  proyecto: "Revisar el formulario de inscripción",
  contactoNombre: "Ana",
  contactoEmail: "ana@example.org",
  fecha: LUNES,
  horaInicio: "19:00",
  ...extra,
})

// Estrategia de testing de 18:30 a 19:15.
const existente = sesionDePrueba({ tipoAsesoriaId: "estrategia_de_testing", horaInicio: "18:30", horaFin: "19:15" })

describe("API · POST /api/sesiones · superposición", () => {
  it("409 si el horario se superpone con otra sesión confirmada de la mentora", async () => {
    const { api } = crearAppDePrueba([existente])
    const res = await api.post("/api/sesiones").send(nueva())
    expect(res.status).toBe(409)
    expect(res.body).toEqual({ error: "El horario se superpone con otra sesión de la mentora" })
  })

  it("201 si la sesión nueva empieza justo cuando termina la otra", async () => {
    const { api } = crearAppDePrueba([sesionDePrueba({ horaInicio: "18:30", horaFin: "19:00" })])
    const res = await api.post("/api/sesiones").send(nueva())
    expect(res.status).toBe(201)
  })

  it("201 si la sesión que se superpone está cancelada", async () => {
    const { api } = crearAppDePrueba([{ ...existente, estado: "cancelada" }])
    const res = await api.post("/api/sesiones").send(nueva())
    expect(res.status).toBe(201)
  })
})
