import type { Mentora, MentoraPublica, Sesion, TipoAsesoria } from "@shared/types"
import { mesDe, minutosRestantes } from "./cupo"
import { fechaDe } from "./fechas"

/** Una mentora puede dar un tipo de asesoría si tiene al menos una de sus habilidades. */
export function puedeDar(mentora: Mentora, tipo: TipoAsesoria): boolean {
  return tipo.habilidades.some((habilidad) => mentora.habilidades.includes(habilidad))
}

export function tiposQuePuedeDar(mentora: Mentora, tipos: TipoAsesoria[]): string[] {
  return tipos.filter((tipo) => puedeDar(mentora, tipo)).map((tipo) => tipo.id)
}

/**
 * Vista pública de una mentora: descarta el contacto y el cupo total (Principio IV) y suma
 * las horas que le quedan este mes. `sesiones` son las de esa mentora.
 */
export function aMentoraPublica(mentora: Mentora, tipos: TipoAsesoria[], sesiones: Sesion[], ahora: Date): MentoraPublica {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- se descartan a propósito
  const { contacto, cupoMensualHoras, ...publica } = mentora
  const restantes = minutosRestantes(cupoMensualHoras, sesiones, mesDe(fechaDe(ahora)))
  return {
    ...publica,
    tiposAsesoria: tiposQuePuedeDar(mentora, tipos),
    ...(restantes !== undefined && { horasRestantes: restantes / 60 }),
  }
}
