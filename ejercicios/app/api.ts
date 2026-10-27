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
