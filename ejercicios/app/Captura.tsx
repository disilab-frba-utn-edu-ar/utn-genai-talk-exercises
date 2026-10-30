// Captura de pantalla opcional al final de las preguntas: se elige o se pega, y se guarda al toque
// en ejercicios/<id>/ (entra en el commit de la entrega). No bloquea "Terminé".
import { useEffect, useRef, useState, type ClipboardEvent } from "react"
import { borrarCaptura, guardarCaptura, leerCaptura } from "./api"

const TIPOS = ["image/png", "image/jpeg", "image/webp"]
const LIMITE_BYTES = 5_000_000

export default function Captura({ id }: { id: string }) {
  const [url, setUrl] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState("")
  const [ocupada, setOcupada] = useState(false)
  const entrada = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let vigente = true
    leerCaptura(id).then(
      (imagen) => vigente && imagen && setUrl(URL.createObjectURL(imagen)),
      () => {}, // sin servidor no hay captura previa: se puede subir igual cuando vuelva
    )
    return () => {
      vigente = false
    }
  }, [id])

  async function hacer(accion: () => Promise<unknown>, alTerminar: () => void, listo: string) {
    setOcupada(true)
    try {
      await accion()
      alTerminar()
      setMensaje(listo)
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : String(error))
    } finally {
      setOcupada(false)
    }
  }

  function subir(archivo: File | undefined) {
    if (!archivo) return
    if (!TIPOS.includes(archivo.type)) return setMensaje("Tiene que ser una imagen PNG, JPG o WebP.")
    if (archivo.size > LIMITE_BYTES) return setMensaje("La imagen pesa más de 5 MB: probá con una captura más chica.")
    void hacer(() => guardarCaptura(id, archivo), () => setUrl(URL.createObjectURL(archivo)), "Captura guardada.")
  }

  const alPegar = (evento: ClipboardEvent) => {
    const archivo = evento.clipboardData.files[0]
    if (archivo) {
      evento.preventDefault()
      subir(archivo)
    }
  }

  return (
    <section className="captura" aria-labelledby={`captura-${id}`}>
      <h4 id={`captura-${id}`}>Captura de pantalla (opcional)</h4>
      <p>Algo de tu funcionalidad andando: una pantalla, un mensaje de error del flujo, lo que te parezca representativo.</p>
      <div className="captura-zona" tabIndex={0} onPaste={alPegar} aria-label="Pegá acá una imagen con Ctrl+V">
        {url ? <img src={url} alt="Tu captura de pantalla" /> : <span>Hacé clic acá y pegá una imagen con Ctrl+V, o elegila desde un archivo.</span>}
      </div>
      <div className="captura-acciones">
        <input
          ref={entrada}
          type="file"
          accept={TIPOS.join(",")}
          hidden
          onChange={(e) => {
            subir(e.target.files?.[0])
            e.target.value = "" // así se puede volver a elegir el mismo archivo
          }}
        />
        <button type="button" className="boton boton-secundario" disabled={ocupada} onClick={() => entrada.current?.click()}>
          {url ? "Reemplazar imagen" : "Elegir imagen"}
        </button>
        {url && (
          <button
            type="button"
            className="boton boton-secundario"
            disabled={ocupada}
            onClick={() => hacer(() => borrarCaptura(id), () => setUrl(null), "Captura quitada.")}
          >
            Quitar
          </button>
        )}
        <p className="respuestas-estado" role="status" aria-live="polite">
          {mensaje}
        </p>
      </div>
    </section>
  )
}
