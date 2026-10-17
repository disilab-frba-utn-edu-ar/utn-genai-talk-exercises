import { useCallback, useEffect, useState } from "react"

export type Carga<T> =
  | { estado: "inactiva" }
  | { estado: "cargando" }
  | { estado: "error"; error: string }
  | { estado: "lista"; datos: T }

type Resultado<T> = { clave: string; datos?: T; error?: string }

/**
 * Carga datos remotos y expone los estados cargando / error / lista (Principio VI).
 * `clave` identifica qué se carga: cuando cambia, se vuelve a cargar; si es null, no carga.
 */
export function useCarga<T>(clave: string | null, cargar: () => Promise<T>): Carga<T> & { recargar: () => void } {
  const [intento, setIntento] = useState(0)
  const [resultado, setResultado] = useState<Resultado<T> | null>(null)
  const claveActual = clave === null ? null : `${clave}#${intento}`

  useEffect(() => {
    if (claveActual === null) return
    let vigente = true
    cargar().then(
      (datos) => vigente && setResultado({ clave: claveActual, datos }),
      (error: unknown) =>
        vigente && setResultado({ clave: claveActual, error: error instanceof Error ? error.message : String(error) }),
    )
    return () => {
      vigente = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- la clave identifica la carga; `cargar` cambia en cada render
  }, [claveActual])

  const recargar = useCallback(() => setIntento((n) => n + 1), [])

  if (claveActual === null) return { estado: "inactiva", recargar }
  if (resultado?.clave !== claveActual) return { estado: "cargando", recargar }
  if (resultado.error !== undefined) return { estado: "error", error: resultado.error, recargar }
  return { estado: "lista", datos: resultado.datos as T, recargar }
}
