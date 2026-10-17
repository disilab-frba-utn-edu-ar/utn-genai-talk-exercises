import type { Horario } from "@shared/types"
import Chip from "./Chip"

type Props = {
  horarios: Horario[]
  seleccionado: string | null
  onSeleccionar: (inicio: string) => void
}

export default function SelectorHorario({ horarios, seleccionado, onSeleccionar }: Props) {
  return (
    <div className="chips" role="group" aria-label="Horarios libres">
      {horarios.map((horario) => (
        <Chip key={horario.inicio} activo={seleccionado === horario.inicio} onClick={() => onSeleccionar(horario.inicio)}>
          {horario.inicio} – {horario.fin}
        </Chip>
      ))}
    </div>
  )
}
