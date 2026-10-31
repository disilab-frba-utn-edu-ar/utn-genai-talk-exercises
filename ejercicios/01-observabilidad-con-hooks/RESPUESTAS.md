# Ejercicio 1 — Respuestas

**Nombre:** _Sin completar en Mi perfil._
**¿Intervinieron durante la tarea?** _Sin completar en Mi perfil._

## Parte A — Lo que pasó

### 1. El ciclo

**1.1** ¿Cuántas llamadas a herramientas hizo el agente en total?

Llamó 6 veces a "editor", 4 veces a "run_commands" y 3 veces a "read_files".

"Herramientas usadas:
     6  editor
     4  run_commands
     3  read_files
"

**1.2** ¿Qué herramienta usó más?

Utilizó más "editor".

### 2. Explorar antes de actuar

**2.1** ¿Cuántas herramientas usó **antes** de su primera edición de archivo?

Herramientas usadas:
     6  editor
     4  run_commands
     3  read_files

**2.2** ¿Qué archivos leyó?

Archivos leídos:
     1  .specify/memory/constitution.md
     1  shared/types.ts
     1  server/services/sesiones.ts
     1  server/domain/horarios.ts
     1  tests/server/api/sesiones.test.ts
     1  tests/server/api/helpers.ts
     1  server/services/errores.ts
     1  server/domain/fechas.ts
     1  tests/server/domain/horarios.test.ts

**2.3** ¿Leyó la constitution que menciona el prompt?

Sí.

### 3. Comandos de terminal

**3.1** Listá todos los comandos que ejecutó.

Comandos de terminal:
  $ find /home/pc/projects/formal/utn-genai-talk-exercises/server /home/pc/projects/formal/utn-genai-talk-exercises/tests -type f | head -50
  $ cd /home/pc/projects/formal/utn-genai-talk-exercises && npx vitest run tests/server/domain/superposicion.test.ts tests/server/api/sesiones.t…
  $ cd /home/pc/projects/formal/utn-genai-talk-exercises && npm test 2>&1 | tail -25
  $ cd /home/pc/projects/formal/utn-genai-talk-exercises && npm run lint 2>&1 | tail -10
  $ cd /home/pc/projects/formal/utn-genai-talk-exercises && npm run typecheck 2>&1 | tail -10
  $ cd /home/pc/projects/formal/utn-genai-talk-exercises && git status --short && git diff --stat

**3.2** ¿Alguno no lo pediste vos? ¿Alguno te generó dudas al aprobarlo?

_Sin responder._

**3.3** Clasificá cada uno con el semáforo de la charla: verde (lectura), amarillo (validación local) o rojo (escritura o producción).

_Sin responder._

### 4. Errores y reintentos

**4.1** ¿Alguna herramienta falló (`PostToolUseFailure` o un `output` con error)?

_Sin responder._

**4.2** ¿Qué hizo el agente después?

_Sin responder._

## Parte B — Lo que pensás

### 5. Contexto

**5.1** Sumá aproximadamente el tamaño de las salidas: ¿qué herramienta "llenó" más la ventana?

_Sin responder._

**5.2** ¿Había lecturas que se podían evitar? Por ejemplo: ¿leyó `data/sesiones.json` entero para entender el formato, en lugar de `shared/types.ts`?

_Sin responder._

### 6. Hooks como control

_Sin responder._

### 7. Riesgos

_Sin responder._

## Para cerrar

**Modelo:** _Sin completar en Mi perfil._

**Agente:** _Sin completar en Mi perfil._
