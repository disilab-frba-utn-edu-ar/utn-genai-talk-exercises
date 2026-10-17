const aDate = (fecha: string) => {
  const [anio, mes, dia] = fecha.split("-").map(Number)
  return new Date(anio, mes - 1, dia)
}

/** "2026-10-19" → "lunes 19 de octubre" */
export function fechaLarga(fecha: string): string {
  return aDate(fecha).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })
}

/** "2026-10-19" → { dia: "lun", numero: "19", mes: "oct" } */
export function fechaCorta(fecha: string) {
  const date = aDate(fecha)
  return {
    dia: date.toLocaleDateString("es-AR", { weekday: "short" }).replace(".", ""),
    numero: String(date.getDate()),
    mes: date.toLocaleDateString("es-AR", { month: "short" }).replace(".", ""),
  }
}

export function duracion(minutos: number): string {
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return resto ? `${horas} h ${resto} min` : `${horas} h`
}

export const TIPOS_COLECTIVO: Record<string, string> = {
  fundacion: "Fundación",
  asociacion_barrial: "Asociación barrial",
  ong: "ONG",
  asamblea: "Asamblea",
}
