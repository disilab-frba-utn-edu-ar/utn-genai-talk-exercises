# Ejercicio 1 — Respuestas

**Nombre:** _Sin completar en Mi perfil._
**¿Intervinieron durante la tarea?** _Sin completar en Mi perfil._

## Parte A — Lo que pasó

### 1. El ciclo

**1.1** ¿Cuántas llamadas a herramientas hizo el agente en total?

19 llamadas. Evidencia: 
Herramientas usadas:
     8  editor
     6  run_commands
     3  read_files
     1  search_codebase
     1  ask_question

**1.2** ¿Qué herramienta usó más?

editor
Evidencia: 
Herramientas usadas:
     8  editor
     6  run_commands
     3  read_files
     1  search_codebase
     1  ask_question

### 2. Explorar antes de actuar

**2.1** ¿Cuántas herramientas usó **antes** de su primera edición de archivo?

8
Evidencia:
       19 herramientas (escribir 8, ejecutar 6, leer 3, buscar 1, pregunta 1)
       +   0s  leer               .specify/memory/constitution.md · shared/types.ts · server/domain · server/services · server/routes · tests/se…
       +   0s  buscar             POST /api/sesiones · crearSesion · haySuperposicion · superposicion
       +   8s  ejecutar           ls -la server/ · ls -la server/*/ · ls -la tests/server/ · ls -la tests/server/*/
       +  11s  ejecutar           Get-ChildItem server · Get-ChildItem tests/server
       +  15s  ejecutar           Get-ChildItem server/domain · Get-ChildItem server/services · Get-ChildItem server/routes · Get-ChildItem serv…
       +  20s  leer               server/domain/horarios.ts · server/domain/validaciones.ts · server/services/sesiones.ts · server/routes/sesion…
       +  25s  leer               server/domain/fechas.ts · server/services/errores.ts · server/app.ts · tests/server/domain/validaciones.test.t…
       +  71s  pregunta           ¿Apruebas el plan? Incluye actualizar un test existente (el mensaje de 409 de POST /api/sesiones) porque cambi…
       + 197s  escribir (crear/reemplazar) server/domain/superposicion.ts
       + 197s  escribir (crear/reemplazar) tests/server/domain/superposicion.test.ts
       + 209s  escribir (editar)  C:/Users/Alumno//Desktop//GenAI 31.10.26//utn-genai-talk-exercises//tests//server//api//sesiones.test.ts
       + 211s  ejecutar           npm test 2>&1
-----------------------------------------------------------------------------------Comienza a escribir
       + 250s  escribir (editar)  C:/Users//Desktop//GenAI 31.10.26//utn-genai-talk-exercises//server//domain//superposicion.ts
       + 250s  escribir (editar)  C:/Users//Desktop//GenAI 31.10.26//utn-genai-talk-exercises//server//services//sesiones.ts
       + 258s  escribir (editar)  server/domain/superposicion.ts
       + 258s  escribir (editar)  server/services/sesiones.ts
       + 263s  escribir (editar)  server/services/sesiones.ts
       + 266s  ejecutar           npm test 2>&1 · npm run lint 2>&1 · npm run typecheck 2>&1
       + 300s  ejecutar           npm test 2>&1

**2.2** ¿Qué archivos leyó?

Archivos leídos:
     1  .specify/memory/constitution.md
     1  shared/types.ts
     1  server/domain
     1  server/services
     1  server/routes
     1  tests/server/domain
     1  tests/server/api
     1  server/domain/horarios.ts
     1  server/domain/validaciones.ts
     1  server/services/sesiones.ts
     1  server/routes/sesiones.ts
     1  tests/server/api/sesiones.test.ts
     1  tests/server/hooks/log-hook.test.ts
     1  tests/server/api/helpers.ts
     1  server/domain/fechas.ts
     1  server/services/errores.ts
     1  server/app.ts
     1  tests/server/domain/validaciones.test.ts

**2.3** ¿Leyó la constitution que menciona el prompt?

Si, la leyo. Evidencia: 
+   0s  leer               .specify/memory/constitution.md · shared/types.ts · server/domain · server/services · server/routes · tests/se…

### 3. Comandos de terminal

**3.1** Listá todos los comandos que ejecutó.

Comandos de terminal:
  $ ls -la server/
  $ ls -la server/*/
  $ ls -la tests/server/
  $ ls -la tests/server/*/
  $ Get-ChildItem server
  $ Get-ChildItem tests/server
  $ Get-ChildItem server/domain
  $ Get-ChildItem server/services
  $ Get-ChildItem server/routes
  $ Get-ChildItem server/repositories
  $ Get-ChildItem tests/server/domain
  $ Get-ChildItem tests/server/api
  $ npm test 2>&1
  $ npm test 2>&1
  $ npm run lint 2>&1
  $ npm run typecheck 2>&1
  $ npm test 2>&1

**3.2** ¿Alguno no lo pediste vos? ¿Alguno te generó dudas al aprobarlo?

No, me listo el plan con los cambios que tenia planeado realizar y me pidio autorizacion (menos los de lectura).

**3.3** Clasificá cada uno con el semáforo de la charla: verde (lectura), amarillo (validación local) o rojo (escritura o producción).

Comandos de terminal:
  $ ls -la server/
  $ ls -la server/*/
  $ ls -la tests/server/
  $ ls -la tests/server/*/
  $ Get-ChildItem server
  $ Get-ChildItem tests/server
  $ Get-ChildItem server/domain
  $ Get-ChildItem server/services
  $ Get-ChildItem server/routes
  $ Get-ChildItem server/repositories
  $ Get-ChildItem tests/server/domain
  $ Get-ChildItem tests/server/api
  $ npm test 2>&1
  $ npm test 2>&1
  $ npm run lint 2>&1
  $ npm run typecheck 2>&1
  $ npm test 2>&1

### 4. Errores y reintentos

**4.1** ¿Alguna herramienta falló (`PostToolUseFailure` o un `output` con error)?

No

**4.2** ¿Qué hizo el agente después?

_Sin responder._

## Parte B — Lo que pensás

### 5. Contexto

**5.1** Sumá aproximadamente el tamaño de las salidas: ¿qué herramienta "llenó" más la ventana?

Salida que volvió al modelo (caracteres, por herramienta):
    126280  run_commands
     47972  read_files
     40976  search_codebase
        93  ask_question

**5.2** ¿Había lecturas que se podían evitar? Por ejemplo: ¿leyó `data/sesiones.json` entero para entender el formato, en lugar de `shared/types.ts`?

no leyo ese archivo

### 6. Hooks como control

Pondria un hook en PreToolUse que no permita modificar archivos dentro de data/. Antes de ejecutar la acción, verifica si se intenta editar esa carpeta y si es así, la bloquea.

### 7. Riesgos

La perdida de control sobre los cambios que puede hacer el agente

## Para cerrar

**Modelo:** Nemotron 3.5 Super VL

**Agente:** Cline
