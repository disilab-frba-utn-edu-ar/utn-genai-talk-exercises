import type { ReactNode } from "react"

/** Un paso numerado de un flujo de reserva. */
export default function Paso({ numero, titulo, children }: { numero: number; titulo: string; children: ReactNode }) {
  return (
    <section className="paso" aria-labelledby={`paso-${numero}`}>
      <h2 id={`paso-${numero}`} className="paso-titulo">
        <span className="paso-numero" aria-hidden="true">
          {numero}
        </span>
        {titulo}
      </h2>
      {children}
    </section>
  )
}
