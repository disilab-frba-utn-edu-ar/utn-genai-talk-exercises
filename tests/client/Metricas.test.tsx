import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { FuenteFalsa, renderPagina, simularServidor } from "./metricas-helpers"
import { metricasDePrueba } from "./metricas-fixture"

describe("Métricas: aviso", () => {
  it("arriba de todo avisa que no conviene usarla antes de terminar el ejercicio 1", () => {
    simularServidor(metricasDePrueba())
    renderPagina()
    expect(screen.getByRole("note")).toHaveTextContent(/sin terminar el Ejercicio 1/)
  })
})

describe("Métricas: estados", () => {
  it("muestra cargando hasta que llega el primer evento y después los KPIs", async () => {
    simularServidor(metricasDePrueba())
    renderPagina()
    expect(screen.getByRole("status")).toHaveTextContent("Cargando")
    FuenteFalsa.ultima.emitir(metricasDePrueba())

    expect(await screen.findByRole("heading", { level: 1, name: "Métricas" })).toBeInTheDocument()
    const kpis = screen.getByRole("region", { name: "Indicadores" })
    expect(within(kpis).getByText("Sesiones").closest("div")).toHaveTextContent("3")
    expect(within(kpis).getByText("Llamadas a herramientas").closest("div")).toHaveTextContent("17")
    expect(within(kpis).getByText("Fallas de herramientas").closest("div")).toHaveTextContent("14 %")
    expect(screen.getByText("En vivo")).toBeInTheDocument()
  })

  it("las fallas que el agente no reporta se muestran n/d, nunca 0 %", async () => {
    simularServidor(null)
    renderPagina()
    FuenteFalsa.ultima.emitir(metricasDePrueba({ kpis: { ...metricasDePrueba().kpis, fallas: null, tasaFallas: null } }))
    const kpis = await screen.findByRole("region", { name: "Indicadores" })
    expect(within(kpis).getByText("Fallas de herramientas").closest("div")).toHaveTextContent("n/d")
    expect(kpis).not.toHaveTextContent("0 %")
    // en la tabla de sesiones, Codex también es n/d
    const fila = screen.getByRole("row", { name: /019a-cod/ })
    expect(within(fila).getAllByText("n/d").length).toBeGreaterThan(0)
  })

  it("sin logs explica cómo generarlos y enlaza al ejercicio 1", async () => {
    simularServidor(null)
    renderPagina()
    FuenteFalsa.ultima.emitir(metricasDePrueba({ vacio: true, sesiones: [] }))
    expect(await screen.findByText(/Todavía no hay logs/)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /ejercicio 1/i })).toHaveAttribute("href", "/ejercicios/01-observabilidad-con-hooks")
  })

  it("después de 3 errores seguidos pasa a consultar por HTTP y lo indica", async () => {
    const f = simularServidor(metricasDePrueba())
    renderPagina()
    const fuente = FuenteFalsa.ultima
    fuente.fallar()
    fuente.fallar()
    expect(fuente.cerrada).toBe(false) // todavía reintenta solo
    fuente.fallar()

    expect(await screen.findByRole("heading", { level: 1, name: "Métricas" })).toBeInTheDocument()
    expect(fuente.cerrada).toBe(true)
    expect(screen.getByText(/Consultando cada 5 s/)).toBeInTheDocument()
    expect(f.mock.calls.some(([url]) => String(url).startsWith("/api/metricas-agentes?"))).toBe(true)
  })

  it("si tampoco responde el GET muestra el error y permite reintentar", async () => {
    simularServidor(null)
    renderPagina()
    for (let i = 0; i < 3; i++) FuenteFalsa.ultima.fallar()
    expect(await screen.findByRole("alert")).toHaveTextContent(/npm run dev/)
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument()
  })

  it("un evento válido después de errores vuelve a 'En vivo'", async () => {
    simularServidor(metricasDePrueba())
    renderPagina()
    FuenteFalsa.ultima.emitir(metricasDePrueba())
    await screen.findByText("En vivo")
    FuenteFalsa.ultima.fallar()
    expect(await screen.findByText("Reconectando…")).toBeInTheDocument()
    FuenteFalsa.ultima.emitir(metricasDePrueba())
    expect(await screen.findByText("En vivo")).toBeInTheDocument()
  })

  it("avisa lo que se está ejecutando ahora", async () => {
    simularServidor(null)
    renderPagina()
    FuenteFalsa.ultima.emitir(metricasDePrueba({ enCurso: [{ agente: "claude", sesion: "bb76875c", herramienta: "Bash", kind: "ejecutar", desdeMs: 10_000 }] }))
    expect(await screen.findByText(/Ahora ejecutando/)).toHaveTextContent("Bash")
  })
})

