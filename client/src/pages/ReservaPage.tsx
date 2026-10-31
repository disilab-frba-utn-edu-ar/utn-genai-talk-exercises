import type { Colectivo, MentoraPublica, Sesion, TipoAsesoria } from "@shared/types"
import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { api, ErrorDeApi } from "../api/client"
import { Cargando, ErrorCarga } from "../components/Estado"
import FormularioContacto, { type DatosContacto } from "../components/FormularioContacto"
import Paso from "../components/Paso"
import SelectorDia from "../components/SelectorDia"
import SelectorHorario from "../components/SelectorHorario"
import SelectorTipo from "../components/SelectorTipo"
import { fechaLarga } from "../formato"
import { useCarga } from "../hooks/useCarga"
import NoEncontradaPage from "./NoEncontradaPage"

export type EstadoConfirmacion = {
  sesion: Sesion
  mentora: MentoraPublica
  tipo: TipoAsesoria
  colectivo: Colectivo
}

export default function ReservaPage() {
  const { id = "" } = useParams()
  const navigate = useNavigate()

  const base = useCarga(`reserva:${id}`, () =>
    Promise.all([api.mentora(id), api.tiposAsesoria(), api.colectivos()]),
  )

  const [tipoId, setTipoId] = useState<string | null>(null)
  const [fecha, setFecha] = useState<string | null>(null)
  const [horaInicio, setHoraInicio] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)

  const disponibilidad = useCarga(tipoId ? `disponibilidad:${id}:${tipoId}` : null, () =>
    api.disponibilidad(id, tipoId!),
  )

  if (base.estado === "cargando" || base.estado === "inactiva") return <Cargando />
  if (base.estado === "error") {
    if (base.error === "La mentora no existe") return <NoEncontradaPage />
    return <ErrorCarga mensaje={base.error} onReintentar={base.recargar} />
  }

  const [mentora, todosLosTipos, colectivos] = base.datos
  const tipos = todosLosTipos.filter((t) => mentora.tiposAsesoria.includes(t.id))
  const tipo = tipos.find((t) => t.id === tipoId)
  const dia = disponibilidad.estado === "lista" ? disponibilidad.datos.find((d) => d.fecha === fecha) : undefined

  const elegirTipo = (nuevo: string) => {
    setTipoId(nuevo)
    setFecha(null)
    setHoraInicio(null)
    setErrorEnvio(null)
  }
  const elegirFecha = (nueva: string) => {
    setFecha(nueva)
    setHoraInicio(null)
    setErrorEnvio(null)
  }

  async function confirmar(datos: DatosContacto) {
    if (!tipo || !fecha || !horaInicio) return
    setEnviando(true)
    setErrorEnvio(null)
    try {
      const sesion = await api.crearSesion({ mentoraId: mentora.id, tipoAsesoriaId: tipo.id, fecha, horaInicio, ...datos })
      const colectivo = colectivos.find((c) => c.id === sesion.colectivoId)!
      const estado: EstadoConfirmacion = { sesion, mentora, tipo, colectivo }
      navigate("/confirmacion", { state: estado })
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : "No pudimos confirmar la sesión"
      if (error instanceof ErrorDeApi && error.status === 409) {
        setErrorEnvio(`${mensaje}. Elegí otro horario.`)
        setHoraInicio(null)
        disponibilidad.recargar()
      } else {
        setErrorEnvio(mensaje)
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
        <p className="sobretitulo">Reservar sesión con</p>
        <h1>{mentora.nombre}</h1>
        <p className="bajada">{mentora.presentacion}</p>
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
              <SelectorDia dias={disponibilidad.datos} seleccionado={fecha} onSeleccionar={elegirFecha} />
            )}
          </Paso>
        )}

        {fecha && disponibilidad.estado === "lista" && (
          <Paso numero={3} titulo={`¿A qué hora? · ${fechaLarga(fecha)}`}>
            {dia ? (
              <SelectorHorario horarios={dia.horarios} seleccionado={horaInicio} onSeleccionar={setHoraInicio} />
            ) : (
              <p>Ese día se quedó sin horarios libres. Elegí otro.</p>
            )}
          </Paso>
        )}

        {errorEnvio && (
          <p className="aviso-error" role="alert">
            {errorEnvio}
          </p>
        )}

        {horaInicio && (
          <Paso numero={4} titulo="Sus datos">
            <FormularioContacto colectivos={colectivos} enviando={enviando} onConfirmar={confirmar} />
          </Paso>
        )}
      </div>
    </div>
  )
}
