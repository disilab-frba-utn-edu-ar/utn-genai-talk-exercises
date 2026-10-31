import { useEffect, useState, type FormEvent, type ReactNode } from "react"
import { Link, useNavigate } from "react-router"
import { Cargando, ErrorCarga } from "../../client/src/components/Estado"
import { useCarga } from "../../client/src/hooks/useCarga"
import Captura from "./Captura"
import { guardarPerfil, guardarRespuestas, leerPerfil, leerRespuestas, type RespuestasGuardadas } from "./api"
import {
  armarRespuestasMd,
  contarRespondidas,
  migrarRespuestas,
  partirConsigna,
  partirPreguntas,
  preguntasPorCajas,
  siguienteDe,
  type Ejercicio,
  type PreguntaPorCajas,
  type Respuestas as Datos,
} from "./contenido"
import ConsignaPorEtapas from "./Etapas"
import Markdown from "./Markdown"
import { conEjercicio, delEjercicio, type Perfil } from "./perfil"
import { HABILITA_METRICAS, marcarTerminado, publicarRespondidas } from "./progreso"
import { ID_SDD, tituloPrincipal, useTablero } from "./tablero"

type Estado = { tipo: "editando" } | { tipo: "guardando" } | { tipo: "guardado"; hora: string } | { tipo: "error"; mensaje: string }

/** Cómo se muestra un tramo de pasos de la consigna (con sus anexos en línea). */
type RenderConsigna = (lineas: string[]) => ReactNode

/** El modelo y el agente de este ejercicio: las dos cajas del cierre, las mismas que muestra Mi perfil. */
type Cierre = { modelo: string; agente: string }

const hora = (iso: string) => new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })

const HISTORIA = "**Historia elegida:**"

/** La línea "Historia elegida" de los datos de la entrega, con la historia del tablero. El resto queda igual. */
const conHistoria = (general: string, historia?: string) =>
  historia ? general.replace(/^\*\*Historia elegida:\*\*.*$/m, `${HISTORIA} ${historia}`) : general

/** La plantilla tiene algo para completar además del título (por ejemplo, "Intentos hasta que la skill se disparó"). */
const plantillaConCampos = (ejercicio: Ejercicio) => ejercicio.plantillaRespuestas.some((l) => l.trim() && !l.startsWith("# "))

/**
 * Lo guardado o, si no hay nada, la plantilla (con la historia elegida en el tablero, si hay).
 * Un respuestas.json viejo (un solo texto) queda entero en los datos generales; las respuestas de antes de
 * las cajas por sub-pregunta pasan a la primera caja de su pregunta.
 */
function datosIniciales(ejercicio: Ejercicio, guardadas: RespuestasGuardadas | null, historia?: string): Datos {
  if (!guardadas) return { general: conHistoria(ejercicio.plantillaRespuestas.join("\n"), historia), porPregunta: {} }
  if (Array.isArray(guardadas.respuestas)) return { general: guardadas.respuestas.join("\n"), porPregunta: {} }
  const porPregunta = Object.fromEntries(Object.entries(guardadas.respuestas).map(([n, r]) => [n, r.join("\n")]))
  return {
    general: conHistoria((guardadas.general ?? ejercicio.plantillaRespuestas).join("\n"), historia),
    porPregunta: migrarRespuestas(ejercicio, porPregunta),
  }
}

const cierreDe = (perfil: Perfil, id: string): Cierre => {
  const { modelo, agente } = delEjercicio(perfil, id)
  return { modelo, agente }
}

type PropsEditor = { ejercicio: Ejercicio; inicial: Datos; perfil: Perfil; consigna: RenderConsigna; historia?: string }

