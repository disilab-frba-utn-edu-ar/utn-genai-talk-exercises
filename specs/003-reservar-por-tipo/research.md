# Research: Reservar por tipo de asesoría, sin elegir mentora

Se reutilizan todas las decisiones de [001/research.md](../001-reservar-sesion/research.md)
(D1–D7): stack, almacenamiento JSON, cálculo de horarios cada 30 minutos, "puede dar",
fechas locales y validación manual. Acá solo van las decisiones nuevas.

## R1 — Horarios ofrecidos = unión de los horarios de cada mentora

- **Decisión**: para un tipo de asesoría, se calcula `calcularDiasDisponibles` (D3) para
  cada mentora que `puedeDar` ese tipo, y una función pura nueva
  `unirDiasDisponibles(listas: DiaDisponible[][]): DiaDisponible[]` los combina: agrupa
  por fecha, deduplica horarios por `inicio`, ordena fechas y horarios y descarta los días
  sin horarios.
- **Por qué**: reutiliza el cálculo ya testeado de la feature 001 sin duplicar reglas
  (disponibilidad, superposición, pasado, paso de 30 minutos). Con decenas de mentoras y
  14 días el costo es despreciable.
- **Alternativas**: recorrer los rangos de todas las mentoras a la vez en un solo
  algoritmo (más eficiente, pero duplica la lógica de `calcularHorarios`).

## R2 — Regla de reparto como función pura

- **Decisión**: `elegirMentora(candidatas, sesiones, franja, hoy)` en
  `server/domain/asignacion.ts`:
  1. Se queda con las candidatas libres en la franja: `estaDentroDeDisponibilidad` y
     `!haySuperposicion` (la función de dominio ya existente).
  2. Ordena por cantidad de sesiones confirmadas de la mentora con `fecha` entre `hoy` y
     `hoy + 13 días` (inclusive), ascendente; se cuentan sesiones sin importar su duración.
  3. Desempata por `nombre` con `localeCompare(…, "es")`.
  4. Devuelve la primera o `null` si no queda ninguna.
- **Por qué**: es la regla de la spec (Clarifications, FR-007) y, al ser pura, se testea
  con tablas de casos sin servidor (Principio I y II). No requiere datos nuevos en la
  sesión.
- **Alternativas**: elegir al azar (descartada en la spec); guardar un contador por
  mentora (se desincroniza y viola la idea de derivar todo de las sesiones).

## R3 — Asignar al elegir el horario, reservar al confirmar

- **Decisión**: un endpoint de solo lectura
  `GET /api/tipos-asesoria/:id/asignacion?fecha=&horaInicio=` devuelve la mentora que le
  tocaría al colectivo. La reserva sigue siendo el `POST /api/sesiones` existente, con el
  `mentoraId` que el colectivo vio (FR-008).
- **Por qué**: la spec pide mostrar la mentora antes de confirmar y no cambiarla sin
  avisar (FR-006, FR-009). Reutilizar el `POST` garantiza que la sesión pasa exactamente
  por las mismas validaciones de dominio que la reserva con mentora (FR-010) y que el
  conflicto se detecta con la regla de superposición ya implementada.
- **Alternativas**:
  - Un `POST /api/sesiones/por-tipo` que asigne y reserve en un paso: no permite mostrar
    la mentora antes de confirmar.
  - Reservar provisoriamente al elegir el horario (bloqueo temporal): requiere estados
    nuevos de sesión y expiración; fuera de alcance.

## R4 — Conflicto al confirmar

- **Decisión**: si el `POST` responde `409`, el cliente vuelve a pedir la asignación para
  la misma franja:
  - Si devuelve otra mentora, la muestra con un aviso (`role="alert"`) y pide confirmar de
    nuevo, conservando los datos del formulario.
  - Si responde `409` ("No hay mentoras libres en ese horario"), informa que el horario ya
    no está disponible, limpia la elección y recarga los horarios.
- **Por qué**: cumple FR-009 sin agregar al contrato del `POST` un campo de "mentora
  alternativa" que la reserva con mentora no usaría.

## R5 — Tipos que se ofrecen en este camino

- **Decisión**: el cliente muestra los tipos de `GET /api/tipos-asesoria` que aparecen en
  `tiposAsesoria` de al menos una mentora de `GET /api/mentoras` (FR-002).
- **Por qué**: `MentoraPublica.tiposAsesoria` ya trae lo que cada mentora puede dar; no
  hace falta un endpoint nuevo. El servidor igual valida: pedir disponibilidad o
  asignación de un tipo sin mentoras devuelve una lista vacía o `409`.

## R6 — Sin marca de origen en la sesión

- **Decisión**: la sesión no guarda si la mentora la eligió el colectivo o la plataforma.
- **Por qué**: ninguna regla de la spec la usa (el reparto cuenta todas las sesiones) y
  agregarla cambiaría `shared/types.ts`, el seed y los datos sin beneficio. Queda abierta
  para una feature de métricas futura.

## R7 — Entrada desde la portada

- **Decisión**: ruta nueva `/reservar-por-tipo` (página `ReservaPorTipoPage`) y un enlace
  destacado en la portada, junto a los filtros: "¿No sabés a quién elegir? Reservá por
  tipo de asesoría". La confirmación reutiliza `ConfirmacionPage`, que ya muestra la
  mentora.
- **Por qué**: convive con el flujo actual (Assumption de la spec) y reutiliza
  `SelectorTipo`, `SelectorDia`, `SelectorHorario` y `FormularioContacto` sin cambios.
