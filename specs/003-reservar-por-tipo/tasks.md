---
description: "Task list — Reservar por tipo de asesoría, sin elegir mentora"
---

# Tasks: Reservar por tipo de asesoría, sin elegir mentora

**Input**: Design documents from `specs/003-reservar-por-tipo/`
**Prerequisites**: plan.md ✅ · spec.md ✅ · research.md ✅ · data-model.md ✅ · contracts/api.md ✅ · quickstart.md ✅

**TDD obligatorio** (Constitution I): cada test se escribe y se ve FALLAR antes de
implementar el código correspondiente. Los tests de API usan el `DATA_DIR` temporal de
`tests/server/api/helpers.ts`; nunca escriben en `data/`.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: puede hacerse en paralelo (archivos distintos, sin dependencias pendientes)
- **[US1]** Reservar eligiendo solo el tipo · **[US2]** Asignación equitativa · **[US3]** Sin lugar para ese tipo

## Datos de referencia para los tests

- "Ahora" fijo en los tests de API: `AHORA` = domingo 18/10/2026 12:00 (`tests/server/api/helpers.ts`).
- En `data/`, `revision_de_codigo` (30 min) lo dan Valentina (lun y mié 18–21), Marto (mar y jue 9–12, sáb 10–13), Lu (lun 10–13, vie 14–18), Camila (mar y jue 14–18) y Rocío (sin disponibilidad).
- `arquitectura` (60 min) lo dan Marto y Lu, en días distintos.
- Ninguna pareja de mentoras de `data/` comparte horario: los casos de reparto (US2) usan mentoras de prueba escritas en el `DATA_DIR` temporal (T002).

---

## Phase 1: Setup

- [X] T001 Verificar la línea de base en la rama `003-reservar-por-tipo`: correr `npm test`, `npm run lint` y `npm run typecheck` y anotar los fallos previos (hoy falla `tests/client/Navegacion.test.tsx > README`, ajeno a esta feature) para no confundirlos con regresiones

---

## Phase 2: Foundational (bloquea todas las historias)

- [X] T002 [P] Agregar a `tests/server/api/helpers.ts` (sin cambiar lo existente) `mentoraDePrueba(extra: Partial<Mentora>): Mentora` (con `contacto.email` de ejemplo y disponibilidad vacía por defecto) y `escribirMentoras(dataDir: string, mentoras: Mentora[])`, que reemplaza `mentoras.json` del directorio temporal (el `json-store` relee el archivo en cada request)
- [X] T003 [P] Revisar `tests/client/fixtures.ts` para los tests de cliente: ya trae `despliegue` (ninguna mentora lo da) y dos mentoras con `revision_de_codigo` (`valentina` y `camila`); solo agregar fixtures (sin cambiar las existentes) si algún test nuevo necesita otro caso

**Checkpoint**: helpers listos; los tests existentes siguen como en T001.

---

## Phase 3: US1 — Reservar eligiendo solo el tipo de asesoría (P1) 🎯 MVP

**Goal**: el colectivo elige un tipo, ve la unión de horarios libres, ve la mentora asignada antes de confirmar y reserva con ella; si al confirmar la mentora ya no está libre, se le muestra la nueva asignación o se le avisa que el horario no está disponible.

**Independent Test**: desde la portada, entrar a "reservar por tipo", elegir "Revisión de código", un día y un horario, ver la mentora asignada, completar los datos y confirmar; la confirmación muestra esa mentora y ese horario deja de estar libre para ella.

### Tests (escribir primero y ver FALLAR)

- [X] T004 [P] [US1] Tests de `unirDiasDisponibles(listas: DiaDisponible[][]): DiaDisponible[]` en `tests/server/domain/asignacion.test.ts`: lista vacía → `[]`; una sola mentora → igual a su lista; dos mentoras el mismo día → horarios unidos sin repetir `inicio`; fechas y horarios en orden ascendente; días sin horarios se descartan
- [X] T005 [US1] Tests de `elegirMentora(candidatas: Mentora[], sesiones: Sesion[], franja: FranjaPedida)` (sin reparto todavía: devuelve la primera libre en el orden recibido, o `null`) en `tests/server/domain/asignacion.test.ts`: descarta mentoras fuera de su disponibilidad ese día; descarta mentoras con una sesión confirmada superpuesta (incluida la superposición parcial); una sesión `cancelada` no bloquea; una sesión que termina justo cuando empieza la franja no bloquea; ninguna libre → `null`
- [X] T006 [P] [US1] Tests de API en `tests/server/api/reserva-por-tipo.test.ts` para `GET /api/tipos-asesoria/:id/disponibilidad`: `revision_de_codigo` devuelve el lunes 2026-10-19 con horarios de Lu (10:00…) y de Valentina (18:00…), y el martes con Marto y Camila; `arquitectura` une Marto y Lu; un horario ocupado por una sesión confirmada de la única mentora libre en ese momento no aparece; tipo inexistente → `404 { error: "El tipo de asesoría no existe" }`; ninguna respuesta contiene `contacto` ni emails de `data/mentoras.json`
- [X] T007 [US1] Tests de API en `tests/server/api/reserva-por-tipo.test.ts` para `GET /api/tipos-asesoria/:id/asignacion`: `revision_de_codigo` el 2026-10-19 a las 18:00 → `200` con Valentina como `MentoraPublica` sin `contacto`; los mensajes `400` del contrato (falta fecha, falta hora, formato de fecha, formato de hora, horario pasado con fecha 2026-10-12); tipo inexistente → `404`; con una sesión confirmada de Valentina 18:00–18:30 ese lunes → `409 { error: "No hay mentoras libres en ese horario" }`; flujo completo: asignación → `POST /api/sesiones` con ese `mentoraId` → `201` → la misma asignación responde `409`
- [X] T008 [US1] Correr `npx vitest run tests/server/domain/asignacion.test.ts tests/server/api/reserva-por-tipo.test.ts` y confirmar que fallan (módulo inexistente / `404` en las rutas nuevas)

