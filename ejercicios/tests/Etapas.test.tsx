import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  ejercicios,
  lineasDePantalla,
  migrarRespuestas,
  pantallasDe,
  partirSubpreguntas,
  preguntasPorCajas,
  type Ejercicio,
  type PreguntaPorCajas,
} from "../app/contenido"
import Ejercicios from "../app/Ejercicios"
import { renderConRuta, simularApi } from "../../tests/client/helpers"

const [primero, segundo] = ejercicios
const conEtapas = ejercicios.filter((e) => e.etapas)
const RUTA_RESPUESTAS = `/ejercicios-api/${primero.id}/respuestas`
const RUTA_PERFIL = "/ejercicios-api/perfil"

const avance = (e: Ejercicio) => JSON.parse(localStorage.getItem(`ejercicios:etapas:${e.id}`) ?? "null")
const preguntasDe = (e: Ejercicio) => preguntasPorCajas(e).filter((b): b is { tipo: "pregunta" } & PreguntaPorCajas => b.tipo === "pregunta")

async function abrir(e: Ejercicio = primero, rutas: Record<string, unknown> = {}) {
  const fetchFalso = simularApi({ [`/ejercicios-api/${e.id}/respuestas`]: null, ...rutas })
  renderConRuta(<Ejercicios />, { ruta: `/ejercicios/${e.id}`, patron: "/ejercicios/*" })
  // Mientras busca las respuestas el marco se dibuja sin editor; se espera a que esté.
  await screen.findByRole("group", { name: "Guardar y terminar", hidden: true })
  return fetchFalso
}

const pestana = (nombre: RegExp) => within(screen.getByRole("navigation", { name: "Secciones del ejercicio" })).getByRole("button", { name: nombre })
/** El título del marco a la vista (el diálogo del video tiene su propio título). */
const tituloPantalla = () => document.querySelector<HTMLElement>(".etapa-marco:not([hidden]) .etapa-titulo")!
const siguiente = () => userEvent.click(screen.getByRole("button", { name: /Siguiente|Ir a las preguntas/ }))

