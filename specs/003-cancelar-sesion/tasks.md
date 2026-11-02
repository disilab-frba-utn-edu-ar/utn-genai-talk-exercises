---
description: "Task list — Cancelar una sesión reservada"
---

# Tasks: Cancelar una sesión reservada

**Input**: Design documents from `specs/003-cancelar-sesion/`
**Prerequisites**: plan.md ✅ · spec.md ✅ · research.md ✅ · data-model.md ✅ · contracts/api.md ✅ · quickstart.md ✅

**TDD obligatorio** (Constitution I): cada tarea de test se escribe primero y se ve
FALLAR (`npm test -- <archivo>`) antes de la tarea de implementación que la sigue.
Los tests de API usan `crearAppDePrueba` (DATA_DIR temporal); nunca escriben en `data/`.
Nadie edita a mano archivos de `data/` ni `scripts/seed.mjs`; que la app escriba en
`data/sesiones.json` durante la prueba manual es esperable.
Si falla algún test de `ejercicios/`, **frenar y avisar al usuario**: no tocar esa carpeta.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: puede hacerse en paralelo (archivos distintos, sin dependencias pendientes)
- **[US1]** Ver mi sesión desde su enlace · **[US2]** Cancelar con anticipación · **[US3]** Cancelación fuera de plazo

---

## Phase 1: Setup

- [X] T001 Correr `npm test`, `npm run lint` y `npm run typecheck` en la rama `004-cancelar-sesion` y confirmar que todo pasa antes de empezar (línea de base; no modifica archivos)

---

## Phase 2: Foundational (bloquea todas las historias)

**Purpose**: tipos, regla de cancelación pura y cierre del listado público, que todas las historias necesitan.

- [X] T002 Ampliar `shared/types.ts` según `data-model.md`: agregar `motivoCancelacion?: string` y `canceladaEn?: string` a `Sesion`; redefinir `SesionPublica = Omit<Sesion, "contactoNombre" | "contactoEmail" | "motivoCancelacion" | "canceladaEn">`; agregar `SesionListada = Omit<SesionPublica, "id">`, `RazonNoCancelable = "ya_cancelada" | "ya_ocurrio" | "fuera_de_plazo"`, `Cancelacion = { permitida: true } | { permitida: false; razon: RazonNoCancelable; mensaje: string }`, `SesionDetalle = SesionPublica & { motivoCancelacion?: string; canceladaEn?: string; cancelacion: Cancelacion }` y `CambioSesion = { estado: "cancelada"; motivo?: string }`, con comentarios de una línea como los existentes (Principio IV)
- [X] T003 [P] Test de `instanteEnArgentina(fecha, hora)` en `tests/server/domain/fechas.test.ts`: `instanteEnArgentina("2026-10-19", "18:00").toISOString() === "2026-10-19T21:00:00.000Z"`; cruce de día (`"2026-10-19", "22:30"` → `"2026-10-20T01:30:00.000Z"`)
- [X] T004 [P] Test de `evaluarCancelacion(sesion, ahora)` en `tests/server/domain/cancelacion.test.ts` (nuevo), con `ahora` construido con offset explícito (`new Date("2026-10-18T18:00:00-03:00")`) y sesión del `2026-10-19` a las `18:00`: exactamente 24 h → `{ permitida: true }`; 24 h − 1 ms → `{ permitida: false, razon: "fuera_de_plazo" }`; 48 h → permitida; inicio igual a `ahora` → `ya_ocurrio`; inicio anterior → `ya_ocurrio`; `estado: "cancelada"` con 48 h por delante → `ya_cancelada` (tiene prioridad); cancelada y ya pasada → `ya_cancelada`; y que `MENSAJES_CANCELACION` tenga los tres textos de `contracts/api.md`
- [X] T005 Implementar `instanteEnArgentina(fecha, hora)` en `server/domain/fechas.ts` como `new Date(\`${fecha}T${hora}:00-03:00\`)`, con un comentario que explique que Argentina usa UTC−3 fijo y que no depende de la zona del proceso (research D2)
- [X] T006 Implementar `server/domain/cancelacion.ts` (nuevo, sin IO): `ANTICIPACION_MINIMA_MS = 24 * 60 * 60 * 1000`, `MENSAJES_CANCELACION: Record<RazonNoCancelable, string>` y `evaluarCancelacion(sesion: Pick<Sesion, "fecha" | "horaInicio" | "estado">, ahora: Date): { permitida: true } | { permitida: false; razon: RazonNoCancelable }` con el orden `ya_cancelada → ya_ocurrio (inicio ≤ ahora) → fuera_de_plazo (inicio − ahora < 24 h) → permitida` (research D1)
- [X] T007 Agregar `AHORA_AR = new Date("2026-10-18T12:00:00-03:00")` exportado en `tests/server/api/helpers.ts`, con un comentario: es el mismo domingo al mediodía pero en hora de Argentina, independiente de la zona de la máquina (research D3). No cambiar `AHORA`
- [X] T008 Test en `tests/server/api/sesiones.test.ts`, dentro de `describe("API · GET /api/sesiones")`, en un `it` nuevo: el listado no incluye `id`, `motivoCancelacion` ni `canceladaEn` (sembrar una sesión cancelada con `motivoCancelacion: "Se suspendió"` y `canceladaEn`). No modificar el test existente de ese bloque
- [X] T009 Hacer que `listar` en `server/services/sesiones.ts` devuelva `SesionListada[]` sin `id` (función `aSesionListada` explícita, campo por campo como `aSesionPublica`) — decisión aprobada el 2026-11-02 (plan.md); el endpoint se mantiene
- [X] T010 [P] Agregar en `tests/client/fixtures.ts` un `sesionDetalle: SesionDetalle` de ejemplo (`id: "s1"`, `mentoraId: "m1"`, `tipoAsesoriaId: "revision_de_codigo"`, `colectivoId: "c1"`, `fecha: "2026-10-19"`, `horaInicio: "18:00"`, `horaFin: "18:30"`, `estado: "confirmada"`, `cancelacion: { permitida: true }`)