function Editor({ ejercicio, inicial, perfil, consigna, historia }: PropsEditor) {
  const navigate = useNavigate()
  const [datos, setDatos] = useState(inicial)
  // Si cambia la historia del tablero, se actualiza solo esa línea de los datos: las respuestas no se tocan.
  const [historiaVista, setHistoriaVista] = useState(historia)
  if (historia !== historiaVista) {
    setHistoriaVista(historia)
    setDatos((d) => ({ ...d, general: conHistoria(d.general, historia) }))
  }
  const [cierre, setCierre] = useState(() => cierreDe(perfil, ejercicio.id))
  const [guardadoComo, setGuardadoComo] = useState({ datos: inicial, cierre })
  const [estado, setEstado] = useState<Estado>({ tipo: "editando" })
  const sinGuardar = JSON.stringify({ datos, cierre }) !== JSON.stringify(guardadoComo)
  const porEtapas = Boolean(ejercicio.etapas)
  // Los datos generales se ven si la plantilla pide algo o si quedó algo escrito de antes.
  const conDatosGenerales = plantillaConCampos(ejercicio) || inicial.general.trim() !== ejercicio.plantillaRespuestas.join("\n").trim()
  const respondidas = contarRespondidas(ejercicio, datos.porPregunta)
  const siguiente = siguienteDe(ejercicio)
  const descripcionTerminar = `Guarda tus respuestas${ejercicio.id === HABILITA_METRICAS ? ", habilita Métricas" : ""} y ${
    siguiente ? `pasa al ejercicio ${siguiente.numero}.` : ejercicio.id === ID_SDD ? "cierra la actividad con Rocco." : "vuelve al índice."
  }`

  // La hoja de checks y Mi perfil muestran cuántas lleva respondidas, aunque todavía no haya guardado.
  const { hechas, total } = respondidas
  useEffect(() => publicarRespondidas(ejercicio.id, { hechas, total }), [ejercicio.id, hechas, total])

  // Avisa antes de cerrar la pestaña con cambios sin guardar.
  useEffect(() => {
    if (!sinGuardar) return
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", avisar)
    return () => window.removeEventListener("beforeunload", avisar)
  }, [sinGuardar])

  const responder = (clave: string, texto: string) =>
    setDatos((d) => ({ ...d, porPregunta: { ...d.porPregunta, [clave]: texto } }))

  async function guardar(): Promise<boolean> {
    setEstado({ tipo: "guardando" })
    try {
      // El perfil se vuelve a leer: pudo cambiar en Mi perfil (otra pestaña) desde que se abrió el ejercicio.
      const actual = conEjercicio(await leerPerfil(), ejercicio.id, cierre)
      if (JSON.stringify(cierre) !== JSON.stringify(guardadoComo.cierre)) await guardarPerfil(actual)
      const guardadas = await guardarRespuestas(ejercicio.id, {
        general: datos.general,
        respuestas: datos.porPregunta,
        markdown: armarRespuestasMd(ejercicio, datos, actual),
      })
      setGuardadoComo({ datos, cierre })
      setEstado({ tipo: "guardado", hora: hora(guardadas.guardado) })
      return true
    } catch (error) {
      setEstado({ tipo: "error", mensaje: error instanceof Error ? error.message : String(error) })
      return false
    }
  }

  function alEnviar(evento: FormEvent) {
    evento.preventDefault()
    void guardar()
  }

  // Si no se pudo guardar, se queda en la página con el error a la vista y no lo marca como terminado.
  async function terminar() {
    if (!(await guardar())) return
    marcarTerminado(ejercicio.id)
    // El ejercicio 3 cierra con la felicitación de Rocco; el resto pasa al siguiente o al índice.
    if (ejercicio.id === ID_SDD) navigate(`/ejercicios/${ID_SDD}`, { state: { felicitar: true } })
    else navigate(siguiente ? `/ejercicios/${siguiente.id}` : "/ejercicios")
    document.documentElement.scrollTop = 0
  }

  const datosGenerales = conDatosGenerales && (
    <div className="campo">
      <label htmlFor={`general-${ejercicio.id}`}>Datos de la entrega</label>
      <textarea
        id={`general-${ejercicio.id}`}
        className="editor-respuestas"
        value={datos.general}
        onChange={(e) => setDatos((d) => ({ ...d, general: e.target.value }))}
        spellCheck
        rows={Math.min(datos.general.split("\n").length + 1, 16)}
      />
    </div>
  )

  // Siempre igual al final de cada ejercicio: el modelo y el agente, en dos cajas. Vacías, valen los generales del perfil.
  const cierreYCaptura = (
    <>
      <section className="pregunta cierre" aria-labelledby={`cierre-${ejercicio.id}`}>
        <h3 id={`cierre-${ejercicio.id}`} className="pregunta-titulo">
          Para cerrar
        </h3>
        <div className="campos-fila">
          {(["modelo", "agente"] as const).map((campo) => (
            <div key={campo} className="campo">
              <label htmlFor={`${campo}-${ejercicio.id}`}>{campo === "modelo" ? "Modelo" : "Agente"}</label>
              <input
                id={`${campo}-${ejercicio.id}`}
                name={campo}
                value={cierre[campo]}
                onChange={(e) => setCierre((c) => ({ ...c, [campo]: e.target.value }))}
                placeholder={perfil[campo] || (campo === "modelo" ? "Ej.: Sonnet, gpt-5…" : "Ej.: Claude Code, Codex, Cline…")}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          ))}
        </div>
        <p className="cierre-nota">
          Son los mismos que muestra <Link to="/ejercicios/perfil">Mi perfil</Link> para este ejercicio. Vacíos, valen los generales del perfil.
        </p>
      </section>
      {ejercicio.captura && <Captura id={ejercicio.id} />}
    </>
  )

  function cajasDe(b: PreguntaPorCajas) {
    const listas = b.cajas.filter((c) => datos.porPregunta[c.clave]?.trim()).length
    const idTitulo = `pregunta-${ejercicio.id}-${b.numero}`
    return (
      <section key={b.numero} className="pregunta pregunta-cajas" aria-labelledby={idTitulo} data-completa={listas === b.cajas.length || undefined}>
        <div className="pregunta-cabecera">
          <h3 id={idTitulo} className="pregunta-titulo">
            {b.numero}. {b.titulo}
            {b.opcional && <span className="etiqueta">Opcional</span>}
          </h3>
          <span className="etiqueta pregunta-avance">
            {listas}/{b.cajas.length}
            <span className="sr-only"> respondidas</span>
          </span>
        </div>
        <div className="pregunta-cuerpo">
          {b.intro && <Markdown texto={b.intro} />}
          {b.pista && <Markdown texto={b.pista.split("\n").map((l) => `> ${l}`).join("\n")} />}
          {b.cajas.map((c) => {
            const id = `respuesta-${ejercicio.id}-${c.clave}`
            return (
              <div key={c.clave} className="caja-respuesta">
                <label htmlFor={id}>
                  {b.cajas.length > 1 && <span className="caja-numero">{c.numero}</span>}
                  <Markdown texto={c.texto} enLinea />
                </label>
                <textarea
                  id={id}
                  className="editor-respuestas"
                  value={datos.porPregunta[c.clave] ?? ""}
                  onChange={(e) => responder(c.clave, e.target.value)}
                  placeholder={ejercicio.placeholder ?? "Tu respuesta, con evidencia del log…"}
                  spellCheck
                  rows={4}
                />
              </div>
            )
          })}
        </div>
      </section>
    )
  }

  /**
   * La sección Preguntas de la consigna por etapas: los datos de la entrega, cada pregunta con sus cajas y el cierre.
   * El texto que sigue a la última pregunta (cómo entregar) va después del cierre: es lo último que se hace.
   */
  const bloquesPorCajas = preguntasPorCajas(ejercicio)
  const finPreguntas = bloquesPorCajas.findLastIndex((b) => b.tipo === "pregunta") + 1
  const bloque = (b: (typeof bloquesPorCajas)[number], i: number) => (b.tipo === "markdown" ? <Markdown key={`t${i}`} texto={b.texto} /> : cajasDe(b))
  const preguntasPorEtapas = (
    <>
      {datosGenerales}
      {bloquesPorCajas.slice(0, finPreguntas).map(bloque)}
      {cierreYCaptura}
      {bloquesPorCajas.slice(finPreguntas).map((b, i) => bloque(b, finPreguntas + i))}
    </>
  )

  function preguntas(lineas: string[], primero: boolean, ultimo: boolean) {
    const bloques = partirPreguntas(lineas)
    // Los datos generales van debajo del encabezado y la intro del primer tramo de preguntas.
    const intro = bloques[0]?.tipo === "markdown" ? bloques[0] : undefined
    const resto = intro ? bloques.slice(1) : bloques
    return (
      <>
        {intro && <Markdown texto={intro.lineas.join("\n")} />}
        {primero && datosGenerales}
        {resto.map((b, i) => {
          if (b.tipo === "markdown") return <Markdown key={i} texto={b.lineas.join("\n")} />
          const respuesta = datos.porPregunta[b.numero] ?? ""
          return (
            <details key={i} className="pregunta">
              <summary>
                <span className="pregunta-titulo">
                  {b.numero}. {b.titulo}
                </span>
                {respuesta.trim() && <span className="etiqueta">Respondida</span>}
              </summary>
              <div className="pregunta-cuerpo">
                {b.cuerpo && <Markdown texto={b.cuerpo} />}
                <label htmlFor={`respuesta-${ejercicio.id}-${b.numero}`} className="sr-only">
                  Tu respuesta a la pregunta {b.numero}
                </label>
                <textarea
                  id={`respuesta-${ejercicio.id}-${b.numero}`}
                  className="editor-respuestas"
                  value={respuesta}
                  onChange={(e) => responder(b.numero, e.target.value)}
                  placeholder={ejercicio.placeholder ?? "Tu respuesta, con evidencia del log…"}
                  spellCheck
                  rows={8}
                />
              </div>
            </details>
          )
        })}
        {ultimo && cierreYCaptura}
      </>
    )
  }

  // Terminé va en la misma barra que Guardar, fija abajo: así nadie se lo saltea al final de la página.
  // Por etapas, la barra es el pie de la sección Preguntas.
  const acciones = (
    <div className="respuestas-acciones" role="group" aria-label="Guardar y terminar">
      {/* En pantallas angostas se ve "Guardar" a secas: el nombre completo va explícito, no depende del CSS. */}
      <button
        type="submit"
        className="boton"
        disabled={estado.tipo === "guardando"}
        aria-label={estado.tipo === "guardando" ? undefined : "Guardar respuestas"}
      >
        {estado.tipo === "guardando" ? (
          "Guardando…"
        ) : (
          <>
            Guardar<span className="respuestas-largo"> respuestas</span>
          </>
        )}
      </button>
      <p className="respuestas-estado" role="status" aria-live="polite">
        {sinGuardar ? "Hay cambios sin guardar." : estado.tipo === "guardado" && `Guardado a las ${estado.hora}.`}
      </p>
      <p className="sr-only" id={`terminar-${ejercicio.id}`}>
        {descripcionTerminar}
      </p>
      <button
        type="button"
        className="boton boton-terminar"
        disabled={estado.tipo === "guardando"}
        onClick={terminar}
        aria-describedby={`terminar-${ejercicio.id}`}
        title={descripcionTerminar}
      >
        Terminé <span aria-hidden="true">→</span>
      </button>
    </div>
  )

  const tramos = partirConsigna(ejercicio)
  const primerTramo = tramos.findIndex((t) => t.tipo === "preguntas")
  const ultimoTramo = tramos.findLastIndex((t) => t.tipo === "preguntas")

  return (
    <form className="formulario respuestas" onSubmit={alEnviar}>
      {porEtapas ? (
        <ConsignaPorEtapas ejercicio={ejercicio} preguntas={preguntasPorEtapas} respondidas={respondidas} acciones={acciones} />
      ) : (
        tramos.map((t, i) => (
          <div key={i} className={t.tipo === "preguntas" ? "tramo-preguntas" : undefined}>
            {t.tipo === "preguntas" ? preguntas(t.lineas, i === primerTramo, i === ultimoTramo) : consigna(t.lineas)}
          </div>
        ))
      )}

      {!porEtapas && acciones}
      {estado.tipo === "error" && (
        <p className="aviso-error" role="alert">
          {estado.mensaje}
        </p>
      )}
    </form>
  )
}

