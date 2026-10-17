<!--
SYNC IMPACT REPORT
==================
Version change: 1.7.0 → 2.0.0 (MAJOR: cambio de producto y de stack)
Producto: BarberApp → Mentorías a Voluntad
Stack: Next.js → Vite + React (client) · Express (server) · JSON (data)
Principios reemplazados: los 14 anteriores se consolidan en 8 (I a VIII)
Templates:
  ✅ .specify/templates/plan-template.md — Constitution Check actualizado a 8 principios
  ⚠  .specify/templates/spec-template.md — sin cambios requeridos
  ⚠  .specify/templates/tasks-template.md — sin cambios requeridos
TODOs diferidos: ninguno
-->

# Mentorías a Voluntad — Constitution

## Dominio del Sistema

### Objetivo

Mentorías a Voluntad es una extensión del ecosistema **Código a Voluntad**
centrada en el **asesoramiento**: personas con experiencia en desarrollo de
software (mentoras) donan horas de mentoría, y los colectivos (fundaciones,
ONGs, asambleas, asociaciones barriales) **reservan sesiones** para destrabar
los proyectos de software que necesitan.

### Roles de Usuario

**Colectivo** (quien reserva)

- Explora mentoras y filtra por habilidad.
- Elige un tipo de asesoría, un día y un horario libre de una mentora.
- Reserva una sesión indicando su proyecto y un contacto.
- No accede a los datos de contacto de las mentoras ni a sesiones de otros
  colectivos.

**Mentora** (quien dona su tiempo)

- Publica su presentación, sus habilidades y su disponibilidad semanal.
- Sus datos de contacto son privados.

**Equipo de la plataforma**

- Precarga los catálogos de habilidades y de tipos de asesoría.

### Entidades del Dominio

**Habilidad** — Catálogo precargado. Se identifica por un **código único**: el
título normalizado en `snake_case` (ej.: "Desarrollo Web React" →
`desarrollo_web_react`). Tiene título y descripción.

**Tipo de asesoría** — Catálogo precargado (ej.: `revision_de_codigo`,
`arquitectura`). Tiene nombre, descripción, duración en minutos y las
habilidades relacionadas. Una mentora **puede dar** un tipo de asesoría si
tiene **al menos una** de sus habilidades.

**Mentora** — Nombre (puede ser de fantasía), pronombres y GitHub opcionales,
presentación breve, lista de habilidades, disponibilidad semanal (un rango
horario por día de la semana, o ninguno) y datos de contacto privados.

**Colectivo** — Nombre, tipo (`fundacion`, `asociacion_barrial`, `ong`,
`asamblea`) y ubicación opcional.

**Sesión** — Unidad mínima de reserva: mentora, tipo de asesoría, colectivo,
descripción del proyecto, nombre y email de contacto del colectivo, fecha,
hora de inicio y fin, y estado (`confirmada` | `cancelada`).

**Horario** — Intervalo libre calculado a partir de la disponibilidad de la
mentora y la duración del tipo de asesoría, descontando las sesiones
confirmadas. No se persiste: se deriva al consultar.

### Restricciones de Dominio

- Una mentora NO PUEDE tener dos sesiones confirmadas que se superpongan.
- Una sesión NO PUEDE reservarse fuera de la disponibilidad de la mentora.
- Una sesión NO PUEDE reservarse en el pasado.
- Una sesión NO PUEDE ser de un tipo de asesoría que la mentora no puede dar.

## Core Principles

### I. Test-First (NON-NEGOTIABLE)

El desarrollo DEBE seguir TDD: el test se escribe primero, se verifica que falle
(rojo), se implementa (verde) y se refactoriza.

- Organización de los tests:
  ```
  tests/
    server/
      domain/   ← lógica pura (horarios, superposición, reglas)
      api/      ← endpoints con supertest contra un DATA_DIR temporal
    client/     ← componentes y páginas con Testing Library
  ```
- Los tests NUNCA escriben sobre `data/`: usan un directorio temporal
  (`DATA_DIR`).