### Implementación del servidor

- [X] T009 [US1] Crear `server/domain/asignacion.ts` (puro, sin IO) con `unirDiasDisponibles` y `elegirMentora(candidatas, sesiones, franja)`: filtra con `estaDentroDeDisponibilidad` (`server/domain/horarios.ts`) y `!haySuperposicion` (`server/domain/superposicion.ts`, pasando la franja con el `mentoraId` de cada candidata) y devuelve la primera libre o `null`
- [X] T010 [US1] Crear `server/services/reserva-por-tipo.ts` con `crearServicioReservaPorTipo(repos, reloj)`:
  - `disponibilidad(tipoId, dias = DIAS_RESERVABLES)`: `404` si el tipo no existe; para cada mentora que `puedeDar` el tipo, `calcularDiasDisponibles` con sus sesiones, y combina con `unirDiasDisponibles`.
  - `asignar(tipoId, fecha?, horaInicio?)`: valida en este orden con los mensajes de `contracts/api.md` (falta fecha, falta hora, `esFechaValida`, `esHoraValida`, tipo inexistente `404`, horario pasado con la misma regla que `services/sesiones.ts`); calcula `horaFin` con `aHora(aMinutos(horaInicio) + tipo.duracionMinutos)`; llama a `elegirMentora`; `null` → `conflicto("No hay mentoras libres en ese horario")`; devuelve `aMentoraPublica(mentora, tipos)`.
- [X] T011 [US1] Crear `server/routes/tipos-asesoria.ts` (`rutasTiposAsesoria`) con `GET /:id/disponibilidad` (`dias` opcional, igual que en `server/routes/mentoras.ts`) y `GET /:id/asignacion` (`fecha` y `horaInicio` por query), y montarlo en `server/app.ts` con `api.use("/tipos-asesoria", …)` **después** de `rutasCatalogos` para no tapar `GET /api/tipos-asesoria`
- [X] T012 [US1] Correr los tests de T004–T007 y confirmar que pasan

### Cliente

- [X] T013 [P] [US1] Agregar a `client/src/api/client.ts` `disponibilidadPorTipo(tipoAsesoriaId)` → `DiaDisponible[]` y `asignacion(tipoAsesoriaId, fecha, horaInicio)` → `MentoraPublica`, con `encodeURIComponent` como las funciones existentes
- [X] T014 [P] [US1] Tests de `ReservaPorTipoPage` en `tests/client/ReservaPorTipoPage.test.tsx` (para el conflicto usar un `vi.fn` propio que responda distinto según método y llamada, porque `simularApi` siempre responde `200`):
  - muestra como radios solo los tipos que alguna mentora puede dar (el de T003 no aparece);
  - al elegir tipo → día → horario muestra la mentora asignada (nombre y presentación) y el formulario, sin ningún email de mentora;
  - al confirmar envía `POST /api/sesiones` con el `mentoraId` mostrado y navega a `/confirmacion`;
  - si el `POST` responde `409` y la nueva asignación devuelve otra mentora: aparece un `role="alert"` que avisa el cambio, se muestra la nueva mentora, los datos del formulario se conservan y hace falta confirmar de nuevo;
  - si la nueva asignación responde `409`: aparece un aviso de que el horario ya no está disponible, se deselecciona el horario y se recargan los horarios.
