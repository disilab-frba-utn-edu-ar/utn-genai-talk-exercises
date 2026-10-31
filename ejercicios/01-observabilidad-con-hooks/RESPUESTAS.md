# Ejercicio 1 — Respuestas

**Nombre:** _Sin completar en Mi perfil._
**¿Intervinieron durante la tarea?** _Sin completar en Mi perfil._

## Parte A — Lo que pasó

### 1. El ciclo

**1.1** ¿Cuántas llamadas a herramientas hizo el agente en total?

9

**1.2** ¿Qué herramienta usó más?

Bash

**1.3** Agrupalas en las familias de la charla: búsqueda de código, control de versiones, validación local, navegador, servicios.

Búsqueda de código, Validación local y control de versiones

### 2. Explorar antes de actuar

**2.1** ¿Cuántas herramientas usó **antes** de su primera edición de archivo?

2

**2.2** ¿Qué archivos leyó?

7

**2.3** ¿Leyó la constitution que menciona el prompt?

si

### 3. Comandos de terminal

**3.1** Listá todos los comandos que ejecutó.

$ cat .specify/memory/constitution.md && ls server server/* tests/server/* && cat server/services/*.ts server/domain/*.ts && cat shared/types.…
  $ cat tests/server/api/sesiones.test.ts && head -30 tests/server/domain/horarios.test.ts && cat data/tipos-asesoria.json 2>/dev/null | head -4…
  $ npx vitest run tests/server/domain/superposicion.test.ts tests/server/api/sesiones.test.ts 2>&1 | grep -vE "^\s*$" | tail -40
  $ npm test 2>&1 | tail -8; echo "=== LINT"; npm run lint 2>&1 | tail -8; echo "=== TYPECHECK"; npm run typecheck 2>&1 | tail -8; git status --…

**3.2** ¿Alguno no lo pediste vos? ¿Alguno te generó dudas al aprobarlo?

No pedi los de exploración (cat, ls, head), npm run typecheck y git status. Yo solo pedi solo npm test y lint.

**3.3** Clasificá cada uno con el semáforo de la charla: verde (lectura), amarillo (validación local) o rojo (escritura o producción).

Verde: comandos 1 y 2 (cat, ls, head) y git status
Amarillo: comando 3 (vitest) y npm test/lint/typecheck
Rojo: ningún comando de Bash. Las escrituras fueron los Write/Edit (locales, sin producción).

### 4. Errores y reintentos

**4.1** ¿Alguna herramienta falló (`PostToolUseFailure` o un `output` con error)?

En +484s el vitest dio rojo (2 fallaron, 12 pasaron), pero era el rojo buscado del TDD, no una falla de la herramienta. Después implementó (+492 a +496s) y en +498s dio verde, 385 pasaron

**4.2** ¿Qué hizo el agente después?

En +484s el vitest dio rojo (2 fallaron, 12 pasaron), pero era el rojo buscado del TDD, no una falla de la herramienta. Después implementó (+492 a +496s) y en +498s dio verde, 385 pasaron

## Parte B — Lo que pensás

### 5. Contexto

**5.1** Sumá aproximadamente el tamaño de las salidas: ¿qué herramienta "llenó" más la ventana?

Bash, 36.594 caracteres

**5.2** ¿Había lecturas que se podían evitar? Por ejemplo: ¿leyó `data/sesiones.json` entero para entender el formato, en lugar de `shared/types.ts`?

No leyó data/sesiones.json; leyó solo el principio de data/tipos-asesoria.json (con head).
Evitable: cat server/services/*.ts server/domain/*.ts trae todos los archivos de esas carpetas de una, cuando solo necesitaba el servicio de sesiones y fechas.
A su favor: recortó salidas con | tail -40 y | tail -8 para no llenar el contexto.

### 6. Hooks como control

**6.1** ¿En qué evento lo pondrías?

En PreToolUse, porque es el único que corre antes de ejecutar y puede frenar (en Claude Code, saliendo con código de error, por ejemplo exit 2). Por ejemplo, filtrás Edit|Write y bloqueás si la ruta empieza con data/.

**6.2** ¿Por qué tiene que ser un hook y no una instrucción en `AGENTS.md` o en la constitution?

Lo dice la pantalla 1 de la etapa 1: el hook es determinístico, corre siempre. AGENTS.md y la constitution son contexto: el modelo los puede respetar o no.

### 7. Riesgos

Ejecución de código: los hooks del repo corren scripts con tus permisos. Por eso Claude te pidió “confiar en la carpeta”.
Datos sensibles en logs: guardan prompts y salidas (36k caracteres); podrían terminar ahí claves o .env.
Requests: un hook podría mandar datos afuera.
Tiempo: 22 eventos = 22 veces que arranca node; suma latencia.
Recursos: los logs crecen; por eso existe logs:limpiar.
Hooks rotos: un hook que falla o se loopea (por ejemplo en Stop) puede trabar al agente.

## Para cerrar

**Modelo:** Opus 5.5

**Agente:** Claude Code