describe("Métricas: filtros", () => {
  async function conDatos() {
    simularServidor(metricasDePrueba())
    renderPagina()
    FuenteFalsa.ultima.emitir(metricasDePrueba())
    await screen.findByRole("heading", { level: 1, name: "Métricas" })
  }

  it("el filtro por agente abre una nueva suscripción con ese agente", async () => {
    await conDatos()
    const antes = FuenteFalsa.instancias.length
    await userEvent.click(screen.getByRole("button", { name: "Claude" }))
    expect(FuenteFalsa.instancias.length).toBeGreaterThan(antes)
    expect(FuenteFalsa.ultima.url).toContain("agente=claude")
    expect(screen.getByRole("button", { name: "Claude" })).toHaveAttribute("aria-pressed", "true")
  })

  it("la ventana y la sesión también se mandan al servidor", async () => {
    await conDatos()
    await userEvent.selectOptions(screen.getByLabelText("Ventana"), "60")
    expect(FuenteFalsa.ultima.url).toContain("ventana=60")
    await userEvent.selectOptions(screen.getByLabelText("Sesión"), "bb76875c")
    expect(FuenteFalsa.ultima.url).toContain("sesion=bb76875c")
  })

  it("permite elegir entre los logs actuales y las carpetas archivadas", async () => {
    await conDatos()
    const selector = await screen.findByLabelText("Origen")
    expect(within(selector).getAllByRole("option").map((o) => o.textContent)).toEqual(["Actual", "Archivo 2026-10-20T10-00-00-000Z"])
    await userEvent.selectOptions(selector, "archivo/2026-10-20T10-00-00-000Z")
    expect(decodeURIComponent(FuenteFalsa.ultima.url)).toContain("origen=archivo/2026-10-20T10-00-00-000Z")
  })

  it("los filtros se leen de la URL, así un link abre el tablero ya filtrado", async () => {
    simularServidor(metricasDePrueba())
    renderPagina("/metricas?agente=cline&ventana=60")
    expect(FuenteFalsa.ultima.url).toContain("agente=cline")
    expect(FuenteFalsa.ultima.url).toContain("ventana=60")
    FuenteFalsa.ultima.emitir(metricasDePrueba())
    expect(await screen.findByRole("button", { name: "Cline" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByLabelText("Ventana")).toHaveValue("60")
  })

  it("cambiar de filtro cierra la conexión anterior", async () => {
    await conDatos()
    const anterior = FuenteFalsa.ultima
    await userEvent.click(screen.getByRole("button", { name: "Codex" }))
    expect(anterior.cerrada).toBe(true)
  })
})

describe("Métricas: modo detalle", () => {
  it("está apagado por defecto y se activa con un toggle, sin variables de entorno", async () => {
    simularServidor(null)
    renderPagina()
    FuenteFalsa.ultima.emitir(metricasDePrueba())
    await screen.findByRole("heading", { level: 1, name: "Métricas" })
    expect(FuenteFalsa.ultima.url).not.toContain("detalle")
    expect(screen.queryByRole("region", { name: "Comandos recientes" })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole("checkbox", { name: /comandos completos/i }))
    expect(FuenteFalsa.ultima.url).toContain("detalle=1")
    FuenteFalsa.ultima.emitir(metricasDePrueba({ comandosRecientes: [{ ts: "2026-10-27T17:00:05.000Z", agente: "claude", comando: "curl -H Bearer [redactado]" }] }))
    const region = await screen.findByRole("region", { name: "Comandos recientes" })
    expect(region).toHaveTextContent("Bearer [redactado]")
  })
})

describe("Métricas: gráficos accesibles", () => {
  it("cada gráfico tiene su botón 'Ver como tabla'", async () => {
    simularServidor(null)
    renderPagina()
    FuenteFalsa.ultima.emitir(metricasDePrueba())
    const figura = (await screen.findByRole("figure", { name: /Herramientas más usadas/ })) as HTMLElement
    expect(within(figura).queryByRole("table")).not.toBeInTheDocument()
    await userEvent.click(within(figura).getByRole("button", { name: "Ver como tabla" }))
    const tabla = within(figura).getByRole("table")
    expect(within(tabla).getByRole("rowheader", { name: "Bash" })).toBeInTheDocument()
    await userEvent.click(within(figura).getByRole("button", { name: "Ver como gráfico" }))
    expect(within(figura).queryByRole("table")).not.toBeInTheDocument()
  })

  it("los gráficos sin datos dicen 'sin datos' en vez de mostrar ceros", async () => {
    simularServidor(null)
    renderPagina()
    FuenteFalsa.ultima.emitir(metricasDePrueba({ fallasPorHerramienta: [], duraciones: [] }))
    const fallas = await screen.findByRole("figure", { name: /Fallas por herramienta/ })
    expect(fallas).toHaveTextContent("Sin datos")
  })

  it("la tabla de sesiones lista cada sesión con su agente", async () => {
    simularServidor(null)
    renderPagina()
    FuenteFalsa.ultima.emitir(metricasDePrueba())
    const tabla = await screen.findByRole("table", { name: "Sesiones" })
    expect(within(tabla).getAllByRole("row")).toHaveLength(3)
    await waitFor(() => expect(within(tabla).getByRole("row", { name: /bb76875c/ })).toHaveTextContent("Claude"))
  })
})
