# Feature Specification: Cancelar una sesión reservada

**Feature Branch**: `004-cancelar-sesion`
**Created**: 2026-11-01
**Status**: Approved
**Input**: User description: "Quiero que un colectivo pueda cancelar una sesión que ya
reservó con una mentora. Hoy, si un colectivo no puede ir, no tiene forma de avisar, y ese
horario queda ocupado aunque nadie lo vaya a usar. La idea es que, cuando el colectivo
reserva, le quede un enlace propio a esa sesión, donde ve el detalle y puede cancelarla.
Puede cancelar con tiempo: hasta 24 horas antes de que empiece la sesión, y si quiere puede
dejar un motivo, que no es obligatorio. Si ya faltan menos de 24 horas, no lo dejamos
cancelar y le explicamos por qué. Cuando una sesión se cancela, ese horario de la mentora
vuelve a quedar libre para que otro colectivo lo reserve. Cosas que todavía no tengo
resueltas: qué pasa si faltan justo 24 horas y contra qué hora se compara (la del servidor
o la de Argentina); qué pasa si alguien intenta cancelar una sesión que ya estaba cancelada
o que ya pasó; y si alcanza con que cualquiera que tenga el enlace pueda cancelar sin
iniciar sesión, y quién puede ver el motivo."

## Clarifications

### Session 2026-11-01

- Q: ¿Alcanza con tener el enlace para ver y cancelar, sin iniciar sesión? → A: Sí. El enlace es difícil de adivinar y es la única credencial; no se pide ningún otro dato.
- Q: ¿Quién puede ver el motivo de la cancelación? → A: Solo quien tiene el enlace de la sesión. Hoy no existe una vista para mentoras, así que por ahora el motivo se ve únicamente desde ese enlace.
- Q: ¿Con exactamente 24 horas se puede cancelar, y contra qué hora se compara? → A: Sí, con 24 horas exactas se puede. Se toma el inicio en hora de Argentina y se compara con el instante actual real, no con la hora local del servidor.
- Q: ¿Qué pasa si se intenta cancelar una sesión ya cancelada o que ya pasó? → A: Se rechaza sin modificar la sesión y con un mensaje distinto para cada caso (default adoptado en la spec, sin objeciones).

### Session 2026-11-02

- Q: ¿Cómo se evita que el colectivo pierda el enlace si cierra o recarga el resumen sin copiarlo? → A: Al confirmar, el colectivo pasa directamente a la página del enlace de la sesión, que muestra el resumen, un botón para copiar el enlace y un aviso de que lo guarde.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Ver mi sesión desde su enlace (Priority: P1)

Al confirmar una reserva, el colectivo pasa directamente a la página del enlace propio de
esa sesión, que funciona como resumen de la reserva: puede copiar el enlace y se le avisa
que lo guarde. Al recargarla o abrirla más tarde ve el detalle de la sesión: mentora, tipo
de asesoría, día, horario, colectivo, proyecto y estado (confirmada o cancelada).

**Why this priority**: sin un lugar estable donde volver a encontrar la sesión no hay forma
de cancelarla. Por sí sola ya da valor: el colectivo puede consultar lo que reservó.

**Independent Test**: reservar una sesión, comprobar que se llega a la página de su enlace, copiarlo, abrirlo en una
pestaña nueva y comprobar que muestra el mismo detalle y el estado "confirmada".

**Acceptance Scenarios**:

1. **Given** el colectivo acaba de confirmar una reserva, **When** se completa la confirmación, **Then** queda en la página del enlace propio de la sesión, con el resumen, un botón para copiar el enlace y un aviso de que lo guarde.
2. **Given** el colectivo está en la página del enlace de la sesión que acaba de reservar, **When** la recarga, **Then** sigue viendo el mismo detalle.
3. **Given** el colectivo tiene el enlace, **When** lo abre, **Then** ve mentora, tipo de asesoría, día, horario (en hora de Argentina), colectivo, proyecto y estado.
4. **Given** un enlace que no corresponde a ninguna sesión, **When** se abre, **Then** se muestra una página de "sesión no encontrada" con un enlace al inicio.
5. **Given** el colectivo abre el enlace, **Then** no ve los datos de contacto de la mentora.

---

### User Story 2 — Cancelar con anticipación (Priority: P1)

Desde el enlace de la sesión, el colectivo elige cancelar, puede escribir un motivo
opcional y confirma. La sesión queda cancelada y ese horario vuelve a ofrecerse a otros
colectivos.

