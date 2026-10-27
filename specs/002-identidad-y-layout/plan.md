# Implementation Plan: Identidad UTN y layout a todo el ancho

**Spec**: [spec.md](spec.md)

## Constitution Check

| Principio | Estado |
|---|---|
| I Test-First | Test de `Navegacion` (logo, link) antes del componente |
| VI Frontend liviano | CSS plano con variables; sin dependencias |
| VII Accesible y responsive | Nombre accesible del link, foco visible, sin scroll horizontal desde 375px |

## Diseño

- `client/src/components/UtnLogo.tsx`: SVG con `fill="currentColor"`.
- `Layout.tsx`: grupo `.marcas` (logo UTN + separador + marca del producto).
- `styles.css`: tokens nuevos en `:root`; `.encabezado, .contenido, .pie` pasan a `width: 100%` con `padding-inline: var(--gutter)`; el contenido se centra con `max-width: var(--ancho-maximo)`.
- `ejercicios/app/ejercicios.css`: medidas de lectura con `var(--ancho-lectura)`, incluido el `calc` del temporizador.
