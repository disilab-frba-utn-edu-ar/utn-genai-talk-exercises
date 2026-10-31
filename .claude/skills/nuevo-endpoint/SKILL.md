---
name: nuevo-endpoint
description: Agrega un endpoint nuevo a la API de Mentorías a Voluntad con TDD, respetando las capas, el contrato de API y la privacidad de los datos de contacto. Usala cuando pidan crear, agregar o exponer un endpoint, una ruta o un recurso bajo /api.
---

## Pedido

```text
$ARGUMENTS
```

Tené en cuenta el pedido antes de seguir (si no está vacío). Las reglas de fondo están en
`.specify/memory/constitution.md`; esta skill dice cómo aplicarlas a un endpoint.

## Pasos

1. **Antes de escribir, preguntá.** Si el pedido no lo responde, consultá a la persona y esperá la respuesta:
   - ¿Quién lo consume: una pantalla del client, la mentora, el colectivo?
   - ¿Qué pasa si falla? ¿Con qué status y qué mensaje?
   - ¿Qué valida?
   - ¿Devuelve algún dato personal?

2. **Mirá cómo está hecho lo que ya existe** antes de escribir código:
   - Tests de API: `tests/server/api/helpers.ts` (`crearAppDePrueba`, `sesionDePrueba`) y `tests/server/api/sesiones.test.ts`.
   - Tests de dominio: `tests/server/domain/`.
   - Un endpoint completo de punta a punta: `server/routes/sesiones.ts` → `server/services/sesiones.ts` → `server/repositories/index.ts`.

3. **Tests primero (principio I).**
   - Escribí el test en `tests/server/api/<recurso>.test.ts` y, si hay lógica nueva, en `tests/server/domain/<tema>.test.ts`.
   - Los tests de API usan la app de Express con supertest, sin levantar el puerto, y un `DATA_DIR` temporal: nunca leen ni escriben `data/`.
   - Cubrí el caso feliz, cada error esperado y **al menos un caso borde**: id inexistente o mal formado (404, igual que `GET /api/mentoras/:id`) o campo faltante (400).
   - Si la respuesta tiene datos de una mentora o un colectivo, sumá un test que verifique que el dato privado **no** está en la respuesta.
   - Corrélos y mostrá que fallan. Recién después implementá.

4. **Implementá cada cosa en su capa (principio II).**

   | Dónde | Qué va |
   |---|---|
   | `shared/types.ts` | Los tipos compartidos entre client y server |
   | `server/domain/` | Las reglas puras: sin `fs`, sin `express`, sin repositorios |
   | `server/repositories/` | El acceso a los JSON |
   | `server/services/` | El caso de uso: orquesta repositorios y dominio, y arma la vista pública |
   | `server/routes/` | Solo HTTP: parsear, validar la forma y mapear errores a status. No accede a repositorios |
   | `server/app.ts` | Montar el router si el recurso es nuevo |
   | `client/src/api/` | La función de fetch, solo si una pantalla lo consume (principio VI) |

5. **Validá.** Corré `npm test`, `npm run lint` y `npm run typecheck`, y reportá el resultado.
   No cierres la tarea si alguno falla por el cambio.

6. **Reportá** a la persona: método y ruta, archivos tocados, tests agregados y el resultado de la validación.

## Criterios

### Contrato de API (principio III)

- Todo bajo `/api`, en JSON.
- Recursos en plural y kebab-case: `/api/tipos-asesoria`, `/api/sesiones/:id`.
- Errores con cuerpo `{ "error": "<mensaje en español>" }`:
  `400` validación · `404` no existe · `409` conflicto de estado.
- En el servicio, usá `invalido()`, `noEncontrado()` y `conflicto()` de `server/services/errores.ts`;
  el manejador de `server/app.ts` los convierte en la respuesta.
- Toda entrada se valida en el servidor, aunque el cliente ya la valide.

### Convenciones del dominio (principio V)

- Entidades y campos en español: `mentoraId`, `horaInicio`, `estado`.
- IDs UUID v4 con `crypto.randomUUID()` para lo que crean los usuarios.
- Habilidades y tipos de asesoría se identifican por su código `snake_case`.

### Privacidad (principio IV)

- El contacto de la mentora no sale nunca.
- Los datos de contacto del colectivo, solo a quien corresponde (la mentora de esa sesión).
- El servicio devuelve una vista pública explícita: **elegí los campos** uno por uno, no hagas `{ ...sesion }`.
  Así, un campo privado que se agregue mañana no se filtra solo.

### Calidad (principio VIII)

- Sin `any`, `@ts-ignore` ni `eslint-disable` sin justificación en un comentario.
- No modifiques `data/`. No toques tests existentes salvo que sea imprescindible; si lo hacés, avisá cuál y por qué.
