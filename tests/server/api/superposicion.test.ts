import { readFileSync } from "node:fs"
import { join } from "node:path"
import { crearAppDePrueba, HUERTA_VIVA, sesionDePrueba, VALENTINA } from "./helpers"

describe("API · POST /api/sesiones · superposición", () => {
  const nueva = (horaInicio: string) => ({
    mentoraId: VALENTINA,
    tipoAsesoriaId: "revision_de_codigo",
    colectivoId: HUERTA_VIVA,
    proyecto: "Revisar el formulario de inscripción",
    contactoNombre: "Ana",
    contactoEmail: "ana@example.org",
    fecha: "2026-10-19",
    horaInicio,
  })

  it("409 si empieza a distinta hora pero se superpone; no guarda la reserva", async () => {
    const existente = sesionDePrueba({ horaInicio: "18:00", horaFin: "19:00" })
    const { api, dataDir } = crearAppDePrueba([existente])
    const res = await api.post("/api/sesiones").send(nueva("18:30"))

    expect(res.status).toBe(409)
    expect(res.body).toEqual({ error: "El horario se superpone con otra sesión de la mentora" })
    expect(JSON.parse(readFileSync(join(dataDir, "sesiones.json"), "utf-8"))).toEqual([existente])
  })

  it.each(["18:00", "19:00"])("201 si el horario %s es contiguo a otra sesión", async (horaInicio) => {
    const { api } = crearAppDePrueba([sesionDePrueba({ horaInicio: "18:30", horaFin: "19:00" })])
    const res = await api.post("/api/sesiones").send(nueva(horaInicio))
    expect(res.status).toBe(201)
  })
})
