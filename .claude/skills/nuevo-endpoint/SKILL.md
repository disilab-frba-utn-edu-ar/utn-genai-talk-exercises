---
name: nuevo-endpoint
description: Agrega un endpoint nuevo a la API de Express de este repo (ruta en server/routes, servicio, dominio, tipos compartidos y tests con supertest), respetando la constitution. Usala cuando pidan crear, agregar o exponer un endpoint, una ruta, un handler o un recurso nuevo bajo /api.
---

# Nuevo endpoint

Cómo agregamos un endpoint en Mentorías a Voluntad. La fuente de verdad es
`.specify/memory/constitution.md`: si esta skill la contradice, gana la constitution.

## 1. Antes de escribir, preguntá
Si el pedido no lo aclara, preguntale al usuario antes de tocar código:
- ¿Quién lo consume: una pantalla del client, la mentora, el colectivo?
- ¿Qué pasa si falla? ¿Con qué status y mensaje?
- ¿Qué valida?
- ¿Devuelve algún dato personal?

## 2. Dónde va cada cosa (principio II)
- `server/routes/`: solo HTTP; parsea, valida forma y mapea errores a status. No accede a repositorios.
- `server/services/`: el caso de uso; orquesta repositorios y dominio.
- `server/repositories/`: el acceso a los JSON en `DATA_DIR`.
- `server/domain/`: reglas puras, sin `fs` ni `express`.
- `shared/types.ts`: los tipos compartidos. Leé este archivo para conocer el formato, no los `data/*.json` enteros.
- `client/src/api/`: la función de fetch, solo si una pantalla lo consume (principio VI).

## 3. Contrato de API (principio III)
- Todo bajo `/api`, en JSON.
- Recursos en plural y kebab-case: `/api/tipos-asesoria`, `/api/sesiones/:id`.
- Errores con cuerpo `{ "error": "<mensaje en español>" }`: 400 validación, 404 no existe, 409 conflicto de estado.
- Toda entrada se valida en el servidor.

## 4. Convenciones del dominio (principio V)
- Entidades y campos en español: `mentoraId`, `horaInicio`, `estado`.
- Lo que crean los usuarios usa UUID v4 con `crypto.randomUUID()`.
- Habilidades y tipos de asesoría se identifican por su código en snake_case.

## 5. Privacidad (principio IV)
- El `contacto` de la mentora no sale nunca.
- Los datos de contacto del colectivo, solo a quien corresponde.
- El servicio devuelve una vista pública explícita: elegí los campos uno por uno, no hagas `{ ...sesion }`.
- Agregá un test que verifique que el dato privado NO está en la respuesta.

## 6. TDD con supertest (principio I)
1. Primero el test en `tests/server/api/` (y en `tests/server/domain/` si hay lógica nueva).
2. Corrélo y verificá que falle. Recién después implementá.
- Los tests de API usan la app de Express sin levantar el puerto y un `DATA_DIR` temporal: nunca leen ni escriben `data/`.
- Mirá cómo lo hacen los tests existentes en `tests/server/api/` y copiá ese patrón.

## 7. Nunca cerrar sin un caso borde ni sin validar
- Al menos un caso borde: id inexistente o mal formado → 404 (igual que `GET /api/mentoras/:id`), o campo faltante → 400.
- Corré `npm test`, `npm run lint` y `npm run typecheck`. Todo en verde antes de terminar (principio VIII).
- Al final, resumí qué archivos creaste o cambiaste.