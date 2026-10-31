# API Contract: Reservar por tipo de asesoría

Base: `/api` · JSON · errores `{ "error": "<mensaje>" }`. Los endpoints de
[001/contracts/api.md](../../001-reservar-sesion/contracts/api.md) no cambian.

| Método y ruta | Respuesta OK | Errores |
|---|---|---|
| `GET /api/tipos-asesoria/:id/disponibilidad?dias=14` | `200 DiaDisponible[]`: unión de los horarios libres de todas las mentoras que pueden dar el tipo; solo días con horarios, desde hoy | `404` tipo inexistente |
| `GET /api/tipos-asesoria/:id/asignacion?fecha=AAAA-MM-DD&horaInicio=HH:MM` | `200 MentoraPublica`: la mentora que le tocaría según la regla de reparto | `400` falta o es inválida `fecha`/`horaInicio`, o el horario ya pasó · `404` tipo inexistente · `409` ninguna mentora libre |
| `POST /api/sesiones` | Sin cambios: `201 Sesion` | Sin cambios; `409` `"El horario se superpone con otra sesión de la mentora"` |

`dias` es opcional (por defecto 14, máximo 14), igual que en la disponibilidad por mentora.
Si ninguna mentora puede dar el tipo, la disponibilidad devuelve `[]`.

## GET /api/tipos-asesoria/:id/asignacion

```text
GET /api/tipos-asesoria/revision_de_codigo/asignacion?fecha=2026-11-02&horaInicio=18:00
```

```json
{
  "id": "8f3c2a1e-4b5d-4c6e-9f70-1a2b3c4d5e01",
  "nombre": "Valentina Ríos",
  "pronombres": "ella",
  "github": "valerios",
  "presentacion": "Frontend hace 8 años…",
  "habilidades": ["desarrollo_web_react", "testing_unitario", "accesibilidad_web"],
  "disponibilidad": { "lunes": { "inicio": "18:00", "fin": "21:00" }, "…": null },
  "tiposAsesoria": ["revision_de_codigo", "estrategia_de_testing", "auditoria_de_accesibilidad"]
}
```

Nunca incluye `contacto`. Es de solo lectura: no reserva ni bloquea a la mentora.

Mensajes:

| Caso | Status | `error` |
|---|---|---|
| Falta `fecha` | 400 | `Falta la fecha` |
| Falta `horaInicio` | 400 | `Falta la hora de inicio` |
| Formato de fecha | 400 | `La fecha debe tener el formato AAAA-MM-DD` |
| Formato de hora | 400 | `La hora de inicio debe tener el formato HH:MM` |
| Horario pasado | 400 | `No se puede reservar una sesión en el pasado` |
| Tipo inexistente | 404 | `El tipo de asesoría no existe` |
| Nadie libre | 409 | `No hay mentoras libres en ese horario` |

## Flujo del cliente

1. `GET /api/tipos-asesoria` + `GET /api/mentoras` → tipos con al menos una mentora.
2. `GET /api/tipos-asesoria/:id/disponibilidad` → días y horarios.
3. Al elegir horario: `GET /api/tipos-asesoria/:id/asignacion` → mostrar la mentora.
4. Al confirmar: `POST /api/sesiones` con `mentoraId` de la mentora mostrada.
5. Si el `POST` responde `409`: repetir el paso 3.
   - `200` con otra mentora → avisar del cambio y pedir confirmar de nuevo.
   - `409` → informar que el horario ya no está disponible y repetir el paso 2.
