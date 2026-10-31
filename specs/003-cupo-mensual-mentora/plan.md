# Implementation Plan: Cupo mensual de horas por mentora

**Branch**: `003-cupo-mensual-mentora` | **Date**: 2026-10-31 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-cupo-mensual-mentora/spec.md`

## Summary

Cada mentora puede tener un `cupoMensualHoras` en `data/mentoras.json`. Una regla pura en
`server/domain/cupo.ts` calcula las horas consumidas (sesiones confirmadas que empiezan en el mes
calendario) y las restantes. El cálculo de horarios deja de ofrecer asesorías que no entran en lo
que queda, `POST /api/sesiones` responde `409` si la reserva excede el cupo, y la vista pública de
la mentora expone solo `horasRestantes` (nunca el cupo total). El cliente muestra "Le quedan N h
este mes" o "Sin cupo este mes" en la tarjeta y en la página de reserva. No hay pantalla para
editar el cupo ni archivos nuevos en `data/`.

## Technical Context

**Language/Version**: TypeScript (Node + React), igual que el resto del repo
**Primary Dependencies**: Express, React, Vite, React Router (sin dependencias nuevas)
**Storage**: archivos JSON en `DATA_DIR`; el cupo es un campo nuevo y opcional de `mentoras.json`
**Testing**: Vitest + supertest + Testing Library, en `tests/server/domain`, `tests/server/api` y `tests/client`
**Target Platform**: servidor Node local + navegador
**Project Type**: web (client + server en un repo)
**Performance Goals**: sin objetivos nuevos; el cálculo recorre las sesiones de una mentora (decenas)
**Constraints**: el servidor es de un solo proceso y las escrituras de `crear` son síncronas, así que
la verificación de cupo y el alta de la sesión no se pueden intercalar (ver research.md, D4)
**Scale/Scope**: 6 mentoras, un campo nuevo, un módulo de dominio, 2 endpoints existentes ajustados

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Test-First** — tests de dominio (`cupo`, `horarios`), de API (`mentoras`, `sesiones`) y de cliente (tarjeta, reserva) se escriben primero y en rojo (ver tasks)
- [x] **II. Capas** — la regla vive en `server/domain/cupo.ts` (sin IO, sin Express); el servicio orquesta; las rutas no cambian
- [x] **III. Contrato de API** — mismos recursos; el rechazo es `409 { error }` en español
- [x] **IV. Privacidad** — la vista pública expone `horasRestantes`, no `cupoMensualHoras` ni `contacto`
- [x] **V. Identificadores** — no se crean entidades nuevas
- [x] **VI. Frontend liviano** — dos componentes chicos tocados; sin `fetch` nuevo fuera de `client/src/api/`; estados ya cubiertos
- [x] **VII. Accesible y responsive** — texto plano en el flujo normal, sin color como único indicador
- [x] **VIII. Calidad** — `lint` y `typecheck` en verde; sin `any`

**Post-diseño**: sin violaciones. No hace falta Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/003-cupo-mensual-mentora/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/api.md
└── tasks.md             # lo genera /speckit-tasks
```

### Source Code (repository root)

```text
shared/types.ts                      # Mentora.cupoMensualHoras?, MentoraPublica.horasRestantes?
server/domain/cupo.ts                # NUEVO: minutos consumidos/restantes por mes, ¿entra?
server/domain/horarios.ts            # calcularHorarios/calcularDiasDisponibles reciben el cupo
server/domain/mentoras.ts            # aMentoraPublica agrega horasRestantes y descarta el cupo
server/domain/validaciones.ts        # (sin cambios; el cupo viene de data/, no de la API)
server/services/mentoras.ts          # pasa cupo y reloj al dominio
server/services/sesiones.ts          # 409 si la reserva no entra en el cupo
data/mentoras.json                   # se suma cupoMensualHoras a algunas mentoras
client/src/components/MentoraCard.tsx
client/src/components/CupoMensual.tsx   # NUEVO: el texto "Le quedan N h…" / "Sin cupo…"
client/src/pages/ReservaPage.tsx
tests/server/domain/cupo.test.ts            # NUEVO
tests/server/domain/horarios.test.ts
tests/server/api/{mentoras,sesiones}.test.ts
tests/client/{InicioPage,ReservaPage}.test.tsx + fixtures.ts
```

**Structure Decision**: se mantiene la estructura en capas existente. Lo único nuevo es un módulo
de dominio y un componente de presentación. `.gitignore` no cambia: no se agregan archivos a `data/`.

## Complexity Tracking

Sin violaciones que justificar.
