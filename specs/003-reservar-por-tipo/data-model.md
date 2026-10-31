# Data Model: Reservar por tipo de asesoría

**No cambian las entidades persistidas.** `Habilidad`, `TipoAsesoria`, `Mentora`,
`Colectivo` y `Sesion` quedan como en
[001/data-model.md](../001-reservar-sesion/data-model.md) y `shared/types.ts`. Tampoco
cambian los archivos de `data/` ni `scripts/seed.mjs`.

## Conceptos derivados (no se persisten)

### Horario ofrecido por tipo

Mismo tipo `DiaDisponible` (`{ fecha, horarios: Horario[] }`) que la disponibilidad de
una mentora, pero calculado como la unión de las mentoras que pueden dar el tipo:

- Un `Horario` aparece si **al menos una** mentora que `puedeDar` el tipo está libre en
  `[inicio, fin)` (`fin = inicio + duracionMinutos`).
- Cada `inicio` aparece una sola vez por fecha; horarios y fechas en orden ascendente.
- Solo días de la ventana de 14 días (desde hoy) con al menos un horario.
- No dice qué mentora lo cubre.

### Franja pedida

`{ mentoraId?, fecha, horaInicio, horaFin }`: la misma forma que ya usa
`haySuperposicion` (`FranjaPedida`). `horaFin` siempre la calcula el servidor con la
duración del tipo.

### Asignación

Resultado de `elegirMentora`: la `Mentora` elegida o `null`. El servicio la devuelve como
`MentoraPublica` (sin `contacto`, Principio IV).

Reglas (FR-006, FR-007):

| Paso | Regla |
|------|-------|
| Candidatas | Mentoras que `puedeDar(mentora, tipo)` |
| Libres | `estaDentroDeDisponibilidad(...)` y `!haySuperposicion(sesiones, franja)` |
| Carga | Cantidad de sesiones `confirmada` de la mentora con `hoy <= fecha <= hoy + 13` |
| Orden | Carga ascendente; empate → `nombre` alfabético (`localeCompare` en `es`) |
| Resultado | La primera, o ninguna → `409` |

## Tipos compartidos nuevos

Ninguno obligatorio. La respuesta de asignación es `MentoraPublica`, ya existente.
