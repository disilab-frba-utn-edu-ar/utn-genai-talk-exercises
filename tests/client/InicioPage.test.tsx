import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import InicioPage from "../../client/src/pages/InicioPage"
import { camila, habilidades, valentina } from "./fixtures"
import { renderConRuta, simularApi } from "./helpers"

describe("InicioPage", () => {
  it("lista las mentoras con sus habilidades", async () => {
    simularApi({ "/api/habilidades": habilidades, "/api/mentoras": [valentina, camila] })
    renderConRuta(<InicioPage />)

    expect(await screen.findByRole("heading", { name: "Valentina Ríos" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Camila Sosa" })).toBeInTheDocument()
    expect(screen.getAllByText("Desarrollo Web React").length).toBeGreaterThan(0)
  })

  it("filtra por habilidad", async () => {
    simularApi({
      "/api/habilidades": habilidades,
      "/api/mentoras": [valentina, camila],
      "/api/mentoras?habilidad=testing_e2e_cypress": [camila],
    })
    renderConRuta(<InicioPage />)

    await userEvent.click(await screen.findByRole("button", { name: "Testing E2E con Cypress" }))

    expect(await screen.findByRole("button", { name: "Testing E2E con Cypress", pressed: true })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Valentina Ríos" })).not.toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Camila Sosa" })).toBeInTheDocument()
  })

  it("muestra un estado vacío cuando ninguna mentora tiene la habilidad", async () => {
    simularApi({ "/api/habilidades": habilidades, "/api/mentoras?habilidad=testing_e2e_cypress": [] })
    renderConRuta(<InicioPage />, { ruta: "/?habilidad=testing_e2e_cypress" })

    expect(await screen.findByText("Ninguna mentora tiene esa habilidad todavía")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Ver todas las mentoras" })).toBeInTheDocument()
  })

  it("muestra el error y permite reintentar si la API falla", async () => {
    simularApi({ "/api/habilidades": habilidades })
    renderConRuta(<InicioPage />)

    expect(await screen.findByRole("alert")).toHaveTextContent("no encontrado")
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument()
  })
})
