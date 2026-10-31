---
name: nuevo-endpoint
description: Crea o modifica un endpoint de la API REST de Express en este repo (una ruta nueva en server/routes, un handler GET/POST/PUT/PATCH/DELETE bajo /api, con su servicio, repositorio, tipos y tests con supertest). Usala SIEMPRE que el usuario pida un endpoint, una ruta o un recurso nuevo de la API (por ejemplo "necesito un endpoint para...", "GET /api/...", "agregá una ruta que devuelva..."), o cambiar lo que devuelve o valida uno existente, antes de leer o escribir código del server.
---

# Nuevo endpoint

Cómo agregamos un endpoint a la API de *Mentorías a voluntad*. Seguí estos pasos
en orden; cada uno remite a un principio de la constitución
(`.specify/memory/constitution.md`).

## 1. Antes de escribir, preguntá

Si el pedido no lo responde, preguntá (o decí qué supuesto tomás) antes de tocar código:

- ¿Quién lo consume: una pantalla del client, la mentora, el colectivo?
- ¿Qué pasa si falla? ¿Qué status y qué mensaje ve quien lo llama?
- ¿Qué valida (forma de los parámetros, existencia, estado)?
- ¿Devuelve algún dato personal? ¿De quién, y a quién se lo puede mostrar?

## 2. Dónde va cada cosa (principio II)

| Capa | Qué va | Qué NO va |
|---|---|---|
| `server/routes/` | Solo HTTP: parsear `req`, validar forma, `res.json(...)` | Reglas de negocio, `fs` |
| `server/services/` | El caso de uso; lanza `noEncontrado` / `invalido` / `conflicto` de `services/errores.ts` | `req`/`res` |
| `server/repositories/` | El acceso a los JSON | Reglas |
| `server/domain/` | Reglas puras | `fs`, `express` |
| `shared/types.ts` | Los tipos (incluida la vista pública) | — |
| `client/src/api/` | La función de fetch, si una pantalla lo consume (principio VI) | — |

Mirá `server/routes/mentoras.ts` y `server/services/mentoras.ts` como modelo y
registrá el router en `server/app.ts` si es un recurso nuevo.

## 3. Contrato de API (principio III)

- Todo bajo `/api`, en JSON.
- Recursos en plural y kebab-case: `/api/tipos-asesoria`, `/api/sesiones/:id`.
- Errores con cuerpo `{ "error": "<mensaje en español>" }`:
  `400` validación · `404` no existe · `409` conflicto de estado.
  No armes el cuerpo a mano en la ruta: lanzá el `ErrorDeNegocio` desde el servicio.

## 4. Convenciones del dominio (principio V)

- Entidades y campos en español: `mentoraId`, `horaInicio`, `estado`.
- IDs UUID v4 con `crypto.randomUUID()` para lo que crean los usuarios.
- Habilidades y tipos de asesoría se identifican por su **código snake_case**.

## 5. Privacidad (principio IV)

- El `contacto` de la mentora no sale **nunca**.
- Los datos de contacto del colectivo, solo a quien corresponde.
- El servicio devuelve una **vista pública explícita**: elegí los campos uno por
  uno; nunca `{ ...sesion }` ni el objeto del repositorio tal cual.
- Escribí un test que verifique que el dato privado **no** está en la respuesta.

## 6. TDD con supertest (principio I)

1. Primero el test en `tests/server/api/` (y en `tests/server/domain/` si hay
   lógica nueva). Correlo y **miralo fallar**.
2. Recién después implementá.
3. Los tests de API usan la app de Express sin levantar el puerto y un
   **`DATA_DIR` temporal**: usá `crearAppDePrueba` de
   `tests/server/api/helpers.ts`. Nunca leen ni escriben `data/`.
4. Copiá el estilo de `tests/server/api/mentoras.test.ts` y `sesiones.test.ts`.

No modifiques nada dentro de `data/`.

## 7. Nunca cerrar sin un caso borde ni sin validar

- Al menos un caso borde con test: id inexistente o mal formado (`404`, igual que
  `GET /api/mentoras/:id`) o campo faltante (`400`).
- Antes de dar por terminado, corré y mostrá el resultado de:
  `npm test`, `npm run lint` y `npm run typecheck`.
- Al final, resumí: archivos tocados por capa, status que devuelve y qué campos
  quedan afuera por privacidad.
