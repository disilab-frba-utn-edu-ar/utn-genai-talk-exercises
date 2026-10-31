# Ejercicio 1 — Respuestas

**Nombre:** _Sin completar en Mi perfil._
**¿Intervinieron durante la tarea?** _Sin completar en Mi perfil._

## Parte A — Lo que pasó

### 1. El ciclo

**1.1** ¿Cuántas llamadas a herramientas hizo el agente en total?

10 llamadas a herramientas, todas en un único turno de unos 200 segundos: 5 Bash, 3 Edit y 2 Write.

**1.2** ¿Qué herramienta usó más?

Bash, con 5 de las 10 llamadas. Además, Bash fue la que más contexto devolvió al modelo: 37.180 caracteres.

**1.3** Agrupalas en las familias de la charla: búsqueda de código, control de versiones, validación local, navegador, servicios.

- Búsqueda de código: 3 (Bash con cat, ls, grep, sed y head para leer la constitution, services, domain, routes, tests y tipos).
- Validación local: 2 (npx vitest run con los tests nuevos en fase roja; npm test + npm run lint + npm run typecheck al final).
- Control de versiones: ninguna llamada dedicada; solo un "git status --short" de lectura dentro del último comando.
- Navegador: 0.
- Servicios: 0.
Las 5 restantes (2 Write y 3 Edit) son edición de archivos, que no entra en esas familias.

### 2. Explorar antes de actuar

**2.1** ¿Cuántas herramientas usó **antes** de su primera edición de archivo?

3, las tres Bash de lectura. La primera edición fue el Write de tests/server/domain/superposicion.test.ts, en la llamada 4.

**2.2** ¿Qué archivos leyó?

