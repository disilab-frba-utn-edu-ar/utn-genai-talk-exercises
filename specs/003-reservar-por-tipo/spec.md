# Feature Specification: Reservar por tipo de asesoría, sin elegir mentora

**Feature Branch**: `003-reservar-por-tipo`
**Created**: 2026-10-31
**Status**: Draft
**Input**: User description: "Como colectivo que no conoce a nadie del ambiente, quiero reservar por tipo de asesoría sin elegir mentora, para destrabar mi proyecto igual"

## Clarifications

### Session 2026-10-31

- Q: ¿El colectivo conoce qué mentora le toca antes de confirmar o recién en el resumen? → A: Antes de confirmar: al elegir el horario la plataforma le muestra la mentora asignada. Si esa mentora se ocupa antes de confirmar, se le avisa del cambio y tiene que volver a confirmar.
- Q: ¿Qué regla de reparto se usa entre mentoras libres en el mismo horario? → A: La que tiene menos sesiones confirmadas en los próximos 14 días; si empatan, la que lleva más tiempo sin recibir una sesión (desempate redefinido en la pregunta siguiente).
- Q: ¿Cómo se desempata entre mentoras libres con la misma cantidad de sesiones? → A: Por orden alfabético del nombre de la mentora; no se usa el tiempo desde su última sesión.
- Q: ¿El reparto cuenta sesiones o minutos donados? → A: Cantidad de sesiones confirmadas en los próximos 14 días, sin importar cuánto dura cada una.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Reservar eligiendo solo el tipo de asesoría (Priority: P1)

Una persona de un colectivo no sabe a quién elegir: no conoce a nadie del ambiente y
los perfiles de las mentoras no le dicen mucho. En lugar de elegir una mentora, elige
qué tipo de ayuda necesita (por ejemplo, "Revisión de código"). La plataforma le
muestra los días y horarios en los que **alguna** mentora que puede dar esa asesoría
tiene lugar. El colectivo elige día y horario y la plataforma le muestra qué mentora
le tocaría. Completa sus datos, confirma y ve el resumen de la sesión.

**Why this priority**: es el corazón de la feature. Por sí sola permite que un
colectivo sin contactos reserve una sesión sin tener que evaluar perfiles.

**Independent Test**: desde la página principal, entrar a "reservar por tipo de
asesoría", elegir un tipo, un día y un horario, completar los datos y confirmar. Debe
aparecer el resumen con una mentora asignada que puede dar ese tipo de asesoría, y
esa mentora debe quedar ocupada en ese horario.

**Acceptance Scenarios**:

1. **Given** el colectivo está en la página principal, **When** busca cómo reservar sin elegir mentora, **Then** encuentra un camino visible para reservar por tipo de asesoría.
2. **Given** entró a ese camino, **When** la página carga, **Then** ve todos los tipos de asesoría que al menos una mentora puede dar, con su nombre, descripción y duración.
3. **Given** eligió un tipo de asesoría, **When** se muestran los días, **Then** solo aparecen días de los próximos 14 (incluido hoy) en los que al menos una mentora que puede dar ese tipo tiene un horario libre.
4. **Given** eligió un día, **When** se muestran los horarios, **Then** cada horario aparece una sola vez aunque varias mentoras estén libres en él, y cada uno tiene la duración del tipo de asesoría.
5. **Given** eligió un horario, **When** se muestra el formulario de datos, **Then** ve el nombre, los pronombres (si los indicó) y la presentación de la mentora que le tocaría, sin sus datos de contacto.
6. **Given** ve la mentora asignada, **When** completa colectivo, proyecto, nombre y email válidos y confirma, **Then** la sesión queda confirmada con esa mentora.
7. **Given** la sesión fue confirmada, **When** ve el resumen, **Then** ve el tipo de asesoría, día, horario, colectivo, proyecto y la mentora.

---

### User Story 2 — Asignación equitativa entre mentoras (Priority: P2)

