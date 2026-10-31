// La consigna por etapas (ejercicios 1 y 2): Contexto técnico → Contexto del ejercicio → Qué tenés que hacer,
// que se desbloquean en orden, cada una en pantallas cortas dentro de un marco de alto fijo. Las preguntas
// son una cuarta sección, siempre abierta y la única con scroll. Las pantallas y los checks están en el
// campo `etapas` de cada ejercicio.json.
import { useEffect, useRef, useState, type ReactNode } from "react"
import { Candado } from "./Bloqueado"
import Consigna, { AnexoEnLinea } from "./Consigna"
import { anexosEnLinea, lineasDePantalla, pantallasDe, type Ejercicio, type PantallaUbicada } from "./contenido"
import ProbarApi from "./ProbarApi"
import { guardarEtapas, useEtapas, useRespondidas, type AvanceEtapas } from "./progreso"

type Destino = number | "preguntas"

/** Dónde está, hasta dónde llegó y cómo moverse. Se puede volver a cualquier pantalla ya vista, no adelantarse. */
export function useNavegacion(ejercicio: Ejercicio) {
  const avance = useEtapas(ejercicio.id)
  const pantallas = pantallasDe(ejercicio)
  const actualizar = (cambios: Partial<AvanceEtapas>) => {
    const { pos, alcanzada, checks } = { ...avance, ...cambios }
    guardarEtapas(ejercicio.id, { pos, alcanzada, checks })
  }
  return {
    avance,
    pantallas,
    actualizar,
    ir: (destino: Destino) => {
      if (destino === "preguntas" || destino <= avance.alcanzada) actualizar({ pos: destino })
    },
    siguiente: () => {
      if (avance.pos === "preguntas") return
      const sig = avance.pos + 1
      actualizar(sig < pantallas.length ? { pos: sig, alcanzada: Math.max(avance.alcanzada, sig) } : { pos: "preguntas" })
    },
    anterior: () => {
      if (typeof avance.pos === "number" && avance.pos > 0) actualizar({ pos: avance.pos - 1 })
    },
    tildar: (check: string, tildado: boolean) =>
      actualizar({ checks: tildado ? [...new Set([...avance.checks, check])] : avance.checks.filter((c) => c !== check) }),
  }
}

/** Los checks que cuentan para el avance: los de la parte opcional se pueden tildar, pero no suman. */
const obligatorios = (pantallas: PantallaUbicada[]) => pantallas.filter((p) => p.check && !/^Opcional/.test(p.check))

/** Cuántos checks obligatorios están tildados, de cuántos. */
export function contarChecks(ejercicio: Ejercicio, tildados: string[]): { hechos: number; total: number } {
  const cuentan = obligatorios(pantallasDe(ejercicio))
  return { hechos: cuentan.filter((p) => tildados.includes(p.check!)).length, total: cuentan.length }
}

/** Una barra de avance con su nombre y sus números a la vista (la barra es solo el dibujo). */
export function BarraAvance({ nombre, hechos, total }: { nombre: string; hechos: number; total: number }) {
  return (
    <div className="avance">
      <span>{nombre}</span>
      <span className="avance-pista" aria-hidden="true">
        <span style={{ width: `${total ? (hechos / total) * 100 : 0}%` }} />
      </span>
      <span className="avance-numero">
        {hechos}/{total}
      </span>
    </div>
  )
}

function CheckDePantalla({ texto, tildado, alCambiar }: { texto: string; tildado: boolean; alCambiar: (tildado: boolean) => void }) {
  return (
    <label className="etapa-check">
      <input type="checkbox" checked={tildado} onChange={(e) => alCambiar(e.target.checked)} />
      <span>{texto}</span>
    </label>
  )
}

function ContenidoPantalla({ ejercicio, pantalla }: { ejercicio: Ejercicio; pantalla: PantallaUbicada }) {
  const anexo = pantalla.anexo ? ejercicio.anexos.find((a) => a.titulo === pantalla.anexo) : undefined
  return (
    <>
      {anexo ? (
        <AnexoEnLinea anexo={anexo} />
      ) : (
        <Consigna lineas={lineasDePantalla(ejercicio, pantalla)} anexos={anexosEnLinea(ejercicio)} />
      )}
      {pantalla.agregar === "probar-api" && <ProbarApi />}
    </>
  )
}

