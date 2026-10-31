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
  it("409 si la nueva sesión se superpone con una confirmada que empezó antes", async () => {
    // Existente 19:00-20:00; la nueva (30 min) arranca 19:30, no a la misma hora.
    const { api } = crearAppDePrueba([sesionDePrueba({ horaInicio: "19:00", horaFin: "20:00" })])
    const res = await api.post("/api/sesiones").send(nueva({ horaInicio: "19:30" }))
    expect(res.status).toBe(409)
    expect(res.body).toEqual({ error: "El horario se superpone con otra sesión de la mentora" })
  })

  it("409 si la nueva sesión empieza antes y termina dentro de una confirmada", async () => {
    const { api } = crearAppDePrueba([sesionDePrueba({ horaInicio: "19:30", horaFin: "20:30" })])
    const res = await api.post("/api/sesiones").send(nueva({ horaInicio: "19:00", tipoAsesoriaId: "estrategia_de_testing" }))
    expect(res.status).toBe(409)
    expect(res.body).toEqual({ error: "El horario se superpone con otra sesión de la mentora" })
  })

  it("201 si la nueva sesión empieza justo cuando termina la confirmada", async () => {
    const { api } = crearAppDePrueba([sesionDePrueba({ horaInicio: "18:30", horaFin: "19:00" })])
    const res = await api.post("/api/sesiones").send(nueva({ horaInicio: "19:00" }))
    expect(res.status).toBe(201)
  })

  it("201 si la sesión superpuesta está cancelada", async () => {
    const { api } = crearAppDePrueba([sesionDePrueba({ horaInicio: "19:00", horaFin: "20:00", estado: "cancelada" })])
    const res = await api.post("/api/sesiones").send(nueva({ horaInicio: "19:30" }))
    expect(res.status).toBe(201)
  })
})
