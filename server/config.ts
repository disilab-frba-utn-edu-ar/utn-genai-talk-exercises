import { join } from "node:path"

export const PORT = Number(process.env.PORT ?? 3001)

/** Directorio de los archivos JSON. Los tests lo apuntan a una copia temporal. */
export const DEFAULT_DATA_DIR = process.env.DATA_DIR ?? join(process.cwd(), "data")
