// Mi perfil: quiénes resuelven los ejercicios (nombre o equipo, integrantes), con qué modelo y agente
// (en general y por ejercicio), si intervinieron, cómo vienen en cada ejercicio y su feedback.
// Se guarda en ejercicios/perfil.json con "Guardar perfil"; el avance (pantallas, checks) es el de este navegador.
import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react"
import { Link } from "react-router"
import { Cargando, ErrorCarga } from "../../client/src/components/Estado"
import { useCarga } from "../../client/src/hooks/useCarga"
import { guardarPerfil, leerPerfil, leerRespuestas } from "./api"
import { contarRespondidas, ejercicios, migrarRespuestas, pantallasDe, type Ejercicio } from "./contenido"
import { BarraAvance, contarChecks } from "./Etapas"
import { conEjercicio, delEjercicio, type Perfil, type PerfilEjercicio } from "./perfil"
import { useEtapas, useRespondidas } from "./progreso"

type Estado = { tipo: "editando" } | { tipo: "guardando" } | { tipo: "guardado" } | { tipo: "error"; mensaje: string }

function Seccion({ numero, titulo, children }: { numero: number; titulo: string; children: ReactNode }) {
  const id = useId()
  return (
    <section className="paso" aria-labelledby={id}>
      <h2 id={id} className="paso-titulo">
        <span className="paso-numero" aria-hidden="true">
          {numero}
        </span>
        {titulo}
      </h2>
      {children}
    </section>
  )
}

/**
 * Pantallas vistas, checks y preguntas respondidas: las que lleva escritas en este navegador (lo mismo que
 * muestra la hoja de checks) o, si todavía no abrió el ejercicio acá, las guardadas en respuestas.json.
 */
function Avance({ ejercicio }: { ejercicio: Ejercicio }) {
  const etapas = useEtapas(ejercicio.id)
  const enVivo = useRespondidas(ejercicio.id)
  const guardadas = useCarga(`respuestas:${ejercicio.id}`, () => leerRespuestas(ejercicio.id))
  const pantallas = pantallasDe(ejercicio).length
  const checks = contarChecks(ejercicio, etapas.checks)
  const porPregunta =
    guardadas.estado === "lista" && guardadas.datos && !Array.isArray(guardadas.datos.respuestas)
      ? Object.fromEntries(Object.entries(guardadas.datos.respuestas).map(([n, r]) => [n, r.join("\n")]))
      : {}
  const preguntas = enVivo ?? contarRespondidas(ejercicio, migrarRespuestas(ejercicio, porPregunta))
  return (
    <div className="perfil-avance">
      {ejercicio.etapas && (
        <>
          <BarraAvance nombre="Pantallas" hechos={etapas.visitado ? etapas.alcanzada + 1 : 0} total={pantallas} />
          <BarraAvance nombre="Checks" hechos={checks.hechos} total={checks.total} />
        </>
      )}
      <BarraAvance nombre="Preguntas" hechos={preguntas.hechas} total={preguntas.total} />
    </div>
  )
}

type PropsTarjeta = { ejercicio: Ejercicio; perfil: Perfil; cambiar: (cambios: Partial<PerfilEjercicio>) => void }