Cuando varias mentoras están libres en el horario elegido, la plataforma reparte las
sesiones para que el tiempo donado no recaiga siempre sobre las mismas personas.

**Why this priority**: sin una regla de reparto, la asignación es arbitraria y puede
sobrecargar a una mentora mientras otras no reciben pedidos. Es importante para la
comunidad, pero la reserva funciona igual sin ella.

**Independent Test**: con dos mentoras libres en el mismo horario y una de ellas con
más sesiones confirmadas que la otra, reservar por tipo y comprobar a quién se le
asigna la sesión.

**Acceptance Scenarios**:

1. **Given** dos o más mentoras pueden dar el tipo y están libres en el horario elegido, **When** el colectivo elige ese horario, **Then** se le asigna la que tiene menos sesiones confirmadas en los próximos 14 días.
2. **Given** dos mentoras libres empatan en cantidad de sesiones, **When** el colectivo elige el horario, **Then** se le asigna la que va primero por orden alfabético de nombre.
3. **Given** solo una mentora está libre en ese horario, **When** el colectivo elige el horario, **Then** se le asigna a ella.

---

### User Story 3 — Sin lugar para ese tipo de asesoría (Priority: P3)

El colectivo elige un tipo de asesoría pero ninguna mentora que pueda darlo tiene
horarios libres en los próximos 14 días.

**Why this priority**: sin un mensaje explícito el colectivo queda en un estado
confuso, pero es un caso menos frecuente.

**Independent Test**: con un tipo de asesoría cuyas mentoras no tienen disponibilidad,
elegirlo y comprobar que se informa y se ofrecen alternativas.

**Acceptance Scenarios**:

1. **Given** ninguna mentora que puede dar el tipo tiene lugar, **When** el colectivo lo elige, **Then** ve un mensaje claro de que no hay lugar en los próximos 14 días.
2. **Given** ve ese mensaje, **Then** puede elegir otro tipo de asesoría o volver al listado de mentoras.

---

### Edge Cases

- ¿Qué pasa si, mientras el colectivo completa sus datos, la mentora asignada queda ocupada en ese horario? → Al confirmar no se crea la sesión. Si otra mentora que puede dar el tipo sigue libre en ese horario, se le muestra al colectivo la nueva mentora asignada (según la regla de reparto), conservando los datos cargados, y tiene que volver a confirmar. Si no queda ninguna, se informa que el horario ya no está disponible y se actualizan los horarios del día.
- ¿Qué pasa si un tipo de asesoría no lo puede dar ninguna mentora? → No se ofrece en este camino.
- ¿Qué pasa con los horarios de hoy que ya pasaron? → No se ofrecen.
- ¿Qué pasa si el colectivo intenta confirmar sin completar todos los datos o con un email inválido? → Igual que en la reserva con mentora: se indica qué falta en cada campo y no se envía.
- ¿Qué pasa si se cae la conexión al confirmar? → Se muestra un error, no se crea la sesión y no se pierden los datos cargados.
- ¿Qué pasa si el colectivo pide un horario en el que ninguna mentora está libre (por ejemplo, manipulando el pedido)? → Se rechaza como conflicto y no se crea la sesión.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE ofrecer, además de la reserva eligiendo mentora, un camino para reservar eligiendo solo el tipo de asesoría.
- **FR-002**: El sistema DEBE mostrar en ese camino solo los tipos de asesoría que al menos una mentora puede dar.
- **FR-003**: El sistema DEBE ofrecer solo días de los próximos 14 (incluido hoy) en los que al menos una mentora que puede dar el tipo elegido tiene un horario libre.
- **FR-004**: El sistema DEBE ofrecer como horarios la unión de los horarios libres de todas las mentoras que pueden dar el tipo, calculados con las mismas reglas que la reserva con mentora (cada 30 minutos, dentro de la disponibilidad, con la duración del tipo, sin superponerse con sesiones confirmadas y sin horarios pasados), mostrando cada horario una sola vez.
- **FR-005**: El sistema DEBE pedir colectivo (de una lista), descripción del proyecto, nombre y email de contacto antes de confirmar, con las mismas validaciones que la reserva con mentora.
- **FR-006**: Al elegir un horario, el sistema DEBE asignar y mostrar al colectivo una mentora que pueda dar el tipo de asesoría y esté libre en ese horario (nombre, pronombres si los indicó y presentación), antes de pedirle que confirme.
- **FR-007**: Si hay más de una mentora libre, el sistema DEBE asignar la que tenga menos sesiones confirmadas en los próximos 14 días (se cuentan sesiones, sin importar su duración) y, ante un empate, la que vaya primero por orden alfabético de nombre.
- **FR-008**: Al confirmar, el sistema DEBE crear la sesión con la mentora que el colectivo vio, verificando de nuevo todas las restricciones de dominio (sin superposición, dentro de la disponibilidad, no en el pasado).
- **FR-009**: Si la mentora mostrada ya no está libre al confirmar, el sistema NO DEBE crear la sesión ni cambiar de mentora sin avisar: DEBE mostrar la nueva mentora asignada, si queda alguna libre, y pedir una nueva confirmación; si no queda ninguna, DEBE informar que el horario ya no está disponible y actualizar los horarios ofrecidos.
- **FR-010**: El sistema DEBE guardar la sesión asignada igual que una sesión reservada eligiendo mentora, de modo que ese horario deje de estar libre para esa mentora en ambos caminos.
- **FR-011**: El sistema DEBE mostrar un resumen de la sesión confirmada que incluya la mentora asignada.
- **FR-012**: El sistema NO DEBE mostrar en ningún momento los datos de contacto de las mentoras.
- **FR-013**: El sistema DEBE informar con mensajes claros cuando no hay lugar para un tipo de asesoría y cuando ocurre un error.