**Checkpoint**: `npm test` pasa con los tests nuevos de dominio y de listado.

---

## Phase 3: US1 — Ver mi sesión desde su enlace (P1) 🎯 MVP

**Goal**: después de reservar, el colectivo queda en `/sesiones/:id` con el resumen, puede copiar el enlace y volver a abrirlo o recargarlo.

**Independent Test**: reservar, llegar a `/sesiones/<id>`, recargar y abrir el enlace en otra pestaña: se ve el mismo detalle con estado "confirmada", sin datos de contacto.

### Tests (escribir primero, verlos fallar)

- [X] T011 [US1] Actualizar el test existente `API · GET /api/sesiones/:id › devuelve el detalle de la sesión` en `tests/server/api/sesiones.test.ts`: crear la app con `crearAppDePrueba([sesion, …], { reloj: () => AHORA_AR })` y agregar `cancelacion: { permitida: true }` al objeto de `toEqual` (motivo: el detalle ahora informa si se puede cancelar, FR-014; ver plan.md "Tests existentes que cambian"). Agregar un `it` nuevo: una sesión sembrada como cancelada con `motivoCancelacion` y `canceladaEn` devuelve ambos campos y `cancelacion: { permitida: false, razon: "ya_cancelada", mensaje: "La sesión ya estaba cancelada" }`. Los tests de "no incluye los datos de contacto" y de 404 quedan como están
- [X] T012 [US1] Test de `SesionPage` en `tests/client/SesionPage.test.tsx` (nuevo), con `simularApi` para `/api/sesiones/s1`, `/api/mentoras/m1`, `/api/tipos-asesoria` y `/api/colectivos`, y `renderConRuta(<SesionPage />, { ruta: "/sesiones/s1", patron: "/sesiones/:id" })`: muestra mentora, asesoría con duración, día (`fechaLarga`), horario `18:00 a 18:30`, colectivo, proyecto y estado "Confirmada"; no muestra ningún email; tiene un campo de solo lectura con `label` "Enlace de tu sesión" cuyo valor termina en `/sesiones/s1`; el botón "Copiar enlace" llama a `navigator.clipboard.writeText` (mock con `vi.fn`) con esa URL y anuncia "Enlace copiado" en un `role="status"`; si `writeText` rechaza, anuncia "No pudimos copiar el enlace: seleccionalo y copialo a mano"; siempre se ve el aviso de guardar el enlace; con 404 `{ error: "La sesión no existe" }` muestra el título "No encontramos esta sesión" y un enlace al inicio; con 500 muestra `ErrorCarga` con "Reintentar"; mientras carga muestra `Cargando`
- [X] T013 [US1] Test en `tests/client/SesionPage.test.tsx`: con `MemoryRouter initialEntries={[{ pathname: "/sesiones/s1", state: { recienReservada: true } }]}` se ve el título "¡Sesión confirmada!"; sin `state` el título es "Tu sesión"
- [X] T014 [P] [US1] Test nuevo en `tests/client/ReservaPage.test.tsx`: completar el flujo (tipo → día → horario → `FormularioContacto` con colectivo, proyecto ≥ 10 caracteres, nombre y email válidos) y confirmar con un `fetch` simulado cuyo `POST /api/sesiones` responde `201` con una `Sesion` de `id: "s1"`; renderizar con un `MemoryRouter` local que tenga las rutas `/mentoras/:id` y `/sesiones/:id` (esta última con un elemento de prueba que muestre `useLocation().pathname` y `state`) y verificar que se navega a `/sesiones/s1` con `state.recienReservada === true`. No modificar los 4 tests existentes del archivo

