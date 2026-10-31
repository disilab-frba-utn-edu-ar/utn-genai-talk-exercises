import { readFileSync } from "node:fs"
import { join } from "node:path"
import type { Mentora } from "@shared/types"
import { crearAppDePrueba, escribirMentoras, HUERTA_VIVA, mentoraDePrueba, sesionDePrueba, VALENTINA } from "./helpers"

const LUNES = "2026-10-19"
const MARTES = "2026-10-20"

const emailsMentoras = (JSON.parse(readFileSync(join(process.cwd(), "data", "mentoras.json"), "utf-8")) as Mentora[]).map(
  (m) => m.contacto.email,
)

const sinContacto = (cuerpo: unknown) => {
  const texto = JSON.stringify(cuerpo)
  expect(texto).not.toContain('"contacto"')
  for (const email of emailsMentoras) expect(texto).not.toContain(email)
}

type Dia = { fecha: string; horarios: { inicio: string; fin: string }[] }
const inicios = (dias: Dia[], fecha: string) => dias.find((d) => d.fecha === fecha)?.horarios.map((h) => h.inicio) ?? []

describe("API · GET /api/tipos-asesoria/:id/disponibilidad", () => {
  it("une los horarios libres de todas las mentoras que pueden dar el tipo", async () => {
    const { api } = crearAppDePrueba()
    const res = await api.get("/api/tipos-asesoria/revision_de_codigo/disponibilidad")
    expect(res.status).toBe(200)
    // Lunes: Lu (10 a 13) y Valentina (18 a 21). Martes: Marto (9 a 12) y Camila (14 a 18).
    expect(inicios(res.body, LUNES)).toEqual(expect.arrayContaining(["10:00", "12:30", "18:00", "20:30"]))
    expect(inicios(res.body, MARTES)).toEqual(expect.arrayContaining(["09:00", "11:30", "14:00", "17:30"]))
    expect(new Set(inicios(res.body, LUNES)).size).toBe(inicios(res.body, LUNES).length)
    sinContacto(res.body)
  })

  it("une mentoras que atienden en días distintos (arquitectura: Marto y Lu)", async () => {
    const { api } = crearAppDePrueba()
    const res = await api.get("/api/tipos-asesoria/arquitectura/disponibilidad")
    expect(res.status).toBe(200)
    expect(inicios(res.body, LUNES)).toEqual(["10:00", "10:30", "11:00", "11:30", "12:00"]) // Lu
    expect(inicios(res.body, MARTES)).toEqual(["09:00", "09:30", "10:00", "10:30", "11:00"]) // Marto
  })

  it("no ofrece un horario ocupado si la única mentora libre ahí ya tiene sesión", async () => {
    const { api } = crearAppDePrueba([sesionDePrueba({ fecha: LUNES, horaInicio: "18:00", horaFin: "18:30" })])
    const res = await api.get("/api/tipos-asesoria/revision_de_codigo/disponibilidad")
    expect(inicios(res.body, LUNES)).not.toContain("18:00")
    expect(inicios(res.body, LUNES)).toContain("18:30")
  })

  it("404 si el tipo de asesoría no existe", async () => {
    const { api } = crearAppDePrueba()
    const res = await api.get("/api/tipos-asesoria/no_existe/disponibilidad")
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: "El tipo de asesoría no existe" })
  })
})

