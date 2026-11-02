# Implementation Plan: Cancelar una sesión reservada

**Branch**: `004-cancelar-sesion` | **Date**: 2026-11-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-cancelar-sesion/spec.md`

## Summary

El colectivo cancela una sesión desde su enlace propio (`/sesiones/:id`), hasta 24 h
antes del inicio (24 h exactas incluidas), con un motivo opcional. La regla vive en una
función pura `evaluarCancelacion(sesion, ahora)` en `server/domain/`, que interpreta el
inicio en hora de Argentina y lo compara con el instante recibido. La API suma un
`PATCH /api/sesiones/:id` y amplía `GET /api/sesiones/:id` para que diga de antemano si
se puede cancelar. Después de reservar, el cliente navega directo a la página de la
sesión, que reemplaza a `/confirmacion`. La sesión cancelada deja de ocupar el horario
sin cambios en el cálculo de disponibilidad (ver [research.md](./research.md)).

## Technical Context

**Language/Version**: TypeScript 5 · Node.js ≥ 22.12
**Primary Dependencies**: Express 5, React 19 + React Router 7 + Vite 8. Sin dependencias nuevas.
**Storage**: `sesiones.json` en `DATA_DIR`; dos campos opcionales nuevos en `Sesion`. Sin archivos nuevos y sin tocar `data/`.
**Testing**: Vitest · supertest con `DATA_DIR` temporal · Testing Library + jsdom
**Target Platform**: navegador moderno + Node.js
**Project Type**: web app (client + server en un solo repo)
**Performance Goals**: ver y cancelar responden al instante con datos locales (SC-001: < 1 min, ≤ 3 interacciones)
**Constraints**: plazo calculado en UTC−3 sin depender de la zona horaria del servidor; tests independientes de la zona de la máquina
**Scale/Scope**: cientos de sesiones; 1 pantalla nueva, 1 endpoint nuevo, 2 endpoints modificados

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Test-First**: cada capa arranca con su test en rojo: `tests/server/domain/cancelacion.test.ts`, `tests/server/api/sesiones.test.ts`, `tests/client/SesionPage.test.tsx`. Los de API usan `crearAppDePrueba` (DATA_DIR temporal) y un reloj con offset explícito.
- [x] **II. Capas**: `routes/sesiones.ts` (parsea, `PATCH /:id`) → `services/sesiones.ts` (`obtener`, `cancelar`) → `repositories/` (`sesiones.actualizar`) → `domain/` (`cancelacion.ts`, `fechas.instanteEnArgentina`, `validaciones.validarCancelacion`). El dominio recibe `ahora` por parámetro.
- [x] **III. Contrato de API**: `/api/sesiones/:id`, JSON, errores en español. 400 cuerpo, 404 inexistente, 409 estado o plazo. Ver [contracts/api.md](./contracts/api.md).
- [x] **IV. Privacidad**: GET y PATCH devuelven `SesionDetalle` sin contacto. El listado deja de exponer `id` (es la credencial del enlace) y nunca muestra el motivo (FR-009).
- [x] **V. Identificadores**: el enlace es el UUID v4 que ya genera el servidor.
- [x] **VI. Frontend liviano**: `api.sesion` y `api.cancelarSesion` en `client/src/api/client.ts`; `SesionPage` con estados cargando, error y no encontrada; componentes chicos (`DetalleSesion`, `CopiarEnlace`, `FormularioCancelacion`).
- [x] **VII. Accesible y responsive**: `label` en el motivo y en el enlace de solo lectura; confirmación con botones reales; el mensaje del resultado va con `role="status"` y los errores con `role="alert"`; foco al título del formulario al abrirlo; reusa el layout `.confirmacion`/`.resumen` que ya funciona en 375 px.
- [x] **VIII. Calidad**: sin `any` ni `@ts-ignore`; `npm run lint` y `npm run typecheck` al cerrar.

Re-check post diseño: sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/003-cancelar-sesion/
├── spec.md
├── plan.md              # este archivo
├── research.md          # decisiones D1–D9
├── data-model.md        # campos nuevos de Sesion y transición de estado
├── quickstart.md        # verificación automática y manual
├── contracts/api.md     # GET/PATCH /api/sesiones/:id
└── tasks.md             # salida de /speckit-tasks
```

### Source Code (repository root)