function TarjetaEjercicio({ ejercicio, perfil, cambiar }: PropsTarjeta) {
  const e = delEjercicio(perfil, ejercicio.id)
  const id = (campo: string) => `perfil-${ejercicio.id}-${campo}`
  return (
    <article className="tarjeta perfil-ejercicio" aria-labelledby={id("titulo")}>
      <div className="perfil-ejercicio-cabecera">
        <h3 id={id("titulo")}>
          Ejercicio {ejercicio.numero} · {ejercicio.titulo}
        </h3>
        <Link to={`/ejercicios/${ejercicio.id}`} className="chip">
          Abrir
        </Link>
      </div>
      <Avance ejercicio={ejercicio} />
      <div className="campos-fila">
        {(["modelo", "agente"] as const).map((campo) => (
          <div key={campo} className="campo">
            <label htmlFor={id(campo)}>{campo === "modelo" ? "Modelo" : "Agente"}</label>
            <input
              id={id(campo)}
              name={`${ejercicio.id}-${campo}`}
              value={e[campo]}
              onChange={(ev) => cambiar({ [campo]: ev.target.value })}
              placeholder={perfil[campo] || (campo === "modelo" ? "Ej.: Sonnet, gpt-5…" : "Ej.: Claude Code, Codex, Cline…")}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        ))}
      </div>
      <div className="campo">
        <span id={id("intervino")}>¿Intervinieron durante la tarea?</span>
        <div className="chips" role="group" aria-labelledby={id("intervino")}>
          {(["si", "no"] as const).map((valor) => (
            <button
              key={valor}
              type="button"
              className="chip"
              aria-pressed={e.intervino === valor}
              onClick={() => cambiar({ intervino: e.intervino === valor ? "" : valor })}
            >
              {valor === "si" ? "Sí" : "No"}
            </button>
          ))}
        </div>
      </div>
      {e.intervino === "si" && (
        <div className="campo">
          <label htmlFor={id("intervencion")}>Cuándo y por qué</label>
          <textarea id={id("intervencion")} rows={3} value={e.intervencion} onChange={(ev) => cambiar({ intervencion: ev.target.value })} />
        </div>
      )}
      <div className="campo">
        <label htmlFor={id("feedback")}>Feedback de este ejercicio</label>
        <textarea
          id={id("feedback")}
          rows={3}
          value={e.feedback}
          onChange={(ev) => cambiar({ feedback: ev.target.value })}
          placeholder="Qué te sirvió, qué te trabó, qué cambiarías…"
        />
      </div>
    </article>
  )
}

