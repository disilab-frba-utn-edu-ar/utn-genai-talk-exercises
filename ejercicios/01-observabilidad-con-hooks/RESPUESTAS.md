# Ejercicio 1 — Respuestas

**Nombre:** _Sin completar en Mi perfil._
**¿Intervinieron durante la tarea?** _Sin completar en Mi perfil._

## Parte A — Lo que pasó

### 1. El ciclo

**1.1** ¿Cuántas llamadas a herramientas hizo el agente en total?

13

**1.2** ¿Qué herramienta usó más?

de bash/ejecutar

### 2. Explorar antes de actuar

**2.1** ¿Cuántas herramientas usó **antes** de su primera edición de archivo?

4

**2.2** ¿Qué archivos leyó?

server/domain/horarios.ts tests/server/domain/horarios.test.ts tests/server/api/sesiones.test.ts tests/server/api/helpers.ts

**2.3** ¿Leyó la constitution que menciona el prompt?

no, me equivoque de prompt y le mande el del video, igual hizo la tarea.

### 3. Comandos de terminal

**3.1** Listá todos los comandos que ejecutó.

$ ls server/domain tests/server/domain && grep -rn -i "solap\|overlap" server shared --include=*.ts | head -30
  $ cat server/domain/horarios.ts tests/server/domain/horarios.test.ts
  $ ls server/services server/repositories tests/server/api && cat server/services/*.ts server/domain/validaciones.ts server/domain/fechas.ts
  $ cat tests/server/api/sesiones.test.ts tests/server/api/helpers.ts && grep -n "tipo\|duracion\|disponibilidad" -i data/tipos*.json data/mento…
  $ npx vitest run tests/server 2>&1 | grep -E "✓|×|FAIL|Tests|expected|is not a function" | head -30
  $ npm test 2>&1 | grep -E "×|FAIL|Tests|Test Files" ; npm run lint 2>&1 | tail -5; npm run typecheck 2>&1 | tail -5
  $ git stash -q && npx vitest run tests/client/Navegacion.test.tsx 2>&1 | grep -E "Tests|AssertionError" | head -3; git stash pop -q && git sta…

**3.2** ¿Alguno no lo pediste vos? ¿Alguno te generó dudas al aprobarlo?

ninguno le pedi. hizo lo que debio con el prompt.

**3.3** Clasificá cada uno con el semáforo de la charla: verde (lectura), amarillo (validación local) o rojo (escritura o producción).

_Sin responder._

### 4. Errores y reintentos

**4.1** ¿Alguna herramienta falló (`PostToolUseFailure` o un `output` con error)?

no

**4.2** ¿Qué hizo el agente después?

nada

## Parte B — Lo que pensás

### 5. Contexto

**5.1** Sumá aproximadamente el tamaño de las salidas: ¿qué herramienta "llenó" más la ventana?

editar

**5.2** ¿Había lecturas que se podían evitar? Por ejemplo: ¿leyó `data/sesiones.json` entero para entender el formato, en lugar de `shared/types.ts`?

si, mucho estaba en el constitucion

### 6. Hooks como control

pre-commit

### 7. Riesgos

pushear keys, datos locales

## Para cerrar

**Modelo:** opus 5.5

**Agente:** claude
