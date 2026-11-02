import type { Colectivo, MentoraPublica, SesionDetalle, TipoAsesoria } from "@shared/types"
import { duracion, fechaLarga } from "../formato"

type Props = {
  sesion: SesionDetalle
  mentora: MentoraPublica
  tipo: TipoAsesoria
  colectivo: Colectivo
}

/** Resumen de una sesión. Nunca muestra datos de contacto (Principio IV). */
export default function DetalleSesion({ sesion, mentora, tipo, colectivo }: Props) {
  const filas: [string, string][] = [
    ["Mentora", mentora.nombre],
    ["Asesoría", `${tipo.nombre} (${duracion(tipo.duracionMinutos)})`],
    ["Día", fechaLarga(sesion.fecha)],
    ["Horario", `${sesion.horaInicio} a ${sesion.horaFin}`],
    ["Colectivo", colectivo.nombre],
    ["Proyecto", sesion.proyecto],
    ["Estado", sesion.estado === "cancelada" ? "Cancelada" : "Confirmada"],
  ]
  if (sesion.estado === "cancelada") {
    if (sesion.motivoCancelacion) filas.push(["Motivo", sesion.motivoCancelacion])
    if (sesion.canceladaEn) {
      const cuando = new Date(sesion.canceladaEn).toLocaleString("es-AR", {
        timeZone: "America/Argentina/Buenos_Aires",
        dateStyle: "long",
        timeStyle: "short",
      })
      filas.push(["Cancelada el", cuando])
    }
  }

  return (
    <dl className="resumen tarjeta">
      {filas.map(([termino, valor]) => (
        <div key={termino} className="resumen-fila">
          <dt>{termino}</dt>
          <dd>{valor}</dd>
        </div>
      ))}
    </dl>
  )
}
