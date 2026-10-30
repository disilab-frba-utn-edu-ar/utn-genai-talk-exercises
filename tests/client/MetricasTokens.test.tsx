import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { metricasDePrueba } from "./metricas-fixture"
import { FuenteFalsa, renderPagina, simularServidor } from "./metricas-helpers"

async function conDatos(extra: Parameters<typeof metricasDePrueba>[0] = {}) {
  simularServidor(null)
  renderPagina()
  FuenteFalsa.ultima.emitir(metricasDePrueba(extra))
  await screen.findByRole("heading", { level: 1, name: "Métricas" })
}

const sinTokens = { disponible: false, total: null, costo: { usd: null, parcial: false, sinPrecio: [] }, porTiempo: { pasoMin: 1, puntos: [] }, porModelo: [], cambiosDeModelo: [] }

describe("Métricas: tokens, modelos y costo", () => {
  it("los indicadores muestran tokens (entrada / salida), caché y el costo estimado", async () => {
    await conDatos()
    const kpis = screen.getByRole("region", { name: "Indicadores" })
    const tokens = within(kpis).getByText("Tokens (entrada / salida)").closest("div")!
    expect(tokens).toHaveTextContent("1.160 / 820")
    expect(tokens).toHaveTextContent("caché: 6.400")
    const costo = within(kpis).getByText("Costo estimado").closest("div")!
    expect(costo).toHaveTextContent("US$ 0,0157")
    expect(costo).toHaveTextContent(/parcial.*gpt-5-codex/)
  })

  it("sin transcripciones, tokens y costo dicen n/d (nunca 0)", async () => {
    await conDatos({ tokens: sinTokens })
    const kpis = screen.getByRole("region", { name: "Indicadores" })
    expect(within(kpis).getByText("Tokens (entrada / salida)").closest("div")).toHaveTextContent("n/d")
    expect(within(kpis).getByText("Costo estimado").closest("div")).toHaveTextContent("n/d")
    expect(within(kpis).getByText("Costo estimado").closest("div")).toHaveTextContent(/sin transcripciones/i)
  })

  it("si ningún modelo tiene precio, el costo es n/d y dice cuáles faltan", async () => {
    await conDatos({ tokens: { ...metricasDePrueba().tokens, costo: { usd: null, parcial: false, sinPrecio: ["gpt-5-codex"] } } })
    const costo = within(screen.getByRole("region", { name: "Indicadores" })).getByText("Costo estimado").closest("div")!
    expect(costo).toHaveTextContent("n/d")
    expect(costo).toHaveTextContent("gpt-5-codex")
  })

  it.each(["Tokens por minuto, por agente", "Tokens por minuto, por tipo", "Tokens y costo por modelo"])("muestra «%s» y se puede ver como tabla", async (titulo) => {
    await conDatos()
    const figura = screen.getByRole("figure", { name: new RegExp(titulo) })
    await userEvent.click(within(figura).getByRole("button", { name: "Ver como tabla" }))
    expect(within(figura).getByRole("table")).toBeInTheDocument()
  })

  it("la tabla de modelos muestra el costo de cada uno y n/d si no tiene precio", async () => {
    await conDatos()
    const figura = screen.getByRole("figure", { name: /Tokens y costo por modelo/ })
    await userEvent.click(within(figura).getByRole("button", { name: "Ver como tabla" }))
    expect(within(figura).getByRole("row", { name: /claude-sonnet-5-5/ })).toHaveTextContent("US$ 0,0117")
    expect(within(figura).getByRole("row", { name: /gpt-5-codex/ })).toHaveTextContent("n/d")
  })

  it("los gráficos de tokens dicen 'Sin datos' cuando no hay transcripciones", async () => {
    await conDatos({ tokens: sinTokens })
    for (const titulo of [/Tokens por minuto, por agente/, /Tokens por minuto, por tipo/, /Tokens y costo por modelo/]) {
      expect(screen.getByRole("figure", { name: titulo })).toHaveTextContent("Sin datos")
    }
  })

  it("la tabla de sesiones muestra modelos, tokens y costo, con n/d cuando no hay", async () => {
    await conDatos()
    const claude = screen.getByRole("row", { name: /bb76875c/ })
    expect(claude).toHaveTextContent("claude-sonnet-5-5 → claude-haiku-4-5-20251001")
    expect(claude).toHaveTextContent("1.160 / 820")
    expect(claude).toHaveTextContent("US$ 0,0157 (parcial)")
    const codex = screen.getByRole("row", { name: /019a-cod/ })
    expect(codex).toHaveTextContent("n/d")
    expect(within(codex).queryByText(/US\\$/)).not.toBeInTheDocument()
  })

  it("lista los cambios de modelo dentro de una sesión", async () => {
    await conDatos()
    const region = screen.getByRole("region", { name: "Cambios de modelo" })
    expect(region).toHaveTextContent("bb76875c")
    expect(region).toHaveTextContent("claude-sonnet-5-5 → claude-haiku-4-5-20251001")
  })

  it("sin cambios de modelo no muestra esa sección", async () => {
    await conDatos({ tokens: { ...metricasDePrueba().tokens, cambiosDeModelo: [] } })
    expect(screen.queryByRole("region", { name: "Cambios de modelo" })).not.toBeInTheDocument()
  })
})
