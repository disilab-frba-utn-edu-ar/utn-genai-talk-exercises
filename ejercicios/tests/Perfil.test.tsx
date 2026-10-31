import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ejercicios, pantallasDe } from "../app/contenido"
import Ejercicios from "../app/Ejercicios"
import { datosDeEntregaMd, normalizarPerfil, perfilVacio } from "../app/perfil"
import { renderConRuta, simularApi } from "../../tests/client/helpers"

const RUTA_PERFIL = "/ejercicios-api/perfil"
const [primero] = ejercicios

const sinRespuestas = Object.fromEntries(ejercicios.map((e) => [`/ejercicios-api/${e.id}/respuestas`, null]))

async function abrirPerfil(perfil: unknown = null, extra: Record<string, unknown> = {}) {
  const fetchFalso = simularApi({ [RUTA_PERFIL]: perfil, ...sinRespuestas, ...extra })
  renderConRuta(<Ejercicios />, { ruta: "/ejercicios/perfil", patron: "/ejercicios/*" })
  await screen.findByLabelText("Nombre personal o del equipo")
  return fetchFalso
}

const perfilGuardado = (fetchFalso: ReturnType<typeof simularApi>) => {
  const llamada = (fetchFalso.mock.calls as unknown as [string, RequestInit | undefined][]).find(([url, op]) => url === RUTA_PERFIL && op?.method === "PUT")
  return llamada ? JSON.parse(llamada[1]!.body as string) : undefined
}

