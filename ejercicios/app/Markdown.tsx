import { Marked } from "marked"
import { useMemo, type MouseEvent } from "react"
import { useNavigate } from "react-router"

const escapar = (texto: string) =>
  texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

/** Adónde lleva un enlace de las consignas dentro de la app (null: archivo del repo, no navegable). */
function destino(href: string): string | null {
  if (/^https?:\/\//.test(href)) return href
  const ejercicio = href.match(/^\.\/(\d{2}-[a-z0-9-]+)\/$/)
  if (ejercicio) return `/ejercicios/${ejercicio[1]}`
  if (href === "./RESPUESTAS.md") return "#respuestas"
  if (/^\.\/[\w-]+\.md$/.test(href)) return `#${href.slice(2)}`
  return null
}

const marked = new Marked({
  renderer: {
    // Cada bloque de código lleva su botón de copiar; los bloques `text` son prompts.
    code({ text, lang }) {
      const etiqueta = lang === "text" ? "Copiar prompt" : "Copiar"
      return `<div class="codigo"><button type="button" class="boton-copiar" data-copiar>${etiqueta}</button><pre><code>${escapar(text)}</code></pre></div>`
    },
    link({ href, tokens }) {
      const texto = this.parser.parseInline(tokens)
      const a = destino(href)
      if (a === null) return `<span class="enlace-repo" title="${escapar(href)}">${texto}</span>`
      const externo = a.startsWith("http") ? ' target="_blank" rel="noreferrer"' : ""
      return `<a href="${escapar(a)}"${externo}>${texto}</a>`
    },
  },
})

async function copiar(boton: HTMLButtonElement) {
  const etiqueta = boton.textContent
  try {
    await navigator.clipboard.writeText(boton.nextElementSibling?.textContent ?? "")
    boton.textContent = "¡Copiado!"
  } catch {
    boton.textContent = "No se pudo copiar"
  }
  setTimeout(() => (boton.textContent = etiqueta), 2000)
}

/** Renderiza un texto de las consignas tal cual está en el JSON (contenido propio del repo). */
export default function Markdown({ texto, enLinea = false }: { texto: string; enLinea?: boolean }) {
  const navigate = useNavigate()
  const html = useMemo(
    () => (enLinea ? marked.parseInline(texto, { async: false }) : marked.parse(texto, { async: false })),
    [texto, enLinea],
  )

  // Delegación de eventos: el HTML viene de marked, no de componentes React.
  function alHacerClic(evento: MouseEvent<HTMLDivElement>) {
    const objetivo = evento.target as HTMLElement
    const boton = objetivo.closest<HTMLButtonElement>("[data-copiar]")
    if (boton) return void copiar(boton)
    const href = objetivo.closest("a")?.getAttribute("href")
    if (href?.startsWith("/")) {
      evento.preventDefault()
      navigate(href)
    }
  }

  const Etiqueta = enLinea ? "span" : "div"
  return <Etiqueta className="markdown" onClick={alHacerClic} dangerouslySetInnerHTML={{ __html: html }} />
}
