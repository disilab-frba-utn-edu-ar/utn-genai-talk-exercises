// Hora mínima es 00:00 y máxima es 23:59
function aMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number)
  return h * 60 + m
}

export function haySuperposicion(
  sesiones: {
    mentoraId: string
    fecha: string
    horaInicio: string
    horaFin: string
    estado: string
  }[],
  { mentoraId: mentoraIdBuscado, fecha: fechaBuscada, horaInicio: nuevaHoraInicio, horaFin: nuevaHoraFin }: {
    mentoraId: string
    fecha: string
    horaInicio: string
    horaFin: string
  }
): boolean {
  for (const sesion of sesiones) {
    // Solo contar sesiones confirmadas de la misma mentora y misma fecha
    if (sesion.estado !== "confirmada") continue
    if (sesion.mentoraId !== mentoraIdBuscado) continue
    if (sesion.fecha !== fechaBuscada) continue

    const inicioExistente = aMinutos(sesion.horaInicio)
    const finExistente = aMinutos(sesion.horaFin)
    const nuevaInicio = aMinutos(nuevaHoraInicio)
    const nuevaFin = aMinutos(nuevaHoraFin)

    // Dos intervalos [inicio, fin) se superponen si:
    // inicio1 < fin2 Y inicio2 < fin1
    // Si la sesión termina a 10:30 y otra empieza a 10:30, NO se superponen:
    //   10:00 < 10:30 (sí) Y 10:30 < 10:00 (no) → false, sin superposición ✓
    if (inicioExistente < nuevaFin && nuevaInicio < finExistente) {
      return true
    }
  }
  return false
}