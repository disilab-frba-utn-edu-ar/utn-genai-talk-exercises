import type { Sesion } from "@shared/types"
import { evaluarCancelacion, MENSAJES_CANCELACION } from "../../../server/domain/cancelacion"

type Datos = Pick<Sesion, "fecha" | "horaInicio" | "estado">

// La sesión empieza el lunes 19/10 a las 18:00 en hora de Argentina.
const sesion = (extra: Partial<Datos> = {}): Datos => ({ fecha: "2026-10-19", horaInicio: "18:00", estado: "confirmada", ...extra })

// "Ahora" con offset explícito: no depende de la zona horaria de la máquina.
const enArgentina = (fechaHora: string) => new Date(`${fechaHora}-03:00`)
const VEINTICUATRO_HORAS_ANTES = enArgentina("2026-10-18T18:00:00")

describe("domain/cancelacion", () => {
  it("permite cancelar con exactamente 24 horas de anticipación", () => {
    expect(evaluarCancelacion(sesion(), VEINTICUATRO_HORAS_ANTES)).toEqual({ permitida: true })
  })

  it("no permite cancelar un milisegundo después del límite de 24 horas", () => {
    const ahora = new Date(VEINTICUATRO_HORAS_ANTES.getTime() + 1)
    expect(evaluarCancelacion(sesion(), ahora)).toEqual({ permitida: false, razon: "fuera_de_plazo" })
  })

  it("permite cancelar con más de 24 horas de anticipación", () => {
    expect(evaluarCancelacion(sesion(), enArgentina("2026-10-17T18:00:00"))).toEqual({ permitida: true })
  })

  it("no permite cancelar una sesión que empieza justo ahora o que ya empezó", () => {
    expect(evaluarCancelacion(sesion(), enArgentina("2026-10-19T18:00:00"))).toEqual({ permitida: false, razon: "ya_ocurrio" })
    expect(evaluarCancelacion(sesion(), enArgentina("2026-10-20T10:00:00"))).toEqual({ permitida: false, razon: "ya_ocurrio" })
  })

  it("una sesión ya cancelada no se puede volver a cancelar, aunque falte mucho o ya haya pasado", () => {
    const cancelada = sesion({ estado: "cancelada" })
    expect(evaluarCancelacion(cancelada, enArgentina("2026-10-17T18:00:00"))).toEqual({ permitida: false, razon: "ya_cancelada" })
    expect(evaluarCancelacion(cancelada, enArgentina("2026-10-20T10:00:00"))).toEqual({ permitida: false, razon: "ya_cancelada" })
  })

  it("compara contra la hora de Argentina: 18:00 del lunes son las 21:00 UTC", () => {
    expect(evaluarCancelacion(sesion(), new Date("2026-10-18T21:00:00.000Z"))).toEqual({ permitida: true })
    expect(evaluarCancelacion(sesion(), new Date("2026-10-18T21:00:00.001Z"))).toEqual({ permitida: false, razon: "fuera_de_plazo" })
  })

  it("tiene un mensaje para cada razón", () => {
    expect(MENSAJES_CANCELACION).toEqual({
      ya_cancelada: "La sesión ya estaba cancelada",
      ya_ocurrio: "La sesión ya ocurrió y no se puede cancelar",
      fuera_de_plazo: "Solo se puede cancelar hasta 24 horas antes del inicio de la sesión",
    })
  })
})
