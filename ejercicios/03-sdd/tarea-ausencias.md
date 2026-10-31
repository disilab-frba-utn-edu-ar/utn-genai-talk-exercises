# Ausencias en la agenda

**Tamaño:** Media · **Tomada:** 2026-10-31T16:10:55.193Z

> Como mentora, quiero cargar mis ausencias (vacaciones, parciales, una reunión), para que no me reserven cuando no voy a estar.

## Criterios de aceptación

- Una ausencia ocupa uno o varios días completos, o una franja horaria de un día.
- Los horarios afectados no se ofrecen al reservar.
- El motivo es privado: el colectivo solo ve que no hay horario.
- La mentora ve sus próximas ausencias y puede eliminar una.

## Casos borde para pensar

- Atiende de 09 a 13, se ausenta de 10 a 11 y la asesoría dura 90 minutos: ¿qué horarios quedan?
- Ya hay una sesión confirmada dentro de la ausencia: ¿se rechaza, se acepta con aviso o se cancela la sesión?
- Ausencias superpuestas entre sí, en el pasado o con fechas invertidas.

## APIs sugeridas

- `GET y POST /api/mentoras/:id/ausencias`
- `DELETE /api/mentoras/:id/ausencias/:ausenciaId`
