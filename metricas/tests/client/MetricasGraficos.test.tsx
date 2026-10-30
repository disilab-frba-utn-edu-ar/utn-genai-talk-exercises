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

describe("Métricas: todos los gráficos", () => {
  it.each([
    "Eventos por minuto",
    "Herramientas más usadas",
    "Acciones por tipo y agente",
    "Fallas por herramienta",
    "Duración por tipo de acción",
    "Archivos leídos",
    "Archivos escritos",
    "Binarios de shell",
    "Subagentes, skills y MCP",
    "Línea de tiempo de la sesión",
  ])("muestra «%s» y se puede ver como tabla", async (titulo) => {
    await conDatos({ mcp: [{ nombre: "mcp__github__x", n: 1 }] })
    const figura = screen.getByRole("figure", { name: new RegExp(titulo) })
    await userEvent.click(within(figura).getByRole("button", { name: "Ver como tabla" }))
    expect(within(figura).getByRole("table")).toBeInTheDocument()
  })

  it("las acciones por tipo se agrupan por agente con su porcentaje", async () => {
    await conDatos()
    const figura = screen.getByRole("figure", { name: /Acciones por tipo y agente/ })
    await userEvent.click(within(figura).getByRole("button", { name: "Ver como tabla" }))
    const fila = within(figura).getByRole("row", { name: /Claude/ })
    expect(fila).toHaveTextContent("ejecutar")
    expect(fila).toHaveTextContent("100 %")
  })

  it("la duración muestra p50 y p95 por tipo", async () => {
    await conDatos()
    const figura = screen.getByRole("figure", { name: /Duración por tipo/ })
    expect(figura).toHaveTextContent("ejecutar")
    expect(figura).toHaveTextContent("800 ms")
    expect(figura).toHaveTextContent("1,5 s")
  })

  it("la línea de tiempo dice de qué sesión es y marca la falla", async () => {
    await conDatos()
    const figura = screen.getByRole("figure", { name: /Línea de tiempo de la sesión bb76875c/ })
    await userEvent.click(within(figura).getByRole("button", { name: "Ver como tabla" }))
    const filas = within(figura).getAllByRole("row")
    expect(filas).toHaveLength(1 + 4)
    expect(within(figura).getByRole("row", { name: /falló/ })).toBeInTheDocument()
  })

  it("sin línea de tiempo ni datos opcionales, dice 'Sin datos' en vez de ceros", async () => {
    await conDatos({ lineaDeTiempo: null, duraciones: [], archivosEscritos: [], binarios: [], subagentes: [], skills: [], mcp: [] })
    for (const titulo of [/Línea de tiempo/, /Duración por tipo/, /Archivos escritos/, /Binarios de shell/, /Subagentes, skills y MCP/]) {
      expect(screen.getByRole("figure", { name: titulo })).toHaveTextContent("Sin datos")
    }
  })
})
