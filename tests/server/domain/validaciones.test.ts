import { validarNuevaSesion } from "../../../server/domain/validaciones"

const valida = {
  mentoraId: "m1",
  tipoAsesoriaId: "revision_de_codigo",
  colectivoId: "c1",
  proyecto: "Revisar el formulario de inscripción",
  contactoNombre: "Ana",
  contactoEmail: "ana@example.org",
  fecha: "2026-10-19",
  horaInicio: "10:00",
}

describe("domain/validaciones · validarNuevaSesion", () => {
  it("acepta datos válidos y recorta espacios", () => {
    const resultado = validarNuevaSesion({ ...valida, contactoNombre: "  Ana  " })
    expect(resultado).toEqual({ ok: true, valor: { ...valida, contactoNombre: "Ana" } })
  })

  it.each(Object.keys(valida))("rechaza si falta %s", (campo) => {
    const resultado = validarNuevaSesion({ ...valida, [campo]: "" })
    expect(resultado.ok).toBe(false)
  })

  it("rechaza un body que no es un objeto", () => {
    expect(validarNuevaSesion(null)).toEqual({ ok: false, error: "El cuerpo de la solicitud debe ser un objeto JSON" })
  })

  it("rechaza un email inválido", () => {
    expect(validarNuevaSesion({ ...valida, contactoEmail: "ana@" })).toEqual({
      ok: false,
      error: "El email de contacto no es válido",
    })
  })

  it("rechaza un proyecto demasiado corto o demasiado largo", () => {
    expect(validarNuevaSesion({ ...valida, proyecto: "corto" }).ok).toBe(false)
    expect(validarNuevaSesion({ ...valida, proyecto: "x".repeat(501) }).ok).toBe(false)
  })

  it("rechaza fecha u hora con formato inválido", () => {
    expect(validarNuevaSesion({ ...valida, fecha: "19/10/2026" }).ok).toBe(false)
    expect(validarNuevaSesion({ ...valida, horaInicio: "10hs" }).ok).toBe(false)
  })
})
