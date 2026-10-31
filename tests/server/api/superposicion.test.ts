import { readFileSync } from "node:fs"
import { join } from "node:path"
import { crearAppDePrueba, sesionDePrueba } from "./helpers"

it("POST /api/sesiones rechaza un solapamiento parcial con 409 y no guarda la reserva", async () => {
  const existente = sesionDePrueba({ horaInicio: "18:00", horaFin: "19:00" })
  const { api, dataDir } = crearAppDePrueba([existente])
  const res = await api.post("/api/sesiones").send({
    mentoraId: existente.mentoraId, colectivoId: existente.colectivoId,
    tipoAsesoriaId: "estrategia_de_testing", fecha: existente.fecha,
    horaInicio: "18:30", proyecto: existente.proyecto,
    contactoNombre: existente.contactoNombre, contactoEmail: existente.contactoEmail,
  })
  expect(res.status).toBe(409)
  expect(res.body).toEqual({ error: "El horario se superpone con otra sesión de la mentora" })
  expect(JSON.parse(readFileSync(join(dataDir, "sesiones.json"), "utf-8"))).toEqual([existente])
})
