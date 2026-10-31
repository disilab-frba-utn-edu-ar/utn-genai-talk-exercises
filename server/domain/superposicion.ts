// Comparación de superposición de sesiones de una mentora. Solo cuentan las
// sesiones CON ESTADO "confirmada" de LA MISMA mentora y DEL MISMO día.
// Una sesión que termina a las 10:30 y otra que empieza a las 10:30 no se
// superponen: los límites son abiertos (inicio1 < fin2 && inicio2 < fin1).
//
// La función es pura: no hace IO, solo opera sobre los datos pasados.

import type { Sesion } from "@shared/types"

export type ParametrosSuperposicion = {
  mentoraId: string
  fecha: string
  horaInicio: string
  horaFin: string
}

export function haySuperposicion(sesiones: Sesion[], parametros: ParametrosSuperposicion): boolean {
  const { mentoraId, fecha, horaInicio, horaFin } = parametros

  for (const sesion of sesiones) {
    if (sesion.mentoraId !== mentoraId) continue
    if (sesion.fecha !== fecha) continue
    if (sesion.estado !== "confirmada") continue

    const sesionInicio = aMinutos(sesion.horaInicio)
    const sesionFin = aMinutos(sesion.horaFin)
    const nuevoInicio = aMinutos(horaInicio)
    const nuevoFin = aMinutos(horaFin)

    if (sesionInicio < nuevoFin && nuevoInicio < sesionFin) {
      return true
    }
  }

  return false
}

function aMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number)
  return h * 60 + m
}
