import { readFileSync } from "node:fs"
import { join } from "node:path"
import { crearAppDePrueba, HUERTA_VIVA, sesionDePrueba, VALENTINA } from "./helpers"

// revision_de_codigo dura 30 minutos: esta reserva ocupa de 19:00 a 19:30.
const nueva = {
  mentoraId: VALENTINA,
  tipoAsesoriaId: "revision_de_codigo",
  colectivoId: HUERTA_VIVA,
  proyecto: "Revisar el formulario de inscripción",
  contactoNombre: "Ana",
  contactoEmail: "ana@example.org",
  fecha: "2026-10-19",
  horaInicio: "19:00",
}

describe("API · POST /api/sesiones · superposición", () => {
  it("409 si el horario se superpone con otra sesión confirmada, aunque empiecen a distinta hora", async () => {
    const { api, dataDir } = crearAppDePrueba([sesionDePrueba({ horaInicio: "18:45", horaFin: "19:15" })])
    const res = await api.post("/api/sesiones").send(nueva)
    expect(res.status).toBe(409)
    expect(res.body).toEqual({ error: "El horario se superpone con otra sesión de la mentora" })
    const guardadas = JSON.parse(readFileSync(join(dataDir, "sesiones.json"), "utf-8"))
    expect(guardadas).toHaveLength(1)
  })

  it("201 si la sesión empieza justo cuando termina la otra", async () => {
    const { api } = crearAppDePrueba([sesionDePrueba({ horaInicio: "18:30", horaFin: "19:00" })])
    const res = await api.post("/api/sesiones").send(nueva)
    expect(res.status).toBe(201)
  })

  it("201 si la sesión que se superpone está cancelada", async () => {
    const { api } = crearAppDePrueba([sesionDePrueba({ horaInicio: "18:45", horaFin: "19:15", estado: "cancelada" })])
    const res = await api.post("/api/sesiones").send(nueva)
    expect(res.status).toBe(201)
  })
})
