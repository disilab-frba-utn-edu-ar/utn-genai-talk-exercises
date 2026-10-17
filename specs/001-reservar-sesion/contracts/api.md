# API Contract: Reservar una sesión de mentoría

Base: `/api` · JSON · errores `{ "error": "<mensaje>" }`.

| Método y ruta | Respuesta OK | Errores |
|---|---|---|
| `GET /api/health` | `200 { "status": "ok" }` | |
| `GET /api/habilidades` | `200 Habilidad[]` | |
| `GET /api/tipos-asesoria` | `200 TipoAsesoria[]` | |
| `GET /api/colectivos` | `200 Colectivo[]` | |
| `GET /api/mentoras?habilidad=<codigo>` | `200 MentoraPublica[]` (filtradas si viene `habilidad`) | |
| `GET /api/mentoras/:id` | `200 MentoraPublica` | `404` mentora inexistente |
| `GET /api/mentoras/:id/disponibilidad?tipoAsesoriaId=<id>&dias=14` | `200 { fecha, horarios: Horario[] }[]` — solo días con horarios libres, desde hoy | `400` falta `tipoAsesoriaId` o la mentora no da ese tipo · `404` mentora o tipo inexistente |
| `GET /api/sesiones?mentoraId=&fecha=` | `200 SesionPublica[]` — sin `contactoNombre` ni `contactoEmail` (Principio IV) | |
| `POST /api/sesiones` | `201 Sesion` | `400` validación · `404` mentora/tipo/colectivo inexistente · `409` horario ocupado |

`dias` es opcional (por defecto 14, máximo 14).

## POST /api/sesiones

```json
{
  "mentoraId": "6f1c…",
  "tipoAsesoriaId": "revision_de_codigo",
  "colectivoId": "c3a1…",
  "proyecto": "Necesitamos revisar el formulario de inscripción a la huerta",
  "contactoNombre": "Ana",
  "contactoEmail": "ana@huertaviva.org",
  "fecha": "2026-10-20",
  "horaInicio": "10:00"
}
```

El servidor calcula `horaFin` con la duración del tipo de asesoría, genera `id` y
guarda `estado: "confirmada"`.

Validaciones (`400`): campos requeridos, email, largo de `proyecto` (10–500),
formato de fecha y hora, fecha no pasada, horario dentro de la disponibilidad de la
mentora, y que la mentora pueda dar ese tipo de asesoría.
