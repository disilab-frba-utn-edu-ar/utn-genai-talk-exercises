---
description: "Task list — Reservar una sesión de mentoría"
---

# Tasks: Reservar una sesión de mentoría

**Input**: Design documents from `specs/001-reservar-sesion/`
**Prerequisites**: plan.md ✅ · spec.md ✅ · research.md ✅ · data-model.md ✅ · contracts/api.md ✅

**TDD obligatorio** (Constitution I): cada test se escribe y se ve FALLAR antes de
implementar el código correspondiente.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: puede hacerse en paralelo (archivos distintos, sin dependencias pendientes)
- **[US1]** Explorar mentoras · **[US2]** Reservar sesión · **[US3]** Mentora sin lugar

---

## Phase 1: Setup

- [x] T001 Crear `package.json` con scripts `dev`, `build`, `start`, `test`, `lint`, `typecheck`, `seed`
- [x] T002 [P] Configurar TypeScript (`tsconfig.json`) con alias `@shared/*`
- [x] T003 [P] Configurar Vite (`vite.config.ts`, root `client/`, proxy `/api` → `:3001`)
- [x] T004 [P] Configurar Vitest (`vitest.config.ts`: node por defecto, jsdom en `tests/client/`) y ESLint (`eslint.config.js`)
- [x] T005 Crear estructura `shared/`, `server/{routes,services,repositories,domain}`, `client/src/{api,components,pages}`, `tests/{server/domain,server/api,client}`

## Phase 2: Foundational (bloquea todas las historias)

- [x] T006 Definir tipos en `shared/types.ts` según data-model.md
- [x] T007 [P] Cargar datos de ejemplo: `data/habilidades.json`, `data/tipos-asesoria.json`, `data/mentoras.json`, `data/colectivos.json`
- [x] T008 [P] `scripts/seed.mjs`: generar `data/sesiones.json` con sesiones en los próximos días (`--si-falta` para `predev`)
- [x] T009 [P] Test de `domain/fechas.ts` (día de la semana, sumar días, minutos ↔ HH:MM) en `tests/server/domain/fechas.test.ts`
- [x] T010 Implementar `server/domain/fechas.ts`
- [x] T011 `server/repositories/json-store.ts` (lee/escribe en `DATA_DIR`) y un repositorio por colección
- [x] T012 `server/app.ts` (`createApp`), `server/index.ts`, `GET /api/health`, manejo de errores `{ error }` y 404 de API
- [x] T013 Helper de tests `tests/server/api/helpers.ts`: copia `data/` a un directorio temporal y crea la app con ese `DATA_DIR`
- [x] T014 [P] Cliente HTTP `client/src/api/client.ts` (único lugar con `fetch`, errores tipados)
- [x] T015 [P] `client/src/styles.css`, `Layout`, `Estado` (cargando/error/vacío) y ruteo en `App.tsx` con página 404

## Phase 3: US1 — Explorar mentoras por habilidad (P1) 🎯

- [x] T016 [P] [US1] Test de dominio `puedeDar` y `tiposQuePuedeDar` en `tests/server/domain/mentoras.test.ts`
- [x] T017 [P] [US1] Test de API: catálogos, `GET /api/mentoras` (con y sin `habilidad`), `GET /api/mentoras/:id`, y que **ninguna** respuesta incluya `contacto` en `tests/server/api/mentoras.test.ts`
- [x] T018 [US1] Implementar `server/domain/mentoras.ts`
- [x] T019 [US1] Implementar `services/catalogos.ts`, `services/mentoras.ts` (vista pública) y sus rutas
- [x] T020 [P] [US1] Test de `InicioPage` (lista, filtro, vacío) en `tests/client/InicioPage.test.tsx`
- [x] T021 [US1] Implementar `MentoraCard`, `Chip` e `InicioPage`

**Checkpoint**: el listado y el filtro funcionan de punta a punta.

## Phase 4: US2 — Reservar una sesión (P1) 🎯

- [x] T022 [P] [US2] Test de `calcularHorarios` (paso de 30', duración, superposición, día sin disponibilidad, horarios pasados de hoy) en `tests/server/domain/horarios.test.ts`
- [x] T023 [P] [US2] Test de `validarNuevaSesion` en `tests/server/domain/validaciones.test.ts`
- [x] T024 [US2] Implementar `server/domain/horarios.ts` y `server/domain/validaciones.ts`
- [x] T025 [P] [US2] Test de API `GET /api/mentoras/:id/disponibilidad` y `POST /api/sesiones` (201, 400, 404, 409 mismo inicio) en `tests/server/api/sesiones.test.ts`
- [x] T026 [US2] Implementar `services/sesiones.ts` y rutas `GET/POST /api/sesiones`, `GET /api/mentoras/:id/disponibilidad`
- [x] T027 [P] [US2] Test de `FormularioContacto` (botón deshabilitado hasta completar, email inválido) en `tests/client/FormularioContacto.test.tsx`
- [x] T028 [US2] Implementar pasos de la reserva (`SelectorTipo`, `SelectorDia`, `SelectorHorario`, `FormularioContacto`) y `ReservaPage`
- [x] T029 [US2] Implementar `ConfirmacionPage` (resumen desde el estado de navegación; sin estado → inicio)
- [x] T030 [US2] Conflicto al confirmar (409): mostrar el error y recargar los horarios del día

**Checkpoint**: se puede reservar y el horario deja de ofrecerse.

## Phase 5: US3 — Mentora sin lugar (P2)

- [x] T031 [US3] Test: `ReservaPage` muestra "no hay lugar en los próximos 14 días" con enlace al listado en `tests/client/ReservaPage.test.tsx`
- [x] T032 [US3] Implementar el estado vacío de `SelectorDia`

## Phase 6: Polish

- [x] T033 [P] Revisar accesibilidad: labels, foco visible, `aria-pressed` en chips, `aria-live` en errores
- [x] T034 [P] Revisar responsive a 375px
- [x] T035 `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` en verde
- [x] T036 README con cómo levantar el proyecto

## Notas para quien siga

- ✅ El chequeo de conflicto de `POST /api/sesiones` ya detecta superposiciones
  parciales (no solo la misma hora de inicio) mediante `domain/superposicion.ts`
  (`haySuperposicion`). Ver tests en `tests/server/domain/superposicion.test.ts`
  y `tests/server/api/sesiones.test.ts`.
