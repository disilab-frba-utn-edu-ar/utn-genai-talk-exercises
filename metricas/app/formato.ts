export const AGENTES = { claude: "Claude", codex: "Codex", cline: "Cline" } as const

const numero = new Intl.NumberFormat("es-AR")
export const formatoNumero = (n: number) => numero.format(n)

export const porcentaje = (fraccion: number | null) => (fraccion === null ? "n/d" : `${Math.round(fraccion * 100)} %`)

export function duracion(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`
  const s = ms / 1000
  if (s < 60) return `${s.toFixed(s < 10 ? 1 : 0).replace(".", ",")} s`
  const min = Math.floor(s / 60)
  if (min < 60) return `${min} min ${Math.round(s % 60)} s`
  return `${Math.floor(min / 60)} h ${min % 60} min`
}

export const caracteres = (n: number) => (n < 10_000 ? formatoNumero(n) : `${formatoNumero(Math.round(n / 1000))} k`)

export const hora = (iso: string) => new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
