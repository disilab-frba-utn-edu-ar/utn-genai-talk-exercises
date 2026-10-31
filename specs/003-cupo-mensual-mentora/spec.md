# Feature Specification: Cupo mensual de horas por mentora

**Feature Branch**: `003-cupo-mensual-mentora`
**Created**: 2026-10-31
**Status**: Clarified
**Input**: User description: "Como mentora quiero fijar cuántas horas dono por mes, para no
comprometer más tiempo del que puedo sostener. Las sesiones confirmadas consumen ese cupo y
las canceladas no. Cuando a la mentora no le queda cupo, no ofrece horarios en ese mes. El
colectivo ve cuánto le queda ('Le quedan 2 h este mes') o 'Sin cupo este mes'. El cupo se
carga junto con los datos de la mentora, sin pantalla para editarlo."

## Clarifications

### Session 2026-10-31

- Q: Quedan 30 minutos de cupo y la asesoría dura 60: ¿se permite pasarse? → A: No. El cupo es un tope; la asesoría que no entra en las horas restantes no se ofrece ni se acepta.
- Q: ¿"Mes" es mes calendario o ventana de 30 días? → A: Mes calendario (del día 1 al último día), en la zona horaria de la plataforma.
- Q: ¿Una mentora sin cupo definido tiene límite? → A: No. Sin cupo definido no hay límite y no se muestra ningún texto de cupo; el límite es opcional.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — La mentora no se pasa de las horas que donó (Priority: P1)

Una mentora define cuántas horas por mes está dispuesta a donar. Mientras tenga cupo, los
colectivos pueden reservarle sesiones; cada sesión confirmada descuenta su duración del cupo
del mes. Cuando el cupo se agota, la plataforma deja de ofrecer horarios de esa mentora para
ese mes y rechaza cualquier reserva que lo exceda.

**Why this priority**: es el propósito de la feature. Sin este límite la mentora puede quedar
comprometida con más horas de las que puede sostener.

**Independent Test**: tomar una mentora con un cupo de 2 h y reservarle dos sesiones de 60
minutos en el mismo mes. Debe aceptar ambas, y no debe ofrecer ni aceptar una tercera ese mes.

**Acceptance Scenarios**:

1. **Given** una mentora con cupo de 2 h y ninguna sesión confirmada en el mes, **When** un colectivo reserva una sesión de 60 minutos, **Then** la reserva se confirma y a la mentora le quedan 1 h ese mes.
2. **Given** una mentora a la que le quedan 0 h en un mes, **When** un colectivo consulta sus horarios de ese mes, **Then** no se ofrece ningún horario de ese mes.
3. **Given** una mentora a la que le quedan 0 h en un mes, **When** se intenta reservarle una sesión de ese mes por otra vía, **Then** la reserva se rechaza con un mensaje que indica que no hay cupo, y no se crea la sesión.
4. **Given** una sesión confirmada que consumía cupo, **When** se cancela, **Then** sus horas vuelven a estar disponibles en el cupo de ese mes.
5. **Given** una mentora con sesiones confirmadas y canceladas en el mes, **When** se calcula lo consumido, **Then** solo cuentan las confirmadas.

---

### User Story 2 — El colectivo ve cuánto cupo le queda a la mentora (Priority: P1)

Antes de elegir un horario, la persona del colectivo ve en la mentora cuántas horas le quedan
en el mes ("Le quedan 2 h este mes") o, si no le quedan, el aviso "Sin cupo este mes". Así
sabe de entrada si vale la pena reservarle y no pierde tiempo con alguien que ya no puede
atender.

**Why this priority**: sin esta información, el colectivo descubre el límite recién al
fracasar la reserva. Es lo que hace visible la restricción.

**Independent Test**: abrir una mentora con cupo parcial y comprobar el texto con las horas
restantes. Luego abrir una sin cupo y comprobar el aviso "Sin cupo este mes".

**Acceptance Scenarios**:

