# Data Model: Reservar una sesión de mentoría

Tipos definidos en `shared/types.ts`. Un archivo JSON por colección en `DATA_DIR`.

## Habilidad — `habilidades.json`

| Campo | Tipo | Notas |
|---|---|---|
| id | string | código snake_case normalizado del título (`desarrollo_web_react`) |
| titulo | string | |
| descripcion | string | |

## TipoAsesoria — `tipos-asesoria.json`

| Campo | Tipo | Notas |
|---|---|---|
| id | string | código snake_case (`revision_de_codigo`) |
| nombre | string | |
| descripcion | string | |
| duracionMinutos | number | múltiplo de 15 |
| habilidades | string[] | códigos de habilidad relacionados |

## Mentora — `mentoras.json`

| Campo | Tipo | Notas |
|---|---|---|
| id | string (UUID v4) | |
| nombre | string | puede ser de fantasía |
| pronombres | string? | |
| github | string? | usuario |
| presentacion | string | |
| habilidades | string[] | códigos de habilidad |
| disponibilidad | `Record<DiaSemana, { inicio, fin } \| null>` | `DiaSemana`: lunes … domingo; horas `HH:MM` |
| contacto | `{ email: string }` | **privado**: nunca sale por la API |

Vista pública (`MentoraPublica`): todos los campos menos `contacto`, más
`tiposAsesoria: string[]` (ids de los tipos que puede dar, calculado).

## Colectivo — `colectivos.json`

| Campo | Tipo | Notas |
|---|---|---|
| id | string (UUID v4) | |
| nombre | string | |
| tipo | `fundacion` \| `asociacion_barrial` \| `ong` \| `asamblea` | |
| ubicacion | string? | |

## Sesion — `sesiones.json` (no versionado, ver `npm run seed`)

| Campo | Tipo | Notas |
|---|---|---|
| id | string (UUID v4) | generado en el servidor |
| mentoraId | string | |
| tipoAsesoriaId | string | |
| colectivoId | string | |
| proyecto | string | qué necesitan resolver (10–500 caracteres) |
| contactoNombre | string | |
| contactoEmail | string | formato email |
| fecha | string | `YYYY-MM-DD` |
| horaInicio | string | `HH:MM` |
| horaFin | string | `horaInicio + duracionMinutos` |
| estado | `confirmada` \| `cancelada` | |

## Horario (derivado, no persistido)

`{ inicio: "HH:MM", fin: "HH:MM" }`. Ver D3 en [research.md](./research.md).
