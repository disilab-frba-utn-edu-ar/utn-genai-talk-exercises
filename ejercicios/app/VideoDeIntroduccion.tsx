// Video de introducción de un ejercicio: se abre en un popup cada vez que se entra (con "Ver consigna"
// o recargando la página); al minimizarlo queda un botón chico abajo a la derecha (arriba de la barra de
// Guardar y Terminé, si está) para volver a verlo.
// No se recuerda que se minimizó: la idea es que lo vean antes de cada ejercicio. Sin autoplay.
import { useEffect, useRef, useState } from "react"
import type { Ejercicio } from "./contenido"
import { videosIntro } from "./videos"

const ABAJO = 16 // px: sin barra a la vista, a 1rem del borde
const SOBRE_BARRA = 12 // px de aire entre el video minimizado y la barra

/**
 * Distancia al borde de abajo para el video minimizado. La barra de Guardar y Terminé es sticky: pegada
 * abajo mientras se lee, pero al final de la página sube con el contenido. Si está en la mitad de abajo,
 * el video va justo arriba de ella; si no (o no está, o está en una pestaña oculta), en la esquina.
 */
function distanciaAbajo(): number {
  const barra = document.querySelector<HTMLElement>(".respuestas-acciones")
  if (!barra || barra.closest("[hidden]")) return ABAJO
  const { top } = barra.getBoundingClientRect()
  return top >= window.innerHeight / 2 ? Math.max(ABAJO, window.innerHeight - top + SOBRE_BARRA) : ABAJO
}

/** Sigue a la barra al scrollear, al cambiar el tamaño y cuando cambia la página (pestañas, avisos, carga). */
function useDistanciaAbajo(activo: boolean): number {
  const [distancia, setDistancia] = useState(ABAJO)
  useEffect(() => {
    if (!activo) return
    let cuadro = 0
    const actualizar = () => {
      cancelAnimationFrame(cuadro)
      cuadro = requestAnimationFrame(() => setDistancia(distanciaAbajo()))
    }
    actualizar()
    const cambios = new MutationObserver(actualizar)
    cambios.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["hidden"] })
    window.addEventListener("scroll", actualizar, { passive: true })
    window.addEventListener("resize", actualizar)
    return () => {
      cancelAnimationFrame(cuadro)
      cambios.disconnect()
      window.removeEventListener("scroll", actualizar)
      window.removeEventListener("resize", actualizar)
    }
  }, [activo])
  return distancia
}

export default function VideoDeIntroduccion({ ejercicio }: { ejercicio: Ejercicio }) {
  const { id, numero, titulo } = ejercicio
  const video = videosIntro[id]
  const [abierto, setAbierto] = useState(true)
  const dialogo = useRef<HTMLDialogElement>(null)
  const reproductor = useRef<HTMLVideoElement>(null)
  const abajo = useDistanciaAbajo(!abierto)

  useEffect(() => {
    const d = dialogo.current
    if (!d || d.open === abierto) return
    if (abierto) {
      if (typeof d.showModal === "function") d.showModal()
      else d.open = true // jsdom
    } else if (typeof d.close === "function") d.close()
    else d.open = false
  }, [abierto])

  if (!video) return null

  // También al cerrar con Escape o con un clic en el fondo.
  function minimizar() {
    reproductor.current?.pause()
    setAbierto(false)
  }

  return (
    <>
      <dialog
        ref={dialogo}
        className="video-intro"
        aria-label="Video de introducción"
        onClose={minimizar}
        onClick={(e) => e.target === dialogo.current && minimizar()}
      >
        <div className="video-intro-caja">
          {/* div y no header/footer: dentro de un dialog serían otro banner y otro contentinfo de la página. */}
          <div className="video-intro-cabecera">
            <div>
              <p className="sobretitulo">Ejercicio {numero}</p>
              <h2 className="video-intro-titulo">{titulo}</h2>
            </div>
            <button type="button" className="video-intro-minimizar" aria-label="Minimizar" title="Minimizar" onClick={minimizar}>
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {/* La raya de "minimizar ventana": una flecha hacia abajo se confunde con "descargar". */}
                <path d="M6 17h12" />
              </svg>
            </button>
          </div>
          <div className="video-intro-pantalla">
            <video ref={reproductor} src={video.src} poster={video.poster} controls preload="metadata" playsInline />
          </div>
          <p className="video-intro-descripcion">{video.descripcion}</p>
          <div className="video-intro-pie">
            <p className="nota-mano video-intro-nota">pausalo cuando quieras para leer con calma</p>
            <button type="button" className="boton" onClick={minimizar}>
              Empezar el ejercicio <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </dialog>
      {!abierto && (
        <button type="button" className="video-intro-mini" style={{ bottom: abajo }} onClick={() => setAbierto(true)}>
          <span className="video-intro-mini-miniatura">
            <img src={video.poster} alt="" />
          </span>
          <span className="video-intro-mini-texto">
            <span>Ver video de introducción</span>
            <span className="video-intro-mini-duracion">{video.duracion}</span>
          </span>
        </button>
      )}
    </>
  )
}
