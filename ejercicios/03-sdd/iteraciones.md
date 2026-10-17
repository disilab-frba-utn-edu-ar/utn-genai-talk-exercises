# Backlog de producto — Mentorías a Voluntad

## Contexto de producto

Mentorías a Voluntad es una extensión del ecosistema **Código a Voluntad**
centrada en el asesoramiento. Personas mentoras con experiencia en desarrollo
de software donan horas, y los colectivos (fundaciones, ONGs, asambleas,
asociaciones barriales) reservan sesiones para destrabar sus proyectos: una
revisión de código, una charla de arquitectura, ayuda para elegir dónde
publicar su sitio.

Hoy el producto hace una sola cosa: un colectivo elige una mentora, un tipo de
asesoría, un día y un horario libre, deja sus datos de contacto y la sesión
queda **confirmada**. Esa feature se construyó con el mismo flujo que vas a
usar (ver `specs/001-reservar-sesion/`).

Las iteraciones de abajo están **ordenadas de menor a mayor tamaño**. Cada una
tiene el problema, la solución vista desde el negocio, las APIs que
**sugerimos** (el diseño final lo decidís en el plan, respetando la
constitution) y casos borde para pensar **antes** de escribir la spec. Los
casos borde no tienen una respuesta "correcta": son decisiones que la spec
tiene que tomar explícitamente (o que `clarify` te tiene que preguntar).

> **Por defecto: iteración 3 — Ausencias en la agenda.**

---

## Iteración 1 — Cancelar una sesión · *Chica*

### Problema
Si a un colectivo le surge algo, no tiene cómo avisar que no va a ir. La
mentora reserva un rato de su tiempo libre que nadie usa, y ese horario no se
libera para otros colectivos que lo necesitaban.

### Solución
Al confirmar una reserva, el colectivo recibe un enlace a su sesión. Desde ahí
puede ver el detalle y cancelarla indicando un motivo (opcional), **siempre que
falten al menos 24 horas** para el inicio. Pasado ese límite, la opción de
cancelar no está disponible y se muestra un mensaje que explica por qué. Una
sesión cancelada libera el horario: vuelve a ofrecerse a otros colectivos.

### APIs involucradas (sugeridas)

```
GET /api/sesiones/:id
→ Detalle de una sesión (si lo hiciste en el ejercicio 2, ya existe)

PATCH /api/sesiones/:id
body: { "estado": "cancelada", "motivo": "Se suspendió la asamblea" }
→ Cancela la sesión. 409 si ya estaba cancelada o faltan menos de 24 h.
```

### Casos borde para pensar
- ¿Qué pasa si faltan exactamente 24 horas? ¿Contra qué hora se compara: la
  del servidor o la de Argentina?
- Cancelar una sesión que ya está cancelada, o que ya pasó.
- ¿Quién puede cancelar? Sin login, cualquiera que tenga el enlace. ¿Es
  aceptable para esta iteración? Escribilo como supuesto en la spec.
- ¿La mentora se entera? (Hoy no hay notificaciones: ¿entra en esta iteración
  o queda afuera explícitamente?)
- El motivo, ¿lo ve alguien más además de la mentora?

---

## Iteración 2 — Cupo mensual de horas por mentora · *Chica a media*

### Problema
Las mentoras son voluntarias. Algunas, las más visibles, reciben muchas más
reservas de las que pueden sostener y terminan quemadas o dejando la
plataforma. Quieren decidir cuántas horas donan por mes.

