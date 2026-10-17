# Research: Reservar una sesión de mentoría

## D1 — Vite + React en lugar de Next.js

- **Decisión**: cliente SPA con Vite + React + React Router; servidor Express aparte.
- **Por qué**: arranque y recarga casi instantáneos, menos conceptos (sin RSC ni
  convenciones de framework) y separación explícita cliente/API, igual que en el
  TP de la materia (Express + React).
- **Alternativas**: Next.js (más pesado y con cambios frecuentes de API); Astro
  (excelente para contenido, menos natural para un flujo interactivo con estado).

## D2 — Archivos JSON como almacenamiento

- **Decisión**: un archivo por colección en `DATA_DIR` (por defecto `data/`), leído y
  escrito por un `json-store` genérico.
- **Por qué**: cero infraestructura. La capa `repositories/` aísla el formato: migrar a
  MongoDB solo toca esa capa.
- **Consecuencia**: los tests de API copian `data/` a un directorio temporal y apuntan
  `DATA_DIR` ahí (Principio I).

## D3 — Cálculo de horarios

- **Decisión**: función pura `calcularHorarios(disponibilidad, sesiones, fecha,
  duracion, ahora)` en `server/domain/horarios.ts`.
  - Inicios cada 30 minutos (`PASO_MINUTOS`) desde el inicio de la disponibilidad.
  - Un horario es válido si `inicio + duracion <= fin`.
  - Se descartan los que se superponen con una sesión confirmada
    (`a.inicio < b.fin && b.inicio < a.fin`).
  - Si la fecha es hoy, se descartan los que ya empezaron.
- **Alternativa descartada**: guardar horarios precalculados (se desactualizan con
  cada reserva).

## D4 — "Puede dar" un tipo de asesoría

- **Decisión**: `puedeDar(mentora, tipo)` ⇔ la mentora tiene al menos una de
  `tipo.habilidades`. Mismo criterio que el TP para anotarse a un proyecto.

## D5 — Fechas y zona horaria

- **Decisión**: fechas como texto `YYYY-MM-DD` y horas `HH:MM` en hora local del
  servidor. `domain/fechas.ts` resuelve día de la semana y suma de días sin depender
  de UTC.

## D6 — Sesiones de ejemplo relativas a hoy

- **Decisión**: `data/sesiones.json` no se versiona. `scripts/seed.mjs` lo genera con
  sesiones en los próximos días (`npm run seed`); `predev` lo crea si falta.
- **Por qué**: con fechas fijas, los datos de ejemplo quedan en el pasado y el
  calendario se ve vacío.

## D7 — Validación

- **Decisión**: validación manual en `domain/validaciones.ts` (sin librerías), que
  devuelve el primer error en español. El cliente valida lo mismo para habilitar el
  botón, pero el servidor es la fuente de verdad (Principio III).
