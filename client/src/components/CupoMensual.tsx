type Props = {
  /** Ausente = la mentora no tiene límite: no se muestra nada. */
  horasRestantes?: number
}

const formatoHoras = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 })

export default function CupoMensual({ horasRestantes }: Props) {
  if (horasRestantes === undefined) return null
  return (
    <p className="cupo-mensual">
      {horasRestantes > 0 ? `Le quedan ${formatoHoras.format(horasRestantes)} h este mes` : "Sin cupo este mes"}
    </p>
  )
}
