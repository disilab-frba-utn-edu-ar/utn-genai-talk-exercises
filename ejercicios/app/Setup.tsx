// Guía de setup para Windows: el texto viene de ejercicios/setup.json, el mismo que se copia al README (npm run docs:setup).
import setup from "../setup.json"
import "./ejercicios.css"
import Markdown from "./Markdown"

export const tituloSetup = setup.titulo
const texto = setup.markdown.join("\n")

export default function SetupPage() {
  return (
    <>
      <section className="portada">
        <p className="sobretitulo prompt">UTN FRBA · Desarrollo de Software</p>
        <h1>
          <span className="acento">{tituloSetup}</span>
        </h1>
        <p className="bajada">Una sola vez, antes del primer ejercicio.</p>
      </section>
      <section className="tarjeta documento" aria-label="Pasos de configuración">
        <Markdown texto={texto} />
      </section>
    </>
  )
}
