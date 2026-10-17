import type { Mentora, MentoraPublica, TipoAsesoria } from "@shared/types"

/** Una mentora puede dar un tipo de asesoría si tiene al menos una de sus habilidades. */
export function puedeDar(mentora: Mentora, tipo: TipoAsesoria): boolean {
  return tipo.habilidades.some((habilidad) => mentora.habilidades.includes(habilidad))
}

export function tiposQuePuedeDar(mentora: Mentora, tipos: TipoAsesoria[]): string[] {
  return tipos.filter((tipo) => puedeDar(mentora, tipo)).map((tipo) => tipo.id)
}

/** Vista pública de una mentora: descarta el contacto (Principio IV). */
export function aMentoraPublica(mentora: Mentora, tipos: TipoAsesoria[]): MentoraPublica {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- se descarta a propósito
  const { contacto, ...publica } = mentora
  return { ...publica, tiposAsesoria: tiposQuePuedeDar(mentora, tipos) }
}