- Ningún cambio de comportamiento se integra sin su test.

**Rationale**: cada pieza es verificable de forma aislada y las regresiones se
detectan antes de llegar al usuario.

### II. Arquitectura en Capas

El servidor DEBE respetar las capas y sus dependencias, siempre hacia abajo:

```
server/routes/        ← HTTP: parsea la request y arma la response
server/services/      ← casos de uso: orquesta repositorios y dominio
server/repositories/  ← acceso a datos (archivos JSON en DATA_DIR)
server/domain/        ← reglas de negocio puras: sin IO, sin Express
```

- `domain/` NO DEBE importar `fs`, `express` ni repositorios.
- Las rutas NO DEBEN acceder a repositorios directamente.
- Los tipos compartidos entre cliente y servidor viven en `shared/types.ts`.

**Rationale**: la lógica de negocio se testea sin levantar el servidor y el
almacenamiento se puede reemplazar (por ejemplo, por MongoDB) sin tocarla.

### III. Contrato de API

- Toda la API vive bajo `/api`, habla JSON y usa recursos en **plural y
  kebab-case** (`/api/tipos-asesoria`, `/api/sesiones/:id`).
- Errores: cuerpo `{ "error": "<mensaje en español>" }` con
  `400` validación · `404` recurso inexistente · `409` conflicto de estado.
- Toda entrada del usuario DEBE validarse en el servidor, aunque el cliente ya
  la haya validado.

**Rationale**: un contrato predecible reduce errores de integración y hace
fácil testear y documentar.

### IV. Privacidad de Datos de Contacto

- Los datos de contacto de las mentoras NUNCA DEBEN salir en endpoints
  públicos (listados, detalle, disponibilidad).
- Los datos de contacto de un colectivo solo DEBEN mostrarse a quien
  corresponde (la mentora de esa sesión).
- Los repositorios PUEDEN leer datos privados; los servicios DEBEN devolver
  vistas públicas explícitas.

**Rationale**: igual que en Código a Voluntad, los datos personales se
comparten solo cuando hay una relación que lo justifica.

### V. Identificadores

- Las entidades creadas por usuarios (mentoras, colectivos, sesiones) DEBEN
  usar **UUID v4** generado en el servidor (`crypto.randomUUID()`).
- Los catálogos (habilidades, tipos de asesoría) usan su **código normalizado
  en snake_case** como identificador.

### VI. Frontend Liviano

- React + Vite, CSS plano con variables en `client/src/styles.css`. Sin
  frameworks de UI ni librerías de estado.
- Toda llamada HTTP DEBE vivir en `client/src/api/`; los componentes no hacen
  `fetch` directo.
- Cada vista con datos remotos DEBE manejar los estados **cargando**,
  **error** y **vacío**, además del éxito.
- Componentes chicos y con una sola responsabilidad.

**Rationale**: el impacto de un cambio se ve en segundos y el código es fácil
de leer para quien recién llega.

### VII. Accesible y Responsive

- Navegable con teclado, con `label` en cada campo y foco visible.
- Contraste suficiente y textos legibles en móvil.
- Usable desde 375px de ancho sin scroll horizontal.

### VIII. Calidad de Código (NON-NEGOTIABLE)

- `npm run lint` y `npm run typecheck` DEBEN pasar sin errores.
- Prohibido `any` explícito, `@ts-ignore` o `eslint-disable` sin justificación
  en un comentario.

## Flujo de Trabajo

Toda feature nueva sigue Spec-Driven Development con Spec Kit:
`specify → clarify → plan → tasks → implement`, con revisión humana entre
cada etapa. La spec describe producto y negocio; el plan, la tecnología.

## Governance

Esta constitution prevalece sobre cualquier otra convención del repo. Cambiarla
requiere actualizar la versión, el Sync Impact Report y los templates
afectados.

**Version**: 2.0.0 | **Ratified**: 2026-04-21 | **Last Amended**: 2026-10-17