### Implementación

- [X] T015 [US1] En `server/services/sesiones.ts`: agregar `aSesionDetalle(sesion, ahora)` que arma `aSesionPublica(sesion)` + `motivoCancelacion`/`canceladaEn` si existen + `cancelacion` calculada con `evaluarCancelacion` y `MENSAJES_CANCELACION`; `obtener(id)` pasa a devolver `SesionDetalle` usando `reloj()`. Sin cambios en `routes/sesiones.ts` para el GET
- [X] T016 [P] [US1] Agregar `sesion: (id: string) => pedir<SesionDetalle>(\`/sesiones/${encodeURIComponent(id)}\`)` en `client/src/api/client.ts`
- [X] T017 [P] [US1] Crear `client/src/components/DetalleSesion.tsx`: recibe `sesion: SesionDetalle`, `mentora`, `tipo`, `colectivo` y renderiza el `<dl className="resumen tarjeta">` con las filas de la antigua `ConfirmacionPage` **sin** la fila "Contacto", más "Estado" (`Confirmada`/`Cancelada`) y, si está cancelada, "Motivo" (si hay) y "Cancelada el" (`canceladaEn` formateado con `toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })`, si hay)
- [X] T018 [P] [US1] Crear `client/src/components/CopiarEnlace.tsx`: `<label>` "Enlace de tu sesión" + `<input readOnly>` con `${window.location.origin}/sesiones/${id}` (selecciona todo al enfocar), botón "Copiar enlace" con `navigator.clipboard?.writeText` y mensaje en `role="status"` ("Enlace copiado" o el de fallo), y el aviso "Guardá este enlace: es la única forma de volver a ver o cancelar tu sesión."
- [X] T019 [US1] Crear `client/src/pages/SesionPage.tsx`: `useCarga(\`sesion:${id}\`, api.sesion)` y, cuando está lista, `useCarga` de `[api.mentora(mentoraId), api.tiposAsesoria(), api.colectivos()]` con clave dependiente del `mentoraId`; estados cargando / error con reintentar / no encontrada (`error === "La sesión no existe"` → sección con título "No encontramos esta sesión" y `Link` al inicio); título "¡Sesión confirmada!" si `useLocation().state?.recienReservada`, si no "Tu sesión"; compone `DetalleSesion` y `CopiarEnlace` reusando las clases `.confirmacion*`
- [X] T020 [US1] En `client/src/App.tsx`: agregar `<Route path="sesiones/:id" element={<SesionPage />} />`, quitar la ruta `confirmacion` y su import
- [X] T021 [US1] En `client/src/pages/ReservaPage.tsx`: tras crear la sesión, `navigate(\`/sesiones/${sesion.id}\`, { state: { recienReservada: true } })`; eliminar el tipo `EstadoConfirmacion` y la búsqueda de `colectivo` que solo lo alimentaba
- [X] T022 [US1] Eliminar `client/src/pages/ConfirmacionPage.tsx` y verificar con una búsqueda que no quedan referencias a `ConfirmacionPage`, `EstadoConfirmacion` ni `"/confirmacion"` en `client/` y `tests/`. `ejercicios/` queda fuera de la búsqueda y no se toca: si después de T020–T022 falla algún test de `ejercicios/`, frenar y avisar al usuario
- [X] T023 [P] [US1] Ajustar `client/src/styles.css`: estilos para `CopiarEnlace` (input a ancho completo, botón debajo en < 480 px) con foco visible, reusando variables existentes; sin scroll horizontal a 375 px

