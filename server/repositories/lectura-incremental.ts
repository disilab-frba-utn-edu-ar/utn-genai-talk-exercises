// Lee solo lo nuevo de un archivo de texto que otro proceso va agregando (los logs de los hooks y las
// transcripciones de los agentes): recuerda hasta dónde leyó y devuelve las líneas completas.
import { closeSync, openSync, readSync, statSync } from "node:fs"

export type Lectura = {
  /** Líneas completas nuevas (una línea escrita a medias espera a la próxima lectura). */
  lineas: string[]
  /** El archivo es más chico que lo ya leído (truncado o reemplazado): quien lo usa tiene que empezar de cero. */
  reinicio: boolean
}

export function crearSeguidor(ruta: string) {
  let offset = 0
  let resto: Buffer = Buffer.alloc(0)

  return {
    /** undefined si el archivo no existe o no se puede leer. */
    leer(): Lectura | undefined {
      let size: number
      try {
        size = statSync(ruta).size
      } catch {
        return undefined
      }
      const reinicio = size < offset
      if (reinicio) {
        offset = 0
        resto = Buffer.alloc(0)
      }
      if (size === offset) return { lineas: [], reinicio }

      // Se trabaja con bytes: un carácter multibyte puede quedar partido entre dos lecturas.
      const nuevos = Buffer.alloc(size - offset)
      const fd = openSync(ruta, "r")
      try {
        readSync(fd, nuevos, 0, nuevos.length, offset)
      } finally {
        closeSync(fd)
      }
      offset = size
      const datos = Buffer.concat([resto, nuevos])
      const corte = datos.lastIndexOf(0x0a)
      resto = datos.subarray(corte + 1)
      const lineas = datos.subarray(0, corte + 1).toString("utf-8").split("\n").filter((l) => l.trim())
      return { lineas, reinicio }
    },
  }
}
