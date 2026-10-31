// Mi perfil: quiénes resuelven los ejercicios, con qué agente y modelo, si intervinieron y su feedback.
// Se guarda en ejercicios/perfil.json (ver vite-plugin.ts) porque reemplaza a los datos de la entrega que
// antes iban a mano en cada RESPUESTAS.md: tiene que viajar con el commit, no quedarse en el navegador.

export type PerfilEjercicio = {
  /** Vacíos: se usan el modelo y el agente generales. */
  modelo: string
  agente: string
  intervino: "" | "si" | "no"
  /** Cuándo y por qué intervinieron. */
  intervencion: string
  feedback: string
}

export type Perfil = {
  nombre: string
  integrantes: string[]
  modelo: string
  agente: string
  /** Qué tan útiles resultaron los ejercicios, de 1 a 5 (null: sin puntaje). */
  puntaje: number | null
  comentario: string
  ejercicios: Record<string, PerfilEjercicio>
}

export const perfilVacio = (): Perfil => ({ nombre: "", integrantes: [], modelo: "", agente: "", puntaje: null, comentario: "", ejercicios: {} })

const ejercicioVacio = (): PerfilEjercicio => ({ modelo: "", agente: "", intervino: "", intervencion: "", feedback: "" })

const texto = (valor: unknown) => (typeof valor === "string" ? valor : "")

/** Lo guardado, o un perfil vacío: un perfil.json editado a mano o de una versión anterior no rompe la página. */
export function normalizarPerfil(valor: unknown): Perfil {
  if (!valor || typeof valor !== "object") return perfilVacio()
  const v = valor as Record<string, unknown>
  const ejercicios: Record<string, PerfilEjercicio> = {}
  if (v.ejercicios && typeof v.ejercicios === "object") {
    for (const [id, e] of Object.entries(v.ejercicios as Record<string, Record<string, unknown>>)) {
      if (!e || typeof e !== "object") continue
      ejercicios[id] = {
        modelo: texto(e.modelo),
        agente: texto(e.agente),
        intervino: e.intervino === "si" || e.intervino === "no" ? e.intervino : "",
        intervencion: texto(e.intervencion),
        feedback: texto(e.feedback),
      }
    }
  }
  const puntaje = typeof v.puntaje === "number" && Number.isInteger(v.puntaje) && v.puntaje >= 1 && v.puntaje <= 5 ? v.puntaje : null
  return {
    nombre: texto(v.nombre),
    integrantes: Array.isArray(v.integrantes) ? v.integrantes.filter((i): i is string => typeof i === "string") : [],
    modelo: texto(v.modelo),
    agente: texto(v.agente),
    puntaje,
    comentario: texto(v.comentario),
    ejercicios,
  }
}

export const delEjercicio = (perfil: Perfil, id: string): PerfilEjercicio => perfil.ejercicios[id] ?? ejercicioVacio()

/** El perfil con los datos de un ejercicio cambiados. */
export const conEjercicio = (perfil: Perfil, id: string, cambios: Partial<PerfilEjercicio>): Perfil => ({
  ...perfil,
  ejercicios: { ...perfil.ejercicios, [id]: { ...delEjercicio(perfil, id), ...cambios } },
})

/** El modelo y el agente de un ejercicio; si no se cargaron ahí, los generales. */
export function modeloYAgente(perfil: Perfil, id: string) {
  const e = delEjercicio(perfil, id)
  return { modelo: e.modelo.trim() || perfil.modelo.trim(), agente: e.agente.trim() || perfil.agente.trim() }
}

const SIN_COMPLETAR = "_Sin completar en Mi perfil._"

/** Los datos de la entrega que van arriba de cada RESPUESTAS.md, tomados del perfil. */
export function datosDeEntregaMd(perfil: Perfil, id: string): string {
  const e = delEjercicio(perfil, id)
  const integrantes = perfil.integrantes.map((i) => i.trim()).filter(Boolean)
  const intervino =
    e.intervino === "si" ? `Sí${e.intervencion.trim() ? `. ${e.intervencion.trim()}` : ""}` : e.intervino === "no" ? "No" : SIN_COMPLETAR
  return [
    `**Nombre:** ${perfil.nombre.trim() || SIN_COMPLETAR}`,
    ...(integrantes.length ? [`**Integrantes:** ${integrantes.join(", ")}`] : []),
    `**¿Intervinieron durante la tarea?** ${intervino}`,
  ].join("\n")
}

/** El cierre de cada RESPUESTAS.md: el modelo y el agente de ese ejercicio. */
export function cierreMd(perfil: Perfil, id: string): string {
  const { modelo, agente } = modeloYAgente(perfil, id)
  return ["## Para cerrar", `**Modelo:** ${modelo || SIN_COMPLETAR}`, `**Agente:** ${agente || SIN_COMPLETAR}`].join("\n\n")
}
