import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import Ejercicios from "../../ejercicios/app/Ejercicios"
import { armarRespuestasMd, conAnexosEnLinea, ejercicios, partirConsigna, partirPreguntas } from "../../ejercicios/app/contenido"
import { HABILITA_METRICAS } from "../../ejercicios/app/progreso"
import { formatearTiempo } from "../../ejercicios/app/Temporizador"
import { renderConRuta, simularApi } from "./helpers"

const ejercicio = ejercicios[0]
const terminado = (id: string) => (JSON.parse(localStorage.getItem("ejercicios:terminados") ?? "[]") as string[]).includes(id)
const RUTA_API = `/ejercicios-api/${ejercicio.id}/respuestas`

const renderEjercicio = () =>
  renderConRuta(<Ejercicios />, { ruta: `/ejercicios/${ejercicio.id}`, patron: "/ejercicios/*" })

describe("Ejercicios · cómo se reparte la consigna", () => {
  it.each(ejercicios.map((e) => [e.id, e] as const))("%s: se muestra entera, sin perder ni repetir líneas", (_id, e) => {
    const tramos = partirConsigna(e)
    expect(tramos.flatMap((t) => t.lineas)).toEqual(e.consigna)
    expect(tramos.filter((t) => t.tipo === "preguntas").map((t) => t.lineas[0])).toEqual(e.preguntas.map((p) => p.desde))

    for (const t of tramos.filter((t) => t.tipo === "consigna")) {
      const textos = conAnexosEnLinea(t.lineas, e.anexos).flatMap((b) => (b.tipo === "markdown" ? [b.texto] : []))
      expect(textos.join("\n")).toBe(t.lineas.join("\n"))
    }
  })

  it.each(ejercicios.map((e) => [e.id, e] as const))("%s: cada pregunta numerada queda en su desplegable, sin perder líneas", (_id, e) => {
    const numeros: number[] = []
    for (const t of partirConsigna(e).filter((t) => t.tipo === "preguntas")) {
      const bloques = partirPreguntas(t.lineas)
      expect(bloques.flatMap((b) => b.lineas)).toEqual(t.lineas)
      for (const b of bloques) if (b.tipo === "pregunta") numeros.push(Number(b.numero))
      for (const b of bloques) if (b.tipo === "pregunta") expect(b.titulo).not.toMatch(/\*\*/)
    }
    // Numeración corrida entre todos los tramos: las respuestas se guardan por número.
    expect(numeros).toEqual(numeros.map((_, i) => i + 1))
  })

  it("las preguntas van intercaladas: en el ejercicio 2 la primera está después de probar la skill", () => {
    const tramos = partirConsigna(ejercicios[1])
    const primera = tramos.findIndex((t) => t.tipo === "preguntas")
    expect(tramos[primera - 1].lineas).toContain("### A.3 ¿Se dispara?")
    expect(tramos.filter((t) => t.tipo === "preguntas").length).toBeGreaterThan(1)
  })

  it("el prompt del ejercicio 1 aparece justo debajo de “Copiá el prompt…”", () => {
    const bloques = conAnexosEnLinea(partirConsigna(ejercicio)[0].lineas, ejercicio.anexos)
    const i = bloques.findIndex((b) => b.tipo === "anexo")
    expect(bloques[i - 1]).toMatchObject({ texto: expect.stringMatching(/Copiá el prompt de .+ y mandalo\.$/) })
    expect(bloques[i]).toMatchObject({ anexo: { archivo: "prompt.md" } })
  })
})