- [X] T015 [P] [US1] Agregar un test (sin modificar los existentes) en `tests/client/InicioPage.test.tsx`: la portada tiene un enlace "Reservá por tipo de asesoría" que apunta a `/reservar-por-tipo`
- [X] T016 [US1] Correr `npx vitest run tests/client/ReservaPorTipoPage.test.tsx tests/client/InicioPage.test.tsx` y confirmar que los tests nuevos fallan
- [X] T017 [P] [US1] Crear `client/src/components/MentoraAsignada.tsx`: muestra nombre, pronombres (si hay) y presentación de una `MentoraPublica`, con un encabezado "Te va a acompañar" y, si recibe `cambio`, un `<p role="alert">` que explica que la mentora anterior ya no está libre en ese horario
- [X] T018 [US1] Crear `client/src/pages/ReservaPorTipoPage.tsx` reutilizando `Paso` (extraerlo de `ReservaPage.tsx` a `client/src/components/Paso.tsx` si hace falta, sin cambiar su markup), `SelectorTipo`, `SelectorDia`, `SelectorHorario` y `FormularioContacto`:
  - carga `api.tiposAsesoria()`, `api.mentoras()` y `api.colectivos()`, con estados cargando/error;
  - filtra los tipos con al menos una mentora (R5);
  - con tipo elegido usa `api.disponibilidadPorTipo`; con horario elegido usa `api.asignacion` (estados cargando/error/`409`);
  - al cambiar tipo, día u horario limpia la asignación;
  - confirma con `api.crearSesion` y navega a `/confirmacion` con el mismo `EstadoConfirmacion` de `ReservaPage`;
  - ante un `409` aplica el flujo de R4.
  - `FormularioContacto` no debe re-montarse al cambiar la mentora asignada, para que no se pierdan los datos.
- [X] T019 [US1] Registrar la ruta `reservar-por-tipo` en `client/src/App.tsx` y agregar en `client/src/pages/InicioPage.tsx`, después de la portada, el enlace "¿No sabés a quién elegir? Reservá por tipo de asesoría" (`<Link className="boton boton-secundario">`); estilos de `.mentora-asignada` y del enlace en `client/src/styles.css` con las variables existentes
- [X] T020 [US1] Correr los tests de cliente de T014–T015 y confirmar que pasan, junto con `tests/client/ReservaPage.test.tsx` (sin regresiones si se extrajo `Paso`)

**Checkpoint**: US1 completa de punta a punta; MVP entregable.

---

## Phase 4: US2 — Asignación equitativa entre mentoras (P2)

**Goal**: entre mentoras libres en la misma franja se asigna la que tiene menos sesiones confirmadas en los próximos 14 días; empate → orden alfabético del nombre.

**Independent Test**: con dos mentoras libres en el mismo horario y una con más sesiones confirmadas en la ventana, la asignación devuelve la otra; con igual cantidad, la primera por nombre.

### Tests (escribir primero y ver FALLAR)

- [X] T021 [US2] Tests de reparto en `tests/server/domain/asignacion.test.ts`, con la firma nueva `elegirMentora(candidatas, sesiones, franja, hoy)`:
  - gana la que tiene menos sesiones confirmadas con `hoy <= fecha <= hoy + 13`;
  - no cuentan las sesiones `canceladas`, las anteriores a `hoy` ni las del día `hoy + 14`;
  - se cuentan sesiones y no minutos (una sesión de 60 min pierde contra dos de 30);
  - empate → orden alfabético con `localeCompare` en `es` (por ejemplo "Ágata" antes que "Bruno");
  - el orden en que llegan las candidatas no cambia el resultado;
  - una mentora con menos carga pero no libre en la franja no se elige.
- [X] T022 [P] [US2] Tests de API en `tests/server/api/reserva-por-tipo.test.ts`: con `escribirMentoras` (T002) crear "Bruno" y "Ágata", ambas con `testing_unitario` y disponibilidad lunes 18:00–21:00; con una sesión confirmada de Ágata otro día de la ventana, `GET /api/tipos-asesoria/revision_de_codigo/asignacion?fecha=2026-10-19&horaInicio=19:00` devuelve a Bruno; sin sesiones, devuelve a Ágata
- [X] T023 [US2] Correr los tests de T021–T022 y confirmar que fallan

### Implementación

- [X] T024 [US2] En `server/domain/asignacion.ts`, agregar el parámetro `hoy` a `elegirMentora` y ordenar las libres por carga en la ventana (`sumarDias(hoy, 13)` de `server/domain/fechas.ts`) y luego por `nombre.localeCompare(otro, "es")`; actualizar los tests de T005 para pasar `hoy`
- [X] T025 [US2] En `server/services/reserva-por-tipo.ts`, pasar `fechaDe(reloj())` como `hoy` y todas las sesiones de `repos.sesiones.listar()`; correr los tests de T021–T022 y confirmar que pasan

**Checkpoint**: US1 y US2 funcionan; el reparto es determinista.

---

## Phase 5: US3 — Sin lugar para ese tipo de asesoría (P3)