**Why this priority**: es el objetivo de la feature: liberar horarios que nadie va a usar.

**Independent Test**: con una sesión que empieza dentro de más de 24 horas, cancelarla
desde su enlace con y sin motivo, y comprobar que el estado pasa a "cancelada" y que el
horario vuelve a aparecer al reservar con esa mentora.

**Acceptance Scenarios**:

1. **Given** una sesión confirmada que empieza en más de 24 horas, **When** el colectivo abre su enlace, **Then** ve la opción de cancelar.
2. **Given** eligió cancelar, **When** se le pide confirmar, **Then** puede escribir un motivo opcional y confirmar o volver atrás sin cancelar.
3. **Given** confirmó la cancelación sin motivo, **Then** la sesión queda "cancelada" y ve un mensaje que lo confirma.
4. **Given** confirmó la cancelación con motivo, **Then** la sesión queda "cancelada" y el motivo queda guardado.
5. **Given** la sesión fue cancelada, **When** otro colectivo consulta los horarios de esa mentora para ese día y tipo de asesoría, **Then** el horario vuelve a ofrecerse.
6. **Given** la sesión fue cancelada, **When** se vuelve a abrir el enlace, **Then** muestra el estado "cancelada" y ya no ofrece cancelar.

---

### User Story 3 — Cancelación fuera de plazo (Priority: P2)

Si faltan menos de 24 horas para el inicio, o la sesión ya pasó, o ya estaba cancelada, el
colectivo no puede cancelarla y se le explica por qué.

**Why this priority**: protege el tiempo de la mentora, que ya se organizó para la sesión;
sin una explicación, el colectivo queda confundido.

**Independent Test**: con una sesión que empieza en menos de 24 horas, abrir su enlace y
comprobar que no se ofrece cancelar y que se explica por qué no se puede cancelar; repetir con una sesión
pasada y una ya cancelada.

**Acceptance Scenarios**:

1. **Given** una sesión confirmada que empieza en menos de 24 horas, **When** el colectivo abre su enlace, **Then** no se ofrece cancelar y se explica que solo se puede cancelar hasta 24 horas antes del inicio.
2. **Given** el colectivo abrió el enlace con tiempo, pero al confirmar ya faltan menos de 24 horas, **When** confirma, **Then** la sesión no se cancela y se le explica por qué.
3. **Given** una sesión cuyo inicio ya pasó, **When** se intenta cancelar, **Then** no se cancela y se explica que la sesión ya ocurrió.
4. **Given** una sesión ya cancelada, **When** se intenta cancelar otra vez, **Then** no cambia nada (ni el motivo ni el momento de cancelación) y se informa que ya estaba cancelada.

---

### Edge Cases

