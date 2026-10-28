import { Link, NavLink, Outlet } from "react-router"
import { HABILITA_METRICAS, useTerminado } from "../../../ejercicios/app/progreso"
import UtnLogo from "./UtnLogo"

export default function Layout() {
  // Métricas aparece en el menú recién cuando se termina el ejercicio 1: primero se aprende a leer el log.
  const metricasHabilitadas = useTerminado(HABILITA_METRICAS)
  return (
    <div className="pagina">
      <a href="#contenido" className="saltar">
        Saltar al contenido
      </a>
      <header className="encabezado">
        <div className="marcas">
          <a href="https://www.frba.utn.edu.ar" className="marca-utn" target="_blank" rel="noreferrer">
            <UtnLogo className="marca-utn-logo" />
            <span className="marca-utn-texto" aria-hidden="true">
              UTN <strong>FRBA</strong>
            </span>
            <span className="sr-only">UTN FRBA (abre en otra pestaña)</span>
          </a>
          <span className="marcas-separador" aria-hidden="true" />
          <Link to="/" className="marca">
            <span className="marca-icono" aria-hidden="true">
              ›
            </span>
            <span>
              Mentorías <em>a Voluntad</em>
            </span>
          </Link>
        </div>
        <nav className="navegacion" aria-label="Principal">
          <NavLink to="/" end>
            Mentoras
          </NavLink>
          <NavLink to="/ejercicios">Ejercicios</NavLink>
          <NavLink to="/configurar-entorno">Configurar entorno</NavLink>
          {metricasHabilitadas && <NavLink to="/metricas">Métricas</NavLink>}
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
