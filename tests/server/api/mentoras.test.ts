import { crearAppConCupo, crearAppDePrueba, ROCIO, sesionDePrueba, VALENTINA } from "./helpers"

describe("API · catálogos", () => {
  it("GET /api/health responde ok", async () => {
    const { api } = crearAppDePrueba()
    const res = await api.get("/api/health")
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: "ok" })
  })

  it.each(["/api/habilidades", "/api/tipos-asesoria", "/api/colectivos"])("GET %s devuelve una lista", async (ruta) => {
    const { api } = crearAppDePrueba()
    const res = await api.get(ruta)
    expect(res.status).toBe(200)
    expect(res.body.length).toBeGreaterThan(0)
  })

  it("una ruta inexistente de la API responde 404 con { error }", async () => {
    const { api } = crearAppDePrueba()
    const res = await api.get("/api/no-existe")
    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty("error")
  })
})

describe("API · mentoras", () => {
  it("GET /api/mentoras lista todas las mentoras con los tipos que pueden dar", async () => {
    const { api } = crearAppDePrueba()
    const res = await api.get("/api/mentoras")
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(6)
    const valentina = res.body.find((m: { id: string }) => m.id === VALENTINA)
    expect(valentina.tiposAsesoria).toContain("revision_de_codigo")
  })

  it("GET /api/mentoras?habilidad= filtra por código de habilidad", async () => {
    const { api } = crearAppDePrueba()
    const res = await api.get("/api/mentoras?habilidad=testing_e2e_cypress")
    expect(res.body.map((m: { nombre: string }) => m.nombre)).toEqual(["Camila Sosa"])
  })

  it("GET /api/mentoras/:id devuelve la mentora o 404", async () => {
    const { api } = crearAppDePrueba()
    expect((await api.get(`/api/mentoras/${ROCIO}`)).body.nombre).toBe("Rocío Paz")
    const res = await api.get("/api/mentoras/no-existe")
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: "La mentora no existe" })
  })

  it("ninguna respuesta pública incluye el contacto de las mentoras (Principio IV)", async () => {
    const { api } = crearAppDePrueba()
    const respuestas = await Promise.all([
      api.get("/api/mentoras"),
      api.get(`/api/mentoras/${VALENTINA}`),
      api.get(`/api/mentoras/${VALENTINA}/disponibilidad?tipoAsesoriaId=revision_de_codigo`),
    ])
    for (const res of respuestas) {
      expect(JSON.stringify(res.body)).not.toContain("contacto")
      expect(JSON.stringify(res.body)).not.toContain("@example.org")
    }
  })
})

describe("API · mentoras · cupo mensual", () => {
  const consumida = (horaFin = "19:00") => sesionDePrueba({ horaInicio: "18:00", horaFin })

  it("GET /api/mentoras/:id informa las horas restantes del mes", async () => {
    const { api } = crearAppConCupo({ [VALENTINA]: 2 }, [consumida()])
    const res = await api.get(`/api/mentoras/${VALENTINA}`)
    expect(res.body.horasRestantes).toBe(1)
  })

  it("GET /api/mentoras informa 0 cuando se agotó y omite el dato sin cupo", async () => {
    const { api } = crearAppConCupo({ [VALENTINA]: 1 }, [consumida()])
    const res = await api.get("/api/mentoras")
    const porId = (id: string) => res.body.find((m: { id: string }) => m.id === id)
    expect(porId(VALENTINA).horasRestantes).toBe(0)
    expect(porId(ROCIO)).not.toHaveProperty("horasRestantes")
  })

  it("las canceladas no descuentan", async () => {
    const { api } = crearAppConCupo({ [VALENTINA]: 1 }, [sesionDePrueba({ estado: "cancelada", horaFin: "19:00" })])
    const res = await api.get(`/api/mentoras/${VALENTINA}`)
    expect(res.body.horasRestantes).toBe(1)
  })

  it("nunca expone el cupo total ni el contacto (Principio IV)", async () => {
    const { api } = crearAppConCupo({ [VALENTINA]: 8 })
    const lista = await api.get("/api/mentoras")
    const detalle = await api.get(`/api/mentoras/${VALENTINA}`)
    const texto = JSON.stringify([lista.body, detalle.body])
    expect(texto).not.toContain("cupoMensualHoras")
    expect(texto).not.toContain("contacto")
  })

  it("un cupo inválido cargado a mano se trata como sin cupo", async () => {
    const { api } = crearAppConCupo({ [VALENTINA]: -3 })
    const res = await api.get(`/api/mentoras/${VALENTINA}`)
    expect(res.status).toBe(200)
    expect(res.body).not.toHaveProperty("horasRestantes")
  })
})
