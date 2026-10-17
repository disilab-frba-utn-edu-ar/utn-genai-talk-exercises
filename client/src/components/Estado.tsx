import type { ReactNode } from "react"

/** Estados de carga, error y vacío de una vista con datos remotos (Principio VI). */
export function Cargando({ texto = "Cargando…" }: { texto?: string }) {
  return (
    <div className="estado" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      {texto}
    </div>
  )
}

export function ErrorCarga({ mensaje, onReintentar }: { mensaje: string; onReintentar?: () => void }) {
  return (
    <div className="estado estado-error" role="alert">
      <p>{mensaje}</p>
      {onReintentar && (
        <button type="button" className="boton boton-secundario" onClick={onReintentar}>
          Reintentar
        </button>
      )}
    </div>
  )
}

export function Vacio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="estado estado-vacio">
      <p className="estado-titulo">{titulo}</p>
      {children}
    </div>
  )
}
