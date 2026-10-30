// La API del dashboard de Métricas. No es parte del producto: server/app.ts solo la engancha en
// /api/metricas-agentes (como el cliente monta /ejercicios y /metricas).
import { join } from "node:path"
import preciosModelos from "../precios-modelos.json"
import type { TablaPrecios } from "../tipos"
import { crearRepositorioLogs } from "./repositories/logs-agentes"
import { crearRepositorioTranscripciones } from "./repositories/transcripciones-agentes"
import { rutasMetricasAgentes } from "./routes/metricas-agentes"
import { crearServicioMetricas, type OpcionesMetricas } from "./services/metricas-agentes"

export type { OpcionesMetricas }

/** Raíz del repo: las rutas de las métricas se muestran relativas a ella. */
const REPO_DIR = process.cwd()

/** Logs de los hooks de los agentes (la misma variable que usan los scripts de scripts/agent-logs). */
export const DEFAULT_LOGS_DIR = process.env.AGENT_LOG_DIR ?? join(process.cwd(), "logs")

export const rutasMetricas = (logsDir: string, opciones?: OpcionesMetricas) =>
  rutasMetricasAgentes(
    crearServicioMetricas(
      crearRepositorioLogs(logsDir),
      crearRepositorioTranscripciones(opciones?.homeDir),
      REPO_DIR,
      opciones?.precios ?? (preciosModelos as TablaPrecios),
      opciones,
    ),
  )
