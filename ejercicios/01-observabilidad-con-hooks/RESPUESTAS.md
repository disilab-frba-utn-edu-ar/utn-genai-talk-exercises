# Ejercicio 1 — Respuestas

**Nombre:** Mathias Salva
**¿Intervinieron durante la tarea?** _Sin completar en Mi perfil._

## Parte A — Lo que pasó

### 1. El ciclo

**1.1** ¿Cuántas llamadas a herramientas hizo el agente en total?

5 Bash 
3 Edit 
2 Write


━━━ Sesión claude · b837bfe3-002c-4fbc-a842-41a2aa94eb84
Inicio: 10/31/2026, 12:53:57 PM  ·  Duración: 351 s
Turnos: 1  ·  Llamadas a herramientas: 10  ·  Eventos registrados: 24

Por tipo de acción:
     5  ejecutar
     5  escribir

Herramientas usadas:
     5  Bash
     3  Edit
     2  Write

Salida que volvió al modelo (caracteres, por herramienta):
     24010  Bash

Archivos escritos:
     2  server/services/sesiones.ts  [editar]
     1  tests/server/domain/superposicion.test.ts  [crear]
     1  tests/server/api/sesiones.test.ts  [editar]
     1  server/domain/superposicion.ts  [crear]

Comandos de terminal:
  $ ls server server/* tests/server/* && cat .specify/memory/constitution.md | head -80 && cat shared/types.ts
  $ cat server/services/sesiones.ts server/services/errores.ts server/routes/sesiones.ts server/domain/horarios.ts && cat tests/server/api/helpe…
  $ ls data && grep -o '"id": *"[a-z_]*"\|"duracionMinutos": *[0-9]*' data/tipos*.json; git diff --stat
  $ npx vitest run tests/server/domain/superposicion.test.ts tests/server/api/sesiones.test.ts 2>&1 | grep -E "✓|✗|×|FAIL|Tests|Test Files|Error…
  $ npm test 2>&1 | tail -15; echo "=== LINT ==="; npm run lint 2>&1 | tail -15; echo "=== TYPECHECK ==="; npm run typecheck 2>&1 | tail -10; gi…

Turnos:
  1. +12s  <pasted_content id="cf83"> Contexto: Mentorías a Voluntad es una app donde personas mentor…
       10 herramientas (ejecutar 5, escribir 5)
       +  15s  ejecutar           ls server server/* tests/server/* && cat .specify/memory/constitution.md | head -80 && cat shared/types.ts
       +  17s  ejecutar           cat server/services/sesiones.ts server/services/errores.ts server/routes/sesiones.ts server/domain/horarios.ts…
       +  24s  ejecutar           ls data && grep -o '"id": *"[a-z_]*"\|"duracionMinutos": *[0-9]*' data/tipos*.json; git diff --stat
       +  40s  escribir (crear)   tests/server/domain/superposicion.test.ts
       +  77s  escribir (editar)  tests/server/api/sesiones.test.ts
       +  77s  ejecutar           npx vitest run tests/server/domain/superposicion.test.ts tests/server/…  → rojo: 2 falló · 12 pasaron · no compila y la regla no se cumple
       +  97s  escribir (crear)   server/domain/superposicion.ts
       +  99s  escribir (editar)  server/services/sesiones.ts
       + 100s  escribir (editar)  server/services/sesiones.ts
       + 102s  ejecutar           npm test 2>&1 | tail -15; echo "=== LINT ==="; npm run lint 2>&1 | tai…  → verde: 388 pasaron
       ↳ Listo. Ahora `POST /api/sesiones` rechaza cualquier sesión que se superponga con otra confirmada de la misma mentora, no solo las que arrancan a la misma hora. …

(Hay 2 sesiones en el log. Usá --todas para verlas todas.)

**1.2** ¿Qué herramienta usó más?

Bash

**1.3** Agrupalas en las familias de la charla: búsqueda de código, control de versiones, validación local, navegador, servicios.

5 Ejecutar (Bash)
5 Escribir ( Edit y Write)

### 2. Explorar antes de actuar

**2.1** ¿Cuántas herramientas usó **antes** de su primera edición de archivo?

3 

Turnos:
  1. +12s  <pasted_content id="cf83"> Contexto: Mentorías a Voluntad es una app donde personas mentor…
       10 herramientas (ejecutar 5, escribir 5)
       +  15s  ejecutar           ls server server/* tests/server/* && cat .specify/memory/constitution.md | head -80 && cat shared/types.ts
       +  17s  ejecutar           cat server/services/sesiones.ts server/services/errores.ts server/routes/sesiones.ts server/domain/horarios.ts…
       +  24s  ejecutar           ls data && grep -o '"id": *"[a-z_]*"\|"duracionMinutos": *[0-9]*' data/tipos*.json; git diff --stat
       +  40s  escribir (crear)   tests/server/domain/superposicion.test.ts
       +  77s  escribir (editar)  tests/server/api/sesiones.test.ts
       +  77s  ejecutar           npx vitest run tests/server/domain/superposicion.test.ts tests/server/…  → rojo: 2 falló · 12 pasaron · no compila y la regla no se cumple
       +  97s  escribir (crear)   server/domain/superposicion.ts
       +  99s  escribir (editar)  server/services/sesiones.ts
       + 100s  escribir (editar)  server/services/sesiones.ts
       + 102s  ejecutar           npm test 2>&1 | tail -15; echo "=== LINT ==="; npm run lint 2>&1 | tai…  → verde: 388 pasaron
       ↳ Listo. Ahora `POST /api/sesiones` rechaza cualquier sesión que se superponga con otra confirmada de la misma mentora, no solo las que arrancan a la misma hora. …

**2.2** ¿Qué archivos leyó?

shared/types.ts /memory/constitution.md server/services/sesiones.ts server/services/errores.ts server/routes/sesiones.ts server/domain/horarios.ts

**2.3** ¿Leyó la constitution que menciona el prompt?

Si

### 3. Comandos de terminal

**3.1** Listá todos los comandos que ejecutó.

Comandos de terminal:
  $ ls server server/* tests/server/* && cat .specify/memory/constitution.md | head -80 && cat shared/types.ts
  $ cat server/services/sesiones.ts server/services/errores.ts server/routes/sesiones.ts server/domain/horarios.ts && cat tests/server/api/helpe…
  $ ls data && grep -o '"id": *"[a-z_]*"\|"duracionMinutos": *[0-9]*' data/tipos*.json; git diff --stat
  $ npx vitest run tests/server/domain/superposicion.test.ts tests/server/api/sesiones.test.ts 2>&1 | grep -E "✓|✗|×|FAIL|Tests|Test Files|Error…
  $ npm test 2>&1 | tail -15; echo "=== LINT ==="; npm run lint 2>&1 | tail -15; echo "=== TYPECHECK ==="; npm run typecheck 2>&1 | tail -10; gi…

**3.2** ¿Alguno no lo pediste vos? ¿Alguno te generó dudas al aprobarlo?

No, y no.

**3.3** Clasificá cada uno con el semáforo de la charla: verde (lectura), amarillo (validación local) o rojo (escritura o producción).

ls y cat (verde)
npm y npmx (amarillo)

### 4. Errores y reintentos

**4.1** ¿Alguna herramienta falló (`PostToolUseFailure` o un `output` con error)?

No

**4.2** ¿Qué hizo el agente después?

No fallo

## Parte B — Lo que pensás

### 5. Contexto

**5.1** Sumá aproximadamente el tamaño de las salidas: ¿qué herramienta "llenó" más la ventana?

Fueron 24010 caracteres de Bash

**5.2** ¿Había lecturas que se podían evitar? Por ejemplo: ¿leyó `data/sesiones.json` entero para entender el formato, en lugar de `shared/types.ts`?

No, leyo las primeras 80 lineas de head -80 && cat shared/types.ts

### 6. Hooks como control

**6.1** ¿En qué evento lo pondrías?

En PreToolUse para bloquear antes de hacer uso de cualquier herramienta.

**6.2** ¿Por qué tiene que ser un hook y no una instrucción en `AGENTS.md` o en la constitution?

Porque realizamos el bloqueo antes de que el agente empieze a utilizar herramientas que pueden dañar el sistema.

### 7. Riesgos

Por ejemplo, hacer cambios en repositorios remotos. Instalar librerias de codigo maliciosas.

## Para cerrar

**Modelo:** Opus 5.5

**Agente:** Claude code
