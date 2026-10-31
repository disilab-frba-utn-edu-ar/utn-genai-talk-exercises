---
name: nuevo-endpoint
description: Guía para agregar un nuevo endpoint HTTP a la API de Mentorías a Voluntad siguiendo la constitution y las capas del proyecto. Usar cuando se pida crear, modificar o exponer un nuevo recurso/ruta bajo /api (por ejemplo nuevos GET/POST/PUT/PATCH/DELETE), incluyendo validación, casos de uso, repositorios, tipos compartidos, cliente HTTP y tests.
argument-hint: "Describe el endpoint o recurso que querés agregar"
user-invocable: true
disable-model-invocation: false
---

# Nuevo endpoint en Mentorías a Voluntad

Esta skill guía la creación de un endpoint nuevo respetando la constitution
(`.specify/memory/constitution.md`) y la arquitectura en capas. Una skill no es un
script: acá se describe el proceso; si hay un paso determinístico (por ejemplo,
verificar que el endpoint responde con el server levantado), ponelo en
`nuevo-endpoint/scripts/` y hacé que la skill lo invoque.

## 0. Antes de escribir: preguntá

No empieces a codificar sin responder estas preguntas (si el usuario no las
aclaró, preguntáselo):

- **¿Quién lo consume?** ¿una pantalla del client, la mentora, el colectivo,
  o solo uso interno? Esto define la vista pública y si hace falta una función
  en `client/src/api/`.
- **¿Qué pasa si falla?** ¿qué status y mensaje devuelve? (400 validación,
  404 no existe, 409 conflicto de estado).
- **¿Qué valida?** campos obligatorios, formatos, rangos, existencia de
  referencias (mentora, tipo, colectivo).
- **¿Devuelve algún dato personal?** contacto de la mentora nunca; contacto del
  colectivo solo a quien corresponde.

Si alguna respuesta no está clara, detenete y preguntá antes de tocar código.

## 1. Dónde va cada cosa (Principio II)

Respetá siempre las capas, dependencias hacia abajo:

- `server/routes/` — la ruta HTTP. Solo parsea la request, valida la *forma*,
  mapea errores a status HTTP. No accede a repositorios directamente.
- `server/services/` — el caso de uso. Orquesta repositorios y dominio.
- `server/repositories/` — acceso a los archivos JSON en `DATA_DIR`.
- `server/domain/` — las reglas puras: sin `fs`, sin `express`, sin IO.
- `shared/types.ts` — los tipos compartidos client/server.
- `client/src/api/` — la función de `fetch`, si una pantalla consume el
  endpoint (Principio VI). Los componentes no hacen `fetch` directo.

## 2. Contrato de API (Principio III)

- Todo bajo `/api`, en JSON.
- Recursos en plural y kebab-case: `/api/tipos-asesoria`, `/api/sesiones/:id`.
- Errores con cuerpo `{ "error": "<mensaje en español>" }`:
  - `400` validación
  - `404` recurso inexistente
  - `409` conflicto de estado

## 3. Convenciones del dominio (Principio V)

- Entidades y campos en español: `mentoraId`, `horaInicio`, `estado`.
- IDs UUID v4 con `crypto.randomUUID()` para lo que crean los usuarios.
- Habilidades y tipos de asesoría se identifican por su código `snake_case`.

## 4. Privacidad (Principio IV)

- El contacto de la mentora no sale nunca.
- Los datos de contacto del colectivo, solo a quien corresponde.
- El servicio devuelve una vista pública explícita: elegí campos, no hagas
  `{ ...sesion }`.
- Hay un test que verifica que el dato privado no está en la respuesta.

## 5. TDD con supertest (Principio I)

1. Primero el test en `tests/server/api/` (y en `tests/server/domain/` si hay
   lógica nueva).
2. Verlo fallar (rojo).
3. Implementar (verde).
4. Refactorizar.

Los tests de API usan la app de Express sin levantar el puerto y un `DATA_DIR`
temporal: nunca leen ni escriben `data/`. Mirá cómo lo hacen los tests
existentes (`tests/server/api/helpers.ts`, `tests/server/api/sesiones.test.ts`).

## 6. Nunca cerrar sin caso borde ni validación

- Al menos un caso borde: id inexistente o mal formado (`404`, igual que
  `GET /api/mentoras/:id`) o campo faltante (`400`).
- Validá toda entrada en el servidor, aunque el cliente ya la haya validado.

## 7. Cierre

Antes de dar la tarea por terminada, corré:

- `npm test`
- `npm run lint`
- `npm run typecheck`

Los tres deben pasar sin errores.

## 8. Verificación determinística (opcional)

Si hay un paso mecánico (por ejemplo, chequear que el endpoint responde con el
server levantado), ponelo en `nuevo-endpoint/scripts/` y hacé que esta skill lo
invoque. Una skill describe el proceso; el script ejecuta el paso determinístico.

Script disponible: `nuevo-endpoint/scripts/verificar-endpoint.mjs`. Invocalo con:

```bash
node .claude/skills/nuevo-endpoint/scripts/verificar-endpoint.mjs http://localhost:3001/api/<recurso>
```

Debe devolver un status 2xx; si no, corregí antes de cerrar.