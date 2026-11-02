import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Outlet, Route, Routes, useLocation } from "react-router"
import SesionPage from "../../client/src/pages/SesionPage"
import { colectivos, sesionDetalle, tipos, valentina } from "./fixtures"
import { renderConRuta, simularApi } from "./helpers"

const api = {
  "/api/sesiones/s1": sesionDetalle,
  "/api/mentoras/m1": valentina,
  "/api/tipos-asesoria": tipos,
  "/api/colectivos": colectivos,
}

const renderSesion = () => renderConRuta(<SesionPage />, { ruta: "/sesiones/s1", patron: "/sesiones/:id" })

const simularPortapapeles = (writeText: (texto: string) => Promise<void>) => {
  const espia = vi.fn(writeText)
  Object.defineProperty(navigator, "clipboard", { value: { writeText: espia }, configurable: true })
  return espia
}

describe("SesionPage", () => {
  it("muestra el detalle de la sesión sin datos de contacto", async () => {
    simularApi(api)
    renderSesion()

    expect(await screen.findByText("Valentina Ríos")).toBeInTheDocument()
    expect(screen.getByText("Revisión de código (30 min)")).toBeInTheDocument()
    expect(screen.getByText(/19 de octubre/)).toBeInTheDocument()
    expect(screen.getByText("18:00 a 18:30")).toBeInTheDocument()
    expect(screen.getByText("Fundación Huerta Viva")).toBeInTheDocument()
    expect(screen.getByText("Revisar el formulario de inscripción")).toBeInTheDocument()
    expect(screen.getByText("Confirmada")).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/@/)
  })

  it("muestra el enlace de la sesión, el aviso de guardarlo y lo copia", async () => {
    simularApi(api)
    const writeText = simularPortapapeles(async () => {})
    renderSesion()

    const enlace = await screen.findByLabelText("Enlace de tu sesión")
    expect(enlace).toHaveAttribute("readonly")
    expect((enlace as HTMLInputElement).value).toMatch(/\/sesiones\/s1$/)
    expect(screen.getByText(/Guardá este enlace/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Copiar enlace" }))
    expect(writeText).toHaveBeenCalledWith((enlace as HTMLInputElement).value)
    expect(await screen.findByText("Enlace copiado")).toBeInTheDocument()
  })

  it("avisa si no pudo copiar el enlace", async () => {
    simularApi(api)
    simularPortapapeles(async () => {
      throw new Error("sin permiso")
    })
    renderSesion()

    await userEvent.click(await screen.findByRole("button", { name: "Copiar enlace" }))
    expect(await screen.findByText("No pudimos copiar el enlace: seleccionalo y copialo a mano")).toBeInTheDocument()
  })

  it("muestra la página de sesión no encontrada si el enlace no corresponde a ninguna sesión", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "La sesión no existe" }), { status: 404 })))
    renderSesion()

    expect(await screen.findByRole("heading", { name: "No encontramos esta sesión" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Ir al inicio" })).toHaveAttribute("href", "/")
  })

  it("muestra un error con opción de reintentar si falla la carga", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "Error interno del servidor" }), { status: 500 })))
    renderSesion()

    expect(await screen.findByText("Error interno del servidor")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument()
  })

  it("muestra un estado de carga mientras espera los datos", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => {})))
    renderSesion()

    expect(screen.getByRole("status")).toHaveTextContent("Cargando")
  })

  it("dice «¡Sesión confirmada!» solo si se llega recién reservada", async () => {
    simularApi(api)
    render(
      <MemoryRouter initialEntries={[{ pathname: "/sesiones/s1", state: { recienReservada: true } }]}>
        <Routes>
          <Route path="/sesiones/:id" element={<SesionPage />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(await screen.findByRole("heading", { level: 1, name: "¡Sesión confirmada!" })).toBeInTheDocument()
  })

  it("al abrir o recargar el enlace el título es «Tu sesión»", async () => {
    simularApi(api)
    renderSesion()
    expect(await screen.findByRole("heading", { level: 1, name: "Tu sesión" })).toBeInTheDocument()
  })
})

