import type { DiaDisponible } from "@shared/types"
import { Link } from "react-router"
import { fechaCorta, fechaLarga } from "../formato"
import { Vacio } from "./Estado"

type Props = {
  dias: DiaDisponible[]
  seleccionado: string | null
  onSeleccionar: (fecha: string) => void
}

export default function SelectorDia({ dias, seleccionado, onSeleccionar }: Props) {
  if (dias.length === 0) {
    return (
      <Vacio titulo="No hay lugar en los próximos 14 días">
        <p>Esta mentora no tiene horarios libres para este tipo de asesoría.</p>
        <Link to="/" className="boton boton-secundario">
          Ver otras mentoras
        </Link>
      </Vacio>
    )
  }

  return (
    <div className="dias" role="group" aria-label="Días con lugar">
      {dias.map(({ fecha, horarios }) => {
        const { dia, numero, mes } = fechaCorta(fecha)
        return (
          <button
            key={fecha}
            type="button"
            className="dia"
            aria-pressed={seleccionado === fecha}
            aria-label={`${fechaLarga(fecha)}, ${horarios.length} horarios libres`}
            onClick={() => onSeleccionar(fecha)}
          >
            <span className="dia-semana">{dia}</span>
            <span className="dia-numero">{numero}</span>
            <span className="dia-mes">{mes}</span>
          </button>
        )
      })}
    </div>
  )
}