1. **Given** una mentora a la que le quedan 2 h en el mes, **When** el colectivo ve su ficha, **Then** lee "Le quedan 2 h este mes".
2. **Given** una mentora a la que le quedan 0 h, **When** el colectivo ve su ficha, **Then** lee "Sin cupo este mes" y no puede avanzar a elegir un horario de ese mes.
3. **Given** el colectivo ve el listado de mentoras, **When** una de ellas no tiene cupo, **Then** el listado también indica "Sin cupo este mes" para esa mentora.
4. **Given** el colectivo ve el cupo restante de una mentora, **When** mira la pantalla, **Then** no ve el cupo total ni los datos de contacto de la mentora ni detalles de las sesiones de otros colectivos.

---

### User Story 3 — El cupo se carga con los datos de la mentora (Priority: P2)

El equipo de la plataforma carga el cupo mensual de cada mentora junto con el resto de sus
datos (nombre, habilidades, disponibilidad). No existe una pantalla para que la mentora o el
equipo lo editen: para cambiarlo se actualizan los datos de la mentora.

**Why this priority**: el cupo tiene que existir para que las otras historias funcionen, pero
cargarlo con los datos de la mentora es suficiente para esta primera versión.

**Independent Test**: cargar una mentora con un cupo definido y comprobar que la plataforma
lo respeta sin necesidad de ninguna otra configuración.

**Acceptance Scenarios**:

1. **Given** una mentora cargada con un cupo de 4 h, **When** un colectivo la consulta, **Then** la plataforma aplica ese cupo.
2. **Given** los datos de una mentora con un cupo inválido (negativo o que no es un número), **When** se intenta cargarla, **Then** el dato se rechaza y no queda cargado.

---

### Edge Cases

- **Dos colectivos reservan a la vez las últimas horas del mes**: solo una de las dos reservas se confirma. La otra se rechaza con el aviso de que no hay cupo, y nunca se supera el cupo, sin importar el orden de llegada.
- **Quedan menos horas que la duración de la asesoría** (por ejemplo, quedan 30 minutos y la asesoría dura 60): esa asesoría no se ofrece ni se acepta; las asesorías más cortas que sí entran en las horas restantes se siguen ofreciendo. Si no entra ninguna, la mentora figura como "Sin cupo este mes".
- **Qué es "el mes" para el cupo**: el mes calendario. Como los colectivos reservan hasta 14 días hacia adelante, una mentora puede tener cupo en el mes siguiente aunque este esté agotado: cada mes se calcula por separado, y los horarios de un mes agotado no se ofrecen mientras que los del mes siguiente sí.
- **Mentora sin cupo definido**: no tiene límite; se comporta como antes de esta feature y no se muestra texto de cupo. Es distinto de un cupo de 0 h, que sí significa "no ofrece horarios".
- **Cupo de 0 h**: la mentora no ofrece horarios en ningún mes mientras su cupo sea 0; se muestra "Sin cupo este mes".
- **Sesión que cruza el fin de mes**: cuenta para el mes en que empieza.
- **Cancelación de una sesión de un mes pasado**: no cambia lo que se ofrece hoy, pero sus horas dejan de contar como consumidas en ese mes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Cada mentora MUST poder tener un cupo mensual de horas, definido junto con el resto de sus datos.
- **FR-002**: El cupo MUST ser un valor de cero o más horas; no se aceptan valores negativos ni no numéricos.
- **FR-003**: Las horas consumidas de un mes MUST ser la suma de las duraciones de las sesiones confirmadas de la mentora en ese mes.
- **FR-004**: Las sesiones canceladas MUST NOT consumir cupo.
- **FR-005**: Las horas restantes de un mes MUST ser el cupo menos las horas consumidas, y nunca menores que cero.
- **FR-006**: Cuando a una mentora no le quedan horas en un mes, el sistema MUST NOT ofrecer horarios de esa mentora en ese mes.
- **FR-007**: El sistema MUST rechazar cualquier reserva que haga superar el cupo del mes, aunque el horario se haya ofrecido antes o la solicitud llegue por otra vía, e informar con un mensaje claro que no hay cupo.
- **FR-008**: Al cancelar una sesión confirmada, el sistema MUST liberar sus horas en el cupo del mes que le correspondía.
- **FR-009**: Una sesión MUST contar para el mes en que empieza.
- **FR-010**: Cuando dos reservas compiten por las últimas horas de un mes, el sistema MUST confirmar como máximo las que entran en el cupo y rechazar las demás.
- **FR-011**: El colectivo MUST ver en la ficha de cada mentora el texto "Le quedan N h este mes" cuando le queda cupo, o "Sin cupo este mes" cuando no.
- **FR-012**: El listado de mentoras MUST indicar "Sin cupo este mes" para las que no tienen cupo disponible.
- **FR-013**: Las vistas públicas MUST mostrar solo las horas restantes, nunca datos de contacto de la mentora ni detalles de las sesiones de otros colectivos.
- **FR-014**: Cuando las horas restantes de un mes son menores que la duración de una asesoría, el sistema MUST NOT ofrecer ni aceptar esa asesoría en ese mes; nunca se permite superar el cupo.
- **FR-015**: El período del cupo MUST ser el mes calendario; cada mes tiene su propio cupo y su propio consumo.
- **FR-016**: Una mentora sin cupo definido MUST NOT tener límite y MUST NOT mostrar texto de cupo; un cupo de 0 h MUST equivaler a "Sin cupo este mes".
- **FR-017**: El sistema MUST NOT incluir una pantalla para editar el cupo; se define únicamente al cargar los datos de la mentora.

