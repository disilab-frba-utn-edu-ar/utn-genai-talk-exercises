// Llamadas a la API listas para mandar desde la consigna: las reservas superpuestas del ejercicio 1
// y el endpoint por id del ejercicio 2.
import { useEffect, useId, useState } from "react"
import type { DiaDisponible } from "@shared/types"
import { llamarApi, type RespuestaApi } from "./api"

const MENTORA = "8f3c2a1e-4b5d-4c6e-9f70-1a2b3c4d5e01"
const RUTA = "/api/sesiones"

const PEDIDOS = [
  { titulo: "Estrategia de testing (45 min) a las 19:00", tipoAsesoriaId: "estrategia_de_testing", horaInicio: "19:00", minutos: 45 },
  { titulo: "Revisión de código (30 min) a las 19:30", tipoAsesoriaId: "revision_de_codigo", horaInicio: "19:30", minutos: 30 },
]

const aMinutos = (hora: string) => Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3))
const aHora = (minutos: number) => `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`

// Escala del gantt: de 18:30 a 20:30, con una marca cada media hora.
const DESDE = aMinutos("18:30")
const HASTA = aMinutos("20:30")
const MARCAS = [0, 1, 2, 3, 4].map((i) => DESDE + i * 30)
const enEscala = (inicio: number, fin: number) => ({
  left: `${((inicio - DESDE) / (HASTA - DESDE)) * 100}%`,
  width: `${((fin - inicio) / (HASTA - DESDE)) * 100}%`,
})

const TURNOS = PEDIDOS.map((p) => ({ inicio: aMinutos(p.horaInicio), fin: aMinutos(p.horaInicio) + p.minutos }))
const CRUCE = { inicio: Math.max(...TURNOS.map((t) => t.inicio)), fin: Math.min(...TURNOS.map((t) => t.fin)) }

/** Los dos turnos sobre la misma línea horaria; el tramo que comparten va rayado. */
function Gantt() {
  return (
    <figure
      className="gantt"
      aria-label={`Llamada 1 de ${aHora(TURNOS[0].inicio)} a ${aHora(TURNOS[0].fin)}, llamada 2 de ${aHora(TURNOS[1].inicio)} a ${aHora(TURNOS[1].fin)}: se pisan de ${aHora(CRUCE.inicio)} a ${aHora(CRUCE.fin)}.`}
    >
      {TURNOS.map((t, i) => (
        <div key={i} className="gantt-fila" aria-hidden="true">
          <span className="gantt-etiqueta">Llamada {i + 1}</span>
          <div className="gantt-pista">
            <span className="gantt-barra" style={enEscala(t.inicio, t.fin)}>
              {aHora(t.inicio)}–{aHora(t.fin)}
            </span>
            <span className="gantt-cruce" style={enEscala(CRUCE.inicio, CRUCE.fin)} />
          </div>
        </div>
      ))}
      <div className="gantt-fila" aria-hidden="true">
        <span />
        <div className="gantt-pista gantt-eje">
          {MARCAS.map((m) => (
            <span key={m} style={{ left: enEscala(m, m).left }}>
              {aHora(m)}
            </span>
          ))}
        </div>
      </div>
    </figure>
  )
}

const cuerpoDe = (pedido: (typeof PEDIDOS)[number], fecha: string) =>
  JSON.stringify(
    {
      mentoraId: MENTORA,
      tipoAsesoriaId: pedido.tipoAsesoriaId,
      colectivoId: "c0e1a2b3-0000-4000-8000-000000000001",
      proyecto: "Prueba de superposicion",
      contactoNombre: "Ana",
      contactoEmail: "ana@example.org",
      fecha,
      horaInicio: pedido.horaInicio,
    },
    null,
    2,
  )

/** El primer día con las 19:00 libre para Valentina; si la API no responde, un lunes cualquiera (se puede editar). */
async function primeraFecha(): Promise<string> {
  try {
    const { cuerpo } = await llamarApi("GET", `/api/mentoras/${MENTORA}/disponibilidad?tipoAsesoriaId=estrategia_de_testing`)
    const dia = (cuerpo as DiaDisponible[]).find((d) => d.horarios.some((h) => h.inicio === "19:00"))
    if (dia) return dia.fecha
  } catch {
    // queda la de respaldo
  }
  return "2026-11-02"
}

type PropsPedido = { numero: number; titulo: string; metodo: "GET" | "POST"; rutaInicial: string; cuerpoInicial?: string }

