// Gráficos del tablero con Recharts: reciben datos ya calculados por el servidor y solo dibujan.
// Cada gráfico es una <figure> con su botón "Ver como tabla" (sirve también a lectores de pantalla),
// ejes rotulados y su descripción en un tooltip.
import { useId, useState, type ReactElement, type ReactNode } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Rectangle,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  type RectangleProps,
} from "recharts"
import type { AgenteLog } from "../tipos"
import { duracion, formatoNumero, hora } from "./formato"

export const colorAgente = (agente: AgenteLog) => `var(--agente-${agente})`
export const colorKind = (kind: string) => `var(--kind-${["leer", "escribir", "ejecutar", "buscar", "skill", "mcp", "pregunta"].includes(kind) ? kind : "otro"})`

export type Tabla = { columnas: string[]; filas: (string | number)[][] }

// Estilo común: ejes y grilla recesivos, texto en tinta de texto (nunca del color de la serie).
const TICK = { fill: "var(--texto-suave)", fontSize: 12 }
const ROTULO = { fill: "var(--texto-suave)", fontSize: 12, fontWeight: 600 }
const GRILLA = { stroke: "var(--linea-suave)", strokeDasharray: "3 3" }
const TOOLTIP = {
  contentStyle: { background: "var(--superficie)", border: "2px solid var(--linea)", borderRadius: 12, boxShadow: "3px 3px 0 var(--linea)", fontSize: 13, color: "var(--texto)", fontVariantNumeric: "tabular-nums" },
  labelStyle: { fontWeight: 700, color: "var(--texto)" },
  cursor: { fill: "var(--grilla)", stroke: "var(--linea)" },
}
// Sin capa de teclado de Recharts: el lienzo es aria-hidden y la alternativa accesible es la vista de tabla.
// Sin animación: los datos llegan en vivo varias veces por minuto y cada evento reiniciaría la
// animación (Recharts no muestra las etiquetas de valor hasta que termina).
const ANIMACION = { isAnimationActive: false }
// El texto de la leyenda va en tinta de texto; el color de la serie lo lleva el punto de al lado.
const LEYENDA = { iconType: "circle" as const, wrapperStyle: { fontSize: 13 }, formatter: (nombre: string) => <span className="leyenda-texto">{nombre}</span> }

/**
 * Ícono "i" con la descripción del gráfico: se abre con el mouse o el foco del teclado y se cierra con Escape.
 * La descripción queda siempre asociada al botón (aria-describedby), aunque esté oculta.
 */
function Info({ texto }: { texto: string }) {
  const id = useId()
  const [abierto, setAbierto] = useState(false)
  return (
    <span className="info" onMouseEnter={() => setAbierto(true)} onMouseLeave={() => setAbierto(false)}>
      <button
        type="button"
        className="info-boton"
        aria-label="Qué muestra este gráfico"
        aria-describedby={id}
        onFocus={() => setAbierto(true)}
        onBlur={() => setAbierto(false)}
        onKeyDown={(e) => e.key === "Escape" && setAbierto(false)}
      >
        i
      </button>
      <span role="tooltip" id={id} className="info-texto" hidden={!abierto}>
        {texto}
      </span>
    </span>
  )
}

