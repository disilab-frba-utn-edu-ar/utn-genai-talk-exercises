// Visor de las consignas: la app de Mentorías lo monta en /ejercicios/*.
import { useState, type ReactNode } from "react"
import { Link, Route, Routes, useParams } from "react-router"
import NoEncontradaPage from "../../client/src/pages/NoEncontradaPage"
import Bloqueado, { Candado, ConfirmarAvance } from "./Bloqueado"
import Consigna from "./Consigna"
import { anexosEnLinea, anteriorDe, ejercicios, notas, rama, type Ejercicio } from "./contenido"
import EjercicioSdd from "./EjercicioSdd"
import "./ejercicios.css"
import { HojaDeChecks } from "./Etapas"
import Markdown from "./Markdown"
import PerfilPage from "./PerfilPage"
import { guardar, useAvanzoIgual, useGuardado, useTerminado } from "./progreso"
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
// Ya terminado, con el tilde verde.
function TarjetaEjercicio({ ejercicio: e }: { ejercicio: Ejercicio }) {
  const pendiente = useAnteriorPendiente(e)
  const terminado = useTerminado(e.id)
  const [preguntando, setPreguntando] = useState(false)
  return (
    <article className="tarjeta mentora" data-bloqueado={pendiente ? true : undefined}>
      {/* El mismo tilde de la sesión confirmada, en la esquina donde va el candado. */}
      {terminado && (
        <span className="tarjeta-tilde" role="img" aria-label="Terminado">
          ✓
        </span>
      )}
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

const CLAVE_RAMA = "ejercicios:rama-creada"

/** Cómo crear la rama del grupo; se oculta (en este navegador) al confirmar que ya la crearon. */
function CrearRama() {
  if (useGuardado(CLAVE_RAMA) === true) return null
  return (
    <section className="tarjeta documento crear-rama" aria-label="Rama del grupo">
      <Markdown texto={rama} />
      <button type="button" className="boton" onClick={() => guardar(CLAVE_RAMA, true)}>
        Ya creamos la rama
      </button>
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
        <Link to="perfil" className="boton boton-secundario indice-perfil">
          Mi perfil <span aria-hidden="true">→</span>
        </Link>
      </section>

      {/* Lo que conviene tener presente en todos los ejercicios: siempre a la vista, antes de la rama. */}
      <section className="tarjeta documento notas-clave" aria-label="Notas clave">
        <Markdown texto={notas} />
      </section>

      <CrearRama />

      <section className="grilla grilla-ejercicios" aria-label="Ejercicios">
        {ejercicios.map((e) => (
          <TarjetaEjercicio key={e.id} ejercicio={e} />
        ))}
      </section>
    </>
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

  const enLinea = anexosEnLinea(ejercicio)
  const consigna = (lineas: string[]) => <Consigna lineas={lineas} anexos={enLinea} />

  // La consigna va entera, en el orden del documento, con las preguntas intercaladas entre los pasos.
  const secciones = [
    { id: "consigna", titulo: "Consigna", contenido: <Respuestas ejercicio={ejercicio} consigna={consigna} /> },
    ...ejercicio.anexos
      .filter((a) => !a.insertarDespuesDe)
      .map((a) => ({ id: a.archivo, titulo: a.titulo, contenido: <Markdown texto={a.markdown.join("\n")} /> })),
  ]

  const sdd = ejercicio.id === ID_SDD
  const porEtapas = Boolean(ejercicio.etapas)
  // Fuera de la cabecera para quedar fijo mientras se scrollea la consigna.
  const temporizador = <Temporizador key={ejercicio.id} id={ejercicio.id} minutos={ejercicio.minutos} />
  // En el ejercicio 3 se abre con el tablero, para verlo antes de elegir la historia.
  // La key lo reinicia al pasar a otro ejercicio; distinta de la del temporizador, su hermano.
  const video = <VideoDeIntroduccion key={`video-${ejercicio.id}`} ejercicio={ejercicio} />
  // Por etapas, la consigna va en un marco de alto fijo, sin la sección numerada de la consigna corrida.
  const cuerpo = porEtapas ? (
    <Respuestas ejercicio={ejercicio} consigna={consigna} />
  ) : (
    <div className="reserva">
      {secciones.map((s, i) => (
        <Seccion key={s.id} numero={i + 1} id={s.id} titulo={s.titulo}>
          {s.contenido}
        </Seccion>
      ))}
    </div>
  )

  // Por etapas no hay scroll de página: volver, la hoja de checks, Mi perfil, el
  // video minimizado y el temporizador van en una sola fila.
  if (porEtapas) {
    return (
      <div className="ejercicio-pagina">
        <div className="ejercicio-cabecera ejercicio-cabecera-etapas">
          {volver}
          <div className="chips ejercicio-herramientas">
            <HojaDeChecks ejercicio={ejercicio} />
            <Link to="/ejercicios/perfil" className="chip">
              Mi perfil
            </Link>
          </div>
          <VideoDeIntroduccion key={`video-${ejercicio.id}`} ejercicio={ejercicio} enLinea />
          {temporizador}
        </div>
        {cuerpo}
      </div>
    )
  }

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
      <Route path="perfil" element={<PerfilPage />} />
      <Route path=":id" element={<EjercicioPage />} />
    </Routes>
  )
}