### Key Entities

- **Cupo mensual**: cantidad de horas por mes que una mentora dona. Es un atributo de la mentora, no una entidad aparte.
- **Horas consumidas**: suma de las duraciones de las sesiones confirmadas de la mentora en un mes. Se deriva de las sesiones, no se guarda.
- **Horas restantes**: cupo menos horas consumidas, con un mínimo de cero. Se deriva al consultar, igual que los horarios.
- **Sesión**: ya existe. Con esta feature su duración y su estado (`confirmada` | `cancelada`) determinan si consume cupo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En ningún caso una mentora tiene sesiones confirmadas en un mes que sumen más horas que su cupo (0 excesos, incluso con reservas simultáneas).
- **SC-002**: El 100 % de las veces que a una mentora no le quedan horas, el colectivo ve "Sin cupo este mes" y no se le ofrece ningún horario de ese mes.
- **SC-003**: Una persona del colectivo identifica cuántas horas le quedan a una mentora en menos de 5 segundos desde que abre su ficha, sin hacer ninguna acción adicional.
- **SC-004**: Después de cancelar una sesión, las horas vuelven a figurar como disponibles la próxima vez que se consulta a la mentora, el 100 % de las veces.
- **SC-005**: Cero datos de contacto de mentoras o de otros colectivos aparecen en las pantallas donde se muestra el cupo.

## Assumptions

- Las duraciones de las sesiones siguen la del tipo de asesoría elegido (ya definida en el catálogo).
- El cupo se expresa en horas, aunque puede tener fracciones (por ejemplo, 1,5 h), porque las asesorías duran minutos.
- La zona horaria para definir "el mes" es la de la plataforma; la gestión de zonas horarias distintas queda fuera de alcance.
- La mentora no puede cambiar su cupo ella misma desde la plataforma; el cambio lo hace el equipo al actualizar sus datos.
- Cambiar el cupo no afecta las sesiones ya confirmadas, solo lo que se ofrece desde ese momento.
- Las restricciones de dominio previas (sin superposición, dentro de la disponibilidad, no en el pasado, tipo de asesoría permitido) se siguen aplicando; el cupo es una condición adicional.
- Las sesiones ya existentes en los datos de la plataforma no se modifican por esta feature.
