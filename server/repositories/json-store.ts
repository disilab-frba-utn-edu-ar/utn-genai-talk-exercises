import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

/** Acceso genérico a una colección guardada como un arreglo en un archivo JSON. */
export function crearJsonStore<T>(dataDir: string, archivo: string) {
  const ruta = join(dataDir, archivo)

  return {
    leer(): T[] {
      if (!existsSync(ruta)) return []
      return JSON.parse(readFileSync(ruta, "utf-8")) as T[]
    },
    escribir(items: T[]): void {
      writeFileSync(ruta, JSON.stringify(items, null, 2) + "\n", "utf-8")
    },
  }
}
