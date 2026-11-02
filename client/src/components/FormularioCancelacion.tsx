import { useEffect, useRef, useState, type FormEvent } from "react"

const MOTIVO_MAX = 500

type Props = {
  enviando: boolean
  error: string | null
  onConfirmar: (motivo?: string) => void
  onVolver: () => void
}

/** Confirmación explícita de la cancelación, con un motivo opcional (FR-007, FR-008). */
export default function FormularioCancelacion({ enviando, error, onConfirmar, onVolver }: Props) {
  const [motivo, setMotivo] = useState("")
  const titulo = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    titulo.current?.focus()
  }, [])

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (enviando) return
    const recortado = motivo.trim()
    onConfirmar(recortado || undefined)
  }

  return (
    <form className="formulario cancelacion tarjeta" onSubmit={enviar} aria-labelledby="titulo-cancelacion">
      <h2 id="titulo-cancelacion" ref={titulo} tabIndex={-1}>
        ¿Cancelar esta sesión?
      </h2>
      <p>El horario va a quedar libre para que otro colectivo lo reserve. No se puede deshacer.</p>

      <div className="campo">
        <label htmlFor="motivo">Motivo (opcional)</label>
        <textarea
          id="motivo"
          name="motivo"
          rows={3}
          maxLength={MOTIVO_MAX}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          aria-describedby="motivo-contador"
        />
        <p id="motivo-contador" className="campo-ayuda">
          {motivo.length}/{MOTIVO_MAX}
        </p>
      </div>

      {error && (
        <p className="aviso-error" role="alert">
          {error}
        </p>
      )}

      <div className="cancelacion-acciones">
        <button type="submit" className="boton boton-peligro" disabled={enviando}>
          {enviando ? "Cancelando…" : "Confirmar cancelación"}
        </button>
        <button type="button" className="boton boton-secundario" onClick={onVolver} disabled={enviando}>
          Volver
        </button>
      </div>
    </form>
  )
}
