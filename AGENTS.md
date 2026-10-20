# Mentorías a Voluntad — instrucciones para agentes

Colectivos (fundaciones, ONGs, asambleas) reservan sesiones con personas mentoras que
donan horas de asesoramiento. App full stack liviana en un solo repo.

## Antes de tocar código

- Leé `.specify/memory/constitution.md`: dominio, restricciones y principios no negociables.
- La feature base está especificada en `specs/001-reservar-sesion/` (spec, plan, contrato, tasks).
- Features nuevas: seguí el flujo de Spec Kit (`specify → clarify → plan → tasks → implement`).

## Mapa

- `shared/types.ts` — tipos compartidos client/server.
- `server/` — Express en capas: `routes/ → services/ → repositories/ → domain/`. `domain/` es puro (sin IO).
- `client/src/` — React + Vite + React Router. Todo `fetch` vive en `client/src/api/`.
- `ejercicios/` — consignas de la charla en JSON y su visor en `/ejercicios`. No es parte del producto.
- `data/` — archivos JSON. `data/sesiones.json` no se versiona: se genera con `npm run seed`.
- `tests/server/{domain,api}` y `tests/client` — Vitest; los tests de API usan un `DATA_DIR` temporal (ver `tests/server/api/helpers.ts`). Nunca escribas en `data/` desde un test.

## Comandos

- `npm run dev` — API en :3001 y web en http://localhost:5173
- `npm test` · `npm run lint` · `npm run typecheck` · `npm run build`

Antes de dar una tarea por terminada, corré `npm test`, `npm run lint` y `npm run typecheck`.
