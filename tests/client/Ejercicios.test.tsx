import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import Ejercicios from "../../ejercicios/app/Ejercicios"
import { armarRespuestasMd, conAnexosEnLinea, ejercicios, partirConsigna, partirPreguntas } from "../../ejercicios/app/contenido"
import { formatearTiempo } from "../../ejercicios/app/Temporizador"
import { renderConRuta, simularApi } from "./helpers"

const ejercicio = ejercicios[0]
const RUTA_API = `/ejercicios-api/${ejercicio.id}/respuestas`

const renderEjercicio = () =>
  renderConRuta(<Ejercicios />, { ruta: `/ejercicios/${ejercicio.id}`, patron: "/ejercicios/*" })

describe("Ejercicios · cómo se reparte la consigna", () => {
  it.each(ejercicios.map((e) => [e.id, e] as const))("%s: se muestra entera, sin perder ni repetir líneas", (_id, e) => {
    const { antes, preguntas, despues } = partirConsigna(e)
    expect(preguntas[0]).toBe(e.preguntas.desde)
    expect([...antes, ...preguntas, ...despues]).toEqual(e.consigna)

    const textos = conAnexosEnLinea(antes, e.anexos).flatMap((b) => (b.tipo === "markdown" ? [b.texto] : []))
    expect(textos.join("\n")).toBe(antes.join("\n"))
  })

  it.each(ejercicios.map((e) => [e.id, e] as const))("%s: cada pregunta numerada queda en su desplegable, sin perder líneas", (_id, e) => {
    const { preguntas } = partirConsigna(e)
    const bloques = partirPreguntas(preguntas)
    expect(bloques.flatMap((b) => b.lineas)).toEqual(preguntas)

    const numeros = bloques.flatMap((b) => (b.tipo === "pregunta" ? [Number(b.numero)] : []))
    expect(numeros).toEqual(numeros.map((_, i) => i + 1))
    for (const b of bloques) if (b.tipo === "pregunta") expect(b.titulo).not.toMatch(/\*\*/)
  })

  it("el prompt del ejercicio 1 aparece justo debajo de “Copiá el prompt…”", () => {
    const bloques = conAnexosEnLinea(partirConsigna(ejercicio).antes, ejercicio.anexos)
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
    expect(screen.getByText("Respondida")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Guardar respuestas" }))

    const [url, opciones] = fetchFalso.mock.calls.at(-1) as unknown as [string, RequestInit]
    expect(url).toBe(RUTA_API)
    expect(opciones.method).toBe("PUT")
    const cuerpo = JSON.parse(opciones.body as string)
    expect(cuerpo.respuestas).toEqual({ 1: "Listo" })
    expect(cuerpo.markdown).toContain("### 1. El ciclo\n\nListo")
    expect(cuerpo.markdown).toContain("### 2. Explorar antes de actuar\n\n_Sin responder._")
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