/** Una llamada a la API, como un Postman mínimo: la ruta (y el body, si es POST) se pueden cambiar. */
function Pedido({ numero, titulo, metodo, rutaInicial, cuerpoInicial }: PropsPedido) {
  const [ruta, setRuta] = useState(rutaInicial)
  const [cuerpo, setCuerpo] = useState(cuerpoInicial ?? "")
  const [respuesta, setRespuesta] = useState<RespuestaApi>()
  const [error, setError] = useState("")
  const [enviando, setEnviando] = useState(false)
  const id = useId()

  async function enviar() {
    setEnviando(true)
    setError("")
    try {
      setRespuesta(await llamarApi(metodo, ruta, metodo === "POST" ? cuerpo : undefined))
    } catch (e) {
      setRespuesta(undefined)
      setError((e as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="pedido">
      <p className="pedido-titulo">
        Llamada {numero}: {titulo}
      </p>
      <div className="pedido-linea">
        <span className="pedido-metodo">{metodo}</span>
        <input
          className="pedido-ruta"
          aria-label={`Ruta de la llamada ${numero}`}
          value={ruta}
          onChange={(e) => setRuta(e.target.value)}
          spellCheck={false}
        />
        <button type="button" className="boton" onClick={enviar} disabled={enviando}>
          {enviando ? "Enviando…" : "Enviar"}
        </button>
      </div>
      {metodo === "POST" && (
        <>
          <label htmlFor={id} className="pedido-etiqueta">
            Body
          </label>
          <textarea id={id} className="editor-respuestas pedido-cuerpo" value={cuerpo} onChange={(e) => setCuerpo(e.target.value)} spellCheck={false} />
        </>
      )}
      {error && (
        <p className="pedido-error" role="alert">
          {error}
        </p>
      )}
      {respuesta && (
        <div className="pedido-respuesta" role="status" aria-label={`Respuesta de la llamada ${numero}`}>
          <span className="pedido-estado" data-ok={respuesta.estado < 400}>
            {respuesta.estado}
          </span>
          <pre>{typeof respuesta.cuerpo === "string" ? respuesta.cuerpo : JSON.stringify(respuesta.cuerpo, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

/** Un valor que se busca en la API al montar (vigente: no se setea si ya se desmontó). */
function useAlMontar<T>(buscar: () => Promise<T>): T | undefined {
  const [valor, setValor] = useState<T>()
  useEffect(() => {
    let vigente = true
    void buscar().then((v) => vigente && setValor(v))
    return () => {
      vigente = false
    }
  }, [buscar])
  return valor
}

/** El id de la primera sesión guardada, para pedirla por id; si no hay, queda el texto para reemplazar. */
async function primeraSesion(): Promise<string> {
  try {
    const { cuerpo } = await llamarApi("GET", RUTA)
    const id = (cuerpo as { id: string }[])[0]?.id
    if (id) return id
  } catch {
    // queda el texto para reemplazar
  }
  return "<id>"
}

/** Ejercicio 2, A.4: el endpoint nuevo con una sesión que existe y con una que no. */
export function ConsultarSesiones() {
  const id = useAlMontar(primeraSesion)
  return (
    <aside className="anexo-en-linea probar-api" aria-label="Consultar sesiones">
      {id === undefined ? (
        <p>Buscando una sesión guardada…</p>
      ) : (
        <>
          <Pedido numero={1} titulo="Una sesión que existe" metodo="GET" rutaInicial={`${RUTA}/${id}`} />
          <Pedido numero={2} titulo="Una sesión que no existe" metodo="GET" rutaInicial={`${RUTA}/no-existe`} />
          <Pedido numero={3} titulo="El listado que ya existía" metodo="GET" rutaInicial={RUTA} />
        </>
      )}
    </aside>
  )
}

export default function ProbarApi() {
  const fecha = useAlMontar(primeraFecha)

  return (
    <aside className="anexo-en-linea probar-api" aria-label="Probar la API">
      {fecha === undefined ? (
        <p>Buscando un día con las 19:00 libre…</p>
      ) : (
        <>
          <p className="pedido-nota">
            Las dos van a la misma mentora, el <strong>{fecha}</strong> (el primer día con las 19:00 libre). Mandá la 1 y después la 2.
          </p>
          <Gantt />
          {PEDIDOS.map((p, i) => (
            <Pedido key={p.horaInicio} numero={i + 1} titulo={p.titulo} metodo="POST" rutaInicial={RUTA} cuerpoInicial={cuerpoDe(p, fecha)} />
          ))}
        </>
      )}
    </aside>
  )
}
