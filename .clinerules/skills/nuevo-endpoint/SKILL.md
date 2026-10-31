---
name: mentorias-api-endpoint
description: Diseña e implementa endpoints HTTP, casos de uso, reglas de dominio y clientes de API para Mentorías a Voluntad siguiendo TDD con supertest, arquitectura en capas y privacidad de datos de contacto. Úsalo cuando se pida crear, modificar o extender un endpoint bajo /api, agregar lógica de negocio de mentoras, colectivos, sesiones u horarios, o conectar una vista de React con el backend.
---

# Endpoints y Casos de Uso — Mentorías a Voluntad

Guía paso a paso para diseñar, testear e implementar endpoints y casos de uso en **Mentorías a Voluntad** respetando la Constitution del proyecto.

## 1. Antes de escribir, preguntá

Antes de tocar cualquier archivo, aclaré las dudas sobre el requerimiento respondiendo estas cuatro preguntas:

- **¿Quién lo consume?**: ¿Lo llama una pantalla del `client`, la mentora o el colectivo?
- **¿Qué pasa si falla?**: ¿Qué casos de error existen y qué código HTTP (`400`, `404`, `409`) corresponde devolver en cada uno?
- **¿Qué valida?**: ¿Qué campos de entrada son obligatorios y qué restricciones del dominio aplican (superposición de sesiones confirmadas, fuera de disponibilidad semanal de la mentora, fecha en el pasado, o tipo de asesoría que la mentora no puede dar por no tener al menos una de sus habilidades)?
- **¿Devuelve algún dato personal?**: ¿Hay datos de contacto de la mentora o del colectivo involucrados que deban ocultarse o restringirse?

## 2. Dónde va cada cosa (Principio II y VI)

Respetá las capas del proyecto y sus dependencias siempre hacia abajo (`routes → services → repositories / domain`):

- **`server/routes/`**: la ruta, solo HTTP (parsear request, validar forma de entrada y mapear errores a status HTTP). Las rutas NUNCA acceden a `server/repositories/` directamente.
- **`server/services/`**: el caso de uso (orquesta repositorios y funciones de dominio, y construye las vistas públicas).
- **`server/repositories/`**: el acceso a los archivos JSON dentro de `DATA_DIR`.
- **`server/domain/`**: las reglas de negocio puras (cálculo de horarios libres, superposición, validaciones de dominio), sin importar `fs`, `express` ni repositorios.
- **`shared/types.ts`**: los tipos e interfaces compartidos entre cliente y servidor.
- **`client/src/api/`**: la función de `fetch`, si una pantalla del cliente consume el endpoint (Principio VI). Los componentes de React no hacen `fetch` directo y cada vista con datos remotos debe manejar los estados **cargando**, **error** y **vacío**, además del éxito.

## 3. Contrato de API (Principio III)

- Todo vive bajo `/api` y habla JSON.
- Recursos en **plural y kebab-case**: por ejemplo, `/api/tipos-asesoria`, `/api/sesiones/:id`, `/api/mentoras/:id`.
- Errores siempre con cuerpo `{ "error": "<mensaje en español>" }`:
  - `400`: error de validación.
  - `404`: recurso no existe o id mal formado.
  - `409`: conflicto de estado o regla de negocio (superposición de horario, fuera de disponibilidad, mentora sin habilidad para ese tipo de asesoría).
- Toda entrada del usuario debe validarse en el servidor, aunque el cliente ya la haya validado.

## 4. Convenciones del dominio (Principio V)

- **Entidades y campos en español**: `mentoraId`, `tipoAsesoriaId`, `horaInicio`, `horaFin`, `estado`, etc.
- **Identificadores de entidades de usuario** (`mentoras`, `colectivos`, `sesiones`): UUID v4 generado en el servidor con `crypto.randomUUID()`.
- **Identificadores de catálogos** (`habilidades`, `tipos de asesoría`): se identifican por su código normalizado en `snake_case` (ej.: `desarrollo_web_react`, `revision_de_codigo`, `arquitectura`).
- **Horarios**: no se persisten; se derivan al consultar descontando las sesiones `confirmada` de la disponibilidad semanal de la mentora según la duración del tipo de asesoría.

## 5. Privacidad de datos de contacto (Principio IV)

- El contacto de la mentora **no sale nunca** en endpoints públicos (listados, detalle, disponibilidad).
- Los datos de contacto del colectivo **solo se muestran a quien corresponde** (la mentora de esa sesión) y nunca a otros colectivos ni en listados públicos.
- El servicio debe devolver una **vista pública explícita**: elegir y mapear explícitamente los campos públicos permitidos, nunca hacer `{ ...sesion }` ni `{ ...mentora }`.
- Siempre debe existir un test que verifique explícitamente que el dato privado no está presente en la respuesta JSON.

## 6. TDD con supertest (Principio I)

El desarrollo sigue el ciclo **rojo → verde → refactor**:

1. **Mirar los tests existentes**: antes de escribir, revisá cómo están implementados los tests actuales en `tests/server/api/` y `tests/server/domain/` para seguir las mismas convenciones y helpers.
2. **Escribir primero el test**:
   - En `tests/server/domain/` si hay lógica pura nueva.
   - En `tests/server/api/` para el endpoint HTTP.
3. **Aislamiento de datos**: los tests de API usan la app de Express con `supertest` sin levantar el puerto y contra un `DATA_DIR` temporal. **Nunca** leen ni escriben sobre `data/`.
4. **Verlo fallar**: ejecutá `npm test` para comprobar que el test falla antes de escribir la implementación.

## 7. Nunca cerrar sin un caso borde ni sin validar (Principios I y VIII)

Antes de dar por terminada la tarea, verificá que se cumplan todos estos puntos:

- [ ] Hay al menos un **caso borde** testeado: un ID inexistente o mal formado que devuelva `404` (igual que `GET /api/mentoras/:id`), un campo obligatorio faltante que devuelva `400`, o un conflicto de estado que devuelva `409`.
- [ ] Hay un test que comprueba que los datos de contacto privados no se filtran en la respuesta.
- [ ] No se usó `any` explícito, `@ts-ignore` ni `eslint-disable` sin justificación en un comentario.
- [ ] Corriste y pasaron sin errores:
  ```bash
  npm test
  npm run lint
  npm run typecheck
  ```