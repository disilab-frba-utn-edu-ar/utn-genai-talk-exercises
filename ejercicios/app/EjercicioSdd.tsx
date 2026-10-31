// El ejercicio 3 como tarea real: una intro con el Product Owner, un tablero para tomar una historia
// y, ya elegida, las pestañas Tablero y Consigna. Hasta terminar el 2 lo bloquea Ejercicios.tsx.
import { useEffect, useRef, useState, type DragEvent, type KeyboardEvent, type ReactNode } from "react"
import { useLocation, useNavigate } from "react-router"
import Markdown from "./Markdown"
import { borrarTarea, crearTarea } from "./api"
import {
  columnaDe,
  enCurso,
  felicitacion,
  ID_SDD,
  hechas,
  historias,
  introduccion,
  notas,
  useTablero,
  type Columna,
  type EstadoTablero,
  type Hecha,
  type Historia,
} from "./tablero"

const MS_POR_LETRA = 22
const sinAnimacion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false

/** Rocco, el Product Owner, habla en pasos: presenta la actividad al empezar y felicita al terminar. */
function DialogoRocco({ pasos, final, alTerminar }: { pasos: string[]; final: string; alTerminar: () => void }) {
  const [paso, setPaso] = useState(0)
  const texto = pasos[paso]
  // Cuántas letras del paso ya se escribieron, como en un juego. Sin animación, el texto sale entero.
  const [letras, setLetras] = useState(() => (sinAnimacion() ? texto.length : 0))
  const escribiendo = letras < texto.length
  const ultimo = paso === pasos.length - 1

  useEffect(() => {
    if (!escribiendo) return
    const t = setTimeout(() => setLetras((n) => n + 1), MS_POR_LETRA)
    return () => clearTimeout(t)
  }, [escribiendo, letras])

  function ir(destino: number) {
    setPaso(destino)
    // Al volver, el paso anterior ya se había leído: aparece entero.
    setLetras(destino < paso || sinAnimacion() ? pasos[destino].length : 0)
  }

  // Mientras escribe, Siguiente completa el texto; recién después avanza.
  const siguiente = () => (escribiendo ? setLetras(texto.length) : ultimo ? alTerminar() : ir(paso + 1))

  return (
    <section className="po" aria-labelledby="po-nombre">
      <div className="po-logo" aria-hidden="true">
        ›
      </div>
      <div className="po-dialogo">
        <p className="po-quien" id="po-nombre">
          Rocco <span>Product Owner</span>
        </p>
        {/* El lector de pantalla recibe el texto entero, no letra por letra. */}
        <p className="sr-only" aria-live="polite">
          {texto}
        </p>
        <p className="po-texto" aria-hidden="true" data-escribiendo={escribiendo || undefined}>
          {texto.slice(0, letras)}
        </p>
        <div className="po-acciones">
          <span className="po-paso">
            {paso + 1} de {pasos.length}
          </span>
          <button type="button" className="boton boton-secundario" disabled={paso === 0} onClick={() => ir(paso - 1)}>
            Anterior
          </button>
          <button type="button" className="boton" onClick={siguiente}>
            {ultimo && !escribiendo ? final : "Siguiente"}
          </button>
        </div>
      </div>
    </section>
  )
}

const esHistoria = (t: Historia | Hecha): t is Historia => "criterios" in t

function Detalle({ tarjeta, alCerrar }: { tarjeta: Historia | Hecha; alCerrar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo || dialogo.open) return
    if (typeof dialogo.showModal === "function") dialogo.showModal()
    else dialogo.open = true // jsdom
  }, [])

  return (
    // Clic en el fondo (fuera de la caja) también cierra.
    <dialog ref={ref} className="detalle" aria-labelledby="detalle-titulo" onClose={alCerrar} onClick={(e) => e.target === ref.current && alCerrar()}>
      <div className="detalle-caja">
        <ContenidoTarjeta tarjeta={tarjeta} idTitulo="detalle-titulo" />
        <button type="button" className="boton boton-secundario" onClick={alCerrar}>
          Cerrar
        </button>
      </div>
    </dialog>
  )
}

/** Lo que se ve de una tarjeta: en el detalle del tablero y al costado de la consigna. */
function ContenidoTarjeta({ tarjeta, idTitulo }: { tarjeta: Historia | Hecha; idTitulo: string }) {
  return (
    <>
      <h2 id={idTitulo}>{tarjeta.titulo}</h2>
      {esHistoria(tarjeta) && (
        <ul className="etiquetas" aria-label="Tamaño y recomendación">
          <li className="etiqueta">{tarjeta.tamano}</li>
          <li className="etiqueta">{tarjeta.recomendada}</li>
        </ul>
      )}
      <p className="detalle-historia">{tarjeta.historia}</p>
      {esHistoria(tarjeta) ? (
        <>
          <h3>Criterios de aceptación</h3>
          <ul>{tarjeta.criterios.map((c) => <li key={c}>{c}</li>)}</ul>
          <h3>Casos borde para pensar</h3>
          <p className="detalle-nota">No tienen una respuesta correcta: la spec tiene que decidirlos o clarify, preguntarlos.</p>
          <ul>{tarjeta.casosBorde.map((c) => <li key={c}>{c}</li>)}</ul>
          <h3>APIs sugeridas</h3>
          <ul className="detalle-apis">{tarjeta.apis.map((a) => <li key={a}><code>{a}</code></li>)}</ul>
          <p className="detalle-nota">
            El diseño final lo decidís en el plan, respetando la constitution. {notas.map((n) => <Markdown key={n} texto={n} enLinea />)}
          </p>
        </>
      ) : (
        "nota" in tarjeta && tarjeta.nota && <p className="detalle-nota"><Markdown texto={tarjeta.nota} enLinea /></p>
      )}
    </>
  )
}