/** Como simularApi, pero responde el PATCH de la sesión con `alCancelar` y registra los cuerpos enviados. */
function simularApiConCancelacion(alCancelar: (cuerpo: unknown) => Response | Promise<Response>) {
  const enviados: unknown[] = []
  const fetchFalso = vi.fn(async (url: string, opciones?: RequestInit) => {
    if (opciones?.method === "PATCH") {
      const cuerpo = JSON.parse(String(opciones.body))
      enviados.push(cuerpo)
      return alCancelar(cuerpo)
    }
    const ruta = url.split("?")[0]
    if (!(ruta in api)) return new Response(JSON.stringify({ error: "no encontrado" }), { status: 404 })
    return new Response(JSON.stringify(api[ruta as keyof typeof api]), { status: 200 })
  })
  vi.stubGlobal("fetch", fetchFalso)
  return { fetchFalso, enviados }
}

const cancelada = (motivo?: string) =>
  new Response(
    JSON.stringify({
      ...sesionDetalle,
      estado: "cancelada",
      ...(motivo && { motivoCancelacion: motivo }),
      canceladaEn: "2026-10-18T15:00:00.000Z",
      cancelacion: { permitida: false, razon: "ya_cancelada", mensaje: "La sesión ya estaba cancelada" },
    }),
    { status: 200 },
  )

