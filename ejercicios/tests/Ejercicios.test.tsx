import { existsSync } from "node:fs"
import { join } from "node:path"
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import Ejercicios from "../app/Ejercicios"
import { armarRespuestasMd, conAnexosEnLinea, ejercicios, partirConsigna, partirPreguntas } from "../app/contenido"
import { HABILITA_METRICAS } from "../app/progreso"
import { ID_SDD } from "../app/tablero"
import { formatearTiempo } from "../app/Temporizador"
import { videosIntro } from "../app/videos"
import { renderConRuta, simularApi } from "../../tests/client/helpers"

const ejercicio = ejercicios[0]
const terminado = (id: string) => (JSON.parse(localStorage.getItem("ejercicios:terminados") ?? "[]") as string[]).includes(id)
const RUTA_API = `/ejercicios-api/${ejercicio.id}/respuestas`

const renderEjercicio = () =>
  renderConRuta(<Ejercicios />, { ruta: `/ejercicios/${ejercicio.id}`, patron: "/ejercicios/*" })

const renderDe = (e: (typeof ejercicios)[number]) => {
  // El 3 muestra su consigna recién con el 2 terminado y una historia tomada del tablero.
  if (e.id === "03-sdd") {
    localStorage.setItem("ejercicios:terminados", JSON.stringify([ejercicios[1].id]))
    localStorage.setItem("ejercicios:tablero-sdd", JSON.stringify({ introVista: true, elegidas: ["cancelar-sesion"], terminadas: [] }))
  }
  simularApi({ [`/ejercicios-api/${e.id}/respuestas`]: null })
  return renderConRuta(<Ejercicios />, { ruta: `/ejercicios/${e.id}`, patron: "/ejercicios/*" })
}

