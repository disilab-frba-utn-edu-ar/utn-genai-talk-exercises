import type { SesionDetalle } from "@shared/types"
import { useEffect, useRef, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router"
import { api, ErrorDeApi } from "../api/client"
import CopiarEnlace from "../components/CopiarEnlace"
import DetalleSesion from "../components/DetalleSesion"
import { Cargando, ErrorCarga } from "../components/Estado"
import FormularioCancelacion from "../components/FormularioCancelacion"
import { useCarga } from "../hooks/useCarga"

/** Lo que ReservaPage manda al navegar acá después de confirmar. */
export type EstadoSesionPage = { recienReservada?: boolean }

function SesionNoEncontrada() {
  return (
    <section className="estado estado-vacio no-encontrada">
      <p className="sobretitulo">Error 404</p>
      <h1>No encontramos esta sesión</h1>
      <p>Puede que el enlace esté incompleto o mal copiado.</p>
      <Link to="/" className="boton">
        Ir al inicio
      </Link>
    </section>
  )
}

export default function SesionPage() {
  const { id = "" } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const marcaEnHistorial = (location.state as EstadoSesionPage | null)?.recienReservada === true
  // La marca se lee una vez y se borra del historial: el navegador conserva history.state al
  // recargar, y al recargar el título tiene que volver a ser "Tu sesión" (research D7).
  const [recienReservada] = useState(marcaEnHistorial)
  useEffect(() => {
    if (marcaEnHistorial) navigate(location.pathname, { replace: true, state: null })
  }, [marcaEnHistorial, navigate, location.pathname])

  const sesion = useCarga(`sesion:${id}`, () => api.sesion(id))
  const mentoraId = sesion.estado === "lista" ? sesion.datos.mentoraId : null
  const contexto = useCarga(mentoraId ? `sesion-contexto:${mentoraId}` : null, () =>
    Promise.all([api.mentora(mentoraId!), api.tiposAsesoria(), api.colectivos()]),
  )

  const [cancelada, setCancelada] = useState<SesionDetalle | null>(null)
  const [cancelando, setCancelando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [errorCancelacion, setErrorCancelacion] = useState<string | null>(null)
  /** El servidor rechazó la cancelación (409): por ejemplo, venció el plazo con la página abierta. */
  const [rechazo, setRechazo] = useState<string | null>(null)

  // Cuando desaparece el control que tenía el foco (el formulario o el botón), el foco no
  // puede quedar en <body>: vuelve a "Cancelar sesión" o va al mensaje de resultado.
  // El pedido se anota en el evento y se aplica después del render que monta el destino.
  const enfocar = useRef<"boton" | "mensaje" | null>(null)
  const botonCancelar = useRef<HTMLButtonElement>(null)
  const mensajeResultado = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    if (enfocar.current === "boton") botonCancelar.current?.focus()
    if (enfocar.current === "mensaje") mensajeResultado.current?.focus()
    enfocar.current = null
  })

  if (sesion.estado === "cargando" || sesion.estado === "inactiva") return <Cargando />
  if (sesion.estado === "error") {
    if (sesion.error === "La sesión no existe") return <SesionNoEncontrada />
    return <ErrorCarga mensaje={sesion.error} onReintentar={sesion.recargar} />
  }
  if (contexto.estado === "cargando" || contexto.estado === "inactiva") return <Cargando />
  if (contexto.estado === "error") return <ErrorCarga mensaje={contexto.error} onReintentar={contexto.recargar} />

  const detalle = cancelada ?? sesion.datos
  const [mentora, tipos, colectivos] = contexto.datos
  const tipo = tipos.find((t) => t.id === detalle.tipoAsesoriaId)
  const colectivo = colectivos.find((c) => c.id === detalle.colectivoId)
  if (!tipo || !colectivo) return <ErrorCarga mensaje="No pudimos mostrar los datos de esta sesión" />

  async function confirmarCancelacion(motivo?: string) {
    setEnviando(true)
    setErrorCancelacion(null)
    try {
      setCancelada(await api.cancelarSesion(detalle.id, motivo ? { estado: "cancelada", motivo } : { estado: "cancelada" }))
      enfocar.current = "mensaje"
      setCancelando(false)
    } catch (error) {
      if (error instanceof ErrorDeApi && error.status === 409) {
        setRechazo(error.message)
        setCancelando(false)
        sesion.recargar()
      } else {
        setErrorCancelacion(error instanceof Error ? error.message : "No pudimos cancelar la sesión")
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="confirmacion" aria-labelledby="titulo-sesion">
      {recienReservada && (
        <span className="confirmacion-icono" aria-hidden="true">
          ✓
        </span>
      )}
      <h1 id="titulo-sesion">{recienReservada ? "¡Sesión confirmada!" : "Tu sesión"}</h1>
      {recienReservada && <p className="bajada">Ese horario ya quedó reservado con {mentora.nombre}.</p>}

      <DetalleSesion sesion={detalle} mentora={mentora} tipo={tipo} colectivo={colectivo} />

      <p className="cancelacion-resultado" role="status" ref={mensajeResultado} tabIndex={-1}>
        {cancelada ? "La sesión quedó cancelada. El horario volvió a quedar libre." : ""}
      </p>

      {rechazo ? (
        <p className="aviso-error" role="alert">
          {rechazo}
        </p>
      ) : (
        !detalle.cancelacion.permitida &&
        detalle.cancelacion.razon !== "ya_cancelada" && <p className="aviso-info">{detalle.cancelacion.mensaje}</p>
      )}

      {detalle.cancelacion.permitida &&
        (cancelando ? (
          <FormularioCancelacion
            enviando={enviando}
            error={errorCancelacion}
            onConfirmar={confirmarCancelacion}
            onVolver={() => {
              setCancelando(false)
              enfocar.current = "boton"
              setErrorCancelacion(null)
            }}
          />
        ) : (
          <button type="button" className="boton boton-peligro" ref={botonCancelar} onClick={() => setCancelando(true)}>
            Cancelar sesión
          </button>
        ))}

      <CopiarEnlace id={detalle.id} />

      <Link to="/" className="boton">
        Volver al inicio
      </Link>
    </section>
  )
}
