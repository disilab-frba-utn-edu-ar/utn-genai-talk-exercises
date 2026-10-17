import type { TipoAsesoria } from "@shared/types"
import { duracion } from "../formato"

type Props = {
  tipos: TipoAsesoria[]
  seleccionado: string | null
  onSeleccionar: (id: string) => void
}

export default function SelectorTipo({ tipos, seleccionado, onSeleccionar }: Props) {
  return (
    <fieldset className="opciones-tipo">
      <legend className="sr-only">Tipo de asesoría</legend>
      {tipos.map((tipo) => (
        <label key={tipo.id} className="opcion-tipo" data-activo={seleccionado === tipo.id}>
          <input
            type="radio"
            name="tipo"
            value={tipo.id}
            checked={seleccionado === tipo.id}
            onChange={() => onSeleccionar(tipo.id)}
          />
          <span className="opcion-tipo-nombre">{tipo.nombre}</span>
          <span className="opcion-tipo-duracion">{duracion(tipo.duracionMinutos)}</span>
          <span className="opcion-tipo-descripcion">{tipo.descripcion}</span>
        </label>
      ))}
    </fieldset>
  )
}
