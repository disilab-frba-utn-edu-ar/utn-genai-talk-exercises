import type { AgenteLog, FiltrosMetricas, MetricasAgentes, OrigenLogs } from "@shared/types"
import { useState } from "react"
import { Link } from "react-router"
import { Cargando, ErrorCarga, Vacio } from "../../client/src/components/Estado"
import Chip from "../../client/src/components/Chip"
import { useCarga } from "../../client/src/hooks/useCarga"
import { leerOrigenes } from "./api"
import { AGENTES, caracteres, duracion, formatoNumero, hora, porcentaje } from "./formato"
import { colorAgente, colorKind, Figura, GraficoBarras, GraficoSerie, Indicador } from "./graficos"
import "./metricas.css"
import { useMetricasEnVivo, type Conexion } from "./useMetricasEnVivo"

const VENTANAS = [
  { valor: "", nombre: "Todo" },
  { valor: "15", nombre: "15 min" },
  { valor: "60", nombre: "1 h" },
  { valor: "1440", nombre: "24 h" },
]

const ESTADO_CONEXION: Record<Conexion, string> = {
  envivo: "En vivo",
  reconectando: "Reconectando…",
  consultando: "Consultando cada 5 s (sin conexión en vivo)",
}

export default function Metricas() {
  const [origen, setOrigen] = useState<OrigenLogs>("actual")
  const [agente, setAgente] = useState<AgenteLog | undefined>()
  const [sesion, setSesion] = useState("")
  const [ventana, setVentana] = useState("")
  const [detalle, setDetalle] = useState(false) // apagado por defecto: se activa desde la UI, sin variables de entorno

  const filtros: FiltrosMetricas = { agente, sesion: sesion || undefined, ventanaMin: ventana ? Number(ventana) : undefined, detalle }
  const metricas = useMetricasEnVivo(origen, filtros)
  const origenes = useCarga("origenes-metricas", leerOrigenes)

  return (
    <div className="metricas">
      <section className="portada">
        <p className="sobretitulo prompt">Observabilidad</p>
        <h1>Métricas</h1>
        <p className="bajada">Lo que hacen Claude Code, Codex CLI y Cline en este repo, leído en vivo de los logs de los hooks.</p>
      </section>

      <section className="metricas-filtros" aria-label="Filtros">
        <div className="chips">
          <Chip activo={!agente} onClick={() => setAgente(undefined)}>
            Todos
          </Chip>
          {(Object.keys(AGENTES) as AgenteLog[]).map((a) => (
            <Chip key={a} activo={agente === a} onClick={() => setAgente(a)}>
              {AGENTES[a]}
            </Chip>
          ))}
        </div>
        <div className="metricas-selectores">
          <label>
            Ventana
            <select value={ventana} onChange={(e) => setVentana(e.target.value)}>
              {VENTANAS.map((v) => (
                <option key={v.valor} value={v.valor}>
                  {v.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Sesión
            <select value={sesion} onChange={(e) => setSesion(e.target.value)}>
              <option value="">Todas</option>
              {(metricas.estado === "lista" ? metricas.datos : metricas.estado === "cargando" ? metricas.previo : undefined)?.sesiones.map((s) => (
                  <option key={`${s.agente}${s.id}`} value={s.id}>
                    {AGENTES[s.agente]} · {s.id}
                  </option>
                ))}
            </select>
          </label>
          {origenes.estado === "lista" && (
            <label>
              Origen
              <select value={origen} onChange={(e) => setOrigen(e.target.value)}>
                {origenes.datos.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nombre}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="metricas-detalle">
            <input type="checkbox" checked={detalle} onChange={(e) => setDetalle(e.target.checked)} />
            Mostrar comandos completos (con secretos redactados)
          </label>
        </div>
        {metricas.estado === "lista" && (
          <p className={`metricas-conexion metricas-conexion-${metricas.conexion}`} aria-live="polite">
            <span aria-hidden="true">●</span> {ESTADO_CONEXION[metricas.conexion]}
          </p>
        )}
      </section>

      {metricas.estado === "cargando" && <Cargando texto="Cargando métricas…" />}
      {metricas.estado === "error" && <ErrorCarga mensaje={metricas.error} onReintentar={metricas.reintentar} />}
      {metricas.estado === "lista" && (metricas.datos.vacio ? <SinLogs /> : <Tablero m={metricas.datos} />)}
    </div>
  )
}

function SinLogs() {
  return (
    <Vacio titulo="Todavía no hay logs">
      <p>
        Abrí un agente en la raíz del repo y pedile algo: cada acción queda registrada. Si no pasa nada, revisá que los hooks estén activos en el{" "}
        <Link to="/ejercicios/01-observabilidad-con-hooks">ejercicio 1</Link>.
      </p>
    </Vacio>
  )
}

function Tablero({ m }: { m: MetricasAgentes }) {
  const { kpis } = m
  const paso = m.porTiempo.pasoMin === 1 ? "minuto" : m.porTiempo.pasoMin === 10 ? "10 minutos" : "hora"
  return (
    <>
      <section className="indicadores" aria-label="Indicadores">
        <Indicador etiqueta="Sesiones" valor={formatoNumero(kpis.sesiones)} />
        <Indicador etiqueta="Prompts" valor={formatoNumero(kpis.prompts)} />
        <Indicador etiqueta="Llamadas a herramientas" valor={formatoNumero(kpis.herramientas)} />
        <Indicador etiqueta="Fallas de herramientas" valor={porcentaje(kpis.tasaFallas)} nota={kpis.fallas === null ? "ningún agente lo reporta" : `${kpis.fallas} en total`} />
        <Indicador etiqueta="Tiempo activo" valor={duracion(kpis.tiempoActivoMs)} />
        <Indicador etiqueta="Caracteres devueltos al modelo" valor={caracteres(kpis.caracteresDevueltos)} />
      </section>

      {m.enCurso.length > 0 && (
        <p className="en-curso">
          Ahora ejecutando:{" "}
          {m.enCurso.map((e) => `${e.herramienta} (${AGENTES[e.agente]}, hace ${duracion(e.desdeMs)})`).join(" · ")}
        </p>
      )}

      <div className="metricas-grilla">
        <Figura
          titulo={`Eventos por ${paso}`}
          ancho
          vacio={m.porTiempo.puntos.length === 0}
          tabla={{
            columnas: ["Inicio", ...(Object.values(AGENTES) as string[])],
            filas: m.porTiempo.puntos.map((p) => [hora(p.t), p.porAgente.claude ?? 0, p.porAgente.codex ?? 0, p.porAgente.cline ?? 0]),
          }}
        >
          <GraficoSerie puntos={m.porTiempo.puntos} />
        </Figura>

        <Figura
          titulo="Herramientas más usadas"
          vacio={m.herramientas.length === 0}
          tabla={{ columnas: ["Herramienta", "Tipo", "Llamadas"], filas: m.herramientas.map((h) => [h.nombre, h.kind, h.n]) }}
        >
          <GraficoBarras filas={m.herramientas.map((h) => ({ etiqueta: h.nombre, valor: h.n, color: colorKind(h.kind) }))} />
        </Figura>

        <Figura
          titulo="Fallas por herramienta"
          vacio={m.fallasPorHerramienta.length === 0}
          tabla={{ columnas: ["Herramienta", "Fallas"], filas: m.fallasPorHerramienta.map((f) => [f.nombre, f.n]) }}
        >
          <GraficoBarras filas={m.fallasPorHerramienta.map((f) => ({ etiqueta: f.nombre, valor: f.n, color: "var(--error)" }))} />
        </Figura>
      </div>

      <TablaSesiones m={m} />

      {m.comandosRecientes && (
        <section className="comandos" aria-label="Comandos recientes">
          <h2>Comandos recientes</h2>
          {m.comandosRecientes.length === 0 ? (
            <p className="grafico-vacio">Sin datos</p>
          ) : (
            <ul>
              {m.comandosRecientes.map((c) => (
                <li key={c.ts + c.comando}>
                  <span className="comando-meta" style={{ borderLeftColor: colorAgente(c.agente) }}>
                    {hora(c.ts)} · {AGENTES[c.agente]}
                  </span>
                  <code>{c.comando}</code>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  )
}

function TablaSesiones({ m }: { m: MetricasAgentes }) {
  return (
    <section className="sesiones" aria-labelledby="titulo-sesiones">
      <h2 id="titulo-sesiones">Sesiones recientes</h2>
      <div className="tabla-scroll">
        <table aria-label="Sesiones">
          <thead>
            <tr>
              {["Sesión", "Agente", "Inicio", "Duración", "Prompts", "Turnos", "Herramientas", "Fallas"].map((c) => (
                <th key={c} scope="col">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {m.sesiones.map((s) => (
              <tr key={`${s.agente}${s.id}`}>
                <th scope="row">
                  {s.id}
                  {s.enCurso && <span className="etiqueta-en-curso"> en curso</span>}
                </th>
                <td>{AGENTES[s.agente]}</td>
                <td>{hora(s.inicio)}</td>
                <td>{duracion(s.duracionMs)}</td>
                <td>{s.prompts}</td>
                <td>{s.turnos}</td>
                <td>{s.herramientas}</td>
                <td>{s.fallas === null ? "n/d" : s.fallas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
