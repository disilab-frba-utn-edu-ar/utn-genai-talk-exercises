# Ejercicio: Extensión del gestor de turnos — BarberApp

## Contexto de producto

BarberApp es un sistema de turnos para una barbería. Actualmente el cliente debe elegir primero al profesional y luego el servicio. El negocio detectó que los clientes prefieren saber qué quieren hacerse antes de elegir quién se lo hace.

El ejercicio consiste en implementar las siguientes iteraciones de producto.

---

## Iteración 1 — Nuevo flujo de reserva

### Problema
El flujo actual obliga al cliente a elegir profesional antes de saber qué servicios puede hacerse. Esto genera fricción y abandono.

### Solución
Rediseñar el flujo de reserva en pasos secuenciales:

**Paso 1 — ¿Qué querés hacerte?**
El cliente selecciona uno o más servicios. Ve el nombre, precio y duración de cada uno. Al seleccionar varios, se muestra el precio total y la duración total acumulada.

**Paso 2 — ¿Qué día?**
Se muestra un calendario. Solo son seleccionables los días en los que al menos un profesional que ofrece todos los servicios elegidos tiene disponibilidad.

**Paso 3 — ¿A qué hora?**
Se muestran los horarios disponibles para el día elegido. Cada slot tiene la duración exacta de la suma de servicios seleccionados.

**Paso 4 — ¿Con quién?**
Se muestran solo los profesionales que pueden realizar todos los servicios seleccionados y tienen ese slot libre. Si solo hay uno disponible, se puede preseleccionar automáticamente.

**Paso 5 — Confirmación**
El cliente ingresa su nombre y teléfono. Ve el resumen completo antes de confirmar: servicios, profesional, día, hora y precio total.

### APIs involucradas

```
GET /api/services
→ Lista todos los servicios disponibles

GET /api/availability?date=YYYY-MM-DD&serviceIds=svc-1,svc-4
→ Devuelve los slots disponibles por profesional para esa fecha y esos servicios

POST /api/bookings
body: {
  "professionalId": "prof-1",
  "serviceIds": ["svc-1", "svc-4"],
  "clientName": "Juan Pérez",
  "clientPhone": "11-4523-1234",
  "date": "2026-04-25",
  "startTime": "10:00"
}
```

---

## Iteración 2 — Cancelación de turno

### Problema
Los clientes no tienen forma de cancelar un turno sin llamar a la barbería.

### Solución
Al confirmar un turno, el cliente recibe un enlace directo a su turno (`/booking/[id]`). Desde esa pantalla puede ver el detalle y cancelar el turno, siempre que falten más de 2 horas para el horario reservado. Si ya pasó ese límite, el botón de cancelar no está disponible y se muestra un mensaje explicativo.

### APIs involucradas

```
GET /api/bookings/[id]
→ Devuelve el detalle de un turno específico

PATCH /api/bookings/[id]
body: { "status": "cancelled" }
→ Cancela el turno
```

---

## Iteración 3 — Bloqueos de agenda

### Problema
Los profesionales a veces no trabajan en sus horarios habituales (feriados, reuniones, vacaciones) y no hay forma de reflejarlo en el sistema. Los clientes pueden reservar en esas franjas.

### Solución
El sistema soporta bloqueos de agenda por profesional. Un bloqueo puede ser de día completo o de una franja horaria específica. Los slots bloqueados no aparecen como disponibles en el flujo de reserva.

Los datos de bloqueos se almacenan en `data/blocked-slots.json`.

### APIs involucradas

```
GET /api/blocked-slots?professionalId=prof-1&date=2026-04-30
→ Devuelve los bloqueos activos para ese profesional y fecha

POST /api/blocked-slots
body: {
  "professionalId": "prof-2",
  "date": "2026-05-01",
  "startTime": "13:00",
  "endTime": "15:00",
  "reason": "Capacitación"
}
→ Crea un nuevo bloqueo de agenda
```

> Para bloqueos de día completo, `startTime` y `endTime` se envían como `null`.

---

## Iteración 4 — "Cualquier profesional disponible"

### Problema
Muchos clientes no tienen preferencia por un profesional en particular y deben igualmente elegir uno. Esto es una fricción innecesaria.

### Solución
En el paso 4 del flujo de reserva, agregar la opción "Me da igual". Al elegirla, el sistema asigna automáticamente el profesional disponible con menor carga de turnos ese día. El cliente ve en la confirmación quién le fue asignado.

### APIs involucradas

```
POST /api/bookings
body: {
  "serviceIds": ["svc-1"],
  "clientName": "Ana García",
  "clientPhone": "11-1234-5678",
  "date": "2026-04-28",
  "startTime": "10:00"
}
→ Sin professionalId: el sistema elige y devuelve el turno con el profesional asignado
```

---

## Iteración 5 — Panel de administración

### Problema
La barbería no tiene una vista interna de los turnos del día. Tienen que depender de los datos crudos.

### Solución
Una pantalla en `/admin` que muestra los turnos del día actual agrupados por profesional. Cada turno muestra el cliente, los servicios, el horario y el estado. Desde esta pantalla se puede marcar un turno como completado una vez que el cliente fue atendido.

### APIs involucradas

```
GET /api/bookings?date=2026-04-21
→ Devuelve todos los turnos del día, que se agrupan por profesional en el cliente

PATCH /api/bookings/[id]
body: { "status": "completed" }
→ Marca el turno como completado (solo si ya pasó el horario del turno)
```
