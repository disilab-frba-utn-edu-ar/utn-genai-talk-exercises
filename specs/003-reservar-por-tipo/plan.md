# Implementation Plan: Reservar por tipo de asesoría, sin elegir mentora

**Branch**: `003-reservar-por-tipo` | **Date**: 2026-10-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-reservar-por-tipo/spec.md`

## Summary

Un segundo camino de reserva: el colectivo elige el tipo de asesoría y ve la unión de
los horarios libres de todas las mentoras que pueden darlo. Al elegir un horario, la
plataforma le asigna la mentora libre con menos sesiones confirmadas en los próximos 14
días (empate → orden alfabético) y se la muestra; al confirmar se reutiliza el
`POST /api/sesiones` existente con esa mentora. Si al confirmar la mentora ya no está
libre, se le muestra la nueva asignación y se pide confirmar de nuevo (ver
[research.md](./research.md)). No cambian las entidades persistidas.

## Technical Context

**Language/Version**: TypeScript 5 · Node.js 20+
**Primary Dependencies**: Express 5 (server), React 19 + React Router 7 + Vite 7 (client); sin dependencias nuevas
**Storage**: archivos JSON en `DATA_DIR` (sin cambios de esquema)
**Testing**: Vitest · supertest (API) · Testing Library + jsdom (cliente)
**Target Platform**: navegador moderno + Node.js
**Project Type**: web app (client + server en un solo repo)
**Performance Goals**: la disponibilidad por tipo responde al instante con datos locales (decenas de mentoras × 14 días)
**Constraints**: sin base de datos ni servicios externos; reutilizar `calcularDiasDisponibles`, `estaDentroDeDisponibilidad`, `haySuperposicion` y `puedeDar`
**Scale/Scope**: 2 endpoints nuevos, 1 página nueva, 1 enlace en la portada

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Test-First** — tests de dominio (`asignacion.test.ts`), de API y de cliente antes de cada implementación; tests de API con `DATA_DIR` temporal
- [x] **II. Capas** — `domain/asignacion.ts` puro; `services/reserva-por-tipo.ts` orquesta repositorios y dominio; `routes/tipos-asesoria.ts` solo HTTP
- [x] **III. Contrato de API** — recursos plural kebab-case bajo `/api/tipos-asesoria/:id/…`; `400/404/409` con `{ error }` en español; el servidor valida `fecha` y `horaInicio` — ver [contracts/api.md](./contracts/api.md)
- [x] **IV. Privacidad** — la asignación devuelve `MentoraPublica` (sin `contacto`); la disponibilidad por tipo no dice qué mentora cubre cada horario
- [x] **V. Identificadores** — la sesión se crea con el `POST` existente (`crypto.randomUUID()`); tipos por código snake_case
- [x] **VI. Frontend liviano** — fetch nuevo solo en `client/src/api/client.ts`; se reutilizan los componentes de pasos; estados cargando/error/vacío en tipos, días y asignación
- [x] **VII. Accesible y responsive** — mismos componentes accesibles; aviso de cambio de mentora con `role="alert"`; layout fluido a 375px
- [x] **VIII. Calidad** — `npm run lint` y `npm run typecheck` en verde antes de cerrar

Re-check post diseño: sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/003-reservar-por-tipo/
├── spec.md
├── plan.md              # este archivo
├── research.md          # R1–R7
├── data-model.md        # conceptos derivados y regla de reparto
├── quickstart.md
├── contracts/api.md     # 2 endpoints nuevos
├── checklists/requirements.md
└── tasks.md             # salida de /speckit-tasks (todavía no existe)
```

### Source Code (repository root)

```text
server/
├── app.ts                         # monta rutasTiposAsesoria en /tipos-asesoria
├── domain/
│   └── asignacion.ts              # NUEVO: unirDiasDisponibles, elegirMentora
├── services/
│   └── reserva-por-tipo.ts        # NUEVO: disponibilidad(tipoId), asignar(tipoId, fecha, horaInicio)
└── routes/
    └── tipos-asesoria.ts          # NUEVO: GET /:id/disponibilidad, GET /:id/asignacion

client/src/
├── App.tsx                        # ruta /reservar-por-tipo
├── api/client.ts                  # disponibilidadPorTipo, asignacion
├── components/
│   └── MentoraAsignada.tsx        # NUEVO: nombre, pronombres, presentación (+ aviso de cambio)
├── pages/
│   ├── InicioPage.tsx             # enlace "¿No sabés a quién elegir?…"
│   └── ReservaPorTipoPage.tsx     # NUEVO: tipo → día → horario → mentora asignada → datos
└── styles.css                     # estilos de MentoraAsignada y del enlace

tests/
├── server/domain/asignacion.test.ts      # NUEVO
├── server/api/reserva-por-tipo.test.ts   # NUEVO
└── client/ReservaPorTipoPage.test.tsx    # NUEVO
```

**Structure Decision**: se mantiene la estructura de la feature 001. La lógica nueva va
en un módulo de dominio propio (`asignacion.ts`) y un servicio propio, para no mezclar el
reparto con la reserva por mentora; `services/sesiones.ts` no cambia. `ConfirmacionPage`
se reutiliza tal cual con el mismo `EstadoConfirmacion`.

## Complexity Tracking

Sin violaciones a justificar.
