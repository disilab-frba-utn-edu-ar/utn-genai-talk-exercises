import type { MentoraPublica } from "@shared/types"
import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { api, ErrorDeApi } from "../api/client"
import { Cargando, ErrorCarga } from "../components/Estado"
import FormularioContacto, { type DatosContacto } from "../components/FormularioContacto"
import MentoraAsignada from "../components/MentoraAsignada"
import Paso from "../components/Paso"
import SelectorDia from "../components/SelectorDia"
import SelectorHorario from "../components/SelectorHorario"
import SelectorTipo from "../components/SelectorTipo"
import { fechaLarga } from "../formato"
import { useCarga } from "../hooks/useCarga"
import type { EstadoConfirmacion } from "./ReservaPage"

/** Reservar eligiendo solo el tipo de asesoría: la plataforma asigna la mentora (specs/003). */
export default function ReservaPorTipoPage() {
  const navigate = useNavigate()

  const base = useCarga("reserva-por-tipo", () => Promise.all([api.tiposAsesoria(), api.mentoras(), api.colectivos()]))

  const [tipoId, setTipoId] = useState<string | null>(null)
  const [fecha, setFecha] = useState<string | null>(null)
  const [horaInicio, setHoraInicio] = useState<string | null>(null)
  const [reasignada, setReasignada] = useState<{ mentora: MentoraPublica; anterior: string } | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)

  const disponibilidad = useCarga(tipoId ? `disponibilidad-tipo:${tipoId}` : null, () =>
    api.disponibilidadPorTipo(tipoId!),
  )
  const asignacion = useCarga(tipoId && fecha && horaInicio ? `asignacion:${tipoId}:${fecha}:${horaInicio}` : null, () =>
    api.asignacion(tipoId!, fecha!, horaInicio!),
  )

  if (base.estado === "cargando" || base.estado === "inactiva") return <Cargando />
  if (base.estado === "error") return <ErrorCarga mensaje={base.error} onReintentar={base.recargar} />

  const [todosLosTipos, mentoras, colectivos] = base.datos
  const tipos = todosLosTipos.filter((t) => mentoras.some((m) => m.tiposAsesoria.includes(t.id)))
  const tipo = tipos.find((t) => t.id === tipoId)
  const dia = disponibilidad.estado === "lista" ? disponibilidad.datos.find((d) => d.fecha === fecha) : undefined
  const mentora = reasignada?.mentora ?? (asignacion.estado === "lista" ? asignacion.datos : undefined)

  const limpiar = () => {
    setReasignada(null)
    setErrorEnvio(null)
  }
  const elegirTipo = (nuevo: string) => {
    setTipoId(nuevo)
    setFecha(null)
    setHoraInicio(null)
    limpiar()
  }
  const elegirFecha = (nueva: string) => {
    setFecha(nueva)
    setHoraInicio(null)
    limpiar()
  }
  const elegirHorario = (nuevo: string) => {
    setHoraInicio(nuevo)
    limpiar()
  }

  /** La mentora mostrada se ocupó: se busca otra y se pide confirmar de nuevo (research.md, R4). */
  async function reasignar(anterior: MentoraPublica) {
    try {
      const nueva = await api.asignacion(tipoId!, fecha!, horaInicio!)
      if (nueva.id === anterior.id) {
        setErrorEnvio("No pudimos confirmar la sesión. Intentá de nuevo.")
        return
      }
      setReasignada({ mentora: nueva, anterior: anterior.nombre })
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : "No pudimos confirmar la sesión"
      if (error instanceof ErrorDeApi && error.status === 409) {
        setErrorEnvio("Ese horario ya no está disponible: ninguna mentora quedó libre. Elegí otro horario.")
        setHoraInicio(null)
        setReasignada(null)
        disponibilidad.recargar()
      } else {
        setErrorEnvio(mensaje)
      }
    }
  }

  async function confirmar(datos: DatosContacto) {
    if (!tipo || !fecha || !horaInicio || !mentora) return
    setEnviando(true)
    setErrorEnvio(null)
    try {
      const sesion = await api.crearSesion({ mentoraId: mentora.id, tipoAsesoriaId: tipo.id, fecha, horaInicio, ...datos })
      const colectivo = colectivos.find((c) => c.id === sesion.colectivoId)!
      const estado: EstadoConfirmacion = { sesion, mentora, tipo, colectivo }
      navigate("/confirmacion", { state: estado })
    } catch (error) {
      if (error instanceof ErrorDeApi && error.status === 409) {
        await reasignar(mentora)
      } else {
        setErrorEnvio(error instanceof Error ? error.message : "No pudimos confirmar la sesión")
      }
      setEnviando(false)
    }
  }

  return (
    <div className="reserva-pagina">
      <Link to="/" className="volver">
        <span aria-hidden="true">←</span> Todas las mentoras
      </Link>

      <header className="reserva-cabecera">
        <p className="sobretitulo">Reservar por tipo de asesoría</p>
        <h1>Contanos qué necesitan</h1>
        <p className="bajada">
          No hace falta conocer a nadie: elegí el tipo de ayuda y un horario, y te asignamos una mentora que pueda darla.
        </p>
      </header>

      <div className="reserva">
        <Paso numero={1} titulo="¿Qué tipo de ayuda necesitan?">
          <SelectorTipo tipos={tipos} seleccionado={tipoId} onSeleccionar={elegirTipo} />
        </Paso>

        {tipoId && (
          <Paso numero={2} titulo="¿Qué día?">
            {disponibilidad.estado === "cargando" && <Cargando texto="Buscando días con lugar…" />}
            {disponibilidad.estado === "error" && (
              <ErrorCarga mensaje={disponibilidad.error} onReintentar={disponibilidad.recargar} />
            )}
            {disponibilidad.estado === "lista" && (
              <SelectorDia
                dias={disponibilidad.datos}
                seleccionado={fecha}
                onSeleccionar={elegirFecha}
                mensajeVacio="Ninguna mentora tiene horarios libres para este tipo de asesoría. Probá con otro tipo."
              />
            )}
          </Paso>
        )}

        {fecha && disponibilidad.estado === "lista" && (
          <Paso numero={3} titulo={`¿A qué hora? · ${fechaLarga(fecha)}`}>
            {dia ? (
              <SelectorHorario horarios={dia.horarios} seleccionado={horaInicio} onSeleccionar={elegirHorario} />
            ) : (
              <p>Ese día se quedó sin horarios libres. Elegí otro.</p>
            )}
          </Paso>
        )}

        {horaInicio && (
          <Paso numero={4} titulo="Los va a acompañar">
            {asignacion.estado === "cargando" && !reasignada && <Cargando texto="Buscando una mentora libre…" />}
            {asignacion.estado === "error" && !reasignada && (
              <ErrorCarga mensaje={`${asignacion.error}. Elegí otro horario.`} />
            )}
            {mentora && <MentoraAsignada mentora={mentora} anterior={reasignada?.anterior} />}
          </Paso>
        )}

        {errorEnvio && (
          <p className="aviso-error" role="alert">
            {errorEnvio}
          </p>
        )}

        {horaInicio && mentora && (
          <Paso numero={5} titulo="Sus datos">
            <FormularioContacto colectivos={colectivos} enviando={enviando} onConfirmar={confirmar} />
          </Paso>
        )}
      </div>
    </div>
  )
}
