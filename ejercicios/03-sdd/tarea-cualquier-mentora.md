# Cualquier mentora disponible

**Tamaño:** Media · **Tomada:** 2026-10-31T13:25:05.700Z

> Como colectivo que no conoce a nadie del ambiente, quiero reservar por tipo de asesoría sin elegir mentora, para destrabar mi proyecto igual.

## Criterios de aceptación

- Un segundo camino de reserva: tipo de asesoría, día y horario, y "Cualquier mentora disponible".
- Solo se ofrecen horarios con al menos una mentora libre que dé ese tipo.
- Se asigna la mentora de menor carga y el colectivo ve quién le tocó. El camino actual sigue existiendo.

## Casos borde para pensar

- ¿Qué es carga: sesiones u horas, de la semana o del mes? Y ante un empate, ¿qué criterio determinístico?
- El horario estaba libre al consultarlo, pero al confirmar ya no queda ninguna mentora.
- ¿El colectivo puede rechazar la mentora asignada?

## APIs sugeridas

- `GET /api/tipos-asesoria/:id/disponibilidad`
- `POST /api/sesiones sin mentoraId`
