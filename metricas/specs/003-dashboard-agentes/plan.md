# Implementation Plan: Métricas de agentes

**Spec**: [spec.md](spec.md)

## Constitution Check

| Principio | Cumplimiento |
|---|---|
| I Test-First | Cada fase empieza con su test en rojo: dominio, repositorio, API (supertest + SSE), cliente |
| II Capas | `routes/metricas-agentes.ts → services/ → repositories/logs-agentes.ts → domain/metricas-agentes.ts`; `domain` es puro y no importa `fs` |
| III Contrato | `/api/metricas-agentes` (plural, kebab-case), errores `{ error }` con 400 |
| IV Privacidad | El servicio arma una vista pública explícita (FR-002) |
| V Identificadores | No se crean entidades |
| VI Frontend liviano | Sin librerías; `fetch`/`EventSource` solo en `metricas/app/api.ts` (igual que `ejercicios/app/api.ts`); estados cargando, error y vacío |
| VII Accesible y responsive | `<figure>` con tabla alternativa; `aria-live` solo para cambios de conexión |
| VIII Calidad | lint y typecheck |

## Diseño

```
shared/types.ts                         ← MetricasAgentes, FiltrosMetricas, OrigenLogs
scripts/agent-logs/clasificar.d.mts     ← tipos para importar clasificar.mjs desde TS
server/domain/metricas-agentes.ts       ← puro: (entradas, filtros, ahora, raiz) → MetricasAgentes
server/repositories/logs-agentes.ts     ← IO: lector incremental por offset, orígenes
server/services/metricas-agentes.ts     ← estado, vigilancia (fs.watch + polling), suscriptores
server/routes/metricas-agentes.ts       ← GET / · GET /origenes · GET /eventos (SSE) · soloLoopback
metricas/app/                           ← UI separada del producto (como ejercicios/app)
```

- **Contrato**: `GET /api/metricas-agentes?origen=actual|archivo/<fecha>&agente=&sesion=&ventana=&detalle=1`, `/origenes`, `/eventos` (SSE). 400 con filtros inválidos.
- **Orígenes**: `actual` es `logs/` sin `archivo/`; `archivo/<fecha>` solo se acepta si la carpeta existe en el listado (nada de rutas arbitrarias).
- **Vigilancia**: un solo ticker por proceso, arrancado con el primer cliente SSE y cerrado con el último. `fs.watch(recursive)` es solo un disparador con debounce; el polling (2 s, configurable en tests) cubre lo que `fs.watch` pierde.
- **Emparejamiento Pre/Post**: por `toolUseId`; sin él, no se calculan duraciones de Codex y las pendientes se cuentan.
- **Detalle**: parámetro `detalle=1` que manda el toggle de la UI; sin env vars nuevas.
- **Red**: `server/index.ts` escucha en `127.0.0.1`; `vite.config.ts` usa `server.host` y proxy `127.0.0.1`.

## Tokens, modelos y costo (C7)

- `server/domain/uso-tokens.ts` (puro): parsers de línea de Claude y Codex, parser del array de Cline, normalización a `UsoTokens` y cálculo de costo con la tabla de precios inyectada. Solo toma modelo, tokens y timestamp.
- `server/repositories/transcripciones-agentes.ts` (IO): ubica y lee de forma incremental las transcripciones (por `transcriptPath` o por los lugares estándar, dentro de las raíces permitidas) y reutiliza la lectura por offset de `lectura-incremental.ts`.
- `metricas/precios-modelos.json`: tabla de precios; el servicio la inyecta al dominio.
- El dominio suma `tokens` (total, por tiempo, por modelo), `modelos` y los campos de sesión (`modelos`, `cambiosDeModelo`, `tokens`, `costoUsd`).
- El hook guarda `transcriptPath` (opcional).

## Fases

C0 specs · C1 hook y clasificar · C2 dominio · C3 repositorio, servicio y rutas · C4 cliente MVP · C5 gráficos restantes · C6 verificación, README y consigna 01 · C7 tokens, modelos y costo (fuentes, fixtures, parsers, repositorio, API y UI).
