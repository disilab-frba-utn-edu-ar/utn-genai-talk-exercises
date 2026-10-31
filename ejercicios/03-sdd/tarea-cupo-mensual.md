# Cupo mensual de horas por mentora

**Tamaño:** Chica a media · **Tomada:** 2026-10-31T13:14:39.850Z

> Como mentora, quiero fijar cuántas horas dono por mes, para no comprometer más tiempo del que puedo sostener.

## Criterios de aceptación

- Cada mentora tiene un cupo mensual: las sesiones confirmadas lo consumen y las canceladas no.
- Sin cupo, la mentora no ofrece horarios en ese mes.
- El colectivo ve cuánto le queda ("Le quedan 2 h este mes") o "Sin cupo este mes".
- El cupo se carga con los datos de la mentora: no hace falta una pantalla para editarlo.

## Casos borde para pensar

- Le quedan 30 minutos y la asesoría dura 60: ¿se permite pasarse?
- ¿Mes calendario o próximos 30 días? ¿Una mentora sin cupo definido tiene límite?
- Dos colectivos reservan al mismo tiempo las últimas horas del mes.

## APIs sugeridas

- `GET /api/mentoras y /api/mentoras/:id con las horas disponibles`
- `POST /api/sesiones: 409 si excede el cupo`
