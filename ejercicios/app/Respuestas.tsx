import { useEffect, useState, type FormEvent } from "react"
import { Cargando, ErrorCarga } from "../../client/src/components/Estado"
import { useCarga } from "../../client/src/hooks/useCarga"
import { guardarRespuestas, leerRespuestas } from "./api"
import type { Ejercicio } from "./contenido"

type Estado = { tipo: "editando" } | { tipo: "guardando" } | { tipo: "guardado"; hora: string } | { tipo: "error"; mensaje: string }

const hora = (iso: string) => new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })

function Editor({ ejercicio, inicial }: { ejercicio: Ejercicio; inicial: string }) {
  const [texto, setTexto] = useState(inicial)
  const [guardadoComo, setGuardadoComo] = useState(inicial)
  const [estado, setEstado] = useState<Estado>({ tipo: "editando" })
  const sinGuardar = texto !== guardadoComo

  // Avisa antes de cerrar la pestaña con cambios sin guardar.
  useEffect(() => {
    if (!sinGuardar) return
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", avisar)
    return () => window.removeEventListener("beforeunload", avisar)
  }, [sinGuardar])

  async function guardar(evento: FormEvent) {
    evento.preventDefault()
    setEstado({ tipo: "guardando" })
    try {
      const guardadas = await guardarRespuestas(ejercicio.id, texto)
      setGuardadoComo(texto)
      setEstado({ tipo: "guardado", hora: hora(guardadas.guardado) })
    } catch (error) {
      setEstado({ tipo: "error", mensaje: error instanceof Error ? error.message : String(error) })
    }
  }

  return (
    <form className="formulario responder-respuestas" onSubmit={guardar}>
      <label htmlFor={`respuestas-${ejercicio.id}`} className="sr-only">
        Tus respuestas
      </label>
      <textarea
        id={`respuestas-${ejercicio.id}`}
        className="editor-respuestas"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        spellCheck
        rows={24}
      />
      <div className="respuestas-acciones">
        <button type="submit" className="boton" disabled={estado.tipo === "guardando"}>
          {estado.tipo === "guardando" ? "Guardando…" : "Guardar respuestas"}
        </button>
        <p className="respuestas-estado" role="status" aria-live="polite">
          {sinGuardar
            ? "Hay cambios sin guardar."
            : estado.tipo === "guardado" && `Guardado a las ${estado.hora} en ejercicios/${ejercicio.id}/respuestas.json`}
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

/** Arranca con lo último guardado o, si no hay nada, con la plantilla del ejercicio. */
export default function Respuestas({ ejercicio }: { ejercicio: Ejercicio }) {
  const guardadas = useCarga(`respuestas:${ejercicio.id}`, () => leerRespuestas(ejercicio.id))

  if (guardadas.estado === "error") return <ErrorCarga mensaje={guardadas.error} onReintentar={guardadas.recargar} />
  if (guardadas.estado !== "lista") return <Cargando texto="Buscando tus respuestas…" />

  const inicial = (guardadas.datos?.respuestas ?? ejercicio.plantillaRespuestas).join("\n")
  return <Editor key={ejercicio.id} ejercicio={ejercicio} inicial={inicial} />
}
