// Las consignas viven en JSON, una carpeta por ejercicio. Cada texto es un array
// de líneas de markdown: unidas con "\n" son exactamente el documento original.
import indice from "../indice.json"

/** `insertarDespuesDe`: línea exacta de la consigna debajo de la cual se muestra (si no, va en su propia sección). */
export type Anexo = { titulo: string; archivo: string; insertarDespuesDe?: string; markdown: string[] }

type ArchivoEjercicio = {
  titulo: string
  duracion: string
  resumen: string
  /** Encabezados exactos de la consigna donde empiezan y terminan las preguntas (sin `hasta`: hasta el final). */
  preguntas: { desde: string; hasta?: string }
  consigna: string[]
  anexos: Anexo[]
  plantillaRespuestas: string[]
}

export type Ejercicio = ArchivoEjercicio & { id: string; numero: number }

const archivos = import.meta.glob<ArchivoEjercicio>("../*/ejercicio.json", { eager: true, import: "default" })

/** Ordenados por el prefijo de la carpeta (01-, 02-, …). */
export const ejercicios: Ejercicio[] = Object.keys(archivos)
  .sort()
  .map((ruta, i) => ({ ...archivos[ruta], id: ruta.split("/")[1], numero: i + 1 }))

export const introduccion = indice.introduccion.join("\n")

/** Divide la consigna en lo anterior a las preguntas, las preguntas y lo que sigue. Ninguna línea se pierde ni se repite. */
export function partirConsigna({ consigna, preguntas }: Ejercicio) {
  const desde = consigna.indexOf(preguntas.desde)
  const hasta = preguntas.hasta ? consigna.indexOf(preguntas.hasta) : consigna.length
  return { antes: consigna.slice(0, desde), preguntas: consigna.slice(desde, hasta), despues: consigna.slice(hasta) }
}

export type Bloque = { tipo: "markdown"; texto: string } | { tipo: "anexo"; anexo: Anexo }

/** Corta las líneas debajo de cada `insertarDespuesDe` para mostrar ahí el anexo (por ejemplo, el prompt a copiar). */
export function conAnexosEnLinea(lineas: string[], anexos: Anexo[]): Bloque[] {
  const bloques: Bloque[] = []
  let inicio = 0
  lineas.forEach((linea, i) => {
    const anexo = anexos.find((a) => a.insertarDespuesDe === linea)
    if (!anexo) return
    bloques.push({ tipo: "markdown", texto: lineas.slice(inicio, i + 1).join("\n") }, { tipo: "anexo", anexo })
    inicio = i + 1
  })
  bloques.push({ tipo: "markdown", texto: lineas.slice(inicio).join("\n") })
  return bloques
}
