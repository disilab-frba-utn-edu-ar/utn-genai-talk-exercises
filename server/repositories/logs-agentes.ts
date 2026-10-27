// Acceso a los logs de los agentes (logs/<agente>/<sesión>.jsonl, que escribe scripts/agent-logs/log-hook.mjs).
// Lectura incremental: por archivo se recuerda hasta dónde se leyó y solo se agrega lo nuevo.
import { closeSync, existsSync, openSync, readdirSync, readSync, statSync } from "node:fs"
import { join } from "node:path"
import type { EntradaLog, OrigenDisponible, OrigenLogs } from "@shared/types"

const ARCHIVO = "archivo" // logs/archivo/<fecha>: lo que mueve npm run logs:limpiar

export type LectorLogs = {
  /** Lee lo nuevo. Devuelve true si cambió algo (líneas nuevas, archivos truncados o desaparecidos). */
  actualizar(): boolean
  entradas(): EntradaLog[]
}

type EstadoArchivo = { offset: number; resto: Buffer; entradas: EntradaLog[] }

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

function leerDesde(ruta: string, desde: number, hasta: number): Buffer {
  const fd = openSync(ruta, "r")
  try {
    const buffer = Buffer.alloc(hasta - desde)
    readSync(fd, buffer, 0, buffer.length, desde)
    return buffer
  } finally {
    closeSync(fd)
  }
}

function crearLector(dir: string, saltar: string[]): LectorLogs {
  const archivos = new Map<string, EstadoArchivo>()

  function leerArchivo(ruta: string, estado: EstadoArchivo): boolean {
    let size: number
    try {
      size = statSync(ruta).size
    } catch {
      return false
    }
    let cambio = false
    if (size < estado.offset) {
      Object.assign(estado, { offset: 0, resto: Buffer.alloc(0), entradas: [] })
      cambio = true
    }
    if (size === estado.offset) return cambio

    // Se trabaja con bytes: un carácter multibyte puede quedar partido entre dos lecturas.
    const datos = Buffer.concat([estado.resto, leerDesde(ruta, estado.offset, size)])
    estado.offset = size
    const corte = datos.lastIndexOf(0x0a)
    estado.resto = datos.subarray(corte + 1)
    for (const texto of datos.subarray(0, corte + 1).toString("utf-8").split("\n")) {
      if (!texto.trim()) continue
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
        const estado = archivos.get(ruta) ?? { offset: 0, resto: Buffer.alloc(0), entradas: [] }
        archivos.set(ruta, estado)
        cambio = leerArchivo(ruta, estado) || cambio
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
