---
name: nuevo-endpoint
description: Agrega o modifica un endpoint de la API Express de Mentorías a Voluntad (ruta, handler, GET/POST/PATCH /api/..., server/routes, services, repositories) siguiendo las capas, el contrato de errores, la privacidad y el TDD del repo. Usala cada vez que te pidan un endpoint, una ruta o un handler nuevo de la API.
---

# Nuevo endpoint

Criterio del repo para cualquier endpoint nuevo. Leé `.specify/memory/constitution.md` si tenés dudas.

## 1. Antes de escribir, preguntá

Si el pedido no lo dice, preguntá (breve):
- ¿Quién lo consume: una pantalla del client, la mentora, el colectivo?
- ¿Qué pasa si falla?
- ¿Qué valida?
- ¿Devuelve algún dato personal?

## 2. Dónde va cada cosa (principio II)

- `server/routes/`: la ruta, solo HTTP (parsear, validar forma, mapear errores a status).
- `server/services/`: el caso de uso.
- `server/repositories/`: el acceso a los JSON.
- `server/domain/`: reglas puras, sin `fs` ni `express`.
- `shared/types.ts`: los tipos.
- `client/src/api/`: la función de fetch, si una pantalla lo consume (principio VI). Nunca `fetch` fuera de ahí.

## 3. Contrato de API (principio III)

- Todo bajo `/api`, en JSON.
- Recursos en plural y kebab-case: `/api/tipos-asesoria`, `/api/sesiones/:id`.
- Errores con cuerpo `{ "error": "<mensaje en español>" }`: `400` validación · `404` no existe · `409` conflicto de estado.

## 4. Convenciones del dominio (principio V)

- Entidades y campos en español: `mentoraId`, `horaInicio`, `estado`.
- IDs UUID v4 con `crypto.randomUUID()` para lo que crean los usuarios.
- Habilidades y tipos de asesoría se identifican por su código snake_case.

## 5. Privacidad (principio IV)

- El `contacto` de la mentora no sale nunca.
- Los datos de contacto del colectivo, solo a quien corresponde.
- El servicio devuelve una vista pública explícita: elegí campos, no hagas `{ ...sesion }`.
- Escribí un test que verifique que el dato privado no está en la respuesta.

## 6. TDD con supertest (principio I)

- Primero el test en `tests/server/api/` (y en `tests/server/domain/` si hay lógica nueva); verlo fallar; después implementar.
- Mirá cómo lo hacen los tests existentes y usá `crearAppDePrueba` de `tests/server/api/helpers.ts`: app sin puerto y `DATA_DIR` temporal. Nunca leas ni escribas `data/` desde un test.

## 7. Cerrar

- Al menos un caso borde: id inexistente o mal formado (`404`, igual que `GET /api/mentoras/:id`) o campo faltante (`400`).
- Corré `npm test`, `npm run lint` y `npm run typecheck` y no des la tarea por terminada si alguno falla.
