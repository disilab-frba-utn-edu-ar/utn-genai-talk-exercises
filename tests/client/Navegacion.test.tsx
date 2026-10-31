import { readFileSync } from "node:fs"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router"
import App from "../../client/src/App"
import { ejercicios } from "../../ejercicios/app/contenido"
import setup from "../../ejercicios/setup.json"
import { habilidades, valentina } from "./fixtures"
import { simularApi } from "./helpers"

function renderApp(ruta: string) {
  simularApi({ "/api/habilidades": habilidades, "/api/mentoras": [valentina] })
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <App />
    </MemoryRouter>,
  )
}

describe("Navegación principal", () => {
  it.each(["/", "/ejercicios", "/ejercicios/01-observabilidad-con-hooks", "/no-existe"])(
    "%s: Mi perfil y Métricas están en el menú desde el principio, sin terminar ningún ejercicio",
    async (ruta) => {
      renderApp(ruta)
      const nav = await screen.findByRole("navigation", { name: "Principal" })
      expect(within(nav).getByRole("link", { name: "Mi perfil" })).toHaveAttribute("href", "/ejercicios/perfil")
      expect(within(nav).getByRole("link", { name: "Métricas" })).toHaveAttribute("href", "/metricas")
    },
  )

  it.each(["/", "/ejercicios", "/ejercicios/01-observabilidad-con-hooks", "/no-existe"])(
    "%s: el encabezado tiene los links a Mentoras y Ejercicios, sin Configurar entorno",
    async (ruta) => {
      renderApp(ruta)
      const nav = await screen.findByRole("navigation", { name: "Principal" })
      expect(within(nav).getByRole("link", { name: "Ejercicios" })).toHaveAttribute("href", "/ejercicios")
      expect(within(nav).queryByRole("link", { name: "Configurar entorno" })).not.toBeInTheDocument()
      expect(within(nav).getByRole("link", { name: "Mentoras" })).toHaveAttribute("href", "/")
    },
  )

  it.each(["/", "/ejercicios", "/ejercicios/01-observabilidad-con-hooks", "/no-existe"])(
    "%s: el encabezado enlaza a la UTN FRBA en una pestaña nueva",
    async (ruta) => {
      renderApp(ruta)
      const enlace = await within(await screen.findByRole("banner")).findByRole("link", { name: /UTN FRBA/ })
      expect(enlace).toHaveAttribute("href", "https://www.frba.utn.edu.ar")
      expect(enlace).toHaveAttribute("target", "_blank")
      expect(enlace).toHaveAttribute("rel", expect.stringContaining("noreferrer"))
      expect(enlace).toHaveAccessibleName(/abre en otra pestaña/)
    },
  )

  it("marca la sección actual", async () => {
    renderApp("/ejercicios")
    const nav = await screen.findByRole("navigation", { name: "Principal" })
    expect(within(nav).getByRole("link", { name: "Ejercicios" })).toHaveAttribute("aria-current", "page")
    expect(within(nav).getByRole("link", { name: "Mentoras" })).not.toHaveAttribute("aria-current")
  })

  it("en Mi perfil se marca Mi perfil y no Ejercicios", async () => {
    renderApp("/ejercicios/perfil")
    const nav = await screen.findByRole("navigation", { name: "Principal" })
    expect(within(nav).getByRole("link", { name: "Mi perfil" })).toHaveAttribute("aria-current", "page")
    expect(within(nav).getByRole("link", { name: "Ejercicios" })).not.toHaveAttribute("aria-current")
  })

  it("desde el inicio se llega a Ejercicios", async () => {
    renderApp("/")
    const nav = await screen.findByRole("navigation", { name: "Principal" })
    await userEvent.click(within(nav).getByRole("link", { name: "Ejercicios" }))
    expect(await screen.findByRole("heading", { level: 1, name: "Ejercicios" })).toBeInTheDocument()
  })
})

describe("Ejercicios (índice)", () => {
  it("lista los 3 ejercicios; sin progreso solo se abre el 1 y los demás muestran el candado", async () => {
    renderApp("/ejercicios")
    expect(ejercicios).toHaveLength(3)
    for (const e of ejercicios) {
      expect(await screen.findByRole("heading", { name: e.titulo })).toBeInTheDocument()
    }
    const enlaces = screen.getAllByRole("link", { name: /Ver consigna/ })
    expect(enlaces.map((a) => a.getAttribute("href"))).toEqual([`/ejercicios/${ejercicios[0].id}`])
    // Antes del 1, el paso 0: completar el perfil, con la misma tarjeta.
    const paso0 = screen.getAllByRole("article")[0]
    expect(within(paso0).getByRole("heading", { name: "Completá tu perfil" })).toBeInTheDocument()
    expect(within(paso0).getByRole("link", { name: /Completar perfil/ })).toHaveAttribute("href", "/ejercicios/perfil")
    expect(screen.getByText("Se habilita al terminar el ejercicio 1")).toBeInTheDocument()
    expect(screen.getByText("Se habilita al terminar el ejercicio 2")).toBeInTheDocument()
  })

  it("al terminar un ejercicio se abre el siguiente, y cada uno lleva a su consigna", async () => {
    localStorage.setItem("ejercicios:terminados", JSON.stringify([ejercicios[0].id, ejercicios[1].id]))
    renderApp("/ejercicios")
    await screen.findByRole("heading", { name: ejercicios[0].titulo })
    const enlaces = screen.getAllByRole("link", { name: /Ver consigna/ })
    expect(enlaces.map((a) => a.getAttribute("href"))).toEqual(ejercicios.map((e) => `/ejercicios/${e.id}`))
    expect(screen.queryByText(/Se habilita al terminar/)).not.toBeInTheDocument()
  })

  it("los ejercicios terminados llevan el tilde y los demás no", async () => {
    localStorage.setItem("ejercicios:terminados", JSON.stringify([ejercicios[0].id]))
    renderApp("/ejercicios")
    await screen.findByRole("heading", { name: ejercicios[0].titulo })
    const tarjetas = screen.getAllByRole("article").slice(1) // la primera es el paso 0
    expect(within(tarjetas[0]).getByRole("img", { name: "Terminado" })).toHaveTextContent("✓")
    expect(within(tarjetas[1]).queryByRole("img", { name: "Terminado" })).not.toBeInTheDocument()
  })

  it("arriba pide crear la rama del grupo y el aviso se va al confirmarlo", async () => {
    renderApp("/ejercicios")
    const aviso = await screen.findByRole("region", { name: "Rama del grupo" })
    expect(aviso).toHaveTextContent("git switch -c ejercicios/<nombre-de-grupo>")
    await userEvent.click(within(aviso).getByRole("button", { name: "Ya creamos la rama" }))
    expect(screen.queryByRole("region", { name: "Rama del grupo" })).not.toBeInTheDocument()
  })
})

describe("README", () => {
  it("la guía de setup del README es la misma que muestra la web (npm run docs:setup la regenera)", () => {
    const readme = readFileSync("README.md", "utf-8")
    const bloque = readme.match(/<!-- setup:inicio -->\n\n([\s\S]*?)\n\n<!-- setup:fin -->/)?.[1]
    expect(bloque).toBe(setup.markdown.join("\n"))
  })
})
