# Ejercicio 1 — Respuestas

**Nombre:** _Sin completar en Mi perfil._
**¿Intervinieron durante la tarea?** _Sin completar en Mi perfil._

## Parte A — Lo que pasó

### 1. El ciclo

**1.1** ¿Cuántas llamadas a herramientas hizo el agente en total?

Turnos: 1  ·  Llamadas a herramientas: 25  ·  Eventos registrados: 55

**1.2** ¿Qué herramienta usó más?

Herramientas usadas:
     9  Read
     8  Bash
     5  Edit
     3  Write

**1.3** Agrupalas en las familias de la charla: búsqueda de código, control de versiones, validación local, navegador, servicios.

_Sin responder._

### 2. Explorar antes de actuar

**2.1** ¿Cuántas herramientas usó **antes** de su primera edición de archivo?

12 herramientas

+   8s  leer               .specify/memory/constitution.md
       +   9s  ejecutar           git ls-files server shared tests data specs package.json && cat package.json | grep -A12 '"scripts"'
       +  12s  leer               server/services/sesiones.ts
       +  12s  leer               server/routes/sesiones.ts
       +  13s  leer               server/domain/horarios.ts
       +  14s  leer               server/domain/fechas.ts
       +  14s  leer               tests/server/api/sesiones.test.ts
       +  15s  leer               tests/server/api/helpers.ts
       +  15s  leer               shared/types.ts
       +  16s  leer               server/services/errores.ts
       +  17s  ejecutar           grep -n -i -E "superpon|409|ya no est|ocupad" -r specs/001-reservar-sesion client/src server tests 2>/dev/null…
       +  33s  ejecutar           grep -rn "ya está reservado" client server tests specs scripts 2>/dev/null; echo ---; sed -n 78,105p client/sr…

**2.2** ¿Qué archivos leyó?

Archivos leídos:
     1  .specify/memory/constitution.md
     1  server/services/sesiones.ts
     1  server/routes/sesiones.ts
     1  server/domain/horarios.ts
     1  server/domain/fechas.ts
     1  tests/server/api/sesiones.test.ts
     1  tests/server/api/helpers.ts
     1  shared/types.ts
     1  server/services/errores.ts

**2.3** ¿Leyó la constitution que menciona el prompt?

si

### 3. Comandos de terminal

**3.1** Listá todos los comandos que ejecutó.

Comandos de terminal:
  $ git ls-files server shared tests data specs package.json && cat package.json | grep -A12 '"scripts"'
  $ grep -n -i -E "superpon|409|ya no est|ocupad" -r specs/001-reservar-sesion client/src server tests 2>/dev/null; echo ---; sed -n 1,40p tests…
  $ grep -rn "ya está reservado" client server tests specs scripts 2>/dev/null; echo ---; sed -n 78,105p client/src/pages/ReservaPage.tsx; echo …
  $ npx vitest run tests/server/domain/superposicion.test.ts tests/server/api/superposicion.test.ts 2>&1 | tail -50
  $ npx vitest run tests/server/domain/superposicion.test.ts 2>&1 | grep -E "FAIL|Error:|Test Files|Tests "
  $ npx vitest run tests/server 2>&1 | grep -E "FAIL|AssertionError|Test Files|Tests |^\+ |^- "
  $ echo "== test"; npm test 2>&1 | tail -6; echo "exit=${PIPESTATUS[0]}"; echo "== lint"; npm run lint 2>&1 | tail -15; echo "exit=${PIPESTATUS…
  $ npm run lint >/dev/null 2>&1; echo "lint=$?"; npm run typecheck >/dev/null 2>&1; echo "typecheck=$?"; npm test >/dev/null 2>&1; echo "test=$…

**3.2** ¿Alguno no lo pediste vos? ¿Alguno te generó dudas al aprobarlo?

no

**3.3** Clasificá cada uno con el semáforo de la charla: verde (lectura), amarillo (validación local) o rojo (escritura o producción).

🟢 VERDE (LECTURA)

1. git ls-files server shared tests data specs package.json && cat package.json | grep -A12 '"scripts"'
Justificación: consulta archivos versionados y scripts del proyecto, sin modificarlos.

2. grep -n -i -E "superpon|409|ya no est|ocupad" -r specs/001-reservar-sesion client/src server tests 2>/dev/null; echo ---; sed -n 1,40p tests…
Justificación: busca términos y muestra contenido de archivos sin modificarlos.

3. grep -rn "ya está reservado" client server tests specs scripts 2>/dev/null; echo ---; sed -n '78,105p' client/src/pages/ReservaPage.tsx; echo …
Justificación: busca coincidencias y lee fragmentos del código.

🟡 AMARILLO (VALIDACIÓN LOCAL)

4. npx vitest run tests/server/domain/superposicion.test.ts tests/server/api/superposicion.test.ts 2>&1 | tail -50
Justificación: ejecuta pruebas locales y puede generar archivos temporales.

5. npx vitest run tests/server/domain/superposicion.test.ts 2>&1 | grep -E "FAIL|Error:|Test Files|Tests "
Justificación: ejecuta y valida una prueba específica.

6. npx vitest run tests/server 2>&1 | grep -E "FAIL|AssertionError|Test Files|Tests |^+ |^- "
Justificación: ejecuta las pruebas del servidor para comprobar su funcionamiento.

7. echo "== test"; npm test 2>&1 | tail -6; echo "exit=$"; echo "== lint"; npm run lint 2>&1 | tail -15; echo "exit=$

### 4. Errores y reintentos

**4.1** ¿Alguna herramienta falló (`PostToolUseFailure` o un `output` con error)?

no

**4.2** ¿Qué hizo el agente después?

solo hizo un resumen de todo lo modificado

## Parte B — Lo que pensás

### 5. Contexto

**5.1** Sumá aproximadamente el tamaño de las salidas: ¿qué herramienta "llenó" más la ventana?

Salida que volvió al modelo (caracteres, por herramienta):
     26213  Read
     12946  Bash

**5.2** ¿Había lecturas que se podían evitar? Por ejemplo: ¿leyó `data/sesiones.json` entero para entender el formato, en lugar de `shared/types.ts`?

_Sin responder._

### 6. Hooks como control

**6.1** ¿En qué evento lo pondrías?

_Sin responder._

**6.2** ¿Por qué tiene que ser un hook y no una instrucción en `AGENTS.md` o en la constitution?

_Sin responder._

### 7. Riesgos

_Sin responder._

## Para cerrar

**Modelo:** Opus 5.5

**Agente:** Claude Code
