import type { Colectivo } from "@shared/types"
import { useState, type FormEvent } from "react"
import { TIPOS_COLECTIVO } from "../formato"

export type DatosContacto = {
  colectivoId: string
  proyecto: string
  contactoNombre: string
  contactoEmail: string
}

type Props = {
  colectivos: Colectivo[]
  enviando: boolean
  onConfirmar: (datos: DatosContacto) => void
}

const VACIO: DatosContacto = { colectivoId: "", proyecto: "", contactoNombre: "", contactoEmail: "" }
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Mismas reglas que valida el servidor (domain/validaciones.ts). */
function errores(datos: DatosContacto): Partial<Record<keyof DatosContacto, string>> {
  const proyecto = datos.proyecto.trim()
  return {
    colectivoId: datos.colectivoId ? undefined : "Elegí tu colectivo",
    proyecto:
      proyecto.length < 10
        ? "Contanos en al menos 10 caracteres qué necesitan resolver"
        : proyecto.length > 500
          ? "Máximo 500 caracteres"
          : undefined,
    contactoNombre: datos.contactoNombre.trim() ? undefined : "Indicá un nombre de contacto",
    contactoEmail: EMAIL.test(datos.contactoEmail.trim()) ? undefined : "Ingresá un email válido",
  }
}

export default function FormularioContacto({ colectivos, enviando, onConfirmar }: Props) {
  const [datos, setDatos] = useState(VACIO)
  const [tocados, setTocados] = useState<Partial<Record<keyof DatosContacto, boolean>>>({})

  const problemas = errores(datos)
  const valido = Object.values(problemas).every((p) => p === undefined)

  const campo = (nombre: keyof DatosContacto) => ({
    id: nombre,
    name: nombre,
    value: datos[nombre],
    "aria-invalid": Boolean(tocados[nombre] && problemas[nombre]),
    "aria-describedby": `${nombre}-error`,
    onChange: (e: { target: { value: string } }) => setDatos((d) => ({ ...d, [nombre]: e.target.value })),
    onBlur: () => setTocados((t) => ({ ...t, [nombre]: true })),
  })

  const error = (nombre: keyof DatosContacto) => (
    <p id={`${nombre}-error`} className="campo-error" aria-live="polite">
      {tocados[nombre] ? problemas[nombre] : ""}
    </p>
  )

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (!valido || enviando) return
    onConfirmar({
      colectivoId: datos.colectivoId,
      proyecto: datos.proyecto.trim(),
      contactoNombre: datos.contactoNombre.trim(),
      contactoEmail: datos.contactoEmail.trim(),
    })
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <div className="campo">
        <label htmlFor="colectivoId">Colectivo</label>
        <select {...campo("colectivoId")}>
          <option value="">Elegí tu colectivo…</option>
          {colectivos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre} ({TIPOS_COLECTIVO[c.tipo]})
            </option>
          ))}
        </select>
        {error("colectivoId")}
      </div>

      <div className="campo">
        <label htmlFor="proyecto">¿Qué necesitan resolver?</label>
        <textarea {...campo("proyecto")} rows={3} maxLength={500} placeholder="Ej.: queremos revisar el formulario de inscripción antes de publicarlo" />
        {error("proyecto")}
      </div>

      <div className="campos-fila">
        <div className="campo">
          <label htmlFor="contactoNombre">Nombre de contacto</label>
          <input {...campo("contactoNombre")} autoComplete="name" />
          {error("contactoNombre")}
        </div>
        <div className="campo">
          <label htmlFor="contactoEmail">Email de contacto</label>
          <input {...campo("contactoEmail")} type="email" autoComplete="email" />
          {error("contactoEmail")}
        </div>
      </div>

      <button type="submit" className="boton boton-grande" disabled={!valido || enviando}>
        {enviando ? "Confirmando…" : "Confirmar sesión"}
      </button>
    </form>
  )
}
