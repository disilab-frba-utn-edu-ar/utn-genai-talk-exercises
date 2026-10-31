import type { AgenteLog, FiltrosMetricas, MetricasAgentes, OrigenLogs, TokensMetricas } from "../tipos"
import { useState } from "react"
import { Link, useSearchParams } from "react-router"
import { Cargando, ErrorCarga, Vacio } from "../../client/src/components/Estado"
import Chip from "../../client/src/components/Chip"
import { useCarga } from "../../client/src/hooks/useCarga"
import { leerOrigenes } from "./api"
import { AGENTES, caracteres, duracion, formatoNumero, hora, porcentaje, usd } from "./formato"
import { colorAgente, colorKind, Figura, GraficoBarras, GraficoDuraciones, GraficoSerie, GraficoTorta, Indicador, LineaDeTiempo, TortasPorGrupo, type Segmento, type SerieDef } from "./graficos"
import "./metricas.css"
import { useMetricasEnVivo, type Conexion } from "./useMetricasEnVivo"

const VENTANAS = [
  { valor: "", nombre: "Todo" },
  { valor: "15", nombre: "15 min" },
  { valor: "60", nombre: "1 h" },
  { valor: "1440", nombre: "24 h" },
]

const SERIES_AGENTES: SerieDef[] = (Object.keys(AGENTES) as AgenteLog[]).map((a) => ({ id: a, nombre: AGENTES[a], color: colorAgente(a) }))
const SERIES_TOKENS: SerieDef[] = [
  { id: "entrada", nombre: "Entrada", color: "var(--tokens-entrada)" },
  { id: "salida", nombre: "Salida", color: "var(--tokens-salida)" },
  { id: "cacheLectura", nombre: "Caché (lectura)", color: "var(--tokens-cache-lectura)" },
  { id: "cacheEscritura", nombre: "Caché (escritura)", color: "var(--tokens-cache-escritura)" },
]
const sumaCache = (t: TokensMetricas) => t.cacheLectura + t.cacheEscritura
const totalTokens = (t: TokensMetricas | null) => (t ? t.entrada + t.salida + sumaCache(t) : 0)
const segmentosTokens = (m: MetricasAgentes): Segmento[] =>
  m.tokens.total ? SERIES_TOKENS.map((s) => ({ nombre: s.nombre, valor: m.tokens.total![s.id as keyof TokensMetricas], color: s.color })).filter((s) => s.valor > 0) : []
const nombrePaso = (min: number) => (min === 1 ? "minuto" : min === 60 ? "hora" : `${min} minutos`)
const horaExacta = (iso: string) => new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" })

const ESTADO_CONEXION: Record<Conexion, string> = {
  envivo: "En vivo",
  reconectando: "Reconectando…",
  consultando: "Consultando cada 5 s (sin conexión en vivo)",
}