### Solución
Cada mentora tiene un **cupo mensual de horas** (por ejemplo, 6 h). Las
sesiones confirmadas del mes consumen cupo; las canceladas no. Cuando el cupo
se agota, la mentora deja de ofrecer horarios en ese mes. En la lista de
mentoras y en su perfil, el colectivo ve cuánto le queda ("Le quedan 2 h este
mes") o "Sin cupo este mes". Por ahora el cupo se carga junto con los datos de
la mentora: no hace falta una pantalla para editarlo.

### APIs involucradas (sugeridas)

```
GET /api/mentoras  ·  GET /api/mentoras/:id
→ Agregan las horas disponibles en el mes en curso

GET /api/mentoras/:id/disponibilidad?tipoAsesoriaId=revision_de_codigo&dias=14
→ No ofrece horarios de meses en los que el cupo no alcanza

POST /api/sesiones
→ 409 si la sesión excede el cupo del mes de su fecha
```

### Casos borde para pensar
- Le quedan 30 minutos y el tipo de asesoría dura 60: ¿se permite pasarse?
- ¿"Mes" es mes calendario o los próximos 30 días? Una sesión el 31 y otra el
  1, ¿consumen del mismo cupo?
- Una mentora sin cupo definido: ¿sin límite o cupo cero?
- La mentora baja su cupo cuando ya tiene más horas reservadas que el nuevo
  valor: ¿se cancelan sesiones? (Spoiler: probablemente no.)
- Dos colectivos reservan al mismo tiempo las últimas horas del mes.

---

## Iteración 3 — Ausencias en la agenda · *Media* · **Por defecto**

### Problema
La disponibilidad de una mentora es semanal y fija ("los martes de 18 a 21"),
pero la vida no: vacaciones, parciales, un feriado, un evento de su propia
asamblea. Hoy los colectivos pueden reservarle en días en los que no va a
estar, y la sesión termina suspendiéndose a último momento.

### Solución
La mentora puede registrar **ausencias**: uno o varios días completos (por
ejemplo, vacaciones del 10 al 24 de enero) o una franja horaria de un día
puntual (el jueves de 18 a 19:30). Puede agregar un motivo, que es **privado**:
el colectivo solo ve que ese horario no está disponible. Los horarios
afectados dejan de ofrecerse en el flujo de reserva. La mentora puede ver sus
ausencias próximas y eliminar una si cambia de planes.

### APIs involucradas (sugeridas)

```
GET /api/mentoras/:id/ausencias?desde=2026-11-01&hasta=2026-11-30
→ Ausencias de la mentora en el rango

POST /api/mentoras/:id/ausencias
body: {
  "fechaDesde": "2026-11-20",
  "fechaHasta": "2026-11-20",
  "horaInicio": "18:00",
  "horaFin": "19:30",
  "motivo": "Reunión de la cooperativa"
}
→ Crea una ausencia. Para días completos, horaInicio y horaFin van en null.

DELETE /api/mentoras/:id/ausencias/:ausenciaId
→ Elimina una ausencia

GET /api/mentoras/:id/disponibilidad?tipoAsesoriaId=...&dias=14
→ Ya existe: ahora descuenta las ausencias
```

### Casos borde para pensar
- La mentora atiende de 09:00 a 13:00, carga una ausencia de 10:00 a 11:00 y
  el tipo de asesoría dura 90 minutos: ¿qué horarios quedan?
- Ya hay una **sesión confirmada** dentro del período de la ausencia: ¿se
  rechaza la ausencia (409), se acepta y se avisa, se cancela la sesión?
  Es una decisión de negocio, no técnica.
- Ausencias en el pasado, `fechaHasta` anterior a `fechaDesde`, `horaFin`
  anterior a `horaInicio`, una franja que abarca varios días.
- Dos ausencias que se superponen entre sí: ¿error o se aceptan?
- Un rango de vacaciones que incluye días en los que la mentora igual no
  atiende (domingos).
- El motivo no puede aparecer en la disponibilidad ni en ningún endpoint
  público (principio IV, por extensión). ¿Cómo lo testeás?
- Sin login: ¿cualquiera puede cargar ausencias de cualquier mentora? Para la
  iteración es aceptable, pero anotalo como supuesto.

---

## Iteración 4 — "Cualquier mentora disponible" · *Media*

### Problema
Muchos colectivos no conocen a nadie del ambiente: saben qué necesitan
("que alguien revise nuestro código") pero no a quién elegir. Además, la carga
se concentra en las mentoras que aparecen primero en la lista, mientras otras
esperan sin reservas.

### Solución
Un segundo camino de reserva: el colectivo elige primero el **tipo de
asesoría**, después el día y el horario, y la opción **"Cualquier mentora
disponible"**. Solo se ofrecen horarios en los que al menos una mentora que
puede dar ese tipo está libre. Al confirmar, el sistema asigna entre las
mentoras posibles a la de **menor carga**, y el colectivo ve en la
confirmación quién le tocó. El camino actual (elegir mentora) sigue
existiendo.

### APIs involucradas (sugeridas)

```
GET /api/tipos-asesoria/:id/disponibilidad?dias=14
→ [{ fecha, horarios: [{ inicio, fin }] }] con al menos una mentora libre

POST /api/sesiones
body: {
  "tipoAsesoriaId": "revision_de_codigo",
  "colectivoId": "…",
  "proyecto": "Sitio de la biblioteca popular",
  "contactoNombre": "Ana",
  "contactoEmail": "ana@ejemplo.org",
  "fecha": "2026-11-12",
  "horaInicio": "18:00"
}
→ Sin mentoraId: el sistema elige y devuelve la sesión con la mentora asignada
```

### Casos borde para pensar
- ¿Qué es "carga"? ¿Cantidad de sesiones o de horas? ¿De la semana, del mes,
  del día?
- Empate de carga: el criterio tiene que ser **determinístico** (si no, no se
  puede testear). ¿Cuál elegís y por qué?
- El horario estaba libre al consultarlo pero, al confirmar, otra reserva ya
  ocupó a la única mentora disponible.
- Si hiciste la iteración 2 o la 3: ¿el cupo y las ausencias se respetan en
  la asignación?
- ¿El colectivo puede rechazar la mentora asignada?

---

## Iteración 5 — Solicitudes de sesión y revelado de contacto · *Grande*

### Problema
Hoy toda reserva queda confirmada al instante. Las mentoras quieren saber de
qué se trata **antes** de comprometer su tiempo: a veces el proyecto no encaja
con lo que saben. Y los colectivos necesitan escribirle a la mentora antes de
la sesión (mandarle el repositorio, contexto), pero el email de la mentora es
privado y nunca se muestra.

### Solución
Inspirada en las postulaciones de Código a Voluntad, pero al revés: acá el
colectivo **solicita** y la mentora decide.

- Al reservar, la sesión queda **pendiente** y el horario queda tomado de forma
  provisoria.
- La mentora ve sus solicitudes pendientes y las **acepta** o las **rechaza**
  (con un motivo opcional). Rechazar libera el horario.
- Recién cuando la sesión está **confirmada**, el colectivo puede ver el email
  de la mentora **en el detalle de esa sesión**, y la mentora el contacto del
  colectivo. Nunca antes, nunca en otro lado.
- Si la mentora no responde hasta 48 horas antes del horario, la solicitud
  vence sola y el horario se libera (cierre automático).

### APIs involucradas (sugeridas)

```
POST /api/sesiones
→ Ahora crea la sesión con estado "pendiente"

GET /api/mentoras/:id/solicitudes?estado=pendiente
→ Solicitudes que la mentora tiene que responder

PATCH /api/sesiones/:id
body: { "estado": "confirmada" }  |  { "estado": "rechazada", "motivo": "…" }
→ La mentora responde. 409 si la solicitud ya no está pendiente.

GET /api/sesiones/:id/contacto
→ Datos de contacto de la contraparte, solo si la sesión está confirmada
```

### Casos borde para pensar
- Sin login, ¿cómo sabe el sistema que quien pide el contacto es el colectivo
  de **esa** sesión y no cualquiera con el id? (¿Un código secreto en el enlace
  que recibe al reservar? ¿Alcanza?) Esta es la decisión más importante de la
  iteración.
- Los estados cambian: `pendiente | confirmada | rechazada | cancelada | vencida`.
  La constitution dice "dos sesiones **confirmadas** no se superponen":
  ¿una pendiente bloquea el horario? Si sí, **hay que enmendar la
  constitution** (y eso también es parte del método).
- Dos solicitudes pendientes para el mismo horario de la misma mentora.
- La mentora acepta una solicitud cuyo horario ya pasó o ya venció.
- ¿El vencimiento automático corre "solo" o se evalúa cada vez que se consulta?
  (Pista: el dominio no hace IO; el reloj es una dependencia.)

---

## Más ideas para el backlog (sin desarrollar)

Si terminaste, o para discutir en clase. Todas vienen de conceptos del TP,
llevados al asesoramiento:

- **Mis sesiones del colectivo**: un panel con las sesiones próximas y pasadas
  de un colectivo. ¿Cómo se identifica el colectivo sin login?
- **Valoraciones mutuas**: después de la sesión, el colectivo valora si le
  sirvió y la mentora si el colectivo llegó preparado. ¿Quién ve qué?
- **Logros**: "10 horas donadas", "5 colectivos acompañados". ¿Se calculan o
  se guardan?
- **Huella IA**: al reservar, el colectivo declara si el proyecto usa IA
  generativa, y en la sesión la mentora registra si usaron agentes para
  resolver el problema.
- **Notificaciones internas**: avisos a la mentora cuando le reservan, cancelan
  o le llega una solicitud.