- ¿Qué pasa si faltan exactamente 24 horas? → Todavía se puede cancelar; desde un instante después, ya no (ver FR-005).
- ¿Qué pasa si el servidor corre en otra zona horaria? → El plazo no cambia: el inicio se interpreta en hora de Argentina y se compara con el instante actual real.
- ¿Qué pasa si alguien reenvía el enlace? → Quien lo reciba puede ver y cancelar la sesión; es una decisión aceptada (ver Assumptions).
- ¿Qué pasa si el motivo es muy largo? → Se limita a 500 caracteres: el campo no permite escribir más y muestra cuántos van; el sistema también lo valida al confirmar.
- ¿Qué pasa si el motivo tiene solo espacios? → Se trata como sin motivo.
- ¿Qué pasa si dos personas con el mismo enlace cancelan casi a la vez? → La primera cancela; la segunda ve que ya estaba cancelada.
- ¿Qué pasa si se cae la conexión al confirmar la cancelación? → Se muestra un error, la sesión sigue como estaba y el motivo escrito no se pierde.
- ¿Qué pasa si, después de cancelar, otro colectivo reserva ese horario? → Es una sesión nueva e independiente; la cancelada sigue cancelada.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Al confirmar una reserva, el sistema DEBE llevar al colectivo directamente a la página del enlace propio de esa sesión, que reemplaza al resumen de la reserva, y esa página DEBE ofrecer copiar el enlace y avisar que conviene guardarlo.
- **FR-002**: El enlace DEBE ser difícil de adivinar: no debe poder deducirse a partir de otros enlaces ni de los datos de la sesión.
- **FR-003**: Al abrir el enlace, el sistema DEBE mostrar el detalle de la sesión: mentora, tipo de asesoría, día, horario de inicio y fin en hora de Argentina, colectivo, proyecto y estado.
- **FR-004**: El detalle NO DEBE mostrar los datos de contacto de la mentora ni los datos de contacto del colectivo.
- **FR-005**: El sistema DEBE permitir cancelar una sesión confirmada desde su enlace cuando falten 24 horas o más para su inicio; con exactamente 24 horas todavía se puede. El plazo se calcula tomando el inicio de la sesión en hora de Argentina y comparándolo con el instante actual real, sin depender de la zona horaria configurada en el servidor.
- **FR-006**: Tener el enlace DEBE alcanzar para ver y cancelar la sesión, sin iniciar sesión ni pedir ningún otro dato.
- **FR-007**: El sistema DEBE pedir una confirmación explícita antes de cancelar, con la posibilidad de volver atrás.
- **FR-008**: El sistema DEBE aceptar un motivo opcional de hasta 500 caracteres y guardarlo junto con la sesión cancelada.
- **FR-009**: El motivo DEBE verse solo en la pantalla del enlace de esa sesión; no DEBE aparecer en ningún listado, en la disponibilidad ni en otra vista pública.
- **FR-010**: El sistema DEBE registrar el momento en que se canceló la sesión.
- **FR-011**: El sistema DEBE rechazar la cancelación, sin modificar la sesión, cuando falten menos de 24 horas para el inicio, cuando el inicio ya pasó o cuando la sesión ya estaba cancelada, e informar en cada caso un mensaje claro y distinto.
- **FR-012**: El sistema DEBE validar el plazo y el estado en el momento de confirmar la cancelación, aunque la pantalla ya lo haya evaluado al abrirse.
- **FR-013**: Una sesión cancelada NO DEBE ocupar el horario de la mentora: ese horario DEBE volver a ofrecerse si sigue dentro de la disponibilidad y del período reservable.
- **FR-014**: Al abrir el enlace, la pantalla DEBE indicar de antemano si la sesión se puede cancelar y, si no, por qué.
- **FR-015**: La pantalla del enlace DEBE manejar los estados cargando, error y sesión no encontrada.

### Key Entities

- **Sesión**: reserva existente de un colectivo con una mentora. Esta feature le suma: el enlace propio (identificador difícil de adivinar), el motivo de cancelación opcional y el momento de cancelación. Su estado pasa de `confirmada` a `cancelada` y nunca vuelve atrás.
- **Horario**: se sigue derivando de la disponibilidad descontando solo las sesiones confirmadas; las canceladas no lo ocupan.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un colectivo cancela una sesión desde su enlace en menos de 1 minuto y en no más de 3 interacciones.
- **SC-002**: El 100% de los horarios de sesiones canceladas vuelven a ofrecerse en la siguiente consulta de horarios de esa mentora, si siguen siendo reservables.
- **SC-003**: El 0% de las cancelaciones se aceptan con menos de 24 horas de anticipación, con la sesión ya pasada o ya cancelada.
- **SC-004**: En el 100% de los rechazos, el colectivo ve un mensaje que explica el motivo concreto.
- **SC-005**: Ninguna vista del enlace contiene datos de contacto de mentoras ni de colectivos.
- **SC-006**: El flujo de ver y cancelar es usable con teclado y en una pantalla de 375px de ancho.

## Assumptions

- Las fechas y horarios de las sesiones están expresados en hora de Argentina (UTC−3, sin horario de verano), igual que en la feature de reserva.
- Una sesión cancelada no se puede reactivar; para volver a tener ese horario, el colectivo reserva de nuevo.
- La pantalla del enlace muestra el mismo detalle que mostraba el resumen de la reserva; no expone el email ni el nombre de contacto del colectivo.
- Las sesiones reservadas antes de esta feature también se pueden ver y cancelar si se tiene su enlace.
- No hay notificaciones: ni la mentora ni el colectivo reciben un aviso automático de la cancelación.
- Quien tenga el enlace actúa en nombre del colectivo; si el enlace se comparte, se acepta que otra persona pueda cancelar.
- Cuando exista una vista para mentoras, mostrarles el motivo será una feature aparte.

## Out of Scope

- Modificar o reprogramar una sesión.
- Que la mentora cancele una sesión.
- Notificaciones por email de reserva o cancelación.
- Recuperar el enlace si el colectivo lo pierde.
- Login y cuentas de usuario.
- Listados de sesiones por colectivo o por mentora.
- Mostrar el motivo de cancelación a la mentora.
- Mantener una pantalla de confirmación separada de la página del enlace.