/** Las flechas del teclado pasan de pantalla, salvo mientras se escribe o con un diálogo abierto. */
function useFlechas(siguiente: () => void, anterior: () => void) {
  const acciones = useRef({ siguiente, anterior })
  useEffect(() => {
    acciones.current = { siguiente, anterior }
  })
  useEffect(() => {
    const alApretar = (e: KeyboardEvent) => {
      const destino = e.target instanceof Element ? e.target : null
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
      if (destino?.closest("input, textarea, select, [contenteditable], dialog")) return
      if (e.key === "ArrowRight") acciones.current.siguiente()
      else if (e.key === "ArrowLeft") acciones.current.anterior()
    }
    window.addEventListener("keydown", alApretar)
    return () => window.removeEventListener("keydown", alApretar)
  }, [])
}

type Props = {
  ejercicio: Ejercicio
  /** La sección de preguntas, armada por el editor de respuestas. */
  preguntas: ReactNode
  respondidas?: { hechas: number; total: number }
  /** La barra de Guardar respuestas y Terminé: va al pie de las preguntas, que es lo único que se guarda. */
  acciones?: ReactNode
}

export default function ConsignaPorEtapas({ ejercicio, preguntas, respondidas, acciones }: Props) {
  const { avance, pantallas, actualizar, ir, siguiente, anterior, tildar } = useNavegacion(ejercicio)
  const etapas = ejercicio.etapas ?? []
  const enPreguntas = avance.pos === "preguntas"
  const actual = enPreguntas ? undefined : pantallas[avance.pos as number]
  const sig = actual && pantallas[actual.posicion + 1]

  // La primera visita queda registrada: así Mi perfil distingue "sin empezar" de "en la primera pantalla".
  const { visitado } = avance
  useEffect(() => {
    if (!visitado) actualizar({})
  })

  // Al cambiar de pantalla, el foco va al título nuevo (la página no se mueve, cambia lo que hay en el marco).
  const titulo = useRef<HTMLHeadingElement>(null)
  const primera = useRef(true)
  useEffect(() => {
    if (primera.current) primera.current = false
    else titulo.current?.focus()
  }, [avance.pos])

  useFlechas(siguiente, anterior)

  const textoSiguiente = !sig ? "Ir a las preguntas" : sig.etapa !== actual?.etapa ? "Siguiente etapa" : "Siguiente"

  return (
    <div className="etapas-consigna">
      <nav className="chips etapas-pestanas" aria-label="Secciones del ejercicio">
        {etapas.map((etapa, i) => {
          const suyas = pantallas.filter((p) => p.etapa === i)
          const bloqueada = suyas[0].posicion > avance.alcanzada
          const vistas = suyas.filter((p) => p.posicion <= avance.alcanzada).length
          // Vuelve a la última pantalla vista de esa etapa.
          const destino = Math.min(avance.alcanzada, suyas.at(-1)!.posicion)
          return (
            <button
              key={etapa.nombre}
              type="button"
              className="chip"
              aria-pressed={actual?.etapa === i}
              disabled={bloqueada}
              title={etapa.bajada}
              onClick={() => ir(destino)}
            >
              {bloqueada && <Candado />}
              {i + 1}. {etapa.nombre}
              <span className="etapas-cuenta">
                {vistas}/{suyas.length}
              </span>
              {bloqueada && <span className="sr-only"> (se desbloquea al terminar la etapa {i})</span>}
            </button>
          )
        })}
        <button type="button" className="chip" aria-pressed={enPreguntas} onClick={() => ir("preguntas")}>
          Preguntas
          {respondidas && (
            <span className="etapas-cuenta">
              {respondidas.hechas}/{respondidas.total}
            </span>
          )}
        </button>
      </nav>

      {actual && (
        <section className="paso etapa-marco" aria-labelledby={`pantalla-${ejercicio.id}`}>
          <div className="etapa-cabecera">
            <p className="etapa-ubicacion">
              Etapa {actual.etapa + 1} · {etapas[actual.etapa].nombre}
              <span>
                Pantalla {actual.indice + 1} de {actual.deLaEtapa}
              </span>
            </p>
            <h2 id={`pantalla-${ejercicio.id}`} ref={titulo} tabIndex={-1} className="etapa-titulo">
              {actual.titulo}
            </h2>
          </div>
          {/* La key reinicia el scroll y lo que haya abierto adentro al pasar de pantalla. */}
          <div key={actual.posicion} className="etapa-cuerpo">
            {actual.indice === 0 && <p className="etapa-bajada">{etapas[actual.etapa].bajada}</p>}
            <ContenidoPantalla ejercicio={ejercicio} pantalla={actual} />
          </div>
          <div className="etapa-pie">
            {actual.posicion > 0 ? (
              <button type="button" className="boton boton-secundario" onClick={anterior}>
                <span aria-hidden="true">←</span> Anterior
              </button>
            ) : (
              <span />
            )}
            {actual.check ? (
              <CheckDePantalla texto={actual.check} tildado={avance.checks.includes(actual.check)} alCambiar={(t) => tildar(actual.check!, t)} />
            ) : (
              <span />
            )}
            <button type="button" className="boton" onClick={siguiente}>
              {textoSiguiente} <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>
      )}

      {/* Siempre montada: lo escrito no se pierde al ir y volver de la consigna. */}
      <section className="paso etapa-marco etapa-preguntas" aria-labelledby={`preguntas-${ejercicio.id}`} hidden={!enPreguntas}>
        <div className="etapa-cabecera">
          <h2 id={`preguntas-${ejercicio.id}`} ref={enPreguntas ? titulo : undefined} tabIndex={-1} className="etapa-titulo">
            Preguntas
          </h2>
          {respondidas && <BarraAvance nombre="Respondidas" hechos={respondidas.hechas} total={respondidas.total} />}
        </div>
        <div className="etapa-cuerpo">{preguntas}</div>
        {acciones}
      </section>
    </div>
  )
}

