---
name: nuevo-endpoint
description: Agrega un endpoint nuevo a la API de Mentorías a Voluntad respetando las capas (principio II), el contrato de API (principio III), la privacidad de datos (principio IV), las convenciones del dominio (principio V) y TDD (principio I). Usala cuando haya que crear o cambiar una ruta bajo /api.
argument-hint: "Qué tiene que hacer el endpoint (ej.: cancelar una sesión)"
---

# Nuevo endpoint

Antes de empezar, leé `.specify/memory/constitution.md`. Esta skill resume lo que la
constitution exige para un endpoint. Si algo no coincide, vale la constitution.

## 1. Antes de escribir, preguntá

No escribas código hasta tener estas cuatro respuestas. Si el pedido no las trae, preguntalas
todas juntas (con `AskUserQuestion` si está disponible) y esperá la respuesta:

1. **¿Quién lo consume?** ¿Una pantalla del client, la mentora, el colectivo? Esto define si
   hace falta una función en `client/src/api/` y qué datos puede ver quien llama.
2. **¿Qué pasa si falla?** ¿Qué errores se esperan, qué status le toca a cada uno
   (400 / 404 / 409) y qué ve el usuario?
3. **¿Qué valida?** La forma de la entrada (campos obligatorios, tipos, formatos) y las reglas
   de negocio (disponibilidad, superposición, fechas pasadas, si la mentora puede dar ese tipo
   de asesoría).
4. **¿Devuelve algún dato personal?** Si la respuesta es sí, mirá la sección 5 antes de
   diseñar la respuesta.

Con las respuestas, resumí en dos o tres líneas qué vas a construir (método, ruta, cuerpo,
respuesta y errores). Recién después seguí.

## 2. Dónde va cada cosa (principio II)

Las dependencias van siempre hacia abajo: `routes → services → repositories → domain`.

| Capa | Qué va | Qué NO va |
| --- | --- | --- |
| `server/routes/` | La ruta, solo HTTP: parsear params, query y body, validar la forma, llamar al service y armar la response. | Reglas de negocio. Acceso a repositorios. |
| `server/services/` | El caso de uso: orquesta repositorios y dominio. Lanza `invalido`, `noEncontrado` o `conflicto` de `services/errores.ts`. Devuelve vistas públicas. | `req`, `res` o cualquier cosa de Express. |
| `server/repositories/` | El acceso a los JSON de `DATA_DIR`. | Reglas de negocio. |
| `server/domain/` | Las reglas puras. | `fs`, `express`, repositorios o cualquier IO. |
| `shared/types.ts` | Los tipos de request y response que comparten client y server. | Tipos internos del server con datos privados. |
| `client/src/api/client.ts` | La función de fetch, **solo si una pantalla lo consume** (principio VI). Usa `pedir<T>()`. | — |

- Copiá el estilo de los endpoints que ya existen (`server/routes/mentoras.ts`,
  `server/services/mentoras.ts`, `server/routes/sesiones.ts`).
- No mapees los errores a mano en cada ruta: el service lanza un `ErrorDeNegocio` y el
  middleware de `server/app.ts` lo convierte en `{ "error": ... }` con su status.
- Si hace falta un router nuevo, montalo en `server/app.ts` dentro del router de `/api`.

## 3. Contrato de API (principio III)

- Todo bajo `/api`, en JSON.
- Recursos en plural y kebab-case: `/api/tipos-asesoria`, `/api/sesiones/:id`. Nada de verbos
  en la URL: la acción la indica el método HTTP.
- Los errores llevan el cuerpo `{ "error": "<mensaje en español>" }`:
  - `400`: validación (falta un campo, el formato no es válido).
  - `404`: el recurso no existe.
  - `409`: conflicto de estado (el horario ya está tomado, la sesión ya está cancelada).
- Validá toda entrada en el server, aunque el client ya la valide.
- Si sale bien: `200` para lecturas y actualizaciones, y `201` con el recurso creado para un
  `POST`.

## 4. Convenciones del dominio (principio V)

- Entidades y campos en español y camelCase: `mentoraId`, `tipoAsesoriaId`, `horaInicio`,
  `estado`. Mirá los nombres que ya están en `shared/types.ts` antes de inventar uno.
