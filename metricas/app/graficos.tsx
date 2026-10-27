// Gráficos propios, sin librerías: reciben datos ya calculados por el servidor y solo dibujan.
// Cada gráfico es una <figure> con su botón "Ver como tabla" (sirve también a lectores de pantalla).
import { useId, useState, type ReactNode } from "react"
import type { AgenteLog } from "@shared/types"
import { AGENTES, hora } from "./formato"

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

/** Eventos por tramo de tiempo, apilados por agente. */
export function GraficoSerie({ puntos }: { puntos: { t: string; porAgente: Partial<Record<AgenteLog, number>> }[] }) {
  const AGENTES_ORDEN: AgenteLog[] = ["claude", "codex", "cline"]
  const total = (p: (typeof puntos)[number]) => AGENTES_ORDEN.reduce((n, a) => n + (p.porAgente[a] ?? 0), 0)
  const max = Math.max(...puntos.map(total), 1)
  const ancho = 12
  const alto = 120
  const presentes = AGENTES_ORDEN.filter((a) => puntos.some((p) => p.porAgente[a]))
  return (
    <div className="serie">
      <svg viewBox={`0 0 ${puntos.length * ancho} ${alto}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
        {puntos.map((p, i) => {
          let y = alto
          return (
            <g key={p.t}>
              {AGENTES_ORDEN.map((a) => {
                const n = p.porAgente[a] ?? 0
                if (!n) return null
                const h = (n / max) * (alto - 2)
                y -= h
                return <rect key={a} x={i * ancho + 1} y={y} width={ancho - 2} height={h} fill={colorAgente(a)} stroke="var(--superficie)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              })}
            </g>
          )
        })}
      </svg>
      <div className="serie-ejes">
        <span>{hora(puntos[0].t)}</span>
        <span>máx. {max} por tramo</span>
        <span>{hora(puntos.at(-1)!.t)}</span>
      </div>
      <Leyenda items={presentes.map((a) => ({ nombre: AGENTES[a], color: colorAgente(a) }))} />
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
