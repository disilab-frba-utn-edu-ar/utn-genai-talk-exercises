import { readFileSync } from "node:fs"
import { join } from "node:path"
import { crearAppDePrueba, sesionDePrueba } from "./helpers"

describe("POST /api/sesiones · superposición", () => {
  it("rechaza con 409 una superposición parcial sin guardar otra sesión", async () => {
    const existente = sesionDePrueba({ horaInicio: "18:00", horaFin: "19:00" })
    const { api, dataDir } = crearAppDePrueba([existente])
    const res = await api.post("/api/sesiones").send({ ...existente, horaInicio: "18:30" })
    expect(res.status).toBe(409)
    expect(res.body).toEqual({ error: "El horario se superpone con otra sesión de la mentora" })
    expect(JSON.parse(readFileSync(join(dataDir, "sesiones.json"), "utf-8"))).toEqual([existente])
  })

  it("permite reservar justo cuando termina otra sesión", async () => {
    const existente = sesionDePrueba({ horaInicio: "18:00", horaFin: "19:00" })
    const { api } = crearAppDePrueba([existente])
    const res = await api.post("/api/sesiones").send({ ...existente, horaInicio: "19:00" })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ horaInicio: "19:00", horaFin: "19:30" })
  })
})
