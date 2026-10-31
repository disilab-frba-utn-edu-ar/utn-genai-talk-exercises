import { readFileSync } from "node:fs"
import { join } from "node:path"
import { crearAppDePrueba, HUERTA_VIVA, sesionDePrueba, VALENTINA } from "./helpers"

describe("API · superposición al crear sesiones", () => {
  it("rechaza con 409 una superposición parcial sin guardar la reserva", async () => {
    const { api, dataDir } = crearAppDePrueba([sesionDePrueba({ horaInicio: "18:00", horaFin: "19:00" })])
    const res = await api.post("/api/sesiones").send({
      mentoraId: VALENTINA, tipoAsesoriaId: "revision_de_codigo", colectivoId: HUERTA_VIVA,
      proyecto: "Revisar el formulario de inscripción", contactoNombre: "Ana",
      contactoEmail: "ana@example.org", fecha: "2026-10-19", horaInicio: "18:30",
    })
    expect(res.status).toBe(409)
    expect(res.body).toEqual({ error: "El horario se superpone con otra sesión de la mentora" })
    expect(JSON.parse(readFileSync(join(dataDir, "sesiones.json"), "utf-8"))).toHaveLength(1)
  })
})