**Goal**: si ninguna mentora que da el tipo tiene lugar en 14 días, el colectivo lo ve claramente y puede elegir otro tipo o volver al listado.

**Independent Test**: con un tipo cuyas mentoras no tienen disponibilidad, elegirlo y ver el mensaje, los demás tipos y el enlace al listado.

### Tests (escribir primero y ver FALLAR)

- [X] T026 [P] [US3] Test de API en `tests/server/api/reserva-por-tipo.test.ts`: con `escribirMentoras` dejar solo a una mentora sin disponibilidad que da `primeros_pasos_git`; `GET /api/tipos-asesoria/primeros_pasos_git/disponibilidad` → `200 []`
- [X] T027 [P] [US3] Test en `tests/client/ReservaPorTipoPage.test.tsx`: si `disponibilidadPorTipo` devuelve `[]`, se ve "No hay lugar en los próximos 14 días" con un texto que habla del tipo de asesoría (no de "esta mentora"), los radios de tipos siguen disponibles y hay un enlace a "Ver mentoras" que apunta a `/`
- [X] T028 [US3] Correr los tests de T026–T027 y confirmar cuáles fallan (el de API puede pasar ya con US1; el de cliente debe fallar por el texto)

### Implementación

- [X] T029 [US3] En `client/src/components/SelectorDia.tsx` agregar una prop opcional `mensajeVacio` (por defecto el texto actual, "Esta mentora no tiene horarios libres para este tipo de asesoría.") y usarla en `ReservaPorTipoPage` con "Ninguna mentora tiene horarios libres para este tipo de asesoría. Probá con otro tipo."; correr T027 y `tests/client/ReservaPage.test.tsx` y confirmar que pasan

**Checkpoint**: las tres historias funcionan de forma independiente.

---

## Phase 6: Polish & Cross-Cutting

- [X] T030 [P] Revisar accesibilidad de `ReservaPorTipoPage` (Principio VII): todo el flujo con teclado, foco visible, el aviso de cambio de mentora se anuncia (`role="alert"`) y la mentora asignada se anuncia al aparecer (`aria-live="polite"` en su contenedor)
- [X] T031 [P] Verificar a 375px de ancho que la portada (con el enlace nuevo) y `/reservar-por-tipo` no tienen scroll horizontal, siguiendo `specs/003-reservar-por-tipo/quickstart.md`
- [X] T032 Recorrer a mano `specs/003-reservar-por-tipo/quickstart.md` (incluido el conflicto con dos pestañas) con `npm run dev`
- [X] T033 Correr `npm test`, `npm run lint` y `npm run typecheck`; los únicos fallos permitidos son los anotados en T001

---

## Dependencies & Execution Order

- **Setup (T001)** → **Foundational (T002–T003)** → historias.
- **US1 (T004–T020)** es la base: US2 y US3 extienden archivos que crea US1 (`asignacion.ts`, `reserva-por-tipo.ts`, `ReservaPorTipoPage.tsx`).
- **US2 (T021–T025)** depende de T009–T010; no depende del cliente de US1 (es solo servidor).
- **US3 (T026–T029)** depende de T018 (página) y T010 (servicio); es independiente de US2.
- **Polish (T030–T033)** al final.

Dentro de cada historia: tests → ver rojo → dominio → servicio → rutas → cliente → ver verde.

```text
T001 → T002, T003
          ↓
US1: T004, T006 ─┐   T005 (mismo archivo que T004)
                 ├→ T008 → T009 → T010 → T011 → T012
                 │                              ↓
                 │       T013, T014, T015 → T016 → T017 → T018 → T019 → T020
                 ↓
US2: T021, T022 → T023 → T024 → T025        (después de T010)
US3: T026, T027 → T028 → T029               (después de T018)
                 ↓
Polish: T030, T031 → T032 → T033
```

## Parallel Examples

**US1**: T004 (dominio) y T006 (API) en paralelo; después T013 (cliente API), T014 (tests de la página) y T015 (test de la portada) en paralelo; T017 (componente) en paralelo con el inicio de T018.

**US2**: T021 (dominio) y T022 (API) en paralelo.

**US3**: T026 (API) y T027 (cliente) en paralelo.

**Entre historias**: una vez terminada US1, US2 (servidor) y US3 (cliente) pueden avanzar en paralelo.

## Implementation Strategy

1. **MVP = US1** (T001–T020): ya permite reservar sin elegir mentora. La asignación toma la primera mentora libre en el orden del archivo; es correcta pero no equitativa.
2. **US2** (T021–T025): agrega el reparto equitativo sin cambiar contratos ni cliente.
3. **US3** (T026–T029): mejora el mensaje sin lugar.
4. **Polish** (T030–T033): accesibilidad, 375px, recorrido manual y verificación final.

Cada checkpoint deja `npm test`, `npm run lint` y `npm run typecheck` en verde (salvo los fallos previos de T001).
