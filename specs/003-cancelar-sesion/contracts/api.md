# API Contract: Cancelar una sesión reservada

Base: `/api` · JSON · errores `{ "error": "<mensaje>" }`. Extiende
[001-reservar-sesion/contracts/api.md](../../001-reservar-sesion/contracts/api.md).

| Método y ruta | Respuesta OK | Errores |
|---|---|---|
| `GET /api/sesiones/:id` | `200 SesionDetalle` | `404` sesión inexistente |
| `PATCH /api/sesiones/:id` | `200 SesionDetalle` (ya cancelada) | `400` cuerpo inválido · `404` sesión inexistente · `409` no se puede cancelar |
| `GET /api/sesiones?mentoraId=&fecha=` (**cambia**) | `200 SesionListada[]`: ya no incluye `id`, y nunca `motivoCancelacion` ni `canceladaEn` | |

## GET /api/sesiones/:id

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "mentoraId": "8f3c…",
  "tipoAsesoriaId": "revision_de_codigo",
  "colectivoId": "c0e1…",
  "proyecto": "Revisar el formulario de inscripción",
  "fecha": "2026-10-20",
  "horaInicio": "18:00",
  "horaFin": "18:30",
  "estado": "confirmada",
  "cancelacion": { "permitida": true }
}
```

Fuera de plazo:

```json
{ "…": "…", "estado": "confirmada",
  "cancelacion": { "permitida": false, "razon": "fuera_de_plazo",
                   "mensaje": "Solo se puede cancelar hasta 24 horas antes del inicio de la sesión" } }
```

Cancelada:

```json
{ "…": "…", "estado": "cancelada", "motivoCancelacion": "Se suspendió la reunión",
  "canceladaEn": "2026-10-18T15:00:00.000Z",
  "cancelacion": { "permitida": false, "razon": "ya_cancelada", "mensaje": "La sesión ya estaba cancelada" } }
```

Nunca incluye `contactoNombre` ni `contactoEmail` (Principio IV). `404` → `{ "error": "La sesión no existe" }`.

## PATCH /api/sesiones/:id

```json
{ "estado": "cancelada", "motivo": "No llegamos con el relevamiento" }
```

`motivo` es opcional; se recorta y, si queda vacío, se ignora.

| Caso | Status | `error` |
|---|---|---|
| Sesión inexistente o id mal formado | 404 | La sesión no existe |
| Cuerpo no es un objeto JSON / JSON mal formado | 400 | El cuerpo de la solicitud debe ser un objeto JSON / El cuerpo de la solicitud no es JSON válido |
| `estado` ausente o distinto de `"cancelada"` | 400 | Solo se puede cambiar el estado a cancelada |
| Otra propiedad además de `estado` y `motivo` | 400 | Solo se puede enviar el estado y el motivo |
| `motivo` no es texto | 400 | El motivo debe ser un texto |
| `motivo` de más de 500 caracteres | 400 | El motivo puede tener hasta 500 caracteres |
| Ya estaba cancelada | 409 | La sesión ya estaba cancelada |
| El inicio ya pasó | 409 | La sesión ya ocurrió y no se puede cancelar |
| Faltan menos de 24 h | 409 | Solo se puede cancelar hasta 24 horas antes del inicio de la sesión |

Orden de chequeo: un JSON mal formado da `400 "El cuerpo de la solicitud no es JSON válido"`
antes de buscar la sesión (lo corta `express.json()` en `server/app.ts`, aunque el id no
exista). Para cuerpos JSON bien formados el orden es 404 → 400 → 409. Ante cualquier
error la sesión no se modifica.
Plazo: inicio interpretado en UTC−3, comparado con el instante actual; con 24 h
exactas se permite.

## Cliente

| Ruta | Pantalla |
|---|---|
| `/sesiones/:id` | Detalle de la sesión, copiar enlace, cancelar (nueva) |
| `/confirmacion` | **Se elimina**: después de reservar se navega a `/sesiones/:id` |
