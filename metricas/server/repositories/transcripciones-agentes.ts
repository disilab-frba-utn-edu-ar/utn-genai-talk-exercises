// Transcripciones de los agentes: de ahí salen los tokens y el modelo, que los hooks no mandan.
// Se ubican por la ruta que guardó el hook (`transcriptPath`) o por los lugares estándar de cada agente,
// y se leen de forma incremental. Este módulo solo devuelve `UsoTokens`: el contenido de los mensajes
// no sale de acá (el parseo está en domain/uso-tokens.ts y solo toma modelo, tokens y timestamps).
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { homedir } from "node:os"
import { basename, isAbsolute, join } from "node:path"
import type { AgenteLog, UsoTokens } from "../../tipos"
import { crearParserCodex, usoDeLineaClaude, usosDeCline } from "../domain/uso-tokens"
import { crearSeguidor } from "../../../server/repositories/lectura-incremental"

export type SesionDeLog = {
  agente: AgenteLog
  /** Id de sesión tal como figura en el log de los hooks. */
  sesion: string
  /** Ruta de la transcripción que guardó el hook, si la mandó. */
  transcriptPath?: string
  /** Modelo que informaron los hooks; Cline no lo guarda en `ui_messages.json`. */
  modelo?: string
}

type Opciones = {
  /** Cada cuánto se vuelve a buscar la transcripción de una sesión que todavía no apareció. */
  reintentoMs?: number
}

const MAX_BYTES_CLINE = 50_000_000 // ui_messages.json se relee completo: un tope evita bloquear el servidor
const ID_SEGURO = /^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/

/** El nombre del archivo tiene que ser el de una transcripción de esa sesión: nada de rutas arbitrarias en disco. */
function rutaValida(agente: AgenteLog, sesion: string, ruta: string): boolean {
  if (!isAbsolute(ruta)) return false
  const nombre = basename(ruta.replaceAll("\\", "/"))
  if (agente === "claude") return nombre === `${sesion}.jsonl`
  if (agente === "codex") return nombre.startsWith("rollout-") && nombre.endsWith(`-${sesion}.jsonl`)
  return nombre === "ui_messages.json" && ruta.replaceAll("\\", "/").split("/").at(-2) === sesion
}

const subcarpetas = (dir: string) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
    : []

function buscarClaude(home: string, sesion: string) {
  const proyectos = join(home, ".claude", "projects")
  return subcarpetas(proyectos).map((p) => join(proyectos, p, `${sesion}.jsonl`)).find(existsSync)
}

/** Rollouts: sessions/AAAA/MM/DD/rollout-<fecha>-<id>.jsonl (y archived_sessions/), del más nuevo al más viejo. */
function buscarCodex(home: string, sesion: string) {
  const sufijo = `-${sesion}.jsonl`
  const enDia = (dir: string) => readdirSync(dir).find((f) => f.startsWith("rollout-") && f.endsWith(sufijo))
  const raiz = join(home, ".codex", "sessions")
  for (const a of subcarpetas(raiz).sort().reverse())
    for (const m of subcarpetas(join(raiz, a)).sort().reverse())
      for (const d of subcarpetas(join(raiz, a, m)).sort().reverse()) {
        const archivo = enDia(join(raiz, a, m, d))
        if (archivo) return join(raiz, a, m, d, archivo)
      }
  const archivadas = join(home, ".codex", "archived_sessions")
  const suelto = existsSync(archivadas) ? enDia(archivadas) : undefined
  return suelto ? join(archivadas, suelto) : undefined
}

function buscarCline(home: string, tarea: string) {
  const almacenamiento = ["Code", "Code - Insiders", "VSCodium"].flatMap((editor) => [
    join(home, ".config", editor, "User", "globalStorage"),
    join(home, "Library", "Application Support", editor, "User", "globalStorage"),
    join(home, "AppData", "Roaming", editor, "User", "globalStorage"),
  ])
  return [join(home, ".cline", "data"), ...almacenamiento.map((a) => join(a, "saoudrizwan.claude-dev"))]
    .map((raiz) => join(raiz, "tasks", tarea, "ui_messages.json"))
    .find(existsSync)
}

