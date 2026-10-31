import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import Ejercicios from "../app/Ejercicios"
import { HABILITA_SDD } from "../app/progreso"
import { SddPage } from "../app/Setup"
import { felicitacion, historias, introduccion, leerEstado, mover, type EstadoTablero } from "../app/tablero"
import { MemoryRouter } from "react-router"
import { renderConRuta, simularApi } from "../../tests/client/helpers"

const CLAVE = "ejercicios:tablero-sdd"
const [primera, segunda] = historias
const vacio: EstadoTablero = { introVista: true, elegidas: [], terminadas: [] }
const guardado = () => leerEstado(JSON.parse(localStorage.getItem(CLAVE) ?? "null"))

function renderSdd({ terminado2 = true, estado, respuestas = null }: { terminado2?: boolean; estado?: EstadoTablero; respuestas?: unknown } = {}) {
  if (terminado2) localStorage.setItem("ejercicios:terminados", JSON.stringify([HABILITA_SDD]))
  if (estado) localStorage.setItem(CLAVE, JSON.stringify(estado))
  const fetchFalso = simularApi({
    "/ejercicios-api/03-sdd/respuestas": respuestas,
    ...Object.fromEntries(historias.map((h) => [`/ejercicios-api/03-sdd/tareas/${h.id}`, null])),
  })
  renderConRuta(<Ejercicios />, { ruta: "/ejercicios/03-sdd", patron: "/ejercicios/*" })
  return fetchFalso
}

const llamadas = (fetchFalso: ReturnType<typeof simularApi>) =>
  (fetchFalso.mock.calls as unknown as [string, RequestInit | undefined][]).map(([url, op]) => `${op?.method ?? "GET"} ${url}`)

const columna = (nombre: string) => screen.getByRole("heading", { name: new RegExp(`^${nombre}`) }).parentElement!

describe("Tablero del ejercicio 3 · reglas", () => {
  it("la tarea en curso puede volver a To Do; Done es definitivo", () => {
    const tomada = mover(vacio, primera.id, "en-curso")!
    expect(tomada.elegidas).toEqual([primera.id])
    expect(mover(tomada, primera.id, "todo")).toEqual(vacio)
    expect(mover(vacio, primera.id, "hecho")).toBeNull()
    const terminada = mover(tomada, primera.id, "hecho")!
    expect(mover(terminada, primera.id, "todo")).toBeNull()
    expect(mover(terminada, primera.id, "en-curso")).toBeNull()
  })

  it("una sola en In Progress; otra recién cuando la principal pasa a Done", () => {
    const tomada = mover(vacio, primera.id, "en-curso")!
    expect(mover(tomada, segunda.id, "en-curso")).toBeNull()
    const terminada = mover(tomada, primera.id, "hecho")!
    expect(mover(terminada, segunda.id, "en-curso")!.elegidas).toEqual([primera.id, segunda.id])
  })

  it("lo guardado se valida: ids desconocidos o basura no rompen el tablero", () => {
    expect(leerEstado({ introVista: true, elegidas: ["no-existe", primera.id], terminadas: 3 })).toEqual({
      introVista: true,
      elegidas: [primera.id],
      terminadas: [],
    })
    expect(leerEstado("basura")).toEqual({ introVista: false, elegidas: [], terminadas: [] })
  })
})