- Lo que crean los usuarios (mentoras, colectivos, sesiones) lleva un UUID v4 que genera el
  server con `crypto.randomUUID()`. Nunca aceptes un id que mande el client.
- Las habilidades y los tipos de asesoría se identifican por su código en snake_case
  (`revision_de_codigo`, `desarrollo_web_react`).

## 5. Privacidad (principio IV)

- El contacto de la mentora no sale nunca, en ningún endpoint.
- Los datos de contacto del colectivo (`contactoNombre`, `contactoEmail`) solo los ve quien
  corresponde: la mentora de esa sesión.
- El service devuelve una **vista pública explícita**: elegí los campos uno por uno. Nunca
  hagas `{ ...sesion }` ni `{ ...mentora }`, porque si mañana se agrega un campo privado se
  filtra solo.
- Tiene que haber un test que verifique que el dato privado no está en la respuesta (ver
  sección 6).

## 6. TDD con supertest (principio I)

Primero el test, verlo fallar (rojo) y después implementar (verde).

1. **Mirá cómo lo hacen los tests que ya existen** antes de escribir uno:
   `tests/server/api/helpers.ts`, `tests/server/api/mentoras.test.ts` y
   `tests/server/api/sesiones.test.ts`.
2. `tests/server/domain/`: si hay lógica nueva, un test por regla pura.
3. `tests/server/api/`: el endpoint con supertest. `crearAppDePrueba()` arma la app de Express
   sin levantar el puerto, sobre una copia de `data/` en un `DATA_DIR` temporal y con un reloj
   fijo (`AHORA`). Los tests nunca leen ni escriben `data/` directamente.
4. Cubrí:
   - el caso feliz;
   - cada error previsto (400 / 404 / 409) con su `{ error }` exacto;
   - privacidad, si la respuesta toca entidades con contacto. Por ejemplo:
     `expect(JSON.stringify(res.body)).not.toContain("@example.org")` o
     `expect(res.body).not.toHaveProperty("contactoEmail")`.
5. `tests/client/`: si una pantalla lo consume, sus estados cargando, error, vacío y éxito.

## 7. Nunca cerrar sin un caso borde ni sin validar

- Tiene que haber **al menos un caso borde** con test. Por ejemplo:
  - un id que no existe o que está mal formado → `404`, igual que `GET /api/mentoras/:id`;
  - un campo obligatorio que falta → `400`.
- Corré `npm test`, `npm run lint` y `npm run typecheck`. Los tres tienen que pasar. Sin
  `any` explícito, `@ts-ignore` ni `eslint-disable` sin justificar (principio VIII).
- Prueba de humo con el server levantado (`npm run dev`). Corré el script para el caso feliz y
  para el caso borde:

  ```bash
  node .claude/skills/nuevo-endpoint/scripts/probar-endpoint.mjs GET /api/<recurso>/<id> 200
  node .claude/skills/nuevo-endpoint/scripts/probar-endpoint.mjs GET /api/<recurso>/no-existe 404
  node .claude/skills/nuevo-endpoint/scripts/probar-endpoint.mjs POST /api/<recurso> 400 '{}'
  ```

  El script chequea el status, que la respuesta sea JSON, que los errores tengan la forma
  `{ "error": "..." }` con 400, 404 o 409, y avisa si aparece la palabra "contacto". Si el
  server no está levantado, decíselo al usuario: no lo des por probado.
- Checklist final:
  - [ ] La ruta no importa repositorios.
  - [ ] `domain/` no importa `fs` ni `express`.
  - [ ] La URL está en plural, en kebab-case y bajo `/api`.
  - [ ] Los campos están en español y los ids siguen el principio V.
  - [ ] Cada error sale como `{ "error": "..." }` en español, con 400, 404 o 409.
  - [ ] La vista pública elige sus campos y hay un test de que no sale el contacto.
  - [ ] Hay al menos un caso borde con test.
  - [ ] Los tipos nuevos están en `shared/types.ts` y, si una pantalla los usa, el fetch está en `client/src/api/`.
