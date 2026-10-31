# Ejercicio 1 — Respuestas

**Nombre:** _Sin completar en Mi perfil._
**¿Intervinieron durante la tarea?** _Sin completar en Mi perfil._

## Parte A — Lo que pasó

### 1. El ciclo

**1.1** ¿Cuántas llamadas a herramientas hizo el agente en total?

56

**1.2** ¿Qué herramienta usó más?

tun_comands

**1.3** Agrupalas en las familias de la charla: búsqueda de código, control de versiones, validación local, navegador, servicios.

run_commands
editor
read_files
search_codebase

### 2. Explorar antes de actuar

**2.1** ¿Cuántas herramientas usó **antes** de su primera edición de archivo?

1. +0s  (sin prompt registrado)
       56 herramientas (ejecutar 41, escribir 8, leer 6, buscar 1)
       +   0s  leer               .specify/memory/constitution.md · shared/types.ts
       +   0s  buscar             sesion · superposicion · confirmada · horaInicio · horaFin
       +   5s  leer               server/services/sesiones.ts · server/domain/horarios.ts · tests/server/api/sesiones.test.ts · tests/server/api…
       +   7s  leer               tests/server/domain/horarios.test.ts · server/domain/fechas.ts
       +   9s  ejecutar           ls server/domain tests/server/domain tests/server/api
       +  11s  ejecutar           Get-ChildItem server/domain; echo ---; Get-ChildItem tests/server/domain; echo ---; Get-ChildItem tests/server…
       +  13s  leer               package.json
       +  14s  leer               tests/server/hooks/log-hook.test.ts
       +  26s  ejecutar           npm test 2>&1 | tail -20
       +  29s  ejecutar           npm test 2>&1 | Out-String -Width 200 | Select-Object -Last 25
       +  46s  ejecutar           Get-Content vitest.config.* 2>$null; echo ===; Get-ChildItem -Name 'vitest*'
       +  48s  ejecutar           npx vitest run --project server 2>&1 | Out-String -Width 200 | Select-Object -Last 30
       +  59s  escribir (crear/reemplazar)

**2.2** ¿Qué archivos leyó?

Archivos leídos:
     1  .specify/memory/constitution.md
     1  shared/types.ts
     1  server/services/sesiones.ts
     1  server/domain/horarios.ts
     1  tests/server/api/sesiones.test.ts
     1  tests/server/api/helpers.ts
     1  tests/server/domain/horarios.test.ts
     1  server/domain/fechas.ts
     1  package.json
     1  tests/server/hooks/log-hook.test.ts
     1  tests/client/Navegacion.test.tsx

**2.3** ¿Leyó la constitution que menciona el prompt?

Si

### 3. Comandos de terminal

**3.1** Listá todos los comandos que ejecutó.

Comandos de terminal:
  $ ls server/domain tests/server/domain tests/server/api
  $ Get-ChildItem server/domain; echo ---; Get-ChildItem tests/server/domain; echo ---; Get-ChildItem tests/server/api
  $ npm test 2>&1 | tail -20
  $ npm test 2>&1 | Out-String -Width 200 | Select-Object -Last 25
  $ Get-Content vitest.config.* 2>$null; echo ===; Get-ChildItem -Name 'vitest*'
  $ npx vitest run --project server 2>&1 | Out-String -Width 200 | Select-Object -Last 30
  $ npx vitest run --project server tests/server/domain/superposicion.test.ts tests/server/api/superposicion.test.ts 2>&1 | Out-String -Width 20…
  $ npx vitest run tests/server/domain/superposicion.test.ts 2>&1 | Out-String -Width 200 | Select-Object -Last 30
  $ npx vitest run tests/server/domain/superposicion.test.ts > C:/tmp/out.txt 2>&1; echo exit=$?; Get-Content C:/tmp/out.txt | Select-Object -La…
  $ cd C: mp; npx vitest run tests/server/domain/superposicion.test.ts
  $ npx vitest run "tests/server/domain/superposicion.test.ts"
  $ npx vitest run "tests/server/api/superposicion.test.ts"
  $ npx vitest run "tests/server/domain/superposicion.test.ts" "tests/server/api/superposicion.test.ts" "tests/server/api/sesiones.test.ts"
  $ npm test
  $ git status --short; echo ---; git stash list
  $ Select-String -Path README.md -Pattern 'setup:inicio|setup:fin'
  $ npm run docs:setup; echo exit=$?
  $ git status --short
  $ npm test 2>&1 | Select-String -Pattern 'Test Files|Tests ' | Select-Object -Last 5
  $ npm test > C:/tmp/npmtest.txt 2>&1; echo exit=$?; Select-String -Path C:/tmp/npmtest.txt -Pattern 'Test Files|Tests ' | Select-Object -Last …
  $ Get-Content C:/tmp/npmtest.txt | Select-String -Pattern 'Test Files|Tests' | Select-Object -Last 10
  $ (Get-Item C:/tmp/npmtest.txt).Length; Get-Content C:/tmp/npmtest.txt | Select-Object -Last 5
  $ Select-String -Path C:/tmp/npmtest.txt -Pattern 'FAIL|failed|×' | Select-Object -First 20
  $ Get-Content C:/tmp/npmtest.txt
  $ Get-Content C:/tmp/npmtest.txt | Select-Object -Last 15
  $ cmd /c "npm test > C: mp t.txt 2>&1 & echo EXITCODE=%ERRORLEVEL% >> C: mp t.txt"; echo done
  $ cmd /c "npm test > C:/tmp/nt.txt 2>&1 & echo EXITCODE=%ERRORLEVEL% >> C:/tmp/nt.txt"; echo done
  $ Get-Content C:/tmp/nt.txt | Select-Object -Last 8
  $ git diff --stat README.md
  $ git diff README.md | Select-Object -First 20
  $ git checkout -- README.md; npx vitest run tests/client/Navegacion.test.tsx > C:/tmp/nav.txt 2>&1; echo exit=$?; Get-Content C:/tmp/nav.txt |…
  $ Get-Content C:/tmp/nav.txt | Select-Object -Last 8
  $ npm run docs:setup; git diff --stat README.md; echo ---; git diff --ignore-all-space README.md | Select-Object -First 5
  $ git show HEAD:README.md | file - 2>$null; (Get-Content README.md -Raw) -match "`r`n" ; echo 'CRLF present?'; (git show HEAD:README.md) -matc…
  $ $raw=Get-Content README.md -Raw; $raw.Contains("`r`n"); echo '---head---'; $head=git show HEAD:README.md; $head.Contains("`r`n")
  $ npm run docs:setup | Out-Null; $raw=Get-Content README.md -Raw; $raw.Contains("`r`n")
  $ npm run lint > C:/tmp/lint.txt 2>&1; echo exit=$?; Get-Content C:/tmp/lint.txt | Select-Object -Last 10
  $ npm run lint; $LASTEXITCODE
  $ npm run typecheck; $LASTEXITCODE
  $ git status --short
  $ Get-Content server/services/sesiones.ts

**3.2** ¿Alguno no lo pediste vos? ¿Alguno te generó dudas al aprobarlo?

no pedi explicitamente ninguno, no me pidio autorizacion

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

**6.1** ¿En qué evento lo pondrías?

_Sin responder._

**6.2** ¿Por qué tiene que ser un hook y no una instrucción en `AGENTS.md` o en la constitution?

_Sin responder._

### 7. Riesgos

_Sin responder._

## Para cerrar

**Modelo:** Beam 1.0

**Agente:** Cline
