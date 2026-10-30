import { useEffect, useState, type FormEvent, type ReactNode } from "react"
import { useNavigate } from "react-router"
import { Cargando, ErrorCarga } from "../../client/src/components/Estado"
import { useCarga } from "../../client/src/hooks/useCarga"
import Captura from "./Captura"
import { guardarRespuestas, leerRespuestas, type RespuestasGuardadas } from "./api"
import { armarRespuestasMd, partirConsigna, partirPreguntas, siguienteDe, type Ejercicio, type Respuestas as Datos } from "./contenido"
import Markdown from "./Markdown"
import { HABILITA_METRICAS, marcarTerminado } from "./progreso"
import { ID_SDD, tituloPrincipal, useTablero } from "./tablero"

type Estado = { tipo: "editando" } | { tipo: "guardando" } | { tipo: "guardado"; hora: string } | { tipo: "error"; mensaje: string }

/** Cómo se muestra un tramo de pasos de la consigna (con sus anexos en línea). */
type RenderConsigna = (lineas: string[]) => ReactNode

const hora = (iso: string) => new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })

const HISTORIA = "**Historia elegida:**"

/** La línea "Historia elegida" de los datos de la entrega, con la historia del tablero. El resto queda igual. */
const conHistoria = (general: string, historia?: string) =>
  historia ? general.replace(/^\*\*Historia elegida:\*\*.*$/m, `${HISTORIA} ${historia}`) : general

/**
 * Lo guardado o, si no hay nada, la plantilla (con la historia elegida en el tablero, si hay).
 * Un respuestas.json viejo (un solo texto) queda entero en los datos generales.
 */
function datosIniciales(ejercicio: Ejercicio, guardadas: RespuestasGuardadas | null, historia?: string): Datos {
  if (!guardadas) return { general: conHistoria(ejercicio.plantillaRespuestas.join("\n"), historia), porPregunta: {} }
  if (Array.isArray(guardadas.respuestas)) return { general: guardadas.respuestas.join("\n"), porPregunta: {} }
  return {
    general: conHistoria((guardadas.general ?? ejercicio.plantillaRespuestas).join("\n"), historia),
    porPregunta: Object.fromEntries(Object.entries(guardadas.respuestas).map(([n, r]) => [n, r.join("\n")])),
  }
}

type PropsEditor = { ejercicio: Ejercicio; inicial: Datos; consigna: RenderConsigna; historia?: string }

