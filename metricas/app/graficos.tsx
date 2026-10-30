// Gráficos propios, sin librerías: reciben datos ya calculados por el servidor y solo dibujan.
// Cada gráfico es una <figure> con su botón "Ver como tabla" (sirve también a lectores de pantalla).
import { useId, useState, type ReactNode } from "react"
import type { AgenteLog } from "../tipos"
import { hora } from "./formato"

export const colorAgente = (agente: AgenteLog) => `var(--agente-${agente})`
export const colorKind = (kind: string) => `var(--kind-${["leer", "escribir", "ejecutar", "buscar", "skill", "mcp", "pregunta"].includes(kind) ? kind : "otro"})`

export type Tabla = { columnas: string[]; filas: (string | number)[][] }

/** Contenedor común: título, botón para alternar con la tabla y estado "Sin datos". */
export function Figura({ titulo, tabla, vacio, ancho, children }: { titulo: string; tabla: Tabla; vacio: boolean; ancho?: boolean; children: ReactNode }) {
  const id = useId()
  const [verTabla, setVerTabla] = useState(false)
  return (
    <figure className={`grafico${ancho ? " grafico-ancho" : ""}`} aria-labelledby={id}>
      <div className="grafico-cabecera">
        <figcaption id={id}>{titulo}</figcaption>
        {!vacio && (
          <button type="button" className="boton-texto" onClick={() => setVerTabla((v) => !v)}>
            {verTabla ? "Ver como gráfico" : "Ver como tabla"}
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
        children
      )}
    </figure>
  )
}

export type FilaBarra = { etiqueta: string; valor: number; texto?: string; color?: string }

/** Barras horizontales con la etiqueta y el valor escritos (la identidad no depende del color). */
export function GraficoBarras({ filas }: { filas: FilaBarra[] }) {
  const max = Math.max(...filas.map((f) => f.valor), 1)
  return (
    <ol className="barras">
      {filas.map((f) => (
        <li key={f.etiqueta}>
          <span className="barra-etiqueta" title={f.etiqueta}>
            {f.etiqueta}
          </span>
          <span className="barra-pista" aria-hidden="true">
            <span className="barra-relleno" style={{ width: `${(f.valor / max) * 100}%`, background: f.color }} />
          </span>
          <span className="barra-valor">{f.texto ?? f.valor}</span>
        </li>
      ))}
    </ol>
  )
}

export type SerieDef = { id: string; nombre: string; color: string }

/** Valores por tramo de tiempo, apilados por serie (agente o tipo de token). */
export function GraficoSerie({ puntos, series, formato = String }: { puntos: { t: string; valores: Record<string, number> }[]; series: SerieDef[]; formato?: (n: number) => string }) {
  const total = (p: (typeof puntos)[number]) => series.reduce((n, s) => n + (p.valores[s.id] ?? 0), 0)
  const max = Math.max(...puntos.map(total), 1)
  const ancho = 12
  const alto = 120
  const presentes = series.filter((s) => puntos.some((p) => p.valores[s.id]))
  return (
    <div className="serie">
      <svg viewBox={`0 0 ${puntos.length * ancho} ${alto}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
        {puntos.map((p, i) => {
          let y = alto
          return (
            <g key={p.t}>
              {series.map((s) => {
                const n = p.valores[s.id] ?? 0
                if (!n) return null
                const h = (n / max) * (alto - 2)
                y -= h
                return <rect key={s.id} x={i * ancho + 1} y={y} width={ancho - 2} height={h} fill={s.color} stroke="var(--superficie)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              })}
            </g>
          )
        })}
      </svg>
      <div className="serie-ejes">
        <span>{hora(puntos[0].t)}</span>
        <span>máx. {formato(max)} por tramo</span>
        <span>{hora(puntos.at(-1)!.t)}</span>
      </div>
      <Leyenda items={presentes.map((s) => ({ nombre: s.nombre, color: s.color }))} />
    </div>
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

export type Segmento = { nombre: string; valor: number; color: string }

/** Una barra al 100 % por fila, partida en segmentos; la leyenda nombra cada segmento. */
export function GraficoApilado({ filas }: { filas: { etiqueta: string; color: string; segmentos: Segmento[] }[] }) {
  const nombres = new Map<string, string>()
  for (const f of filas) for (const s of f.segmentos) nombres.set(s.nombre, s.color)
  return (
    <>
      <ul className="apilado">
        {filas.map((f) => {
          const total = f.segmentos.reduce((n, s) => n + s.valor, 0)
          return (
            <li key={f.etiqueta}>
              <span className="barra-etiqueta">
                <span className="leyenda-color" style={{ background: f.color }} aria-hidden="true" />
                {f.etiqueta}
              </span>
              <span className="apilado-barra" aria-hidden="true">
                {f.segmentos.map((s) => (
                  <span key={s.nombre} style={{ width: `${(s.valor / total) * 100}%`, background: s.color }} title={`${s.nombre}: ${s.valor}`} />
                ))}
              </span>
              <span className="barra-valor">{total}</span>
            </li>
          )
        })}
      </ul>
      <Leyenda items={[...nombres].map(([nombre, color]) => ({ nombre, color }))} />
    </>
  )
}

export type DatosLinea = { duracionMs: number; puntos: { t: number; tipo: "herramienta" | "prompt" | "fin"; kind?: string; falla?: boolean }[] }

/** Una línea de tiempo con un carril por tipo de acción; los prompts cruzan todos los carriles y las fallas son marcas más altas. */
export function LineaDeTiempo({ datos }: { datos: DatosLinea }) {
  const carriles = [...new Set(datos.puntos.flatMap((p) => (p.tipo === "herramienta" ? [p.kind ?? "otro"] : [])))]
  const ancho = 1000
  const alto = 22
  const x = (t: number) => (datos.duracionMs === 0 ? 0 : (t / datos.duracionMs) * ancho)
  return (
    <div className="tabla-scroll">
      <div className="linea">
        <ul className="linea-carriles" aria-hidden="true">
          {carriles.map((c) => (
            <li key={c} style={{ height: alto }}>
              <span className="leyenda-color" style={{ background: colorKind(c) }} />
              {c}
            </li>
          ))}
        </ul>
        <svg viewBox={`0 0 ${ancho} ${Math.max(carriles.length, 1) * alto}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
          {carriles.map((c, i) => (
            <line key={c} x1="0" x2={ancho} y1={i * alto + alto} y2={i * alto + alto} stroke="var(--linea-suave)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}
          {datos.puntos.map((p, i) => {
            if (p.tipo === "herramienta") {
              const fila = carriles.indexOf(p.kind ?? "otro")
              return (
                <line key={i} x1={x(p.t)} x2={x(p.t)} y1={fila * alto + (p.falla ? 1 : 5)} y2={fila * alto + alto - 3} stroke={p.falla ? "var(--error)" : colorKind(p.kind ?? "otro")} strokeWidth={p.falla ? 4 : 3} vectorEffect="non-scaling-stroke" />
              )
            }
            return (
              <line key={i} x1={x(p.t)} x2={x(p.t)} y1="0" y2={carriles.length * alto} stroke="var(--texto)" strokeWidth="1.5" strokeDasharray={p.tipo === "prompt" ? "4 3" : undefined} vectorEffect="non-scaling-stroke" />
            )
          })}
        </svg>
      </div>
      <p className="serie-ejes">
        <span>0 s</span>
        <span>Línea punteada: prompt · línea llena: fin de turno · marca roja alta: falla</span>
        <span>{Math.round(datos.duracionMs / 1000)} s</span>
      </p>
    </div>
  )
}
