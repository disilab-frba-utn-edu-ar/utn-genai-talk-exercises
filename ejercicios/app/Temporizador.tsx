import { useEffect, useState } from "react"

/** Lo que se recuerda entre recargas: cuánto se usó en tramos ya pausados y, si corre, desde cuándo. */
type Guardado = { usadoMs: number; desde: number | null }

const DETENIDO: Guardado = { usadoMs: 0, desde: null }
const clave = (id: string) => `temporizador:${id}`

function leer(id: string): Guardado {
  try {
    const guardado = JSON.parse(localStorage.getItem(clave(id)) ?? "null") as Guardado | null
    return guardado && typeof guardado.usadoMs === "number" ? guardado : DETENIDO
  } catch {
    return DETENIDO
  }
}

function escribir(id: string, valor: Guardado) {
  try {
    localStorage.setItem(clave(id), JSON.stringify(valor))
  } catch {
    // sin almacenamiento (modo privado): el temporizador igual funciona mientras la pestaña esté abierta
  }
}

/** 3_725_000 → "1:02:05" · 125_000 → "2:05" */
export function formatearTiempo(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const [h, m, s] = [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60]
  const dos = (n: number) => String(n).padStart(2, "0")
  return h > 0 ? `${h}:${dos(m)}:${dos(s)}` : `${m}:${dos(s)}`
}

/** Cuenta regresiva de la duración estimada del ejercicio. Sobrevive a recargas de la página. */
export default function Temporizador({ id, minutos }: { id: string; minutos: number }) {
  const [guardado, setGuardado] = useState(() => leer(id))
  const [ahora, setAhora] = useState(() => Date.now())
  const corriendo = guardado.desde !== null

  useEffect(() => {
    if (!corriendo) return
    const intervalo = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(intervalo)
  }, [corriendo])

  const usado = guardado.usadoMs + (guardado.desde === null ? 0 : ahora - guardado.desde)
  const restante = minutos * 60_000 - usado
  const terminado = restante <= 0

  function cambiar(valor: Guardado) {
    setGuardado(valor)
    setAhora(Date.now())
    escribir(id, valor)
  }

  const iniciar = () => cambiar({ ...guardado, desde: Date.now() })
  const pausar = () => cambiar({ usadoMs: usado, desde: null })
  const reiniciar = () => cambiar(DETENIDO)

  return (
    <div className="temporizador" data-terminado={terminado}>
      <span className="temporizador-etiqueta">{terminado ? "Se terminó el tiempo estimado" : "Te quedan"}</span>
      <span className="temporizador-tiempo" role="timer" aria-label="Tiempo restante">
        {formatearTiempo(restante)}
      </span>
      {!terminado &&
        (corriendo ? (
          <button type="button" className="boton boton-secundario" onClick={pausar}>
            Pausar
          </button>
        ) : (
          <button type="button" className="boton" onClick={iniciar}>
            {usado > 0 ? "Seguir" : "Iniciar"}
          </button>
        ))}
      {usado > 0 && (
        <button type="button" className="boton boton-secundario" onClick={reiniciar}>
          Reiniciar
        </button>
      )}
    </div>
  )
}
