import type { Mentora, Sesion, TipoAsesoria } from "@shared/types"
import { aMentoraPublica, puedeDar, tiposQuePuedeDar } from "../../../server/domain/mentoras"

const AHORA = new Date(2026, 9, 18, 12, 0)

const tipo = (id: string, habilidades: string[]): TipoAsesoria => ({
  id,
  nombre: id,
  descripcion: "",
  duracionMinutos: 30,
  habilidades,
})

const mentora: Mentora = {
  id: "m1",
  nombre: "Vale",
  presentacion: "",
  habilidades: ["desarrollo_web_react", "testing_unitario"],
  disponibilidad: {
    lunes: null, martes: null, miercoles: null, jueves: null, viernes: null, sabado: null, domingo: null,
  },
  contacto: { email: "vale@example.org" },
}

describe("domain/mentoras", () => {
  it("puede dar un tipo si tiene al menos una de sus habilidades", () => {
    expect(puedeDar(mentora, tipo("a", ["devops_docker", "testing_unitario"]))).toBe(true)
  })

  it("no puede dar un tipo si no tiene ninguna de sus habilidades", () => {
    expect(puedeDar(mentora, tipo("b", ["devops_docker"]))).toBe(false)
  })

  it("lista los tipos que puede dar", () => {
    const tipos = [tipo("a", ["testing_unitario"]), tipo("b", ["devops_docker"]), tipo("c", ["desarrollo_web_react"])]
    expect(tiposQuePuedeDar(mentora, tipos)).toEqual(["a", "c"])
  })

  it("la vista pública no incluye el contacto", () => {
    const publica = aMentoraPublica(mentora, [tipo("a", ["testing_unitario"])], [], AHORA)
    expect(publica).not.toHaveProperty("contacto")
    expect(publica.tiposAsesoria).toEqual(["a"])
  })

  describe("cupo mensual", () => {
    const sesion = (extra: Partial<Sesion> = {}): Sesion => ({
      id: "s", mentoraId: "m1", tipoAsesoriaId: "a", colectivoId: "c", proyecto: "p",
      contactoNombre: "n", contactoEmail: "e@example.org", fecha: "2026-10-19",
      horaInicio: "18:00", horaFin: "19:00", estado: "confirmada", ...extra,
    })
    const publica = (cupo: number | undefined, sesiones: Sesion[] = []) =>
      aMentoraPublica({ ...mentora, cupoMensualHoras: cupo }, [], sesiones, AHORA)

    it("informa las horas restantes del mes y descarta el cupo total", () => {
      const vista = publica(2, [sesion()])
      expect(vista.horasRestantes).toBe(1)
      expect(vista).not.toHaveProperty("cupoMensualHoras")
    })

    it("informa fracciones de hora", () => {
      expect(publica(1.5, [sesion({ horaFin: "18:30" })]).horasRestantes).toBe(1)
    })

    it("informa 0 cuando se agotó y no cuenta las canceladas ni otros meses", () => {
      expect(publica(1, [sesion()]).horasRestantes).toBe(0)
      expect(publica(1, [sesion({ estado: "cancelada" })]).horasRestantes).toBe(1)
      expect(publica(1, [sesion({ fecha: "2026-11-02" })]).horasRestantes).toBe(1)
    })

    it("no informa horas restantes si no tiene cupo definido", () => {
      expect(publica(undefined)).not.toHaveProperty("horasRestantes")
    })
  })
})
