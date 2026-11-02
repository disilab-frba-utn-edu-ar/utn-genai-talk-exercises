# Research: Cancelar una sesión reservada

## D1 — La regla de cancelación es una función pura

- **Decisión**: `evaluarCancelacion(sesion, ahora)` en `server/domain/cancelacion.ts`.
  Recibe la sesión (`fecha`, `horaInicio`, `estado`) y el instante actual por
  parámetro; devuelve `{ permitida: true }` o `{ permitida: false, razon }` con
  `razon` en `"ya_cancelada" | "ya_ocurrio" | "fuera_de_plazo"`.
  - Orden de evaluación: `ya_cancelada` → `ya_ocurrio` (el inicio es igual o anterior
    a `ahora`) → `fuera_de_plazo` (faltan menos de 24 h) → permitida.
  - Límite: se permite si `inicio − ahora ≥ 24 h` (en milisegundos). Con 24 h exactas
    se puede; un milisegundo después, no (spec FR-005).
  - Constante exportada `ANTICIPACION_MINIMA_MS = 24 * 60 * 60 * 1000`.
- **Por qué**: sin IO ni `Date.now()` adentro, el caso de exactamente 24 h y sus
  vecinos (±1 ms) se testean directo en `tests/server/domain/` (Principio I y II).
- **Alternativa descartada**: calcular el plazo en el servicio o en la ruta (mezcla
  reglas con IO y obliga a testear el borde por HTTP).

## D2 — Hora de referencia: Argentina, independiente del servidor

- **Decisión**: nueva función `instanteEnArgentina(fecha, hora): Date` en
  `server/domain/fechas.ts`, que arma `new Date(\`${fecha}T${hora}:00-03:00\`)`.
  La comparación con `ahora` se hace por instante (`getTime()`), así que no depende
  de la zona horaria del proceso Node.
- **Por qué**: la spec pide comparar el inicio en hora de Argentina contra el instante
  real (Clarifications Q3). Argentina usa UTC−3 fijo, sin horario de verano (supuesto
  de la spec), así que un desplazamiento constante alcanza.
- **Alternativas descartadas**: `Intl`/`toLocaleString` con `America/Argentina/Buenos_Aires`
  (más código para el mismo resultado hoy); usar la hora local del servidor como hace
  `fechas.ts` en la reserva (el plazo se correría si el servidor está en UTC).
- **Riesgo conocido, fuera de alcance**: la reserva sigue usando la hora local del
  servidor. Queda registrado como deuda técnica DT1 (ver al final).

## D3 — Tests que no dependen de la zona horaria de la máquina

- **Decisión**: los tests de dominio construyen `ahora` con offset explícito
  (`new Date("2026-10-18T18:00:00-03:00")`). Los tests de API de cancelación pasan un
  `reloj` explícito con offset (`AHORA_AR` en `tests/server/api/helpers.ts`), sin
  tocar el `AHORA` existente, que está en hora local.
- **Por qué**: `AHORA = new Date(2026, 9, 18, 12, 0)` cae en otro instante según la
  zona de la máquina; en UTC−10 una sesión del lunes 18:00 ART quedaría a menos de
  24 h y el test fallaría sin motivo.

## D4 — PATCH /api/sesiones/:id solo cancela

- **Decisión**: el cuerpo admite exactamente `estado` (obligatorio, debe ser
  `"cancelada"`) y `motivo` (opcional). Validación pura en
  `server/domain/validaciones.ts` (`validarCancelacion`):
  - cuerpo no objeto → 400 "El cuerpo de la solicitud debe ser un objeto JSON";
  - `estado` ausente o distinto de `"cancelada"` → 400 "Solo se puede cambiar el estado a cancelada";
  - otra propiedad → 400 "Solo se puede enviar el estado y el motivo";
  - `motivo` no texto → 400; se recorta; vacío o solo espacios ⇒ sin motivo;
    más de `MOTIVO_MAX = 500` caracteres → 400 "El motivo puede tener hasta 500 caracteres".
- Un JSON mal formado da 400 "El cuerpo de la solicitud no es JSON válido" **antes** de
  buscar la sesión: lo corta `express.json()` en `server/app.ts` y nunca llega a la ruta,
  aunque el id no exista.
- Para cuerpos JSON bien formados, el orden del servicio es: 404 (sesión inexistente) →
  400 (cuerpo) → 409 (regla de cancelación) → guardar. Así, con JSON válido, un enlace
  inválido siempre da 404 sin importar el contenido del cuerpo.
- **Respuestas 409** (Principio III, conflicto de estado), un mensaje por razón:
  - `ya_cancelada`: "La sesión ya estaba cancelada"
  - `ya_ocurrio`: "La sesión ya ocurrió y no se puede cancelar"
  - `fuera_de_plazo`: "Solo se puede cancelar hasta 24 horas antes del inicio de la sesión"
  Los textos viven en el dominio (`MENSAJES_CANCELACION`) para que GET y PATCH digan lo mismo.
