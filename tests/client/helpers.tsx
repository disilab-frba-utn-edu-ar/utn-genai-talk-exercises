import { render } from "@testing-library/react"
import type { ReactElement } from "react"
import { MemoryRouter, Route, Routes } from "react-router"

/** Simula la API: cada ruta (sin query) devuelve lo indicado. */
export function simularApi(respuestas: Record<string, unknown>) {
  const fetchFalso = vi.fn(async (url: string) => {
    const ruta = url.split("?")[0]
    const habilidad = new URL(url, "http://x").searchParams.get("habilidad")
    const clave = habilidad ? `${ruta}?habilidad=${habilidad}` : ruta
    if (!(clave in respuestas)) return new Response(JSON.stringify({ error: "no encontrado" }), { status: 404 })
    return new Response(JSON.stringify(respuestas[clave]), { status: 200 })
  })
  vi.stubGlobal("fetch", fetchFalso)
  return fetchFalso
}

export function renderConRuta(elemento: ReactElement, { ruta = "/", patron = "/" } = {}) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path={patron} element={elemento} />
      </Routes>
    </MemoryRouter>,
  )
}
