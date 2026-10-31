import { haySuperposicion } from "../../../server/domain/superposicion"

describe("domain/superposicion", () => {
  // Una sola sesión confirmada a la hora
  const UNA_SESION = [
    { mentoraId: "mentora-1", fecha: "2026-10-19", horaInicio: "10:00", horaFin: "11:00", estado: "confirmada" },
  ]

  // Dos sesiones consecutivas (10:00-11:00 y 11:00-12:00) - sin superposición entre sí
  const DOS_SESIONES_CONSECUTIVAS = [
    { mentoraId: "mentora-1", fecha: "2026-10-19", horaInicio: "10:00", horaFin: "11:00", estado: "confirmada" },
    { mentoraId: "mentora-1", fecha: "2026-10-19", horaInicio: "11:00", horaFin: "12:00", estado: "confirmada" },
  ]

  it("detecta superposición cuando una sesión nueva empieza antes de que termine la existente", () => {
    const resultado = haySuperposicion(
      UNA_SESION,
      { mentoraId: "mentora-1", fecha: "2026-10-19", horaInicio: "10:30", horaFin: "11:30" }
    )
    expect(resultado).toBe(true)
  })

  it("no detecta superposición cuando la sesión nueva termina justo cuando la existente empieza (11:00)", () => {
    // Nueva sesión 11:00-12:00 contra existente 10:00-11:00
    const resultado = haySuperposicion(
      UNA_SESION,
      { mentoraId: "mentora-1", fecha: "2026-10-19", horaInicio: "11:00", horaFin: "12:00" }
    )
    expect(resultado).toBe(false)
  })

  it("no detecta superposición cuando la sesión nueva empieza justo cuando la existente termina (11:00)", () => {
    // Nueva sesión 11:00-12:00 contra existente 10:00-11:00
    const resultado = haySuperposicion(
      UNA_SESION,
      { mentoraId: "mentora-1", fecha: "2026-10-19", horaInicio: "11:00", horaFin: "12:00" }
    )
    expect(resultado).toBe(false)
  })

  it("no detecta superposición en fechas diferentes aunque sea la misma mentora", () => {
    const resultado = haySuperposicion(
      UNA_SESION,
      { mentoraId: "mentora-1", fecha: "2026-10-20", horaInicio: "10:30", horaFin: "11:30" }
    )
    expect(resultado).toBe(false)
  })

  it("no detecta superposición con mentora diferente aunque sea misma fecha y hora", () => {
    const resultado = haySuperposicion(
      UNA_SESION,
      { mentoraId: "mentora-2", fecha: "2026-10-19", horaInicio: "10:30", horaFin: "11:30" }
    )
    expect(resultado).toBe(false)
  })

  it("detecta superposición cuando una sesión nueva completamente contiene a la existente", () => {
    const resultado = haySuperposicion(
      UNA_SESION,
      { mentoraId: "mentora-1", fecha: "2026-10-19", horaInicio: "09:00", horaFin: "12:00" }
    )
    expect(resultado).toBe(true)
  })

  it("detecta superposición cuando una sesión nueva está contenida en la existente", () => {
    const resultado = haySuperposicion(
      UNA_SESION,
      { mentoraId: "mentora-1", fecha: "2026-10-19", horaInicio: "10:30", horaFin: "11:30" }
    )
    expect(resultado).toBe(true)
  })

  it("solo cuenta sesiones con estado confirmada (las canceladas no bloquean)", () => {
    // La sesión cancelada a 10:30-11:30 no debería contar, pero la confirmada a 10:00-11:00 SÍ se solapa con 10:30-11:30
    const sesionesMix = [
      { mentoraId: "mentora-1", fecha: "2026-10-19", horaInicio: "10:00", horaFin: "11:00", estado: "confirmada" },
      { mentoraId: "mentora-1", fecha: "2026-10-19", horaInicio: "10:30", horaFin: "11:30", estado: "cancelada" },
    ]
    const resultado = haySuperposicion(
      sesionesMix,
      { mentoraId: "mentora-1", fecha: "2026-10-19", horaInicio: "10:30", horaFin: "11:30" }
    )
    // La confirmada 10:00-11:00 sí se superpone con 10:30-11:30 (10:30 < 11:00)
    expect(resultado).toBe(true)
  })

  it("detecta superposición con DOS sesiones consecutivas: nueva 11:30-12:30 supera la segunda", () => {
    // Nueva 11:30-12:30 contra dos sesiones 10:00-11:00 y 11:00-12:00
    // La sesión 11:00-12:00 overlaps con 11:30-12:30 (11:30 < 12:00 y 11:00 < 12:30)
    const resultado = haySuperposicion(
      DOS_SESIONES_CONSECUTIVAS,
      { mentoraId: "mentora-1", fecha: "2026-10-19", horaInicio: "11:30", horaFin: "12:30" }
    )
    expect(resultado).toBe(true)
  })

  it("no detecta superposición con DOS sesiones consecutivas: nueva 12:00-13:00 empieza cuando la segunda termina", () => {
    // Nueva 12:00-13:00 contra dos sesiones 10:00-11:00 y 11:00-12:00
    // La sesión 11:00-12:00 termina a las 12:00, nueva empieza a las 12:00 → no overlap
    const resultado = haySuperposicion(
      DOS_SESIONES_CONSECUTIVAS,
      { mentoraId: "mentora-1", fecha: "2026-10-19", horaInicio: "12:00", horaFin: "13:00" }
    )
    expect(resultado).toBe(false)
  })
})