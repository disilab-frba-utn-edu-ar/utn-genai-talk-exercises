// Validación de forma de los datos de entrada (Principio III).
// Las reglas que dependen de otras entidades viven en services/sesiones.ts.
import type { CambioSesion, NuevaSesion } from "@shared/types"
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
export const MOTIVO_MAX = 500

const NO_ES_OBJETO = "El cuerpo de la solicitud debe ser un objeto JSON"
const esObjeto = (datos: unknown): datos is Record<string, unknown> =>
  typeof datos === "object" && datos !== null && !Array.isArray(datos)

export function validarNuevaSesion(datos: unknown): Resultado<NuevaSesion> {
  if (!esObjeto(datos)) return { ok: false, error: NO_ES_OBJETO }

  const valor = {} as NuevaSesion
  for (const [campo, nombre] of Object.entries(CAMPOS) as [keyof NuevaSesion, string][]) {
    const texto = typeof datos[campo] === "string" ? (datos[campo] as string).trim() : ""
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

/** El PATCH de una sesión solo sirve para cancelarla, con un motivo opcional (research D4). */
export function validarCancelacion(datos: unknown): Resultado<CambioSesion> {
  if (!esObjeto(datos)) return { ok: false, error: NO_ES_OBJETO }
  if (datos.estado !== "cancelada") return { ok: false, error: "Solo se puede cambiar el estado a cancelada" }
  if (Object.keys(datos).some((campo) => campo !== "estado" && campo !== "motivo")) {
    return { ok: false, error: "Solo se puede enviar el estado y el motivo" }
  }
  if (datos.motivo === undefined) return { ok: true, valor: { estado: "cancelada" } }
  if (typeof datos.motivo !== "string") return { ok: false, error: "El motivo debe ser un texto" }

  const motivo = datos.motivo.trim()
  if (motivo.length > MOTIVO_MAX) return { ok: false, error: `El motivo puede tener hasta ${MOTIVO_MAX} caracteres` }
  return { ok: true, valor: motivo ? { estado: "cancelada", motivo } : { estado: "cancelada" } }
}
