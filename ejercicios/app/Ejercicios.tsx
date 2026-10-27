// Visor de las consignas: la app de Mentorías lo monta en /ejercicios/*.
import type { ReactNode } from "react"
import { Link, Route, Routes, useParams } from "react-router"
import NoEncontradaPage from "../../client/src/pages/NoEncontradaPage"
import { conAnexosEnLinea, ejercicios, introduccion, partirConsigna, type Anexo } from "./contenido"
import "./ejercicios.css"
import Markdown from "./Markdown"
import Respuestas from "./Respuestas"
import Temporizador from "./Temporizador"

type PropsSeccion = { numero: number; id: string; titulo: string; children: ReactNode }

function Seccion({ numero, id, titulo, children }: PropsSeccion) {
  return (
    <section id={id} className="paso" aria-labelledby={`titulo-${id}`}>
      <h2 id={`titulo-${id}`} className="paso-titulo">
        <span className="paso-numero" aria-hidden="true">
          {numero}
        </span>
        {titulo}
      </h2>
      {children}
    </section>
  )
}

function IndicePage() {
  return (
    <>
      <section className="portada">
        <p className="sobretitulo prompt">UTN FRBA · Desarrollo de Software</p>
        <h1>
          <span className="acento">Ejercicios</span>
        </h1>
        <p className="bajada">Hacelos en orden: cada uno usa lo que armaste en el anterior.</p>
      </section>

      <section className="grilla" aria-label="Ejercicios">
        {ejercicios.map((e) => (
          // Mismas tarjetas que las mentoras del inicio.
          <article key={e.id} className="tarjeta mentora">
            <div>
              <p className="sobretitulo">Ejercicio {e.numero}</p>
              <h2 className="mentora-nombre">{e.titulo}</h2>
            </div>
            <p className="mentora-presentacion">
              <Markdown texto={e.resumen} enLinea />
            </p>
            <ul className="etiquetas" aria-label="Duración">
              <li className="etiqueta">{e.duracion}</li>
            </ul>
            <Link to={e.id} className="boton mentora-accion">
              Ver consigna <span aria-hidden="true">→</span>
            </Link>
          </article>
        ))}
      </section>

      <section className="tarjeta documento" aria-label="Sobre los ejercicios">
        <Markdown texto={introduccion} />
      </section>
    </>
  )
}

/** Un tramo de la consigna, con los anexos en línea (el prompt aparece justo debajo de "Copiá el prompt…"). */
function Consigna({ lineas, anexos }: { lineas: string[]; anexos: Anexo[] }) {
  return conAnexosEnLinea(lineas, anexos).map((b, i) =>
    b.tipo === "markdown" ? (
      <Markdown key={i} texto={b.texto} />
    ) : (
      <aside key={i} id={b.anexo.archivo} className="anexo-en-linea" aria-label={b.anexo.titulo}>
        <Markdown texto={b.anexo.markdown.join("\n")} />
      </aside>
    ),
  )
}

function EjercicioPage() {
  const { id } = useParams()
  const ejercicio = ejercicios.find((e) => e.id === id)
  if (!ejercicio) return <NoEncontradaPage />

  const { antes, despues } = partirConsigna(ejercicio)
  const enLinea = ejercicio.anexos.filter((a) => a.insertarDespuesDe)
  const consigna = (lineas: string[]) => <Consigna lineas={lineas} anexos={enLinea} />

  // Mismo orden que el documento original: nada se saltea ni se repite.
  const secciones = [
    { id: "consigna", titulo: "Consigna", contenido: consigna(antes) },
    ...ejercicio.anexos
      .filter((a) => !a.insertarDespuesDe)
      .map((a) => ({ id: a.archivo, titulo: a.titulo, contenido: <Markdown texto={a.markdown.join("\n")} /> })),
    {
      id: "respuestas",
      titulo: "Preguntas y respuestas",
      contenido: <Respuestas ejercicio={ejercicio} />,
    },
    ...(despues.length > 0
      ? [{ id: "despues", titulo: despues[0].replace(/^#+\s*/, ""), contenido: consigna(despues) }]
      : []),
  ]

  return (
    <div className="ejercicio-pagina">
      <div className="ejercicio-cabecera">
        <Link to="/ejercicios" className="volver">
          <span aria-hidden="true">←</span> Todos los ejercicios
        </Link>
        <nav className="chips" aria-label="Secciones del ejercicio">
          {secciones.map((s, i) => (
            <a key={s.id} href={`#${s.id}`} className="chip">
              {i + 1}. {s.titulo}
            </a>
          ))}
        </nav>
      </div>

      {/* Fuera de la cabecera para quedar fijo mientras se scrollea la consigna. */}
      <Temporizador key={ejercicio.id} id={ejercicio.id} minutos={ejercicio.minutos} />

      <div className="reserva">
        {secciones.map((s, i) => (
          <Seccion key={s.id} numero={i + 1} id={s.id} titulo={s.titulo}>
            {s.contenido}
          </Seccion>
        ))}
      </div>
    </div>
  )
}

export default function Ejercicios() {
  return (
    <Routes>
      <Route index element={<IndicePage />} />
      <Route path=":id" element={<EjercicioPage />} />
    </Routes>
  )
}
