// Cada ejercicio se habilita al terminar el anterior: el candado del índice, la página de un ejercicio
// bloqueado y la pregunta para avanzar igual. Se puede, pero lo recomendado es terminar el anterior.
import { useEffect, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router"
import type { Ejercicio } from "./contenido"
import { marcarAvanzarIgual } from "./progreso"

export function Candado() {
  return (
    <svg
      className="candado"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
      <rect x="4" y="10.5" width="16" height="11" rx="2.5" fill="var(--superficie)" />
      <path d="M12 15v2.5" />
    </svg>
  )
}

type PropsPregunta = { ejercicio: Ejercicio; anterior: Ejercicio; alCerrar: () => void }

/** ¿Avanzar sin terminar el anterior? La acción principal es ir a terminarlo; avanzar igual queda como secundaria. */
export function ConfirmarAvance({ ejercicio, anterior, alCerrar }: PropsPregunta) {
  const ref = useRef<HTMLDialogElement>(null)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const destino = `/ejercicios/${ejercicio.id}`

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo || dialogo.open) return
    if (typeof dialogo.showModal === "function") dialogo.showModal()
    else dialogo.open = true // jsdom
  }, [])

  function avanzar() {
    marcarAvanzarIgual(ejercicio.id)
    // Desde la página bloqueada ya se está ahí: alcanza con que se habilite.
    if (pathname !== destino) navigate(destino)
  }

  return (
    // Clic en el fondo (fuera de la caja) también cierra, como el detalle del tablero.
    <dialog ref={ref} className="detalle confirmar" aria-labelledby="confirmar-titulo" onClose={alCerrar} onClick={(e) => e.target === ref.current && alCerrar()}>
      <div className="detalle-caja">
        <span className="bloqueado-candado">
          <Candado />
        </span>
        <h2 id="confirmar-titulo">¿Seguro que querés avanzar sin terminar el ejercicio {anterior.numero}?</h2>
        <p>
          Cada ejercicio usa lo que armaste en el anterior: lo ideal es terminar el {anterior.numero} y apretar
          <strong> Terminé</strong>. Si igual necesitás ver el {ejercicio.numero}, podés avanzar.
        </p>
        <div className="confirmar-acciones">
          <Link to={`/ejercicios/${anterior.id}`} className="boton">
            <span aria-hidden="true">←</span> Ir al ejercicio {anterior.numero}
          </Link>
          <button type="button" className="boton boton-secundario" onClick={avanzar}>
            Avanzar igual
          </button>
        </div>
      </div>
    </dialog>
  )
}

export default function Bloqueado({ ejercicio, anterior }: { ejercicio: Ejercicio; anterior: Ejercicio }) {
  const [preguntando, setPreguntando] = useState(false)
  return (
    <section className="tarjeta bloqueado" aria-labelledby="bloqueado-titulo">
      <span className="bloqueado-candado">
        <Candado />
      </span>
      <p className="sobretitulo">Ejercicio {ejercicio.numero}</p>
      <h2 id="bloqueado-titulo">Todavía no está habilitado</h2>
      <p>
        Hasta que no termines el ejercicio {anterior.numero}, no se habilita el ejercicio {ejercicio.numero}.
      </p>
      <div className="confirmar-acciones">
        <Link to={`/ejercicios/${anterior.id}`} className="boton">
          <span aria-hidden="true">←</span> Ir al ejercicio {anterior.numero}
        </Link>
        <button type="button" className="boton boton-secundario" onClick={() => setPreguntando(true)}>
          Avanzar igual
        </button>
      </div>
      {preguntando && <ConfirmarAvance ejercicio={ejercicio} anterior={anterior} alCerrar={() => setPreguntando(false)} />}
    </section>
  )
}
