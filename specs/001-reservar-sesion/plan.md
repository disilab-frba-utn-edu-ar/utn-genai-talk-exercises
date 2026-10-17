# Implementation Plan: Reservar una sesión de mentoría

**Branch**: `001-reservar-sesion` | **Date**: 2026-10-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-reservar-sesion/spec.md`

## Summary

Base full stack de Mentorías a Voluntad: un listado de mentoras filtrable por
habilidad y un flujo de reserva en pasos (tipo de asesoría → día → horario →
datos → confirmación). El servidor Express expone una API JSON en capas sobre
archivos JSON; el cliente React (Vite) la consume. Los horarios libres se
calculan en el dominio a partir de la disponibilidad semanal y las sesiones
confirmadas (ver [research.md](./research.md)).

## Technical Context

**Language/Version**: TypeScript 5 · Node.js 20+
**Primary Dependencies**: Express 5 (server), React 19 + React Router 7 + Vite 7 (client), tsx (ejecución TS en dev)
**Storage**: archivos JSON en `data/` (configurable con `DATA_DIR`)
**Testing**: Vitest · supertest (API) · Testing Library + jsdom (cliente)
**Target Platform**: navegador moderno + Node.js
**Project Type**: web app (client + server en un solo repo)
**Performance Goals**: el flujo responde al instante con datos locales; `npm run dev` levanta en < 5 s
**Constraints**: sin base de datos ni servicios externos; un solo `npm install`
**Scale/Scope**: decenas de mentoras y cientos de sesiones; 3 pantallas

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Test-First** — tasks.md ordena los tests antes de cada implementación
- [x] **II. Capas** — routes → services → repositories → domain; `domain/` sin IO
- [x] **III. Contrato de API** — ver [contracts/api.md](./contracts/api.md)
- [x] **IV. Privacidad** — `contacto` de la mentora se descarta en el servicio (vista pública)
- [x] **V. Identificadores** — sesiones con `crypto.randomUUID()`; catálogos con código snake_case
- [x] **VI. Frontend liviano** — CSS plano, fetch solo en `client/src/api/`, estados cargando/error/vacío
- [x] **VII. Accesible y responsive** — formularios con labels, chips como botones con `aria-pressed`, layout fluido
- [x] **VIII. Calidad** — ESLint + `tsc --noEmit` en `npm run lint` / `npm run typecheck`

Re-check post diseño: sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/001-reservar-sesion/
├── spec.md
├── plan.md              # este archivo
├── research.md          # decisiones técnicas
├── data-model.md        # entidades y archivos JSON
├── contracts/api.md     # contrato HTTP
└── tasks.md             # tareas (salida de /speckit-tasks)
```

### Source Code (repository root)

```text
shared/
└── types.ts                 # tipos compartidos client/server

server/
├── index.ts                 # arranca Express (puerto 3001)
├── app.ts                   # createApp(): middlewares + rutas (testeable)
├── config.ts                # DATA_DIR, PORT
├── routes/                  # habilidades, tipos-asesoria, colectivos, mentoras, sesiones, health
├── services/                # catalogos, mentoras, sesiones (+ errores de dominio → HTTP)
├── repositories/            # json-store + un repositorio por archivo
└── domain/                  # horarios.ts, mentoras.ts, validaciones.ts, fechas.ts

client/
├── index.html
└── src/
    ├── main.tsx, App.tsx, styles.css
    ├── api/                 # cliente HTTP (único lugar con fetch)
    ├── components/          # Layout, MentoraCard, Chip, Estado, pasos de la reserva
    └── pages/               # InicioPage, ReservaPage, ConfirmacionPage, NoEncontradaPage

data/                        # habilidades, tipos-asesoria, mentoras, colectivos (+ sesiones.json, no versionado)
scripts/seed.mjs             # genera sesiones de ejemplo en los próximos días

tests/
├── server/domain/
├── server/api/
└── client/
```

**Structure Decision**: web app en un solo paquete npm para que `npm install` +
`npm run dev` alcancen. Vite sirve el cliente en `:5173` con proxy de `/api` al
servidor en `:3001`. En producción (`npm start`) Express sirve también `dist/`.

## Complexity Tracking

Sin violaciones a justificar.