/**
 * Las respuestas del ejercicio. Sin etapas: la consigna completa con las preguntas intercaladas, cada una
 * en un desplegable. Con etapas: la consigna por pantallas y las preguntas aparte, con una caja por sub-pregunta.
 */
export default function Respuestas({ ejercicio, consigna }: { ejercicio: Ejercicio; consigna: RenderConsigna }) {
  const guardadas = useCarga(`respuestas:${ejercicio.id}`, () => leerRespuestas(ejercicio.id))
  const perfil = useCarga("perfil", leerPerfil)
  const historia = tituloPrincipal(useTablero().estado)

  // Sin respuestas cargadas la consigna se sigue leyendo: el aviso ocupa el lugar de las preguntas.
  if (guardadas.estado !== "lista" || perfil.estado !== "lista") {
    const fallo = guardadas.estado === "error" ? guardadas : perfil.estado === "error" ? perfil : undefined
    const aviso = fallo ? <ErrorCarga mensaje={fallo.error} onReintentar={fallo.recargar} /> : <Cargando texto="Buscando tus respuestas…" />
    if (ejercicio.etapas) return <ConsignaPorEtapas ejercicio={ejercicio} preguntas={aviso} />
    return partirConsigna(ejercicio).map((t, i) => (
      <div key={i} className={t.tipo === "preguntas" ? "tramo-preguntas" : undefined}>
        {t.tipo === "preguntas" ? aviso : consigna(t.lineas)}
      </div>
    ))
  }

  return (
    <Editor
      key={ejercicio.id}
      ejercicio={ejercicio}
      inicial={datosIniciales(ejercicio, guardadas.datos, historia)}
      perfil={perfil.datos}
      consigna={consigna}
      historia={historia}
    />
  )
}
