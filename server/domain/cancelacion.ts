// Si una sesión se puede cancelar. Ver specs/003-cancelar-sesion/research.md (D1, D2).
import type { RazonNoCancelable, Sesion } from "@shared/types"
import { instanteEnArgentina } from "./fechas"

/** Con exactamente esta anticipación todavía se puede cancelar. */
export const ANTICIPACION_MINIMA_MS = 24 * 60 * 60 * 1000

export const MENSAJES_CANCELACION: Record<RazonNoCancelable, string> = {
  ya_cancelada: "La sesión ya estaba cancelada",
  ya_ocurrio: "La sesión ya ocurrió y no se puede cancelar",
  fuera_de_plazo: "Solo se puede cancelar hasta 24 horas antes del inicio de la sesión",
}

export type ResultadoCancelacion = { permitida: true } | { permitida: false; razon: RazonNoCancelable }

/** `ahora` llega por parámetro para que la regla no haga IO y el límite se pueda testear al milisegundo. */
export function evaluarCancelacion(sesion: Pick<Sesion, "fecha" | "horaInicio" | "estado">, ahora: Date): ResultadoCancelacion {
  if (sesion.estado === "cancelada") return { permitida: false, razon: "ya_cancelada" }
  const faltan = instanteEnArgentina(sesion.fecha, sesion.horaInicio).getTime() - ahora.getTime()
  if (faltan <= 0) return { permitida: false, razon: "ya_ocurrio" }
  if (faltan < ANTICIPACION_MINIMA_MS) return { permitida: false, razon: "fuera_de_plazo" }
  return { permitida: true }
}
