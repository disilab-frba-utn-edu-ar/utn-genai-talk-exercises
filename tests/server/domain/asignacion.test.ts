import type { DiaDisponible, Disponibilidad, Mentora, Sesion } from "@shared/types"
import { elegirMentora, unirDiasDisponibles } from "../../../server/domain/asignacion"

const LUNES = "2026-10-19"
const HOY = "2026-10-18"

const sinDisponibilidad: Disponibilidad = {
  lunes: null,
  martes: null,
  miercoles: null,
  jueves: null,
  viernes: null,
  sabado: null,
  domingo: null,
}

const mentora = (id: string, nombre: string, lunes: { inicio: string; fin: string } | null = { inicio: "18:00", fin: "21:00" }): Mentora => ({
  id,
  nombre,
  presentacion: "",
  habilidades: ["testing_unitario"],
  disponibilidad: { ...sinDisponibilidad, lunes },
  contacto: { email: `${id}@example.org` },
})

const sesion = (mentoraId: string, extra: Partial<Sesion> = {}): Sesion => ({
  id: `${mentoraId}-${extra.fecha ?? LUNES}-${extra.horaInicio ?? "18:00"}`,
  mentoraId,
  tipoAsesoriaId: "revision_de_codigo",
  colectivoId: "c1",
  proyecto: "Revisar el formulario de inscripción",
  contactoNombre: "Ana",
  contactoEmail: "ana@example.org",
  fecha: LUNES,
  horaInicio: "18:00",
  horaFin: "18:30",
  estado: "confirmada",
  ...extra,
})

const franja = (horaInicio = "19:00", horaFin = "19:30") => ({ fecha: LUNES, horaInicio, horaFin })

describe("unirDiasDisponibles", () => {
  const h = (inicio: string, fin: string) => ({ inicio, fin })

  it("devuelve una lista vacía si no hay listas o todas están vacías", () => {
    expect(unirDiasDisponibles([])).toEqual([])
    expect(unirDiasDisponibles([[], []])).toEqual([])
  })

  it("con una sola mentora devuelve sus días tal cual", () => {
    const dias: DiaDisponible[] = [{ fecha: LUNES, horarios: [h("18:00", "18:30")] }]
    expect(unirDiasDisponibles([dias])).toEqual(dias)
  })

  it("une los horarios del mismo día sin repetir el inicio y en orden", () => {
    const a: DiaDisponible[] = [{ fecha: LUNES, horarios: [h("18:00", "18:30"), h("18:30", "19:00")] }]
    const b: DiaDisponible[] = [{ fecha: LUNES, horarios: [h("10:00", "10:30"), h("18:30", "19:00")] }]
    expect(unirDiasDisponibles([a, b])).toEqual([
      { fecha: LUNES, horarios: [h("10:00", "10:30"), h("18:00", "18:30"), h("18:30", "19:00")] },
    ])
  })

  it("ordena las fechas y descarta los días sin horarios", () => {
    const a: DiaDisponible[] = [{ fecha: "2026-10-21", horarios: [h("18:00", "18:30")] }]
    const b: DiaDisponible[] = [
      { fecha: "2026-10-20", horarios: [] },
      { fecha: LUNES, horarios: [h("10:00", "10:30")] },
    ]
    expect(unirDiasDisponibles([a, b]).map((d) => d.fecha)).toEqual([LUNES, "2026-10-21"])
  })
})

describe("elegirMentora · libres", () => {
  it("devuelve null si no hay candidatas", () => {
    expect(elegirMentora([], [], franja(), HOY)).toBeNull()
  })

  it("descarta a la mentora que no atiende en ese horario", () => {
    const manana = mentora("a", "Ana", { inicio: "09:00", fin: "12:00" })
    const tarde = mentora("b", "Bea")
    expect(elegirMentora([manana, tarde], [], franja(), HOY)?.id).toBe("b")
    expect(elegirMentora([manana], [], franja("11:45", "12:15"), HOY)).toBeNull()
  })

  it("descarta a la mentora con una sesión confirmada superpuesta, aunque sea parcial", () => {
    const a = mentora("a", "Ana")
    const b = mentora("b", "Bea")
    const sesiones = [sesion("a", { horaInicio: "18:45", horaFin: "19:15" })]
    expect(elegirMentora([a, b], sesiones, franja(), HOY)?.id).toBe("b")
  })

  it("una sesión cancelada no bloquea", () => {
    const a = mentora("a", "Ana")
    const sesiones = [sesion("a", { horaInicio: "19:00", horaFin: "19:30", estado: "cancelada" })]
    expect(elegirMentora([a], sesiones, franja(), HOY)?.id).toBe("a")
  })

  it("una sesión que termina justo cuando empieza la franja no bloquea", () => {
    const a = mentora("a", "Ana")
    const sesiones = [sesion("a", { horaInicio: "18:30", horaFin: "19:00" })]
    expect(elegirMentora([a], sesiones, franja(), HOY)?.id).toBe("a")
  })

  it("devuelve null si ninguna está libre", () => {
    const a = mentora("a", "Ana")
    const sesiones = [sesion("a", { horaInicio: "19:00", horaFin: "19:30" })]
    expect(elegirMentora([a], sesiones, franja(), HOY)).toBeNull()
  })
})

describe("elegirMentora · reparto", () => {
  const ana = mentora("a", "Ana")
  const bruno = mentora("b", "Bruno")

  it("elige a la que tiene menos sesiones confirmadas en los próximos 14 días", () => {
    const sesiones = [sesion("a", { fecha: "2026-10-21" })]
    expect(elegirMentora([ana, bruno], sesiones, franja(), HOY)?.id).toBe("b")
  })

  it("no cuenta canceladas, sesiones anteriores a hoy ni las del día 15 en adelante", () => {
    const sesiones = [
      sesion("a", { fecha: "2026-10-21", estado: "cancelada" }),
      sesion("a", { fecha: "2026-10-17" }),
      sesion("a", { fecha: "2026-11-01" }), // hoy + 14
      sesion("b", { fecha: "2026-10-31" }), // hoy + 13: cuenta
    ]
    expect(elegirMentora([ana, bruno], sesiones, franja(), HOY)?.id).toBe("a")
  })

  it("cuenta sesiones, no minutos: una de 60 minutos pesa menos que dos de 30", () => {
    const sesiones = [
      sesion("a", { fecha: "2026-10-21", horaInicio: "18:00", horaFin: "19:00" }),
      sesion("b", { fecha: "2026-10-21", horaInicio: "18:00", horaFin: "18:30" }),
      sesion("b", { fecha: "2026-10-21", horaInicio: "19:00", horaFin: "19:30" }),
    ]
    expect(elegirMentora([ana, bruno], sesiones, franja(), HOY)?.id).toBe("a")
  })

  it("si empatan, elige por orden alfabético sin importar el orden de llegada", () => {
    const agata = mentora("c", "Ágata")
    expect(elegirMentora([bruno, agata, ana], [], franja(), HOY)?.id).toBe("c")
    expect(elegirMentora([ana, bruno, agata], [], franja(), HOY)?.id).toBe("c")
  })

  it("no elige a la menos cargada si no está libre en la franja", () => {
    const sesiones = [sesion("b", { horaInicio: "19:00", horaFin: "19:30" }), sesion("a", { fecha: "2026-10-21" }), sesion("a", { fecha: "2026-10-28" })]
    expect(elegirMentora([ana, bruno], sesiones, franja(), HOY)?.id).toBe("a")
  })
})
