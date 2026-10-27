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

// ── Métricas de agentes (spec 003) ─────────────────────────────────────────

export type AgenteLog = "claude" | "codex" | "cline"

/** Una línea de logs/<agente>/<sesión>.jsonl tal como la escribe scripts/agent-logs/log-hook.mjs. Todo es opcional: los logs viejos no traen los campos nuevos. */
export type EntradaLog = {
  ts?: string
  agent?: string
  event?: string
  session?: string
  turn?: string
  model?: string
  subagent?: string
  subagentId?: string
  toolUseId?: string
  /** Ruta de la transcripción del agente (campo común de los hooks). Nunca sale del servidor. */
  transcriptPath?: string
  tool?: string
  kind?: string
  op?: string
  detail?: string
  input?: unknown
  output?: string
  outputChars?: number
  error?: unknown
  success?: boolean
  interrupted?: boolean
  durationMs?: number
  prompt?: string
  lastMessage?: string
}

export type FiltrosMetricas = {
  agente?: AgenteLog
  /** Id acortado (8 caracteres) de una sesión. */
  sesion?: string
  /** Minutos hacia atrás desde ahora; sin valor, todo el log. */
  ventanaMin?: number
  /** Modo detalle: incluye los comandos recientes (con secretos redactados). */
  detalle?: boolean
}

/** "actual" o "archivo/<fecha>" (carpetas creadas por npm run logs:limpiar). */
export type OrigenLogs = string

export type ConteoMetrica = { nombre: string; n: number }

export type SesionMetricas = {
  id: string
  agente: AgenteLog
  inicio: string
  duracionMs: number
  activoMs: number
  prompts: number
  turnos: number
  herramientas: number
  /** null: el agente no reporta fallas (nunca se muestra como 0). */
  fallas: number | null
  interrumpidas: number
  enCurso: boolean
  /** null: no se encontró la transcripción del agente (n/d, nunca 0). */
  tokens: TokensMetricas | null
  costoUsd: number | null
  costoParcial: boolean
  modelos: string[]
  cambiosDeModelo: number
}

export type PuntoLineaDeTiempo = {
  /** Milisegundos desde el inicio de la sesión. */
  t: number
  tipo: "herramienta" | "prompt" | "fin"
  kind?: string
  falla?: boolean
}

export type MetricasAgentes = {
  generado: string
  origen: OrigenLogs
  filtros: FiltrosMetricas
  vacio: boolean
  kpis: {
    sesiones: number
    prompts: number
    herramientas: number
    fallas: number | null
    /** Fallas / llamadas de los agentes que reportan fallas; null si ninguno reporta. */
    tasaFallas: number | null
    tiempoActivoMs: number
    caracteresDevueltos: number
    subagentesFinalizados: number
  }
  /** Eventos agrupados por tramo de `pasoMin` minutos. */
  porTiempo: { pasoMin: number; puntos: { t: string; porAgente: Partial<Record<AgenteLog, number>> }[] }
  herramientas: (ConteoMetrica & { kind: string })[]
  acciones: { agente: AgenteLog; kind: string; n: number }[]
  fallasPorHerramienta: ConteoMetrica[]
  duraciones: { kind: string; n: number; p50Ms: number; p95Ms: number }[]
  archivosLeidos: ConteoMetrica[]
  archivosEscritos: ConteoMetrica[]
  binarios: ConteoMetrica[]
  subagentes: ConteoMetrica[]
  skills: ConteoMetrica[]
  mcp: ConteoMetrica[]
  modelos: { agente: AgenteLog; modelo: string; n: number }[]
  sesiones: SesionMetricas[]
  enCurso: { agente: AgenteLog; sesion: string; herramienta: string; kind: string; desdeMs: number }[]
  lineaDeTiempo: { sesion: string; agente: AgenteLog; duracionMs: number; puntos: PuntoLineaDeTiempo[] } | null
  tokens: TokensDeMetricas
  /** Solo con `detalle`: comandos más recientes con secretos redactados. */
  comandosRecientes?: { ts: string; agente: AgenteLog; comando: string }[]
}

export type OrigenDisponible = { id: OrigenLogs; nombre: string }

// ── Tokens, modelos y costo (spec 003, C7) ─────────────────────────────────

/** Tokens de una solicitud al modelo, ya normalizados: `entrada` no incluye lo que vino de la caché. */
export type UsoTokens = {
  ts: string
  agente: AgenteLog
  /** Id de sesión tal como figura en el log de los hooks. */
  sesion: string
  modelo?: string
  entrada: number
  salida: number
  cacheLectura: number
  cacheEscritura5m: number
  cacheEscritura1h: number
}

/** Precios en USD por millón de tokens (metricas/precios-modelos.json). */
export type PreciosPorTramo = {
  entrada: number
  salida: number
  cacheLectura?: number
  cacheEscritura5m?: number
  cacheEscritura1h?: number
}

export type PrecioModelo = PreciosPorTramo & {
  id: string
  nombre: string
  proveedor: string
  /** Si el prompt (entrada + caché) supera este tamaño, rige `superior`. */
  umbralPrompt?: number
  superior?: PreciosPorTramo
}

export type TablaPrecios = {
  moneda: string
  actualizado: string
  fuentes: { proveedor: string; url: string; consultado: string | null; nota?: string }[]
  modelos: PrecioModelo[]
}

export type TokensMetricas = { entrada: number; salida: number; cacheLectura: number; cacheEscritura: number }

export type TokensDeMetricas = {
  /** Hay transcripciones legibles; si no, todo es "n/d". */
  disponible: boolean
  total: TokensMetricas | null
  /** `usd` es null si ningún modelo tiene precio; `parcial` si faltan precios de algunos. */
  costo: { usd: number | null; parcial: boolean; sinPrecio: string[] }
  porTiempo: { pasoMin: number; puntos: { t: string; porAgente: Partial<Record<AgenteLog, number>>; porTipo: TokensMetricas }[] }
  porModelo: (TokensMetricas & { agente: AgenteLog; modelo: string; solicitudes: number; costoUsd: number | null })[]
  cambiosDeModelo: { sesion: string; agente: AgenteLog; t: string; de: string; a: string }[]
}