export default function Metricas() {
  // Los filtros viven en la URL: un link abre el tablero ya filtrado (por ejemplo, ?agente=cline&ventana=60).
  const [params, setParams] = useSearchParams()
  const agenteUrl = params.get("agente")
  const agente = agenteUrl && agenteUrl in AGENTES ? (agenteUrl as AgenteLog) : undefined
  const sesion = params.get("sesion") ?? ""
  const ventana = params.get("ventana") ?? ""
  const origen: OrigenLogs = params.get("origen") ?? "actual"
  const filtrar = (clave: string, valor: string | undefined) =>
    setParams(
      (actuales) => {
        const nuevos = new URLSearchParams(actuales)
        if (valor) nuevos.set(clave, valor)
        else nuevos.delete(clave)
        return nuevos
      },
      { replace: true },
    )
  const [detalle, setDetalle] = useState(false) // apagado por defecto: se activa desde la UI, sin variables de entorno

  const filtros: FiltrosMetricas = { agente, sesion: sesion || undefined, ventanaMin: ventana ? Number(ventana) : undefined, detalle }
  const metricas = useMetricasEnVivo(origen, filtros)
  const origenes = useCarga("origenes-metricas", leerOrigenes)

  return (
    <div className="metricas">
      <p className="metricas-aviso" role="note">
        Si llegaste sin terminar el Ejercicio 1, volvé después: ahí se aprende a leer a mano el log que este tablero resume.
      </p>
      <section className="portada">
        <p className="sobretitulo prompt">Observabilidad</p>
        <h1>Métricas</h1>
        <p className="bajada">Lo que hacen Claude Code, Codex CLI y Cline en este repo, leído en vivo de los logs de los hooks.</p>
      </section>

      <section className="metricas-filtros" aria-label="Filtros">
        <div className="chips">
          <Chip activo={!agente} onClick={() => filtrar("agente", undefined)}>
            Todos
          </Chip>
          {(Object.keys(AGENTES) as AgenteLog[]).map((a) => (
            <Chip key={a} activo={agente === a} onClick={() => filtrar("agente", a)}>
              {AGENTES[a]}
            </Chip>
          ))}
        </div>
        <div className="metricas-selectores">
          <label>
            Ventana
            <select value={ventana} onChange={(e) => filtrar("ventana", e.target.value)}>
              {VENTANAS.map((v) => (
                <option key={v.valor} value={v.valor}>
                  {v.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Sesión
            <select value={sesion} onChange={(e) => filtrar("sesion", e.target.value)}>
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
              <select value={origen} onChange={(e) => filtrar("origen", e.target.value === "actual" ? undefined : e.target.value)}>
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
          <p className={`metricas-conexion metricas-conexion-${metricas.conexion}`}>
            {/* Solo el estado se anuncia: la hora cambia con cada evento y el lector de pantalla no pararía de hablar. */}
            <span aria-live="polite">
              <span aria-hidden="true">●</span> {ESTADO_CONEXION[metricas.conexion]}
            </span>
            <span className="metricas-actualizado"> · actualizado a las {horaExacta(metricas.datos.generado)}</span>
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
  const totalPorAgente = new Map<AgenteLog, number>()
  for (const a of m.acciones) totalPorAgente.set(a.agente, (totalPorAgente.get(a.agente) ?? 0) + a.n)
  const usos = [
    ...m.subagentes.map((u) => ({ etiqueta: u.nombre, tipo: "subagente", kind: "otro", valor: u.n })),
    ...m.skills.map((u) => ({ etiqueta: u.nombre, tipo: "skill", kind: "skill", valor: u.n })),
    ...m.mcp.map((u) => ({ etiqueta: u.nombre, tipo: "mcp", kind: "mcp", valor: u.n })),
  ]
  const paso = nombrePaso(m.porTiempo.pasoMin)
  const pasoTokens = nombrePaso(m.tokens.porTiempo.pasoMin)
  return (
    <>
      <section className="indicadores" aria-label="Indicadores">
        <Indicador etiqueta="Sesiones" valor={formatoNumero(kpis.sesiones)} />
        <Indicador etiqueta="Prompts" valor={formatoNumero(kpis.prompts)} />
        <Indicador etiqueta="Llamadas a herramientas" valor={formatoNumero(kpis.herramientas)} />
        <Indicador etiqueta="Fallas de herramientas" valor={porcentaje(kpis.tasaFallas)} nota={kpis.fallas === null ? "ningún agente lo reporta" : `${kpis.fallas} en total`} />
        <Indicador
          etiqueta="Tokens (entrada / salida)"
          valor={m.tokens.total ? `${formatoNumero(m.tokens.total.entrada)} / ${formatoNumero(m.tokens.total.salida)}` : "n/d"}
          nota={m.tokens.total ? `caché: ${formatoNumero(sumaCache(m.tokens.total))}` : "sin transcripciones"}
        />
        <Indicador etiqueta="Costo estimado" valor={m.tokens.costo.usd === null ? "n/d" : usd(m.tokens.costo.usd)} nota={notaCosto(m)} />
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
          titulo={`Actividad por ${paso}, por agente`}
          nota={`Eventos del log (prompts, herramientas, fines de turno) cada ${paso}.`}
          ancho
          vacio={m.porTiempo.puntos.length === 0}
          tabla={{
            columnas: ["Inicio", ...(Object.values(AGENTES) as string[])],
            filas: m.porTiempo.puntos.map((p) => [hora(p.t), p.porAgente.claude ?? 0, p.porAgente.codex ?? 0, p.porAgente.cline ?? 0]),
          }}
        >
          <GraficoSerie puntos={m.porTiempo.puntos.map((p) => ({ t: p.t, valores: p.porAgente }))} series={SERIES_AGENTES} pasoMin={m.porTiempo.pasoMin} ejeY="Eventos" tipo="lineas" />
        </Figura>

        <Figura
          titulo={`Tokens por ${pasoTokens}, por agente`}
          nota={`Tokens consumidos cada ${pasoTokens} (entrada + salida + caché), apilados por agente.`}
          ancho
          vacio={m.tokens.porTiempo.puntos.length === 0}
          tabla={{
            columnas: ["Inicio", ...(Object.values(AGENTES) as string[])],
            filas: m.tokens.porTiempo.puntos.map((p) => [hora(p.t), formatoNumero(p.porAgente.claude ?? 0), formatoNumero(p.porAgente.codex ?? 0), formatoNumero(p.porAgente.cline ?? 0)]),
          }}
        >
          <GraficoSerie puntos={m.tokens.porTiempo.puntos.map((p) => ({ t: p.t, valores: p.porAgente }))} series={SERIES_AGENTES} pasoMin={m.tokens.porTiempo.pasoMin} ejeY="Tokens" tipo="barras" formato={caracteres} />
        </Figura>

        <Figura
          titulo={`Tokens por ${pasoTokens}, por tipo`}
          nota="Tokens apilados por tipo. La caché (lectura) es el contexto que el modelo relee en cada pedido: suele ser la mayor parte."
          ancho
          vacio={m.tokens.porTiempo.puntos.length === 0}
          tabla={{
            columnas: ["Inicio", "Entrada", "Salida", "Caché (lectura)", "Caché (escritura)"],
            filas: m.tokens.porTiempo.puntos.map((p) => [hora(p.t), formatoNumero(p.porTipo.entrada), formatoNumero(p.porTipo.salida), formatoNumero(p.porTipo.cacheLectura), formatoNumero(p.porTipo.cacheEscritura)]),
          }}
        >
          <GraficoSerie puntos={m.tokens.porTiempo.puntos.map((p) => ({ t: p.t, valores: { ...p.porTipo } }))} series={SERIES_TOKENS} pasoMin={m.tokens.porTiempo.pasoMin} ejeY="Tokens" tipo="area" formato={caracteres} />
        </Figura>

        <Figura
          titulo="Distribución de tokens por tipo"
          nota="Porcentaje de cada tipo sobre el total de tokens (al centro)."
          vacio={!m.tokens.total || totalTokens(m.tokens.total) === 0}
          tabla={{
            columnas: ["Tipo", "Tokens", "Del total"],
            filas: segmentosTokens(m).map((s) => [s.nombre, formatoNumero(s.valor), porcentaje(s.valor / (totalTokens(m.tokens.total) || 1))]),
          }}
        >
          <GraficoTorta segmentos={segmentosTokens(m)} unidad="tokens" formato={caracteres} />
        </Figura>

        <Figura
          titulo="Tokens y costo por modelo"
          nota="Tokens totales por modelo y su costo estimado a precio de lista."
          vacio={m.tokens.porModelo.length === 0}
          tabla={{
            columnas: ["Agente", "Modelo", "Solicitudes", "Entrada", "Salida", "Caché (lectura)", "Caché (escritura)", "Costo"],
            filas: m.tokens.porModelo.map((f) => [AGENTES[f.agente], f.modelo, f.solicitudes, formatoNumero(f.entrada), formatoNumero(f.salida), formatoNumero(f.cacheLectura), formatoNumero(f.cacheEscritura), f.costoUsd === null ? "n/d" : usd(f.costoUsd)]),
          }}
        >
          <GraficoBarras
            eje="Tokens"
            formato={caracteres}
            filas={m.tokens.porModelo.map((f) => ({
              etiqueta: `${f.modelo} (${AGENTES[f.agente]})`,
              valor: f.entrada + f.salida + f.cacheLectura + f.cacheEscritura,
              texto: `${caracteres(f.entrada + f.salida + f.cacheLectura + f.cacheEscritura)} · ${f.costoUsd === null ? "costo n/d" : usd(f.costoUsd)}`,
              color: colorAgente(f.agente),
            }))}
          />
        </Figura>

        <Figura
          titulo="Acciones por tipo, por agente"
          nota="Proporción de cada tipo de acción sobre las llamadas del agente (total al centro)."
          ancho
          vacio={m.acciones.length === 0}
          tabla={{ columnas: ["Agente", "Tipo", "Llamadas", "Del agente"], filas: m.acciones.map((a) => [AGENTES[a.agente], a.kind, a.n, porcentaje(a.n / (totalPorAgente.get(a.agente) ?? 1))]) }}
        >
          <TortasPorGrupo
            unidad="llamadas"
            grupos={(Object.keys(AGENTES) as AgenteLog[])
              .filter((a) => totalPorAgente.has(a))
              .map((a) => ({
                nombre: AGENTES[a],
                segmentos: m.acciones.filter((x) => x.agente === a).map((x) => ({ nombre: x.kind, valor: x.n, color: colorKind(x.kind) })),
              }))}
          />
        </Figura>

        <Figura
          titulo="Herramientas más usadas"
          nota="Llamadas por herramienta; el color es el tipo de acción."
          vacio={m.herramientas.length === 0}
          tabla={{ columnas: ["Herramienta", "Tipo", "Llamadas"], filas: m.herramientas.map((h) => [h.nombre, h.kind, h.n]) }}
        >
          <GraficoBarras eje="Llamadas" filas={m.herramientas.map((h) => ({ etiqueta: h.nombre, valor: h.n, color: colorKind(h.kind) }))} />
        </Figura>

        <Figura
          titulo="Fallas por herramienta"
          nota="Llamadas que devolvieron error."
          vacio={m.fallasPorHerramienta.length === 0}
          tabla={{ columnas: ["Herramienta", "Fallas"], filas: m.fallasPorHerramienta.map((f) => [f.nombre, f.n]) }}
        >
          <GraficoBarras eje="Llamadas con error" filas={m.fallasPorHerramienta.map((f) => ({ etiqueta: f.nombre, valor: f.n, color: "var(--error)" }))} />
        </Figura>

        <Figura
          titulo="Duración por tipo de acción"
          nota="p50: la mitad de las llamadas tarda menos. p95: el peor caso habitual."
          vacio={m.duraciones.length === 0}
          tabla={{ columnas: ["Tipo", "Llamadas", "p50", "p95"], filas: m.duraciones.map((d) => [d.kind, d.n, duracion(d.p50Ms), duracion(d.p95Ms)]) }}
        >
          <GraficoDuraciones filas={m.duraciones} />
        </Figura>

        <Figura
          titulo="Subagentes, skills y MCP"
          nota="Usos de cada skill, servidor MCP o subagente."
          vacio={usos.length === 0}
          tabla={{ columnas: ["Nombre", "Tipo", "Usos"], filas: usos.map((u) => [u.etiqueta, u.tipo, u.valor]) }}
        >
          <GraficoBarras eje="Usos" filas={usos.map((u) => ({ etiqueta: u.etiqueta, valor: u.valor, texto: `${u.valor} · ${u.tipo}`, color: colorKind(u.kind) }))} />
        </Figura>

        <Figura titulo="Archivos leídos" nota="Veces que el agente leyó cada archivo." vacio={m.archivosLeidos.length === 0} tabla={{ columnas: ["Archivo", "Lecturas"], filas: m.archivosLeidos.map((a) => [a.nombre, a.n]) }}>
          <GraficoBarras eje="Lecturas" filas={m.archivosLeidos.map((a) => ({ etiqueta: a.nombre, valor: a.n, color: colorKind("leer") }))} />
        </Figura>

        <Figura titulo="Archivos escritos" nota="Veces que el agente creó o editó cada archivo." vacio={m.archivosEscritos.length === 0} tabla={{ columnas: ["Archivo", "Escrituras"], filas: m.archivosEscritos.map((a) => [a.nombre, a.n]) }}>
          <GraficoBarras eje="Escrituras" filas={m.archivosEscritos.map((a) => ({ etiqueta: a.nombre, valor: a.n, color: colorKind("escribir") }))} />
        </Figura>

        <Figura titulo="Comandos de shell" nota="Veces que se ejecutó cada programa (git, npm, node…)." vacio={m.binarios.length === 0} tabla={{ columnas: ["Comando", "Veces"], filas: m.binarios.map((b) => [b.nombre, b.n]) }}>
          <GraficoBarras eje="Ejecuciones" filas={m.binarios.map((b) => ({ etiqueta: b.nombre, valor: b.n, color: colorKind("ejecutar") }))} />
        </Figura>

        <Figura
          titulo={m.lineaDeTiempo ? `Línea de tiempo de la sesión ${m.lineaDeTiempo.sesion} (${AGENTES[m.lineaDeTiempo.agente]})` : "Línea de tiempo de la sesión"}
          nota="Cada punto es una llamada a herramienta. Línea punteada: prompt · línea llena: fin de turno · cruz roja: falla."
          ancho
          vacio={!m.lineaDeTiempo || m.lineaDeTiempo.puntos.length === 0}
          tabla={{
            columnas: ["Segundo", "Evento", "Tipo", "Resultado"],
            filas: (m.lineaDeTiempo?.puntos ?? []).map((p) => [
              Math.round(p.t / 1000),
              p.tipo === "prompt" ? "prompt" : p.tipo === "fin" ? "fin de turno" : "herramienta",
              p.kind ?? "",
              p.falla ? "falló" : "",
            ]),
          }}
        >
          {m.lineaDeTiempo && <LineaDeTiempo datos={m.lineaDeTiempo} />}
        </Figura>
      </div>

      {m.tokens.cambiosDeModelo.length > 0 && (
        <section className="cambios-modelo" aria-label="Cambios de modelo">
          <h2>Cambios de modelo</h2>
          <ul>
            {m.tokens.cambiosDeModelo.map((c) => (
              <li key={c.sesion + c.t}>
                <span className="comando-meta" style={{ borderLeftColor: colorAgente(c.agente) }}>
                  {hora(c.t)} · {AGENTES[c.agente]} · {c.sesion}
                </span>
                <code>
                  {c.de} → {c.a}
                </code>
              </li>
            ))}
          </ul>
        </section>
      )}

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

function notaCosto(m: MetricasAgentes): string {
  const { costo, disponible } = m.tokens
  if (!disponible) return "sin transcripciones"
  if (costo.parcial) return `parcial: sin precio para ${costo.sinPrecio.join(", ")}`
  if (costo.usd === null) return `sin precio para ${costo.sinPrecio.join(", ")}`
  return "estimado a precio de lista"
}

function TablaSesiones({ m }: { m: MetricasAgentes }) {
  return (
    <section className="sesiones" aria-labelledby="titulo-sesiones">
      <h2 id="titulo-sesiones">Sesiones recientes</h2>
      <div className="tabla-scroll">
        <table aria-label="Sesiones">
          <thead>
            <tr>
              {["Sesión", "Agente", "Inicio", "Duración", "Prompts", "Turnos", "Herramientas", "Fallas", "Modelos", "Tokens (ent. / sal.)", "Costo"].map((c) => (
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
                <td>{s.modelos.length > 0 ? s.modelos.join(" → ") : "n/d"}</td>
                <td>{s.tokens ? `${formatoNumero(s.tokens.entrada)} / ${formatoNumero(s.tokens.salida)}` : "n/d"}</td>
                <td>{s.costoUsd === null ? "n/d" : `${usd(s.costoUsd)}${s.costoParcial ? " (parcial)" : ""}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
