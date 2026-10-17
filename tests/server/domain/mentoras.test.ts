import type { Mentora, TipoAsesoria } from "@shared/types"
import { aMentoraPublica, puedeDar, tiposQuePuedeDar } from "../../../server/domain/mentoras"

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
    const publica = aMentoraPublica(mentora, [tipo("a", ["testing_unitario"])])
    expect(publica).not.toHaveProperty("contacto")
    expect(publica.tiposAsesoria).toEqual(["a"])
  })
})
