import { Link, NavLink, Outlet } from "react-router"

export default function Layout() {
  return (
    <div className="pagina">
      <a href="#contenido" className="saltar">
        Saltar al contenido
      </a>
      <header className="encabezado">
        <Link to="/" className="marca">
          <span className="marca-icono" aria-hidden="true">
            ›
          </span>
          <span>
            Mentorías <em>a Voluntad</em>
          </span>
        </Link>
        <nav className="navegacion" aria-label="Principal">
          <NavLink to="/" end>
            Mentoras
          </NavLink>
          <NavLink to="/ejercicios">Ejercicios</NavLink>
          <NavLink to="/configurar-entorno">Configurar entorno</NavLink>
        </nav>
        <p className="encabezado-lema">Horas de experiencia donadas a colectivos que construyen software</p>
      </header>
      <main id="contenido" className="contenido">
        <Outlet />
      </main>
      <footer className="pie">
        <span>
          Parte del ecosistema <strong>Código a Voluntad</strong>
        </span>
        <span>Proyecto de práctica · UTN FRBA</span>
      </footer>
    </div>
  )
}
