# Tasks: Cupo mensual de horas por mentora

**Input**: `/specs/003-cupo-mensual-mentora/` (plan.md, spec.md, research.md, data-model.md, contracts/api.md)
**Tests**: OBLIGATORIOS. El Principio I de la constitution (test-first) manda aunque la plantilla los dé por opcionales: cada fase escribe los tests, verifica que fallan (rojo) y recién después implementa (verde).
**Formato**: `- [ ] T### [P?] [US?] Descripción con ruta`. `[P]` = se puede hacer en paralelo (otro archivo, sin dependencias abiertas).

## Phase 1: Foundational (bloquea a todas las historias)

- [x] T001 Agregar `cupoMensualHoras?: number` a `Mentora` y `horasRestantes?: number` a `MentoraPublica` (que además omite `cupoMensualHoras`) en `shared/types.ts`
- [x] T002 [P] Agregar a `tests/server/api/helpers.ts` un helper `crearAppConCupo(cupoHoras, sesiones)` que copia `data/` a un `DATA_DIR` temporal y fija `cupoMensualHoras` de Valentina en su `mentoras.json` (nunca escribe en `data/`)

**Checkpoint**: `npm run typecheck` pasa con los tipos nuevos.

## Phase 2: US1 — La mentora no se pasa de las horas que donó (P1) 🎯 MVP

**Objetivo**: las confirmadas consumen cupo, las canceladas no, y no se ofrece ni se acepta lo que no entra.
**Test independiente**: Valentina con 2 h; dos reservas de 60 min entran, una tercera da `409` y no aparece en disponibilidad.

### Tests primero (deben fallar)

- [x] T003 [P] [US1] Crear `tests/server/domain/cupo.test.ts`: consumo suma solo confirmadas del mes de la mentora; canceladas no cuentan; sesiones de otro mes u otra mentora no cuentan; restante nunca baja de 0; sin cupo (`undefined`, negativo o `NaN`) devuelve `undefined`; cupo `0` devuelve 0; `entraEnCupo` con 30 min restantes y asesoría de 60 es `false`, y con 60 y 60 es `true`; fracciones (1,5 h = 90 min)
- [x] T004 [P] [US1] Agregar a `tests/server/domain/horarios.test.ts`: con cupo agotado el día no ofrece horarios; con 30 min restantes se ofrece una asesoría de 30 y no una de 60; un día del mes siguiente sí se ofrece aunque el mes actual esté agotado
- [x] T005 [P] [US1] Agregar a `tests/server/api/sesiones.test.ts`: `POST` responde `409` con `{ error: "No hay cupo suficiente este mes para esa asesoría" }` si excede el cupo y no crea la sesión; la última reserva que entra justo se confirma; cancelar libera (una sesión `cancelada` sembrada no consume); dos `POST` seguidos por las últimas horas → uno `201` y el otro `409`; sin cupo definido no hay límite

### Implementación

- [x] T006 [US1] Crear `server/domain/cupo.ts` (puro, sin IO): `mesDe(fecha)`, `minutosConsumidos(sesiones, mentoraId, mes)`, `minutosRestantes(cupoHoras, sesiones, mentoraId, mes)` y `entraEnCupo(restantes, duracionMinutos)`; hace pasar T003
- [x] T007 [US1] Hacer que `calcularHorarios` y `calcularDiasDisponibles` en `server/domain/horarios.ts` reciban `cupoHoras?` y no ofrezcan horarios cuando la asesoría no entra en el mes de cada día; hace pasar T004
- [x] T008 [US1] En `server/services/mentoras.ts` (`disponibilidad`) pasar `mentora.cupoMensualHoras` al dominio
- [x] T009 [US1] En `server/services/sesiones.ts` (`crear`) lanzar `conflicto("No hay cupo suficiente este mes para esa asesoría")` si la asesoría no entra, después del chequeo de superposición y antes de `agregar`; hace pasar T005

**Checkpoint**: T003–T005 en verde; la regla funciona de punta a punta por API.

## Phase 3: US2 — El colectivo ve cuánto cupo le queda (P1)

**Objetivo**: "Le quedan N h este mes" o "Sin cupo este mes" en la tarjeta y en la página de reserva, sin filtrar el cupo total ni el contacto.
**Test independiente**: abrir una mentora con cupo parcial y otra agotada y leer los textos.
**Depende de**: US1 (usa `server/domain/cupo.ts`).

