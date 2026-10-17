import { aHora, aMinutos, diaSemana, esFechaValida, esHoraValida, fechaDe, sumarDias } from "../../../server/domain/fechas"

describe("domain/fechas", () => {
  it("devuelve el día de la semana de una fecha", () => {
    expect(diaSemana("2026-10-19")).toBe("lunes")
    expect(diaSemana("2026-10-25")).toBe("domingo")
  })

  it("suma días cruzando meses y años", () => {
    expect(sumarDias("2026-10-31", 1)).toBe("2026-11-01")
    expect(sumarDias("2026-12-31", 1)).toBe("2027-01-01")
  })

  it("formatea una fecha local como YYYY-MM-DD", () => {
    expect(fechaDe(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05")
  })

  it("convierte entre HH:MM y minutos", () => {
    expect(aMinutos("09:30")).toBe(570)
    expect(aHora(570)).toBe("09:30")
  })

  it("valida formatos de fecha y hora", () => {
    expect(esFechaValida("2026-10-19")).toBe(true)
    expect(esFechaValida("2026-02-30")).toBe(false)
    expect(esFechaValida("19/10/2026")).toBe(false)
    expect(esHoraValida("09:00")).toBe(true)
    expect(esHoraValida("24:00")).toBe(false)
    expect(esHoraValida("9:00")).toBe(false)
  })
})
