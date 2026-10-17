import { Link, Navigate, useLocation } from "react-router"
import { duracion, fechaLarga } from "../formato"
import type { EstadoConfirmacion } from "./ReservaPage"

export default function ConfirmacionPage() {
  const estado = useLocation().state as EstadoConfirmacion | null
  if (!estado) return <Navigate to="/" replace />

  const { sesion, mentora, tipo, colectivo } = estado
  const filas: [string, string][] = [
    ["Mentora", mentora.nombre],
    ["Asesoría", `${tipo.nombre} (${duracion(tipo.duracionMinutos)})`],
    ["Día", fechaLarga(sesion.fecha)],
    ["Horario", `${sesion.horaInicio} a ${sesion.horaFin}`],
    ["Colectivo", colectivo.nombre],
    ["Proyecto", sesion.proyecto],
    ["Contacto", `${sesion.contactoNombre} · ${sesion.contactoEmail}`],
  ]

  return (
    <section className="confirmacion" aria-labelledby="titulo-confirmacion">
      <span className="confirmacion-icono" aria-hidden="true">
        ✓
      </span>
      <h1 id="titulo-confirmacion">¡Sesión confirmada!</h1>
      <p className="bajada">Guardá estos datos y el código de la sesión. Ese horario ya quedó reservado con {mentora.nombre}.</p>

      <dl className="resumen tarjeta">
        {filas.map(([termino, valor]) => (
          <div key={termino} className="resumen-fila">
            <dt>{termino}</dt>
            <dd>{valor}</dd>
          </div>
        ))}
      </dl>

      <p className="confirmacion-id">
        Código de la sesión: <code>{sesion.id}</code>
      </p>
      <Link to="/" className="boton">
        Volver al inicio
      </Link>
    </section>
  )
}
