// Las consignas viven en JSON, una carpeta por ejercicio. Cada texto es un array
// de líneas de markdown: unidas con "\n" son exactamente el documento original.
import indice from "../indice.json"
import { cierreMd, datosDeEntregaMd, type Perfil } from "./perfil"

/**
 * `insertarDespuesDe`: línea exacta de la consigna debajo de la cual se muestra (si no, va en su propia sección).
 * `soloSiTerminado`: id de un ejercicio; el anexo se muestra recién cuando ese ejercicio está marcado como terminado.
 */
export type Anexo = {
  titulo: string
  archivo: string
  insertarDespuesDe?: string
  soloSiTerminado?: string
  /** En lugar del markdown, el panel para mandar pedidos a la API (ver ProbarApi.tsx). */
  componente?: "probar-api"
  markdown: string[]
}

/**
 * Una pantalla de la consigna por etapas: un tramo corto que entra en el marco sin scroll.
 * `desde` (incluida) y `hasta` (excluida) son líneas exactas de la consigna; sin `hasta`, va hasta el final.
 */
export type Pantalla = {
  titulo: string
  desde?: string
  hasta?: string
  /** En lugar de un tramo de la consigna, un anexo entero (por su título). */
  anexo?: string
  /** Un panel debajo del tramo: la prueba de la API, para ver el arreglo del agente. */
  agregar?: "probar-api"
  /** Lo que hay que haber hecho en esta pantalla: se tilda acá o en la hoja de checks. */
  check?: string
}

/** Contexto técnico → contexto del ejercicio → qué tenés que hacer: se desbloquean en orden. */
export type Etapa = { nombre: string; bajada: string; pantallas: Pantalla[] }

type ArchivoEjercicio = {
  titulo: string
  duracion: string
  /** Para el temporizador: el máximo de la duración estimada. */
  minutos: number
  resumen: string
  /**
   * Tramos de preguntas intercalados en la consigna, en orden: encabezados exactos donde empieza y
   * termina cada uno (sin `hasta`: hasta el final). Así se responde justo después de cada paso.
   */
  preguntas: { desde: string; hasta?: string }[]
  consigna: string[]
  anexos: Anexo[]
  /** Lo que no es una pregunta: datos de la entrega, bitácoras, anexos. */
  plantillaRespuestas: string[]
  /** Texto de ayuda en el recuadro de cada respuesta. */
  placeholder?: string
  /** Si al final de las preguntas se puede adjuntar una captura de pantalla (opcional). */
  captura?: boolean
  /**
   * La consigna partida en etapas y pantallas, con las preguntas aparte (siempre abiertas) y una caja
   * por sub-pregunta. Sin etapas, la consigna se muestra entera con las preguntas intercaladas.
   */
  etapas?: Etapa[]
}

export type Ejercicio = ArchivoEjercicio & { id: string; numero: number }

const archivos = import.meta.glob<ArchivoEjercicio>("../*/ejercicio.json", { eager: true, import: "default" })

/** Ordenados por el prefijo de la carpeta (01-, 02-, …). */
export const ejercicios: Ejercicio[] = Object.keys(archivos)
  .sort()
  .map((ruta, i) => ({ ...archivos[ruta], id: ruta.split("/")[1], numero: i + 1 }))

export const rama = indice.rama.join("\n")

export type Tramo = { tipo: "consigna" | "preguntas"; lineas: string[] }

/** Divide la consigna en tramos de pasos y de preguntas, en orden. Ninguna línea se pierde ni se repite. */
export function partirConsigna({ consigna, preguntas }: Ejercicio): Tramo[] {
  const tramos: Tramo[] = []
  let inicio = 0
  for (const { desde, hasta } of preguntas) {
    const i = consigna.indexOf(desde, inicio)
    const fin = hasta ? consigna.indexOf(hasta, i) : consigna.length
    if (i < 0 || fin < 0) throw new Error(`Tramo de preguntas no encontrado: ${desde} → ${hasta ?? "fin"}`)
    if (i > inicio) tramos.push({ tipo: "consigna", lineas: consigna.slice(inicio, i) })
    tramos.push({ tipo: "preguntas", lineas: consigna.slice(i, fin) })
    inicio = fin
  }
  if (inicio < consigna.length) tramos.push({ tipo: "consigna", lineas: consigna.slice(inicio) })
  return tramos
}

