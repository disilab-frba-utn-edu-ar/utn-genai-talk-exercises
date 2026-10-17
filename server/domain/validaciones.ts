// Validación de forma de los datos de entrada (Principio III).
// Las reglas que dependen de otras entidades viven en services/sesiones.ts.
import type { NuevaSesion } from "@shared/types"
import { esFechaValida, esHoraValida } from "./fechas"

export type Resultado<T> = { ok: true; valor: T } | { ok: false; error: string }

const CAMPOS: Record<keyof NuevaSesion, string> = {
  mentoraId: "la mentora",
  tipoAsesoriaId: "el tipo de asesoría",
  colectivoId: "el colectivo",
  proyecto: "la descripción del proyecto",
  contactoNombre: "el nombre de contacto",
  contactoEmail: "el email de contacto",
  fecha: "la fecha",
  horaInicio: "la hora de inicio",
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const PROYECTO_MIN = 10
export const PROYECTO_MAX = 500

export function validarNuevaSesion(datos: unknown): Resultado<NuevaSesion> {
  if (typeof datos !== "object" || datos === null || Array.isArray(datos)) {
    return { ok: false, error: "El cuerpo de la solicitud debe ser un objeto JSON" }
  }

  const entrada = datos as Record<string, unknown>
  const valor = {} as NuevaSesion
  for (const [campo, nombre] of Object.entries(CAMPOS) as [keyof NuevaSesion, string][]) {
    const texto = typeof entrada[campo] === "string" ? (entrada[campo] as string).trim() : ""
    if (!texto) return { ok: false, error: `Falta ${nombre}` }
    valor[campo] = texto
  }

  if (!EMAIL.test(valor.contactoEmail)) return { ok: false, error: "El email de contacto no es válido" }
  if (valor.proyecto.length < PROYECTO_MIN || valor.proyecto.length > PROYECTO_MAX) {
    return { ok: false, error: `La descripción del proyecto debe tener entre ${PROYECTO_MIN} y ${PROYECTO_MAX} caracteres` }
  }
  if (!esFechaValida(valor.fecha)) return { ok: false, error: "La fecha debe tener el formato AAAA-MM-DD" }
  if (!esHoraValida(valor.horaInicio)) return { ok: false, error: "La hora de inicio debe tener el formato HH:MM" }

  return { ok: true, valor }
}
