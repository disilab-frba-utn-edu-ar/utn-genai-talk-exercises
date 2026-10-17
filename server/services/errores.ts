/** Error de un caso de uso con el código HTTP que le corresponde (Principio III). */
export class ErrorDeNegocio extends Error {
  constructor(
    readonly status: 400 | 404 | 409,
    message: string,
  ) {
    super(message)
  }
}

export const noEncontrado = (mensaje: string) => new ErrorDeNegocio(404, mensaje)
export const invalido = (mensaje: string) => new ErrorDeNegocio(400, mensaje)
export const conflicto = (mensaje: string) => new ErrorDeNegocio(409, mensaje)