**Checkpoint**: US1 funciona de punta a punta; `npm test` pasa.

---

## Phase 4: US2 — Cancelar con anticipación (P1)

**Goal**: desde el enlace, el colectivo cancela con motivo opcional; la sesión queda cancelada y el horario se libera.

**Independent Test**: con una sesión a más de 24 h, cancelar con y sin motivo; el estado pasa a "Cancelada" y el horario vuelve a ofrecerse en la disponibilidad.

### Tests (escribir primero, verlos fallar)

- [X] T024 [P] [US2] Test de `validarCancelacion(datos)` en `tests/server/domain/validaciones.test.ts`: `{ estado: "cancelada" }` → ok sin motivo; con `motivo: "  Se suspendió  "` → ok con `motivo: "Se suspendió"`; `motivo: "   "` → ok sin motivo; `motivo` de 500 caracteres → ok; de 501 → error "El motivo puede tener hasta 500 caracteres"; `motivo: 3` → "El motivo debe ser un texto"; sin `estado` o `estado: "confirmada"` → "Solo se puede cambiar el estado a cancelada"; propiedad extra (`fecha`) → "Solo se puede enviar el estado y el motivo"; `null`, arreglo o texto → "El cuerpo de la solicitud debe ser un objeto JSON"
- [X] T025 [US2] Tests de `PATCH /api/sesiones/:id` en `tests/server/api/sesiones.test.ts` (nuevo `describe`, todos con `reloj: () => AHORA_AR` y una sesión de Valentina del miércoles `2026-10-21` de `18:00` a `18:30`, que está a 78 h): `200` sin motivo → cuerpo `SesionDetalle` con `estado: "cancelada"`, `canceladaEn: AHORA_AR.toISOString()`, sin `motivoCancelacion`, sin datos de contacto; `200` con motivo → se guarda recortado en `sesiones.json` del `dataDir` temporal; el `GET` posterior devuelve el estado y el motivo; los 400 de `contracts/api.md` no modifican `sesiones.json`; un JSON mal formado da `400 "El cuerpo de la solicitud no es JSON válido"` incluso con un id inexistente, porque `express.json()` lo corta antes de buscar la sesión; con cuerpos JSON bien formados, `404` con id inexistente y con `"no-es-un-uuid"` → `{ error: "La sesión no existe" }` aunque el contenido sea inválido (por ejemplo `{ estado: "confirmada" }`); tras cancelar, `GET /api/mentoras/${VALENTINA}/disponibilidad?tipoAsesoriaId=revision_de_codigo` vuelve a ofrecer `18:00` el `2026-10-21` (antes de cancelar no se ofrecía)
- [X] T026 [US2] Tests del flujo de cancelación en `tests/client/SesionPage.test.tsx` (con `fetch` simulado que también responde `PATCH /api/sesiones/s1`): con `cancelacion.permitida` se ve el botón "Cancelar sesión"; al tocarlo aparece el formulario con `textarea` etiquetada "Motivo (opcional)", contador "0/500", botones "Confirmar cancelación" y "Volver"; "Volver" cierra el formulario sin llamar a `PATCH`; confirmar sin motivo envía `{ estado: "cancelada" }`, y con motivo envía `{ estado: "cancelada", motivo }`; tras `200` se ve "Cancelada", el motivo, el mensaje "La sesión quedó cancelada. El horario volvió a quedar libre." en `role="status"` y ya no está "Cancelar sesión"; si `fetch` rechaza (sin conexión) se ve el error en `role="alert"`, el estado sigue "Confirmada" y el `textarea` conserva el texto escrito; el `textarea` no permite más de 500 caracteres (`maxLength`)

### Implementación

