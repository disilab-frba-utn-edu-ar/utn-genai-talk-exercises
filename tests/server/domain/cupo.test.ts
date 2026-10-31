import type { Sesion } from "@shared/types"
import { entraEnCupo, mesDe, minutosConsumidos, minutosRestantes } from "../../../server/domain/cupo"

const sesion = (fecha: string, horaInicio: string, horaFin: string, extra: Partial<Sesion> = {}): Sesion => ({
  id: "s",
  mentoraId: "m1",
  tipoAsesoriaId: "t",
  colectivoId: "c",
  proyecto: "p",
  contactoNombre: "n",
  contactoEmail: "e@example.org",
  fecha,
  horaInicio,
  horaFin,
  estado: "confirmada",
  ...extra,
})

const OCT = "2026-10"

describe("domain/cupo · mesDe", () => {
  it("devuelve el mes calendario de una fecha", () => {
    expect(mesDe("2026-10-31")).toBe("2026-10")
    expect(mesDe("2026-11-01")).toBe("2026-11")
  })
})

describe("domain/cupo · minutosConsumidos", () => {
  it("suma la duración de las sesiones confirmadas del mes", () => {
    const sesiones = [sesion("2026-10-19", "18:00", "19:00"), sesion("2026-10-21", "18:00", "18:30")]
    expect(minutosConsumidos(sesiones, OCT)).toBe(90)
  })

  it("las canceladas no consumen cupo", () => {
    const sesiones = [sesion("2026-10-19", "18:00", "19:00"), sesion("2026-10-21", "18:00", "19:00", { estado: "cancelada" })]
    expect(minutosConsumidos(sesiones, OCT)).toBe(60)
  })

  it("las sesiones de otro mes no cuentan", () => {
    const sesiones = [sesion("2026-09-30", "18:00", "19:00"), sesion("2026-11-02", "18:00", "19:00")]
    expect(minutosConsumidos(sesiones, OCT)).toBe(0)
  })
})

describe("domain/cupo · minutosRestantes", () => {
  it("es el cupo menos lo consumido, en minutos", () => {
    expect(minutosRestantes(2, [sesion("2026-10-19", "18:00", "19:00")], OCT)).toBe(60)
  })

  it("admite cupos con fracciones de hora", () => {
    expect(minutosRestantes(1.5, [], OCT)).toBe(90)
  })

  it("nunca baja de cero", () => {
    expect(minutosRestantes(1, [sesion("2026-10-19", "18:00", "20:00")], OCT)).toBe(0)
  })

  it("un cupo de 0 horas no deja nada", () => {
    expect(minutosRestantes(0, [], OCT)).toBe(0)
  })

  it("sin cupo definido (ausente, negativo o no numérico) no hay límite", () => {
    expect(minutosRestantes(undefined, [], OCT)).toBeUndefined()
    expect(minutosRestantes(-2, [], OCT)).toBeUndefined()
    expect(minutosRestantes("mucho", [], OCT)).toBeUndefined()
    expect(minutosRestantes(Number.NaN, [], OCT)).toBeUndefined()
  })
})

describe("domain/cupo · entraEnCupo", () => {
  it("sin límite, siempre entra", () => {
    expect(entraEnCupo(undefined, 600)).toBe(true)
  })

  it("no entra si quedan 30 minutos y la asesoría dura 60", () => {
    expect(entraEnCupo(30, 60)).toBe(false)
  })

  it("entra si la duración es justo lo que queda", () => {
    expect(entraEnCupo(60, 60)).toBe(true)
  })

  it("con cupo agotado no entra nada", () => {
    expect(entraEnCupo(0, 30)).toBe(false)
  })
})
