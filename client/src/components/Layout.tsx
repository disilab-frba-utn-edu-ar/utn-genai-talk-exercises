import { Link, Outlet } from "react-router"

export default function Layout() {
  return (
    <div className="pagina">
      <a href="#contenido" className="saltar">
        Saltar al contenido
      </a>
      <header className="encabezado">
        <Link to="/" className="marca">
          <span className="marca-icono" aria-hidden="true">
            ✦
          </span>
          Mentorías <em>a Voluntad</em>
        </Link>
        <p className="encabezado-lema">Horas de experiencia donadas a colectivos que construyen software</p>
      </header>
      <main id="contenido" className="contenido">
        <Outlet />
      </main>
      <footer className="pie">
        Parte del ecosistema <strong>Código a Voluntad</strong> · Proyecto de práctica UTN FRBA
      </footer>
    </div>
  )
}
