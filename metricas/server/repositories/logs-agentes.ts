// Acceso a los logs de los agentes (logs/<agente>/<sesión>.jsonl, que escribe scripts/agent-logs/log-hook.mjs).
// Lectura incremental: por archivo se recuerda hasta dónde se leyó y solo se agrega lo nuevo.
import { existsSync, readdirSync } from "node:fs"
import { join } from "node:path"
import type { EntradaLog, OrigenDisponible, OrigenLogs } from "../../tipos"
import { crearSeguidor } from "../../../server/repositories/lectura-incremental"

const ARCHIVO = "archivo" // logs/archivo/<fecha>: lo que mueve npm run logs:limpiar

export type LectorLogs = {
  /** Lee lo nuevo. Devuelve true si cambió algo (líneas nuevas, archivos truncados o desaparecidos). */
  actualizar(): boolean
  entradas(): EntradaLog[]
}

type EstadoArchivo = { seguidor: ReturnType<typeof crearSeguidor>; entradas: EntradaLog[] }

function listarJsonl(dir: string, saltar: string[] = []): string[] {
  if (!existsSync(dir)) return []
  const archivos: string[] = []
  for (const nombre of readdirSync(dir, { withFileTypes: true })) {
    if (saltar.includes(nombre.name)) continue
    const ruta = join(dir, nombre.name)
    if (nombre.isDirectory()) archivos.push(...listarJsonl(ruta))
    else if (nombre.name.endsWith(".jsonl")) archivos.push(ruta)
  }
  return archivos
}

function crearLector(dir: string, saltar: string[]): LectorLogs {
  const archivos = new Map<string, EstadoArchivo>()

  function leerArchivo(estado: EstadoArchivo): boolean {
    const lectura = estado.seguidor.leer()
    if (!lectura) return false
    let cambio = lectura.reinicio
    if (lectura.reinicio) estado.entradas = []
    for (const texto of lectura.lineas) {
      try {
        estado.entradas.push(JSON.parse(texto) as EntradaLog)
        cambio = true
      } catch {
        // línea inválida: se ignora, igual que en logs:resumen
      }
    }
    return cambio
  }

  return {
    actualizar() {
      let cambio = false
      const presentes = new Set(listarJsonl(dir, saltar))
      for (const ruta of archivos.keys()) {
        if (!presentes.has(ruta)) {
          archivos.delete(ruta) // movido o borrado (npm run logs:limpiar)
          cambio = true
        }
      }
      for (const ruta of presentes) {
        const estado = archivos.get(ruta) ?? { seguidor: crearSeguidor(ruta), entradas: [] }
        archivos.set(ruta, estado)
        cambio = leerArchivo(estado) || cambio
      }
      return cambio
    },
    entradas: () => [...archivos.values()].flatMap((estado) => estado.entradas),
  }
}

export function crearRepositorioLogs(logsDir: string) {
  const dirArchivo = join(logsDir, ARCHIVO)
  const carpetasArchivadas = () =>
    existsSync(dirArchivo)
      ? readdirSync(dirArchivo, { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .map((d) => d.name)
          .sort()
          .reverse()
      : []

  return {
    logsDir,
    origenes(): OrigenDisponible[] {
      return [
        { id: "actual", nombre: "Actual" },
        ...carpetasArchivadas().map((fecha) => ({ id: `${ARCHIVO}/${fecha}`, nombre: `Archivo ${fecha}` })),
      ]
    },
    /** Un origen solo se acepta si figura en el listado: nunca se arma una ruta con lo que mandó el cliente. */
    lector(origen: OrigenLogs): LectorLogs | undefined {
      if (origen === "actual") return crearLector(logsDir, [ARCHIVO])
      const fecha = origen.startsWith(`${ARCHIVO}/`) ? origen.slice(ARCHIVO.length + 1) : undefined
      if (!fecha || !carpetasArchivadas().includes(fecha)) return undefined
      return crearLector(join(dirArchivo, fecha), [])
    },
  }
}

export type RepositorioLogs = ReturnType<typeof crearRepositorioLogs>
