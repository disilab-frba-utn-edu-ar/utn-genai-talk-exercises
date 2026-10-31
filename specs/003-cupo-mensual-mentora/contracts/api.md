# API Contract: Cupo mensual de horas por mentora

Cambios sobre [la API de la 001](../../001-reservar-sesion/contracts/api.md). Base `/api`, JSON,
errores `{ "error": "<mensaje en español>" }`.

| Método y ruta | Cambio |
|---|---|
| `GET /api/mentoras` | cada `MentoraPublica` suma `horasRestantes?` |
| `GET /api/mentoras/:id` | `MentoraPublica` suma `horasRestantes?` |
| `GET /api/mentoras/:id/disponibilidad?tipoAsesoriaId=` | no ofrece horarios de un mes en el que la asesoría no entra en lo que queda |
| `POST /api/sesiones` | nuevo `409` si la reserva excede el cupo del mes |

## `horasRestantes`

- `number` en horas, con fracciones (`1.5`). Es el cupo del **mes calendario actual** menos las
  horas de sesiones confirmadas que empiezan en ese mes, con mínimo `0`.
- Ausente si la mentora no tiene cupo definido (sin límite).
- El cupo total (`cupoMensualHoras`) y `contacto` **nunca** salen por la API (Principio IV).

```json
{ "id": "8f3c…01", "nombre": "Valentina Ríos", "tiposAsesoria": ["revision_de_codigo"], "horasRestantes": 2 }
```

## POST /api/sesiones — nuevo error

| Caso | Respuesta |
|---|---|
| la duración de la asesoría supera las horas restantes del mes de la sesión | `409 { "error": "No hay cupo suficiente este mes para esa asesoría" }` |

El orden de chequeos es: validación (400) → existencia (404) → pasado / disponibilidad (400) →
superposición (409) → cupo (409). No se crea la sesión si falla alguno.
