import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router"
import ReservaPorTipoPage from "../../client/src/pages/ReservaPorTipoPage"
import { camila, colectivos, tipos, valentina } from "./fixtures"

type Respuesta = { status?: number; body: unknown }

/** Simula la API por método y ruta; una lista de respuestas se consume en orden (la última se repite). */
function simular(rutas: Record<string, Respuesta | Respuesta[]>) {
  const fetchFalso = vi.fn(async (url: string, init?: RequestInit) => {
    const clave = `${init?.method ?? "GET"} ${url.split("?")[0]}`
    const definida = rutas[clave]
    if (!definida) return new Response(JSON.stringify({ error: "no encontrado" }), { status: 404 })
    const respuesta = Array.isArray(definida) ? (definida.length > 1 ? definida.shift()! : definida[0]) : definida
    return new Response(JSON.stringify(respuesta.body), { status: respuesta.status ?? 200 })
  })
  vi.stubGlobal("fetch", fetchFalso)
  return fetchFalso
}

const LUNES = { fecha: "2026-10-19", horarios: [{ inicio: "18:00", fin: "18:30" }] }
const sesion = (mentoraId: string) => ({
  id: "s1",
  mentoraId,
  tipoAsesoriaId: "revision_de_codigo",
  colectivoId: "c1",
  proyecto: "Revisar el formulario de inscripción",
  contactoNombre: "Ana",
  contactoEmail: "ana@example.org",
  fecha: "2026-10-19",
  horaInicio: "18:00",
  horaFin: "18:30",
  estado: "confirmada",
})

const base = (extra: Record<string, Respuesta | Respuesta[]> = {}) => ({
  "GET /api/tipos-asesoria": { body: tipos },
  "GET /api/mentoras": { body: [valentina, camila] },
  "GET /api/colectivos": { body: colectivos },
  "GET /api/tipos-asesoria/revision_de_codigo/disponibilidad": { body: [LUNES] },
  "GET /api/tipos-asesoria/revision_de_codigo/asignacion": { body: valentina },
  ...extra,
})

function renderPagina() {
  return render(
    <MemoryRouter initialEntries={["/reservar-por-tipo"]}>
      <Routes>
        <Route path="/reservar-por-tipo" element={<ReservaPorTipoPage />} />
        <Route path="/confirmacion" element={<h1>Pantalla de confirmación</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function elegirHorario() {
  await userEvent.click(await screen.findByRole("radio", { name: /Revisión de código/ }))
  await userEvent.click(await screen.findByRole("button", { name: /19 de octubre/ }))
  await userEvent.click(screen.getByRole("button", { name: "18:00 – 18:30" }))
}

async function completarDatos() {
  await userEvent.selectOptions(await screen.findByLabelText("Colectivo"), "c1")
  await userEvent.type(screen.getByLabelText("¿Qué necesitan resolver?"), "Revisar el formulario de inscripción")
  await userEvent.type(screen.getByLabelText("Nombre de contacto"), "Ana")
  await userEvent.type(screen.getByLabelText("Email de contacto"), "ana@example.org")
}

const cuerpoDelPost = (fetchFalso: ReturnType<typeof simular>, n = 0) =>
  JSON.parse(fetchFalso.mock.calls.filter(([, init]) => init?.method === "POST")[n][1]!.body as string)

describe("ReservaPorTipoPage", () => {
  it("ofrece solo los tipos de asesoría que alguna mentora puede dar", async () => {
    simular(base())
    renderPagina()

    expect(await screen.findByRole("radio", { name: /Revisión de código/ })).toBeInTheDocument()
    expect(screen.queryByRole("radio", { name: /Puesta en producción/ })).not.toBeInTheDocument()
  })

  it("al elegir un horario muestra la mentora asignada y el formulario", async () => {
    simular(base())
    renderPagina()
    await elegirHorario()

    expect(await screen.findByText("Valentina Ríos")).toBeInTheDocument()
    expect(screen.getByText("Frontend hace 8 años.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Confirmar sesión" })).toBeInTheDocument()
  })

  it("confirma con la mentora mostrada y navega a la confirmación", async () => {
    const fetchFalso = simular(base({ "POST /api/sesiones": { status: 201, body: sesion("m1") } }))
    renderPagina()
    await elegirHorario()
    await completarDatos()
    await userEvent.click(screen.getByRole("button", { name: "Confirmar sesión" }))

    expect(await screen.findByRole("heading", { name: "Pantalla de confirmación" })).toBeInTheDocument()
    expect(cuerpoDelPost(fetchFalso)).toMatchObject({
      mentoraId: "m1",
      tipoAsesoriaId: "revision_de_codigo",
      fecha: "2026-10-19",
      horaInicio: "18:00",
    })
  })

  it("si la mentora se ocupó, muestra la nueva asignación y pide confirmar de nuevo sin perder los datos", async () => {
    const fetchFalso = simular(
      base({
        "GET /api/tipos-asesoria/revision_de_codigo/asignacion": [{ body: valentina }, { body: camila }],
        "POST /api/sesiones": [
          { status: 409, body: { error: "El horario se superpone con otra sesión de la mentora" } },
          { status: 201, body: sesion("m2") },
        ],
      }),
    )
    renderPagina()
    await elegirHorario()
    await completarDatos()
    await userEvent.click(screen.getByRole("button", { name: "Confirmar sesión" }))

    const aviso = await screen.findByRole("alert")
    expect(aviso).toHaveTextContent("Valentina Ríos ya no está libre")
    expect(aviso).toHaveTextContent("Camila Sosa")
    expect(screen.getByLabelText("Nombre de contacto")).toHaveValue("Ana")
    expect(screen.queryByRole("heading", { name: "Pantalla de confirmación" })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Confirmar sesión" }))
    expect(await screen.findByRole("heading", { name: "Pantalla de confirmación" })).toBeInTheDocument()
    expect(cuerpoDelPost(fetchFalso, 1).mentoraId).toBe("m2")
  })

  it("si no queda ninguna mentora libre, avisa que el horario ya no está disponible", async () => {
    const fetchFalso = simular(
      base({
        "GET /api/tipos-asesoria/revision_de_codigo/asignacion": [
          { body: valentina },
          { status: 409, body: { error: "No hay mentoras libres en ese horario" } },
        ],
        "POST /api/sesiones": { status: 409, body: { error: "El horario se superpone con otra sesión de la mentora" } },
      }),
    )
    renderPagina()
    await elegirHorario()
    await completarDatos()
    await userEvent.click(screen.getByRole("button", { name: "Confirmar sesión" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("ya no está disponible")
    expect(screen.queryByRole("button", { name: "Confirmar sesión" })).not.toBeInTheDocument()
    const pedidosDisponibilidad = fetchFalso.mock.calls.filter(([url]) => String(url).includes("/disponibilidad"))
    expect(pedidosDisponibilidad.length).toBe(2)
  })

  it("avisa cuando ninguna mentora tiene lugar para ese tipo de asesoría", async () => {
    simular(base({ "GET /api/tipos-asesoria/revision_de_codigo/disponibilidad": { body: [] } }))
    renderPagina()
    await userEvent.click(await screen.findByRole("radio", { name: /Revisión de código/ }))

    expect(await screen.findByText("No hay lugar en los próximos 14 días")).toBeInTheDocument()
    expect(screen.getByText(/Ninguna mentora tiene horarios libres para este tipo de asesoría/)).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: /Revisión de código/ })).toBeEnabled()
    expect(screen.getByRole("link", { name: "Ver otras mentoras" })).toHaveAttribute("href", "/")
  })
})
