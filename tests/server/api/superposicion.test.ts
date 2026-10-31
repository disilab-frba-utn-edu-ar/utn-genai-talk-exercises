import { readFileSync } from "node:fs"
import { join } from "node:path"
import { crearAppDePrueba, HUERTA_VIVA, sesionDePrueba, VALENTINA } from "./helpers"

const MENSAJE = { error: "El horario se superpone con otra sesión de la mentora" }

// estrategia_de_testing dura 45 minutos; Valentina atiende los lunes de 18 a 21.
const nueva = (extra: Record<string, unknown> = {}) => ({
  mentoraId: VALENTINA,
  tipoAsesoriaId: "estrategia_de_testing",
  colectivoId: HUERTA_VIVA,
  proyecto: "Armar la estrategia de tests del sitio",
  contactoNombre: "Ana",
  contactoEmail: "ana@example.org",
  fecha: "2026-10-19",
  horaInicio: "19:30",
  ...extra,
})

describe("API · POST /api/sesiones · superposición", () => {
  it("409 si la sesión nueva empieza durante una confirmada, y no la guarda", async () => {
    const { api, dataDir } = crearAppDePrueba([sesionDePrueba({ horaInicio: "19:00", horaFin: "20:00" })])
    const res = await api.post("/api/sesiones").send(nueva())
    expect(res.status).toBe(409)
    expect(res.body).toEqual(MENSAJE)
    const guardadas = JSON.parse(readFileSync(join(dataDir, "sesiones.json"), "utf-8"))
    expect(guardadas).toHaveLength(1)
  })

  it("409 si la sesión nueva termina durante una confirmada", async () => {
    const { api } = crearAppDePrueba([sesionDePrueba({ horaInicio: "19:30", horaFin: "20:30" })])
    const res = await api.post("/api/sesiones").send(nueva({ horaInicio: "19:00" }))
    expect(res.status).toBe(409)
    expect(res.body).toEqual(MENSAJE)
  })

  it("201 si la sesión nueva empieza justo cuando termina la confirmada", async () => {
    const { api } = crearAppDePrueba([sesionDePrueba({ horaInicio: "19:00", horaFin: "19:30" })])
    const res = await api.post("/api/sesiones").send(nueva())
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ horaInicio: "19:30", horaFin: "20:15" })
  })

  it("201 si la sesión que se superpone está cancelada", async () => {
    const { api } = crearAppDePrueba([sesionDePrueba({ horaInicio: "19:00", horaFin: "20:00", estado: "cancelada" })])
    const res = await api.post("/api/sesiones").send(nueva())
    expect(res.status).toBe(201)
  })
})
