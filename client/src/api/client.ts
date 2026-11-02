// Único lugar del cliente que hace fetch (Principio VI).
import type {
  Colectivo,
  DiaDisponible,
  ErrorApi,
  Habilidad,
  MentoraPublica,
  NuevaSesion,
  Sesion,
  SesionPublica,
  TipoAsesoria,
} from "@shared/types"

export class ErrorDeApi extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

async function pedir<T>(ruta: string, opciones?: RequestInit): Promise<T> {
  let respuesta: Response
  try {
    respuesta = await fetch(`/api${ruta}`, {
      ...opciones,
      headers: { "Content-Type": "application/json", ...opciones?.headers },
    })
  } catch {
    throw new ErrorDeApi(0, "No pudimos conectarnos con el servidor. Revisá tu conexión e intentá de nuevo.")
  }

  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => null)) as ErrorApi | null
    throw new ErrorDeApi(respuesta.status, cuerpo?.error ?? "Ocurrió un error inesperado")
  }
  return respuesta.json() as Promise<T>
}

export const api = {
  habilidades: () => pedir<Habilidad[]>("/habilidades"),
  tiposAsesoria: () => pedir<TipoAsesoria[]>("/tipos-asesoria"),
  colectivos: () => pedir<Colectivo[]>("/colectivos"),
  mentoras: (habilidad?: string) =>
    pedir<MentoraPublica[]>(habilidad ? `/mentoras?habilidad=${encodeURIComponent(habilidad)}` : "/mentoras"),
  mentora: (id: string) => pedir<MentoraPublica>(`/mentoras/${encodeURIComponent(id)}`),
  disponibilidad: (mentoraId: string, tipoAsesoriaId: string) =>
    pedir<DiaDisponible[]>(
      `/mentoras/${encodeURIComponent(mentoraId)}/disponibilidad?tipoAsesoriaId=${encodeURIComponent(tipoAsesoriaId)}`,
    ),
  sesion: (id: string) => pedir<SesionPublica>(`/sesiones/${encodeURIComponent(id)}`),
  crearSesion: (datos: NuevaSesion) => pedir<Sesion>("/sesiones", { method: "POST", body: JSON.stringify(datos) }),
}