describe("Ejercicio 3", () => {
  it("sin terminar el ejercicio 2 está bloqueado y ofrece volver al 2", () => {
    renderSdd({ terminado2: false })
    expect(screen.getByRole("heading", { name: "Todavía no está habilitado" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Ir al ejercicio 2/ })).toHaveAttribute("href", `/ejercicios/${HABILITA_SDD}`)
    expect(screen.queryByText("Product Owner")).not.toBeInTheDocument()
  })

  it("con el 2 terminado, el Product Owner escribe cada paso; Siguiente primero completa el texto y después avanza", async () => {
    renderSdd()
    const visible = () => document.querySelector(".po-texto")!.textContent
    expect(screen.getByText(/^Rocco/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled()
    expect(visible()!.length).toBeLessThan(introduccion[0].length)

    await userEvent.click(screen.getByRole("button", { name: "Siguiente" }))
    expect(visible()).toBe(introduccion[0])
    for (let i = 1; i < introduccion.length; i++) {
      await userEvent.click(screen.getByRole("button", { name: "Siguiente" })) // avanza
      await userEvent.click(screen.getByRole("button", { name: /Siguiente|Ir al tablero/ })) // completa
      expect(visible()).toBe(introduccion[i])
    }
    await userEvent.click(screen.getByRole("button", { name: "Ir al tablero" }))
    expect(screen.getByRole("heading", { name: /^To Do/ })).toBeInTheDocument()
    expect(guardado().introVista).toBe(true)
  })

  it("al hacer clic en una tarjeta se ve el detalle con sus casos borde", async () => {
    renderSdd({ estado: vacio })
    await userEvent.click(screen.getByRole("button", { name: new RegExp(primera.titulo) }))
    // Por nombre: en la página también está el popup del video.
    const detalle = screen.getByRole("dialog", { name: primera.titulo })
    expect(within(detalle).getByText(primera.casosBorde[0])).toBeInTheDocument()
    await userEvent.click(within(detalle).getByRole("button", { name: "Cerrar" }))
    expect(screen.queryByRole("dialog", { name: primera.titulo })).not.toBeInTheDocument()
  })

  it("arrastrar a In Progress elige la tarea, la guarda y habilita las pestañas", () => {
    renderSdd({ estado: vacio })
    expect(screen.queryByRole("button", { name: "Consigna" })).not.toBeInTheDocument()

    const tarjeta = within(columna("To Do")).getByRole("button", { name: new RegExp(primera.titulo) })
    const datos = new Map<string, string>()
    const dataTransfer = { setData: (k: string, v: string) => datos.set(k, v), getData: (k: string) => datos.get(k) ?? "" }
    fireEvent.dragStart(tarjeta, { dataTransfer })
    fireEvent.dragOver(columna("In Progress"), { dataTransfer })
    fireEvent.drop(columna("In Progress"), { dataTransfer })

    expect(within(columna("In Progress")).getByText(primera.titulo)).toBeInTheDocument()
    expect(within(columna("In Progress")).getByText("Principal")).toBeInTheDocument()
    expect(guardado().elegidas).toEqual([primera.id])
    expect(screen.getByRole("button", { name: "Consigna" })).toBeInTheDocument()
  })

  it("con teclado (Ctrl + flecha derecha) también se elige, y no se puede tomar una segunda", async () => {
    renderSdd({ estado: vacio })
    within(columna("To Do")).getByRole("button", { name: new RegExp(primera.titulo) }).focus()
    await userEvent.keyboard("{Control>}{ArrowRight}{/Control}")
    expect(guardado().elegidas).toEqual([primera.id])

    within(columna("To Do")).getByRole("button", { name: new RegExp(segunda.titulo) }).focus()
    await userEvent.keyboard("{Control>}{ArrowRight}{/Control}")
    expect(guardado().elegidas).toEqual([primera.id])
    expect(screen.getByRole("status")).toHaveTextContent("Ya tenés una tarea en In Progress")
  })

  it("tomar una tarea crea su archivo; devolverla a To Do lo borra y no toca lo escrito", async () => {
    const fetchFalso = renderSdd({ estado: vacio })
    within(columna("To Do")).getByRole("button", { name: new RegExp(primera.titulo) }).focus()
    await userEvent.keyboard("{Control>}{ArrowRight}{/Control}")
    expect(llamadas(fetchFalso)).toContain(`PUT /ejercicios-api/03-sdd/tareas/${primera.id}`)

    await userEvent.click(screen.getByRole("button", { name: "Consigna" }))
    await userEvent.click(await screen.findByText("1. Lo que generó el agente"))
    await userEvent.type(screen.getByLabelText("Tu respuesta a la pregunta 1"), "Lo entendí")

    await userEvent.click(screen.getByRole("button", { name: "Tablero" }))
    within(columna("In Progress")).getByRole("button", { name: new RegExp(primera.titulo) }).focus()
    await userEvent.keyboard("{Control>}{ArrowLeft}{/Control}")
    expect(guardado().elegidas).toEqual([])
    expect(llamadas(fetchFalso)).toContain(`DELETE /ejercicios-api/03-sdd/tareas/${primera.id}`)
    expect(screen.getByRole("status")).toHaveTextContent("Tus respuestas no cambiaron")

    within(columna("To Do")).getByRole("button", { name: new RegExp(segunda.titulo) }).focus()
    await userEvent.keyboard("{Control>}{ArrowRight}{/Control}")
    expect(guardado().elegidas).toEqual([segunda.id])
    expect(screen.getByLabelText("Tu respuesta a la pregunta 1", { selector: "textarea" })).toHaveValue("Lo entendí")
    await userEvent.click(screen.getByRole("button", { name: "Consigna" }))
    expect(screen.getByRole("complementary", { name: segunda.titulo })).toBeVisible()
    expect(screen.getByLabelText<HTMLTextAreaElement>("Datos de la entrega").value).toContain(`**Historia elegida:** ${segunda.titulo}`)
  })

  it("al volver con la tarea elegida arranca en la consigna, y las pestañas alternan sin desmontar nada", async () => {
    renderSdd({ estado: { ...vacio, elegidas: [primera.id] } })
    expect(screen.getByRole("button", { name: "Consigna" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("heading", { name: /^To Do/, hidden: true })).not.toBeVisible()

    await userEvent.click(screen.getByRole("button", { name: "Tablero" }))
    expect(screen.getByRole("heading", { name: /^To Do/ })).toBeVisible()
    expect(screen.getByRole("button", { name: "Tablero" })).toHaveAttribute("aria-pressed", "true")
  })

  it("el video de introducción se abre en un popup al llegar al tablero, no antes", async () => {
    localStorage.setItem(CLAVE, JSON.stringify({ ...vacio, introVista: false }))
    renderSdd()
    expect(screen.queryByRole("dialog", { name: "Video de introducción", hidden: true })).not.toBeInTheDocument()

    while (!screen.queryByRole("button", { name: "Ir al tablero" })) {
      await userEvent.click(screen.getByRole("button", { name: "Siguiente" }))
    }
    await userEvent.click(screen.getByRole("button", { name: "Ir al tablero" }))
    const popup = screen.getByRole("dialog", { name: "Video de introducción" })
    expect(popup).toHaveAttribute("open")
    expect(popup.querySelector("video")).toHaveAttribute("src", "/videos/03-sdd.mp4")
  })

  it("minimizado, el botón para volver a verlo sigue a mano en la pestaña Consigna", async () => {
    renderSdd({ estado: { ...vacio, elegidas: [primera.id] } })
    expect(screen.getByRole("button", { name: "Consigna" })).toHaveAttribute("aria-pressed", "true")
    const popup = screen.getByRole("dialog", { name: "Video de introducción" })
    await userEvent.click(within(popup).getByRole("button", { name: "Minimizar" }))
    expect(popup).not.toHaveAttribute("open")

    await userEvent.click(screen.getByRole("button", { name: /^Ver video de introducción/ }))
    expect(popup).toHaveAttribute("open")
  })
})

describe("Ejercicio 3 · la consigna", () => {
  const elegida = { ...vacio, elegidas: [primera.id] }

  it("la historia elegida queda al costado y en los datos de la entrega", async () => {
    renderSdd({ estado: elegida })
    expect(screen.getByRole("complementary", { name: primera.titulo })).toBeVisible()
    const datos = await screen.findByLabelText<HTMLTextAreaElement>("Datos de la entrega")
    expect(datos.value).toContain(`**Historia elegida:** ${primera.titulo}`)
  })

  it("invita al resumen de SDD en otra pestaña, y esa página existe", () => {
    renderSdd({ estado: elegida })
    const enlace = screen.getByRole("link", { name: "Ver resumen de SDD" })
    expect(enlace).toHaveAttribute("href", "/spec-driven-development")
    expect(enlace).toHaveAttribute("target", "_blank")

    render(<SddPage />, { wrapper: MemoryRouter })
    expect(screen.getByRole("heading", { name: "Dónde falla" })).toBeInTheDocument()
  })

  it("la captura se sube, se ve y se quita, sin bloquear nada", async () => {
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: () => "blob:captura" }))
    const fetchFalso = vi.fn(async (url: string, op?: RequestInit) => {
      if (url.endsWith("/captura") && !op?.method) return new Response(JSON.stringify({ error: "no hay" }), { status: 404 })
      if (url.endsWith("/captura")) return new Response("null", { status: 200 })
      return new Response("null", { status: 200 })
    })
    renderSdd({ estado: elegida })
    vi.stubGlobal("fetch", fetchFalso)
    await screen.findByLabelText("Datos de la entrega")

    const imagen = new File(["png"], "captura.png", { type: "image/png" })
    await userEvent.upload(document.querySelector<HTMLInputElement>('input[type="file"]')!, imagen)
    expect(await screen.findByRole("img", { name: "Tu captura de pantalla" })).toHaveAttribute("src", "blob:captura")
    const put = fetchFalso.mock.calls.find(([, op]) => op?.method === "PUT")!
    expect(put[0]).toBe("/ejercicios-api/03-sdd/captura")
    expect((put[1]!.headers as Record<string, string>)["Content-Type"]).toBe("image/png")

    await userEvent.click(screen.getByRole("button", { name: "Quitar" }))
    expect(screen.queryByRole("img", { name: "Tu captura de pantalla" })).not.toBeInTheDocument()
    expect(fetchFalso.mock.calls.some(([, op]) => op?.method === "DELETE")).toBe(true)
  })

  it("rechaza lo que no es una imagen sin llamar al servidor", async () => {
    renderSdd({ estado: elegida })
    await screen.findByLabelText("Datos de la entrega")
    const fetchFalso = vi.fn()
    vi.stubGlobal("fetch", fetchFalso)
    await userEvent.upload(document.querySelector<HTMLInputElement>('input[type="file"]')!, new File(["x"], "notas.txt", { type: "text/plain" }), {
      applyAccept: false,
    })
    expect(screen.getByText("Tiene que ser una imagen PNG, JPG o WebP.")).toBeInTheDocument()
    // La lectura inicial de la captura puede caer acá; lo que no tiene que haber es una subida.
    expect(fetchFalso.mock.calls.some(([, op]) => op?.method === "PUT")).toBe(false)
  })
})

describe("Ejercicio 3 · el cierre", () => {
  it("“Terminé” guarda, lo marca como terminado y Rocco felicita antes de volver a los ejercicios", async () => {
    const guardadas = { ejercicio: "03-sdd", guardado: "2026-10-30T12:00:00Z", general: [], respuestas: {} }
    const fetchFalso = renderSdd({ estado: { ...vacio, elegidas: [primera.id] }, respuestas: guardadas })
    const terminar = await screen.findByRole("button", { name: /Terminé/ })
    expect(terminar).toHaveAccessibleDescription(/cierra la actividad con Rocco/)
    await userEvent.click(terminar)
    expect(await screen.findByText(/^Rocco/)).toBeInTheDocument()
    expect(llamadas(fetchFalso)).toContain("PUT /ejercicios-api/03-sdd/respuestas")
    expect(JSON.parse(localStorage.getItem("ejercicios:terminados")!)).toContain("03-sdd")
    for (let i = 0; i < felicitacion.length; i++) {
      await userEvent.click(screen.getByRole("button", { name: /Siguiente|Volver a los ejercicios/ })) // completa
      expect(document.querySelector(".po-texto")!.textContent).toBe(felicitacion[i])
      if (i < felicitacion.length - 1) await userEvent.click(screen.getByRole("button", { name: "Siguiente" }))
    }
    await userEvent.click(screen.getByRole("button", { name: "Volver a los ejercicios" }))
    expect(screen.queryByText(/^Rocco/)).not.toBeInTheDocument()
  })
})
