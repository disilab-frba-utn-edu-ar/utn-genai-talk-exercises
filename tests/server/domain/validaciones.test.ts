import { validarCancelacion, validarNuevaSesion } from "../../../server/domain/validaciones"

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

describe("domain/validaciones · validarCancelacion", () => {
  it("acepta cancelar sin motivo", () => {
    expect(validarCancelacion({ estado: "cancelada" })).toEqual({ ok: true, valor: { estado: "cancelada" } })
  })

  it("recorta el motivo y lo ignora si queda vacío", () => {
    expect(validarCancelacion({ estado: "cancelada", motivo: "  Se suspendió  " })).toEqual({
      ok: true,
      valor: { estado: "cancelada", motivo: "Se suspendió" },
    })
    expect(validarCancelacion({ estado: "cancelada", motivo: "   " })).toEqual({ ok: true, valor: { estado: "cancelada" } })
  })

  it("acepta un motivo de hasta 500 caracteres", () => {
    expect(validarCancelacion({ estado: "cancelada", motivo: "a".repeat(500) }).ok).toBe(true)
    expect(validarCancelacion({ estado: "cancelada", motivo: "a".repeat(501) })).toEqual({
      ok: false,
      error: "El motivo puede tener hasta 500 caracteres",
    })
  })

  it("rechaza un motivo que no es texto", () => {
    expect(validarCancelacion({ estado: "cancelada", motivo: 3 })).toEqual({ ok: false, error: "El motivo debe ser un texto" })
  })

  it("solo permite cambiar el estado a cancelada", () => {
    const error = { ok: false, error: "Solo se puede cambiar el estado a cancelada" }
    expect(validarCancelacion({})).toEqual(error)
    expect(validarCancelacion({ estado: "confirmada" })).toEqual(error)
    expect(validarCancelacion({ motivo: "x" })).toEqual(error)
  })

  it("rechaza otras propiedades además del estado y el motivo", () => {
    expect(validarCancelacion({ estado: "cancelada", fecha: "2026-10-20" })).toEqual({
      ok: false,
      error: "Solo se puede enviar el estado y el motivo",
    })
  })

  it("rechaza un cuerpo que no es un objeto", () => {
    for (const cuerpo of [null, undefined, [], "cancelada"]) {
      expect(validarCancelacion(cuerpo)).toEqual({ ok: false, error: "El cuerpo de la solicitud debe ser un objeto JSON" })
    }
  })
})
