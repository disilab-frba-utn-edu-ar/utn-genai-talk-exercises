import type { MentoraPublica } from "@shared/types"

type Props = {
  mentora: MentoraPublica
  /** Nombre de la mentora asignada antes, si la asignación cambió al confirmar. */
  anterior?: string
}

/** La mentora que la plataforma asignó al colectivo (sin datos de contacto, Principio IV). */
export default function MentoraAsignada({ mentora, anterior }: Props) {
  return (
    <div className="mentora-asignada" aria-live="polite">
      {anterior && (
        <p className="aviso-cambio" role="alert">
          {anterior} ya no está libre en ese horario. Les asignamos a {mentora.nombre}: revisen sus datos y confirmen de
          nuevo.
        </p>
      )}
      <p className="mentora-asignada-nombre">
        {mentora.nombre}
        {mentora.pronombres && <span className="mentora-meta"> · {mentora.pronombres}</span>}
      </p>
      <p className="mentora-presentacion">{mentora.presentacion}</p>
    </div>
  )
}