describe("Etapas · los cortes de cada consigna", () => {
  it("los ejercicios 1 y 2 van por etapas; el 3 sigue con la consigna corrida", () => {
    expect(conEtapas.map((e) => e.id)).toEqual([primero.id, segundo.id])
    expect(ejercicios[2].etapas).toBeUndefined()
  })

  it.each(conEtapas.map((e) => [e.id, e] as const))("%s: tres etapas en orden, cada una con pantallas", (_id, e) => {
    expect(e.etapas!.map((et) => et.nombre)).toEqual(["Contexto técnico", "Contexto del ejercicio", "Qué tenés que hacer"])
    for (const etapa of e.etapas!) {
      expect(etapa.pantallas.length).toBeGreaterThan(0)
      expect(etapa.bajada).not.toBe("")
    }
  })

  it.each(conEtapas.map((e) => [e.id, e] as const))("%s: cada pantalla corta líneas que existen, o muestra un anexo que existe", (_id, e) => {
    for (const p of pantallasDe(e)) {
      if (p.anexo) expect(e.anexos.map((a) => a.titulo), p.titulo).toContain(p.anexo)
      else expect(lineasDePantalla(e, p).length, p.titulo).toBeGreaterThan(0)
    }
    // Los checks son la clave de lo tildado: no se pueden repetir.
    const checks = pantallasDe(e).flatMap((p) => (p.check ? [p.check] : []))
    expect(new Set(checks).size).toBe(checks.length)
  })

  it("una pantalla con un corte que no existe avisa cuál línea falta", () => {
    expect(() => lineasDePantalla(primero, { titulo: "Rota", desde: "## No existe" })).toThrow(/## No existe/)
  })
})

describe("Etapas · se desbloquean en orden", () => {
  it("arranca en la primera pantalla, con las etapas 2 y 3 bloqueadas y las preguntas abiertas", async () => {
    await abrir()
    expect(tituloPantalla()).toHaveTextContent(pantallasDe(primero)[0].titulo)
    expect(pestana(/Contexto técnico/)).toHaveAttribute("aria-pressed", "true")
    expect(pestana(/Contexto del ejercicio/)).toBeDisabled()
    expect(pestana(/Contexto del ejercicio/)).toHaveAccessibleName(/se desbloquea al terminar la etapa 1/)
    expect(pestana(/Qué tenés que hacer/)).toBeDisabled()
    expect(pestana(/^Preguntas/)).toBeEnabled()
  })

  it("Siguiente avanza pantalla por pantalla; al terminar una etapa se habilita la siguiente", async () => {
    await abrir()
    const pantallas = pantallasDe(primero)
    const primeraDeLa2 = pantallas.findIndex((p) => p.etapa === 1)
    for (let i = 1; i <= primeraDeLa2; i++) {
      await siguiente()
      expect(tituloPantalla()).toHaveTextContent(pantallas[i].titulo)
    }
    expect(pestana(/Contexto del ejercicio/)).toBeEnabled()
    expect(pestana(/Contexto del ejercicio/)).toHaveAttribute("aria-pressed", "true")
    expect(pestana(/Qué tenés que hacer/)).toBeDisabled()
    expect(avance(primero)).toMatchObject({ pos: primeraDeLa2, alcanzada: primeraDeLa2 })
  })

  it("Anterior vuelve sin perder lo alcanzado, y se puede saltar a una etapa ya vista", async () => {
    await abrir()
    await siguiente()
    await siguiente()
    await userEvent.click(screen.getByRole("button", { name: /Anterior/ }))
    expect(tituloPantalla()).toHaveTextContent(pantallasDe(primero)[1].titulo)
    expect(avance(primero)).toMatchObject({ pos: 1, alcanzada: 2 })
  })

  it("las flechas del teclado pasan de pantalla, pero no mientras se escribe", async () => {
    await abrir()
    await userEvent.keyboard("{ArrowRight}")
    expect(tituloPantalla()).toHaveTextContent(pantallasDe(primero)[1].titulo)
    await userEvent.keyboard("{ArrowLeft}")
    expect(tituloPantalla()).toHaveTextContent(pantallasDe(primero)[0].titulo)

    await userEvent.click(pestana(/^Preguntas/))
    const caja = screen.getAllByRole("textbox")[0]
    caja.focus()
    await userEvent.keyboard("{ArrowRight}")
    expect(screen.getByRole("heading", { level: 2, name: "Preguntas" })).toBeVisible()
  })

  it("lo bloqueado no se puede abrir saltando: la posición guardada no pasa de lo alcanzado", async () => {
    localStorage.setItem(`ejercicios:etapas:${primero.id}`, JSON.stringify({ pos: 7, alcanzada: 1, checks: [] }))
    await abrir()
    expect(tituloPantalla()).toHaveTextContent(pantallasDe(primero)[0].titulo)
  })
})

describe("Etapas · preguntas", () => {
  it("están siempre abiertas, desde la primera pantalla, y vuelven a la consigna donde estaba", async () => {
    await abrir()
    await siguiente()
    await userEvent.click(pestana(/^Preguntas/))
    expect(screen.getByRole("heading", { level: 2, name: "Preguntas" })).toBeVisible()
    await userEvent.click(pestana(/Contexto técnico/))
    expect(tituloPantalla()).toHaveTextContent(pantallasDe(primero)[1].titulo)
  })

  it("una caja por sub-pregunta: «El ciclo» tiene dos, con su avance", async () => {
    localStorage.setItem(`ejercicios:etapas:${primero.id}`, JSON.stringify({ pos: "preguntas", alcanzada: 0, checks: [] }))
    await abrir()
    const ciclo = screen.getByRole("region", { name: "1. El ciclo" })
    const cajas = within(ciclo).getAllByRole("textbox")
    expect(cajas).toHaveLength(2)
    expect(within(ciclo).getByText("0/2")).toBeInTheDocument()
    await userEvent.type(cajas[1], "Bash")
    expect(within(ciclo).getByText("1/2")).toBeInTheDocument()
    expect(pestana(/^Preguntas/)).toHaveTextContent("1/")
  })

  it("el ejercicio 1 tiene las siete preguntas acordadas, con «Riesgos» en una sola caja", () => {
    const preguntas = preguntasDe(primero)
    expect(preguntas.map((p) => `${p.numero}. ${p.titulo}`)).toEqual([
      "1. El ciclo",
      "2. Explorar antes de actuar",
      "3. Comandos de terminal",
      "4. Errores y reintentos",
      "5. Contexto",
      "6. Hooks como control",
      "7. Riesgos",
    ])
    const riesgos = preguntas.at(-1)!
    expect(riesgos.cajas).toHaveLength(1)
    expect(riesgos.cajas[0].texto.replace(/\s+/g, " ")).toBe(
      "¿Qué riesgos encontrás a la hora de utilizar hooks en agentes de código? Pensá en casos como acciones a realizar, requests, scripts ejecutables, logs o tiempo de procesamiento, así como la gestión de recursos.",
    )
  })

  it.each(conEtapas.map((e) => [e.id, e] as const))("%s: preguntas numeradas de corrido y cada caja con su clave", (_id, e) => {
    const preguntas = preguntasDe(e)
    expect(preguntas.map((p) => Number(p.numero))).toEqual(preguntas.map((_, i) => i + 1))
    for (const p of preguntas) expect(p.cajas.map((c) => c.clave)).toEqual(p.cajas.map((_, j) => `${p.numero}.${j + 1}`))
  })

  it("separa la introducción, cada sub-pregunta (con sus líneas de continuación) y la pista", () => {
    const partes = partirSubpreguntas("Intro de la pregunta.\n- Primera\n  que sigue acá\n- Segunda\n\n> Pista: mirá el log.")
    expect(partes).toEqual({ intro: "Intro de la pregunta.", subs: ["Primera\nque sigue acá", "Segunda"], pista: "Pista: mirá el log." })
    expect(partirSubpreguntas("Sin viñetas.")).toEqual({ intro: "", subs: ["Sin viñetas."], pista: "" })
  })

  it("una respuesta guardada antes de las cajas pasa a la primera caja de su pregunta", () => {
    expect(migrarRespuestas(primero, { 2: "Vieja", "3.1": "Nueva" })).toEqual({ "2.1": "Vieja", "3.1": "Nueva" })
  })

  it("al final, Modelo y Agente en dos cajas: se guardan en el perfil y en el RESPUESTAS.md", async () => {
    localStorage.setItem(`ejercicios:etapas:${primero.id}`, JSON.stringify({ pos: "preguntas", alcanzada: 0, checks: [] }))
    const fetchFalso = await abrir(primero, { [RUTA_PERFIL]: { nombre: "Los Hooks", modelo: "Sonnet", agente: "", integrantes: [], comentario: "", puntaje: null, ejercicios: {} } })
    const cierre = screen.getByRole("region", { name: "Para cerrar" })
    expect(within(cierre).getByLabelText("Modelo")).toHaveAttribute("placeholder", "Sonnet")
    await userEvent.type(within(cierre).getByLabelText("Agente"), "Claude Code")
    await userEvent.click(screen.getByRole("button", { name: "Guardar respuestas" }))

    const llamadas = fetchFalso.mock.calls as unknown as [string, RequestInit | undefined][]
    await waitFor(() => expect(llamadas.some(([url, op]) => url === RUTA_RESPUESTAS && op?.method === "PUT")).toBe(true))
    const perfil = JSON.parse(llamadas.find(([url, op]) => url === RUTA_PERFIL && op?.method === "PUT")![1]!.body as string)
    expect(perfil.ejercicios[primero.id]).toMatchObject({ agente: "Claude Code", modelo: "" })
    const md = JSON.parse(llamadas.find(([url, op]) => url === RUTA_RESPUESTAS && op?.method === "PUT")![1]!.body as string).markdown
    expect(md).toContain("**Nombre:** Los Hooks")
    expect(md).toContain("## Para cerrar\n\n**Modelo:** Sonnet\n\n**Agente:** Claude Code")
  })

  it("los datos de la entrega ya no se piden en las plantillas: van en Mi perfil", () => {
    for (const e of ejercicios) {
      expect(e.plantillaRespuestas.join("\n")).not.toMatch(/\*\*(Nombre|Agente y modelo|¿Interviniste)/)
    }
  })
})

describe("Etapas · checks", () => {
  it("cada pantalla con check lo muestra en su pie; tildado ahí, aparece tildado en la hoja", async () => {
    await abrir()
    const pantallas = pantallasDe(primero)
    const conCheck = pantallas.findIndex((p) => p.check)
    for (let i = 0; i < conCheck; i++) await siguiente()
    const check = screen.getByRole("checkbox", { name: pantallas[conCheck].check })
    await userEvent.click(check)
    expect(check).toBeChecked()

    const total = pantallas.filter((p) => p.check && !/^Opcional/.test(p.check)).length
    await userEvent.click(screen.getByRole("button", { name: `Hoja de checks · 1/${total}` }))
    const hoja = screen.getByRole("dialog", { name: `Hoja de checks · Ejercicio ${primero.numero}` })
    expect(within(hoja).getByRole("checkbox", { name: pantallas[conCheck].check })).toBeChecked()
  })

  it("en la hoja se tilda igual, y «Ir» lleva a esa pantalla; las bloqueadas no tienen «Ir»", async () => {
    await abrir()
    const pantallas = pantallasDe(primero)
    await userEvent.click(screen.getByRole("button", { name: /Hoja de checks/ }))
    const hoja = screen.getByRole("dialog", { name: /Hoja de checks/ })
    const primerCheck = pantallas.find((p) => p.check)!
    await userEvent.click(within(hoja).getByRole("checkbox", { name: primerCheck.check }))
    expect(avance(primero).checks).toEqual([primerCheck.check])
    // Solo la primera pantalla está alcanzada: ninguna con check se puede abrir todavía.
    expect(within(hoja).queryByRole("button", { name: `Ir a «${primerCheck.titulo}»` })).not.toBeInTheDocument()
    expect(within(hoja).getAllByText("Pantalla bloqueada").length).toBeGreaterThan(0)

    await userEvent.click(within(hoja).getByRole("button", { name: "Ir a las preguntas" }))
    expect(screen.queryByRole("dialog", { name: /Hoja de checks/ })).not.toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Preguntas" })).toBeVisible()
  })
})
