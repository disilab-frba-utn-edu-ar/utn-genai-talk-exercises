# Ejercicio 2 — Respuestas

**Intentos hasta que la skill se disparó sola:** se disparó al primer intento

**Nombre:** _Sin completar en Mi perfil._
**¿Intervinieron durante la tarea?** _Sin completar en Mi perfil._

## Preguntas sobre la skill

### 1. La `description`

**1.1** Pegá tu `description` final.

description: Agrega un endpoint nuevo a la API de Mentorías a Voluntad con TDD, respetando las capas, el contrato de API y la privacidad de los datos de contacto. Usala cuando pidan crear, agregar o exponer un endpoint, una ruta o un recurso bajo /api.

**1.2** ¿Cuántas versiones probaste hasta que se disparó sola en una sesión nueva? Indicá el `session` del log de la prueba que funcionó.

1 sola versión. Le expliqué al agente lo que necesitaba y le pedí que redacte la skill, me hizo preguntas sobre las cosas que no había aclarado, y funcionó bien al primer intento de usarla.
Funcionó en la session d6573074.

**1.3** ¿Qué cambió entre la primera y la última?

_Sin responder._

### 2. Cuándo se cargó

La skill se cargó antes de leer código.
Turnos:
  1. +3s  <ide_opened_file>The user opened the file c:\Users\abril\UTN\Seminario GenAI\utn-genai-tal…
       10 herramientas (ejecutar 8, skill 1, pregunta 1)

13:22:00.594Z UserPromptSubmit                  
13:22:03.215Z PreToolUse Skill            {"skill":"nuevo-endpoint","args":"GET /api/sesiones/:id — detalle de una sesión por id; si no existe, 404."}
13:22:06.655Z PreToolUse Bash             cat server/routes/sesiones.ts server/services/sesiones.ts …   ← primera lectura de código
13:22:15.170Z PreToolUse AskUserQuestion  "¿Quién consume GET /api/sesiones/:id?" …
13:24:25.508Z PreToolUse Bash             cat tests/server/api/helpers.ts …
13:24:34.286Z PreToolUse Bash             cat >> tests/server/api/sesiones.test.ts …   ← tests primero
13:24:41.684Z PreToolUse Bash             sed -n 25,32p server/repositories/index.ts …
13:24:51.081Z PreToolUse Bash             python - <<'EOF' …   ← implementación + npm test/lint/typecheck

### 3. ¿Siguió el criterio?

**3.1** Elegí **dos** reglas de tu skill y mostrá en el diff que el agente las cumplió. Por ejemplo: la capa en la que puso cada cosa, o el test con `DATA_DIR` temporal.

**Tests primero (principio I).**
   - Escribí el test en `tests/server/api/<recurso>.test.ts` y, si hay lógica nueva, en `tests/server/domain/<tema>.test.ts`.
   - Los tests de API usan la app de Express con supertest, sin levantar el puerto, y un `DATA_DIR` temporal: nunca leen ni escriben `data/`.
   - Cubrí el caso feliz, cada error esperado y **al menos un caso borde**: id inexistente o mal formado (404, igual que `GET /api/mentoras/:id`) o campo faltante (400).
   - Si la respuesta tiene datos de una mentora o un colectivo, sumá un test que verifique que el dato privado **no** está en la respuesta.
   - Corrélos y mostrá que fallan. Recién después implementá.

