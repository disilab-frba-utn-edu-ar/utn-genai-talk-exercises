# Data Model: Cancelar una sesión reservada

Base: [001-reservar-sesion/data-model.md](../001-reservar-sesion/data-model.md). Solo
cambia la entidad **Sesión**; no hay archivos nuevos en `data/`.

## Sesión (`sesiones.json`)

| Campo | Tipo | Nuevo | Regla |
|---|---|---|---|
| `id` | UUID v4 | | Lo genera el servidor. Es el enlace propio de la sesión. |
| `mentoraId`, `tipoAsesoriaId`, `colectivoId`, `proyecto` | texto | | Sin cambios. |
| `contactoNombre`, `contactoEmail` | texto | | Privados: nunca salen en GET (Principio IV). |
| `fecha` / `horaInicio` / `horaFin` | `YYYY-MM-DD` / `HH:MM` | | Hora de Argentina (UTC−3). |
| `estado` | `"confirmada" \| "cancelada"` | | Transición única: `confirmada → cancelada`. |
| `motivoCancelacion` | texto opcional, 1–500 | ✓ | Solo si `estado = "cancelada"` y se envió un motivo no vacío (recortado). |
| `canceladaEn` | ISO 8601 opcional | ✓ | Instante de la cancelación (`reloj().toISOString()`). Presente si y solo si `estado = "cancelada"` por esta feature. |

Las sesiones canceladas antes de esta feature (por ejemplo, las del seed) pueden no
tener `canceladaEn`; la vista lo trata como opcional.

### Transición de estado

```text
confirmada ──PATCH { estado: "cancelada", motivo? }──▶ cancelada   (sin vuelta atrás)
```

Precondición (dominio, `evaluarCancelacion(sesion, ahora)`):

| Orden | Condición | Resultado |
|---|---|---|
| 1 | `estado = "cancelada"` | `ya_cancelada` |
| 2 | `instanteEnArgentina(fecha, horaInicio) ≤ ahora` | `ya_ocurrio` |
| 3 | `inicio − ahora < 24 h` | `fuera_de_plazo` |
| 4 | en otro caso (`inicio − ahora ≥ 24 h`) | permitida |

## Tipos compartidos (`shared/types.ts`)

```ts
export type Sesion = {
  // …campos existentes…
  estado: EstadoSesion
  motivoCancelacion?: string
  canceladaEn?: string
}

/** Vista pública base: sin contacto ni datos de cancelación. */
export type SesionPublica = Omit<Sesion, "contactoNombre" | "contactoEmail" | "motivoCancelacion" | "canceladaEn">

/** Listado público: tampoco expone el id, que es la credencial del enlace. */
export type SesionListada = Omit<SesionPublica, "id">

export type RazonNoCancelable = "ya_cancelada" | "ya_ocurrio" | "fuera_de_plazo"

export type Cancelacion = { permitida: true } | { permitida: false; razon: RazonNoCancelable; mensaje: string }

/** Lo que ve quien tiene el enlace (GET y PATCH /api/sesiones/:id). */
export type SesionDetalle = SesionPublica & {
  motivoCancelacion?: string
  canceladaEn?: string
  cancelacion: Cancelacion
}

export type CambioSesion = { estado: "cancelada"; motivo?: string }
```

## Horario (derivado)

Sin cambios: se sigue calculando descontando solo sesiones `confirmada`, así que una
sesión cancelada libera su horario automáticamente.