function Editor({ ejercicio, inicial, consigna, historia }: PropsEditor) {
  const navigate = useNavigate()
  const [datos, setDatos] = useState(inicial)
  // Si cambia la historia del tablero, se actualiza solo esa línea de los datos: las respuestas no se tocan.
  const [historiaVista, setHistoriaVista] = useState(historia)
  if (historia !== historiaVista) {
    setHistoriaVista(historia)
    setDatos((d) => ({ ...d, general: conHistoria(d.general, historia) }))
  }
  const [guardadoComo, setGuardadoComo] = useState(inicial)
  const [estado, setEstado] = useState<Estado>({ tipo: "editando" })
  const sinGuardar = JSON.stringify(datos) !== JSON.stringify(guardadoComo)
  const tramos = partirConsigna(ejercicio)
  const primerTramo = tramos.findIndex((t) => t.tipo === "preguntas")
  const ultimoTramo = tramos.findLastIndex((t) => t.tipo === "preguntas")
  const siguiente = siguienteDe(ejercicio)
  const descripcionTerminar = `Guarda tus respuestas${ejercicio.id === HABILITA_METRICAS ? ", habilita Métricas" : ""} y ${
    siguiente ? `pasa al ejercicio ${siguiente.numero}.` : ejercicio.id === ID_SDD ? "cierra la actividad con Rocco." : "vuelve al índice."
  }`

  // Avisa antes de cerrar la pestaña con cambios sin guardar.
  useEffect(() => {
    if (!sinGuardar) return
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", avisar)
    return () => window.removeEventListener("beforeunload", avisar)
  }, [sinGuardar])

  const responder = (numero: string, texto: string) =>
    setDatos((d) => ({ ...d, porPregunta: { ...d.porPregunta, [numero]: texto } }))

  async function guardar(): Promise<boolean> {
    setEstado({ tipo: "guardando" })
    try {
      const guardadas = await guardarRespuestas(ejercicio.id, {
        general: datos.general,
        respuestas: datos.porPregunta,
        markdown: armarRespuestasMd(ejercicio, datos),
      })
      setGuardadoComo(datos)
      setEstado({ tipo: "guardado", hora: hora(guardadas.guardado) })
      return true
    } catch (error) {
      setEstado({ tipo: "error", mensaje: error instanceof Error ? error.message : String(error) })
      return false
    }
  }

  function alEnviar(evento: FormEvent) {
    evento.preventDefault()
    void guardar()
  }

  // Si no se pudo guardar, se queda en la página con el error a la vista y no lo marca como terminado.
  async function terminar() {
    if (!(await guardar())) return
    marcarTerminado(ejercicio.id)
    // El ejercicio 3 cierra con la felicitación de Rocco; el resto pasa al siguiente o al índice.
    if (ejercicio.id === ID_SDD) navigate(`/ejercicios/${ID_SDD}`, { state: { felicitar: true } })
    else navigate(siguiente ? `/ejercicios/${siguiente.id}` : "/ejercicios")
    document.documentElement.scrollTop = 0
  }

  function preguntas(lineas: string[], conDatosGenerales: boolean) {
    const bloques = partirPreguntas(lineas)
    // Los datos generales van debajo del encabezado y la intro del primer tramo de preguntas.
    const intro = bloques[0]?.tipo === "markdown" ? bloques[0] : undefined
    const resto = intro ? bloques.slice(1) : bloques
    return (
      <>
        {intro && <Markdown texto={intro.lineas.join("\n")} />}
        {conDatosGenerales && (
          <div className="campo">
            <label htmlFor={`general-${ejercicio.id}`}>Datos de la entrega</label>
            <textarea
              id={`general-${ejercicio.id}`}
              className="editor-respuestas"
              value={datos.general}
              onChange={(e) => setDatos((d) => ({ ...d, general: e.target.value }))}
              spellCheck
              rows={Math.min(ejercicio.plantillaRespuestas.length + 1, 16)}
            />
          </div>
        )}
        {resto.map((b, i) => {
          if (b.tipo === "markdown") return <Markdown key={i} texto={b.lineas.join("\n")} />
          const respuesta = datos.porPregunta[b.numero] ?? ""
          return (
            <details key={i} className="pregunta">
              <summary>
                <span className="pregunta-titulo">
                  {b.numero}. {b.titulo}
                </span>
                {respuesta.trim() && <span className="etiqueta">Respondida</span>}
              </summary>
              <div className="pregunta-cuerpo">
                {b.cuerpo && <Markdown texto={b.cuerpo} />}
                <label htmlFor={`respuesta-${ejercicio.id}-${b.numero}`} className="sr-only">
                  Tu respuesta a la pregunta {b.numero}
                </label>
                <textarea
                  id={`respuesta-${ejercicio.id}-${b.numero}`}
                  className="editor-respuestas"
                  value={respuesta}
                  onChange={(e) => responder(b.numero, e.target.value)}
                  placeholder={ejercicio.placeholder ?? "Tu respuesta, con evidencia del log…"}
                  spellCheck
                  rows={8}
                />
              </div>
            </details>
          )
        })}
      </>
    )
  }

  return (
    <form className="formulario respuestas" onSubmit={alEnviar}>
      {tramos.map((t, i) => (
        <div key={i} className={t.tipo === "preguntas" ? "tramo-preguntas" : undefined}>
          {t.tipo === "preguntas" ? preguntas(t.lineas, i === primerTramo) : consigna(t.lineas)}
          {ejercicio.captura && i === ultimoTramo && <Captura id={ejercicio.id} />}
        </div>
      ))}

      {/* Terminé va en la misma barra que Guardar, fija abajo: así nadie se lo saltea al final de la página. */}
      <div className="respuestas-acciones" role="group" aria-label="Guardar y terminar">
        {/* En pantallas angostas se ve "Guardar" a secas: el nombre completo va explícito, no depende del CSS. */}
        <button
          type="submit"
          className="boton"
          disabled={estado.tipo === "guardando"}
          aria-label={estado.tipo === "guardando" ? undefined : "Guardar respuestas"}
        >
          {estado.tipo === "guardando" ? (
            "Guardando…"
          ) : (
            <>
              Guardar<span className="respuestas-largo"> respuestas</span>
            </>
          )}
        </button>
        <p className="respuestas-estado" role="status" aria-live="polite">
          {sinGuardar ? "Hay cambios sin guardar." : estado.tipo === "guardado" && `Guardado a las ${estado.hora}.`}
        </p>
        <p className="sr-only" id={`terminar-${ejercicio.id}`}>
          {descripcionTerminar}
        </p>
        <button
          type="button"
          className="boton boton-terminar"
          disabled={estado.tipo === "guardando"}
          onClick={terminar}
          aria-describedby={`terminar-${ejercicio.id}`}
          title={descripcionTerminar}
        >
          Terminé <span aria-hidden="true">→</span>
        </button>
      </div>
      {estado.tipo === "error" && (
        <p className="aviso-error" role="alert">
          {estado.mensaje}
        </p>
      )}
    </form>
  )
}

/** La consigna completa con las preguntas intercaladas, cada una en un desplegable con su recuadro de respuesta. */
export default function Respuestas({ ejercicio, consigna }: { ejercicio: Ejercicio; consigna: RenderConsigna }) {
  const guardadas = useCarga(`respuestas:${ejercicio.id}`, () => leerRespuestas(ejercicio.id))
  const historia = tituloPrincipal(useTablero().estado)

  // Sin respuestas cargadas la consigna se sigue leyendo: el aviso ocupa el lugar de las preguntas.
  if (guardadas.estado !== "lista") {
    const aviso =
      guardadas.estado === "error" ? (
        <ErrorCarga mensaje={guardadas.error} onReintentar={guardadas.recargar} />
      ) : (
        <Cargando texto="Buscando tus respuestas…" />
      )
    return partirConsigna(ejercicio).map((t, i) => (
      <div key={i} className={t.tipo === "preguntas" ? "tramo-preguntas" : undefined}>
        {t.tipo === "preguntas" ? aviso : consigna(t.lineas)}
      </div>
    ))
  }

  return <Editor key={ejercicio.id} ejercicio={ejercicio} inicial={datosIniciales(ejercicio, guardadas.datos, historia)} consigna={consigna} historia={historia} />
}