describe("API · GET /api/tipos-asesoria/:id/asignacion", () => {
  const asignacion = (query: string, tipo = "revision_de_codigo") => `/api/tipos-asesoria/${tipo}/asignacion?${query}`

  it("devuelve la mentora libre en ese horario, sin datos de contacto", async () => {
    const { api } = crearAppDePrueba()
    const res = await api.get(asignacion(`fecha=${LUNES}&horaInicio=18:00`))
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ id: VALENTINA, nombre: "Valentina Ríos" })
    expect(res.body).not.toHaveProperty("contacto")
    sinContacto(res.body)
  })

  it.each([
    ["horaInicio=18:00", "Falta la fecha"],
    [`fecha=${LUNES}`, "Falta la hora de inicio"],
    ["fecha=19/10/2026&horaInicio=18:00", "La fecha debe tener el formato AAAA-MM-DD"],
    [`fecha=${LUNES}&horaInicio=6pm`, "La hora de inicio debe tener el formato HH:MM"],
    ["fecha=2026-10-12&horaInicio=18:00", "No se puede reservar una sesión en el pasado"],
  ])("400 con %s", async (query, error) => {
    const { api } = crearAppDePrueba()
    const res = await api.get(asignacion(query))
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error })
  })

  it("404 si el tipo de asesoría no existe", async () => {
    const { api } = crearAppDePrueba()
    const res = await api.get(asignacion(`fecha=${LUNES}&horaInicio=18:00`, "no_existe"))
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: "El tipo de asesoría no existe" })
  })

  it("409 si ninguna mentora está libre en ese horario", async () => {
    const { api } = crearAppDePrueba([sesionDePrueba({ fecha: LUNES, horaInicio: "18:00", horaFin: "18:30" })])
    const res = await api.get(asignacion(`fecha=${LUNES}&horaInicio=18:00`))
    expect(res.status).toBe(409)
    expect(res.body).toEqual({ error: "No hay mentoras libres en ese horario" })
  })

  it("flujo completo: asignar, reservar con esa mentora y el horario queda ocupado", async () => {
    const { api } = crearAppDePrueba()
    const asignada = await api.get(asignacion(`fecha=${LUNES}&horaInicio=18:00`))
    const reserva = await api.post("/api/sesiones").send({
      mentoraId: asignada.body.id,
      tipoAsesoriaId: "revision_de_codigo",
      colectivoId: HUERTA_VIVA,
      proyecto: "Revisar el formulario de inscripción",
      contactoNombre: "Ana",
      contactoEmail: "ana@example.org",
      fecha: LUNES,
      horaInicio: "18:00",
    })
    expect(reserva.status).toBe(201)
    expect(reserva.body.mentoraId).toBe(VALENTINA)
    expect((await api.get(asignacion(`fecha=${LUNES}&horaInicio=18:00`))).status).toBe(409)
  })
})

describe("API · reserva por tipo · reparto entre mentoras libres", () => {
  const lunes = { inicio: "18:00", fin: "21:00" }
  const sinDias = mentoraDePrueba().disponibilidad
  const agata = mentoraDePrueba({ id: "a-agata", nombre: "Ágata", disponibilidad: { ...sinDias, lunes } })
  const bruno = mentoraDePrueba({ id: "b-bruno", nombre: "Bruno", disponibilidad: { ...sinDias, lunes } })
  const url = `/api/tipos-asesoria/revision_de_codigo/asignacion?fecha=${LUNES}&horaInicio=19:00`

  it("asigna a la que tiene menos sesiones confirmadas en los próximos 14 días", async () => {
    const otroLunes = sesionDePrueba({ mentoraId: "a-agata", fecha: "2026-10-26", horaInicio: "18:00", horaFin: "18:30" })
    const { api, dataDir } = crearAppDePrueba([otroLunes])
    escribirMentoras(dataDir, [agata, bruno])
    const res = await api.get(url)
    expect(res.status).toBe(200)
    expect(res.body.nombre).toBe("Bruno")
  })

  it("si empatan, asigna por orden alfabético", async () => {
    const { api, dataDir } = crearAppDePrueba()
    escribirMentoras(dataDir, [bruno, agata])
    const res = await api.get(url)
    expect(res.body.nombre).toBe("Ágata")
  })
})

describe("API · reserva por tipo · sin lugar", () => {
  it("devuelve una lista vacía si ninguna mentora que da el tipo tiene disponibilidad", async () => {
    const { api, dataDir } = crearAppDePrueba()
    escribirMentoras(dataDir, [mentoraDePrueba({ habilidades: ["git_y_github"] })])
    const res = await api.get("/api/tipos-asesoria/primeros_pasos_git/disponibilidad")
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })
})
