// Tipos compartidos entre el cliente y el servidor.
// Ver specs/001-reservar-sesion/data-model.md

export type Habilidad = {
  id: string
  titulo: string
  descripcion: string
}

export type TipoAsesoria = {
  id: string
  nombre: string
  descripcion: string
  duracionMinutos: number
  habilidades: string[]
}

export type DiaSemana = "lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado" | "domingo"

export type RangoHorario = { inicio: string; fin: string }

export type Disponibilidad = Record<DiaSemana, RangoHorario | null>

export type Mentora = {
  id: string
  nombre: string
  pronombres?: string
  github?: string
  presentacion: string
  habilidades: string[]
  disponibilidad: Disponibilidad
  contacto: { email: string }
}

/** Lo que la API devuelve de una mentora: nunca incluye `contacto` (Principio IV). */
export type MentoraPublica = Omit<Mentora, "contacto"> & {
  tiposAsesoria: string[]
}

export type TipoColectivo = "fundacion" | "asociacion_barrial" | "ong" | "asamblea"

export type Colectivo = {
  id: string
  nombre: string
  tipo: TipoColectivo
  ubicacion?: string
}

export type EstadoSesion = "confirmada" | "cancelada"

export type Sesion = {
  id: string
  mentoraId: string
  tipoAsesoriaId: string
  colectivoId: string
  proyecto: string
  contactoNombre: string
  contactoEmail: string
  fecha: string
  horaInicio: string
  horaFin: string
  estado: EstadoSesion
  motivoCancelacion?: string
  /** Instante de la cancelación, en ISO 8601. Ver specs/003-cancelar-sesion/data-model.md */
  canceladaEn?: string
}

/** Vista pública base de una sesión: sin datos de contacto (Principio IV) ni de cancelación. */
export type SesionPublica = Omit<Sesion, "contactoNombre" | "contactoEmail" | "motivoCancelacion" | "canceladaEn">

/** Lo que el listado público devuelve: tampoco el id, que es la credencial del enlace de la sesión. */
export type SesionListada = Omit<SesionPublica, "id">

export type RazonNoCancelable = "ya_cancelada" | "ya_ocurrio" | "fuera_de_plazo"

export type Cancelacion = { permitida: true } | { permitida: false; razon: RazonNoCancelable; mensaje: string }

/** Lo que ve quien tiene el enlace de la sesión: incluye el motivo y si se puede cancelar. */
export type SesionDetalle = SesionPublica & {
  motivoCancelacion?: string
  canceladaEn?: string
  cancelacion: Cancelacion
}

export type CambioSesion = { estado: "cancelada"; motivo?: string }

export type NuevaSesion = Pick<
  Sesion,
  "mentoraId" | "tipoAsesoriaId" | "colectivoId" | "proyecto" | "contactoNombre" | "contactoEmail" | "fecha" | "horaInicio"
>

export type Horario = RangoHorario

export type DiaDisponible = {
  fecha: string
  horarios: Horario[]
}

export type ErrorApi = { error: string }
