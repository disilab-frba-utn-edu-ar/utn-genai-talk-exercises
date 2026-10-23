import { useEffect, useState, type FormEvent } from "react"
import { Cargando, ErrorCarga } from "../../client/src/components/Estado"
import { useCarga } from "../../client/src/hooks/useCarga"
import { guardarRespuestas, leerRespuestas, type RespuestasGuardadas } from "./api"
import { armarRespuestasMd, partirConsigna, partirPreguntas, type Ejercicio, type Respuestas as Datos } from "./contenido"
import Markdown from "./Markdown"

type Estado = { tipo: "editando" } | { tipo: "guardando" } | { tipo: "guardado"; hora: string } | { tipo: "error"; mensaje: string }

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

function Editor({ ejercicio, inicial }: { ejercicio: Ejercicio; inicial: Datos }) {
  const [datos, setDatos] = useState(inicial)
  const [guardadoComo, setGuardadoComo] = useState(inicial)
  const [estado, setEstado] = useState<Estado>({ tipo: "editando" })
  const sinGuardar = JSON.stringify(datos) !== JSON.stringify(guardadoComo)
  const bloques = partirPreguntas(partirConsigna(ejercicio).preguntas)

  // Avisa antes de cerrar la pestaña con cambios sin guardar.
  useEffect(() => {
    if (!sinGuardar) return
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", avisar)
    return () => window.removeEventListener("beforeunload", avisar)
  }, [sinGuardar])

  const responder = (numero: string, texto: string) =>
    setDatos((d) => ({ ...d, porPregunta: { ...d.porPregunta, [numero]: texto } }))

  async function guardar(evento: FormEvent) {
    evento.preventDefault()
    setEstado({ tipo: "guardando" })
    try {
      const guardadas = await guardarRespuestas(ejercicio.id, {
        general: datos.general,
        respuestas: datos.porPregunta,
        markdown: armarRespuestasMd(ejercicio, datos),
      })
      setGuardadoComo(datos)
      setEstado({ tipo: "guardado", hora: hora(guardadas.guardado) })
    } catch (error) {
      setEstado({ tipo: "error", mensaje: error instanceof Error ? error.message : String(error) })
    }
  }

  // Los datos generales van debajo del encabezado y la intro de las preguntas.
  const intro = bloques[0]?.tipo === "markdown" ? bloques[0] : undefined
  const resto = intro ? bloques.slice(1) : bloques

  return (
    <form className="formulario respuestas" onSubmit={guardar}>
      {intro && <Markdown texto={intro.lineas.join("\n")} />}
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

      <div className="respuestas-acciones">
        <button type="submit" className="boton" disabled={estado.tipo === "guardando"}>
          {estado.tipo === "guardando" ? "Guardando…" : "Guardar respuestas"}
        </button>
        <p className="respuestas-estado" role="status" aria-live="polite">
          {sinGuardar
            ? "Hay cambios sin guardar."
            : estado.tipo === "guardado" && `Guardado a las ${estado.hora} en ejercicios/${ejercicio.id}/RESPUESTAS.md`}
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

/** Las preguntas, cada una en un desplegable con su recuadro de respuesta. */
export default function Respuestas({ ejercicio }: { ejercicio: Ejercicio }) {
  const guardadas = useCarga(`respuestas:${ejercicio.id}`, () => leerRespuestas(ejercicio.id))

  if (guardadas.estado === "error") return <ErrorCarga mensaje={guardadas.error} onReintentar={guardadas.recargar} />
  if (guardadas.estado !== "lista") return <Cargando texto="Buscando tus respuestas…" />

  return <Editor key={ejercicio.id} ejercicio={ejercicio} inicial={datosIniciales(ejercicio, guardadas.datos)} />
}
