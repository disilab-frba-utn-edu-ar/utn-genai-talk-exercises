# Cancelar una sesión

**Tamaño:** Chica · **Tomada:** 2026-11-01T15:56:02.280Z

> Como colectivo, quiero cancelar una sesión que reservé, para avisar que no voy y liberar el horario para otro colectivo.

## Criterios de aceptación

- Al reservar, el colectivo recibe un enlace a su sesión con el detalle y la opción de cancelar.
- Se puede cancelar hasta 24 horas antes del inicio, con un motivo opcional. Después, se explica por qué ya no se puede.
- Una sesión cancelada libera su horario.

## Casos borde para pensar

- Faltan exactamente 24 horas: ¿contra qué hora se compara, la del servidor o la de Argentina?
- Cancelar una sesión que ya está cancelada o que ya pasó.
- Sin login, cualquiera con el enlace puede cancelar: ¿alcanza para esta iteración? ¿Quién ve el motivo?

## APIs sugeridas

- `GET /api/sesiones/:id`
- `PATCH /api/sesiones/:id { estado: "cancelada", motivo }`
