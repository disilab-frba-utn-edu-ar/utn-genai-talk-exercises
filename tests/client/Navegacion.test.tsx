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
  it.each(["/", "/ejercicios", "/configurar-entorno", "/ejercicios/01-observabilidad-con-hooks", "/no-existe"])(
    "%s: el encabezado siempre muestra el link a Métricas",
    async (ruta) => {
      renderApp(ruta)
      const nav = await screen.findByRole("navigation", { name: "Principal" })
      expect(within(nav).getByRole("link", { name: "Métricas" })).toHaveAttribute("href", "/metricas")
    },
  )

  it.each(["/", "/ejercicios", "/configurar-entorno", "/ejercicios/01-observabilidad-con-hooks", "/no-existe"])(
    "%s: el encabezado tiene los links a Ejercicios y Configurar entorno",
    async (ruta) => {
      renderApp(ruta)
      const nav = await screen.findByRole("navigation", { name: "Principal" })
      expect(within(nav).getByRole("link", { name: "Ejercicios" })).toHaveAttribute("href", "/ejercicios")
      expect(within(nav).getByRole("link", { name: "Configurar entorno" })).toHaveAttribute("href", "/configurar-entorno")
      expect(within(nav).getByRole("link", { name: "Mentoras" })).toHaveAttribute("href", "/")
    },
  )

  it.each(["/", "/ejercicios", "/configurar-entorno", "/ejercicios/01-observabilidad-con-hooks", "/no-existe"])(
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
    renderApp("/configurar-entorno")
    const nav = await screen.findByRole("navigation", { name: "Principal" })
    expect(within(nav).getByRole("link", { name: "Configurar entorno" })).toHaveAttribute("aria-current", "page")
    expect(within(nav).getByRole("link", { name: "Ejercicios" })).not.toHaveAttribute("aria-current")
  })

  it("desde el inicio se llega a Ejercicios y a Configurar entorno", async () => {
    renderApp("/")
    const nav = await screen.findByRole("navigation", { name: "Principal" })
    await userEvent.click(within(nav).getByRole("link", { name: "Ejercicios" }))
    expect(await screen.findByRole("heading", { level: 1, name: "Ejercicios" })).toBeInTheDocument()
    await userEvent.click(within(nav).getByRole("link", { name: "Configurar entorno" }))
    expect(await screen.findByRole("heading", { level: 1, name: setup.titulo })).toBeInTheDocument()
  })
})

describe("Ejercicios (índice)", () => {
  it("lista los 3 ejercicios y cada uno lleva a su consigna", async () => {
    renderApp("/ejercicios")
    expect(ejercicios).toHaveLength(3)
    for (const e of ejercicios) {
      expect(await screen.findByRole("heading", { name: e.titulo })).toBeInTheDocument()
    }
    const enlaces = screen.getAllByRole("link", { name: /Ver consigna/ })
    expect(enlaces.map((a) => a.getAttribute("href"))).toEqual(ejercicios.map((e) => `/ejercicios/${e.id}`))
  })

  it("enlaza a la guía de setup desde la introducción", async () => {
    renderApp("/ejercicios")
    const enlaces = await screen.findAllByRole("link", { name: "Configurar entorno" })
    expect(enlaces.some((a) => a.getAttribute("href") === "/configurar-entorno" && !a.closest("nav"))).toBe(true)
  })
})

describe("Configurar entorno", () => {
  it("muestra los pasos en orden con los comandos de Windows", async () => {
    renderApp("/configurar-entorno")
    expect(await screen.findByRole("heading", { level: 1, name: setup.titulo })).toBeInTheDocument()

    const pasos = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)
    expect(pasos).toEqual([
      "1. Requisitos",
      "2. Instalar el proyecto",
      "3. Instalar un agente",
      "4. Verificar",
      "5. Antes del ejercicio 2",
      "6. Antes del ejercicio 3",
    ])

    for (const comando of [
      "winget install OpenJS.NodeJS.LTS",
      "winget install Git.Git",
      "Set-ExecutionPolicy -Scope CurrentUser RemoteSigned",
      "irm https://claude.ai/install.ps1 | iex",
      "curl -fsSL https://claude.ai/install.sh | bash",
      "brew install node@22 git",
      "nvm install 22",
      "sudo apt install git",
      "npm i -g cline",
      "uv tool install specify-cli",
      "uv python install 3.12",
      "npm i -g @openai/codex",
      "npm test",
      "npm run dev",
    ]) {
      expect(screen.getAllByText(new RegExp(comando.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), { selector: "code" }).length).toBeGreaterThan(0)
    }
  })

  it("enlaza a la documentación de Cline, uv y Spec Kit", async () => {
    renderApp("/configurar-entorno")
    await screen.findByRole("heading", { level: 1, name: setup.titulo })
    for (const href of [
      "https://cline.bot/cli",
      "https://docs.cline.bot/cline-cli/installation",
      "https://code.claude.com/docs/en/setup",
      "https://docs.astral.sh/uv/getting-started/installation/",
      "https://github.com/github/spec-kit",
    ]) {
      expect(screen.getAllByRole("link").some((a) => a.getAttribute("href") === href)).toBe(true)
    }
  })

  it("marca como solo Windows lo que no aplica a macOS y Linux", async () => {
    renderApp("/configurar-entorno")
    await screen.findByRole("heading", { level: 1, name: setup.titulo })
    expect(screen.getByText(/Solo Windows:/)).toBeInTheDocument()
  })

  it("cada bloque de comandos tiene su botón de copiar", async () => {
    renderApp("/configurar-entorno")
    await screen.findByRole("heading", { level: 1, name: setup.titulo })
    expect(screen.getAllByRole("button", { name: "Copiar" }).length).toBeGreaterThanOrEqual(8)
  })
})

describe("README", () => {
  it("la guía de setup del README es la misma que muestra la web (npm run docs:setup la regenera)", () => {
    const readme = readFileSync("README.md", "utf-8")
    const bloque = readme.match(/<!-- setup:inicio -->\n\n([\s\S]*?)\n\n<!-- setup:fin -->/)?.[1]
    expect(bloque).toBe(setup.markdown.join("\n"))
  })
})
