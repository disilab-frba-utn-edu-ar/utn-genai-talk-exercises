import type { Habilidad, MentoraPublica } from "@shared/types"
import { Link } from "react-router"

type Props = {
  mentora: MentoraPublica
  habilidades: Habilidad[]
}

export default function MentoraCard({ mentora, habilidades }: Props) {
  const titulo = (id: string) => habilidades.find((h) => h.id === id)?.titulo ?? id

  return (
    <article className="tarjeta mentora">
      <div>
        <h2 className="mentora-nombre">{mentora.nombre}</h2>
        <p className="mentora-meta">
          {[mentora.pronombres, mentora.github && `@${mentora.github}`].filter(Boolean).join(" · ")}
        </p>
      </div>
      <p className="mentora-presentacion">{mentora.presentacion}</p>
      <ul className="etiquetas" aria-label="Habilidades">
        {mentora.habilidades.map((id) => (
          <li key={id} className="etiqueta">
            {titulo(id)}
          </li>
        ))}
      </ul>
      <Link to={`/mentoras/${mentora.id}`} className="boton mentora-accion">
        Reservar sesión <span aria-hidden="true">→</span>
      </Link>
    </article>
  )
}
