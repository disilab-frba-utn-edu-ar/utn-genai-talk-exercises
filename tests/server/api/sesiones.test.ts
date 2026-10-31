import { readFileSync } from "node:fs"
import { join } from "node:path"
import { crearAppDePrueba, HUERTA_VIVA, ROCIO, sesionDePrueba, VALENTINA } from "./helpers"

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

describe("API · GET /api/mentoras/:id/disponibilidad", () => {
  it("devuelve los días con horarios libres de los próximos 14 días", async () => {
    const { api } = crearAppDePrueba([sesionDePrueba()])
    const res = await api.get(`/api/mentoras/${VALENTINA}/disponibilidad?tipoAsesoriaId=revision_de_codigo`)
    expect(res.status).toBe(200)
    // Valentina atiende lunes y miércoles: 4 días en las próximas dos semanas.
    expect(res.body.map((d: { fecha: string }) => d.fecha)).toEqual(["2026-10-19", "2026-10-21", "2026-10-26", "2026-10-28"])
    expect(res.body[0].horarios[0]).toEqual({ inicio: "18:30", fin: "19:00" })
  })

  it("devuelve una lista vacía si la mentora no tiene disponibilidad", async () => {
    const { api } = crearAppDePrueba()
    const res = await api.get(`/api/mentoras/${ROCIO}/disponibilidad?tipoAsesoriaId=primeros_pasos_git`)
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it("400 si falta el tipo de asesoría o la mentora no lo ofrece; 404 si no existe", async () => {
    const { api } = crearAppDePrueba()
    expect((await api.get(`/api/mentoras/${VALENTINA}/disponibilidad`)).status).toBe(400)
    expect((await api.get(`/api/mentoras/${VALENTINA}/disponibilidad?tipoAsesoriaId=despliegue`)).status).toBe(400)
    expect((await api.get(`/api/mentoras/${VALENTINA}/disponibilidad?tipoAsesoriaId=no_existe`)).status).toBe(404)
  })
})

describe("API · GET /api/sesiones", () => {
  it("lista sesiones filtradas sin datos de contacto (Principio IV)", async () => {
    const { api } = crearAppDePrueba([sesionDePrueba(), sesionDePrueba({ id: "otra", fecha: "2026-10-21" })])
    const res = await api.get(`/api/sesiones?mentoraId=${VALENTINA}&fecha=${LUNES}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0]).not.toHaveProperty("contactoEmail")
    expect(res.body[0]).not.toHaveProperty("contactoNombre")
  })
})

describe("API · POST /api/sesiones", () => {
  it("crea la sesión, calcula la hora de fin y la guarda", async () => {
    const { api, dataDir } = crearAppDePrueba()
    const res = await api.post("/api/sesiones").send(nueva())
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ horaInicio: "19:00", horaFin: "19:30", estado: "confirmada" })
    expect(res.body.id).toMatch(/^[0-9a-f-]{36}$/)
    const guardadas = JSON.parse(readFileSync(join(dataDir, "sesiones.json"), "utf-8"))
    expect(guardadas).toHaveLength(1)
  })

  it("el horario reservado deja de ofrecerse", async () => {
    const { api } = crearAppDePrueba()
    await api.post("/api/sesiones").send(nueva())
    const res = await api.get(`/api/mentoras/${VALENTINA}/disponibilidad?tipoAsesoriaId=revision_de_codigo`)
    const lunes = res.body.find((d: { fecha: string }) => d.fecha === LUNES)
    expect(lunes.horarios.map((h: { inicio: string }) => h.inicio)).not.toContain("19:00")
  })

  it("400 con datos inválidos", async () => {
    const { api } = crearAppDePrueba()
    const res = await api.post("/api/sesiones").send(nueva({ contactoEmail: "no-es-un-email" }))
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: "El email de contacto no es válido" })
  })

  it("400 si el JSON está mal formado", async () => {
    const { api } = crearAppDePrueba()
    const res = await api.post("/api/sesiones").set("Content-Type", "application/json").send("{mal")
    expect(res.status).toBe(400)
  })

  it("400 si la fecha ya pasó o el horario está fuera de la disponibilidad", async () => {
    const { api } = crearAppDePrueba()
    expect((await api.post("/api/sesiones").send(nueva({ fecha: "2026-10-12" }))).status).toBe(400)
    expect((await api.post("/api/sesiones").send(nueva({ horaInicio: "20:45" }))).status).toBe(400)
    expect((await api.post("/api/sesiones").send(nueva({ fecha: "2026-10-20" }))).status).toBe(400)
  })

  it("400 si la mentora no ofrece ese tipo de asesoría", async () => {
    const { api } = crearAppDePrueba()
    const res = await api.post("/api/sesiones").send(nueva({ tipoAsesoriaId: "despliegue" }))
    expect(res.status).toBe(400)
  })

  it("404 si la mentora, el tipo o el colectivo no existen", async () => {
    const { api } = crearAppDePrueba()
    expect((await api.post("/api/sesiones").send(nueva({ mentoraId: "x" }))).status).toBe(404)
    expect((await api.post("/api/sesiones").send(nueva({ tipoAsesoriaId: "x" }))).status).toBe(404)
    expect((await api.post("/api/sesiones").send(nueva({ colectivoId: "x" }))).status).toBe(404)
  })

  it("409 si ya hay una sesión confirmada que empieza a la misma hora", async () => {
    const { api } = crearAppDePrueba([sesionDePrueba({ horaInicio: "19:00", horaFin: "19:30" })])
    const res = await api.post("/api/sesiones").send(nueva())
    expect(res.status).toBe(409)
    expect(res.body).toEqual({ error: "El horario se superpone con otra sesión de la mentora" })
  })

  it("409 si el horario se superpone parcialmente con una sesión confirmada de la mentora", async () => {
    // Revisión de código dura 30 min: 19:30–20:00 pisa a la sesión existente de 19:15–19:45.
    const { api } = crearAppDePrueba([sesionDePrueba({ horaInicio: "19:15", horaFin: "19:45" })])
    const res = await api.post("/api/sesiones").send(nueva({ horaInicio: "19:30" }))
    expect(res.status).toBe(409)
    expect(res.body).toEqual({ error: "El horario se superpone con otra sesión de la mentora" })
  })

  it("201 si la nueva sesión empieza justo cuando termina otra", async () => {
    const { api } = crearAppDePrueba([sesionDePrueba({ horaInicio: "18:30", horaFin: "19:00" })])
    const res = await api.post("/api/sesiones").send(nueva({ horaInicio: "19:00" }))
    expect(res.status).toBe(201)
  })
})
