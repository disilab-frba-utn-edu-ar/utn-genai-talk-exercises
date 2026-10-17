# Feature Specification: Reservar una sesión de mentoría

**Feature Branch**: `001-reservar-sesion`
**Created**: 2026-10-17
**Status**: Approved
**Input**: User description: "Quiero la base de Mentorías a Voluntad: que un colectivo
pueda ver las personas mentoras que donan horas de asesoramiento, filtrarlas por
habilidad y reservar una sesión eligiendo el tipo de asesoría, el día y el horario.
Al confirmar, ve el resumen de su sesión."

## Clarifications

### Session 2026-10-17

- Q: ¿Cuántos días hacia adelante puede reservar un colectivo? → A: Los próximos 14 días, incluyendo hoy.
- Q: ¿Cómo se identifica el colectivo que reserva si todavía no hay login? → A: Elige su colectivo de una lista precargada e indica un nombre y un email de contacto.
- Q: ¿Se muestran los datos de contacto de la mentora en la confirmación? → A: No. La confirmación solo muestra los datos de la sesión; el contacto de la mentora queda fuera de alcance de esta feature.
- Q: ¿Cada cuánto empiezan los horarios disponibles? → A: Cada 30 minutos dentro de la disponibilidad, siempre que la sesión completa entre en el rango.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Explorar mentoras por habilidad (Priority: P1)

Una persona de un colectivo entra a la plataforma y ve las mentoras disponibles: su
nombre, pronombres, una presentación breve y sus habilidades. Puede filtrar el
listado por una habilidad para encontrar a quien sabe de lo que necesita.

**Why this priority**: sin ver quién ofrece qué, no hay reserva posible. Por sí sola
ya da valor: el colectivo descubre a quién pedirle ayuda.

**Independent Test**: abrir la página principal, ver al menos una mentora con sus
habilidades, elegir una habilidad y comprobar que solo quedan mentoras que la tienen.

**Acceptance Scenarios**:

1. **Given** hay mentoras cargadas, **When** el colectivo abre la página principal, **Then** ve cada mentora con nombre, presentación y habilidades.
2. **Given** el listado completo, **When** elige la habilidad "Testing E2E con Cypress", **Then** solo ve las mentoras que tienen esa habilidad.
3. **Given** un filtro aplicado, **When** lo quita, **Then** vuelve a ver todas las mentoras.
4. **Given** ninguna mentora tiene la habilidad elegida, **When** filtra, **Then** ve un mensaje que lo explica y una forma de quitar el filtro.

---

### User Story 2 — Reservar una sesión (Priority: P1)

Desde una mentora, el colectivo elige el tipo de asesoría que necesita, ve los días
con lugar, elige un horario, completa sus datos y confirma. Recibe un resumen con
todo lo reservado.

**Why this priority**: es el objetivo principal del producto.

**Independent Test**: elegir cualquier mentora, un tipo de asesoría que ofrezca, un
día y un horario, completar los datos y confirmar. Debe aparecer el resumen y ese
horario no debe volver a ofrecerse.

**Acceptance Scenarios**:

1. **Given** el colectivo está en la página de una mentora, **When** la página carga, **Then** ve solo los tipos de asesoría que esa mentora puede dar, con su duración.
2. **Given** eligió un tipo de asesoría, **When** se muestran los días, **Then** solo aparecen días de los próximos 14 con al menos un horario libre.
3. **Given** eligió un día, **When** se muestran los horarios, **Then** cada horario tiene la duración del tipo de asesoría y ninguno se superpone con sesiones confirmadas de la mentora.
4. **Given** eligió horario, **When** completa colectivo, proyecto, nombre y email válidos y confirma, **Then** ve el resumen: mentora, tipo de asesoría, día, horario, colectivo y proyecto.
5. **Given** la sesión fue confirmada, **When** otro colectivo consulta ese día, **Then** ese horario ya no aparece.

---

### User Story 3 — Mentora sin lugar (Priority: P2)