describe("Ejercicios", () => {
  it("copia el prompt del ejercicio 1 literal, tal cual está en el JSON", async () => {
    const usuario = userEvent.setup()
    simularApi({ [RUTA_API]: null })
    renderEjercicio()
    await screen.findByLabelText("Datos de la entrega")

    const lineas = ejercicio.anexos[0].markdown
    const prompt = lineas.slice(lineas.indexOf("```text") + 1, lineas.lastIndexOf("```")).join("\n")

    await usuario.click(screen.getByRole("button", { name: "Copiar prompt" }))
    expect(await navigator.clipboard.readText()).toBe(prompt)
  })

  it("cada pregunta tiene su recuadro y al guardar manda las respuestas y el RESPUESTAS.md", async () => {
    const fetchFalso = simularApi({ [RUTA_API]: null })
    renderEjercicio()

    expect(await screen.findByLabelText("Datos de la entrega")).toHaveValue(ejercicio.plantillaRespuestas.join("\n"))

    await userEvent.click(screen.getByText("1. El ciclo"))
    await userEvent.type(screen.getByLabelText("Tu respuesta a la pregunta 1"), "Listo")
    expect(screen.getByText("Respondida", { selector: ".etiqueta" })).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Guardar respuestas" }))

    const [url, opciones] = fetchFalso.mock.calls.at(-1) as unknown as [string, RequestInit]
    expect(url).toBe(RUTA_API)
    expect(opciones.method).toBe("PUT")
    const cuerpo = JSON.parse(opciones.body as string)
    expect(cuerpo.respuestas).toEqual({ 1: "Listo" })
    expect(cuerpo.markdown).toContain("### 1. El ciclo\n\nListo")
    expect(cuerpo.markdown).toContain("### 2. Explorar antes de actuar\n\n_Sin responder._")
  })

  it("“Terminé” guarda, habilita Métricas y pasa al ejercicio 2, donde aparece la invitación al tablero", async () => {
    const guardadas = { ejercicio: ejercicio.id, guardado: "2026-10-28T12:00:00Z", general: [], respuestas: {} }
    const fetchFalso = simularApi({ [RUTA_API]: guardadas, [`/ejercicios-api/${ejercicios[1].id}/respuestas`]: null })
    renderEjercicio()

    expect(screen.queryByRole("link", { name: "Ver métricas" })).not.toBeInTheDocument()
    await userEvent.click(await screen.findByRole("button", { name: /Terminé/ }))

    const llamadas = fetchFalso.mock.calls as unknown as [string, RequestInit | undefined][]
    expect(llamadas.some(([url, op]) => url === RUTA_API && op?.method === "PUT")).toBe(true)
    expect(await screen.findByRole("heading", { name: "A.3 ¿Se dispara?" })).toBeInTheDocument()
    expect(terminado(HABILITA_METRICAS)).toBe(true)
    const metricas = screen.getByRole("link", { name: "Ver métricas" })
    expect(metricas).toHaveAttribute("href", "/metricas")
    expect(metricas).toHaveAttribute("target", "_blank")
  })

  it("sin terminar el ejercicio 1, el ejercicio 2 no invita a Métricas", async () => {
    simularApi({ [`/ejercicios-api/${ejercicios[1].id}/respuestas`]: null })
    renderConRuta(<Ejercicios />, { ruta: `/ejercicios/${ejercicios[1].id}`, patron: "/ejercicios/*" })
    await screen.findByLabelText("Datos de la entrega")
    expect(screen.queryByRole("link", { name: "Ver métricas" })).not.toBeInTheDocument()
  })

  it("si no se pudo guardar, “Terminé” se queda con el error a la vista y no lo marca como terminado", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, op?: RequestInit) =>
        op?.method === "PUT" ? new Response(JSON.stringify({ error: "Disco lleno" }), { status: 500 }) : new Response("null", { status: 200 }),
      ),
    )
    renderEjercicio()

    await userEvent.click(await screen.findByRole("button", { name: /Terminé/ }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Disco lleno")
    expect(screen.getByLabelText("Datos de la entrega")).toBeInTheDocument()
    expect(terminado(HABILITA_METRICAS)).toBe(false)
  })

  it("el último ejercicio termina y vuelve al índice", async () => {
    const ultimo = ejercicios.at(-1)!
    simularApi({ [`/ejercicios-api/${ultimo.id}/respuestas`]: null })
    renderConRuta(<Ejercicios />, { ruta: `/ejercicios/${ultimo.id}`, patron: "/ejercicios/*" })
    expect(await screen.findByRole("button", { name: /Terminé/ })).toHaveAccessibleDescription(/vuelve al índice/)
  })

  it("“Ver aplicación” es un botón que abre la app en una pestaña nueva", async () => {
    simularApi({ [RUTA_API]: null })
    renderEjercicio()
    const [enlace] = await screen.findAllByRole("link", { name: "Ver aplicación" })
    expect(enlace).toHaveClass("boton")
    expect(enlace).toHaveAttribute("target", "_blank")
    expect(enlace).toHaveAttribute("href", "http://localhost:5173")
  })

  it("un respuestas.json con el formato anterior (un solo texto) no se pierde", async () => {
    simularApi({ [RUTA_API]: { ejercicio: ejercicio.id, guardado: "2026-10-20T00:00:00Z", respuestas: ["# Viejo", "1. algo"] } })
    renderEjercicio()
    expect(await screen.findByLabelText("Datos de la entrega")).toHaveValue("# Viejo\n1. algo")
  })

  it("el temporizador arranca con la duración del ejercicio y se puede iniciar", async () => {
    simularApi({ [RUTA_API]: null })
    renderEjercicio()
    expect(screen.getByRole("timer")).toHaveTextContent(formatearTiempo(ejercicio.minutos * 60_000))
    await userEvent.click(screen.getByRole("button", { name: "Iniciar" }))
    expect(screen.getByRole("button", { name: "Pausar" })).toBeInTheDocument()
  })

  it("el ciclo agéntico del ejercicio 1 se dibuja como diagrama, no como ASCII", async () => {
    simularApi({ [RUTA_API]: null })
    renderEjercicio()
    const diagrama = await screen.findByRole("figure", { name: /ciclo agéntico/i })
    for (const hook of ["UserPromptSubmit", "PreToolUse", "PostToolUse", "Stop"]) expect(diagrama).toHaveTextContent(hook)
    expect(screen.queryByText(/──prompt──▶/)).not.toBeInTheDocument()
  })
})

describe("Ejercicios · RESPUESTAS.md y temporizador", () => {
  it("el RESPUESTAS.md tiene los datos generales, los títulos de sección y cada respuesta", () => {
    const md = armarRespuestasMd(ejercicio, { general: "# Ejercicio 1", porPregunta: { 7: "Mucho contexto" } })
    expect(md.startsWith("# Ejercicio 1\n\n")).toBe(true)
    expect(md).toContain("## Parte B — Lo que pensás\n\n### 7. Contexto\n\nMucho contexto")
  })

  it("formatea el tiempo restante", () => {
    expect(formatearTiempo(3_725_000)).toBe("1:02:05")
    expect(formatearTiempo(125_000)).toBe("2:05")
    expect(formatearTiempo(-5_000)).toBe("0:00")
  })
})
