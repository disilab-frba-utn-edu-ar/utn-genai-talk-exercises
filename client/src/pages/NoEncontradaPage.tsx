import { Link } from "react-router"

export default function NoEncontradaPage() {
  return (
    <section className="estado estado-vacio no-encontrada">
      <p className="sobretitulo">Error 404</p>
      <h1>No encontramos esta página</h1>
      <p>Puede que el enlace esté mal escrito o que la mentora ya no esté en la plataforma.</p>
      <Link to="/" className="boton">
        Ir al inicio
      </Link>
    </section>
  )
}