const textosDeLista = (diagrama: HTMLElement) =>
  within(diagrama)
    .getAllByRole("listitem")
    .map((li) => li.textContent?.replace(/\s+/g, " "))

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
    // waitFor reintenta la aserción entera: mientras busca las respuestas, la consigna se redibuja con otro árbol.
    await waitFor(() => expect(screen.getByRole("heading", { name: "A.3 ¿Se dispara?" })).toBeInTheDocument())
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

  it("el último ejercicio cierra la actividad con Rocco", async () => {
    const ultimo = ejercicios.at(-1)!
    // El 3 se ve recién con el 2 terminado y una historia tomada del tablero.
    localStorage.setItem("ejercicios:terminados", JSON.stringify([ejercicios[1].id]))
    localStorage.setItem("ejercicios:tablero-sdd", JSON.stringify({ introVista: true, elegidas: ["cancelar-sesion"], terminadas: [] }))
    simularApi({ [`/ejercicios-api/${ultimo.id}/respuestas`]: null })
    renderConRuta(<Ejercicios />, { ruta: `/ejercicios/${ultimo.id}`, patron: "/ejercicios/*" })
    expect(await screen.findByRole("button", { name: /Terminé/ })).toHaveAccessibleDescription(/cierra la actividad con Rocco/)
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

  it("el flujo SDD del ejercicio 3 se dibuja como diagrama, con una validación humana entre cada etapa", async () => {
    renderDe(ejercicios[2])
    const diagrama = await screen.findByRole("figure", { name: /spec-driven development/i })
    const nombres = ["Constitution", "Specify", "Clarify", "Plan", "Tasks", "Implement"]
    expect(textosDeLista(diagrama)).toEqual(nombres.map((n) => expect.stringContaining(n)))
    expect(within(diagrama).getAllByRole("img", { name: "validación humana" })).toHaveLength(nombres.length - 1)
    expect(screen.queryByText(/Constitution → Specify/)).not.toBeInTheDocument()
  })

  it("las etapas del ejercicio 3 se dibujan en orden, con qué revisar en cada una y un ✋ entre etapa y etapa", async () => {
    renderDe(ejercicios[2])
    const diagrama = await screen.findByRole("figure", { name: /etapas del flujo/i })
    const nombres = ["Constitution", "Specify", "Clarify", "Plan", "Tasks", "Implement"]
    expect(textosDeLista(diagrama)).toEqual(nombres.map((n) => expect.stringMatching(new RegExp(`^${n}.*Revisá:`))))
    expect(within(diagrama).getAllByRole("img", { name: "validación humana" })).toHaveLength(nombres.length - 1)
    expect(screen.getByText(/Podés pedirle a tu agente que te vaya guiando/)).toBeInTheDocument()
    expect(screen.getByText(/Recordá revisar antes de pasar a la siguiente etapa/)).toBeInTheDocument()
  })

  it("las validaciones entre etapas del desafío extra se dibujan como puertas", async () => {
    renderDe(ejercicios[2])
    const diagrama = await screen.findByRole("figure", { name: /validaciones entre etapas/i })
    expect(textosDeLista(diagrama)).toEqual([
      expect.stringMatching(/tasks.*¿leíste la constitution\?.*si no, no avanza/),
      expect.stringMatching(/plan.*¿la spec está aprobada\?.*si no, no avanza/),
      expect.stringMatching(/implement.*¿existe un plan para esto\?.*si no, no avanza/),
    ])
    expect(screen.queryByText(/tasks\s+→ ¿leíste/)).not.toBeInTheDocument()
  })

  it("la estructura del repo del ejercicio 1 se dibuja con las capas del servidor en orden", async () => {
    renderDe(ejercicios[0])
    const diagrama = await screen.findByRole("figure", { name: /estructura del repo/i })
    const carpetas = textosDeLista(diagrama)
    expect(carpetas).toEqual(["client/", "server/", "shared/", "data/", "tests/"].map((c) => expect.stringContaining(c)))
    expect(carpetas[1]).toMatch(/routes.*services.*repositories.*domain/)
    expect(screen.queryByText(/client\/\s+Vite/)).not.toBeInTheDocument()
  })

  // El del ejercicio 3 se abre con el tablero: lo cubre EjercicioSdd.test.tsx.
  it.each(ejercicios.filter((e) => e.id in videosIntro && e.id !== ID_SDD).map((e) => [e.id, e] as const))(
    "%s abre su video de introducción en un popup la primera vez, sin arrancarlo solo",
    async (id, e) => {
      renderDe(e)
      const popup = await screen.findByRole("dialog", { name: "Video de introducción" })
      expect(popup).toHaveAttribute("open")
      expect(within(popup).getByText(`Ejercicio ${e.numero}`)).toBeInTheDocument()
      expect(within(popup).getByRole("heading", { name: e.titulo })).toBeInTheDocument()
      const video = popup.querySelector("video")
      expect(video).toHaveAttribute("src", `/videos/${id}.mp4`)
      expect(video).toHaveAttribute("poster", `/videos/${id}.jpg`)
      expect(video).toHaveAttribute("controls")
      expect(video).not.toHaveAttribute("autoplay")
      expect(screen.queryByRole("button", { name: /^Ver video de introducción/ })).not.toBeInTheDocument()
    },
  )

  it("“Empezar el ejercicio” minimiza el video a un botón con su duración, que lo vuelve a abrir", async () => {
    renderDe(ejercicio)
    const popup = await screen.findByRole("dialog", { name: "Video de introducción" })
    const video = popup.querySelector("video")!
    const pausa = vi.spyOn(video, "pause").mockImplementation(() => {})

    await userEvent.click(within(popup).getByRole("button", { name: /Empezar el ejercicio/ }))
    expect(popup).not.toHaveAttribute("open")
    expect(pausa).toHaveBeenCalled()

    const mini = screen.getByRole("button", { name: /^Ver video de introducción/ })
    expect(mini).toHaveTextContent(videosIntro[ejercicio.id].duracion)
    await userEvent.click(mini)
    expect(popup).toHaveAttribute("open")

    await userEvent.click(within(popup).getByRole("button", { name: "Minimizar" }))
    expect(popup).not.toHaveAttribute("open")
  })

  it("cada vez que entra por “Ver consigna” el video se abre de nuevo, aunque lo haya minimizado", async () => {
    simularApi({ [RUTA_API]: null })
    renderConRuta(<Ejercicios />, { ruta: "/ejercicios", patron: "/ejercicios/*" })
    for (let vez = 0; vez < 2; vez++) {
      // El primero: el del ejercicio 1, siempre habilitado.
      await userEvent.click(screen.getAllByRole("link", { name: /Ver consigna/ })[0])
      const popup = await screen.findByRole("dialog", { name: "Video de introducción" })
      expect(popup).toHaveAttribute("open")
      await userEvent.click(within(popup).getByRole("button", { name: "Minimizar" }))
      await userEvent.click(screen.getByRole("link", { name: /Todos los ejercicios/ }))
    }
  })

  it("minimizado, el video va arriba de la barra de Guardar y Terminé, también al llegar al final de la página", async () => {
    renderDe(ejercicio)
    const popup = await screen.findByRole("dialog", { name: "Video de introducción" })
    await userEvent.click(within(popup).getByRole("button", { name: "Minimizar" }))
    const barra = (await screen.findByRole("button", { name: "Guardar respuestas" })).parentElement!
    const mini = screen.getByRole("button", { name: /^Ver video de introducción/ })
    let arriba = window.innerHeight - 83 // pegada abajo
    vi.spyOn(barra, "getBoundingClientRect").mockImplementation(() => ({ top: arriba, bottom: arriba + 71 }) as DOMRect)

    fireEvent.scroll(window)
    await waitFor(() => expect(mini.style.bottom).toBe(`${window.innerHeight - arriba + 12}px`))

    // Al final de la página la barra deja de estar pegada y sube con el contenido: el video la sigue.
    arriba = window.innerHeight - 260
    fireEvent.scroll(window)
    await waitFor(() => expect(mini.style.bottom).toBe(`${window.innerHeight - arriba + 12}px`))
  })

  it("al recargar la página el video se abre de nuevo", async () => {
    renderDe(ejercicio)
    const popup = await screen.findByRole("dialog", { name: "Video de introducción" })
    await userEvent.click(within(popup).getByRole("button", { name: "Minimizar" }))
    cleanup()

    renderDe(ejercicio)
    expect(await screen.findByRole("dialog", { name: "Video de introducción" })).toHaveAttribute("open")
  })

  it("los videos y sus portadas existen en client/public", () => {
    expect(Object.keys(videosIntro).length).toBeGreaterThan(0)
    for (const { src, poster } of Object.values(videosIntro)) {
      expect(existsSync(join("client/public", src)), src).toBe(true)
      expect(existsSync(join("client/public", poster)), poster).toBe(true)
    }
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