Todos desde la terminal (cat, sed, head, grep), por eso en "Archivos leídos" del resumen no aparece ninguno:
- .specify/memory/constitution.md
- server/services/*.ts, server/domain/*.ts y server/routes/*.ts (todos de una vez)
- tests/server/api/helpers.ts y tests/server/api/sesiones.test.ts
- package.json
- client/src/pages/ReservaPage.tsx (líneas 75 a 100, para ver cómo el cliente maneja el 409)
- tests/server/domain/horarios.test.ts (las primeras 20 líneas, para copiar el estilo de los tests)
- shared/types.ts (con grep, solo el tipo Sesion)
- data/tipos-asesoria.json (con grep, solo duracionMinutos e id; no lo leyó entero)
También buscó con grep "ya está reservado" y "409" en tests, client/src y specs.

**2.3** ¿Leyó la constitution que menciona el prompt?

Sí. Fue lo primero que hizo: el primer comando arranca con cat .specify/memory/constitution.md.

### 3. Comandos de terminal

**3.1** Listá todos los comandos que ejecutó.

1. cat .specify/memory/constitution.md && ls server server/* tests/server/* && cat server/services/*.ts server/domain/*.ts && cat server/routes/*.ts && cat tests/server/api/helpers.ts && ls tests/server/api && cat package.json
2. cat tests/server/api/sesiones.test.ts && grep -rn "ya está reservado\|409" tests client/src specs ... && grep -n "duracionMinutos\|\"id\"" data/tipos-asesoria.json
3. sed -n 75,100p client/src/pages/ReservaPage.tsx && head -20 tests/server/domain/horarios.test.ts && grep -n "export type Sesion" -A 14 shared/types.ts
4. npx vitest run tests/server/domain/superposicion.test.ts tests/server/api/sesiones.test.ts | grep ...
5. npm test | grep ... ; npm run lint | tail -8 ; npm run typecheck | tail -5 ; git status --short
(Todos empiezan con cd a la raíz del repo.)

**3.2** ¿Alguno no lo pediste vos? ¿Alguno te generó dudas al aprobarlo?

Yo pedí correr los tests en rojo y, al final, npm test y npm run lint. Por su cuenta agregó npm run typecheck, git status y los 3 comandos de exploración (cat, sed, grep). Ninguno me pareció peligroso. El que más miré fue npx vitest, porque npx puede bajar paquetes de internet si no están instalados; acá vitest ya estaba en el proyecto, así que no bajó nada. También noté que encadena muchos comandos con && en una sola llamada: aprobar una vez autoriza varios comandos juntos, y eso obliga a leer bien todo el comando.

**3.3** Clasificá cada uno con el semáforo de la charla: verde (lectura), amarillo (validación local) o rojo (escritura o producción).

1. Verde: lectura (cat, ls).
2. Verde: lectura (cat, grep).
3. Verde: lectura (sed, head, grep).
4. Amarillo: validación local (vitest).
5. Amarillo: validación local (test, lint, typecheck); el git status del final es verde.
Ningún comando de terminal fue rojo. Las escrituras (2 Write y 3 Edit) las hizo con las herramientas de edición, no por la terminal.

### 4. Errores y reintentos

**4.1** ¿Alguna herramienta falló (`PostToolUseFailure` o un `output` con error)?

No hubo ningún PostToolUseFailure. El único output con error fue a propósito: en la fase roja de TDD, vitest mostró 2 tests fallando ("409 si ya hay una sesión confirmada que empieza a la misma hora" y "409 si la nueva sesión se superpone parcialmente con una confirmada") y "Cannot find module '../../../server/domain/superposicion'", porque el módulo todavía no existía.

**4.2** ¿Qué hizo el agente después?

Siguió el ciclo TDD: creó server/domain/superposicion.ts con la función pura haySuperposicion, hizo 2 Edit en server/services/sesiones.ts para usarla y cambiar el mensaje del 409, y corrió npm test + lint + typecheck. Quedó todo verde (24 archivos y 389 tests), sin reintentos.
Un detalle: modificó un test existente (el expect del mensaje "El horario ya está reservado" pasó a "El horario se superpone con otra sesión de la mentora"). El prompt lo permitía solo si era imprescindible y pedía avisar: lo avisó y lo justificó en el mensaje final.

## Parte B — Lo que pensás

### 5. Contexto

**5.1** Sumá aproximadamente el tamaño de las salidas: ¿qué herramienta "llenó" más la ventana?

En total volvieron al modelo unos 59.000 caracteres:
- Bash: 37.180 (63%).
- Edit y Write: 22.194, porque el Edit devuelve un fragmento del archivo editado.
El que más llenó fue el primer comando Bash, con 26.238 caracteres: casi todo es la constitution entera (unos 25.000) más el cat de todos los services, domain y routes juntos.

**5.2** ¿Había lecturas que se podían evitar? Por ejemplo: ¿leyó `data/sesiones.json` entero para entender el formato, en lugar de `shared/types.ts`?

Sí. Alcanzaba con leer server/services/sesiones.ts y server/domain/fechas.ts, en lugar de hacer cat de todos los archivos de server/services, server/domain y server/routes. package.json tampoco hacía falta. De la constitution le servía solo la sección de la regla de superposición, no el documento entero.
Lo que hizo bien: no leyó data/sesiones.json para entender el formato. Usó grep sobre el tipo Sesion en shared/types.ts, y en data/tipos-asesoria.json solo buscó las líneas que necesitaba.

### 6. Hooks como control

**6.1** ¿En qué evento lo pondrías?

Propongo un hook que no deje modificar nada dentro de data/. Lo pondría en PreToolUse, con matcher "Write|Edit|Bash", para que corra antes de que se ejecute la herramienta:
- Para Write y Edit, mira tool_input.file_path; si cae dentro de data/, bloquea.
- Para Bash, busca escrituras sobre data/ (por ejemplo >, >>, sed -i, rm, mv o cp con destino en data/).
Para bloquear, sale con código 2 o devuelve permissionDecision "deny" con un motivo ("data/ no se modifica, usá npm run seed"). El modelo recibe ese motivo y puede corregir el rumbo.
No sirve en PostToolUse, porque ahí el archivo ya está modificado.

**6.2** ¿Por qué tiene que ser un hook y no una instrucción en `AGENTS.md` o en la constitution?

Porque el hook lo ejecuta el harness siempre y de forma determinística, sin depender del modelo. Una instrucción en AGENTS.md o en la constitution es solo texto en el contexto: el modelo puede ignorarla, perderla cuando se compacta una conversación larga, interpretarla mal o ser convencido de saltearla (por ejemplo, por un prompt injection en un archivo que lee). La instrucción pide; el hook garantiza. Además, el hook deja un rastro de cada vez que bloqueó algo.

### 7. Riesgos

- Scripts ejecutables: un hook corre código arbitrario con mis permisos, cada vez y sin preguntar. Un repo clonado puede traer hooks maliciosos; por eso Claude Code y Codex piden confiar en la carpeta antes de cargarlos.
- Acciones: un hook que modifica archivos, hace commits o despliega puede hacer daño real sin que nadie lo apruebe. Un hook de bloqueo mal escrito puede trabar al agente (falsos positivos) o dejar agujeros: si el matcher cubre Edit pero no Bash, el agente escribe igual con sed o >.
- Requests: un hook que llama a una API externa puede filtrar código, prompts o secretos, y si el servicio no responde, frena todo el ciclo.
- Logs: el log guarda prompts y salidas completas, que pueden incluir secretos (.env, tokens, datos personales). Hay que excluirlo de git (acá /logs/ está en .gitignore) y no compartirlo sin revisar. Además crece sin límite.
- Tiempo de procesamiento: cada llamada a una herramienta dispara al menos 2 procesos (PreToolUse y PostToolUse). Acá son procesos node con timeout de 10 s. Con hooks lentos, el agente se vuelve lento, y si un hook vence el timeout, ese evento no se registra.
- Recursos: procesos, disco y memoria por cada evento; dependencias del entorno (en Windows hace falta Git Bash, los permisos de ejecución cambian entre sistemas y la política de PowerShell puede bloquear scripts).
- Fallas silenciosas: si el hook se rompe, el agente sigue trabajando y no te enterás de que dejó de observar o de controlar.

## Para cerrar

**Modelo:** Opus

**Agente:** Claude