- **Alternativas descartadas**: `POST /api/sesiones/:id/cancelacion` (el usuario pidió
  PATCH); `DELETE` (borraría la sesión y el motivo, y la spec pide conservarlos).

## D5 — El GET dice de antemano si se puede cancelar

- **Decisión**: `GET /api/sesiones/:id` devuelve `SesionDetalle`: la vista pública más
  `motivoCancelacion?`, `canceladaEn?` y `cancelacion: { permitida: true } |
  { permitida: false; mensaje }`, calculado con la misma `evaluarCancelacion` y el
  `reloj` del servidor.
- **Por qué**: FR-014 pide explicar antes de intentar; calcularlo en el servidor evita
  que el reloj del navegador dé otra respuesta. El PATCH vuelve a evaluar (FR-012).

## D6 — El enlace es el UUID de la sesión, y deja de listarse

- **Decisión**: el enlace es `/sesiones/:id` del cliente, con el `id` UUID v4 que ya
  genera el servidor (Principio V, 122 bits aleatorios: no se adivina ni se deduce).
- **Hallazgo**: hoy `GET /api/sesiones?mentoraId=&fecha=` devuelve `SesionPublica[]`
  **con `id`**. Como el enlace es la única credencial (Q1), cualquiera podría listar ids
  y cancelar sesiones ajenas. **Decisión**: el listado deja de incluir `id` (y nunca
  incluye `motivoCancelacion` ni `canceladaEn`, FR-009): devuelve `SesionListada =
  Omit<SesionPublica, "id">`. El cliente no usa ese listado (solo los tests de API), y
  el test existente sigue pasando porque no mira `id`.
- **Alternativa descartada**: eliminar el endpoint (cambia el contrato de la 001 más de
  lo necesario).
- **Estado**: aprobado por el usuario el 2026-11-02 (ver plan.md, "Decisiones aprobadas").

## D7 — Después de reservar, directo a la página de la sesión

- **Decisión**: `ReservaPage` navega a `/sesiones/${sesion.id}` con
  `state: { recienReservada: true }`. `SesionPage` carga el detalle por GET (sobrevive a
  la recarga, Q4) y, si viene `recienReservada`, muestra el título "¡Sesión confirmada!".
  El aviso de guardar el enlace y el botón de copiar se muestran siempre.
- Se eliminan `ConfirmacionPage.tsx`, la ruta `/confirmacion` y el tipo
  `EstadoConfirmacion`. `/confirmacion` pasa a mostrar la página de no encontrada (antes,
  sin `state`, ya redirigía al inicio). Se reutilizan los estilos `.confirmacion*` y
  `.resumen`.
- **Cambio visible**: la confirmación mostraba nombre y email de contacto (venían del
  POST). La nueva página no los muestra (FR-004, Principio IV).
- **Copiar enlace**: `navigator.clipboard.writeText`; si falla o no existe, el enlace
  queda visible en un campo de solo lectura seleccionable, con su `label`.

## D8 — Persistencia

- **Decisión**: `motivoCancelacion` y `canceladaEn` (ISO 8601 de `reloj()`) son campos
  opcionales de `Sesion` en `sesiones.json`. Se agrega `repos.sesiones.actualizar(sesion)`
  (reemplaza por `id`). Sin archivo nuevo en `data/` y sin tocar `data/` ni `seed.mjs`:
  las sesiones existentes siguen siendo válidas porque los campos son opcionales.
- **Concurrencia**: el handler lee, evalúa y escribe de forma sincrónica en un solo
  proceso Node, así que dos PATCH simultáneos se serializan: el segundo ve
  `ya_cancelada` (edge case de la spec).

## D9 — La sesión cancelada libera el horario sin cambios

- `calcularHorarios` y `haySuperposicion` ya filtran por `estado === "confirmada"`; basta
  con un test de API que cancele y verifique que el horario vuelve a ofrecerse (FR-013).

## Deuda técnica

### DT1 — Zona horaria de la reserva distinta de la de cancelación

- **Qué**: la reserva (`server/services/sesiones.ts` → `crear`, `server/domain/horarios.ts`,
  `server/domain/fechas.ts`) interpreta "hoy" y "ya pasó" con la hora local del proceso
  Node (`getHours`, `fechaDe`). La cancelación (esta feature) interpreta el inicio en
  UTC−3 y lo compara por instante (D2).
- **Impacto**: en un servidor en UTC−3 coinciden. En otra zona, los dos flujos pueden
  decidir distinto si una sesión ya pasó: por ejemplo, ofrecer como reservable un horario
  que la cancelación considera ocurrido, o al revés.
- **Por qué no se resuelve acá**: cambiar la reserva toca la feature 001 y sus tests de
  disponibilidad, que dependen del `AHORA` local de `tests/server/api/helpers.ts`.
- **Propuesta**: una feature aparte que haga que la reserva use `instanteEnArgentina`
  y un "hoy" en hora de Argentina, y que migre los tests a un reloj con offset explícito.
- **Registrado**: 2026-11-02 (`/speckit-analyze`, hallazgo I4).
