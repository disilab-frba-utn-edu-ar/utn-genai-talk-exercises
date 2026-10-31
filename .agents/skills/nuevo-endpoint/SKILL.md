---
name: nuevo-endpoint
description: Usar cuando se solicite crear o modificar un endpoint de la API Express del proyecto, incluyendo rutas HTTP GET, POST, PUT, PATCH o DELETE, consultas por ID, validaciones, códigos de respuesta, lógica de servicios y pruebas.
---
 Antes de escribir, preguntá.
¿Quién lo consume: una pantalla del client, la mentora, el colectivo?
¿Qué pasa si falla?
¿Qué valida?
¿Devuelve algún dato personal?
 Dónde va cada cosa (principio II).
server/routes/: la ruta, solo HTTP (parsear, validar forma, mapear errores a status).
server/services/: el caso de uso.
server/repositories/: el acceso a los JSON.
server/domain/: las reglas puras, sin fs ni express.
shared/types.ts: los tipos.
client/src/api/: la función de fetch, si una pantalla lo consume (principio VI).
 Contrato de API (principio III).
Todo bajo /api, en JSON.
Recursos en plural y kebab-case: /api/tipos-asesoria, /api/sesiones/:id.
Errores con cuerpo { "error": "<mensaje en español>" }: 400 validación · 404 no existe · 409 conflicto de estado.
 Convenciones del dominio (principio V).
Entidades y campos en español: mentoraId, horaInicio, estado.
IDs UUID v4 con crypto.randomUUID() para lo que crean los usuarios.
Habilidades y tipos de asesoría se identifican por su código snake_case.
 Privacidad (principio IV).
El contacto de la mentora no sale nunca.
Los datos de contacto del colectivo, solo a quien corresponde.
El servicio devuelve una vista pública explícita: elegir campos, no hacer { ...sesion }.
Hay un test que verifica que el dato privado no está en la respuesta.
 TDD con supertest (principio I).
Primero el test en tests/server/api/ (y en tests/server/domain/ si hay lógica nueva), verlo fallar y después implementar.
Los tests de API usan la app de Express sin levantar el puerto y un DATA_DIR temporal: nunca leen ni escriben data/.
Indicá que mire cómo lo hacen los tests existentes.
 Nunca cerrar sin un caso borde ni sin validar.
Al menos un caso borde: id inexistente o mal formado (404, igual que GET /api/mentoras/:id) o campo faltante (400).
Correr npm test, npm run lint y npm run typecheck.
Opcional (recordá «una skill no es un script»): si hay un paso determinístico, como chequear que el endpoint responde con el server levantado, ponelo en nuevo-endpoint/scripts/ y hacé que la skill lo invoque.