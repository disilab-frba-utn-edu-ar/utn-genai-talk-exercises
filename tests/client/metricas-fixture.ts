import type { MetricasAgentes } from "@shared/types"

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
    sesiones: [
      { id: "bb76875c", agente: "claude", inicio: "2026-10-27T17:00:00.000Z", duracionMs: 641_000, activoMs: 41_000, prompts: 2, turnos: 2, herramientas: 10, fallas: 1, interrumpidas: 0, enCurso: false },
      { id: "019a-cod", agente: "codex", inicio: "2026-10-27T17:01:40.000Z", duracionMs: 22_000, activoMs: 22_000, prompts: 2, turnos: 2, herramientas: 3, fallas: null, interrumpidas: 1, enCurso: false },
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