- [X] T027 [US2] Implementar `validarCancelacion(datos: unknown): Resultado<CambioSesion>` y `MOTIVO_MAX = 500` en `server/domain/validaciones.ts`, en el mismo estilo que `validarNuevaSesion` (research D4)
- [X] T028 [US2] Agregar `actualizar: (sesion: Sesion) => sesiones.escribir(sesiones.leer().map((s) => (s.id === sesion.id ? sesion : s)))` en `repos.sesiones` de `server/repositories/index.ts`
- [X] T029 [US2] Agregar `cancelar(id: string, datos: unknown): SesionDetalle` en `server/services/sesiones.ts`: busca (si no existe → `noEncontrado("La sesión no existe")`), valida con `validarCancelacion` (→ `invalido`), evalúa con `evaluarCancelacion(sesion, reloj())` (si no permitida → `conflicto(MENSAJES_CANCELACION[razon])`), guarda `{ ...sesion, estado: "cancelada", canceladaEn: ahora.toISOString(), ...(motivo && { motivoCancelacion: motivo }) }` con `repos.sesiones.actualizar` y devuelve `aSesionDetalle`. Leer, evaluar y escribir en forma sincrónica, sin `await` intermedio (research D8)
- [X] T030 [US2] Agregar `router.patch("/:id", (req, res) => { res.json(sesiones.cancelar(req.params.id, req.body)) })` en `server/routes/sesiones.ts`
- [X] T031 [P] [US2] Agregar `cancelarSesion: (id: string, cambio: CambioSesion) => pedir<SesionDetalle>(\`/sesiones/${encodeURIComponent(id)}\`, { method: "PATCH", body: JSON.stringify(cambio) })` en `client/src/api/client.ts`
- [X] T032 [P] [US2] Crear `client/src/components/FormularioCancelacion.tsx`: `textarea` con `label` "Motivo (opcional)", `maxLength={500}`, contador `n/500` asociado con `aria-describedby`, botones "Confirmar cancelación" (deshabilitado mientras envía, texto "Cancelando…") y "Volver"; recibe `enviando`, `error`, `onConfirmar(motivo?: string)` y `onVolver`; mueve el foco al título del formulario al montarse; envía `motivo` solo si `trim()` no queda vacío
- [X] T033 [US2] Integrar la cancelación en `client/src/pages/SesionPage.tsx`: botón "Cancelar sesión" si `cancelacion.permitida`; muestra `FormularioCancelacion`; al confirmar llama a `api.cancelarSesion` y reemplaza la sesión mostrada con la respuesta; mensaje de éxito en `role="status"`; errores de red en `role="alert"` sin cerrar el formulario
- [X] T034 [P] [US2] Estilos en `client/src/styles.css` para el formulario de cancelación, el estado "Cancelada" (distinto de "Confirmada" con texto, no solo color) y el botón de acción destructiva con contraste suficiente

**Checkpoint**: US1 y US2 funcionan; cancelar libera el horario.

---

## Phase 5: US3 — Cancelación fuera de plazo (P2)

**Goal**: si faltan menos de 24 h, la sesión ya pasó o ya está cancelada, no se cancela y se explica por qué, tanto al abrir el enlace como al confirmar.

**Independent Test**: abrir el enlace de una sesión a menos de 24 h, de una pasada y de una cancelada: no se ofrece cancelar y se ve el motivo; un PATCH en esos casos da 409 y no cambia nada.

### Tests (escribir primero, verlos fallar)

- [X] T035 [US3] Tests de 409 en `tests/server/api/sesiones.test.ts` (con `reloj` explícito): sesión cuyo inicio está a 24 h − 1 min → `409` "Solo se puede cancelar hasta 24 horas antes del inicio de la sesión"; inicio a exactamente 24 h (`reloj: () => new Date("2026-10-20T18:00:00-03:00")`, sesión `2026-10-21 18:00`) → `200`; sesión ya empezada → `409` "La sesión ya ocurrió y no se puede cancelar"; sesión ya cancelada con `motivoCancelacion` y `canceladaEn` → `409` "La sesión ya estaba cancelada" y `sesiones.json` conserva el motivo y el `canceladaEn` originales; en todos los 409, `sesiones.json` queda igual que antes. Agregar un test de `GET` con sesión a menos de 24 h → `cancelacion: { permitida: false, razon: "fuera_de_plazo", mensaje: … }`
- [X] T036 [US3] Test de API: dos `PATCH` seguidos a la misma sesión → el primero `200`, el segundo `409` "La sesión ya estaba cancelada" (edge case de la spec), en `tests/server/api/sesiones.test.ts`
- [X] T037 [US3] Tests en `tests/client/SesionPage.test.tsx`: con `cancelacion: { permitida: false, razon: "fuera_de_plazo", mensaje }` no está el botón "Cancelar sesión" y se ve el `mensaje` en un aviso; ídem para `ya_ocurrio`; para `ya_cancelada` se ve el estado "Cancelada" sin aviso de error; si el `PATCH` responde `409` (el plazo venció mientras la página estaba abierta) se muestra el `error` del servidor en `role="alert"`, se cierra el formulario, se recarga el detalle y desaparece "Cancelar sesión"