### Key Entities

- **Tipo de asesoría**: punto de entrada de este camino; define la duración y, a través de sus habilidades, qué mentoras pueden darlo.
- **Horario ofrecido**: intervalo en el que al menos una mentora que puede dar el tipo está libre. No se persiste ni dice qué mentora lo cubre.
- **Sesión**: la misma entidad de siempre; la mentora la define la plataforma en lugar del colectivo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un colectivo completa una reserva por tipo de asesoría en menos de 2 minutos y en no más de 5 interacciones después de elegir el tipo.
- **SC-002**: El 100% de las sesiones asignadas quedan con una mentora que puede dar el tipo, está dentro de su disponibilidad y no tiene otra sesión confirmada superpuesta.
- **SC-003**: Todo horario que se ofrece en este camino puede confirmarse, salvo que otra reserva lo haya ocupado mientras tanto.
- **SC-004**: Ninguna respuesta pública contiene datos de contacto de mentoras.
- **SC-005**: El flujo completo es usable con teclado y en una pantalla de 375px de ancho sin scroll horizontal.

## Assumptions

- El camino nuevo convive con la reserva eligiendo mentora; no la reemplaza.
- Se reutilizan las reglas de la feature 001: ventana de 14 días, horarios cada 30 minutos, colectivo elegido de una lista precargada y sin login.
- Un horario solo se ofrece si al menos una mentora puede cubrir la sesión completa; no se combinan mentoras para cubrir una sesión.
- La mentora se asigna al elegir el horario pero no se reserva hasta confirmar: mientras el colectivo completa sus datos, otro colectivo puede ocupar a esa mentora.
- Las sesiones confirmadas que cuentan para el reparto son las de los próximos 14 días (incluido hoy), reservadas por cualquiera de los dos caminos.
- Mostrar el nombre, los pronombres y la presentación de la mentora antes de confirmar no viola su privacidad: son los mismos datos públicos del listado de mentoras.

## Out of Scope

- Que el colectivo pida o descarte una mentora en particular dentro de este camino.
- Notificar a la mentora asignada (no hay notificaciones por email en el producto).
- Cancelar o modificar sesiones.
- Ausencias o bloqueos de agenda de la mentora.
