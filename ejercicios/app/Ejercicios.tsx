// Visor de las consignas: la app de Mentorías lo monta en /ejercicios/*.
import { useState, type ReactNode } from "react"
import { Link, Route, Routes, useParams } from "react-router"
import NoEncontradaPage from "../../client/src/pages/NoEncontradaPage"
import Bloqueado, { Candado, ConfirmarAvance } from "./Bloqueado"
import { anteriorDe, conAnexosEnLinea, ejercicios, introduccion, type Anexo, type Ejercicio } from "./contenido"
import EjercicioSdd from "./EjercicioSdd"
import "./ejercicios.css"
import Markdown from "./Markdown"
import { useAvanzoIgual, useTerminado } from "./progreso"
import Respuestas from "./Respuestas"
import { ID_SDD } from "./tablero"
import Temporizador from "./Temporizador"
import VideoDeIntroduccion from "./VideoDeIntroduccion"

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

/** El anterior al que hay que terminar para abrir este, o undefined si ya está habilitado (o se avanzó igual). */
function useAnteriorPendiente(ejercicio: Ejercicio | undefined): Ejercicio | undefined {
  const anterior = ejercicio && anteriorDe(ejercicio)
  const terminado = useTerminado(anterior?.id ?? "")
  const avanzoIgual = useAvanzoIgual(ejercicio?.id ?? "")
  return terminado || avanzoIgual ? undefined : anterior
}

// Mismas tarjetas que las mentoras del inicio; con el anterior sin terminar, con candado: tocarlo pregunta si avanzar igual.
function TarjetaEjercicio({ ejercicio: e }: { ejercicio: Ejercicio }) {
  const pendiente = useAnteriorPendiente(e)
  const [preguntando, setPreguntando] = useState(false)
  return (
    <article className="tarjeta mentora" data-bloqueado={pendiente ? true : undefined}>
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
      {pendiente ? (
        // El botón cubre toda la tarjeta (::after) y lleva adentro el candado de la esquina: se puede tocar cualquiera.
        <button type="button" className="mentora-accion tarjeta-aviso" onClick={() => setPreguntando(true)}>
          <span className="tarjeta-candado">
            <Candado />
          </span>
          <Candado />
          <span>Se habilita al terminar el ejercicio {pendiente.numero}</span>
        </button>
      ) : (
        <Link to={e.id} className="boton mentora-accion">
          Ver consigna <span aria-hidden="true">→</span>
        </Link>
      )}
      {pendiente && preguntando && <ConfirmarAvance ejercicio={e} anterior={pendiente} alCerrar={() => setPreguntando(false)} />}
    </article>
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
          <TarjetaEjercicio key={e.id} ejercicio={e} />
        ))}
      </section>

      <section className="tarjeta documento" aria-label="Sobre los ejercicios">
        <Markdown texto={introduccion} />
      </section>
    </>
  )
}

function AnexoEnLinea({ anexo }: { anexo: Anexo }) {
  const habilitado = useTerminado(anexo.soloSiTerminado ?? "")
  if (anexo.soloSiTerminado && !habilitado) return null
  return (
    <aside id={anexo.archivo} className="anexo-en-linea" aria-label={anexo.titulo}>
      <Markdown texto={anexo.markdown.join("\n")} />
    </aside>
  )
}

/** Un tramo de la consigna, con los anexos en línea (el prompt aparece justo debajo de "Copiá el prompt…"). */
function Consigna({ lineas, anexos }: { lineas: string[]; anexos: Anexo[] }) {
  return conAnexosEnLinea(lineas, anexos).map((b, i) =>
    b.tipo === "markdown" ? <Markdown key={i} texto={b.texto} /> : <AnexoEnLinea key={i} anexo={b.anexo} />,
  )
}

function EjercicioPage() {
  const { id } = useParams()
  const ejercicio = ejercicios.find((e) => e.id === id)
  const pendiente = useAnteriorPendiente(ejercicio)
  if (!ejercicio) return <NoEncontradaPage />

  const volver = (
    <Link to="/ejercicios" className="volver">
      <span aria-hidden="true">←</span> Todos los ejercicios
    </Link>
  )
  // Bloqueado no muestra consigna, temporizador ni video: solo cómo habilitarlo.
  if (pendiente) {
    return (
      <div className="ejercicio-pagina">
        <div className="ejercicio-cabecera">{volver}</div>
        <Bloqueado ejercicio={ejercicio} anterior={pendiente} />
      </div>
    )
  }

  const enLinea = ejercicio.anexos.filter((a) => a.insertarDespuesDe)
  const consigna = (lineas: string[]) => <Consigna lineas={lineas} anexos={enLinea} />

  // La consigna va entera, en el orden del documento, con las preguntas intercaladas entre los pasos.
  const secciones = [
    { id: "consigna", titulo: "Consigna", contenido: <Respuestas ejercicio={ejercicio} consigna={consigna} /> },
    ...ejercicio.anexos
      .filter((a) => !a.insertarDespuesDe)
      .map((a) => ({ id: a.archivo, titulo: a.titulo, contenido: <Markdown texto={a.markdown.join("\n")} /> })),
  ]

  const sdd = ejercicio.id === ID_SDD
  // Fuera de la cabecera para quedar fijo mientras se scrollea la consigna.
  const temporizador = <Temporizador key={ejercicio.id} id={ejercicio.id} minutos={ejercicio.minutos} />
  // En el ejercicio 3 se abre con el tablero, para verlo antes de elegir la historia.
  // La key lo reinicia al pasar a otro ejercicio; distinta de la del temporizador, su hermano.
  const video = <VideoDeIntroduccion key={`video-${ejercicio.id}`} ejercicio={ejercicio} />
  const cuerpo = (
    <div className="reserva">
      {secciones.map((s, i) => (
        <Seccion key={s.id} numero={i + 1} id={s.id} titulo={s.titulo}>
          {s.contenido}
        </Seccion>
      ))}
    </div>
  )

  return (
    <div className="ejercicio-pagina">
      <div className="ejercicio-cabecera">
        {volver}
        {!sdd && (
          <nav className="chips" aria-label="Secciones del ejercicio">
            {secciones.map((s, i) => (
              <a key={s.id} href={`#${s.id}`} className="chip">
                {i + 1}. {s.titulo}
              </a>
            ))}
          </nav>
        )}
      </div>

      {sdd ? (
        <EjercicioSdd temporizador={temporizador} video={video} consigna={cuerpo} />
      ) : (
        <>
          {temporizador}
          {video}
          {cuerpo}
        </>
      )}
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
