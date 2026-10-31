# Ejercicio 1 — Respuestas

**Nombre:** LOS PELUCHES
**Integrantes:** Agustín Santiago Coda, Fernando Aquino Altamirano Jesús, Santiago Francisco Calizaya Mamani
**¿Intervinieron durante la tarea?** _Sin completar en Mi perfil._

## Parte A — Lo que pasó

### 1. El ciclo

**1.1** ¿Cuántas llamadas a herramientas hizo el agente en total?

22

**1.2** ¿Qué herramienta usó más?

Read

### 2. Explorar antes de actuar

**2.1** ¿Cuántas herramientas usó **antes** de su primera edición de archivo?

2

**2.2** ¿Qué archivos leyó?

1  .specify/memory/constitution.md
     1  server/services/sesiones.ts
     1  server/domain/horarios.ts
     1  server/domain/validaciones.ts
     1  server/routes/sesiones.ts
     1  tests/server/api/sesiones.test.ts
     1  tests/server/api/helpers.ts
     1  tests/server/domain/horarios.test.ts
     1  shared/types.ts
     1  client/src/pages/ReservaPage.tsx

**2.3** ¿Leyó la constitution que menciona el prompt?

Si
+  32s  leer               .specify/memory/constitution.md

### 3. Comandos de terminal

**3.1** Listá todos los comandos que ejecutó.

$ git status --short; git branch --show-current; ls server/domain server/services server/repositories server/routes tests/server/domain tests/…
  $ grep -rn "ya está reservado\|409" client/src specs tests/client server docs README.md 2>/dev/null; grep -n "ocupaRango" -r server tests; gre…
  $ npx vitest run tests/server/domain/superposicion.test.ts tests/server/api/superposicion.test.ts 2>&1 | tail -60
  $ npm test 2>&1 | tail -40
  $ npm test 2>&1 | tail -6; echo "--- lint"; npm run lint 2>&1 | tail -15; echo "lint exit: ${PIPESTATUS[0]}"; echo "--- typecheck"; npm run ty…

**3.2** ¿Alguno no lo pediste vos? ¿Alguno te generó dudas al aprobarlo?

No

**3.3** Clasificá cada uno con el semáforo de la charla: verde (lectura), amarillo (validación local) o rojo (escritura o producción).

VERDE $ git status --short; git branch --show-current; ls server/domain server/services server/repositories server/routes tests/server/domain tests/…
VERDE  $ grep -rn "ya está reservado\|409" client/src specs tests/client server docs README.md 2>/dev/null; grep -n "ocupaRango" -r server tests; gre…
ROJO  $ npx vitest run tests/server/domain/superposicion.test.ts tests/server/api/superposicion.test.ts 2>&1 | tail -60
AMARILLO  $ npm test 2>&1 | tail -40
AMARILLO  $ npm test 2>&1 | tail -6; echo "--- lint"; npm run lint 2>&1 | tail -15; echo "lint exit: ${PIPESTATUS[0]}"; echo "--- typecheck"; npm run ty…

### 4. Errores y reintentos

**4.1** ¿Alguna herramienta falló (`PostToolUseFailure` o un `output` con error)?

Si
 +  70s  ejecutar           npx vitest run tests/server/domain/superposicion.test.ts tests/server/…  → rojo: 1 falló · 2 pasaron · no compila y la regla no se cumple

**4.2** ¿Qué hizo el agente después?

+  74s  leer               client/src/pages/ReservaPage.tsx
       +  79s  escribir (crear)   server/domain/superposicion.ts
       +  85s  escribir (editar)  server/domain/horarios.ts
       +  86s  escribir (editar)  server/services/sesiones.ts
       +  86s  escribir (editar)  server/services/sesiones.ts
       +  86s  ejecutar           npm test 2>&1 | tail -40  → rojo: 1 falló · 388 pasaron · la regla no se cumple
       + 106s  escribir (editar)  tests/server/api/sesiones.test.ts
       + 107s  ejecutar           npm test 2>&1 | tail -6; echo "--- lint"; npm run lint 2>&1 | tail -15…  → verde: 389 pasaron

## Parte B — Lo que pensás

### 5. Contexto

**5.1** Sumá aproximadamente el tamaño de las salidas: ¿qué herramienta "llenó" más la ventana?

Read
Salida que volvió al modelo (caracteres, por herramienta):
     31676  Read

**5.2** ¿Había lecturas que se podían evitar? Por ejemplo: ¿leyó `data/sesiones.json` entero para entender el formato, en lugar de `shared/types.ts`?

si
       +  35s  leer               server/services/sesiones.ts
       +  35s  leer               server/domain/horarios.ts
       +  36s  leer               server/domain/validaciones.ts
       +  37s  leer               server/routes/sesiones.ts

### 6. Hooks como control

_Sin responder._

### 7. Riesgos

Si se usa un hook con intenciones maliciosas, puede llegar a leer informacion sensible y junto con eso, ejecutar acciones no deseadas o daninas

## Para cerrar

**Modelo:** Opus 5.5

**Agente:** Claude COde
