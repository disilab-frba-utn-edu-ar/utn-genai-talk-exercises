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
  /** Horas que dona por mes calendario. Ausente = sin límite. Privado: no sale por la API. */
  cupoMensualHoras?: number
  contacto: { email: string }
}

/** Lo que la API devuelve de una mentora: nunca incluye `contacto` ni el cupo total (Principio IV). */
export type MentoraPublica = Omit<Mentora, "contacto" | "cupoMensualHoras"> & {
  tiposAsesoria: string[]
  /** Horas que le quedan este mes. Ausente si no tiene cupo definido; 0 = sin cupo. */
  horasRestantes?: number
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
}

/** Lo que los listados públicos devuelven de una sesión: sin datos de contacto (Principio IV). */
export type SesionPublica = Omit<Sesion, "contactoNombre" | "contactoEmail">

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
