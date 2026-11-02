import { useState } from "react"

/** El enlace propio de la sesión: es la única forma de volver a verla o cancelarla. */
export default function CopiarEnlace({ id }: { id: string }) {
  const enlace = `${window.location.origin}/sesiones/${id}`
  const [mensaje, setMensaje] = useState("")

  async function copiar() {
    try {
      if (!navigator.clipboard) throw new Error("Portapapeles no disponible")
      await navigator.clipboard.writeText(enlace)
      setMensaje("Enlace copiado")
    } catch {
      setMensaje("No pudimos copiar el enlace: seleccionalo y copialo a mano")
    }
  }

  return (
    <div className="copiar-enlace">
      <label htmlFor="enlace-sesion">Enlace de tu sesión</label>
      <div className="copiar-enlace-fila">
        <input id="enlace-sesion" value={enlace} readOnly onFocus={(e) => e.target.select()} />
        <button type="button" className="boton boton-secundario" onClick={copiar}>
          Copiar enlace
        </button>
      </div>
      <p className="copiar-enlace-mensaje" role="status">
        {mensaje}
      </p>
      <p className="copiar-enlace-aviso">Guardá este enlace: es la única forma de volver a ver o cancelar tu sesión.</p>
    </div>
  )
}
