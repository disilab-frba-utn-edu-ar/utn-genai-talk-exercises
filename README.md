# Mentorías a Voluntad — Ejercicios de desarrollo con agentes de IA

Proyecto de práctica de la charla **«El proceso del diseño empleando IA
Generativa»** (UTN FRBA). Es un sistema hermano del TP **Código a Voluntad**:
acá, personas mentoras **donan horas de asesoramiento** y los colectivos
(fundaciones, ONGs, asambleas, asociaciones barriales) **reservan sesiones**
para destrabar sus proyectos de software.

La base del proyecto se construyó con **Spec-Driven Development**: la
constitution está en `.specify/memory/constitution.md` y la spec, el plan y las
tareas de la primera feature en [`specs/001-reservar-sesion/`](specs/001-reservar-sesion/).

## Arrancar

Requisitos: Node.js 20+ y git.

```bash
npm install
npm run dev     # API en :3001 · web en http://localhost:5173
```

`npm run dev` genera sesiones de ejemplo la primera vez. Para volver a los datos
iniciales: `npm run seed`.

## Ejercicios

Funcionan con **Claude Code**, **Codex CLI** o **Cline**. Las consignas están en
`ejercicios/` (JSON) y se leen en la app: `npm run dev` →
http://localhost:5173/ejercicios. Las respuestas se guardan desde ahí en
`ejercicios/<ejercicio>/respuestas.json`.

| # | Ejercicio | Tema de la charla |
|---|---|---|
| 1 | [Observar al agente con hooks](http://localhost:5173/ejercicios/01-observabilidad-con-hooks) | Ciclo agéntico · herramientas · harness |
| 2 | [Escribir una skill y conectar un MCP](http://localhost:5173/ejercicios/02-skill-y-mcp) | Skills · context engineering |
| 3 | [Implementar una feature con SDD](http://localhost:5173/ejercicios/03-sdd) | Spec-Driven Development |

## Stack

| Capa | Tecnología |
|---|---|
| Cliente | Vite + React 19 + React Router · CSS plano |
| Servidor | Express 5 + TypeScript (tsx) en capas: routes → services → repositories → domain |
| Datos | Archivos JSON en `data/` |
| Tests | Vitest · supertest · Testing Library |

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Levanta API y web con recarga en caliente |
| `npm test` | Tests de dominio, API y cliente |
| `npm run lint` / `npm run typecheck` | ESLint y TypeScript |
| `npm run build` y `npm start` | Compila el cliente y lo sirve desde Express en :3001 |
| `npm run seed` | Regenera `data/sesiones.json` con sesiones en los próximos días |
| `npm run logs:resumen` / `logs:timeline` / `logs:limpiar` | Logs de los agentes (ejercicios) |

## API

| Método | Ruta | |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/habilidades` · `/api/tipos-asesoria` · `/api/colectivos` | Catálogos |
| GET | `/api/mentoras?habilidad=<codigo>` | Mentoras (sin datos de contacto) |
| GET | `/api/mentoras/:id` | Una mentora |
| GET | `/api/mentoras/:id/disponibilidad?tipoAsesoriaId=<id>` | Días y horarios libres de los próximos 14 días |
| GET | `/api/sesiones?mentoraId=&fecha=` | Sesiones (sin datos de contacto) |
| POST | `/api/sesiones` | Reservar una sesión |

Contrato completo: [`specs/001-reservar-sesion/contracts/api.md`](specs/001-reservar-sesion/contracts/api.md).

## Mapa del repo

```
client/src/        ← React: pages/, components/, api/ (único lugar con fetch), hooks/
server/            ← Express: routes/ → services/ → repositories/ → domain/
shared/types.ts    ← tipos compartidos
data/              ← "base de datos" en JSON
tests/             ← server/domain · server/api · client
specs/001-…/       ← la feature base hecha con SDD (ejemplo)
.specify/          ← Spec Kit (constitution, templates, scripts)
.claude/ .codex/ .clinerules/  ← hooks de logs para cada agente
scripts/           ← seed y logger de los hooks
ejercicios/        ← consignas en JSON + su visor (/ejercicios), fuera del producto
AGENTS.md / CLAUDE.md  ← instrucciones permanentes para los agentes
```