describe("SesionPage · cancelar", () => {
  it("abre el formulario con motivo opcional y permite volver sin cancelar", async () => {
    const { enviados } = simularApiConCancelacion(() => cancelada())
    renderSesion()

    await userEvent.click(await screen.findByRole("button", { name: "Cancelar sesión" }))
    expect(screen.getByLabelText("Motivo (opcional)")).toHaveAttribute("maxlength", "500")
    expect(screen.getByText("0/500")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Confirmar cancelación" })).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Volver" }))
    expect(screen.queryByLabelText("Motivo (opcional)")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Cancelar sesión" })).toBeInTheDocument()
    expect(enviados).toEqual([])
  })

  it("cancela sin motivo", async () => {
    const { enviados } = simularApiConCancelacion(() => cancelada())
    renderSesion()

    await userEvent.click(await screen.findByRole("button", { name: "Cancelar sesión" }))
    await userEvent.click(screen.getByRole("button", { name: "Confirmar cancelación" }))

    expect(await screen.findByText("La sesión quedó cancelada. El horario volvió a quedar libre.")).toBeInTheDocument()
    expect(enviados).toEqual([{ estado: "cancelada" }])
    expect(screen.getByText("Cancelada")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Cancelar sesión" })).not.toBeInTheDocument()
  })

  it("cancela con motivo y lo muestra", async () => {
    const { enviados } = simularApiConCancelacion((cuerpo) => cancelada((cuerpo as { motivo?: string }).motivo))
    renderSesion()

    await userEvent.click(await screen.findByRole("button", { name: "Cancelar sesión" }))
    await userEvent.type(screen.getByLabelText("Motivo (opcional)"), "Se suspendió la reunión")
    expect(screen.getByText("23/500")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Confirmar cancelación" }))

    expect(await screen.findByText("Se suspendió la reunión")).toBeInTheDocument()
    expect(enviados).toEqual([{ estado: "cancelada", motivo: "Se suspendió la reunión" }])
    expect(screen.getByText("La sesión quedó cancelada. El horario volvió a quedar libre.")).toBeInTheDocument()
  })

  it("si se cae la conexión, avisa, la sesión sigue confirmada y no se pierde el motivo", async () => {
    simularApiConCancelacion(() => {
      throw new TypeError("Failed to fetch")
    })
    renderSesion()

    await userEvent.click(await screen.findByRole("button", { name: "Cancelar sesión" }))
    await userEvent.type(screen.getByLabelText("Motivo (opcional)"), "No podemos ir")
    await userEvent.click(screen.getByRole("button", { name: "Confirmar cancelación" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos conectarnos con el servidor")
    expect(screen.getByText("Confirmada")).toBeInTheDocument()
    expect(screen.getByLabelText("Motivo (opcional)")).toHaveValue("No podemos ir")
  })
})

describe("SesionPage · cuando no se puede cancelar", () => {
  const conCancelacion = (cancelacion: unknown, extra: object = {}) =>
    simularApi({ ...api, "/api/sesiones/s1": { ...sesionDetalle, ...extra, cancelacion } })

  it("fuera de plazo: no ofrece cancelar y explica por qué", async () => {
    const mensaje = "Solo se puede cancelar hasta 24 horas antes del inicio de la sesión"
    conCancelacion({ permitida: false, razon: "fuera_de_plazo", mensaje })
    renderSesion()

    expect(await screen.findByText(mensaje)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Cancelar sesión" })).not.toBeInTheDocument()
  })

  it("ya ocurrió: no ofrece cancelar y explica por qué", async () => {
    const mensaje = "La sesión ya ocurrió y no se puede cancelar"
    conCancelacion({ permitida: false, razon: "ya_ocurrio", mensaje })
    renderSesion()

    expect(await screen.findByText(mensaje)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Cancelar sesión" })).not.toBeInTheDocument()
  })

  it("ya cancelada: muestra el estado sin un aviso de error", async () => {
    conCancelacion(
      { permitida: false, razon: "ya_cancelada", mensaje: "La sesión ya estaba cancelada" },
      { estado: "cancelada", motivoCancelacion: "Se suspendió" },
    )
    renderSesion()

    expect(await screen.findByText("Cancelada")).toBeInTheDocument()
    expect(screen.getByText("Se suspendió")).toBeInTheDocument()
    expect(screen.queryByText("La sesión ya estaba cancelada")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Cancelar sesión" })).not.toBeInTheDocument()
  })

  it("si el plazo vence con la página abierta, muestra el error del servidor y recarga el detalle", async () => {
    const mensaje = "Solo se puede cancelar hasta 24 horas antes del inicio de la sesión"
    let plazoVencido = false
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, opciones?: RequestInit) => {
        if (opciones?.method === "PATCH") {
          plazoVencido = true
          return new Response(JSON.stringify({ error: mensaje }), { status: 409 })
        }
        const ruta = url.split("?")[0]
        if (ruta === "/api/sesiones/s1") {
          const cancelacion = plazoVencido ? { permitida: false, razon: "fuera_de_plazo", mensaje } : { permitida: true }
          return new Response(JSON.stringify({ ...sesionDetalle, cancelacion }), { status: 200 })
        }
        return new Response(JSON.stringify(api[ruta as keyof typeof api]), { status: 200 })
      }),
    )
    renderSesion()

    await userEvent.click(await screen.findByRole("button", { name: "Cancelar sesión" }))
    await userEvent.click(screen.getByRole("button", { name: "Confirmar cancelación" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(mensaje)
    expect(screen.queryByLabelText("Motivo (opcional)")).not.toBeInTheDocument()
    expect(await screen.findByText("Confirmada")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Cancelar sesión" })).not.toBeInTheDocument()
  })
})

describe("SesionPage · recarga y foco", () => {
  it("después de mostrar «¡Sesión confirmada!» borra la marca del historial, así al recargar dice «Tu sesión»", async () => {
    simularApi(api)
    // Muestra el state del historial: es lo que el navegador conserva al recargar.
    function EstadoDelHistorial() {
      return <p data-testid="historial">{JSON.stringify(useLocation().state)}</p>
    }
    render(
      <MemoryRouter initialEntries={[{ pathname: "/sesiones/s1", state: { recienReservada: true } }]}>
        <Routes>
          <Route
            element={
              <>
                <Outlet />
                <EstadoDelHistorial />
              </>
            }
          >
            <Route path="/sesiones/:id" element={<SesionPage />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole("heading", { level: 1, name: "¡Sesión confirmada!" })).toBeInTheDocument()
    expect(screen.getByTestId("historial")).toHaveTextContent("null")
  })

  it("al tocar «Volver» el foco vuelve a «Cancelar sesión»", async () => {
    simularApiConCancelacion(() => cancelada())
    renderSesion()

    await userEvent.click(await screen.findByRole("button", { name: "Cancelar sesión" }))
    await userEvent.click(screen.getByRole("button", { name: "Volver" }))

    expect(screen.getByRole("button", { name: "Cancelar sesión" })).toHaveFocus()
  })

  it("después de cancelar, el foco va al mensaje de resultado", async () => {
    simularApiConCancelacion(() => cancelada())
    renderSesion()

    await userEvent.click(await screen.findByRole("button", { name: "Cancelar sesión" }))
    await userEvent.click(screen.getByRole("button", { name: "Confirmar cancelación" }))

    const mensaje = await screen.findByText("La sesión quedó cancelada. El horario volvió a quedar libre.")
    expect(mensaje).toHaveFocus()
  })
})
