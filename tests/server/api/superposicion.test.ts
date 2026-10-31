import { readFileSync } from "node:fs"
import { join } from "node:path"
import { crearAppDePrueba, HUERTA_VIVA, VALENTINA } from "./helpers"

it("rechaza con 409 una segunda reserva parcialmente superpuesta y no la guarda", async () => {
  const { api, dataDir } = crearAppDePrueba()
  const datos = {
    mentoraId: VALENTINA, tipoAsesoriaId: "revision_de_codigo", colectivoId: HUERTA_VIVA,
    proyecto: "Revisar formulario", contactoNombre: "Ana", contactoEmail: "ana@example.org",
    fecha: "2026-10-19", horaInicio: "19:00",
  }
  expect((await api.post("/api/sesiones").send(datos)).status).toBe(201)
  const respuesta = await api.post("/api/sesiones").send({ ...datos, horaInicio: "19:15" })
  expect(respuesta.status).toBe(409)
  expect(respuesta.body).toEqual({ error: "El horario se superpone con otra sesión de la mentora" })
  expect(JSON.parse(readFileSync(join(dataDir, "sesiones.json"), "utf8"))).toHaveLength(1)
})