/** Al costado de la consigna, siempre a la vista: la historia que se está implementando. */
function HistoriaElegida({ estado }: { estado: EstadoTablero }) {
  const id = enCurso(estado) ?? estado.elegidas[0]
  const historia = historias.find((h) => h.id === id)
  if (!historia) return null
  return (
    <aside className="sdd-elegida" aria-labelledby="elegida-titulo">
      <p className="sobretitulo">{id === estado.elegidas[0] ? "Tu tarea principal" : "Tu tarea en curso"}</p>
      <ContenidoTarjeta tarjeta={historia} idTitulo="elegida-titulo" />
    </aside>
  )
}

const SIGUIENTE: Partial<Record<Columna, Columna>> = { todo: "en-curso", "en-curso": "hecho" }
const ANTERIOR: Partial<Record<Columna, Columna>> = { "en-curso": "todo" }
const COLUMNAS: { id: Columna; titulo: string }[] = [
  { id: "todo", titulo: "To Do" },
  { id: "en-curso", titulo: "In Progress" },
  { id: "hecho", titulo: "Done" },
]

function Tablero({ tablero }: { tablero: ReturnType<typeof useTablero> }) {
  const { estado } = tablero
  const [abierta, setAbierta] = useState<string | null>(null)
  const [arrastrada, setArrastrada] = useState<string | null>(null)
  const [destino, setDestino] = useState<Columna | null>(null)
  const [aviso, setAviso] = useState("")
  const principal = estado.elegidas[0]
  const actual = enCurso(estado)

  const tarjetas = (columna: Columna): (Historia | Hecha)[] => {
    const propias = historias.filter((h) => columnaDe(estado, h.id) === columna)
    if (columna === "hecho") return [...propias, ...hechas]
    // In Progress, en el orden en que se tomaron: la principal primero.
    return columna === "en-curso" ? propias.sort((a, b) => estado.elegidas.indexOf(a.id) - estado.elegidas.indexOf(b.id)) : propias
  }

  function mover(id: string, columna: Columna) {
    const titulo = historias.find((h) => h.id === id)?.titulo
    if (tablero.mover(id, columna)) {
      const avisos: Record<Columna, string> = {
        "en-curso": `Tomaste «${titulo}». Seguí en la pestaña Consigna.`,
        hecho: `«${titulo}» pasó a Done.`,
        todo: `«${titulo}» volvió a To Do. Tus respuestas no cambiaron.`,
      }
      setAviso(avisos[columna])
      // El archivo de la tarea acompaña al tablero: se crea al tomarla y se borra si vuelve a To Do.
      const archivo = columna === "en-curso" ? crearTarea(ID_SDD, id) : columna === "todo" ? borrarTarea(ID_SDD, id) : null
      archivo?.catch((error: unknown) => setAviso(`No se pudo actualizar el archivo de la tarea: ${error instanceof Error ? error.message : error}`))
    } else if (columna === "en-curso" && actual) {
      setAviso("Ya tenés una tarea en In Progress: terminala, o devolvela a To Do, para tomar otra.")
    }
  }

  const sePuede = (columna: Columna) => arrastrada !== null && tablero.puedeMover(arrastrada, columna)

  function alSoltar(evento: DragEvent, columna: Columna) {
    evento.preventDefault()
    const id = evento.dataTransfer.getData("text/plain") || arrastrada
    if (id) mover(id, columna)
    setArrastrada(null)
    setDestino(null)
  }

  function alTeclear(evento: KeyboardEvent, id: string, columna: Columna) {
    if (evento.key === "Enter" || evento.key === " ") {
      evento.preventDefault()
      setAbierta(id)
    } else if (evento.ctrlKey && (evento.key === "ArrowRight" || evento.key === "ArrowLeft")) {
      const otra = (evento.key === "ArrowRight" ? SIGUIENTE : ANTERIOR)[columna]
      if (!otra) return
      evento.preventDefault()
      mover(id, otra)
    }
  }

  const tarjetaAbierta = [...historias, ...hechas].find((t) => t.id === abierta)

  return (
    <section className="kanban-contenedor" aria-label="Tablero">
      <p className="kanban-ayuda" id="kanban-ayuda">
        {actual
          ? "Cuando termines tu tarea, arrastrala a Done para tomar otra. Si querés cambiarla, devolvela a To Do (con teclado: Ctrl + flecha izquierda)."
          : principal
            ? "Terminaste tu tarea principal. Si querés seguir practicando, arrastrá otra historia a In Progress."
            : "Hacé clic en una tarjeta para ver el detalle. Para elegir, arrastrala de To Do a In Progress (con teclado: Ctrl + flecha derecha). Si cambiás de idea, podés devolverla a To Do."}
      </p>
      <p className="sr-only" role="status" aria-live="polite">
        {aviso}
      </p>
      {aviso && (
        <p className="kanban-aviso" aria-hidden="true">
          {aviso}
        </p>
      )}

      <div className="kanban">
        {COLUMNAS.map((c) => (
          <div
            key={c.id}
            className="kanban-columna"
            data-destino={destino === c.id || undefined}
            onDragOver={(e) => {
              if (!sePuede(c.id)) return
              e.preventDefault()
              setDestino(c.id)
            }}
            onDragLeave={() => setDestino(null)}
            onDrop={(e) => alSoltar(e, c.id)}
          >
            <h3 className="kanban-titulo">
              {c.titulo} <span className="kanban-cantidad">{tarjetas(c.id).length}</span>
            </h3>
            <ul className="kanban-lista">
              {tarjetas(c.id).map((t) => {
                const historia = esHistoria(t)
                const movible = historia && SIGUIENTE[c.id] !== undefined && tablero.puedeMover(t.id, SIGUIENTE[c.id]!)
                return (
                  <li key={t.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      className="kanban-tarjeta"
                      data-hecha={!historia || undefined}
                      draggable={movible}
                      aria-describedby="kanban-ayuda"
                      onClick={() => setAbierta(t.id)}
                      onKeyDown={(e) => historia && alTeclear(e, t.id, c.id)}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", t.id)
                        e.dataTransfer.effectAllowed = "move"
                        setArrastrada(t.id)
                      }}
                      onDragEnd={() => {
                        setArrastrada(null)
                        setDestino(null)
                      }}
                    >
                      <span className="kanban-tarjeta-titulo">{t.titulo}</span>
                      <span className="etiquetas">
                        {historia && <span className="etiqueta">{t.tamano}</span>}
                        {t.id === principal && <span className="etiqueta etiqueta-principal">Principal</span>}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      {tarjetaAbierta && <Detalle key={tarjetaAbierta.id} tarjeta={tarjetaAbierta} alCerrar={() => setAbierta(null)} />}
    </section>
  )
}

type Pestana = "tablero" | "consigna"

type Props = { temporizador: ReactNode; video: ReactNode; consigna: ReactNode }

export default function EjercicioSdd({ temporizador, video, consigna }: Props) {
  const tablero = useTablero()
  const navigate = useNavigate()
  // "Terminé" vuelve acá con este aviso: Rocco cierra la actividad.
  const felicitar = (useLocation().state as { felicitar?: boolean } | null)?.felicitar === true
  const elegida = tablero.estado.elegidas.length > 0
  // Quien vuelve con la tarea ya elegida arranca en la consigna; quien recién elige se queda en el tablero.
  const [pestana, setPestana] = useState<Pestana>(elegida ? "consigna" : "tablero")
  // Una vez montada, la consigna no se desmonta aunque la tarea vuelva a To Do: no se pierde lo escrito.
  const [consignaMontada, setConsignaMontada] = useState(elegida)
  if (elegida && !consignaMontada) setConsignaMontada(true)
  if (!elegida && pestana === "consigna") setPestana("tablero")

  if (felicitar) return <DialogoRocco pasos={felicitacion} final="Volver a los ejercicios" alTerminar={() => navigate("/ejercicios")} />
  if (!tablero.estado.introVista) return <DialogoRocco pasos={introduccion} final="Ir al tablero" alTerminar={tablero.terminarIntro} />

  return (
    <>
      {elegida && (
        <nav className="chips sdd-pestanas" aria-label="Secciones del ejercicio 3">
          {(["tablero", "consigna"] as const).map((p) => (
            <button key={p} type="button" className="chip" aria-pressed={pestana === p} onClick={() => setPestana(p)}>
              {p === "tablero" ? "Tablero" : "Consigna"}
            </button>
          ))}
        </nav>
      )}
      <div className="sdd-temporizador">{temporizador}</div>
      {/* Popup y botón flotante: fuera de las pestañas, para volver a verlo desde cualquiera. */}
      {video}
      {/* Las dos pestañas quedan montadas: cambiar no pierde lo escrito en las respuestas. */}
      <div hidden={pestana !== "tablero"}>
        <Tablero tablero={tablero} />
      </div>
      {consignaMontada && (
        <div className="sdd-consigna" hidden={!elegida || pestana !== "consigna"}>
          <HistoriaElegida estado={tablero.estado} />
          <div>{consigna}</div>
        </div>
      )}
    </>
  )
}
