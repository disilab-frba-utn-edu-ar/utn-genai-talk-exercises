import type { ReactNode } from "react"

type Props = {
  activo: boolean
  onClick: () => void
  children: ReactNode
}

/** Botón seleccionable con forma de chip. */
export default function Chip({ activo, onClick, children }: Props) {
  return (
    <button type="button" className="chip" aria-pressed={activo} onClick={onClick}>
      {children}
    </button>
  )
}
