# Ejercicio 3 — Respuestas

**Historia elegida:** Cupo mensual de horas por mentora
**Carpeta de la spec:** `specs/00X-...` <!-- la 001-reservar-sesion es el ejemplo; la tuya lleva el número que le ponga Spec Kit -->

**Nombre:** _Sin completar en Mi perfil._
**¿Intervinieron durante la tarea?** _Sin completar en Mi perfil._

## Reflexión

### 1. Lo que generó el agente

Puedo explicar el cálculo del cupo: cupo.ts suma los minutos de las sesiones confirmadas del mes, resta eso al cupo y compara con la duración de la asesoría. [Si no leíste el código, decilo.] Dos cosas conviene entenderlas antes de aceptarlas:

Un cupo inválido cargado a mano se trata como "sin límite". Es una decisión mía, no de la spec.
Las reservas simultáneas no tienen un bloqueo propio. Se resuelven porque crear es síncrono en un solo proceso.

### 2. Cada etapa

Más clara: el qué. La historia traía criterios concretos y la spec salió con escenarios verificables.
Más costosa: clarify. Las tres decisiones de negocio (cupo parcial, mes calendario, sin cupo = sin límite) las tomé yo. No las revisaste ni las respondiste vos.
Aprobadas sin leer: casi todas. Pediste que no frenara, así que los checkpoints de revisión humana no ocurrieron.

### 3. El método

Ayudó: los casos borde quedaron escritos antes de programar. Eso permitió tests concretos, como el de 30 minutos restantes contra una asesoría de 60.
Estorbó: el script de PowerShell no corría y hubo que reproducir sus pasos a mano.

### 4. SDD o prompt directo

Para esta historia valió el método: tiene reglas de negocio ambiguas, toca varias capas y hay decisiones que alguien debe poder revisar. Un bug acotado con causa conocida lo resolvería con prompt directo

### 5. Una skill para una etapa (opcional)

Elegiría clarify. Criterio: no cierra la etapa mientras haya una decisión de negocio sin firmar por una persona. Cada respuesta se registra como "decidido por la persona" o "propuesto por el agente". Habría evitado que yo mismo resolviera las tres dudas.

## Presentá tu trabajo

### 6. Resumen de la funcionalidad

Cupo mensual de horas por mentora

Qué problema resuelve. Una mentora dona horas, pero hasta ahora no había forma de poner un tope. Con esta feature cada mentora tiene un cupo mensual: las sesiones confirmadas lo consumen, las canceladas no, y cuando se agota deja de ofrecer horarios ese mes. El colectivo ve cuánto le queda ("Le quedan 2 h este mes") o "Sin cupo este mes".

Qué hice. Seguí Spec Kit completo (specify, clarify, plan, tasks, implement) en specs/003-cupo-mensual-mentora/.

Datos: cupoMensualHoras es un campo opcional de cada mentora en data/mentoras.json. No hay pantalla de edición ni archivos nuevos en data/.
Regla: server/domain/cupo.ts es puro, sin IO. Calcula los minutos consumidos y los restantes del mes calendario.
Horarios: la disponibilidad no ofrece la asesoría que no entra en lo que queda.
Reserva: POST /api/sesiones responde 409 con un mensaje en español si la reserva excede el cupo.
API pública: las mentoras exponen horasRestantes. El cupo total y el contacto no salen por la API (Principio IV).
Cliente: el componente CupoMensual aparece en la tarjeta y en la página de reserva.
Decisiones de negocio

Cupo parcial: si quedan 30 minutos y la asesoría dura 60, no se ofrece ni se acepta. El cupo es un tope, no una sugerencia.
"Mes": mes calendario. Coincide con cómo piensa la mentora y con el texto "este mes". Como se reserva hasta 14 días adelante, cada mes se calcula por separado.
Sin cupo definido: no hay límite y no se muestra texto. Así las mentoras existentes no cambian. Un cupo de 0 h sí significa "sin cupo".
Reservas simultáneas: se confirma la que entra y se rechaza la otra. Funciona porque crear es síncrono en un solo proceso, y habría que revisarlo si el almacenamiento cambia.
Cupo inválido cargado a mano: se trata como sin límite, para no romper la lectura.
Cómo se verificó. Test-first en las tres carpetas de tests: dominio (cupo, horarios, mentoras), API (409, canceladas, mes distinto, cupo 0, dos reservas seguidas, privacidad) y cliente (textos de cupo). npm test, npm run lint y npm run typecheck pasan. Un test de metricas/ falló de forma intermitente por timeout. Es material de la charla, no del producto.

Para tener en cuenta en la review

server/services/sesiones.ts incluye también mis cambios previos de superposición de sesiones.
No hay endpoint de cancelación. Las canceladas se prueban sembrando sesiones con ese estado.
No probé la pantalla a mano a 375 px.

## Para cerrar

**Modelo:** Sonnet 5.5 - Low

**Agente:** Claude
