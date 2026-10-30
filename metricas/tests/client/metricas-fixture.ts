import type { MetricasAgentes } from "../../tipos"

/** Un snapshot completo con datos de los tres agentes; `extra` pisa lo que cada test necesite. */
export function metricasDePrueba(extra: Partial<MetricasAgentes> = {}): MetricasAgentes {
  return {
    generado: "2026-10-27T17:12:00.000Z",
    origen: "actual",
    filtros: {},
    vacio: false,
    kpis: { sesiones: 3, prompts: 5, herramientas: 17, fallas: 2, tasaFallas: 2 / 14, tiempoActivoMs: 125_000, caracteresDevueltos: 6_500, subagentesFinalizados: 2 },
    porTiempo: {
      pasoMin: 1,
      puntos: [
        { t: "2026-10-27T17:00:00.000Z", porAgente: { claude: 12, codex: 3 } },
        { t: "2026-10-27T17:01:00.000Z", porAgente: { codex: 8, cline: 2 } },
      ],
    },
    herramientas: [
      { nombre: "Bash", kind: "ejecutar", n: 4 },
      { nombre: "Read", kind: "leer", n: 2 },
    ],
    acciones: [
      { agente: "claude", kind: "ejecutar", n: 4 },
      { agente: "codex", kind: "escribir", n: 1 },
      { agente: "cline", kind: "leer", n: 1 },
    ],
    fallasPorHerramienta: [{ nombre: "Bash", n: 1 }],
    duraciones: [{ kind: "ejecutar", n: 3, p50Ms: 800, p95Ms: 1500 }],
    archivosLeidos: [{ nombre: "server/app.ts", n: 2 }],
    archivosEscritos: [{ nombre: "server/domain/horarios.ts", n: 1 }],
    binarios: [{ nombre: "npm test", n: 2 }],
    subagentes: [{ nombre: "Explore", n: 1 }],
    skills: [{ nombre: "speckit-plan", n: 1 }],
    mcp: [],
    modelos: [{ agente: "codex", modelo: "gpt-5-codex", n: 11 }],
    tokens: {
      disponible: true,
      total: { entrada: 1160, salida: 820, cacheLectura: 4000, cacheEscritura: 2400 },
      costo: { usd: 0.0157, parcial: true, sinPrecio: ["gpt-5-codex"] },
      porTiempo: {
        pasoMin: 1,
        puntos: [
          { t: "2026-10-27T17:00:00.000Z", porAgente: { claude: 6450 }, porTipo: { entrada: 150, salida: 300, cacheLectura: 4000, cacheEscritura: 2000 } },
          { t: "2026-10-27T17:01:00.000Z", porAgente: { claude: 1900, codex: 1200 }, porTipo: { entrada: 1200, salida: 550, cacheLectura: 800, cacheEscritura: 400 } },
        ],
      },
      porModelo: [
        { agente: "claude", modelo: "claude-sonnet-5-5", solicitudes: 2, entrada: 150, salida: 300, cacheLectura: 4000, cacheEscritura: 2000, costoUsd: 0.0117 },
        { agente: "claude", modelo: "claude-haiku-4-5-20251001", solicitudes: 1, entrada: 1000, salida: 500, cacheLectura: 0, cacheEscritura: 400, costoUsd: 0.004 },
        { agente: "codex", modelo: "gpt-5-codex", solicitudes: 2, entrada: 700, salida: 150, cacheLectura: 1800, cacheEscritura: 0, costoUsd: null },
      ],
      cambiosDeModelo: [{ sesion: "bb76875c", agente: "claude", t: "2026-10-27T17:01:10.000Z", de: "claude-sonnet-5-5", a: "claude-haiku-4-5-20251001" }],
    },
    sesiones: [
      { id: "bb76875c", agente: "claude", inicio: "2026-10-27T17:00:00.000Z", duracionMs: 641_000, activoMs: 41_000, prompts: 2, turnos: 2, herramientas: 10, fallas: 1, interrumpidas: 0, enCurso: false, tokens: { entrada: 1160, salida: 820, cacheLectura: 4000, cacheEscritura: 2400 }, costoUsd: 0.0157, costoParcial: true, modelos: ["claude-sonnet-5-5", "claude-haiku-4-5-20251001"], cambiosDeModelo: 1 },
      { id: "019a-cod", agente: "codex", inicio: "2026-10-27T17:01:40.000Z", duracionMs: 22_000, activoMs: 22_000, prompts: 2, turnos: 2, herramientas: 3, fallas: null, interrumpidas: 1, enCurso: false, tokens: null, costoUsd: null, costoParcial: false, modelos: [], cambiosDeModelo: 0 },
    ],
    enCurso: [],
    lineaDeTiempo: {
      sesion: "bb76875c",
      agente: "claude",
      duracionMs: 641_000,
      puntos: [
        { t: 1_000, tipo: "prompt" },
        { t: 5_000, tipo: "herramienta", kind: "ejecutar" },
        { t: 15_000, tipo: "herramienta", kind: "ejecutar", falla: true },
        { t: 30_000, tipo: "fin" },
      ],
    },
    ...extra,
  }
}
