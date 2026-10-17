# BarberApp — Ejercicios de desarrollo con agentes de IA

Ejercicios prácticos de la charla **«El proceso del diseño empleando IA
Generativa»** (UTN). Se trabaja sobre **BarberApp**, una app de turnos para una
barbería hecha con Next.js 16, TypeScript, shadcn/ui y Vitest, con los datos en
archivos JSON (`data/`).

Los ejercicios funcionan con **Claude Code**, **Codex CLI** o **Cline**.

| # | Ejercicio | Tema de la charla | Duración |
|---|---|---|---|
| 1 | [Observar al agente con hooks](ejercicios/01-observabilidad-con-hooks/README.md) | Ciclo agéntico · herramientas · harness | 45-60 min |
| 2 | [Escribir una skill y conectar un MCP](ejercicios/02-skill-y-mcp/README.md) | Skills · context engineering | 1-1,5 h |
| 3 | [Implementar una feature con SDD](ejercicios/03-sdd/README.md) | Spec-Driven Development | 2-3 h |

Los ejercicios se encadenan: los hooks del ejercicio 1 quedan activos y sus
logs son la evidencia con la que se responden las preguntas de los tres.

## Arrancar

Requisitos: Node.js 20+, git y uno de los agentes.

```bash
npm install
npm test        # tests unitarios (Vitest)
npm run dev     # http://localhost:3000
```

## Comandos útiles

| Comando | Qué hace |
|---|---|
| `npm test` / `npm run lint` / `npm run build` | Validación local |
| `npm run logs:resumen` | Resumen de la última sesión del agente (herramientas, comandos, archivos) |
| `npm run logs:resumen -- --todas` | Resumen de todas las sesiones registradas |
| `npm run logs:timeline` | Resumen + línea de tiempo paso a paso |
| `npm run logs:limpiar` | Borra `logs/agent-actions.jsonl` |

## Mapa del repo

```
app/, components/, lib/     ← la aplicación
data/                        ← "base de datos" en JSON
tests/                       ← tests unitarios y e2e
specs/001-…/                 ← ejemplo de una feature hecha con SDD
.specify/                    ← Spec Kit (constitution, templates, scripts)
.claude/settings.json        ← hooks de Claude Code
.codex/hooks.json            ← hooks de Codex
.clinerules/hooks/           ← hooks de Cline (un script por evento)
.claude/skills/, .agents/skills/  ← skills (Claude/Cline y Codex)
scripts/agent-logs/          ← logger común de los hooks + resumen
ejercicios/                  ← consignas, prompts y plantillas de respuesta
AGENTS.md / CLAUDE.md        ← instrucciones permanentes para el agente
```