### Implementación

- [X] T038 [US3] En `client/src/pages/SesionPage.tsx`: si `!cancelacion.permitida` y `razon !== "ya_cancelada"`, mostrar el `mensaje` en un aviso (`.aviso-error` o una variante informativa) en lugar del botón; ante `ErrorDeApi` con `status === 409` en la cancelación, mostrar el mensaje, cerrar el formulario y llamar a `recargar()` del detalle
- [X] T039 [US3] Verificar que `cancelar` en `server/services/sesiones.ts` no escribe en el repositorio en ningún camino de error (los tests T035/T036 lo cubren; corregir si alguno falla)

**Checkpoint**: las tres historias funcionan de forma independiente.

---

## Phase 6: Polish & Cross-Cutting

- [X] T040 [P] Documentar en `specs/001-reservar-sesion/contracts/api.md`, en la fila de `GET /api/sesiones`, que desde la 003 devuelve `SesionListada[]` sin `id` (con enlace a `specs/003-cancelar-sesion/contracts/api.md`)
- [X] T041 Correr `npm test`, `npm run lint` y `npm run typecheck`; corregir hasta que pasen sin errores, sin `any`, `@ts-ignore` ni `eslint-disable` sin justificación (Principio VIII). Si falla un test de `ejercicios/`, no corregirlo: frenar y avisar al usuario
- [X] T042 Recorrer `specs/003-cancelar-sesion/quickstart.md` (manual) con `npm run dev`: reservar, recargar, copiar, cancelar con y sin motivo, horario liberado, sesión a < 24 h, `/sesiones/no-existe`, todo con teclado y a 375 px. Durante la prueba la app escribe en `data/sesiones.json` (es lo esperable). Al terminar, correr `npm run seed`, la forma oficial del seminario de regenerar los datos de prueba: genera sesiones nuevas a partir de hoy, no restaura las anteriores. No editar `data/` a mano

---

## Dependencies & Execution Order

- **Phase 1 → Phase 2**: la línea de base va primero.
- **Phase 2** bloquea todo: T002 antes que cualquier otra; T003/T004 → T005/T006; T007 antes que T011, T025, T035; T008 → T009.
- **US1 (Phase 3)** depende solo de Phase 2. Es el MVP.
- **US2 (Phase 4)** depende de Phase 2 y, para la parte de cliente (T026, T033), de `SesionPage` de US1 (T019). La parte de servidor (T024, T025, T027–T030) puede hacerse en paralelo con US1.
- **US3 (Phase 5)** depende de T029 (servicio `cancelar`) para los tests de API y de T033 para los de cliente.
- **Polish** al final.

Dentro de cada historia: tests → dominio → repositorio → servicio → ruta → cliente API → componentes → página.

## Parallel Examples

**Phase 2**: T003 (`fechas.test.ts`), T004 (`cancelacion.test.ts`) y T010 (`fixtures.ts`) en paralelo.

**US1**: T014 (`ReservaPage.test.tsx`) en paralelo con T012 → T013, que comparten `SesionPage.test.tsx` y van en secuencia; después T016 (`api/client.ts`), T017 (`DetalleSesion.tsx`), T018 (`CopiarEnlace.tsx`) y T023 (`styles.css`) en paralelo.

**US2**: T024 (`validaciones.test.ts`) en paralelo. T025 (`sesiones.test.ts`) y T026 (`SesionPage.test.tsx`) no llevan [P] porque comparten archivo con tareas de otras fases; después T031 (`api/client.ts`), T032 (`FormularioCancelacion.tsx`) y T034 (`styles.css`) en paralelo.

**US3**: sin tareas [P]. T035 → T036 comparten `sesiones.test.ts` y van en secuencia; T037 (`SesionPage.test.tsx`) comparte archivo con T026.

## Implementation Strategy

1. **MVP**: Phase 1 + Phase 2 + US1. El colectivo ya tiene un enlace estable a su sesión y el listado deja de exponer ids.
2. **+ US2**: cancelación con motivo y liberación del horario: el objetivo de la feature.
3. **+ US3**: rechazos explicados en la pantalla y en la API.
4. Polish: contrato de la 001, calidad y verificación manual.

Cada checkpoint deja `npm test` en verde y se puede demostrar por separado.