### Tests primero (deben fallar)

- [x] T010 [P] [US2] Agregar a `tests/server/api/mentoras.test.ts`: `GET /api/mentoras` y `GET /api/mentoras/:id` devuelven `horasRestantes` (2 → 1 tras una sesión de 60 min); `0` si se agotó; ausente si no hay cupo; la respuesta nunca incluye `cupoMensualHoras` ni `contacto`
- [x] T011 [P] [US2] Agregar a `tests/server/domain/mentoras.test.ts`: `aMentoraPublica` incluye `horasRestantes` según el mes y descarta `cupoMensualHoras`
- [x] T012 [P] [US2] Agregar mentoras con y sin `horasRestantes` a `tests/client/fixtures.ts` y tests en `tests/client/InicioPage.test.tsx` ("Le quedan 2 h este mes", "Le quedan 1,5 h este mes", "Sin cupo este mes", nada si no hay cupo) y en `tests/client/ReservaPage.test.tsx` (muestra el texto en la cabecera de la reserva)

### Implementación

- [x] T013 [US2] Extender `aMentoraPublica` en `server/domain/mentoras.ts` para recibir sesiones y `ahora` y devolver `horasRestantes` sin `cupoMensualHoras`; hace pasar T011
- [x] T014 [US2] Actualizar `listar` y `obtener` en `server/services/mentoras.ts` para pasar sesiones y reloj; hace pasar T010
- [x] T015 [P] [US2] Crear `client/src/components/CupoMensual.tsx`: recibe `horasRestantes?`, no renderiza nada si es `undefined`, "Sin cupo este mes" si es 0 y "Le quedan N h este mes" (con coma decimal) si no
- [x] T016 [US2] Usar `CupoMensual` en `client/src/components/MentoraCard.tsx` y en la cabecera de `client/src/pages/ReservaPage.tsx`; hace pasar T012

**Checkpoint**: la tarjeta y la página de reserva muestran el cupo; `npm test` en verde.

## Phase 4: US3 — El cupo se carga con los datos de la mentora (P2)

**Objetivo**: el cupo se define en `data/mentoras.json` y no existe pantalla para editarlo.
**Test independiente**: cargar un cupo en el JSON y verlo aplicado sin otra configuración.

- [x] T017 [P] [US3] Test en `tests/server/api/mentoras.test.ts`: con `cupoMensualHoras` inválido (negativo, texto) en el `DATA_DIR` temporal, la API responde bien y trata a la mentora como sin cupo
- [x] T018 [US3] Agregar `cupoMensualHoras` a algunas mentoras de `data/mentoras.json` (por ejemplo 8 para Valentina y 2 para otra), dejando al menos una sin cupo
- [x] T019 [US3] Verificar que `.gitignore` no necesita cambios (no hay archivos nuevos en `data/`) y que no existe ninguna ruta ni pantalla de edición del cupo

## Phase 5: Cierre

- [x] T020 Correr `npm test`, `npm run lint` y `npm run typecheck` sin errores (Principio VIII: sin `any` ni `eslint-disable` sin justificar)
- [ ] T021 Recorrer `specs/003-cupo-mensual-mentora/quickstart.md` en `npm run dev` y comprobar los textos del cupo en 375 px sin scroll horizontal (Principio VII)
- [ ] T022 Marcar esta lista como completa y actualizar `Status` de `spec.md` a `Implemented`

## Dependencias y orden

- Phase 1 → Phase 2 (US1) → Phase 3 (US2) → Phase 4 (US3) → Phase 5.
- US1 y US2 comparten `server/domain/cupo.ts`, por eso US2 va después. US3 solo toca datos y un test, pero se deja al final para no cambiar `data/mentoras.json` mientras se desarrollan los tests de las otras.
- Dentro de cada fase: los tests `[P]` van en paralelo y se ven en rojo antes de la primera tarea de implementación.

## Paralelismo

- Phase 2: T003, T004 y T005 a la vez (archivos distintos).
- Phase 3: T010, T011 y T012 a la vez; T015 en paralelo con T013/T014.

## Estrategia

- **MVP = Phase 1 + Phase 2 (US1)**: la regla ya protege a la mentora por API aunque todavía no se muestre.
- Luego US2 hace visible el límite, y US3 carga datos reales.
