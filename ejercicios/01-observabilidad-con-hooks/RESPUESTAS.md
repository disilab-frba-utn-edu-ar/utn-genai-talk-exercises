# Ejercicio 1 — Respuestas

**Nombre:** pipiyben
**Integrantes:** benjamin nicolas hambra, maria del pilar le gammari
**¿Intervinieron durante la tarea?** _Sin completar en Mi perfil._

## Parte A — Lo que pasó

### 1. El ciclo

**1.1** ¿Cuántas llamadas a herramientas hizo el agente en total?

9 llamadas 7 de terminal y 2 de apply_patch

**1.2** ¿Qué herramienta usó más?

Bash

### 2. Explorar antes de actuar

**2.1** ¿Cuántas herramientas usó **antes** de su primera edición de archivo?

una, bash

**2.2** ¿Qué archivos leyó?

.specify/memory/constitution.md;server/services/sesiones.ts

**2.3** ¿Leyó la constitution que menciona el prompt?

si. {"ts":"2026-10-31T17:36:29.363Z","agent":"codex","event":"PreToolUse","session":"01a19303-9391-7812-9270-d8bb64584a16","turn":"01a19308-9e29-7a92-afda-84533b2d8d46","model":"gpt-6.1-sol","toolUseId":"exec-8e015ad6-18ce-43af-9b4d-b6618c41044c","transcriptPath":"C:\\Users\\pilar\\.codex\\sessions\\2026\\10\\31\\rollout-2026-10-31T14-30-47-01a19303-9391-7812-9270-d8bb64584a16.jsonl","tool":"Bash","kind":"ejecutar","detail":"Get-Content .specify/memory/constitution.md; Get-Content specs/001-reservar-sesion/spec.md; Get-Content specs/001-reservar-sesion/plan.md; Get-Content specs/001-reservar-sesion/tasks.md; git status --","input":{"command":"Get-Content .specify/memory/constitution.md; Get-Content specs/001-reservar-sesion/spec.md; Get-Content specs/001-reservar-sesion/plan.md; Get-Content specs/001-reservar-sesion/tasks.md; git status --short; rg -n \"solap|overlap|reserv|disponib\" server tests/server shared"}}

### 3. Comandos de terminal

**3.1** Listá todos los comandos que ejecutó.

Get-Content .specify/memory/constitution.md; Get-Content server/services/sesiones.ts; Get-Content server/domain/horarios.ts; Get-Content tests/server/api/helpers.ts; Get-Content tests/server/api/sesiones.test.ts; git status --short

npm test -- tests/server/domain/superposicion.test.ts tests/server/api/superposicion.test.ts

npm test -- tests/server/domain/superposicion.test.ts tests/server/api/superposicion.test.ts tests/server/api/sesiones.test.ts

npm test

npm run typecheck

npm run lint

git diff --check; git diff --name-only -- data/; git status --short

**3.2** ¿Alguno no lo pediste vos? ¿Alguno te generó dudas al aprobarlo?

no

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

**Modelo:** gpt-6

**Agente:** codex