function Formulario({ inicial }: { inicial: Perfil }) {
  const [perfil, setPerfil] = useState(inicial)
  const [guardadoComo, setGuardadoComo] = useState(inicial)
  const [estado, setEstado] = useState<Estado>({ tipo: "editando" })
  const sinGuardar = JSON.stringify(perfil) !== JSON.stringify(guardadoComo)

  // Avisa antes de cerrar la pestaña con cambios sin guardar.
  useEffect(() => {
    if (!sinGuardar) return
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", avisar)
    return () => window.removeEventListener("beforeunload", avisar)
  }, [sinGuardar])

  const cambiar = (cambios: Partial<Perfil>) => setPerfil((p) => ({ ...p, ...cambios }))
  const integrantes = (lista: string[]) => cambiar({ integrantes: lista })

  async function alEnviar(evento: FormEvent) {
    evento.preventDefault()
    setEstado({ tipo: "guardando" })
    try {
      // Sin integrantes en blanco: "Agregar" deja una caja vacía hasta que se escribe.
      const limpio = { ...perfil, integrantes: perfil.integrantes.filter((i) => i.trim()) }
      await guardarPerfil(limpio)
      setPerfil(limpio)
      setGuardadoComo(limpio)
      setEstado({ tipo: "guardado" })
    } catch (error) {
      setEstado({ tipo: "error", mensaje: error instanceof Error ? error.message : String(error) })
    }
  }

  return (
    <form className="formulario perfil" onSubmit={alEnviar}>
      <Seccion numero={1} titulo="Quiénes son">
        <div className="campo">
          <label htmlFor="perfil-nombre">Nombre personal o del equipo</label>
          <input id="perfil-nombre" name="nombre" value={perfil.nombre} onChange={(e) => cambiar({ nombre: e.target.value })} autoComplete="off" />
        </div>
        <fieldset className="campo perfil-integrantes">
          <legend>
            Integrantes <span className="perfil-opcional">(si son un equipo)</span>
          </legend>
          {perfil.integrantes.length > 0 && (
            <ul>
              {perfil.integrantes.map((nombre, i) => (
                <li key={i}>
                  <input
                    aria-label={`Integrante ${i + 1}`}
                    name={`integrante-${i + 1}`}
                    value={nombre}
                    onChange={(e) => integrantes(perfil.integrantes.map((n, j) => (j === i ? e.target.value : n)))}
                    autoComplete="off"
                    // Recién agregado con el botón: se escribe ahí.
                    autoFocus={!nombre && i === perfil.integrantes.length - 1}
                  />
                  <button
                    type="button"
                    className="boton boton-secundario"
                    onClick={() => integrantes(perfil.integrantes.filter((_, j) => j !== i))}
                    aria-label={`Quitar a ${nombre.trim() || `integrante ${i + 1}`}`}
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button type="button" className="boton boton-secundario" onClick={() => integrantes([...perfil.integrantes, ""])}>
            + Agregar integrante
          </button>
        </fieldset>
        <div className="campos-fila">
          <div className="campo">
            <label htmlFor="perfil-modelo">Modelo que usaron en general</label>
            <input id="perfil-modelo" name="modelo" value={perfil.modelo} onChange={(e) => cambiar({ modelo: e.target.value })} placeholder="Ej.: Sonnet, gpt-5…" autoComplete="off" spellCheck={false} />
          </div>
          <div className="campo">
            <label htmlFor="perfil-agente">Agente que usaron en general</label>
            <input id="perfil-agente" name="agente" value={perfil.agente} onChange={(e) => cambiar({ agente: e.target.value })} placeholder="Ej.: Claude Code, Codex, Cline…" autoComplete="off" spellCheck={false} />
          </div>
        </div>
      </Seccion>

      <Seccion numero={2} titulo="Cada ejercicio">
        <p className="perfil-nota">El modelo y el agente de cada ejercicio son las mismas cajas de «Para cerrar»; vacíos, valen los generales.</p>
        <div className="grilla perfil-ejercicios">
          {ejercicios.map((e) => (
            <TarjetaEjercicio key={e.id} ejercicio={e} perfil={perfil} cambiar={(cambios) => setPerfil((p) => conEjercicio(p, e.id, cambios))} />
          ))}
        </div>
      </Seccion>

      <Seccion numero={3} titulo="Feedback">
        <div className="campo">
          <span id="perfil-puntaje">¿Qué tan útiles les resultaron los ejercicios? (1 = nada, 5 = muy útiles)</span>
          <div className="chips" role="group" aria-labelledby="perfil-puntaje">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" className="chip" aria-pressed={perfil.puntaje === n} onClick={() => cambiar({ puntaje: perfil.puntaje === n ? null : n })}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="campo">
          <label htmlFor="perfil-comentario">Comentarios generales</label>
          <textarea
            id="perfil-comentario"
            rows={4}
            value={perfil.comentario}
            onChange={(e) => cambiar({ comentario: e.target.value })}
            placeholder="Lo que quieras contarnos sobre la charla y los ejercicios…"
          />
        </div>
      </Seccion>

      <div className="respuestas-acciones" role="group" aria-label="Guardar perfil">
        <button type="submit" className="boton" disabled={estado.tipo === "guardando"}>
          {estado.tipo === "guardando" ? "Guardando…" : "Guardar perfil"}
        </button>
        <p className="respuestas-estado" role="status" aria-live="polite">
          {sinGuardar ? "Hay cambios sin guardar." : estado.tipo === "guardado" && "Perfil guardado en ejercicios/perfil.json."}
        </p>
      </div>
      {estado.tipo === "error" && (
        <p className="aviso-error" role="alert">
          {estado.mensaje}
        </p>
      )}
    </form>
  )
}

export default function PerfilPage() {
  const perfil = useCarga("perfil", leerPerfil)
  return (
    <div className="ejercicio-pagina perfil-pagina">
      <div className="ejercicio-cabecera">
        <Link to="/ejercicios" className="volver">
          <span aria-hidden="true">←</span> Todos los ejercicios
        </Link>
      </div>
      <section className="portada">
        <p className="sobretitulo">Ejercicios</p>
        <h1>
          Mi <span className="acento">perfil</span>
        </h1>
        <p className="bajada">Quiénes son, con qué trabajaron y cómo vienen. Va con la entrega: se guarda en ejercicios/perfil.json.</p>
      </section>
      {perfil.estado === "error" && <ErrorCarga mensaje={perfil.error} onReintentar={perfil.recargar} />}
      {perfil.estado === "lista" ? <Formulario inicial={perfil.datos} /> : perfil.estado !== "error" && <Cargando texto="Buscando tu perfil…" />}
    </div>
  )
}
