import { render } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import type { MetricasAgentes } from "@shared/types"
import App from "../../client/src/App"

/** jsdom no trae EventSource: este doble deja al test mandar eventos y errores. */
export class FuenteFalsa {
  static instancias: FuenteFalsa[] = []
  static get ultima() {
    return FuenteFalsa.instancias.at(-1)!
  }
  cerrada = false
  private oyentes = new Map<string, ((e: { data?: string }) => void)[]>()
  constructor(readonly url: string) {
    FuenteFalsa.instancias.push(this)
  }
  addEventListener(tipo: string, oyente: (e: { data?: string }) => void) {
    this.oyentes.set(tipo, [...(this.oyentes.get(tipo) ?? []), oyente])
  }
  close() {
    this.cerrada = true
  }
  emitir(m: MetricasAgentes) {
    this.oyentes.get("metricas")?.forEach((o) => o({ data: JSON.stringify(m) }))
  }
  fallar() {
    this.oyentes.get("error")?.forEach((o) => o({}))
  }
}

export const ORIGENES = [
  { id: "actual", nombre: "Actual" },
  { id: "archivo/2026-10-20T10-00-00-000Z", nombre: "Archivo 2026-10-20T10-00-00-000Z" },
]

/** fetch: orígenes y, si `snapshot` es null, el servidor "no responde". */
export function simularServidor(snapshot: MetricasAgentes | null) {
  const f = vi.fn(async (url: string) => {
    if (url.startsWith("/api/metricas-agentes/origenes")) return new Response(JSON.stringify(ORIGENES))
    if (snapshot === null) throw new TypeError("fetch failed")
    return new Response(JSON.stringify(snapshot))
  })
  vi.stubGlobal("fetch", f)
  return f
}

export function renderPagina(ruta = "/metricas") {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <App />
    </MemoryRouter>,
  )
}


beforeEach(() => {
  FuenteFalsa.instancias = []
  vi.stubGlobal("EventSource", FuenteFalsa)
})
