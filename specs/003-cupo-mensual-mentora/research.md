# Research: Cupo mensual de horas por mentora

## D1 — Dónde vive el cupo

- **Decision**: campo opcional `cupoMensualHoras` dentro de cada mentora en `data/mentoras.json`.
- **Rationale**: la spec pide cargarlo "junto con los datos de la mentora" y sin pantalla. Un campo
  nuevo no requiere archivo ni repositorio nuevo, y el `.gitignore` no cambia.
- **Alternatives**: un `cupos.json` aparte (más IO y un archivo nuevo sin ventaja); un endpoint de
  edición (la spec lo descarta, FR-017).

## D2 — Qué expone la API pública

- **Decision**: `MentoraPublica` incluye `horasRestantes?: number` y descarta `cupoMensualHoras`.
  `horasRestantes` está ausente si la mentora no tiene cupo (sin límite) y vale `0` cuando se agotó.
- **Rationale**: FR-013 y el Principio IV: se muestra lo que queda, no la configuración interna.
  Distinguir "ausente" de `0` implementa la clarificación "sin cupo definido = sin límite".
- **Alternatives**: exponer el total (filtra más de lo necesario); `null` en lugar de ausente
  (equivalente, pero el repo ya usa campos opcionales).

## D3 — Mes y consumo

- **Decision**: mes calendario `YYYY-MM`. Consumen cupo las sesiones `confirmada` de la mentora cuya
  `fecha` empieza con ese mes. Las canceladas no cuentan. Se calcula en minutos (enteros) y se
  convierte a horas solo para mostrar (`minutos / 60`, ej. 1,5).
- **Rationale**: clarificación de la spec. Minutos enteros evitan errores de coma flotante. Al ser
  derivado de las sesiones, cancelar libera el cupo sin lógica extra (FR-008).
- **Alternatives**: contador persistido (se desincroniza al cancelar); ventana de 30 días (descartada).

## D4 — Reservas simultáneas

- **Decision**: la verificación de cupo se hace dentro de `crear`, justo antes de `agregar`, sobre
  una lectura fresca de las sesiones. No hace falta bloqueo adicional.
- **Rationale**: el servidor es un único proceso Node y `crear` es síncrono de punta a punta
  (lectura y escritura del JSON son síncronas), así que dos pedidos no se intercalan: el segundo ve
  la sesión del primero y recibe `409`. Se cubre con un test que dispara dos reservas seguidas.
- **Alternatives**: lock de archivo (innecesario hoy); si el almacenamiento pasa a MongoDB habría
  que revisarlo, y queda anotado como riesgo.

## D5 — Horarios ofrecidos

- **Decision**: `calcularHorarios` descarta todo horario del día cuando `duración > minutos
  restantes` del mes de ese día; `calcularDiasDisponibles` ya itera día por día, así que un mes
  agotado no ofrece días y el mes siguiente sí.
- **Rationale**: FR-006 y FR-014. La ventana de 14 días puede cruzar de mes y cada mes se evalúa por
  separado (FR-015).
- **Alternatives**: filtrar en el servicio después de calcular (duplica la regla fuera del dominio).

## D6 — Cancelación

- **Decision**: no se agrega endpoint de cancelación; el estado `cancelada` ya existe en los tipos
  y el dominio lo respeta.
- **Rationale**: la spec define que las canceladas no consumen, no cómo se cancelan. Se verifica
  con tests de dominio y de API sembrando una sesión `cancelada`.
- **Alternatives**: `PATCH /api/sesiones/:id` (fuera de alcance de esta historia).

## D7 — Respuesta cuando el cupo no alcanza

- **Decision**: `POST /api/sesiones` responde `409 { "error": "No hay cupo suficiente este mes para esa asesoría" }`.
  El chequeo va después de los de superposición, disponibilidad y pasado.
- **Rationale**: es un conflicto de estado (Principio III) y el cliente ya muestra el mensaje del
  `409` y recarga la disponibilidad.
- **Alternatives**: `400` (no es un error de validación de la entrada).
