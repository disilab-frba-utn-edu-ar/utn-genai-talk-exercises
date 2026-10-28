// Tipos de clasificar.mjs para importarlo desde TypeScript (el servidor del dashboard y los tests).
export type Clasificacion = {
  kind: "leer" | "escribir" | "ejecutar" | "buscar" | "skill" | "pregunta" | "mcp" | "otro"
  op?: string
  targets: string[]
  detail: string
}

export function clasificar(tool: unknown, rawInput: unknown): Clasificacion
export function desenvolver(value: unknown): unknown
export function adelgazar(value: unknown): unknown
export type ResultadoDeTests = { resultado: "rojo" | "verde" | "no detectado"; fallaron?: number; pasaron?: number; causa?: string }
export function resultadoDeTests(comando: unknown, salida: unknown): ResultadoDeTests | undefined
