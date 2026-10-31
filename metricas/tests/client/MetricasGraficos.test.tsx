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
    "Actividad por minuto",
    "Tokens por minuto, por agente",
    "Tokens por minuto, por tipo",
    "Distribución de tokens por tipo",
    "Herramientas más usadas",
    "Acciones por tipo, por agente",
    "Fallas por herramienta",
    "Duración por tipo de acción",
    "Archivos leídos",
    "Archivos escritos",
    "Comandos de shell",
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
    const figura = screen.getByRole("figure", { name: /Acciones por tipo, por agente/ })
    await userEvent.click(within(figura).getByRole("button", { name: "Ver como tabla" }))
    const fila = within(figura).getByRole("row", { name: /Claude/ })
    expect(fila).toHaveTextContent("ejecutar")
    expect(fila).toHaveTextContent("100 %")
  })

  it("la duración muestra p50 y p95 por tipo", async () => {
    await conDatos()
    const figura = screen.getByRole("figure", { name: /Duración por tipo/ })
    await userEvent.click(within(figura).getByRole("button", { name: "Ver como tabla" }))
    expect(figura).toHaveTextContent("ejecutar")
    expect(figura).toHaveTextContent("800 ms")
    expect(figura).toHaveTextContent("1,5 s")
  })

  it("la descripción de cada gráfico está en un tooltip, no a la vista", async () => {
    await conDatos()
    const figura = screen.getByRole("figure", { name: /Herramientas más usadas/ })
    const info = within(figura).getByRole("button", { name: "Qué muestra este gráfico" })
    expect(info).toHaveAccessibleDescription("Llamadas por herramienta; el color es el tipo de acción.")
    expect(within(figura).getByRole("tooltip", { hidden: true })).not.toBeVisible()
  })

  it("la distribución de tokens muestra la proporción de cada tipo", async () => {
    await conDatos()
    const figura = screen.getByRole("figure", { name: /Distribución de tokens/ })
    await userEvent.click(within(figura).getByRole("button", { name: "Ver como tabla" }))
    expect(within(figura).getByRole("row", { name: /Entrada/ })).toHaveTextContent("14 %")
    expect(within(figura).getByRole("row", { name: /Caché \(lectura\)/ })).toHaveTextContent("48 %")
  })

  it("los gráficos se actualizan en vivo con cada evento nuevo", async () => {
    await conDatos()
    const figura = screen.getByRole("figure", { name: /Herramientas más usadas/ })
    await userEvent.click(within(figura).getByRole("button", { name: "Ver como tabla" }))
    expect(within(figura).queryByRole("rowheader", { name: "WebFetch" })).not.toBeInTheDocument()
    FuenteFalsa.ultima.emitir(metricasDePrueba({ herramientas: [{ nombre: "WebFetch", kind: "buscar", n: 4 }] }))
    expect(await within(figura).findByRole("rowheader", { name: "WebFetch" })).toBeInTheDocument()
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
    for (const titulo of [/Línea de tiempo/, /Duración por tipo/, /Archivos escritos/, /Comandos de shell/, /Subagentes, skills y MCP/]) {
      expect(screen.getByRole("figure", { name: titulo })).toHaveTextContent("Sin datos")
    }
  })
})
