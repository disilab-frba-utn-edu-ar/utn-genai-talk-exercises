import type { Colectivo, Habilidad, MentoraPublica, TipoAsesoria } from "@shared/types"

export const habilidades: Habilidad[] = [
  { id: "desarrollo_web_react", titulo: "Desarrollo Web React", descripcion: "" },
  { id: "testing_e2e_cypress", titulo: "Testing E2E con Cypress", descripcion: "" },
]

const sinDisponibilidad = {
  lunes: null, martes: null, miercoles: null, jueves: null, viernes: null, sabado: null, domingo: null,
}

export const valentina: MentoraPublica = {
  id: "m1",
  nombre: "Valentina Ríos",
  pronombres: "ella",
  presentacion: "Frontend hace 8 años.",
  habilidades: ["desarrollo_web_react"],
  disponibilidad: { ...sinDisponibilidad, lunes: { inicio: "18:00", fin: "21:00" } },
  tiposAsesoria: ["revision_de_codigo"],
}

export const camila: MentoraPublica = {
  id: "m2",
  nombre: "Camila Sosa",
  presentacion: "QA de oficio.",
  habilidades: ["testing_e2e_cypress"],
  disponibilidad: sinDisponibilidad,
  tiposAsesoria: ["revision_de_codigo"],
}

export const tipos: TipoAsesoria[] = [
  { id: "revision_de_codigo", nombre: "Revisión de código", descripcion: "", duracionMinutos: 30, habilidades: [] },
  { id: "despliegue", nombre: "Puesta en producción", descripcion: "", duracionMinutos: 45, habilidades: [] },
]

export const colectivos: Colectivo[] = [{ id: "c1", nombre: "Fundación Huerta Viva", tipo: "fundacion" }]

export const conCupo: MentoraPublica = { ...valentina, id: "m3", nombre: "Marta Cupo", horasRestantes: 2 }
export const conMediaHora: MentoraPublica = { ...valentina, id: "m4", nombre: "Mara Media", horasRestantes: 1.5 }
export const sinCupo: MentoraPublica = { ...valentina, id: "m5", nombre: "Sofía Agotada", horasRestantes: 0 }
