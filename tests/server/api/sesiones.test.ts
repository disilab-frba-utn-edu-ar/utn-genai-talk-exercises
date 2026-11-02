import { readFileSync } from "node:fs"
import { join } from "node:path"
import { AHORA_AR, crearAppDePrueba, HUERTA_VIVA, ROCIO, sesionDePrueba, VALENTINA } from "./helpers"

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

  it("no expone el id (es la credencial del enlace) ni los datos de cancelación", async () => {
    const { api } = crearAppDePrueba([
      sesionDePrueba(),
      sesionDePrueba({
        id: "00000000-0000-4000-8000-000000000002",
        horaInicio: "19:00",
        horaFin: "19:30",
        estado: "cancelada",
        motivoCancelacion: "Se suspendió",
        canceladaEn: "2026-10-17T15:00:00.000Z",
      }),
    ])
    const res = await api.get(`/api/sesiones?mentoraId=${VALENTINA}&fecha=${LUNES}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    for (const sesion of res.body) {
      expect(sesion).not.toHaveProperty("id")
      expect(sesion).not.toHaveProperty("motivoCancelacion")
      expect(sesion).not.toHaveProperty("canceladaEn")
    }
    expect(JSON.stringify(res.body)).not.toContain("Se suspendió")
  })
})

describe("API · GET /api/sesiones/:id", () => {
  it("devuelve el detalle de la sesión", async () => {
    const sesion = sesionDePrueba()
    const { api } = crearAppDePrueba([sesion, sesionDePrueba({ id: "otra" })], { reloj: () => AHORA_AR })
    const res = await api.get(`/api/sesiones/${sesion.id}`)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      id: sesion.id,
      mentoraId: VALENTINA,
      tipoAsesoriaId: "revision_de_codigo",
      colectivoId: HUERTA_VIVA,
      proyecto: "Revisar el formulario de inscripción",
      fecha: LUNES,
      horaInicio: "18:00",
      horaFin: "18:30",
      estado: "confirmada",
      cancelacion: { permitida: true },
    })
  })

  it("una sesión cancelada incluye el motivo, el momento de cancelación y por qué no se puede cancelar", async () => {
    const sesion = sesionDePrueba({ estado: "cancelada", motivoCancelacion: "Se suspendió", canceladaEn: "2026-10-17T15:00:00.000Z" })
    const { api } = crearAppDePrueba([sesion], { reloj: () => AHORA_AR })
    const res = await api.get(`/api/sesiones/${sesion.id}`)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      estado: "cancelada",
      motivoCancelacion: "Se suspendió",
      canceladaEn: "2026-10-17T15:00:00.000Z",
      cancelacion: { permitida: false, razon: "ya_cancelada", mensaje: "La sesión ya estaba cancelada" },
    })
  })

  it("no incluye los datos de contacto del colectivo (Principio IV)", async () => {
    const sesion = sesionDePrueba()
    const { api } = crearAppDePrueba([sesion])
    const res = await api.get(`/api/sesiones/${sesion.id}`)
    expect(res.body).not.toHaveProperty("contactoNombre")
    expect(res.body).not.toHaveProperty("contactoEmail")
    expect(JSON.stringify(res.body)).not.toContain("ana@example.org")
  })

  it("404 si la sesión no existe o el id está mal formado", async () => {
    const { api } = crearAppDePrueba([sesionDePrueba()])
    for (const id of ["00000000-0000-4000-8000-000000000099", "no-es-un-uuid"]) {
      const res = await api.get(`/api/sesiones/${id}`)
      expect(res.status).toBe(404)
      expect(res.body).toEqual({ error: "La sesión no existe" })
    }
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

  it("409 si el horario se superpone con una sesión confirmada que empieza a otra hora", async () => {
    const { api, dataDir } = crearAppDePrueba([sesionDePrueba({ horaInicio: "18:30", horaFin: "19:15" })])
    const res = await api.post("/api/sesiones").send(nueva())
    expect(res.status).toBe(409)
    expect(res.body).toEqual({ error: "El horario se superpone con otra sesión de la mentora" })
    const guardadas = JSON.parse(readFileSync(join(dataDir, "sesiones.json"), "utf-8"))
    expect(guardadas).toHaveLength(1)
  })

  it("permite reservar justo cuando termina otra sesión o sobre una cancelada", async () => {
    const { api } = crearAppDePrueba([
      sesionDePrueba({ horaInicio: "18:30", horaFin: "19:00" }),
      sesionDePrueba({ id: "cancelada", horaInicio: "19:00", horaFin: "19:30", estado: "cancelada" }),
    ])
    const res = await api.post("/api/sesiones").send(nueva())
    expect(res.status).toBe(201)
  })
})

describe("API · PATCH /api/sesiones/:id", () => {
  const MIERCOLES = "2026-10-21"
  // Miércoles 18:00 en Argentina: 78 h después de AHORA_AR.
  const aCancelar = () => sesionDePrueba({ fecha: MIERCOLES, horaInicio: "18:00", horaFin: "18:30" })
  const conSesion = () => crearAppDePrueba([aCancelar()], { reloj: () => AHORA_AR })
  const leerGuardadas = (dataDir: string) => JSON.parse(readFileSync(join(dataDir, "sesiones.json"), "utf-8"))
  const horariosDelMiercoles = async (api: ReturnType<typeof crearAppDePrueba>["api"]) => {
    const res = await api.get(`/api/mentoras/${VALENTINA}/disponibilidad?tipoAsesoriaId=revision_de_codigo`)
    return res.body.find((d: { fecha: string }) => d.fecha === MIERCOLES).horarios.map((h: { inicio: string }) => h.inicio)
  }

  it("cancela sin motivo y registra el momento de la cancelación", async () => {
    const { api, dataDir } = conSesion()
    const res = await api.patch(`/api/sesiones/${aCancelar().id}`).send({ estado: "cancelada" })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      id: aCancelar().id,
      estado: "cancelada",
      canceladaEn: AHORA_AR.toISOString(),
      cancelacion: { permitida: false, razon: "ya_cancelada" },
    })
    expect(res.body).not.toHaveProperty("motivoCancelacion")
    expect(res.body).not.toHaveProperty("contactoNombre")
    expect(res.body).not.toHaveProperty("contactoEmail")
    expect(leerGuardadas(dataDir)[0]).toMatchObject({ estado: "cancelada", canceladaEn: AHORA_AR.toISOString() })
  })

  it("guarda el motivo recortado y el GET posterior lo muestra", async () => {
    const { api, dataDir } = conSesion()
    const res = await api.patch(`/api/sesiones/${aCancelar().id}`).send({ estado: "cancelada", motivo: "  No llegamos con el relevamiento  " })
    expect(res.status).toBe(200)
    expect(leerGuardadas(dataDir)[0].motivoCancelacion).toBe("No llegamos con el relevamiento")

    const detalle = await api.get(`/api/sesiones/${aCancelar().id}`)
    expect(detalle.body).toMatchObject({ estado: "cancelada", motivoCancelacion: "No llegamos con el relevamiento" })
  })

  it("el horario cancelado vuelve a ofrecerse", async () => {
    const { api } = conSesion()
    expect(await horariosDelMiercoles(api)).not.toContain("18:00")
    await api.patch(`/api/sesiones/${aCancelar().id}`).send({ estado: "cancelada" })
    expect(await horariosDelMiercoles(api)).toContain("18:00")
  })

  it("400 con un cuerpo inválido, sin modificar la sesión", async () => {
    const casos: [unknown, string][] = [
      [{ estado: "confirmada" }, "Solo se puede cambiar el estado a cancelada"],
      [{ motivo: "x" }, "Solo se puede cambiar el estado a cancelada"],
      [{ estado: "cancelada", fecha: "2026-10-22" }, "Solo se puede enviar el estado y el motivo"],
      [{ estado: "cancelada", motivo: 3 }, "El motivo debe ser un texto"],
      [{ estado: "cancelada", motivo: "a".repeat(501) }, "El motivo puede tener hasta 500 caracteres"],
    ]
    const { api, dataDir } = conSesion()
    const antes = leerGuardadas(dataDir)
    for (const [cuerpo, error] of casos) {
      const res = await api.patch(`/api/sesiones/${aCancelar().id}`).send(cuerpo as object)
      expect(res.status).toBe(400)
      expect(res.body).toEqual({ error })
    }
    const sinCuerpo = await api.patch(`/api/sesiones/${aCancelar().id}`)
    expect(sinCuerpo.status).toBe(400)
    expect(sinCuerpo.body).toEqual({ error: "El cuerpo de la solicitud debe ser un objeto JSON" })
    expect(leerGuardadas(dataDir)).toEqual(antes)
  })

  it("400 con JSON mal formado, antes de buscar la sesión (aunque no exista)", async () => {
    const { api, dataDir } = conSesion()
    const antes = leerGuardadas(dataDir)
    for (const id of [aCancelar().id, "00000000-0000-4000-8000-000000000099"]) {
      const res = await api.patch(`/api/sesiones/${id}`).set("Content-Type", "application/json").send("{mal")
      expect(res.status).toBe(400)
      expect(res.body).toEqual({ error: "El cuerpo de la solicitud no es JSON válido" })
    }
    expect(leerGuardadas(dataDir)).toEqual(antes)
  })

  it("404 si la sesión no existe, aunque el contenido del cuerpo sea inválido", async () => {
    const { api, dataDir } = conSesion()
    const antes = leerGuardadas(dataDir)
    for (const id of ["00000000-0000-4000-8000-000000000099", "no-es-un-uuid"]) {
      for (const cuerpo of [{ estado: "cancelada" }, { estado: "confirmada" }]) {
        const res = await api.patch(`/api/sesiones/${id}`).send(cuerpo)
        expect(res.status).toBe(404)
        expect(res.body).toEqual({ error: "La sesión no existe" })
      }
    }
    expect(leerGuardadas(dataDir)).toEqual(antes)
  })
})

describe("API · PATCH /api/sesiones/:id fuera de plazo (409)", () => {
  const leerGuardadas = (dataDir: string) => JSON.parse(readFileSync(join(dataDir, "sesiones.json"), "utf-8"))
  const cancelar = (api: ReturnType<typeof crearAppDePrueba>["api"], id: string) =>
    api.patch(`/api/sesiones/${id}`).send({ estado: "cancelada", motivo: "No podemos ir" })

  it("409 si faltan menos de 24 horas, sin modificar la sesión", async () => {
    // AHORA_AR es el domingo 18/10 a las 12:00: la sesión empieza 23 h 59 min después.
    const sesion = sesionDePrueba({ fecha: "2026-10-19", horaInicio: "11:59", horaFin: "12:29" })
    const { api, dataDir } = crearAppDePrueba([sesion], { reloj: () => AHORA_AR })
    const antes = leerGuardadas(dataDir)
    const res = await cancelar(api, sesion.id)
    expect(res.status).toBe(409)
    expect(res.body).toEqual({ error: "Solo se puede cancelar hasta 24 horas antes del inicio de la sesión" })
    expect(leerGuardadas(dataDir)).toEqual(antes)
  })

  it("con exactamente 24 horas de anticipación todavía se puede cancelar", async () => {
    const sesion = sesionDePrueba({ fecha: "2026-10-21", horaInicio: "18:00", horaFin: "18:30" })
    const { api } = crearAppDePrueba([sesion], { reloj: () => new Date("2026-10-20T18:00:00-03:00") })
    const res = await cancelar(api, sesion.id)
    expect(res.status).toBe(200)
    expect(res.body.estado).toBe("cancelada")
  })

  it("409 si la sesión ya empezó", async () => {
    const sesion = sesionDePrueba({ fecha: "2026-10-18", horaInicio: "11:00", horaFin: "11:30" })
    const { api, dataDir } = crearAppDePrueba([sesion], { reloj: () => AHORA_AR })
    const antes = leerGuardadas(dataDir)
    const res = await cancelar(api, sesion.id)
    expect(res.status).toBe(409)
    expect(res.body).toEqual({ error: "La sesión ya ocurrió y no se puede cancelar" })
    expect(leerGuardadas(dataDir)).toEqual(antes)
  })

  it("409 si ya estaba cancelada, conservando el motivo y el momento originales", async () => {
    const sesion = sesionDePrueba({
      fecha: "2026-10-21",
      estado: "cancelada",
      motivoCancelacion: "Se suspendió",
      canceladaEn: "2026-10-17T15:00:00.000Z",
    })
    const { api, dataDir } = crearAppDePrueba([sesion], { reloj: () => AHORA_AR })
    const antes = leerGuardadas(dataDir)
    const res = await cancelar(api, sesion.id)
    expect(res.status).toBe(409)
    expect(res.body).toEqual({ error: "La sesión ya estaba cancelada" })
    expect(leerGuardadas(dataDir)).toEqual(antes)
    expect(leerGuardadas(dataDir)[0]).toMatchObject({ motivoCancelacion: "Se suspendió", canceladaEn: "2026-10-17T15:00:00.000Z" })
  })

  it("el GET de una sesión a menos de 24 horas explica por qué no se puede cancelar", async () => {
    const sesion = sesionDePrueba({ fecha: "2026-10-19", horaInicio: "11:59", horaFin: "12:29" })
    const { api } = crearAppDePrueba([sesion], { reloj: () => AHORA_AR })
    const res = await api.get(`/api/sesiones/${sesion.id}`)
    expect(res.body.cancelacion).toEqual({
      permitida: false,
      razon: "fuera_de_plazo",
      mensaje: "Solo se puede cancelar hasta 24 horas antes del inicio de la sesión",
    })
  })

  it("dos cancelaciones seguidas: la primera cancela y la segunda ve que ya estaba cancelada", async () => {
    const sesion = sesionDePrueba({ fecha: "2026-10-21", horaInicio: "18:00", horaFin: "18:30" })
    const { api, dataDir } = crearAppDePrueba([sesion], { reloj: () => AHORA_AR })
    const [primera, segunda] = await Promise.all([cancelar(api, sesion.id), cancelar(api, sesion.id)])
    expect([primera.status, segunda.status].sort()).toEqual([200, 409])
    expect([primera, segunda].find((r) => r.status === 409)!.body).toEqual({ error: "La sesión ya estaba cancelada" })
    expect(leerGuardadas(dataDir).filter((s: { estado: string }) => s.estado === "cancelada")).toHaveLength(1)
  })
})
