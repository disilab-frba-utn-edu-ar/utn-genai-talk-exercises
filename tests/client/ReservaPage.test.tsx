import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ReservaPage from "../../client/src/pages/ReservaPage"
import { colectivos, tipos, valentina } from "./fixtures"
import { renderConRuta, simularApi } from "./helpers"

const base = {
  "/api/mentoras/m1": valentina,
  "/api/tipos-asesoria": tipos,
  "/api/colectivos": colectivos,
}

const renderReserva = () => renderConRuta(<ReservaPage />, { ruta: "/mentoras/m1", patron: "/mentoras/:id" })

describe("ReservaPage", () => {
  it("ofrece solo los tipos de asesoría que la mentora puede dar", async () => {
    simularApi(base)
    renderReserva()

    expect(await screen.findByRole("radio", { name: /Revisión de código/ })).toBeInTheDocument()
    expect(screen.queryByRole("radio", { name: /Puesta en producción/ })).not.toBeInTheDocument()
  })

  it("muestra días y horarios libres y pide los datos al elegir un horario", async () => {
    simularApi({
      ...base,
      "/api/mentoras/m1/disponibilidad": [{ fecha: "2026-10-19", horarios: [{ inicio: "18:00", fin: "18:30" }] }],
    })
    renderReserva()

    await userEvent.click(await screen.findByRole("radio", { name: /Revisión de código/ }))
    await userEvent.click(await screen.findByRole("button", { name: /19 de octubre/ }))
    await userEvent.click(screen.getByRole("button", { name: "18:00 – 18:30" }))

    expect(screen.getByRole("button", { name: "Confirmar sesión" })).toBeInTheDocument()
  })

  it("avisa cuando la mentora no tiene lugar en los próximos 14 días", async () => {
    simularApi({ ...base, "/api/mentoras/m1/disponibilidad": [] })
    renderReserva()

    await userEvent.click(await screen.findByRole("radio", { name: /Revisión de código/ }))

    expect(await screen.findByText("No hay lugar en los próximos 14 días")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Ver otras mentoras" })).toHaveAttribute("href", "/")
  })

  it("muestra la página de no encontrada si la mentora no existe", async () => {
    simularApi({})
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: "La mentora no existe" }), { status: 404 })),
    )
    renderReserva()

    expect(await screen.findByRole("heading", { name: "No encontramos esta página" })).toBeInTheDocument()
  })
})