+describe("API · GET /api/sesiones/:id", () => {
+  it("devuelve el detalle de la sesión", async () => {                         ← caso feliz
+    const { api } = crearAppDePrueba([sesion, sesionDePrueba({ id: "otra", … })])   ← DATA_DIR temporal
+    expect(res.status).toBe(200)
+
+  it("no expone los datos de contacto del colectivo (Principio IV)", …         ← dato privado ausente
+    expect(res.body).not.toHaveProperty("contactoEmail")
+    expect(JSON.stringify(res.body)).not.toContain("ana@example.org")
+
+  it("404 si la sesión no existe o el id está mal formado", …                  ← error esperado
+    expect(inexistente.body).toEqual({ error: "La sesión no existe" })
+    expect((await api.get("/api/sesiones/no-es-un-uuid")).status).toBe(404)     ← caso borde


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


Cada archivo del diff tiene solo lo que corresponde a su capa:

Repositorio: solo acceso al JSON, sin reglas:


 // server/repositories/index.ts
+      buscar: (id: string) => sesiones.leer().find((s) => s.id === id),
Servicio: usa el repositorio, decide el error y arma la vista pública:


 // server/services/sesiones.ts
+    obtener(id: string): SesionPublica {
+      const sesion = repos.sesiones.buscar(id)
+      if (!sesion) throw noEncontrado("La sesión no existe")    ← helper de errores.ts, como pide la skill
+      return aSesionPublica(sesion)
+    },
Y la vista pública copia los campos uno por uno, como pide la sección de privacidad:


-  const { contactoNombre, contactoEmail, ...publica } = sesion
-  return publica
+  // Campo por campo: un dato privado que se agregue a Sesion no se filtra solo.
+  return {
+    id: sesion.id,
+    mentoraId: sesion.mentoraId,
+    …
Ruta: solo HTTP. Recibe el servicio, nunca repos, y no tiene ningún if ni status a mano:


 // server/routes/sesiones.ts
+  router.get("/:id", (req, res) => {
+    res.json(sesiones.obtener(req.params.id))
+  })

**3.2** ¿Alguna la ignoró? ¿Por qué creés que pasó?

Si, 2:
Agregó la función de fetch en el client sin que ninguna pantalla la use. La skill dice que va "solo si una pantalla lo consume".
No leyó todo lo que la skill pide mirar antes: la constitución y los tests de dominio
Se salteó los pasos de contexto y respetó los de generación de codigo.

## Pregunta sobre el MCP conectado

### 4. Costo de tener MCP conectados

**4.1** ¿Cuántas expone?

Herramientas MCP:
    10  mcp__playwright__browser_snapshot
     6  mcp__playwright__browser_click
     4  mcp__playwright__browser_evaluate
     3  mcp__playwright__browser_navigate
     2  mcp__playwright__browser_run_code_unsafe
     1  mcp__playwright__browser_fill_form
     1  mcp__playwright__browser_take_screenshot
     1  mcp__playwright__browser_network_requests
     1  mcp__playwright__browser_network_request
     1  mcp__playwright__browser_resize
     1  mcp__playwright__browser_console_messages

**4.2** ¿Conviene tener muchos MCP conectados todo el tiempo? ¿Qué le cuesta eso al contexto?

Cada MCP conectado ocupa contexto aunque no se use, así que habría que dejar conectados solo los que son necesarios para el proyecto.

## Pregunta sobre lo que hizo en el navegador

### 5. Lo que encontró

**5.1** ¿Encontró algún problema real en la app usando el navegador que no se veía con los tests? Por ejemplo: de usabilidad, de accesibilidad o un dato privado en la red.

Sí, 3:
1. Recargar la confirmación hace que se pierda todo. /confirmacion redirige al inicio y se pierde el código de la sesión, justo en la pantalla que dice "Guardá estos datos".
2. Accesibilidad: al cambiar de página el foco vuelve al principio y el título siempre es "Mentorías a Voluntad". Con lector de pantalla no te enterás de que cambiaste de página.
3. Rocío Paz muestra "Reservar sesión" aunque no tiene horarios. Recién te enterás al entrar.

**5.2** ¿Qué no pudo verificar?

1. Lector de pantalla real. Solo vió el árbol de accesibilidad.
2. Contraste de colores y zoom al 200%. No los midió.
3. Celular real. Solo achicó la ventana a 375px, no probó teclado de celular.
4. Confirmar con teclado. Frenó antes del botón para no crear otra reserva.
5. Errores de la API en pantalla. No probó horario ocupado (409) ni caída del servidor.
6. Otros navegadores. Solo Chromium.

## Preguntas sobre las herramientas del MCP

### 6. Herramientas usadas

**6.1** ¿Qué herramientas del MCP usó el agente y cuántas veces cada una?

Herramientas MCP:
    10  mcp__playwright__browser_snapshot
     6  mcp__playwright__browser_click
     4  mcp__playwright__browser_evaluate
     3  mcp__playwright__browser_navigate
     2  mcp__playwright__browser_run_code_unsafe
     1  mcp__playwright__browser_fill_form
     1  mcp__playwright__browser_take_screenshot
     1  mcp__playwright__browser_network_requests
     1  mcp__playwright__browser_network_request
     1  mcp__playwright__browser_resize
     1  mcp__playwright__browser_console_messages

**6.2** ¿Cuál devolvió las salidas más grandes?

31824  mcp__playwright__browser_snapshot

Salida que volvió al modelo (caracteres, por herramienta):
    269617  Read
     45744  Bash
     31824  mcp__playwright__browser_snapshot
      6515  mcp__playwright__browser_run_code_unsafe
      5362  mcp__playwright__browser_evaluate
      2045  mcp__playwright__browser_click
      1774  AskUserQuestion
      1221  ToolSearch
      1189  mcp__playwright__browser_network_requests
      1093  mcp__playwright__browser_navigate
       518  mcp__playwright__browser_network_request
       470  mcp__playwright__browser_fill_form
       400  mcp__playwright__browser_take_screenshot
       127  mcp__playwright__browser_console_messages
       120  mcp__playwright__browser_resize
        47  Skill

### 7. Una skill que usa el MCP

**7.1** Proponé una skill para este repo que **use** el MCP de Playwright. Por ejemplo: "verificar un flujo de reserva contra los escenarios de una spec".

Skill para revisar privacidad en la red. Navegar la app y avisar si alguna respuesta de la API trae emails o datos de contacto.

**7.2** Escribí solo el encabezado y 5-6 líneas de criterio.

---
name: revisar-privacidad-red
description: Recorre la app con el navegador (MCP de Playwright) y revisa las respuestas de la API buscando datos de contacto que no deberían salir. Usala cuando pidan verificar privacidad, filtraciones de datos o qué expone la API.
---

## Criterios

- Recorré el flujo completo como colectivo: listado, filtro, mentora, reserva y confirmación.
- Revisá el cuerpo de cada respuesta `/api/*` con `browser_network_request`, no solo el status.
- El email de una mentora no puede aparecer nunca (principio IV).
- El contacto del colectivo solo puede volver a quien lo cargó (respuesta del POST).
- No modifiques código: reportá endpoint, campo filtrado y cómo reproducirlo.
- Al terminar, corré `npm run seed` para borrar las reservas de prueba.

## Para cerrar

**Modelo:** Opus 5.5

**Agente:** Claude Code