El colectivo elige un tipo de asesoría pero la mentora no tiene horarios libres en
los próximos 14 días.

**Why this priority**: sin manejo explícito, el colectivo queda en un estado confuso.

**Independent Test**: con una mentora sin disponibilidad, elegir un tipo de asesoría
y comprobar que se informa y se ofrece volver al listado.

**Acceptance Scenarios**:

1. **Given** la mentora no tiene horarios libres, **When** el colectivo elige un tipo de asesoría, **Then** ve un mensaje claro de que no hay lugar en los próximos 14 días.
2. **Given** ve ese mensaje, **Then** puede volver al listado de mentoras.

---

### Edge Cases

- ¿Qué pasa si el colectivo intenta confirmar sin completar todos los datos? → El botón de confirmar no se habilita y cada campo indica qué falta.
- ¿Qué pasa si el email no tiene formato válido? → Se informa en el campo y no se envía.
- ¿Qué pasa si otro colectivo reservó ese horario mientras tanto? → Se informa que el horario ya no está disponible y se actualizan los horarios del día.
- ¿Qué pasa si la mentora no existe (enlace viejo o mal escrito)? → Se muestra una página de "no encontrada" con un enlace al inicio.
- ¿Qué pasa si se cae la conexión al confirmar? → Se muestra un error, no se crea la sesión y no se pierden los datos cargados.
- ¿Qué pasa con los horarios de hoy que ya pasaron? → No se ofrecen.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE listar todas las mentoras con nombre, pronombres (si los indicó), presentación y habilidades.
- **FR-002**: El sistema DEBE permitir filtrar el listado por una habilidad del catálogo.
- **FR-003**: El sistema DEBE mostrar, para una mentora, solo los tipos de asesoría que puede dar (tiene al menos una de sus habilidades relacionadas).
- **FR-004**: El sistema DEBE ofrecer solo días de los próximos 14 (incluido hoy) con al menos un horario libre para el tipo elegido.
- **FR-005**: El sistema DEBE calcular los horarios cada 30 minutos dentro de la disponibilidad de la mentora, con la duración del tipo de asesoría, sin superponerse con sesiones confirmadas y sin incluir horarios pasados.
- **FR-006**: El sistema DEBE pedir colectivo (de una lista), descripción del proyecto, nombre y email de contacto antes de confirmar.
- **FR-007**: El sistema DEBE validar todos los datos al confirmar, aunque ya se hayan validado en la pantalla.
- **FR-008**: El sistema DEBE guardar la sesión confirmada para que su horario deje de ofrecerse.
- **FR-009**: El sistema DEBE mostrar un resumen de la sesión confirmada.
- **FR-010**: El sistema NO DEBE mostrar en ningún momento los datos de contacto de la mentora.
- **FR-011**: El sistema DEBE informar con mensajes claros cuando no hay mentoras para un filtro, cuando no hay lugar y cuando ocurre un error.

### Key Entities

- **Habilidad**: conocimiento técnico del catálogo, identificado por un código único normalizado.
- **Tipo de asesoría**: qué clase de ayuda se pide y cuánto dura; relacionado con habilidades.
- **Mentora**: persona que dona horas; tiene habilidades, disponibilidad semanal y contacto privado.
- **Colectivo**: organización que reserva.
- **Sesión**: reserva de un colectivo con una mentora, para un tipo de asesoría, en un día y horario.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un colectivo completa una reserva en menos de 2 minutos y en no más de 5 interacciones después de elegir mentora.
- **SC-002**: El 100% de los horarios ofrecidos respetan la disponibilidad de la mentora y no se superponen con sesiones confirmadas.
- **SC-003**: Ninguna respuesta pública contiene datos de contacto de mentoras.
- **SC-004**: El flujo completo es usable con teclado y en una pantalla de 375px de ancho.

## Out of Scope

- Cancelar o modificar sesiones.
- Ausencias o bloqueos de agenda de la mentora.
- Login y cuentas de usuario.
- Alta y edición de mentoras, colectivos y catálogos (se precargan).
- Notificaciones por email.
