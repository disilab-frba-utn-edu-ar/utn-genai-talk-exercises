// Pure function: detects if a new session overlaps with existing confirmed sessions
// of the same mentor on the same date.
// Sessions that end at the exact start time of another do NOT overlap.
// Does NOT perform IO.
export function haySuperposicion(
  sesiones: { mentoraId: string; fecha: string; horaInicio: string; horaFin: string; estado: string }[],
  { mentoraId, fecha, horaInicio, horaFin }: {
    mentoraId: string
    fecha: string
    horaInicio: string
    horaFin: string
  }
): boolean {
  const minutosInicio = parsearAMinutos(horaInicio)
  const minutosFin = parsearAMinutos(horaFin)

  return sesiones.some(
    (s) =>
      s.mentoraId === mentoraId &&
      s.fecha === fecha &&
      s.estado === "confirmada" &&
      // Superposición: nueva empieza antes de que la existente termine Y
      // la existente empieza antes de que la nueva termine
      // Usamos < para que end==start no sea superposición
      minutosInicio < parsearAMinutos(s.horaFin) &&
      parsearAMinutos(s.horaInicio) < minutosFin
  )
}

function parsearAMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number)
  return h * 60 + m
}