/** La hoja de checks del ejercicio: todos los checks de las pantallas, por etapa, con el avance. */
export function HojaDeChecks({ ejercicio }: { ejercicio: Ejercicio }) {
  const { avance, pantallas, ir, tildar } = useNavegacion(ejercicio)
  const respondidas = useRespondidas(ejercicio.id)
  const [abierta, setAbierta] = useState(false)
  const ref = useRef<HTMLDialogElement>(null)
  const { hechos, total } = contarChecks(ejercicio, avance.checks)

  useEffect(() => {
    const dialogo = ref.current
    if (!abierta || !dialogo || dialogo.open) return
    if (typeof dialogo.showModal === "function") dialogo.showModal()
    else dialogo.open = true // jsdom
  }, [abierta])

  const irA = (destino: Destino) => {
    ir(destino)
    setAbierta(false)
  }

  return (
    <>
      <button type="button" className="chip" aria-haspopup="dialog" onClick={() => setAbierta(true)}>
        Hoja de checks · {hechos}/{total}
      </button>
      {abierta && (
        <dialog
          ref={ref}
          className="detalle hoja-checks"
          aria-labelledby={`hoja-${ejercicio.id}`}
          onClose={() => setAbierta(false)}
          onClick={(e) => e.target === ref.current && setAbierta(false)}
        >
          <div className="detalle-caja">
            <h2 id={`hoja-${ejercicio.id}`}>Hoja de checks · Ejercicio {ejercicio.numero}</h2>
            <BarraAvance nombre="Checks" hechos={hechos} total={total} />
            {(ejercicio.etapas ?? []).map((etapa, i) => {
              const conCheck = pantallas.filter((p) => p.etapa === i && p.check)
              if (!conCheck.length) return null
              return (
                <section key={etapa.nombre} aria-label={etapa.nombre}>
                  <h3>
                    {i + 1}. {etapa.nombre}
                  </h3>
                  <ul className="hoja-lista">
                    {conCheck.map((p) => (
                      <li key={p.posicion}>
                        <CheckDePantalla texto={p.check!} tildado={avance.checks.includes(p.check!)} alCambiar={(t) => tildar(p.check!, t)} />
                        {p.posicion <= avance.alcanzada ? (
                          <button type="button" className="chip" onClick={() => irA(p.posicion)} aria-label={`Ir a «${p.titulo}»`}>
                            Ir
                          </button>
                        ) : (
                          <span className="hoja-bloqueada">
                            <Candado />
                            <span className="sr-only">Pantalla bloqueada</span>
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })}
            <section aria-label="Preguntas">
              <h3>Preguntas</h3>
              <ul className="hoja-lista">
                <li>
                  <span>{respondidas ? `Respondiste ${respondidas.hechas} de ${respondidas.total}` : "Todavía no abriste las preguntas"}</span>
                  <button type="button" className="chip" onClick={() => irA("preguntas")} aria-label="Ir a las preguntas">
                    Ir
                  </button>
                </li>
              </ul>
            </section>
            <div className="confirmar-acciones">
              <button type="button" className="boton" onClick={() => setAbierta(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  )
}
