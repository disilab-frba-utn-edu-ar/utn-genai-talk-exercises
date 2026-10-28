import { useEffect, useState, type FormEvent, type ReactNode } from "react"
import { useNavigate } from "react-router"
import { Cargando, ErrorCarga } from "../../client/src/components/Estado"
import { useCarga } from "../../client/src/hooks/useCarga"
import { guardarRespuestas, leerRespuestas, type RespuestasGuardadas } from "./api"
import { armarRespuestasMd, partirConsigna, partirPreguntas, siguienteDe, type Ejercicio, type Respuestas as Datos } from "./contenido"
import Markdown from "./Markdown"
import { HABILITA_METRICAS, marcarTerminado } from "./progreso"

type Estado = { tipo: "editando" } | { tipo: "guardando" } | { tipo: "guardado"; hora: string } | { tipo: "error"; mensaje: string }

/** Cómo se muestra un tramo de pasos de la consigna (con sus anexos en línea). */
type RenderConsigna = (lineas: string[]) => ReactNode

const hora = (iso: string) => new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })

/** Lo guardado o, si no hay nada, la plantilla. Un respuestas.json viejo (un solo texto) queda entero en los datos generales. */
function datosIniciales(ejercicio: Ejercicio, guardadas: RespuestasGuardadas | null): Datos {
  if (!guardadas) return { general: ejercicio.plantillaRespuestas.join("\n"), porPregunta: {} }
  if (Array.isArray(guardadas.respuestas)) return { general: guardadas.respuestas.join("\n"), porPregunta: {} }
  return {
    general: (guardadas.general ?? ejercicio.plantillaRespuestas).join("\n"),
    porPregunta: Object.fromEntries(Object.entries(guardadas.respuestas).map(([n, r]) => [n, r.join("\n")])),
  }
}

function Editor({ ejercicio, inicial, consigna }: { ejercicio: Ejercicio; inicial: Datos; consigna: RenderConsigna }) {
  const navigate = useNavigate()
  const [datos, setDatos] = useState(inicial)
  const [guardadoComo, setGuardadoComo] = useState(inicial)
  const [estado, setEstado] = useState<Estado>({ tipo: "editando" })
  const sinGuardar = JSON.stringify(datos) !== JSON.stringify(guardadoComo)
  const tramos = partirConsigna(ejercicio)
  const primerTramo = tramos.findIndex((t) => t.tipo === "preguntas")
  const siguiente = siguienteDe(ejercicio)

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
    navigate(siguiente ? `/ejercicios/${siguiente.id}` : "/ejercicios")
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
                  placeholder="Tu respuesta, con evidencia del log…"
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
        </div>
      ))}

      <div className="respuestas-seguir">
        <p className="respuestas-estado" id={`terminar-${ejercicio.id}`}>
          Guarda tus respuestas{ejercicio.id === HABILITA_METRICAS && ", habilita Métricas"} y{" "}
          {siguiente ? `pasa al ejercicio ${siguiente.numero}.` : "vuelve al índice."}
        </p>
        <button
          type="button"
          className="boton boton-secundario"
          disabled={estado.tipo === "guardando"}
          onClick={terminar}
          aria-describedby={`terminar-${ejercicio.id}`}
        >
          Terminé <span aria-hidden="true">→</span>
        </button>
      </div>

      <div className="respuestas-acciones">
        <button type="submit" className="boton" disabled={estado.tipo === "guardando"}>
          {estado.tipo === "guardando" ? "Guardando…" : "Guardar respuestas"}
        </button>
        <p className="respuestas-estado" role="status" aria-live="polite">
          {sinGuardar ? "Hay cambios sin guardar." : estado.tipo === "guardado" && `Guardado a las ${estado.hora}.`}
        </p>
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

  return <Editor key={ejercicio.id} ejercicio={ejercicio} inicial={datosIniciales(ejercicio, guardadas.datos)} consigna={consigna} />
}
