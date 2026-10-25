import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import Ejercicios from "../../ejercicios/app/Ejercicios"
import { conAnexosEnLinea, ejercicios, partirConsigna } from "../../ejercicios/app/contenido"
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

  it("arranca con la plantilla de respuestas y la guarda con PUT", async () => {
    const fetchFalso = simularApi({ [RUTA_API]: null })
    renderEjercicio()

    const editor = await screen.findByLabelText("Tus respuestas")
    expect(editor).toHaveValue(ejercicio.plantillaRespuestas.join("\n"))

    await userEvent.type(editor, "Listo")
    await userEvent.click(screen.getByRole("button", { name: "Guardar respuestas" }))

    const [url, opciones] = fetchFalso.mock.calls.at(-1) as unknown as [string, RequestInit]
    expect(url).toBe(RUTA_API)
    expect(opciones.method).toBe("PUT")
    expect(JSON.parse(opciones.body as string).respuestas).toBe(ejercicio.plantillaRespuestas.join("\n") + "Listo")
  })
})