/** Contenedor común: título (con su descripción en un tooltip), alternar con la tabla y estado "Sin datos". */
export function Figura({ titulo, nota, tabla, vacio, ancho, children }: { titulo: string; nota?: string; tabla: Tabla; vacio: boolean; ancho?: boolean; children: ReactNode }) {
  const id = useId()
  const [verTabla, setVerTabla] = useState(false)
  return (
    <figure className={`grafico${ancho ? " grafico-ancho" : ""}`} aria-labelledby={id}>
      <div className="grafico-cabecera">
        <div className="grafico-titulo">
          <figcaption id={id}>{titulo}</figcaption>
          {nota && <Info texto={nota} />}
        </div>
        {!vacio && (
          <button type="button" className="boton-texto grafico-alternar" aria-label={verTabla ? "Ver como gráfico" : "Ver como tabla"} onClick={() => setVerTabla((v) => !v)}>
            {verTabla ? "Gráfico" : "Tabla"}
          </button>
        )}
      </div>
      {vacio ? (
        <p className="grafico-vacio">Sin datos</p>
      ) : verTabla ? (
        <div className="tabla-scroll">
          <table>
            <thead>
              <tr>
                {tabla.columnas.map((c) => (
                  <th key={c} scope="col">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tabla.filas.map((fila, i) => (
                <tr key={i}>
                  {fila.map((celda, j) => (j === 0 ? <th key={j} scope="row">{celda}</th> : <td key={j}>{celda}</td>))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grafico-lienzo" aria-hidden="true">
          {children}
        </div>
      )}
    </figure>
  )
}

/** Contenedor que sigue el ancho de la tarjeta; `initialDimension` evita un primer render en 0 px. */
function Lienzo({ alto, children }: { alto: number; children: ReactElement }) {
  return (
    <ResponsiveContainer width="100%" height={alto} initialDimension={{ width: 600, height: alto }}>
      {children}
    </ResponsiveContainer>
  )
}

/**
 * Etiqueta corta: las herramientas MCP pierden el prefijo (mcp__servidor__tool → servidor · tool) y las
 * rutas se recortan por el principio, porque lo que identifica al archivo es el final. El nombre completo
 * queda en el tooltip y en la tabla.
 */
export function recortar(texto: string, max = 44) {
  const corto = texto.replace(/^mcp__(.+?)__(.+)$/, "$1 · $2")
  if (corto.length <= max) return corto
  return corto.includes("/") ? `…${corto.slice(-(max - 1))}` : `${corto.slice(0, max - 1)}…`
}

/** Nombre de la fila arriba de su barra: así no compite por el ancho con la barra y entra entero. */
function EtiquetaArriba(props: { x?: number | string; y?: number | string; value?: number | string | boolean | null }) {
  return (
    <text x={Number(props.x)} y={Number(props.y) - 5} fill="var(--texto)" fontSize={12}>
      {recortar(String(props.value ?? ""))}
    </text>
  )
}

export type FilaBarra = { etiqueta: string; valor: number; texto?: string; color?: string }

/**
 * Barras horizontales: el nombre de cada fila va arriba de su barra (con todo el ancho, para que las rutas
 * no se corten), el eje X dice qué se cuenta y el valor va escrito al final de la barra.
 */
export function GraficoBarras({ filas, eje, formato = formatoNumero }: { filas: FilaBarra[]; eje: string; formato?: (n: number) => string }) {
  const datos = filas.map((f) => ({ ...f, texto: f.texto ?? formato(f.valor) }))
  return (
    <Lienzo alto={Math.max(140, datos.length * 36 + 60)}>
      <BarChart accessibilityLayer={false} data={datos} layout="vertical" margin={{ top: 4, right: Math.min(190, 16 + 7 * Math.max(...datos.map((d) => d.texto.length))), bottom: 24, left: 8 }} barSize={14}>
        <CartesianGrid {...GRILLA} horizontal={false} />
        <XAxis type="number" tick={TICK} tickFormatter={formato} allowDecimals={false} label={{ value: eje, position: "insideBottom", offset: -14, ...ROTULO }} />
        {/* El eje Y ordena las filas pero no ocupa ancho: el nombre lo dibuja EtiquetaArriba. */}
        <YAxis type="category" dataKey="etiqueta" hide />
        <Tooltip {...TOOLTIP} labelFormatter={(etiqueta) => String(etiqueta).replace(/^mcp__(.+?)__(.+)$/, "$1 · $2")} formatter={(_v, _n, item) => [(item.payload as FilaBarra).texto, eje]} />
        <Bar dataKey="valor" radius={[0, 4, 4, 0]} minPointSize={2} {...ANIMACION}>
          {datos.map((f) => (
            <Cell key={f.etiqueta} fill={f.color ?? "var(--agente-claude)"} />
          ))}
          <LabelList dataKey="etiqueta" content={EtiquetaArriba} />
          {/* width grande: sin él Recharts parte la etiqueta en dos líneas. */}
          <LabelList dataKey="texto" position="right" fill="var(--texto)" fontSize={12} width={400} />
        </Bar>
      </BarChart>
    </Lienzo>
  )
}

export type SerieDef = { id: string; nombre: string; color: string }
export type PuntoSerie = { t: string; valores: Record<string, number> }

const fechaHora = (t: number) => new Date(t).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })

/**
 * El servidor solo manda los tramos con actividad, en orden. Después de cada tramo seguido de un hueco
 * agrega un 0 (también después del último): como las líneas y áreas van en escalones, cada tramo se
 * dibuja plano durante todo su paso y baja a cero en el hueco, sin diagonales que sugieran actividad
 * en el medio.
 */
function conHuecos(puntos: PuntoSerie[], pasoMin: number): { t: number; valores: Record<string, number> }[] {
  const paso = pasoMin * 60_000
  const ordenados = puntos.map((p) => ({ t: new Date(p.t).getTime(), valores: p.valores })).sort((a, b) => a.t - b.t)
  const resultado: { t: number; valores: Record<string, number> }[] = []
  for (const [i, p] of ordenados.entries()) {
    resultado.push(p)
    const siguiente = ordenados[i + 1]?.t
    if (siguiente === undefined || siguiente - p.t > paso) resultado.push({ t: p.t + paso, valores: {} })
  }
  return resultado
}

/**
 * Barra de al menos 4 px de ancho, centrada en su tramo: en un eje de tiempo de varios días Recharts
 * las afina (y no deja agrandarlas con barSize) hasta que en un celular no se ven.
 */
function BarraMinima(props: RectangleProps) {
  const ancho = props.width ?? 0
  const visible = Math.max(ancho, 4)
  return <Rectangle {...props} x={(props.x ?? 0) + ancho / 2 - visible / 2} width={visible} />
}

/**
 * Valores por tramo de tiempo, una serie por agente o tipo de token.
 * - "lineas": compara la tendencia de cada serie.
 * - "area": áreas apiladas, la altura total es la suma de las series.
 * - "barras": barras apiladas por tramo.
 */
export function GraficoSerie({ puntos, series, pasoMin, ejeY, tipo = "lineas", formato = formatoNumero }: { puntos: PuntoSerie[]; series: SerieDef[]; pasoMin: number; ejeY: string; tipo?: "lineas" | "area" | "barras"; formato?: (n: number) => string }) {
  const presentes = series.filter((s) => puntos.some((p) => p.valores[s.id]))
  // Las barras ya ocupan su tramo: no necesitan los ceros de cierre.
  const conCierre = tipo === "barras" ? puntos.map((p) => ({ t: new Date(p.t).getTime(), valores: p.valores })).sort((a, b) => a.t - b.t) : conHuecos(puntos, pasoMin)
  const datos = conCierre.map((p) => ({ t: p.t, ...Object.fromEntries(presentes.map((s) => [s.id, p.valores[s.id] ?? 0])) }))
  // Eje de tiempo real (no categorías): una hora sin actividad ocupa una hora en el gráfico.
  const variosDias = datos.length > 1 && datos.at(-1)!.t - datos[0].t > 20 * 3_600_000
  const formatoT = (t: number) => (variosDias ? fechaHora(t) : hora(new Date(t).toISOString()))
  // Recharts reparte las marcas de un eje numérico en números "redondos", que en milisegundos no lo son: las calculamos.
  const marcas = datos.length > 1 ? Array.from({ length: 6 }, (_, i) => datos[0].t + ((datos.at(-1)!.t - datos[0].t) * i) / 5) : datos.map((d) => d.t)
  const comunes = (
    <>
      <CartesianGrid {...GRILLA} vertical={false} />
      <XAxis
        dataKey="t"
        type="number"
        scale="time"
        domain={["dataMin", "dataMax"]}
        padding={tipo === "barras" ? { left: 16, right: 16 } : undefined}
        ticks={marcas}
        tick={TICK}
        tickFormatter={formatoT}
        minTickGap={8}
        label={{ value: variosDias ? "Fecha y hora" : "Hora", position: "insideBottom", offset: -14, ...ROTULO }}
      />
      <YAxis tick={TICK} tickFormatter={formato} width={80} allowDecimals={false} label={{ value: ejeY, angle: -90, position: "insideLeft", style: { textAnchor: "middle" }, ...ROTULO }} />
      <Tooltip {...TOOLTIP} formatter={(v) => formato(Number(v))} labelFormatter={(t) => `Desde ${fechaHora(Number(t))}`} />
      {/* Con una sola serie la leyenda sobra: el título ya la nombra. */}
      {presentes.length > 1 && <Legend verticalAlign="top" height={28} {...LEYENDA} />}
    </>
  )
  const margen = { top: 4, right: 16, bottom: 24, left: 8 }
  return (
    <Lienzo alto={260}>
      {tipo === "barras" ? (
        <BarChart accessibilityLayer={false} data={datos} margin={margen}>
          {comunes}
          {presentes.map((s, i) => (
            <Bar key={s.id} dataKey={s.id} name={s.nombre} stackId="total" fill={s.color} shape={BarraMinima} radius={i === presentes.length - 1 ? [2, 2, 0, 0] : 0} {...ANIMACION} />
          ))}
        </BarChart>
      ) : tipo === "area" ? (
        <AreaChart accessibilityLayer={false} data={datos} margin={margen}>
          {comunes}
          {presentes.map((s) => (
            <Area key={s.id} type="stepAfter" dataKey={s.id} name={s.nombre} stackId="total" stroke={s.color} strokeWidth={2} fill={s.color} fillOpacity={0.35} {...ANIMACION} />
          ))}
        </AreaChart>
      ) : (
        <LineChart accessibilityLayer={false} data={datos} margin={margen}>
          {comunes}
          {presentes.map((s) => (
            <Line key={s.id} type="stepAfter" dataKey={s.id} name={s.nombre} stroke={s.color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} {...ANIMACION} />
          ))}
        </LineChart>
      )}
    </Lienzo>
  )
}

export type Segmento = { nombre: string; valor: number; color: string }

/** Una torta se lee hasta 6 porciones: las 5 mayores quedan y el resto se suma en "otros" (el detalle sigue en la tabla). */
function agruparResto(segmentos: Segmento[], max = 6): Segmento[] {
  if (segmentos.length <= max) return segmentos
  const ordenados = [...segmentos].sort((a, b) => b.valor - a.valor)
  const resto = ordenados.slice(max - 1).reduce((n, s) => n + s.valor, 0)
  return [...ordenados.slice(0, max - 1), { nombre: "otros", valor: resto, color: "var(--kind-otro)" }]
}

/**
 * Torta (anillo) con el total en el centro y el porcentaje de cada porción en la leyenda: muestra proporciones
 * de un todo. El anillo tiene tamaño fijo y la leyenda va al costado (abajo si no entra), sin espacio vacío.
 */
export function GraficoTorta({ segmentos: todos, unidad, formato = formatoNumero, lado = 180 }: { segmentos: Segmento[]; unidad: string; formato?: (n: number) => string; lado?: number }) {
  const segmentos = agruparResto(todos)
  const total = segmentos.reduce((n, s) => n + s.valor, 0)
  const pct = (v: number) => (total ? `${Math.round((v / total) * 100)} %` : "0 %")
  return (
    <div className="torta-fila">
      <PieChart accessibilityLayer={false} width={lado} height={lado}>
        <Pie
          data={segmentos}
          dataKey="valor"
          nameKey="nombre"
          innerRadius={lado * 0.31}
          outerRadius={lado / 2 - 4}
          paddingAngle={1}
          stroke="var(--superficie)"
          strokeWidth={2}
          rootTabIndex={-1}
          {...ANIMACION}
        >
          {segmentos.map((s) => (
            <Cell key={s.nombre} fill={s.color} />
          ))}
        </Pie>
        <text x={lado / 2} y={lado / 2} textAnchor="middle" dominantBaseline="central" fill="var(--texto)">
          <tspan x={lado / 2} dy="-0.5em" fontSize={18} fontWeight={700}>
            {formato(total)}
          </tspan>
          <tspan x={lado / 2} dy="1.3em" fontSize={11} fill="var(--texto-suave)">
            {unidad}
          </tspan>
        </text>
        <Tooltip {...TOOLTIP} formatter={(v, nombre) => [`${formato(Number(v))} ${unidad} (${pct(Number(v))})`, nombre]} />
      </PieChart>
      <Leyenda items={segmentos.map((s) => ({ nombre: `${s.nombre} · ${pct(s.valor)}`, color: s.color }))} />
    </div>
  )
}

/** Una torta por grupo (por ejemplo, por agente) con los mismos colores: compara proporciones entre grupos. */
export function TortasPorGrupo({ grupos, unidad }: { grupos: { nombre: string; segmentos: Segmento[] }[]; unidad: string }) {
  return (
    <div className="tortas">
      {grupos.map((g) => (
        <div key={g.nombre} className="torta">
          <p className="torta-titulo">{g.nombre}</p>
          <GraficoTorta segmentos={g.segmentos} unidad={unidad} lado={160} />
        </div>
      ))}
    </div>
  )
}

/** Barras agrupadas p50 / p95 por tipo de acción: el eje Y es el tiempo que tarda una llamada. */
export function GraficoDuraciones({ filas }: { filas: { kind: string; p50Ms: number; p95Ms: number }[] }) {
  return (
    <Lienzo alto={260}>
      <BarChart accessibilityLayer={false} data={filas} margin={{ top: 4, right: 16, bottom: 24, left: 8 }} barGap={2}>
        <CartesianGrid {...GRILLA} vertical={false} />
        {/* Inclinadas: con siete tipos los nombres se pisaban en un ancho chico. */}
        <XAxis dataKey="kind" tick={{ ...TICK, textAnchor: "end" }} angle={-35} height={56} interval={0} label={{ value: "Tipo de acción", position: "insideBottom", offset: -14, ...ROTULO }} />
        <YAxis tick={TICK} tickFormatter={(ms: number) => duracion(ms)} width={64} label={{ value: "Duración", angle: -90, position: "insideLeft", style: { textAnchor: "middle" }, ...ROTULO }} />
        <Tooltip {...TOOLTIP} formatter={(v) => duracion(Number(v))} />
        <Legend verticalAlign="top" height={28} {...LEYENDA} />
        <Bar dataKey="p50Ms" name="Mediana (p50)" fill="var(--kind-leer)" radius={[4, 4, 0, 0]} {...ANIMACION} />
        <Bar dataKey="p95Ms" name="Peor caso habitual (p95)" fill="var(--kind-escribir)" radius={[4, 4, 0, 0]} {...ANIMACION} />
      </BarChart>
    </Lienzo>
  )
}

export function Leyenda({ items }: { items: { nombre: string; color: string }[] }) {
  return (
    <ul className="leyenda">
      {items.map((i) => (
        <li key={i.nombre}>
          <span className="leyenda-color" style={{ background: i.color }} aria-hidden="true" />
          {i.nombre}
        </li>
      ))}
    </ul>
  )
}

/** Tarjeta de un indicador. `valor` ya viene formateado ("n/d" si el agente no lo reporta). */
export function Indicador({ etiqueta, valor, nota }: { etiqueta: string; valor: string; nota?: string }) {
  return (
    <div className="indicador">
      <span className="indicador-etiqueta">{etiqueta}</span>
      <span className="indicador-valor">{valor}</span>
      {nota && <span className="indicador-nota">{nota}</span>}
    </div>
  )
}

export type DatosLinea = { duracionMs: number; puntos: { t: number; tipo: "herramienta" | "prompt" | "fin"; kind?: string; falla?: boolean }[] }

/**
 * Línea de tiempo de una sesión: eje X en segundos desde el inicio, eje Y con un carril por tipo de acción.
 * Cada punto es una llamada a herramienta; las fallas van en rojo. Las líneas verticales marcan prompts (punteadas) y fines de turno (llenas).
 */
export function LineaDeTiempo({ datos }: { datos: DatosLinea }) {
  const herramientas = datos.puntos.filter((p) => p.tipo === "herramienta")
  const carriles = [...new Set(herramientas.map((p) => p.kind ?? "otro"))]
  const punto = (p: DatosLinea["puntos"][number]) => ({ s: Math.round(p.t / 100) / 10, carril: carriles.indexOf(p.kind ?? "otro"), kind: p.kind ?? "otro" })
  const fallas = herramientas.filter((p) => p.falla).map(punto)
  const fin = Math.max(1, Math.ceil(datos.duracionMs / 1000))
  return (
    <Lienzo alto={Math.max(180, carriles.length * 36 + 90)}>
        <ScatterChart accessibilityLayer={false} margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
          <CartesianGrid {...GRILLA} />
          <XAxis
            type="number"
            dataKey="s"
            domain={[0, fin]}
            ticks={Array.from({ length: 6 }, (_, i) => Math.round((fin * i) / 5))}
            tickFormatter={(s: number) => (s === 0 ? "0" : duracion(s * 1000))}
            tick={TICK}
            label={{ value: "Tiempo desde el inicio de la sesión", position: "insideBottom", offset: -14, ...ROTULO }}
          />
          <YAxis type="number" dataKey="carril" domain={[-0.5, carriles.length - 0.5]} ticks={carriles.map((_, i) => i)} tickFormatter={(i: number) => carriles[i] ?? ""} tick={TICK} width={80} reversed />
          <Legend verticalAlign="top" height={28} {...LEYENDA} />
          <Tooltip {...TOOLTIP} cursor={{ strokeDasharray: "3 3" }} formatter={(v, nombre) => (nombre === "s" ? [duracion(Number(v) * 1000), "Desde el inicio"] : [carriles[Number(v)] ?? v, "Tipo"])} />
          {datos.puntos
            .filter((p) => p.tipo !== "herramienta")
            .map((p, i) => (
              <ReferenceLine key={i} x={Math.round(p.t / 100) / 10} stroke="var(--texto)" strokeWidth={1.5} strokeDasharray={p.tipo === "prompt" ? "5 4" : undefined} />
            ))}
          {carriles.map((c) => (
            <Scatter key={c} name={c} data={herramientas.filter((p) => !p.falla && (p.kind ?? "otro") === c).map(punto)} fill={colorKind(c)} shape="circle" {...ANIMACION} />
          ))}
          {fallas.length > 0 && <Scatter name="falla" data={fallas} fill="var(--error)" shape="cross" {...ANIMACION} />}
        </ScatterChart>
    </Lienzo>
  )
}
