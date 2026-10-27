# Feature Specification: Identidad UTN y layout a todo el ancho

**Feature Branch**: `feature/metricas-agentes`
**Created**: 2026-10-27
**Status**: Approved
**Input**: "Agregar el logo de la UTN al encabezado y aprovechar todo el ancho de la pantalla con menos margen, sin perder el responsive."

## Clarifications

### Session 2026-10-27 (decisiones de Luciano)

- Q: ¿Qué lleva el logo y a dónde enlaza? → A: Componente `UtnLogo` más el texto visible "UTN FRBA". Enlaza a https://www.frba.utn.edu.ar en una pestaña nueva, con un texto `sr-only` "(abre en otra pestaña)".
- Q: ¿Ancho en monitores ultra anchos? → A: Todo el ancho, con un tope suave de ~120rem para el contenido.
- Q: ¿Los textos largos? → A: Conservan una medida de lectura (consignas y documentos 64rem, reserva 56rem).

## User Scenarios & Testing

### User Story 1 — Ver la identidad UTN FRBA (P1)

**Acceptance Scenarios**:

1. **Given** cualquier página, **When** carga, **Then** el encabezado muestra el logo y "UTN FRBA" como link accesible por nombre a https://www.frba.utn.edu.ar con `target="_blank"` y `rel="noreferrer"`.
2. **Given** un ancho menor a 30rem, **Then** el texto "UTN FRBA" se oculta visualmente pero el link conserva su nombre accesible.

### User Story 2 — Usar todo el ancho (P1)

**Acceptance Scenarios**:

1. **Given** una pantalla de 1920px, **Then** el encabezado y el pie van de borde a borde, el contenido llega hasta el tope suave de 120rem y las grillas muestran más columnas.
2. **Given** 375, 768, 1280 o 1920px, **Then** no hay scroll horizontal (Principio VII).
3. **Given** un texto largo (consigna, documento, reserva), **Then** conserva su medida de lectura.

## Requirements

- **FR-001**: `UtnLogo` usa `currentColor` y es decorativo (`aria-hidden`).
- **FR-002**: Margen lateral fluido `--gutter: clamp(0.75rem, 2.5vw, 2rem)`.
- **FR-003**: Tokens `--ancho-maximo` (120rem), `--ancho-lectura` (64rem), `--ancho-formulario` (56rem).
- **FR-004**: El temporizador de las consignas usa la misma medida de lectura que las consignas.

## Success Criteria

- **SC-001**: Sin scroll horizontal a 375, 768, 1280 y 1920px en `/`, `/mentoras/:id`, `/ejercicios/01-…`, `/configurar-entorno` y `/metricas`.
- **SC-002**: `npm test`, `lint` y `typecheck` pasan.
