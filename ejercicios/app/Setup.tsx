// Páginas de texto de los ejercicios. La guía de setup para Windows viene de ejercicios/setup.json, el mismo
// que se copia al README (npm run docs:setup); el resumen de SDD, de ejercicios/sdd.json.
import sdd from "../sdd.json"
import setup from "../setup.json"
import "./ejercicios.css"
import Markdown from "./Markdown"

export const tituloSetup = setup.titulo

function Pagina({ titulo, bajada, etiqueta, markdown }: { titulo: string; bajada: string; etiqueta: string; markdown: string[] }) {
  return (
    <>
      <section className="portada">
        <p className="sobretitulo prompt">UTN FRBA · Desarrollo de Software</p>
        <h1>
          <span className="acento">{titulo}</span>
        </h1>
        <p className="bajada">{bajada}</p>
      </section>
      <section className="tarjeta documento" aria-label={etiqueta}>
        <Markdown texto={markdown.join("\n")} />
      </section>
    </>
  )
}

export default function SetupPage() {
  return <Pagina titulo={tituloSetup} bajada="Una sola vez, antes del primer ejercicio." etiqueta="Pasos de configuración" markdown={setup.markdown} />
}

export function SddPage() {
  return <Pagina titulo={sdd.titulo} bajada="Una referencia rápida: se lee en cinco minutos." etiqueta="Resumen de SDD" markdown={sdd.markdown} />
}
