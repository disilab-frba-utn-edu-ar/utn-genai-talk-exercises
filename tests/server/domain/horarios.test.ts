import type { Disponibilidad, Sesion } from "@shared/types"
import { calcularDiasDisponibles, calcularHorarios, estaDentroDeDisponibilidad } from "../../../server/domain/horarios"

const disponibilidad: Disponibilidad = {
  lunes: { inicio: "09:00", fin: "11:00" },
  martes: null, miercoles: null, jueves: null, viernes: null, sabado: null, domingo: null,
}
const LUNES = "2026-10-19"
const MARTES = "2026-10-20"
const ANTES = new Date(2026, 9, 1, 8, 0)

const sesion = (horaInicio: string, horaFin: string, extra: Partial<Sesion> = {}): Sesion => ({
  id: "s",
  mentoraId: "m1",
  tipoAsesoriaId: "t",
  colectivoId: "c",
  proyecto: "p",
  contactoNombre: "n",
  contactoEmail: "e@example.org",
  fecha: LUNES,
  horaInicio,
  horaFin,
  estado: "confirmada",
  ...extra,
})

const inicios = (horarios: { inicio: string }[]) => horarios.map((h) => h.inicio)

describe("domain/horarios · calcularHorarios", () => {
  it("genera horarios cada 30 minutos que entren completos en la disponibilidad", () => {
    const horarios = calcularHorarios({ disponibilidad, sesiones: [], fecha: LUNES, duracionMinutos: 60, ahora: ANTES })
    expect(horarios).toEqual([
      { inicio: "09:00", fin: "10:00" },
      { inicio: "09:30", fin: "10:30" },
      { inicio: "10:00", fin: "11:00" },
    ])
  })

  it("no ofrece horarios si ese día no hay disponibilidad", () => {
    expect(calcularHorarios({ disponibilidad, sesiones: [], fecha: MARTES, duracionMinutos: 30, ahora: ANTES })).toEqual([])
  })

  it("descarta los horarios que se superponen con sesiones confirmadas", () => {
    const horarios = calcularHorarios({
      disponibilidad,
      sesiones: [sesion("09:30", "10:00")],
      fecha: LUNES,
      duracionMinutos: 30,
      ahora: ANTES,
    })
    expect(inicios(horarios)).toEqual(["09:00", "10:00", "10:30"])
  })

  it("ignora sesiones canceladas y de otros días", () => {
    const horarios = calcularHorarios({
      disponibilidad,
      sesiones: [sesion("09:00", "11:00", { estado: "cancelada" }), sesion("09:00", "11:00", { fecha: MARTES })],
      fecha: LUNES,
      duracionMinutos: 60,
      ahora: ANTES,
    })
    expect(horarios).toHaveLength(3)
  })

  it("si la fecha es hoy, no ofrece horarios que ya empezaron", () => {
    const ahora = new Date(2026, 9, 19, 9, 45)
    const horarios = calcularHorarios({ disponibilidad, sesiones: [], fecha: LUNES, duracionMinutos: 30, ahora })
    expect(inicios(horarios)).toEqual(["10:00", "10:30"])
  })
})

describe("domain/horarios · calcularDiasDisponibles", () => {
  it("devuelve solo los días con horarios libres desde hoy", () => {
    const ahora = new Date(2026, 9, 18, 12, 0) // domingo
    const dias = calcularDiasDisponibles({ disponibilidad, sesiones: [], duracionMinutos: 30, ahora, dias: 14 })
    expect(dias.map((d) => d.fecha)).toEqual(["2026-10-19", "2026-10-26"])
  })

  it("omite un día que está completamente ocupado", () => {
    const ahora = new Date(2026, 9, 18, 12, 0)
    const dias = calcularDiasDisponibles({
      disponibilidad,
      sesiones: [sesion("09:00", "11:00")],
      duracionMinutos: 30,
      ahora,
      dias: 14,
    })
    expect(dias.map((d) => d.fecha)).toEqual(["2026-10-26"])
  })
})

describe("domain/horarios · estaDentroDeDisponibilidad", () => {
  it("acepta un rango contenido en la disponibilidad del día", () => {
    expect(estaDentroDeDisponibilidad(disponibilidad, LUNES, "10:00", "11:00")).toBe(true)
  })

  it("rechaza un rango que se pasa del final o un día sin disponibilidad", () => {
    expect(estaDentroDeDisponibilidad(disponibilidad, LUNES, "10:30", "11:30")).toBe(false)
    expect(estaDentroDeDisponibilidad(disponibilidad, MARTES, "09:00", "09:30")).toBe(false)
  })
})

describe("domain/horarios · cupo mensual", () => {
  const base = { disponibilidad, fecha: LUNES, ahora: ANTES }

  it("no ofrece horarios si el cupo del mes está agotado", () => {
    const sesiones = [sesion("09:00", "11:00")]
    expect(calcularHorarios({ ...base, sesiones, duracionMinutos: 30, cupoHoras: 2 })).toEqual([])
  })

  it("no ofrece una asesoría de 60 si quedan 30 minutos, pero sí una de 30", () => {
    // Cupo de 1 h con 30 minutos ya consumidos este mes: quedan 30.
    const quedan30 = [sesion("09:00", "09:30", { fecha: "2026-10-12" })]
    expect(calcularHorarios({ ...base, sesiones: quedan30, duracionMinutos: 60, cupoHoras: 1 })).toEqual([])
    expect(inicios(calcularHorarios({ ...base, sesiones: quedan30, duracionMinutos: 30, cupoHoras: 1 }))).toContain("09:00")
  })

  it("sin cupo definido no limita", () => {
    expect(calcularHorarios({ ...base, sesiones: [], duracionMinutos: 30 })).not.toEqual([])
  })

  it("un mes agotado no ofrece días pero el mes siguiente sí", () => {
    const sesiones = [sesion("09:00", "11:00", { fecha: "2026-10-26" })]
    const dias = calcularDiasDisponibles({
      disponibilidad,
      sesiones,
      duracionMinutos: 30,
      ahora: new Date(2026, 9, 26, 8, 0),
      dias: 14,
      cupoHoras: 2,
    })
    // 26/10 es lunes de octubre (agotado) y 2/11 es lunes de noviembre (con cupo propio).
    expect(dias.map((d) => d.fecha)).toEqual(["2026-11-02"])
  })
})
