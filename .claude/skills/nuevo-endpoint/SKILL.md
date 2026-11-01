---
name: nuevo-endpoint
description: >-
  Usar SIEMPRE que el usuario pida crear, agregar o exponer un nuevo endpoint,
  ruta HTTP (GET, POST, PUT, PATCH, DELETE) o recurso bajo /api en el servidor
  (ej. /api/sesiones/:id, /api/mentoras, etc.). Define los pasos obligatorios
  antes de escribir código: preguntas de clarificación previas, reglas de
  privacidad, arquitectura en capas y flujo TDD con supertest.
---

# Nuevo endpoint

Seguí estos pasos en orden cada vez que te pidan crear o agregar un endpoint en `server/`.

## 1. Antes de escribir código, preguntá y esperá respuesta

No asumas requisitos ambiguos ni empieces a editar archivos si falta definir:
- **¿Quién lo consume?** ¿Una pantalla del cliente, la mentora o el colectivo?
- **¿Devuelve algún dato personal o de contacto?** (Depende de quién lo consume).
- **¿Qué valida a la entrada?**
- **¿Qué pasa si falla?** (Qué errores devuelve y con qué status).

Si el pedido no aclara estos puntos, **frená y preguntale al usuario antes de implementar**.

## 2. Dónde va cada cosa (Principio II)

Respetá las capas hacia abajo (`routes → services → repositories → domain`):
- `server/routes/`: solo HTTP (parsear request, validar forma, llamar al servicio y mapear errores a status). Nunca importa repositorios.
- `server/services/`: el caso de uso (orquesta repositorios y dominio).
- `server/repositories/`: acceso a los archivos JSON.
- `server/domain/`: reglas de negocio puras, sin `fs`, sin `express` ni repositorios.
- `shared/types.ts`: tipos compartidos entre cliente y servidor.
- `client/src/api/`: función de `fetch`, solo si una pantalla del cliente lo consume (Principio VI).

## 3. Contrato de API y convenciones (Principios III y V)

- Todo vive bajo `/api` y habla JSON.
- Recursos en **plural y `kebab-case`**: `/api/tipos-asesoria`, `/api/sesiones/:id`.
- Errores con cuerpo `{ "error": "<mensaje en español>" }`:
  - `400` validación · `404` no existe · `409` conflicto de estado.
- Entidades y campos en español (`mentoraId`, `horaInicio`, `estado`).
- IDs:
  - **UUID v4** con `crypto.randomUUID()` para entidades creadas por usuarios (mentoras, colectivos, sesiones).
  - Código normalizado en `snake_case` para catálogos (habilidades, tipos de asesoría).

## 4. Privacidad (Principio IV)

- El contacto de la mentora **no sale nunca** en endpoints públicos.
- Los datos de contacto del colectivo se muestran **solo a quien corresponde** (la mentora de esa sesión).
- El servicio devuelve una **vista pública explícita**: elegí los campos uno por uno, nunca hagas `{ ...sesion }` ni devuelvas la entidad cruda del repositorio si tiene datos privados.
- Incluí siempre un test que verifique explícitamente que el dato privado no está en la respuesta (`not.toHaveProperty(...)`).

## 5. TDD con supertest (Principio I)

1. Escribí primero el test en `tests/server/api/` (y en `tests/server/domain/` si hay lógica pura nueva). Mirá cómo lo hacen los tests existentes (`tests/server/api/helpers.ts`).
2. Los tests de API usan la app de Express sin levantar el puerto y un `DATA_DIR` temporal: **nunca leen ni escriben `data/`**.
3. Corré el test y **verificá que falle (rojo)** antes de tocar `server/`.
4. Implementá lo mínimo para que pase (verde).

## 6. Casos borde y verificación final (Principio VIII)

Nunca cierres la tarea sin:
- Al menos un **caso borde** testeado: ID inexistente o mal formado (`404`, igual que `GET /api/mentoras/:id`) o campo faltante/inválido (`400`).
- Correr y verificar que pasen sin errores:
  ```bash
  npm test
  npm run lint
  npm run typecheck
  ```