describe("Mi perfil", () => {
  it("se llega desde el índice de ejercicios", async () => {
    simularApi({ [RUTA_PERFIL]: null, ...sinRespuestas })
    renderConRuta(<Ejercicios />, { ruta: "/ejercicios", patron: "/ejercicios/*" })
    await userEvent.click(screen.getByRole("link", { name: /Mi perfil/ }))
    expect(await screen.findByRole("heading", { level: 1, name: "Mi perfil" })).toBeInTheDocument()
  })

  it("nombre, integrantes (agregar y quitar), modelo y agente generales, y se guarda en perfil.json", async () => {
    const fetchFalso = await abrirPerfil()
    await userEvent.type(screen.getByLabelText("Nombre personal o del equipo"), "Los Hooks Felices")
    await userEvent.click(screen.getByRole("button", { name: "+ Agregar integrante" }))
    await userEvent.type(screen.getByLabelText("Integrante 1"), "Ana")
    await userEvent.click(screen.getByRole("button", { name: "+ Agregar integrante" }))
    await userEvent.type(screen.getByLabelText("Integrante 2"), "Beto")
    await userEvent.click(screen.getByRole("button", { name: "Quitar a Ana" }))
    // Uno vacío, recién agregado, no se guarda.
    await userEvent.click(screen.getByRole("button", { name: "+ Agregar integrante" }))
    await userEvent.type(screen.getByLabelText("Modelo que usaron en general"), "Sonnet")
    await userEvent.type(screen.getByLabelText("Agente que usaron en general"), "Claude Code")
    expect(screen.getByRole("status")).toHaveTextContent("Hay cambios sin guardar.")

    await userEvent.click(screen.getByRole("button", { name: "Guardar perfil" }))
    await waitFor(() => expect(perfilGuardado(fetchFalso)).toBeDefined())
    expect(perfilGuardado(fetchFalso)).toMatchObject({ nombre: "Los Hooks Felices", integrantes: ["Beto"], modelo: "Sonnet", agente: "Claude Code" })
    expect(await screen.findByRole("status")).toHaveTextContent("Perfil guardado")
  })

  it("por ejercicio: modelo y agente (con los generales de ejemplo), si intervinieron y su feedback", async () => {
    const fetchFalso = await abrirPerfil({ ...perfilVacio(), modelo: "Sonnet" })
    const tarjeta = screen.getByRole("article", { name: `Ejercicio 1 · ${primero.titulo}` })
    expect(within(tarjeta).getByLabelText("Modelo")).toHaveAttribute("placeholder", "Sonnet")
    await userEvent.type(within(tarjeta).getByLabelText("Agente"), "Codex")
    await userEvent.click(within(tarjeta).getByRole("button", { name: "Sí" }))
    await userEvent.type(within(tarjeta).getByLabelText("Cuándo y por qué"), "Corté un npm run seed")
    await userEvent.type(within(tarjeta).getByLabelText("Feedback de este ejercicio"), "Muy claro")
    await userEvent.click(screen.getByRole("button", { name: "Guardar perfil" }))

    await waitFor(() => expect(perfilGuardado(fetchFalso)).toBeDefined())
    expect(perfilGuardado(fetchFalso).ejercicios[primero.id]).toEqual({
      modelo: "",
      agente: "Codex",
      intervino: "si",
      intervencion: "Corté un npm run seed",
      feedback: "Muy claro",
    })
  })

  it("muestra el avance de cada ejercicio: pantallas, checks y preguntas respondidas", async () => {
    const pantallas = pantallasDe(primero)
    const checks = pantallas.filter((p) => p.check).map((p) => p.check!)
    localStorage.setItem(`ejercicios:etapas:${primero.id}`, JSON.stringify({ pos: 3, alcanzada: 3, checks: checks.slice(0, 2) }))
    await abrirPerfil(null, {
      [`/ejercicios-api/${primero.id}/respuestas`]: { ejercicio: primero.id, guardado: "", general: [], respuestas: { "1.1": ["12"], "1.2": ["Bash"] } },
    })
    const tarjeta = screen.getByRole("article", { name: `Ejercicio 1 · ${primero.titulo}` })
    expect(within(tarjeta).getByText("Pantallas").parentElement).toHaveTextContent(`4/${pantallas.length}`)
    expect(within(tarjeta).getByText("Checks").parentElement).toHaveTextContent(/^Checks2\//)
    await waitFor(() => expect(within(tarjeta).getByText("Preguntas").parentElement).toHaveTextContent(/^Preguntas2\//))
    // El 3 no tiene etapas: solo preguntas.
    const tercero = screen.getByRole("article", { name: new RegExp(`Ejercicio 3`) })
    expect(within(tercero).queryByText("Pantallas")).not.toBeInTheDocument()
  })

  it("feedback general: un puntaje de 1 a 5 y comentarios", async () => {
    const fetchFalso = await abrirPerfil()
    const puntaje = screen.getByRole("group", { name: /Qué tan útiles/ })
    await userEvent.click(within(puntaje).getByRole("button", { name: "4" }))
    expect(within(puntaje).getByRole("button", { name: "4" })).toHaveAttribute("aria-pressed", "true")
    await userEvent.type(screen.getByLabelText("Comentarios generales"), "Gracias")
    await userEvent.click(screen.getByRole("button", { name: "Guardar perfil" }))
    await waitFor(() => expect(perfilGuardado(fetchFalso)).toMatchObject({ puntaje: 4, comentario: "Gracias" }))
  })

  it("si no se pudo guardar, lo dice y deja todo como estaba", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, op?: RequestInit) =>
        op?.method === "PUT" ? new Response(JSON.stringify({ error: "Disco lleno" }), { status: 500 }) : new Response("null", { status: 200 }),
      ),
    )
    renderConRuta(<Ejercicios />, { ruta: "/ejercicios/perfil", patron: "/ejercicios/*" })
    await userEvent.type(await screen.findByLabelText("Nombre personal o del equipo"), "Ana")
    await userEvent.click(screen.getByRole("button", { name: "Guardar perfil" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("Disco lleno")
    expect(screen.getByLabelText("Nombre personal o del equipo")).toHaveValue("Ana")
  })
})

describe("Mi perfil · datos", () => {
  it("un perfil.json roto o de otra versión no rompe la página", () => {
    expect(normalizarPerfil(null)).toEqual(perfilVacio())
    expect(normalizarPerfil({ nombre: 3, integrantes: ["Ana", 5], puntaje: 9, ejercicios: { x: { intervino: "tal vez" } } })).toEqual({
      ...perfilVacio(),
      integrantes: ["Ana"],
      ejercicios: { x: { modelo: "", agente: "", intervino: "", intervencion: "", feedback: "" } },
    })
  })

  it("los datos de la entrega del RESPUESTAS.md salen del perfil", () => {
    const perfil = { ...perfilVacio(), nombre: "Los Hooks", integrantes: ["Ana", " "], ejercicios: { [primero.id]: { modelo: "", agente: "", intervino: "si" as const, intervencion: "Una vez.", feedback: "" } } }
    expect(datosDeEntregaMd(perfil, primero.id)).toBe("**Nombre:** Los Hooks\n**Integrantes:** Ana\n**¿Intervinieron durante la tarea?** Sí. Una vez.")
  })
})