type Seguimiento = {
  ruta?: string
  ultimoIntento: number
  /** `transcriptPath` con el que se probó la última vez: si el hook manda otra, se prueba enseguida. */
  rutaIndicada?: string
  usos: UsoTokens[]
  /** Se rearma cuando el archivo se reemplaza. */
  leer?: () => boolean
}

export function crearRepositorioTranscripciones(home = homedir(), { reintentoMs = 15_000 }: Opciones = {}) {
  function ubicar({ agente, sesion, transcriptPath }: SesionDeLog): string | undefined {
    if (transcriptPath && rutaValida(agente, sesion, transcriptPath) && existsSync(transcriptPath)) return transcriptPath
    if (!ID_SEGURO.test(sesion)) return undefined
    return agente === "claude" ? buscarClaude(home, sesion) : agente === "codex" ? buscarCodex(home, sesion) : buscarCline(home, sesion)
  }

  /** Arma el lector del archivo: JSONL incremental para Claude y Codex; JSON completo para Cline. */
  function lectorDe(sesion: SesionDeLog, ruta: string, seguimiento: Seguimiento): () => boolean {
    if (sesion.agente === "cline") {
      let firma = ""
      return () => {
        const { size, mtimeMs } = statSync(ruta)
        if (`${size}:${mtimeMs}` === firma || size > MAX_BYTES_CLINE) return false
        firma = `${size}:${mtimeMs}`
        try {
          seguimiento.usos = usosDeCline(JSON.parse(readFileSync(ruta, "utf-8")), sesion.sesion, sesion.modelo)
        } catch {
          // el archivo se estaba escribiendo: se vuelve a intentar en la próxima lectura
          firma = ""
        }
        return true
      }
    }

    const seguidor = crearSeguidor(ruta)
    let vistos = new Set<string>()
    let parsear = crearParserCodex(sesion.sesion)
    return () => {
      const lectura = seguidor.leer()
      if (!lectura) return false
      let cambio = lectura.reinicio
      if (lectura.reinicio) {
        seguimiento.usos = []
        vistos = new Set()
        parsear = crearParserCodex(sesion.sesion)
      }
      for (const texto of lectura.lineas) {
        let linea: unknown
        try {
          linea = JSON.parse(texto)
        } catch {
          continue // línea inválida: se ignora
        }
        if (sesion.agente === "claude") {
          const r = usoDeLineaClaude(linea, sesion.sesion)
          if (r && !vistos.has(r.id)) {
            vistos.add(r.id) // Claude repite la respuesta en una línea por bloque de contenido
            seguimiento.usos.push(r.uso)
            cambio = true
          }
        } else {
          const uso = parsear(linea)
          if (uso) {
            seguimiento.usos.push(uso)
            cambio = true
          }
        }
      }
      return cambio
    }
  }

  return {
    lector() {
      const seguimientos = new Map<string, Seguimiento>()

      return {
        /** Revisa las transcripciones de las sesiones dadas. Devuelve true si hay tokens nuevos o cambiados. */
        actualizar(sesiones: SesionDeLog[], ahora = Date.now()): boolean {
          let cambio = false
          for (const sesion of sesiones) {
            const clave = `${sesion.agente}:${sesion.sesion}`
            const s = seguimientos.get(clave) ?? { ultimoIntento: -Infinity, usos: [] }
            seguimientos.set(clave, s)
            try {
              if (!s.ruta && (ahora - s.ultimoIntento >= reintentoMs || sesion.transcriptPath !== s.rutaIndicada)) {
                s.ultimoIntento = ahora
                s.rutaIndicada = sesion.transcriptPath
                const ruta = ubicar(sesion)
                if (ruta) {
                  s.ruta = ruta
                  s.leer = lectorDe(sesion, ruta, s)
                }
              }
              if (s.leer) cambio = s.leer() || cambio
            } catch {
              // una transcripción ilegible no afecta al resto del dashboard
            }
          }
          return cambio
        },
        usos: (): UsoTokens[] => [...seguimientos.values()].flatMap((s) => s.usos),
      }
    },
  }
}
