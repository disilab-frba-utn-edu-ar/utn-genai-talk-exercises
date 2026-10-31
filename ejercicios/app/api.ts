// Único lugar de los ejercicios que hace fetch. Lo atiende ejercicios/vite-plugin.ts.
export type RespuestasGuardadas = {
  ejercicio: string
  guardado: string
  general: string[]
  /** Por número de pregunta, cada respuesta como líneas. */
  respuestas: Record<string, string[]>
}

async function pedir<T>(id: string, opciones?: RequestInit): Promise<T> {
  let respuesta: Response
  try {
    respuesta = await fetch(`/ejercicios-api/${encodeURIComponent(id)}/respuestas`, {
      ...opciones,
      headers: { "Content-Type": "application/json" },
    })
  } catch {
    throw new Error("No pudimos conectarnos. ¿Está corriendo npm run dev?")
  }
  const cuerpo = await respuesta.json().catch(() => {
    throw new Error("Las respuestas solo se pueden guardar con npm run dev.")
  })
  if (!respuesta.ok) throw new Error(cuerpo?.error ?? "Ocurrió un error inesperado")
  return cuerpo as T
}

export const leerRespuestas = (id: string) => pedir<RespuestasGuardadas | null>(id)

export const guardarRespuestas = (id: string, datos: { general: string; respuestas: Record<string, string>; markdown: string }) =>
  pedir<RespuestasGuardadas>(id, { method: "PUT", body: JSON.stringify(datos) })

// La captura de pantalla (opcional) se guarda aparte, como imagen: ejercicios/<id>/captura.<ext>.
const urlCaptura = (id: string) => `/ejercicios-api/${encodeURIComponent(id)}/captura`

async function pedirCaptura(id: string, opciones?: RequestInit): Promise<Response> {
  let respuesta: Response
  try {
    respuesta = await fetch(urlCaptura(id), opciones)
  } catch {
    throw new Error("No pudimos conectarnos. ¿Está corriendo npm run dev?")
  }
  // Al leer, 404 es "todavía no hay captura"; al guardar o borrar, es un error.
  const sinCaptura = respuesta.status === 404 && !opciones?.method
  if (!respuesta.ok && !sinCaptura) {
    const cuerpo = await respuesta.json().catch(() => null)
    throw new Error(cuerpo?.error ?? "No se pudo guardar la captura")
  }
  return respuesta
}

/** La imagen guardada, o null si todavía no hay. */
export async function leerCaptura(id: string): Promise<Blob | null> {
  const respuesta = await pedirCaptura(id)
  return respuesta.ok ? respuesta.blob() : null
}

export const guardarCaptura = (id: string, imagen: Blob) =>
  pedirCaptura(id, { method: "PUT", headers: { "Content-Type": imagen.type }, body: imagen })

export const borrarCaptura = (id: string) => pedirCaptura(id, { method: "DELETE" })

// El panel del ejercicio 1 que prueba la API de Mentorías como un Postman simple.
export type RespuestaApi = { estado: number; cuerpo: unknown }

export async function llamarApi(metodo: "GET" | "POST", ruta: string, cuerpo?: string): Promise<RespuestaApi> {
  let respuesta: Response
  try {
    respuesta = await fetch(ruta, { method: metodo, headers: { "Content-Type": "application/json" }, body: cuerpo })
  } catch {
    throw new Error("No pudimos conectarnos con la API. ¿Está corriendo npm run dev?")
  }
  const texto = await respuesta.text()
  let json: unknown = texto
  try {
    json = JSON.parse(texto)
  } catch {
    // no es JSON: se muestra tal cual
  }
  return { estado: respuesta.status, cuerpo: json }
}

// Cada historia tomada del tablero deja ejercicios/<id>/tarea-<historia>.md: así queda en la entrega.
async function pedirTarea(id: string, historia: string, method: "PUT" | "DELETE") {
  let respuesta: Response
  try {
    respuesta = await fetch(`/ejercicios-api/${encodeURIComponent(id)}/tareas/${encodeURIComponent(historia)}`, { method })
  } catch {
    throw new Error("No pudimos conectarnos. ¿Está corriendo npm run dev?")
  }
  if (!respuesta.ok) {
    const cuerpo = await respuesta.json().catch(() => null)
    throw new Error(cuerpo?.error ?? "No se pudo guardar el archivo de la tarea")
  }
}

export const crearTarea = (id: string, historia: string) => pedirTarea(id, historia, "PUT")
export const borrarTarea = (id: string, historia: string) => pedirTarea(id, historia, "DELETE")