```text
shared/types.ts                     # Sesion (+motivoCancelacion, +canceladaEn), SesionPublica, SesionListada,
                                    # SesionDetalle, Cancelacion, RazonNoCancelable, CambioSesion
server/
├── domain/
│   ├── fechas.ts                   # + instanteEnArgentina(fecha, hora)
│   ├── cancelacion.ts              # NUEVO: evaluarCancelacion, ANTICIPACION_MINIMA_MS, MENSAJES_CANCELACION
│   └── validaciones.ts             # + validarCancelacion, MOTIVO_MAX = 500
├── repositories/index.ts           # + sesiones.actualizar(sesion)
├── services/sesiones.ts            # obtener → SesionDetalle; + cancelar(id, cuerpo); listar → SesionListada[]
└── routes/sesiones.ts              # + PATCH /:id

client/src/
├── api/client.ts                   # + sesion(id), cancelarSesion(id, cambio)
├── App.tsx                         # + /sesiones/:id; − /confirmacion
├── pages/
│   ├── SesionPage.tsx              # NUEVO: carga detalle + mentora/tipos/colectivos
│   ├── ReservaPage.tsx             # navega a /sesiones/:id; − EstadoConfirmacion
│   └── ConfirmacionPage.tsx        # SE ELIMINA
├── components/
│   ├── DetalleSesion.tsx           # NUEVO: <dl> del resumen + estado, motivo, canceladaEn
│   ├── CopiarEnlace.tsx            # NUEVO: botón copiar + campo de solo lectura
│   └── FormularioCancelacion.tsx   # NUEVO: motivo opcional (contador 500), confirmar / volver
└── styles.css                      # estilos del formulario y del estado cancelada

tests/
├── server/domain/cancelacion.test.ts      # NUEVO
├── server/domain/validaciones.test.ts     # + validarCancelacion
├── server/domain/fechas.test.ts           # + instanteEnArgentina
├── server/api/helpers.ts                  # + AHORA_AR (reloj con offset −03:00)
├── server/api/sesiones.test.ts            # + PATCH; GET con cancelacion (ver "Tests existentes")
├── client/SesionPage.test.tsx             # NUEVO
├── client/ReservaPage.test.tsx            # + test: al confirmar navega a /sesiones/:id
└── client/fixtures.ts                     # + sesionDetalle de ejemplo
```

**Structure Decision**: misma estructura que la 001. Se agrega una página y tres
componentes en el cliente y un módulo de dominio en el servidor. Sin capas ni paquetes nuevos.

## Tests existentes que cambian

Lo pediste explícitamente. Revisé `tests/server/api/sesiones.test.ts`, `tests/client/ReservaPage.test.tsx` y `tests/client/Navegacion.test.tsx`:

| Test | ¿Cambia? | Por qué |
|---|---|---|
| Flujo de reserva: `tests/client/ReservaPage.test.tsx` (4 tests) | **No** | Ninguno confirma la reserva ni verifica la navegación a `/confirmacion`. Llegan hasta "Confirmar sesión" visible. Se **agrega** un test nuevo para la redirección a `/sesiones/:id`. |
| `tests/client/Navegacion.test.tsx` | **No** | No usa `/confirmacion`. |
| No hay tests de `ConfirmacionPage` | — | Se elimina sin tocar tests. |
| `API · GET /api/sesiones/:id › devuelve el detalle de la sesión` | **Sí** | Compara con `toEqual` contra la forma exacta de `SesionPublica`. Ahora el detalle suma `cancelacion` (FR-014), así que hay que agregar `cancelacion: { permitida: true }` al objeto esperado. Con `AHORA` local y la sesión del lunes 18:00 hay ≥ 24 h en zonas de UTC−9 a UTC+14; para no depender de la zona, ese test pasa a usar `AHORA_AR`. |
| `API · GET /api/sesiones › lista sesiones filtradas sin datos de contacto` | **No** (se agrega una aserción nueva en otro test) | Sigue pasando sin `id`. Se agrega un test aparte: el listado no incluye `id` ni `motivoCancelacion`. |
| Resto de `POST /api/sesiones` y disponibilidad | No | El POST sigue devolviendo `Sesion` completa a quien reserva. |

## Decisiones aprobadas

- **2026-11-02 · Quitar el `id` del listado público (D6), aprobado por el usuario.**
  `GET /api/sesiones` hoy devuelve el `id` de cada sesión. Con la decisión Q1 (el enlace
  es la única credencial), eso permitiría cancelar sesiones ajenas. Se **quita el `id`
  del listado** y el endpoint **se mantiene** (no se elimina). Nada del cliente lo usa y
  el test existente no se rompe. Esto cambia el contrato de la 001, y el cambio queda
  documentado en [contracts/api.md](./contracts/api.md).

## Complexity Tracking

Sin violaciones a justificar.