/** Todas las líneas de preguntas, de todos los tramos. */
export const lineasDePreguntas = (ejercicio: Ejercicio) =>
  partirConsigna(ejercicio).flatMap((t) => (t.tipo === "preguntas" ? t.lineas : []))

/** El ejercicio que sigue en el orden de la consigna (undefined en el último). */
export const siguienteDe = (ejercicio: Ejercicio): Ejercicio | undefined => ejercicios[ejercicio.numero]

/** El ejercicio anterior, que hay que terminar para habilitar este (undefined en el primero). */
export const anteriorDe = (ejercicio: Ejercicio): Ejercicio | undefined => ejercicios[ejercicio.numero - 2]

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

/* ── Consigna por etapas ────────────────────────────────── */

export type PantallaUbicada = Pantalla & {
  /** Posición en el recorrido completo del ejercicio (todas las etapas seguidas). */
  posicion: number
  etapa: number
  /** Posición dentro de su etapa y cuántas tiene la etapa. */
  indice: number
  deLaEtapa: number
}

/** Todas las pantallas del ejercicio, en orden, con la etapa a la que pertenecen. */
export function pantallasDe(ejercicio: Ejercicio): PantallaUbicada[] {
  let posicion = 0
  return (ejercicio.etapas ?? []).flatMap((etapa, i) =>
    etapa.pantallas.map((p, indice) => ({ ...p, posicion: posicion++, etapa: i, indice, deLaEtapa: etapa.pantallas.length })),
  )
}

/** Las líneas de la consigna que muestra una pantalla: de `desde` (incluida) a `hasta` (excluida). */
export function lineasDePantalla({ consigna, titulo }: Ejercicio, pantalla: Pantalla): string[] {
  if (!pantalla.desde) return []
  const i = consigna.indexOf(pantalla.desde)
  const fin = pantalla.hasta ? consigna.indexOf(pantalla.hasta, i + 1) : consigna.length
  if (i < 0 || fin < 0) throw new Error(`${titulo}: no está la línea «${i < 0 ? pantalla.desde : pantalla.hasta}»`)
  return consigna.slice(i, fin)
}

/** Los anexos que se muestran en el medio de la consigna, salvo los que tienen su propia pantalla. */
export const anexosEnLinea = (ejercicio: Ejercicio): Anexo[] => {
  const conPantalla = new Set(pantallasDe(ejercicio).flatMap((p) => (p.anexo ? [p.anexo] : [])))
  return ejercicio.anexos.filter((a) => a.insertarDespuesDe && !conPantalla.has(a.titulo))
}

/* ── Preguntas con una caja por sub-pregunta ────────────── */

export type Subpreguntas = { intro: string; subs: string[]; pista: string }

/**
 * Separa el cuerpo de una pregunta en su introducción, cada sub-pregunta ("- …", con sus líneas de
 * continuación) y la pista ("> …"). Sin sub-preguntas, la pregunta entera es una sola caja.
 */
export function partirSubpreguntas(cuerpo: string): Subpreguntas {
  const intro: string[] = []
  const subs: string[][] = []
  const pista: string[] = []
  for (const linea of cuerpo.split("\n")) {
    if (linea.startsWith("- ")) subs.push([linea.slice(2)])
    else if (/^>\s?/.test(linea)) pista.push(linea.replace(/^>\s?/, ""))
    else if (linea.trim() === "") continue
    else if (subs.length && /^\s/.test(linea)) subs.at(-1)!.push(linea.trim())
    else intro.push(linea)
  }
  const unidas = subs.map((s) => s.join("\n"))
  const textoIntro = intro.join("\n").trim()
  return unidas.length
    ? { intro: textoIntro, subs: unidas, pista: pista.join("\n").trim() }
    : { intro: "", subs: [textoIntro], pista: pista.join("\n").trim() }
}

export type Caja = { clave: string; numero: string; texto: string }
export type PreguntaPorCajas = Pregunta & Subpreguntas & { opcional: boolean; cajas: Caja[] }
export type BloqueCajas = { tipo: "markdown"; texto: string } | ({ tipo: "pregunta" } & PreguntaPorCajas)

const OPCIONAL = /opcional|si la hiciste/i

