// Las consignas viven en JSON, una carpeta por ejercicio. Cada texto es un array
// de líneas de markdown: unidas con "\n" son exactamente el documento original.
import indice from "../indice.json"

/** `insertarDespuesDe`: línea exacta de la consigna debajo de la cual se muestra (si no, va en su propia sección). */
export type Anexo = { titulo: string; archivo: string; insertarDespuesDe?: string; markdown: string[] }

type ArchivoEjercicio = {
  titulo: string
  duracion: string
  /** Para el temporizador: el máximo de la duración estimada. */
  minutos: number
  resumen: string
  /** Encabezados exactos de la consigna donde empiezan y terminan las preguntas (sin `hasta`: hasta el final). */
  preguntas: { desde: string; hasta?: string }
  consigna: string[]
  anexos: Anexo[]
  /** Lo que no es una pregunta: datos de la entrega, bitácoras, anexos. */
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

export type Pregunta = { numero: string; titulo: string; cuerpo: string; lineas: string[] }
export type BloquePreguntas = { tipo: "markdown"; lineas: string[] } | ({ tipo: "pregunta" } & Pregunta)

const INICIO_PREGUNTA = /^(\d+)\.\s+(.*)$/
const indentada = (linea: string) => linea === "" || /^\s/.test(linea)

/**
 * Separa cada pregunta numerada ("1. **Título.** …" y sus líneas indentadas) del resto del markdown,
 * para mostrarla en su propio desplegable con su recuadro de respuesta. Ninguna línea se pierde ni se repite.
 */
export function partirPreguntas(lineas: string[]): BloquePreguntas[] {
  const bloques: BloquePreguntas[] = []
  let i = 0
  while (i < lineas.length) {
    const inicio = lineas[i].match(INICIO_PREGUNTA)
    if (!inicio) {
      const ultimo = bloques.at(-1)
      if (ultimo?.tipo === "markdown") ultimo.lineas.push(lineas[i])
      else bloques.push({ tipo: "markdown", lineas: [lineas[i]] })
      i++
      continue
    }
    let fin = i + 1
    while (fin < lineas.length && indentada(lineas[fin])) fin++
    while (fin > i + 1 && lineas[fin - 1] === "") fin-- // las líneas en blanco del final vuelven al markdown
    const [, numero, primera] = inicio
    const negrita = primera.match(/^\*\*(.+?)\*\*\s*(.*)$/)
    const titulo = (negrita ? negrita[1] : primera).replace(/\.$/, "")
    const resto = lineas.slice(i + 1, fin).map((l) => l.replace(/^ {1,4}/, ""))
    const cuerpo = [negrita ? negrita[2] : "", ...resto].join("\n").trim()
    bloques.push({ tipo: "pregunta", numero, titulo, cuerpo, lineas: lineas.slice(i, fin) })
    i = fin
  }
  return bloques
}

export type Respuestas = { general: string; porPregunta: Record<string, string> }

/** El RESPUESTAS.md que se entrega: los datos generales y, debajo, cada pregunta con su respuesta. */
export function armarRespuestasMd(ejercicio: Ejercicio, { general, porPregunta }: Respuestas): string {
  const partes = [general.trim()]
  for (const bloque of partirPreguntas(partirConsigna(ejercicio).preguntas)) {
    if (bloque.tipo === "markdown") {
      partes.push(...bloque.lineas.filter((l) => l.startsWith("### ")).map((l) => l.replace(/^###/, "##")))
    } else {
      partes.push(`### ${bloque.numero}. ${bloque.titulo}`, porPregunta[bloque.numero]?.trim() || "_Sin responder._")
    }
  }
  return partes.join("\n\n") + "\n"
}