/**
 * Las preguntas de todos los tramos para la sección Preguntas: los encabezados de cada parte y cada
 * pregunta con una caja por sub-pregunta (clave "1.2" = pregunta 1, sub-pregunta 2). Los "## Paso N"
 * no van: en esta sección las preguntas están separadas de los pasos.
 */
export function preguntasPorCajas(ejercicio: Ejercicio): BloqueCajas[] {
  const bloques: BloqueCajas[] = []
  let encabezado = ""
  for (const b of partirPreguntas(lineasDePreguntas(ejercicio))) {
    if (b.tipo === "markdown") {
      const lineas = b.lineas.filter((l) => !/^## /.test(l))
      for (const l of lineas) if (/^#{3,4} /.test(l)) encabezado = l
      const texto = lineas.join("\n").trim()
      if (texto) bloques.push({ tipo: "markdown", texto })
      continue
    }
    const partes = partirSubpreguntas(b.cuerpo)
    bloques.push({
      ...b,
      ...partes,
      opcional: OPCIONAL.test(`${encabezado} ${b.titulo} ${partes.intro}`),
      cajas: partes.subs.map((texto, j) => ({ clave: `${b.numero}.${j + 1}`, numero: `${b.numero}.${j + 1}`, texto })),
    })
  }
  return bloques
}

/** Las respuestas guardadas, con las de antes de las cajas (una por pregunta) pasadas a su primera caja. */
export function migrarRespuestas(ejercicio: Ejercicio, porPregunta: Record<string, string>): Record<string, string> {
  if (!ejercicio.etapas) return porPregunta
  const migradas = { ...porPregunta }
  for (const [clave, texto] of Object.entries(porPregunta)) {
    if (!/^\d+$/.test(clave)) continue
    delete migradas[clave]
    if (!migradas[`${clave}.1`]?.trim()) migradas[`${clave}.1`] = texto
  }
  return migradas
}

/** Cuántas respuestas obligatorias tiene escritas: por caja con etapas, por pregunta sin. Las opcionales no cuentan. */
export function contarRespondidas(ejercicio: Ejercicio, porPregunta: Record<string, string>): { hechas: number; total: number } {
  const claves = ejercicio.etapas
    ? preguntasPorCajas(ejercicio).flatMap((b) => (b.tipo === "pregunta" && !b.opcional ? b.cajas.map((c) => c.clave) : []))
    : partirPreguntas(lineasDePreguntas(ejercicio)).flatMap((b) => (b.tipo === "pregunta" ? [b.numero] : []))
  return { hechas: claves.filter((c) => porPregunta[c]?.trim()).length, total: claves.length }
}

export type Respuestas = { general: string; porPregunta: Record<string, string> }

const SIN_RESPONDER = "_Sin responder._"

/**
 * El RESPUESTAS.md que se entrega: los datos generales, los datos de la entrega del perfil, cada pregunta
 * con su respuesta (con etapas, una por sub-pregunta) y, al final, el modelo y el agente del ejercicio.
 */
export function armarRespuestasMd(ejercicio: Ejercicio, { general, porPregunta }: Respuestas, perfil?: Perfil): string {
  const partes = [general.trim()]
  if (perfil) partes.push(datosDeEntregaMd(perfil, ejercicio.id))
  const titulo = (l: string) => l.replace(/^#{3,4}/, "##")
  if (ejercicio.etapas) {
    for (const b of preguntasPorCajas(ejercicio)) {
      if (b.tipo === "markdown") partes.push(...b.texto.split("\n").filter((l) => /^#{3,4} /.test(l)).map(titulo))
      else {
        partes.push(`### ${b.numero}. ${b.titulo}`)
        for (const c of b.cajas) {
          if (b.cajas.length > 1) partes.push(`**${c.numero}** ${c.texto.replace(/\n/g, " ")}`)
          partes.push(porPregunta[c.clave]?.trim() || SIN_RESPONDER)
        }
      }
    }
  } else {
    for (const bloque of partirPreguntas(lineasDePreguntas(ejercicio))) {
      if (bloque.tipo === "markdown") partes.push(...bloque.lineas.filter((l) => /^#{3,4} /.test(l)).map(titulo))
      else partes.push(`### ${bloque.numero}. ${bloque.titulo}`, porPregunta[bloque.numero]?.trim() || SIN_RESPONDER)
    }
  }
  if (perfil) partes.push(cierreMd(perfil, ejercicio.id))
  return partes.filter(Boolean).join("\n\n") + "\n"
}
